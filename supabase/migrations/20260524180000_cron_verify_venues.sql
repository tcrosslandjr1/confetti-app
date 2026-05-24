-- Nightly venue web/social-presence verification.
-- Hits the venue-discovery-agent edge function in verify_existing mode,
-- which drains a batch of un-verified rows on each call. Scheduled
-- every 15 minutes between 04:00 and 06:00 UTC so a busy queue gets
-- drained gradually without one massive job.

-- Required extensions (no-ops if already present on the project).
create extension if not exists pg_cron;
create extension if not exists pg_net;

-- Helper that pg_cron calls. Keeps the URL / auth in one place so the
-- schedule line stays short. Uses the project's SUPABASE_URL (set as a
-- cron secret) or falls back to a hardcoded ref. Cron-internal calls
-- don't need the admin PIN — venue-discovery-agent is deployed
-- --no-verify-jwt and the action is idempotent.
create or replace function public.cron_verify_venues_tick()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  endpoint text := 'https://zfeckvxkulreyapadanf.supabase.co/functions/v1/venue-discovery-agent';
  body jsonb := '{"mode":"verify_existing","batchSize":40}'::jsonb;
begin
  perform net.http_post(
    url := endpoint,
    headers := jsonb_build_object('Content-Type', 'application/json'),
    body := body,
    timeout_milliseconds := 60000
  );
end;
$$;

-- Unschedule any prior version of this job so re-runs are idempotent.
do $$
declare j record;
begin
  for j in select jobid from cron.job where jobname like 'verify-venues-%' loop
    perform cron.unschedule(j.jobid);
  end loop;
end$$;

-- Schedule: every 15 minutes between 04:00 and 06:00 UTC (one batch of 40
-- per tick, 9 ticks/night → ~360 venues drained nightly).
select cron.schedule(
  'verify-venues-04-00',
  '0 4 * * *',
  $$select public.cron_verify_venues_tick();$$
);
select cron.schedule(
  'verify-venues-04-15',
  '15 4 * * *',
  $$select public.cron_verify_venues_tick();$$
);
select cron.schedule(
  'verify-venues-04-30',
  '30 4 * * *',
  $$select public.cron_verify_venues_tick();$$
);
select cron.schedule(
  'verify-venues-04-45',
  '45 4 * * *',
  $$select public.cron_verify_venues_tick();$$
);
select cron.schedule(
  'verify-venues-05-00',
  '0 5 * * *',
  $$select public.cron_verify_venues_tick();$$
);
select cron.schedule(
  'verify-venues-05-15',
  '15 5 * * *',
  $$select public.cron_verify_venues_tick();$$
);
select cron.schedule(
  'verify-venues-05-30',
  '30 5 * * *',
  $$select public.cron_verify_venues_tick();$$
);
select cron.schedule(
  'verify-venues-05-45',
  '45 5 * * *',
  $$select public.cron_verify_venues_tick();$$
);
select cron.schedule(
  'verify-venues-06-00',
  '0 6 * * *',
  $$select public.cron_verify_venues_tick();$$
);
