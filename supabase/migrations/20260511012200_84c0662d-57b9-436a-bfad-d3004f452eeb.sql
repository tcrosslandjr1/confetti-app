
-- Viral venues cache: top-trending venues by city, refreshed daily
CREATE TABLE public.viral_venues (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  city text NOT NULL,
  venue_name text NOT NULL,
  normalized_name text NOT NULL,
  google_place_id text,
  address text,
  neighborhood text,
  lat numeric,
  lng numeric,
  photo_url text,
  rating numeric,
  trend_score numeric NOT NULL DEFAULT 0,
  tags text[] NOT NULL DEFAULT '{}',
  mention_count integer NOT NULL DEFAULT 1,
  last_mentioned_at timestamptz NOT NULL DEFAULT now(),
  source_urls jsonb NOT NULL DEFAULT '[]'::jsonb,
  summary text,
  verified boolean NOT NULL DEFAULT false,
  discovered_at timestamptz NOT NULL DEFAULT now(),
  refreshed_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (city, normalized_name)
);

CREATE INDEX viral_venues_city_score_idx ON public.viral_venues (city, trend_score DESC);
CREATE INDEX viral_venues_tags_idx ON public.viral_venues USING GIN (tags);

ALTER TABLE public.viral_venues ENABLE ROW LEVEL SECURITY;

CREATE POLICY "viral_venues public read"
  ON public.viral_venues FOR SELECT
  USING (verified = true);

CREATE POLICY "viral_venues admin all"
  ON public.viral_venues FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Discovery run log
CREATE TABLE public.viral_discovery_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  city text,
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz,
  queries_run integer NOT NULL DEFAULT 0,
  candidates_found integer NOT NULL DEFAULT 0,
  venues_upserted integer NOT NULL DEFAULT 0,
  duration_ms integer,
  error text
);

CREATE INDEX viral_discovery_runs_started_idx ON public.viral_discovery_runs (started_at DESC);

ALTER TABLE public.viral_discovery_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "viral_discovery_runs admin read"
  ON public.viral_discovery_runs FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));
