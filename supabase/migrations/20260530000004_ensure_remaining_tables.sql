-- Ensures user_achievements, subscriptions, and ad_events.brand exist.

-- ── user_achievements ────────────────────────────────────────────────────────
create table if not exists public.user_achievements (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users(id) on delete cascade,
  achievement_id uuid not null references public.achievements(id) on delete cascade,
  unlocked_at    timestamptz not null default now(),
  unique (user_id, achievement_id)
);

alter table public.user_achievements enable row level security;

do $$ begin
  if not exists (
    select 1 from pg_policies where tablename='user_achievements' and policyname='own achievements'
  ) then
    create policy "own achievements" on public.user_achievements
      for all using (auth.uid() = user_id);
  end if;
end $$;

create index if not exists idx_user_achievements_user
  on public.user_achievements (user_id);

-- ── subscriptions ─────────────────────────────────────────────────────────────
create table if not exists public.subscriptions (
  id                       uuid primary key default gen_random_uuid(),
  user_id                  uuid not null references auth.users(id) on delete cascade,
  stripe_subscription_id   text,
  stripe_customer_id       text,
  product_id               text,
  price_id                 text,
  status                   text,
  current_period_end       timestamptz,
  cancel_at_period_end     boolean default false,
  pending_price_id         text,
  tier                     text,
  environment              text not null default 'production',
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now()
);

alter table public.subscriptions enable row level security;

do $$ begin
  if not exists (
    select 1 from pg_policies where tablename='subscriptions' and policyname='own subscriptions'
  ) then
    create policy "own subscriptions" on public.subscriptions
      for select using (auth.uid() = user_id);
  end if;
end $$;

create index if not exists idx_subscriptions_user
  on public.subscriptions (user_id);

-- ── ad_events.brand (add column if missing) ────────────────────────────────
do $$ begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='ad_events' and column_name='brand'
  ) then
    alter table public.ad_events add column brand text;
  end if;
end $$;
