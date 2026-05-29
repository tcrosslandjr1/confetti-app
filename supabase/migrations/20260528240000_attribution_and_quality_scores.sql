-- ─────────────────────────────────────────────────────────────────────────────
-- attribution_events: QR check-in, GPS, and manual venue attribution
-- venue_quality_scores: rolling 30-day engagement score per venue
-- Closes the feedback loop: engagement → quality score → recommendation reranking
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 1. attribution_events ─────────────────────────────────────────────────────

create table if not exists public.attribution_events (
  id                    uuid primary key default gen_random_uuid(),
  itinerary_id          text,                               -- confetti itinerary/loop id
  stop_id               text,                               -- itinerary stop id
  venue_id              text not null,                      -- venues.id or venue_intel.place_id
  venue_name            text,                               -- denormalised for dashboards
  user_id               uuid references auth.users(id) on delete set null,

  -- How we know the user went
  method                text not null default 'qr_scan'
    check (method in ('qr_scan', 'manual', 'gps_proximity', 'social_share')),

  -- Business proof fields
  party_size            integer,
  spend_tier            text check (spend_tier in ('low', 'medium', 'high')),
  dwell_minutes         integer,                            -- filled by checkout or session end

  -- Social amplification
  shared_to_social      boolean not null default false,
  share_platform        text,                               -- 'instagram', 'tiktok', etc.

  -- Confetti routing proof
  from_itinerary        boolean not null default true,
  confetti_referral_code text,                              -- unique per itinerary+stop

  -- City for dashboard filtering
  city_code             text,                               -- 'dc', 'nyc', 'la', etc.

  created_at            timestamptz not null default now()
);

create index if not exists idx_attribution_venue_id     on public.attribution_events (venue_id, created_at desc);
create index if not exists idx_attribution_itinerary    on public.attribution_events (itinerary_id);
create index if not exists idx_attribution_user_id      on public.attribution_events (user_id, created_at desc);
create index if not exists idx_attribution_city         on public.attribution_events (city_code, created_at desc);

alter table public.attribution_events enable row level security;

create policy "Users can read own attribution_events"
  on public.attribution_events for select
  using (auth.uid() = user_id);

create policy "Users can insert own attribution_events"
  on public.attribution_events for insert
  with check (auth.uid() = user_id);

create policy "Service role full access to attribution_events"
  on public.attribution_events for all
  using (auth.role() = 'service_role');


-- ── 2. venue_quality_scores ───────────────────────────────────────────────────

create table if not exists public.venue_quality_scores (
  venue_id              text primary key,
  venue_name            text,
  city_code             text,

  -- Component scores (0.0 – 1.0 each)
  completion_rate       real not null default 0.5,          -- completed visits / started
  avg_rating            real not null default 0.5,          -- from pick_signals ratings
  return_rate           real not null default 0.5,          -- repeat visitors within 90d
  dwell_score           real not null default 0.5,          -- dwell_minutes vs category avg
  social_share_rate     real not null default 0.0,          -- % visits that shared to social

  -- Composite (weighted average of components)
  quality_score         real not null default 0.5
    check (quality_score >= 0.0 and quality_score <= 1.0),

  -- Confidence (low until sample_size >= 10)
  sample_size           integer not null default 0,
  confidence            real not null default 0.0,

  -- Business dashboard totals (last 30 days)
  verified_visits_30d   integer not null default 0,
  total_party_size_30d  integer not null default 0,
  social_amplifications integer not null default 0,
  avg_dwell_minutes     real,

  -- Trending signal: visits spiking vs prior 7 days
  visit_velocity        real not null default 0.0,          -- +1.0 = 2× normal, -1.0 = half

  computed_at           timestamptz not null default now()
);

create index if not exists idx_quality_scores_city       on public.venue_quality_scores (city_code, quality_score desc);
create index if not exists idx_quality_scores_computed   on public.venue_quality_scores (computed_at desc);

alter table public.venue_quality_scores enable row level security;

create policy "Public read venue_quality_scores"
  on public.venue_quality_scores for select using (true);

create policy "Service role can write venue_quality_scores"
  on public.venue_quality_scores for all using (auth.role() = 'service_role');


-- ── 3. venue_business_metrics view (for partner dashboard) ───────────────────

create or replace view public.venue_business_metrics as
select
  ae.venue_id,
  ae.venue_name,
  ae.city_code,
  count(*)                                                  as total_attributed_visits,
  count(*) filter (where ae.created_at >= now() - interval '30 days')
                                                            as visits_last_30d,
  count(*) filter (where ae.created_at >= now() - interval '7 days')
                                                            as visits_last_7d,
  coalesce(sum(ae.party_size), 0)                          as total_guests_attributed,
  coalesce(avg(ae.dwell_minutes), 0)                       as avg_dwell_minutes,
  count(*) filter (where ae.shared_to_social = true)       as social_shares,
  count(*) filter (where ae.method = 'qr_scan')            as verified_checkins,
  count(distinct ae.user_id)                               as unique_visitors,
  -- Return rate: users who visited 2+ times
  count(distinct ae.user_id) filter (
    where ae.user_id in (
      select user_id from public.attribution_events ae2
      where ae2.venue_id = ae.venue_id
      group by user_id having count(*) >= 2
    )
  )                                                         as returning_visitors,
  vqs.quality_score,
  vqs.visit_velocity,
  max(ae.created_at)                                        as last_visit_at
from public.attribution_events ae
left join public.venue_quality_scores vqs on vqs.venue_id = ae.venue_id
group by ae.venue_id, ae.venue_name, ae.city_code, vqs.quality_score, vqs.visit_velocity;

-- Note: RLS on views inherits from underlying tables. Service role and
-- venue-specific partners will need separate access policies once partner
-- auth is wired. For now, service_role can query freely.
