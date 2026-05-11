
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  kind text NOT NULL DEFAULT 'booking_new',
  title text NOT NULL,
  body text,
  link text,
  booking_id uuid,
  venue_id uuid,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_unread
  ON public.notifications(user_id, read_at, created_at DESC);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own notifications read"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "own notifications update"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "own notifications delete"
  ON public.notifications FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger function: fan out booking_new notifications
CREATE OR REPLACE FUNCTION public.notify_on_new_booking()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_advertiser_owner uuid;
  v_title text;
  v_body text;
  starts_human text;
BEGIN
  starts_human := to_char(NEW.starts_at AT TIME ZONE 'UTC', 'Mon DD, HH24:MI');
  v_title := 'New booking — ' || NEW.venue_name;
  v_body := 'Party of ' || NEW.party_size || ' on ' || starts_human || ' UTC';

  -- Notify the venue's linked advertiser owner (if any)
  IF NEW.venue_id IS NOT NULL THEN
    SELECT a.owner_id INTO v_advertiser_owner
    FROM public.venues v
    JOIN public.advertisers a ON a.id = v.advertiser_id
    WHERE v.id = NEW.venue_id;

    IF v_advertiser_owner IS NOT NULL THEN
      INSERT INTO public.notifications (user_id, kind, title, body, link, booking_id, venue_id)
      VALUES (
        v_advertiser_owner, 'booking_new', v_title, v_body,
        '/advertise/portal', NEW.id, NEW.venue_id
      );
    END IF;
  END IF;

  -- Notify all admins
  INSERT INTO public.notifications (user_id, kind, title, body, link, booking_id, venue_id)
  SELECT ur.user_id, 'booking_new', v_title, v_body,
         '/admin/bookings', NEW.id, NEW.venue_id
  FROM public.user_roles ur
  WHERE ur.role = 'admin'
    AND (v_advertiser_owner IS NULL OR ur.user_id <> v_advertiser_owner);

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_on_new_booking ON public.bookings;
CREATE TRIGGER trg_notify_on_new_booking
  AFTER INSERT ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_new_booking();

-- Enable realtime
ALTER TABLE public.notifications REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
