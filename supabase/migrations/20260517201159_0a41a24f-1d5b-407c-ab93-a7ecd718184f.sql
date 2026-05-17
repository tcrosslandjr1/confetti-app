
ALTER TABLE public.venue_claims ALTER COLUMN venue_id DROP NOT NULL;
ALTER TABLE public.venue_claims ALTER COLUMN verification_tier SET DEFAULT 'owner';
