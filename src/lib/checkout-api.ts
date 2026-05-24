/**
 * checkout-api.ts
 * Client-side module for Stripe billing operations.
 * Calls the billing-service edge function (which holds the Stripe secret key).
 */
import { supabase } from "@/integrations/supabase/client";

/* ── Price constants ─────────────────────────────────────── */

export const BUSINESS_PRICES = [
  "business_featured_monthly",
  "business_boosted_monthly",
  "business_premium_monthly",
] as const;

export type BusinessPriceId = (typeof BUSINESS_PRICES)[number];

/* ── Helpers ─────────────────────────────────────────────── */

async function callBilling<T = Record<string, unknown>>(
  action: string,
  payload: Record<string, unknown> = {},
): Promise<T> {
  const { data, error } = await supabase.functions.invoke("billing-service", {
    body: { action, ...payload },
  });
  if (error) throw new Error(error.message ?? "Billing request failed");
  if (data?.error) throw new Error(data.error);
  return data as T;
}

/* ── Public API ──────────────────────────────────────────── */

/**
 * Open Stripe's customer billing portal (manage payment methods, invoices, etc.)
 * Returns the portal URL to redirect the user to.
 */
export async function createBillingPortalSession({
  environment,
  returnUrl,
}: {
  environment: string;
  returnUrl?: string;
}): Promise<string> {
  const res = await callBilling<{ url: string }>("create-portal-session", {
    environment,
    return_url: returnUrl,
  });
  return res.url;
}

/**
 * Change the current subscription to a different price tier.
 * Upgrades are invoiced immediately; downgrades take effect at period end.
 */
export async function changeSubscriptionPlan({
  environment,
  newPriceId,
}: {
  environment: string;
  newPriceId: string;
}): Promise<{ ok: boolean; mode: string }> {
  return callBilling<{ ok: boolean; mode: string }>("change-plan", {
    environment,
    new_price_id: newPriceId,
  });
}

/**
 * Cancel the current subscription immediately.
 */
export async function cancelCurrentSubscription({
  environment,
}: {
  environment: string;
}): Promise<{ ok: boolean }> {
  return callBilling<{ ok: boolean }>("cancel-subscription", {
    environment,
  });
}
