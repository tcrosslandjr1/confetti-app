ALTER TABLE public.user_preferences
  ADD COLUMN IF NOT EXISTS social_handles jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS social_signals text;