-- Linked third-party social accounts (TikTok, future: Instagram, etc.)
CREATE TABLE public.linked_social_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  provider text NOT NULL,
  provider_user_id text NOT NULL,
  username text,
  display_name text,
  avatar_url text,
  scope text,
  access_token text,
  refresh_token text,
  expires_at timestamptz,
  raw jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (provider, provider_user_id),
  UNIQUE (user_id, provider)
);

ALTER TABLE public.linked_social_accounts ENABLE ROW LEVEL SECURITY;

-- Users can read their own linked accounts (but tokens stay server-side via select column scope in code)
CREATE POLICY "linked_social_accounts own read"
  ON public.linked_social_accounts FOR SELECT
  USING (auth.uid() = user_id);

-- Users can disconnect their own
CREATE POLICY "linked_social_accounts own delete"
  ON public.linked_social_accounts FOR DELETE
  USING (auth.uid() = user_id);

-- No public insert/update — only the server (service role) writes here.

CREATE INDEX idx_linked_social_accounts_user ON public.linked_social_accounts(user_id);

-- Short-lived OAuth state rows for the TikTok authorization handshake
CREATE TABLE public.tiktok_oauth_states (
  state text PRIMARY KEY,
  user_id uuid NOT NULL,
  redirect_to text,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '15 minutes'),
  consumed_at timestamptz
);

ALTER TABLE public.tiktok_oauth_states ENABLE ROW LEVEL SECURITY;
-- No policies: only service role accesses this table.

CREATE INDEX idx_tiktok_oauth_states_expires ON public.tiktok_oauth_states(expires_at);

-- Touch updated_at on linked_social_accounts
CREATE OR REPLACE FUNCTION public.touch_linked_social_accounts_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER trg_linked_social_accounts_touch
BEFORE UPDATE ON public.linked_social_accounts
FOR EACH ROW EXECUTE FUNCTION public.touch_linked_social_accounts_updated_at();