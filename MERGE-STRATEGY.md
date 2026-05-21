# Confetti Repo Merge Strategy

## The Two Codebases

### 1. confettiplan (Lovable-managed)
- **Repo**: `tcrosslandjr1/confettiplan` (private)
- **Live**: confettiplan.lovable.app (currently CRASHED — see CONFETTI-CRASH-FIX.md)
- **Stack**: TanStack Start template + Vite + React + Tailwind v4 + Supabase
- **Managed by**: Lovable AI (auto-syncs to GitHub)
- **Has**: name-generator, trip planning, checkout flow, promoter system, stop-menu, translate — all built with TanStack Start server functions (`.functions.ts` pattern)
- **Supabase project**: `zfeckvxkulreyapadanf`

### 2. TimeApp / ai-lifestyle-concierge
- **Repo**: `tcrosslandjr1/TimeApp` (public)
- **Local**: `~/ai-lifestyle-concierge`
- **Deployed**: confetti-app-eight.vercel.app (Vercel, 22 deployments)
- **Stack**: Vite + React + SWC + Tailwind v3 + Supabase + react-router-dom
- **Has**: Full agent system (7+ agents), services layer (booking, events, nightlife, payments, rideshare, wallet, weather), venue data for 50+ cities, social intelligence scanners, trust layer, community features, wallet/boost system, 217KB monolith App.tsx

**These are the same product (Confetti) built in two separate repos.** The package.json name in both is `"ai-lifestyle-concierge"`.

---

## Recommended Merge Direction

**TimeApp → confettiplan** (port TimeApp features INTO the Lovable app)

Why: confettiplan is Lovable-managed, meaning you can use Lovable AI to iterate on UI/UX. It also has the cleaner architecture (separate `.functions.ts` files, proper file organization). TimeApp has a 217KB monolith `App.tsx` that needs to be broken apart anyway.

---

## Merge Plan — 5 Phases

### Phase 1: Fix confettiplan crash (do first)
Apply the fix from CONFETTI-CRASH-FIX.md:
- Convert all `.functions.ts` → plain async functions
- Remove `tanstackStartStub()` from vite.config.ts
- Remove TanStack Start dependencies
- Get the site loading again

### Phase 2: Port the services layer
Copy from TimeApp into confettiplan:
```
services/
├── analytics/index.ts
├── booking/orchestrator.ts
├── booking/providers/   (opentable, resy, viator, stripe, chargepoint, mindbody)
├── booking/types.ts
├── events/index.ts + ticketmaster.ts
├── navigation/index.ts
├── nightlife/index.ts + yelp.ts
├── notifications/  (email, push, sms)
├── payments/index.ts + stripe.ts
├── rideshare/index.ts
├── wallet/index.ts
├── weather/index.ts
└── index.ts
```
These are standalone service modules with no framework dependency — they'll work as-is.

### Phase 3: Port the agent system
Copy from TimeApp into confettiplan:
```
src/lib/agents/
├── index.ts
├── agent-prompts.ts
├── ai-provider.ts
├── boost-credits.ts         (34KB)
├── chat-agent.ts            (21KB)
├── community.ts             (35KB)
├── group-collab.ts          (30KB)
├── interaction-tracker.ts
├── itinerary-orchestrator.ts (19KB)
├── trip-planner.ts          (21KB)
├── user-intelligence.ts     (21KB)
├── venue-discovery.ts       (29KB)
└── wallet-pass.ts           (17KB)
```
Also port:
- `src/lib/aiAgent.ts`
- `src/lib/funSectors.ts`
- `src/lib/routeIntelligence.ts`
- `src/lib/venue-discovery-types.ts`

### Phase 4: Port components (extract from monolith)
The TimeApp `App.tsx` is 217KB — a single file containing what should be dozens of components. The confettiplan repo already has these as separate files:
- `src/components/AdminWalletManager.tsx`
- `src/components/BoostViews.tsx` (37KB)
- `src/components/CommunityViews.tsx` (65KB)
- `src/components/GroupViews.tsx` (32KB)
- `src/components/VenueDiscoveryCard.tsx` (17KB)
- `src/components/WalletViews.tsx` (29KB)

Check if confettiplan already has equivalent components. If not, port these from TimeApp. If confettiplan has newer/better versions, keep those.

### Phase 5: Port supporting files
- `trust-layer/` (10 files — venue verification, crowd levels, transparent pricing, safety)
- `scripts/social-intel/` (social intelligence scanners)
- `data/venues/` (50+ city JSON files — large, consider git-lfs or a Supabase table)
- `supabase/functions/` — compare edge functions between repos, keep the superset
- `public/service-worker.js`

---

## Conflicts to Watch

| Area | confettiplan | TimeApp | Resolution |
|---|---|---|---|
| Tailwind version | v4 (@tailwindcss/vite) | v3 (postcss plugin) | Keep v4, update class names if needed |
| React plugin | @vitejs/plugin-react | @vitejs/plugin-react-swc | Keep SWC (faster builds) |
| Routing | TanStack Router (stubbed) | react-router-dom v6 | Use react-router-dom |
| Auth | TanStack middleware | Supabase client auth | Use Supabase client auth |
| Supabase project | zfeckvxkulreyapadanf | (check .env) | Confirm if same project |

---

## File-by-File Decision Matrix

Files ONLY in TimeApp (copy to confettiplan):
- All `services/**` files
- All `src/lib/agents/**` files
- `trust-layer/**`
- `scripts/social-intel/**`
- `data/venues/**`
- `skills/social-intelligence-tracker/**`
- Business docs (`Confetti_*.docx`, media kits, etc.)
- Landing pages (`.html` files at root)

Files ONLY in confettiplan (keep as-is):
- `src/lib/*.functions.ts` (after converting per Phase 1)
- `src/lib/*.server.ts` (server-side logic)
- Any Lovable-specific configuration

Files in BOTH (compare and merge):
- `package.json` (union of dependencies)
- `vite.config.ts` (confettiplan's after cleanup)
- `tsconfig.json`
- `supabase/functions/**` (keep superset)
- `src/components/**` (compare, keep newer)

---

## Important Notes

- **Do NOT push directly to confettiplan** if Lovable is managing it — Lovable may overwrite manual changes. Use Lovable's chat interface to make changes, or disable Lovable sync first.
- The 217KB `App.tsx` monolith in TimeApp should NOT be copied as-is. Its functionality needs to be decomposed into the component files that confettiplan already has.
- Venue data (50+ city JSON files) is large. Consider loading from Supabase instead of bundling in the repo.
