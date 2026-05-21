-- Create venue-guides storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('venue-guides', 'venue-guides', true)
ON CONFLICT (id) DO NOTHING;

-- Public read access for venue-guides
CREATE POLICY "Anyone can read venue guides"
ON storage.objects
FOR SELECT
USING (bucket_id = 'venue-guides');

-- Only authenticated users can upload
CREATE POLICY "Authenticated users can upload venue guides"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'venue-guides');