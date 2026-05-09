CREATE TABLE public.instagram_oauth_states (
  state text PRIMARY KEY,
  user_id uuid NOT NULL,
  redirect_to text,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '15 minutes'),
  consumed_at timestamptz
);

ALTER TABLE public.instagram_oauth_states ENABLE ROW LEVEL SECURITY;
-- No policies: only service role accesses this table.

CREATE INDEX idx_instagram_oauth_states_expires ON public.instagram_oauth_states(expires_at);