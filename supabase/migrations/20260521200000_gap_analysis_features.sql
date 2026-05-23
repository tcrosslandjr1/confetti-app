-- Gap Analysis Feature Migration
-- Adds: business hours, venue photos, waitlist, menus, event tiers, review responses

-- ============================================================
-- 1. Business hours per venue
-- ============================================================
create table if not exists public.venue_hours (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid not null references public.venues(id) on delete cascade,
  day_of_week smallint not null check (day_of_week between 0 and 6), -- 0=Sun
  open_time time not null,
  close_time time not null,
  is_closed boolean not null default false,
  unique (venue_id, day_of_week)
);

-- Add extra venue columns
alter table public.venues
  add column if not exists price_level smallint default 2 check (price_level between 1 and 4),
  add column if not exists phone text,
  add column if not exists website_url text,
  add column if not exists address text,
  add column if not exists latitude numeric(10,7),
  add column if not exists longitude numeric(10,7),
  add column if not exists description text,
  add column if not exists review_count integer not null default 0,
  add column if not exists is_claimed boolean not null default false;

-- ============================================================
-- 2. Venue photo gallery
-- ============================================================
create table if not exists public.venue_photos (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid not null references public.venues(id) on delete cascade,
  url text not null,
  caption text,
  uploaded_by uuid references public.profiles(id) on delete set null,
  is_primary boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_venue_photos_venue on public.venue_photos(venue_id, sort_order);

-- ============================================================
-- 3. Waitlist / notify-me
-- ============================================================
create table if not exists public.venue_waitlist (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid not null references public.venues(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  party_size integer not null default 2,
  preferred_date date,
  preferred_time time,
  status text not null default 'waiting' check (status in ('waiting','notified','seated','cancelled')),
  created_at timestamptz not null default now(),
  notified_at timestamptz
);

create index if not exists idx_waitlist_venue on public.venue_waitlist(venue_id, status);

-- ============================================================
-- 4. Menu management
-- ============================================================
create table if not exists public.venue_menus (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid not null references public.venues(id) on delete cascade,
  section_name text not null default 'Main',
  sort_order integer not null default 0
);

create table if not exists public.venue_menu_items (
  id uuid primary key default gen_random_uuid(),
  menu_id uuid not null references public.venue_menus(id) on delete cascade,
  name text not null,
  description text,
  price numeric(8,2),
  image_url text,
  dietary_tags text[] not null default '{}',
  is_popular boolean not null default false,
  is_available boolean not null default true,
  sort_order integer not null default 0
);

-- ============================================================
-- 5. Event tiers / multi-tier ticketing
-- ============================================================
create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid references public.venues(id) on delete set null,
  organizer_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  description text,
  category text not null default 'general',
  image_url text,
  starts_at timestamptz not null,
  ends_at timestamptz,
  city text,
  address text,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.event_ticket_tiers (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  name text not null,       -- e.g. 'General Admission', 'VIP', 'Table'
  description text,
  price numeric(8,2) not null default 0,
  capacity integer not null default 100,
  sold integer not null default 0,
  sort_order integer not null default 0
);

create table if not exists public.event_tickets (
  id uuid primary key default gen_random_uuid(),
  tier_id uuid not null references public.event_ticket_tiers(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  quantity integer not null default 1,
  total_paid numeric(8,2) not null default 0,
  status text not null default 'confirmed' check (status in ('confirmed','cancelled','refunded','checked_in')),
  confirmation_code text not null unique default encode(gen_random_bytes(6),'hex'),
  purchased_at timestamptz not null default now()
);

-- ============================================================
-- 6. Review responses (business owner replies)
-- ============================================================
alter table public.reviews
  add column if not exists helpful_count integer not null default 0,
  add column if not exists owner_response text,
  add column if not exists owner_response_at timestamptz;

-- ============================================================
-- 7. Booking enhancements
-- ============================================================
alter table public.bookings
  add column if not exists reminder_sent boolean not null default false,
  add column if not exists cancelled_at timestamptz,
  add column if not exists modified_at timestamptz,
  add column if not exists cancellation_reason text;

-- ============================================================
-- 8. Notification preferences
-- ============================================================
create table if not exists public.notification_preferences (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  email_confirmations boolean not null default true,
  email_reminders boolean not null default true,
  sms_reminders boolean not null default false,
  push_enabled boolean not null default true,
  phone_number text,
  updated_at timestamptz not null default now()
);

-- ============================================================
-- RLS policies
-- ============================================================
alter table public.venue_hours enable row level security;
alter table public.venue_photos enable row level security;
alter table public.venue_waitlist enable row level security;
alter table public.venue_menus enable row level security;
alter table public.venue_menu_items enable row level security;
alter table public.events enable row level security;
alter table public.event_ticket_tiers enable row level security;
alter table public.event_tickets enable row level security;
alter table public.notification_preferences enable row level security;

-- Public read for venue-related tables
create policy "venue_hours_read" on public.venue_hours for select using (true);
create policy "venue_photos_read" on public.venue_photos for select using (true);
create policy "venue_menus_read" on public.venue_menus for select using (true);
create policy "venue_menu_items_read" on public.venue_menu_items for select using (true);
create policy "events_read" on public.events for select using (is_published = true);
create policy "event_tiers_read" on public.event_ticket_tiers for select using (true);

-- User-scoped writes
create policy "waitlist_user" on public.venue_waitlist for all using (auth.uid() = user_id);
create policy "tickets_user" on public.event_tickets for all using (auth.uid() = user_id);
create policy "notif_prefs_user" on public.notification_preferences for all using (auth.uid() = user_id);

-- Event organizer management
create policy "events_organizer" on public.events for all using (auth.uid() = organizer_id);
