# Confetti AI Content Engine + Social Signal Layer — Design Handoff

**Date:** May 24, 2026
**Status:** Code pushed to GitHub (`tcrosslandjr1/TimeApp`, branch `main`, commit `70920970`)
**For:** Claude Design session in Lovable

---

## What Was Built

Two interconnected backend systems that give Confetti a self-improving AI brain:

### 1. AI Content Engine
Generates occasion ideas and discovers venues using GPT-4o-mini, learns from user feedback, and gets smarter over time.

### 2. Social Signal Layer
Classifies venues across 16 cities into 5 social signal types (trending, popular, new, lowkey, unique) and injects that social intelligence into the Content Engine's prompts — so generated ideas reference what's actually buzzing on TikTok, Instagram, and X.

---

## Architecture Overview

```
User opens Occasion Page
        │
        ▼
  unified-ideas.ts (client)
  ┌─ cache hit? → return immediately
  └─ cache miss? → fetchAIIdeas() server function
        │
        ▼
  idea-generation.functions.ts (server)
  ┌─ On-demand: generateIdeasOnDemand()
  ├─ Daily batch: runDailyGeneration()
  ├─ Feedback: recordContentFeedback()
  ├─ Read ideas: fetchAIIdeas()
  └─ Read venues: fetchAIVenues()
        │
        ▼
  idea-generator.ts (agent)
  ┌─ Loads city context (16 cities, neighborhoods, price norms)
  ├─ Loads user taste signals (vibes, occasions, disliked tags)
  ├─ Loads social context ← Social Signal Layer
  ├─ Builds prompt with all 3 context layers
  ├─ Calls GPT-4o-mini via Lovable AI Gateway
  └─ Persists ideas/venues to Supabase
        │
        ▼
  social-signal-collector.ts (social layer)
  ┌─ Per-city hashtag seeds (16 cities × 8-15 hashtags each)
  ├─ AI classifies venues into 5 signal types
  ├─ Persists to social_venue_signals table
  └─ formatSocialContextBlock() → injected into idea/venue prompts
```

---

## Files (all on GitHub now)

| File | Purpose |
|------|---------|
| `src/lib/agents/idea-generator.ts` | Core AI agent: prompt builders, AI calls, idea/venue generation, daily batch, feedback loop |
| `src/lib/agents/social-signal-collector.ts` | Social signal classification, per-city hashtag seeds, prompt injection formatting |
| `src/lib/idea-generation.functions.ts` | 6 TanStack server functions: generate, batch, feedback, fetch ideas, fetch venues, rebuild taste |
| `src/lib/social-signal.functions.ts` | 4 TanStack server functions: fetch signals, refresh, get context, run batch |
| `src/lib/unified-ideas.ts` | Client-side idea provider: merges AI ideas + seed ideas, 5-min cache, prefetch |
| `supabase/migrations/20260524_ai_content_engine.sql` | Tables: `ai_generated_ideas`, `ai_discovered_venues`, `user_content_feedback`, `user_taste_signals`, `ai_generation_log` |
| `supabase/migrations/20260524_social_signals.sql` | Tables: `social_venue_signals`, `social_collection_log` |

---

## 16 Supported Cities

`dc`, `vegas`, `miami`, `nyc`, `seattle`, `chi`, `la`, `sf`, `hou`, `atl`, `nash`, `mem`, `knox`, `chatt`, `gat`, `phx`

Each city has:
- Full `CityContext` with neighborhoods, vibe labels, price norms, signature experiences, environment features, allowed activities
- Hashtag seeds for social signal discovery (8-15 hashtags per city)

---

## 5 Social Signal Types

| Type | What It Means | Use Case |
|------|--------------|----------|
| **trending** | Viral momentum, everyone's posting about it | FOMO occasions — birthday, girls night, bachelor party |
| **popular** | Consistent crowd favorites, always busy | Reliable picks — date night, family, visiting friends |
| **new** | Just opened / renovated, "first look" buzz | Discovery angle — adventurous users, foodies |
| **lowkey** | Hidden gems, small passionate following | Intimate occasions — anniversary, first date |
| **unique** | One-of-a-kind, "you won't believe this exists" | Novelty seekers, special celebrations |

---

## 12 Occasions (already in the app)

Date Night, Girls Night Out, Birthday Celebration, Anniversary, Boys Night, Family Outing, Bachelor/Bachelorette, Solo Adventure, Business Dinner, Brunch, Late Night, Visiting Friends

---

## How the AI Gets Smarter (Feedback Loop)

1. User interacts with an idea → `recordContentFeedback()` fires
2. Actions: `save` (+0.05), `use` (+0.08), `share` (+0.06), `skip` (-0.03), `rate` (±0.05 per star from neutral)
3. Quality score adjusts on the idea/venue row (clamped 0–1)
4. `rebuildUserTasteSignals()` aggregates all feedback into a user taste profile
5. Next generation batch reads aggregate taste signals → prompts lean INTO liked vibes, AWAY from disliked tags
6. Higher quality_score ideas surface first in `fetchGeneratedIdeas()` (sorted desc)

---

## Server Function Endpoints

### Content Engine (`idea-generation.functions.ts`)

| Function | Method | Purpose |
|----------|--------|---------|
| `generateIdeasOnDemand` | POST | Generate ideas for specific occasion + city |
| `runDailyGeneration` | POST | Full batch across all cities × occasions |
| `recordContentFeedback` | POST | Save/skip/rate/share/use feedback |
| `fetchAIIdeas` | POST | Read ideas from DB (sorted by quality) |
| `fetchAIVenues` | POST | Read venues from DB |
| `rebuildUserTasteSignals` | POST | Recompute user taste profile from feedback |

### Social Signals (`social-signal.functions.ts`)

| Function | Method | Purpose |
|----------|--------|---------|
| `fetchTrendingByCity` | POST | Read social signals for a city (optionally filtered by type) |
| `refreshSocialSignals` | POST | Trigger fresh AI collection for a city |
| `getSocialContext` | POST | Load cached social context for prompt injection |
| `runSocialBatch` | POST | Full collection across all/specified cities |

---

## Supabase Tables

### `ai_generated_ideas`
Stores every AI-generated occasion idea. Key columns: `occasion_slug`, `city_slug`, `title`, `hook`, `description`, `vibe_tags` (jsonb), `est_cost`, `time_of_day`, `duration`, `steps` (jsonb), `quality_score` (0-1, adjusts via feedback), `generation_batch`, `is_active`.

### `ai_discovered_venues`
AI-discovered venue entries. Key columns: `city_slug`, `name`, `slug`, `neighborhood`, `category`, `rating`, `price`, `price_level`, `tags` (jsonb), `description`, `ai_pick`, `quality_score`, `source` ("ai"). Upsert on `(city_slug, slug)`.

### `user_content_feedback`
Raw feedback events: `user_id`, `content_type` (idea/venue), `content_id`, `action` (save/skip/rate/share/use), `rating`, `occasion_slug`, `city_slug`.

### `user_taste_signals`
Aggregated taste profile per user: `top_vibes`, `top_occasions`, `preferred_price`, `preferred_time`, `disliked_tags`, `avg_rating`, `total_saves/skips/ratings`.

### `ai_generation_log`
Batch run tracking: `batch_id`, `trigger`, `cities_processed`, `occasions_processed`, `ideas_generated`, `venues_generated`, `feedback_incorporated`, `status`, `duration_ms`.

### `social_venue_signals`
Social signal entries: `city_slug`, `venue_name`, `venue_slug`, `signal_type` (trending/popular/new/lowkey/unique), `platform` (tiktok/instagram/x/multi), `post_count`, `engagement_score`, `sentiment`, `hashtags` (jsonb), `snippet`, `neighborhood`, `category`. Upsert on `(city_slug, venue_slug, platform)`.

### `social_collection_log`
Social batch run tracking: `batch_id`, `city_slug`, `trigger`, `signals_collected`, `signals_by_type` (jsonb), `status`.

---

## What Lovable Needs to Wire Up

### 1. Occasion Pages — Already Wired
`unified-ideas.ts` is already imported in the occasion route. It calls `fetchAIIdeas()` and merges with seed ideas. AI ideas appear first (sorted by quality), seeds fill the tail. 5-minute client cache. Graceful fallback to seeds if server is down.

### 2. Feedback Buttons (NOT YET IN UI)
The backend is ready. Lovable needs to add UI buttons/interactions that call `recordContentFeedback()`:
- **Save** button on idea cards → action: "save"
- **Skip/dismiss** → action: "skip"
- **Star rating** (1-5) → action: "rate", rating: N
- **Share** button → action: "share"
- **"Use this plan"** → action: "use"

Each call needs: `contentType` ("idea" or "venue"), `contentId` (the UUID), `action`, optional `rating`, optional `occasionSlug`, optional `citySlug`.

### 3. Social Signal Display (NOT YET IN UI)
The data exists in `social_venue_signals`. Lovable could:
- Show a "Trending Now" badge on venue cards where `signal_type = 'trending'`
- Show a "Hidden Gem" badge where `signal_type = 'lowkey'`
- Show a "Just Opened" badge where `signal_type = 'new'`
- Add a "What's Buzzing" section on city pages using `fetchTrendingByCity()`
- Show social proof snippets from the `snippet` field

### 4. Daily Batch Trigger (NOT YET SCHEDULED)
`runDailyGeneration()` and `runSocialBatch()` are ready to be called from a cron/scheduled Edge Function. Suggested schedule: once daily at 4 AM UTC. The social batch should run first (populates signals), then the content engine batch (consumes signals in prompts).

### 5. Admin Dashboard (OPTIONAL)
Could show:
- `ai_generation_log` — batch history, ideas/venues generated per run
- `social_collection_log` — signal collection history
- Quality score distribution across ideas
- Top/bottom ideas by quality_score

---

## Tech Stack Summary

| Layer | Technology |
|-------|-----------|
| AI Provider | Lovable AI Gateway (`ai.gateway.lovable.dev/v1`) via `createOpenAICompatible` |
| Model | `gpt-4o-mini` (temperature 0.85 for ideas, 0.9 for social signals) |
| Server Functions | `createServerFn` from `@tanstack/react-start` with Zod validation |
| Database | Supabase (project `zfeckvxkulreyapadanf`), service role via `supabaseAdmin` |
| Client State | In-memory Map cache with 5-min TTL in `unified-ideas.ts` |
| Validation | Zod schemas on every server function input |

---

## Key Design Decisions

1. **Social signals are AI-classified, not scraped** — We use GPT-4o-mini with per-city hashtag seeds to generate realistic social signal data. This avoids API costs from actual social media scraping while still giving the Content Engine rich social context to reason over.

2. **Prompt injection pattern** — Social context is formatted as a structured text block (`formatSocialContextBlock()`) and injected directly into the idea/venue generation prompts. This means the AI sees what's buzzing and naturally weaves it into recommendations.

3. **Quality scores are feedback-driven** — Every idea starts at 0.5. User actions (save, skip, rate, share, use) push it up or down. The fetch query sorts by `quality_score DESC`, so the best content surfaces first. Over time, bad ideas sink and great ones rise.

4. **Unified provider with graceful fallback** — `unified-ideas.ts` always returns ideas: AI-generated first, seed ideas as fallback. If the server is down or the DB is empty, users still see curated seed content.

5. **Upsert-based dedup** — Both venues and social signals use upsert with unique constraints to prevent duplicate entries across batch runs.
