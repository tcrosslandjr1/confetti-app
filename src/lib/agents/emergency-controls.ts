/**
 * Emergency Controls Agent
 *
 * Kill switches, maintenance mode, emergency bans, and circuit breakers
 * for Confetti. AI monitors and alerts, Tyrone pulls the trigger.
 *
 * Features:
 *   - Kill switches for individual services/features
 *   - Maintenance mode with scheduled windows
 *   - Circuit breakers with automatic trip on failure threshold
 *   - Emergency user bans with appeal workflow
 *   - System alerts with severity levels and acknowledgment
 *   - Incident management with timeline tracking
 *   - Emergency dashboard with full system status
 *
 * Admin-gated actions:
 *   - activateKillSwitch, deactivateKillSwitch
 *   - toggleMaintenanceMode
 *   - emergencyBanUser, liftBan
 */

import { supabase } from "../supabase";

// ═══════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════

export type EmergencyAction =
  | "kill_switch"
  | "maintenance_mode"
  | "force_ban"
  | "rate_limit"
  | "feature_disable"
  | "rollback_deploy";
export type AlertSeverity = "info" | "warning" | "critical" | "emergency";
export type SystemStatus =
  | "operational"
  | "degraded"
  | "partial_outage"
  | "major_outage"
  | "maintenance";

export interface KillSwitch {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  activatedAt?: string;
  activatedBy?: string;
  deactivatedAt?: string;
  reason?: string;
  affectedServices: string[];
}

export interface CircuitBreaker {
  id: string;
  serviceName: string;
  status: "closed" | "open" | "half_open";
  failureCount: number;
  failureThreshold: number;
  lastFailureAt?: string;
  openedAt?: string;
  cooldownSeconds: number;
}

export interface EmergencyBan {
  id: string;
  userId: string;
  reason: string;
  bannedBy: string;
  bannedAt: string;
  expiresAt?: string;
  isPermanent: boolean;
  appealStatus?: "none" | "pending" | "approved" | "denied";
}

export interface SystemAlert {
  id: string;
  severity: AlertSeverity;
  title: string;
  description: string;
  service: string;
  metric?: string;
  value?: number;
  threshold?: number;
  acknowledged: boolean;
  acknowledgedBy?: string;
  createdAt: string;
  resolvedAt?: string;
}

export interface MaintenanceWindow {
  id: string;
  title: string;
  description: string;
  scheduledStart: string;
  scheduledEnd: string;
  actualStart?: string;
  actualEnd?: string;
  status: "scheduled" | "in_progress" | "completed" | "cancelled";
  affectedServices: string[];
}

export interface IncidentUpdate {
  timestamp: string;
  status: string;
  message: string;
  updatedBy: string;
}

export interface IncidentLog {
  id: string;
  title: string;
  severity: AlertSeverity;
  status: "investigating" | "identified" | "monitoring" | "resolved";
  timeline: IncidentUpdate[];
  startedAt: string;
  resolvedAt?: string;
  rootCause?: string;
  postmortemUrl?: string;
}

// ═══════════════════════════════════════════════════════════
// In-Memory Store (local-first)
// ═══════════════════════════════════════════════════════════

const killSwitchStore = new Map<string, KillSwitch>();
const circuitBreakerStore = new Map<string, CircuitBreaker>();
const banStore = new Map<string, EmergencyBan>();
const alertStore = new Map<string, SystemAlert>();
const maintenanceStore = new Map<string, MaintenanceWindow>();
const incidentStore = new Map<string, IncidentLog>();

let maintenanceModeEnabled = false;
let maintenanceModeMessage = "";

let idCounter = 11000;
function nextId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${(idCounter++).toString(36)}`;
}

// ═══════════════════════════════════════════════════════════
// Kill Switches
// ═══════════════════════════════════════════════════════════

/** Define a new kill switch */
export function createKillSwitch(
  name: string,
  description: string,
  affectedServices: string[],
): KillSwitch {
  const ks: KillSwitch = {
    id: nextId("ks"),
    name,
    description,
    isActive: false,
    affectedServices,
  };
  killSwitchStore.set(ks.id, ks);
  return ks;
}

/** REQUIRES ADMIN — Activate a kill switch */
export function activateKillSwitch(
  switchId: string,
  reason: string,
  activatedBy: string,
): KillSwitch | null {
  const ks = killSwitchStore.get(switchId);
  if (!ks) return null;

  ks.isActive = true;
  ks.activatedAt = new Date().toISOString();
  ks.activatedBy = activatedBy;
  ks.reason = reason;

  // Auto-create alert
  createAlert(
    "emergency",
    `Kill Switch Activated: ${ks.name}`,
    `${activatedBy} activated kill switch "${ks.name}". Reason: ${reason}. Affected services: ${ks.affectedServices.join(", ")}`,
    ks.affectedServices[0] ?? "system",
  );

  return ks;
}

/** REQUIRES ADMIN — Deactivate a kill switch */
export function deactivateKillSwitch(switchId: string, deactivatedBy: string): KillSwitch | null {
  const ks = killSwitchStore.get(switchId);
  if (!ks) return null;

  ks.isActive = false;
  ks.deactivatedAt = new Date().toISOString();

  createAlert(
    "info",
    `Kill Switch Deactivated: ${ks.name}`,
    `${deactivatedBy} deactivated kill switch "${ks.name}". Services restored: ${ks.affectedServices.join(", ")}`,
    ks.affectedServices[0] ?? "system",
  );

  return ks;
}

/** Get all kill switches with status */
export function getKillSwitches(): KillSwitch[] {
  return Array.from(killSwitchStore.values());
}

// ═══════════════════════════════════════════════════════════
// Maintenance Mode
// ═══════════════════════════════════════════════════════════

/** REQUIRES ADMIN — Toggle maintenance mode */
export function toggleMaintenanceMode(
  enabled: boolean,
  activatedBy: string,
  message?: string,
): { enabled: boolean; message: string } {
  maintenanceModeEnabled = enabled;
  maintenanceModeMessage =
    message ??
    (enabled ? "Confetti is undergoing scheduled maintenance. We'll be back shortly!" : "");

  createAlert(
    enabled ? "warning" : "info",
    enabled ? "Maintenance Mode Activated" : "Maintenance Mode Deactivated",
    `${activatedBy} ${enabled ? "enabled" : "disabled"} maintenance mode. ${message ?? ""}`,
    "system",
  );

  return { enabled: maintenanceModeEnabled, message: maintenanceModeMessage };
}

// ═══════════════════════════════════════════════════════════
// Circuit Breakers
// ═══════════════════════════════════════════════════════════

/** Record a service failure — auto-opens breaker if threshold hit */
export function recordServiceFailure(serviceName: string): CircuitBreaker {
  let breaker = Array.from(circuitBreakerStore.values()).find(
    (cb) => cb.serviceName === serviceName,
  );

  if (!breaker) {
    // Auto-create circuit breaker with defaults
    breaker = {
      id: nextId("cb"),
      serviceName,
      status: "closed",
      failureCount: 0,
      failureThreshold: 5,
      cooldownSeconds: 60,
    };
    circuitBreakerStore.set(breaker.id, breaker);
  }

  breaker.failureCount++;
  breaker.lastFailureAt = new Date().toISOString();

  // Trip the breaker if threshold exceeded
  if (breaker.failureCount >= breaker.failureThreshold && breaker.status === "closed") {
    breaker.status = "open";
    breaker.openedAt = new Date().toISOString();

    createAlert(
      "critical",
      `Circuit Breaker Opened: ${serviceName}`,
      `Service "${serviceName}" hit ${breaker.failureCount} failures (threshold: ${breaker.failureThreshold}). Circuit breaker is now OPEN.`,
      serviceName,
      "failure_count",
      breaker.failureCount,
      breaker.failureThreshold,
    );
  }

  return breaker;
}

/** Reset a circuit breaker to closed state */
export function resetCircuitBreaker(serviceName: string): CircuitBreaker | null {
  const breaker = Array.from(circuitBreakerStore.values()).find(
    (cb) => cb.serviceName === serviceName,
  );
  if (!breaker) return null;

  breaker.status = "closed";
  breaker.failureCount = 0;
  return breaker;
}

/** Get all circuit breakers with status */
export function getCircuitBreakers(): CircuitBreaker[] {
  return Array.from(circuitBreakerStore.values());
}

// ═══════════════════════════════════════════════════════════
// Emergency Bans
// ═══════════════════════════════════════════════════════════

/** REQUIRES ADMIN — Emergency ban a user */
export function emergencyBanUser(
  userId: string,
  reason: string,
  bannedBy: string,
  permanent: boolean = false,
  expiresAt?: string,
): EmergencyBan {
  const ban: EmergencyBan = {
    id: nextId("ban"),
    userId,
    reason,
    bannedBy,
    bannedAt: new Date().toISOString(),
    expiresAt: permanent
      ? undefined
      : (expiresAt ??
        (() => {
          const d = new Date();
          d.setDate(d.getDate() + 30);
          return d.toISOString();
        })()),
    isPermanent: permanent,
    appealStatus: "none",
  };

  banStore.set(ban.id, ban);

  createAlert(
    "warning",
    `Emergency Ban: User ${userId}`,
    `${bannedBy} banned user ${userId}. Reason: ${reason}. ${permanent ? "PERMANENT" : `Expires: ${ban.expiresAt}`}`,
    "user-management",
  );

  return ban;
}

/** REQUIRES ADMIN — Lift a ban */
export function liftBan(banId: string, liftedBy: string): EmergencyBan | null {
  const ban = banStore.get(banId);
  if (!ban) return null;

  // Remove from active bans
  banStore.delete(banId);

  createAlert(
    "info",
    `Ban Lifted: User ${ban.userId}`,
    `${liftedBy} lifted ban on user ${ban.userId}. Original reason: ${ban.reason}`,
    "user-management",
  );

  return ban;
}

/** Get all active bans */
export function getActiveBans(): EmergencyBan[] {
  const now = new Date().toISOString();
  return Array.from(banStore.values()).filter(
    (b) => b.isPermanent || !b.expiresAt || b.expiresAt > now,
  );
}

// ═══════════════════════════════════════════════════════════
// System Alerts
// ═══════════════════════════════════════════════════════════

/** Create a new system alert */
export function createAlert(
  severity: AlertSeverity,
  title: string,
  description: string,
  service: string,
  metric?: string,
  value?: number,
  threshold?: number,
): SystemAlert {
  const alert: SystemAlert = {
    id: nextId("alrt"),
    severity,
    title,
    description,
    service,
    metric,
    value,
    threshold,
    acknowledged: false,
    createdAt: new Date().toISOString(),
  };

  alertStore.set(alert.id, alert);
  return alert;
}

/** Acknowledge an alert */
export function acknowledgeAlert(alertId: string, acknowledgedBy: string): SystemAlert | null {
  const alert = alertStore.get(alertId);
  if (!alert) return null;

  alert.acknowledged = true;
  alert.acknowledgedBy = acknowledgedBy;
  return alert;
}

/** Resolve an alert */
export function resolveAlert(alertId: string): SystemAlert | null {
  const alert = alertStore.get(alertId);
  if (!alert) return null;

  alert.resolvedAt = new Date().toISOString();
  alert.acknowledged = true;
  return alert;
}

/** Get active (unresolved) alerts sorted by severity */
export function getActiveAlerts(): SystemAlert[] {
  const severityRank: Record<AlertSeverity, number> = {
    emergency: 4,
    critical: 3,
    warning: 2,
    info: 1,
  };

  return Array.from(alertStore.values())
    .filter((a) => !a.resolvedAt)
    .sort((a, b) => severityRank[b.severity] - severityRank[a.severity]);
}

// ═══════════════════════════════════════════════════════════
// Maintenance Windows
// ═══════════════════════════════════════════════════════════

/** Schedule a maintenance window */
export function scheduleMaintenanceWindow(
  title: string,
  description: string,
  start: string,
  end: string,
  services: string[],
): MaintenanceWindow {
  const mw: MaintenanceWindow = {
    id: nextId("mw"),
    title,
    description,
    scheduledStart: start,
    scheduledEnd: end,
    status: "scheduled",
    affectedServices: services,
  };

  maintenanceStore.set(mw.id, mw);
  return mw;
}

// ═══════════════════════════════════════════════════════════
// Incident Management
// ═══════════════════════════════════════════════════════════

/** Start a new incident */
export function startIncident(
  title: string,
  severity: AlertSeverity,
  initialMessage: string,
  reportedBy: string,
): IncidentLog {
  const incident: IncidentLog = {
    id: nextId("inc"),
    title,
    severity,
    status: "investigating",
    timeline: [
      {
        timestamp: new Date().toISOString(),
        status: "investigating",
        message: initialMessage,
        updatedBy: reportedBy,
      },
    ],
    startedAt: new Date().toISOString(),
  };

  incidentStore.set(incident.id, incident);

  createAlert(
    severity,
    `Incident Opened: ${title}`,
    `New ${severity} incident: ${initialMessage}`,
    "incident-management",
  );

  return incident;
}

/** Add a timeline update to an incident */
export function updateIncident(
  incidentId: string,
  status: IncidentLog["status"],
  message: string,
  updatedBy: string,
): IncidentLog | null {
  const incident = incidentStore.get(incidentId);
  if (!incident) return null;

  incident.status = status;
  incident.timeline.push({
    timestamp: new Date().toISOString(),
    status,
    message,
    updatedBy,
  });

  return incident;
}

/** Resolve an incident */
export function resolveIncident(
  incidentId: string,
  rootCause: string,
  resolvedBy: string,
): IncidentLog | null {
  const incident = incidentStore.get(incidentId);
  if (!incident) return null;

  incident.status = "resolved";
  incident.resolvedAt = new Date().toISOString();
  incident.rootCause = rootCause;
  incident.timeline.push({
    timestamp: new Date().toISOString(),
    status: "resolved",
    message: `Resolved. Root cause: ${rootCause}`,
    updatedBy: resolvedBy,
  });

  return incident;
}

/** Get incident history */
export function getIncidentHistory(limit: number = 20): IncidentLog[] {
  return Array.from(incidentStore.values())
    .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime())
    .slice(0, limit);
}

// ═══════════════════════════════════════════════════════════
// System Status
// ═══════════════════════════════════════════════════════════

/** Compute overall platform status based on circuit breakers and kill switches */
export function getSystemStatus(): { status: SystemStatus; details: string } {
  if (maintenanceModeEnabled) {
    return { status: "maintenance", details: maintenanceModeMessage };
  }

  const activeKillSwitches = Array.from(killSwitchStore.values()).filter((ks) => ks.isActive);
  const openBreakers = Array.from(circuitBreakerStore.values()).filter(
    (cb) => cb.status === "open",
  );
  const criticalAlerts = Array.from(alertStore.values()).filter(
    (a) => !a.resolvedAt && (a.severity === "emergency" || a.severity === "critical"),
  );

  if (activeKillSwitches.length > 2 || criticalAlerts.length > 3) {
    return {
      status: "major_outage",
      details: `${activeKillSwitches.length} kill switches active, ${criticalAlerts.length} critical alerts`,
    };
  }

  if (activeKillSwitches.length > 0 || openBreakers.length > 1) {
    return {
      status: "partial_outage",
      details: `${activeKillSwitches.length} kill switches active, ${openBreakers.length} circuit breakers open`,
    };
  }

  if (openBreakers.length > 0 || criticalAlerts.length > 0) {
    return {
      status: "degraded",
      details: `${openBreakers.length} circuit breakers open, ${criticalAlerts.length} critical alerts`,
    };
  }

  return { status: "operational", details: "All systems operational" };
}

// ═══════════════════════════════════════════════════════════
// Emergency Dashboard
// ═══════════════════════════════════════════════════════════

/** Full emergency dashboard overview */
export function getEmergencyDashboard(): {
  systemStatus: { status: SystemStatus; details: string };
  maintenanceMode: { enabled: boolean; message: string };
  killSwitches: KillSwitch[];
  circuitBreakers: CircuitBreaker[];
  activeAlerts: SystemAlert[];
  activeBans: EmergencyBan[];
  openIncidents: IncidentLog[];
  upcomingMaintenance: MaintenanceWindow[];
} {
  const now = new Date().toISOString();

  return {
    systemStatus: getSystemStatus(),
    maintenanceMode: { enabled: maintenanceModeEnabled, message: maintenanceModeMessage },
    killSwitches: getKillSwitches(),
    circuitBreakers: getCircuitBreakers(),
    activeAlerts: getActiveAlerts(),
    activeBans: getActiveBans(),
    openIncidents: Array.from(incidentStore.values()).filter((i) => i.status !== "resolved"),
    upcomingMaintenance: Array.from(maintenanceStore.values()).filter(
      (mw) => mw.status === "scheduled" && mw.scheduledStart > now,
    ),
  };
}

// ═══════════════════════════════════════════════════════════
// Demo Seed
// ═══════════════════════════════════════════════════════════

/** Create sample alerts, incidents, circuit breakers for demo */
export function seedEmergencyDemo(): {
  killSwitches: KillSwitch[];
  alerts: SystemAlert[];
  incidents: IncidentLog[];
} {
  // Create kill switches
  const killSwitches = [
    createKillSwitch("ai_recommendations", "Disable AI-powered venue recommendations", [
      "recommendation-engine",
      "chat-agent",
    ]),
    createKillSwitch("payment_processing", "Disable all payment processing", [
      "payments",
      "subscriptions",
      "wallet",
    ]),
    createKillSwitch("push_notifications", "Disable push notification delivery", ["notifications"]),
    createKillSwitch("user_registration", "Disable new user signups", ["auth", "onboarding"]),
    createKillSwitch("boost_campaigns", "Disable business boost campaigns", [
      "boost-engine",
      "campaign-manager",
    ]),
    createKillSwitch("group_plans", "Disable group plan creation", [
      "group-collab",
      "trip-planner",
    ]),
  ];

  // Create circuit breakers for key services
  const services = [
    "recommendation-engine",
    "venue-api",
    "payment-gateway",
    "notification-service",
    "auth-service",
  ];
  for (const svc of services) {
    const breaker: CircuitBreaker = {
      id: nextId("cb"),
      serviceName: svc,
      status: "closed",
      failureCount: 0,
      failureThreshold: 5,
      cooldownSeconds: 60,
    };
    circuitBreakerStore.set(breaker.id, breaker);
  }

  // Simulate some failures on venue API
  recordServiceFailure("venue-api");
  recordServiceFailure("venue-api");
  recordServiceFailure("venue-api");

  // Create sample alerts
  const alerts = [
    createAlert(
      "warning",
      "High API Latency: Venue Discovery",
      "Venue discovery API p99 latency exceeded 2000ms (current: 2450ms)",
      "venue-api",
      "p99_latency_ms",
      2450,
      2000,
    ),
    createAlert(
      "info",
      "Elevated Error Rate: Push Notifications",
      "Push notification delivery failure rate at 3.2% (threshold: 5%)",
      "notification-service",
      "error_rate_pct",
      3.2,
      5.0,
    ),
    createAlert(
      "critical",
      "Database Connection Pool Exhaustion",
      "Primary database connection pool at 92% capacity. Consider scaling or optimizing queries.",
      "database",
      "connection_pool_pct",
      92,
      85,
    ),
  ];

  // Acknowledge one alert
  acknowledgeAlert(alerts[0].id, "Tyrone");

  // Create a resolved incident
  const pastIncident = startIncident(
    "Payment Processing Outage",
    "critical",
    "Multiple users reporting failed payments. Investigating payment gateway connectivity.",
    "system",
  );
  updateIncident(
    pastIncident.id,
    "identified",
    "Root cause identified: Stripe webhook endpoint returning 502. Stripe status page confirms degraded performance.",
    "Tyrone",
  );
  updateIncident(
    pastIncident.id,
    "monitoring",
    "Stripe has resolved the issue on their end. Monitoring our payment success rate.",
    "Tyrone",
  );
  resolveIncident(
    pastIncident.id,
    "Stripe webhook infrastructure experienced temporary degraded performance. No action needed on our side.",
    "Tyrone",
  );

  // Create an ongoing incident
  startIncident(
    "Elevated Latency in Venue Search",
    "warning",
    "Users reporting slow venue search results. Investigating backend performance.",
    "system",
  );

  // Schedule a maintenance window
  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);
  const nextWeekEnd = new Date(nextWeek);
  nextWeekEnd.setHours(nextWeekEnd.getHours() + 2);

  scheduleMaintenanceWindow(
    "Database Migration: Taste Profile v2",
    "Migrating taste profile schema to support enhanced AI recommendations. Expected 30 min downtime for recommendation service.",
    nextWeek.toISOString(),
    nextWeekEnd.toISOString(),
    ["database", "recommendation-engine", "taste-agent"],
  );

  // Create a sample ban
  emergencyBanUser(
    "user_spam_001",
    "Automated spam detection: mass fake reviews posted",
    "system",
    false,
    (() => {
      const d = new Date();
      d.setDate(d.getDate() + 7);
      return d.toISOString();
    })(),
  );

  return {
    killSwitches,
    alerts,
    incidents: Array.from(incidentStore.values()),
  };
}
