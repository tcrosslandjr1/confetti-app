import type { StripeEnv } from './stripe.server';

/** Returns the active Stripe environment for client-side reads. */
export function getStripeEnvironment(): StripeEnv {
  if (typeof window === 'undefined') return 'sandbox';
  const host = window.location.hostname;
  // Treat the published custom/Lovable domain as live; everything else (preview, localhost) as sandbox.
  const isLive = host === 'confettiplan.lovable.app';
  return isLive ? 'live' : 'sandbox';
}
