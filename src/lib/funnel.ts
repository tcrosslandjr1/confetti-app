// Core-funnel events: signup → first plan → pass viewed → upgrade → paid.
// Sent to Vercel Web Analytics (visible once Analytics is enabled on the
// Vercel project). Never throws — analytics must not break the product.
import { track } from "@vercel/analytics";

export type FunnelEvent =
  | "signup_requested"
  | "signup_completed"
  | "plan_generated"
  | "pass_viewed"
  | "upgrade_started"
  | "checkout_completed";

export function trackFunnel(event: FunnelEvent, props?: Record<string, string | number>) {
  try {
    track(event, props);
  } catch {
    // ignore — never let analytics break the app
  }
}
