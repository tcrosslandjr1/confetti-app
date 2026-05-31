-- Fix engagement_score column type: numeric(4,3) only allows 0-9.999
-- Change to integer to support realistic engagement counts (0-100000+)
alter table public.social_venue_signals
  alter column engagement_score type integer using engagement_score::integer;
