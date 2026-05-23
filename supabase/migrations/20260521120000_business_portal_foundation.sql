-- Business Portal Foundation: venue notifications, passenger locations, geofences, analytics
-- These tables support: arrival alerts, pre-order triggers, location tracking, and real analytics

-- ============================================================
-- 1. Venue Notifications (business-facing alerts)
-- ============================================================
create table if not exists public.venue_notifications (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid not null references public.venues(id) on delete cascade,
  type text not null check (type in (
    'new_booking', 'cancelled_booking', 'modified_booking',
    'passenger_arriving', 'passenger_arrived',
    'pre_order_fired', 'new_review', 'promo_expired',
    'corporate_booking_request', 'system'
  )),
  title text not null,
  body text,
  metadata jsonb default '{}',
  booking_id uuid references public.bookings(id) on delete set null,
  passenger_id uuid references auth.users(id) on delete set null,
  is_read boolean default false,
  read_at timestamptz,
  created_at timestamptz default now()
);

create index idx_venue_notifications_venue on public.venue_notifications(venue_id, created_at desc);
create index idx_venue_notifications_unread on public.venue_notifications(venue_id, is_read) where is_read = false;

-- ============================================================
-- 2. Passenger Locations (for geofence processing)
-- ============================================================
create table if not exists public.passenger_locations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  lat double precision not null,
  lng double precision not null,
  accuracy_meters double precision,
  heading double precision,
  speed double precision,
  recorded_at timestamptz default now()
);

create index idx_passenger_locations_user on public.passenger_locations(user_id, recorded_at desc);
-- Keep only recent locations (cleanup via cron or Edge Function)
create index idx_passenger_locations_stale on public.passenger_locations(recorded_at);

-- ============================================================
-- 3. Venue Geofences (configurable radius per venue)
-- ============================================================
create table if not exists public.venue_geofences (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid not null references public.venues(id) on delete cascade,
  lat double precision not null,
  lng double precision not null,
  arrival_radius_meters integer default 50,
  pre_order_radius_meters integer default 200,
  notify_on_arrival boolean default true,
  fire_pre_order boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(venue_id)
);

-- ============================================================
-- 4. Venue Analytics Daily (aggregated metrics)
-- ============================================================
create table if not exists public.venue_analytics_daily (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid not null references public.venues(id) on delete cascade,
  date date not null,
  impressions integer default 0,
  profile_views integer default 0,
  clicks integer default 0,
  bookings_count integer default 0,
  cancellations integer default 0,
  pre_orders_count integer default 0,
  revenue_cents bigint default 0,
  avg_party_size numeric(3,1) default 0,
  unique_visitors integer default 0,
  repeat_visitors integer default 0,
  created_at timestamptz default now(),
  unique(venue_id, date)
);

create index idx_venue_analytics_daily_lookup on public.venue_analytics_daily(venue_id, date desc);

-- ============================================================
-- 5. Passenger Arrival Log (tracks geofence triggers)
-- ============================================================
create table if not exists public.passenger_arrivals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  venue_id uuid not null references public.venues(id) on delete cascade,
  booking_id uuid references public.bookings(id) on delete set null,
  trigger_type text not null check (trigger_type in ('approaching', 'arrived')),
  distance_meters double precision,
  notified_venue boolean default false,
  pre_order_sent boolean default false,
  created_at timestamptz default now()
);

create index idx_passenger_arrivals_venue on public.passenger_arrivals(venue_id, created_at desc);
create index idx_passenger_arrivals_booking on public.passenger_arrivals(booking_id);

-- ============================================================
-- RLS Policies
-- ============================================================

alter table public.venue_notifications enable row level security;
alter table public.passenger_locations enable row level security;
alter table public.venue_geofences enable row level security;
alter table public.venue_analytics_daily enable row level security;
alter table public.passenger_arrivals enable row level security;

-- Venue notifications: business owners can read their venue's notifications
create policy "venue_notifications_select" on public.venue_notifications
  for select using (
    venue_id in (
      select id from public.venue_suggestions where claimed_by = auth.uid()
    )
  );

create policy "venue_notifications_update" on public.venue_notifications
  for update using (
    venue_id in (
      select id from public.venue_suggestions where claimed_by = auth.uid()
    )
  );

-- Passenger locations: users can insert/read their own
create policy "passenger_locations_insert" on public.passenger_locations
  for insert with check (user_id = auth.uid());

create policy "passenger_locations_select" on public.passenger_locations
  for select using (user_id = auth.uid());

-- Venue geofences: business owners manage their venue's geofence
create policy "venue_geofences_select" on public.venue_geofences
  for select using (
    venue_id in (
      select id from public.venue_suggestions where claimed_by = auth.uid()
    )
  );

create policy "venue_geofences_manage" on public.venue_geofences
  for all using (
    venue_id in (
      select id from public.venue_suggestions where claimed_by = auth.uid()
    )
  );

-- Venue analytics: business owners can view their own
create policy "venue_analytics_daily_select" on public.venue_analytics_daily
  for select using (
    venue_id in (
      select id from public.venue_suggestions where claimed_by = auth.uid()
    )
  );

-- Passenger arrivals: business owners see arrivals at their venues
create policy "passenger_arrivals_select_venue" on public.passenger_arrivals
  for select using (
    venue_id in (
      select id from public.venue_suggestions where claimed_by = auth.uid()
    )
  );

-- Service role bypass for Edge Functions (geofence processor)
-- Edge Functions use supabase service role key which bypasses RLS
