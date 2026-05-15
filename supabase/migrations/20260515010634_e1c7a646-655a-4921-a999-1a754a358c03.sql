CREATE TABLE IF NOT EXISTS public.outreach_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  generated_at timestamptz NOT NULL DEFAULT now(),
  window_days integer NOT NULL,
  venue_count integer NOT NULL,
  csv text NOT NULL,
  source text NOT NULL DEFAULT 'cron'
);

CREATE INDEX IF NOT EXISTS idx_outreach_snapshots_generated_at
  ON public.outreach_snapshots (generated_at DESC);

ALTER TABLE public.outreach_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "outreach_snapshots admin read"
  ON public.outreach_snapshots FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "outreach_snapshots admin delete"
  ON public.outreach_snapshots FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));
-- INSERTs happen via service role from the cron hook; no public insert policy.