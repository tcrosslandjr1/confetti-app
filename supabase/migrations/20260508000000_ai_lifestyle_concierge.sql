create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  email text,
  avatar_url text,
  tier text not null default 'premium',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_preferences (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  cuisines text[] not null default '{}',
  activities text[] not null default '{}',
  budget_min integer not null default 80,
  budget_max integer not null default 320,
  vibe_tags text[] not null default '{}',
  updated_at timestamptz not null default now()
);

create table if not exists public.venues (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null,
  neighborhood text not null,
  price_tier text not null,
  hero_image_url text,
  vibe_tags text[] not null default '{}',
  cuisine_tags text[] not null default '{}',
  average_rating numeric(2,1) not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.venue_parking (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid not null references public.venues(id) on delete cascade,
  label text not null,
  distance_minutes integer not null,
  estimated_cost numeric(8,2),
  notes text
);

create table if not exists public.venue_menu_highlights (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid not null references public.venues(id) on delete cascade,
  item_name text not null,
  price numeric(8,2),
  dietary_tags text[] not null default '{}',
  spice_level integer not null default 0
);

create table if not exists public.itineraries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  occasion text,
  total_estimated_cost numeric(10,2),
  total_duration_minutes integer,
  status text not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.itinerary_stops (
  id uuid primary key default gen_random_uuid(),
  itinerary_id uuid not null references public.itineraries(id) on delete cascade,
  venue_id uuid not null references public.venues(id) on delete restrict,
  stop_order integer not null,
  starts_at timestamptz,
  duration_minutes integer,
  travel_to_next_minutes integer,
  dress_code text,
  vibe_match integer not null check (vibe_match between 0 and 100),
  unique (itinerary_id, stop_order)
);

create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  itinerary_id uuid references public.itineraries(id) on delete set null,
  venue_id uuid references public.venues(id) on delete restrict,
  confirmation_code text not null unique,
  party_size integer not null default 2,
  booking_time timestamptz not null,
  status text not null default 'upcoming',
  special_requests text,
  created_at timestamptz not null default now()
);

create table if not exists public.passport_stamps (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  venue_id uuid not null references public.venues(id) on delete restrict,
  stamp_type text not null,
  earned_at timestamptz not null default now(),
  visit_notes text,
  unique (user_id, venue_id, stamp_type)
);

create table if not exists public.achievements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  code text not null,
  name text not null,
  description text,
  progress integer not null default 0,
  target integer not null default 1,
  unlocked_at timestamptz,
  unique (user_id, code)
);

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  venue_id uuid not null references public.venues(id) on delete cascade,
  rating integer not null check (rating between 1 and 5),
  occasion_tag text,
  food_rating integer check (food_rating between 1 and 5),
  ambiance_rating integer check (ambiance_rating between 1 and 5),
  service_rating integer check (service_rating between 1 and 5),
  body text not null,
  photo_urls text[] not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  venue_id uuid references public.venues(id) on delete cascade,
  room_type text not null default 'ai',
  role text not null check (role in ('user', 'assistant', 'community')),
  body text not null,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists public.favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  venue_id uuid not null references public.venues(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, venue_id)
);

create table if not exists public.group_invites (
  id uuid primary key default gen_random_uuid(),
  itinerary_id uuid not null references public.itineraries(id) on delete cascade,
  owner_id uuid not null references public.profiles(id) on delete cascade,
  invite_token text not null unique default encode(extensions.gen_random_bytes(18), 'hex'),
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.ai_generation_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  prompt text not null,
  response_summary text,
  model text,
  token_count integer,
  latency_ms integer,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.user_preferences enable row level security;
alter table public.venues enable row level security;
alter table public.venue_parking enable row level security;
alter table public.venue_menu_highlights enable row level security;
alter table public.itineraries enable row level security;
alter table public.itinerary_stops enable row level security;
alter table public.bookings enable row level security;
alter table public.passport_stamps enable row level security;
alter table public.achievements enable row level security;
alter table public.reviews enable row level security;
alter table public.chat_messages enable row level security;
alter table public.favorites enable row level security;
alter table public.group_invites enable row level security;
alter table public.ai_generation_log enable row level security;

grant select on public.venues, public.venue_parking, public.venue_menu_highlights, public.reviews to anon, authenticated;
grant select, insert, update, delete on
  public.profiles,
  public.user_preferences,
  public.itineraries,
  public.itinerary_stops,
  public.bookings,
  public.passport_stamps,
  public.achievements,
  public.chat_messages,
  public.favorites,
  public.group_invites,
  public.ai_generation_log
to authenticated;

create policy "profiles_select_own" on public.profiles
  for select to authenticated using ((select auth.uid()) = id);
create policy "profiles_insert_own" on public.profiles
  for insert to authenticated with check ((select auth.uid()) = id);
create policy "profiles_update_own" on public.profiles
  for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

create policy "preferences_all_own" on public.user_preferences
  for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

create policy "venues_public_read" on public.venues
  for select to anon, authenticated using (true);
create policy "parking_public_read" on public.venue_parking
  for select to anon, authenticated using (true);
create policy "menu_public_read" on public.venue_menu_highlights
  for select to anon, authenticated using (true);

create policy "itineraries_all_own" on public.itineraries
  for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

create policy "itinerary_stops_all_owner" on public.itinerary_stops
  for all to authenticated
  using (exists (
    select 1 from public.itineraries i
    where i.id = itinerary_id and i.user_id = (select auth.uid())
  ))
  with check (exists (
    select 1 from public.itineraries i
    where i.id = itinerary_id and i.user_id = (select auth.uid())
  ));

create policy "bookings_all_own" on public.bookings
  for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

create policy "passport_stamps_select_own" on public.passport_stamps
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "passport_stamps_insert_own" on public.passport_stamps
  for insert to authenticated with check ((select auth.uid()) = user_id);

create policy "achievements_all_own" on public.achievements
  for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

create policy "reviews_public_read" on public.reviews
  for select to anon, authenticated using (true);
create policy "reviews_insert_own" on public.reviews
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "reviews_update_own" on public.reviews
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "reviews_delete_own" on public.reviews
  for delete to authenticated using ((select auth.uid()) = user_id);

create policy "chat_select_relevant" on public.chat_messages
  for select to authenticated
  using (
    user_id = (select auth.uid())
    or room_type = 'community'
  );
create policy "chat_insert_own_or_community" on public.chat_messages
  for insert to authenticated
  with check (
    user_id = (select auth.uid())
    or (room_type = 'community' and role = 'community')
  );

create policy "favorites_all_own" on public.favorites
  for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

create policy "group_invites_all_owner" on public.group_invites
  for all to authenticated using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id);

create policy "ai_generation_log_insert_own" on public.ai_generation_log
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "ai_generation_log_select_own" on public.ai_generation_log
  for select to authenticated using ((select auth.uid()) = user_id);

create index if not exists venues_vibe_tags_idx on public.venues using gin (vibe_tags);
create index if not exists venues_cuisine_tags_idx on public.venues using gin (cuisine_tags);
create index if not exists itinerary_stops_itinerary_order_idx on public.itinerary_stops (itinerary_id, stop_order);
create index if not exists bookings_user_time_idx on public.bookings (user_id, booking_time desc);
create index if not exists reviews_venue_created_idx on public.reviews (venue_id, created_at desc);
create index if not exists chat_messages_venue_created_idx on public.chat_messages (venue_id, created_at desc);
