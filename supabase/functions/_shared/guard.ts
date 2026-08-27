// Shared request guards for edge functions.
// Every function in this project deploys with verify_jwt = false, so the
// gateway provides ZERO auth — each function must protect itself. Functions
// that spend money (LLM calls, Google Places, SMS/email) MUST at minimum
// rate-limit, and should identify the caller when possible.

import { supabaseAdmin } from "./supabase-client.ts";
import { callerIdentity, consumeRateLimit } from "./ratelimit.ts";

/** Verified Supabase user id from the Authorization header, or null. */
export async function getCallerUserId(req: Request): Promise<string | null> {
  const auth = req.headers.get("Authorization") ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!token) return null;
  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data?.user) return null;
  return data.user.id;
}

/**
 * True when the caller is internal: presents the cron/webhook secret, or the
 * service-role key (function-to-function invokes via supabaseAdmin.functions).
 */
export function isInternalCaller(req: Request): boolean {
  const auth = req.headers.get("Authorization") ?? "";
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (serviceKey && auth === `Bearer ${serviceKey}`) return true;
  const secret = Deno.env.get("CRON_SECRET");
  if (!secret) return false;
  const header = req.headers.get("x-cron-secret") ?? req.headers.get("x-internal-secret");
  if (header === secret) return true;
  return auth === `Bearer ${secret}`;
}

export interface GuardLimit {
  scope: string;
  burst: number;
  refillPerSec: number;
}

/**
 * Rate-limit the caller (per verified user when signed in, else per IP).
 * Returns a 429 Response to send back, or null to proceed.
 * The limiter fails CLOSED — see ratelimit.ts.
 */
export async function rateLimitOr429(
  req: Request,
  limit: GuardLimit,
  corsHeaders: Record<string, string>,
  userId?: string | null,
): Promise<Response | null> {
  if (isInternalCaller(req)) return null;
  const identity = callerIdentity(req, userId ?? (await getCallerUserId(req)));
  const ok = await consumeRateLimit({
    scope: limit.scope,
    identity,
    burst: limit.burst,
    refillPerSec: limit.refillPerSec,
  });
  if (ok) return null;
  return new Response(
    JSON.stringify({ error: "Too many requests — slow down and try again shortly." }),
    { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
}

/** 401 Response for endpoints that require the internal secret. */
export function unauthorized(corsHeaders: Record<string, string>): Response {
  return new Response(JSON.stringify({ error: "Unauthorized" }), {
    status: 401,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
