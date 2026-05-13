-- Pick analytics events: server-side store for "Why this pick" impressions, clicks, and feedback.
CREATE TABLE public.pick_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  client_at timestamptz,
  name text NOT NULL CHECK (name IN ('pick_impression','pick_click','pick_feedback_up','pick_feedback_down')),
  pick_id text NOT NULL,
  context text,
  signals text[] NOT NULL DEFAULT '{}',
  meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  user_id uuid,
  session_id text
);

CREATE INDEX idx_pick_events_created_at ON public.pick_events (created_at DESC);
CREATE INDEX idx_pick_events_pick_id ON public.pick_events (pick_id);
CREATE INDEX idx_pick_events_name ON public.pick_events (name);

ALTER TABLE public.pick_events ENABLE ROW LEVEL SECURITY;

-- Anyone (including anon) may insert their own analytics events.
CREATE POLICY "pick_events anyone insert"
  ON public.pick_events FOR INSERT
  WITH CHECK (true);

-- Only admins can read aggregate analytics.
CREATE POLICY "pick_events admin read"
  ON public.pick_events FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "pick_events admin delete"
  ON public.pick_events FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));
