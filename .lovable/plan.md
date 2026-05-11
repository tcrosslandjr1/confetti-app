
# Viral Venue Discovery Pipeline

A daily-refreshed feed of "what's trending right now" venues per city, surfaced with AI-generated tags (TikTok Viral, Hidden Gem, Date Night Favorite, etc.), driven by web search rather than direct social scraping.

---

## Architecture

```text
[pg_cron daily] → [discover-viral fn]
                    ├─ Firecrawl.search × N queries per city
                    ├─ Lovable AI (Gemini) → extract venue candidates + context
                    ├─ Google Places verify (existing edge fn) → canonical name/address/photos
                    ├─ Score (mentions × recency × authority × rating)
                    └─ Upsert into `viral_venues` table

[/portal Viral Now widget] + [/viral page]
                    └─ read top N from `viral_venues` for user's city
```

---

## 1. Database (one new table + cache)

`viral_venues` — one row per (city, venue) pair, refreshed daily.

Columns (domain-specific):
- city, venue_name, normalized_name (for dedupe)
- google_place_id, address, neighborhood, lat, lng, photo_url
- trend_score (numeric), tags (text[]) — e.g. `{tiktok_viral, hidden_gem, date_night}`
- mention_count, last_mentioned_at, source_urls (jsonb), summary (text — why it's trending)
- discovered_at, refreshed_at

Access rules (plain English):
- Anyone signed in can read.
- Only the discovery function (service role) can write.

`viral_discovery_runs` — log table: city, started_at, finished_at, queries_run, venues_found, error.

## 2. Connector + secrets

- Link **Firecrawl** connector via `standard_connectors--connect`.
- Reuses existing `LOVABLE_API_KEY` and `GOOGLE_PLACES_API_KEY`.

## 3. Discovery server route

`src/routes/api/public/hooks/discover-viral.ts` (POST, gated by `apikey` header = anon key).

Body: `{ city: "Washington DC" }` (optional — defaults to all cities with users).

Steps:
1. **Search** — Firecrawl `search()` for ~6 queries per city:
   - `TikTok restaurants {city}`
   - `viral food spots {city}`
   - `Instagrammable places {city}`
   - `best date night spots {city} TikTok`
   - `hidden gems {city} Instagram`
   - `things to do {city} this weekend TikTok`
   Use `tbs: 'qdr:m'` (last month) for recency, `limit: 10`, with `scrapeOptions: { formats: ['markdown'] }`.
2. **Extract** — Feed concatenated snippets/markdown to Gemini with `Output.array` schema:
   ```ts
   { name, neighborhood?, why_trending, source_query, signals: ['tiktok'|'instagram'|'press'] }
   ```
3. **Dedupe + verify** — normalize names, batch-call existing `google-places` edge fn to get canonical name, address, photo, place_id.
4. **Score**:
   ```ts
   trendScore =
     0.30 * tiktokMentions
   + 0.25 * instagramMentions
   + 0.20 * recencyBoost   // 1.0 if mentioned <7d, decay to 0.2 at 30d
   + 0.10 * sourceAuthority // listicle/blog domain weight
   + 0.10 * (placeRating - 3.5)
   + 0.05 * appEngagement   // saves/views in our app, 0 for now
   ```
5. **Tag** — Gemini second call assigns 1–3 tags from a fixed vocabulary:
   `tiktok_viral, instagrammable, hidden_gem, creator_mentioned, trending_this_week, date_night, foodie_hype, photo_op, worth_the_wait`.
6. **Upsert** with `supabaseAdmin` into `viral_venues` (on conflict on `(city, normalized_name)` → bump mention_count, refresh score/tags/sources).
7. Insert run log.

Returns `{ city, venuesFound, venuesUpserted, durationMs }`.

## 4. Daily cron

`pg_cron` job `discover-viral-daily` at 06:00 UTC → POST `/api/public/hooks/discover-viral` with empty body, anon key in `apikey` header.

## 5. UI

**`src/components/ViralNow.tsx`** — horizontal scroll of top 8 viral cards for the user's city.
- Card: hero photo (Google), venue name, neighborhood pill, top tag chip with icon + color, `trend_score` flame indicator, "why it's trending" one-liner, tap → `/venues/{place_id}` or save action.
- Empty state: "Spinning up the trend radar for {city}…"

**Mounted in `src/routes/portal.index.tsx`** above existing CTAs.

**`src/routes/viral.tsx`** — full page, filterable by tag chips, sortable by trend_score / recency.

**Tag chip component** — colored pill mapping each tag to icon (Flame for tiktok_viral, Camera for instagrammable, Sparkles for hidden_gem, etc.) + hsl token from styles.css.

## 6. Admin

Add a "Refresh viral feed" button in `/admin/integrations` that POSTs to the same route with a chosen city. Surfaces last run from `viral_discovery_runs`.

---

## Technical notes

- All AI/Firecrawl calls in the route handler — never the client.
- Use `Output.array` (AI SDK) for schema-safe extraction; cap `stopWhen(stepCountIs(50))` if tools are added later.
- Firecrawl `tbs: 'qdr:w'` for "trending this week" tag eligibility.
- Cache photos via existing `GooglePhotos` component (sessionStorage Map already in place).
- Budget guard: hard cap ~6 queries × 10 results × cities per run; log Firecrawl credit usage from response.
- Failure modes: Firecrawl 402 → log + skip; Places miss → keep candidate but flag `verified=false`, exclude from UI by default.

## Files

**Created**
- `supabase/migrations/...` — `viral_venues`, `viral_discovery_runs`, RLS, indexes
- `src/routes/api/public/hooks/discover-viral.ts`
- `src/lib/viral-scoring.server.ts` (pure scoring helper)
- `src/components/ViralNow.tsx`, `src/components/ViralTagChip.tsx`
- `src/routes/viral.tsx`

**Edited**
- `src/routes/portal.index.tsx` (mount ViralNow)
- `src/routes/admin.integrations.tsx` (manual refresh + run log)
- `src/routeTree.gen.ts` (auto)

## Order of work

1. Migration (tables + RLS).
2. Link Firecrawl connector.
3. Discovery route + scoring helper.
4. Manual test with `curl_edge_functions` for DC; verify rows + scores.
5. UI: ViralNow widget + portal mount.
6. /viral page + tag filters.
7. Cron job.
8. Admin refresh button + run log.

## Out of scope (next iteration)

- Direct TikTok/Instagram Graph APIs (requires app review).
- Per-user personalization of trend feed (filter by their taste later).
- Creator authority weighting (needs a curated allowlist of domains/handles).
- App engagement signal (will populate once `viral_venue_events` exists).
