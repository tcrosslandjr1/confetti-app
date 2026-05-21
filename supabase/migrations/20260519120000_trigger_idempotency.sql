-- ============================================================
-- Phase 2.4 — Idempotency log for database-trigger webhooks.
-- Each trigger function uses INSERT ON CONFLICT DO NOTHING with
-- (trigger_name, event_id) so replays / retries from Supabase's
-- webhook layer don't double-charge or duplicate side effects.
-- ============================================================

create table if not exists public.processed_trigger_events (
  trigger_name text not null,
  event_id text not null,
  processed_at timestamptz not null default now(),
  primary key (trigger_name, event_id)
);

alter table public.processed_trigger_events enable row level security;
-- No public policies — only service_role can read/write.

create index if not exists processed_trigger_events_processed_at_idx
  on public.processed_trigger_events (processed_at);

-- Periodic cleanup so the table doesn't grow unbounded.
create or replace function public.gc_processed_trigger_events()
returns void
language sql
security definer
set search_path = public
as $$
  delete from public.processed_trigger_events
  where processed_at < now() - interval '30 days';
$$;

revoke all on function public.gc_processed_trigger_events() from public, anon, authenticated;
grant execute on function public.gc_processed_trigger_events() to service_role;
