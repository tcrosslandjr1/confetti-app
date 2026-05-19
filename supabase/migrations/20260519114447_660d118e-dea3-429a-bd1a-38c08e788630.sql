
-- 1. Re-revoke sensitive column SELECT (column-level grants exist independent of RLS)
REVOKE SELECT (staff_email) ON public.venues FROM anon;
REVOKE SELECT (raw) ON public.venue_details_cache FROM anon, authenticated;

-- 2. Drop client UPDATE/INSERT policies on advertiser balances — server-side only via service role
DROP POLICY IF EXISTS "advertiser balance owner update" ON public.advertiser_confetti_balances;
DROP POLICY IF EXISTS "advertiser balance owner upsert" ON public.advertiser_confetti_balances;

-- 3. Fix venue-photos storage policies: v.name -> name (storage object path)
DROP POLICY IF EXISTS "venue-photos owner insert" ON storage.objects;
DROP POLICY IF EXISTS "venue-photos owner update" ON storage.objects;
DROP POLICY IF EXISTS "venue-photos owner delete" ON storage.objects;

CREATE POLICY "venue-photos owner insert" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'venue-photos' AND (
    public.has_role(auth.uid(), 'admin'::public.app_role) OR EXISTS (
      SELECT 1 FROM public.venues v
      WHERE v.id::text = (storage.foldername(name))[1]
        AND v.claimed_by = auth.uid()
    )
  )
);

CREATE POLICY "venue-photos owner update" ON storage.objects
FOR UPDATE TO authenticated
USING (
  bucket_id = 'venue-photos' AND (
    public.has_role(auth.uid(), 'admin'::public.app_role) OR EXISTS (
      SELECT 1 FROM public.venues v
      WHERE v.id::text = (storage.foldername(name))[1]
        AND v.claimed_by = auth.uid()
    )
  )
);

CREATE POLICY "venue-photos owner delete" ON storage.objects
FOR DELETE TO authenticated
USING (
  bucket_id = 'venue-photos' AND (
    public.has_role(auth.uid(), 'admin'::public.app_role) OR EXISTS (
      SELECT 1 FROM public.venues v
      WHERE v.id::text = (storage.foldername(name))[1]
        AND v.claimed_by = auth.uid()
    )
  )
);

-- 4. Revoke EXECUTE on mutating SECURITY DEFINER helpers — server-only
REVOKE EXECUTE ON FUNCTION public.award_confetti_pts(uuid, integer, text, text) FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.activate_boost(text, uuid, interval, text, text) FROM anon, authenticated, PUBLIC;

-- 5. Realtime: restrict channel subscriptions to user-scoped topics
ALTER TABLE IF EXISTS realtime.messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "authenticated users can subscribe own channels" ON realtime.messages;
CREATE POLICY "authenticated users can subscribe own channels" ON realtime.messages
FOR SELECT TO authenticated
USING (
  topic = 'notifications:' || auth.uid()::text
  OR topic LIKE 'public:%'
);
