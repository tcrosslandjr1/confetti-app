-- ============================================================
-- discovered_events — Cache table for Claude-powered event discovery.
-- Stores structured event data per city+date so we don't re-search
-- the web for the same query within the TTL window.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.discovered_events (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  city          text NOT NULL,
  date_key      text NOT NULL,                  -- "tonight", "2026-05-25", "this-weekend"
  events        jsonb NOT NULL DEFAULT '[]',     -- Array of DiscoveredEvent objects
  vibes_summary text,                            -- One-line scene summary
  search_context text,                           -- What was searched
  cached_at     timestamptz NOT NULL DEFAULT now(),

  -- Composite unique for upsert
  CONSTRAINT uq_discovered_events_city_date UNIQUE (city, date_key)
);

-- Index for fast lookups by city + freshness
CREATE INDEX IF NOT EXISTS idx_discovered_events_city_cached
  ON public.discovered_events (city, cached_at DESC);

-- Auto-cleanup: delete rows older than 6 hours (belt-and-suspenders with app-level TTL)
-- This keeps the table small. Run via pg_cron or Supabase scheduled function.
COMMENT ON TABLE public.discovered_events IS
  'Cache for Claude web-search event discovery. TTL: 2h app-side, 6h hard-delete.';
