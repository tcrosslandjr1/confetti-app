-- ═══════════════════════════════════════════════════════════
-- Group Collaboration Tables
-- Supports company teams, friend groups, family circles, custom
-- ═══════════════════════════════════════════════════════════

-- ─── Groups ──────────────────────────────────────────────────
create table if not exists public.groups (
  id text primary key,
  name text not null,
  type text not null check (type in ('company', 'friends', 'family', 'custom')),
  emoji text default '🎯',
  created_by uuid references auth.users(id) on delete set null,
  invite_code text unique not null,
  settings jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

create index idx_groups_invite_code on public.groups(invite_code);
create index idx_groups_created_by on public.groups(created_by);

-- ─── Group Members ───────────────────────────────────────────
create table if not exists public.group_members (
  id text primary key,
  group_id text references public.groups(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  display_name text not null,
  role text not null default 'member' check (role in ('host', 'co-host', 'member')),
  status text not null default 'invited' check (status in ('invited', 'joined', 'declined')),
  categories text[] default '{}',
  joined_at timestamptz,
  created_at timestamptz default now(),
  unique(group_id, user_id)
);

create index idx_group_members_group on public.group_members(group_id);
create index idx_group_members_user on public.group_members(user_id);

-- ─── Group Plans ─────────────────────────────────────────────
create table if not exists public.group_plans (
  id text primary key,
  group_id text references public.groups(id) on delete cascade,
  name text not null,
  subtitle text,
  emoji text default '🎯',
  status text not null default 'drafting' check (status in ('drafting', 'voting', 'refining', 'approved', 'completed')),
  plan_date date,
  consensus_score integer default 0,
  total_votes integer default 0,
  created_at timestamptz default now()
);

create index idx_group_plans_group on public.group_plans(group_id);
create index idx_group_plans_status on public.group_plans(status);

-- ─── Group Plan Stops ────────────────────────────────────────
create table if not exists public.group_plan_stops (
  id text primary key,
  plan_id text references public.group_plans(id) on delete cascade,
  venue_data jsonb not null,
  stop_order integer not null,
  duration integer default 60,
  note text,
  score integer default 0,
  created_at timestamptz default now()
);

create index idx_group_plan_stops_plan on public.group_plan_stops(plan_id);

-- ─── Group Votes ─────────────────────────────────────────────
create table if not exists public.group_votes (
  id uuid primary key default gen_random_uuid(),
  stop_id text references public.group_plan_stops(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  display_name text not null,
  vote text not null check (vote in ('up', 'down', 'neutral')),
  voted_at timestamptz default now(),
  unique(stop_id, user_id)
);

create index idx_group_votes_stop on public.group_votes(stop_id);
create index idx_group_votes_user on public.group_votes(user_id);

-- ─── RLS Policies ────────────────────────────────────────────
alter table public.groups enable row level security;
alter table public.group_members enable row level security;
alter table public.group_plans enable row level security;
alter table public.group_plan_stops enable row level security;
alter table public.group_votes enable row level security;

-- Groups: members can read, creator can update
create policy "Group members can read groups"
  on public.groups for select
  using (
    id in (
      select group_id from public.group_members
      where user_id = auth.uid() and status = 'joined'
    )
  );

create policy "Creator can manage group"
  on public.groups for all
  using (created_by = auth.uid());

-- Members: group members can read all members
create policy "Members can read group members"
  on public.group_members for select
  using (
    group_id in (
      select group_id from public.group_members gm
      where gm.user_id = auth.uid() and gm.status = 'joined'
    )
  );

create policy "Users can manage own membership"
  on public.group_members for all
  using (user_id = auth.uid());

-- Plans: group members can read and create
create policy "Members can read group plans"
  on public.group_plans for select
  using (
    group_id in (
      select group_id from public.group_members
      where user_id = auth.uid() and status = 'joined'
    )
  );

create policy "Members can create group plans"
  on public.group_plans for insert
  with check (
    group_id in (
      select group_id from public.group_members
      where user_id = auth.uid() and status = 'joined'
    )
  );

-- Stops: tied to plan access
create policy "Members can read plan stops"
  on public.group_plan_stops for select
  using (
    plan_id in (
      select id from public.group_plans
      where group_id in (
        select group_id from public.group_members
        where user_id = auth.uid() and status = 'joined'
      )
    )
  );

-- Votes: members can vote
create policy "Members can vote"
  on public.group_votes for all
  using (user_id = auth.uid());

create policy "Members can read votes"
  on public.group_votes for select
  using (
    stop_id in (
      select id from public.group_plan_stops
      where plan_id in (
        select id from public.group_plans
        where group_id in (
          select group_id from public.group_members
          where user_id = auth.uid() and status = 'joined'
        )
      )
    )
  );
