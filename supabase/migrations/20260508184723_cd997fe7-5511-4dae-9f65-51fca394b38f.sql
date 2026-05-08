-- Itineraries (full-day plans) and their ordered stops with booking links

CREATE TABLE public.itineraries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  occasion_slug TEXT,
  vibe TEXT,
  summary TEXT,
  date DATE,
  start_time TIME,
  city TEXT,
  est_total_cost TEXT,
  source TEXT NOT NULL DEFAULT 'planner',  -- 'planner' | 'card' | 'ai'
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_itineraries_user ON public.itineraries(user_id, created_at DESC);

ALTER TABLE public.itineraries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own itineraries all" ON public.itineraries
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.itinerary_stops (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  itinerary_id UUID NOT NULL REFERENCES public.itineraries(id) ON DELETE CASCADE,
  position INTEGER NOT NULL,
  name TEXT NOT NULL,
  category TEXT,                  -- 'meal' | 'activity' | 'drinks' | 'scenic' | 'travel' | 'other'
  description TEXT,
  address TEXT,
  start_time TIME,
  duration_minutes INTEGER,
  est_cost TEXT,
  what_to_do TEXT,
  booking_url TEXT,
  booking_provider TEXT,          -- 'opentable' | 'resy' | 'eventbrite' | 'website' | etc.
  booking_status TEXT NOT NULL DEFAULT 'unbooked',  -- 'unbooked' | 'pending' | 'confirmed'
  booking_ref TEXT,               -- confirmation number / note
  user_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_stops_itinerary ON public.itinerary_stops(itinerary_id, position);

ALTER TABLE public.itinerary_stops ENABLE ROW LEVEL SECURITY;

-- Stops are accessible only via owning itinerary
CREATE POLICY "own stops select" ON public.itinerary_stops
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.itineraries i WHERE i.id = itinerary_id AND i.user_id = auth.uid()
  ));

CREATE POLICY "own stops insert" ON public.itinerary_stops
  FOR INSERT WITH CHECK (EXISTS (
    SELECT 1 FROM public.itineraries i WHERE i.id = itinerary_id AND i.user_id = auth.uid()
  ));

CREATE POLICY "own stops update" ON public.itinerary_stops
  FOR UPDATE USING (EXISTS (
    SELECT 1 FROM public.itineraries i WHERE i.id = itinerary_id AND i.user_id = auth.uid()
  ));

CREATE POLICY "own stops delete" ON public.itinerary_stops
  FOR DELETE USING (EXISTS (
    SELECT 1 FROM public.itineraries i WHERE i.id = itinerary_id AND i.user_id = auth.uid()
  ));

-- Auto-update timestamp
CREATE OR REPLACE FUNCTION public.touch_itineraries_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER trg_itineraries_updated_at
BEFORE UPDATE ON public.itineraries
FOR EACH ROW EXECUTE FUNCTION public.touch_itineraries_updated_at();