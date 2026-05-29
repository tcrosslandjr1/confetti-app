-- ============================================================
-- Confetti Social Signal Layer — stores AI-classified social
-- venue signals (trending, popular, new, lowkey, unique) per
-- city to enrich the Content Engine with real-time social proof.
-- ============================================================

-- 1. Social venue signals — the core table
CREATE TABLE IF NOT EXISTS social_venue_signals (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  city_slug        text NOT NULL,                          -- matches CityContext.slug
  venue_name       text NOT NULL,
  venue_slug       text NOT NULL,                          -- kebab-case for dedup
  signal_type      text NOT NULL CHECK (signal_type IN ('trending', 'popular', 'new', 'lowkey', 'unique')),
  platform         text NOT NULL DEFAULT 'multi',          -- 'tiktok' | 'instagram' | 'twitter' | 'multi'
  post_count       int DEFAULT 0,                          -- estimated social post volume
  engagement_score real DEFAULT 0.5,                       -- 0..1 relative engagement
  sentiment        text DEFAULT 'positive' CHECK (sentiment IN ('positive', 'neutral', 'mixed', 'negative')),
  hashtags         jsonb DEFAULT '[]'::jsonb,              -- relevant hashtags found
  snippet          text,                                   -- short social proof snippet
  neighborhood     text,                                   -- where in the city
  category         text,                                   -- Dining, Nightlife, Rooftops, etc.
  first_seen       timestamptz DEFAULT now(),               -- when this venue first appeared
  generation_batch text,                                   -- e.g. "social-dc-2026-05-24"
  is_active        boolean DEFAULT true,
  collected_at     timestamptz DEFAULT now()
);

-- Unique constraint for upsert — one signal per venue per platform per city
ALTER TABLE social_venue_signals
  ADD CONSTRAINT uq_social_signal_venue UNIQUE (city_slug, venue_slug, platform);

-- Indexes for fast lookups
CREATE INDEX idx_social_signals_city
  ON social_venue_signals (city_slug, is_active);

CREATE INDEX idx_social_signals_type
  ON social_venue_signals (city_slug, signal_type, is_active);

CREATE INDEX idx_social_signals_collected
  ON social_venue_signals (collected_at DESC);

CREATE INDEX idx_social_signals_engagement
  ON social_venue_signals (city_slug, engagement_score DESC)
  WHERE is_active = true;

-- 2. Social collection log — tracks batch runs per city
CREATE TABLE IF NOT EXISTS social_collection_log (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id          text NOT NULL,                         -- "social-dc-2026-05-24"
  city_slug         text NOT NULL,
  trigger           text NOT NULL DEFAULT 'scheduled',     -- 'scheduled' | 'on_demand' | 'manual'
  signals_collected int DEFAULT 0,
  signals_by_type   jsonb DEFAULT '{}'::jsonb,             -- {"trending": 3, "popular": 4, ...}
  model_used        text,
  duration_ms       int,
  status            text DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed')),
  error_message     text,
  created_at        timestamptz DEFAULT now(),
  completed_at      timestamptz
);

CREATE INDEX idx_social_log_city
  ON social_collection_log (city_slug, created_at DESC);

-- RLS policies
ALTER TABLE social_venue_signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_collection_log ENABLE ROW LEVEL SECURITY;

-- Everyone can read active signals (public data)
CREATE POLICY "Public read active social signals" ON social_venue_signals
  FOR SELECT USING (is_active = true);

-- Public read on collection log (optional transparency)
CREATE POLICY "Public read social collection log" ON social_collection_log
  FOR SELECT USING (true);

-- Service role handles all writes via supabaseAdmin (bypasses RLS)
