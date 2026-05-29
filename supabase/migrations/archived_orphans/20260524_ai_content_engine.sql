-- ============================================================
-- Confetti AI Content Engine — schema for auto-generated ideas,
-- discovered venues, and the feedback learning loop.
-- ============================================================

-- 1. AI-generated occasion ideas
CREATE TABLE IF NOT EXISTS ai_generated_ideas (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  occasion_slug text NOT NULL,                         -- matches OCCASIONS[].slug
  city_slug     text,                                  -- NULL = universal
  title         text NOT NULL,
  hook          text NOT NULL,
  description   text NOT NULL,
  vibe_tags     text[] DEFAULT '{}',
  est_cost      text DEFAULT '$$',
  time_of_day   text DEFAULT 'Evening',
  duration      text DEFAULT '2-3 hours',
  steps         jsonb DEFAULT '[]'::jsonb,             -- IdeaStep[]
  what_to_wear  text,
  conversation_starter text,
  quality_score real DEFAULT 0.5,                      -- 0..1; raised/lowered by feedback
  generation_batch text,                               -- e.g. "daily-2026-05-24"
  is_active     boolean DEFAULT true,
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now()
);

CREATE INDEX idx_ai_ideas_occasion ON ai_generated_ideas (occasion_slug, is_active);
CREATE INDEX idx_ai_ideas_city     ON ai_generated_ideas (city_slug, is_active);

-- 2. AI-discovered venues (location-based)
CREATE TABLE IF NOT EXISTS ai_discovered_venues (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  city_slug     text NOT NULL,
  name          text NOT NULL,
  slug          text NOT NULL,
  neighborhood  text,
  address       text,
  category      text NOT NULL,                         -- Dining, Nightlife, Rooftops, etc.
  rating        real,
  price         text DEFAULT '$$',
  price_level   int DEFAULT 2,
  tags          text[] DEFAULT '{}',
  description   text NOT NULL,
  image_url     text,
  lat           double precision,
  lng           double precision,
  ai_pick       boolean DEFAULT false,
  quality_score real DEFAULT 0.5,
  source        text DEFAULT 'ai',                     -- 'ai' | 'google' | 'yelp' | 'manual'
  generation_batch text,
  is_active     boolean DEFAULT true,
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now(),
  UNIQUE (city_slug, slug)
);

CREATE INDEX idx_ai_venues_city ON ai_discovered_venues (city_slug, is_active);

-- 3. User feedback on ideas & venues (learning loop)
CREATE TABLE IF NOT EXISTS user_content_feedback (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content_type  text NOT NULL CHECK (content_type IN ('idea', 'venue')),
  content_id    uuid NOT NULL,                         -- FK to ai_generated_ideas or ai_discovered_venues
  action        text NOT NULL CHECK (action IN ('save', 'skip', 'rate', 'share', 'use')),
  rating        int CHECK (rating IS NULL OR (rating >= 1 AND rating <= 5)),
  occasion_slug text,                                  -- context: which occasion page they were on
  city_slug     text,                                  -- context: which city
  created_at    timestamptz DEFAULT now()
);

CREATE INDEX idx_feedback_content ON user_content_feedback (content_type, content_id);
CREATE INDEX idx_feedback_user    ON user_content_feedback (user_id, created_at DESC);

-- 4. Generation log — tracks daily runs and stats
CREATE TABLE IF NOT EXISTS ai_generation_log (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id      text NOT NULL UNIQUE,                  -- "daily-2026-05-24"
  trigger       text NOT NULL DEFAULT 'scheduled',     -- 'scheduled' | 'on_demand' | 'manual'
  cities_processed text[] DEFAULT '{}',
  occasions_processed text[] DEFAULT '{}',
  ideas_generated int DEFAULT 0,
  venues_generated int DEFAULT 0,
  feedback_incorporated int DEFAULT 0,                 -- how many feedback rows were used
  model_used    text,
  duration_ms   int,
  status        text DEFAULT 'running',                -- 'running' | 'completed' | 'failed'
  error_message text,
  created_at    timestamptz DEFAULT now(),
  completed_at  timestamptz
);

-- 5. Taste signals aggregate (materialized per-user summary for the gen prompt)
CREATE TABLE IF NOT EXISTS user_taste_signals (
  user_id         uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  top_occasions   text[] DEFAULT '{}',                 -- most-engaged occasion slugs
  top_vibes       text[] DEFAULT '{}',                 -- most-saved vibe tags
  preferred_price text DEFAULT '$$',
  preferred_time  text DEFAULT 'Evening',
  disliked_tags   text[] DEFAULT '{}',                 -- tags from skipped content
  total_saves     int DEFAULT 0,
  total_skips     int DEFAULT 0,
  total_ratings   int DEFAULT 0,
  avg_rating      real,
  updated_at      timestamptz DEFAULT now()
);

-- RLS policies
ALTER TABLE ai_generated_ideas ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_discovered_venues ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_content_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_generation_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_taste_signals ENABLE ROW LEVEL SECURITY;

-- Everyone can read active ideas & venues
CREATE POLICY "Public read active ideas" ON ai_generated_ideas
  FOR SELECT USING (is_active = true);

CREATE POLICY "Public read active venues" ON ai_discovered_venues
  FOR SELECT USING (is_active = true);

-- Users can read/write their own feedback
CREATE POLICY "Users manage own feedback" ON user_content_feedback
  FOR ALL USING (auth.uid() = user_id);

-- Users can read their own taste signals
CREATE POLICY "Users read own taste signals" ON user_taste_signals
  FOR SELECT USING (auth.uid() = user_id);

-- Service role handles writes to ideas, venues, generation_log, and taste_signals
-- (server functions use supabaseAdmin which bypasses RLS)
