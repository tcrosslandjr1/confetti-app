-- ============================================================
-- Phase 1 security hardening (audit 2026-05-19):
--   1. is_admin() helper backed by existing public.admin_users
--   2. Seed tcrosslandjr1@gmail.com as owner if missing
--   3. Add is_active to venues, status to events for RLS filtering
--   4. Tighten over-permissive RLS: venues, events, trending_venues,
--      confetti_fund, fund_transactions
--   5. Restrict resolve_login_identifier to authenticated callers
--      (closes anon username-enumeration)
-- ============================================================

-- ─── 1. is_admin() helper ──────────────────────────────────────────
-- Returns true when the calling user is an active admin/owner/manager/support.
-- SECURITY DEFINER so RLS policies don't recurse through admin_users.
create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.admin_users au
    where au.user_id = auth.uid()
      and au.status = 'active'
      and au.role in ('owner', 'manager', 'support')
  );
$$;

revoke all on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;

-- ─── 2. Seed the founding owner (idempotent) ───────────────────────
do $$
declare
  v_user_id uuid;
begin
  select id into v_user_id
  from auth.users
  where lower(email) = 'tcrosslandjr1@gmail.com'
  limit 1;

  if v_user_id is null then
    raise notice 'Skipping admin seed — tcrosslandjr1@gmail.com not yet in auth.users';
    return;
  end if;

  -- Ensure profile row exists (admin_users FK requires it).
  insert into public.profiles (id, full_name, email)
  values (v_user_id, 'Tyrone Crossland', 'tcrosslandjr1@gmail.com')
  on conflict (id) do nothing;

  insert into public.admin_users (user_id, role, status, risk_level)
  values (v_user_id, 'owner', 'active', 'low')
  on conflict (user_id) do update
    set role = 'owner',
        status = 'active',
        updated_at = now();
end$$;

-- ─── 3. Add visibility columns ─────────────────────────────────────
alter table public.venues
  add column if not exists is_active boolean not null default true;

alter table public.events
  add column if not exists status text not null default 'published'
    check (status in ('draft', 'published', 'cancelled', 'archived'));

create index if not exists venues_is_active_idx on public.venues (is_active);
create index if not exists events_status_start_idx on public.events (status, start_time desc);

-- ─── 4. Tighten RLS ────────────────────────────────────────────────

-- venues: no more USING (true) — must be active to be visible publicly.
drop policy if exists "venues_public_read" on public.venues;
create policy "venues_public_read" on public.venues
  for select to anon, authenticated
  using (is_active = true);

-- events: published-only for anonymous discovery.
-- Creators keep separate write/read access via events_creator_manage.
drop policy if exists "events_public_read" on public.events;
create policy "events_public_read" on public.events
  for select to anon, authenticated
  using (status = 'published');

-- trending_venues: must not be expired.
drop policy if exists "trending_public_read" on public.trending_venues;
create policy "trending_public_read" on public.trending_venues
  for select to anon, authenticated
  using (expires_at > now());

-- confetti_fund: admin-only read. Service role (cron, edge functions
-- running with service_role key) is always allowed by Supabase RLS.
drop policy if exists "Authenticated users can read fund" on public.confetti_fund;
drop policy if exists "confetti_fund_admin_read" on public.confetti_fund;
create policy "confetti_fund_admin_read" on public.confetti_fund
  for select to authenticated
  using (public.is_admin());

-- fund_transactions: drop the "or type = 'deposit'" leak; users see only
-- their own rows. Admins see everything via is_admin().
drop policy if exists "Users see own disbursements" on public.fund_transactions;
drop policy if exists "fund_transactions_user_or_admin_read" on public.fund_transactions;
create policy "fund_transactions_user_or_admin_read" on public.fund_transactions
  for select to authenticated
  using (user_id = auth.uid() or public.is_admin());

-- ─── 5. Close username-enumeration ─────────────────────────────────
-- Function is still callable by authenticated users (legitimate login flow),
-- but anonymous probing for "does this username exist?" is gone.
do $$
begin
  if exists (
    select 1
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname = 'resolve_login_identifier'
  ) then
    execute 'revoke execute on function public.resolve_login_identifier(text) from anon, public';
    execute 'grant execute on function public.resolve_login_identifier(text) to authenticated';
  end if;
end$$;
