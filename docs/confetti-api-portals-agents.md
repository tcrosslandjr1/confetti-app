# Confetti — API, Portal UI & Agent Orchestration Spec

Reference for REST endpoints, business/corporate portal surfaces, and the AI orchestrator. Pair with `docs/confetti-blueprint.md` (product) and `docs/confetti-backend-os.md` (architecture).

## A. REST API Endpoints

### A1. Auth

```
POST /auth/register
POST /auth/login
POST /auth/logout
POST /auth/verify
POST /auth/reset-password
```

### A2. Users

```
GET    /users/{id}
PATCH  /users/{id}
GET    /users/{id}/preferences
PATCH  /users/{id}/preferences
GET    /users/{id}/history
GET    /users/{id}/plans
POST   /users/{id}/checkin
```

### A3. Venues

```
GET    /venues
GET    /venues/{id}
POST   /venues               (business only)
PATCH  /venues/{id}
GET    /venues/{id}/events
GET    /venues/{id}/reels
POST   /venues/{id}/boost    (business only)
```

### A4. Events

```
GET    /events
GET    /events/{id}
POST   /events               (business only)
PATCH  /events/{id}
DELETE /events/{id}
```

### A5. Reels / Content

```
GET    /reels
GET    /reels/{id}
POST   /reels                (business only)
PATCH  /reels/{id}
DELETE /reels/{id}
```

### A6. Plans

```
POST   /plans/generate
GET    /plans/{id}
GET    /plans/user/{user_id}
PATCH  /plans/{id}
DELETE /plans/{id}
```

### A7. Corporate

```
POST   /corporate/company
GET    /corporate/company/{id}
PATCH  /corporate/company/{id}

POST   /corporate/team
GET    /corporate/team/{id}
PATCH  /corporate/team/{id}

POST   /corporate/policies
GET    /corporate/policies/{company_id}

POST   /corporate/outing
GET    /corporate/outing/{id}
PATCH  /corporate/outing/{id}
```

### A8. Bookings

```
POST   /bookings
GET    /bookings/{id}
PATCH  /bookings/{id}
GET    /bookings/user/{user_id}
GET    /bookings/corporate/{company_id}
```

### A9. Billing

```
POST   /billing/subscribe
POST   /billing/cancel
GET    /billing/invoices/{business_id}
```

### A10. Rewards

```
GET    /rewards/{user_id}
POST   /rewards/redeem
```

### A11. Analytics

```
POST   /analytics/event
GET    /analytics/business/{venue_id}
GET    /analytics/corporate/{company_id}
```

## B. Business Portal UI

| Section                      | Contents                                                                                             |
| ---------------------------- | ---------------------------------------------------------------------------------------------------- |
| **B1. Home**                 | Weekly views, reels engagement, RSVPs, bookings; alerts (boost expiring, corporate requests pending) |
| **B2. Venue Management**     | Profile editor, photos, metadata (vibe/price/music/dress), hours, subscription tier                  |
| **B3. Events Manager**       | Create / edit / duplicate; per-event analytics                                                       |
| **B4. Reels Manager**        | Upload, tag (vibe/category), boost, performance                                                      |
| **B5. Promotions**           | Buy boosts, promote events/reels, upgrade tier                                                       |
| **B6. Corporate Visibility** | Toggle corporate-friendly, packages, group capacity, respond to corporate requests                   |
| **B7. Analytics**            | Traffic sources, demographics, peak hours, top content, corporate engagement                         |
| **B8. Billing**              | Subscription status, payment methods, invoices, plan changes                                         |

## C. Corporate Portal UI

| Section                  | Contents                                                                                   |
| ------------------------ | ------------------------------------------------------------------------------------------ |
| **C1. Home**             | Upcoming outings, pending approvals, monthly spend, team activity                          |
| **C2. Company Settings** | Profile, primary city, admins/approvers, departments/teams                                 |
| **C3. Policies**         | Budget per person, alcohol rules, distance limits, allowed categories, approval thresholds |
| **C4. Team Management**  | Add/remove employees, assign to teams, set budgets, outing history                         |
| **C5. Outing Planner**   | Team, date/time, group size, purpose; AI generates → compare 1–3 options → request booking |
| **C6. Approvals**        | Approve / reject / request changes                                                         |
| **C7. Bookings**         | Status, venue, estimated cost, receipts                                                    |
| **C8. Reporting**        | Spend by team/department, favorite venues, attendance, monthly/quarterly                   |

## D. AI Agent Orchestration

### D1. Orchestrator System Prompt

> You are the Confetti AI Orchestrator. Coordinate specialized agents to generate nightlife plans, corporate outings, venue rankings, and recommendations.
>
> **Workflow:**
>
> 1. ContextAgent → gather data
> 2. FilterRulesAgent → apply constraints
> 3. RankingAgent → score & rank
> 4. PlanGeneratorAgent **or** CorporatePlannerAgent → generate plan
> 5. ExplainerAgent → human-friendly output
>
> **Rules:**
>
> - Always respect city, time, budget, group size
> - Always prioritize corporate-approved venues for corporate flows
> - Always factor business boosts + subscription tiers
> - Always generate 2–4 stop plans unless instructed otherwise
> - Always ensure vibe progression (chill → active → late-night)
> - Always optimize for real-time relevance
> - Always learn from user behavior signals

### D2. Agent Tasks

| Agent                 | Task                                                                    |
| --------------------- | ----------------------------------------------------------------------- |
| ContextAgent          | Fetch user profile, trending venues, events, reels, corporate policies  |
| FilterRulesAgent      | Remove venues violating constraints (budget, distance, corporate rules) |
| RankingAgent          | Score venues via user behavior, real-time signals, boosts               |
| PlanGeneratorAgent    | Build multi-stop itineraries with logical flow                          |
| CorporatePlannerAgent | Generate corporate-friendly outings with cost breakdowns                |
| ExplainerAgent        | Write titles, descriptions, summaries for plans                         |
