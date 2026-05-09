
-- Referral codes: one per user, auto-generated
CREATE TABLE public.referral_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  code text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_referral_codes_code ON public.referral_codes(code);

ALTER TABLE public.referral_codes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own code read" ON public.referral_codes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "public code lookup" ON public.referral_codes FOR SELECT USING (true);
CREATE POLICY "own code insert" ON public.referral_codes FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Referrals: tracks invitations + their state
CREATE TABLE public.referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id uuid NOT NULL,
  referee_id uuid,
  referee_email text,
  code text NOT NULL,
  status text NOT NULL DEFAULT 'pending', -- pending | signed_up | completed
  channel text NOT NULL DEFAULT 'link',   -- link | email
  created_at timestamptz NOT NULL DEFAULT now(),
  signed_up_at timestamptz,
  completed_at timestamptz
);
CREATE INDEX idx_referrals_referrer ON public.referrals(referrer_id);
CREATE INDEX idx_referrals_referee ON public.referrals(referee_id);
CREATE INDEX idx_referrals_email ON public.referrals(referee_email);

ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own referrals read" ON public.referrals
  FOR SELECT USING (auth.uid() = referrer_id OR auth.uid() = referee_id);
CREATE POLICY "own referrals insert" ON public.referrals
  FOR INSERT WITH CHECK (auth.uid() = referrer_id);
CREATE POLICY "own referrals update" ON public.referrals
  FOR UPDATE USING (auth.uid() = referrer_id OR auth.uid() = referee_id);

-- Rewards earned by users
CREATE TABLE public.referral_rewards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  referral_id uuid REFERENCES public.referrals(id) ON DELETE SET NULL,
  type text NOT NULL,            -- gift_card | first_booking_discount
  amount_cents integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending', -- pending | issued | redeemed
  redeem_code text,
  created_at timestamptz NOT NULL DEFAULT now(),
  issued_at timestamptz,
  redeemed_at timestamptz
);
CREATE INDEX idx_rewards_user ON public.referral_rewards(user_id);

ALTER TABLE public.referral_rewards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own rewards read" ON public.referral_rewards FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "admins manage rewards" ON public.referral_rewards FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Generate a short, friendly code (8 chars, no ambiguous letters)
CREATE OR REPLACE FUNCTION public.gen_referral_code()
RETURNS text LANGUAGE plpgsql AS $$
DECLARE
  alphabet text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  result text := '';
  i int;
BEGIN
  FOR i IN 1..8 LOOP
    result := result || substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1);
  END LOOP;
  RETURN result;
END $$;

-- Auto-create a referral code on profile creation
CREATE OR REPLACE FUNCTION public.handle_new_profile_referral()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  new_code text;
  attempts int := 0;
BEGIN
  LOOP
    new_code := public.gen_referral_code();
    BEGIN
      INSERT INTO public.referral_codes (user_id, code) VALUES (NEW.id, new_code);
      EXIT;
    EXCEPTION WHEN unique_violation THEN
      attempts := attempts + 1;
      IF attempts > 5 THEN EXIT; END IF;
    END;
  END LOOP;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS profiles_referral_code ON public.profiles;
CREATE TRIGGER profiles_referral_code
AFTER INSERT ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.handle_new_profile_referral();

-- Backfill codes for existing profiles
INSERT INTO public.referral_codes (user_id, code)
SELECT p.id, public.gen_referral_code()
FROM public.profiles p
LEFT JOIN public.referral_codes rc ON rc.user_id = p.id
WHERE rc.id IS NULL;

-- On first booking, complete pending referral + issue rewards
CREATE OR REPLACE FUNCTION public.handle_referral_on_booking()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  ref_row public.referrals%ROWTYPE;
  prior_count int;
  gift_code text;
BEGIN
  -- Only act on the user's first booking
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

  -- Mark referee's first-booking discount as redeemed (already applied to this booking)
  UPDATE public.referral_rewards
     SET status = 'redeemed', redeemed_at = now()
   WHERE user_id = NEW.user_id AND type = 'first_booking_discount' AND status IN ('pending','issued');

  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS bookings_referral_complete ON public.bookings;
CREATE TRIGGER bookings_referral_complete
AFTER INSERT ON public.bookings
FOR EACH ROW EXECUTE FUNCTION public.handle_referral_on_booking();
