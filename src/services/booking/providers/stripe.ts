/**
 * Stripe Integration (Connect + Issuing)
 * Docs: https://stripe.com/docs/api
 *
 * Handles:
 *   - Payment processing for "Book This Confetti" flow
 *   - Stripe Connect for multi-party payouts to venues
 *   - Future: Stripe Issuing for Loop Wallet virtual cards
 *
 * Auth: Secret key (server-side only — never expose in client code)
 */

import type { PaymentIntent } from "../types";

const STRIPE_BASE = "https://api.stripe.com/v1";

interface StripeConfig {
  secretKey: string;
  publishableKey: string; // for client-side Elements
}

let config: StripeConfig | null = null;

export function configure(cfg: StripeConfig) {
  config = cfg;
}

function headers() {
  if (!config) throw new Error("Stripe not configured.");
  return {
    Authorization: `Bearer ${config.secretKey}`,
    "Content-Type": "application/x-www-form-urlencoded",
  };
}

function toFormData(obj: Record<string, any>): string {
  return Object.entries(obj)
    .filter(([, v]) => v !== undefined)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join("&");
}

// ─── Create Payment Intent ───────────────────────────────────────────
export async function createPaymentIntent(
  amountCents: number,
  confettiCode: string,
  userId: string,
  description: string
): Promise<PaymentIntent> {
  const res = await fetch(`${STRIPE_BASE}/payment_intents`, {
    method: "POST",
    headers: headers(),
    body: toFormData({
      amount: amountCents,
      currency: "usd",
      description,
      "metadata[confetti_code]": confettiCode,
      "metadata[user_id]": userId,
      "metadata[source]": "confetti-app",
      automatic_payment_methods: "true",
    }),
  });

  const data = await res.json();
  return {
    stripePaymentIntentId: data.id,
    amount: data.amount,
    currency: data.currency,
    status: "created",
    loopCode: confettiCode,
  };
}

// ─── Confirm Payment ─────────────────────────────────────────────────
export async function confirmPayment(
  paymentIntentId: string,
  paymentMethodId: string
): Promise<PaymentIntent> {
  const res = await fetch(`${STRIPE_BASE}/payment_intents/${paymentIntentId}/confirm`, {
    method: "POST",
    headers: headers(),
    body: toFormData({
      payment_method: paymentMethodId,
    }),
  });

  const data = await res.json();
  return {
    stripePaymentIntentId: data.id,
    amount: data.amount,
    currency: data.currency,
    status: data.status === "succeeded" ? "succeeded" : "processing",
    loopCode: data.metadata?.confetti_code || "",
  };
}

// ─── Check Payment Status ────────────────────────────────────────────
export async function getPaymentStatus(paymentIntentId: string): Promise<PaymentIntent> {
  const res = await fetch(`${STRIPE_BASE}/payment_intents/${paymentIntentId}`, {
    headers: headers(),
  });
  const data = await res.json();
  return {
    stripePaymentIntentId: data.id,
    amount: data.amount,
    currency: data.currency,
    status: data.status === "succeeded" ? "succeeded" : data.status === "requires_payment_method" ? "failed" : "processing",
    loopCode: data.metadata?.confetti_code || "",
  };
}

// ─── Refund ──────────────────────────────────────────────────────────
export async function refundPayment(
  paymentIntentId: string,
  amountCents?: number
): Promise<boolean> {
  const body: Record<string, any> = { payment_intent: paymentIntentId };
  if (amountCents) body.amount = amountCents;

  const res = await fetch(`${STRIPE_BASE}/refunds`, {
    method: "POST",
    headers: headers(),
    body: toFormData(body),
  });
  return res.ok;
}

// ─── Get Publishable Key (for client) ────────────────────────────────
export function getPublishableKey(): string {
  if (!config) throw new Error("Stripe not configured.");
  return config.publishableKey;
}
