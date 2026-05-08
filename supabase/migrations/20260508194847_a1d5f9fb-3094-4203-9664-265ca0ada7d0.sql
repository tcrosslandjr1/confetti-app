
ALTER TABLE public.user_preferences
  ADD COLUMN IF NOT EXISTS taste_profile jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS about_me text;
