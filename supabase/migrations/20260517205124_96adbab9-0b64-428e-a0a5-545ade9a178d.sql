ALTER TABLE public.venues
  ADD COLUMN IF NOT EXISTS trending_score numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS trending_refreshed_at timestamptz;

CREATE INDEX IF NOT EXISTS venues_trending_idx
  ON public.venues (lower(city), trending_score DESC);