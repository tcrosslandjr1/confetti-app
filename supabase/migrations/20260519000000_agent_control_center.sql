-- ============================================================
-- Agent Control Center — Teams, Registry, Comms, Tasks
-- Migration: 20260519000000
-- ============================================================

-- ─── Agent Teams ────────────────────────────────────────────
create table if not exists agent_teams (
  id            text primary key,
  name          text not null,
  icon          text not null default '⚙️',
  description   text,
  color         text not null default '#6366f1',
  sort_order    int not null default 0,
  created_at    timestamptz not null default now()
);

-- ─── Agent Registry ─────────────────────────────────────────
create type agent_status as enum ('active', 'idle', 'error', 'disabled');
create type agent_layer as enum ('frontend', 'backend');

create table if not exists agent_registry (
  id            text primary key,
  name          text not null,
  description   text,
  team_id       text not null references agent_teams(id),
  layer         agent_layer not null default 'frontend',
  status        agent_status not null default 'idle',
  file_path     text,
  last_task     text,
  last_active   timestamptz,
  tasks_completed bigint not null default 0,
  error_count   bigint not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index idx_agent_registry_team on agent_registry(team_id);
create index idx_agent_registry_status on agent_registry(status);

-- ─── Agent Messages (Live Feed / Comms Hub) ─────────────────
create type agent_msg_type as enum ('task_handoff', 'status_update', 'alert', 'request', 'response', 'broadcast');

create table if not exists agent_messages (
  id            uuid primary key default gen_random_uuid(),
  from_agent    text not null references agent_registry(id),
  to_agent      text references agent_registry(id),  -- null = broadcast
  to_team       text references agent_teams(id),      -- null = not team-targeted
  msg_type      agent_msg_type not null default 'status_update',
  subject       text not null,
  body          text,
  metadata      jsonb default '{}',
  read          boolean not null default false,
  created_at    timestamptz not null default now()
);

create index idx_agent_messages_from on agent_messages(from_agent);
create index idx_agent_messages_to on agent_messages(to_agent);
create index idx_agent_messages_created on agent_messages(created_at desc);

-- ─── Agent Tasks (Kanban Board) ─────────────────────────────
create type agent_task_status as enum ('backlog', 'in_progress', 'review', 'done');
create type agent_task_priority as enum ('critical', 'high', 'medium', 'low');

create table if not exists agent_tasks (
  id            uuid primary key default gen_random_uuid(),
  title         text not null,
  description   text,
  status        agent_task_status not null default 'backlog',
  priority      agent_task_priority not null default 'medium',
  assigned_to   text references agent_registry(id),
  created_by    text not null references agent_registry(id),
  team_id       text references agent_teams(id),
  due_at        timestamptz,
  completed_at  timestamptz,
  metadata      jsonb default '{}',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index idx_agent_tasks_status on agent_tasks(status);
create index idx_agent_tasks_assigned on agent_tasks(assigned_to);
create index idx_agent_tasks_team on agent_tasks(team_id);

-- ─── Seed Teams ─────────────────────────────────────────────
insert into agent_teams (id, name, icon, description, color, sort_order) values
  ('ai_recs',     'AI & Recommendations', '🧠', 'Core AI pipeline — chat, discovery, personalization, itinerary generation', '#8b5cf6', 1),
  ('operations',  'Operations',           '⚙️', 'Workflow orchestration, alerts, emergency controls, support, reporting',      '#f59e0b', 2),
  ('business',    'Business & Finance',   '💰', 'Payments, subscriptions, pricing, partnerships, venue portal',               '#10b981', 3),
  ('ux',          'User Experience',      '👥', 'Group collaboration, community features, identity verification',             '#3b82f6', 4),
  ('growth',      'Growth',               '📈', 'Content, SEO/ASO, marketing automation',                                     '#ec4899', 5),
  ('compliance',  'Compliance',           '🛡️', 'Legal, GDPR, DMCA, data governance',                                        '#ef4444', 6);

-- ─── Seed Agent Registry ────────────────────────────────────
insert into agent_registry (id, name, description, team_id, layer, file_path) values
  -- AI & Recommendations (frontend)
  ('ai_provider',          'AI Provider',          'Multi-model LLM engine (GPT-4o, mini)',           'ai_recs',    'frontend', 'src/lib/agents/ai-provider.ts'),
  ('chat_agent',           'Chat Agent',           'User-facing conversational AI',                   'ai_recs',    'frontend', 'src/lib/agents/chat-agent.ts'),
  ('venue_discovery',      'Venue Discovery',      'Location-based venue search & filtering',         'ai_recs',    'frontend', 'src/lib/agents/venue-discovery.ts'),
  ('user_intelligence',    'User Intelligence',    'Taste profiling & behavior analysis',             'ai_recs',    'frontend', 'src/lib/agents/user-intelligence.ts'),
  ('trip_planner',         'Trip Planner',         'Multi-city trip itinerary generation',            'ai_recs',    'frontend', 'src/lib/agents/trip-planner.ts'),
  ('itinerary_orch',       'Itinerary Orchestrator','Itinerary building & coordination',              'ai_recs',    'frontend', 'src/lib/agents/itinerary-orchestrator.ts'),
  ('interaction_tracker',  'Interaction Tracker',  'Implicit learning signal collection',             'ai_recs',    'frontend', 'src/lib/agents/interaction-tracker.ts'),
  -- AI & Recommendations (backend pipeline)
  ('pipeline_context',     'Context Agent',        'Assembles user context for recommendations',      'ai_recs',    'backend',  'supabase/functions/ai-pipeline/agents/context.ts'),
  ('pipeline_filter',      'Filter Rules Agent',   'Venue filtering logic & constraints',             'ai_recs',    'backend',  'supabase/functions/ai-pipeline/agents/filter-rules.ts'),
  ('pipeline_ranking',     'Ranking Agent',        'Score-based venue ranking',                       'ai_recs',    'backend',  'supabase/functions/ai-pipeline/agents/ranking.ts'),
  ('pipeline_plangen',     'Plan Generator Agent', 'Builds itinerary JSON from ranked venues',        'ai_recs',    'backend',  'supabase/functions/ai-pipeline/agents/plan-generator.ts'),
  ('pipeline_explainer',   'Explainer Agent',      'Writes narrative + boarding pass text',           'ai_recs',    'backend',  'supabase/functions/ai-pipeline/agents/explainer.ts'),
  ('pipeline_corporate',   'Corporate Planner',    'Corporate event planning specialist',             'ai_recs',    'backend',  'supabase/functions/ai-pipeline/agents/corporate-planner.ts'),
  -- Operations
  ('orchestrator',         'Orchestrator',         'Workflow engine — the Gear Train',                'operations', 'frontend', 'src/lib/agents/orchestrator.ts'),
  ('admin_alerts',         'Admin Alerts',         'Unified notification nerve center',               'operations', 'frontend', 'src/lib/agents/admin-alerts.ts'),
  ('emergency_controls',   'Emergency Controls',   'Kill switches, circuit breakers, incidents',      'operations', 'frontend', 'src/lib/agents/emergency-controls.ts'),
  ('support_queue',        'Support Queue',        'Ticket triage & AI-assisted responses',           'operations', 'frontend', 'src/lib/agents/support-queue.ts'),
  ('automated_reports',    'Automated Reports',    'Daily digests & anomaly detection',               'operations', 'frontend', 'src/lib/agents/automated-reports.ts'),
  ('feature_flags',        'Feature Flags',        'Rollout management & experimentation',            'operations', 'frontend', 'src/lib/agents/feature-flags.ts'),
  ('feedback_pipeline',    'Feedback Pipeline',    'User feedback triage & routing',                  'operations', 'frontend', 'src/lib/agents/feedback-pipeline.ts'),
  -- Business & Finance
  ('finance',              'Finance',              'Transactions, refunds, payouts, fraud detection', 'business',   'frontend', 'src/lib/agents/finance.ts'),
  ('boost_credits',        'Boost Credits',        'Business campaigns & user subscriptions',         'business',   'frontend', 'src/lib/agents/boost-credits.ts'),
  ('wallet_pass',          'Wallet Pass',          'Apple/Google Wallet, Confetti Fund',              'business',   'frontend', 'src/lib/agents/wallet-pass.ts'),
  ('pricing',              'Pricing',              'Plans, experiments, promo codes',                 'business',   'frontend', 'src/lib/agents/pricing.ts'),
  ('business_portal',      'Business Portal',      'Venue owner self-serve portal',                  'business',   'frontend', 'src/lib/agents/business-portal.ts'),
  ('partnerships',         'Partnerships',         'Partner pipeline CRM & outreach',                'business',   'frontend', 'src/lib/agents/partnerships.ts'),
  -- User Experience
  ('group_collab',         'Group Collab',         'Party rooms, group voting, planning',            'ux',         'frontend', 'src/lib/agents/group-collab.ts'),
  ('community',            'Community',            'Shared plans, reviews, reputation',              'ux',         'frontend', 'src/lib/agents/community.ts'),
  ('identity_verification','Identity Verification','Document review, KYC flows',                     'ux',         'frontend', 'src/lib/agents/identity-verification.ts'),
  -- Growth
  ('content_cms',          'Content CMS',          'Content calendar & publishing',                  'growth',     'frontend', 'src/lib/agents/content-cms.ts'),
  ('seo_aso',              'SEO/ASO',              'Keyword tracking & store optimization',          'growth',     'frontend', 'src/lib/agents/seo-aso.ts'),
  -- Compliance
  ('legal_compliance',     'Legal Compliance',     'GDPR, DMCA, data requests',                     'compliance', 'frontend', 'src/lib/agents/legal-compliance.ts');

-- ─── RLS Policies ───────────────────────────────────────────
alter table agent_teams enable row level security;
alter table agent_registry enable row level security;
alter table agent_messages enable row level security;
alter table agent_tasks enable row level security;

-- Allow authenticated reads for admin
create policy "Admins can read agent_teams" on agent_teams for select using (true);
create policy "Admins can read agent_registry" on agent_registry for select using (true);
create policy "Admins can read agent_messages" on agent_messages for select using (true);
create policy "Admins can read agent_tasks" on agent_tasks for select using (true);
create policy "Admins can manage agent_tasks" on agent_tasks for all using (true);
create policy "Admins can manage agent_messages" on agent_messages for all using (true);
create policy "System can update agent_registry" on agent_registry for all using (true);
