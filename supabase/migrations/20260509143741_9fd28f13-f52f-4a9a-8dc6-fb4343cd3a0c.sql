
-- venues admin write policies
CREATE POLICY "admins insert venues" ON public.venues
FOR INSERT TO public
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "admins update venues" ON public.venues
FOR UPDATE TO public
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "admins delete venues" ON public.venues
FOR DELETE TO public
USING (public.has_role(auth.uid(), 'admin'));

-- bookings admin notes column
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS admin_notes text;
