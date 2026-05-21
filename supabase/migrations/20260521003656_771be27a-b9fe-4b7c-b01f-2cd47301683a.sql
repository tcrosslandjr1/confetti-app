
create table if not exists public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  kind text not null,
  severity text not null default 'normal' check (severity in ('low','normal','high','urgent')),
  summary text not null,
  details text,
  target_user_id uuid,
  target_email text,
  status text not null default 'open' check (status in ('open','in_progress','resolved','dismissed')),
  opened_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.support_tickets enable row level security;
create policy "admins manage support tickets" on public.support_tickets
  for all to authenticated
  using (public.has_role(auth.uid(),'admin'))
  with check (public.has_role(auth.uid(),'admin'));
create trigger support_tickets_touch before update on public.support_tickets
  for each row execute function public.set_updated_at();

create table if not exists public.pending_admin_actions (
  id uuid primary key default gen_random_uuid(),
  action_type text not null check (action_type in (
    'password_reset','resend_confirmation','unlock_user','sign_out_user','set_user_role'
  )),
  params jsonb not null default '{}'::jsonb,
  summary text not null,
  status text not null default 'pending' check (status in ('pending','approved','executed','rejected','failed')),
  proposed_by uuid,
  approved_by uuid,
  executed_at timestamptz,
  result jsonb,
  error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.pending_admin_actions enable row level security;
create policy "admins manage pending actions" on public.pending_admin_actions
  for all to authenticated
  using (public.has_role(auth.uid(),'admin'))
  with check (public.has_role(auth.uid(),'admin'));
create trigger pending_admin_actions_touch before update on public.pending_admin_actions
  for each row execute function public.set_updated_at();
create index if not exists pending_admin_actions_status_idx on public.pending_admin_actions(status, created_at desc);
