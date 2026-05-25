# Confetti — Subscription Promo Strategy + Points Economy

## The model (in plain English)

1. **Customers pay $9.99/mo for All-Access.** They unlock unlimited plans + the perks below.
2. **Verified businesses buy Confetti points in bulk** at a discount (e.g., $0.008/pt — a $50 marketing budget = 6,250 pts).
3. **All-Access members spend those points at checkout** for $ off their bill (100 pts = $1 at most venues).
4. **You take a spread** between what businesses pay per point and what customers redeem — typically 20-30%.

The customer feels like they're getting free money. The business feels like they're spending marketing dollars on customers who actually showed up. You sit in the middle and turn ad spend into customer value.

## Where to promote the $9.99 sub in-app

Add the upgrade card in **every place where a non-member hits friction**:

1. **Hub** — top banner: *"Save $14 your next night out · go All-Access for $9.99"* (only shown to free users)
2. **Venue detail page** — coral card under the AI "why" block: *"Members redeem 1,400 pts here · ~$14 off"*
3. **Pass screen** — under the booking row: *"Free tier: $0 perks · All-Access: $14 off tonight · upgrade"*
4. **Booking sheet** — "Book everything · $36" line: show next to it *"Members pay $22 (after pts)"*
5. **Reels feed** — "+ add to pass" chip on locked stops shows the lock pill instead, tap → paywall
6. **Hub portals** — `family-mode`, `kids-party`, `memory-kit` etc all show the `GatedOverlay` with the All-Access $9.99 upgrade card
7. **Profile/Settings** — top of the profile card: *"You're on Free · 3 plans/wk · upgrade for unlimited"*

Each upgrade card should show **the dollar amount this specific user would save**:
- *"At Lupa Notte you'd get $14 off as a member"*
- *"This pass would be $36 net instead of $50"*
- *"$240 saved on your last 18 nights if you'd been a member"*

That's the magic — make the upgrade math personal.

## The points economy on the backend

### Tables to add to your schema

```sql
-- Points pool that businesses fund
create table venue_points_pools (
  venue_id uuid references venues(id) primary key,
  pts_purchased int default 0,    -- total ever bought
  pts_remaining int default 0,    -- not yet redeemed
  per_pt_cost numeric default 0.008,
  topped_up_at timestamptz,
  monthly_budget_cap int,         -- venue's monthly limit
  active boolean default true
);

-- Each redemption deducts from venue pool + from user balance
create table point_redemptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id),
  venue_id uuid references venues(id),
  stop_id uuid references stops(id),
  pts_redeemed int,
  dollars_off numeric,            -- = pts_redeemed / 100
  venue_pays numeric,             -- pts * per_pt_cost
  confetti_cut numeric,           -- venue_pays - dollars_off (the spread)
  redeemed_at timestamptz default now()
);

-- Business top-up via Stripe
create table venue_pts_purchases (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid references venues(id),
  pts_bought int,
  amount_paid numeric,
  stripe_session_id text,
  created_at timestamptz default now()
);
```

### The redemption flow (server side)

```ts
// POST /api/redeem
async function redeemPoints({ userId, stopId, ptsToRedeem }) {
  const supa = createServiceClient()

  // 1. Verify user is All-Access
  const { data: user } = await supa.from('users')
    .select('tier, confetti_pts').eq('id', userId).single()
  if (user.tier !== 'all-access')
    return { error: 'all-access required' }
  if ((user.confetti_pts || 0) < ptsToRedeem)
    return { error: 'not enough points' }

  // 2. Get venue + check their pool
  const { data: stop } = await supa.from('stops')
    .select('venue_name').eq('id', stopId).single()
  const { data: venue } = await supa.from('venues')
    .select('id').eq('name', stop.venue_name).single()
  const { data: pool } = await supa.from('venue_points_pools')
    .select('*').eq('venue_id', venue.id).single()

  if (pool.pts_remaining < ptsToRedeem)
    return { error: 'venue pool exhausted' }

  // 3. Compute the spread
  const dollarsOff   = ptsToRedeem / 100
  const venuePays    = ptsToRedeem * pool.per_pt_cost
  const confettiCut  = venuePays - dollarsOff   // your margin

  // 4. Atomic update — debit user, debit venue pool, log redemption
  await supa.rpc('redeem_pts_atomic', {
    p_user_id: userId, p_venue_id: venue.id, p_stop_id: stopId,
    p_pts: ptsToRedeem, p_dollars_off: dollarsOff,
    p_venue_pays: venuePays, p_confetti_cut: confettiCut,
  })

  return { ok: true, dollars_off: dollarsOff }
}
```

## App + Play store compliance for this model

This is where it gets dicey — points-for-cash systems are scrutinized.

### Critical compliance moves

1. **Never call Confetti points "currency".** Always "rewards" or "credits." Currency triggers money transmitter laws.
2. **Points expire after 1 year of inactivity.** This caps your financial liability and matches accounting standards.
3. **Disclose conversion rate clearly.** In Terms: "100 pts ≈ $1 off at participating venues; actual value depends on venue."
4. **Don't allow point-to-point user transfers.** That's money transmission. You can let users *gift* points (one-way, from your account out) but with disclosure.
5. **Don't allow cash-out of points.** Points can only be redeemed for venue discounts inside the app.
6. **Apple/Play 30% rule does NOT apply to the points purchase by businesses** — that's a B2B transaction outside their stores. But the customer's $9.99 sub DOES use IAP.
7. **In-app: don't tell customers "use points like cash."** Apple's reviewers flag that.
8. **Customer must pay for the actual venue bill outside the points.** Points only reduce the price; they don't replace it entirely. (Avoids gift-card classification.)

### Update your Terms of Service (in `help.html`)

Add this section verbatim:

> **Confetti Rewards Program.** Confetti points are non-monetary loyalty rewards. They have no cash value and cannot be converted to cash, transferred between users, or sold. Points expire after 365 days of account inactivity. Redemption value at participating venues is approximately 100 points = $1 USD off your bill, subject to venue-specific terms. Points cannot be used to pay tax, tip, or alcohol where prohibited by law. Confetti reserves the right to adjust, cap, or expire points at any time with 30 days notice.

### Update your Privacy Policy

Add:

> **Loyalty program data.** When you redeem points, we share with the venue: your booking name, the points redeemed, the dollar discount applied. We do not share your taste graph, social handles, or purchase history with venues.

## The pitch to a venue (template)

> **Your 6 PM Tuesday slot is empty. We fill it.**
>
> Confetti has 42,000 verified All-Access members in your city, ranked by AI on what they actually like. Instead of paying Yelp $1,200/mo for ads that get 0.3% conversion, you fund a $300 Confetti points pool. Members who match your venue (foodie + walkable + your price tier) get up to $5 off their bill — but only when they actually show up.
>
> You pay 0.8¢ per point we deliver. Customer sees $1 off per 100 points at checkout. Average all-access member redeems ~$8/visit. Your CAC drops to $4-6 per real, in-person customer who books a Saturday, walks in by 8 PM, and posts a check-in.
>
> Get listed in your verified business dashboard, top up your pool in Stripe, and we'll do the rest.

## Pricing tiers for businesses

| Tier | Monthly | Points credit | Per-point cost | Best for |
|---|---|---|---|---|
| **Starter** | $49 | 6,125 | $0.008 | Indie spots |
| **Boost** | $149 | 21,000 | $0.0071 | Restaurants w/ ad budget |
| **Premium** | $399 | 60,000 | $0.0067 | Chains, hotels, venues |
| **Custom** | talk | unlimited | volume | Multi-location |

Your margin: **20-25% on starter, 18% on premium**.

## What to ship in the app to support this

1. **Member upgrade CTA component** (the `MemberPill` and `GatedOverlay` you already have) — surface on Hub, Venue Detail, Pass, Booking, Reels lock states
2. **Points balance + "save $X here" prompt** on each venue card and stop card
3. **Redeem-at-check-in flow** on the QR check-in screen — auto-applies max-available points unless user toggles off
4. **"Why upgrade" page** — show the math personalized to that user ("you've spent $812 in the last 6 months; All-Access would've saved you $122")
5. **Business top-up flow** in `/business/dashboard` — Stripe checkout for buying points in bulk
6. **Admin pool dashboard** in `/admin/console` — total points outstanding (your liability) + monthly redemption stats

## Net result

- **Customer:** *"Got $14 off my night for free, I'm keeping my sub."*
- **Venue:** *"I paid $0.40 in points for a $52 dinner ticket — 0.8% effective CAC."*
- **You:** *"I made $0.60 on that redemption + $9.99/mo from the member + 3% on the cover."*

That's the flywheel. Members create demand → venues fund the rewards → members feel rich → they tell friends → those friends sign up to access the deals → repeat.
