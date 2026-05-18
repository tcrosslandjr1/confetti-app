// Shared helpers for /api/public/partner/v1/* endpoints.
// NOTE: Backed by an in-memory mock store; swap to Supabase tables when ready.

import { createHmac, timingSafeEqual } from "node:crypto";

export type Json = Record<string, unknown> | unknown[] | string | number | boolean | null;

export type ApiErrorCode =
  | "SLOT_UNAVAILABLE"
  | "VENUE_CLOSED"
  | "PARTY_TOO_LARGE"
  | "ITEM_UNAVAILABLE"
  | "ORDER_LOCKED"
  | "DEPOSIT_FAILED"
  | "INVALID_TOKEN"
  | "RATE_LIMITED"
  | "NOT_FOUND"
  | "VALIDATION";

const ERROR_STATUS: Record<ApiErrorCode, number> = {
  SLOT_UNAVAILABLE: 409,
  VENUE_CLOSED: 409,
  PARTY_TOO_LARGE: 422,
  ITEM_UNAVAILABLE: 409,
  ORDER_LOCKED: 409,
  DEPOSIT_FAILED: 402,
  INVALID_TOKEN: 401,
  RATE_LIMITED: 429,
  NOT_FOUND: 404,
  VALIDATION: 422,
};

export function apiError(code: ApiErrorCode, message: string, details?: Json) {
  return new Response(JSON.stringify({ error: { code, message, details: details ?? null } }), {
    status: ERROR_STATUS[code],
    headers: { "Content-Type": "application/json" },
  });
}

export function json(body: Json, status = 200, extraHeaders: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...extraHeaders },
  });
}

// ---- Auth (Bearer token → venue) ----
// Demo tokens. In production these live in a partner_tokens table keyed by hashed token.
const TOKEN_TO_VENUE: Record<string, { venue_id: string; tier: 2 | 3 }> = {
  demo_token_sundae: { venue_id: "ven_xyz789", tier: 3 },
  demo_token_downtown: { venue_id: "ven_dwntn", tier: 2 },
};

export function authenticate(request: Request): { venue_id: string; tier: 2 | 3 } | Response {
  const header = request.headers.get("authorization") ?? "";
  const match = header.match(/^Bearer\s+(.+)$/i);
  if (!match) return apiError("INVALID_TOKEN", "Missing bearer token");
  const ctx = TOKEN_TO_VENUE[match[1]];
  if (!ctx) return apiError("INVALID_TOKEN", "Bad or expired partner token");
  return ctx;
}

// ---- Rate limit (100 req/min/venue, in-memory) ----
const RATE: Map<string, { count: number; resetAt: number }> = new Map();
export function checkRate(venue_id: string): Response | null {
  const now = Date.now();
  const bucket = RATE.get(venue_id);
  if (!bucket || bucket.resetAt < now) {
    RATE.set(venue_id, { count: 1, resetAt: now + 60_000 });
    return null;
  }
  if (bucket.count >= 100) {
    return apiError("RATE_LIMITED", "Too many requests", {
      retry_after_ms: bucket.resetAt - now,
    });
  }
  bucket.count += 1;
  return null;
}

// ---- HMAC for outbound webhooks ----
const WEBHOOK_SECRET = process.env.PARTNER_WEBHOOK_SECRET || "demo_webhook_secret_change_me";

export function signPayload(body: string): string {
  return createHmac("sha256", WEBHOOK_SECRET).update(body).digest("hex");
}

export function verifySignature(body: string, signature: string | null): boolean {
  if (!signature) return false;
  const expected = signPayload(body);
  try {
    return timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  } catch {
    return false;
  }
}

// ---- In-memory mock store ----
export type Reservation = {
  reservation_id: string;
  venue_id: string;
  user_id: string;
  datetime: string;
  party_size: number;
  status: "pending" | "confirmed" | "cancelled" | "no_show" | "completed";
  confirmation_code: string;
  deposit_status: "paid" | "pending" | "refunded" | "none";
  table_assignment?: string;
  notes?: string;
  source?: string;
  created_at: string;
  updated_at: string;
  cancellation_policy: { free_cancel_before: string; late_cancel_fee: number };
};

export type Order = {
  order_id: string;
  venue_id: string;
  user_id: string;
  reservation_id?: string;
  type: "dine_in_preorder" | "pickup";
  pickup_time: string;
  items: Array<{
    menu_item_id: string;
    name: string;
    quantity: number;
    price: number;
    modifications?: string[];
  }>;
  subtotal: number;
  tax: number;
  tip: number;
  total: number;
  status: "pending_venue" | "confirmed" | "preparing" | "ready" | "picked_up" | "cancelled";
  payment_status: "paid" | "refunded" | "partial_refund";
  estimated_ready: string;
  created_at: string;
  updated_at: string;
};

class Store<T extends { venue_id: string }> {
  private items = new Map<string, T>();
  upsert(id: string, item: T) {
    this.items.set(id, item);
    return item;
  }
  get(id: string) {
    return this.items.get(id);
  }
  delete(id: string) {
    return this.items.delete(id);
  }
  forVenue(venue_id: string) {
    return [...this.items.values()].filter((i) => i.venue_id === venue_id);
  }
}

export const reservations = new Store<Reservation>();
export const orders = new Store<Order>();

export function genId(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

export function confirmationCode() {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < 4; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return `CONF-${s}`;
}
