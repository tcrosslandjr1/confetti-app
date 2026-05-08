
ALTER TABLE public.itinerary_stops
  ADD COLUMN IF NOT EXISTS review_snippets jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS parking jsonb,
  ADD COLUMN IF NOT EXISTS tips jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS user_rating integer,
  ADD COLUMN IF NOT EXISTS user_review text,
  ADD COLUMN IF NOT EXISTS completed_at timestamptz;

ALTER TABLE public.itineraries
  ADD COLUMN IF NOT EXISTS completed_at timestamptz,
  ADD COLUMN IF NOT EXISTS overall_rating integer,
  ADD COLUMN IF NOT EXISTS overall_review text;
