
-- ===== v7: Personalization (extend existing user_preferences) =====
ALTER TABLE public.user_preferences
  ADD COLUMN IF NOT EXISTS preferred_vibes TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS preferred_categories TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS disliked_categories TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS preferred_price_tier INT,
  ADD COLUMN IF NOT EXISTS preferred_time_slots TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS preferred_neighborhoods TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS preferred_business_types TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS disliked_business_types TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS favorite_city_features TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS risk_tolerance TEXT NOT NULL DEFAULT 'medium',
  ADD COLUMN IF NOT EXISTS nightlife_intensity TEXT NOT NULL DEFAULT 'medium',
  ADD COLUMN IF NOT EXISTS comfort_level TEXT NOT NULL DEFAULT 'medium',
  ADD COLUMN IF NOT EXISTS promo_sensitivity TEXT NOT NULL DEFAULT 'medium',
  ADD COLUMN IF NOT EXISTS personalized_name_style TEXT NOT NULL DEFAULT 'playful',
  ADD COLUMN IF NOT EXISTS adult_opt_in BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS manual_overrides JSONB NOT NULL DEFAULT '{}'::jsonb;

CREATE TABLE IF NOT EXISTS public.user_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  signal_type TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  city TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS user_signals_user_idx ON public.user_signals(user_id, created_at DESC);
ALTER TABLE public.user_signals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "own signals read" ON public.user_signals;
DROP POLICY IF EXISTS "own signals insert" ON public.user_signals;
DROP POLICY IF EXISTS "own signals delete" ON public.user_signals;
CREATE POLICY "own signals read" ON public.user_signals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own signals insert" ON public.user_signals FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own signals delete" ON public.user_signals FOR DELETE USING (auth.uid() = user_id);

-- ===== v8: Trips =====
CREATE TABLE IF NOT EXISTS public.trips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  destination_city TEXT NOT NULL,
  trip_name TEXT NOT NULL,
  trip_name_options JSONB NOT NULL DEFAULT '[]'::jsonb,
  trip_length_days INT NOT NULL,
  group_size INT NOT NULL DEFAULT 2,
  group_type TEXT,
  energy_curve TEXT NOT NULL DEFAULT 'steady-chill',
  budget_total NUMERIC,
  budget_per_day NUMERIC,
  arrival_time TIMESTAMPTZ,
  departure_time TIMESTAMPTZ,
  home_base_area TEXT,
  must_do_categories TEXT[] NOT NULL DEFAULT '{}',
  avoid_categories TEXT[] NOT NULL DEFAULT '{}',
  transportation_mode TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "own trips read" ON public.trips;
DROP POLICY IF EXISTS "own trips insert" ON public.trips;
DROP POLICY IF EXISTS "own trips update" ON public.trips;
DROP POLICY IF EXISTS "own trips delete" ON public.trips;
CREATE POLICY "own trips read" ON public.trips FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own trips insert" ON public.trips FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own trips update" ON public.trips FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "own trips delete" ON public.trips FOR DELETE USING (auth.uid() = user_id);
DROP TRIGGER IF EXISTS trips_touch ON public.trips;
CREATE TRIGGER trips_touch BEFORE UPDATE ON public.trips FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.trip_days (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  day_index INT NOT NULL,
  day_theme TEXT,
  day_name TEXT,
  itinerary JSONB,
  estimated_cost NUMERIC,
  rest_blocks JSONB NOT NULL DEFAULT '[]'::jsonb,
  weather_fallback TEXT,
  transportation_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(trip_id, day_index)
);
CREATE INDEX IF NOT EXISTS trip_days_trip_idx ON public.trip_days(trip_id, day_index);
ALTER TABLE public.trip_days ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "own trip days read" ON public.trip_days;
DROP POLICY IF EXISTS "own trip days insert" ON public.trip_days;
DROP POLICY IF EXISTS "own trip days update" ON public.trip_days;
DROP POLICY IF EXISTS "own trip days delete" ON public.trip_days;
CREATE POLICY "own trip days read" ON public.trip_days FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.trips t WHERE t.id = trip_id AND t.user_id = auth.uid())
);
CREATE POLICY "own trip days insert" ON public.trip_days FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.trips t WHERE t.id = trip_id AND t.user_id = auth.uid())
);
CREATE POLICY "own trip days update" ON public.trip_days FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.trips t WHERE t.id = trip_id AND t.user_id = auth.uid())
);
CREATE POLICY "own trip days delete" ON public.trip_days FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.trips t WHERE t.id = trip_id AND t.user_id = auth.uid())
);

-- ===== v9: Organic Promo =====
CREATE TABLE IF NOT EXISTS public.partner_deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id UUID,
  venue_name TEXT,
  city TEXT,
  deal_type TEXT NOT NULL DEFAULT 'save',
  title TEXT NOT NULL,
  description TEXT,
  vibe_tags TEXT[] NOT NULL DEFAULT '{}',
  category_tags TEXT[] NOT NULL DEFAULT '{}',
  group_size_min INT DEFAULT 1,
  group_size_max INT DEFAULT 50,
  budget_tier_min INT DEFAULT 1,
  budget_tier_max INT DEFAULT 4,
  adult_only BOOLEAN NOT NULL DEFAULT false,
  family_safe BOOLEAN NOT NULL DEFAULT true,
  valid_from TIMESTAMPTZ,
  valid_until TIMESTAMPTZ,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS partner_deals_city_idx ON public.partner_deals(city, active);
ALTER TABLE public.partner_deals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public read active deals" ON public.partner_deals;
DROP POLICY IF EXISTS "admin manage deals" ON public.partner_deals;
CREATE POLICY "public read active deals" ON public.partner_deals FOR SELECT USING (active = true);
CREATE POLICY "admin manage deals" ON public.partner_deals FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
DROP TRIGGER IF EXISTS partner_deals_touch ON public.partner_deals;
CREATE TRIGGER partner_deals_touch BEFORE UPDATE ON public.partner_deals FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
