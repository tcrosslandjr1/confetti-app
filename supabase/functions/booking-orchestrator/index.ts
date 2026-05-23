/**
 * Booking Orchestrator Edge Function
 *
 * Server-side bridge between the client UI and external booking providers.
 * This function keeps provider API keys secure on the server (critical for Stripe)
 * and provides a unified interface for:
 *   - Searching availability
 *   - Creating bookings
 *   - Cancelling bookings
 *   - Processing payments
 *
 * Provider credentials are stored as Supabase Edge Function secrets.
 */

import { getCorsHeaders } from "../_shared/cors.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

// Provider credentials from secrets
const VIATOR_API_KEY = Deno.env.get("VIATOR_API_KEY") ?? "";
const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY") ?? "";
const OPENTABLE_CLIENT_ID = Deno.env.get("OPENTABLE_CLIENT_ID") ?? "";
const OPENTABLE_CLIENT_SECRET = Deno.env.get("OPENTABLE_CLIENT_SECRET") ?? "";
const RESY_API_KEY = Deno.env.get("RESY_API_KEY") ?? "";
const MINDBODY_API_KEY = Deno.env.get("MINDBODY_API_KEY") ?? "";
const CHARGEPOINT_API_KEY = Deno.env.get("CHARGEPOINT_API_KEY") ?? "";

type Provider = "viator" | "opentable" | "resy" | "mindbody" | "chargepoint" | "stripe";

type Action =
  | "check_availability"
  | "create_booking"
  | "cancel_booking"
  | "create_payment"
  | "confirm_payment"
  | "provider_status";

interface RequestBody {
  action: Action;
  provider: Provider;
  params: Record<string, unknown>;
}

Deno.serve(async (req) => {
  const cors = getCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  if (req.method !== "POST") return resp({ error: "Method not allowed" }, 405, cors);

  try {
    // Auth required
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return resp({ error: "Unauthorized" }, 401, cors);

    const userRes = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: { apikey: ANON_KEY, Authorization: authHeader },
    });
    if (!userRes.ok) return resp({ error: "Unauthorized" }, 401, cors);
    const user = await userRes.json();
    const userId = user?.id;
    if (!userId) return resp({ error: "Unauthorized" }, 401, cors);

    const body = (await req.json()) as RequestBody;
    if (!body?.action || !body?.provider) {
      return resp({ error: "action and provider required" }, 400, cors);
    }

    // Check provider credentials are configured
    if (body.action === "provider_status") {
      return resp({
        providers: {
          viator: { configured: !!VIATOR_API_KEY, partnership: "free" },
          opentable: { configured: !!OPENTABLE_CLIENT_ID, partnership: "required" },
          resy: { configured: !!RESY_API_KEY, partnership: "required" },
          mindbody: { configured: !!MINDBODY_API_KEY, partnership: "developer_program" },
          chargepoint: { configured: !!CHARGEPOINT_API_KEY, partnership: "developer_program" },
          stripe: { configured: !!STRIPE_SECRET_KEY, partnership: "self_service" },
        },
      }, 200, cors);
    }

    // Dispatch to provider handlers
    let result: unknown;

    switch (body.provider) {
      case "viator":
        result = await handleViator(body.action, body.params);
        break;
      case "stripe":
        result = await handleStripe(body.action, body.params, userId);
        break;
      case "opentable":
      case "resy":
      case "mindbody":
      case "chargepoint":
        // These providers require partnership agreements
        // Return helpful status when unconfigured
        const key = getProviderKey(body.provider);
        if (!key) {
          return resp({
            error: `${body.provider} not configured`,
            hint: `Partnership/credentials needed. See BOOKING_PROVIDERS.md for setup instructions.`,
            configured: false,
          }, 503, cors);
        }
        result = { error: "Provider handler not yet implemented", provider: body.provider };
        break;
      default:
        return resp({ error: `Unknown provider: ${body.provider}` }, 400, cors);
    }

    // Log booking activity
    await logBookingActivity(userId, body.action, body.provider, result);

    return resp(result, 200, cors);
  } catch (e) {
    console.error("[booking-orchestrator]", e);
    return resp({ error: (e as Error).message }, 500, cors);
  }
});

// ─── Viator (Activities/Tours) ───────────────────────────────────────────────
async function handleViator(action: Action, params: Record<string, unknown>) {
  if (!VIATOR_API_KEY) {
    return { error: "Viator not configured", hint: "Set VIATOR_API_KEY secret" };
  }

  const base = "https://api.viator.com/partner";
  const headers = {
    "Accept": "application/json;version=2.0",
    "Content-Type": "application/json",
    "exp-api-key": VIATOR_API_KEY,
  };

  switch (action) {
    case "check_availability": {
      const { productCode, travelDate, paxCount } = params as {
        productCode: string; travelDate: string; paxCount?: number;
      };
      const res = await fetch(`${base}/availability/check`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          productCode,
          travelDate,
          paxMix: [{ ageBand: "ADULT", numberOfTravelers: paxCount ?? 2 }],
        }),
      });
      if (!res.ok) return { error: `Viator error ${res.status}`, available: false };
      return await res.json();
    }

    case "create_booking": {
      const { productCode, travelDate, startTime, paxCount, leadTraveler } = params as {
        productCode: string; travelDate: string; startTime?: string;
        paxCount?: number; leadTraveler?: { firstName: string; lastName: string; email: string };
      };
      // Viator uses a hold → confirm pattern
      const holdRes = await fetch(`${base}/bookings/hold`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          productCode,
          travelDate,
          startTime,
          paxMix: [{ ageBand: "ADULT", numberOfTravelers: paxCount ?? 2 }],
          currency: "USD",
          leadTraveler: leadTraveler ?? { firstName: "Guest", lastName: "User" },
        }),
      });
      if (!holdRes.ok) return { error: `Hold failed: ${holdRes.status}`, booked: false };
      const hold = await holdRes.json();

      // Confirm the hold
      const confirmRes = await fetch(`${base}/bookings/${hold.bookingRef}/confirm`, {
        method: "POST",
        headers,
      });
      if (!confirmRes.ok) return { error: `Confirm failed`, booked: false, holdRef: hold.bookingRef };
      const confirmation = await confirmRes.json();
      return {
        booked: true,
        confirmationId: confirmation.bookingRef,
        status: confirmation.status,
        provider: "viator",
      };
    }

    case "cancel_booking": {
      const { bookingRef, reason } = params as { bookingRef: string; reason?: string };
      const res = await fetch(`${base}/bookings/${bookingRef}/cancel`, {
        method: "POST",
        headers,
        body: JSON.stringify({ reasonCode: reason ?? "CUSTOMER_CANCELLATION" }),
      });
      return { cancelled: res.ok, provider: "viator" };
    }

    default:
      return { error: `Action ${action} not supported for viator` };
  }
}

// ─── Stripe (Payments) ───────────────────────────────────────────────────────
async function handleStripe(action: Action, params: Record<string, unknown>, userId: string) {
  if (!STRIPE_SECRET_KEY) {
    return { error: "Stripe not configured", hint: "Set STRIPE_SECRET_KEY secret" };
  }

  const base = "https://api.stripe.com/v1";
  const headers = {
    Authorization: `Bearer ${STRIPE_SECRET_KEY}`,
    "Content-Type": "application/x-www-form-urlencoded",
  };

  const toForm = (obj: Record<string, unknown>): string =>
    Object.entries(obj)
      .filter(([, v]) => v !== undefined && v !== null)
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
      .join("&");

  switch (action) {
    case "create_payment": {
      const { amountCents, confettiCode, description } = params as {
        amountCents: number; confettiCode: string; description?: string;
      };
      if (!amountCents || amountCents <= 0) return { error: "Invalid amount" };
      const res = await fetch(`${base}/payment_intents`, {
        method: "POST",
        headers,
        body: toForm({
          amount: amountCents,
          currency: "usd",
          description: description ?? "Confetti booking",
          "metadata[confetti_code]": confettiCode,
          "metadata[user_id]": userId,
          "metadata[source]": "confetti-app",
          automatic_payment_methods: "true",
        }),
      });
      const data = await res.json();
      if (!res.ok) return { error: data.error?.message ?? "Stripe error" };
      // Only return the client_secret (safe for client) — never the full key
      return {
        paymentIntentId: data.id,
        clientSecret: data.client_secret,
        amount: data.amount,
        currency: data.currency,
        status: data.status,
      };
    }

    case "confirm_payment": {
      const { paymentIntentId } = params as { paymentIntentId: string };
      const res = await fetch(`${base}/payment_intents/${paymentIntentId}`, { headers });
      const data = await res.json();
      return {
        paymentIntentId: data.id,
        status: data.status,
        amount: data.amount,
      };
    }

    default:
      return { error: `Action ${action} not supported for stripe` };
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getProviderKey(provider: Provider): string {
  switch (provider) {
    case "viator": return VIATOR_API_KEY;
    case "opentable": return OPENTABLE_CLIENT_ID;
    case "resy": return RESY_API_KEY;
    case "mindbody": return MINDBODY_API_KEY;
    case "chargepoint": return CHARGEPOINT_API_KEY;
    case "stripe": return STRIPE_SECRET_KEY;
  }
}

async function logBookingActivity(
  userId: string, action: string, provider: string, result: unknown,
) {
  try {
    await fetch(`${SUPABASE_URL}/rest/v1/booking_activity_log`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: SERVICE_ROLE,
        Authorization: `Bearer ${SERVICE_ROLE}`,
        Prefer: "return=minimal",
      },
      body: JSON.stringify({
        user_id: userId,
        action,
        provider,
        result_status: (result as any)?.error ? "error" : "success",
        metadata: result,
      }),
    });
  } catch {
    // Non-blocking — don't fail the response if logging fails
  }
}

function resp(body: unknown, status: number, headers: Record<string, string>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...headers, "Content-Type": "application/json" },
  });
}
