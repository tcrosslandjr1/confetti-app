
-- Add business_owner to app_role enum (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel='business_owner' AND enumtypid='public.app_role'::regtype) THEN
    ALTER TYPE public.app_role ADD VALUE 'business_owner';
  END IF;
END$$;

-- Add onboarding columns to advertisers
ALTER TABLE public.advertisers
  ADD COLUMN IF NOT EXISTS package_selected text,
  ADD COLUMN IF NOT EXISTS onboarding_step smallint NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'self-serve',
  ADD COLUMN IF NOT EXISTS owner_name text,
  ADD COLUMN IF NOT EXISTS submitted_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS review_note text,
  ADD COLUMN IF NOT EXISTS reviewed_at timestamptz,
  ADD COLUMN IF NOT EXISTS reviewed_by uuid;

-- Migrate 'pending' to 'pending_review' for clarity
UPDATE public.advertisers SET status = 'pending_review' WHERE status = 'pending';

-- Update column default to pending_review
ALTER TABLE public.advertisers ALTER COLUMN status SET DEFAULT 'pending_review';

CREATE INDEX IF NOT EXISTS advertisers_onboarding_idx ON public.advertisers(status, submitted_at DESC);
