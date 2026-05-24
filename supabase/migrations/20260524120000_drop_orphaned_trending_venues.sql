-- ═══════════════════════════════════════════════════════════
-- Drop the orphaned trending_venues table.
-- All trending data now lives in viral_venues.trend_score.
-- The refresh_trending_venues() SQL function that updated
-- venues.trending_score is unaffected — it targets a
-- different column on a different table.
-- ═══════════════════════════════════════════════════════════

drop table if exists public.trending_venues;
