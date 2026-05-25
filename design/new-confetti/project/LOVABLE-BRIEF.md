# Confetti — Lovable Build Brief

Paste this into a fresh Lovable project. Lovable will scaffold the whole stack.

---

## What I'm building

**Confetti** is the AI planner for real life — nights out, family days, parties, BBQs, hosting, recharge days, kids parties, tourist days. Users tell Sparkle (our Claude-powered AI agent) what they're up for, and she prints a 3-stop pass with venues, timing, route, budget, and one-tap bookings.

We have a complete clickable design prototype (Bricolage Grotesque + Inter + JetBrains Mono, cream paper background, chunky black borders, ticket motifs, coral accents). Build the production app to match it exactly.

## Stack

- **Frontend:** Next.js 15 (App Router) + TypeScript + Tailwind v4 + Framer Motion
- **Backend:** Supabase (Postgres + Auth + Realtime + Storage)
- **AI:** Anthropic Claude via `@anthropic-ai/sdk` on serverless edge functions (NEVER expose API key client-side)
- **Payments:** Stripe + Stripe Connect (consumer subs + venue payouts)
- **Push:** Firebase Cloud Messaging
- **SMS:** Twilio
- **Email:** Resend
- **Maps:** Mapbox GL + Geocoding API
- **Social data:** Bright Data TikTok structured feed
- **Native shell:** Capacitor wrap for iOS + Android (post-MVP)

## Design system (match exactly)

- Display font: **Bricolage Grotesque** (weights 600-900)
- UI font: **Inter** (weights 400-900)
- Mono font: **JetBrains Mono** (weights 500-800)
- Colors:
  - `--bg: #f8f0dd` (cream paper)
  - `--paper: #fffaf0`
  - `--ink: #130b0d`
  - `--accent-1: #ff5b3d` (coral)
  - `--accent-2: #f7c83b` (yellow)
  - `--accent-3: #5b45d9` (purple)
  - `--accent-4: #2bb673` (green for success)
- Borders: 2.5–3px solid `--ink`, 8–16px radius
- Shadows: offset block shadows (`3px 3px 0 var(--ink)`, `5px 5px 0`, etc)
- Ticket motifs: perforated edges, side notches, bold stamps
- Voice: lowercase, warm, casual, brief, confident — never corporate

## Routes (all 4 portals)

### Public (`/`)
- `/` — landing (passport.html design)
- `/about` `/privacy` `/terms` `/accessibility` `/cookies`
- `/events` — public event listing
- `/events/[id]` — event detail
- `/venue/[id]` — venue detail
- `/p/[code]` — referral capture
- `/health` — JSON status

### Consumer app (`/app/*` — auth-aware)
- `/app` — Hub (home)
- `/app/explore` — TikTok-style venue feed
- `/app/plan` — Build Night
- `/app/chat` — Sparkle chat (real Claude)
- `/app/reels` — vertical reels feed with per-stop clone
- `/app/profile` — user profile + scrapbook + tier
- `/app/taste` — TikTok-derived taste profile
- `/app/crews` — friends + Night Together collab
- `/trips` `/trips/[id]` `/trips/[id]/passport`
- `/boarding-pass/[passId]` — Apple Wallet pass
- `/check-in` — QR scan
- `/checkout/return` — Stripe success

### Business (`/business/*`)
- `/business` — claim landing
- `/business/login` `/business/signup` `/business/claim`
- `/business/dashboard` `/business/analytics` `/business/events`
- `/business/media` `/business/social` `/business/settings`
- `/business/promoters`

### Corporate (`/corporate/*`)
- `/corporate/signup` — 4-step wizard (company → integrations → teams → launch)
- `/corporate` — Home (upcoming, spend, approvals)
- `/corporate/planner` — AI outing builder
- `/corporate/approvals` `/corporate/bookings`
- `/corporate/teams` `/corporate/policies` `/corporate/settings`
- `/corporate/reporting`

### Admin (`/admin/*` — PIN + role-gated)
- `/admin/console` — overview
- `/admin/trend-radar` — vibe heat radar + agent perf
- `/admin/inbox` — support tickets
- `/admin/mod` — moderation queue
- `/admin/users` `/admin/venues` `/admin/partners`
- `/admin/flags` — feature flags
- `/admin/logs` — audit log

### API
- `POST /api/plan` — Sparkle generates a pass
- `POST /api/checkin` — log a check-in, award points, feed taste graph
- `POST /api/book-all` — fires Stripe + Ticketmaster + OpenTable in parallel
- `POST /api/revise` — Sparkle revises an existing plan
- `POST /api/chat` — real Sparkle chat streaming
- `GET /api/cron/tiktok-sync` — nightly taste signal collector
- `GET /api/cron/venue-refresh` — nightly Yelp + Google sync
- `POST /api/webhooks/stripe` — handle subscription events
- `POST /api/webhooks/twilio` — incoming SMS

## Supabase schema

Tables: `users`, `passes`, `stops`, `checkins`, `taste_signals`, `confetti_ledger`, `venues`, `crews`, `crew_members`, `night_together_votes`, `bookings`, `boost_purchases`, `corporate_orgs`, `corporate_teams`, `outings`, `outing_approvals`, `feature_flags`, `audit_log`, `support_tickets`, `moderation_queue`.

(Full SQL in `BACKEND-STARTER.md` in this project.)

Enable Row-Level Security on every table. Use `auth.uid()` for user-owned rows. Use `has_role()` SECURITY DEFINER function for admin/corporate/business roles.

## The Sparkle agent (the brain)

Server-side Claude calls via `@anthropic-ai/sdk`. Multiple specialist personas routed by intent:

1. **Night Out Agent** — bars, restaurants, shows
2. **Family Agent** — parks, museums, libraries
3. **Party Agent** — kids parties, birthdays, jump places
4. **Hosting Agent** — BBQs, dinner parties, game nights
5. **Social Agent** — captions, hashtags, recap reels
6. **Route Agent** — transit, parking, ETA
7. **Budget Agent** — totals, splits, savings

Claude routes the request automatically based on keywords + user history. Show the agent badge in the loader ("Sparkle routed to → Family Agent").

**Read context every call:**
- User's top vibes from `taste_signals` (weighted)
- Saved venues + check-in history
- City, group size, budget cap
- Time of day, weather (OpenWeather API)
- Verified venue pool

**Always cache identical prompts in Redis (Upstash) for 24h.** Inference costs scale linearly with users; caching cuts 70%+.

## 50 cities (already in design)

US: NYC, LA, DC, Chicago, Miami, SF, Atlanta, Seattle, Nashville, Vegas, Houston, Boston, Philly, NOLA, San Diego, Portland, Phoenix, Scottsdale, Austin, Denver, Charleston, Memphis, Knoxville, Chattanooga, Gatlinburg.

International: London, Paris, Tokyo, Dubai, Toronto, CDMX, Barcelona, Berlin, Amsterdam, Sydney, Athens, Bali, Bangkok, Buenos Aires, Cape Town, Hong Kong, Istanbul, Lisbon, Madrid, Melbourne, Milan, Mumbai, Rio, Rome, São Paulo, Seoul, Singapore, Tel Aviv, Tulum, Vancouver.

Each maps to lat/lng + a city-specific venue seed list.

## Subscription tiers

- **Free:** 3 plans/wk, ads on venue pages, adults mode only
- **All-Access · $9.99/mo or $99/yr:** unlimited plans, Family Mode, Kids Parties, hosting plans, Party Memory Kit, RSVP tracker, boarding passes, rewards, 2× points
- **7-day free trial** on All-Access

Gate these features for free users: family-mode, kids-party, memory-kit, unlimited plans, stripe-deposit, reels-per-stop-clone, taste-graph-sync, crew-vote, flipcard-intel, parking.

## Order of build

**Week 1-2** — Backend foundation
Supabase tables + RLS + auth (email magic link, Apple, Google).

**Week 3-4** — Sparkle agent layer
`/api/plan` route, prompt builder, taste signal reader, output validator.

**Week 5-6** — Consumer app
Build the screens in priority: signup → hub → chat → loader → pass → night-of → finished. Pixel-match the prototype.

**Week 7-8** — Money + push
Stripe subscriptions, Stripe Connect for venues, Firebase push, Apple Wallet pass generation (`passkit-generator` npm).

**Week 9** — TikTok sync + reels feed
Bright Data integration, nightly cron, classification with Claude, reel posting.

**Week 10** — Family Mode + Kids Party + Memory Kit
Gated under All-Access.

**Week 11** — Corporate portal
Multi-page wizard + dashboard + approvals + reporting.

**Week 12** — Admin + Ops
Moderation queue, support inbox, analytics, feature flags.

## Privacy + safety (do this from day one)

- COPPA: under-13 requires verified parental consent flow
- Auto-blur faces of kids in check-in photos (Sightengine or Hive)
- Never auto-post to TikTok/IG — always user-approve
- No data sold to advertisers
- DMCA flow at `dmca@confetti.app`
- Data export + delete in Settings
- GDPR + CCPA + GPC honored
- SOC 2 Type II target for corporate plan

## What success looks like

- 50k MAU in 6 months (BK + Manhattan first, then East Coast)
- 14% paying conversion to All-Access
- 38% W4 retention (2× industry)
- $1.2M ARR by month 12
- CAC < $10 organic via auto-reel TikTok loop
- 95%+ caching hit rate on Claude calls

## Start with this prompt for Lovable

> Build me Confetti — an AI planning app for nights out + family days + parties + hosting. Next.js 15 + Supabase + Anthropic Claude. The complete design system, schema, route map, and agent architecture are above. Begin with the auth flow + Hub + a single working "print a pass" flow that hits Claude + writes to Supabase + reads taste signals. After that works end-to-end, expand to the rest. Match the brutalist design language exactly (Bricolage Grotesque + Inter, cream paper bg, coral accents, chunky borders, ticket motifs).
