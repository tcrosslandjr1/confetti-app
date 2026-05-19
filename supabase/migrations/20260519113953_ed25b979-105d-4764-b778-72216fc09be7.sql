-- 1) Remove self-issuable Confetti credit grants
DROP POLICY IF EXISTS "grants user insert" ON public.confetti_grants;

-- 2) Remove blanket authenticated read on referral_codes (own-code-read remains)
DROP POLICY IF EXISTS "auth code lookup" ON public.referral_codes;

-- 3) Hide venues.staff_email from anon (admins/owners still authorized via app + admin client)
REVOKE SELECT (staff_email) ON public.venues FROM anon;

-- 4) Hide venue_details_cache.raw from anon and authenticated clients (server-only)
REVOKE SELECT (raw) ON public.venue_details_cache FROM anon, authenticated;