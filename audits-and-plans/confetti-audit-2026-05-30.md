# Confetti — Functions Audit (2026-05-30)

**Lens:** mobile-first (PWA is the real product; desktop just shouldn't look broken)
**Tested as:** logged-in customer on production (`ai-lifestyle-concierge.vercel.app`)

---

## ⚠️ RE-AUDIT against the CURRENT live deploy (supersedes older sections below)

The production build was **redeployed mid-session** (likely from a local dev server), so several earlier findings are now stale. Verified fresh against the live build:

### ✅ Working (verified live)
- **Plan / "Generate my plan"** — full 6-agent pipeline runs to completion → real DC boarding pass (CF-MOON-847: Kramerbooks & Afterwords Cafe, Dan's Cafe in Adams Morgan as the "twist"). The CORS failure is **gone** on this build.
- **City default** = Washington DC (after clearing stale local state). DMV city gate logic is correct.
- **Desktop layout** now full-width with a bottom tab bar (Home/Explore/Plan/Chat/Profile) — the earlier "bare phone card, no chrome" is resolved.
- Login/session (`SIGNED_IN`), Hub, Explore page load, vibe→occasion filters all work.

### ⛔ Broken (verified live, current build)
1. **Chat with Confetti returns blank replies.** `/api/chat` responds **200 with an empty body** (the assistant bubbles render empty); malformed input 500s. Vercel runtime logs show AI-SDK warnings on the 200s + a `TypeError`. Root cause: the streaming call in `api/chat.ts` on `ai@6` / `@ai-sdk/anthropic@2` (e.g. `maxTokens` was renamed to `maxOutputTokens`; model/params need updating). **Needs code fix + redeploy.**
2. **Explore returns 0 venues for every DC occasion.** Couples Night, Happy Hour, etc. all show "No spots indexed for Washington DC yet." Explore's indexed-venue source is empty for DC even though `dc-venues-seed.json` exists in the repo — the seed isn't loaded into prod (or the occasion tags don't match the query). A primary nav tab currently shows no content. (The AI Plan path finds venues via a different source, so this is isolated to Explore's DB index.)

### 🔎 Needs info / not reproduced
- **Cookie consent** — didn't re-trigger on `/new/hub` after clearing its flags, so not reproduced on this build; the cream-on-cream code fix stands for when it shows.
- **The 404** — still need the exact URL you hit.

### Stale (old deploy — now resolved on live build)
- CORS "Failed to fetch" on Plan ✅ works now
- Miami default ✅ shows DC now
- Bare desktop / missing tab bar ✅ full layout + tab bar present now

### Staged code fixes still pending deploy
Cookie consent contrast, static sitemap generator, OG image meta, footer social links, `orchestrator.functions.ts` Miami→Washington DC fallback, and the 7-function CORS rewrite (belt-and-suspenders — robust on both domains).

---

## (Original audit — partially superseded by the re-audit above)

## TL;DR — it's ~5 root causes, not 100 random bugs

Most of the "everything's broken" feeling traces to **two systemic causes**: a CORS
origin lock that kills the core AI features, and a cream-on-cream consent banner.
Two are already fixed in code this session. Nothing here is unfixable.

---

## P0 — Blocks core features

### 1. CORS origin lock → Plan / Chat / Taste all "Failed to fetch"  ⛔ needs deploy
- **Evidence:** Clicking "Generate my plan" → red "Failed to fetch". Network shows `OPTIONS /functions/v1/generate-plan` = 200, but the POST is blocked (status 0).
- **Root cause:** 8 edge functions hardcode `Access-Control-Allow-Origin: https://confettiplan.com`, but production runs on `ai-lifestyle-concierge.vercel.app`. Origin mismatch → browser blocks the response.
- **Affected (core):** `generate-plan`, `chat-concierge`, `taste-chat`, `generate-ideas`, `social-learn`, `send-notification` (+ 2 non-user functions). The other ~46 functions use the shared `getCorsHeaders()` helper (which already allows `.vercel.app`) and work fine.
- **Fix — instant (you, ~30s, no deploy):** Supabase dashboard → project `zfeckvxkulreyapadanf` → Edge Functions → Secrets → add `ALLOWED_ORIGIN = https://ai-lifestyle-concierge.vercel.app`. Functions read secrets at runtime.
- **Fix — proper (✅ staged in code, needs deploy):** All 7 hardcoded functions (`generate-plan`, `chat-concierge`, `taste-chat`, `generate-ideas`, `social-learn`, `send-notification`, `contract-expiration-digest`) now use the shared `getCorsHeaders(req)` (module-scope `let`, reassigned per request) so they echo the caller's origin and work on both `confettiplan.com` and `vercel.app`. Statically verified; final type-check + deploy happens via `supabase functions deploy` or the Supabase connector. No hardcoded CORS origins remain in any function.

### 2. Cookie consent text invisible (cream-on-cream)  ✅ fixed in code, needs deploy
- **Evidence:** Consent banner shows buttons but no readable text ("can't even see the consent").
- **Root cause:** `CookieConsent.tsx` card was `bg-cream` **and** `text-cream` → invisible heading + body; "Only essential" button also low-contrast.
- **Fix (done):** Card → `text-ink`, body → `text-ink/70`, "Only essential" button → `text-ink`. Staged in code; ships on next deploy.

---

## P1 — High impact

### 3. Plan wizard location defaults to "Miami" (soft launch is DMV-only)  🔎 investigate
- **Evidence:** `/new/plan` "Where" pre-filled **Miami**; soft launch is DC/DMV. Risk: users routed into cities with no seeded venues → empty/garbage plans.
- **Next:** check the city-default / geolocation logic and the `useCityGate` interaction; default to DMV (or detected supported city) and gate unsupported cities.

### 4. 404 on a route + consent overlapping it  🔎 need the URL
- **Evidence:** You hit the styled 404 with the (broken) consent banner overlapping bottom-left.
- **Status:** The 404 page itself renders correctly; the overlap was the consent bug (#2, now fixed). Index routes (`/cities`, `/events`, `/trips`) resolve fine. **Tell me the exact URL that 404'd** and I'll pin whether it's a missing route, a stale link, or an SPA-fallback gap.

---

## P2 — Lower priority under mobile-first

### 5. No desktop app shell on `/new/*`
- The app screens are a mobile-only phone shell; `SiteHeader`/`SiteFooter` are only on marketing routes, and the bottom `TabBar` is `lg:hidden`. On desktop = floating card, no nav. **On mobile the TabBar + in-card back work**, so this is deprioritized per mobile-first — but desktop should at least get a minimal centered frame so it doesn't look gutted.

### 6. Labeled "coming soon" features (expected, not bugs)
- Map view on Explore, Apple Wallet pass, Party Room/group planning, photo upload in reviews, personalized picks, swap-stop. Finish or hide before App Store submit (Apple rejects visible-but-dead features).

---

## Already shipped this session (staged in code, pending deploy)
- Static `sitemap.xml` generator wired into build (fixes `/sitemap.xml` 404)
- OG/Twitter image meta corrected + `summary_large_image`
- Footer desktop social links now real (were a "coming soon" toast)
- Cookie consent contrast (#2)

## What unblocks the rest
1. **Deploy** (git is locked by the desktop app): `cd ~/ai-lifestyle-concierge && rm -f .git/index.lock && git add -A && git commit -m "audit fixes" && git push origin main`
2. **Connect Confetti's Supabase** (`zfeckvxkulreyapadanf`) so I can (a) deploy the proper CORS fix and (b) seed real admin/owner/promoter/influencer roles. *Or* set the `ALLOWED_ORIGIN` secret yourself for instant CORS relief.
