-- Add venue booking notification columns
alter table venues
  add column if not exists staff_email text,
  add column if not exists claimed_by uuid references auth.users(id),
  add column if not exists advertiser_id uuid references advertisers(id);

-- Add user_signals table for orchestrator telemetry
create table if not exists user_signals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id),
  signal_type text not null,
  payload jsonb default '{}',
  city text,
  created_at timestamptz default now()
);

alter table user_signals enable row level security;

create policy "Users can insert own signals"
  on user_signals for insert
  to authenticated
  with check (user_id = auth.uid());
