# Confetti Restaurant Partner Dashboard

> URL: `https://partners.confetti.app`
> Access: Venue owner/manager login (email + password or SSO)
> One dashboard per venue; multi-location owners see venue switcher

---

## Dashboard Sections

### 1. Home / Overview

What the venue sees when they log in:

| Field | Description |
|-------|-------------|
| Today's Reservations | Count + timeline view of upcoming bookings |
| Pending Confirmations | Reservations waiting for manual confirm (Tier 2) |
| Active Orders | Order-ahead items in queue |
| Today's Revenue via Confetti | Deposits + order payments processed |
| Confetti Score | Rating from Confetti users (separate from Yelp/Google) |
| Trending Badge | "You're trending in [Vibe]" if recommendation engine is surfacing them frequently |

**Quick Actions:**
- Confirm All Pending
- Block a Time Slot
- Mark Item Unavailable
- View Full Calendar

---

### 2. Venue Profile

Fields the venue manages:

```
BASICS
├── Venue Name
├── Address (auto-geocoded)
├── Phone
├── Website URL
├── Hours of Operation (per day, supports split hours like 11-3, 5-11)
├── Cuisine Type(s) (multi-select: American, Ethiopian, Japanese, etc.)
├── Venue Type (restaurant | bar | lounge | club | cafe | rooftop)
├── Price Range ($ | $$ | $$$ | $$$$)
├── Vibe Tags (multi-select from Confetti's vibe taxonomy)
│   ├── "Lit & Loud"
│   ├── "Chill & Classy"
│   ├── "Date Night"
│   ├── "Group Friendly"
│   ├── "Hidden Gem"
│   ├── "Rooftop Vibes"
│   ├── "Late Night"
│   └── (custom tags venue can suggest)
├── Description (short — 280 chars for card view)
├── Long Description (full — for detail page)
└── Social Links (Instagram, TikTok, X)

MEDIA
├── Cover Photo (1200x600 min)
├── Gallery (up to 10 photos)
├── Menu Photos (fallback if no digital menu)
├── Vibe Video (15-30s loop for itinerary preview)
└── Logo (square, for boarding pass icons)

LOCATION
├── Neighborhood (auto-detected + override)
├── Cross Streets
├── Parking Notes
├── Transit Notes
└── Accessibility Info
```

---

### 3. Booking Settings

```
RESERVATIONS
├── Accept Reservations: ON/OFF
├── Reservation Mode
│   ├── Instant Confirm (Tier 3)
│   ├── Manual Confirm (Tier 2 — venue reviews each one)
│   └── External Link Only (Tier 1)
├── External Reservation Link (Tier 1 — OpenTable, Resy, etc.)
├── Max Party Size: [number]
├── Min Party Size: [number]
├── Advance Booking Window: [1 day – 90 days]
├── Same-Day Booking Cutoff: [e.g., 2 hours before]
├── Time Slot Duration: [15 min | 30 min | 1 hour]
├── Buffer Between Seatings: [minutes]
├── Table Turn Time: [average minutes per seating]
└── Special Notes Field: ON/OFF

DEPOSITS
├── Require Deposit: ON/OFF
├── Deposit Amount: $[number] per person | flat $[number]
├── Deposit Applied to Bill: YES/NO
├── Free Cancellation Window: [hours before reservation]
├── Late Cancel Fee: $[number]
└── No-Show Fee: $[number]

CAPACITY
├── Total Seats: [number]
├── Indoor Seats: [number]
├── Outdoor/Patio Seats: [number]
├── Bar Seats: [number]
├── Private Dining Capacity: [number]
├── Table Configurations
│   ├── 2-top: [count]
│   ├── 4-top: [count]
│   ├── 6-top: [count]
│   ├── 8+: [count]
│   └── Communal: [count]
└── Auto-Block When Full: ON/OFF
```

---

### 4. Order-Ahead Settings

```
ORDER AHEAD
├── Accept Order-Ahead: ON/OFF
├── Order Mode
│   ├── In-App (Tier 2/3)
│   └── External Link Only (Tier 1)
├── External Order Link (Tier 1)
├── Order Types Accepted
│   ├── Dine-In Pre-Order (linked to reservation)
│   └── Pickup
├── Lead Time Required: [minutes before pickup/seating]
├── Max Order Value: $[number] (optional cap)
├── Kitchen Cutoff: [e.g., stop orders 30 min before close]
└── Auto-Confirm Orders: ON/OFF (Tier 3)

MENU SYNC
├── Sync Method
│   ├── Manual Upload (CSV / JSON)
│   ├── API Push (venue pushes to Confetti)
│   ├── POS Sync (Square, Toast, Clover integration)
│   └── Photo Menu (fallback — Confetti OCRs it)
├── Menu Last Updated: [timestamp]
├── Item Availability: per-item toggle (86'd items)
└── Price Override: per-item (if Confetti price differs from in-house)
```

---

### 5. Calendar & Availability

**Calendar View:**
- Day / Week / Month toggle
- Color-coded blocks:
  - Green = open slots
  - Yellow = limited availability
  - Red = fully booked
  - Gray = closed / blocked
- Click any slot to: block, unblock, add note, view bookings

**Block Time Slots:**
```
├── Block Type
│   ├── Private Event
│   ├── Maintenance / Closed
│   ├── Staff Only
│   └── Custom Reason
├── Recurring: ONE-TIME | WEEKLY | MONTHLY
├── Date Range
└── Affected Areas: Indoor | Outdoor | Bar | All
```

---

### 6. Reservations Manager

**List View:**
| Column | Data |
|--------|------|
| Time | Reservation datetime |
| Guest | Confetti username (anonymized until confirmed) |
| Party Size | Number |
| Status | Pending / Confirmed / Seated / Completed / No-Show / Cancelled |
| Source | Itinerary / Direct / Party Room |
| Deposit | Paid / N/A |
| Notes | Guest notes + venue notes |
| Actions | Confirm / Decline / Assign Table / Mark No-Show |

**Filters:** Date range, status, party size, source
**Bulk actions:** Confirm All Pending, Export CSV

---

### 7. Orders Manager

**List View:**
| Column | Data |
|--------|------|
| Order # | Order ID |
| Time | Pickup/seating time |
| Guest | Confetti username |
| Items | Summary (e.g., "2x Chicken & Waffles, 1x Mimosa Pitcher") |
| Total | Dollar amount |
| Status | Pending / Confirmed / Preparing / Ready / Picked Up / Cancelled |
| Linked Reservation | Reservation ID if dine-in pre-order |
| Actions | Accept / Decline / Mark Ready / Cancel |

**Kitchen Display Mode:** Simplified view — just orders in queue, big text, swipe to advance status. Optimized for tablet in kitchen.

---

### 8. Menu Editor

```
MENU STRUCTURE
├── Categories (Brunch, Dinner, Drinks, Dessert, etc.)
│   ├── Category Name
│   ├── Available Hours (e.g., Brunch: 9am-3pm)
│   └── Items
│       ├── Item Name
│       ├── Description (short)
│       ├── Price
│       ├── Photo (optional)
│       ├── Dietary Tags (vegan, GF, contains nuts, halal, kosher)
│       ├── Spice Level (if applicable)
│       ├── Popular Badge: ON/OFF
│       ├── Available: ON/OFF (quick 86 toggle)
│       └── Modifications Allowed
│           ├── Add-ons (extra cheese +$2)
│           ├── Removals (no onions)
│           └── Substitutions (sub fries for salad +$1)
└── POS Sync Status: Connected / Last Synced [timestamp] / Error
```

---

### 9. Analytics

| Metric | Description |
|--------|-------------|
| Reservations This Week/Month | Total + trend |
| Orders This Week/Month | Total + trend |
| Revenue via Confetti | Deposits + orders |
| Average Party Size | From Confetti bookings |
| No-Show Rate | % of confirmed that didn't show |
| Cancel Rate | % cancelled before arrival |
| Top Vibes | Which Confetti vibes are driving traffic to this venue |
| Peak Hours | Heatmap of when Confetti users book |
| Itinerary Appearances | How often venue shows up in generated itineraries |
| Conversion Rate | Appeared in itinerary → booked |
| Confetti Score | Average user rating + trend |
| Repeat Visitors | % of Confetti users who return |
| Swap-In Rate | How often venue is suggested as a bookable alternative |

**Export:** CSV, PDF summary

---

### 10. Partner Tier & Billing

```
CURRENT TIER
├── Tier: [0 | 1 | 2 | 3]
├── Features Included: [list based on tier]
├── Upgrade Available: [next tier benefits + pricing]
└── Upgrade CTA: "Unlock In-App Booking →"

BILLING
├── Commission Rate: [% per booking / order]
├── Monthly Platform Fee: $[amount] (if applicable)
├── Payment Schedule: Weekly / Bi-weekly
├── Bank Account: ****1234 (last 4 only)
├── Payout History: date, amount, status
└── Invoices: downloadable PDF

INTEGRATION
├── API Key: [masked, copy button]
├── Webhook URL: [editable]
├── POS Integration: [Connected to Toast / Square / None]
├── Webhook Event Log: last 50 events with status
└── API Usage: requests this month + rate limit status
```

---

### 11. Promotions & Specials

```
ACTIVE PROMOTIONS
├── Promo Name (e.g., "Happy Hour Double Points")
├── Type
│   ├── Confetti Points Multiplier (2x, 3x)
│   ├── Discount (% off or $ off via Confetti)
│   ├── Free Item (with order-ahead)
│   └── Priority Placement (boosted in recommendations)
├── Date Range
├── Conditions (min party size, time window, first-time visitors)
├── Budget Cap: $[max spend on this promo]
└── Performance: impressions, bookings, revenue attributed

CONFETTI MOMENTS
├── "Twist Moment" opt-in
│   ├── Venue offers a surprise for Confetti users
│   ├── Examples: "Free dessert", "Champagne toast", "DJ shoutout"
│   ├── Trigger: when user checks in via Confetti
│   └── Cost: venue absorbs (but gets Confetti Score boost)
```

---

### 12. Support & Onboarding

```
├── Onboarding Checklist
│   ├── ☐ Complete venue profile
│   ├── ☐ Upload photos
│   ├── ☐ Set booking preferences
│   ├── ☐ Upload or sync menu
│   ├── ☐ Connect bank account
│   ├── ☐ Set deposit policy
│   └── ☐ Go live
├── Partner Success Manager: [name + contact]
├── Help Center: FAQ, guides, video walkthroughs
├── Live Chat Support
└── Feature Requests: submit + vote on upcoming features
```
