-- Security hardening: close the self-service entitlement holes and PII leaks
-- found in the 2026-08-10 audit.

-- ═══════════════════════════════════════════════════════════
-- 1. user_subscriptions: users could UPDATE their own tier,
--    confetti_balance, outing_credit_balance, plan_limit.
--    Users may READ their row; only service role writes.
-- ═══════════════════════════════════════════════════════════
DROP POLICY IF EXISTS "Users manage own subscription" ON public.user_subscriptions;
CREATE POLICY "Users read own subscription"
  ON public.user_subscriptions FOR SELECT
  USING (user_id = auth.uid());

-- ═══════════════════════════════════════════════════════════
-- 2. wallet_passes: users could UPDATE credit_balance on their
--    own pass. Read-only for users; service role writes.
-- ═══════════════════════════════════════════════════════════
DROP POLICY IF EXISTS "Users can update own passes" ON public.wallet_passes;

-- ═══════════════════════════════════════════════════════════
-- 3. city_waitlist: anon could SELECT (dump every signup email)
--    and UPDATE (overwrite any row). Replace raw access with two
--    SECURITY DEFINER functions: aggregate votes + guarded upsert.
-- ═══════════════════════════════════════════════════════════
DROP POLICY IF EXISTS "Anyone can read waitlist for vote counts" ON public.city_waitlist;
DROP POLICY IF EXISTS "Anyone can update their own waitlist entry" ON public.city_waitlist;
DROP POLICY IF EXISTS "Anyone can join the waitlist" ON public.city_waitlist;

CREATE OR REPLACE FUNCTION public.city_waitlist_votes()
RETURNS TABLE (voted_city text, votes bigint)
LANGUAGE sql SECURITY DEFINER SET search_path = public
AS $$
  SELECT voted_city, count(*)::bigint
  FROM public.city_waitlist
  WHERE voted_city IS NOT NULL
  GROUP BY voted_city;
$$;

CREATE OR REPLACE FUNCTION public.join_city_waitlist(
  p_email text,
  p_voted_city text DEFAULT NULL,
  p_source text DEFAULT 'coming_soon_splash'
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF p_email IS NULL OR p_email !~ '^[^\s@]+@[^\s@]+\.[^\s@]+$' THEN
    RAISE EXCEPTION 'invalid email';
  END IF;
  INSERT INTO public.city_waitlist (email, voted_city, source)
  VALUES (lower(trim(p_email)), p_voted_city, p_source)
  ON CONFLICT (email) DO UPDATE
    SET voted_city = COALESCE(EXCLUDED.voted_city, city_waitlist.voted_city),
        source = EXCLUDED.source;
END;
$$;

GRANT EXECUTE ON FUNCTION public.city_waitlist_votes() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.join_city_waitlist(text, text, text) TO anon, authenticated;

-- ═══════════════════════════════════════════════════════════
-- 4. esign_records: signed-contract PII had NO row security.
--    Enable RLS with no policies — service role only.
-- ═══════════════════════════════════════════════════════════
ALTER TABLE public.esign_records ENABLE ROW LEVEL SECURITY;

-- ═══════════════════════════════════════════════════════════
-- 5. agent_* control-center tables: policies said "Admins can…"
--    but gated nothing (USING (true), FOR ALL). The admin console
--    reads/writes these client-side, so gate on is_admin().
-- ═══════════════════════════════════════════════════════════
DROP POLICY IF EXISTS "Admins can read agent_teams" ON public.agent_teams;
DROP POLICY IF EXISTS "Admins can read agent_registry" ON public.agent_registry;
DROP POLICY IF EXISTS "Admins can read agent_messages" ON public.agent_messages;
DROP POLICY IF EXISTS "Admins can read agent_tasks" ON public.agent_tasks;
DROP POLICY IF EXISTS "Admins can manage agent_tasks" ON public.agent_tasks;
DROP POLICY IF EXISTS "Admins can manage agent_messages" ON public.agent_messages;
DROP POLICY IF EXISTS "System can update agent_registry" ON public.agent_registry;

CREATE POLICY "admin read agent_teams" ON public.agent_teams
  FOR SELECT TO authenticated USING (public.is_admin());
CREATE POLICY "admin manage agent_registry" ON public.agent_registry
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "admin manage agent_messages" ON public.agent_messages
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "admin manage agent_tasks" ON public.agent_tasks
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ═══════════════════════════════════════════════════════════
-- 6. analytics_users: anon could UPDATE any user's traits.
--    Keep insert (event capture) and admin read; drop open update.
-- ═══════════════════════════════════════════════════════════
DROP POLICY IF EXISTS "analytics_users update" ON public.analytics_users;
