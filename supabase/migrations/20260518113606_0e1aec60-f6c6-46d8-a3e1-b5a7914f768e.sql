
-- 1) Restrict invite-videos storage uploads to authenticated users uploading under their own uid folder.
DROP POLICY IF EXISTS "invite-videos public upload" ON storage.objects;
CREATE POLICY "invite-videos auth upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'invite-videos'
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 2) Restrict referral_codes public lookup: require authenticated user.
DROP POLICY IF EXISTS "public code lookup" ON public.referral_codes;
CREATE POLICY "auth code lookup"
ON public.referral_codes FOR SELECT
TO authenticated
USING (true);

-- 3) Hide staff_email on venues from anon and authenticated roles (admins read via service role).
REVOKE SELECT (staff_email) ON public.venues FROM anon, authenticated;
