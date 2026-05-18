ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS preferred_ride text NOT NULL DEFAULT 'both'
    CHECK (preferred_ride IN ('uber','lyft','both','none')),
  ADD COLUMN IF NOT EXISTS preferred_vehicle text,
  ADD COLUMN IF NOT EXISTS ev_owner boolean NOT NULL DEFAULT false;