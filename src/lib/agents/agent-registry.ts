/**
 * Agent Registry & Communication Bus
 *
 * Central registry for all Confetti agents — tracks status, team membership,
 * last task, and provides the inter-agent messaging system.
 *
 * Two systems in one file:
 *  1. REGISTRY — every agent registers here, reports status, logs tasks
 *  2. COMMS BUS — agents post messages (handoffs, alerts, broadcasts)
 *     that show up in the live feed + kanban board on the Agent Control Center
 */

import { supabase as supabaseTyped } from "@/integrations/supabase/client";
// Loose-typed alias — these tables use string PKs and RPC helpers that the
// generated types do not capture cleanly.
const supabase = supabaseTyped as unknown as {
  from: (t: string) => any;
  rpc: (fn: string, args?: Record<string, unknown>) => Promise<unknown> & { catch: (cb: (e: unknown) => void) => Promise<unknown> };
};

// ═══════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════

export type AgentStatus = "active" | "idle" | "error" | "disabled";
export type AgentLayer = "frontend" | "backend";
export type MsgType = "task_handoff" | "status_update" | "alert" | "request" | "response" | "broadcast";
export type TaskStatus = "backlog" | "in_progress" | "review" | "done";
export type TaskPriority = "critical" | "high" | "medium" | "low";

export interface AgentTeam {
  id: string;
  name: string;
  icon: string;
  description: string;
  color: string;
  sort_order: number;
  agents: AgentRecord[];
}

export interface AgentRecord {
  id: string;
  name: string;
  description: string;
  team_id: string;
  layer: AgentLayer;
  status: AgentStatus;
  file_path: string;
  last_task: string | null;
  last_active: string | null;
  tasks_completed: number;
  error_count: number;
}

export interface AgentMessage {
  id: string;
  from_agent: string;
  to_agent: string | null;
  to_team: string | null;
  msg_type: MsgType;
  subject: string;
  body: string | null;
  metadata: Record<string, unknown>;
  read: boolean;
  created_at: string;
  // joined fields
  from_name?: string;
  to_name?: string;
  team_name?: string;
}

export interface AgentTask {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  assigned_to: string | null;
  created_by: string;
  team_id: string | null;
  due_at: string | null;
  completed_at: string | null;
  created_at: string;
  // joined
  assigned_name?: string;
  creator_name?: string;
}

export interface ControlCenterView {
  teams: AgentTeam[];
  totalAgents: number;
  activeAgents: number;
  errorAgents: number;
  recentMessages: AgentMessage[];
  taskBoard: {
    backlog: AgentTask[];
    in_progress: AgentTask[];
    review: AgentTask[];
    done: AgentTask[];
  };
}

// ═══════════════════════════════════════════════════════════
// In-memory fallback (mirrors orchestrator pattern)
// ═══════════════════════════════════════════════════════════

const memoryTeams = new Map<string, AgentTeam>();
const memoryAgents = new Map<string, AgentRecord>();
const memoryMessages: AgentMessage[] = [];
const memoryTasks: AgentTask[] = [];

// ═══════════════════════════════════════════════════════════
// Registry — Read
// ═══════════════════════════════════════════════════════════

export async function getTeamsWithAgents(): Promise<AgentTeam[]> {
  const { data: teams, error: tErr } = await supabase
    .from("agent_teams")
    .select("*")
    .order("sort_order");

  const { data: agents, error: aErr } = await supabase
    .from("agent_registry")
    .select("*")
    .order("name");

  if (tErr || aErr || !teams || !agents) {
    // fallback to memory
    return Array.from(memoryTeams.values());
  }

  return teams.map((t: any) => ({
    ...t,
    agents: agents.filter((a: any) => a.team_id === t.id),
  }));
}

export async function getAgent(agentId: string): Promise<AgentRecord | null> {
  const { data, error } = await supabase
    .from("agent_registry")
    .select("*")
    .eq("id", agentId)
    .single();

  if (error || !data) return memoryAgents.get(agentId) || null;
  return data as AgentRecord;
}

// ═══════════════════════════════════════════════════════════
// Registry — Write (agents report their own status)
// ═══════════════════════════════════════════════════════════

export async function reportStatus(
  agentId: string,
  status: AgentStatus,
  lastTask?: string
): Promise<void> {
  const update: Record<string, unknown> = {
    status,
    last_active: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  if (lastTask) {
    update.last_task = lastTask;
    if (status === "idle") {
      update.tasks_completed = supabase.rpc ? undefined : 0; // handled by raw SQL below
    }
  }

  const { error } = await supabase
    .from("agent_registry")
    .update(update)
    .eq("id", agentId);

  if (lastTask && !error) {
    // increment tasks_completed
    await supabase.rpc("increment_agent_tasks", { agent_id: agentId }).catch(() => {});
  }

  // memory fallback
  const mem = memoryAgents.get(agentId);
  if (mem) {
    mem.status = status;
    mem.last_active = new Date().toISOString();
    if (lastTask) {
      mem.last_task = lastTask;
      mem.tasks_completed += 1;
    }
  }
}

export async function reportError(agentId: string, errorMsg: string): Promise<void> {
  await supabase
    .from("agent_registry")
    .update({
      status: "error",
      last_task: `❌ ${errorMsg}`,
      last_active: new Date().toISOString(),
      error_count: supabase.rpc ? undefined : 0,
      updated_at: new Date().toISOString(),
    })
    .eq("id", agentId);

  await supabase.rpc("increment_agent_errors", { agent_id: agentId }).catch(() => {});
}

// ═══════════════════════════════════════════════════════════
// Comms Bus — Messages (Live Feed)
// ═══════════════════════════════════════════════════════════

export async function sendMessage(
  fromAgent: string,
  msg: {
    to_agent?: string;
    to_team?: string;
    msg_type: MsgType;
    subject: string;
    body?: string;
    metadata?: Record<string, unknown>;
  }
): Promise<void> {
  const row = {
    from_agent: fromAgent,
    to_agent: msg.to_agent || null,
    to_team: msg.to_team || null,
    msg_type: msg.msg_type,
    subject: msg.subject,
    body: msg.body || null,
    metadata: msg.metadata || {},
  };

  const { error } = await supabase.from("agent_messages").insert(row);

  if (error) {
    memoryMessages.unshift({
      id: crypto.randomUUID(),
      ...row,
      read: false,
      created_at: new Date().toISOString(),
    });
  }
}

export async function getRecentMessages(limit = 50): Promise<AgentMessage[]> {
  const { data, error } = await supabase
    .from("agent_messages")
    .select(`
      *,
      from_ref:agent_registry!agent_messages_from_agent_fkey(name),
      to_ref:agent_registry!agent_messages_to_agent_fkey(name),
      team_ref:agent_teams!agent_messages_to_team_fkey(name)
    `)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !data) return memoryMessages.slice(0, limit);

  return data.map((m: any) => ({
    ...m,
    from_name: m.from_ref?.name,
    to_name: m.to_ref?.name,
    team_name: m.team_ref?.name,
  }));
}

// ═══════════════════════════════════════════════════════════
// Comms Bus — Tasks (Kanban Board)
// ═══════════════════════════════════════════════════════════

export async function createTask(task: {
  title: string;
  description?: string;
  priority?: TaskPriority;
  assigned_to?: string;
  created_by: string;
  team_id?: string;
  due_at?: string;
}): Promise<string> {
  const row = {
    title: task.title,
    description: task.description || null,
    priority: task.priority || "medium",
    assigned_to: task.assigned_to || null,
    created_by: task.created_by,
    team_id: task.team_id || null,
    due_at: task.due_at || null,
  };

  const { data, error } = await supabase
    .from("agent_tasks")
    .insert(row)
    .select("id")
    .single();

  if (error || !data) {
    const id = crypto.randomUUID();
    memoryTasks.push({ id, ...row, status: "backlog", completed_at: null, created_at: new Date().toISOString() });
    return id;
  }
  return data.id;
}

export async function updateTaskStatus(taskId: string, status: TaskStatus): Promise<void> {
  const update: Record<string, unknown> = { status, updated_at: new Date().toISOString() };
  if (status === "done") update.completed_at = new Date().toISOString();

  await supabase.from("agent_tasks").update(update).eq("id", taskId);
}

export async function getTaskBoard(): Promise<ControlCenterView["taskBoard"]> {
  const { data, error } = await supabase
    .from("agent_tasks")
    .select(`
      *,
      assignee:agent_registry!agent_tasks_assigned_to_fkey(name),
      creator:agent_registry!agent_tasks_created_by_fkey(name)
    `)
    .order("created_at", { ascending: false })
    .limit(100);

  const tasks: AgentTask[] = (error || !data)
    ? memoryTasks
    : data.map((t: any) => ({
        ...t,
        assigned_name: t.assignee?.name,
        creator_name: t.creator?.name,
      }));

  return {
    backlog: tasks.filter((t) => t.status === "backlog"),
    in_progress: tasks.filter((t) => t.status === "in_progress"),
    review: tasks.filter((t) => t.status === "review"),
    done: tasks.filter((t) => t.status === "done"),
  };
}

// ═══════════════════════════════════════════════════════════
// Full Control Center View
// ═══════════════════════════════════════════════════════════

export async function getControlCenterView(): Promise<ControlCenterView> {
  const [teams, messages, taskBoard] = await Promise.all([
    getTeamsWithAgents(),
    getRecentMessages(50),
    getTaskBoard(),
  ]);

  const allAgents = teams.flatMap((t) => t.agents);

  return {
    teams,
    totalAgents: allAgents.length,
    activeAgents: allAgents.filter((a) => a.status === "active").length,
    errorAgents: allAgents.filter((a) => a.status === "error").length,
    recentMessages: messages,
    taskBoard,
  };
}

// ═══════════════════════════════════════════════════════════
// Demo seeder (for development)
// ═══════════════════════════════════════════════════════════

export async function seedControlCenterDemo(): Promise<void> {
  const demoMessages: Array<Parameters<typeof sendMessage>> = [
    ["chat_agent", { to_agent: "venue_discovery", msg_type: "task_handoff", subject: "User wants rooftop bars in Georgetown", body: "Mood: chill vibes, group of 4, budget $$" }],
    ["venue_discovery", { to_agent: "pipeline_ranking", msg_type: "task_handoff", subject: "12 venues found, sending for ranking", body: "Georgetown rooftop bars, filtered by rating > 4.0" }],
    ["pipeline_ranking", { to_agent: "pipeline_plangen", msg_type: "response", subject: "Top 5 ranked, sending to plan generator" }],
    ["pipeline_plangen", { to_agent: "pipeline_explainer", msg_type: "task_handoff", subject: "Itinerary built: 3 stops + twist moment", body: "Rooftop crawl with hidden speakeasy twist" }],
    ["pipeline_explainer", { to_agent: "chat_agent", msg_type: "response", subject: "Boarding pass ready — narrative written" }],
    ["finance", { to_team: "operations", msg_type: "alert", subject: "Stripe webhook delay detected", body: "Payment confirmations lagging 45s behind normal" }],
    ["support_queue", { to_agent: "orchestrator", msg_type: "request", subject: "Escalation: user can't redeem Confetti Fund", body: "Ticket #1847 — wallet pass not syncing" }],
    ["orchestrator", { to_agent: "wallet_pass", msg_type: "task_handoff", subject: "Investigate wallet sync failure for ticket #1847" }],
    ["legal_compliance", { msg_type: "broadcast", subject: "GDPR data request received — 30-day clock started", body: "User ID 9f3a... requested full data export" }],
    ["seo_aso", { to_team: "growth", msg_type: "status_update", subject: "App Store ranking improved: #47 → #31 in Lifestyle", body: "Keyword 'nightlife concierge' driving installs" }],
    ["emergency_controls", { msg_type: "broadcast", subject: "All systems green — no active incidents" }],
    ["automated_reports", { to_team: "operations", msg_type: "status_update", subject: "Daily digest generated: 847 active users, 12 plans created" }],
  ];

  for (const [from, msg] of demoMessages) {
    await sendMessage(from as string, msg as any);
  }

  // Demo tasks
  const demoTasks = [
    { title: "Investigate Stripe webhook delay", priority: "high" as TaskPriority, assigned_to: "finance", created_by: "admin_alerts", team_id: "business" },
    { title: "Resolve wallet sync — ticket #1847", priority: "critical" as TaskPriority, assigned_to: "wallet_pass", created_by: "orchestrator", team_id: "business" },
    { title: "Process GDPR data export request", priority: "high" as TaskPriority, assigned_to: "legal_compliance", created_by: "legal_compliance", team_id: "compliance" },
    { title: "A/B test new onboarding flow", priority: "medium" as TaskPriority, assigned_to: "feature_flags", created_by: "feedback_pipeline", team_id: "operations" },
    { title: "Update venue cache for DC metro area", priority: "low" as TaskPriority, assigned_to: "venue_discovery", created_by: "automated_reports", team_id: "ai_recs" },
    { title: "Write content for weekend events push", priority: "medium" as TaskPriority, assigned_to: "content_cms", created_by: "content_cms", team_id: "growth" },
  ];

  for (const task of demoTasks) {
    await createTask(task);
  }

  // Set some agents as active with last tasks
  const statusUpdates: [string, AgentStatus, string][] = [
    ["chat_agent", "active", "Handling user conversation — rooftop bars in Georgetown"],
    ["venue_discovery", "active", "Searching 12 venues in Georgetown area"],
    ["pipeline_ranking", "idle", "Ranked 5 venues for itinerary #382"],
    ["orchestrator", "active", "Running workflow: Wallet Sync Investigation"],
    ["finance", "active", "Monitoring Stripe webhook latency"],
    ["support_queue", "idle", "Escalated ticket #1847 to Orchestrator"],
    ["legal_compliance", "active", "Processing GDPR data export request"],
    ["seo_aso", "idle", "Updated App Store keyword rankings"],
    ["emergency_controls", "idle", "All systems green — last check 2 min ago"],
    ["automated_reports", "idle", "Generated daily digest for 2026-05-19"],
    ["admin_alerts", "active", "Monitoring 3 active alerts"],
    ["content_cms", "idle", "Published weekend events article"],
  ];

  for (const [id, status, task] of statusUpdates) {
    await reportStatus(id, status, task);
  }
}
