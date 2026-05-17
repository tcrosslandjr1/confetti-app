# Confetti Promoter Network — Full Blueprint

## 1. Product Spec

**Summary.** Built-in marketplace connecting restaurants, lounges, bars, and food businesses with verified influencers and food critics. Creators get paid to produce content, businesses get exposure, and Confetti gets organic marketing because every review must be planned using the app.

**Core objectives.**

- Turn Confetti into a creator marketplace
- Drive organic, lifestyle-driven marketing
- Provide businesses with measurable ROI
- Give influencers paid opportunities
- Make Confetti Boarding Passes part of the content

**User types.**

- **Promoters (influencers):** food reviewers, food critics, nightlife influencers, lifestyle creators, micro-influencers
- **Businesses:** restaurants, bars, lounges, dessert shops, food trucks, cafés
- **Confetti users:** view content, discover venues, book experiences

**Promoter profile.** Bio · niche · audience size · cities · rates · sample content · Boarding Pass gallery · engagement metrics.

**Business dashboard.** Browse promoters · filter by niche/audience/price · view past Confetti-powered reviews · hire directly · track campaign performance.

**Campaign workflow.**

1. Business sends booking request
2. Promoter accepts
3. Promoter must create a Boarding Pass
4. Promoter uses Confetti to plan the outing
5. Content must show Confetti in action
6. Upload for verification
7. Business approves
8. Payment released

**Analytics.** Views · engagement · clicks · reservations generated · foot traffic from Confetti users.

## 2. UI Screens (text wireframes)

### Screen 1 — Promoter Hub

```
[Header] Become a Promoter
[Button] Create Promoter Profile
[Section] What You Get:
 - Paid gigs
 - Exposure
 - Confetti affiliate earnings
```

### Screen 2 — Promoter Profile Setup

```
[Header] Build Your Promoter Profile
Fields:
 - Name
 - Niche
 - Audience Size
 - Cities
 - Rate Card
 - Upload Sample Content
 - Connect Social Accounts
[Button] Submit for Verification
```

### Screen 3 — Business Dashboard

```
[Header] Hire a Promoter
Filters: Audience Size · Price · Niche · City
Promoter Cards: Photo · Niche · Rate · Engagement Score
[Button] Book Promoter
```

### Screen 4 — Campaign Requirements

```
[Header] Campaign Checklist
 - Create Boarding Pass
 - Use Confetti to plan outing
 - Show Boarding Pass in content
 - Tag Business + Confetti
 - Upload final content
[Button] Submit Content
```

### Screen 5 — Analytics

```
[Header] Campaign Performance
 - Views: 128,400
 - Engagement: 12.4%
 - Clicks: 3,912
 - Reservations: 87
 - Foot Traffic: 142
```

## 3. Business Model

**Title:** Confetti Promoter Network — Monetization Engine.

**Revenue streams.**

- Commission on promoter bookings (10–20%)
- Boosted placement for businesses
- Affiliate revenue from influencer-driven downloads
- Premium analytics for businesses
- Optional creator subscription tier

**Why it works.** Influencers want paid gigs · businesses want exposure · Confetti wants organic growth · every review becomes a Confetti tutorial.

**Tagline:** _Creators get paid. Businesses get customers. Confetti gets culture._

## 4. Creator Onboarding Script

> Welcome to the Confetti Promoter Network — where your content becomes a paid experience.
>
> As a promoter, you'll get paid partnerships with restaurants and nightlife venues, exposure to thousands of Confetti users, and affiliate earnings from every download you drive.
>
> Here's how it works: build your Promoter Profile → get discovered by businesses → accept a campaign → use Confetti to plan your outing → show your Boarding Pass in your content → upload your final video → get paid.
>
> You're not just reviewing food — you're showcasing how Confetti powers real experiences. Let's create something unforgettable.

## 5. Restaurant Outreach Pitch

**Subject:** Bring more customers to your restaurant with Confetti Promoters.

> Hi there — Confetti is launching a new feature that connects your business with verified food influencers and critics, all inside the app. Browse creators, hire directly, and every review is planned with Confetti — so you get authentic content plus measurable foot traffic from real users.

## 6. Implementation Status

Already shipped in this repo:

- DB: `promoters`, `promoter_jobs`, `promoter_submissions`, `promoter_payouts`, `promoter_metrics_daily`
- Server fns: `src/lib/promoter.functions.ts`
- Routes: `/promoter`, `/promoter/jobs`, `/business/promoters`, `/admin/promoters`
- Payments: Stripe Connect, default `platform_fee_bps = 1000` (10%)
