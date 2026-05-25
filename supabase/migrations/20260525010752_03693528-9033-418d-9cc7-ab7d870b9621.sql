
-- profiles: own profile update
DROP POLICY IF EXISTS "own profile update" ON public.profiles;
CREATE POLICY "own profile update" ON public.profiles
  FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- trips
DROP POLICY IF EXISTS "own trips update" ON public.trips;
CREATE POLICY "own trips update" ON public.trips
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- trip_days
DROP POLICY IF EXISTS "own trip days update" ON public.trip_days;
CREATE POLICY "own trip days update" ON public.trip_days
  FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.trips t WHERE t.id = trip_days.trip_id AND t.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.trips t WHERE t.id = trip_days.trip_id AND t.user_id = auth.uid()));

-- itinerary_stops
DROP POLICY IF EXISTS "own stops update" ON public.itinerary_stops;
CREATE POLICY "own stops update" ON public.itinerary_stops
  FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.itineraries i WHERE i.id = itinerary_stops.itinerary_id AND i.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.itineraries i WHERE i.id = itinerary_stops.itinerary_id AND i.user_id = auth.uid()));

-- push_subscriptions
DROP POLICY IF EXISTS "Users update own push subs" ON public.push_subscriptions;
CREATE POLICY "Users update own push subs" ON public.push_subscriptions
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- stop_color_assignments
DROP POLICY IF EXISTS "Users update their own stop colors" ON public.stop_color_assignments;
CREATE POLICY "Users update their own stop colors" ON public.stop_color_assignments
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- referrals
DROP POLICY IF EXISTS "own referrals update" ON public.referrals;
CREATE POLICY "own referrals update" ON public.referrals
  FOR UPDATE
  USING (auth.uid() = referrer_id OR auth.uid() = referee_id)
  WITH CHECK (auth.uid() = referrer_id OR auth.uid() = referee_id);

-- confetti_redemptions
DROP POLICY IF EXISTS "redemptions user or staff update" ON public.confetti_redemptions;
CREATE POLICY "redemptions user or staff update" ON public.confetti_redemptions
  FOR UPDATE
  USING (
    auth.uid() = user_id
    OR has_role(auth.uid(), 'admin'::app_role)
    OR EXISTS (SELECT 1 FROM public.advertisers a WHERE a.id = confetti_redemptions.advertiser_id AND a.owner_id = auth.uid())
  )
  WITH CHECK (
    auth.uid() = user_id
    OR has_role(auth.uid(), 'admin'::app_role)
    OR EXISTS (SELECT 1 FROM public.advertisers a WHERE a.id = confetti_redemptions.advertiser_id AND a.owner_id = auth.uid())
  );

-- boost_purchases
DROP POLICY IF EXISTS "boost purchases owner update" ON public.boost_purchases;
CREATE POLICY "boost purchases owner update" ON public.boost_purchases
  FOR UPDATE
  USING (
    has_role(auth.uid(), 'admin'::app_role)
    OR EXISTS (SELECT 1 FROM public.advertisers a WHERE a.id = boost_purchases.advertiser_id AND a.owner_id = auth.uid())
  )
  WITH CHECK (
    has_role(auth.uid(), 'admin'::app_role)
    OR EXISTS (SELECT 1 FROM public.advertisers a WHERE a.id = boost_purchases.advertiser_id AND a.owner_id = auth.uid())
  );

-- vendor_profiles
DROP POLICY IF EXISTS "Owners can update their own vendor profile" ON public.vendor_profiles;
CREATE POLICY "Owners can update their own vendor profile" ON public.vendor_profiles
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- venue_suggestions
DROP POLICY IF EXISTS "Venue owners update own suggestions" ON public.venue_suggestions;
CREATE POLICY "Venue owners update own suggestions" ON public.venue_suggestions
  FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.venues v WHERE v.id = venue_suggestions.venue_id AND v.claimed_by = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.venues v WHERE v.id = venue_suggestions.venue_id AND v.claimed_by = auth.uid()));

-- error_reports (admin-only update; lock with check)
DROP POLICY IF EXISTS "Admins can update error reports" ON public.error_reports;
CREATE POLICY "Admins can update error reports" ON public.error_reports
  FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
