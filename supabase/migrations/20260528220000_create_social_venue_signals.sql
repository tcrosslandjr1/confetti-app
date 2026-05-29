-- Social venue signals: venue intel extracted from TikTok/Instagram SERP results
create table if not exists public.social_venue_signals (
  id                uuid primary key default gen_random_uuid(),
  city_slug         text not null,
  venue_name        text not null,
  venue_slug        text not null,
  signal_type       text not null check (signal_type in ('trending','popular','new','lowkey','unique')),
  platform          text not null check (platform in ('tiktok','instagram','multi')),
  engagement_score  numeric(4,3) not null default 0.5,
  sentiment         text not null check (sentiment in ('positive','neutral','mixed','negative')),
  hashtags          text not null default '[]',
  snippet           text,
  neighborhood      text,
  category          text,
  generation_batch  text,
  collected_at      timestamptz not null default now(),
  is_active         boolean not null default true,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  unique (city_slug, venue_slug, platform)
);

create index if not exists idx_social_venue_signals_city_slug    on public.social_venue_signals (city_slug);
create index if not exists idx_social_venue_signals_signal_type  on public.social_venue_signals (signal_type);
create index if not exists idx_social_venue_signals_collected_at on public.social_venue_signals (collected_at desc);

alter table public.social_venue_signals enable row level security;

do $$ begin
  if not exists (
    select 1 from pg_policies
    where tablename='social_venue_signals'
    and policyname='Public read social_venue_signals'
  ) then
    create policy "Public read social_venue_signals"
      on public.social_venue_signals for select using (true);
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_policies
    where tablename='social_venue_signals'
    and policyname='Service role can write social_venue_signals'
  ) then
    create policy "Service role can write social_venue_signals"
      on public.social_venue_signals for all using (auth.role() = 'service_role');
  end if;
end $$;

-- Batch run log for the scraper cron
create table if not exists public.social_collection_log (
  id                uuid primary key default gen_random_uuid(),
  batch_id          text not null unique,
  city_slug         text not null,
  trigger           text not null default 'scheduled',
  status            text not null default 'running' check (status in ('running','completed','failed')),
  signals_collected integer,
  signals_by_type   jsonb,
  model_used        text,
  duration_ms       integer,
  error_message     text,
  completed_at      timestamptz,
  created_at        timestamptz not null default now()
);

alter table public.social_collection_log enable row level security;

do $$ begin
  if not exists (
    select 1 from pg_policies
    where tablename='social_collection_log'
    and policyname='Service role can write social_collection_log'
  ) then
    create policy "Service role can write social_collection_log"
      on public.social_collection_log for all using (auth.role() = 'service_role');
  end if;
end $$;
