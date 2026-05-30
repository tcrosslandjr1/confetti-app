# Confetti — Soft Launch Checklist

**Date:** May 28, 2026
**Target:** Friends & Family soft launch this week
**Production URL:** https://ai-lifestyle-concierge.vercel.app

---

## Ready to Go

### Core App

- [x] Landing page live with DC venues (Dauphine's, Decades DC, The Gibson, Perry's Rooftop)
- [x] Zero San Francisco / placeholder venue references remaining
- [x] Auth flow working — email/password, Google OAuth, Apple OAuth
- [x] Username availability check (debounced RPC)
- [x] Referral code validation on signup
- [x] Redirect handling after login
- [x] Demo/test accounts seeded and functional
- [x] City gate (useCityGate) — DMV users pass through, non-DMV see waitlist splash
- [x] FirstRunNudge guides new users to "Plan my night" wizard
- [x] Explore page with venue search, category filters, list/map toggle
- [x] Happy Hour deals promo card on Explore
- [x] Boarding pass itinerary format rendering
- [x] 404 catch-all route with comprehensive redirect map for old URLs
- [x] Error boundary with retry + go-home actions
- [x] Cookie consent component
- [x] Legal hub with privacy, terms, accessibility, cookie policy

### PWA & Install

- [x] manifest.webmanifest — name "Confetti", 8 icon sizes, standalone display
- [x] All PWA icons present: 72, 96, 128, 144, 152, 192, 384, 512px
- [x] Service worker (sw.js) registered on load
- [x] SPA fallback via 404.html for direct URL hits
- [x] Apple mobile web app meta tags configured

### SEO & Social

- [x] OG image (og-image.png, 31KB) in public/
- [x] index.html meta tags — OG title, description, image all point to correct Vercel URL
- [x] Twitter Card meta tags configured (summary_large_image)
- [x] robots.txt — allows /, blocks auth/admin/api/portal paths
- [x] Sitemap URL in robots.txt points to ai-lifestyle-concierge.vercel.app
- [x] JSON-LD structured data (Organization + WebSite with SearchAction) in \_\_root.tsx
- [x] Google Site Verification tag present

### Analytics & Tracking

- [x] Route-level pageview tracking (usePageview)
- [x] Engagement event tracking (trackEngagement)
- [x] Business analytics tracker component
- [x] Error tracking installed (installErrorTracking)
- [x] Ad impression tracking on sponsored marquee slots

### Brand Integrity

- [x] Zero Heritage Power Group references in codebase
- [x] Zero placeholder/lorem ipsum content
- [x] No broken buttons or dead click handlers (8 flagged files audited — all false positives)

---

## Known Issues (Non-Blocking)

### Minor

- **Stale OG image in \_\_root.tsx** — Lines 187-195 reference an old R2 CDN URL from the Lovable era. Not blocking because social crawlers see index.html meta tags (correct URL) before JS hydration. Fix when convenient.
- **Sitemap returns 404** — `src/routes/sitemap[.]xml.ts` uses a TanStack Start server handler, but the app deploys as a client-side SPA on Vercel. The route will 404. Fix: generate a static `public/sitemap.xml` or add a Vercel serverless function.
- **Social links show "coming soon" toast** — Footer social buttons (Instagram, TikTok, etc.) trigger a toast instead of navigating. Fine for soft launch.

### Cosmetic

- **Map view placeholder** — Explore page map toggle shows "Map view coming online" placeholder. List view works.
- **"Coming soon" feature labels** — Photo upload in reviews, Apple Wallet pass, group planning swap-stop, personalized picks. All properly labeled.

---

## "Coming Soon" Features (Expected & Labeled)

These are intentionally gated with proper UI messaging — no broken experiences:

1. Photo upload in review form
2. Apple Wallet pass export from boarding pass
3. Group planning (Party Room) in trip detail and wizard
4. Swap-stop feature in trip itineraries
5. Personalized picks section on app home
6. Map view on Explore page

---

## Test Accounts

| Role           | Email                     | Password        |
| -------------- | ------------------------- | --------------- |
| Admin          | admin@confettiplan.com    | testadmin123    |
| Business Owner | owner@confettiplan.com    | testowner123    |
| Customer       | customer@confettiplan.com | testcustomer123 |
| Visitor        | (no login required)       | —               |

---

## Pre-Launch Actions

### Before sharing the link:

1. **Open the app yourself** — walk through landing page → sign up → explore → plan a night → view boarding pass. Confirm the full flow works end-to-end on your phone.
2. **Test on iOS Safari** — PWA install prompt, boarding pass rendering, wizard flow.
3. **Test on Android Chrome** — same as above.
4. **Verify Supabase is awake** — if the project has been idle, the first request may be slow. Hit the app once to warm it up before sending links.

### Share message template:

> Hey! I've been building something and would love your honest feedback. It's called Confetti — an AI-powered app that plans your nights out in DC. Try it here: https://ai-lifestyle-concierge.vercel.app
>
> Sign up, hit "Plan my night," and let me know what you think. Still early — your feedback shapes what's next.

---

## Post-Launch Monitoring

- Watch Vercel deployment logs for build errors
- Monitor Supabase dashboard for auth failures or edge function errors
- Check analytics for drop-off points in the signup → first plan flow
- Collect feedback via DMs or a shared note — patterns matter more than individual complaints
