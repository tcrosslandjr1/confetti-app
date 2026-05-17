# Confetti Promoter Network — Pitch, API & Onboarding

## 1. Investor Deck — Slide Copy

### Slide 1 — Title
**Confetti Promoter Network** — The first creator marketplace built directly into a nightlife & dining experience app.

### Slide 2 — The Problem
- Restaurants struggle to find reliable influencers
- Influencers struggle to find paid gigs
- Consumers don't trust random reviews
- Apps struggle to grow without expensive marketing

### Slide 3 — The Opportunity
A three-sided marketplace where:
- Businesses hire creators
- Creators produce content
- Content promotes Confetti
- Confetti drives customers back to businesses

A closed-loop growth engine.

### Slide 4 — The Solution
Confetti Promoter Network: a built-in platform where businesses can hire verified food reviewers and influencers who **must** use Confetti to plan their outing. Every review becomes a Confetti tutorial.

### Slide 5 — How It Works
1. Influencers create Promoter Profiles
2. Businesses browse and hire
3. Influencers plan outing using Confetti
4. Content showcases the Boarding Pass
5. Confetti gets organic exposure
6. Businesses get measurable ROI

### Slide 6 — Product Screens
Promoter Profile · Business Dashboard · Campaign Checklist · Content Verification · Analytics Dashboard.

### Slide 7 — Revenue Model
- 10–20% commission on promoter bookings
- Boosted placement for businesses
- Affiliate revenue from influencer-driven downloads
- Premium analytics
- Creator subscription tier

### Slide 8 — Traction Flywheel
Business → Influencer → Confetti → Business. Each cycle increases content volume, app downloads, reservations, revenue.

### Slide 9 — Competitive Advantage
No nightlife or dining app offers AI-planned experiences + creator marketplace + business analytics + closed-loop attribution. Confetti becomes the operating system for going out.

### Slide 10 — Ask
Funding to scale creator acquisition, business onboarding, marketplace automation, and multi-city expansion.

---

## 2. API Spec — Promoter Booking System

| # | Method | Path | Body / Params | Returns |
|---|---|---|---|---|
| 1 | POST | `/promoters/create` | name, niche, audience_size, rate_card, cities, sample_content_urls, social_links | promoter_id |
| 2 | GET  | `/promoters/search` | city, niche, min_audience, max_price | list of promoter profiles |
| 3 | POST | `/bookings/create` | business_id, promoter_id, campaign_details, budget, deliverables | booking_id |
| 4 | POST | `/bookings/respond` | booking_id, status (accepted/declined) | — |
| 5 | POST | `/bookings/upload` | booking_id, content_url, boarding_pass_id | — |
| 6 | POST | `/bookings/approve` | booking_id, approval_status | — |
| 7 | POST | `/payments/release` | booking_id | — |
| 8 | GET  | `/analytics/campaign` | booking_id | views, engagement, clicks, reservations, foot_traffic |

---

## 3. Restaurant Onboarding Flow
1. **Business Profile Setup** — name, address, hours, menu link, photos, category
2. **Connect Booking System** — Confetti reservations or third-party (OpenTable, Resy)
3. **Access Business Dashboard** — Promoters · Campaigns · Analytics · Boosts
4. **Hire a Promoter** — browse, filter by niche/audience/price, view samples, send request
5. **Approve Content** — review video, confirm Boarding Pass shown, approve or request edits
6. **Track Results** — views, engagement, clicks, reservations, foot traffic

---

## 4. Creator Monetization Dashboard
1. **Earnings Overview** — total earned, pending payouts, upcoming campaigns, affiliate earnings
2. **Campaigns** — active, completed, awaiting approval, payment status
3. **Boarding Pass Gallery** — all Boarding Passes used in content
4. **Performance Metrics** — per campaign: views, engagement, clicks, downloads driven, reservations generated
5. **Affiliate Center** — unique Confetti link, earnings per download, monthly performance
6. **Profile Optimization** — improve rate, improve ranking, add sample content, add more cities

---

## Implementation status (current repo)
- DB: `promoters`, `promoter_jobs`, `promoter_submissions`, `promoter_payouts`
- Server fns: `src/lib/promoter.functions.ts`
- Routes: `/promoter`, `/business/promoters`, `/admin/promoters`
- Payouts: Stripe Connect, 10% platform fee
- **Gaps vs this spec:** dedicated REST endpoints (`/promoters/*`, `/bookings/*`, `/analytics/campaign`), creator earnings dashboard, affiliate link center, boarding-pass gallery view.
