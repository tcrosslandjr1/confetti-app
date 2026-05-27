# Confetti Booking Providers — Setup Guide

The booking orchestrator lives at `supabase/functions/booking-orchestrator/` and
handles all external provider API calls server-side. Credentials are stored as
Supabase Edge Function secrets — never in client code.

## Provider Priority (recommended activation order)

| # | Provider     | Use Case              | Partnership  | Effort     |
|---|-------------|-----------------------|-------------|------------|
| 1 | **Stripe**  | Payments              | Self-service | Low — sign up at stripe.com |
| 2 | **Viator**  | Activities & tours    | Free partner program | Low — apply at viator.com/partner |
| 3 | **Mindbody**| Spa & wellness        | Developer program | Medium — apply at developers.mindbodyonline.com |
| 4 | **ChargePoint** | EV charging       | Developer program | Medium — developer.chargepoint.com |
| 5 | **OpenTable** | Restaurant reservations | Partnership required | High — formal agreement |
| 6 | **Resy**    | Restaurant reservations | Partnership required | High — Amex-owned, invite-only |

## Setting Secrets

```bash
# Stripe (activate first)
supabase secrets set STRIPE_SECRET_KEY=sk_live_...
supabase secrets set STRIPE_PUBLISHABLE_KEY=pk_live_...

# Viator (activate second)
supabase secrets set VIATOR_API_KEY=...

# Mindbody
supabase secrets set MINDBODY_API_KEY=...

# ChargePoint
supabase secrets set CHARGEPOINT_API_KEY=...

# OpenTable (if partnership approved)
supabase secrets set OPENTABLE_CLIENT_ID=...
supabase secrets set OPENTABLE_CLIENT_SECRET=...

# Resy (if partnership approved)
supabase secrets set RESY_API_KEY=...
supabase secrets set RESY_CLIENT_SECRET=...
```

## Architecture

```
Client (React)
    │
    ▼
supabase/functions/booking-orchestrator  ← unified server-side gateway
    │
    ├── Stripe (payments)
    ├── Viator (tours/activities)
    ├── Mindbody (wellness)
    ├── ChargePoint (EV charging)
    ├── OpenTable (restaurants)
    └── Resy (restaurants)
```

The client-side orchestrator at `src/services/booking/orchestrator.ts` should be
updated to call the edge function instead of making direct API calls. This is
**critical for Stripe** — the secret key must never be in browser code.

## Security Note

⚠️ `src/services/booking/providers/stripe.ts` currently holds a `secretKey`
field that would be exposed to the browser. **Do not use the client-side Stripe
provider directly.** All Stripe calls must go through the edge function. The
client should only use `publishableKey` (for Stripe Elements / Payment Sheet).

## Checking Provider Status

```typescript
const { data } = await supabase.functions.invoke("booking-orchestrator", {
  body: { action: "provider_status", provider: "viator", params: {} },
});
// Returns { providers: { viator: { configured: true, partnership: "free" }, ... } }
```

## Client Integration Example

```typescript
// Instead of calling providers directly from the browser:
const result = await supabase.functions.invoke("booking-orchestrator", {
  body: {
    action: "check_availability",
    provider: "viator",
    params: {
      productCode: "12345",
      travelDate: "2026-06-15",
      paxCount: 2,
    },
  },
});
```
