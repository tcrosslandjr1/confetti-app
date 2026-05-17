# Confetti — Backend OS

Architecture reference for services, schemas, AI agents, automations, and corporate onboarding. Pair with `docs/confetti-blueprint.md` (product OS).

## A. Architecture

### A1. Core Microservices

- **AuthService** — user/business/corporate auth, JWT
- **UserService** — profiles, preferences, behavior signals, friend graph
- **VenueService** — venue metadata (vibe, price, music, dress code), subscription tier, corporate flags
- **EventService** — events with timestamps, recurring rules, Tonight/Weekend queries
- **ContentService** — reels metadata, trending ranking, boosted logic
- **PlanService** — AI itineraries (date_night, birthday, weekend, corporate), ordered stops
- **CorporateService** — companies, teams, budgets, policies, approvals, bookings
- **BookingService** — reservations, guest lists; status: requested/confirmed/canceled/completed
- **BillingService** — business subs, promotion payments, corporate billing
- **RewardsService** — points, tiers, perks; triggers: check-ins/bookings/referrals
- **AnalyticsService** — event stream, dashboards, AI training data

### A2. Data Storage

- Postgres/Supabase (relational)
- Elastic/Lucene (search index)
- Redis (cache)
- BigQuery/Snowflake (warehouse)

### A3. API Gateway Routes

`/auth/*` `/users/*` `/venues/*` `/events/*` `/content/*` `/plans/*` `/corporate/*` `/bookings/*` `/billing/*` `/rewards/*` `/analytics/*`

## B. Database Schemas

### B1. users

`id, name, email, phone, home_city, preferences (jsonb), created_at, updated_at`

### B2. venues

`id, name, address, city, vibe_tags (text[]), price_level (int), music_type, dress_code, capacity, subscription_tier (basic|plus|premium|enterprise), corporate_friendly (bool), created_at, updated_at`

### B3. events

`id, venue_id (fk), title, description, start_time, end_time, recurring_rule, tags (text[]), created_at, updated_at`

### B4. reels

`id, venue_id (fk), url, platform (tiktok|instagram), tags (text[]), vibe, boosted (bool), created_at`

### B5. plans

`id, user_id (fk), type (date_night|birthday|weekend|corporate), city, stops (jsonb), estimated_cost, created_at`

### B6. Corporate

**corporate_companies** — `id, name, domain, primary_city, policies (jsonb), created_at`

**corporate_teams** — `id, company_id (fk), name, budget_per_person, approval_required (bool)`

**corporate_bookings** — `id, company_id (fk), team_id (fk), plan_id (fk), status (requested|approved|booked|completed), estimated_cost, actual_cost, created_at`

## C. AI Agent Definitions

### C1. ContextAgent

Gather data. **In:** user_id, city, time, group_size, occasion, budget. **Out:** candidate_venues, candidate_events, user_profile. Fetches preferences, trending venues, live events, vibe reels.

### C2. FilterRulesAgent

Apply hard constraints. **In:** candidate_venues, corporate_policies, time, budget. **Out:** filtered_venues. Removes closed, out-of-budget, policy-violating, low-quality, or distant venues.

### C3. RankingAgent

Score & rank. **In:** filtered_venues, user_behavior, real_time_signals, business_boosts. **Out:** ranked_venues. Applies user-history scores, trending signals, tier boosts, corporate suitability.

### C4. PlanGeneratorAgent

Build itineraries. **In:** ranked_venues, plan_type, group_size, time. **Out:** plan (2–4 stops). Logical sequence, vibe progression, timing + cost estimates.

### C5. CorporatePlannerAgent

Corporate outings. **In:** corporate_policies, ranked_venues, group_size, budget. **Out:** corporate_plan. Approved venues only, cost breakdown, HR-friendly notes.

### C6. ExplainerAgent

Human copy. **In:** plan. **Out:** title, description, summary. User-facing + corporate-facing variants.

## D. Automations & Jobs

### D1. Scheduled Jobs

- **RefreshTrendingVenues** — hourly. Pull reel engagement + check-ins, update trending scores.
- **RecalculateBusinessBoosts** — every 6h. Apply tier boosts + paid promotions.

### D2. Real-Time Automations

- **OnVenueBoostPurchased** — set `venue.boosted = true`, notify RankingAgent.
- **OnCorporateBookingRequested** — run CorporatePlannerAgent, send plan to approver.
- **OnUserRequestsPlan** — pipeline: ContextAgent → FilterRulesAgent → RankingAgent → PlanGeneratorAgent → ExplainerAgent.

## E. Corporate Onboarding Flow

1. **Company Setup** — name, domain, city → create `corporate_companies` row
2. **Admin Setup** — add admins + approvers, configure teams
3. **Policy Setup** — budget, alcohol, distance, approval thresholds
4. **Team Import** — CSV or manual, link employees
5. **Preferred Venues** — select approved venues, category restrictions
6. **First Outing** — trigger CorporatePlannerAgent → 1–3 options
7. **Approval & Booking** — manager approves → BookingService confirms
8. **Reporting** — spend, attendance, favorite venues
