
-- 1. Fix function search_path
ALTER FUNCTION public.touch_oauth_credential_submissions_updated_at() SET search_path = public;

-- 2. Move pg_net out of public (drop + recreate in extensions schema)
CREATE SCHEMA IF NOT EXISTS extensions;
DROP EXTENSION IF EXISTS pg_net;
CREATE EXTENSION pg_net WITH SCHEMA extensions;

-- 3. Tighten permissive INSERT policies
DROP POLICY IF EXISTS "Anyone can insert analytics events" ON public.analytics_events;
CREATE POLICY "Anyone can insert analytics events"
  ON public.analytics_events FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    event_name <> ''
    AND event_type <> ''
    AND session_id <> ''
    AND path <> ''
  );

DROP POLICY IF EXISTS "pick_events anyone insert" ON public.pick_events;
CREATE POLICY "pick_events anyone insert"
  ON public.pick_events FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    pick_id <> ''
    AND name <> ''
  );

-- 4. Stop public listing of venue-photos
DROP POLICY IF EXISTS "venue-photos public read" ON storage.objects;

-- 5. Lock down SECURITY DEFINER function execute privileges
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.blocked_place_ids_for_city(text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_attendee_by_token(text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.record_rsvp_by_token(text, text, text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.referral_leaderboard(integer) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user_role() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_profile_referral() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_referral_on_signup() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_referral_on_booking() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.grant_referral_achievements() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_on_new_booking() FROM PUBLIC, anon, authenticated;

-- Grant back only the client-facing helpers
GRANT EXECUTE ON FUNCTION public.get_attendee_by_token(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.record_rsvp_by_token(text, text, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.referral_leaderboard(integer) TO authenticated;
