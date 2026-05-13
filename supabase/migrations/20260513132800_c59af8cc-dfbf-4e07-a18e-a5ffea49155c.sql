CREATE TABLE public.saved_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_id text NOT NULL,
  kind text NOT NULL DEFAULT 'save' CHECK (kind IN ('save','rsvp')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, event_id, kind)
);

ALTER TABLE public.saved_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own saved events"
  ON public.saved_events FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users save events for self"
  ON public.saved_events FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users remove own saved events"
  ON public.saved_events FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX idx_saved_events_user ON public.saved_events(user_id);
CREATE INDEX idx_saved_events_event ON public.saved_events(event_id);