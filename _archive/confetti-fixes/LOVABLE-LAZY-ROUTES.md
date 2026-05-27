# Paste This Into Lovable

---

## CRITICAL: The main JS bundle is STILL 3,220 kB. Add lazy route loading NOW.

The vendor chunk split helped (down from 4,166 kB) but `index-CmMCTFsA.js` is still 3,220 kB because **every route component is eagerly loaded**. Users download ALL routes on first visit even though they only need ONE page. This is why the app still takes forever to load.

The fix is **lazy route loading with TanStack Router's `.lazy.tsx` convention**. This is the single most impactful change.

---

### How to do it — step by step

For EVERY route file EXCEPT `__root.tsx` and `index.tsx`, split it into two files:

**Example: `src/routes/auth.tsx`**

Currently `auth.tsx` contains both the route definition AND the component. Split it like this:

**File 1 — `src/routes/auth.tsx`** (keep only the route definition):
```tsx
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/auth')({})
```

**File 2 — `src/routes/auth.lazy.tsx`** (NEW file with the component):
```tsx
import { createLazyFileRoute } from '@tanstack/react-router'
// move ALL the imports and component code from the original auth.tsx here

export const Route = createLazyFileRoute('/auth')({
  component: AuthPage,
})

function AuthPage() {
  // ... the existing component code that was in auth.tsx
}
```

### Do this for ALL of these route files:

- `src/routes/auth.tsx`
- `src/routes/create.tsx`
- `src/routes/viral.tsx`
- `src/routes/ask.tsx`
- `src/routes/translate.tsx`
- `src/routes/vibe-plans.tsx`
- `src/routes/group-outing.tsx`
- `src/routes/boarding-pass.tsx`
- `src/routes/passport.tsx`
- `src/routes/me.tsx`
- `src/routes/about.tsx`
- `src/routes/advertise.tsx`
- `src/routes/contact.tsx`
- `src/routes/features.tsx`
- `src/routes/how-it-works.tsx`
- `src/routes/investors.tsx`
- `src/routes/portal.tsx`
- `src/routes/portal.index.tsx`
- `src/routes/pricing.tsx`
- `src/routes/testimonials.tsx`
- `src/routes/checkout.return.tsx`
- `src/routes/recap.$itineraryId.tsx`
- `src/routes/rsvp.$token.tsx`
- `src/routes/events.index.tsx`
- `src/routes/events.$eventId.tsx`
- `src/routes/teams.index.tsx`
- `src/routes/teams.new.tsx`
- `src/routes/teams.$id.tsx`
- `src/routes/profile.preferences.tsx`
- `src/routes/concierge.tsx`
- `src/routes/concierge.index.tsx`
- `src/routes/concierge.chat.$threadId.tsx`
- `src/routes/ideas.$slug.tsx`
- ALL `src/routes/admin.*.tsx` files (admin.bookings, admin.bootstrap, admin.business-claims, admin.moderation, admin.notifications, admin.outreach, admin.pick-analytics, admin.promoters, admin.roles, admin.users, admin.venues)
- ALL `src/routes/business.*.tsx` files (business.ai-refresh, business.billing, business.claim, business.claim.pending, business.dashboard, business.events, business.media, business.payouts, business.pending, business.promoters, business.settings, business.social)
- ALL `src/routes/promoter.*.tsx` files

### The pattern for EVERY file is:

1. The `.tsx` file keeps ONLY the `createFileRoute` call with search params, loaders, or beforeLoad if they exist — NO component code, NO heavy imports
2. The `.lazy.tsx` file gets the component, all UI imports, and uses `createLazyFileRoute` instead of `createFileRoute`
3. The component export uses the `component` property inside the lazy route object

### Key rules:

- `createFileRoute` stays in the base file (for route config like search params, loaders)
- `createLazyFileRoute` goes in the `.lazy.tsx` file (for the component)
- If a route has NO search params or loaders, the base `.tsx` file can just be: `export const Route = createFileRoute('/path')({})`
- Do NOT touch `__root.tsx` or `index.tsx` — those stay eagerly loaded
- Make sure the TanStack Router route generator config in `tsr.config.json` or `vite.config.ts` has NOT disabled lazy route detection

---

### DO NOT:
- Do NOT change the vendor manualChunks config — that's working correctly
- Do NOT remove or rename any route paths
- Do NOT switch from TanStack Router to any other router
- Do NOT add React.lazy() or React Suspense manually — TanStack Router handles this with `.lazy.tsx` files natively
- Do NOT change vercel.json

### Success criteria:
After this change, the Vite build output should show:
- `index-*.js` under 500 kB (currently 3,220 kB)
- Many new route chunk files like `auth.lazy-*.js`, `create.lazy-*.js`, etc.
- Each route chunk should be 5-80 kB, not thousands
