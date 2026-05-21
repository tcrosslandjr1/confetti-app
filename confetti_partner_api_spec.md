# Confetti Partner API Spec

> Base URL: `https://api.confetti.app/v1/partner`
> Auth: Bearer token (issued per venue on onboarding)
> Rate limit: 100 req/min per venue
> Applies to: Tier 2 and Tier 3 partners only

---

## Authentication

All requests require:
```
Authorization: Bearer {partner_token}
Content-Type: application/json
```

Token is issued when venue completes partner onboarding. Each token is scoped to a single `venue_id`.

---

## 1. Reservations

### POST /reservations
Create a new reservation.

**Request:**
```json
{
  "user_id": "usr_abc123",
  "venue_id": "ven_xyz789",
  "datetime": "2026-05-17T20:00:00-04:00",
  "party_size": 4,
  "notes": "Window seat if possible",
  "source": "itinerary | direct | party_room",
  "itinerary_id": "itn_456 (optional)",
  "deposit": {
    "required": true,
    "amount": 50.00,
    "currency": "USD",
    "payment_method_id": "pm_stripe_abc"
  }
}
```

**Response (201 Created):**
```json
{
  "reservation_id": "res_001",
  "venue_id": "ven_xyz789",
  "user_id": "usr_abc123",
  "datetime": "2026-05-17T20:00:00-04:00",
  "party_size": 4,
  "status": "confirmed",
  "confirmation_code": "CONF-7X2K",
  "deposit_status": "paid",
  "created_at": "2026-05-17T14:30:00Z",
  "cancellation_policy": {
    "free_cancel_before": "2026-05-17T18:00:00-04:00",
    "late_cancel_fee": 25.00
  }
}
```

**Status codes:**
| Code | Meaning |
|------|---------|
| 201 | Reservation confirmed |
| 202 | Reservation pending (venue must manually confirm) |
| 409 | Time slot unavailable |
| 422 | Invalid request (party size, past datetime, etc.) |

---

### GET /reservations/{reservation_id}
Check reservation status.

**Response (200):**
```json
{
  "reservation_id": "res_001",
  "status": "confirmed | pending | cancelled | no_show | completed",
  "datetime": "2026-05-17T20:00:00-04:00",
  "party_size": 4,
  "table_assignment": "Table 12 (patio)",
  "updated_at": "2026-05-17T15:00:00Z"
}
```

---

### PATCH /reservations/{reservation_id}
Modify an existing reservation.

**Request:**
```json
{
  "datetime": "2026-05-17T20:30:00-04:00",
  "party_size": 6,
  "notes": "Adding 2 more, need bigger table"
}
```

**Response (200):** Updated reservation object.
**Status codes:** 200 OK, 409 conflict, 404 not found.

---

### DELETE /reservations/{reservation_id}
Cancel a reservation.

**Request:**
```json
{
  "reason": "user_cancelled | itinerary_changed | venue_swap",
  "refund_deposit": true
}
```

**Response (200):**
```json
{
  "reservation_id": "res_001",
  "status": "cancelled",
  "refund_status": "processing | refunded | no_refund",
  "refund_amount": 50.00,
  "cancelled_at": "2026-05-17T16:00:00Z"
}
```

---

## 2. Orders (Order-Ahead)

### POST /orders
Place an order-ahead for pickup or dine-in pre-order.

**Request:**
```json
{
  "user_id": "usr_abc123",
  "venue_id": "ven_xyz789",
  "reservation_id": "res_001 (optional — links to existing reservation)",
  "type": "dine_in_preorder | pickup",
  "pickup_time": "2026-05-17T19:45:00-04:00",
  "items": [
    {
      "menu_item_id": "mi_001",
      "name": "Chicken & Waffles",
      "quantity": 2,
      "price": 18.00,
      "modifications": ["extra syrup", "no onions"]
    },
    {
      "menu_item_id": "mi_015",
      "name": "Mimosa Pitcher",
      "quantity": 1,
      "price": 32.00,
      "modifications": []
    }
  ],
  "subtotal": 68.00,
  "tax": 5.78,
  "tip": 10.00,
  "total": 83.78,
  "payment_method_id": "pm_stripe_abc",
  "special_instructions": "Celebrating a birthday — can you add a candle?"
}
```

**Response (201 Created):**
```json
{
  "order_id": "ord_501",
  "venue_id": "ven_xyz789",
  "status": "confirmed | pending_venue",
  "estimated_ready": "2026-05-17T19:45:00-04:00",
  "payment_status": "paid",
  "items_confirmed": true,
  "created_at": "2026-05-17T14:30:00Z"
}
```

---

### GET /orders/{order_id}
Check order status.

**Response (200):**
```json
{
  "order_id": "ord_501",
  "status": "pending_venue | confirmed | preparing | ready | picked_up | cancelled",
  "estimated_ready": "2026-05-17T19:45:00-04:00",
  "items": [...],
  "payment_status": "paid | refunded | partial_refund",
  "updated_at": "2026-05-17T15:10:00Z"
}
```

---

### PATCH /orders/{order_id}
Modify before venue starts preparing.

**Request:**
```json
{
  "add_items": [
    { "menu_item_id": "mi_022", "name": "Sweet Potato Fries", "quantity": 1, "price": 8.00 }
  ],
  "remove_items": ["mi_015"],
  "new_total": 59.78
}
```

**Status codes:** 200 OK, 409 already preparing, 404 not found.

---

### DELETE /orders/{order_id}
Cancel an order.

**Response (200):**
```json
{
  "order_id": "ord_501",
  "status": "cancelled",
  "refund_status": "processing",
  "refund_amount": 83.78,
  "cancelled_at": "2026-05-17T16:00:00Z"
}
```

---

## 3. Menu Sync (Tier 2/3)

### GET /menu
Fetch current menu for in-app display.

**Response (200):**
```json
{
  "venue_id": "ven_xyz789",
  "last_updated": "2026-05-15T09:00:00Z",
  "categories": [
    {
      "name": "Brunch",
      "available_hours": "09:00-15:00",
      "items": [
        {
          "id": "mi_001",
          "name": "Chicken & Waffles",
          "description": "Buttermilk fried chicken, Belgian waffle, house maple",
          "price": 18.00,
          "image_url": "https://cdn.confetti.app/menus/mi_001.jpg",
          "dietary": ["gluten"],
          "available": true,
          "popular": true
        }
      ]
    }
  ]
}
```

### PUT /menu
Venue pushes menu update (or Confetti polls on schedule).

---

## 4. Availability (Tier 3 Only)

### GET /availability
Check real-time open slots.

**Request params:**
```
?date=2026-05-17&party_size=4
```

**Response (200):**
```json
{
  "venue_id": "ven_xyz789",
  "date": "2026-05-17",
  "party_size": 4,
  "slots": [
    { "time": "19:00", "status": "available", "table_type": "indoor" },
    { "time": "19:30", "status": "available", "table_type": "patio" },
    { "time": "20:00", "status": "limited", "remaining": 1 },
    { "time": "20:30", "status": "unavailable" }
  ]
}
```

---

## 5. Webhooks (Venue → Confetti)

Venues can push status updates to Confetti:

**Webhook URL:** `https://api.confetti.app/v1/webhooks/partner`

**Events:**
| Event | When |
|-------|------|
| `reservation.confirmed` | Venue manually confirms a pending reservation |
| `reservation.cancelled` | Venue cancels (capacity issue, closure) |
| `reservation.updated` | Table assignment or time change |
| `order.confirmed` | Venue accepts the order |
| `order.preparing` | Kitchen starts cooking |
| `order.ready` | Order ready for pickup / table service |
| `order.cancelled` | Venue can't fulfill (item unavailable) |
| `menu.updated` | Menu changed — Confetti should re-sync |

**Webhook payload:**
```json
{
  "event": "order.ready",
  "venue_id": "ven_xyz789",
  "resource_id": "ord_501",
  "timestamp": "2026-05-17T19:42:00Z",
  "data": {
    "status": "ready",
    "message": "Your order is ready at the bar!"
  }
}
```

**Webhook security:** HMAC-SHA256 signature in `X-Confetti-Signature` header, verified against shared secret.

---

## 6. Error Format

All errors follow:
```json
{
  "error": {
    "code": "SLOT_UNAVAILABLE",
    "message": "The requested time slot is no longer available.",
    "details": {
      "next_available": "20:30"
    }
  }
}
```

**Error codes:**
| Code | HTTP | Meaning |
|------|------|---------|
| `SLOT_UNAVAILABLE` | 409 | Time slot taken |
| `VENUE_CLOSED` | 409 | Venue closed at requested time |
| `PARTY_TOO_LARGE` | 422 | Exceeds max party size |
| `ITEM_UNAVAILABLE` | 409 | Menu item sold out |
| `ORDER_LOCKED` | 409 | Order already being prepared |
| `DEPOSIT_FAILED` | 402 | Payment processing failed |
| `INVALID_TOKEN` | 401 | Bad or expired partner token |
| `RATE_LIMITED` | 429 | Too many requests |
