
# Monthly Venue Media Refresh + Social Buttons + Reels Drawer

## What ships

A single cohesive feature: every venue gets fresh photos and TikTok/Instagram links, refreshed monthly by a background job. The venue detail page shows a hero, a tappable photo gallery, a row of social buttons (Website · Maps · TikTok · Instagram), and a Reels bottom-sheet drawer that previews social posts and deep-links to the native apps.

## Database (one migration)

Add columns to `public.venues`:
- `place_id text` — Google Places ID (for Place Photos endpoint)
- `gallery_urls jsonb default '[]'` — array of `{ url, source, attribution? }`
- `tiktok_url text`, `tiktok_handle text`
- `instagram_url text`, `instagram_handle text`
- `socials_refreshed_at timestamptz`
- `gallery_refreshed_at timestamptz`

New table `public.venue_media_refresh_runs` for audit:
- `started_at`, `finished_at`, `venues_processed int`, `photos_added int`, `socials_found int`, `errors jsonb`, `trigger text` ('cron' | 'manual')

RLS: admins only for `venue_media_refresh_runs`; public read of the new venue columns inherits the existing `venues public read` policy.

## Server

- `src/lib/venue-media.server.ts` — pure helpers (server-only):
  - `fetchPlacePhotos(placeId, maxN=8)` — calls Google Place Details + Place Photos URLs using existing `GOOGLE_PLACES_API_KEY`. No CSE needed.
  - `findPlaceId(name, city)` — Find Place From Text fallback when `place_id` is null.
  - `discoverSocials(name, city, website)` — uses Firecrawl SDK `search()` for `site:tiktok.com {name} {city}` and `site:instagram.com {name} {city}`, picks the top profile URL, extracts the handle.
- `src/lib/venue-media.functions.ts`:
  - `refreshVenueMedia({ venueId })` server fn (admin-only via middleware) — refreshes one venue.
  - `triggerBulkRefresh()` admin server fn — kicks off a run synchronously for ~50 venues at a time.
- `src/routes/api/public/hooks/refresh-venue-media.ts` — POST hook for pg_cron (validates `apikey` header against `SUPABASE_ANON_KEY`). Processes up to N venues whose `gallery_refreshed_at < now() - 30 days` or `null`, logs to `venue_media_refresh_runs`.
- Install `@mendable/firecrawl-js` and link the existing `OneFrame Fire Wall` Firecrawl connection to the project.

## Cron

Single monthly job via `pg_cron` + `pg_net`, scheduled `0 3 1 * *` (1st of each month, 3am UTC), calls the public hook with `apikey` header.

## Frontend

- `src/components/venue/VenueSocialButtons.tsx` — pill row with 4 circular icon buttons (Globe / MapPin / TikTok logo / Instagram logo). Hidden when both socials are missing. Each button uses `trackCta()`. TikTok/IG buttons try `tiktok://` / `instagram://` deep links and fall back to `https://` after 250ms.
- `src/components/venue/VenueGallery.tsx` — horizontal snap-scroll thumbnails; tap opens a full-screen lightbox (Dialog) with swipe. Falls back to existing `<GooglePhotos>` when gallery is empty.
- `src/components/venue/ReelsDrawer.tsx` — `shadcn/ui` Drawer that opens from the bottom showing TikTok + Instagram profile cards (live thumbnail via oEmbed if available, otherwise a brand-tinted placeholder card). Each card opens the native app/site.
- Integrate all three into `src/routes/venue.$id.tsx` Step 1 (hero now sources from `gallery_urls[0] || image_url || GooglePhotos`).

## Admin

Add a "Refresh media" button to `/admin/venues` row actions calling `refreshVenueMedia({ venueId })`, plus a "Run monthly refresh now" button at the top calling `triggerBulkRefresh()`. Surface `venue_media_refresh_runs` in a small history table below.

## Out of scope (explicit)

- No user-submitted photos (mentioned as "future" by the user).
- No TikTok/IG Graph API integration — public profile discovery only, via Firecrawl.
- No per-user OAuth into the user's personal TikTok/IG.

## Order of work

1. Migration (one batch).
2. Link Firecrawl connection + `bun add @mendable/firecrawl-js`.
3. `venue-media.server.ts` + `.functions.ts` + cron hook.
4. Schedule pg_cron job.
5. Frontend components + integration into `venue.$id.tsx`.
6. Admin controls.
7. Smoke-test one venue end-to-end via the admin "Refresh media" button.

## Technical notes

- TikTok deep link: `snssdk1233://user/profile/{handle}` is unreliable; we use `https://www.tiktok.com/@{handle}` which the TikTok app intercepts on mobile.
- Instagram: `https://www.instagram.com/{handle}/` likewise intercepted.
- Google Place Photos URL pattern: `https://maps.googleapis.com/maps/api/place/photo?maxwidth=1200&photo_reference={ref}&key={key}` — we resolve to the redirect URL and store that (Google rotates the underlying CDN URL but the photo_reference URL keeps working until refreshed).
- Firecrawl `search` is the right primitive (not `scrape`) — one credit per query, returns top results without scraping each profile page.
