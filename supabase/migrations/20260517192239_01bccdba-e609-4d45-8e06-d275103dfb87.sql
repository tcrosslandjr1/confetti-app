-- Lightweight event analytics
CREATE TABLE IF NOT EXISTS public.analytics_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL,
  user_id UUID,
  event_type TEXT NOT NULL,           -- 'cta_click' | 'scroll_depth' | 'time_to_interaction' | 'error' | 'pageview'
  event_name TEXT NOT NULL,           -- semantic label, e.g. 'plan_my_night'
  path TEXT NOT NULL,
  value NUMERIC,                      -- generic numeric (ms, %)
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ae_created_at ON public.analytics_events (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ae_path_type  ON public.analytics_events (path, event_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ae_session    ON public.analytics_events (session_id, created_at DESC);

ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

-- Anyone (anon + auth) can insert telemetry for themselves; no PII required.
CREATE POLICY "Anyone can insert analytics events"
ON public.analytics_events
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Only admins can read.
CREATE POLICY "Admins can read analytics events"
ON public.analytics_events
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));