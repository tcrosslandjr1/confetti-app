-- ============================================================
-- RLS hardening for Supabase Security Advisor findings (2026-05-19)
--
-- All statements use IF EXISTS / DROP POLICY IF EXISTS so the
-- migration is safe to apply even if some flagged tables don't
-- exist (e.g. tables that Lovable created outside our migrations).
-- ============================================================

-- ─── profile_social_links: add INSERT/UPDATE policies ──────
-- Advisor: "Social account OAuth tokens lack INSERT and UPDATE RLS policies"
ALTER TABLE IF EXISTS public.profile_social_links ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can insert own social links" ON public.profile_social_links;
CREATE POLICY "Users can insert own social links"
  ON public.profile_social_links
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own social links" ON public.profile_social_links;
CREATE POLICY "Users can update own social links"
  ON public.profile_social_links
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own social links" ON public.profile_social_links;
CREATE POLICY "Users can delete own social links"
  ON public.profile_social_links
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ─── referral_codes: restrict reads to owner ───────────────
-- Advisor: "All referral codes and user UUIDs are readable by any authenticated user"
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'referral_codes') THEN
    EXECUTE 'ALTER TABLE public.referral_codes ENABLE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS "anyone can read referral codes" ON public.referral_codes';
    EXECUTE 'DROP POLICY IF EXISTS "authenticated can read referral codes" ON public.referral_codes';
    EXECUTE 'DROP POLICY IF EXISTS "Users can read own referral codes" ON public.referral_codes';
    EXECUTE 'CREATE POLICY "Users can read own referral codes" ON public.referral_codes FOR SELECT TO authenticated USING (auth.uid() = user_id)';
  END IF;
END $$;

-- ─── venue_staff: restrict email visibility to venue owners ─
-- Advisor: "Venue staff email addresses are readable by anyone"
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'venue_staff') THEN
    EXECUTE 'ALTER TABLE public.venue_staff ENABLE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS "anyone can read venue staff" ON public.venue_staff';
    EXECUTE 'DROP POLICY IF EXISTS "public can read venue staff" ON public.venue_staff';
    EXECUTE 'DROP POLICY IF EXISTS "Venue owners read staff" ON public.venue_staff';
    EXECUTE 'CREATE POLICY "Venue owners read staff" ON public.venue_staff FOR SELECT TO authenticated USING (
      EXISTS (
        SELECT 1 FROM public.venues v
        WHERE v.id = venue_staff.venue_id
          AND v.owner_id = auth.uid()
      )
      OR auth.uid() = venue_staff.user_id
    )';
  END IF;
END $$;

-- ─── venue_details_cache: hide phone numbers from public ───
-- Advisor: "Venue details cache including phone numbers is publicly readable"
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'venue_details_cache') THEN
    EXECUTE 'ALTER TABLE public.venue_details_cache ENABLE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS "public can read venue details" ON public.venue_details_cache';
    EXECUTE 'DROP POLICY IF EXISTS "anyone can read venue details" ON public.venue_details_cache';
    EXECUTE 'DROP POLICY IF EXISTS "Authenticated can read venue details" ON public.venue_details_cache';
    EXECUTE 'CREATE POLICY "Authenticated can read venue details" ON public.venue_details_cache FOR SELECT TO authenticated USING (true)';
  END IF;
END $$;
