import { createFileRoute } from '@tanstack/react-router';
import { createClient } from '@supabase/supabase-js';
import QRCode from 'qrcode';
import { type StripeEnv, verifyWebhook } from '@/lib/stripe.server';

let _supabase: any = null;
function getSupabase(): any {
  if (!_supabase) {
    _supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
  }
  return _supabase;
}

function resolvePriceId(item: any): string {
  return item?.price?.lookup_key
    || item?.price?.metadata?.lovable_external_id
    || item?.price?.id;
}

function tsToIso(s?: number | null): string | null {
  return s ? new Date(s * 1000).toISOString() : null;
}

// ---------- tier + rewards lookup ----------
const PRICE_TO_TIER: Record<string, string> = {
  plus_monthly: 'plus',
  crew_monthly: 'crew',
  business_featured_monthly: 'featured',
  business_boosted_monthly: 'boosted',
  business_premium_monthly: 'premium',
  ad_featured_month: 'ad_featured',
  ad_boosted_month: 'ad_boosted',
  ad_premium_month: 'ad_premium',
};
const REWARD_PTS: Record<string, number> = {
  // Subscriptions: bonus on first activation
  plus_monthly: 100,
  crew_monthly: 100,
  business_featured_monthly: 250,
  business_boosted_monthly: 500,
  business_premium_monthly: 1000,
  // One-time unlocks
  unlock_premium_plan_once: 25,
  unlock_vip_30d_once: 250,
  user_plan_single_once: 10,
};

// Promo SKU → { tier, duration, targetType (default if not in metadata) }
const PROMO_SPEC: Record<string, { tier: string; duration: string; defaultTarget?: 'venue' | 'event' | 'reel' }> = {
  // Venue boosts — one-time + recurring auto-renew
  boost_24h_once:     { tier: 'standard', duration: '24 hours', defaultTarget: 'venue' },
  boost_24h_monthly:  { tier: 'standard', duration: '30 days',  defaultTarget: 'venue' },
  boost_3d_once:      { tier: 'advanced', duration: '3 days',   defaultTarget: 'venue' },
  boost_3d_monthly:   { tier: 'advanced', duration: '30 days',  defaultTarget: 'venue' },
  boost_7d_once:      { tier: 'premium',  duration: '7 days',   defaultTarget: 'venue' },
  boost_7d_monthly:   { tier: 'premium',  duration: '30 days',  defaultTarget: 'venue' },
  // Event promos
  event_single_once:   { tier: 'standard', duration: '7 days',  defaultTarget: 'event' },
  event_weekend_once:  { tier: 'advanced', duration: '3 days',  defaultTarget: 'event' },
  event_monthly_once:  { tier: 'premium',  duration: '30 days', defaultTarget: 'event' },
  // Reel promos
  reel_boost_once:          { tier: 'standard', duration: '24 hours', defaultTarget: 'reel' },
  reel_trending_pack_once:  { tier: 'advanced', duration: '3 days',   defaultTarget: 'reel' },
  reel_viral_push_once:     { tier: 'premium',  duration: '7 days',   defaultTarget: 'reel' },
};

async function awardPts(userId: string, priceId: string | null, ref: string) {
  if (!userId || !priceId) return;
  const pts = REWARD_PTS[priceId];
  if (!pts) return;
  await getSupabase().rpc('award_confetti_pts', {
    _user: userId, _amount: pts, _reason: `purchase:${priceId}`, _ref: ref,
  });
}

async function notifyUser(userId: string, title: string, body: string, link?: string) {
  await getSupabase().from('notifications').insert({
    user_id: userId, kind: 'purchase', title, body, link: link ?? null,
  });
}

async function sendReceipt(toEmail: string, subject: string, html: string) {
  const resendKey = process.env.RESEND_API_KEY;
  const lovableKey = process.env.LOVABLE_API_KEY;
  if (!resendKey || !lovableKey) return; // Stripe sends its own receipt; ours is bonus
  try {
    await fetch('https://connector-gateway.lovable.dev/resend/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${lovableKey}`,
        'X-Connection-Api-Key': resendKey,
      },
      body: JSON.stringify({
        from: 'Confetti <hello@confettiplan.lovable.app>',
        to: [toEmail], subject, html,
      }),
    });
  } catch (e) {
    console.error('Receipt email failed', e);
  }
}

// ============================================================================
// Promo activation — boosts, event promos, reel promos
// ============================================================================
async function activatePromo(args: {
  userId: string;
  priceId: string;
  amountCents: number;
  currency: string;
  mode: 'one_time' | 'recurring';
  env: StripeEnv;
  targetType?: string;
  targetId?: string;
  stripeSessionId?: string;
  stripeSubscriptionId?: string;
  stripeCustomerId?: string;
  metadata?: Record<string, unknown>;
}): Promise<boolean> {
  const spec = PROMO_SPEC[args.priceId];
  if (!spec) return false;

  const targetType = (args.targetType as 'venue' | 'event' | 'reel' | undefined) ?? spec.defaultTarget;
  const sb = getSupabase();

  const ledger: any = {
    user_id: args.userId,
    sku: args.priceId,
    mode: args.mode,
    amount_cents: args.amountCents,
    currency: args.currency,
    target_type: targetType ?? null,
    target_id: args.targetId ?? null,
    status: 'active',
    stripe_session_id: args.stripeSessionId ?? null,
    stripe_subscription_id: args.stripeSubscriptionId ?? null,
    stripe_customer_id: args.stripeCustomerId ?? null,
    environment: args.env,
    metadata: args.metadata ?? {},
    activated_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  if (args.stripeSessionId) {
    await sb.from('business_purchases').upsert(ledger, { onConflict: 'stripe_session_id' });
  } else {
    await sb.from('business_purchases').insert(ledger);
  }

  if (targetType && args.targetId) {
    await sb.rpc('activate_boost', {
      _target_type: targetType,
      _target_id: args.targetId,
      _duration: spec.duration,
      _tier: spec.tier,
      _sku: args.priceId,
    });
  }

  await notifyUser(
    args.userId,
    `Promo active 🚀`,
    targetType
      ? `Your ${args.priceId.replace(/_/g, ' ')} is live${args.targetId ? ` for the selected ${targetType}` : ''}.`
      : `Your ${args.priceId.replace(/_/g, ' ')} purchase is active.`,
    '/business/exposure',
  );
  return true;
}

// ============================================================================
// Subscription side-effects
// ============================================================================
async function handleSubscriptionCreated(subscription: any, env: StripeEnv) {
  const userId = subscription.metadata?.userId;
  if (!userId) { console.error('No userId in subscription metadata', subscription.id); return; }
  const accountType = subscription.metadata?.accountType || 'user';
  const item = subscription.items?.data?.[0];
  const priceId = resolvePriceId(item);
  const periodStart = item?.current_period_start ?? subscription.current_period_start;
  const periodEnd = item?.current_period_end ?? subscription.current_period_end;
  const tier = PRICE_TO_TIER[priceId] ?? null;

  await getSupabase().from('subscriptions').upsert(
    {
      user_id: userId,
      account_type: accountType,
      stripe_subscription_id: subscription.id,
      stripe_customer_id: subscription.customer,
      product_id: item?.price?.product,
      price_id: priceId,
      tier,
      status: subscription.status,
      current_period_start: tsToIso(periodStart),
      current_period_end: tsToIso(periodEnd),
      cancel_at_period_end: subscription.cancel_at_period_end || false,
      environment: env,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'stripe_subscription_id' }
  );

  if (subscription.status === 'active' || subscription.status === 'trialing') {
    await awardPts(userId, priceId, subscription.id);
    // Recurring promo (boost_*_monthly) — activate target boost too
    if (PROMO_SPEC[priceId]) {
      await activatePromo({
        userId,
        priceId,
        amountCents: item?.price?.unit_amount ?? 0,
        currency: item?.price?.currency ?? 'usd',
        mode: 'recurring',
        env,
        targetType: subscription.metadata?.targetType,
        targetId: subscription.metadata?.targetId,
        stripeSubscriptionId: subscription.id,
        stripeCustomerId: typeof subscription.customer === 'string' ? subscription.customer : subscription.customer?.id,
        metadata: subscription.metadata || {},
      });
    } else {
      await notifyUser(
        userId,
        `Welcome to Confetti ${tier ?? 'Plus'} 🎉`,
        `Your subscription is active. Enjoy your perks.`,
        accountType === 'business' ? '/business/portal' : '/passport',
      );
    }
  }
}

async function handleSubscriptionUpdated(subscription: any, env: StripeEnv) {
  const item = subscription.items?.data?.[0];
  const priceId = resolvePriceId(item);
  const periodStart = item?.current_period_start ?? subscription.current_period_start;
  const periodEnd = item?.current_period_end ?? subscription.current_period_end;
  const tier = PRICE_TO_TIER[priceId] ?? null;

  // If pendingPriceId from metadata matches current priceId, the downgrade landed.
  const pending = subscription.metadata?.pendingPriceId;
  const update: any = {
    status: subscription.status,
    product_id: item?.price?.product,
    price_id: priceId,
    tier,
    current_period_start: tsToIso(periodStart),
    current_period_end: tsToIso(periodEnd),
    cancel_at_period_end: subscription.cancel_at_period_end || false,
    updated_at: new Date().toISOString(),
  };
  if (pending && pending === priceId) update.pending_price_id = null;

  await getSupabase().from('subscriptions').update(update)
    .eq('stripe_subscription_id', subscription.id).eq('environment', env);

  // Recurring boost — extend target boost on each renewal (when status stays active)
  const userId = subscription.metadata?.userId;
  if (userId && PROMO_SPEC[priceId] && (subscription.status === 'active' || subscription.status === 'trialing')) {
    const targetType = subscription.metadata?.targetType;
    const targetId = subscription.metadata?.targetId;
    if (targetType && targetId) {
      await getSupabase().rpc('activate_boost', {
        _target_type: targetType,
        _target_id: targetId,
        _duration: PROMO_SPEC[priceId].duration,
        _tier: PROMO_SPEC[priceId].tier,
        _sku: priceId,
      });
    }
  }
}

async function handleSubscriptionDeleted(subscription: any, env: StripeEnv) {
  // Immediate revoke — flip status, expire access now, clear tier.
  await getSupabase().from('subscriptions').update({
    status: 'canceled',
    tier: null,
    current_period_end: new Date().toISOString(),
    cancel_at_period_end: false,
    updated_at: new Date().toISOString(),
  }).eq('stripe_subscription_id', subscription.id).eq('environment', env);

  const userId = subscription.metadata?.userId;
  if (userId) {
    await notifyUser(
      userId,
      'Subscription canceled',
      'Your Confetti subscription has ended. You can re-subscribe anytime from /pricing.',
      '/pricing',
    );
  }
}

// ============================================================================
// One-time purchases (unlocks + tickets)
// ============================================================================
async function unlockVip(userId: string, days: number) {
  const sb = getSupabase();
  const { data: profile } = await sb.from('profiles').select('vip_until').eq('id', userId).maybeSingle();
  const now = Date.now();
  const base = profile?.vip_until ? Math.max(new Date(profile.vip_until).getTime(), now) : now;
  const newUntil = new Date(base + days * 86400_000).toISOString();
  await sb.from('profiles').update({ vip_until: newUntil, updated_at: new Date().toISOString() }).eq('id', userId);
  return newUntil;
}

async function issueTicket(session: any, env: StripeEnv) {
  const userId = session.metadata!.userId;
  const eventId = session.metadata!.eventId;
  const quantity = parseInt(session.metadata!.quantity || '1', 10);
  const qrToken = `CFT-${session.id.slice(-12).toUpperCase()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

  await getSupabase().from('event_tickets').upsert({
    event_id: eventId,
    user_id: userId,
    stripe_session_id: session.id,
    stripe_payment_intent_id: session.payment_intent ?? null,
    quantity,
    amount_cents: session.amount_total ?? 0,
    currency: session.currency || 'usd',
    status: session.payment_status === 'paid' ? 'paid' : session.payment_status,
    environment: env,
    confetti_awarded: 50 * quantity,
    qr_token: qrToken,
    metadata: { eventTitle: session.metadata?.eventTitle },
    updated_at: new Date().toISOString(),
  }, { onConflict: 'stripe_session_id' });

  await getSupabase().rpc('award_confetti_pts', {
    _user: userId, _amount: 50 * quantity, _reason: 'ticket_purchase', _ref: session.id,
  });
  await notifyUser(
    userId,
    `🎟 Ticket confirmed — ${session.metadata?.eventTitle ?? 'event'}`,
    `Your QR code is ready in your Passport.`,
    '/passport',
  );

  if (session.customer_details?.email) {
    const qrPng = await QRCode.toDataURL(qrToken, { width: 240 });
    await sendReceipt(
      session.customer_details.email,
      `🎟 Your Confetti ticket — ${session.metadata?.eventTitle ?? ''}`,
      `<div style="font-family:system-ui;color:#222;max-width:520px;margin:auto">
         <h1 style="color:#ff6b35">You're on the list 🎉</h1>
         <p>Show this QR at the door for <strong>${session.metadata?.eventTitle ?? 'your event'}</strong>.</p>
         <p>Quantity: ${quantity}</p>
         <img src="${qrPng}" alt="QR" style="margin:16px 0" />
         <p style="font-family:monospace;background:#f7f5f1;padding:8px;border-radius:6px">${qrToken}</p>
         <p style="color:#888;font-size:12px">Show this email or open Passport in the Confetti app.</p>
       </div>`,
    );
  }
}

async function handleCheckoutCompleted(session: any, env: StripeEnv) {
  if (session.mode !== 'payment') return;
  const userId = session.metadata?.userId;
  if (!userId) { console.error('checkout.session.completed without userId metadata', session.id); return; }

  // Tickets follow a dedicated row in event_tickets.
  if (session.metadata?.kind === 'ticket') {
    await issueTicket(session, env);
    return;
  }

  const priceId = session.metadata?.priceId || null;

  // Promo SKUs (boost/event/reel) bypass user_purchases — they live in business_purchases.
  if (priceId && PROMO_SPEC[priceId]) {
    await activatePromo({
      userId,
      priceId,
      amountCents: session.amount_total ?? 0,
      currency: session.currency || 'usd',
      mode: 'one_time',
      env,
      targetType: session.metadata?.targetType,
      targetId: session.metadata?.targetId,
      stripeSessionId: session.id,
      stripeCustomerId: typeof session.customer === 'string' ? session.customer : session.customer?.id,
      metadata: session.metadata || {},
    });
    return;
  }

  await getSupabase().from('user_purchases').upsert(
    {
      user_id: userId,
      stripe_session_id: session.id,
      stripe_payment_intent_id: session.payment_intent ?? null,
      product_id: session.metadata?.productId || 'unknown',
      price_id: priceId,
      amount_cents: session.amount_total ?? 0,
      currency: session.currency || 'usd',
      status: session.payment_status === 'paid' ? 'completed' : session.payment_status,
      environment: env,
      metadata: session.metadata || {},
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'stripe_session_id' }
  );

  // Apply unlock side-effect
  if (priceId === 'unlock_vip_30d_once') {
    const vipUntil = await unlockVip(userId, 30);
    await notifyUser(userId, 'VIP Access unlocked 👑', `Your VIP perks are active until ${new Date(vipUntil).toLocaleDateString()}.`, '/passport');
  } else if (priceId === 'unlock_premium_plan_once') {
    await notifyUser(userId, 'Premium Plan unlocked ✨', `Open the planner and tap "Premium plan" to use it.`, '/plan');
  }

  await awardPts(userId, priceId, session.id);

  if (session.customer_details?.email) {
    await sendReceipt(
      session.customer_details.email,
      `Your Confetti receipt`,
      `<div style="font-family:system-ui;color:#222;max-width:520px;margin:auto">
         <h1 style="color:#ff6b35">Thanks for the purchase 🎉</h1>
         <p>${session.metadata?.productId ?? 'Your unlock'} is active on your account.</p>
         <p>Amount: $${((session.amount_total ?? 0) / 100).toFixed(2)} ${(session.currency || 'usd').toUpperCase()}</p>
       </div>`,
    );
  }
}

async function handlePaymentFailed(intent: any, env: StripeEnv) {
  if (!intent?.id) return;
  await getSupabase().from('user_purchases').update({
    status: 'failed', updated_at: new Date().toISOString(),
  }).eq('stripe_payment_intent_id', intent.id).eq('environment', env);
}

// ---------- Stripe Connect (vendors) — unchanged ----------
async function handleAccountUpdated(account: any, env: StripeEnv) {
  await getSupabase().from('vendors').update({
    charges_enabled: !!account.charges_enabled,
    payouts_enabled: !!account.payouts_enabled,
    details_submitted: !!account.details_submitted,
    updated_at: new Date().toISOString(),
  }).eq('stripe_account_id', account.id).eq('environment', env);
}

async function handleTransfer(transfer: any, env: StripeEnv) {
  const { data: vendor } = await getSupabase().from('vendors').select('id')
    .eq('stripe_account_id', transfer.destination).eq('environment', env).maybeSingle();
  if (!vendor) { console.warn('Transfer for unknown vendor account', transfer.destination); return; }
  await getSupabase().from('vendor_payouts').upsert({
    vendor_account_id: vendor.id, stripe_transfer_id: transfer.id,
    amount_cents: transfer.amount, currency: transfer.currency,
    status: 'transferred', environment: env, metadata: transfer.metadata || {},
    updated_at: new Date().toISOString(),
  }, { onConflict: 'stripe_transfer_id' });
}

async function handlePayout(payout: any, env: StripeEnv, status: 'pending' | 'paid' | 'failed') {
  await getSupabase().from('vendor_payouts').upsert({
    vendor_account_id: payout.__vendorAccountId || null,
    stripe_payout_id: payout.id, amount_cents: payout.amount, currency: payout.currency,
    status, environment: env, metadata: payout.metadata || {},
    updated_at: new Date().toISOString(),
  } as any, { onConflict: 'stripe_payout_id', ignoreDuplicates: false });
}

// ============================================================================
// Idempotency + structured logging
// ============================================================================
type ClaimResult = 'new' | 'already_processed' | 'retry';

/**
 * Atomically claim a Stripe event for processing. Inserting first (with a
 * UNIQUE constraint on stripe_event_id) closes the race where two concurrent
 * deliveries from Stripe would both pass a naive "already processed?" check.
 *
 * - 'new'               → first delivery, proceed to handler
 * - 'already_processed' → previous delivery succeeded, ack with 200 and stop
 * - 'retry'             → previous delivery failed, increment attempts + retry
 */
async function claimEvent(event: { id: string; type: string }, env: StripeEnv, payload: unknown): Promise<ClaimResult> {
  const sb = getSupabase();
  const { error: insertErr } = await sb.from('stripe_webhook_events').insert({
    stripe_event_id: event.id,
    event_type: event.type,
    environment: env,
    payload: payload as any,
    status: 'processing',
    attempts: 1,
  });
  if (!insertErr) return 'new';

  // 23505 = unique_violation → row already exists
  if ((insertErr as any).code !== '23505') {
    console.error('[webhook] claim insert failed', { eventId: event.id, type: event.type, env, error: insertErr.message });
    throw insertErr;
  }

  const { data: existing } = await sb.from('stripe_webhook_events')
    .select('status, attempts').eq('stripe_event_id', event.id).maybeSingle();
  if (existing?.status === 'processed') return 'already_processed';

  await sb.from('stripe_webhook_events').update({
    status: 'processing',
    attempts: (existing?.attempts ?? 0) + 1,
  }).eq('stripe_event_id', event.id);
  return 'retry';
}

async function markProcessed(eventId: string) {
  await getSupabase().from('stripe_webhook_events').update({
    status: 'processed', processed_at: new Date().toISOString(), error: null,
  }).eq('stripe_event_id', eventId);
}

async function markFailed(eventId: string, error: string) {
  await getSupabase().from('stripe_webhook_events').update({
    status: 'failed', error, last_error_at: new Date().toISOString(),
  }).eq('stripe_event_id', eventId);
}

async function dispatch(event: { id: string; type: string; data: { object: any } }, env: StripeEnv) {
  switch (event.type) {
    case 'customer.subscription.created':
      return handleSubscriptionCreated(event.data.object, env);
    case 'customer.subscription.updated':
      return handleSubscriptionUpdated(event.data.object, env);
    case 'customer.subscription.deleted':
      return handleSubscriptionDeleted(event.data.object, env);
    case 'checkout.session.completed':
      return handleCheckoutCompleted(event.data.object, env);
    case 'payment_intent.payment_failed':
      return handlePaymentFailed(event.data.object, env);
    case 'account.updated':
      return handleAccountUpdated(event.data.object, env);
    case 'transfer.created':
    case 'transfer.paid':
      return handleTransfer(event.data.object, env);
    case 'payout.created':
      return handlePayout(event.data.object, env, 'pending');
    case 'payout.paid':
      return handlePayout(event.data.object, env, 'paid');
    case 'payout.failed':
      return handlePayout(event.data.object, env, 'failed');
    default:
      console.log('[webhook] unhandled', { eventId: event.id, type: event.type, env });
  }
}

export const Route = createFileRoute('/api/public/payments/webhook')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const rawEnv = new URL(request.url).searchParams.get('env');
        if (rawEnv !== 'sandbox' && rawEnv !== 'live') {
          console.error('[webhook] invalid env query parameter:', rawEnv);
          // 200 — don't have Stripe retry a config error.
          return Response.json({ received: true, ignored: 'invalid env' });
        }
        const env: StripeEnv = rawEnv;

        // 1. Verify signature. A failure here means either a bad secret or a
        //    forged request — reject with 400 so Stripe surfaces the failure.
        let event: { id: string; type: string; data: { object: any } };
        try {
          event = await verifyWebhook(request, env) as any;
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e);
          console.error('[webhook] signature verification failed', { env, error: msg });
          return new Response(`Invalid signature: ${msg}`, { status: 400 });
        }

        const logCtx = { eventId: event.id, type: event.type, env };

        // 2. Atomically claim the event for processing (idempotency).
        let claim: ClaimResult;
        try {
          claim = await claimEvent(event, env, event);
        } catch (e) {
          console.error('[webhook] claim failed, will let Stripe retry', { ...logCtx, error: e instanceof Error ? e.message : String(e) });
          return new Response('Claim failed', { status: 500 });
        }
        if (claim === 'already_processed') {
          console.log('[webhook] duplicate, skipping', logCtx);
          return Response.json({ received: true, duplicate: true });
        }
        if (claim === 'retry') {
          console.warn('[webhook] retrying previously failed event', logCtx);
        }

        // 3. Run the handler.
        const startedAt = Date.now();
        try {
          await dispatch(event, env);
          await markProcessed(event.id);
          console.log('[webhook] processed', { ...logCtx, ms: Date.now() - startedAt });
          return Response.json({ received: true });
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          const stack = err instanceof Error ? err.stack : undefined;
          console.error('[webhook] handler failed', { ...logCtx, ms: Date.now() - startedAt, error: msg, stack });
          try { await markFailed(event.id, msg); } catch (e2) {
            console.error('[webhook] markFailed failed', { ...logCtx, error: e2 instanceof Error ? e2.message : String(e2) });
          }
          // 500 — Stripe will retry with backoff (up to ~3 days).
          return new Response(`Handler error: ${msg}`, { status: 500 });
        }
      },
    },
  },
});
