/**
 * Pure helpers for post-auth routing. Extracted from the /auth route so the
 * behavior can be unit-tested for the three user shapes the product cares
 * about: customers, business owners, and non-owners (signed-in users with no
 * advertiser + no business_owner role).
 */
import { supabase } from "@/integrations/supabase/client";
import { getMyAdvertiser } from "@/lib/ads";

export type AuthRedirectDecision = { to: string };

/**
 * "Generic" means the caller didn't deep-link to a specific destination. We
 * only auto-bounce business owners to their dashboard for generic redirects;
 * an explicit `?redirect=/trips/abc` is always honored.
 */
export function isGenericRedirect(redirect: string | undefined | null): boolean {
  return !redirect || redirect === "/" || redirect === "/auth";
}

/** Detect whether a uid corresponds to a business owner. */
export async function isBusinessOwner(uid: string): Promise<boolean> {
  try {
    const { data: roleRow } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", uid)
      .eq("role", "business_owner")
      .maybeSingle();
    if (roleRow) return true;
  } catch {
    // fall through to advertiser check
  }
  try {
    const advertiser = await getMyAdvertiser(uid);
    if (advertiser) return true;
  } catch {
    // ignore
  }
  return false;
}

/**
 * Decide the post-auth destination.
 * - Business owner + generic redirect → /business/dashboard
 * - Explicit redirect → that destination
 * - Otherwise → "/" (or provided generic fallback)
 */
export async function decidePostAuthDestination(
  uid: string,
  redirect: string | undefined,
): Promise<AuthRedirectDecision> {
  const generic = isGenericRedirect(redirect);
  const owner = await isBusinessOwner(uid);
  if (owner && generic) return { to: "/business/dashboard" };
  if (!generic) return { to: redirect as string };
  return { to: redirect ?? "/" };
}
