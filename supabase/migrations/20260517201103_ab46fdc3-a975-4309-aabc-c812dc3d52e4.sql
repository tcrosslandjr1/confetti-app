
ALTER TABLE public.venue_claims
  ADD COLUMN IF NOT EXISTS user_id uuid,
  ADD COLUMN IF NOT EXISTS method text,
  ADD COLUMN IF NOT EXISTS evidence_handle text,
  ADD COLUMN IF NOT EXISTS evidence_url text,
  ADD COLUMN IF NOT EXISTS evidence_email text,
  ADD COLUMN IF NOT EXISTS evidence_domain text,
  ADD COLUMN IF NOT EXISTS proposed_name text,
  ADD COLUMN IF NOT EXISTS proposed_place_id text,
  ADD COLUMN IF NOT EXISTS proposed_city text,
  ADD COLUMN IF NOT EXISTS proposed_website text;

ALTER TABLE public.venue_claims ALTER COLUMN advertiser_id DROP NOT NULL;

CREATE INDEX IF NOT EXISTS idx_venue_claims_user ON public.venue_claims(user_id);
CREATE INDEX IF NOT EXISTS idx_venue_claims_status ON public.venue_claims(status);
CREATE INDEX IF NOT EXISTS idx_venue_claims_venue ON public.venue_claims(venue_id);

ALTER TABLE public.venue_claims ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "own claims read" ON public.venue_claims;
CREATE POLICY "own claims read"
  ON public.venue_claims FOR SELECT
  USING (
    auth.uid() = user_id
    OR public.has_role(auth.uid(), 'admin'::public.app_role)
    OR (advertiser_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.advertisers a
      WHERE a.id = venue_claims.advertiser_id AND a.owner_id = auth.uid()
    ))
  );

DROP POLICY IF EXISTS "own claims insert" ON public.venue_claims;
CREATE POLICY "own claims insert"
  ON public.venue_claims FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "own pending claim update" ON public.venue_claims;
CREATE POLICY "own pending claim update"
  ON public.venue_claims FOR UPDATE
  USING (
    (auth.uid() = user_id AND status IN ('pending', 'needs_more_info'))
    OR public.has_role(auth.uid(), 'admin'::public.app_role)
  )
  WITH CHECK (
    (auth.uid() = user_id AND status IN ('pending', 'needs_more_info'))
    OR public.has_role(auth.uid(), 'admin'::public.app_role)
  );

DROP POLICY IF EXISTS "admins delete claims" ON public.venue_claims;
CREATE POLICY "admins delete claims"
  ON public.venue_claims FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));
