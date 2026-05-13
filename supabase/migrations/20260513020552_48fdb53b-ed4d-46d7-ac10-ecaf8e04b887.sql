-- Tighten booking creation: only users with the 'customer' role may insert bookings,
-- and only for themselves. UI gating is no longer the security boundary.
DROP POLICY IF EXISTS "own bookings insert" ON public.bookings;

CREATE POLICY "customers insert own bookings"
ON public.bookings
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND public.has_role(auth.uid(), 'customer'::app_role)
);

-- Also require the customer role for self-updates (e.g. cancel, edit pre-orders).
-- Admins keep their existing override.
DROP POLICY IF EXISTS "own bookings update" ON public.bookings;

CREATE POLICY "customers update own bookings"
ON public.bookings
FOR UPDATE
TO authenticated
USING (
  (auth.uid() = user_id AND public.has_role(auth.uid(), 'customer'::app_role))
  OR public.has_role(auth.uid(), 'admin'::app_role)
)
WITH CHECK (
  (auth.uid() = user_id AND public.has_role(auth.uid(), 'customer'::app_role))
  OR public.has_role(auth.uid(), 'admin'::app_role)
);