/**
 * Admin Alerts Agent — The Dashboard Nerve Center
 *
 * Unified notification hub that aggregates alerts from EVERY agent into a
 * single pane of glass. While the Orchestrator manages workflow-gate alerts,
 * this agent handles the broader picture: tax deadlines, user issues,
 * investor action items, compliance flags, finance approvals, security
 * incidents, and anything else that needs Tyrone's eyeballs.
 *
 * Think of it as the oil-can indicator panel — every blinking light on the
 * dashboard comes through here, whether it's from a running workflow or a
 * standalone agent that needs human attention.
 *
 * Alert lifecycle:
 *  1. Any agent calls `pushAlert()` to drop an alert
 *  2. Alert appears on the admin dashboard grouped by category + priority
 *  3. Tyrone acknowledges → optionally triggers an orchestrator event
 *  4. Dismissed alerts move to history with a reason
 *
 * Integration points:
 *  - Orchestrator gate alerts auto-sync here via `syncGateAlerts()`
 *  - Standalone alerts from any agent via `pushAlert()`
 *  - Scheduled digests via `generateDigest()`
 *  - Smart bundling: related alerts auto-group to reduce noise
 */

import { supabase } from "../supabase";

// ═══════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════

export type AlertPriority = "critical" | "high" | "medium" | "low" | "info";

export type AlertCategory =
  | "finance"
  | "tax"
  | "legal"
  | "security"
  | "user_issue"
  | "content"
  | "partnership"
  | "investor"
  | "system"
  | "compliance"
  | "support"
  | "marketing"
  | "onboarding"
  | "general";

export type AlertStatus = "active" | "acknowledged" | "snoozed" | "dismissed" | "auto_resolved";

export type AlertSource =
  | "orchestrator_gate" // synced from workflow human gates
  | "support_queue"
  | "content_cms"
  | "feature_flags"
  | "feedback_pipeline"
  | "seo_aso"
  | "automated_reports"
  | "finance"
  | "legal_compliance"
  | "partnerships"
  | "pricing"
  | "emergency_controls"
  | "identity_verification"
  | "boost_credits"
  | "community"
  | "user_intelligence"
  | "chat_agent"
  | "wallet_pass"
  | "system"
  | "cron"
  | "manual";

export interface AdminAlert {
  id: string;
  title: string;
  description: string;
  priority: AlertPriority;
  category: AlertCategory;
  source: AlertSource;
  status: AlertStatus;

  // Linkage
  sourceId?: string; // ID in the originating agent (ticket ID, refund ID, etc.)
  workflowInstanceId?: string; // if tied to an orchestrator workflow
  gateAlertId?: string; // if synced from an orchestrator gate

  // Action
  actionRequired: string; // what Tyrone needs to do ("Approve refund", "Review tax filing")
  actionUrl?: string; // deep link to the relevant admin page
  actionData?: Record<string, unknown>; // payload passed when acknowledging

  // Timing
  createdAt: string;
  updatedAt: string;
  acknowledgedAt?: string;
  acknowledgedBy?: string;
  snoozedUntil?: string;
  deadlineAt?: string; // when this becomes overdue
  autoResolveAt?: string; // auto-dismiss if unacknowledged by this time

  // Resolution
  dismissReason?: string;
  resolvedNote?: string;

  // Bundling
  bundleKey?: string; // alerts with same bundleKey get grouped
  bundleCount?: number; // how many raw alerts are in this bundle

  // Metadata
  metadata?: Record<string, unknown>;
}

export interface AlertBundle {
  bundleKey: string;
  category: AlertCategory;
  priority: AlertPriority;
  alerts: AdminAlert[];
  count: number;
  latestAt: string;
  oldestAt: string;
  title: string;
}

export interface AlertDigest {
  id: string;
  generatedAt: string;
  period: "daily" | "weekly";
  summary: string;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  infoCount: number;
  topItems: AdminAlert[];
  overdueItems: AdminAlert[];
  resolvedSinceLastDigest: number;
  newSinceLastDigest: number;
}

export interface AlertFilter {
  category?: AlertCategory;
  priority?: AlertPriority;
  status?: AlertStatus;
  source?: AlertSource;
  search?: string;
  fromDate?: string;
  toDate?: string;
  overdueOnly?: boolean;
}

export interface AlertStats {
  total: number;
  active: number;
  acknowledged: number;
  snoozed: number;
  dismissed: number;
  autoResolved: number;
  overdue: number;
  byCategory: Record<AlertCategory, number>;
  byPriority: Record<AlertPriority, number>;
  avgAcknowledgeMinutes: number;
  oldestUnacknowledged?: AdminAlert;
}

export interface AdminDashboardView {
  stats: AlertStats;
  criticalAlerts: AdminAlert[];
  overdueAlerts: AdminAlert[];
  recentAlerts: AdminAlert[];
  bundles: AlertBundle[];
  snoozedCount: number;
  nextDeadline?: AdminAlert;
}

// ═══════════════════════════════════════════════════════════
// In-Memory Stores (Supabase fallback)
// ═══════════════════════════════════════════════════════════

const alertStore = new Map<string, AdminAlert>();
const digestStore = new Map<string, AlertDigest>();

let alertCounter = 0;
function nextAlertId(): string {
  return `alert_${Date.now()}_${++alertCounter}`;
}

// ═══════════════════════════════════════════════════════════
// Core: Push & Manage Alerts
// ═══════════════════════════════════════════════════════════

/** Any agent calls this to drop an alert on the dashboard */
export async function pushAlert(params: {
  title: string;
  description: string;
  priority: AlertPriority;
  category: AlertCategory;
  source: AlertSource;
  actionRequired: string;
  sourceId?: string;
  workflowInstanceId?: string;
  gateAlertId?: string;
  actionUrl?: string;
  actionData?: Record<string, unknown>;
  deadlineAt?: string;
  autoResolveAt?: string;
  bundleKey?: string;
  metadata?: Record<string, unknown>;
}): Promise<AdminAlert> {
  const now = new Date().toISOString();
  const alert: AdminAlert = {
    id: nextAlertId(),
    title: params.title,
    description: params.description,
    priority: params.priority,
    category: params.category,
    source: params.source,
    status: "active",
    actionRequired: params.actionRequired,
    sourceId: params.sourceId,
    workflowInstanceId: params.workflowInstanceId,
    gateAlertId: params.gateAlertId,
    actionUrl: params.actionUrl,
    actionData: params.actionData,
    deadlineAt: params.deadlineAt,
    autoResolveAt: params.autoResolveAt,
    bundleKey: params.bundleKey,
    metadata: params.metadata,
    createdAt: now,
    updatedAt: now,
  };

  // Try Supabase first
  try {
    const { data, error } = await supabase.from("admin_alerts").insert(alert).select().single();
    if (!error && data) return data as AdminAlert;
  } catch {}

  // Local fallback
  alertStore.set(alert.id, alert);
  return alert;
}

/** Acknowledge an alert — optionally fire an orchestrator event to continue a workflow */
export async function acknowledgeAlert(
  alertId: string,
  acknowledgedBy: string = "admin",
  note?: string,
  fireOrchestratorEvent?: boolean,
): Promise<AdminAlert | null> {
  const now = new Date().toISOString();

  // Try Supabase
  try {
    const { data, error } = await supabase
      .from("admin_alerts")
      .update({
        status: "acknowledged",
        acknowledgedAt: now,
        acknowledgedBy,
        resolvedNote: note,
        updatedAt: now,
      })
      .eq("id", alertId)
      .select()
      .single();
    if (!error && data) {
      const alert = data as AdminAlert;
      if (fireOrchestratorEvent && alert.workflowInstanceId && alert.gateAlertId) {
        await bridgeToOrchestrator(alert.gateAlertId, acknowledgedBy);
      }
      return alert;
    }
  } catch {}

  // Local fallback
  const alert = alertStore.get(alertId);
  if (!alert) return null;

  alert.status = "acknowledged";
  alert.acknowledgedAt = now;
  alert.acknowledgedBy = acknowledgedBy;
  alert.resolvedNote = note;
  alert.updatedAt = now;

  if (fireOrchestratorEvent && alert.workflowInstanceId && alert.gateAlertId) {
    await bridgeToOrchestrator(alert.gateAlertId, acknowledgedBy);
  }

  return alert;
}

/** Snooze an alert until a future time */
export async function snoozeAlert(
  alertId: string,
  snoozedUntil: string,
): Promise<AdminAlert | null> {
  const now = new Date().toISOString();

  try {
    const { data, error } = await supabase
      .from("admin_alerts")
      .update({ status: "snoozed", snoozedUntil, updatedAt: now })
      .eq("id", alertId)
      .select()
      .single();
    if (!error && data) return data as AdminAlert;
  } catch {}

  const alert = alertStore.get(alertId);
  if (!alert) return null;
  alert.status = "snoozed";
  alert.snoozedUntil = snoozedUntil;
  alert.updatedAt = now;
  return alert;
}

/** Dismiss an alert with a reason */
export async function dismissAlert(alertId: string, reason: string): Promise<AdminAlert | null> {
  const now = new Date().toISOString();

  try {
    const { data, error } = await supabase
      .from("admin_alerts")
      .update({ status: "dismissed", dismissReason: reason, updatedAt: now })
      .eq("id", alertId)
      .select()
      .single();
    if (!error && data) return data as AdminAlert;
  } catch {}

  const alert = alertStore.get(alertId);
  if (!alert) return null;
  alert.status = "dismissed";
  alert.dismissReason = reason;
  alert.updatedAt = now;
  return alert;
}

/** Bulk acknowledge multiple alerts at once */
export async function bulkAcknowledge(
  alertIds: string[],
  acknowledgedBy: string = "admin",
): Promise<number> {
  let count = 0;
  for (const id of alertIds) {
    const result = await acknowledgeAlert(id, acknowledgedBy);
    if (result) count++;
  }
  return count;
}

// ═══════════════════════════════════════════════════════════
// Queries
// ═══════════════════════════════════════════════════════════

/** Get alerts with optional filters */
export async function getAlerts(filter?: AlertFilter): Promise<AdminAlert[]> {
  // Try Supabase
  try {
    let query = supabase.from("admin_alerts").select("*");
    if (filter?.category) query = query.eq("category", filter.category);
    if (filter?.priority) query = query.eq("priority", filter.priority);
    if (filter?.status) query = query.eq("status", filter.status);
    if (filter?.source) query = query.eq("source", filter.source);
    if (filter?.overdueOnly)
      query = query.lt("deadlineAt", new Date().toISOString()).eq("status", "active");
    if (filter?.fromDate) query = query.gte("createdAt", filter.fromDate);
    if (filter?.toDate) query = query.lte("createdAt", filter.toDate);
    if (filter?.search)
      query = query.or(`title.ilike.%${filter.search}%,description.ilike.%${filter.search}%`);
    query = query.order("createdAt", { ascending: false }).limit(200);

    const { data, error } = await query;
    if (!error && data?.length) return data as AdminAlert[];
  } catch {}

  // Local fallback
  let alerts = Array.from(alertStore.values());

  if (filter?.category) alerts = alerts.filter((a) => a.category === filter.category);
  if (filter?.priority) alerts = alerts.filter((a) => a.priority === filter.priority);
  if (filter?.status) alerts = alerts.filter((a) => a.status === filter.status);
  if (filter?.source) alerts = alerts.filter((a) => a.source === filter.source);
  if (filter?.overdueOnly) {
    const now = new Date().toISOString();
    alerts = alerts.filter((a) => a.status === "active" && a.deadlineAt && a.deadlineAt < now);
  }
  if (filter?.fromDate) alerts = alerts.filter((a) => a.createdAt >= filter.fromDate!);
  if (filter?.toDate) alerts = alerts.filter((a) => a.createdAt <= filter.toDate!);
  if (filter?.search) {
    const q = filter.search.toLowerCase();
    alerts = alerts.filter(
      (a) => a.title.toLowerCase().includes(q) || a.description.toLowerCase().includes(q),
    );
  }

  return alerts.sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 200);
}

/** Get only active (unacknowledged) alerts */
export async function getActiveAlerts(): Promise<AdminAlert[]> {
  return getAlerts({ status: "active" });
}

/** Get overdue alerts — past deadline and still active */
export async function getOverdueAlerts(): Promise<AdminAlert[]> {
  return getAlerts({ overdueOnly: true });
}

/** Get alerts by category (e.g., all finance alerts) */
export async function getAlertsByCategory(category: AlertCategory): Promise<AdminAlert[]> {
  return getAlerts({ category, status: "active" });
}

/** Get a single alert by ID */
export async function getAlertById(alertId: string): Promise<AdminAlert | null> {
  try {
    const { data, error } = await supabase
      .from("admin_alerts")
      .select("*")
      .eq("id", alertId)
      .single();
    if (!error && data) return data as AdminAlert;
  } catch {}

  return alertStore.get(alertId) ?? null;
}

// ═══════════════════════════════════════════════════════════
// Bundling — Group related alerts to reduce noise
// ═══════════════════════════════════════════════════════════

/** Get alerts grouped by bundle key */
export async function getAlertBundles(): Promise<AlertBundle[]> {
  const active = await getActiveAlerts();
  const bundleMap = new Map<string, AdminAlert[]>();
  const unbundled: AdminAlert[] = [];

  for (const alert of active) {
    const key = alert.bundleKey || `single_${alert.id}`;
    if (alert.bundleKey) {
      const existing = bundleMap.get(key) || [];
      existing.push(alert);
      bundleMap.set(key, existing);
    } else {
      unbundled.push(alert);
    }
  }

  const bundles: AlertBundle[] = [];

  for (const [key, alerts] of bundleMap.entries()) {
    const sorted = alerts.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    const highestPriority = getHighestPriority(alerts.map((a) => a.priority));
    bundles.push({
      bundleKey: key,
      category: sorted[0].category,
      priority: highestPriority,
      alerts: sorted,
      count: sorted.length,
      latestAt: sorted[0].createdAt,
      oldestAt: sorted[sorted.length - 1].createdAt,
      title: `${sorted[0].category}: ${sorted.length} items — ${sorted[0].title}`,
    });
  }

  // Add unbundled as single-item bundles
  for (const alert of unbundled) {
    bundles.push({
      bundleKey: `single_${alert.id}`,
      category: alert.category,
      priority: alert.priority,
      alerts: [alert],
      count: 1,
      latestAt: alert.createdAt,
      oldestAt: alert.createdAt,
      title: alert.title,
    });
  }

  return bundles.sort((a, b) => {
    const pOrder = priorityOrder(a.priority) - priorityOrder(b.priority);
    if (pOrder !== 0) return pOrder;
    return b.latestAt.localeCompare(a.latestAt);
  });
}

// ═══════════════════════════════════════════════════════════
// Stats & Dashboard
// ═══════════════════════════════════════════════════════════

/** Compute alert statistics */
export async function getAlertStats(): Promise<AlertStats> {
  const all = await getAlerts();
  const now = new Date().toISOString();

  const active = all.filter((a) => a.status === "active");
  const acknowledged = all.filter((a) => a.status === "acknowledged");
  const snoozed = all.filter((a) => a.status === "snoozed");
  const dismissed = all.filter((a) => a.status === "dismissed");
  const autoResolved = all.filter((a) => a.status === "auto_resolved");
  const overdue = active.filter((a) => a.deadlineAt && a.deadlineAt < now);

  const byCategory = {} as Record<AlertCategory, number>;
  const byPriority = {} as Record<AlertPriority, number>;

  for (const a of active) {
    byCategory[a.category] = (byCategory[a.category] || 0) + 1;
    byPriority[a.priority] = (byPriority[a.priority] || 0) + 1;
  }

  // Average time to acknowledge (in minutes)
  const ackTimes = acknowledged
    .filter((a) => a.acknowledgedAt && a.createdAt)
    .map((a) => (new Date(a.acknowledgedAt!).getTime() - new Date(a.createdAt).getTime()) / 60000);
  const avgAcknowledgeMinutes =
    ackTimes.length > 0 ? Math.round(ackTimes.reduce((s, v) => s + v, 0) / ackTimes.length) : 0;

  const oldestUnacknowledged = active.sort((a, b) => a.createdAt.localeCompare(b.createdAt))[0];

  return {
    total: all.length,
    active: active.length,
    acknowledged: acknowledged.length,
    snoozed: snoozed.length,
    dismissed: dismissed.length,
    autoResolved: autoResolved.length,
    overdue: overdue.length,
    byCategory,
    byPriority,
    avgAcknowledgeMinutes,
    oldestUnacknowledged,
  };
}

/** Full dashboard view — everything Tyrone needs at a glance */
export async function getAdminDashboard(): Promise<AdminDashboardView> {
  const stats = await getAlertStats();
  const active = await getActiveAlerts();
  const overdue = await getOverdueAlerts();
  const bundles = await getAlertBundles();
  const snoozed = await getAlerts({ status: "snoozed" });
  const now = new Date().toISOString();

  const criticalAlerts = active
    .filter((a) => a.priority === "critical")
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));

  const recentAlerts = active.slice(0, 20);

  const nextDeadline = active
    .filter((a) => a.deadlineAt && a.deadlineAt > now)
    .sort((a, b) => a.deadlineAt!.localeCompare(b.deadlineAt!))[0];

  return {
    stats,
    criticalAlerts,
    overdueAlerts: overdue,
    recentAlerts,
    bundles,
    snoozedCount: snoozed.length,
    nextDeadline,
  };
}

// ═══════════════════════════════════════════════════════════
// Digest — Periodic summaries
// ═══════════════════════════════════════════════════════════

/** Generate a daily or weekly digest */
export async function generateDigest(period: "daily" | "weekly" = "daily"): Promise<AlertDigest> {
  const daysBack = period === "daily" ? 1 : 7;
  const since = new Date(Date.now() - daysBack * 86400000).toISOString();

  const all = await getAlerts({ fromDate: since });
  const active = all.filter((a) => a.status === "active");
  const resolved = all.filter(
    (a) => a.status === "acknowledged" || a.status === "dismissed" || a.status === "auto_resolved",
  );
  const overdue = await getOverdueAlerts();

  const critical = active.filter((a) => a.priority === "critical");
  const high = active.filter((a) => a.priority === "high");
  const medium = active.filter((a) => a.priority === "medium");
  const low = active.filter((a) => a.priority === "low");
  const info = active.filter((a) => a.priority === "info");

  const topItems = active
    .sort((a, b) => priorityOrder(a.priority) - priorityOrder(b.priority))
    .slice(0, 10);

  const categories = [...new Set(active.map((a) => a.category))];
  const summary = [
    `${period === "daily" ? "Daily" : "Weekly"} Admin Digest — ${new Date().toLocaleDateString()}`,
    `${active.length} active alerts across ${categories.length} categories.`,
    critical.length > 0 ? `${critical.length} CRITICAL items need immediate attention.` : "",
    overdue.length > 0 ? `${overdue.length} items are overdue.` : "",
    `${resolved.length} items resolved in this period.`,
  ]
    .filter(Boolean)
    .join(" ");

  const digest: AlertDigest = {
    id: `digest_${Date.now()}`,
    generatedAt: new Date().toISOString(),
    period,
    summary,
    criticalCount: critical.length,
    highCount: high.length,
    mediumCount: medium.length,
    lowCount: low.length,
    infoCount: info.length,
    topItems,
    overdueItems: overdue,
    resolvedSinceLastDigest: resolved.length,
    newSinceLastDigest: all.filter((a) => a.createdAt >= since).length,
  };

  digestStore.set(digest.id, digest);
  return digest;
}

/** Get past digests */
export async function getDigests(limit: number = 10): Promise<AlertDigest[]> {
  return Array.from(digestStore.values())
    .sort((a, b) => b.generatedAt.localeCompare(a.generatedAt))
    .slice(0, limit);
}

// ═══════════════════════════════════════════════════════════
// Orchestrator Bridge — Sync gate alerts into unified view
// ═══════════════════════════════════════════════════════════

/** Import gate alerts from the orchestrator into the admin alerts system */
export async function syncGateAlerts(): Promise<number> {
  let synced = 0;
  try {
    const { getPendingGates } = await import("./orchestrator");
    const gates = await getPendingGates();

    for (const gate of gates) {
      // Skip if already synced
      const existing = Array.from(alertStore.values()).find((a) => a.gateAlertId === gate.id);
      if (existing) continue;

      await pushAlert({
        title: `[Workflow] ${gate.workflowName}: ${gate.stepName}`,
        description: gate.description,
        priority: gate.priority as AlertPriority,
        category: gate.category as AlertCategory,
        source: "orchestrator_gate",
        actionRequired: `Approve or dismiss: ${gate.stepName}`,
        workflowInstanceId: gate.workflowInstanceId,
        gateAlertId: gate.id,
        deadlineAt: gate.deadlineAt,
        metadata: { agent: gate.agent, action: gate.action, payload: gate.payload },
      });
      synced++;
    }
  } catch {
    // Orchestrator not available — that's fine in dev mode
  }
  return synced;
}

/** When an admin alert tied to a workflow gate is acknowledged, bridge back */
async function bridgeToOrchestrator(gateAlertId: string, acknowledgedBy: string): Promise<void> {
  try {
    const { acknowledgeGate } = await import("./orchestrator");
    await acknowledgeGate(gateAlertId, acknowledgedBy);
  } catch {
    // Orchestrator not available
  }
}

// ═══════════════════════════════════════════════════════════
// Auto-Resolve — Clean up stale alerts
// ═══════════════════════════════════════════════════════════

/** Run auto-resolve pass — marks alerts past their autoResolveAt as auto_resolved */
export async function runAutoResolve(): Promise<number> {
  const now = new Date().toISOString();
  let resolved = 0;

  const active = await getActiveAlerts();
  for (const alert of active) {
    if (alert.autoResolveAt && alert.autoResolveAt < now) {
      alert.status = "auto_resolved";
      alert.updatedAt = now;
      alertStore.set(alert.id, alert);
      resolved++;
    }
  }

  // Also un-snooze alerts whose snooze period has passed
  const snoozed = await getAlerts({ status: "snoozed" });
  for (const alert of snoozed) {
    if (alert.snoozedUntil && alert.snoozedUntil < now) {
      alert.status = "active";
      alert.snoozedUntil = undefined;
      alert.updatedAt = now;
      alertStore.set(alert.id, alert);
    }
  }

  return resolved;
}

// ═══════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════

function priorityOrder(p: AlertPriority): number {
  switch (p) {
    case "critical":
      return 0;
    case "high":
      return 1;
    case "medium":
      return 2;
    case "low":
      return 3;
    case "info":
      return 4;
    default:
      return 5;
  }
}

function getHighestPriority(priorities: AlertPriority[]): AlertPriority {
  let best: AlertPriority = "info";
  for (const p of priorities) {
    if (priorityOrder(p) < priorityOrder(best)) best = p;
  }
  return best;
}

// ═══════════════════════════════════════════════════════════
// Demo Seed
// ═══════════════════════════════════════════════════════════

export async function seedAdminAlertsDemo(): Promise<{
  alertsCreated: number;
  digestGenerated: boolean;
}> {
  const now = new Date();
  const hour = (h: number) => new Date(now.getTime() - h * 3600000).toISOString();
  const future = (h: number) => new Date(now.getTime() + h * 3600000).toISOString();

  const seeds: Parameters<typeof pushAlert>[0][] = [
    {
      title: "Refund $47.50 — Jane Cooper flagged for review",
      description:
        "Refund request exceeds auto-approve threshold. Amount: $47.50. User has 2 prior refunds this month.",
      priority: "high",
      category: "finance",
      source: "finance",
      actionRequired: "Approve or deny refund",
      sourceId: "refund_001",
      deadlineAt: future(4),
      actionUrl: "/admin/finance/refunds/refund_001",
    },
    {
      title: "Quarterly estimated tax filing due",
      description: "Q2 2026 estimated tax payment due June 15. Review P&L and compute payment.",
      priority: "critical",
      category: "tax",
      source: "cron",
      actionRequired: "Calculate and file quarterly estimated tax",
      deadlineAt: future(648), // ~27 days
      bundleKey: "tax_quarterly",
    },
    {
      title: "GDPR data deletion request — user #4821",
      description:
        "User requested full data deletion under GDPR Article 17. 30-day compliance window.",
      priority: "high",
      category: "legal",
      source: "legal_compliance",
      actionRequired: "Verify identity and approve deletion",
      sourceId: "gdpr_req_4821",
      deadlineAt: future(720), // 30 days
      actionUrl: "/admin/legal/requests/gdpr_req_4821",
    },
    {
      title: "New partner application — Nightfall Lounge DC",
      description:
        "Venue in Adams Morgan applied for Confetti partnership. Premium tier requested.",
      priority: "medium",
      category: "partnership",
      source: "partnerships",
      actionRequired: "Review application and schedule call",
      sourceId: "partner_app_nightfall",
      actionUrl: "/admin/partnerships/partner_app_nightfall",
    },
    {
      title: "3 unresolved P1 support tickets (>2 hours old)",
      description: "Tickets #1201, #1203, #1207 are priority-1 and have exceeded the 2-hour SLA.",
      priority: "critical",
      category: "support",
      source: "support_queue",
      actionRequired: "Triage and respond to P1 tickets",
      bundleKey: "support_p1_overdue",
      deadlineAt: hour(-1), // already overdue
      actionUrl: "/admin/support?priority=p1",
    },
    {
      title: "Identity verification flagged — suspicious document",
      description:
        "AI review flagged uploaded ID for user #8332 as potential forgery. Confidence: 78%.",
      priority: "high",
      category: "security",
      source: "identity_verification",
      actionRequired: "Manual document review required",
      sourceId: "verify_8332",
      deadlineAt: future(12),
      actionUrl: "/admin/verification/verify_8332",
    },
    {
      title: "Content scheduled for tomorrow needs approval",
      description:
        "Blog post 'Top 10 DC Rooftop Bars for Summer 2026' is scheduled for 10am tomorrow.",
      priority: "medium",
      category: "content",
      source: "content_cms",
      actionRequired: "Review and approve content for publication",
      sourceId: "content_dc_rooftops",
      deadlineAt: future(18),
      actionUrl: "/admin/content/content_dc_rooftops",
    },
    {
      title: "Emergency: API error rate spike — 12% of requests failing",
      description:
        "Error rate jumped from 0.3% to 12% in the last 15 minutes. Circuit breaker tripped on venue-discovery service.",
      priority: "critical",
      category: "system",
      source: "emergency_controls",
      actionRequired: "Investigate and resolve — circuit breaker active",
      sourceId: "incident_api_spike",
      deadlineAt: future(1),
      actionUrl: "/admin/emergency",
    },
    {
      title: "Investor deck view notification — 3 new opens",
      description: "Your pitch deck was opened by 3 new viewers in the last 24 hours via DocSend.",
      priority: "info",
      category: "investor",
      source: "manual",
      actionRequired: "Review viewer analytics and follow up",
    },
    {
      title: "Feature flag 'party-room-v2' rollout at 25% — no errors",
      description:
        "Party Room v2 has been at 25% rollout for 48 hours with 0 errors. Ready for next increment.",
      priority: "low",
      category: "system",
      source: "feature_flags",
      actionRequired: "Increase rollout to 50% or hold",
      sourceId: "flag_party_room_v2",
      actionUrl: "/admin/flags/flag_party_room_v2",
    },
    {
      title: "Monthly Stripe payout ready — $2,847.33",
      description:
        "May 2026 payout is ready for transfer. Review transaction summary before release.",
      priority: "high",
      category: "finance",
      source: "finance",
      actionRequired: "Review and approve payout",
      sourceId: "payout_may_2026",
      deadlineAt: future(48),
      actionUrl: "/admin/finance/payouts/payout_may_2026",
    },
    {
      title: "SEO alert: 'confetti app' dropped from #3 to #8",
      description: "Primary brand keyword lost 5 positions in Google Search over the past week.",
      priority: "medium",
      category: "marketing",
      source: "seo_aso",
      actionRequired: "Investigate ranking drop and adjust strategy",
      sourceId: "seo_drop_brand_kw",
      actionUrl: "/admin/seo",
    },
  ];

  let count = 0;
  for (const seed of seeds) {
    await pushAlert(seed);
    count++;
  }

  // Generate initial digest
  await generateDigest("daily");

  return { alertsCreated: count, digestGenerated: true };
}
