-- Confetti blueprint schema: add missing `events` and `reels` tables.
-- profiles (users), venues, itineraries (plans), corporate_events, corporate_attendees already exist.

-- =========================================================================
-- EVENTS: city events / happenings surfaced in discovery + plans
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  city text NOT NULL,
  title text NOT NULL,
  description text,
  category text,
  venue_id uuid,
  venue_name text,
  address text,
  neighborhood text,
  lat double precision,
  lng double precision,
  starts_at timestamptz NOT NULL,
  ends_at timestamptz,
  price_cents integer,
  ticket_url text,
  image_url text,
  source text NOT NULL DEFAULT 'manual',
  source_ref text,
  tags text[] NOT NULL DEFAULT '{}',
  boost_weight numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'published',
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS events_city_starts_idx ON public.events (lower(city), starts_at);
CREATE INDEX IF NOT EXISTS events_venue_idx ON public.events (venue_id);
CREATE INDEX IF NOT EXISTS events_status_idx ON public.events (status);

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "events public read"
  ON public.events FOR SELECT
  USING (status = 'published');

CREATE POLICY "events admin all"
  ON public.events FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "events advertiser manage own venue"
  ON public.events FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.venues v
      JOIN public.advertisers a ON a.id = v.advertiser_id
      WHERE v.id = events.venue_id AND a.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.venues v
      JOIN public.advertisers a ON a.id = v.advertiser_id
      WHERE v.id = events.venue_id AND a.owner_id = auth.uid()
    )
  );

CREATE TRIGGER events_touch_updated_at
  BEFORE UPDATE ON public.events
  FOR EACH ROW EXECUTE FUNCTION public.touch_itineraries_updated_at();

-- =========================================================================
-- REELS: short-form content tied to venues / creators
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.reels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id uuid,
  promoter_id uuid,
  venue_id uuid,
  city text,
  title text,
  caption text,
  video_url text NOT NULL,
  thumbnail_url text,
  duration_seconds integer,
  source text NOT NULL DEFAULT 'upload', -- upload | tiktok | instagram | youtube
  source_url text,
  tags text[] NOT NULL DEFAULT '{}',
  view_count integer NOT NULL DEFAULT 0,
  like_count integer NOT NULL DEFAULT 0,
  share_count integer NOT NULL DEFAULT 0,
  trending_score numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'published', -- draft | published | removed
  featured boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS reels_city_trending_idx ON public.reels (lower(city), trending_score DESC);
CREATE INDEX IF NOT EXISTS reels_venue_idx ON public.reels (venue_id);
CREATE INDEX IF NOT EXISTS reels_author_idx ON public.reels (author_id);
CREATE INDEX IF NOT EXISTS reels_status_idx ON public.reels (status);

ALTER TABLE public.reels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "reels public read"
  ON public.reels FOR SELECT
  USING (status = 'published');

CREATE POLICY "reels author insert"
  ON public.reels FOR INSERT
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "reels author update"
  ON public.reels FOR UPDATE
  USING (auth.uid() = author_id OR public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (auth.uid() = author_id OR public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "reels author or admin delete"
  ON public.reels FOR DELETE
  USING (auth.uid() = author_id OR public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER reels_touch_updated_at
  BEFORE UPDATE ON public.reels
  FOR EACH ROW EXECUTE FUNCTION public.touch_itineraries_updated_at();

-- =========================================================================
-- REEL ENGAGEMENT: per-user like/view signal feeding RankingAgent
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.reel_engagements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reel_id uuid NOT NULL REFERENCES public.reels(id) ON DELETE CASCADE,
  user_id uuid,
  session_id text,
  kind text NOT NULL, -- view | like | share | save | click
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS reel_engagements_reel_kind_idx ON public.reel_engagements (reel_id, kind);
CREATE INDEX IF NOT EXISTS reel_engagements_user_idx ON public.reel_engagements (user_id);

ALTER TABLE public.reel_engagements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "reel_engagements anyone insert"
  ON public.reel_engagements FOR INSERT
  WITH CHECK (kind IN ('view','like','share','save','click'));

CREATE POLICY "reel_engagements admin read"
  ON public.reel_engagements FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'::app_role) OR auth.uid() = user_id);
