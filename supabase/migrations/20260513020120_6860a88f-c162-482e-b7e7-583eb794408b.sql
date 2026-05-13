
-- Venue reports: users flag wrong/closed venues so they aren't reused
CREATE TABLE public.venue_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  place_id text,
  venue_name text NOT NULL,
  city text,
  reason text NOT NULL DEFAULT 'closed',
  notes text,
  status text NOT NULL DEFAULT 'open',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_venue_reports_user ON public.venue_reports(user_id);
CREATE INDEX idx_venue_reports_place ON public.venue_reports(place_id) WHERE place_id IS NOT NULL;
CREATE INDEX idx_venue_reports_city_place ON public.venue_reports(city, place_id) WHERE place_id IS NOT NULL;

ALTER TABLE public.venue_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "venue_reports own insert" ON public.venue_reports
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "venue_reports own read" ON public.venue_reports
  FOR SELECT USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "venue_reports admin update" ON public.venue_reports
  FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "venue_reports admin delete" ON public.venue_reports
  FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

-- Helper: aggregated blocked place_ids per city (3+ distinct reporters)
CREATE OR REPLACE FUNCTION public.blocked_place_ids_for_city(_city text)
RETURNS TABLE(place_id text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT place_id
  FROM public.venue_reports
  WHERE place_id IS NOT NULL
    AND status = 'open'
    AND (_city IS NULL OR lower(city) = lower(_city))
  GROUP BY place_id
  HAVING count(DISTINCT user_id) >= 3
$$;
