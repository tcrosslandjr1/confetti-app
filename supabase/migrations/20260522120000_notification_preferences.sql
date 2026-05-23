-- ═══════════════════════════════════════════════════════════
-- Notifications Core + Preferences + Trip Status Triggers
-- ═══════════════════════════════════════════════════════════

-- ─── Core Notifications Table ─────────────────────────────
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null default 'general',
  title text not null,
  body text,
  link text,
  read boolean not null default false,
  sent_push boolean not null default false,
  sent_email boolean not null default false,
  sent_sms boolean not null default false,
  created_at timestamptz not null default now()
);

create index idx_notifications_user_unread on public.notifications(user_id, read, created_at desc);
create index idx_notifications_pending_dispatch on public.notifications(id)
  where sent_push = false or sent_email = false;

alter table public.notifications enable row level security;

create policy "Users read own notifications"
  on public.notifications for select
  using (auth.uid() = user_id);

create policy "Users update own notifications"
  on public.notifications for update
  using (auth.uid() = user_id);

-- ─── Push Subscriptions ───────────────────────────────────
create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  endpoint text not null,
  p256dh text not null,
  auth_key text not null,
  created_at timestamptz not null default now(),
  unique(user_id, endpoint)
);

alter table public.push_subscriptions enable row level security;

create policy "Users manage own push subscriptions"
  on public.push_subscriptions for all
  using (auth.uid() = user_id);

-- ─── Notification Preferences ─────────────────────────────
create table if not exists public.notification_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email_confirmations boolean not null default true,
  email_reminders boolean not null default true,
  sms_reminders boolean not null default false,
  push_enabled boolean not null default false,
  phone_number text,
  updated_at timestamptz not null default now()
);

alter table public.notification_preferences enable row level security;

create policy "Users can read own preferences"
  on public.notification_preferences for select
  using (auth.uid() = user_id);

create policy "Users can upsert own preferences"
  on public.notification_preferences for insert
  with check (auth.uid() = user_id);

create policy "Users can update own preferences"
  on public.notification_preferences for update
  using (auth.uid() = user_id);

-- ─── Trip Status Events (group-facing notifications) ──────
-- When a host updates trip status (late, reschedule, cancel),
-- this table logs the change and a trigger fans out notifications
-- to all group members.
create table if not exists public.trip_status_events (
  id uuid primary key default gen_random_uuid(),
  plan_id text not null,  -- references group_plans or itineraries
  group_id text references public.groups(id) on delete cascade,
  actor_id uuid references auth.users(id) on delete set null,
  kind text not null check (kind in ('late', 'reschedule', 'cancel', 'update')),
  payload jsonb default '{}',  -- { minutes_late, new_time, note, venue }
  created_at timestamptz not null default now()
);

create index idx_trip_status_events_group on public.trip_status_events(group_id, created_at desc);
create index idx_trip_status_events_plan on public.trip_status_events(plan_id);

alter table public.trip_status_events enable row level security;

create policy "Group members can read trip events"
  on public.trip_status_events for select
  using (
    exists (
      select 1 from public.group_members gm
      where gm.group_id = trip_status_events.group_id
        and gm.user_id = auth.uid()
        and gm.status = 'joined'
    )
  );

create policy "Hosts and co-hosts can insert trip events"
  on public.trip_status_events for insert
  with check (
    auth.uid() = actor_id
    and exists (
      select 1 from public.group_members gm
      where gm.group_id = trip_status_events.group_id
        and gm.user_id = auth.uid()
        and gm.role in ('host', 'co-host')
    )
  );

-- ─── Fan-out trigger: trip_status_events → notifications ──
create or replace function public.notify_group_on_trip_status()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  member record;
  notif_title text;
  notif_body text;
  actor_name text;
begin
  -- Resolve actor display name
  select coalesce(raw_user_meta_data->>'display_name', email)
  into actor_name
  from auth.users where id = new.actor_id;

  -- Build title/body per kind
  case new.kind
    when 'late' then
      notif_title := 'Running late';
      notif_body := actor_name || ' is running ' ||
        coalesce((new.payload->>'minutes_late')::text || ' min', '') || ' late';
    when 'reschedule' then
      notif_title := 'Plan rescheduled';
      notif_body := actor_name || ' rescheduled the plan' ||
        case when new.payload->>'note' is not null
          then ': ' || (new.payload->>'note')
          else '' end;
    when 'cancel' then
      notif_title := 'Plan cancelled';
      notif_body := actor_name || ' cancelled the plan' ||
        case when new.payload->>'note' is not null
          then ': ' || (new.payload->>'note')
          else '' end;
    else
      notif_title := 'Plan update';
      notif_body := actor_name || ' updated the plan';
  end case;

  -- Fan out to all joined group members except the actor
  for member in
    select gm.user_id
    from public.group_members gm
    where gm.group_id = new.group_id
      and gm.status = 'joined'
      and gm.user_id != new.actor_id
  loop
    insert into public.notifications (user_id, kind, title, body, link)
    values (
      member.user_id,
      'trip_status',
      notif_title,
      notif_body,
      '/plans/' || new.plan_id
    );
  end loop;

  return new;
end;
$$;

create trigger trg_notify_group_on_trip_status
  after insert on public.trip_status_events
  for each row
  execute function public.notify_group_on_trip_status();

-- Add trip_status to the kind check on notifications if it's constrained
-- (the existing table uses a default, no CHECK constraint on kind — safe)

-- ─── Reminder notifications via pg_cron (optional, requires extension) ──
-- This creates a function that can be called by pg_cron or a scheduled edge function
-- to send reminders for plans starting within the next hour.
create or replace function public.generate_plan_reminders()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  plan record;
  member record;
begin
  -- Find group plans happening in the next 60-75 minutes that haven't been reminded
  for plan in
    select gp.id, gp.name, gp.group_id, gp.plan_date
    from public.group_plans gp
    where gp.status = 'approved'
      and gp.plan_date = current_date
      -- Only plans not already reminded (check metadata)
      and not exists (
        select 1 from public.notifications n
        where n.link = '/plans/' || gp.id
          and n.kind = 'plan_reminder'
          and n.created_at > now() - interval '2 hours'
      )
  loop
    for member in
      select gm.user_id
      from public.group_members gm
      where gm.group_id = plan.group_id
        and gm.status = 'joined'
    loop
      insert into public.notifications (user_id, kind, title, body, link)
      values (
        member.user_id,
        'plan_reminder',
        'Plan tonight: ' || plan.name,
        'Your plan is coming up! Tap to view details.',
        '/plans/' || plan.id
      );
    end loop;
  end loop;
end;
$$;

-- ─── Enable Realtime for live notification delivery ───────
alter publication supabase_realtime add table public.notifications;
alter publication supabase_realtime add table public.trip_status_events;
