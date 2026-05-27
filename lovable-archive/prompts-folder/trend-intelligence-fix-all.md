# Lovable Prompt — Fix All: Trend Intelligence Gaps

> **Paste this entire prompt into Lovable as a single message.**
> It closes every gap from the first Trend Intelligence Engine prompt: rewires the home feed trending section to use viral_venues, adds an admin Trend Radar review queue, seeds agents into the registry, surfaces "Surprise Me" as a standalone feature, and cleans up the orphaned trending_venues table.

---

## Context for Lovable

This app is **Confetti** — an AI-powered dining and nightlife concierge. The first Trend Intelligence prompt was already applied. What exists now:

### Already built (DO NOT recreate):
- **`viral_venues` table** — columns: id (uuid PK), venue_name, normalized_name, city, neighborhood, address, lat, lng, rating, photo_url, website, google_place_id, tags (text[]), source_urls (jsonb), summary, trend_score (numeric), mention_count, verified (boolean), discovered_at, last_mentioned_at, refreshed_at
- **`discover-viral` edge function** at `src/routes/api/public/hooks/discover-viral.ts` — Firecrawl web search → AI extraction → Google Places verification → upserts into viral_venues
- **`viral-scoring.server.ts`** at `src/lib/viral-scoring.server.ts` — computeTrendScore(), authorityFor(), recencyBoost(), normalizeName(), TAG_VOCAB
- **`venue_intelligence` table** — AI-enriched insights (best_for, insider_tip, vibe_summary, etc.)
- **`plan_idea_seeds` table** — pre-generated itinerary templates
- **viral_venues is already used in**: venue detail page (fallback source), plan generation (loads 60 candidates), chat agent queries
- **Feed recommendations client** at `src/lib/agents/feed-recommendations.ts` — calls `ai-recommend` edge function, returns FeedResponse with trending/picks/surprise/events sections
- **Agent Registry** at `src/lib/agents/agent-registry.ts` — with agent_teams: ai_recs, operations, business, ux, growth, compliance
- **Admin console** at `src/routes/admin.console.tsx` — PIN-gated (PIN: "236166"), uses lucide-react icons

### What's broken or missing (FIX ALL OF THESE):

1. **Home page trending section pulls from the wrong table** — `src/routes/app.index.tsx` line 29 queries the `venues` table ordered by `featured` for the "Trending venues" section. It should pull from `viral_venues` sorted by `trend_score DESC` where `verified = true`.

2. **No admin Trend Radar review page** — there's no way for an admin to review, approve, or reject viral venue discoveries before they appear in the customer feed.

3. **No agent seeds for trend_intel or trend_plangen** — the agent_registry and seedControlCenterDemo() don't include entries for the two new trend intelligence agents.

4. **"Surprise Me" isn't surfaced as a standalone feature** — the `surprise` section exists in feed-recommendations but isn't prominently featured with its own button or card wired to viral_venues data.

5. **Orphaned `trending_venues` table** — this table was created earlier but has ZERO frontend references and overlaps with `viral_venues.trend_score`. It should be dropped.

---

## Part 1: Migration — Drop Orphaned Table

Create file: `supabase/migrations/20260524120000_drop_orphaned_trending_venues.sql`

```sql
-- ═══════════════════════════════════════════════════════════
-- Drop the orphaned trending_venues table.
-- All trending data now lives in viral_venues.trend_score.
-- The refresh_trending_venues() SQL function that updated
-- venues.trending_score is unaffected — it targets a
-- different column on a different table.
-- ═══════════════════════════════════════════════════════════

drop table if exists public.trending_venues;
```

That's it for migration. Everything else already exists.

---

## Part 2: Rewire Home Page Trending Section

**File to modify:** `src/routes/app.index.tsx`

Replace the existing `venues` query (the one that queries the `venues` table ordered by `featured`) with a query against `viral_venues`:

```typescript
const { data: trendingVenues } = useQuery({
  queryKey: ["app", "tonight", "trending"],
  queryFn: async () => {
    const { data } = await supabase
      .from("viral_venues")
      .select("id,venue_name,neighborhood,city,photo_url,rating,tags,trend_score,summary")
      .eq("verified", true)
      .order("trend_score", { ascending: false })
      .limit(8);
    return data ?? [];
  },
});
```

Then update the "Trending venues" section JSX to map `trendingVenues` instead of `venues`. The VenueFlipCard mapping should be:

```tsx
{(trendingVenues ?? []).map((v) => (
  <VenueFlipCard
    key={v.id}
    venue={{
      id: v.id,
      name: v.venue_name,
      category: (v.tags?.[0] ?? "hotspot"),
      neighborhood: v.neighborhood,
      photo: v.photo_url,
      rating: v.rating,
      vibe: v.summary?.slice(0, 60) ?? "Trending now",
      reason: `Trend score: ${v.trend_score}`,
    }}
    widthClass="w-44"
    source="tonight_trending"
    accent="coral"
  />
))}
{!trendingVenues?.length && <Placeholder text="Trending venues will appear here" />}
```

**Important:** Keep ALL other sections (AI Planner card, "For you", reels, events) exactly as they are. Only change the "Trending venues" section data source.

Also keep the old `venues` query ONLY if it's used elsewhere on this page. If it's only used for the trending section, remove it entirely.

---

## Part 3: Admin Trend Radar Review Page

Create a new route: `src/routes/admin.trend-radar.tsx`

This page lets the admin review viral venue discoveries and approve/reject them before they appear in the customer feed. Follow the same PIN-gate pattern used in `admin.console.tsx` (PIN: "236166").

### Route setup:
```typescript
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/trend-radar")({
  component: TrendRadarPage,
});
```

### Page structure:

**Header area:**
- Title: "Trend Radar" with a radar/zap icon
- Subtitle: "Review AI-discovered venues before they go live"
- Stats row: total discoveries count, pending review count, approved count, rejection rate %

**Tabs or filter toggle:**
- "Pending" (verified = false, default view)
- "Approved" (verified = true)
- "All"

**Venue review cards — each card shows:**
- venue_name (bold, large)
- neighborhood + city
- trend_score displayed as a visual bar or badge (e.g., "🔥 8.4")
- tags displayed as small pills/chips
- summary text
- mention_count + source_urls (show count and "View sources" expandable)
- photo_url if available (thumbnail)
- discovered_at date
- **Two action buttons:**
  - ✅ "Approve" — sets `verified = true` via supabase update
  - ❌ "Reject" — deletes the row from viral_venues (or alternatively sets a `rejected` flag if you prefer soft delete — either approach is fine)

**Query for the card list:**
```typescript
const { data: venues, refetch } = useQuery({
  queryKey: ["admin", "trend-radar", activeTab],
  queryFn: async () => {
    let query = supabase
      .from("viral_venues")
      .select("*")
      .order("trend_score", { ascending: false })
      .limit(50);
    
    if (activeTab === "pending") query = query.eq("verified", false);
    if (activeTab === "approved") query = query.eq("verified", true);
    
    const { data } = await query;
    return data ?? [];
  },
});
```

**Approve handler:**
```typescript
async function handleApprove(venueId: string) {
  await supabase
    .from("viral_venues")
    .update({ verified: true })
    .eq("id", venueId);
  refetch();
}
```

**Reject handler:**
```typescript
async function handleReject(venueId: string) {
  await supabase
    .from("viral_venues")
    .delete()
    .eq("id", venueId);
  refetch();
}
```

### Style notes:
- Use the same Card, Button components from `@/components/ui/`
- Follow the app's existing design language: font-display for headings, font-mono for metadata, ink/cream/coral/gold color tokens
- PIN gate identical to admin.console.tsx — copy that pattern exactly

### Link from admin console:
Add a navigation link/card on the existing `admin.console.tsx` page that points to `/admin/trend-radar`. Use the Zap icon from lucide-react. Label it "Trend Radar" with description "Review & approve trending venue discoveries".

---

## Part 4: Agent Registry Seeds

**File to modify:** `src/lib/agents/agent-registry.ts`

Add two new agent entries to the `seedControlCenterDemo()` function. Insert them into the `statusUpdates` array:

```typescript
["trend_intel", "idle", "Last run: discovered 14 viral venues in DC metro"],
["trend_plangen", "idle", "Generated 6 Surprise Me seeds from trending data"],
```

Also, these two agents need to be inserted into the `agent_registry` table. Add an upsert block at the top of `seedControlCenterDemo()` (before the messages/tasks/status sections):

```typescript
// Ensure trend intelligence agents exist in registry
const trendAgents = [
  {
    id: "trend_intel",
    name: "Trend Intelligence",
    description: "Discovers trending venues from social signals, press, and creator mentions. Runs the discover-viral pipeline and scores candidates.",
    team_id: "ai_recs",
    layer: "backend",
    status: "idle",
    file_path: "src/routes/api/public/hooks/discover-viral.ts",
  },
  {
    id: "trend_plangen",
    name: "Trend Plan Generator",
    description: "Creates Surprise Me itinerary seeds and curates the What's Hot feed from verified viral venues and venue intelligence data.",
    team_id: "ai_recs",
    layer: "backend",
    status: "idle",
    file_path: "src/lib/agents/feed-recommendations.ts",
  },
];

for (const agent of trendAgents) {
  await supabase
    .from("agent_registry")
    .upsert(agent, { onConflict: "id" });
}
```

Also add demo messages involving these agents to the `demoMessages` array:

```typescript
["trend_intel", { to_agent: "trend_plangen", msg_type: "task_handoff", subject: "14 new viral venues scored in DC — 8 above threshold", body: "Top: Dauphine's (score 9.2), The Mirror Room (8.7), Reverie (8.1)" }],
["trend_plangen", { to_team: "ai_recs", msg_type: "status_update", subject: "6 Surprise Me seeds generated from latest trending data" }],
```

And add a demo task:

```typescript
{ title: "Review 8 pending viral venues in Trend Radar", priority: "medium" as TaskPriority, assigned_to: "trend_intel", created_by: "trend_intel", team_id: "ai_recs" },
```

---

## Part 5: "Surprise Me" Standalone Feature

### 5A: Add a "Surprise Me" CTA card on the home feed

**File to modify:** `src/routes/app.index.tsx`

Add a new section between the "For you" section and the "Reels" section. This is a prominent, eye-catching card:

```tsx
<Reveal delay={340}>
  <section className="mt-8 px-5">
    <Card
      className="relative cursor-pointer overflow-hidden border-2 border-coral bg-gradient-to-br from-coral/10 via-cream to-gold/10 p-5 shadow-brut-lg transition-all active:scale-[0.98]"
      onClick={() => {
        trackEngagement("surprise_me_tap", { source: "tonight_feed" });
        navigate({ to: "/app/plan", search: { mode: "surprise" } });
      }}
    >
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-coral">
            <Sparkles className="size-3.5" /> Surprise Me
          </div>
          <h2 className="mt-2 font-display text-lg font-extrabold tracking-tight text-ink">
            Feeling adventurous?
          </h2>
          <p className="mt-1 text-[13px] leading-relaxed text-ink/60">
            We'll pick trending spots you'd never find on your own.
          </p>
        </div>
        <div className="grid size-14 shrink-0 place-items-center rounded-2xl bg-coral/15">
          <Zap className="size-7 text-coral" strokeWidth={2} />
        </div>
      </div>
    </Card>
  </section>
</Reveal>
```

This navigates to the plan page with `mode=surprise` in the search params. The plan page should recognize this param and auto-trigger a surprise itinerary (pulling from viral_venues where verified = true, ordered by trend_score DESC).

### 5B: Handle `mode=surprise` on the plan page

**File to modify:** `src/routes/app.plan.tsx` (or wherever the plan creation page lives)

Add search param validation for `mode`:

```typescript
// In the route definition, add search params:
export const Route = createFileRoute("/app/plan")({
  component: PlanPage,
  validateSearch: (search: Record<string, unknown>) => ({
    mode: (search.mode as string) || undefined,
  }),
});
```

When `mode === "surprise"`, auto-populate the plan generation with a surprise-oriented prompt. In the component:

```typescript
const { mode } = Route.useSearch();

useEffect(() => {
  if (mode === "surprise") {
    // Auto-trigger plan generation with surprise mode
    // This should call the existing plan generation with a prompt like:
    // "Surprise me with trending spots I'd never find on my own"
    // The generate-plan.functions.ts already loads from viral_venues
    handleGeneratePlan({
      mood: "adventurous",
      prompt: "Surprise me with trending spots I'd never find on my own — prioritize hidden gems and viral discoveries",
      useTrending: true,
    });
  }
}, [mode]);
```

Adapt this to match whatever the existing plan generation interface looks like — the key point is that "Surprise Me" from the home feed should land on the plan page and immediately start generating a surprise itinerary without requiring the user to type anything.

---

## Part 6: TikTok Compliance Note

All social signal data in this system comes from approved APIs, compliant data providers (like Firecrawl web search), or admin-approved manual import workflows. Do NOT add any code that directly scrapes TikTok, Instagram, or any social platform in a way that violates their platform terms of service. The existing `discover-viral.ts` uses Firecrawl's web search API which is compliant — keep it that way.

---

## Summary of all changes

1. **Migration**: Drop orphaned `trending_venues` table
2. **app.index.tsx**: Rewire "Trending venues" section to query `viral_venues` where `verified = true` sorted by `trend_score DESC`
3. **admin.trend-radar.tsx**: New PIN-gated admin page — review/approve/reject viral venue discoveries
4. **admin.console.tsx**: Add nav link to Trend Radar
5. **agent-registry.ts**: Seed `trend_intel` and `trend_plangen` agents + demo messages/tasks
6. **app.index.tsx**: Add "Surprise Me" CTA card between "For you" and "Reels"
7. **app.plan.tsx**: Handle `mode=surprise` search param to auto-trigger surprise itinerary

**Do NOT modify or recreate:** viral_venues table, discover-viral.ts, viral-scoring.server.ts, venue_intelligence table, plan_idea_seeds table, feed-recommendations.ts, or any existing agent definitions.
