-- Leaderboard function (security definer to read across users for aggregation)
CREATE OR REPLACE FUNCTION public.referral_leaderboard(_limit int DEFAULT 20)
RETURNS TABLE (
  user_id uuid,
  display_name text,
  level int,
  invited int,
  signed_up int,
  completed int,
  earned_cents int,
  tier text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH agg AS (
    SELECT
      r.referrer_id AS user_id,
      count(*)::int AS invited,
      count(*) FILTER (WHERE r.status IN ('signed_up','completed'))::int AS signed_up,
      count(*) FILTER (WHERE r.status = 'completed')::int AS completed
    FROM public.referrals r
    GROUP BY r.referrer_id
  ),
  earned AS (
    SELECT user_id, COALESCE(sum(amount_cents),0)::int AS earned_cents
    FROM public.referral_rewards
    WHERE type = 'gift_card'
    GROUP BY user_id
  )
  SELECT
    a.user_id,
    COALESCE(p.display_name, 'Concierge member') AS display_name,
    COALESCE(p.level, 1) AS level,
    a.invited,
    a.signed_up,
    a.completed,
    COALESCE(e.earned_cents, 0) AS earned_cents,
    CASE
      WHEN a.completed >= 25 THEN 'legend'
      WHEN a.completed >= 10 THEN 'super'
      WHEN a.completed >= 5  THEN 'rising'
      WHEN a.completed >= 1  THEN 'first'
      ELSE 'none'
    END AS tier
  FROM agg a
  LEFT JOIN public.profiles p ON p.id = a.user_id
  LEFT JOIN earned e ON e.user_id = a.user_id
  WHERE a.signed_up > 0
  ORDER BY a.completed DESC, a.signed_up DESC, a.invited DESC
  LIMIT GREATEST(_limit, 1);
$$;

REVOKE ALL ON FUNCTION public.referral_leaderboard(int) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.referral_leaderboard(int) TO anon, authenticated;

-- Seed referral achievements (idempotent)
INSERT INTO public.achievements (code, title, description, icon, xp_reward) VALUES
  ('referral_first',  'First Referral',    'Got your first friend onto Concierge.', 'sparkles', 100),
  ('referral_rising', 'Rising Connector',  '5 friends made a booking from your invite.', 'flame', 250),
  ('referral_super',  'Super Connector',   '10 friends booked thanks to you.', 'star', 500),
  ('referral_legend', 'Referral Legend',   '25 friends booked thanks to you.', 'crown', 1500)
ON CONFLICT (code) DO NOTHING;

-- Award referral achievements automatically when a referral completes
CREATE OR REPLACE FUNCTION public.grant_referral_achievements()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  done_count int;
  ach record;
  thresholds int[] := ARRAY[1,5,10,25];
  codes text[] := ARRAY['referral_first','referral_rising','referral_super','referral_legend'];
  i int;
BEGIN
  IF NEW.status <> 'completed' OR (OLD.status = 'completed') THEN RETURN NEW; END IF;
  SELECT count(*)::int INTO done_count FROM public.referrals
   WHERE referrer_id = NEW.referrer_id AND status = 'completed';

  FOR i IN 1..array_length(thresholds,1) LOOP
    IF done_count >= thresholds[i] THEN
      SELECT * INTO ach FROM public.achievements WHERE code = codes[i];
      IF FOUND THEN
        INSERT INTO public.user_achievements (user_id, achievement_id)
        VALUES (NEW.referrer_id, ach.id)
        ON CONFLICT DO NOTHING;
      END IF;
    END IF;
  END LOOP;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS referrals_grant_achievements ON public.referrals;
CREATE TRIGGER referrals_grant_achievements
AFTER UPDATE OF status ON public.referrals
FOR EACH ROW EXECUTE FUNCTION public.grant_referral_achievements();

-- Unique constraint on user_achievements to make ON CONFLICT safe
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'user_achievements_user_ach_uq') THEN
    ALTER TABLE public.user_achievements
      ADD CONSTRAINT user_achievements_user_ach_uq UNIQUE (user_id, achievement_id);
  END IF;
END $$;

-- Unique constraint on achievements.code (needed for ON CONFLICT above)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'achievements_code_uq') THEN
    ALTER TABLE public.achievements ADD CONSTRAINT achievements_code_uq UNIQUE (code);
  END IF;
END $$;