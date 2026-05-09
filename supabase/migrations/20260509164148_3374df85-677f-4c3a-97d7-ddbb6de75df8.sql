ALTER TABLE public.ad_events
  ALTER COLUMN campaign_id DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS brand text,
  ADD COLUMN IF NOT EXISTS occasion text,
  ADD COLUMN IF NOT EXISTS href text;

CREATE INDEX IF NOT EXISTS ad_events_brand_idx ON public.ad_events (brand);
CREATE INDEX IF NOT EXISTS ad_events_occasion_idx ON public.ad_events (occasion);
CREATE INDEX IF NOT EXISTS ad_events_surface_kind_idx ON public.ad_events (surface, kind);

-- Refresh insert policy to allow campaign-less marquee events while keeping kind validation
DROP POLICY IF EXISTS "ad_events anyone insert" ON public.ad_events;
CREATE POLICY "ad_events anyone insert"
  ON public.ad_events
  FOR INSERT
  TO public
  WITH CHECK (kind = ANY (ARRAY['impression'::text, 'click'::text]));

-- Allow advertisers to read their own brand-tagged events even without a campaign id,
-- and admins to read everything brand/occasion-tagged.
DROP POLICY IF EXISTS "ad_events brand read" ON public.ad_events;
CREATE POLICY "ad_events brand read"
  ON public.ad_events
  FOR SELECT
  TO public
  USING (
    has_role(auth.uid(), 'admin'::app_role)
    OR EXISTS (
      SELECT 1 FROM public.advertisers a
      WHERE a.owner_id = auth.uid()
        AND ad_events.brand IS NOT NULL
        AND lower(a.business_name) = lower(ad_events.brand)
    )
  );
