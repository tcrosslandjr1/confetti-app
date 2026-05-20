
-- Booking status change audit log
CREATE TABLE public.booking_status_changes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  old_status TEXT,
  new_status TEXT NOT NULL,
  changed_by UUID,
  actor_email TEXT,
  actor_role TEXT NOT NULL DEFAULT 'system',
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_booking_status_changes_booking ON public.booking_status_changes (booking_id, created_at DESC);

ALTER TABLE public.booking_status_changes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read all booking status changes"
  ON public.booking_status_changes FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users read their own booking status changes"
  ON public.booking_status_changes FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.bookings b
    WHERE b.id = booking_id AND b.user_id = auth.uid()
  ));

-- Trigger function: log INSERT (initial) and UPDATE (status / cancelled_at)
CREATE OR REPLACE FUNCTION public.log_booking_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor uuid := auth.uid();
  v_email text;
  v_role text;
  v_new text;
  v_old text;
BEGIN
  IF v_actor IS NOT NULL THEN
    SELECT email INTO v_email FROM auth.users WHERE id = v_actor;
    IF public.has_role(v_actor, 'admin') THEN
      v_role := 'admin';
    ELSIF NEW.user_id = v_actor THEN
      v_role := 'guest';
    ELSE
      v_role := 'staff';
    END IF;
  ELSE
    v_role := 'system';
  END IF;

  IF TG_OP = 'INSERT' THEN
    v_new := COALESCE(CASE WHEN NEW.cancelled_at IS NOT NULL THEN 'cancelled' END, NEW.status, 'pending');
    INSERT INTO public.booking_status_changes (booking_id, old_status, new_status, changed_by, actor_email, actor_role, note)
    VALUES (NEW.id, NULL, v_new, v_actor, v_email, v_role, 'Booking created');
    RETURN NEW;
  END IF;

  v_old := COALESCE(CASE WHEN OLD.cancelled_at IS NOT NULL THEN 'cancelled' END, OLD.status);
  v_new := COALESCE(CASE WHEN NEW.cancelled_at IS NOT NULL THEN 'cancelled' END, NEW.status);

  IF v_old IS DISTINCT FROM v_new THEN
    INSERT INTO public.booking_status_changes (booking_id, old_status, new_status, changed_by, actor_email, actor_role)
    VALUES (NEW.id, v_old, v_new, v_actor, v_email, v_role);
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_booking_status_change_ins
AFTER INSERT ON public.bookings
FOR EACH ROW EXECUTE FUNCTION public.log_booking_status_change();

CREATE TRIGGER trg_booking_status_change_upd
AFTER UPDATE OF status, cancelled_at ON public.bookings
FOR EACH ROW EXECUTE FUNCTION public.log_booking_status_change();

-- Backfill existing bookings with an initial status entry
INSERT INTO public.booking_status_changes (booking_id, old_status, new_status, actor_role, note, created_at)
SELECT id, NULL, COALESCE(CASE WHEN cancelled_at IS NOT NULL THEN 'cancelled' END, status, 'pending'),
       'system', 'Backfilled from existing booking', created_at
FROM public.bookings;
