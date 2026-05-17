# Confetti UI & Data Flow Blueprint

Master reference for all user-facing interfaces, portal wireframes, and system data flows. Use this to generate components, routes, and backend integrations.

---

## 1. Business Portal Wireframes

Text-based wireframes for the nightclub-grade venue owner control center.

### 1.1 Login

```
[Business Login]
- Email input
- Password input
- "Forgot password"
- "Create business account"
```

### 1.2 Dashboard Home

```
[Dashboard]
TOP METRICS (cards):
  - Weekly Views
  - Reels Engagement
  - Event RSVPs
  - Bookings

ALERTS:
  - Boost expiring
  - Corporate request pending

NAVIGATION:
  - Venue Profile
  - Events
  - Reels
  - Promotions
  - Corporate Visibility
  - Analytics
  - Billing
  - Settings
```

### 1.3 Venue Profile

```
[Venue Profile]
- Venue name
- Address
- Hours
- Photos (upload)
- Vibe tags (chips)
- Price level (dropdown)
- Music type (dropdown)
- Dress code (dropdown)
- Capacity (number)
- Subscription tier (badge)
- Save button
```

### 1.4 Events Manager

```
[Events]
LIST VIEW:
  - Event title
  - Date/time
  - RSVPs
  - Status (active/upcoming/past)
  - Edit button

CREATE EVENT:
  - Title
  - Description
  - Start time
  - End time
  - Tags
  - Cover photo
  - Save
```

### 1.5 Reels Manager

```
[Reels]
LIST VIEW:
  - Thumbnail
  - Tags
  - Engagement stats
  - Boost status
  - Edit

UPLOAD REEL:
  - Upload video
  - Add tags
  - Select vibe
  - Link to event (optional)
  - Boost toggle
```

### 1.6 Promotions

```
[Promotions]
- Buy Boost (button)
- Promote Event (button)
- Promote Reel (button)
- Upgrade Subscription (button)

BOOST OPTIONS:
  - 24 hours
  - 3 days
  - 7 days
```

### 1.7 Corporate Visibility

```
[Corporate Visibility]
- Corporate-friendly toggle
- Add corporate packages
- Group capacity
- Pricing tiers
- Respond to corporate booking requests
```

### 1.8 Analytics

```
[Analytics]
- Traffic sources (chart)
- User demographics (chart)
- Peak hours (heatmap)
- Top-performing reels (list)
- Corporate engagement (chart)
```

### 1.9 Billing

```
[Billing]
- Current subscription
- Payment method
- Invoices list
- Upgrade/downgrade
```

---

## 2. Corporate Portal Wireframes

Text-based wireframes for the enterprise outing management dashboard.

### 2.1 Login

```
[Corporate Login]
- Email
- Password
- "Sign in with company domain"
```

### 2.2 Corporate Home

```
[Corporate Dashboard]
CARDS:
  - Upcoming outings
  - Pending approvals
  - Monthly spend
  - Team activity

NAVIGATION:
  - Company Settings
  - Policies
  - Teams
  - Outing Planner
  - Approvals
  - Bookings
  - Reporting
```

### 2.3 Company Settings

```
[Company Settings]
- Company name
- Domain
- Primary city
- Admins list
- Add admin button
```

### 2.4 Policies

```
[Policies]
- Budget per person
- Alcohol rules
- Distance limits
- Allowed venue categories
- Approval thresholds
- Save
```

### 2.5 Team Management

```
[Teams]
LIST VIEW:
  - Team name
  - Members count
  - Budget
  - Edit

TEAM DETAIL:
  - Add/remove employees
  - Set team budget
  - View outing history
```

### 2.6 Outing Planner

```
[Outing Planner]
STEP 1: Select team
STEP 2: Select date/time
STEP 3: Group size
STEP 4: Purpose (team bonding, client dinner, offsite)
STEP 5: Generate outing (AI)

OUTPUT:
  - Option A
  - Option B
  - Option C
Each option:
  - Venues
  - Estimated cost
  - Notes
  - Request booking
```

### 2.7 Approvals

```
[Approvals]
- Outing name
- Team
- Cost
- Approve / Reject / Request changes
```

### 2.8 Bookings

```
[Bookings]
- Booking status
- Venue details
- Estimated cost
- Receipts
```

### 2.9 Reporting

```
[Reporting]
- Spend by team
- Spend by department
- Favorite venues
- Attendance
- Monthly/quarterly reports
```

---

## 3. Mobile App UI Spec

The full user-facing app specification for the consumer mobile experience.

### 3.1 Home (Tonight Feed)

```
[Home]
- "Tonight in Your City"
- Trending venues (cards)
- Trending reels (carousel)
- Events starting soon
- AI suggestions
```

### 3.2 Explore

```
[Explore]
- Search bar
- Categories (rooftops, lounges, bars, clubs)
- Map view toggle
- Filters (vibe, price, music, dress code)
```

### 3.3 Reels

```
[Reels]
- Fullscreen vertical feed
- Swipe up/down
- Venue tag overlay
- "View venue" button
- Like / Save / Share
```

### 3.4 Venue Page

```
[Venue Page]
- Photos
- Reels
- Vibe tags
- Hours
- Events
- Reviews
- "Add to plan"
- "Book now"
```

### 3.5 AI Planner

```
[Plan My Night]
STEP 1: Occasion
STEP 2: Vibe
STEP 3: Budget
STEP 4: Group size
STEP 5: Time

OUTPUT:
  - Plan A
  - Plan B
  - Plan C
Each plan:
  - Stops
  - Timing
  - Estimated cost
  - Save / Edit / Book
```

### 3.6 Group Planning

```
[Party Room]
- Invite friends
- Vote on venues
- Add preferences
- Live updates
- AI adjusts plan instantly
```

### 3.7 Profile

```
[Profile]
- Saved plans
- Rewards
- Preferences
- History
```

---

## 4. Data Flow Diagrams

Text-based architecture flows describing how data moves through the Confetti system.

### 4.1 User Requests "Plan My Night"

```
User -> API Gateway -> PlanService

PlanService -> ContextAgent:
  - Fetch user profile
  - Fetch trending venues
  - Fetch events
  - Fetch reels

ContextAgent -> FilterRulesAgent:
  - Remove closed venues
  - Remove out-of-budget venues

FilterRulesAgent -> RankingAgent:
  - Score venues
  - Apply boosts
  - Apply preferences

RankingAgent -> PlanGeneratorAgent:
  - Build itinerary

PlanGeneratorAgent -> ExplainerAgent:
  - Generate title + description

ExplainerAgent -> API Gateway -> User
```

### 4.2 Corporate Outing Flow

```
Corporate User -> CorporateService -> ContextAgent

ContextAgent -> FilterRulesAgent:
  - Apply corporate policies

FilterRulesAgent -> RankingAgent:
  - Score corporate-friendly venues

RankingAgent -> CorporatePlannerAgent:
  - Build outing options
  - Add cost breakdown

CorporatePlannerAgent -> ExplainerAgent -> Corporate User
```

### 4.3 Business Boost Flow

```
Business -> BillingService -> VenueService

VenueService -> RankingAgent:
  - Update boost weight

RankingAgent -> PlanService:
  - Boosted venue appears more in plans
```

### 4.4 Reels Trending Flow

```
User engagement -> AnalyticsService -> ContentService

ContentService -> RankingAgent:
  - Update trending scores

RankingAgent -> Reels Feed
```

---

## Implementation Notes

- All portal wireframes correspond to routes under `/business/*` and `/corporate/*`
- Mobile app UI corresponds to the primary consumer app routes (`/`, `/explore`, `/reels`, `/venues/:id`, `/plan`, `/party-room`, `/profile`)
- Data flows reference the AI agent pipeline documented in `confetti-api-portals-agents.md`
- Each wireframe section maps to Supabase tables defined in `confetti-backend-os.md`
