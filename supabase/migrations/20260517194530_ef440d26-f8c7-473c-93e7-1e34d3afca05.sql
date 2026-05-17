ALTER TABLE public.venues
  ADD COLUMN IF NOT EXISTS place_id text,
  ADD COLUMN IF NOT EXISTS gallery_urls jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS gallery_refreshed_at timestamptz,
  ADD COLUMN IF NOT EXISTS tiktok_url text,
  ADD COLUMN IF NOT EXISTS tiktok_handle text,
  ADD COLUMN IF NOT EXISTS instagram_url text,
  ADD COLUMN IF NOT EXISTS instagram_handle text,
  ADD COLUMN IF NOT EXISTS socials_refreshed_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_venues_gallery_refreshed_at ON public.venues (gallery_refreshed_at NULLS FIRST);

CREATE TABLE IF NOT EXISTS public.venue_media_refresh_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz,
  venues_processed integer NOT NULL DEFAULT 0,
  photos_added integer NOT NULL DEFAULT 0,
  socials_found integer NOT NULL DEFAULT 0,
  errors jsonb NOT NULL DEFAULT '[]'::jsonb,
  trigger text NOT NULL DEFAULT 'cron',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.venue_media_refresh_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "venue_media_refresh_runs admin read"
  ON public.venue_media_refresh_runs FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "venue_media_refresh_runs admin insert"
  ON public.venue_media_refresh_runs FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "venue_media_refresh_runs admin update"
  ON public.venue_media_refresh_runs FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));