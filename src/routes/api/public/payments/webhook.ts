import { createFileRoute } from '@tanstack/react-router';
import { createClient } from '@supabase/supabase-js';
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

async function handleSubscriptionCreated(subscription: any, env: StripeEnv) {
  const userId = subscription.metadata?.userId;
  if (!userId) {
    console.error('No userId in subscription metadata', subscription.id);
    return;
  }
  const accountType = subscription.metadata?.accountType || 'user';
  const item = subscription.items?.data?.[0];
  const periodStart = item?.current_period_start ?? subscription.current_period_start;
  const periodEnd = item?.current_period_end ?? subscription.current_period_end;

  await getSupabase().from('subscriptions').upsert(
    {
      user_id: userId,
      account_type: accountType,
      stripe_subscription_id: subscription.id,
      stripe_customer_id: subscription.customer,
      product_id: item?.price?.product,
      price_id: resolvePriceId(item),
      status: subscription.status,
      current_period_start: tsToIso(periodStart),
      current_period_end: tsToIso(periodEnd),
      cancel_at_period_end: subscription.cancel_at_period_end || false,
      environment: env,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'stripe_subscription_id' }
  );
}

async function handleSubscriptionUpdated(subscription: any, env: StripeEnv) {
  const item = subscription.items?.data?.[0];
  const periodStart = item?.current_period_start ?? subscription.current_period_start;
  const periodEnd = item?.current_period_end ?? subscription.current_period_end;

  await getSupabase()
    .from('subscriptions')
    .update({
      status: subscription.status,
      product_id: item?.price?.product,
      price_id: resolvePriceId(item),
      current_period_start: tsToIso(periodStart),
      current_period_end: tsToIso(periodEnd),
      cancel_at_period_end: subscription.cancel_at_period_end || false,
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_subscription_id', subscription.id)
    .eq('environment', env);
}

async function handleSubscriptionDeleted(subscription: any, env: StripeEnv) {
  await getSupabase()
    .from('subscriptions')
    .update({ status: 'canceled', updated_at: new Date().toISOString() })
    .eq('stripe_subscription_id', subscription.id)
    .eq('environment', env);
}

async function handleCheckoutCompleted(session: any, env: StripeEnv) {
  // One-time purchases only — subscriptions are handled by subscription.* events.
  if (session.mode !== 'payment') return;
  const userId = session.metadata?.userId;
  if (!userId) {
    console.error('checkout.session.completed without userId metadata', session.id);
    return;
  }

  await getSupabase().from('user_purchases').upsert(
    {
      user_id: userId,
      stripe_session_id: session.id,
      stripe_payment_intent_id: session.payment_intent ?? null,
      product_id: session.metadata?.productId || 'unknown',
      price_id: session.metadata?.priceId || null,
      amount_cents: session.amount_total ?? 0,
      currency: session.currency || 'usd',
      status: session.payment_status === 'paid' ? 'completed' : session.payment_status,
      environment: env,
      metadata: session.metadata || {},
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'stripe_session_id' }
  );
}

async function handlePaymentFailed(intent: any, env: StripeEnv) {
  if (!intent?.id) return;
  await getSupabase()
    .from('user_purchases')
    .update({ status: 'failed', updated_at: new Date().toISOString() })
    .eq('stripe_payment_intent_id', intent.id)
    .eq('environment', env);
}

// ---------- Stripe Connect (vendors) ----------

async function handleAccountUpdated(account: any, env: StripeEnv) {
  await getSupabase()
    .from('vendor_accounts')
    .update({
      charges_enabled: !!account.charges_enabled,
      payouts_enabled: !!account.payouts_enabled,
      details_submitted: !!account.details_submitted,
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_account_id', account.id)
    .eq('environment', env);
}

async function handleTransfer(transfer: any, env: StripeEnv) {
  const { data: vendor } = await getSupabase()
    .from('vendor_accounts')
    .select('id')
    .eq('stripe_account_id', transfer.destination)
    .eq('environment', env)
    .maybeSingle();
  if (!vendor) {
    console.warn('Transfer for unknown vendor account', transfer.destination);
    return;
  }
  await getSupabase().from('vendor_payouts').upsert(
    {
      vendor_account_id: vendor.id,
      stripe_transfer_id: transfer.id,
      amount_cents: transfer.amount,
      currency: transfer.currency,
      status: 'transferred',
      environment: env,
      metadata: transfer.metadata || {},
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'stripe_transfer_id' }
  );
}

async function handlePayout(payout: any, env: StripeEnv, status: 'pending' | 'paid' | 'failed') {
  // Connect payout events arrive on connected accounts — record by stripe_payout_id.
  await getSupabase().from('vendor_payouts').upsert(
    {
      // vendor_account_id may already exist on prior insert; on conflict we only update status.
      vendor_account_id: payout.__vendorAccountId || null,
      stripe_payout_id: payout.id,
      amount_cents: payout.amount,
      currency: payout.currency,
      status,
      environment: env,
      metadata: payout.metadata || {},
      updated_at: new Date().toISOString(),
    } as any,
    { onConflict: 'stripe_payout_id', ignoreDuplicates: false }
  );
}

async function recordEvent(event: { id: string; type: string }, env: StripeEnv, payload: unknown, error?: string) {
  await getSupabase().from('stripe_webhook_events').upsert(
    {
      stripe_event_id: event.id,
      event_type: event.type,
      environment: env,
      payload: payload as any,
      processed_at: new Date().toISOString(),
      error: error ?? null,
    },
    { onConflict: 'stripe_event_id' }
  );
}

async function alreadyProcessed(eventId: string): Promise<boolean> {
  const { data } = await getSupabase()
    .from('stripe_webhook_events')
    .select('stripe_event_id')
    .eq('stripe_event_id', eventId)
    .maybeSingle();
  return !!data;
}

async function handleWebhook(req: Request, env: StripeEnv) {
  const event = await verifyWebhook(req, env);
  if (await alreadyProcessed(event.id)) return;

  try {
    switch (event.type) {
      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object, env);
        break;
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object, env);
        break;
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object, env);
        break;
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object, env);
        break;
      case 'payment_intent.payment_failed':
        await handlePaymentFailed(event.data.object, env);
        break;
      case 'account.updated':
        await handleAccountUpdated(event.data.object, env);
        break;
      case 'transfer.created':
      case 'transfer.paid':
        await handleTransfer(event.data.object, env);
        break;
      case 'payout.created':
        await handlePayout(event.data.object, env, 'pending');
        break;
      case 'payout.paid':
        await handlePayout(event.data.object, env, 'paid');
        break;
      case 'payout.failed':
        await handlePayout(event.data.object, env, 'failed');
        break;
      default:
        console.log('Unhandled Stripe event:', event.type);
    }
    await recordEvent(event, env, event);
  } catch (err) {
    await recordEvent(event, env, event, err instanceof Error ? err.message : String(err));
    throw err;
  }
}

export const Route = createFileRoute('/api/public/payments/webhook')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const rawEnv = new URL(request.url).searchParams.get('env');
        if (rawEnv !== 'sandbox' && rawEnv !== 'live') {
          console.error('Webhook with invalid env query parameter:', rawEnv);
          return Response.json({ received: true, ignored: 'invalid env' });
        }
        try {
          await handleWebhook(request, rawEnv);
          return Response.json({ received: true });
        } catch (e) {
          console.error('Webhook error:', e);
          return new Response('Webhook error', { status: 400 });
        }
      },
    },
  },
});
