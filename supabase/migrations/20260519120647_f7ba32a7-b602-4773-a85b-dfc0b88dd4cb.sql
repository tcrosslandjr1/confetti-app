
-- 1) Tighten the permissive INSERT policy on error_reports.
-- Keep public reporting (anon users may hit errors before login) but enforce
-- size limits so the endpoint can't be used as an unbounded write sink.
DROP POLICY IF EXISTS "Anyone can report an error" ON public.error_reports;
CREATE POLICY "Anyone can report a bounded error"
  ON public.error_reports
  FOR INSERT
  WITH CHECK (
    length(message) BETWEEN 1 AND 5000
    AND length(coalesce(stack, '')) <= 20000
    AND length(coalesce(url, '')) <= 2048
    AND length(coalesce(route, '')) <= 1024
    AND length(coalesce(user_agent, '')) <= 1024
  );

-- 2) Lock down SECURITY DEFINER functions that don't need public/auth EXECUTE.
-- Helpers used by RLS (has_role, is_corp_*) keep EXECUTE for authenticated/anon
-- because RLS evaluates them as the calling role.
-- Trigger-only functions already had no public grant.

-- Restrict to authenticated only (no anon):
REVOKE EXECUTE ON FUNCTION public.cities_served_summary() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.has_active_subscription(uuid, text) FROM PUBLIC, anon;

-- Already authenticated-only; ensure PUBLIC is revoked:
REVOKE EXECUTE ON FUNCTION public.referral_leaderboard(integer) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_corp_admin(uuid, uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_corp_member(uuid, uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_corp_team_manager(uuid, uuid) FROM PUBLIC;

-- Intentionally public (RSVP token landing page is unauthenticated by design):
COMMENT ON FUNCTION public.get_attendee_by_token(text) IS
  'PUBLIC by design: RSVP landing page is unauthenticated; token in URL is the auth factor.';
COMMENT ON FUNCTION public.record_rsvp_by_token(text, text, text) IS
  'PUBLIC by design: RSVP form is unauthenticated; token in URL is the auth factor.';

-- has_role / is_corp_* are RLS helpers — must stay callable by both roles:
COMMENT ON FUNCTION public.has_role(uuid, app_role) IS
  'RLS helper: required EXECUTE by anon+authenticated so RLS policies that wrap this can evaluate.';
COMMENT ON FUNCTION public.is_corp_admin(uuid, uuid) IS
  'RLS helper: callable by authenticated for corporate-scoped RLS policies.';
COMMENT ON FUNCTION public.is_corp_member(uuid, uuid) IS
  'RLS helper: callable by authenticated for corporate-scoped RLS policies.';
COMMENT ON FUNCTION public.is_corp_team_manager(uuid, uuid) IS
  'RLS helper: callable by authenticated for corporate-scoped RLS policies.';

-- 3) Stripe webhook idempotency table.
CREATE TABLE IF NOT EXISTS public.stripe_webhook_events (
  event_id text PRIMARY KEY,
  type text NOT NULL,
  environment text NOT NULL CHECK (environment IN ('sandbox','live')),
  received_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz,
  error text
);
CREATE INDEX IF NOT EXISTS idx_stripe_webhook_events_received_at
  ON public.stripe_webhook_events(received_at DESC);

ALTER TABLE public.stripe_webhook_events ENABLE ROW LEVEL SECURITY;
-- Service role only; no client access at all.
CREATE POLICY "service role only — stripe webhook events"
  ON public.stripe_webhook_events
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
