CREATE TABLE public.venue_favorites (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  venue_id text NOT NULL,
  venue_name text NOT NULL,
  image_url text,
  category text,
  neighborhood text,
  city text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (user_id, venue_id)
);

ALTER TABLE public.venue_favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own venue_favorites read"
  ON public.venue_favorites FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "own venue_favorites insert"
  ON public.venue_favorites FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "own venue_favorites delete"
  ON public.venue_favorites FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX idx_venue_favorites_user ON public.venue_favorites (user_id, created_at DESC);