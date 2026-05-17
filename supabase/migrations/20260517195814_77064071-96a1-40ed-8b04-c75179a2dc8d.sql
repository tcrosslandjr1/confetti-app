
ALTER TABLE public.venues
  ADD COLUMN IF NOT EXISTS official_photos text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS tiktok_thumbnails text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS instagram_thumbnails text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS hidden_media_urls text[] NOT NULL DEFAULT '{}';

INSERT INTO storage.buckets (id, name, public)
  VALUES ('venue-photos', 'venue-photos', true)
  ON CONFLICT (id) DO NOTHING;

-- Public read
DROP POLICY IF EXISTS "venue-photos public read" ON storage.objects;
CREATE POLICY "venue-photos public read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'venue-photos');

-- Insert: signed-in user who owns the venue (claimed_by) OR admin.
-- Path convention: <venueId>/<filename>
DROP POLICY IF EXISTS "venue-photos owner insert" ON storage.objects;
CREATE POLICY "venue-photos owner insert"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'venue-photos'
    AND (
      has_role(auth.uid(), 'admin'::app_role)
      OR EXISTS (
        SELECT 1 FROM public.venues v
        WHERE v.id::text = (storage.foldername(name))[1]
          AND v.claimed_by = auth.uid()
      )
    )
  );

DROP POLICY IF EXISTS "venue-photos owner update" ON storage.objects;
CREATE POLICY "venue-photos owner update"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'venue-photos'
    AND (
      has_role(auth.uid(), 'admin'::app_role)
      OR EXISTS (
        SELECT 1 FROM public.venues v
        WHERE v.id::text = (storage.foldername(name))[1]
          AND v.claimed_by = auth.uid()
      )
    )
  );

DROP POLICY IF EXISTS "venue-photos owner delete" ON storage.objects;
CREATE POLICY "venue-photos owner delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'venue-photos'
    AND (
      has_role(auth.uid(), 'admin'::app_role)
      OR EXISTS (
        SELECT 1 FROM public.venues v
        WHERE v.id::text = (storage.foldername(name))[1]
          AND v.claimed_by = auth.uid()
      )
    )
  );
