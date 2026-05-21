-- ============================================================
-- Confetti Social Intelligence Pipeline — Schema Migration
-- 2026-05-17
-- Tables: trending_venues, social_mentions, scan_runs
-- ============================================================

-- Trending venues discovered by scanning agents
CREATE TABLE IF NOT EXISTS trending_venues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  city TEXT NOT NULL,
  country TEXT DEFAULT 'US',
  category TEXT,  -- restaurant, bar, cafe, club, experience
  address TEXT,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  google_place_id TEXT,
  buzz_score NUMERIC(5,2) DEFAULT 0,
  mention_count INT DEFAULT 0,
  platforms TEXT[] DEFAULT '{}',
  trend TEXT DEFAULT 'rising' CHECK (trend IN ('viral','rising','steady','declining')),
  vibe_tags TEXT[] DEFAULT '{}',
  snippet TEXT,
  image_url TEXT,
  first_seen TIMESTAMPTZ DEFAULT now(),
  last_updated TIMESTAMPTZ DEFAULT now(),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected','auto_approved')),
  approved_at TIMESTAMPTZ,
  approved_by TEXT,
  confetti_venue_id UUID,
  UNIQUE(google_place_id)
);

-- Backfill columns when an older trending_venues table already exists
ALTER TABLE trending_venues ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'US';
ALTER TABLE trending_venues ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE trending_venues ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE trending_venues ADD COLUMN IF NOT EXISTS lat DOUBLE PRECISION;
ALTER TABLE trending_venues ADD COLUMN IF NOT EXISTS lng DOUBLE PRECISION;
ALTER TABLE trending_venues ADD COLUMN IF NOT EXISTS google_place_id TEXT;
ALTER TABLE trending_venues ADD COLUMN IF NOT EXISTS buzz_score NUMERIC(5,2) DEFAULT 0;
ALTER TABLE trending_venues ADD COLUMN IF NOT EXISTS mention_count INT DEFAULT 0;
ALTER TABLE trending_venues ADD COLUMN IF NOT EXISTS platforms TEXT[] DEFAULT '{}';
ALTER TABLE trending_venues ADD COLUMN IF NOT EXISTS trend TEXT DEFAULT 'rising';
ALTER TABLE trending_venues ADD COLUMN IF NOT EXISTS vibe_tags TEXT[] DEFAULT '{}';
ALTER TABLE trending_venues ADD COLUMN IF NOT EXISTS snippet TEXT;
ALTER TABLE trending_venues ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE trending_venues ADD COLUMN IF NOT EXISTS first_seen TIMESTAMPTZ DEFAULT now();
ALTER TABLE trending_venues ADD COLUMN IF NOT EXISTS last_updated TIMESTAMPTZ DEFAULT now();
ALTER TABLE trending_venues ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';
ALTER TABLE trending_venues ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;
ALTER TABLE trending_venues ADD COLUMN IF NOT EXISTS approved_by TEXT;
ALTER TABLE trending_venues ADD COLUMN IF NOT EXISTS confetti_venue_id UUID;

CREATE INDEX IF NOT EXISTS idx_trending_city ON trending_venues(city);
CREATE INDEX IF NOT EXISTS idx_trending_status ON trending_venues(status);
CREATE INDEX IF NOT EXISTS idx_trending_buzz ON trending_venues(buzz_score DESC);
CREATE INDEX IF NOT EXISTS idx_trending_first_seen ON trending_venues(first_seen DESC);
CREATE INDEX IF NOT EXISTS idx_trending_trend ON trending_venues(trend);

-- Individual social media mentions linked to trending venues
CREATE TABLE IF NOT EXISTS social_mentions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trending_venue_id UUID REFERENCES trending_venues(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('tiktok','instagram','reddit','youtube','google_trends','yelp','google_places','x')),
  post_url TEXT,
  post_id TEXT,
  creator_handle TEXT,
  creator_followers INT,
  engagement_likes INT DEFAULT 0,
  engagement_comments INT DEFAULT 0,
  engagement_shares INT DEFAULT 0,
  sentiment NUMERIC(3,2),  -- -1.0 to 1.0
  snippet TEXT,
  discovered_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(platform, post_id)
);

CREATE INDEX IF NOT EXISTS idx_mentions_venue ON social_mentions(trending_venue_id);
CREATE INDEX IF NOT EXISTS idx_mentions_platform ON social_mentions(platform);
CREATE INDEX IF NOT EXISTS idx_mentions_discovered ON social_mentions(discovered_at DESC);

-- Scan run log for pipeline monitoring
CREATE TABLE IF NOT EXISTS scan_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  city TEXT NOT NULL,
  scan_type TEXT NOT NULL CHECK (scan_type IN ('trend','new_opening','deep_audit','dormant_check')),
  platform TEXT,
  status TEXT DEFAULT 'running' CHECK (status IN ('running','completed','failed')),
  venues_found INT DEFAULT 0,
  mentions_found INT DEFAULT 0,
  errors TEXT[] DEFAULT '{}',
  started_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  duration_ms INT
);

CREATE INDEX IF NOT EXISTS idx_scans_city ON scan_runs(city);
CREATE INDEX IF NOT EXISTS idx_scans_status ON scan_runs(status);
CREATE INDEX IF NOT EXISTS idx_scans_started ON scan_runs(started_at DESC);

-- Enable Row Level Security
ALTER TABLE trending_venues ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_mentions ENABLE ROW LEVEL SECURITY;
ALTER TABLE scan_runs ENABLE ROW LEVEL SECURITY;

-- Service role (Edge Functions / backend) gets full access
CREATE POLICY "service_role_trending" ON trending_venues FOR ALL
  USING (auth.role() = 'service_role');
CREATE POLICY "service_role_mentions" ON social_mentions FOR ALL
  USING (auth.role() = 'service_role');
CREATE POLICY "service_role_scans" ON scan_runs FOR ALL
  USING (auth.role() = 'service_role');

-- Authenticated users (admin UI) get read access + update for approvals
CREATE POLICY "auth_read_trending" ON trending_venues FOR SELECT
  USING (auth.role() = 'authenticated');
CREATE POLICY "auth_update_trending" ON trending_venues FOR UPDATE
  USING (auth.role() = 'authenticated');
CREATE POLICY "auth_read_mentions" ON social_mentions FOR SELECT
  USING (auth.role() = 'authenticated');
CREATE POLICY "auth_read_scans" ON scan_runs FOR SELECT
  USING (auth.role() = 'authenticated');

-- ============================================================
-- Helper function: recalculate buzz score for a venue
-- ============================================================
CREATE OR REPLACE FUNCTION recalculate_buzz_score(venue_id UUID)
RETURNS NUMERIC AS $$
DECLARE
  v_mention_velocity NUMERIC;
  v_platform_count INT;
  v_total_platforms INT := 7;
  v_avg_engagement NUMERIC;
  v_avg_reach NUMERIC;
  v_avg_sentiment NUMERIC;
  v_score NUMERIC;
BEGIN
  -- Mention velocity: mentions in last 24h
  SELECT COUNT(*)::NUMERIC INTO v_mention_velocity
  FROM social_mentions
  WHERE trending_venue_id = venue_id
    AND discovered_at > now() - INTERVAL '24 hours';

  -- Normalize velocity (cap at 50 mentions = 1.0)
  v_mention_velocity := LEAST(v_mention_velocity / 50.0, 1.0);

  -- Cross-platform presence
  SELECT COUNT(DISTINCT platform) INTO v_platform_count
  FROM social_mentions
  WHERE trending_venue_id = venue_id;

  -- Average engagement rate (simplified: total engagement / mention count)
  SELECT
    COALESCE(AVG(engagement_likes + engagement_comments + engagement_shares), 0),
    COALESCE(AVG(NULLIF(creator_followers, 0)), 1000),
    COALESCE(AVG(sentiment), 0.5)
  INTO v_avg_engagement, v_avg_reach, v_avg_sentiment
  FROM social_mentions
  WHERE trending_venue_id = venue_id;

  -- Normalize each factor to 0-1
  v_score := (
    v_mention_velocity * 0.30 +
    (v_platform_count::NUMERIC / v_total_platforms) * 0.20 +
    LEAST(v_avg_engagement / 10000.0, 1.0) * 0.20 +
    LEAST(v_avg_reach / 1000000.0, 1.0) * 0.15 +
    ((v_avg_sentiment + 1.0) / 2.0) * 0.15  -- shift -1..1 to 0..1
  ) * 100;

  -- Update the venue
  UPDATE trending_venues
  SET buzz_score = ROUND(v_score, 2),
      mention_count = (SELECT COUNT(*) FROM social_mentions WHERE trending_venue_id = venue_id),
      platforms = (SELECT ARRAY_AGG(DISTINCT platform) FROM social_mentions WHERE trending_venue_id = venue_id),
      last_updated = now(),
      trend = CASE
        WHEN v_score >= 80 THEN 'viral'
        WHEN v_score >= 50 THEN 'rising'
        WHEN v_score >= 20 THEN 'steady'
        ELSE 'declining'
      END
  WHERE id = venue_id;

  RETURN v_score;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- Helper function: auto-approve qualifying venues
-- ============================================================
CREATE OR REPLACE FUNCTION auto_approve_venues(target_city TEXT DEFAULT NULL)
RETURNS INT AS $$
DECLARE
  approved_count INT;
BEGIN
  UPDATE trending_venues
  SET status = 'auto_approved',
      approved_at = now(),
      approved_by = 'system'
  WHERE status = 'pending'
    AND buzz_score >= 90
    AND array_length(platforms, 1) >= 3
    AND google_place_id IS NOT NULL
    AND (target_city IS NULL OR city = target_city);

  GET DIAGNOSTICS approved_count = ROW_COUNT;
  RETURN approved_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
