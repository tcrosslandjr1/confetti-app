// Helpers for Supabase Database-Webhook trigger functions:
//  - HMAC-SHA256 verification of x-webhook-signature
//  - Optional internal-trigger-secret path for service-to-service calls
//    (separate from SUPABASE_SERVICE_ROLE_KEY so a service-role leak does
//    not unlock impersonation)
//  - Idempotency claim against public.processed_trigger_events

import { supabaseAdmin } from "./supabase-client.ts";

const encoder = new TextEncoder();

async function hmacSha256Hex(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(message));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}

/**
 * Verifies that the request is a legitimate Supabase database webhook OR a
 * legitimate internal trigger call.
 *
 * Caller passes the raw body string (you'll need this to compute the HMAC,
 * so consume req.text() before parsing JSON).
 */
export async function verifyTriggerAuth(
  req: Request,
  rawBody: string,
): Promise<{ ok: true } | { ok: false; reason: string }> {
  // Path A: Supabase webhook signature (preferred for DB webhooks).
  const webhookSecret = Deno.env.get("SUPABASE_WEBHOOK_SECRET");
  const sig = req.headers.get("x-webhook-signature");
  if (webhookSecret && sig) {
    const expected = await hmacSha256Hex(webhookSecret, rawBody);
    // Supabase prefixes the signature with "v1," in some versions; accept both.
    const candidate = sig.startsWith("v1,") ? sig.slice(3) : sig;
    if (timingSafeEqual(candidate, expected)) return { ok: true };
    return { ok: false, reason: "Bad webhook signature" };
  }

  // Path B: Internal trigger secret (for edge-to-edge calls like
  // trigger-on-plan-request → ai-pipeline). Distinct from the service-role
  // key so a service-role leak does not enable impersonation.
  const internalSecret = Deno.env.get("INTERNAL_TRIGGER_SECRET");
  const internalHeader = req.headers.get("x-internal-trigger-secret");
  if (internalSecret && internalHeader && timingSafeEqual(internalHeader, internalSecret)) {
    return { ok: true };
  }

  return { ok: false, reason: "Missing webhook signature or internal trigger secret" };
}

/**
 * Claims an event for processing. Returns true if this is the first time
 * we've seen (triggerName, eventId); false if it's a replay/duplicate.
 */
export async function claimTriggerEvent(triggerName: string, eventId: string): Promise<boolean> {
  if (!eventId) return true; // can't dedupe without an id — fail open
  const { data, error } = await supabaseAdmin
    .from("processed_trigger_events")
    .insert({ trigger_name: triggerName, event_id: eventId })
    .select("event_id")
    .maybeSingle();

  if (error) {
    // Unique-violation → replay; anything else → fail-open with a log.
    if (error.code === "23505") return false;
    console.error("[trigger] claimTriggerEvent failed, allowing through:", error.message);
    return true;
  }
  return Boolean(data);
}
