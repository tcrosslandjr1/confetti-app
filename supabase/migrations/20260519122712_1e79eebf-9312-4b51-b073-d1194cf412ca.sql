
-- 1. linked_social_accounts: hide tokens from client
REVOKE SELECT (access_token, refresh_token) ON public.linked_social_accounts FROM anon, authenticated;

-- 2. oauth_credential_submissions: hide secrets from client
REVOKE SELECT (client_secret, client_id) ON public.oauth_credential_submissions FROM anon, authenticated;

-- 3. venue_details_cache: hide raw payload from public
REVOKE SELECT (raw) ON public.venue_details_cache FROM anon, authenticated;

-- 4. venues: hide staff_email from public
REVOKE SELECT (staff_email) ON public.venues FROM anon, authenticated;

-- 5. promoters: hide stripe_account_id and admin_notes from public
REVOKE SELECT (stripe_account_id, admin_notes) ON public.promoters FROM anon, authenticated;

-- 6. referrals: hide referee_email from client
REVOKE SELECT (referee_email) ON public.referrals FROM anon, authenticated;

-- 7. Fix venue-photos storage policies (was referencing v.name instead of storage object name)
DROP POLICY IF EXISTS "venue-photos owner insert" ON storage.objects;
DROP POLICY IF EXISTS "venue-photos owner update" ON storage.objects;
DROP POLICY IF EXISTS "venue-photos owner delete" ON storage.objects;

CREATE POLICY "venue-photos owner insert"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'venue-photos'
  AND (
    has_role(auth.uid(), 'admin'::app_role)
    OR EXISTS (
      SELECT 1 FROM public.venues v
      WHERE (v.id)::text = (storage.foldername(storage.objects.name))[1]
        AND v.claimed_by = auth.uid()
    )
  )
);

CREATE POLICY "venue-photos owner update"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'venue-photos'
  AND (
    has_role(auth.uid(), 'admin'::app_role)
    OR EXISTS (
      SELECT 1 FROM public.venues v
      WHERE (v.id)::text = (storage.foldername(storage.objects.name))[1]
        AND v.claimed_by = auth.uid()
    )
  )
);

CREATE POLICY "venue-photos owner delete"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'venue-photos'
  AND (
    has_role(auth.uid(), 'admin'::app_role)
    OR EXISTS (
      SELECT 1 FROM public.venues v
      WHERE (v.id)::text = (storage.foldername(storage.objects.name))[1]
        AND v.claimed_by = auth.uid()
    )
  )
);
