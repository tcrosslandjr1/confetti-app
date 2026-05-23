-- Migration: Consolidate profile_social_links -> linked_social_accounts
-- Safe to run multiple times (idempotent).

-- 1. Copy any Google/Apple rows from profile_social_links that aren't
--    already in linked_social_accounts.
INSERT INTO public.linked_social_accounts (
  user_id, provider, provider_user_id, username, display_name,
  avatar_url, created_at, updated_at
)
SELECT
  psl.user_id,
  psl.provider,
  COALESCE(psl.provider_user_id, 'unknown'),
  NULL,
  psl.metadata->>'name',
  psl.metadata->>'avatar_url',
  psl.connected_at,
  COALESCE(psl.last_used_at, psl.connected_at)
FROM public.profile_social_links psl
WHERE NOT EXISTS (
  SELECT 1 FROM public.linked_social_accounts lsa
  WHERE lsa.user_id = psl.user_id AND lsa.provider = psl.provider
)
ON CONFLICT (user_id, provider) DO NOTHING;

-- 2. Drop the old table (nothing reads it after the auth.ts patch).
DROP TABLE IF EXISTS public.profile_social_links CASCADE;

-- 3. Username availability RPC
CREATE OR REPLACE FUNCTION public.check_username_available(desired_username text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF desired_username IS NULL
     OR length(trim(desired_username)) < 3
     OR NOT (trim(desired_username) ~ '^[A-Za-z0-9_]{3,24}$')
  THEN
    RETURN false;
  END IF;

  RETURN NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE lower(username) = lower(trim(desired_username))
  );
END;
$$;

REVOKE ALL ON FUNCTION public.check_username_available(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.check_username_available(text) TO anon, authenticated;

-- 4. Referral code validation RPC
CREATE OR REPLACE FUNCTION public.check_referral_code(code_input text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  owner_name text;
BEGIN
  IF code_input IS NULL OR length(trim(code_input)) = 0 THEN
    RETURN jsonb_build_object('valid', false, 'reason', 'empty');
  END IF;

  SELECT p.full_name INTO owner_name
  FROM public.referral_codes rc
  JOIN public.profiles p ON p.id = rc.user_id
  WHERE rc.code = upper(trim(code_input));

  IF owner_name IS NULL THEN
    RETURN jsonb_build_object('valid', false, 'reason', 'not_found');
  END IF;

  RETURN jsonb_build_object('valid', true, 'referrer', owner_name);
END;
$$;

REVOKE ALL ON FUNCTION public.check_referral_code(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.check_referral_code(text) TO anon, authenticated;
