---
name: social-intelligence-tracker
description: >
  Build and operate Confetti's social intelligence pipeline — the system that discovers trending venues,
  tracks new openings, and scores buzz across 7+ platforms worldwide. Use this skill whenever the user
  asks to add trending detection, scan social media for venue buzz, track new restaurant/bar openings,
  build a social listening pipeline, set up the Trending Tracker admin page, wire scanning agents,
  implement buzz scoring, or anything related to discovering what's hot before the mainstream catches on.
  Also trigger on "trending", "buzz score", "social scanning", "new openings", "viral venues",
  "platform scanning", "TikTok trends", or "food trends".
---

# Social Intelligence Tracker — Confetti

Confetti's competitive edge is knowing what's hot *before* mainstream platforms surface it. This skill
covers the full pipeline: scanning social platforms for venue buzz, scoring and deduplicating discoveries,
feeding approved venues into the Confetti recommendation engine, and the admin UI to monitor it all.

## Architecture — 3 Layers

```
┌─────────────────────────────────────────────┐
│  Layer 1: Scanning Agents                   │
│  TikTok · Instagram · Reddit · YouTube      │
│  Google Trends · Yelp · Google Places        │
│  Cadence: 4-6h trends, daily new, weekly deep│
└──────────────┬──────────────────────────────┘
               ▼
┌─────────────────────────────────────────────┐
│  Layer 2: Scoring Engine                     │
│  Buzz Score (5 weighted factors)             │
│  Deduplication (fuzzy name + place_id + geo) │
│  Auto-approve rules (score ≥ 90, 3+ plats)  │
└──────────────┬──────────────────────────────┘
               ▼
┌─────────────────────────────────────────────┐
│  Layer 3: Feed Pipeline                      │
│  Supabase tables → Admin review UI           │
│  Approved venues → Recommendation Agent      │
│  Rejection tracking for dedup memory         │
└─────────────────────────────────────────────┘
```

## Platform Priority

| Platform       | Signal Type            | Weight | Scan Method                          |
|---------------|------------------------|--------|--------------------------------------|
| TikTok         | Viral venue content    | High   | Search API / hashtag scrape          |
| Instagram      | Tagged posts, Reels    | High   | Graph API / location search          |
| Reddit         | r/foodie, city subs    | Medium | Reddit API (free tier works)         |
| Google Trends  | Search interest spikes | Medium | Trends API / pytrends                |
| YouTube        | Food vlogger reviews   | Medium | YouTube Data API v3                  |
| Yelp           | New listings, reviews  | Low    | Fusion API                           |
| Google Places  | New place IDs, ratings | Low    | Places API (already in Confetti)     |

## Scan Cadence

The user's guidance: **"new places don't open every day but the agents can scan."** Don't over-scan.

| Scan Type       | Frequency    | Purpose                                      |
|----------------|-------------|-----------------------------------------------|
| Trend scan      | Every 4-6h  | Catch viral moments while they're still rising |
| New openings    | Daily        | Detect newly listed venues via Google Places / Yelp |
| Deep audit      | Weekly       | Full cross-platform reconciliation per city    |
| Dormant check   | Monthly      | Flag venues that dropped off all platforms     |

## Buzz Score Formula

Each discovered venue gets a **Buzz Score (0-100)** from 5 weighted factors:

```
buzzScore = (
  mentionVelocity   * 0.30 +   // mentions per hour, normalized
  crossPlatformPresence * 0.20 + // how many platforms mention it (0-1)
  engagementRate     * 0.20 +   // likes+comments / impressions
  creatorReach       * 0.15 +   // avg follower count of posters
  sentimentScore     * 0.15     // positive sentiment ratio (NLP)
) * 100
```

**Auto-approval rule:** buzzScore ≥ 90 AND platforms ≥ 3 AND Google Places verified → auto-add to Confetti.
Everything else goes to the admin review queue.

## Deduplication Logic

Venues surface from multiple platforms under different names. Deduplicate using:

1. **Google Place ID** — if two mentions resolve to the same place_id, merge
2. **Fuzzy name match** — Levenshtein distance ≤ 3 on normalized names (lowercase, strip "the", "restaurant", etc.)
3. **Geo proximity** — within 50m of an existing venue's lat/lng → likely the same place
4. **Phone number** — exact match on formatted phone

When merging, keep the highest buzz score and union all platform mentions.

## Supabase Schema

```sql
-- Trending venues discovered by scanning agents
CREATE TABLE trending_venues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  city TEXT NOT NULL,
  country TEXT DEFAULT 'US',
  category TEXT,  -- restaurant, bar, cafe, club, experience
  address TEXT,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  google_place_id TEXT,
  buzz_score NUMERIC(5,2) DEFAULT 0,
  mention_count INT DEFAULT 0,
  platforms TEXT[] DEFAULT '{}',  -- which platforms mention it
  trend TEXT DEFAULT 'rising',  -- viral, rising, steady, declining
  vibe_tags TEXT[] DEFAULT '{}',
  snippet TEXT,  -- best social media quote
  first_seen TIMESTAMPTZ DEFAULT now(),
  last_updated TIMESTAMPTZ DEFAULT now(),
  status TEXT DEFAULT 'pending',  -- pending, approved, rejected, auto_approved
  approved_at TIMESTAMPTZ,
  approved_by TEXT,
  confetti_venue_id UUID,  -- FK to main venues table once approved
  UNIQUE(google_place_id)
);

CREATE INDEX idx_trending_city ON trending_venues(city);
CREATE INDEX idx_trending_status ON trending_venues(status);
CREATE INDEX idx_trending_buzz ON trending_venues(buzz_score DESC);
CREATE INDEX idx_trending_first_seen ON trending_venues(first_seen DESC);

-- Individual social media mentions
CREATE TABLE social_mentions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trending_venue_id UUID REFERENCES trending_venues(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,  -- tiktok, instagram, reddit, youtube, google_trends, yelp, google_places
  post_url TEXT,
  post_id TEXT,
  creator_handle TEXT,
  creator_followers INT,
  engagement_likes INT DEFAULT 0,
  engagement_comments INT DEFAULT 0,
  engagement_shares INT DEFAULT 0,
  sentiment NUMERIC(3,2),  -- -1.0 to 1.0
  snippet TEXT,
  discovered_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_mentions_venue ON social_mentions(trending_venue_id);
CREATE INDEX idx_mentions_platform ON social_mentions(platform);
CREATE INDEX idx_mentions_discovered ON social_mentions(discovered_at DESC);

-- Scan run log for monitoring
CREATE TABLE scan_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  city TEXT NOT NULL,
  scan_type TEXT NOT NULL,  -- trend, new_opening, deep_audit, dormant_check
  platform TEXT,  -- null = multi-platform scan
  status TEXT DEFAULT 'running',  -- running, completed, failed
  venues_found INT DEFAULT 0,
  mentions_found INT DEFAULT 0,
  errors TEXT[] DEFAULT '{}',
  started_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  duration_ms INT
);

CREATE INDEX idx_scans_city ON scan_runs(city);
CREATE INDEX idx_scans_status ON scan_runs(status);
CREATE INDEX idx_scans_started ON scan_runs(started_at DESC);

-- Enable RLS
ALTER TABLE trending_venues ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_mentions ENABLE ROW LEVEL SECURITY;
ALTER TABLE scan_runs ENABLE ROW LEVEL SECURITY;

-- Service role can do everything (for Edge Functions / backend scripts)
CREATE POLICY "Service role full access" ON trending_venues FOR ALL
  USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access" ON social_mentions FOR ALL
  USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access" ON scan_runs FOR ALL
  USING (auth.role() = 'service_role');

-- Authenticated users can read (for admin UI)
CREATE POLICY "Authenticated read" ON trending_venues FOR SELECT
  USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated read" ON social_mentions FOR SELECT
  USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated read" ON scan_runs FOR SELECT
  USING (auth.role() = 'authenticated');
```

## Admin UI Pattern

The TrendingTracker component follows Confetti's admin-screen conventions:

- **Page wrapper**: `PageWrapper` with `adminMode` prop
- **Header**: eyebrow label + title + subtitle, left-aligned
- **KPI grid**: 4 cards (Trending count, New Openings, Social Mentions, Cities Live)
- **City filter**: dropdown filtering all tabs
- **4 segmented tabs**:
  1. **Trending Now** — venue cards with buzz scores, platform tags, trend badges
  2. **New Openings** — venue cards with "Add to Confetti" / "Dismiss" actions
  3. **Social Buzz** — platform breakdown bars + viral moments feed
  4. **Feed Pipeline** — AI agent status panel + per-city scan monitoring

### CSS status pill variants needed:
```css
.status-pill.viral  { color: #f72585; background: rgba(247,37,133,0.12); }
.status-pill.rising { color: #f5a623; background: rgba(245,166,35,0.12); }
.status-pill.steady { color: #6c63ff; background: rgba(108,99,255,0.12); }
.status-pill.new    { color: #10b981; background: rgba(16,185,129,0.12); }
```

## Scanning Agent Implementation

Each agent is a standalone async function that can run as a Supabase Edge Function or a Node.js script
triggered by cron. The pattern:

```typescript
async function scanPlatform(city: string, platform: string) {
  // 1. Log scan start
  const scanRun = await supabase.from('scan_runs').insert({
    city, scan_type: 'trend', platform, status: 'running'
  }).select().single();

  try {
    // 2. Call platform API / scrape
    const mentions = await fetchPlatformMentions(city, platform);

    // 3. For each mention, resolve to a venue
    for (const mention of mentions) {
      const venue = await resolveVenue(mention);  // dedup + Google Places lookup
      await upsertTrendingVenue(venue);
      await insertSocialMention(mention, venue.id);
    }

    // 4. Recalculate buzz scores for affected venues
    await recalculateBuzzScores(city);

    // 5. Auto-approve qualifying venues
    await autoApproveVenues(city);

    // 6. Log completion
    await supabase.from('scan_runs').update({
      status: 'completed',
      venues_found: uniqueVenues.length,
      mentions_found: mentions.length,
      completed_at: new Date().toISOString(),
      duration_ms: Date.now() - startTime
    }).eq('id', scanRun.id);

  } catch (error) {
    await supabase.from('scan_runs').update({
      status: 'failed',
      errors: [error.message],
      completed_at: new Date().toISOString()
    }).eq('id', scanRun.id);
  }
}
```

## Integration with Recommendation Agent

When a trending venue is approved (manually or auto), it should be inserted into the main `venues` table
that the Recommendation Agent uses. The bridge:

1. Trending venue approved → copy to `venues` table with `source: 'social_intelligence'`
2. Carry over `vibe_tags` from trending data as initial tags
3. Set `trending_boost: true` so the Recommendation Agent can prioritize it in "What's Hot" itineraries
4. After 30 days, remove the trending boost (the venue stands on its own merits)

## Implementation Options

### Option A: Supabase Edge Functions (recommended for Confetti)
- Deploy each scanner as a Deno Edge Function
- Use `pg_cron` extension for scheduling
- Stays within the Supabase ecosystem, no extra infra

### Option B: Node.js Scripts + Cron
- Standalone scripts in `scripts/social-intel/`
- Run via system cron, GitHub Actions, or Railway
- More flexibility for heavy scraping

### Option C: Schema + Manual Seeding
- Just deploy the database schema
- Manually seed trending data via admin UI
- Good starting point, upgrade to agents later

## Cities Coverage

Start with the 55 Confetti launch cities (same list used for venue seeding). Prioritize the top 10 by
scan frequency:

1. Washington DC, 2. New York, 3. Los Angeles, 4. Miami, 5. Chicago,
6. Atlanta, 7. Houston, 8. Dallas, 9. San Francisco, 10. Las Vegas

Remaining cities get daily scans only (no 4-6h trend scanning) until volume justifies it.
