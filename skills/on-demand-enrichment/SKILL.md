---
name: on-demand-enrichment
description: "Pattern for building on-demand data enrichment with local-first lookup + AI fallback + state persistence. Use this skill whenever building a feature that needs to fetch and cache additional information about an entity (venue, person, product, etc.) on user interaction — especially when there's a local knowledge base to check first, an AI/API fallback, and results should be persisted to avoid refetching. Also use when the user says 'details button', 'fetch more info', 'enrich data', 'on-demand lookup', or wants to add a progressive-disclosure data panel to a card/list item."
---

# On-Demand Enrichment Pattern

A reusable architecture for progressively enriching entity data using a tiered lookup strategy with local-first semantics and state persistence.

## When to Use

- User taps "Details" or "More info" on a card/list item
- An entity (venue, contact, product) has minimal data and needs enrichment
- You have a local knowledge base that might have the answer (cheaper/faster)
- You need an AI or API fallback for unknown entities
- Enriched data should persist so the lookup only happens once

## Architecture (3 Layers)

```
┌─────────────────────────────────────────────────┐
│  UI Layer — Button + Loading/Success/Error states │
├─────────────────────────────────────────────────┤
│  Client Fetcher — Orchestrates the lookup tiers   │
│    1. Check if already enriched → skip            │
│    2. Fuzzy-match local knowledge base            │
│    3. Call AI/API edge function as fallback        │
│    4. Merge results into state store + persist     │
├─────────────────────────────────────────────────┤
│  Edge Function — AI-powered lookup (server-side)  │
│    - Receives entity identifiers                  │
│    - Calls Claude/GPT with structured output      │
│    - Returns validated JSON                       │
└─────────────────────────────────────────────────┘
```

## Implementation Steps

### 1. Define the Intel Interface

```typescript
export interface EntityIntel {
  // Fields specific to your domain
  field1?: string;
  field2?: string;
  // Always track provenance
  source: "local-kb" | "ai-lookup" | "api" | "none";
}

export type FetchStatus = "idle" | "loading" | "success" | "not-found" | "error";
```

### 2. Build the Fuzzy Matcher (Local KB)

```typescript
function normalize(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
}

function similarityScore(a: string, b: string): number {
  if (a === b) return 1;
  if (a.includes(b) || b.includes(a)) return 0.85;
  const aWords = new Set(a.split(" "));
  const bWords = new Set(b.split(" "));
  const overlap = [...aWords].filter(w => bWords.has(w)).length;
  const union = new Set([...aWords, ...bWords]).size;
  return union > 0 ? overlap / union : 0;
}

// Threshold: 0.5 works well for venue/business names
```

### 3. Build the Edge Function (AI Fallback)

Key principles:
- Use a structured system prompt that specifies exact output schema
- Tell the AI to return null for uncertain fields (never hallucinate)
- Strip markdown fences from response before JSON.parse
- Validate and sanitize every field before returning
- Use max_tokens: 600 (small structured output = fast + cheap)

### 4. Build the Client Fetcher (Orchestrator)

```typescript
export async function fetchEntityIntel(entityId: string): Promise<EntityIntel> {
  // 1. Already enriched? Return existing data
  if (entityHasIntel(entity)) return existingIntel;

  // 2. Try local knowledge base (instant, free)
  const localMatch = findInLocalKB(entity.name, entity.city);
  if (localMatch) {
    mergeIntoStore(entityId, localMatch);
    return localMatch;
  }

  // 3. Try AI/API fallback (network call)
  const aiResult = await fetchFromEdgeFunction(entity);
  if (aiResult) {
    mergeIntoStore(entityId, aiResult);
    return aiResult;
  }

  return { source: "none" };
}
```

### 5. Wire into UI

```tsx
const [status, setStatus] = useState<FetchStatus>("idle");
const [intel, setIntel] = useState<EntityIntel | null>(null);
const [showPanel, setShowPanel] = useState(false);

async function handleDetails() {
  if (status === "loading") return;
  if (intel && intel.source !== "none") { setShowPanel(v => !v); return; }
  setStatus("loading");
  setShowPanel(true);
  try {
    const result = await fetchEntityIntel(entity.id);
    setIntel(result);
    setStatus(result.source === "none" ? "not-found" : "success");
  } catch { setStatus("error"); }
}
```

## Key Design Decisions

1. **Local-first**: Always check the knowledge base before making network calls. It's instant and free.
2. **Persist on merge**: Once enriched, write the data back to the entity store so subsequent opens are instant.
3. **Graceful degradation**: If both tiers fail, show "No intel on file" — never crash.
4. **Source attribution**: Always track where data came from for transparency.
5. **Idempotent**: Multiple taps don't re-fetch — check entityHasIntel() first.

## File Structure (Confetti Example)

```
src/lib/agents/
  venue-intel.ts        — Client fetcher + fuzzy matcher
  venue-knowledge.ts    — Local knowledge base (1,074 venues)

supabase/functions/
  venue-intel/index.ts  — Claude-powered edge function

src/components/loop/
  BoardingPass.tsx       — UI with Details button + intel panel
```
