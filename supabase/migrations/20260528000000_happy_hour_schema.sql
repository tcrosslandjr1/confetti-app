-- ============================================================
-- Confetti DMV Happy Hour Module — Schema
-- Migration: 20260528000000
-- Extends existing venues table with happy hour intelligence
-- ============================================================

-- ─── DMV Neighborhoods ─────────────────────────────────────
-- Maps zones to metro areas for routing + geo queries
create table if not exists dmv_neighborhoods (
  id            text primary key,
  name          text not null,
  slug          text not null unique,
  metro_area    text not null check (metro_area in ('DC', 'MD', 'VA')),
  zone_label    text,              -- e.g. "Capitol Hill & Navy Yard"
  lat_center    double precision,
  lng_center    double precision,
  walkability   int default 3 check (walkability between 1 and 5),
  parking_ease  int default 3 check (parking_ease between 1 and 5),
  metro_access  boolean default false,
  metro_lines   text[] default '{}',  -- e.g. ARRAY['Green','Navy']
  peak_days     text[] default '{}',  -- e.g. ARRAY['Thu','Fri']
  vibe_summary  text,
  created_at    timestamptz not null default now()
);

create index idx_dmv_neighborhoods_metro on dmv_neighborhoods(metro_area);
create index idx_dmv_neighborhoods_slug on dmv_neighborhoods(slug);

-- ─── Happy Hour Vibe Tags ──────────────────────────────────
-- Canonical tag list for happy hour contexts specifically
create table if not exists happy_hour_vibe_tags (
  tag           text primary key,
  display_label text not null,
  category      text not null check (category in ('mood', 'crowd', 'setting', 'drink_style', 'occasion')),
  emoji         text,
  sort_order    int default 0,
  created_at    timestamptz not null default now()
);

-- ─── Happy Hour Deals ──────────────────────────────────────
-- The core table: what's the deal, when, where, how good
create table if not exists happy_hour_deals (
  id              uuid primary key default gen_random_uuid(),
  venue_id        text not null references venues(id) on delete cascade,
  neighborhood_id text references dmv_neighborhoods(id),

  -- Deal details
  deal_name       text not null,         -- "Half-Price Oysters & $8 Martinis"
  deal_summary    text not null,         -- Agent-friendly one-liner
  drink_specials  jsonb default '[]',    -- [{name, price, type, original_price}]
  food_specials   jsonb default '[]',    -- [{name, price, type, original_price}]
  restrictions    text,                  -- "Bar seating only" / "Dine-in only"

  -- Schedule
  days_active     text[] not null default '{}',  -- ARRAY['Mon','Tue','Wed','Thu','Fri']
  start_time      time not null,                 -- 15:00
  end_time        time not null,                 -- 19:00
  is_all_day      boolean default false,
  seasonal_notes  text,                          -- "Summer patio special" / "Winter only"

  -- Pricing intelligence
  avg_savings_pct int,                   -- estimated % off regular prices
  price_floor     numeric(6,2),          -- cheapest item during HH
  price_ceiling   numeric(6,2),          -- most expensive HH item
  two_person_est  numeric(6,2),          -- what a couple typically spends

  -- Vibe context
  vibe_tags       text[] default '{}',
  crowd_level     int check (crowd_level between 1 and 5),  -- 1=empty, 5=packed
  noise_level     int check (noise_level between 1 and 5),
  best_for        text[] default '{}',   -- ARRAY['date','after-work','group','solo']
  seating_type    text[] default '{}',   -- ARRAY['bar','patio','booth','communal']

  -- Quality signals
  is_verified     boolean default false,
  confidence      text default 'medium' check (confidence in ('high', 'medium', 'low')),
  last_verified   timestamptz,
  data_source     text,                  -- 'manual', 'enrichment', 'user_report'

  -- Learning fields (mirroring venues pattern)
  times_shown     int default 0,
  times_clicked   int default 0,
  times_redeemed  int default 0,
  avg_rating      double precision,
  popularity_score double precision default 0,

  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- Indexes for agent queries
create index idx_hh_deals_venue on happy_hour_deals(venue_id);
create index idx_hh_deals_neighborhood on happy_hour_deals(neighborhood_id);
create index idx_hh_deals_days on happy_hour_deals using gin(days_active);
create index idx_hh_deals_vibes on happy_hour_deals using gin(vibe_tags);
create index idx_hh_deals_best_for on happy_hour_deals using gin(best_for);
create index idx_hh_deals_time_range on happy_hour_deals(start_time, end_time);
create index idx_hh_deals_popularity on happy_hour_deals(popularity_score desc);
create index idx_hh_deals_verified on happy_hour_deals(is_verified) where is_verified = true;

-- ─── Happy Hour Itinerary Templates ────────────────────────
-- Pre-built multi-stop routes the Routing Agent can customize
create table if not exists happy_hour_itinerary_templates (
  id              text primary key,
  name            text not null,
  slug            text not null unique,
  tagline         text not null,           -- "From Oysters to Nightcaps"
  description     text not null,
  metro_area      text not null check (metro_area in ('DC', 'MD', 'VA', 'DMV')),
  neighborhood_ids text[] default '{}',    -- ordered list of neighborhoods
  occasion        text not null,           -- 'after-work', 'date-night', 'group-crawl', 'solo-explorer'
  mood            text,                    -- maps to Confetti mood system
  duration_hours  numeric(3,1) default 3,
  stop_count      int default 3 check (stop_count between 2 and 6),
  stops           jsonb not null default '[]',  -- [{venue_id, order, duration_min, transition_note}]
  vibe_arc        text[] default '{}',     -- e.g. ARRAY['chill-start','energy-build','nightcap']
  best_days       text[] default '{}',
  budget_range    text,                    -- "$40–$80 per person"
  pro_tip         text,                    -- insider note
  is_active       boolean default true,
  created_at      timestamptz not null default now()
);

create index idx_hh_templates_metro on happy_hour_itinerary_templates(metro_area);
create index idx_hh_templates_occasion on happy_hour_itinerary_templates(occasion);
create index idx_hh_templates_active on happy_hour_itinerary_templates(is_active) where is_active = true;

-- ─── Happy Hour Feedback (extends venue_feedback pattern) ──
create table if not exists happy_hour_feedback (
  id              uuid primary key default gen_random_uuid(),
  deal_id         uuid not null references happy_hour_deals(id) on delete cascade,
  user_id         uuid not null,
  action          text not null check (action in ('shown', 'clicked', 'redeemed', 'rated', 'reported_stale')),
  rating          int check (rating between 1 and 5),
  context         jsonb default '{}',   -- {day_of_week, time, group_size, occasion}
  notes           text,
  created_at      timestamptz not null default now()
);

create index idx_hh_feedback_deal on happy_hour_feedback(deal_id);
create index idx_hh_feedback_user on happy_hour_feedback(user_id);

-- ─── Trigger: Update deal popularity after feedback ────────
create or replace function update_hh_deal_popularity()
  returns trigger as $$
begin
  update happy_hour_deals set
    times_shown = times_shown + (case when NEW.action = 'shown' then 1 else 0 end),
    times_clicked = times_clicked + (case when NEW.action = 'clicked' then 1 else 0 end),
    times_redeemed = times_redeemed + (case when NEW.action = 'redeemed' then 1 else 0 end),
    avg_rating = (
      select avg(rating)::double precision from happy_hour_feedback
      where deal_id = NEW.deal_id and rating is not null
    ),
    popularity_score = (
      (times_clicked + 1.0) / (times_shown + 2.0) * 100
    ),
    updated_at = now()
  where id = NEW.deal_id;
  return NEW;
end;
$$ language plpgsql;

create trigger trg_hh_feedback_update
  after insert on happy_hour_feedback
  for each row
  execute function update_hh_deal_popularity();

-- ─── RLS Policies ──────────────────────────────────────────
alter table happy_hour_deals enable row level security;
alter table happy_hour_feedback enable row level security;
alter table dmv_neighborhoods enable row level security;
alter table happy_hour_vibe_tags enable row level security;
alter table happy_hour_itinerary_templates enable row level security;

-- Public read for all HH content
create policy "Anyone can read neighborhoods"
  on dmv_neighborhoods for select using (true);

create policy "Anyone can read vibe tags"
  on happy_hour_vibe_tags for select using (true);

create policy "Anyone can read active deals"
  on happy_hour_deals for select using (true);

create policy "Anyone can read active templates"
  on happy_hour_itinerary_templates for select
  using (is_active = true);

-- Authenticated users can leave feedback
create policy "Authenticated users can insert feedback"
  on happy_hour_feedback for insert
  with check (auth.uid() = user_id);

create policy "Users can read own feedback"
  on happy_hour_feedback for select
  using (auth.uid() = user_id);

-- Admin full access
create policy "Admins full access deals"
  on happy_hour_deals for all
  using (
    exists (
      select 1 from auth.users
      where auth.users.id = auth.uid()
      and (auth.users.raw_user_meta_data->>'admin_level')::int >= 2
    )
  );

create policy "Admins full access templates"
  on happy_hour_itinerary_templates for all
  using (
    exists (
      select 1 from auth.users
      where auth.users.id = auth.uid()
      and (auth.users.raw_user_meta_data->>'admin_level')::int >= 2
    )
  );
