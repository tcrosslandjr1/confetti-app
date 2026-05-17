# Confetti Promoter Network — Feature & Pitch

## Overview

Confetti Promoter Network is a built-in marketplace that connects restaurants, lounges, bars, and food businesses with verified food reviewers, critics, and influencers. Businesses can hire creators directly inside the app, and creators must use Confetti to plan their entire outing — turning every review into a Confetti-powered experience.

Three-way growth loop:

- **Businesses** get high-quality promotional content
- **Influencers** get paid gigs and exposure
- **Confetti** gets organic, lifestyle-driven marketing

Every review becomes a showcase of how Confetti plans, books, and curates real experiences.

---

## UI Flow

### 1. Promoter Sign-Up

Influencers tap **"Become a Promoter"** and create a profile with:

- Niche (food critic, nightlife, lifestyle)
- Audience size
- Rates
- Cities they operate in
- Sample content
- Confetti Boarding Passes they've created

Promoter profile becomes visible to businesses.

### 2. Business Dashboard → "Hire a Promoter"

Restaurants and venues can:

- Browse promoters
- Filter by audience size, content style, price
- View past Confetti-powered reviews
- See engagement metrics

They select a promoter and send a booking request.

### 3. Promoter Accepts Job → Must Use Confetti

To accept a job, the promoter must:

- Build a Boarding Pass for the outing
- Use Confetti to plan the entire experience
- Show the Boarding Pass in their content
- Tag the business + Confetti
- Upload the final content for verification

This ensures every piece of content is a Confetti tutorial disguised as entertainment.

### 4. Payment + Delivery

- Business pays inside the app
- Confetti takes a small fee (10% platform fee)
- Influencer gets paid
- Content is delivered, verified, and published
- Business receives analytics (views, clicks, reservations, foot traffic)

---

## Pitch Deck Slide — "Promoter Network"

**Title:** 🔥 Confetti Promoter Network: A Three-Sided Growth Engine

**Subtitle:** Where businesses, influencers, and Confetti all win — together.

### Key Points

- **Influencers get paid** to create food and nightlife content
- **Businesses get exposure** through verified creators
- **Confetti gets organic marketing** because every review is planned inside the app
- **AI Boarding Passes** become part of the content, showcasing Confetti's value
- **Closed-loop analytics** show businesses real ROI: views, clicks, reservations, foot traffic
- **Marketplace revenue** from every promoter booking

**Visual Concept:** A triangle loop — Business → Influencer → Confetti → Business

**Tagline:** _"Every review becomes a Confetti experience."_

---

## Implementation Status

The full marketplace loop is live in the app:

- Promoter portal: `/promoter/*` (profile, jobs)
- Business hiring: `/business/promoters`
- Admin verification: `/admin/promoters`
- Database: `promoters`, `promoter_jobs`, `promoter_submissions`, `promoter_payouts`, `promoter_metrics_daily`
- Payments: Stripe Connect (stubbed pending live keys)
- Platform fee: 10% (configurable via `platform_fee_bps`)

See also:

- `docs/confetti-promoter-marketplace.md` — full data model & business logic
- `mem://product/promoter-marketplace` — memory reference
