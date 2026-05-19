-- ============================================================
-- Cap refresh_trending_venues() to top 50 venues per city.
-- Original function scanned the entire venues table with no
-- bound — fine at small scale, will lock the DB once venues
-- grows past ~100k rows.
-- ============================================================

create or replace function public.refresh_trending_venues()
returns void as $$
declare
  job_id uuid;
begin
  insert into public.scheduled_job_ledger (id, job_name, status)
  values (gen_random_uuid(), 'refresh_trending_venues', 'started')
  returning id into job_id;

  delete from public.trending_venues where expires_at < now();

  with scored as (
    select
      v.id as venue_id,
      coalesce(v.city, 'Unknown') as city,
      coalesce(ci.checkin_count, 0) * 3
        + coalesce(fav.fav_count, 0) * 2
        + coalesce(bv.view_count, 0)
        + coalesce(bc.boost_strength, 0) * 2 as score,
      jsonb_build_object(
        'checkins_24h', coalesce(ci.checkin_count, 0),
        'favorites_7d', coalesce(fav.fav_count, 0),
        'views_24h', coalesce(bv.view_count, 0),
        'boost_strength', coalesce(bc.boost_strength, 0)
      ) as factors,
      v.category,
      row_number() over (
        partition by coalesce(v.city, 'Unknown')
        order by (
          coalesce(ci.checkin_count, 0) * 3
          + coalesce(fav.fav_count, 0) * 2
          + coalesce(bv.view_count, 0)
          + coalesce(bc.boost_strength, 0) * 2
        ) desc
      ) as rnk
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
    -- Skip venues with zero signal so we don't waste rows on
    -- the long tail of dormant places.
    where coalesce(ci.checkin_count, 0)
        + coalesce(fav.fav_count, 0)
        + coalesce(bv.view_count, 0)
        + coalesce(bc.boost_strength, 0) > 0
  )
  insert into public.trending_venues (venue_id, city, trend_score, trend_factors, category, rank_in_city)
  select venue_id, city, score, factors, category, rnk
  from scored
  where rnk <= 50
  on conflict do nothing;

  update public.scheduled_job_ledger
  set status = 'completed', completed_at = now()
  where id = job_id;

exception when others then
  update public.scheduled_job_ledger
  set status = 'failed', completed_at = now(), error_message = sqlerrm
  where id = job_id;
end;
$$ language plpgsql security definer;
