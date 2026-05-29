# Confetti — Content Intelligence Agent: Corrected Architecture Spec
> Version 2.0 · Published 2026-05-28 · Replaces Copilot draft v1

---

## Why This Document Exists

The Copilot-generated Content Intelligence Agent design had three category-level gaps that would have produced poor recommendation quality and unmeasurable engagement:

1. **Flat hashtag buckets instead of a vector knowledge graph** — single vibe labels can't blend vibes or measure similarity; a float-score vector per vibe is required.
2. **No feedback loop** — `user_behavior_events` and `pick_signals` were being written to Supabase but never read back into recommendation reranking.
3. **No business proof layer** — engagement existed in the DB but was never surfaced to venue partners as a measurable traffic-routing metric.

This document specifies the corrected architecture, the exact changes required, and the data contracts between every layer.

---

## System Overview

```
Social Signals          User Behavior           Venue Data
     │                       │                      │
     ▼                       ▼                      ▼
Social Trend          Interaction Tracker      Venue Intel
Scraper (Bright       (user_behavior_events    Edge Function
Data SERP)            + pick_signals)          (on-demand)
     │                       │                      │
     └──────────────┬─────────┘                    │
                    ▼                              │
         Knowledge Graph                          │
         (pgvector + TTL)  ◄─────────────────────┘
                    │
                    ▼
         Taste Graph Engine
         (per-user + group merge)
                    │
                    ▼
         Recommendation Engine            ◄── Venue Quality Score
         (ai-recommend edge fn)                  (rolling 30d)
                    │
                    ▼
         Pre-flight Validator
         (open? available? seasonal?)
                    │
                    ▼
         Progressive Reveal
         (boarding pass → next stop on check-in)
                    │
                    ▼
         QR Check-in Attribution  ──────────► attribution_events
                    │                              │
                    ▼                              ▼
         Morning After Recap              Venue Proof Dashboard
         (rate-your-night cron)           (B2B: verified visits,
                    │                     spend tier, return rate,
                    └────────────────────► social amplification)
                                                   │
                                                   ▼
                                          Feedback → Reranking
                                          (quality score update)
```

---

## Layer 1 — Knowledge Graph

### Problem with the Copilot design
Hashtags were stored as flat JSON arrays bucketed by a single vibe label. This means:
- A venue can only belong to one vibe
- Similarity between vibes can't be computed
- Trending hashtags never expire

### Corrected schema

```sql
-- Vector-based knowledge graph entry
CREATE TABLE knowledge_graph_entries (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  city        TEXT NOT NULL,                    -- 'dc', 'nyc', 'la', etc.
  entity_type TEXT NOT NULL,                    -- 'hashtag', 'neighborhood', 'venue_signal'
  entity_key  TEXT NOT NULL,                    -- '#rooftopvibes', 'Adams Morgan', 'U Street'
  
  -- Vibe scores: float 0.0–1.0 per dimension (not a single label)
  vibe_chill       REAL DEFAULT 0.0,
  vibe_luxury      REAL DEFAULT 0.0,
  vibe_turn_up     REAL DEFAULT 0.0,
  vibe_artsy       REAL DEFAULT 0.0,
  vibe_waterfront  REAL DEFAULT 0.0,
  vibe_romantic    REAL DEFAULT 0.0,
  vibe_family      REAL DEFAULT 0.0,
  vibe_brunch      REAL DEFAULT 0.0,
  
  -- Vector embedding for semantic similarity search
  embedding   VECTOR(1536),                     -- text-embedding-3-small
  
  -- Temporal dimension
  time_morning   REAL DEFAULT 0.0,              -- 6am–11am affinity
  time_afternoon REAL DEFAULT 0.0,              -- 11am–5pm affinity
  time_evening   REAL DEFAULT 0.0,              -- 5pm–9pm affinity
  time_late      REAL DEFAULT 0.0,              -- 9pm–close affinity
  day_weekday    REAL DEFAULT 0.0,
  day_weekend    REAL DEFAULT 0.0,
  
  -- Source and quality
  source         TEXT,                          -- 'social_scrape', 'user_behavior', 'manual'
  confidence     REAL DEFAULT 0.5,
  engagement_score REAL DEFAULT 0.0,
  
  -- TTL by type
  -- trending hashtag: 6h, neighborhood: 90d, venue signal: 7d
  expires_at  TIMESTAMPTZ,
  
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(city, entity_type, entity_key)
);

CREATE INDEX ON knowledge_graph_entries USING ivfflat (embedding vector_cosine_ops);
CREATE INDEX ON knowledge_graph_entries (city, entity_type, expires_at);
```

### TTL by entity type

| Entity Type | TTL | Rationale |
|---|---|---|
| Trending hashtag | 6 hours | TikTok trends die overnight |
| Instagram signal | 24 hours | Content cycle shorter than venues |
| Neighborhood vibe | 90 days | Neighborhoods shift seasonally |
| Venue category signal | 7 days | Events/specials change weekly |
| User taste node | 30 days | Preferences drift slowly |

### Three-tier hashtag taxonomy

| Tier | Purpose | Used In Recommendations? |
|---|---|---|
| **Brand** | Confetti-owned hashtags | Yes — discovery boosting |
| **Discovery** | Geo/vibe hashtags pulled from social | Yes — primary signal |
| **Distribution** | Reach-only (high-volume generic) | **No** — never in rec logic |

Distribution tags (e.g., `#food`, `#nightlife`, `#DC`) exist solely for social reach and must be filtered out before writing knowledge graph entries.

---

## Layer 2 — Taste Graph Engine

### Per-user taste graph

The `social-learn` edge function already extracts taste signals from pasted social content. These signals should populate a `user_taste_graphs` table with vector embeddings, not just JSON fields.

```sql
CREATE TABLE user_taste_graphs (
  user_id     UUID REFERENCES auth.users(id),
  
  -- Vibe affinity scores (mirrors knowledge graph dimensions)
  vibe_chill       REAL DEFAULT 0.0,
  vibe_luxury      REAL DEFAULT 0.0,
  vibe_turn_up     REAL DEFAULT 0.0,
  vibe_artsy       REAL DEFAULT 0.0,
  vibe_waterfront  REAL DEFAULT 0.0,
  vibe_romantic    REAL DEFAULT 0.0,
  vibe_family      REAL DEFAULT 0.0,
  vibe_brunch      REAL DEFAULT 0.0,
  
  -- Derived from behavior, not just self-report
  behavior_derived BOOLEAN DEFAULT FALSE,
  
  -- Vector for similarity matching
  taste_vector    VECTOR(1536),
  
  -- Metadata
  data_points     INTEGER DEFAULT 0,           -- events that built this profile
  last_updated    TIMESTAMPTZ DEFAULT NOW(),
  
  PRIMARY KEY (user_id)
);
```

### Group taste merge (Party Room)

The `project_group_taste_graph` architecture (Vibe Vote + conflict resolution + satisfaction scoring) already exists. The merge engine should compute a group vector as a weighted average of individual taste vectors:

```
group_vibe_score[dimension] = Σ(user_vibe_score[dimension] × weight[user]) / Σ(weight)
```

Where `weight` is the user's `data_points` (more behavior data = more trusted taste profile).

---

## Layer 3 — Recommendation Engine

### Pre-flight validation (CRITICAL — currently missing)

Every recommended venue must pass pre-flight checks before being included in an itinerary:

```typescript
interface PreflightCheck {
  venueId: string;
  checks: {
    isOpen: boolean;                // Hours API or venue_intel data
    hasCapacity: boolean;           // Not fully booked (where API available)
    reservationRequired: boolean;   // Surface as warning, not blocker
    isSeasonal: boolean;            // Operating in current month
    hasRecentIntel: boolean;        // venue_intel updated within 7 days
  };
  passedAt: string;                 // ISO timestamp — cache result for 15min
}
```

If `isOpen === false` or `isSeasonal === false`, the venue is filtered from results.
If `reservationRequired === true`, the boarding pass shows a "Reservations recommended" badge.

### Temporal dimension

Recommendations must be time-aware:

```typescript
interface RecommendationContext {
  userId: string;
  groupId?: string;
  cityCode: string;
  occasion?: string;
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'late';  // REQUIRED
  dayOfWeek: 'weekday' | 'weekend';                          // REQUIRED
  // ... existing fields
}
```

The recommendation engine scores venues by multiplying the venue's temporal affinity scores against the current time slot — a "late night" venue gets penalized if it's 2pm Sunday.

### Venue quality score (currently disconnected — see Layer 5)

The `ai-recommend` edge function should read `venue_quality_scores` and use them as a reranking multiplier:

```
final_score = base_score × (0.7 + 0.3 × quality_score)
```

Where `quality_score` is 0.0–1.0 from the Venue Quality Score Engine (Layer 5).

---

## Layer 4 — Progressive Reveal & Attribution

### Progressive reveal mechanic

The boarding pass should NOT show all stops upfront. Show:
- Stop 1: full detail
- Stops 2+: blurred with "Reveal on check-in" overlay

On QR check-in at Stop 1:
1. Write `attribution_events` record (see below)
2. Award gamification points
3. Unlock Stop 2 detail

This creates natural check-in behavior for attribution without requiring users to manually log anything.

### Attribution events schema

```sql
CREATE TABLE attribution_events (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  itinerary_id    UUID REFERENCES itineraries(id),
  stop_id         UUID REFERENCES itinerary_stops(id),
  venue_id        TEXT NOT NULL,
  user_id         UUID REFERENCES auth.users(id),
  
  -- Attribution method
  method          TEXT NOT NULL,     -- 'qr_scan', 'manual', 'gps_proximity'
  
  -- Business proof fields
  party_size      INTEGER,           -- captured at check-in
  spend_tier      TEXT,              -- 'low'|'medium'|'high' (from user tier or manual)
  dwell_minutes   INTEGER,           -- computed from checkout or session end
  
  -- Social amplification
  shared_to_social BOOLEAN DEFAULT FALSE,
  share_platform   TEXT,             -- 'instagram', 'tiktok', etc.
  
  -- Confetti routing proof
  from_itinerary  BOOLEAN DEFAULT TRUE,
  confetti_referral_code TEXT,       -- unique per itinerary for venue partner tracking
  
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX ON attribution_events (venue_id, created_at);
CREATE INDEX ON attribution_events (itinerary_id);
```

### QR check-in connection

`src/routes/new.qrcheckin.tsx` must:
1. Parse venue ID from QR payload
2. Find active itinerary stop for this user+venue
3. Write `attribution_events` record
4. POST to `/api/venue-checkin` to trigger quality score update
5. Return gamification reward payload

---

## Layer 5 — Venue Quality Score Engine (NEW — closes feedback loop)

This is the missing link. It aggregates all engagement signals into a single rolling quality score per venue.

### Edge function: `supabase/functions/venue-quality-score/index.ts`

**Input triggers:**
- Called after QR check-in
- Called after `rate_your_night` submission
- Run as daily cron to recompute rolling 30-day scores

**Score components:**

| Signal | Weight | Source Table |
|---|---|---|
| Completion rate | 25% | `attribution_events` (count completed / count started) |
| Average rating | 25% | `pick_signals.overall_rating` |
| Return visit rate | 20% | `attribution_events` (repeat user_ids within 90d) |
| Dwell time score | 15% | `attribution_events.dwell_minutes` vs. category average |
| Social share rate | 10% | `attribution_events.shared_to_social` |
| Recency boost | 5% | Events in last 7 days weighted 2× |

**Output schema:**

```sql
CREATE TABLE venue_quality_scores (
  venue_id        TEXT PRIMARY KEY,
  
  -- Component scores
  completion_rate  REAL DEFAULT 0.5,
  avg_rating       REAL DEFAULT 0.5,
  return_rate      REAL DEFAULT 0.5,
  dwell_score      REAL DEFAULT 0.5,
  social_share_rate REAL DEFAULT 0.0,
  
  -- Composite
  quality_score   REAL DEFAULT 0.5,    -- 0.0–1.0
  sample_size     INTEGER DEFAULT 0,   -- number of events in window
  confidence      REAL DEFAULT 0.0,    -- low until sample_size > 10
  
  -- For business dashboard
  verified_visits_30d    INTEGER DEFAULT 0,
  total_party_size_30d   INTEGER DEFAULT 0,
  social_amplifications  INTEGER DEFAULT 0,
  
  computed_at     TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Layer 6 — Venue Business Proof Dashboard

This is the B2B layer — what we show venue partners to prove Confetti routes them real traffic.

### Metrics surfaced

| Metric | What It Proves | Data Source |
|---|---|---|
| **Verified visits** | Confetti users physically arrived | `attribution_events` (qr_scan or gps) |
| **Party size** | Group traffic, not solo clicks | `attribution_events.party_size` |
| **Spend tier distribution** | Quality of traffic | `attribution_events.spend_tier` |
| **Return rate** | Loyalty, not just first-timers | Repeat `user_id` in 90-day window |
| **Social amplification** | Earned media value | `attribution_events.shared_to_social` |
| **Time-of-day heat map** | When Confetti drives traffic | Histogram over `created_at` hours |
| **Occasion mix** | Which itinerary types route here | Join `itineraries.occasion` |
| **Satisfaction score** | Quality of experience we sent | Avg rating from `pick_signals` |

### Route: `/partner/dashboard`

This dashboard should require venue partner auth (separate from user auth) and show:
1. KPI cards: visits, party size, return rate, satisfaction
2. Time-of-day heat map (last 30 days)
3. Recent attributed visits with timestamps and occasions
4. Social amplification feed (posts/shares from Confetti users)
5. Month-over-month trend line
6. "Confetti Certified Venue" badge status

---

## Layer 7 — Morning After Recap & Feedback Collection

The `cron-rate-your-night` function already sends notifications. The feedback collection must:

1. **Capture per-stop ratings** (not just overall) — this is how we know which venues in an itinerary are strong vs. weak
2. **Write to `pick_signals`** with `recap_note`, `overall_rating`, per-stop `venue_rating`
3. **Trigger quality score recompute** for each rated venue

### Data flow

```
9AM cron → push notification
    → user opens recap UI
    → rates each stop (1–5 stars + optional note)
    → pick_signals.saveItineraryRecap()
    → for each rated venue: POST /api/update-venue-quality
    → venue_quality_scores recomputed
    → next recommendation for that venue reranked
```

---

## The Flywheel

```
Great Recommendation
        │
        ▼
User completes itinerary
        │
        ▼
QR check-ins → attribution_events
        │
        ▼
Morning After Recap → ratings
        │
        ▼
Venue Quality Score updated
        │
        ▼
Next recommendation reranked higher (if good) or suppressed (if bad)
        │
        ▼
Venue partner sees proof dashboard → signs partnership
        │
        ▼
Exclusive offers → higher engagement → more itineraries
        │
        └──────────────────────────────────────────────►
```

---

## Implementation Priority

### P0 — Closes the feedback loop (zero B2B value without this)

- [ ] Create `attribution_events` table migration
- [ ] Create `venue_quality_scores` table migration
- [ ] Build `venue-quality-score` edge function
- [ ] Wire QR check-in → attribution_events write
- [ ] Wire `ai-recommend` to read quality scores as reranking multiplier

### P1 — Recommendation quality (user experience)

- [ ] Add vibe score columns to knowledge graph (replace single-label buckets)
- [ ] Add TTL-aware cleanup cron for knowledge graph entries
- [ ] Add temporal dimension to `ai-recommend` (timeOfDay, dayOfWeek params)
- [ ] Add pre-flight validator (open hours check before including venue)

### P2 — Business proof layer

- [ ] Build `/partner/dashboard` route with KPI cards and attribution feed
- [ ] Create `venue_business_metrics` view over attribution_events
- [ ] Add confetti_referral_code to QR payload for offline attribution

### P3 — Knowledge graph upgrade

- [ ] Add pgvector extension and embedding columns
- [ ] Update `social-trend-scraper` to embed hashtags and write vibe float scores
- [ ] Add vector similarity search to `ai-recommend` for semantic vibe matching

---

## Data Contracts

### `user_behavior_events` (existing)

| Field | Type | Notes |
|---|---|---|
| event_type | TEXT | venue_view, venue_skip, venue_favorite, venue_book, venue_complete, venue_rate |
| venue_id | TEXT | |
| user_id | UUID | |
| metadata | JSONB | dwell_seconds, swipe_direction, etc. |
| created_at | TIMESTAMPTZ | |

### `pick_signals` (existing)

| Field | Type | Notes |
|---|---|---|
| signal_type | TEXT | mood, swap_reason, recap_note, linger, save, swipe_away, reopen |
| venue_id | TEXT | |
| user_id | UUID | |
| itinerary_id | UUID | |
| rating | REAL | For recap_note signals |
| note | TEXT | |

### `attribution_events` (new — see Layer 4)

### `venue_quality_scores` (new — see Layer 5)

---

## Security & Privacy

- Attribution events are pseudonymized for venue dashboards — venues see aggregate counts, NOT individual user identities
- `attribution_events.user_id` is hashed before being shared with venue partners
- QR codes are single-use per itinerary+stop combination (prevent gaming)
- Venue partner dashboard auth is row-level security scoped to `venue_id`

---

*This document is the source of truth for the Confetti Content Intelligence Agent. All implementation work should reference this spec.*
