
-- Cached AI-generated menus, keyed by itinerary stop
CREATE TABLE public.stop_menus (
  stop_id uuid PRIMARY KEY REFERENCES public.itinerary_stops(id) ON DELETE CASCADE,
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  source text NOT NULL DEFAULT 'ai',
  generated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.stop_menus ENABLE ROW LEVEL SECURITY;

CREATE POLICY "stop_menus owner read"
ON public.stop_menus
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.itinerary_stops s
  JOIN public.itineraries i ON i.id = s.itinerary_id
  WHERE s.id = stop_menus.stop_id AND i.user_id = auth.uid()
));

CREATE POLICY "stop_menus owner insert"
ON public.stop_menus
FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM public.itinerary_stops s
  JOIN public.itineraries i ON i.id = s.itinerary_id
  WHERE s.id = stop_menus.stop_id AND i.user_id = auth.uid()
));

CREATE POLICY "stop_menus owner update"
ON public.stop_menus
FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM public.itinerary_stops s
  JOIN public.itineraries i ON i.id = s.itinerary_id
  WHERE s.id = stop_menus.stop_id AND i.user_id = auth.uid()
))
WITH CHECK (EXISTS (
  SELECT 1 FROM public.itinerary_stops s
  JOIN public.itineraries i ON i.id = s.itinerary_id
  WHERE s.id = stop_menus.stop_id AND i.user_id = auth.uid()
));

-- Placed orders, one per submission
CREATE TABLE public.stop_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  itinerary_id uuid NOT NULL REFERENCES public.itineraries(id) ON DELETE CASCADE,
  stop_id uuid NOT NULL REFERENCES public.itinerary_stops(id) ON DELETE CASCADE,
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  total_cents integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'placed',
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX stop_orders_stop_idx ON public.stop_orders (stop_id);
CREATE INDEX stop_orders_itinerary_idx ON public.stop_orders (itinerary_id);
CREATE INDEX stop_orders_user_idx ON public.stop_orders (user_id);

ALTER TABLE public.stop_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "stop_orders owner read"
ON public.stop_orders FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "stop_orders owner insert"
ON public.stop_orders FOR INSERT
WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1 FROM public.itineraries i
    WHERE i.id = stop_orders.itinerary_id AND i.user_id = auth.uid()
  )
);

CREATE POLICY "stop_orders owner update"
ON public.stop_orders FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "stop_orders owner delete"
ON public.stop_orders FOR DELETE
USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.touch_stop_orders_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE TRIGGER stop_orders_touch
BEFORE UPDATE ON public.stop_orders
FOR EACH ROW
EXECUTE FUNCTION public.touch_stop_orders_updated_at();
