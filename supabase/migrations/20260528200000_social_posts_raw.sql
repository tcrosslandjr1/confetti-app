-- ============================================================
-- social_posts_raw — stores raw social posts ingested by
-- social-sync for audit, debugging, and reprocessing.
-- ============================================================

CREATE TABLE IF NOT EXISTS social_posts_raw (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  platform         text NOT NULL CHECK (platform IN ('tiktok', 'instagram', 'facebook')),
  post_id          text NOT NULL,                     -- platform's post ID
  url              text,
  creator_handle   text,
  caption          text,
  hashtags         jsonb DEFAULT '[]'::jsonb,
  location_tag     text,
  likes            int DEFAULT 0,
  saves            int DEFAULT 0,
  shares           int DEFAULT 0,
  signal_score     real DEFAULT 0,                    -- calculated 0-100 intent score
  source           text CHECK (source IN ('saved', 'liked', 'trending', 'following')),
  ingested_at      timestamptz DEFAULT now(),

  -- Prevent duplicate ingestion for same user + post
  UNIQUE (user_id, platform, post_id)
);

CREATE INDEX idx_social_posts_raw_user
  ON social_posts_raw (user_id, ingested_at DESC);

CREATE INDEX idx_social_posts_raw_platform
  ON social_posts_raw (platform, ingested_at DESC);

CREATE INDEX idx_social_posts_raw_signal
  ON social_posts_raw (signal_score DESC)
  WHERE signal_score >= 60;

-- RLS
ALTER TABLE social_posts_raw ENABLE ROW LEVEL SECURITY;

-- Users can only see their own ingested posts
CREATE POLICY "Users read own social posts" ON social_posts_raw
  FOR SELECT USING (auth.uid() = user_id);

-- Service role handles writes via supabaseAdmin (bypasses RLS)

-- Also ensure user_taste_profiles has the columns social-sync needs
ALTER TABLE user_taste_profiles
  ADD COLUMN IF NOT EXISTS social_signals  jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS last_synced_at  timestamptz,
  ADD COLUMN IF NOT EXISTS platforms_connected text[] DEFAULT '{}';
