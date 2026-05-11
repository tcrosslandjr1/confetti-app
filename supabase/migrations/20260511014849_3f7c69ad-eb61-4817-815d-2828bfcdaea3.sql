
-- Trigger-only functions: no one should call these from the API
REVOKE EXECUTE ON FUNCTION public.handle_new_user_role() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_referral_on_booking() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_on_new_booking() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_profile_referral() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_referral_on_signup() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.grant_referral_achievements() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.gen_referral_code() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.touch_itineraries_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.touch_linked_social_accounts_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.touch_oauth_credential_submissions_updated_at() FROM PUBLIC, anon, authenticated;

-- has_role is used inside RLS policies; authenticated users must still execute it.
-- Revoke from PUBLIC (anon) since no anon-evaluated policy depends on it.
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;

-- Leaderboard RPC: signed-in users only
REVOKE EXECUTE ON FUNCTION public.referral_leaderboard(integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.referral_leaderboard(integer) TO authenticated;
