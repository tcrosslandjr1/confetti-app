# Confetti — Backend Starter (Supabase + Next.js + Claude)

Drop these files into your existing repo. Adjust paths to match your framework
(Next.js App Router shown — easy to adapt to TanStack Start / Vite + Hono / etc).

## 1 · Supabase schema · run in SQL editor

```sql
-- USERS
create table public.users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  phone text,
  name text,
  city text default 'Brooklyn, NY',
  tier text default 'free' check (tier in ('free', 'all-access', 'lifetime')),
  member_since timestamptz default now(),
  tiktok_handle text,
  age int,
  parental_consent boolean default false
);
alter table users enable row level security;
create policy "users own row" on users for all using (auth.uid() = id);

-- PASSES
create table public.passes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  pass_code text not null,
  title text,
  vibe text[] default '{}',
  city text, budget text,
  total_cost numeric default 0,
  status text default 'active' check (status in ('draft', 'active', 'completed', 'cancelled')),
  printed_at timestamptz default now(),
  starts_at timestamptz,
  completed_at timestamptz
);
alter table passes enable row level security;
create policy "users own passes" on passes for all
  using (user_id = auth.uid());

-- STOPS
create table public.stops (
  id uuid primary key default gen_random_uuid(),
  pass_id uuid references passes(id) on delete cascade,
  order_idx int not null,
  venue_name text not null,
  tag text, address text,
  scheduled_time time, duration_min int,
  cost numeric default 0,
  booking_type text check (booking_type in ('walk-in', 'deposit', 'ticket', 'reservation')),
  booking_status text default 'unbooked',
  booking_ref text,
  must_order text, vibe_pills text[]
);
alter table stops enable row level security;
create policy "stops via pass" on stops for all
  using (pass_id in (select id from passes where user_id = auth.uid()));

-- CHECK-INS
create table public.checkins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id),
  stop_id uuid references stops(id),
  photo_url text, caption text,
  posted_to text[] default '{}',
  pts_earned int default 25,
  geofence_triggered boolean default false,
  created_at timestamptz default now()
);
alter table checkins enable row level security;
create policy "users own checkins" on checkins for all
  using (user_id = auth.uid());

-- TASTE SIGNALS (the magic)
create table public.taste_signals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  source text not null,
  source_handle text, source_url text,
  raw_text text,
  vibe_tags text[] default '{}',
  venue_resolved text,
  weight numeric default 1.0,
  collected_at timestamptz default now()
);
alter table taste_signals enable row level security;
create policy "users own signals" on taste_signals for all
  using (user_id = auth.uid());
create index on taste_signals (user_id, collected_at desc);

-- LEDGER (points)
create table public.confetti_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id),
  pts int not null,
  reason text, ref_id uuid,
  created_at timestamptz default now()
);
alter table confetti_ledger enable row level security;
create policy "users own ledger" on confetti_ledger for all
  using (user_id = auth.uid());

-- VENUES
create table public.venues (
  id uuid primary key default gen_random_uuid(),
  name text not null, city text, nbhd text, address text,
  tags text[], price_tier text,
  yelp_id text, yelp_rating numeric,
  google_place_id text,
  adults_only boolean default false,
  verified boolean default false,
  boost_until timestamptz,
  last_synced timestamptz default now()
);
create index on venues (city, verified);

-- CREWS
create table public.crews (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references users(id),
  name text,
  member_ids uuid[] default '{}',
  created_at timestamptz default now()
);

-- HELPER · award points + write ledger
create or replace function award_pts(uid uuid, amount int, reason text, ref uuid)
returns void language plpgsql as $$
begin
  insert into confetti_ledger (user_id, pts, reason, ref_id)
  values (uid, amount, reason, ref);
end; $$;
```

## 2 · `/app/api/plan/route.ts` · Next.js App Router

```ts
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase-server'

const claude = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: Request) {
  const { userPrompt } = await req.json()
  const supa = createClient()

  const { data: { user } } = await supa.auth.getUser()
  if (!user) return Response.json({ error: 'unauthorized' }, { status: 401 })

  // Pull user's taste signals
  const { data: signals } = await supa
    .from('taste_signals').select('vibe_tags, venue_resolved')
    .eq('user_id', user.id).limit(500)

  // Compute vibe weights
  const weights: Record<string, number> = {}
  signals?.forEach(s => s.vibe_tags?.forEach((v: string) => {
    weights[v] = (weights[v] || 0) + 1
  }))
  const topVibes = Object.entries(weights)
    .sort((a, b) => b[1] - a[1]).slice(0, 8)
    .map(([k, v]) => `${k}:${v}`).join(', ')

  // Pull nearby verified venues
  const { data: venues } = await supa
    .from('venues').select('name, tags, price_tier, adults_only')
    .eq('city', 'Brooklyn, NY').eq('verified', true).limit(40)

  // Call Claude
  const completion = await claude.messages.create({
    model: 'claude-haiku-4-5',
    max_tokens: 2048,
    messages: [{
      role: 'user',
      content: `You are Sparkle, Confetti's planner agent.

User taste (top vibes from ${signals?.length || 0} signals): ${topVibes}

Available venues:
${venues?.map(v => `- ${v.name} [${v.tags?.join(',')}] ${v.price_tier}`).join('\n')}

User wants: "${userPrompt}"

Build a 3-stop pass. Return STRICT JSON:
{
  "title": "...",
  "vibe": ["..."],
  "total_cost": number,
  "stops": [
    { "order": 1, "venue_name": "...", "tag": "...",
      "scheduled_time": "19:30", "duration_min": 45,
      "cost": 14, "booking_type": "walk-in",
      "must_order": "...", "vibe_pills": ["..."] }
  ]
}`
    }]
  })

  const text = (completion.content[0] as any).text
  const pass = JSON.parse(text.match(/\{[\s\S]*\}/)![0])

  // Persist
  const { data: passRow } = await supa.from('passes').insert({
    user_id: user.id,
    pass_code: '#' + Math.random().toString(36).slice(2, 6).toUpperCase(),
    title: pass.title, vibe: pass.vibe,
    total_cost: pass.total_cost,
  }).select().single()

  for (const s of pass.stops) {
    await supa.from('stops').insert({
      pass_id: passRow!.id,
      order_idx: s.order, venue_name: s.venue_name,
      tag: s.tag, scheduled_time: s.scheduled_time,
      duration_min: s.duration_min, cost: s.cost,
      booking_type: s.booking_type, must_order: s.must_order,
      vibe_pills: s.vibe_pills,
    })
  }

  return Response.json({ pass: passRow })
}
```

## 3 · `/app/api/checkin/route.ts`

```ts
export async function POST(req: Request) {
  const { stop_id, photo_url, caption, posted_to } = await req.json()
  const supa = createClient()
  const { data: { user } } = await supa.auth.getUser()

  const { data: ci } = await supa.from('checkins').insert({
    user_id: user!.id, stop_id, photo_url, caption,
    posted_to, pts_earned: 25,
  }).select().single()

  await supa.rpc('award_pts', {
    uid: user!.id, amount: 25, reason: 'check_in', ref: ci!.id
  })

  // Feed taste graph
  const { data: stop } = await supa.from('stops').select('venue_name, tag, vibe_pills')
    .eq('id', stop_id).single()
  if (stop) {
    await supa.from('taste_signals').insert({
      user_id: user!.id, source: 'confetti-checkin',
      raw_text: stop.venue_name + ' ' + stop.tag,
      vibe_tags: stop.vibe_pills, venue_resolved: stop.venue_name,
      weight: 2.0,  // showed up = strong signal
    })
  }
  return Response.json({ ok: true })
}
```

## 4 · `/app/api/cron/tiktok-sync/route.ts`

```ts
import Anthropic from '@anthropic-ai/sdk'

export async function GET() {
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`)
    return new Response('forbidden', { status: 403 })

  const supa = createServiceClient()  // uses SERVICE_ROLE_KEY
  const { data: users } = await supa.from('users')
    .select('id, tiktok_handle').not('tiktok_handle', 'is', null)

  for (const u of users || []) {
    // 1. Fetch saves via Bright Data (replace with actual SDK call)
    const saves = await fetch(`https://api.brightdata.com/tiktok/saves/${u.tiktok_handle}`, {
      headers: { Authorization: `Bearer ${process.env.BRIGHTDATA_KEY}` }
    }).then(r => r.json())

    // 2. Insert raw signals
    for (const s of saves.items.slice(0, 50)) {
      await supa.from('taste_signals').insert({
        user_id: u.id, source: 'tiktok-save',
        source_handle: s.creator, source_url: s.url,
        raw_text: (s.caption + ' ' + s.hashtags.join(' ')).slice(0, 500),
        weight: 1.0,
      })
    }
  }
  return Response.json({ ok: true, count: users?.length })
}
```

## 5 · `.env.local`

```
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...   # backend only, NEVER expose
ANTHROPIC_API_KEY=sk-ant-...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
BRIGHTDATA_KEY=...
TWILIO_ACCOUNT_SID=...
TWILIO_AUTH_TOKEN=...
CRON_SECRET=long-random-string
```

## 6 · `vercel.json` · cron schedule

```json
{
  "crons": [
    { "path": "/api/cron/tiktok-sync", "schedule": "0 3 * * *" },
    { "path": "/api/cron/venue-refresh", "schedule": "0 4 * * *" }
  ]
}
```

## 7 · Deploy commands

```bash
git add . && git commit -m "wire backend"
git push
# Vercel auto-deploys. Set env vars in Vercel dashboard first.

# In Supabase dashboard:
#   1. SQL editor → paste schema (above)
#   2. Authentication → enable Email + Apple + Google providers
#   3. Edge Functions → optional, the route handlers above do most work

# Test the loop:
curl -X POST https://your-app.vercel.app/api/plan \
  -H "Authorization: Bearer $YOUR_USER_JWT" \
  -H "content-type: application/json" \
  -d '{"userPrompt":"date night brooklyn $80 walkable"}'
```

That's the whole stack to wake Sparkle up. ~400 lines of code. Once it's
running, every action persists, every persist feeds Claude, every Claude
call gets smarter. The flywheel starts spinning the moment user #1 signs up.
