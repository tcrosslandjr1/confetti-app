-- Add XP rewards to referrer on referee signup and first booking completion

CREATE OR REPLACE FUNCTION public.handle_referral_on_booking()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  ref_row public.referrals%ROWTYPE;
  prior_count int;
  gift_code text;
BEGIN
  SELECT count(*) INTO prior_count FROM public.bookings WHERE user_id = NEW.user_id AND id <> NEW.id;
  IF prior_count > 0 THEN RETURN NEW; END IF;

  SELECT * INTO ref_row FROM public.referrals
   WHERE referee_id = NEW.user_id AND status = 'signed_up'
   ORDER BY created_at ASC LIMIT 1;
  IF NOT FOUND THEN RETURN NEW; END IF;

  UPDATE public.referrals SET status = 'completed', completed_at = now() WHERE id = ref_row.id;

  -- $25 gift card to referrer
  gift_code := 'GC-' || upper(substr(replace(gen_random_uuid()::text,'-',''),1,10));
  INSERT INTO public.referral_rewards (user_id, referral_id, type, amount_cents, status, redeem_code, issued_at)
  VALUES (ref_row.referrer_id, ref_row.id, 'gift_card', 2500, 'issued', gift_code, now());

  -- XP bonus to referrer for completed referral
  INSERT INTO public.referral_rewards (user_id, referral_id, type, amount_cents, status, issued_at)
  VALUES (ref_row.referrer_id, ref_row.id, 'xp_bonus', 250, 'issued', now());

  UPDATE public.profiles
     SET xp = xp + 250,
         level = GREATEST(1, ((xp + 250) / 500) + 1),
         updated_at = now()
   WHERE id = ref_row.referrer_id;

  -- Mark referee's first-booking discount as redeemed
  UPDATE public.referral_rewards
     SET status = 'redeemed', redeemed_at = now()
   WHERE user_id = NEW.user_id AND type = 'first_booking_discount' AND status IN ('pending','issued');

  RETURN NEW;
END $function$;

-- Award referrer XP when a referee completes signup
CREATE OR REPLACE FUNCTION public.handle_referral_on_signup()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.status = 'signed_up' AND (OLD.status IS DISTINCT FROM 'signed_up') THEN
    INSERT INTO public.referral_rewards (user_id, referral_id, type, amount_cents, status, issued_at)
    VALUES (NEW.referrer_id, NEW.id, 'xp_bonus', 50, 'issued', now());

    UPDATE public.profiles
       SET xp = xp + 50,
           level = GREATEST(1, ((xp + 50) / 500) + 1),
           updated_at = now()
     WHERE id = NEW.referrer_id;
  END IF;
  RETURN NEW;
END $function$;

DROP TRIGGER IF EXISTS referrals_signup_xp ON public.referrals;
CREATE TRIGGER referrals_signup_xp
AFTER UPDATE OF status ON public.referrals
FOR EACH ROW EXECUTE FUNCTION public.handle_referral_on_signup();