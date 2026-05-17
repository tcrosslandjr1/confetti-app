# Confetti Promoter Marketplace

Three-sided promotional engine: businesses hire vetted food/lifestyle influencers ("Promoters") who must plan the outing in Confetti and feature the Boarding Pass in their content. Every review becomes a commercial for the venue, the influencer, and Confetti.

---

## Core Loop

```
Business -> hires Promoter (via Confetti)
Promoter -> plans outing with Confetti -> creates content showcasing Boarding Pass
Content  -> drives new users to Confetti
Confetti -> drives diners back to Business
```

Confetti takes a platform fee on every transaction.

---

## 1. Promoter Profile

Influencers sign up as Promoters with:
- Niche (food critic, lifestyle, nightlife, dessert, cocktails, etc.)
- Audience size per platform (IG, TikTok, YouTube)
- Rate card (per post / per reel / per crawl)
- Sample content links
- Cities of operation
- Verified Confetti Boarding Passes (history of trips planned in-app)
- Verification badge (admin-reviewed)

## 2. Business Browse & Hire

Venues filter Promoters by:
- Audience size band
- Content style / niche
- Price range
- City
- Past Confetti-powered reviews (with engagement metrics)

Hire flow happens entirely in-app: brief -> quote -> accept -> escrow -> deliver -> release.

## 3. Confetti-Required Deliverables

To accept a job, the Promoter MUST:
- Build a Boarding Pass in Confetti for the outing
- Feature the Boarding Pass on-screen in the content
- Show map / booking flow / vibe selection
- Tag the business AND Confetti
- Upload final content back to the app for admin verification

Content is held in `pending_verification` until admin approves and the Boarding Pass link is validated.

## 4. Payments

- Business funds escrow at job acceptance
- Confetti takes platform fee (default 15%)
- Promoter is paid on content approval
- Refund flow if deliverables fail verification

---

## Revenue Streams

1. Platform fee on every Business -> Promoter transaction
2. Affiliate revenue: Promoter referral codes drive Confetti signups (tracked via existing `referrals` table)
3. Organic reach: every approved review is a Confetti ad
4. Premium Promoter tier (subscription) for higher ranking + analytics

---

## Business ROI Dashboard (per campaign)

- Views / impressions
- Engagement (likes, comments, saves)
- Click-throughs to venue page
- Reservations generated (attributed via Boarding Pass)
- Foot traffic from Confetti users (booking conversion)

---

## Data Model (proposed)

```
promoters
  id, user_id, display_name, niche[], cities[], rate_card jsonb,
  audience jsonb, sample_links[], status (pending|approved|suspended),
  verified_at, rating, created_at, updated_at

promoter_jobs
  id, business_advertiser_id, promoter_id, venue_id, brief, deliverables jsonb,
  amount_cents, platform_fee_cents, status (draft|funded|in_progress|delivered|verified|paid|cancelled|refunded),
  boarding_pass_itinerary_id, due_at, created_at, updated_at

promoter_submissions
  id, job_id, content_url, platform, posted_at, metrics jsonb,
  verification_status (pending|approved|rejected), reviewer_id, review_notes

promoter_payouts
  id, promoter_id, job_id, amount_cents, status, stripe_transfer_id, paid_at

promoter_metrics_daily
  promoter_id, date, views, engagement, clicks, bookings_attributed
```

Itinerary link enforced: `promoter_jobs.boarding_pass_itinerary_id` references `itineraries.id` owned by the promoter's `user_id`, and verification fails if missing.

---

## UI Surfaces

**Business portal** — new section "Promoters"
- Browse / filter / shortlist
- Send brief & quote
- Escrow funding
- ROI dashboard per campaign

**Promoter portal** (new) — `/promoter/*`
- Profile editor
- Job inbox
- Active jobs (with required Boarding Pass step)
- Submissions
- Earnings & payouts

**Admin** — verification queue for submissions

**Consumer app** — Promoter badge on venue page, "Promoted by @creator" overlay on featured reels

---

## Integration Points

- Existing `advertisers` table is the business side (already linked to `venues`)
- Existing `itineraries` table = Boarding Pass (required artifact)
- Existing `referrals` table = affiliate tracking
- Stripe (BYOK or Lovable payments) for escrow + payouts
- Notifications via existing `notifications` table

---

## Open Decisions Before Build

1. Stripe Connect for promoter payouts vs manual?
2. Default platform fee % (suggest 15%)
3. Min audience size to qualify as Promoter?
4. Auto-verification via Instagram Graph API vs manual admin review for v1?
5. Promoter subscription tiers (free / pro / elite)?
