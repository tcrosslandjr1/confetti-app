-- ============================================================
-- Confetti Backend OS — Migration
-- Fills all gaps from the Backend OS architecture spec:
--   - Venue enhancements (address, city, music, dress code, etc.)
--   - Events table (venue happenings)
--   - Reels / short-form content table
--   - Corporate system (companies, teams, bookings)
--   - Trending venues cache
--   - Venue subscription tiers
--   - Agent run log (traces every AI pipeline execution)
--   - Scheduled job ledger
-- ============================================================

-- ─── 1. Venue Enhancements ─────────────────────────────────

alter table public.venues
  add column if not exists address text,
  add column if not exists city text,
  add column if not exists state text,
  add column if not exists country text not null default 'US',
  add column if not exists latitude numeric(10,7),
  add column if not exists longitude numeric(10,7),
  add column if not exists phone text,
  add column if not exists website text,
  add column if not exists music_type text,
  add column if not exists dress_code text,
  add column if not exists capacity integer,
  add column if not exists hours jsonb not null default '{}',
  add column if not exists subscription_tier text not null default 'free'
    check (subscription_tier in ('free', 'spotlight', 'boost', 'partner', 'enterprise')),
  add column if not exists corporate_friendly boolean not null default false,
  add column if not exists is_verified boolean not null default false,
  add column if not exists google_place_id text,
  add column if not exists foursquare_id text,
  add column if not exists description text,
  add column if not exists updated_at timestamptz not null default now();

create index if not exists venues_city_idx on public.venues (city);
create index if not exists venues_subscription_tier_idx on public.venues (subscription_tier);
create index if not exists venues_corporate_friendly_idx on public.venues (corporate_friendly) where corporate_friendly = true;
create index if not exists venues_location_idx on public.venues using gist (point(longitude, latitude));

-- ─── 2. Events Table ───────────────────────────────────────

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid not null references public.venues(id) on delete cascade,
  title text not null,
  description text,
  event_type text not null default 'one_time'
    check (event_type in ('one_time', 'recurring', 'series', 'popup')),
  start_time timestamptz not null,
  end_time timestamptz,
  recurring_rule jsonb,
  -- recurring_rule example:
  -- {"frequency": "weekly", "day": "friday", "until": "2026-12-31"}
  -- {"frequency": "monthly", "day_of_month": 1}
  tags text[] not null default '{}',
  vibe_tags text[] not null default '{}',
  cover_image_url text,
  ticket_url text,
  price_min numeric(8,2),
  price_max numeric(8,2),
  capacity integer,
  rsvp_count integer not null default 0,
  is_featured boolean not null default false,
  is_boosted boolean not null default false,
  boost_campaign_id text references public.boost_campaigns(id) on delete set null,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index events_venue_idx on public.events (venue_id);
create index events_start_time_idx on public.events (start_time);
create index events_type_idx on public.events (event_type);
create index events_tags_idx on public.events using gin (tags);
create index events_vibe_tags_idx on public.events using gin (vibe_tags);
create index events_featured_idx on public.events (is_featured) where is_featured = true;

-- ─── 3. Reels / Short-Form Content ────────────────────────

create table if not exists public.reels (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid references public.venues(id) on delete set null,
  uploaded_by uuid references public.profiles(id) on delete set null,
  url text not null,
  thumbnail_url text,
  platform text not null default 'confetti'
    check (platform in ('confetti', 'instagram', 'tiktok', 'youtube')),
  title text,
  description text,
  tags text[] not null default '{}',
  vibe text,
  duration_seconds integer,
  view_count integer not null default 0,
  like_count integer not null default 0,
  is_boosted boolean not null default false,
  boost_campaign_id text references public.boost_campaigns(id) on delete set null,
  is_featured boolean not null default false,
  status text not null default 'active'
    check (status in ('active', 'hidden', 'flagged', 'removed')),
  created_at timestamptz not null default now()
);

create index reels_venue_idx on public.reels (venue_id);
create index reels_platform_idx on public.reels (platform);
create index reels_tags_idx on public.reels using gin (tags);
create index reels_featured_idx on public.reels (is_featured) where is_featured = true;
create index reels_created_idx on public.reels (created_at desc);

-- ─── 4. Corporate Companies ────────────────────────────────

create table if not exists public.corporate_companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  domain text unique,
  logo_url text,
  primary_city text not null,
  primary_state text,
  industry text,
  employee_count integer,
  -- Policies govern what teams can book
  policies jsonb not null default '{
    "max_per_person_budget": 150,
    "require_approval_above": 100,
    "allowed_categories": [],
    "blocked_categories": [],
    "alcohol_policy": "allowed",
    "max_party_size": 20,
    "advance_booking_days": 14,
    "allowed_days": ["monday","tuesday","wednesday","thursday","friday"],
    "corporate_card_required": false
  }'::jsonb,
  billing_email text,
  billing_plan text not null default 'starter'
    check (billing_plan in ('starter', 'growth', 'enterprise')),
  monthly_credit_allowance numeric(10,2) not null default 0,
  credits_used_this_month numeric(10,2) not null default 0,
  is_active boolean not null default true,
  onboarding_step integer not null default 1,
  -- 1=company_setup, 2=admin, 3=policies, 4=teams,
  -- 5=venues, 6=first_outing, 7=approval, 8=reporting
  onboarding_completed boolean not null default false,
  owner_user_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index corporate_companies_city_idx on public.corporate_companies (primary_city);
create index corporate_companies_domain_idx on public.corporate_companies (domain);
create index corporate_companies_owner_idx on public.corporate_companies (owner_user_id);

-- ─── 5. Corporate Teams ────────────────────────────────────

create table if not exists public.corporate_teams (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.corporate_companies(id) on delete cascade,
  name text not null,
  description text,
  budget_per_person numeric(8,2) not null default 75,
  budget_used_this_month numeric(10,2) not null default 0,
  approval_required boolean not null default true,
  approver_user_id uuid references public.profiles(id) on delete set null,
  member_count integer not null default 0,
  preferred_vibes text[] not null default '{}',
  preferred_cuisines text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index corporate_teams_company_idx on public.corporate_teams (company_id);

-- ─── 6. Corporate Team Members ─────────────────────────────

create table if not exists public.corporate_team_members (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.corporate_teams(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null default 'member'
    check (role in ('admin', 'manager', 'member')),
  joined_at timestamptz not null default now(),
  unique (team_id, user_id)
);

create index corporate_team_members_team_idx on public.corporate_team_members (team_id);
create index corporate_team_members_user_idx on public.corporate_team_members (user_id);

-- ─── 7. Corporate Bookings ─────────────────────────────────

create table if not exists public.corporate_bookings (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.corporate_companies(id) on delete cascade,
  team_id uuid not null references public.corporate_teams(id) on delete cascade,
  plan_id uuid references public.itineraries(id) on delete set null,
  venue_id uuid references public.venues(id) on delete set null,
  requested_by uuid not null references public.profiles(id) on delete cascade,
  approved_by uuid references public.profiles(id) on delete set null,
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected', 'confirmed', 'completed', 'cancelled')),
  party_size integer not null default 1,
  scheduled_date date not null,
  scheduled_time time,
  estimated_cost numeric(10,2),
  actual_cost numeric(10,2),
  cost_per_person numeric(8,2),
  rejection_reason text,
  notes text,
  receipt_url text,
  policy_check jsonb not null default '{}',
  -- policy_check stores: {passed: bool, violations: [...], warnings: [...]}
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index corporate_bookings_company_idx on public.corporate_bookings (company_id);
create index corporate_bookings_team_idx on public.corporate_bookings (team_id);
create index corporate_bookings_status_idx on public.corporate_bookings (status);
create index corporate_bookings_date_idx on public.corporate_bookings (scheduled_date);
create index corporate_bookings_requested_by_idx on public.corporate_bookings (requested_by);

-- ─── 8. Trending Venues Cache ──────────────────────────────

create table if not exists public.trending_venues (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid not null references public.venues(id) on delete cascade,
  city text not null,
  trend_score numeric(6,2) not null default 0,
  -- trend_score computed from: recent check-ins, favorites, views,
  -- social mentions, booking velocity, review recency
  trend_factors jsonb not null default '{}',
  -- {checkins_24h: 45, favorites_7d: 120, views_24h: 890, ...}
  rank_in_city integer,
  category text,
  computed_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '1 hour')
);

create index trending_venues_city_score_idx on public.trending_venues (city, trend_score desc);
create index trending_venues_venue_idx on public.trending_venues (venue_id);
create index trending_venues_expiry_idx on public.trending_venues (expires_at);

-- ─── 9. Agent Run Log (AI Pipeline Tracing) ────────────────

create table if not exists public.agent_run_log (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references public.agent_sessions(id) on delete set null,
  user_id uuid not null references public.profiles(id) on delete cascade,
  pipeline_type text not null default 'recommendation'
    check (pipeline_type in ('recommendation', 'corporate', 'trip', 'chat')),
  -- Step-by-step trace of each agent in the pipeline
  steps jsonb not null default '[]',
  -- Each step: {
  --   agent: "ContextAgent",
  --   started_at: "...",
  --   completed_at: "...",
  --   input_summary: "...",
  --   output_summary: "...",
  --   tokens_used: 1234,
  --   model: "gpt-4o",
  --   latency_ms: 450
  -- }
  total_tokens integer not null default 0,
  total_latency_ms integer not null default 0,
  status text not null default 'running'
    check (status in ('running', 'completed', 'failed', 'timeout')),
  error_message text,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create index agent_run_log_user_idx on public.agent_run_log (user_id, created_at desc);
create index agent_run_log_session_idx on public.agent_run_log (session_id);
create index agent_run_log_status_idx on public.agent_run_log (status);

-- ─── 10. Scheduled Job Ledger ──────────────────────────────

create table if not exists public.scheduled_job_ledger (
  id uuid primary key default gen_random_uuid(),
  job_name text not null,
  -- job_name values:
  --   refresh_trending_venues, recalculate_business_boosts,
  --   reset_monthly_plans, expire_coupons, cleanup_stale_sessions
  status text not null default 'started'
    check (status in ('started', 'completed', 'failed')),
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  rows_affected integer,
  error_message text,
  metadata jsonb not null default '{}'
);

create index scheduled_job_ledger_name_idx on public.scheduled_job_ledger (job_name, started_at desc);
create index scheduled_job_ledger_status_idx on public.scheduled_job_ledger (status);

-- ═══════════════════════════════════════════════════════════
-- RLS Policies
-- ═══════════════════════════════════════════════════════════

-- Events: publicly readable, creators can manage
alter table public.events enable row level security;

create policy "events_public_read" on public.events
  for select using (true);

create policy "events_creator_manage" on public.events
  for all to authenticated
  using (created_by = (select auth.uid()))
  with check (created_by = (select auth.uid()));

-- Reels: publicly readable when active
alter table public.reels enable row level security;

create policy "reels_public_read" on public.reels
  for select using (status = 'active');

create policy "reels_uploader_manage" on public.reels
  for all to authenticated
  using (uploaded_by = (select auth.uid()))
  with check (uploaded_by = (select auth.uid()));

-- Corporate Companies: owner manages, members read
alter table public.corporate_companies enable row level security;

create policy "corporate_company_owner_manage" on public.corporate_companies
  for all to authenticated
  using (owner_user_id = (select auth.uid()))
  with check (owner_user_id = (select auth.uid()));

create policy "corporate_company_member_read" on public.corporate_companies
  for select to authenticated
  using (
    id in (
      select ct.company_id from public.corporate_teams ct
      join public.corporate_team_members ctm on ctm.team_id = ct.id
      where ctm.user_id = (select auth.uid())
    )
  );

-- Corporate Teams: company owner + team admin manage, members read
alter table public.corporate_teams enable row level security;

create policy "corporate_teams_company_owner" on public.corporate_teams
  for all to authenticated
  using (
    company_id in (
      select id from public.corporate_companies
      where owner_user_id = (select auth.uid())
    )
  );

create policy "corporate_teams_member_read" on public.corporate_teams
  for select to authenticated
  using (
    id in (
      select team_id from public.corporate_team_members
      where user_id = (select auth.uid())
    )
  );

-- Corporate Team Members
alter table public.corporate_team_members enable row level security;

create policy "team_members_company_owner" on public.corporate_team_members
  for all to authenticated
  using (
    team_id in (
      select ct.id from public.corporate_teams ct
      join public.corporate_companies cc on cc.id = ct.company_id
      where cc.owner_user_id = (select auth.uid())
    )
  );

create policy "team_members_self_read" on public.corporate_team_members
  for select to authenticated
  using (user_id = (select auth.uid()));

-- Corporate Bookings: requester + approver + company owner
alter table public.corporate_bookings enable row level security;

create policy "bookings_requester_manage" on public.corporate_bookings
  for all to authenticated
  using (requested_by = (select auth.uid()))
  with check (requested_by = (select auth.uid()));

create policy "bookings_approver_read" on public.corporate_bookings
  for select to authenticated
  using (
    approved_by = (select auth.uid())
    or team_id in (
      select id from public.corporate_teams
      where approver_user_id = (select auth.uid())
    )
  );

create policy "bookings_company_owner_all" on public.corporate_bookings
  for all to authenticated
  using (
    company_id in (
      select id from public.corporate_companies
      where owner_user_id = (select auth.uid())
    )
  );

-- Trending Venues: publicly readable
alter table public.trending_venues enable row level security;

create policy "trending_public_read" on public.trending_venues
  for select using (true);

-- Agent Run Log: users see own runs
alter table public.agent_run_log enable row level security;

create policy "agent_run_log_own" on public.agent_run_log
  for select to authenticated
  using (user_id = (select auth.uid()));

-- Scheduled Job Ledger: admin only (service_role writes, no public read)
alter table public.scheduled_job_ledger enable row level security;
-- No public policies — only service_role can read/write

-- ═══════════════════════════════════════════════════════════
-- Grants
-- ═══════════════════════════════════════════════════════════

grant select on public.events to anon, authenticated;
grant select, insert, update, delete on public.events to authenticated;

grant select on public.reels to anon, authenticated;
grant select, insert, update on public.reels to authenticated;

grant select, insert, update on public.corporate_companies to authenticated;
grant select, insert, update, delete on public.corporate_teams to authenticated;
grant select, insert, update, delete on public.corporate_team_members to authenticated;
grant select, insert, update on public.corporate_bookings to authenticated;

grant select on public.trending_venues to anon, authenticated;
grant select on public.agent_run_log to authenticated;

-- ═══════════════════════════════════════════════════════════
-- Functions — Scheduled Jobs
-- ═══════════════════════════════════════════════════════════

-- Refresh trending venues (called every 1 hour via pg_cron or Edge Function)
create or replace function public.refresh_trending_venues()
returns void as $$
declare
  job_id uuid;
begin
  -- Log job start
  insert into public.scheduled_job_ledger (id, job_name, status)
  values (gen_random_uuid(), 'refresh_trending_venues', 'started')
  returning id into job_id;

  -- Clear expired entries
  delete from public.trending_venues where expires_at < now();

  -- Recompute scores per city
  -- Score = check-ins(24h)*3 + favorites(7d)*2 + behavior_views(24h)*1 + boost_strength
  insert into public.trending_venues (venue_id, city, trend_score, trend_factors, category, rank_in_city)
  select
    v.id,
    coalesce(v.city, 'Unknown'),
    coalesce(ci.checkin_count, 0) * 3
      + coalesce(fav.fav_count, 0) * 2
      + coalesce(bv.view_count, 0)
      + coalesce(bc.boost_strength, 0) * 2
    as score,
    jsonb_build_object(
      'checkins_24h', coalesce(ci.checkin_count, 0),
      'favorites_7d', coalesce(fav.fav_count, 0),
      'views_24h', coalesce(bv.view_count, 0),
      'boost_strength', coalesce(bc.boost_strength, 0)
    ),
    v.category,
    row_number() over (
      partition by coalesce(v.city, 'Unknown')
      order by (
        coalesce(ci.checkin_count, 0) * 3
        + coalesce(fav.fav_count, 0) * 2
        + coalesce(bv.view_count, 0)
        + coalesce(bc.boost_strength, 0) * 2
      ) desc
    )
  from public.venues v
  left join lateral (
    select count(*) as checkin_count
    from public.user_checkins uc
    where uc.venue_id = v.id::text
      and uc.verified_at > now() - interval '24 hours'
  ) ci on true
  left join lateral (
    select count(*) as fav_count
    from public.favorites f
    where f.venue_id = v.id
      and f.created_at > now() - interval '7 days'
  ) fav on true
  left join lateral (
    select count(*) as view_count
    from public.user_behavior_events ube
    where ube.venue_id = v.id
      and ube.event_type = 'venue_view'
      and ube.created_at > now() - interval '24 hours'
  ) bv on true
  left join lateral (
    select max(bcamp.boost_strength) as boost_strength
    from public.boost_campaigns bcamp
    where bcamp.venue_id = v.id::text
      and bcamp.status = 'active'
  ) bc on true
  on conflict do nothing;

  -- Log job completion
  update public.scheduled_job_ledger
  set status = 'completed', completed_at = now()
  where id = job_id;

exception when others then
  update public.scheduled_job_ledger
  set status = 'failed', completed_at = now(), error_message = sqlerrm
  where id = job_id;
end;
$$ language plpgsql security definer;

-- Recalculate business boosts (called every 6 hours)
create or replace function public.recalculate_business_boosts()
returns void as $$
declare
  job_id uuid;
  affected integer := 0;
begin
  insert into public.scheduled_job_ledger (id, job_name, status)
  values (gen_random_uuid(), 'recalculate_business_boosts', 'started')
  returning id into job_id;

  -- End campaigns past their end_date
  update public.boost_campaigns
  set status = 'ended'
  where status = 'active'
    and end_date is not null
    and end_date < current_date;

  get diagnostics affected = row_count;

  -- Pause campaigns that exceeded their credit budget
  update public.boost_campaigns
  set status = 'paused'
  where status = 'active'
    and total_credits_spent >= daily_credit_budget * (current_date - start_date + 1);

  -- Deactivate expired coupons
  update public.coupons
  set is_active = false
  where is_active = true
    and expires_at is not null
    and expires_at < now();

  -- Expire unclaimed coupon redemptions
  update public.coupon_redemptions
  set status = 'expired'
  where status in ('available', 'claimed')
    and expires_at < now();

  update public.scheduled_job_ledger
  set status = 'completed', completed_at = now(),
      rows_affected = affected
  where id = job_id;

exception when others then
  update public.scheduled_job_ledger
  set status = 'failed', completed_at = now(), error_message = sqlerrm
  where id = job_id;
end;
$$ language plpgsql security definer;

-- Policy check function for corporate bookings
create or replace function public.check_corporate_booking_policy(
  p_company_id uuid,
  p_team_id uuid,
  p_estimated_cost numeric,
  p_party_size integer,
  p_scheduled_date date
)
returns jsonb as $$
declare
  company_policies jsonb;
  team_budget numeric;
  cost_per_person numeric;
  violations text[] := '{}';
  warnings text[] := '{}';
  day_name text;
begin
  select policies into company_policies
  from public.corporate_companies
  where id = p_company_id;

  select budget_per_person into team_budget
  from public.corporate_teams
  where id = p_team_id;

  cost_per_person := p_estimated_cost / greatest(p_party_size, 1);
  day_name := lower(to_char(p_scheduled_date, 'fmday'));

  -- Check per-person budget
  if cost_per_person > coalesce((company_policies->>'max_per_person_budget')::numeric, 999999) then
    violations := array_append(violations,
      format('Cost per person ($%s) exceeds max ($%s)',
        cost_per_person,
        company_policies->>'max_per_person_budget'));
  end if;

  -- Check team budget
  if cost_per_person > team_budget then
    warnings := array_append(warnings,
      format('Cost per person ($%s) exceeds team budget ($%s)',
        cost_per_person, team_budget));
  end if;

  -- Check party size
  if p_party_size > coalesce((company_policies->>'max_party_size')::integer, 100) then
    violations := array_append(violations,
      format('Party size (%s) exceeds max (%s)',
        p_party_size,
        company_policies->>'max_party_size'));
  end if;

  -- Check allowed days
  if company_policies->'allowed_days' is not null
     and not (company_policies->'allowed_days' ? day_name) then
    violations := array_append(violations,
      format('Bookings not allowed on %s', initcap(day_name)));
  end if;

  -- Check advance booking
  if p_scheduled_date - current_date > coalesce((company_policies->>'advance_booking_days')::integer, 365) then
    warnings := array_append(warnings, 'Booking exceeds advance booking window');
  end if;

  return jsonb_build_object(
    'passed', array_length(violations, 1) is null,
    'violations', to_jsonb(violations),
    'warnings', to_jsonb(warnings),
    'cost_per_person', cost_per_person,
    'requires_approval', cost_per_person > coalesce((company_policies->>'require_approval_above')::numeric, 0)
  );
end;
$$ language plpgsql security definer;
