-- ============================================================
-- Confetti Agent System — Database Schema
-- Adds user behavior tracking, taste profiles, venue cache,
-- trip planning, and agent session management.
-- ============================================================

-- ─── User behavior events (implicit learning) ──────────────

create table if not exists public.user_behavior_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  event_type text not null,
  -- event_type values:
  --   venue_view, venue_skip, venue_favorite, venue_unfavorite,
  --   venue_book, venue_complete, venue_rate, venue_revisit,
  --   confetti_create, confetti_complete, confetti_abandon,
  --   chat_query, chip_tap, category_browse,
  --   search_query, filter_apply, card_swipe_right, card_swipe_left
  venue_id uuid references public.venues(id) on delete set null,
  itinerary_id uuid references public.itineraries(id) on delete set null,
  metadata jsonb not null default '{}',
  -- metadata can hold: query text, swipe direction, dwell_time_ms,
  -- scroll_depth, filter values, chip label, search terms, etc.
  created_at timestamptz not null default now()
);

create index user_behavior_user_time_idx
  on public.user_behavior_events (user_id, created_at desc);
create index user_behavior_type_idx
  on public.user_behavior_events (event_type);

-- ─── Taste profiles (computed from behavior + explicit prefs) ──

create table if not exists public.taste_profiles (
  user_id uuid primary key references public.profiles(id) on delete cascade,

  -- Cuisine affinity scores (0.0 to 1.0)
  cuisine_scores jsonb not null default '{}',
  -- e.g. {"Japanese": 0.92, "Italian": 0.85, "Mexican": 0.78, ...}

  -- Vibe affinity scores
  vibe_scores jsonb not null default '{}',
  -- e.g. {"Rooftop": 0.95, "Speakeasy": 0.88, "Family": 0.6, ...}

  -- Price comfort zone
  price_preference text not null default '$$',
  -- $, $$, $$$, $$$$

  -- Time-of-day patterns
  time_patterns jsonb not null default '{}',
  -- e.g. {"brunch": 0.7, "dinner": 0.95, "late_night": 0.85}

  -- Neighborhood affinities
  neighborhood_scores jsonb not null default '{}',

  -- Occasion patterns
  occasion_scores jsonb not null default '{}',
  -- e.g. {"date_night": 0.9, "family": 0.6, "solo": 0.4}

  -- Adventure vs. comfort score (0 = stick to known, 1 = always new)
  adventure_score numeric(3,2) not null default 0.50,

  -- Social dining score (0 = solo, 1 = always groups)
  social_score numeric(3,2) not null default 0.50,

  -- How many data points built this profile
  event_count integer not null default 0,
  last_computed_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ─── Venue cache (from Google Places + Foursquare) ──────────

create table if not exists public.venue_cache (
  id uuid primary key default gen_random_uuid(),
  -- External IDs
  google_place_id text,
  foursquare_id text,
  -- Core info
  name text not null,
  category text not null,
  subcategory text,
  address text,
  city text not null,
  state text,
  country text not null default 'US',
  latitude numeric(10,7),
  longitude numeric(10,7),
  -- Details
  price_level text, -- $, $$, $$$, $$$$
  rating numeric(2,1),
  rating_count integer,
  phone text,
  website text,
  hours jsonb, -- structured opening hours
  photo_urls text[] not null default '{}',
  -- Tags for matching
  cuisine_tags text[] not null default '{}',
  vibe_tags text[] not null default '{}',
  occasion_tags text[] not null default '{}',
  -- Source tracking
  source text not null default 'google',
  raw_data jsonb not null default '{}',
  -- Freshness
  fetched_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '7 days'),

  unique (google_place_id),
  unique (foursquare_id)
);

create index venue_cache_location_idx
  on public.venue_cache using gist (
    point(longitude, latitude)
  );
create index venue_cache_city_idx on public.venue_cache (city);
create index venue_cache_cuisine_idx on public.venue_cache using gin (cuisine_tags);
create index venue_cache_vibe_idx on public.venue_cache using gin (vibe_tags);
create index venue_cache_expiry_idx on public.venue_cache (expires_at);

-- ─── Trip plans (multi-state / long-distance) ───────────────

create table if not exists public.trip_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  origin_city text not null,
  origin_state text,
  origin_lat numeric(10,7),
  origin_lng numeric(10,7),
  destination_city text not null,
  destination_state text,
  destination_lat numeric(10,7),
  destination_lng numeric(10,7),
  -- Route info
  total_distance_miles numeric(10,1),
  total_duration_hours numeric(5,1),
  waypoints jsonb not null default '[]',
  -- Each waypoint: {city, state, lat, lng, stop_type, venue_id?, notes}
  -- stop_type: "dining", "experience", "ev_charge", "rest", "overnight"
  travel_mode text not null default 'driving',
  status text not null default 'planning',
  -- planning, active, completed, cancelled
  departs_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index trip_plans_user_idx on public.trip_plans (user_id, created_at desc);

-- ─── Trip stops (linked to trip plan) ───────────────────────

create table if not exists public.trip_stops (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trip_plans(id) on delete cascade,
  venue_cache_id uuid references public.venue_cache(id) on delete set null,
  stop_order integer not null,
  stop_type text not null default 'dining',
  -- dining, experience, ev_charge, rest, overnight, attraction
  name text not null,
  city text,
  state text,
  latitude numeric(10,7),
  longitude numeric(10,7),
  arrives_at timestamptz,
  duration_minutes integer,
  distance_from_prev_miles numeric(8,1),
  drive_time_from_prev_minutes integer,
  notes text,
  status text not null default 'planned',
  -- planned, en_route, arrived, completed, skipped
  unique (trip_id, stop_order)
);

-- ─── Agent sessions (conversation memory) ───────────────────

create table if not exists public.agent_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  agent_type text not null default 'chat',
  -- chat, venue_discovery, trip_planner, user_intelligence
  context jsonb not null default '{}',
  -- Stores: location, occasion, party_size, budget, mood, filters, etc.
  messages jsonb not null default '[]',
  -- Array of {role, content, timestamp, provider}
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index agent_sessions_user_idx
  on public.agent_sessions (user_id, status, updated_at desc);

-- ─── RLS policies ───────────────────────────────────────────

alter table public.user_behavior_events enable row level security;
alter table public.taste_profiles enable row level security;
alter table public.venue_cache enable row level security;
alter table public.trip_plans enable row level security;
alter table public.trip_stops enable row level security;
alter table public.agent_sessions enable row level security;

-- Behavior events: users can insert and read their own
create policy "behavior_insert_own" on public.user_behavior_events
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "behavior_select_own" on public.user_behavior_events
  for select to authenticated using ((select auth.uid()) = user_id);

-- Taste profiles: users can read and update their own
create policy "taste_all_own" on public.taste_profiles
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- Venue cache: publicly readable
create policy "venue_cache_public_read" on public.venue_cache
  for select to anon, authenticated using (true);

-- Trip plans: users own their trips
create policy "trips_all_own" on public.trip_plans
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- Trip stops: accessible if user owns the trip
create policy "trip_stops_all_owner" on public.trip_stops
  for all to authenticated
  using (exists (
    select 1 from public.trip_plans t
    where t.id = trip_id and t.user_id = (select auth.uid())
  ))
  with check (exists (
    select 1 from public.trip_plans t
    where t.id = trip_id and t.user_id = (select auth.uid())
  ));

-- Agent sessions: users own their sessions
create policy "agent_sessions_all_own" on public.agent_sessions
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- ─── Grants ─────────────────────────────────────────────────

grant select on public.venue_cache to anon, authenticated;
grant select, insert on public.user_behavior_events to authenticated;
grant select, insert, update on public.taste_profiles to authenticated;
grant select, insert, update, delete on public.trip_plans, public.trip_stops, public.agent_sessions to authenticated;
