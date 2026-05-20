
-- AGENT CONTROL CENTER SCHEMA
create table if not exists public.agent_teams (
  id text primary key,
  name text not null,
  icon text not null default '🤖',
  description text,
  color text not null default '#8b5cf6',
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.agent_registry (
  id text primary key,
  name text not null,
  description text not null default '',
  team_id text references public.agent_teams(id) on delete set null,
  layer text not null default 'backend' check (layer in ('frontend','backend')),
  status text not null default 'idle' check (status in ('active','idle','error','disabled')),
  file_path text not null default '',
  last_task text,
  last_active timestamptz,
  tasks_completed int not null default 0,
  error_count int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.agent_messages (
  id uuid primary key default gen_random_uuid(),
  from_agent text not null references public.agent_registry(id) on delete cascade,
  to_agent text references public.agent_registry(id) on delete set null,
  to_team text references public.agent_teams(id) on delete set null,
  msg_type text not null check (msg_type in ('task_handoff','status_update','alert','request','response','broadcast')),
  subject text not null,
  body text,
  metadata jsonb not null default '{}'::jsonb,
  read boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists agent_messages_created_idx on public.agent_messages(created_at desc);

create table if not exists public.agent_tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  status text not null default 'backlog' check (status in ('backlog','in_progress','review','done')),
  priority text not null default 'medium' check (priority in ('critical','high','medium','low')),
  assigned_to text references public.agent_registry(id) on delete set null,
  created_by text not null references public.agent_registry(id) on delete cascade,
  team_id text references public.agent_teams(id) on delete set null,
  due_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- RLS
alter table public.agent_teams enable row level security;
alter table public.agent_registry enable row level security;
alter table public.agent_messages enable row level security;
alter table public.agent_tasks enable row level security;

-- Authenticated users can read; only admins can write
do $$ begin
  create policy "agent_teams_read" on public.agent_teams for select to authenticated using (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "agent_teams_admin_write" on public.agent_teams for all to authenticated
    using (public.has_role(auth.uid(), 'admin'))
    with check (public.has_role(auth.uid(), 'admin'));
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "agent_registry_read" on public.agent_registry for select to authenticated using (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "agent_registry_admin_write" on public.agent_registry for all to authenticated
    using (public.has_role(auth.uid(), 'admin'))
    with check (public.has_role(auth.uid(), 'admin'));
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "agent_messages_read" on public.agent_messages for select to authenticated using (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "agent_messages_admin_write" on public.agent_messages for all to authenticated
    using (public.has_role(auth.uid(), 'admin'))
    with check (public.has_role(auth.uid(), 'admin'));
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "agent_tasks_read" on public.agent_tasks for select to authenticated using (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "agent_tasks_admin_write" on public.agent_tasks for all to authenticated
    using (public.has_role(auth.uid(), 'admin'))
    with check (public.has_role(auth.uid(), 'admin'));
exception when duplicate_object then null; end $$;

-- Helper RPCs
create or replace function public.increment_agent_tasks(agent_id text)
returns void language sql security definer set search_path = public as $$
  update public.agent_registry set tasks_completed = tasks_completed + 1, updated_at = now() where id = agent_id;
$$;

create or replace function public.increment_agent_errors(agent_id text)
returns void language sql security definer set search_path = public as $$
  update public.agent_registry set error_count = error_count + 1, updated_at = now() where id = agent_id;
$$;

-- SEED TEAMS + AGENTS (idempotent)
insert into public.agent_teams (id, name, icon, description, color, sort_order) values
  ('ai_recs', 'AI & Recommendations', '🧠', 'The intelligence layer — discovery, ranking, plan generation, explanation.', '#8b5cf6', 1),
  ('growth', 'Growth & Marketing', '📈', 'SEO, ASO, referrals, content, viral loops.', '#10b981', 2),
  ('business', 'Business & Finance', '💼', 'Payments, wallets, partners, subscriptions.', '#f59e0b', 3),
  ('operations', 'Operations', '⚙️', 'Reports, feature flags, support queue, monitoring.', '#3b82f6', 4),
  ('compliance', 'Compliance & Safety', '🛡️', 'Legal, GDPR, moderation, emergency controls.', '#ef4444', 5),
  ('orchestrator', 'Orchestrator', '🎼', 'Cross-team coordination and admin-facing voice.', '#ec4899', 6)
on conflict (id) do nothing;

insert into public.agent_registry (id, name, description, team_id, layer, status, file_path) values
  ('orchestrator', 'Orchestrator', 'Routes a raw user request through every Confetti agent.', 'orchestrator', 'backend', 'idle', 'src/lib/orchestrator.functions.ts'),
  ('chat_agent', 'Chat Agent', 'Front-of-house concierge that handles user conversations.', 'orchestrator', 'backend', 'idle', 'src/lib/agents/templates.ts'),
  ('venue_discovery', 'Venue Discovery', 'Searches and filters venues by city, vibe, and category.', 'ai_recs', 'backend', 'idle', 'src/lib/agents/v6-engines.ts'),
  ('pipeline_ranking', 'Pipeline · Ranking', 'Ranks venue candidates against the user profile.', 'ai_recs', 'backend', 'idle', 'src/lib/agents/templates.ts'),
  ('pipeline_plangen', 'Pipeline · Plan Generator', 'Builds the final 2–4 stop itinerary.', 'ai_recs', 'backend', 'idle', 'src/lib/generate-plan.functions.ts'),
  ('pipeline_explainer', 'Pipeline · Explainer', 'Writes the narrative / boarding pass copy.', 'ai_recs', 'backend', 'idle', 'src/lib/name-generator.server.ts'),
  ('personalization', 'Personalization', 'Learns user taste from signals and applies safety guards.', 'ai_recs', 'backend', 'idle', 'src/lib/agents/personalization.ts'),
  ('promo_agent', 'Promo Agent', 'Boosts and surfaces promoted venues.', 'growth', 'backend', 'idle', 'src/lib/agents/promo-agent.ts'),
  ('seo_aso', 'SEO / ASO', 'App store + web SEO tracking.', 'growth', 'backend', 'idle', 'src/lib/share-analytics.ts'),
  ('content_cms', 'Content CMS', 'Publishes editorial content and event pushes.', 'growth', 'frontend', 'idle', 'src/lib/event-pack-data.ts'),
  ('referrals_agent', 'Referrals', 'Manages referral codes and rewards.', 'growth', 'backend', 'idle', 'src/lib/referrals.ts'),
  ('finance', 'Finance', 'Stripe, payouts, credits, subscription state.', 'business', 'backend', 'idle', 'src/lib/checkout.functions.ts'),
  ('wallet_pass', 'Wallet Pass', 'Apple / Google wallet pass issuance.', 'business', 'backend', 'idle', 'src/lib/apple-invite.ts'),
  ('vendor_connect', 'Vendor Connect', 'Onboards partner venues and tracks status.', 'business', 'backend', 'idle', 'src/lib/vendor-connect.functions.ts'),
  ('promoter_marketplace', 'Promoter Marketplace', 'Three-sided influencer engine.', 'business', 'backend', 'idle', 'src/lib/promoter.functions.ts'),
  ('automated_reports', 'Automated Reports', 'Daily digests and KPI snapshots.', 'operations', 'backend', 'idle', 'src/lib/partner-stats.functions.ts'),
  ('feature_flags', 'Feature Flags', 'A/B tests and rollout toggles.', 'operations', 'backend', 'idle', 'src/lib/launch-checklist.ts'),
  ('support_queue', 'Support Queue', 'Handles inbound support tickets.', 'operations', 'backend', 'idle', 'src/lib/booking-notifications.functions.ts'),
  ('admin_alerts', 'Admin Alerts', 'Sends real-time alerts to the admin console.', 'operations', 'backend', 'idle', 'src/lib/admin-audit.functions.ts'),
  ('emergency_controls', 'Emergency Controls', 'Kill switches and incident response.', 'compliance', 'backend', 'idle', 'src/lib/admin-audit.functions.ts'),
  ('legal_compliance', 'Legal & Compliance', 'GDPR, ToS, data export requests.', 'compliance', 'backend', 'idle', 'src/lib/admin-audit.functions.ts'),
  ('moderation', 'Moderation', 'Reviews flagged content and venues.', 'compliance', 'backend', 'idle', 'src/lib/moderation.functions.ts')
on conflict (id) do nothing;
