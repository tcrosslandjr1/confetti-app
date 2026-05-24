-- Schedule the plan reminders cron job to run every 15 minutes.
-- Calls the cron-plan-reminders edge function which checks for
-- itineraries starting within the next 2.5 hours and inserts
-- plan_reminder notifications (2h and 30min before).

select cron.schedule(
  'plan-reminders-every-15m',
  '*/15 * * * *',
  $$
  select
    net.http_post(
      url := current_setting('app.settings.supabase_url') || '/functions/v1/cron-plan-reminders',
      headers := jsonb_build_object(
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key'),
        'Content-Type', 'application/json'
      ),
      body := '{}'::jsonb
    );
  $$
);
