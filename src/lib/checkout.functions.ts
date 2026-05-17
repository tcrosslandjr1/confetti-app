import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { type StripeEnv, createStripeClient } from "@/lib/stripe.server";

// --- Plan catalog (price IDs registered in Stripe) ---
export const CONSUMER_PRICES = ["plus_monthly", "crew_monthly"] as const;
export const BUSINESS_PRICES = [
  "business_featured_monthly",
  "business_boosted_monthly",
  "business_premium_monthly",
] as const;
export const AD_PRICES = [
  "ad_featured_month",
  "ad_boosted_month",
  "ad_premium_month",
] as const;
export const ONE_TIME_PRICES = [
  "unlock_premium_plan_once",
  "unlock_vip_30d_once",
] as const;

const ALL_PRICES = [
  ...CONSUMER_PRICES,
  ...BUSINESS_PRICES,
  ...AD_PRICES,
  ...ONE_TIME_PRICES,
] as const;

const StripeEnvSchema = z.enum(["sandbox", "live"]);

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
  .inputValidator(
    z.object({
      priceId: z.enum(ALL_PRICES),
      quantity: z.number().int().min(1).max(10).optional(),
      customerEmail: z.string().email().optional(),
      userId: z.string().regex(/^[a-zA-Z0-9_-]+$/).optional(),
      accountType: z.enum(["user", "business", "corporate"]).optional(),
      returnUrl: z.string().url(),
      environment: StripeEnvSchema,
    }).parse,
  )
  .handler(async ({ data }) => {
    const stripe = createStripeClient(data.environment);

    const prices = await stripe.prices.list({ lookup_keys: [data.priceId] });
    if (!prices.data.length) throw new Error(`Price not found: ${data.priceId}`);
    const stripePrice = prices.data[0];
    const isRecurring = stripePrice.type === "recurring";

    const customerId = (data.customerEmail || data.userId)
      ? await resolveOrCreateCustomer(stripe, {
          email: data.customerEmail,
          userId: data.userId,
        })
      : undefined;

    const accountType = data.accountType ?? "user";

    const session = await stripe.checkout.sessions.create({
      line_items: [{ price: stripePrice.id, quantity: data.quantity || 1 }],
      mode: isRecurring ? "subscription" : "payment",
      ui_mode: "embedded_page",
      return_url: data.returnUrl,
      ...(customerId && { customer: customerId }),
      metadata: {
        ...(data.userId && { userId: data.userId }),
        priceId: data.priceId,
        productId: typeof stripePrice.product === "string"
          ? stripePrice.product
          : stripePrice.product.id,
        accountType,
      },
      ...(isRecurring && data.userId && {
        subscription_data: {
          metadata: { userId: data.userId, priceId: data.priceId, accountType },
        },
      }),
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
    _adminClient = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );
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
    const ev = event as { id: string; title: string; price_cents: number | null; currency: string | null; tickets_enabled: boolean | null };
    if (!ev.tickets_enabled) throw new Error("Tickets not enabled for this event");
    if (!ev.price_cents || ev.price_cents < 50) throw new Error("Event has no valid price");

    const stripe = createStripeClient(data.environment);
    const customerId = await resolveOrCreateCustomer(stripe, { userId });

    const session = await stripe.checkout.sessions.create({
      line_items: [{
        price_data: {
          currency: ev.currency || "usd",
          product_data: { name: `Ticket — ${ev.title}` },
          unit_amount: ev.price_cents,
        },
        quantity: data.quantity,
      }],
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
    });
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
  plus_monthly: 1,
  crew_monthly: 2,
  business_featured_monthly: 1,
  business_boosted_monthly: 2,
  business_premium_monthly: 3,
  ad_featured_month: 1,
  ad_boosted_month: 2,
  ad_premium_month: 3,
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
        .update({ pending_price_id: data.newPriceId })
        .eq("stripe_subscription_id", sub.stripe_subscription_id);
      return { ok: true, mode: "downgrade_at_period_end" as const };
    }
  });

// ============================================================================
// cancelSubscription — immediate revoke
// ============================================================================
export const cancelSubscription = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({ environment: StripeEnvSchema }).parse,
  )
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
