-- Ensures city_waitlist and saved_events exist in production.
-- Prior migrations were recorded as applied but the tables are absent from
-- the live schema (confirmed via gen types). This migration uses IF NOT EXISTS
-- so it is safe to re-run.

-- ── city_waitlist ─────────────────────────────────────────────────────────────
create table if not exists public.city_waitlist (
  id          uuid primary key default gen_random_uuid(),
  email       text not null,
  voted_city  text,
  source      text default 'coming_soon_splash',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  constraint city_waitlist_email_unique unique (email)
);

create index if not exists idx_city_waitlist_voted_city
  on public.city_waitlist (voted_city) where voted_city is not null;

alter table public.city_waitlist enable row level security;

do $$ begin
  if not exists (
    select 1 from pg_policies where tablename = 'city_waitlist' and policyname = 'Anyone can join the waitlist'
  ) then
    create policy "Anyone can join the waitlist"
      on public.city_waitlist for insert with check (true);
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_policies where tablename = 'city_waitlist' and policyname = 'Anyone can read waitlist for vote counts'
  ) then
    create policy "Anyone can read waitlist for vote counts"
      on public.city_waitlist for select using (true);
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_policies where tablename = 'city_waitlist' and policyname = 'Anyone can update their own waitlist entry'
  ) then
    create policy "Anyone can update their own waitlist entry"
      on public.city_waitlist for update using (true) with check (true);
  end if;
end $$;

-- ── saved_events ──────────────────────────────────────────────────────────────
create table if not exists public.saved_events (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  event_id   text not null,
  kind       text not null default 'save' check (kind in ('save', 'rsvp')),
  created_at timestamptz not null default now(),
  unique (user_id, event_id, kind)
);

alter table public.saved_events enable row level security;

create index if not exists idx_saved_events_user  on public.saved_events (user_id);
create index if not exists idx_saved_events_event on public.saved_events (event_id);

do $$ begin
  if not exists (
    select 1 from pg_policies where tablename = 'saved_events' and policyname = 'Users view own saved events'
  ) then
    create policy "Users view own saved events"
      on public.saved_events for select using (auth.uid() = user_id);
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_policies where tablename = 'saved_events' and policyname = 'Users save events for self'
  ) then
    create policy "Users save events for self"
      on public.saved_events for insert with check (auth.uid() = user_id);
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_policies where tablename = 'saved_events' and policyname = 'Users remove own saved events'
  ) then
    create policy "Users remove own saved events"
      on public.saved_events for delete using (auth.uid() = user_id);
  end if;
end $$;
