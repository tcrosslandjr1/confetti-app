-- Venue Menus & Pre-Order System
-- Businesses upload menu items; passengers select pre-orders during booking;
-- geofence fires pre-order to venue on arrival.

-- ============================================================
-- 1. Venue Menu Categories
-- ============================================================
create table if not exists public.venue_menu_categories (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid not null references public.venues(id) on delete cascade,
  name text not null,
  sort_order integer default 0,
  created_at timestamptz default now()
);

create index idx_venue_menu_categories_venue on public.venue_menu_categories(venue_id, sort_order);

-- ============================================================
-- 2. Venue Menu Items
-- ============================================================
create table if not exists public.venue_menu_items (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid not null references public.venues(id) on delete cascade,
  category_id uuid references public.venue_menu_categories(id) on delete set null,
  name text not null,
  description text,
  price_cents integer not null default 0,
  image_url text,
  is_available boolean default true,
  dietary_tags text[] default '{}',
  sort_order integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_venue_menu_items_venue on public.venue_menu_items(venue_id, sort_order);
create index idx_venue_menu_items_category on public.venue_menu_items(category_id);

-- ============================================================
-- 3. Booking Pre-Orders (passenger selections tied to a booking)
-- ============================================================
create table if not exists public.booking_pre_orders (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  venue_id uuid not null references public.venues(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'sent', 'confirmed', 'cancelled')),
  total_cents integer default 0,
  notes text,
  sent_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_booking_pre_orders_booking on public.booking_pre_orders(booking_id);
create index idx_booking_pre_orders_venue on public.booking_pre_orders(venue_id, status);

-- ============================================================
-- 4. Pre-Order Line Items
-- ============================================================
create table if not exists public.pre_order_items (
  id uuid primary key default gen_random_uuid(),
  pre_order_id uuid not null references public.booking_pre_orders(id) on delete cascade,
  menu_item_id uuid not null references public.venue_menu_items(id) on delete cascade,
  quantity integer not null default 1 check (quantity > 0),
  price_cents integer not null,
  special_instructions text,
  created_at timestamptz default now()
);

create index idx_pre_order_items_order on public.pre_order_items(pre_order_id);

-- ============================================================
-- RLS Policies
-- ============================================================

alter table public.venue_menu_categories enable row level security;
alter table public.venue_menu_items enable row level security;
alter table public.booking_pre_orders enable row level security;
alter table public.pre_order_items enable row level security;

-- Menu categories: business owners manage, everyone can view
create policy "venue_menu_categories_select" on public.venue_menu_categories
  for select using (true);

create policy "venue_menu_categories_manage" on public.venue_menu_categories
  for all using (
    venue_id in (select id from public.venues where claimed_by = auth.uid())
  );

-- Menu items: business owners manage, everyone can view available
create policy "venue_menu_items_select" on public.venue_menu_items
  for select using (true);

create policy "venue_menu_items_manage" on public.venue_menu_items
  for all using (
    venue_id in (select id from public.venues where claimed_by = auth.uid())
  );

-- Pre-orders: passengers see their own, venue owners see their venue's
create policy "booking_pre_orders_passenger" on public.booking_pre_orders
  for select using (user_id = auth.uid());

create policy "booking_pre_orders_insert" on public.booking_pre_orders
  for insert with check (user_id = auth.uid());

create policy "booking_pre_orders_venue" on public.booking_pre_orders
  for select using (
    venue_id in (select id from public.venues where claimed_by = auth.uid())
  );

create policy "booking_pre_orders_venue_update" on public.booking_pre_orders
  for update using (
    venue_id in (select id from public.venues where claimed_by = auth.uid())
  );

-- Pre-order items: visible to order owner and venue owner
create policy "pre_order_items_passenger" on public.pre_order_items
  for select using (
    pre_order_id in (select id from public.booking_pre_orders where user_id = auth.uid())
  );

create policy "pre_order_items_insert" on public.pre_order_items
  for insert with check (
    pre_order_id in (select id from public.booking_pre_orders where user_id = auth.uid())
  );

create policy "pre_order_items_venue" on public.pre_order_items
  for select using (
    pre_order_id in (
      select id from public.booking_pre_orders
      where venue_id in (select id from public.venues where claimed_by = auth.uid())
    )
  );
