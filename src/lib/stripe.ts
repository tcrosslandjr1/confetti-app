// Lazy Stripe.js loader. The @stripe/stripe-js package is loaded only
// when getStripe() is first called — using a dynamic import so the SDK
// is split into its own chunk and never appears in the initial bundle.
// Routes/components that only need the environment string should import
// from "@/lib/stripe-env" instead (no Stripe SDK pulled in).
import type { Stripe } from "@stripe/stripe-js";

export { getStripeEnvironment } from "./stripe-env";
export type { StripeEnv } from "./stripe-env";

const clientToken = import.meta.env.VITE_PAYMENTS_CLIENT_TOKEN as string | undefined;

let stripePromise: Promise<Stripe | null> | null = null;

export function getStripe(): Promise<Stripe | null> {
  if (!stripePromise) {
    if (!clientToken) {
      throw new Error("VITE_PAYMENTS_CLIENT_TOKEN is not set");
    }
    // Dynamic import so @stripe/stripe-js is in a separate chunk fetched
    // on demand (e.g. when the embedded checkout actually mounts).
    stripePromise = import("@stripe/stripe-js").then(({ loadStripe }) => loadStripe(clientToken));
  }
  return stripePromise;
}
