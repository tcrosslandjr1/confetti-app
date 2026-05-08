ALTER TABLE public.itinerary_stops ADD COLUMN IF NOT EXISTS travel_from_prev jsonb;
ALTER TABLE public.itineraries ADD COLUMN IF NOT EXISTS transport_mode text;