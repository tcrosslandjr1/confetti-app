# Confetti Performance Fixes — Implementation Guide

**Project:** TanStack Start (SSR) + TanStack Router v1 + Vite 7 + React 19
**Current FCP:** 12.6s → **Target FCP:** < 3s
**Current bundle:** 3.1 MB monolithic → **Target:** < 500 KB initial

---

## Fix 1: Code-Split Routes with TanStack Router Lazy Loading

**Impact:** Cuts initial JS from ~3.1 MB to ~400–500 KB
**Effort:** Medium — split each route file into two files

### How It Works

TanStack Router's file-based routing supports a `.lazy.tsx` convention. When you split a route into two files, the router auto-generates lazy imports in `routeTree.gen.ts`:

- `routes/about.tsx` → keeps only the route **config** (loaders, search params, beforeLoad)
- `routes/about.lazy.tsx` → holds the **component** (the heavy JSX + its imports)

The route tree generator then produces `lazyImport()` calls instead of static imports — Vite automatically code-splits each lazy file into its own chunk.

### Step-by-Step for Each Route

Take **every route except `__root.tsx` and `index.tsx`** and split it.

#### Before — `src/routes/pricing.tsx` (single file, everything eager-loaded):

```tsx
import { createFileRoute } from "@tanstack/react-router";
import { Helmet } from "react-helmet"; // example heavy imports
import { PricingTable } from "@/components/PricingTable";
import { StripeProvider } from "@/components/StripeProvider";
// ... more imports

export const Route = createFileRoute("/pricing")({
  component: PricingPage,
});

function PricingPage() {
  return (
    <StripeProvider>
      <PricingTable />
    </StripeProvider>
  );
}
```

#### After — split into TWO files:

**`src/routes/pricing.tsx`** (config only — tiny, eagerly loaded):

```tsx
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/pricing")({
  // Keep loaders, search params, beforeLoad here if any
  // Do NOT put component here
});
```

**`src/routes/pricing.lazy.tsx`** (component — code-split, loaded on demand):

```tsx
import { createLazyFileRoute } from "@tanstack/react-router";
import { PricingTable } from "@/components/PricingTable";
import { StripeProvider } from "@/components/StripeProvider";

export const Route = createLazyFileRoute("/pricing")({
  component: PricingPage,
});

function PricingPage() {
  return (
    <StripeProvider>
      <PricingTable />
    </StripeProvider>
  );
}
```

### Routes to Split (Priority Order)

Split these first — they pull in the heaviest dependencies:

| Route file | Why it's heavy |
|---|---|
| `pricing.tsx` | Imports Stripe (~988 KB) |
| `plan.tsx` | Likely imports maps, AI SDK |
| `admin.*.tsx` (all admin routes) | Full admin UI, charts, tables |
| `partners.tsx` / `partner.tsx` | Business dashboards |
| `portal.tsx` | Admin portal |
| `vibe-plans.tsx` | Complex UI |
| `quick-generate.tsx` | AI generation |
| `taste-tuner.tsx` | Complex interactive UI |
| `reservations.tsx` | Booking flows |
| `weather.tsx` | Weather API integration |
| `teams.tsx` | Team management |
| `translate.tsx` | Translation features |

Then split the remaining routes: `about`, `accessibility`, `active-confetti`, `active-loop`, `testimonials`, `terms`, `privacy`, `viral`, `scan`, `reset-password`, `qa`, `promoter`, `passport`, `sitemap[.]xml`.

**Leave these as single files** (they should load eagerly):
- `__root.tsx` — the root layout, always needed
- `index.tsx` — the landing page, first thing users see

### After Splitting: Regenerate the Route Tree

Run `vite dev` or `npx tsr generate` — TanStack Router will auto-detect the `.lazy.tsx` files and regenerate `routeTree.gen.ts` with lazy imports. The generated file will change from:

```ts
// BEFORE (static import — all code in one bundle)
import { Route as PricingRouteImport } from './routes/pricing'
```

to:

```ts
// AFTER (lazy import — separate chunk)
const PricingLazyImport = createLazyFileRoute('/pricing')({})
// ... with the actual component loaded on demand
```

### Lovable Prompt

If you're using the Lovable AI editor, paste this prompt:

> **Split all route files (except `__root.tsx` and `index.tsx`) into lazy-loaded pairs using TanStack Router's `.lazy.tsx` convention. For each route like `src/routes/pricing.tsx`, create a `src/routes/pricing.lazy.tsx` that holds the component and all its imports, and keep only the `createFileRoute` config (loaders, search params, beforeLoad) in the original file. Use `createLazyFileRoute` in the lazy files. This will let TanStack Router auto-generate lazy imports in `routeTree.gen.ts` so Vite code-splits each route into its own chunk.**

---

## Fix 2: Defer Stripe.js to Payment Routes Only

**Impact:** Removes ~988 KB from initial load for 90%+ of pages
**Effort:** Low

### The Problem

The `stripe` npm package (v22) and/or `@stripe/stripe-js` loads Stripe's 988 KB JavaScript on every page, even though only the pricing/checkout flow needs it.

### The Fix: Lazy-Load Stripe

Create a wrapper that only loads Stripe when needed:

**`src/lib/stripe-lazy.ts`** (new file):

```ts
import { lazy } from "react";

let stripePromise: Promise<any> | null = null;

/**
 * Lazily loads Stripe.js only when called.
 * Use this instead of importing stripe at the top level.
 */
export function getStripe() {
  if (!stripePromise) {
    stripePromise = import("@stripe/stripe-js").then(({ loadStripe }) =>
      loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY)
    );
  }
  return stripePromise;
}
```

**Then in your Stripe-using components**, replace:

```tsx
// BEFORE — eagerly loads Stripe everywhere
import { loadStripe } from "@stripe/stripe-js";
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);
```

with:

```tsx
// AFTER — loads Stripe only when this component renders
import { getStripe } from "@/lib/stripe-lazy";

function CheckoutButton() {
  const handleCheckout = async () => {
    const stripe = await getStripe();
    // ... use stripe
  };
  return <button onClick={handleCheckout}>Checkout</button>;
}
```

### Check `__root.tsx` for Stripe Script Tags

If there's a `<script src="https://js.stripe.com/v3/">` in the root layout's `head()` or `scripts` — **remove it**. The npm package loads Stripe programmatically when needed.

### Lovable Prompt

> **Stripe.js (988 KB) is loading on every page. Create a `src/lib/stripe-lazy.ts` utility that lazily imports `@stripe/stripe-js` only when `getStripe()` is called. Update all components that use Stripe to import from this lazy wrapper instead of importing `@stripe/stripe-js` or `loadStripe` directly. Remove any `<script src="https://js.stripe.com/v3/">` tags from `__root.tsx` or the HTML head. Stripe should ONLY load on pricing and checkout pages.**

---

## Fix 3: Optimize `__root.tsx` Provider Stack

**Impact:** Reduces main-thread blocking by ~200–400ms
**Effort:** Medium

### The Problem

`__root.tsx` eagerly imports ~15 providers and utilities that wrap every page:
`AuthProvider`, `Toaster`, `WizardProvider`, `ScrollProgress`, `ReferralCapture`, `TabBar`, `PageTransition`, `FirstRunNudge`, `MapProvider`, `preloadFallbackImages`, `installErrorTracking`

Many of these aren't needed on every route (e.g., `MapProvider` only for map pages, `WizardProvider` only for the wizard flow).

### The Fix: Lazy-Load Non-Critical Providers

The file already uses `React.lazy()` for `RoleSwitcher`, `BuildMyNightWizard`, and `CookieConsent` — extend this pattern:

**In `src/routes/__root.tsx`**, change eagerly imported providers to lazy + Suspense:

```tsx
// BEFORE — eagerly loaded
import { MapProvider } from "@/components/maps/MapProvider";
import { FirstRunNudge } from "@/components/FirstRunNudge";
import { ScrollProgress } from "@/components/ScrollProgress";
import { ReferralCapture } from "@/components/ReferralCapture";

// AFTER — lazy loaded
const MapProvider = lazy(() =>
  import("@/components/maps/MapProvider").then((m) => ({
    default: m.MapProvider,
  }))
);
const FirstRunNudge = lazy(() =>
  import("@/components/FirstRunNudge").then((m) => ({
    default: m.FirstRunNudge,
  }))
);
const ScrollProgress = lazy(() =>
  import("@/components/ScrollProgress").then((m) => ({
    default: m.ScrollProgress,
  }))
);
const ReferralCapture = lazy(() =>
  import("@/components/ReferralCapture").then((m) => ({
    default: m.ReferralCapture,
  }))
);
```

Then wrap them in `<Suspense>`:

```tsx
<Suspense fallback={null}>
  <ScrollProgress />
</Suspense>
<Suspense fallback={null}>
  <FirstRunNudge />
</Suspense>
<Suspense fallback={null}>
  <ReferralCapture />
</Suspense>
```

**Keep these eagerly loaded** (they're critical for every page):
- `AuthProvider` — auth state needed immediately
- `Toaster` — tiny, used everywhere
- `QueryClientProvider` — data fetching foundation
- `Outlet` — TanStack Router requires it

### Lovable Prompt

> **In `src/routes/__root.tsx`, convert the following providers/components from eager imports to `React.lazy()` with `<Suspense fallback={null}>`: MapProvider, FirstRunNudge, ScrollProgress, ReferralCapture, PageTransition, TabBar. Keep AuthProvider, Toaster, QueryClientProvider, and Outlet as eager imports since they're critical. The file already uses lazy() for RoleSwitcher, BuildMyNightWizard, and CookieConsent — follow that same pattern.**

---

## Fix 4: Optimize Font Loading

**Impact:** Saves ~200–500ms on FCP
**Effort:** Low

### The Fix: Add Font Preload to Root Head

In `src/routes/__root.tsx`, inside the `head()` function, add font preload links:

```tsx
export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      // ... existing meta tags
    ],
    links: [
      // Preload your primary fonts (adjust paths to match your actual font files)
      {
        rel: "preload",
        href: "/fonts/your-primary-font.woff2",
        as: "font",
        type: "font/woff2",
        crossOrigin: "anonymous",
      },
    ],
  }),
  // ...
});
```

### If Using Google Fonts via CSS `@import`

Check `src/styles.css` — if it has `@import url('https://fonts.googleapis.com/...')`, replace with preconnect + preload in `__root.tsx` head:

```tsx
links: [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "preload",
    href: "https://fonts.googleapis.com/css2?family=Your+Font:wght@400;500;700&display=swap",
    as: "style",
  },
],
```

And add `font-display: swap` to any `@font-face` declarations in CSS.

### Lovable Prompt

> **Optimize font loading in `src/routes/__root.tsx` and `src/styles.css`. Add `rel="preconnect"` links for any Google Fonts domains in the head() function. If fonts are loaded via CSS `@import`, convert them to `<link rel="preload">` in the head. Add `font-display: swap` to all `@font-face` declarations so text renders immediately with a fallback font.**

---

## Fix 5: Lazy-Load Images & Reduce Initial DOM

**Impact:** Saves ~300–800ms on LCP
**Effort:** Low

### Lazy-Load Below-Fold Images

Find all `<img>` tags in components that render below the first viewport and add `loading="lazy"`:

```tsx
// BEFORE
<img src="/hero-bg.jpg" alt="..." />

// AFTER — for images below the fold
<img src="/hero-bg.jpg" alt="..." loading="lazy" decoding="async" />
```

**Do NOT add `loading="lazy"` to:**
- The hero image on the landing page (it's the LCP element)
- Any image in the first visible viewport

### Add Width/Height to Prevent Layout Shift

```tsx
<img
  src="/venue-photo.jpg"
  alt="..."
  loading="lazy"
  decoding="async"
  width={400}
  height={300}
/>
```

### Lovable Prompt

> **Add `loading="lazy"` and `decoding="async"` to all `<img>` tags that render below the fold across all components. Do NOT add lazy loading to the hero/landing page main image (it's the LCP element). Also add explicit `width` and `height` attributes to all images to prevent cumulative layout shift.**

---

## Vite Build Configuration (Optional but Recommended)

If you have access to `vite.config.ts`, add manual chunks to further optimize splitting:

```ts
// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { tanstackStart } from "@tanstack/react-start/plugin";

export default defineConfig({
  plugins: [tanstackStart(), react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks — loaded once, cached forever
          "vendor-react": ["react", "react-dom"],
          "vendor-router": [
            "@tanstack/react-router",
            "@tanstack/react-query",
          ],
          "vendor-ui": [
            "@radix-ui/react-dialog",
            "@radix-ui/react-dropdown-menu",
            "@radix-ui/react-accordion",
            "@radix-ui/react-tooltip",
          ],
          "vendor-motion": ["framer-motion"],
          "vendor-charts": ["recharts"],
          // Stripe in its own chunk — only loaded on payment pages
          "vendor-stripe": ["stripe", "@stripe/stripe-js"],
        },
      },
    },
  },
});
```

### Lovable Prompt

> **In `vite.config.ts`, add `build.rollupOptions.output.manualChunks` to split vendor dependencies into separate cached chunks: react + react-dom, tanstack router + query, radix-ui components, framer-motion, recharts, and stripe. This prevents re-downloading the entire bundle when only app code changes.**

---

## Implementation Order

1. **Fix 1 (Route splitting)** — Biggest impact. Start with the 5 heaviest routes (pricing, plan, admin.*, partners, portal), verify the build works, then do the rest.
2. **Fix 2 (Stripe defer)** — Quick win, removes ~1 MB from most pages.
3. **Fix 3 (Root providers)** — Moderate effort, reduces main-thread blocking.
4. **Fix 4 (Fonts)** — Quick CSS/config change.
5. **Fix 5 (Images)** — Quick HTML attribute changes.

## Expected Results

| Metric | Before | After (estimated) |
|---|---|---|
| FCP | 12.6s | 2–3s |
| LCP | ~12.7s | 2.5–3.5s |
| TBT | ~1,000ms | < 300ms |
| Initial JS | 3,146 KB | 400–500 KB |
| Total payload | 8.2 MB | ~2–3 MB |

---

*Generated from the Confetti Performance Audit — May 19, 2026*
