
-- venues: revoke table-level SELECT from anon, re-grant on all non-sensitive columns
REVOKE SELECT ON public.venues FROM anon;
GRANT SELECT (
  id, name, category, neighborhood, city, price_level, description, image_url, created_at,
  advertiser_id, verified, featured, featured_until, website, claimed_by, claim_status, place_id,
  gallery_urls, gallery_refreshed_at, tiktok_url, tiktok_handle, instagram_url, instagram_handle,
  socials_refreshed_at, hero_image_url, google_images, google_maps_url, tags, rating, price_band,
  is_sponsored, tiktok_hashtags, instagram_hashtags, tiktok_location_tag, instagram_location_tag,
  sponsored_boost_level, promotion_approved, official_photos, tiktok_thumbnails, instagram_thumbnails,
  hidden_media_urls, trending_score, trending_refreshed_at, boost_until, boost_tier, boost_sku,
  active, published, state, partner_tier, booking_url, order_ahead_url, menu_url, phone, maps_url,
  supports_in_app_booking, supports_in_app_order_ahead, supports_live_inventory,
  supports_instant_confirm, supports_pos_sync, supports_group_booking, max_party_size, specials
) ON public.venues TO anon;

-- venue_details_cache: revoke table SELECT from anon + authenticated, re-grant on non-raw columns
DO $$
DECLARE
  cols text;
BEGIN
  SELECT string_agg(quote_ident(column_name), ', ')
    INTO cols
  FROM information_schema.columns
  WHERE table_schema='public' AND table_name='venue_details_cache' AND column_name <> 'raw';

  EXECUTE 'REVOKE SELECT ON public.venue_details_cache FROM anon, authenticated';
  EXECUTE format('GRANT SELECT (%s) ON public.venue_details_cache TO anon, authenticated', cols);
END $$;
