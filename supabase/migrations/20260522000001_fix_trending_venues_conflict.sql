-- ============================================================
-- Fix: Rename social_intelligence's trending_venues → discovered_venues
--
-- Two migrations (20260517000000_backend_os and 20260517000001_social_intelligence)
-- both created "trending_venues" with incompatible schemas.
-- - backend_os: cache table (venue_id FK, trend_score, rank_in_city) used by refresh_trending_venues()
-- - social_intelligence: discovery table (name, address, buzz_score, status) for social scanning
--
-- Resolution: The backend_os schema is the one used by all edge functions.
-- Rename the social_intelligence version to "discovered_venues" and update
-- the social_mentions FK accordingly.
-- ============================================================

-- Step 1: If the social_intelligence columns exist on trending_venues but the
-- table is actually the backend_os version (has venue_id column), we need to
-- create discovered_venues as a separate table.

-- Create the standalone discovery table
CREATE TABLE IF NOT EXISTS public.discovered_venues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  city TEXT NOT NULL,
  country TEXT DEFAULT 'US',
  category TEXT,
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

CREATE INDEX IF NOT EXISTS idx_discovered_city ON discovered_venues(city);
CREATE INDEX IF NOT EXISTS idx_discovered_status ON discovered_venues(status);
CREATE INDEX IF NOT EXISTS idx_discovered_buzz ON discovered_venues(buzz_score DESC);
CREATE INDEX IF NOT EXISTS idx_discovered_first_seen ON discovered_venues(first_seen DESC);
CREATE INDEX IF NOT EXISTS idx_discovered_trend ON discovered_venues(trend);

-- Step 2: Migrate any data that was accidentally written to trending_venues
-- with social_intelligence columns (name is not null in that schema, but not
-- present in backend_os schema — so if name exists and has data, move it)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'trending_venues' AND column_name = 'name'
  ) THEN
    INSERT INTO discovered_venues (id, name, city, country, category, address, lat, lng,
      google_place_id, buzz_score, mention_count, platforms, trend, vibe_tags,
      snippet, image_url, first_seen, last_updated, status, approved_at, approved_by, confetti_venue_id)
    SELECT id, name, city, country, category, address, lat, lng,
      google_place_id, buzz_score, mention_count, platforms, trend, vibe_tags,
      snippet, image_url, first_seen, last_updated, status, approved_at, approved_by, confetti_venue_id
    FROM trending_venues
    WHERE name IS NOT NULL
    ON CONFLICT (google_place_id) DO NOTHING;
  END IF;
END $$;

-- Step 3: Update social_mentions FK to point to discovered_venues
-- First check if the table exists and has the old FK
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name = 'social_mentions'
  ) THEN
    -- Drop old FK if it exists
    ALTER TABLE social_mentions DROP CONSTRAINT IF EXISTS social_mentions_trending_venue_id_fkey;
    -- Rename column
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'social_mentions' AND column_name = 'trending_venue_id'
    ) THEN
      ALTER TABLE social_mentions RENAME COLUMN trending_venue_id TO discovered_venue_id;
    END IF;
    -- Add new FK
    ALTER TABLE social_mentions
      ADD CONSTRAINT social_mentions_discovered_venue_id_fkey
      FOREIGN KEY (discovered_venue_id) REFERENCES discovered_venues(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Step 4: Clean up social_intelligence columns from trending_venues if they exist
-- (the backend_os schema doesn't have these)
ALTER TABLE trending_venues DROP COLUMN IF EXISTS name;
ALTER TABLE trending_venues DROP COLUMN IF EXISTS country;
ALTER TABLE trending_venues DROP COLUMN IF EXISTS address;
ALTER TABLE trending_venues DROP COLUMN IF EXISTS lat;
ALTER TABLE trending_venues DROP COLUMN IF EXISTS lng;
ALTER TABLE trending_venues DROP COLUMN IF EXISTS google_place_id;
ALTER TABLE trending_venues DROP COLUMN IF EXISTS buzz_score;
ALTER TABLE trending_venues DROP COLUMN IF EXISTS mention_count;
ALTER TABLE trending_venues DROP COLUMN IF EXISTS platforms;
ALTER TABLE trending_venues DROP COLUMN IF EXISTS trend;
ALTER TABLE trending_venues DROP COLUMN IF EXISTS vibe_tags;
ALTER TABLE trending_venues DROP COLUMN IF EXISTS snippet;
ALTER TABLE trending_venues DROP COLUMN IF EXISTS image_url;
ALTER TABLE trending_venues DROP COLUMN IF EXISTS first_seen;
ALTER TABLE trending_venues DROP COLUMN IF EXISTS last_updated;
ALTER TABLE trending_venues DROP COLUMN IF EXISTS status;
ALTER TABLE trending_venues DROP COLUMN IF EXISTS approved_at;
ALTER TABLE trending_venues DROP COLUMN IF EXISTS approved_by;
ALTER TABLE trending_venues DROP COLUMN IF EXISTS confetti_venue_id;

-- Step 5: Drop the stale policies from social_intelligence that reference wrong columns
DROP POLICY IF EXISTS "service_role_trending" ON trending_venues;
DROP POLICY IF EXISTS "auth_read_trending" ON trending_venues;
DROP POLICY IF EXISTS "auth_update_trending" ON trending_venues;

-- Step 6: Add proper RLS policies for the discovered_venues table
ALTER TABLE discovered_venues ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_discovered" ON discovered_venues FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "auth_read_discovered" ON discovered_venues FOR SELECT
  USING (auth.role() = 'authenticated');

-- Step 7: Ensure trending_venues has proper RLS for edge functions
-- (backend_os should have set this up, but just in case)
ALTER TABLE trending_venues ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'trending_venues' AND policyname = 'service_role_trending_cache'
  ) THEN
    CREATE POLICY "service_role_trending_cache" ON trending_venues FOR ALL
      USING (auth.role() = 'service_role');
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'trending_venues' AND policyname = 'auth_read_trending_cache'
  ) THEN
    CREATE POLICY "auth_read_trending_cache" ON trending_venues FOR SELECT
      USING (auth.role() = 'authenticated');
  END IF;
END $$;
