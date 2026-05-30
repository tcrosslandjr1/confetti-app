-- Fix: analytics tables (never applied to prod) + venue_claims schema reconcile
-- Applied to production 2026-05-30. The app code (services/analytics, business.claim,
-- business.verify, business-onboarding-api, admin.verifications) expects these.

-- 1) Analytics tables ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.analytics_events (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  event_name text NOT NULL,
  category text NOT NULL,
  properties jsonb DEFAULT '{}',
  user_id text,
  session_id text,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_analytics_events_user ON public.analytics_events(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_events_name ON public.analytics_events(event_name, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_events_category ON public.analytics_events(category, created_at DESC);

CREATE TABLE IF NOT EXISTS public.analytics_users (
  user_id text PRIMARY KEY,
  traits jsonb DEFAULT '{}',
  first_seen timestamptz DEFAULT now(),
  last_seen timestamptz DEFAULT now()
);

ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_users ENABLE ROW LEVEL SECURITY;

DO $pol$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='analytics_events' AND policyname='analytics_events insert') THEN
    CREATE POLICY "analytics_events insert" ON public.analytics_events FOR INSERT TO anon, authenticated WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='analytics_events' AND policyname='analytics_events admin read') THEN
    CREATE POLICY "analytics_events admin read" ON public.analytics_events FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='analytics_users' AND policyname='analytics_users insert') THEN
    CREATE POLICY "analytics_users insert" ON public.analytics_users FOR INSERT TO anon, authenticated WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='analytics_users' AND policyname='analytics_users update') THEN
    CREATE POLICY "analytics_users update" ON public.analytics_users FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='analytics_users' AND policyname='analytics_users admin read') THEN
    CREATE POLICY "analytics_users admin read" ON public.analytics_users FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
  END IF;
END $pol$;

-- 2) venue_claims: reconcile to the user-owned model the app code expects -----
ALTER TABLE public.venue_claims ALTER COLUMN advertiser_id DROP NOT NULL;
ALTER TABLE public.venue_claims
  ADD COLUMN IF NOT EXISTS user_id uuid,
  ADD COLUMN IF NOT EXISTS proposed_name text,
  ADD COLUMN IF NOT EXISTS proposed_place_id text,
  ADD COLUMN IF NOT EXISTS proposed_city text,
  ADD COLUMN IF NOT EXISTS proposed_website text,
  ADD COLUMN IF NOT EXISTS method text,
  ADD COLUMN IF NOT EXISTS evidence_handle text,
  ADD COLUMN IF NOT EXISTS evidence_url text,
  ADD COLUMN IF NOT EXISTS evidence_email text,
  ADD COLUMN IF NOT EXISTS evidence_domain text;
CREATE INDEX IF NOT EXISTS idx_venue_claims_user ON public.venue_claims(user_id);

DO $pol$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='venue_claims' AND policyname='claims user read') THEN
    CREATE POLICY "claims user read" ON public.venue_claims FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='venue_claims' AND policyname='claims user insert') THEN
    CREATE POLICY "claims user insert" ON public.venue_claims FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='venue_claims' AND policyname='claims user update') THEN
    CREATE POLICY "claims user update" ON public.venue_claims FOR UPDATE TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin')) WITH CHECK (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
  END IF;
END $pol$;
