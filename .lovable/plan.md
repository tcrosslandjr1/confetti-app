# Confetti Promo Marketplace — Build Plan

Eight systems delivered across ~5 turns. Each turn is self-contained and shippable.

## Turn 1 — Promo Catalog + Stripe Checkout (Specs #1, #2, #5, #7)

**Stripe products (test mode, all SKUs at once via batch_create_product):**

Business boosts (dual-billing: each SKU gets a one-time price AND a recurring monthly auto-renew price; business picks at checkout):
- `boost_24h` — $29 one-time / $29 monthly
- `boost_3d` — $69 one-time / $69 monthly
- `boost_7d` — $149 one-time / $149 monthly

Event promos (one-time only):
- `event_single` $19, `event_weekend` $49, `event_monthly` $99

Reel promos (one-time only):
- `reel_boost` $9, `reel_trending_pack` $39, `reel_viral_push` $99

Subscriptions (monthly recurring, already partially exist):
- `business_basic` $49, `business_plus` $149, `business_premium` $399, `corporate_addon` $49

User-facing:
- `user_plan_single` $4.99 one-time, `user_unlimited` $9.99/mo, `user_vip` $14.99/mo

Tax codes: `txcd_10000000` (digital services) on all.

**Code changes:**
- Extend `BUSINESS_PRICES`, `AD_PRICES`, `ONE_TIME_PRICES`, `CONSUMER_PRICES` registries in `src/lib/checkout.functions.ts`.
- New component `PromoStorefront.tsx` in business portal — grid of boost/event/reel SKUs with "One-time" / "Auto-renew monthly" toggle per card.
- New component `VIPUpgradePanel.tsx` for user-side.
- Webhook (`src/routes/api/public/payments/webhook.ts`): on `checkout.session.completed` for promo SKUs, write to a new `business_purchases` table and call `activate_boost` SQL function to set `venues.boost_until` / `events.boost_until` / `reels.boost_until`.

**DB migration:**
- Table `business_purchases` (vendor_id, sku, mode one-time|recurring, amount_cents, target_id, target_type, activated_at, expires_at, stripe_session_id, stripe_subscription_id).
- Columns: `venues.boost_until timestamptz`, `venues.boost_tier text`; same for `events`, `reels`.
- SQL function `activate_boost(target_type, target_id, duration_interval, tier)`.

## Turn 2 — Exposure Metrics Engine (Specs #4, #8)

**DB migration:**
- Table `exposure_events` (entity_type venue|event|reel, entity_id, event_type view|click|save|share|plan_placement|corporate_view|corporate_placement, user_id nullable, metadata jsonb, occurred_at). RLS: insert allowed for authenticated users; select restricted to entity owner.
- Materialized view `exposure_scores` recomputed nightly: trending_score, exposure_index, corporate_score per entity.
- SQL function `compute_exposure_scores()` with weighted formula:
  - `trending_score = 0.4*reel_engagement + 0.25*views + 0.2*saves + 0.15*clicks` (last 7d, time-decayed)
  - `exposure_index = LEAST(100, trending_score * boost_multiplier)` where multiplier = 1.0 / 1.5 / 2.0 / 3.0 based on tier
  - `corporate_score = corporate_views + 2*corporate_plan_placements`
- pg_cron job nightly at 03:00 UTC.

**Code:**
- `src/lib/exposure.server.ts` — `logExposureEvent(entityType, entityId, eventType, metadata)` helper. Auto-batched server-side writes.
- Hook into existing ranking logic: `src/lib/ranking.ts` multiplies score by `exposure_index / 100 + 1`.
- Public read serverFn `getEntityExposure(entityId)` for the business portal.

## Turn 3 — Exposure Stats Page (Spec #3)

**New route `src/routes/business.exposure.tsx`** — 6 sections per spec:
1. Overview (7d/30d toggle): views, clicks, saves, AI plan placements, corporate impressions
2. Reels performance: views, likes, shares, watch time, trending score
3. Event performance: views, RSVPs, CTR, conversion
4. Boost impact: before/after sparkline using `business_purchases.activated_at` as cut-line
5. Audience insights: age, gender, neighborhoods, peak times (from `profiles` + `exposure_events.user_id`)
6. Corporate insights: corp searches, plan placements, booking requests

Charts via recharts (already installed). Each section is a card component reading from `exposure_scores` + raw `exposure_events`.

Add nav link in `BusinessPortalNav`.

## Turn 4 — PromoOptimizationAgent (Spec #6)

**New serverFn `src/lib/promo-agent.functions.ts`:**
- `getPromoRecommendations(vendorId)` — runs Lovable AI Gateway with `google/gemini-2.5-flash`.
- Input context: vendor's venues + their `exposure_scores` (last 30d) + active boosts + city baseline percentiles.
- Detects underperformers: `exposure_index < city_median - 20` AND `no_active_boost`.
- LLM prompt returns structured JSON via `Output.object`: `{ recommendations: [{ entity_id, sku_suggested, reason, expected_lift_pct, best_time_window, confidence }] }`.
- Guard rules: max 3 recommendations/week per vendor (rate-limited via `promo_recommendations` table), never recommend if already boosted, require >= 30 events of evidence.

**UI:** `PromoRecommendationsCard.tsx` in `/business/dashboard` — shows top 3 with one-click "Apply" that opens `PromoStorefront` pre-filled.

**Reel tag optimization:** secondary serverFn `optimizeReelTags(reelId)` — analyzes top-performing reels in same category, suggests tag additions.

## Turn 5 — Polish + Integration

- Wire `RankingAgent` to also surface boost-tier badges in `/explore`, `/tonight`, AI plans.
- Spotlight badge component on venue page for `boost_tier = 'premium'`.
- Map view highlight for boosted venues.
- Weekend Spotlight + Viral Reel Push add-ons (one-time SKUs, special placement logic).
- Documentation: `docs/confetti-promo-system.md` summarizing all SKUs, formulas, and agent rules.
- QA pass: verify webhook idempotency, check expiry sweep, confirm RLS on `business_purchases` + `exposure_events`.

## Technical Notes

- Use **embedded checkout** (`ui_mode: "embedded_page"`) per Stripe contract.
- All Stripe calls via `createStripeClient(env)` from `@/lib/stripe.server`.
- Webhook is at `src/routes/api/public/payments/webhook.ts` (already exists — extend, don't recreate).
- Boost expiry is enforced by a lightweight serverFn on read (no cron needed for expiry — just `WHERE boost_until > now()`).
- All metrics queries respect `environment` column on `business_purchases`.
- Tax handling: use `managed_payments: { enabled: true }` (Confetti is digital marketplace, US-based — assume full compliance handling). If user is in unsupported country I'll flip to `automatic_tax` in Turn 1.

## What I'll ask before Turn 1

1. Confirm seller country = US (or specify) — to confirm full compliance handling is appropriate.
2. Confirm dual-billing copy: "Pay once" vs "Auto-renew monthly" — OK as labels?

I'll execute Turn 1 immediately after you approve this plan.