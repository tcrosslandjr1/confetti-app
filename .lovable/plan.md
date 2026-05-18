# Confetti v7–v10 Implementation Plan

This is a large, multi-system upgrade. I'll ship it in 4 sequenced phases, each independently usable. All v6 engines stay intact — v10 wraps them in an orchestrator.

---

## Phase v7 — Personalization Engine

**Data layer (migration)**

- `user_preferences` (user_id PK, learned profile JSON: preferred_vibes, categories, price_tier, time_slots, neighborhoods, business_types, disliked_business_types, risk_tolerance, nightlife_intensity, comfort_level, promo_sensitivity, personalized_name_style, updated_at)
- `user_signals` (id, user_id, signal_type, payload JSONB, city, created_at) — append-only event log of cities_used, categories_used, vibes_chosen, names_selected, steps_swapped, venues_liked/disliked, budget/time/group patterns, promo_interactions
- RLS: users read/write their own rows only

**Code**

- `src/lib/agents/personalization.ts` — `recordSignal()`, `learnProfile(userId)` (aggregates signals → profile), `getDefaults(userId)` (returns default vibe/budget/time/personality/name-style)
- `src/lib/personalization.functions.ts` — server fns: `getMyProfile`, `resetMyProfile`, `updateMyProfile`, `recordPlanSignals`
- Hook into `generatePlan`: load profile → seed defaults; after plan locked, write signals
- Hook into swap actions in `vibe-plans.tsx` to log `steps_swapped`

**UI**

- `/profile/preferences` route: view learned profile, edit toggles (preferred vibes/categories/budget, comfort level, promo sensitivity), Reset button
- First-time users → broad chooser (current flow). Returning users → defaults pre-filled with subtle "based on your style" note

**Privacy**

- Never personalize toward adult/risky categories unless explicit toggle on
- Profile editable + resettable
- No sensitive inferred traits in UI

---

## Phase v8 — Trip Engine (Multi-Day)

**Data layer (migration)**

- `trips` (id, user_id, destination_city, trip_name, trip_length_days, group_size, group_type, energy_curve, budget_total, arrival_time, departure_time, status, created_at)
- `trip_days` (id, trip_id, day_index, day_theme, day_name, itinerary_id FK→plans, estimated_cost)
- RLS: owner-only

**Code**

- `src/lib/agents/trip-engine.ts` — `generateTrip(input)`: loops `generatePlan` per day with energy curve, tracks used venues, balances neighborhoods, inserts rest blocks, applies per-day budget, weather fallback per day
- Energy curve presets: chill→turn-up→chill, steady-chill, steady-turn-up, soft-life, family-safe, bachelor(ette), adventure-heavy, food-and-culture
- `src/lib/trip.functions.ts` — `generateTrip`, `getTrip`, `listMyTrips`, `renameTrip`
- Name agent extended: generates trip-level names + per-day names

**UI**

- `/trips` list, `/trips/$tripId` view: day tabs/accordion, swap day, regenerate day, total budget meter, transport notes
- New trip wizard: city, days, group, budget, energy curve, must-do/avoid categories

---

## Phase v9 — Organic Promo Engine

**Data layer (migration)**

- `partner_deals` (id, venue_id FK, deal_type [save/upgrade/time_limited], title, description, valid_from, valid_until, vibe_tags, category_tags, group_size_min/max, adult_only, active)
- RLS: public read of active deals; admin write

**Code**

- `src/lib/agents/promo-agent.ts` — `selectPromos(plan, userProfile, filters)`:
  - max 2 promos/itinerary
  - must match vibe + category + budget + group
  - never override safety/vibe/budget
  - respect promo_sensitivity from profile
  - block adult-only unless adult toggle
  - block all in family/in-laws/coworker mode unless fully appropriate
  - returns `{ promo_steps, swap_options, disclosures, fit_score, non_promo_alternative }`
- Hook into `generatePlan` after itinerary draft, before name agent
- Update `GeneratedPlan` type with promo metadata

**UI (in `vibe-plans.tsx`)**

- Steps with deals get a small "Includes partner deal" tag (allowed copy: optional / upgrade / deal / save / available offer — NEVER sponsored/promoted/ad/boosted)
- Each promo step has a non-promo swap button
- Disclosure line shown beneath promo steps

---

## Phase v10 — Multi-Agent Orchestration

**Code**

- `src/lib/agents/orchestrator.ts` — `runOrchestrator({ rawRequest, userId, city, sessionContext })`:
  1. intent_agent (LLM extracts goal/category/vibe/budget/group/timing from raw text)
  2. city_agent (resolves/clarifies)
  3. personalization_agent (load profile, apply defaults to missing fields)
  4. category/vibe agents (map to canonical)
  5. budget/group/weather/time/safety/local_flavor agents (run v6 engines)
  6. itinerary_agent OR trip_agent (single-day vs multi-day branch)
  7. promo_agent
  8. name_agent + rating_agent
  9. swap_agent (precompute alternatives)
  10. assemble final response { itinerary, names, swaps, fallbacks, budget_options, disclosures, reasoning_metadata (internal) }
- `src/lib/orchestrator.functions.ts` — `orchestratePlan` server fn

**UI**

- `/ask` route: single freeform input ("3 days in Miami with the boys", "girls brunch tomorrow")
- Streams orchestrator result → renders as plan or trip
- Behind the scenes shows one Confetti voice; reasoning metadata kept internal (debug-only)

---

## Technical Details

- All AI calls via Lovable AI Gateway (`google/gemini-3-flash-preview` default; `gemini-2.5-pro` for orchestrator/intent)
- All server fns use `requireSupabaseAuth` (also fixes one of the open security findings on AI endpoints)
- All new tables: RLS on, scoped to `auth.uid()`
- Types extended in `src/lib/agents/types.ts` (PersonalizationProfile, Trip, TripDay, PromoStep, OrchestratorResult)
- v6 engines remain the building blocks — v10 calls them, doesn't replace them

## Sequencing

I'll implement v7 → v8 → v9 → v10 in order, each phase committing migrations + code together. Phase v7 unlocks defaults for v8/v10; v9 plugs into both single plans and trip days; v10 is the unifying layer.

## Out of scope (call out)

- I won't fix the unrelated security findings in your current view (referral_codes RLS, realtime channel policies, invite-videos bucket, seedDemoAccounts, pick-events spoofing, trending hook auth) in this plan — happy to do those as a separate pass. The AI-endpoint auth finding gets partially addressed because new orchestrator/trip fns will be auth-gated.
