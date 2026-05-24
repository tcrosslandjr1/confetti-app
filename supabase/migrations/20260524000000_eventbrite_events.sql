-- Eventbrite events cache table
-- Stores cached event data from Eventbrite API v3 to reduce API calls
-- and provide fast local queries with location-based filtering.

create table if not exists public.eventbrite_events (
  id            uuid primary key default gen_random_uuid(),
  eventbrite_id text unique not null,
  title         text not null,
  category      text not null default 'Music',
  start_date    timestamptz not null,
  end_date      timestamptz,
  city          text not null,
  venue         text,
  price         numeric(10,2) default 0,
  currency      text default 'USD',
  image_url     text,
  blurb         text,
  organizer     text,
  ticket_url    text,
  lat           double precision,
  lng           double precision,
  capacity      integer,
  is_free       boolean default false,
  status        text default 'live',
  vibe_tags     text[] default '{}',
  raw_json      jsonb,
  last_synced   timestamptz default now(),
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

-- Indexes for common query patterns
create index if not exists idx_eventbrite_events_category on public.eventbrite_events (category);
create index if not exists idx_eventbrite_events_city on public.eventbrite_events (city);
create index if not exists idx_eventbrite_events_start_date on public.eventbrite_events (start_date);
create index if not exists idx_eventbrite_events_status on public.eventbrite_events (status);
create index if not exists idx_eventbrite_events_eventbrite_id on public.eventbrite_events (eventbrite_id);

-- Spatial index for location-based queries (nearby events)
create index if not exists idx_eventbrite_events_location on public.eventbrite_events (lat, lng);

-- GIN index on vibe_tags for array containment queries
create index if not exists idx_eventbrite_events_vibe_tags on public.eventbrite_events using gin (vibe_tags);

-- Updated_at trigger
create or replace function public.update_eventbrite_events_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_eventbrite_events_updated_at
  before update on public.eventbrite_events
  for each row
  execute function public.update_eventbrite_events_updated_at();

-- RLS policies
alter table public.eventbrite_events enable row level security;

-- Anyone can read events (public browse)
create policy "eventbrite_events_select_all"
  on public.eventbrite_events
  for select
  using (true);

-- Only service role can insert/update/delete (edge function sync)
create policy "eventbrite_events_insert_service"
  on public.eventbrite_events
  for insert
  with check (auth.role() = 'service_role');

create policy "eventbrite_events_update_service"
  on public.eventbrite_events
  for update
  using (auth.role() = 'service_role');

create policy "eventbrite_events_delete_service"
  on public.eventbrite_events
  for delete
  using (auth.role() = 'service_role');

-- Sync log table to track API sync runs
create table if not exists public.eventbrite_sync_log (
  id          uuid primary key default gen_random_uuid(),
  city        text not null,
  category    text,
  events_found integer default 0,
  events_upserted integer default 0,
  error       text,
  started_at  timestamptz default now(),
  finished_at timestamptz
);

alter table public.eventbrite_sync_log enable row level security;

create policy "eventbrite_sync_log_select_all"
  on public.eventbrite_sync_log
  for select
  using (true);

create policy "eventbrite_sync_log_insert_service"
  on public.eventbrite_sync_log
  for insert
  with check (auth.role() = 'service_role');
