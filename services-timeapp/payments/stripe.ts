/**
 * Stripe Payment Provider
 * Docs: https://stripe.com/docs/api
 *
 * Handles: Confetti Fund deposits, Boost credit purchases, Black tier subscriptions,
 * venue partner payouts, and one-time booking payments.
 *
 * Auth: Secret key (server-side) + Publishable key (client-side)
 * Cost: Free until you process payments — 2.9% + 30¢ per transaction
 *
 * Setup: npm install stripe @stripe/stripe-js
 *        Add STRIPE_SECRET_KEY and VITE_STRIPE_PUBLISHABLE_KEY to .env
 *
 * DEV MODE: When no key is configured, all methods return mock responses
 * so the app works end-to-end without a Stripe account.
 */

// ─── Types ──────────────────────────────────────────────────────────

export type PaymentStatus = "created" | "processing" | "succeeded" | "failed" | "refunded";
export type SubscriptionStatus = "active" | "past_due" | "canceled" | "trialing";

export interface CreatePaymentRequest {
  amount: number;         // cents (e.g. 2999 = $29.99)
  currency?: string;      // default "usd"
  userId: string;
  description: string;    // "Confetti Fund deposit" or "Boost Credits x50"
  metadata?: Record<string, string>;
}

export interface PaymentResult {
  paymentIntentId: string;
  clientSecret: string;   // for Stripe Elements on frontend
  amount: number;
  currency: string;
  status: PaymentStatus;
}

export interface CreateSubscriptionRequest {
  userId: string;
  email: string;
  priceId: string;        // Stripe Price ID for Black tier
  trialDays?: number;
}

export interface SubscriptionResult {
  subscriptionId: string;
  status: SubscriptionStatus;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  clientSecret?: string;  // if payment needed immediately
}

export interface RefundRequest {
  paymentIntentId: string;
  amount?: number;        // partial refund in cents — omit for full
  reason?: "requested_by_customer" | "duplicate" | "fraudulent";
}

export interface TransferRequest {
  amount: number;         // cents
  destinationAccountId: string; // venue partner's connected account
  description: string;
}

// ─── Configuration ───────���──────────────────────────────────────────

interface StripeConfig {
  secretKey: string;
  publishableKey: string;
  webhookSecret?: string;
}

let config: StripeConfig | null = null;

export function configure(cfg: StripeConfig) {
  config = cfg;
}

function isConfigured(): boolean {
  return !!config?.secretKey;
}

function getHeaders() {
  if (!config) throw new Error("Stripe not configured.");
  return {
    Authorization: `Bearer ${config.secretKey}`,
    "Content-Type": "application/x-www-form-urlencoded",
  };
}

// ─── Mock Mode ──────────���───────────────────────────────────────────

function mockPayment(req: CreatePaymentRequest): PaymentResult {
  console.log(`[Stripe Mock] Payment: $${(req.amount / 100).toFixed(2)} — ${req.description}`);
  return {
    paymentIntentId: `pi_mock_${Date.now()}`,
    clientSecret: `pi_mock_${Date.now()}_secret_mock`,
    amount: req.amount,
    currency: req.currency || "usd",
    status: "succeeded",
  };
}

function mockSubscription(req: CreateSubscriptionRequest): SubscriptionResult {
  console.log(`[Stripe Mock] Subscription: ${req.email} → ${req.priceId}`);
  return {
    subscriptionId: `sub_mock_${Date.now()}`,
    status: req.trialDays ? "trialing" : "active",
    currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    cancelAtPeriodEnd: false,
  };
}

// ─── Payments ───────────────────────��───────────────────────────────

/**
 * Create a payment intent for one-time charges.
 * Returns a client secret for Stripe Elements to complete payment on frontend.
 */
export async function createPayment(req: CreatePaymentRequest): Promise<PaymentResult> {
  if (!isConfigured()) return mockPayment(req);

  const body = new URLSearchParams({
    amount: req.amount.toString(),
    currency: req.currency || "usd",
    "metadata[user_id]": req.userId,
    "metadata[source]": "confetti-app",
    description: req.description,
    ...(req.metadata
      ? Object.fromEntries(Object.entries(req.metadata).map(([k, v]) => [`metadata[${k}]`, v]))
      : {}),
  });

  const res = await fetch("https://api.stripe.com/v1/payment_intents", {
    method: "POST",
    headers: getHeaders(),
    body: body.toString(),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(`Stripe payment failed: ${err.error?.message || res.status}`);
  }

  const data = await res.json();
  return {
    paymentIntentId: data.id,
    clientSecret: data.client_secret,
    amount: data.amount,
    currency: data.currency,
    status: mapStatus(data.status),
  };
}

/**
 * Create a subscription (Confetti Black tier).
 */
export async function createSubscription(req: CreateSubscriptionRequest): Promise<SubscriptionResult> {
  if (!isConfigured()) return mockSubscription(req);

  // Step 1: Get or create customer
  const customerBody = new URLSearchParams({
    email: req.email,
    "metadata[user_id]": req.userId,
    "metadata[source]": "confetti-app",
  });

  const customerRes = await fetch("https://api.stripe.com/v1/customers", {
    method: "POST",
    headers: getHeaders(),
    body: customerBody.toString(),
  });

  if (!customerRes.ok) throw new Error("Failed to create Stripe customer");
  const customer = await customerRes.json();

  // Step 2: Create subscription
  const subBody = new URLSearchParams({
    customer: customer.id,
    "items[0][price]": req.priceId,
    payment_behavior: "default_incomplete",
    "payment_settings[save_default_payment_method]": "on_subscription",
    "expand[]": "latest_invoice.payment_intent",
  });

  if (req.trialDays) {
    subBody.set("trial_period_days", req.trialDays.toString());
  }

  const subRes = await fetch("https://api.stripe.com/v1/subscriptions", {
    method: "POST",
    headers: getHeaders(),
    body: subBody.toString(),
  });

  if (!subRes.ok) throw new Error("Failed to create subscription");
  const sub = await subRes.json();

  return {
    subscriptionId: sub.id,
    status: sub.status as SubscriptionStatus,
    currentPeriodEnd: new Date(sub.current_period_end * 1000).toISOString(),
    cancelAtPeriodEnd: sub.cancel_at_period_end,
    clientSecret: sub.latest_invoice?.payment_intent?.client_secret,
  };
}

/**
 * Cancel a subscription at period end.
 */
export async function cancelSubscription(subscriptionId: string): Promise<SubscriptionResult> {
  if (!isConfigured()) {
    return { subscriptionId, status: "canceled", currentPeriodEnd: new Date().toISOString(), cancelAtPeriodEnd: true };
  }

  const res = await fetch(`https://api.stripe.com/v1/subscriptions/${subscriptionId}`, {
    method: "POST",
    headers: getHeaders(),
    body: "cancel_at_period_end=true",
  });

  if (!res.ok) throw new Error("Failed to cancel subscription");
  const sub = await res.json();

  return {
    subscriptionId: sub.id,
    status: sub.status,
    currentPeriodEnd: new Date(sub.current_period_end * 1000).toISOString(),
    cancelAtPeriodEnd: true,
  };
}

/**
 * Refund a payment (full or partial).
 */
export async function refund(req: RefundRequest): Promise<{ refundId: string; status: string }> {
  if (!isConfigured()) {
    return { refundId: `re_mock_${Date.now()}`, status: "succeeded" };
  }

  const body = new URLSearchParams({ payment_intent: req.paymentIntentId });
  if (req.amount) body.set("amount", req.amount.toString());
  if (req.reason) body.set("reason", req.reason);

  const res = await fetch("https://api.stripe.com/v1/refunds", {
    method: "POST",
    headers: getHeaders(),
    body: body.toString(),
  });

  if (!res.ok) throw new Error("Refund failed");
  const data = await res.json();
  return { refundId: data.id, status: data.status };
}

/**
 * Transfer funds to a venue partner's connected account (for Boost payouts).
 */
export async function transferToPartner(req: TransferRequest): Promise<{ transferId: string }> {
  if (!isConfigured()) {
    return { transferId: `tr_mock_${Date.now()}` };
  }

  const body = new URLSearchParams({
    amount: req.amount.toString(),
    currency: "usd",
    destination: req.destinationAccountId,
    description: req.description,
  });

  const res = await fetch("https://api.stripe.com/v1/transfers", {
    method: "POST",
    headers: getHeaders(),
    body: body.toString(),
  });

  if (!res.ok) throw new Error("Transfer failed");
  const data = await res.json();
  return { transferId: data.id };
}

// ─── Helpers ────────────────────────────────────────────────────────

function mapStatus(stripeStatus: string): PaymentStatus {
  switch (stripeStatus) {
    case "requires_payment_method":
    case "requires_confirmation":
    case "requires_action":
      return "created";
    case "processing":
      return "processing";
    case "succeeded":
      return "succeeded";
    case "canceled":
      return "failed";
    default:
      return "created";
  }
}

/**
 * Get the publishable key for frontend Stripe Elements.
 */
export function getPublishableKey(): string {
  return config?.publishableKey || "pk_test_mock_key_for_development";
}
