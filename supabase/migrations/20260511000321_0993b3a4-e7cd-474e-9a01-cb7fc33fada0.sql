
ALTER TABLE public.venues
  ADD COLUMN IF NOT EXISTS staff_email text,
  ADD COLUMN IF NOT EXISTS advertiser_id uuid REFERENCES public.advertisers(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_venues_advertiser_id ON public.venues(advertiser_id);
