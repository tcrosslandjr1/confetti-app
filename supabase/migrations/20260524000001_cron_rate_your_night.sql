-- Schedule the "Rate Your Night" nudge cron job to run daily at 9:00 AM UTC.
-- Calls the cron-rate-your-night edge function which finds yesterday's
-- unrated itineraries and inserts rate_your_night notifications.

select cron.schedule(
  'rate-your-night-daily-9am',
  '0 9 * * *',
  $$
  select
    net.http_post(
      url := current_setting('app.settings.supabase_url') || '/functions/v1/cron-rate-your-night',
      headers := jsonb_build_object(
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key'),
        'Content-Type', 'application/json'
      ),
      body := '{}'::jsonb
    );
  $$
);
