
ALTER TABLE public.venues
  ADD COLUMN IF NOT EXISTS hero_image_url text,
  ADD COLUMN IF NOT EXISTS google_images jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS google_maps_url text,
  ADD COLUMN IF NOT EXISTS tags text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS rating numeric(2,1),
  ADD COLUMN IF NOT EXISTS price_band text,
  ADD COLUMN IF NOT EXISTS is_sponsored boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_venues_is_sponsored ON public.venues (is_sponsored) WHERE is_sponsored = true;
CREATE INDEX IF NOT EXISTS idx_venues_tags ON public.venues USING GIN (tags);
