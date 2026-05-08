-- Public buckets serve files via public URL without needing a SELECT RLS policy.
-- Removing the broad SELECT policy prevents anonymous listing of all uploads.
DROP POLICY IF EXISTS "invite-videos public read" ON storage.objects;