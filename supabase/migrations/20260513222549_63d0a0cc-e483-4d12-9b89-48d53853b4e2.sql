create table public.pick_signals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  kind text not null check (kind in ('mood','swap_reason','recap_note')),
  value text not null,
  context jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index pick_signals_user_kind_idx on public.pick_signals (user_id, kind, created_at desc);

alter table public.pick_signals enable row level security;

create policy "own pick_signals insert"
  on public.pick_signals for insert to authenticated
  with check (auth.uid() = user_id);

create policy "own pick_signals read"
  on public.pick_signals for select
  using (auth.uid() = user_id or has_role(auth.uid(), 'admin'::app_role));