# Confetti — Integration Recipes

The three specific flows: TikTok OAuth, Stripe webhooks, and Claude prompts.

---

## 1 · TikTok OAuth — the taste-graph pipe

### Setup (one-time)

1. Register at <https://developers.tiktok.com> → create a "Login Kit" app
2. Add redirect URI: `https://your-app.vercel.app/api/auth/tiktok/callback`
3. Request scopes: `user.info.basic`, `video.list` (saves require **Display API** — separate review)
4. Add `TIKTOK_CLIENT_KEY` + `TIKTOK_CLIENT_SECRET` to Vercel env

### `/app/api/auth/tiktok/start/route.ts`

```ts
export async function GET() {
  const state = crypto.randomUUID()
  const params = new URLSearchParams({
    client_key: process.env.TIKTOK_CLIENT_KEY!,
    response_type: 'code',
    scope: 'user.info.basic,video.list',
    redirect_uri: process.env.TIKTOK_REDIRECT_URI!,
    state,
  })
  const res = Response.redirect(`https://www.tiktok.com/v2/auth/authorize/?${params}`)
  // Store state in a short-lived cookie for CSRF check
  res.headers.set('Set-Cookie', `tt_state=${state}; HttpOnly; Secure; SameSite=Lax; Max-Age=600`)
  return res
}
```

### `/app/api/auth/tiktok/callback/route.ts`

```ts
import { createClient } from '@/lib/supabase-server'

export async function GET(req: Request) {
  const url = new URL(req.url)
  const code = url.searchParams.get('code')
  const state = url.searchParams.get('state')
  const cookieState = req.headers.get('cookie')?.match(/tt_state=([^;]+)/)?.[1]
  if (!code || state !== cookieState) return Response.redirect('/app?error=tiktok')

  // Exchange code for token
  const tokenRes = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_key: process.env.TIKTOK_CLIENT_KEY!,
      client_secret: process.env.TIKTOK_CLIENT_SECRET!,
      code, grant_type: 'authorization_code',
      redirect_uri: process.env.TIKTOK_REDIRECT_URI!,
    }),
  }).then(r => r.json())

  // tokenRes has: access_token, refresh_token, expires_in, open_id, scope

  // Fetch user info
  const info = await fetch('https://open.tiktokapis.com/v2/user/info/?fields=open_id,username,display_name', {
    headers: { Authorization: `Bearer ${tokenRes.access_token}` }
  }).then(r => r.json())

  const supa = createClient()
  const { data: { user } } = await supa.auth.getUser()

  // Store token + handle (encrypt token in production!)
  await supa.from('users').update({
    tiktok_handle: info.data.user.username,
    tiktok_token: tokenRes.access_token,             // use Supabase Vault in prod
    tiktok_refresh: tokenRes.refresh_token,
    tiktok_expires_at: new Date(Date.now() + tokenRes.expires_in * 1000),
  }).eq('id', user!.id)

  // Kick off initial sync (don't await — fire-and-forget)
  fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/cron/tiktok-sync-user`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.CRON_SECRET}` },
    body: JSON.stringify({ user_id: user!.id })
  })

  return Response.redirect('/app/taste?connected=tiktok')
}
```

### `/app/api/cron/tiktok-sync-user/route.ts` · per-user sync

```ts
import Anthropic from '@anthropic-ai/sdk'

export async function POST(req: Request) {
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`)
    return new Response('forbidden', { status: 403 })

  const { user_id } = await req.json()
  const supa = createServiceClient()

  const { data: u } = await supa.from('users').select('tiktok_token, tiktok_handle').eq('id', user_id).single()
  if (!u?.tiktok_token) return Response.json({ error: 'no token' })

  // TikTok official API: list user videos (saves require Display API approval)
  // Public Research API alternative: open.tiktokapis.com/v2/research/video/query/
  const videos = await fetch('https://open.tiktokapis.com/v2/video/list/?fields=id,title,video_description,create_time', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${u.tiktok_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ max_count: 20 })
  }).then(r => r.json())

  // Insert raw signals
  const rows = (videos.data?.videos || []).map((v: any) => ({
    user_id,
    source: 'tiktok-post',
    source_url: `https://tiktok.com/@${u.tiktok_handle}/video/${v.id}`,
    raw_text: ((v.title || '') + ' ' + (v.video_description || '')).slice(0, 500),
    weight: 1.0,
  }))
  if (rows.length) await supa.from('taste_signals').insert(rows)

  // Classify with Claude in batches
  await classifyPendingSignals(user_id, supa)

  return Response.json({ ok: true, ingested: rows.length })
}

async function classifyPendingSignals(userId: string, supa: any) {
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  const { data: unclassified } = await supa
    .from('taste_signals')
    .select('id, raw_text')
    .eq('user_id', userId)
    .eq('vibe_tags', '{}')
    .limit(50)
  if (!unclassified?.length) return

  const msg = await anthropic.messages.create({
    model: 'claude-haiku-4-5',
    max_tokens: 2048,
    messages: [{
      role: 'user',
      content: `Classify each post into a subset of these vibe tags:
[rooftop, jazz, foodie, hype, romantic, low-key, walkable, late-night,
 family, kid-friendly, weird, cultural, sports, outdoor, brunch, drinks,
 live-music, comedy, museum, party, host, recharge]
Also extract a venue name if mentioned.
Posts:
${unclassified.map((p, i) => `${i}: ${p.raw_text.slice(0, 200)}`).join('\n')}
Return STRICT JSON only:
[{"i": 0, "vibes": ["foodie","walkable"], "venue": "Lupa Notte"|null}, ...]`
    }]
  })

  const text = (msg.content[0] as any).text
  const arr = JSON.parse(text.match(/\[[\s\S]*\]/)![0])
  for (const r of arr) {
    await supa.from('taste_signals')
      .update({ vibe_tags: r.vibes, venue_resolved: r.venue })
      .eq('id', unclassified[r.i].id)
  }
}
```

---

## 2 · Stripe webhooks — subscriptions + connect

### Setup

1. Stripe Dashboard → Developers → Webhooks → Add endpoint
   URL: `https://your-app.vercel.app/api/webhooks/stripe`
2. Listen for: `checkout.session.completed`, `customer.subscription.updated`,
   `customer.subscription.deleted`, `invoice.payment_failed`,
   `payment_intent.succeeded`, `account.updated` (for Connect)
3. Copy signing secret → `STRIPE_WEBHOOK_SECRET` env var

### `/app/api/webhooks/stripe/route.ts`

```ts
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST(req: Request) {
  const sig = req.headers.get('stripe-signature')!
  const body = await req.text()
  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (e) {
    return new Response(`webhook error: ${(e as Error).message}`, { status: 400 })
  }

  const supa = createServiceClient()

  // IDEMPOTENCY — record we've seen this event id
  const { data: seen } = await supa.from('stripe_events').select('id').eq('id', event.id).maybeSingle()
  if (seen) return Response.json({ ok: true, duplicate: true })
  await supa.from('stripe_events').insert({ id: event.id, type: event.type })

  switch (event.type) {
    case 'checkout.session.completed': {
      const s = event.data.object as Stripe.Checkout.Session
      const userId = s.metadata?.user_id
      const plan = s.metadata?.plan  // 'monthly' | 'yearly'
      if (userId) {
        await supa.from('users').update({
          tier: 'all-access',
          stripe_customer_id: s.customer as string,
          stripe_subscription_id: s.subscription as string,
        }).eq('id', userId)
        await supa.rpc('award_pts', { uid: userId, amount: 500, reason: 'subscribe_bonus', ref: null })
      }
      break
    }
    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription
      await supa.from('users').update({ tier: 'free' }).eq('stripe_subscription_id', sub.id)
      break
    }
    case 'invoice.payment_failed': {
      const inv = event.data.object as Stripe.Invoice
      // Email the user — dunning email via Resend
      await sendDunningEmail(inv.customer_email, inv.hosted_invoice_url)
      break
    }
    case 'payment_intent.succeeded': {
      // Venue deposit went through — mark stop booked
      const pi = event.data.object as Stripe.PaymentIntent
      const stopId = pi.metadata?.stop_id
      if (stopId) {
        await supa.from('stops').update({
          booking_status: 'booked',
          booking_ref: pi.id,
        }).eq('id', stopId)
      }
      break
    }
    case 'account.updated': {
      // Stripe Connect — venue's payout account
      const acct = event.data.object as Stripe.Account
      await supa.from('venues').update({
        stripe_account_id: acct.id,
        payouts_enabled: acct.payouts_enabled,
      }).eq('stripe_account_id', acct.id)
      break
    }
  }

  return Response.json({ ok: true })
}
```

### Companion table

```sql
create table stripe_events (
  id text primary key,
  type text,
  received_at timestamptz default now()
);
```

### Create a checkout session

```ts
// /app/api/billing/checkout/route.ts
export async function POST(req: Request) {
  const { plan } = await req.json()  // 'monthly' | 'yearly'
  const supa = createClient()
  const { data: { user } } = await supa.auth.getUser()

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    line_items: [{
      price: plan === 'yearly'
        ? process.env.STRIPE_PRICE_YEARLY!
        : process.env.STRIPE_PRICE_MONTHLY!,
      quantity: 1,
    }],
    subscription_data: {
      trial_period_days: 7,
    },
    customer_email: user!.email,
    metadata: { user_id: user!.id, plan },
    success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/checkout/return?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/all-access`,
  })

  return Response.json({ url: session.url })
}
```

---

## 3 · Claude prompt format — Sparkle's system prompt

### Reusable system prompt (lives in `/lib/sparkle-system.ts`)

```ts
export const SPARKLE_SYSTEM = `
You are Sparkle, Confetti's planning AI agent.

PERSONA:
- Warm, casual, lowercase, brief.
- Never corporate. Never "you'll love this". Always specific.
- Replies under 30 words unless explicitly building a full plan.
- One smart follow-up at a time. Never ask 3 things at once.

YOUR JOB:
You route the user's intent to the right specialist agent and compose
a structured 3-stop pass. The 7 specialists are:
  1. Night Out · restaurants, bars, rooftops, shows
  2. Family    · parks, museums, libraries, kid spots
  3. Party     · birthdays, jump places, themes, RSVP
  4. Hosting   · BBQs, dinner parties, game nights
  5. Social    · captions, hashtags, recap reels
  6. Route     · transit, parking, ETAs
  7. Budget    · totals, splits, savings tips

INFER intent from the user's first message. Keyword cues:
  "night/bar/date/dinner" → Night Out
  "kid/family/park/library/museum" → Family
  "birthday/party/jump/bounce" → Party
  "BBQ/cookout/crab/host/wine/game night" → Hosting

GUARDRAILS:
- Never recommend adult-only venues if user mode = 'family' or 'kids'.
- Never include venues outside the user's city.
- Respect budget cap absolutely — don't suggest options over the cap.
- Cite TikTok signals when relevant: "Trending — 240 saves this week."
- If you can't find a good fit, say so. Don't invent venues.

CITATIONS:
When you recommend a venue, surface one of:
- "From your taste graph: 6 saves from @darkroom this month."
- "Trending in NYC: 240 TikTok posts this week."
- "Maya checked in last Friday."

OUTPUT FORMATS:
- Conversational reply → just plain text, under 30 words.
- Structured pass → STRICT JSON, no prose around it.
- Revision → 3 parts: (1) ack in one sentence, (2) bulleted old→new
  swaps, (3) new total/duration.
`

export const PASS_OUTPUT_SCHEMA = `
Output a JSON object only:
{
  "title": string,
  "vibe": string[],
  "agent": "night-out" | "family" | "party" | "hosting",
  "total_cost": number,
  "stops": [
    {
      "order": 1,
      "venue_name": string,
      "tag": string,
      "scheduled_time": "HH:mm",
      "duration_min": number,
      "cost": number,
      "booking_type": "walk-in" | "deposit" | "ticket" | "reservation",
      "must_order": string,
      "vibe_pills": string[],
      "walk_next": string|null,
      "why": string  // citation, e.g. "matches your speakeasy weight 0.82"
    }
  ]
}
Don't wrap in markdown. Don't add commentary. JSON only.
`
```

### `/lib/sparkle.ts` · the wrapper

```ts
import Anthropic from '@anthropic-ai/sdk'
import { SPARKLE_SYSTEM, PASS_OUTPUT_SCHEMA } from './sparkle-system'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function generatePass({
  userPrompt, userId, supa,
}: { userPrompt: string, userId: string, supa: any }) {
  // 1. Pull context
  const [signalsRes, venuesRes, userRes] = await Promise.all([
    supa.from('taste_signals').select('vibe_tags, venue_resolved, weight')
      .eq('user_id', userId).limit(500),
    supa.from('venues').select('name, tags, price_tier, adults_only, verified, boost_until')
      .eq('verified', true).limit(60),
    supa.from('users').select('city, tier, age, name').eq('id', userId).single(),
  ])

  // 2. Compute weighted vibe profile
  const weights: Record<string, number> = {}
  signalsRes.data?.forEach((s: any) =>
    s.vibe_tags?.forEach((v: string) => {
      weights[v] = (weights[v] || 0) + (s.weight || 1)
    })
  )
  const topVibes = Object.entries(weights).sort((a, b) => b[1] - a[1])
    .slice(0, 8).map(([k, v]) => `${k}:${v.toFixed(1)}`).join(', ')

  // 3. Filter venues (adult-safety, city, mode)
  const venues = (venuesRes.data || []).filter((v: any) =>
    !(v.adults_only && userRes.data?.tier === 'free' /* example gate */)
  )

  // 4. Cache key — same prompt + same user-context = cached
  const cacheKey = `pass:${userId}:${hashString(userPrompt + topVibes)}`
  const cached = await redis.get(cacheKey)
  if (cached) return JSON.parse(cached)

  // 5. Call Claude
  const completion = await anthropic.messages.create({
    model: 'claude-haiku-4-5',
    max_tokens: 2048,
    system: SPARKLE_SYSTEM,
    messages: [{
      role: 'user',
      content: `
USER PROFILE
- name: ${userRes.data?.name}
- city: ${userRes.data?.city}
- top vibes: ${topVibes}
- signal count: ${signalsRes.data?.length || 0}

AVAILABLE VENUES (verified, in city):
${venues.slice(0, 40).map((v: any) =>
  `- ${v.name} [${(v.tags || []).join(',')}] ${v.price_tier}${v.boost_until ? ' BOOSTED' : ''}`
).join('\n')}

REQUEST: ${userPrompt}

${PASS_OUTPUT_SCHEMA}
`.trim()
    }]
  })

  const text = (completion.content[0] as any).text
  const pass = JSON.parse(text.match(/\{[\s\S]*\}/)![0])

  await redis.set(cacheKey, JSON.stringify(pass), { ex: 86400 })
  return pass
}

function hashString(s: string) {
  let h = 0
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h) + s.charCodeAt(i) | 0
  return h.toString(36)
}
```

### Streaming chat for the `/app/chat` route

```ts
// /app/api/chat/route.ts
export async function POST(req: Request) {
  const { history } = await req.json()
  const stream = await anthropic.messages.stream({
    model: 'claude-haiku-4-5',
    max_tokens: 256,
    system: SPARKLE_SYSTEM,
    messages: history.map((m: any) => ({
      role: m.from === 'user' ? 'user' : 'assistant',
      content: m.text,
    })),
  })

  return new Response(
    new ReadableStream({
      async start(controller) {
        for await (const chunk of stream) {
          if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
            controller.enqueue(new TextEncoder().encode(chunk.delta.text))
          }
        }
        controller.close()
      }
    }),
    { headers: { 'Content-Type': 'text/plain; charset=utf-8' } }
  )
}
```

### Frontend usage

```ts
const res = await fetch('/api/chat', {
  method: 'POST',
  body: JSON.stringify({ history }),
})
const reader = res.body!.getReader()
const decoder = new TextDecoder()
let partial = ''
while (true) {
  const { done, value } = await reader.read()
  if (done) break
  partial += decoder.decode(value)
  setMessages(m => [...m.slice(0, -1), { from: 'bot', text: partial }])
}
```

---

## What to set up in order

1. **Supabase tables** (from BACKEND-STARTER.md)
2. **Anthropic key** → Vercel env
3. **Deploy** — empty app, just confirm it serves
4. **Add `/api/plan`** + test with curl
5. **Add `/api/chat`** + wire to your chat screen
6. **Stripe Checkout** — first the consumer subscription, then the per-venue deposit
7. **TikTok OAuth** — last, since it requires platform review for Display API
8. **Redis (Upstash)** — wire after you have 10+ users and inference costs start

Sparkle is awake the moment step 4 returns a pass to your curl. Everything else compounds the loop.
