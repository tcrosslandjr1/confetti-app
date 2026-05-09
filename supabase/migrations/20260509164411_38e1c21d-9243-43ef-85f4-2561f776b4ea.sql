CREATE TABLE public.marquee_sponsorships (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  brand text NOT NULL,
  occasion text NOT NULL,
  cta_label text NOT NULL DEFAULT 'Learn more',
  cta_url text NOT NULL,
  surface text NOT NULL DEFAULT 'both',  -- 'top' | 'bottom' | 'both'
  position integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  runs_from timestamptz,
  runs_until timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX marquee_sponsorships_active_idx ON public.marquee_sponsorships (active, position);

ALTER TABLE public.marquee_sponsorships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "marquee_sponsorships public read scheduled"
  ON public.marquee_sponsorships
  FOR SELECT
  TO public
  USING (
    active = true
    AND (runs_from IS NULL OR runs_from <= now())
    AND (runs_until IS NULL OR runs_until >= now())
  );

CREATE POLICY "marquee_sponsorships admin read all"
  ON public.marquee_sponsorships
  FOR SELECT
  TO public
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "marquee_sponsorships admin insert"
  ON public.marquee_sponsorships
  FOR INSERT
  TO public
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "marquee_sponsorships admin update"
  ON public.marquee_sponsorships
  FOR UPDATE
  TO public
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "marquee_sponsorships admin delete"
  ON public.marquee_sponsorships
  FOR DELETE
  TO public
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER marquee_sponsorships_touch_updated_at
  BEFORE UPDATE ON public.marquee_sponsorships
  FOR EACH ROW EXECUTE FUNCTION public.touch_itineraries_updated_at();
