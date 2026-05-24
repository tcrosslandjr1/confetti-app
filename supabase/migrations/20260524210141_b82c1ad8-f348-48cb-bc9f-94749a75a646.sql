
-- venues: tier + method
ALTER TABLE public.venues
  ADD COLUMN IF NOT EXISTS verification_tier text NOT NULL DEFAULT 'none'
    CHECK (verification_tier IN ('none','verified','premium_verified')),
  ADD COLUMN IF NOT EXISTS verification_method text
    CHECK (verification_method IS NULL OR verification_method IN ('email_code','phone_code','document')),
  ADD COLUMN IF NOT EXISTS verified_at timestamptz;

-- one-time codes for self-serve email/phone verification
CREATE TABLE IF NOT EXISTS public.verification_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  venue_id uuid NOT NULL,
  channel text NOT NULL CHECK (channel IN ('email','phone')),
  destination text NOT NULL,
  code text NOT NULL,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '10 minutes'),
  consumed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_verification_codes_user ON public.verification_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_verification_codes_venue ON public.verification_codes(venue_id);
ALTER TABLE public.verification_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own codes read" ON public.verification_codes
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own codes insert" ON public.verification_codes
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own codes update" ON public.verification_codes
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- boost packages catalog
CREATE TABLE IF NOT EXISTS public.boost_packages (
  id text PRIMARY KEY,
  name text NOT NULL,
  description text,
  tier text NOT NULL CHECK (tier IN ('starter','featured','spotlight')),
  duration_hours int NOT NULL CHECK (duration_hours > 0),
  price_cents int NOT NULL CHECK (price_cents >= 0),
  currency text NOT NULL DEFAULT 'usd',
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.boost_packages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "boost packages public read" ON public.boost_packages FOR SELECT USING (active = true);
CREATE POLICY "boost packages admin all" ON public.boost_packages
  FOR ALL USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));

INSERT INTO public.boost_packages (id, name, description, tier, duration_hours, price_cents) VALUES
  ('pulse_24h',     '24h Pulse',          'Top of discovery for one day.',                  'starter',   24,  2500),
  ('weekend_spot',  'Weekend Spotlight',  'Fri 6pm – Mon 6am featured placement.',          'featured',  60,  7500),
  ('week_headline', 'Week Headline',      'Seven full days at top of AI-suggested plans.',  'spotlight', 168, 20000)
ON CONFLICT (id) DO NOTHING;

-- purchases log (one row per paid boost window)
CREATE TABLE IF NOT EXISTS public.boost_purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  advertiser_id uuid REFERENCES public.advertisers(id) ON DELETE CASCADE,
  venue_id uuid NOT NULL REFERENCES public.venues(id) ON DELETE CASCADE,
  package_id text NOT NULL REFERENCES public.boost_packages(id),
  amount_cents int NOT NULL,
  currency text NOT NULL DEFAULT 'usd',
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','paid','active','expired','cancelled')),
  starts_at timestamptz,
  ends_at timestamptz,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_boost_purchases_venue ON public.boost_purchases(venue_id);
CREATE INDEX IF NOT EXISTS idx_boost_purchases_advertiser ON public.boost_purchases(advertiser_id);
ALTER TABLE public.boost_purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "boost purchases owner read" ON public.boost_purchases
  FOR SELECT USING (
    has_role(auth.uid(),'admin')
    OR EXISTS (SELECT 1 FROM public.advertisers a
               WHERE a.id = boost_purchases.advertiser_id AND a.owner_id = auth.uid())
  );
CREATE POLICY "boost purchases owner insert" ON public.boost_purchases
  FOR INSERT WITH CHECK (
    auth.uid() = created_by AND (
      has_role(auth.uid(),'admin')
      OR EXISTS (SELECT 1 FROM public.advertisers a
                 WHERE a.id = boost_purchases.advertiser_id AND a.owner_id = auth.uid())
    )
  );
CREATE POLICY "boost purchases owner update" ON public.boost_purchases
  FOR UPDATE USING (
    has_role(auth.uid(),'admin')
    OR EXISTS (SELECT 1 FROM public.advertisers a
               WHERE a.id = boost_purchases.advertiser_id AND a.owner_id = auth.uid())
  );

CREATE TRIGGER boost_purchases_touch BEFORE UPDATE ON public.boost_purchases
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER boost_packages_touch BEFORE UPDATE ON public.boost_packages
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
