ALTER TABLE public.venues
  ADD COLUMN IF NOT EXISTS promotion_approved boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_venues_promotion_approved ON public.venues (promotion_approved)
  WHERE promotion_approved = true;