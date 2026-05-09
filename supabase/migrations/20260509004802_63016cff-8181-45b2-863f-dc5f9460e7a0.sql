CREATE TABLE public.favorite_stops (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  venue_name text NOT NULL,
  vibe text,
  tone text,
  address text,
  neighborhood text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, venue_name)
);

ALTER TABLE public.favorite_stops ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own favorites all" ON public.favorite_stops
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_favorite_stops_user ON public.favorite_stops(user_id, created_at DESC);