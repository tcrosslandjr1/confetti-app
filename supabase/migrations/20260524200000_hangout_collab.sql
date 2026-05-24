-- ============================================================
-- hangout_crew + hangout_claims
-- Mirrors boarding_pass_crew: a host shares a hangout by minting a
-- token, anyone with the link can view the plan and claim a supply
-- / dish / drink item. Live sync via Supabase Realtime.
-- ============================================================

-- One row per shared hangout. token is the only secret needed to view.
create table if not exists public.hangout_crew (
  id                   uuid primary key default gen_random_uuid(),
  token                text unique not null,
  occasion             text,
  occasion_key         text,
  city                 text,
  start_time           text,
  date                 text,
  mode                 text,
  plan                 jsonb not null,
  host_name            text,
  generated_at         timestamptz not null default now(),
  created_at           timestamptz not null default now(),
  -- Optional expiry — after this the read API can refuse.
  expires_at           timestamptz default (now() + interval '60 days')
);

create index if not exists hangout_crew_token_idx on public.hangout_crew (token);
create index if not exists hangout_crew_expires_idx on public.hangout_crew (expires_at);

-- One row per claim. item_key is "<category>:<index>" e.g. "menu:3".
-- claimed_by_name lets us show "Tyler" without requiring auth.
create table if not exists public.hangout_claims (
  id              uuid primary key default gen_random_uuid(),
  hangout_id      uuid not null references public.hangout_crew(id) on delete cascade,
  item_category   text not null check (item_category in ('menu','drinks','supplies','grocery','games')),
  item_key        text not null,
  item_label      text,
  claimed_by_name text not null,
  /** A small client-generated id so the same device can unclaim later without auth. */
  claimed_by_token text not null,
  note            text,
  claimed_at      timestamptz not null default now(),
  unique (hangout_id, item_category, item_key)
);

create index if not exists hangout_claims_hangout_idx on public.hangout_claims (hangout_id);

-- ── RLS ──
alter table public.hangout_crew enable row level security;
alter table public.hangout_claims enable row level security;

-- Anyone can read a shared hangout (we gate by token in the function).
drop policy if exists "hangout_crew_public_read" on public.hangout_crew;
create policy "hangout_crew_public_read"
  on public.hangout_crew for select
  to anon, authenticated
  using (true);

-- Anyone can read claims (so live sync works without auth).
drop policy if exists "hangout_claims_public_read" on public.hangout_claims;
create policy "hangout_claims_public_read"
  on public.hangout_claims for select
  to anon, authenticated
  using (true);

-- Writes happen ONLY through the service-role edge function.

-- ── Realtime ──
-- Add to the realtime publication so Supabase emits postgres_changes
-- for inserts/deletes. (If the publication doesn't exist or the row
-- is already added, both ALTERs no-op.)
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    begin
      execute 'alter publication supabase_realtime add table public.hangout_claims';
    exception when others then null;
    end;
  end if;
end $$;
