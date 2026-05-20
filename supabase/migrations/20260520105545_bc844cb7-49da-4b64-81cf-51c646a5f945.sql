
CREATE TABLE IF NOT EXISTS public.city_ideas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  city text NOT NULL,
  country text,
  category text NOT NULL CHECK (category IN ('food','game_night','lounge','rooftop_bar')),
  title text NOT NULL,
  description text NOT NULL,
  venue_hint text,
  neighborhood text,
  vibe_tags text[] DEFAULT '{}',
  price_tier smallint DEFAULT 2 CHECK (price_tier BETWEEN 1 AND 4),
  best_time text,
  source text DEFAULT 'ai' CHECK (source IN ('ai','web','tiktok','instagram','mixed')),
  source_refs jsonb DEFAULT '[]'::jsonb,
  trending_score numeric DEFAULT 0,
  published boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_city_ideas_city ON public.city_ideas (lower(city));
CREATE INDEX IF NOT EXISTS idx_city_ideas_category ON public.city_ideas (category);
CREATE INDEX IF NOT EXISTS idx_city_ideas_city_cat ON public.city_ideas (lower(city), category);
CREATE INDEX IF NOT EXISTS idx_city_ideas_trending ON public.city_ideas (trending_score DESC);

ALTER TABLE public.city_ideas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read published city ideas"
  ON public.city_ideas FOR SELECT
  USING (published = true);

CREATE POLICY "Admins can manage city ideas"
  ON public.city_ideas FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER set_city_ideas_updated_at
  BEFORE UPDATE ON public.city_ideas
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
