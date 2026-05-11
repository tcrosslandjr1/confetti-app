
CREATE TABLE public.booking_notification_deliveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid,
  venue_id uuid,
  venue_name text,
  recipient_email text,
  source text NOT NULL DEFAULT 'unresolved',
  channel text NOT NULL DEFAULT 'email',
  status text NOT NULL DEFAULT 'pending',
  error text,
  subject text,
  body text,
  test boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_bnd_created_at ON public.booking_notification_deliveries (created_at DESC);
CREATE INDEX idx_bnd_booking ON public.booking_notification_deliveries (booking_id);
CREATE INDEX idx_bnd_venue ON public.booking_notification_deliveries (venue_id);
CREATE INDEX idx_bnd_status ON public.booking_notification_deliveries (status);

ALTER TABLE public.booking_notification_deliveries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admins read deliveries"
  ON public.booking_notification_deliveries FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "admins insert deliveries"
  ON public.booking_notification_deliveries FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "admins update deliveries"
  ON public.booking_notification_deliveries FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER trg_bnd_touch_updated
  BEFORE UPDATE ON public.booking_notification_deliveries
  FOR EACH ROW EXECUTE FUNCTION public.touch_itineraries_updated_at();

-- Extend the booking-notification trigger to also log a delivery row
CREATE OR REPLACE FUNCTION public.notify_on_new_booking()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_advertiser_owner uuid;
  v_staff_email text;
  v_advertiser_email text;
  v_recipient text;
  v_source text;
  v_title text;
  v_body text;
  starts_human text;
BEGIN
  starts_human := to_char(NEW.starts_at AT TIME ZONE 'UTC', 'Mon DD, HH24:MI');
  v_title := 'New booking — ' || NEW.venue_name;
  v_body := 'Party of ' || NEW.party_size || ' on ' || starts_human || ' UTC';

  IF NEW.venue_id IS NOT NULL THEN
    SELECT v.staff_email, a.owner_id, a.contact_email
      INTO v_staff_email, v_advertiser_owner, v_advertiser_email
    FROM public.venues v
    LEFT JOIN public.advertisers a ON a.id = v.advertiser_id
    WHERE v.id = NEW.venue_id;

    IF v_advertiser_owner IS NOT NULL THEN
      INSERT INTO public.notifications (user_id, kind, title, body, link, booking_id, venue_id)
      VALUES (v_advertiser_owner, 'booking_new', v_title, v_body,
              '/advertise/portal', NEW.id, NEW.venue_id);
    END IF;
  END IF;

  -- Resolve email recipient (matches resolveVenueNotificationEmail priority)
  IF coalesce(btrim(v_staff_email), '') <> '' THEN
    v_recipient := btrim(v_staff_email);
    v_source := 'venue_staff_email';
  ELSIF coalesce(btrim(v_advertiser_email), '') <> '' THEN
    v_recipient := btrim(v_advertiser_email);
    v_source := 'linked_advertiser';
  ELSE
    v_recipient := NULL;
    v_source := 'ops_fallback';
  END IF;

  INSERT INTO public.booking_notification_deliveries
    (booking_id, venue_id, venue_name, recipient_email, source, channel, status, subject, body)
  VALUES
    (NEW.id, NEW.venue_id, NEW.venue_name, v_recipient, v_source, 'email', 'pending', v_title, v_body);

  -- In-app notifications to all admins
  INSERT INTO public.notifications (user_id, kind, title, body, link, booking_id, venue_id)
  SELECT ur.user_id, 'booking_new', v_title, v_body,
         '/admin/bookings', NEW.id, NEW.venue_id
  FROM public.user_roles ur
  WHERE ur.role = 'admin'
    AND (v_advertiser_owner IS NULL OR ur.user_id <> v_advertiser_owner);

  RETURN NEW;
END;
$function$;
