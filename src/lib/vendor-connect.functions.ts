import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { createStripeClient } from "@/lib/stripe.server";
const VendorType = z.enum(["venue", "promoter", "partner", "corporate_host"]);
const Env = z.enum(["sandbox", "live"]);

/**
 * Start (or resume) Stripe Connect Express onboarding.
 * Creates a Connect account if the user doesn't have one for this env,
 * then returns a one-time Stripe-hosted onboarding URL.
 */
export const startVendorOnboarding = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        vendorType: VendorType,
        environment: Env,
        returnUrl: z.string().url(),
        refreshUrl: z.string().url(),
        country: z.string().length(2).default("US"),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { userId } = context as { userId: string };
    const stripe = createStripeClient(data.environment);

    // Look up existing vendor row for this user+env
    const { data: existing } = await supabaseAdmin
      .from("vendors")
      .select("id, stripe_account_id")
      .eq("user_id", userId)
      .eq("environment", data.environment)
      .maybeSingle();

    let stripeAccountId = existing?.stripe_account_id as string | undefined;

    if (!stripeAccountId) {
      const account = await stripe.accounts.create({
        type: "express",
        country: data.country,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        metadata: { userId, vendorType: data.vendorType },
      });
      stripeAccountId = account.id;

      await supabaseAdmin.from("vendors").upsert(
        {
          user_id: userId,
          vendor_type: data.vendorType,
          stripe_account_id: stripeAccountId,
          environment: data.environment,
          charges_enabled: false,
          payouts_enabled: false,
          details_submitted: false,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "stripe_account_id" },
      );
    }

    const link = await stripe.accountLinks.create({
      account: stripeAccountId,
      refresh_url: data.refreshUrl,
      return_url: data.returnUrl,
      type: "account_onboarding",
    });

    return { url: link.url, stripeAccountId };
  });

/**
 * Refresh verification status from Stripe and write back to the DB.
 * Call after the user returns from the Stripe onboarding flow, and on demand.
 */
export const refreshVendorStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ environment: Env }).parse(input))
  .handler(async ({ data, context }) => {
    const { userId } = context as { userId: string };

    const { data: row } = await supabaseAdmin
      .from("vendors")
      .select("id, stripe_account_id")
      .eq("user_id", userId)
      .eq("environment", data.environment)
      .maybeSingle();

    if (!row?.stripe_account_id) return { found: false } as const;

    const stripe = createStripeClient(data.environment);
    const account = await stripe.accounts.retrieve(row.stripe_account_id as string);

    const update = {
      charges_enabled: !!account.charges_enabled,
      payouts_enabled: !!account.payouts_enabled,
      details_submitted: !!account.details_submitted,
      updated_at: new Date().toISOString(),
    };

    await supabaseAdmin
      .from("vendors")
      .update(update)
      .eq("id", row.id as string);

    const requirements = account.requirements;
    return {
      found: true as const,
      stripeAccountId: row.stripe_account_id,
      ...update,
      requirementsDue: requirements?.currently_due ?? [],
      requirementsPastDue: requirements?.past_due ?? [],
      disabledReason: requirements?.disabled_reason ?? null,
    };
  });

/** Read current vendor status for the signed-in user. */
export const getVendorStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ environment: Env }).parse(input))
  .handler(async ({ data, context }) => {
    const { userId } = context as { userId: string };
    const { data: row } = await supabaseAdmin
      .from("vendors")
      .select("*")
      .eq("user_id", userId)
      .eq("environment", data.environment)
      .maybeSingle();
    return { vendor: row ?? null };
  });

/** Generate an Express dashboard login link so vendors can manage payouts. */
export const createVendorDashboardLink = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ environment: Env }).parse(input))
  .handler(async ({ data, context }) => {
    const { userId } = context as { userId: string };
    const { data: row } = await supabaseAdmin
      .from("vendors")
      .select("stripe_account_id")
      .eq("user_id", userId)
      .eq("environment", data.environment)
      .maybeSingle();
    if (!row?.stripe_account_id) throw new Error("No Stripe Connect account");

    const stripe = createStripeClient(data.environment);
    const link = await stripe.accounts.createLoginLink(row.stripe_account_id as string);
    return { url: link.url };
  });
