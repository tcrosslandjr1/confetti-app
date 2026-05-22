
CREATE TABLE IF NOT EXISTS public.venue_suggestions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id uuid NOT NULL REFERENCES public.venues(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('event','experience','promo')),
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','pending_review','active','expired','archived')),
  title text NOT NULL,
  subtitle text,
  description text NOT NULL DEFAULT '',
  image_url text,
  tags text[] NOT NULL DEFAULT '{}',
  starts_at timestamptz,
  ends_at timestamptz,
  recurring boolean NOT NULL DEFAULT false,
  recurrence_rule text,
  timezone text NOT NULL DEFAULT 'America/New_York',
  original_price numeric,
  offer_price numeric,
  discount_pct numeric,
  promo_code text,
  redemption_url text,
  capacity integer,
  rsvp_count integer NOT NULL DEFAULT 0,
  target_moods text[] NOT NULL DEFAULT '{}',
  target_audience text[] NOT NULL DEFAULT '{}',
  boost_level smallint NOT NULL DEFAULT 0 CHECK (boost_level IN (0,1,2)),
  created_by uuid,
  approved_by uuid,
  approved_at timestamptz,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_venue_suggestions_venue ON public.venue_suggestions(venue_id);
CREATE INDEX IF NOT EXISTS idx_venue_suggestions_status ON public.venue_suggestions(status);
CREATE INDEX IF NOT EXISTS idx_venue_suggestions_type ON public.venue_suggestions(type);
CREATE INDEX IF NOT EXISTS idx_venue_suggestions_starts ON public.venue_suggestions(starts_at);

ALTER TABLE public.venue_suggestions ENABLE ROW LEVEL SECURITY;

-- Anyone can read active suggestions
CREATE POLICY "Active suggestions are public"
ON public.venue_suggestions FOR SELECT
USING (status = 'active');

-- Venue owners can read all their suggestions
CREATE POLICY "Venue owners read own suggestions"
ON public.venue_suggestions FOR SELECT
TO authenticated
USING (EXISTS (SELECT 1 FROM public.venues v WHERE v.id = venue_id AND v.claimed_by = auth.uid()));

-- Venue owners can insert/update/delete their own
CREATE POLICY "Venue owners insert own suggestions"
ON public.venue_suggestions FOR INSERT
TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM public.venues v WHERE v.id = venue_id AND v.claimed_by = auth.uid()));

CREATE POLICY "Venue owners update own suggestions"
ON public.venue_suggestions FOR UPDATE
TO authenticated
USING (EXISTS (SELECT 1 FROM public.venues v WHERE v.id = venue_id AND v.claimed_by = auth.uid()));

CREATE POLICY "Venue owners delete own suggestions"
ON public.venue_suggestions FOR DELETE
TO authenticated
USING (EXISTS (SELECT 1 FROM public.venues v WHERE v.id = venue_id AND v.claimed_by = auth.uid()));

-- Admins can do anything
CREATE POLICY "Admins manage suggestions"
ON public.venue_suggestions FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.touch_venue_suggestions_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

DROP TRIGGER IF EXISTS trg_venue_suggestions_updated ON public.venue_suggestions;
CREATE TRIGGER trg_venue_suggestions_updated
BEFORE UPDATE ON public.venue_suggestions
FOR EACH ROW EXECUTE FUNCTION public.touch_venue_suggestions_updated_at();

-- Tonight feed view (joined with venue info)
CREATE OR REPLACE VIEW public.tonight_suggestions
WITH (security_invoker = true)
AS
SELECT
  s.*,
  v.name           AS venue_name,
  v.city           AS venue_city,
  v.neighborhood   AS venue_neighborhood,
  v.category       AS venue_category,
  COALESCE(v.hero_image_url, v.image_url) AS venue_image,
  COALESCE(v.rating, 0) AS venue_rating,
  COALESCE(v.price_level, 2) AS venue_price_level
FROM public.venue_suggestions s
JOIN public.venues v ON v.id = s.venue_id
WHERE s.status = 'active'
  AND (s.ends_at IS NULL OR s.ends_at > now());
