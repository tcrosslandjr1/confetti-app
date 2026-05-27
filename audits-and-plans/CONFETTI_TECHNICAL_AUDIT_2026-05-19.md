# Confetti — Full Technical Audit Report

**Date:** May 19, 2026  
**Auditor:** Claude (Senior Full-Stack / Security / DevOps)  
**Scope:** Entire codebase — frontend, backend, database, auth, security, integrations, performance, DevOps, launch readiness  
**Verdict:** NOT LAUNCH-READY. Multiple critical and high-severity issues must be resolved before any public release.

---

## Table of Contents

1. [Frontend (Mobile + Web)](#1-frontend-mobile--web)
2. [Backend + API Layer](#2-backend--api-layer)
3. [Database + Data Integrity](#3-database--data-integrity)
4. [Authentication + Authorization](#4-authentication--authorization)
5. [Security](#5-security)
6. [Integrations](#6-integrations)
7. [Performance](#7-performance)
8. [DevOps + Deployment](#8-devops--deployment)
9. [Launch Readiness](#9-launch-readiness)
10. [Final Summary — Issues Ranked by Severity](#10-final-summary--issues-ranked-by-severity)

---

## 1. Frontend (Mobile + Web)

### 1.1 Architecture — The Monolith Problem

**Severity: CRITICAL**

`src/App.tsx` is **4,740 lines and ~207KB** containing approximately **35 components**, all routes, all mock data, all page views, and all business logic in a single file.

**What this means:**
- Any change to any component risks breaking unrelated components
- Code splitting is impossible — the entire app ships as one chunk
- Multiple developers cannot work on different features without merge conflicts on every PR
- Tree-shaking cannot eliminate unused code paths
- Hot module replacement (HMR) reloads the entire app on every save

**What must happen:** Extract every component into its own file under `src/components/`, `src/pages/`, `src/hooks/`, `src/utils/`. This is not optional — it blocks virtually every other frontend improvement.

### 1.2 Not a Mobile App

**Severity: HIGH**

Despite being described as a mobile app, Confetti is a **React SPA (Single Page Application)** built with Vite. There is:
- No Capacitor, no Expo, no React Native
- No native build configurations (no `ios/` or `android/` directories)
- No service worker for offline support
- No PWA manifest for installability
- No responsive breakpoint system — layout is designed for one viewport width

**What this means:** The app cannot be distributed via App Store or Play Store. It runs only in a mobile browser. Push notifications, camera access, haptics, wallet passes, and offline mode are either impossible or severely limited without a native wrapper.

### 1.3 Broken Features

| Feature | File/Location | Issue |
|---------|--------------|-------|
| **VenueDetail page** | App.tsx ~line 2800+ | Always renders `venues[0]` regardless of URL. `useParams()` is never called. Every venue link shows the same venue. |
| **Share buttons** | App.tsx, multiple locations | `onClick` handler is missing. Buttons render but do nothing. |
| **Voice search button** | App.tsx, search area | No speech recognition logic. Button is purely decorative. |
| **Add to Calendar** | App.tsx, itinerary cards | `onClick` handler is missing. No `.ics` generation, no Calendar API call. |
| **Wallet pass generation** | App.tsx | Fakes pass creation with a `setTimeout` that resolves after 1.5s. No Apple/Google Wallet SDK integration. |
| **AuthCallbackPage** | App.tsx | Displays "Opening **Loop**..." — stale brand name, should say "Confetti". |

### 1.4 Hardcoded Data

| Item | Value | Impact |
|------|-------|--------|
| Greeting | "Good evening, Tyrone" | Every user sees Tyrone's name |
| Time display | "Friday, 6:42 PM" | Static string, never updates |
| Profile name | "Tyrone Crossland" | Hardcoded in profile view |
| Profile email | "tyrone@example.com" | Hardcoded in profile view |
| Venue cards | Static array of ~8 venues | No API fetch, no dynamic data |
| Itinerary data | Inline mock objects | Not connected to any backend source |

### 1.5 State Management

**Severity: HIGH**

There is **no global state management** — no React Context, no Zustand, no Redux, no Jotai. User identity is fetched ad-hoc in multiple components via separate `supabase.auth.getUser()` calls. This means:
- User state is inconsistent across components
- Auth state changes don't propagate
- Every component that needs user data makes its own network call
- There is no way to share data between sibling components without prop drilling

### 1.6 No Loading / Error / Empty States

- No skeleton screens during data fetches
- No error boundaries — any component crash kills the entire app
- No empty state UI ("No results found", "No upcoming plans")
- No retry mechanisms on failed fetches
- No pagination or infinite scroll on any list

### 1.7 Accessibility

**Severity: HIGH**

- Interactive elements (buttons, cards, links) lack `aria-label` attributes
- No focus management after route transitions — screen readers lose position
- Color contrast has not been audited
- No keyboard navigation support
- No skip-to-content links
- No `role` attributes on custom interactive components
- Framer Motion animations have no `prefers-reduced-motion` respect

### 1.8 Styling Issues

- `themeColors` object is **duplicated** in `BoardingPass` and `ActiveConfetti` components — divergence guaranteed
- `BoardingPass` contains ~60 inline `style={{}}` objects instead of Tailwind classes
- No dark/light mode support
- No design token system — colors and spacing are magic numbers throughout
- Tailwind is installed but inconsistently used (mix of Tailwind classes and inline styles)

---

## 2. Backend + API Layer

### 2.1 Edge Function Architecture

The backend consists of **20+ Supabase Edge Functions** written in Deno/TypeScript under `supabase/functions/`. They follow a router pattern where each function handles multiple sub-routes via URL path parsing.

### 2.2 CORS — Wide Open

**Severity: CRITICAL**

Both `_shared/supabase-client.ts` and `_shared/cors.ts` set:

```
Access-Control-Allow-Origin: *
```

This allows **any website on the internet** to make authenticated API calls to your backend. An attacker can build a page that calls your Edge Functions with a logged-in user's token.

**Fix:** Replace `*` with your specific domain(s): `https://confetti.app` (or whatever your production domain is). Use an allowlist for staging/preview URLs.

### 2.3 Missing Authentication on Edge Functions

**Severity: CRITICAL**

| Function | Issue |
|----------|-------|
| `venue-ingest/index.ts` | **Zero authentication.** Anyone can call this endpoint and inject venue data into your database. |
| `plan-service/index.ts` (`accept-invite`) | No auth check. Anyone can accept any group invite without being logged in. |
| `cron-recalculate-boosts/index.ts` | Auth check uses a `cronSecret` env var, but **if the var is unset, the endpoint is open**. Defaults to insecure. |
| `analytics-service/index.ts` | Admin-level analytics endpoints (dashboard stats, user metrics) are accessible to **any authenticated user**, not just admins. |

### 2.4 Missing Authorization / Ownership Checks

**Severity: CRITICAL**

| Function | Issue |
|----------|-------|
| `venue-service/index.ts` | Uses `supabaseAdmin` (bypasses RLS) for all writes. No check that the calling user owns the venue they're modifying. Any authenticated user can edit any venue. |
| `booking-service/index.ts` (`confirm`) | Uses `supabaseAdmin` with no ownership check. Any authenticated user can confirm any booking. |
| `billing-service/index.ts` (`disburse-credit`) | Moves money between accounts with **no admin role check**. Any authenticated user can trigger fund disbursement. |
| `event-service/index.ts` | Similar pattern — admin client used without ownership verification. |

### 2.5 No Input Validation

**Severity: HIGH**

No Edge Function validates input. There is:
- No schema validation library (no Zod, no Yup, no AJK)
- No type checking on request bodies
- No bounds checking on numeric fields (`partySize` can be 0, -1, or 999999)
- No sanitization of string inputs
- SQL injection is mitigated by Supabase's parameterized queries, but NoSQL-style injection via JSONB fields is possible

### 2.6 No Rate Limiting

**Severity: HIGH**

No Edge Function implements rate limiting. The AI chat endpoint (`ai-chat-service`) makes calls to OpenAI on every request — an attacker can drain your OpenAI budget in minutes by spamming the endpoint.

### 2.7 Race Conditions

**Severity: MEDIUM**

Counter updates (boost click counts, reward points, achievement counters) use read-then-write patterns:
```
const current = await get(id)
await update(id, { count: current.count + 1 })
```

Under concurrent requests, counts will be lost. Fix: use `UPDATE ... SET count = count + 1` (atomic SQL increment).

### 2.8 Error Handling Leaks Internals

**Severity: MEDIUM**

Multiple Edge Functions return raw error objects in responses:
```typescript
return new Response(JSON.stringify({ error: error.message }), { status: 500 })
```

Supabase error messages can contain table names, column names, constraint names, and SQL fragments. These must be caught and replaced with generic user-facing messages. Log the real error server-side.

### 2.9 N+1 Query in Rewards Leaderboard

**Severity: MEDIUM**

`rewards-service/index.ts` leaderboard endpoint:
1. Fetches top 50 profiles
2. For each profile, makes a separate query to count achievements

That's **51 database queries** for one API call. Fix: use a JOIN or subquery.

---

## 3. Database + Data Integrity

### 3.1 Migration Conflicts

**Severity: CRITICAL**

Migration `20260517000000_backend_os.sql` creates a `trending_venues` table. Migration `20260517000001_social_intelligence.sql` creates a **second** `trending_venues` table. This will cause a migration failure in any clean environment. One must be renamed or merged.

### 3.2 Missing Indexes

**Severity: HIGH**

RLS policies filter on columns that have **no indexes**, meaning every RLS check triggers a sequential scan:

| Table | Column Missing Index | Used In |
|-------|---------------------|---------|
| `chat_messages` | `user_id` | RLS policy |
| `favorites` | `user_id` | RLS policy |
| `bookings` | `user_id` | RLS policy |
| `reviews` | `user_id` | RLS policy |
| `achievements` | `user_id` | RLS policy |
| `passport_stamps` | `user_id` | RLS policy |
| `itineraries` | `user_id` | RLS policy |
| `group_members` | `user_id` | RLS policy + queries |
| `group_members` | `group_id` | JOIN queries |
| `group_plans` | `group_id` | Queries |
| `boost_campaigns` | `business_id` | Queries |
| `checkins` | `venue_id` | Queries |
| `social_mentions` | `venue_id` | Queries |
| `social_mentions` | `platform` | Filter queries |

Every table used with RLS needs an index on the column referenced in the policy. Without these, **performance degrades linearly with data volume.**

### 3.3 Type Mismatches

**Severity: HIGH**

| Table | Column | Issue |
|-------|--------|-------|
| `group_plans` | `id` | `TEXT` primary key with no default. Should be `UUID DEFAULT gen_random_uuid()`. |
| `group_members` | `id` | Same — TEXT PK, no default. |
| `group_plan_stops` | `id` | Same. |
| `boost_campaigns` | `venue_id` | `TEXT` — should be `UUID REFERENCES venues(id)`. No foreign key constraint means orphaned data is guaranteed. |
| `checkins` | `venue_id` | `TEXT` — same problem. |
| `confetti_fund_ledger` | `venue_id` | `TEXT` — same. Financial data with no referential integrity. |

Using TEXT instead of UUID for IDs means:
- No foreign key enforcement
- No UUID validation (any string is accepted)
- JOINs between TEXT and UUID columns fail silently or require casting

### 3.4 Missing RLS Policies

**Severity: HIGH**

| Table | Missing Policy |
|-------|---------------|
| `group_plans` | No UPDATE policy — members can't modify plans |
| `group_plans` | No DELETE policy — no one can delete plans |
| `group_plan_stops` | No INSERT policy — stops can't be added |
| `wallet_passes` | No INSERT policy — passes can't be created through RLS |
| `boost_campaigns` | No UPDATE policy for business owners |
| `social_mentions` | No policies at all (RLS enabled but no rules = no access) |
| `social_scan_runs` | No policies at all |

When RLS is enabled on a table but no policies exist, **all access is denied**. This means these tables are either completely inaccessible via the client, or the Edge Functions are bypassing RLS with `supabaseAdmin` (which introduces the authorization issues documented in Section 2.4).

### 3.5 Missing Tables

The codebase references or implies these tables, but they do not exist in any migration:

| Expected Table | Referenced By |
|---------------|--------------|
| `notifications` | Push notification service, UI notification bell |
| `waitlist_entries` | Waitlist feature in UI |
| `user_blocks` | Safety/trust layer |
| `user_reports` | Safety/trust layer |
| `payment_history` | Billing service |
| `venue_hours` | Operating hours display |
| `user_preferences` | Taste agent, recommendation engine |

### 3.6 Unbounded Columns

**Severity: MEDIUM**

- `chat_messages.content` — `TEXT` with no length constraint. A single message could be megabytes.
- `reviews.content` — `TEXT`, unbounded.
- Multiple `JSONB` columns (`metadata`, `preferences`, `details`) have no schema validation. Any JSON structure is accepted.
- `social_mentions.content` — `TEXT`, could store entire web pages.

### 3.7 No Partitioning Strategy

**Severity: LOW (now), HIGH (at scale)**

`chat_messages`, `social_mentions`, `checkins`, and `analytics_events` are high-volume tables with no partitioning. At >1M rows, queries will slow significantly. Plan partitioning by date range now.

---

## 4. Authentication + Authorization

### 4.1 Auth Architecture

Supabase Auth is used with email/password and social providers (Google, Apple). The auth module (`src/lib/auth.ts`) is **well-structured** — it handles email confirmation, profile syncing, social link attachment, and username resolution correctly.

**What works:**
- Email/password signup with confirmation flow
- Social auth (Google/Apple) via Supabase OAuth
- Username login resolution via `resolve_login_identifier` DB function
- Profile sync on login (`syncProfile()` upserts to profiles table)
- Session management via Supabase client

### 4.2 Demo Mode Bypass

**Severity: HIGH**

`auth.ts` contains a **demo mode** fallback that uses `localStorage` to simulate authentication when Supabase is not configured. If the `fallbackSupabase` mock in `supabase.ts` activates (which happens when env vars are missing), the entire auth system is bypassed. A user gets a fake session with hardcoded data.

**Risk:** If environment variables fail to load in production (deployment misconfiguration, env var deletion), the app silently falls back to demo mode where everyone is "authenticated" with the same fake identity.

### 4.3 No Role-Based Access Control

**Severity: HIGH**

There is no role system. The database has no `role` column on `profiles`. Edge Functions that should be admin-only (analytics dashboard, venue ingest, billing disbursement) have no way to distinguish an admin from a regular user.

**What's needed:**
- Add `role` column to `profiles` (enum: `user`, `business`, `admin`)
- Add RLS policies that check role
- Add role checks in every admin Edge Function
- Never trust client-supplied role claims

### 4.4 No Session Expiry / Refresh Token Rotation

**Severity: MEDIUM**

Supabase handles refresh tokens automatically, but the app has no logic to:
- Detect expired sessions and redirect to login
- Handle refresh token failures gracefully
- Show a "session expired" UI
- Clear stale auth state on logout

### 4.5 No Email Verification Enforcement

**Severity: MEDIUM**

Users can sign up and immediately use the app without verifying their email. The confirmation email is sent, but there's no gate that prevents unverified users from accessing features. This means:
- Fake email signups are trivially easy
- Password reset won't work for users who typo'd their email
- You can't trust email addresses for notifications or receipts

---

## 5. Security

### 5.1 AI API Keys Exposed in Client Bundle

**Severity: CRITICAL — SHOWSTOPPER**

`src/lib/agents/ai-provider.ts` reads:
```typescript
import.meta.env.VITE_OPENAI_API_KEY
import.meta.env.VITE_ANTHROPIC_API_KEY
```

The `VITE_` prefix means Vite **injects these values into the client-side JavaScript bundle**. Anyone who opens DevTools → Sources can extract your OpenAI and Anthropic API keys. They can then:
- Make unlimited API calls billed to your account
- Use your keys for any purpose (including generating harmful content attributed to your account)
- Drain your API budget in minutes

**This is the single most critical issue in the entire codebase.** All AI calls must be proxied through your Edge Functions. Remove the `VITE_` prefix from these env vars immediately and ensure they are never sent to the client.

### 5.2 Google Places API Key in Client Bundle

**Severity: HIGH**

`.env` contains `VITE_GOOGLE_PLACES_KEY` — another `VITE_`-prefixed key that ships to the client. While Google Places keys can be restricted by HTTP referrer, the current key has no referrer restrictions configured (based on the lack of any restriction setup in the codebase). An attacker can use this key from any origin.

**Fix:** Either restrict the key to your domain in Google Cloud Console, or proxy Places API calls through an Edge Function.

### 5.3 Supabase Anon Key Hardcoded in Source

**Severity: MEDIUM**

`src/lib/supabase.ts` contains the anon key as a `CONFETTI_ANON_KEY` constant — a hardcoded fallback if the env var isn't set. The anon key is designed to be public (it's used with RLS), but hardcoding it means:
- You can't rotate it without a code change and redeployment
- It's in your git history forever

### 5.4 No Content Security Policy

**Severity: HIGH**

`vercel.json` has security headers (HSTS, X-Frame-Options, X-Content-Type-Options) but **no Content-Security-Policy (CSP) header**. Without CSP:
- XSS attacks can load scripts from any origin
- Inline scripts execute without restriction
- Data exfiltration via image/fetch to attacker domains is unblocked

### 5.5 No CSRF Protection

**Severity: MEDIUM**

Edge Functions accept requests with no CSRF token validation. While Supabase auth uses bearer tokens (which provide some CSRF resistance), any state-changing endpoint that accepts cookies is vulnerable.

### 5.6 .gitignore Gaps

**Severity: LOW**

Missing entries:
- `supabase/.temp/` — Supabase CLI temp files
- `.env.*` — Environment variants (.env.staging, .env.production)
- `coverage/` — Test coverage output
- `*.local` — Local overrides

---

## 6. Integrations

### 6.1 Integration Status Matrix

| Integration | Status | Notes |
|------------|--------|-------|
| **Supabase Auth** | Functional | Works for email/password and social auth |
| **Supabase Database** | Functional | Migrations exist, RLS partially configured |
| **Supabase Edge Functions** | Functional | 20+ functions deployed, but auth/authz issues |
| **OpenAI GPT-4o** | Broken | Called from client-side, keys exposed |
| **Google Places API** | Partial | Key exposed in client bundle, used for venue search |
| **Stripe** | Stub | `billing-service` exists but no webhook handler, no checkout flow, no subscription management |
| **Apple Wallet** | Stub | `setTimeout` mock, no Apple Developer cert, no `.pkpass` generation |
| **Google Wallet** | Stub | No Google Wallet API integration |
| **Push Notifications (FCM)** | Broken | Service exists but `sendPush()` throws an error because Firebase Admin SDK is not initialized |
| **SMS (Twilio)** | Not configured | Env vars listed in `.env.example` but not set |
| **Email (SendGrid)** | Not configured | Same — listed but not set |
| **OpenTable/Resy** | Stub | Service files exist with mock fallbacks, no real API credentials |
| **Yelp** | Stub | Service file exists, env var not set |
| **Ticketmaster** | Stub | Service file exists, env var not set |
| **Viator** | Stub | Mock only |
| **Mindbody** | Stub | Mock only |
| **ChargePoint** | Stub | Mock only |
| **TomTom** | Not configured | Env var listed but not set |

### 6.2 Integration Architecture Issue

All service providers follow this pattern:
```typescript
configure(apiKey) → isConfigured() → if not configured, return mock data
```

This means in production, if an API key is missing or fails to load, the app **silently returns fake data** instead of showing an error. Users will see plausible-looking but completely fabricated venue information, booking confirmations, and recommendations.

**Fix:** In production, missing API keys should throw an error or show a "service unavailable" message — never return mock data.

### 6.3 No Retry Logic on External APIs

**Severity: HIGH**

No integration has retry logic. If Google Places returns a 503, the request fails permanently. There are:
- No exponential backoff
- No circuit breakers
- No timeout configuration
- No fallback behavior (beyond the mock data problem above)

### 6.4 No Caching

**Severity: HIGH**

Every venue lookup, every Places API call, every AI response is fetched fresh. There is:
- No Redis or in-memory cache
- No HTTP cache headers on Edge Function responses
- No React Query stale-while-revalidate configuration
- No CDN caching strategy

Google Places API charges per request. Without caching, costs scale linearly with traffic.

---

## 7. Performance

### 7.1 Bundle Size

The entire app is one file. Vite's manual chunking in `vite.config.ts` splits dependencies (react, motion, icons, supabase) but the **application code itself is a single chunk** because it's all in `App.tsx`. Expected initial bundle: **500KB+ uncompressed** before any tree-shaking can help.

### 7.2 Animation Performance

**Severity: MEDIUM**

- **Typewriter component** re-renders every **18ms** per character via `setInterval`. For a 100-character string, that's 100 renders in 1.8 seconds, each triggering a React reconciliation.
- **KPI counter component** uses `requestAnimationFrame` in a loop, triggering **38+ re-renders per mount** to animate a number counting up.
- Neither component uses `React.memo`, `useMemo`, or `useCallback`.

### 7.3 No Performance Optimizations

- Zero uses of `React.memo` in the entire codebase
- Zero uses of `useMemo` or `useCallback`
- No lazy loading of routes (`React.lazy` / `Suspense`)
- No image optimization (no `loading="lazy"`, no srcset, no WebP)
- No virtual scrolling for long lists
- No debouncing on search input

### 7.4 Re-render Cascades

Without global state management, parent components re-render frequently, causing all children to re-render. The App component itself re-renders on every route change, which re-renders all 35+ inline components.

---

## 8. DevOps + Deployment

### 8.1 No Test Suite

**Severity: CRITICAL**

There are:
- **Zero test files** in the entire repository
- No test framework installed (no Jest, no Vitest, no Cypress, no Playwright)
- No test scripts in `package.json`
- No CI pipeline that runs tests

This means every deployment is a manual gamble. Any code change could break any feature with no automated way to detect it.

### 8.2 No Linting or Formatting

**Severity: HIGH**

- No ESLint configuration
- No Prettier configuration
- No Stylelint
- No pre-commit hooks (no Husky, no lint-staged)
- No TypeScript strict mode (tsconfig not audited but no strict errors suggests loose config)

### 8.3 No CI/CD Pipeline

**Severity: HIGH**

- No GitHub Actions, no CircleCI, no Jenkins
- No automated build verification
- No automated deployment pipeline
- No preview deployments for PRs
- No staging environment
- Deployments appear to be manual `vercel deploy` or Lovable's built-in deploy

### 8.4 No Monitoring or Alerting

**Severity: HIGH**

- No error tracking (no Sentry, no Bugsnag, no LogRocket)
- No application performance monitoring (no Datadog, no New Relic)
- No uptime monitoring
- No alert configuration for error spikes
- Edge Function errors are only visible in Supabase dashboard logs

### 8.5 No Environment Management

- Single `.env` file for all environments
- No `.env.staging` or `.env.production`
- No environment-specific configuration
- Demo mode fallback means misconfigured env vars produce a silently broken app instead of a clear error

### 8.6 Vercel Configuration

`vercel.json` is present with basic security headers. However:
- No redirect rules (HTTP → HTTPS is handled by Vercel default)
- No rewrite rules for SPA routing (may cause 404 on direct URL access)
- No edge caching configuration
- No CSP header (covered in Security section)

---

## 9. Launch Readiness

### 9.1 Launch Blockers (Must Fix Before Any Public Access)

1. **AI API keys in client bundle** — Anyone can steal your OpenAI/Anthropic keys. Estimated time to drain a $1,000 budget: minutes.
2. **Wildcard CORS** — Any website can make API calls as your users.
3. **5 Edge Functions with no auth/ownership checks** — Any user can modify any venue, confirm any booking, disburse funds.
4. **No test suite** — Zero confidence that the app works correctly after any change.
5. **Duplicate trending_venues migration** — Clean deploys will fail.
6. **VenueDetail always shows venues[0]** — Core feature is broken.

### 9.2 Pre-Launch Essentials (Must Fix Before Paid Users)

7. Missing RLS policies on 6+ tables
8. No rate limiting on any endpoint
9. No input validation on any endpoint
10. No RBAC (admin vs. user vs. business)
11. No CSP header
12. Google Places key exposed in client
13. All hardcoded user data (Tyrone's name, static time)
14. No error tracking / monitoring
15. No loading states or error boundaries
16. Silent mock data fallback in production

### 9.3 What Actually Works

To be fair, here is what is functional:

- Supabase auth (email/password + social) works correctly
- Profile sync on login works
- Database schema covers the core domain model
- RLS is enabled on all tables (even if some policies are missing)
- Edge Function architecture is sound (the router pattern is fine)
- Service layer abstraction is well-designed (configure → isConfigured → execute pattern)
- Vercel deployment with security headers is configured
- The UI design/visual direction is polished and distinctive (boarding pass theme)

---

## 10. Final Summary — Issues Ranked by Severity

### CRITICAL (Launch Blockers — App is Exploitable)

| # | Issue | Location | Impact |
|---|-------|----------|--------|
| C1 | OpenAI + Anthropic API keys in client JS bundle | `src/lib/agents/ai-provider.ts` | Key theft, unlimited spend, account compromise |
| C2 | Wildcard CORS (`Access-Control-Allow-Origin: *`) | `supabase/functions/_shared/` | Cross-site request forgery on all endpoints |
| C3 | venue-service: no ownership check with admin client | `supabase/functions/venue-service/` | Any user can edit any venue |
| C4 | booking-service: no ownership check on confirm | `supabase/functions/booking-service/` | Any user can confirm any booking |
| C5 | billing-service: disburse-credit has no admin gate | `supabase/functions/billing-service/` | Any user can trigger fund disbursement |
| C6 | venue-ingest: zero authentication | `supabase/functions/venue-ingest/` | Anyone on internet can inject venue data |
| C7 | Duplicate `trending_venues` table in migrations | `20260517000000` + `20260517000001` | Clean deploy fails |
| C8 | VenueDetail always shows `venues[0]` | `src/App.tsx` | Core feature completely broken |
| C9 | Zero test files, no test framework | Entire repo | No confidence in any deployment |

### HIGH (Must Fix Before Users)

| # | Issue | Location | Impact |
|---|-------|----------|--------|
| H1 | No input validation on any Edge Function | All edge functions | Malformed data, potential injection |
| H2 | No rate limiting | All edge functions | Budget drain, DoS vulnerability |
| H3 | 6+ tables missing RLS policies | Migrations | Data inaccessible or insecure |
| H4 | 12+ missing database indexes on RLS columns | Migrations | O(n) scans on every RLS check |
| H5 | TEXT primary keys with no defaults (group tables) | `20260510100000` migration | No FK integrity, manual ID management |
| H6 | venue_id type mismatch (TEXT vs UUID) | boost/checkin/fund tables | JOINs fail, no FK constraints |
| H7 | Google Places API key in client bundle | `.env` VITE_ prefix | Key abuse, billing fraud |
| H8 | No CSP header | `vercel.json` | XSS attacks unblocked |
| H9 | No error tracking / monitoring | Entire repo | Blind to production errors |
| H10 | No global state management | `src/App.tsx` | Inconsistent UI, wasted network calls |
| H11 | 4,740-line monolith App.tsx | `src/App.tsx` | Unmaintainable, blocks all improvements |
| H12 | No CI/CD pipeline | Repo config | Manual deploys, no quality gates |
| H13 | No ESLint / Prettier | Repo config | Inconsistent code, easy bugs |
| H14 | All hardcoded user data | `src/App.tsx` | Every user sees "Tyrone" |
| H15 | Not a mobile app (no Capacitor/Expo) | Architecture | Cannot distribute via app stores |
| H16 | No RBAC system | Database + Edge Functions | No admin/business/user distinction |
| H17 | No accessibility compliance | `src/App.tsx` | ADA liability, excludes users |
| H18 | analytics-service admin endpoints open to all users | `supabase/functions/analytics-service/` | Any user sees admin analytics |
| H19 | plan-service accept-invite has no auth | `supabase/functions/plan-service/` | Unauthenticated invite acceptance |
| H20 | Demo mode activates on missing env vars | `src/lib/supabase.ts` | Silent fallback to fake data in prod |
| H21 | No retry logic on external API calls | `services/*` | Single failure = permanent failure |
| H22 | No caching layer | Entire stack | Linear cost scaling, slow responses |
| H23 | No loading states / error boundaries | `src/App.tsx` | Crashes show white screen |
| H24 | Mock data returned silently in production | `services/*` configure pattern | Users see fabricated venues/bookings |

### MEDIUM

| # | Issue | Location | Impact |
|---|-------|----------|--------|
| M1 | Race conditions on counter updates | Edge Functions | Lost counts under concurrency |
| M2 | Error responses leak internal details | Edge Functions | Schema/table names exposed |
| M3 | N+1 query in rewards leaderboard | `rewards-service/` | 51 queries per leaderboard load |
| M4 | Typewriter re-renders every 18ms | `src/App.tsx` | UI jank, battery drain |
| M5 | KPI counter: 38 re-renders per mount | `src/App.tsx` | Unnecessary CPU/DOM work |
| M6 | No React.memo / useMemo anywhere | `src/App.tsx` | Full re-render cascades |
| M7 | No session expiry handling | `src/lib/auth.ts` | Stale sessions, confusing UX |
| M8 | No email verification enforcement | Auth flow | Fake signups, unreachable users |
| M9 | Unbounded TEXT/JSONB columns | Database schema | Storage abuse potential |
| M10 | No CSRF protection | Edge Functions | State-changing requests forgeable |
| M11 | Stale "Loop" branding in AuthCallback | `src/App.tsx` | Confusing post-auth experience |
| M12 | themeColors duplicated in two components | `src/App.tsx` | Style divergence |
| M13 | Inline styles (~60 objects) in BoardingPass | `src/App.tsx` | Unmaintainable, no reuse |
| M14 | cron-recalculate-boosts defaults to open | Edge Function | Insecure if env var unset |
| M15 | supabase anon key hardcoded as constant | `src/lib/supabase.ts` | Can't rotate without redeploy |
| M16 | No partitioning on high-volume tables | Database schema | Degradation at scale |

### LOW

| # | Issue | Location | Impact |
|---|-------|----------|--------|
| L1 | .gitignore missing entries | `.gitignore` | Temp files may be committed |
| L2 | Share buttons non-functional | `src/App.tsx` | Feature gap |
| L3 | Voice search button decorative | `src/App.tsx` | Feature gap |
| L4 | Add to Calendar button non-functional | `src/App.tsx` | Feature gap |
| L5 | Wallet pass generation is a setTimeout fake | `src/App.tsx` | Feature gap |
| L6 | No dark mode support | `src/App.tsx` | UX preference |
| L7 | Trust layer file duplicated | `trust-layer/` + `src/services/trust/` | Maintenance confusion |
| L8 | FCM push notification service broken | `services/notifications/` | Push won't work |
| L9 | Multiple integration env vars not configured | `.env` | Features non-functional |
| L10 | No SPA routing rewrites in vercel.json | `vercel.json` | Direct URL access may 404 |

### Missing Features (Not Bugs, But Required for Launch)

| Feature | Status |
|---------|--------|
| Real AI chat (server-side proxy) | Not implemented |
| Stripe checkout + webhooks | Stub only |
| Push notifications | Broken |
| Email notifications | Not configured |
| SMS notifications | Not configured |
| Real venue data from APIs | Mock only |
| Real booking integrations | Mock only |
| Apple Wallet passes | Stub |
| Google Wallet passes | Stub |
| Admin dashboard (real, secured) | Endpoints exist but unsecured |
| Search functionality | Decorative |
| Image upload / CDN | Not implemented |
| User preferences / taste profile | Tables missing |
| Notification preferences | Not implemented |
| Account deletion (GDPR) | Not implemented |
| Terms of service / privacy policy | Not present |
| Rate limiting / abuse prevention | Not implemented |

---

## Recommended Fix Priority

**Week 1 — Security Emergency:**
1. Remove VITE_ prefix from AI API keys, proxy all AI calls through Edge Functions
2. Replace wildcard CORS with domain allowlist
3. Add auth + ownership checks to all Edge Functions
4. Add rate limiting to AI and auth endpoints
5. Restrict Google Places API key in GCP Console

**Week 2 — Foundation:**
6. Break App.tsx into individual component files
7. Add global state management (Zustand recommended for simplicity)
8. Fix the duplicate trending_venues migration
9. Add missing indexes to all RLS-filtered columns
10. Fix type mismatches (TEXT → UUID with FKs)

**Week 3 — Quality:**
11. Install Vitest + React Testing Library, write tests for auth flows and critical paths
12. Set up ESLint + Prettier + pre-commit hooks
13. Set up GitHub Actions CI (lint, type-check, test, build)
14. Add Sentry for error tracking
15. Add CSP header

**Week 4 — Features:**
16. Add RBAC (roles on profiles, checks in Edge Functions)
17. Add input validation (Zod) to all Edge Functions
18. Add missing RLS policies
19. Replace all hardcoded data with dynamic fetches
20. Fix VenueDetail routing

**Ongoing:**
- Add loading states, error boundaries, empty states
- Implement real integrations one by one (Stripe first, then venue APIs)
- Add accessibility compliance
- Evaluate Capacitor or Expo for native app distribution
- Add caching layer (Edge Function response headers + React Query config)
- Remove demo mode / mock fallbacks for production builds

---

*End of audit. Total issues identified: 9 Critical, 24 High, 16 Medium, 10 Low, plus 18 missing features.*
