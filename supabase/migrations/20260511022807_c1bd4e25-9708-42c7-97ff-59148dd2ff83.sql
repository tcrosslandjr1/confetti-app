-- Multi-day fields on itineraries
ALTER TABLE public.itineraries
  ADD COLUMN IF NOT EXISTS end_date date,
  ADD COLUMN IF NOT EXISTS day_count integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS trip_type text NOT NULL DEFAULT 'night';

ALTER TABLE public.itinerary_stops
  ADD COLUMN IF NOT EXISTS day_index integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS stop_date date;

UPDATE public.itineraries SET end_date = date WHERE end_date IS NULL AND date IS NOT NULL;

-- Corporate events
CREATE TABLE IF NOT EXISTS public.corporate_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  org_name text NOT NULL,
  title text NOT NULL,
  purpose text NOT NULL DEFAULT 'team-outing',
  starts_at timestamptz NOT NULL,
  ends_at timestamptz,
  headcount integer NOT NULL DEFAULT 1,
  budget_per_person_cents integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'draft',
  itinerary_id uuid,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_corporate_events_owner ON public.corporate_events(owner_id, starts_at DESC);

ALTER TABLE public.corporate_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "corp events owner read" ON public.corporate_events
  FOR SELECT USING (auth.uid() = owner_id OR has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "corp events owner insert" ON public.corporate_events
  FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "corp events owner update" ON public.corporate_events
  FOR UPDATE USING (auth.uid() = owner_id OR has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (auth.uid() = owner_id OR has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "corp events owner delete" ON public.corporate_events
  FOR DELETE USING (auth.uid() = owner_id OR has_role(auth.uid(), 'admin'::app_role));

-- Corporate attendees
CREATE TABLE IF NOT EXISTS public.corporate_attendees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.corporate_events(id) ON DELETE CASCADE,
  email text NOT NULL,
  name text,
  role text NOT NULL DEFAULT 'attendee',
  dietary text,
  rsvp_status text NOT NULL DEFAULT 'invited',
  rsvp_token text NOT NULL UNIQUE DEFAULT replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', ''),
  responded_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_corporate_attendees_event ON public.corporate_attendees(event_id);

ALTER TABLE public.corporate_attendees ENABLE ROW LEVEL SECURITY;

CREATE POLICY "corp attendees owner read" ON public.corporate_attendees
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.corporate_events e WHERE e.id = corporate_attendees.event_id AND (e.owner_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role)))
  );
CREATE POLICY "corp attendees owner insert" ON public.corporate_attendees
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.corporate_events e WHERE e.id = corporate_attendees.event_id AND e.owner_id = auth.uid())
  );
CREATE POLICY "corp attendees owner update" ON public.corporate_attendees
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.corporate_events e WHERE e.id = corporate_attendees.event_id AND (e.owner_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role)))
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM public.corporate_events e WHERE e.id = corporate_attendees.event_id AND (e.owner_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role)))
  );
CREATE POLICY "corp attendees owner delete" ON public.corporate_attendees
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.corporate_events e WHERE e.id = corporate_attendees.event_id AND (e.owner_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role)))
  );

-- updated_at triggers
CREATE OR REPLACE FUNCTION public.touch_corporate_events_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE OR REPLACE FUNCTION public.touch_corporate_attendees_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

DROP TRIGGER IF EXISTS trg_corp_events_touch ON public.corporate_events;
CREATE TRIGGER trg_corp_events_touch BEFORE UPDATE ON public.corporate_events
  FOR EACH ROW EXECUTE FUNCTION public.touch_corporate_events_updated_at();

DROP TRIGGER IF EXISTS trg_corp_attendees_touch ON public.corporate_attendees;
CREATE TRIGGER trg_corp_attendees_touch BEFORE UPDATE ON public.corporate_attendees
  FOR EACH ROW EXECUTE FUNCTION public.touch_corporate_attendees_updated_at();

-- Public RSVP via token (security definer)
CREATE OR REPLACE FUNCTION public.get_attendee_by_token(_token text)
RETURNS TABLE (
  attendee_id uuid,
  attendee_email text,
  attendee_name text,
  rsvp_status text,
  dietary text,
  event_id uuid,
  event_title text,
  org_name text,
  starts_at timestamptz,
  ends_at timestamptz,
  purpose text
) LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT a.id, a.email, a.name, a.rsvp_status, a.dietary,
         e.id, e.title, e.org_name, e.starts_at, e.ends_at, e.purpose
  FROM public.corporate_attendees a
  JOIN public.corporate_events e ON e.id = a.event_id
  WHERE a.rsvp_token = _token
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.record_rsvp_by_token(_token text, _status text, _dietary text)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF _status NOT IN ('yes','no','maybe') THEN
    RAISE EXCEPTION 'invalid status';
  END IF;
  UPDATE public.corporate_attendees
     SET rsvp_status = _status,
         dietary = COALESCE(_dietary, dietary),
         responded_at = now()
   WHERE rsvp_token = _token;
  RETURN FOUND;
END $$;

GRANT EXECUTE ON FUNCTION public.get_attendee_by_token(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.record_rsvp_by_token(text, text, text) TO anon, authenticated;