ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS pre_order_drinks jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS seating_preference text;