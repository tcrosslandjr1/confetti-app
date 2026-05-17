
-- Boost expiry/tier columns on venues/events/reels
ALTER TABLE public.venues
  ADD COLUMN IF NOT EXISTS boost_until timestamptz,
  ADD COLUMN IF NOT EXISTS boost_tier text,
  ADD COLUMN IF NOT EXISTS boost_sku text;

ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS boost_until timestamptz,
  ADD COLUMN IF NOT EXISTS boost_tier text,
  ADD COLUMN IF NOT EXISTS boost_sku text;

ALTER TABLE public.reels
  ADD COLUMN IF NOT EXISTS boost_until timestamptz,
  ADD COLUMN IF NOT EXISTS boost_tier text,
  ADD COLUMN IF NOT EXISTS boost_sku text;

CREATE INDEX IF NOT EXISTS idx_venues_boost_until ON public.venues(boost_until) WHERE boost_until IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_events_boost_until ON public.events(boost_until) WHERE boost_until IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_reels_boost_until ON public.reels(boost_until) WHERE boost_until IS NOT NULL;

-- business_purchases ledger
CREATE TABLE IF NOT EXISTS public.business_purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sku text NOT NULL,
  mode text NOT NULL CHECK (mode IN ('one_time','recurring')),
  amount_cents integer NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'usd',
  target_type text CHECK (target_type IN ('venue','event','reel','vendor')),
  target_id uuid,
  activated_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz,
  status text NOT NULL DEFAULT 'active',
  stripe_session_id text UNIQUE,
  stripe_subscription_id text,
  stripe_customer_id text,
  environment text NOT NULL DEFAULT 'sandbox',
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_business_purchases_user ON public.business_purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_business_purchases_target ON public.business_purchases(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_business_purchases_active ON public.business_purchases(status, expires_at) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_business_purchases_subscription ON public.business_purchases(stripe_subscription_id);

ALTER TABLE public.business_purchases ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view own business purchases" ON public.business_purchases;
CREATE POLICY "Users view own business purchases"
  ON public.business_purchases FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role manages business purchases" ON public.business_purchases;
CREATE POLICY "Service role manages business purchases"
  ON public.business_purchases FOR ALL
  USING (auth.role() = 'service_role');

DROP TRIGGER IF EXISTS trg_business_purchases_updated_at ON public.business_purchases;
CREATE TRIGGER trg_business_purchases_updated_at
  BEFORE UPDATE ON public.business_purchases
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- activate_boost: idempotently sets boost_until/tier on the target entity
CREATE OR REPLACE FUNCTION public.activate_boost(
  _target_type text,
  _target_id uuid,
  _duration interval,
  _tier text,
  _sku text
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_until timestamptz := now() + _duration;
BEGIN
  IF _target_type = 'venue' THEN
    UPDATE public.venues
       SET boost_until = GREATEST(COALESCE(boost_until, now()), new_until),
           boost_tier = _tier,
           boost_sku = _sku,
           updated_at = now()
     WHERE id = _target_id;
  ELSIF _target_type = 'event' THEN
    UPDATE public.events
       SET boost_until = GREATEST(COALESCE(boost_until, now()), new_until),
           boost_tier = _tier,
           boost_sku = _sku,
           updated_at = now()
     WHERE id = _target_id;
  ELSIF _target_type = 'reel' THEN
    UPDATE public.reels
       SET boost_until = GREATEST(COALESCE(boost_until, now()), new_until),
           boost_tier = _tier,
           boost_sku = _sku,
           updated_at = now()
     WHERE id = _target_id;
  END IF;
END $$;
