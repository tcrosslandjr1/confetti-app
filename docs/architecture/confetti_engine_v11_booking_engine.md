# Confetti Engine v11 – Full Booking Engine

## High-Level Pieces

| Piece | Purpose |
|-------|---------|
| Partner tier logic | What each venue is allowed to do |
| Booking engine | Reserve / order-ahead / status |
| Venue booking schema | What each venue must store |
| Flow integration | How booking plugs into itineraries |
| User UX states | Pending / confirmed / failed / swap |

---

## 1. Partner-Tier-Aware Booking Engine

```json
{
  "booking_engine_v11": {
    "input": ["venue_id", "user_id", "datetime", "party_size", "booking_type"],
    "lookup": ["venue_partner_tier", "venue_booking_capabilities"],
    "partner_tiers": {
      "0": ["external_links_only"],
      "1": ["reserve_link", "order_ahead_link"],
      "2": ["in_app_booking", "in_app_order_ahead", "menu_sync"],
      "3": ["instant_confirm", "live_inventory", "pos_sync"]
    },
    "output": {
      "booking_mode": "external | in_app | instant",
      "booking_status": "pending | confirmed | failed | not_supported"
    }
  }
}
```

---

## 2. Venue Booking Schema

```json
{
  "venue": {
    "id": "string",
    "name": "string",
    "partner_tier": 0,
    "booking": {
      "supports_reservations": true,
      "supports_order_ahead": true,
      "reservation_type": "external_link | api | instant",
      "reservation_link": "https://...",
      "order_ahead_link": "https://...",
      "api_endpoint": "https://... (for tier 2/3)",
      "min_party_size": 1,
      "max_party_size": 20,
      "requires_deposit": true,
      "deposit_amount": 50
    }
  }
}
```

---

## 3. Booking Flow Per Tier

### Tier 0 – Non-Partner
- Show: Call / Website / Directions
- `booking_status = "not_supported"`

### Tier 1 – Basic Partner
- Show: Reserve Table (opens `reservation_link`)
- Show: Order Ahead (opens `order_ahead_link`)
- Confetti tracks click, not status

### Tier 2 – Premium Partner
- `booking_type = "in_app"`
- Confetti calls partner API:
  - `POST /reservations`
  - `POST /orders`
- Returns: `pending` or `confirmed`

### Tier 3 – Enterprise
- Same as Tier 2, plus:
  - Live inventory
  - Instant confirm
  - Cancellations/changes via API

---

## 4. Booking Status Model

```json
{
  "booking": {
    "id": "string",
    "user_id": "string",
    "venue_id": "string",
    "datetime": "2026-05-17T20:00:00",
    "party_size": 4,
    "type": "reservation | order_ahead",
    "source": "external | api | instant",
    "status": "pending | confirmed | cancelled | failed",
    "payment_status": "none | pending | paid | refunded",
    "notes": "Window seat if possible"
  }
}
```

---

## 5. Itinerary Integration

Each bookable step in an itinerary gets:

```json
{
  "step": {
    "time": "7:30 PM",
    "template": "dinner",
    "venue_id": "abc123",
    "bookable": true,
    "booking_required": true,
    "booking_status": "not_booked | pending | confirmed",
    "cta": "Book this step"
  }
}
```

**When user taps "Book this step":**
1. Engine checks `venue.partner_tier`
2. Chooses external vs in_app vs instant
3. Creates/updates booking record
4. Updates itinerary step with `booking_status`

---

## 6. Order-Ahead Flow

### Tier 1 (link only)
- CTA: "Order Ahead"
- Opens `order_ahead_link`

### Tier 2/3 (in-app)
```json
{
  "order_ahead": {
    "menu_items": [
      { "id": "m1", "name": "Chicken & Waffles", "price": 18 },
      { "id": "m2", "name": "Mimosas Pitcher", "price": 32 }
    ],
    "cart_total": 50,
    "payment_required": true,
    "status": "pending | confirmed"
  }
}
```

---

## 7. "Replace with Bookable" Fallback Logic

```json
{
  "fallback_engine": {
    "input": ["city", "vibe", "category", "budget", "time_slot"],
    "rule": "find similar venue with partner_tier >= 1",
    "output": "alternative_step"
  }
}
```

**UI copy:**
> "This spot doesn't support direct booking. Want to swap to [Partner Venue] with in-app booking instead?"
