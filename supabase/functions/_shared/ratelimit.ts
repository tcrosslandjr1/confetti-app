// Postgres token-bucket rate limiter.
// Calls consume_rate_limit() RPC; that function is SECURITY DEFINER so
// it works whether we pass the user's JWT or the service-role key.

import { supabaseAdmin } from "./supabase-client.ts";

export interface RateLimitOptions {
  /** Bucket scope: an identifier to namespace this limit (function name). */
  scope: string;
  /** Per-user identifier when available; otherwise pass the IP. */
  identity: string;
  /** Maximum bucket size — burst capacity. */
  burst: number;
  /** Tokens added per second (e.g. 60/min → 1.0). */
  refillPerSec: number;
}

export async function consumeRateLimit(opts: RateLimitOptions): Promise<boolean> {
  const key = `${opts.scope}:${opts.identity}`;
  const { data, error } = await supabaseAdmin.rpc("consume_rate_limit", {
    p_key: key,
    p_burst: opts.burst,
    p_refill_per_sec: opts.refillPerSec,
  });
  if (error) {
    // Fail-open on infra error — better to take the call than break the app.
    // The error itself will surface in logs.
    console.error("[ratelimit] consume_rate_limit RPC failed:", error.message);
    return true;
  }
  return data === true;
}

/** Best-effort caller identity: user-id from JWT if present, else IP. */
export function callerIdentity(req: Request, userId?: string | null): string {
  if (userId) return `user:${userId}`;
  const fwd = req.headers.get("x-forwarded-for") ?? "";
  const ip = fwd.split(",")[0]?.trim() || req.headers.get("cf-connecting-ip") || "unknown";
  return `ip:${ip}`;
}
