---
name: build-night-plan
description: Generate a complete, real, ready-to-execute multi-stop night/day plan for any city + occasion + budget combination using Confetti's Claude+KB plan-build pipeline. Returns title, summary, per-stop venues with addresses, costs, what-to-do, dress code, parking, tips, and inter-stop travel legs.
metadata:
  type: search-type
  surface: confetti-edge-functions
---

# Build-Night-Plan

End-to-end "give me the plan" search type. Takes a city + occasion + (optional) budget / vibe / start time / duration and returns a fully grounded, executable itinerary with 3–6 stops.

## When to use
- User asks "What should we do in X for Y" or "Plan our night/day"
- You need a curated multi-stop sequence with real venues (not just a list)
- The result needs travel legs, parking, dress code, what-to-order baked in

## How to invoke

```bash
PUB="sb_publishable_1UgaMguNGH1zRqTS2nNwRQ_HxJbnRwP"
curl -s -X POST "https://zfeckvxkulreyapadanf.supabase.co/functions/v1/build-itinerary" \
  -H "Content-Type: application/json" \
  -H "apikey: $PUB" \
  -d '{
    "occasion": "<free-text occasion>",
    "vibe": "<optional tagline / hint>",
    "city": "<city name — first word matters>",
    "region": "<optional disambiguation, e.g. \"DC\">",
    "budget": "$ | $$ | $$$ | $$$$",
    "durationHours": 4-8,
    "startTime": "HH:MM",
    "transportMode": "auto | car | transit | lyft | uber | walk"
  }'
```

## How it works (the agent chain)

1. **`ensureCityVenues(city)`** in `_shared/venue-discovery.ts` — checks the curated `venues` table; if fewer than 15 venues for the city, asks Claude Sonnet 4 for 25 real venues with vibe_tags, cuisine, neighborhood, price tier, vibe notes. Persists with `source_credit = "ai-discovery"`. Idempotent (dedupes by slug). Failures swallowed.
2. **Claude tool-use call** (`claude-sonnet-4-20250514`) with a long occasion-playbook system prompt that distinguishes kids/family vs guys night vs girls night vs date night vs in-laws vs anniversary vs elders, etc. Returns a structured `return_itinerary` tool-call argument.
3. **Venue grounding via `placesSearch`** — every named stop is fuzzy-matched against the `venues` table filtered by city (via the `KB_CITIES` splitter so "Bar Margot Cincinnati" picks Cincinnati's, not Atlanta's). Verified venues get real address / lat / lng / rating swapped in.
4. **Fallback per stop** — if a venue isn't in KB, falls back to a category search ("popular restaurant Cincinnati"). If even that finds nothing, the stop is dropped from the final plan with `verified=false`.

## Inputs that shape the output

| Input | Effect |
|---|---|
| `occasion` | Selects from playbook: family / girls / guys / date / meet-parents / mature-couple / anniversary / elders / bachelor-bachelorette |
| `vibe` | Free-text modifier — "romantic but lively", "wild", "chill Sunday" |
| `budget` | Caps `price_level` ceiling and tone of suggested venues |
| `durationHours` | Number of stops (3–6) and time-window |
| `startTime` | Anchor for first stop; subsequent stops time-sequenced with travel legs |
| `transportMode` | Picks realistic per-leg mode unless "auto" — walk under 0.5 mi, transit dense urban, rideshare late-night drinking |

## Output shape

```json
{
  "itinerary": {
    "title": "Catchy 4–8 word title",
    "summary": "1–2 sentence vibe summary",
    "estTotalCost": "$X-Y / couple",
    "stops": [
      {
        "name": "venue name",
        "category": "meal | activity | drinks | scenic | travel | other",
        "description": "1–2 sentences",
        "address": "real address from KB",
        "startTime": "HH:MM",
        "durationMinutes": 90,
        "estCost": "$120-160 per couple",
        "whatToDo": "specific recommendation: dish to order / experience to do",
        "bookingUrl": "search URL on OpenTable / Resy / Maps",
        "bookingProvider": "opentable | resy | eventbrite | ticketmaster | google-maps | website",
        "reviewSnippets": ["...", "..."],
        "parking": { "type": "lot|street|valet|garage|transit", "cost": "...", "access": "..." },
        "tips": ["...", "..."],
        "dressCode": "3–10 word note",
        "travelFromPrev": { "mode": "...", "durationMinutes": N, "distance": "...", "instructions": "..." },
        "verified": true,
        "lat": 38.91,
        "lng": -77.03
      }
    ]
  }
}
```

The first stop has no `travelFromPrev`. Every other stop's `startTime` is anchored to prev `startTime + durationMinutes + travel time`.

## Frontend hookup

`buildAndSaveItinerary` in `src/lib/itineraries.ts` calls this and writes to `itineraries` + `itinerary_stops`. `populateItinerary` is the two-phase flavor that inserts a skeleton row first then populates in the background. Both are consumed by:
- `/app/plan` (Build My Night wizard)
- `/trips/$id` (full trip detail / re-build flow)

## Verified outputs (smoke tests)

- **DC double date $$$ 5h start 18:30**: The Gibson (Shaw fine dining) → The Columbia Room (cocktails) → Kennedy Center Rooftop (show). $300–450/couple. Real DC addresses, full parking + dress + tips. 2-min walk leg + 15-min rideshare leg.
- **Cincinnati date night $$ 4h**: Ghost Baby (speakeasy) → Rusk Kitchen + Bar → Mercantile Library. All 3 verified against KB.
- **Nashville bougie/speakeasy/rooftop $$$**: Patterson House → L.A. Jackson → Yazoo Brewing (via wizard-itinerary, not build-itinerary, but same KB).

## Failure modes to handle

- **Empty stops array on first call to a brand-new city** — `ensureCityVenues` had nothing to discover and Claude generated venues that don't exist in the KB. Either retry (the second call hits the populated KB), or trust the `verified=false` stops since the LLM may have named real businesses anyway.
- **Wrong-city venue picked** — happens when KB has a same-named venue in a different city. `splitQuery` in `placesSearch` mitigates by detecting city in the text query and constraining the match. If you see this, check that the city is in `KB_CITIES`.
- **`missing ANTHROPIC_API_KEY`** — secret unset on the project. `supabase secrets set ANTHROPIC_API_KEY=... --project-ref zfeckvxkulreyapadanf`.

## Related skills
- [[on-demand-enrichment]] — the 3-tier pattern (KB → Claude → persist) this skill is built on.
