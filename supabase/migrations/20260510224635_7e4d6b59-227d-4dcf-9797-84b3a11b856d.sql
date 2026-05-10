CREATE TYPE public.oauth_submission_status AS ENUM ('pending', 'approved', 'rejected');

CREATE TABLE public.oauth_credential_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('tiktok','instagram')),
  client_id TEXT NOT NULL,
  client_secret TEXT NOT NULL,
  callback_url TEXT NOT NULL,
  notes TEXT,
  status public.oauth_submission_status NOT NULL DEFAULT 'pending',
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  review_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_oauth_sub_one_pending
  ON public.oauth_credential_submissions(user_id, provider)
  WHERE status = 'pending';

CREATE INDEX idx_oauth_sub_user ON public.oauth_credential_submissions(user_id);

ALTER TABLE public.oauth_credential_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "oauth_sub own read"
  ON public.oauth_credential_submissions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "oauth_sub own insert"
  ON public.oauth_credential_submissions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "oauth_sub admin update"
  ON public.oauth_credential_submissions FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "oauth_sub admin delete"
  ON public.oauth_credential_submissions FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.touch_oauth_credential_submissions_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE TRIGGER trg_oauth_credential_submissions_touch
BEFORE UPDATE ON public.oauth_credential_submissions
FOR EACH ROW EXECUTE FUNCTION public.touch_oauth_credential_submissions_updated_at();