-- Facebook OAuth state table (mirrors tiktok_oauth_states / instagram_oauth_states)
CREATE TABLE IF NOT EXISTS facebook_oauth_states (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  state        text NOT NULL UNIQUE,
  user_id      uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  redirect_to  text,
  expires_at   timestamptz NOT NULL,
  consumed_at  timestamptz,
  created_at   timestamptz DEFAULT now()
);

CREATE INDEX idx_facebook_oauth_states_state
  ON facebook_oauth_states (state)
  WHERE consumed_at IS NULL;

ALTER TABLE facebook_oauth_states ENABLE ROW LEVEL SECURITY;

-- Only the service role writes these rows; users never read them directly
