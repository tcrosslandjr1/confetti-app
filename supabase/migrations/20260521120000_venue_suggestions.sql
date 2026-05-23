-- ============================================================
-- Venue Suggestions — Events, Experiences & Promotions
-- Migration: 20260521120000
-- ============================================================

-- ─── Enums ──────────────────────────────────────────────────
create type suggestion_type as enum ('event', 'experience', 'promo');
create type suggestion_status as enum ('draft', 'pending_review', 'active', 'expired', 'archived');

-- ─── Venue Suggestions ──────────────────────────────────────
create table if not exists venue_suggestions (
  id              uuid primary key default gen_random_uuid(),
  venue_id        text not null references venues(id) on delete cascade,
  type            suggestion_type not null,
  status          suggestion_status not null default 'draft',

  -- Content
  title           text not null,
  subtitle        text,
  description     text not null,
  image_url       text,
  tags            text[] default '{}',

  -- Scheduling
  starts_at       timestamptz,
  ends_at         timestamptz,
  recurring       boolean not null default false,
  recurrence_rule text,              -- iCal RRULE format (e.g. FREQ=WEEKLY;BYDAY=FR)
  timezone        text not null default 'America/New_York',

  -- Pricing / Promo details
  original_price  numeric(10,2),
  offer_price     numeric(10,2),
  discount_pct    smallint,           -- 0–100
  promo_code      text,
  redemption_url  text,
  capacity        int,
  rsvp_count      int not null default 0,

  -- Visibility & targeting
  target_moods    text[] default '{}',  -- maps to Confetti mood tags
  target_audience text[] default '{}',  -- e.g. ['couples','groups','solo']
  boost_level     smallint not null default 0,  -- 0=organic, 1=featured, 2=priority

  -- Metadata
  created_by      uuid,               -- auth.uid of venue manager
  approved_by     uuid,               -- admin who approved
  approved_at     timestamptz,
  metadata        jsonb default '{}',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- ─── Indexes ────────────────────────────────────────────────
create index idx_venue_suggestions_venue on venue_suggestions(venue_id);
create index idx_venue_suggestions_status on venue_suggestions(status);
create index idx_venue_suggestions_type on venue_suggestions(type);
create index idx_venue_suggestions_starts on venue_suggestions(starts_at);
create index idx_venue_suggestions_ends on venue_suggestions(ends_at);
create index idx_venue_suggestions_active on venue_suggestions(status, starts_at, ends_at)
  where status = 'active';

-- ─── Row Level Security ─────────────────────────────────────
alter table venue_suggestions enable row level security;

-- Venue managers can manage their own suggestions
create policy "Venue managers can insert own suggestions"
  on venue_suggestions for insert
  with check (
    created_by = auth.uid()
  );

create policy "Venue managers can update own suggestions"
  on venue_suggestions for update
  using (created_by = auth.uid());

create policy "Venue managers can read own suggestions"
  on venue_suggestions for select
  using (created_by = auth.uid());

-- All authenticated users can read active suggestions
create policy "Users can read active suggestions"
  on venue_suggestions for select
  using (
    status = 'active'
    and (starts_at is null or starts_at <= now())
    and (ends_at is null or ends_at > now())
  );

-- Admins can do everything
create policy "Admins full access to suggestions"
  on venue_suggestions for all
  using (
    exists (
      select 1 from auth.users
      where auth.users.id = auth.uid()
      and (auth.users.raw_user_meta_data->>'admin_level')::int >= 2
    )
  );

-- ─── Updated-at trigger ─────────────────────────────────────
create or replace function update_venue_suggestions_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_venue_suggestions_updated_at
  before update on venue_suggestions
  for each row execute function update_venue_suggestions_updated_at();

-- ─── Helper view: Tonight's active suggestions ──────────────
create or replace view tonight_suggestions as
select
  vs.*,
  v.name as venue_name,
  v.city as venue_city,
  v.neighborhood as venue_neighborhood,
  v.category as venue_category,
  v.hero_image_url as venue_image,
  v.rating as venue_rating,
  v.price_level as venue_price_level
from venue_suggestions vs
join venues v on v.id = vs.venue_id
where vs.status = 'active'
  and (vs.starts_at is null or vs.starts_at <= now() + interval '12 hours')
  and (vs.ends_at is null or vs.ends_at > now());
