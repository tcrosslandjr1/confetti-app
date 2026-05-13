CREATE TABLE public.places_match_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  source text NOT NULL,
  user_id uuid,
  city text,
  requested_name text,
  query text,
  place_id text,
  matched_name text,
  status text NOT NULL,
  score numeric,
  rating numeric,
  user_rating_count integer,
  business_status text,
  meta jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX idx_places_match_audit_created ON public.places_match_audit (created_at DESC);
CREATE INDEX idx_places_match_audit_status ON public.places_match_audit (status);
CREATE INDEX idx_places_match_audit_source ON public.places_match_audit (source);

ALTER TABLE public.places_match_audit ENABLE ROW LEVEL SECURITY;

CREATE POLICY "places_match_audit admin read"
  ON public.places_match_audit FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "places_match_audit admin delete"
  ON public.places_match_audit FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));
