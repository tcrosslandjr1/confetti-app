# Confetti — Page-Load Performance Audit

**URL:** https://confettiplan.lovable.app/  
**Date:** May 19, 2026  
**Profiles:** Desktop (fast 4G) · Mobile (4G, 4× CPU slowdown estimated)  
**Auditor:** Claude (browser Performance API + Resource Timing API)

---

## Executive Summary

Confetti's landing page has a **critical rendering performance problem**. The HTML shell loads in ~2s, but users see nothing until **12.6 seconds** on a warm desktop load — the page is a fully client-rendered React SPA with a **3.1 MB monolithic JavaScript bundle** that must download, parse, and execute before any content appears. Total decoded payload is **8.2 MB across 41 resources**, with Stripe.js (988 KB) loading on a page that has no checkout. There is no server-side rendering, no code splitting, and no lazy loading.

On mobile with 4G + CPU throttling, estimated FCP would exceed **18–25 seconds**, making the app functionally unusable for first-time visitors.

The good news: 5 targeted fixes can bring LCP under the 2.5s SLA target on desktop and under 4s on mobile. All are achievable within the Lovable/Vite build system.

---

## Core Web Vitals — Measured

| Metric | Desktop (Measured) | Mobile (Estimated) | SLA Target | Status |
|--------|-------------------|-------------------|------------|--------|
| **TTFB** | 2,030 ms (cold) / 340 ms (warm) | ~2,500 ms | < 600 ms | ❌ FAIL (cold) / ✅ PASS (warm) |
| **FCP** | 12,648 ms | ~18,000–25,000 ms | < 1,800 ms | ❌ CRITICAL |
| **LCP** | ~12,700 ms (est.) | ~20,000+ ms | < 2,500 ms | ❌ CRITICAL |
| **TBT** | Not directly measured; 3.1 MB JS parse = ~800–1,200 ms est. | ~3,000–5,000 ms | < 150 ms | ❌ CRITICAL |
| **CLS** | 0.0 measured (post-load) | ~0.05–0.15 est. with fonts | < 0.1 | ⚠️ AT RISK |

---

## Navigation Timing Breakdown

| Phase | Time |
|-------|------|
| DNS Lookup | 0 ms (cached) |
| TCP Connect | 0 ms (reused) |
| TTFB (cold) | 2,030 ms |
| Server Response | 2 ms |
| DOM Interactive | 2,049 ms |
| DOM Content Loaded | 2,110 ms |
| Load Complete | 2,338 ms |
| **First Paint** | **12,648 ms** |
| **First Contentful Paint** | **12,648 ms** |

The 10-second gap between Load Complete (2.3s) and First Paint (12.6s) is the JS parse + execute + React render cycle for the monolithic bundle.

---

## Resource Waterfall — Top Resources by Decoded Size

| # | Resource | Type | Decoded Size | Duration | Start | Blocking |
|---|----------|------|-------------|----------|-------|----------|
| 1 | **index-CrHwFqh5.js** | script | **3,146 KB** | 10 ms | 2,042 ms | non-blocking (module) |
| 2 | **stripe.js** (js.stripe.com) | script | **988 KB** | 98 ms | 2,108 ms | non-blocking (async) |
| 3 | vendor-supabase-iCxVMDLl.js | other | 202 KB | 17 ms | 346 ms | non-blocking |
| 4 | vendor-motion-DJoLhDgu.js | other | 123 KB | 17 ms | 346 ms | non-blocking |
| 5 | vendor-router-CZZDfALY.js | other | 101 KB | 13 ms | 346 ms | non-blocking |
| 6 | vendor-ui-B7ZHqrKQ.js | other | 98 KB | 20 ms | 346 ms | non-blocking |
| 7 | styles-DcVWm3YC.css | link | 279 KB | — | — | — |
| 8 | Unsplash photo 1 | img | 340 KB | 29 ms | 3,359 ms | — |
| 9 | Unsplash photo 2 | img | 318 KB | 27 ms | 3,359 ms | — |
| 10 | Google Fonts CSS (×4 duplicates) | link | ~5 KB each | 47 ms | 1,408 ms | non-blocking |

**Summary:** 41 total resources · 8,445 KB decoded · 13 JS files · 1 CSS file · 6+ Google Font families

---

## Resource Breakdown

| Category | Count | Total Decoded |
|----------|-------|--------------|
| JavaScript | 13 | ~4,700 KB |
| CSS | 1 + Google Fonts | ~284 KB |
| Images (Unsplash) | 2+ | ~660 KB |
| Fonts (Instrument Serif, Bricolage Grotesque, Space Mono) | 6+ variants | ~200 KB est. |
| **Total** | **41** | **~8,445 KB** |

---

## Architecture Issues Identified

1. **No SSR/SSG** — Pure client-side React SPA. Empty `<div id="root">` until JS executes. No meaningful content in initial HTML.
2. **Monolithic bundle** — `index-CrHwFqh5.js` at 3.1 MB decoded contains the entire app. No route-based code splitting.
3. **Stripe loaded on landing page** — `stripe.js` (988 KB) is async-loaded on every page, but checkout functionality isn't on the landing page.
4. **Excessive DOM** — 1,818 elements with max depth of 18 on the landing page alone.
5. **Duplicate font preloads** — Google Fonts `css2` link is preloaded 4 times.
6. **Three font families** — Instrument Serif (3+ weights), Bricolage Grotesque (4 weights), Space Mono — each requires a network roundtrip.
7. **No image lazy loading** — Unsplash images load eagerly even if below the fold.
8. **No `font-display: swap`** — Some font variants show status "unloaded," suggesting blocking font behavior.

---

## Top 5 Contributors — Prioritized Remediation Backlog

### Fix #1: Code-Split the Monolithic JS Bundle

| Field | Detail |
|-------|--------|
| **Contributor to** | LCP, TBT, FCP |
| **Root Cause** | `index-CrHwFqh5.js` (3,146 KB) contains every route, component, and library in one file. The browser must download, parse, and execute the entire bundle before rendering anything. |
| **File** | `index-CrHwFqh5.js` (build output); source: Vite config + route definitions |
| **1-Line Fix** | Add `React.lazy()` + `Suspense` for all routes and enable Vite's `manualChunks` in `vite.config.ts` to split vendor libs. |
| **Detailed Fix** | In `vite.config.ts`, add `build.rollupOptions.output.manualChunks` to separate: (a) React core, (b) Supabase, (c) Framer Motion, (d) Radix UI, (e) route-specific code. Wrap all route components in `React.lazy(() => import('./pages/PageName'))` with a `<Suspense fallback={<Skeleton/>}>`. |
| **Impact** | **HIGH** — Reduces initial JS parse from ~3.1 MB to ~200–400 KB. Expected FCP improvement: 8–10 seconds. |
| **Effort** | 4–6 hours |
| **Rollback** | Revert `vite.config.ts` changes and lazy imports. Single commit. |
| **Acceptance Criteria** | Initial JS bundle < 400 KB decoded. FCP < 3s on desktop. |

---

### Fix #2: Defer Stripe.js to Checkout Pages Only

| Field | Detail |
|-------|--------|
| **Contributor to** | TBT, LCP |
| **Root Cause** | `stripe.js` (988 KB decoded) loads async on every page including the landing page, where there is no payment UI. It competes for bandwidth and CPU during critical render. |
| **File** | Likely in `index.html` `<head>` or a root-level component |
| **1-Line Fix** | Move the Stripe `<script>` tag into the checkout/payment component and load it dynamically only when needed. |
| **Detailed Fix** | Remove `<script async src="https://js.stripe.com/v3/">` from `index.html`. In the checkout component, use `@stripe/stripe-js` loadStripe() which lazy-loads the SDK on demand. |
| **Impact** | **HIGH** — Eliminates ~1 MB of JS download + parse on landing page. TBT reduction: ~200–400 ms. |
| **Effort** | 1–2 hours |
| **Rollback** | Re-add the script tag to `index.html`. |
| **Acceptance Criteria** | Stripe.js not present in network waterfall on landing page load. TBT reduced by ≥ 200 ms. |

---

### Fix #3: Add SSR or Static Pre-rendering for Landing Page

| Field | Detail |
|-------|--------|
| **Contributor to** | FCP, LCP, TTFB |
| **Root Cause** | The landing page is fully client-rendered. The server returns an empty HTML shell (`<div id="root"></div>`), so no content is visible until JS completes. |
| **File** | App architecture (Vite SPA config) |
| **1-Line Fix** | Use `vite-plugin-ssr` or migrate the landing page to a static HTML page with critical CSS inlined. |
| **Detailed Fix** | Option A (Quick): Pre-render the landing page HTML at build time using `vite-plugin-ssg` — the hero section, nav, and CTA become visible immediately. Option B (Lovable constraint): If SSR isn't possible in Lovable, inline the critical above-the-fold HTML and CSS directly in `index.html` so users see content before React boots. |
| **Impact** | **HIGH** — FCP drops from 12.6s to ~1–2s. LCP drops to ~2–3s. |
| **Effort** | 6–10 hours (depends on Lovable platform constraints) |
| **Rollback** | Remove SSR plugin or revert `index.html` to SPA shell. |
| **Acceptance Criteria** | Meaningful content visible within 2s on desktop without JS execution. |

---

### Fix #4: Optimize Font Loading Strategy

| Field | Detail |
|-------|--------|
| **Contributor to** | CLS, FCP |
| **Root Cause** | Three Google Font families (Instrument Serif, Bricolage Grotesque, Space Mono) across 8+ weights load via render-blocking CSS. Duplicate preload tags (4× for `css2`). Some fonts show "unloaded" status, causing flash of invisible text (FOIT). |
| **File** | `index.html` `<head>` section |
| **1-Line Fix** | Add `&display=swap` to all Google Fonts URLs, remove duplicate preloads, and self-host fonts with `font-display: swap`. |
| **Detailed Fix** | (1) Deduplicate the 4 identical Google Fonts preloads down to 2 (one per family). (2) Append `&display=swap` to every Google Fonts URL. (3) Consider self-hosting with `fontsource` packages for Instrument Serif and Bricolage Grotesque to eliminate the fonts.googleapis.com roundtrip. (4) Subset fonts to Latin only if not serving international users. |
| **Impact** | **MEDIUM** — Eliminates FOIT. Reduces CLS from font reflow. Saves ~200 ms on font-critical path. |
| **Effort** | 2–3 hours |
| **Rollback** | Restore original Google Fonts links. |
| **Acceptance Criteria** | Zero duplicate font preloads. All fonts use `font-display: swap`. CLS < 0.1. |

---

### Fix #5: Lazy-Load Below-the-Fold Images and Reduce DOM Size

| Field | Detail |
|-------|--------|
| **Contributor to** | LCP, TBT |
| **Root Cause** | Unsplash images (~660 KB total) load eagerly on page load. 1,818 DOM elements rendered on the landing page when only the hero section is visible. |
| **Files** | Image components throughout the landing page |
| **1-Line Fix** | Add `loading="lazy"` to all `<img>` tags below the fold; use `Intersection Observer` for component-level lazy rendering. |
| **Detailed Fix** | (1) Add `loading="lazy"` and explicit `width`/`height` attributes to all non-hero images. (2) For the sections below the fold (testimonials, features grid, pricing), wrap them in a lazy-render component that only mounts when scrolled into view. (3) Use Unsplash's URL parameters (`?w=800&q=75&fm=webp`) to serve optimized, right-sized images. |
| **Impact** | **MEDIUM** — Reduces initial download by ~500 KB. Fewer DOM nodes at first paint reduces TBT by ~100–200 ms. |
| **Effort** | 2–3 hours |
| **Rollback** | Remove `loading="lazy"` attributes and lazy-render wrappers. |
| **Acceptance Criteria** | Below-fold images not in network waterfall until scroll. Initial DOM < 800 elements. |

---

## Priority Matrix

| Fix | Impact | Effort | Priority |
|-----|--------|--------|----------|
| #1 Code-split JS bundle | 🔴 Critical | 4–6 hrs | **P0** |
| #2 Defer Stripe.js | 🔴 High | 1–2 hrs | **P0** |
| #3 SSR / pre-render landing | 🔴 High | 6–10 hrs | **P1** |
| #4 Font loading strategy | 🟡 Medium | 2–3 hrs | **P2** |
| #5 Lazy-load images + DOM | 🟡 Medium | 2–3 hrs | **P2** |

**Recommended shipping order:** #2 → #1 → #4 → #5 → #3 (quick win first, then biggest impact, then structural change last).

---

## Estimated Post-Fix Metrics

| Metric | Current | After Fixes #1+#2 | After All Fixes | Target |
|--------|---------|-------------------|-----------------|--------|
| FCP (desktop) | 12,648 ms | ~2,500 ms | ~800–1,200 ms | < 1,800 ms |
| LCP (desktop) | ~12,700 ms | ~3,000 ms | ~1,500–2,500 ms | < 2,500 ms |
| TBT (desktop) | ~800–1,200 ms | ~200–400 ms | ~80–150 ms | < 150 ms |
| CLS | ~0.05 | ~0.03 | < 0.05 | < 0.1 |
| TTFB (cold) | 2,030 ms | 2,030 ms | ~400–600 ms (with SSR) | < 600 ms |

---

## Checklist — Completed During Audit

- [x] Capture lab FCP, paint timing, navigation timing
- [x] Collect resource waterfall with full size/timing data (41 resources)
- [x] Identify all JS bundles with decoded sizes
- [x] Analyze DOM size and depth (1,818 elements, depth 18)
- [x] Check font loading strategy (3 families, duplicate preloads)
- [x] Identify render-blocking resources
- [x] Map top 5 contributors to LCP, CLS, TBT
- [x] Produce prioritized fixes with impact/effort/rollback
- [ ] RUM p50/p75/p95 (requires production analytics — not available)
- [ ] WebPageTest filmstrip + HAR (external tool — API not available)
- [ ] 10s main-thread trace (requires Chrome DevTools Protocol)
- [ ] Lighthouse JSON (PageSpeed API rate-limited at time of audit)

---

## Notes on Lovable Platform Constraints

Confetti is deployed on Lovable, which provides a managed Vite + React build pipeline. Some fixes (especially #3 SSR) may be constrained by what Lovable exposes in its build configuration. Fixes #1, #2, #4, and #5 are all achievable within standard Lovable project settings via `vite.config.ts` and component-level changes. If SSR is not supported by Lovable, Fix #3 can be approximated by inlining critical HTML/CSS in `index.html`.

---

*Audit conducted using browser Performance API, Resource Timing API, and DOM analysis on Chrome. Transfer sizes shown as decoded (post-decompression) since resources were served with gzip encoding. Estimated compressed transfer sizes are ~30–35% of decoded for JS bundles.*
