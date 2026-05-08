-- Public bucket for invite videos. Anyone can read; anonymous + authenticated users can upload up to 100MB.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('invite-videos', 'invite-videos', true, 104857600, ARRAY['video/mp4','video/quicktime','video/webm','video/ogg'])
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Public read for any object in the bucket
CREATE POLICY "invite-videos public read"
ON storage.objects FOR SELECT
USING (bucket_id = 'invite-videos');

-- Anyone (anon or authenticated) can upload to this bucket
CREATE POLICY "invite-videos public upload"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'invite-videos');