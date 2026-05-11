
ALTER TABLE public.venues
  ADD COLUMN IF NOT EXISTS verified boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS featured boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS featured_until timestamp with time zone;

CREATE INDEX IF NOT EXISTS venues_featured_idx ON public.venues (featured) WHERE featured = true;
CREATE INDEX IF NOT EXISTS venues_verified_idx ON public.venues (verified) WHERE verified = true;

-- Admins can read every ad_event for analytics
DROP POLICY IF EXISTS "ad_events admin read" ON public.ad_events;
CREATE POLICY "ad_events admin read"
  ON public.ad_events
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));
