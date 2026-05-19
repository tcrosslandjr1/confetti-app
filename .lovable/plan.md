# Audit: /partner/* and /promoter/*

## What I found

### /promoter/* — already real
- `promoter.tsx` layout gates on `supabase.auth.getUser()` → redirects to `/auth`.
- `promoter.index.tsx` and `promoter.jobs.tsx` are fully wired to `src/lib/promoter.functions.ts` via `useServerFn` + React Query (real reads/writes to `promoters`, `promoter_jobs`, `promoter_submissions`).
- No major issues. Minor nits only (see below).

### /partner/* — entirely mock UI, no backend, no auth
The whole portal under `/partner/*` (14 routes, ~2.5K lines) is static demo data:
- **Zero** `supabase`, `useServerFn`, `useQuery`, or `useMutation` usages anywhere in `partner.*.tsx`.
- `partner.tsx` layout has **no `beforeLoad` auth gate** — anyone (including signed-out users) can browse a "venue owner" dashboard with hardcoded stats, reservations, orders, menu, billing, analytics.
- Venue switcher is `const VENUES = [{ id: "v1", name: "Sundae Rooftop", tier: 3 }, ...]` — local `useState`, not user-scoped.
- `partner.index.tsx` STATS / TIMELINE, `partner.reservations.tsx`, `partner.orders.tsx`, `partner.menu.tsx`, `partner.analytics.tsx`, etc. — all module-level constants.
- The only "real" partner surface is `src/routes/api/public/partner/v1/*` (external partner REST API) which is backed by `src/lib/partner-api.ts`'s in-memory `Map` store with two demo bearer tokens. The portal UI does **not** talk to those endpoints either.

This is a UX/security gap: the route looks production-ready but is a clickable mockup served to the public internet.

## Proposed plan

Given the surface area, I propose splitting into two passes. **This plan covers Pass 1 only** — gate access + honest framing. Pass 2 (real data wiring) is a much bigger backend project and should be its own scoped request.

### Pass 1 — Gate + label (this plan)

1. **Add auth gate to `/partner/*`.** In `src/routes/partner.tsx` add a `beforeLoad` identical to `promoter.tsx`: check `supabase.auth.getUser()`, redirect to `/auth?redirect=/partner` if signed out. Matches existing pattern, no new infra.

2. **Add "Demo data" banner to the partner layout.** Small dismissible strip at top of `<main>` in `partner.tsx`: *"Preview portal — showing sample data. Real venue data wiring is in progress."* Single component, design-token colors only. Makes the mockup honest until Pass 2 lands.

3. **Replace the hardcoded venue switcher with the signed-in user's email.** Until venue ownership tables exist, drop the fake `VENUES` array and show `user.email` + a disabled "Add venue" affordance. Keeps the chrome but stops implying multi-venue control the user doesn't have.

4. **Promoter nits (small):**
   - `promoter.index.tsx` `audience`/`rate_card` reads use `as any` (lines 69–74) — tighten to a typed helper.
   - That's it; rest of the promoter flow is clean.

### Out of scope (Pass 2, separate request)

- Replacing partner mock constants with real Supabase reads (venues, reservations, orders, menu, analytics tables — most don't exist yet).
- Real venue ownership / multi-venue switcher backed by a `venue_owners` table.
- Wiring portal UI to the `/api/public/partner/v1/*` endpoints (or, more likely, to internal server fns).
- Swapping `partner-api.ts`'s in-memory store for Supabase tables.
- Visual redesign of either portal.

## Verification

- `bunx vite build` passes.
- Signed-out visit to `/partner` redirects to `/auth?redirect=/partner`; signed-in visit renders the dashboard with the demo banner.
- `/promoter/*` behavior unchanged.

## Technical notes

- The auth gate mirrors `src/routes/promoter.tsx` exactly — copy the `beforeLoad` block and change the redirect path.
- The banner should use existing tokens (`bg-amber-50 dark:bg-amber-950/30` is fine for warm coral theme; or `bg-primary/5 text-primary` to match Confetti palette). No new CSS variables.
- No DB migrations, no new server functions, no new dependencies.
