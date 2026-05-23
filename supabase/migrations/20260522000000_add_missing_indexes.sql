-- ============================================================
-- Missing indexes on high-traffic tables
-- Generated: 2026-05-22
--
-- Tables covered and rationale:
--   favorites           – queried by (user_id) and (user_id, venue_id) in
--                         content-service and analytics-service; no index existed
--   profiles            – queried by id (PK, covered) but also .order("created_at")
--                         full-table scan for leaderboard; add created_at index
--   chat_messages       – plan-service fetches by (user_id) ORDER BY created_at;
--                         existing index is (venue_id, created_at) only — missing user_id
--   bookings            – existing indexes: user_id, starts_at.
--                         Missing: venue_id (booking-service queries), status (filtering)
--   venues              – missing city (lower) + category composite for discovery queries
--
-- Tables already well-indexed (no action needed):
--   user_checkins       – user_id, venue_id, campaign_id, verified_at all present
--   user_behavior_events – (user_id, created_at DESC) + event_type already present
--   venue_favorites     – (user_id, created_at DESC) already present
-- ============================================================

-- ── favorites ────────────────────────────────────────────────
-- content-service: .eq("user_id").order("created_at")
-- analytics-service: .eq("venue_id") count
CREATE INDEX IF NOT EXISTS idx_favorites_user
  ON public.favorites (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_favorites_venue
  ON public.favorites (venue_id);

-- ── profiles ─────────────────────────────────────────────────
-- rewards-service: SELECT id, full_name ORDER BY created_at (leaderboard)
-- PK covers single-row lookups; this covers ordered scans
CREATE INDEX IF NOT EXISTS idx_profiles_created_at
  ON public.profiles (created_at DESC);

-- ── chat_messages ────────────────────────────────────────────
-- plan-service: .eq("user_id").order("created_at") — existing index is venue_id only
CREATE INDEX IF NOT EXISTS idx_chat_messages_user_created
  ON public.chat_messages (user_id, created_at ASC);

-- room_type = 'community' reads (public community feed)
CREATE INDEX IF NOT EXISTS idx_chat_messages_room_created
  ON public.chat_messages (room_type, created_at DESC)
  WHERE room_type = 'community';

-- ── bookings ─────────────────────────────────────────────────
-- booking-service / analytics-service query by venue_id and filter by status
-- (user_id and starts_at indexes already exist from earlier migration)
CREATE INDEX IF NOT EXISTS idx_bookings_venue
  ON public.bookings (venue_id)
  WHERE venue_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_bookings_status
  ON public.bookings (status, starts_at DESC);

-- ── venues ───────────────────────────────────────────────────
-- Discovery queries filter by city (lower-cased) + category
-- places-search and google-places functions rely on this path
CREATE INDEX IF NOT EXISTS idx_venues_city_category
  ON public.venues (lower(city), category)
  WHERE city IS NOT NULL;

-- neighborhood lookups (used in rewards-service checkin aggregation via join)
CREATE INDEX IF NOT EXISTS idx_venues_neighborhood
  ON public.venues (lower(neighborhood))
  WHERE neighborhood IS NOT NULL;
