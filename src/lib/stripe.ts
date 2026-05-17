import { loadStripe, type Stripe } from "@stripe/stripe-js";
import type { StripeEnv } from "./stripe.server";

const clientToken = import.meta.env.VITE_PAYMENTS_CLIENT_TOKEN as string | undefined;

let stripePromise: Promise<Stripe | null> | null = null;

export function getStripe(): Promise<Stripe | null> {
  if (!stripePromise) {
    if (!clientToken) {
      throw new Error("VITE_PAYMENTS_CLIENT_TOKEN is not set");
    }
    stripePromise = loadStripe(clientToken);
  }
  return stripePromise;
}

/** Returns the active Stripe environment for client-side reads. */
export function getStripeEnvironment(): StripeEnv {
  if (clientToken?.startsWith("pk_live_")) return "live";
  if (clientToken?.startsWith("pk_test_")) return "sandbox";
  if (typeof window === "undefined") return "sandbox";
  const host = window.location.hostname;
  return host === "confettiplan.lovable.app" ? "live" : "sandbox";
}
