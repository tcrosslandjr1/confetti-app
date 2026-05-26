// Standalone helper for reading the active Stripe environment WITHOUT
// pulling in @stripe/stripe-js. Import from here in any component that
// only needs to know whether we're in sandbox or live mode — this keeps
// the Stripe SDK out of route chunks that don't actually mount checkout.
import type { StripeEnv } from "./stripe.server";

const clientToken = import.meta.env.VITE_PAYMENTS_CLIENT_TOKEN as string | undefined;

export function getStripeEnvironment(): StripeEnv {
  if (clientToken?.startsWith("pk_live_")) return "live";
  if (clientToken?.startsWith("pk_test_")) return "sandbox";
  if (typeof window === "undefined") return "sandbox";
  const host = window.location.hostname;
  return host === "confettiplan.com" || host === "www.confettiplan.com" ? "live" : "sandbox";
}

export type { StripeEnv };
