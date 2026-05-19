import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { createStripeClient } from "@/lib/stripe.server";
// --- Plan catalog (price IDs registered in Stripe) ---
export const CONSUMER_PRICES = [
  "consumer_plus_monthly",
  "consumer_crew_monthly",
  "user_unlimited_monthly",
  "user_vip_monthly",
] as const;
export const BUSINESS_PRICES = [
  "business_basic_monthly",
  "business_featured_monthly",
  "business_boosted_monthly",
  "business_premium_monthly",
  "corporate_addon_monthly",
] as const;
export const AD_PRICES = [
  "ad_featured_monthly",
  "ad_boosted_monthly",
  "ad_premium_monthly",
] as const;
// Recurring boost SKUs (auto-renew each month until canceled)
export const BOOST_RECURRING_PRICES = [
  "boost_24h_monthly",
  "boost_3d_monthly",
  "boost_7d_monthly",
] as const;
// One-time SKUs (boosts, event promos, reel promos, user unlocks)
export const ONE_TIME_PRICES = [
  "unlock_premium_plan_once",
  "unlock_vip_access_once",
  "user_plan_single_once",
  "boost_24h_once",
  "boost_3d_once",
  "boost_7d_once",
  "event_single_once",
  "event_weekend_once",
  "event_monthly_once",
  "reel_boost_once",
  "reel_trending_pack_once",
  "reel_viral_push_once",
] as const;

const ALL_PRICES = [
  ...CONSUMER_PRICES,
  ...BUSINESS_PRICES,
  ...AD_PRICES,
  ...BOOST_RECURRING_PRICES,
  ...ONE_TIME_PRICES,
] as const;

const StripeEnvSchema = z.enum(["sandbox", "live"]);

// Default trial period (days) by price. Caller can override per-checkout
// via the `trialDays` input. Only applies to recurring (subscription) prices.
export const DEFAULT_TRIAL_DAYS: Partial<Record<(typeof ALL_PRICES)[number], number>> = {
  business_basic_monthly: 14,
  business_featured_monthly: 14,
  business_boosted_monthly: 14,
  business_premium_monthly: 14,
  corporate_addon_monthly: 14,
  consumer_plus_monthly: 7,
  consumer_crew_monthly: 7,
  user_unlimited_monthly: 7,
  user_vip_monthly: 7,
};

async function resolveOrCreateCustomer(
  stripe: ReturnType<typeof createStripeClient>,
  options: { email?: string; userId?: string },
): Promise<string> {
  if (options.userId && !/^[a-zA-Z0-9_-]+$/.test(options.userId)) {
    throw new Error("Invalid userId");
  }
  if (options.userId) {
    const found = await stripe.customers.search({
      query: `metadata['userId']:'${options.userId}'`,
      limit: 1,
    });
    if (found.data.length) return found.data[0].id;
  }
  if (options.email) {
    const existing = await stripe.customers.list({ email: options.email, limit: 1 });
    if (existing.data.length) {
      const customer = existing.data[0];
      if (options.userId && customer.metadata?.userId !== options.userId) {
        await stripe.customers.update(customer.id, {
          metadata: { ...customer.metadata, userId: options.userId },
        });
      }
      return customer.id;
    }
  }
  const created = await stripe.customers.create({
    ...(options.email && { email: options.email }),
    ...(options.userId && { metadata: { userId: options.userId } }),
  });
  return created.id;
}

// ============================================================================
// createCheckoutSession — subscriptions and one-time unlocks
// ============================================================================
export const createCheckoutSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      priceId: z.enum(ALL_PRICES),
      quantity: z.number().int().min(1).max(10).optional(),
      customerEmail: z.string().email().optional(),
      accountType: z.enum(["user", "business", "corporate"]).optional(),
      // Promo target — for boost/event/reel SKUs only
      targetType: z.enum(["venue", "event", "reel", "vendor"]).optional(),
      targetId: z.string().uuid().optional(),
      returnUrl: z.string().url(),
      environment: StripeEnvSchema,
      // Free trial in days (0 = no trial). Applied only to subscriptions.
      // Max 730 (Stripe's hard limit).
      trialDays: z.number().int().min(0).max(730).optional(),
    }).parse,
  )
  .handler(async ({ data, context }) => {
    // returnUrl must point to our own origin — prevents open-redirect abuse.
    const siteUrl = (process.env.SITE_URL ?? "https://confettiplan.lovable.app").replace(/\/$/, "");
    if (!data.returnUrl.startsWith(siteUrl + "/") && data.returnUrl !== siteUrl) {
      throw new Error("Invalid returnUrl");
    }
    // userId is always derived from the authenticated session — never the client.
    const { userId } = context;
    const stripe = createStripeClient(data.environment);

    const prices = await stripe.prices.list({ lookup_keys: [data.priceId] });
    if (!prices.data.length) throw new Error(`Price not found: ${data.priceId}`);
    const stripePrice = prices.data[0];
    const isRecurring = stripePrice.type === "recurring";

    const customerId = await resolveOrCreateCustomer(stripe, {
      email: data.customerEmail,
      userId,
    });

    const accountType = data.accountType ?? "user";

    const baseMetadata: Record<string, string> = {
      priceId: data.priceId,
      productId:
        typeof stripePrice.product === "string" ? stripePrice.product : stripePrice.product.id,
      accountType,
      userId,
      ...(data.targetType && { targetType: data.targetType }),
      ...(data.targetId && { targetId: data.targetId }),
    };

    // Resolve trial period: explicit input wins, else per-price default.
    // Only attached when the price is recurring and > 0.
    const trialDays = isRecurring ? (data.trialDays ?? DEFAULT_TRIAL_DAYS[data.priceId] ?? 0) : 0;

    const session = await stripe.checkout.sessions.create({
      line_items: [{ price: stripePrice.id, quantity: data.quantity || 1 }],
      mode: isRecurring ? "subscription" : "payment",
      ui_mode: "embedded_page",
      return_url: data.returnUrl,
      customer: customerId,
      metadata: { ...baseMetadata, ...(trialDays > 0 && { trialDays: String(trialDays) }) },
      ...(isRecurring && {
        subscription_data: {
          metadata: baseMetadata,
          ...(trialDays > 0 && { trial_period_days: trialDays }),
        },
      }),
      allow_promotion_codes: true,
      managed_payments: { enabled: true },
    } as any);

    return session.client_secret;
  });

// ============================================================================
// createTicketCheckout — per-event ticket using events.price_cents
// ============================================================================
let _adminClient: ReturnType<typeof createClient> | null = null;
function adminClient() {
  if (!_adminClient) {
    _adminClient = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  }
  return _adminClient;
}

export const createTicketCheckout = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      eventId: z.string().uuid(),
      quantity: z.number().int().min(1).max(10).default(1),
      returnUrl: z.string().url(),
      environment: StripeEnvSchema,
    }).parse,
  )
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const { data: event, error } = await adminClient()
      .from("events")
      .select("id, title, price_cents, currency, tickets_enabled")
      .eq("id", data.eventId)
      .maybeSingle();
    if (error || !event) throw new Error("Event not found");
    const ev = event as {
      id: string;
      title: string;
      price_cents: number | null;
      currency: string | null;
      tickets_enabled: boolean | null;
    };
    if (!ev.tickets_enabled) throw new Error("Tickets not enabled for this event");
    if (!ev.price_cents || ev.price_cents < 50) throw new Error("Event has no valid price");

    const stripe = createStripeClient(data.environment);
    const customerId = await resolveOrCreateCustomer(stripe, { userId });

    const session = await stripe.checkout.sessions.create({
      line_items: [
        {
          price_data: {
            currency: ev.currency || "usd",
            product_data: { name: `Ticket — ${ev.title}` },
            unit_amount: ev.price_cents,
          },
          quantity: data.quantity,
        },
      ],
      mode: "payment",
      ui_mode: "embedded_page",
      return_url: data.returnUrl,
      customer: customerId,
      managed_payments: { enabled: true },
      metadata: {
        userId,
        kind: "ticket",
        eventId: ev.id,
        eventTitle: ev.title,
        quantity: String(data.quantity),
      },
    } as any);
    return session.client_secret;
  });

// ============================================================================
// createPortalSession — Stripe Billing Portal (manage payment method, invoices)
// ============================================================================
export const createPortalSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      returnUrl: z.string().url().optional(),
      environment: StripeEnvSchema,
    }).parse,
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: sub } = await supabase
      .from("subscriptions")
      .select("stripe_customer_id")
      .eq("user_id", userId)
      .eq("environment", data.environment)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!sub?.stripe_customer_id) throw new Error("No subscription found");

    const stripe = createStripeClient(data.environment);
    const portal = await stripe.billingPortal.sessions.create({
      customer: sub.stripe_customer_id,
      ...(data.returnUrl && { return_url: data.returnUrl }),
    });
    return portal.url;
  });

// ============================================================================
// changePlan — upgrade now (immediate, prorated) OR downgrade at period end
// ============================================================================
const PRICE_RANK: Record<string, number> = {
  consumer_plus_monthly: 1,
  consumer_crew_monthly: 2,
  business_featured_monthly: 1,
  business_boosted_monthly: 2,
  business_premium_monthly: 3,
  ad_featured_monthly: 1,
  ad_boosted_monthly: 2,
  ad_premium_monthly: 3,
};

export const changePlan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      newPriceId: z.enum([...CONSUMER_PRICES, ...BUSINESS_PRICES, ...AD_PRICES]),
      environment: StripeEnvSchema,
    }).parse,
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: sub } = await supabase
      .from("subscriptions")
      .select("stripe_subscription_id, price_id")
      .eq("user_id", userId)
      .eq("environment", data.environment)
      .in("status", ["active", "trialing", "past_due"])
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!sub?.stripe_subscription_id) throw new Error("No active subscription");
    if (sub.price_id === data.newPriceId) return { ok: true, mode: "noop" as const };

    const stripe = createStripeClient(data.environment);
    const prices = await stripe.prices.list({ lookup_keys: [data.newPriceId] });
    if (!prices.data.length) throw new Error("New price not found");
    const newStripePrice = prices.data[0];

    const subscription = await stripe.subscriptions.retrieve(sub.stripe_subscription_id);
    const currentItem = subscription.items.data[0];

    const currentRank = PRICE_RANK[sub.price_id as string] ?? 0;
    const newRank = PRICE_RANK[data.newPriceId] ?? 0;
    const isUpgrade = newRank > currentRank;

    if (isUpgrade) {
      // Immediate switch with proration
      await stripe.subscriptions.update(sub.stripe_subscription_id, {
        items: [{ id: currentItem.id, price: newStripePrice.id }],
        proration_behavior: "always_invoice",
        metadata: { ...subscription.metadata, priceId: data.newPriceId },
      });
      return { ok: true, mode: "upgrade" as const };
    } else {
      // Downgrade — schedule for next renewal, record locally as pending
      await stripe.subscriptions.update(sub.stripe_subscription_id, {
        items: [{ id: currentItem.id, price: newStripePrice.id }],
        proration_behavior: "none",
        billing_cycle_anchor: "unchanged",
        metadata: { ...subscription.metadata, pendingPriceId: data.newPriceId },
      });
      await adminClient()
        .from("subscriptions")
        .update({ pending_price_id: data.newPriceId } as never)
        .eq("stripe_subscription_id", sub.stripe_subscription_id);
      return { ok: true, mode: "downgrade_at_period_end" as const };
    }
  });

// ============================================================================
// cancelSubscription — immediate revoke
// ============================================================================
export const cancelSubscription = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ environment: StripeEnvSchema }).parse)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: sub } = await supabase
      .from("subscriptions")
      .select("stripe_subscription_id")
      .eq("user_id", userId)
      .eq("environment", data.environment)
      .in("status", ["active", "trialing", "past_due"])
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!sub?.stripe_subscription_id) throw new Error("No active subscription");

    const stripe = createStripeClient(data.environment);
    // Immediate cancel — webhook flips status + tier flips to Free.
    await stripe.subscriptions.cancel(sub.stripe_subscription_id, {
      invoice_now: false,
      prorate: false,
    });
    return { ok: true };
  });

// ============================================================================
// getCheckoutSession — read a completed session for the post-checkout page
// ============================================================================
export const getCheckoutSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      sessionId: z.string().regex(/^cs_(test|live)_[a-zA-Z0-9]+$/),
      environment: StripeEnvSchema,
    }).parse,
  )
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const stripe = createStripeClient(data.environment);

    const session = await stripe.checkout.sessions.retrieve(data.sessionId, {
      expand: ["line_items", "subscription", "payment_intent"],
    });

    // Ownership guard — only the buyer can read their session.
    const sessionUserId = session.metadata?.userId;
    if (sessionUserId && sessionUserId !== userId) {
      throw new Error("Forbidden");
    }

    const line = (session as any).line_items?.data?.[0];
    const sub = typeof session.subscription === "object" ? session.subscription : null;
    const subItem = sub?.items?.data?.[0];
    const periodEnd = subItem?.current_period_end ?? (sub as any)?.current_period_end;
    const trialEnd = (sub as any)?.trial_end;

    return {
      id: session.id,
      mode: session.mode, // "subscription" | "payment" | "setup"
      status: session.status, // "open" | "complete" | "expired"
      paymentStatus: session.payment_status, // "paid" | "unpaid" | "no_payment_required"
      customerEmail: session.customer_details?.email ?? null,
      amountTotal: session.amount_total ?? null, // minor units
      currency: session.currency ?? null,
      priceId: session.metadata?.priceId ?? null,
      productName: line?.description ?? null,
      quantity: line?.quantity ?? null,
      accountType: session.metadata?.accountType ?? null,
      kind: session.metadata?.kind ?? null,
      subscription: sub
        ? {
            id: sub.id,
            status: sub.status,
            cancelAtPeriodEnd: sub.cancel_at_period_end ?? false,
            currentPeriodEnd: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
            trialEnd: trialEnd ? new Date(trialEnd * 1000).toISOString() : null,
          }
        : null,
    };
  });
