
-- 1. linked_social_accounts: hide sensitive token columns from API
REVOKE SELECT ON public.linked_social_accounts FROM anon, authenticated;
GRANT SELECT (
  id, user_id, provider, provider_user_id,
  username, display_name, avatar_url,
  created_at, updated_at
) ON public.linked_social_accounts TO authenticated;

-- 2. oauth_credential_submissions: hide client_secret from API readers
REVOKE SELECT ON public.oauth_credential_submissions FROM anon, authenticated;
GRANT SELECT (
  id, user_id, provider, status, client_id,
  callback_url, notes, review_notes,
  created_at, updated_at, reviewed_at, reviewed_by
) ON public.oauth_credential_submissions TO authenticated;

-- 3. corporate_attendees: hide rsvp_token from API readers (RSVP lookup uses SECURITY DEFINER RPC)
REVOKE SELECT ON public.corporate_attendees FROM anon, authenticated;
GRANT SELECT (
  id, event_id, email, name, rsvp_status, dietary,
  responded_at, created_at, updated_at
) ON public.corporate_attendees TO authenticated;

-- 4. booking_status_changes: explicit admin-only write policies
-- (insertion via trigger uses SECURITY DEFINER which bypasses RLS)
DROP POLICY IF EXISTS "Admins manage booking status changes insert" ON public.booking_status_changes;
DROP POLICY IF EXISTS "Admins manage booking status changes update" ON public.booking_status_changes;
DROP POLICY IF EXISTS "Admins manage booking status changes delete" ON public.booking_status_changes;

CREATE POLICY "Admins manage booking status changes insert"
ON public.booking_status_changes FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins manage booking status changes update"
ON public.booking_status_changes FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins manage booking status changes delete"
ON public.booking_status_changes FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));
