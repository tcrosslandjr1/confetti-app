create table if not exists public.admin_users (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'manager', 'support', 'member')),
  status text not null default 'active' check (status in ('active', 'review', 'suspended', 'disabled')),
  risk_level text not null default 'low' check (risk_level in ('low', 'medium', 'high')),
  invited_by uuid references public.profiles(id) on delete set null,
  last_seen_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.admin_activity_log (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references public.profiles(id) on delete set null,
  target_user_id uuid references public.profiles(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id text,
  severity text not null default 'info' check (severity in ('info', 'success', 'warning', 'critical')),
  metadata jsonb not null default '{}',
  ip_address inet,
  user_agent text,
  created_at timestamptz not null default now()
);

alter table public.admin_users enable row level security;
alter table public.admin_activity_log enable row level security;

grant select, insert, update on public.admin_users to authenticated;
grant select, insert on public.admin_activity_log to authenticated;

create policy "admin_users_owner_read" on public.admin_users
  for select to authenticated
  using (exists (
    select 1 from public.admin_users au
    where au.user_id = (select auth.uid())
      and au.role = 'owner'
      and au.status = 'active'
  ));

create policy "admin_users_owner_insert" on public.admin_users
  for insert to authenticated
  with check (exists (
    select 1 from public.admin_users au
    where au.user_id = (select auth.uid())
      and au.role = 'owner'
      and au.status = 'active'
  ));

create policy "admin_users_owner_update" on public.admin_users
  for update to authenticated
  using (exists (
    select 1 from public.admin_users au
    where au.user_id = (select auth.uid())
      and au.role = 'owner'
      and au.status = 'active'
  ))
  with check (exists (
    select 1 from public.admin_users au
    where au.user_id = (select auth.uid())
      and au.role = 'owner'
      and au.status = 'active'
  ));

create policy "activity_log_owner_read" on public.admin_activity_log
  for select to authenticated
  using (exists (
    select 1 from public.admin_users au
    where au.user_id = (select auth.uid())
      and au.role = 'owner'
      and au.status = 'active'
  ));

create policy "activity_log_admin_insert" on public.admin_activity_log
  for insert to authenticated
  with check (exists (
    select 1 from public.admin_users au
    where au.user_id = (select auth.uid())
      and au.role in ('owner', 'manager', 'support')
      and au.status = 'active'
  ));

create index if not exists admin_users_role_status_idx on public.admin_users (role, status);
create index if not exists admin_activity_log_created_idx on public.admin_activity_log (created_at desc);
create index if not exists admin_activity_log_actor_idx on public.admin_activity_log (actor_user_id, created_at desc);
create index if not exists admin_activity_log_target_idx on public.admin_activity_log (target_user_id, created_at desc);
