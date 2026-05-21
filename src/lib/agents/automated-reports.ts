/**
 * Automated Reports Agent
 *
 * AI-generated KPI digests, anomaly detection, and scheduled summaries
 * for Confetti. Tracks core metrics (DAU, MAU, revenue, bookings, venues,
 * engagement, retention, support, errors) and generates narrative reports.
 *
 * Features:
 *   - Configurable recurring reports (daily, weekly, monthly, custom)
 *   - AI-generated narrative summaries for each metric
 *   - Anomaly detection (values outside 2 std dev of recent trend)
 *   - Multi-delivery: email, push, in-app, Slack
 *   - Metric trend time series for charting
 *   - Realistic Confetti demo data with seasonal patterns
 */

import { supabase } from "../supabase";

// ─── Types ─────────────────────────────────────────────────────

export type ReportType = "daily_digest" | "weekly_summary" | "monthly_review" | "anomaly_alert" | "custom";
export type ReportStatus = "generating" | "ready" | "sent" | "failed";
export type DeliveryMethod = "email" | "push" | "in_app" | "slack";
export type MetricType = "users" | "revenue" | "bookings" | "venues" | "engagement" | "retention" | "support" | "errors";

export interface ReportConfig {
  id: string;
  name: string;
  type: ReportType;
  metrics: MetricType[];
  schedule: string; // cron-like: "daily@9am", "weekly@monday", "monthly@1st"
  delivery: DeliveryMethod[];
  recipientEmail?: string;
  isActive: boolean;
  lastRunAt?: string;
  nextRunAt?: string;
}

export interface GeneratedReport {
  id: string;
  configId: string;
  type: ReportType;
  title: string;
  summary: string;
  sections: ReportSection[];
  anomalies: Anomaly[];
  generatedAt: string;
  sentAt?: string;
  status: ReportStatus;
}

export interface ReportSection {
  title: string;
  metricType: MetricType;
  value: number;
  previousValue: number;
  changePercent: number;
  trend: "up" | "down" | "flat";
  narrative: string;
}

export interface Anomaly {
  metric: MetricType;
  description: string;
  severity: "info" | "warning" | "critical";
  detectedAt: string;
  value: number;
  expectedRange: { min: number; max: number };
}

export interface MetricSnapshot {
  date: string;
  metrics: Record<MetricType, number>;
}

// ─── In-memory stores (local-first, syncs to Supabase) ────────

let configStore: ReportConfig[] = [];
let reportStore: GeneratedReport[] = [];
let snapshotStore: MetricSnapshot[] = [];

// ─── Constants ────────────────────────────────────────────────

const METRIC_LABELS: Record<MetricType, string> = {
  users: "Daily Active Users",
  revenue: "Revenue",
  bookings: "Bookings",
  venues: "Active Venues",
  engagement: "Engagement Rate",
  retention: "Retention Rate",
  support: "Support Tickets",
  errors: "Error Rate",
};

const METRIC_UNITS: Record<MetricType, string> = {
  users: "users",
  revenue: "$",
  bookings: "bookings",
  venues: "venues",
  engagement: "%",
  retention: "%",
  support: "tickets",
  errors: "%",
};

// ─── Create report config ─────────────────────────────────────

export async function createReportConfig(
  name: string,
  type: ReportType,
  metrics: MetricType[],
  schedule: string,
  delivery: DeliveryMethod[]
): Promise<ReportConfig> {
  const config: ReportConfig = {
    id: crypto.randomUUID?.() ?? `rc-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name,
    type,
    metrics,
    schedule,
    delivery,
    isActive: true,
    lastRunAt: undefined,
    nextRunAt: computeNextRun(schedule),
  };

  configStore.push(config);

  try {
    await supabase.from("report_configs").insert(config);
  } catch {
    // local-only mode
  }

  return config;
}

// ─── Generate report from config ──────────────────────────────

export async function generateReport(configId: string): Promise<GeneratedReport | null> {
  const config = configStore.find((c) => c.id === configId);
  if (!config) return null;

  const now = new Date();
  const currentSnapshot = getCurrentSnapshotInternal();
  const previousSnapshot = snapshotStore.length > 1
    ? snapshotStore[snapshotStore.length - 2]
    : null;

  const sections: ReportSection[] = config.metrics.map((metric) => {
    const current = currentSnapshot.metrics[metric] ?? 0;
    const previous = previousSnapshot?.metrics[metric] ?? current;
    const changePercent = previous !== 0 ? ((current - previous) / previous) * 100 : 0;
    const trend: "up" | "down" | "flat" =
      changePercent > 1 ? "up" : changePercent < -1 ? "down" : "flat";

    return {
      title: METRIC_LABELS[metric],
      metricType: metric,
      value: current,
      previousValue: previous,
      changePercent: Math.round(changePercent * 10) / 10,
      trend,
      narrative: generateNarrative(metric, current, previous, changePercent),
    };
  });

  const anomalies = detectAnomalies(snapshotStore.slice(-30));

  const report: GeneratedReport = {
    id: crypto.randomUUID?.() ?? `rpt-${Date.now()}`,
    configId,
    type: config.type,
    title: generateReportTitle(config.type, now),
    summary: generateSummary(sections, anomalies),
    sections,
    anomalies,
    generatedAt: now.toISOString(),
    status: "ready",
  };

  reportStore.push(report);
  config.lastRunAt = now.toISOString();
  config.nextRunAt = computeNextRun(config.schedule);

  try {
    await supabase.from("generated_reports").insert(report);
  } catch {
    // local-only mode
  }

  return report;
}

// ─── Convenience: daily digest ────────────────────────────────

export async function generateDailyDigest(): Promise<GeneratedReport | null> {
  let config = configStore.find((c) => c.type === "daily_digest" && c.isActive);
  if (!config) {
    config = await createReportConfig(
      "Daily Digest",
      "daily_digest",
      ["users", "revenue", "bookings", "engagement", "errors"],
      "daily@9am",
      ["in_app"]
    );
  }
  return generateReport(config.id);
}

// ─── Convenience: weekly report ───────────────────────────────

export async function generateWeeklyReport(): Promise<GeneratedReport | null> {
  let config = configStore.find((c) => c.type === "weekly_summary" && c.isActive);
  if (!config) {
    config = await createReportConfig(
      "Weekly Summary",
      "weekly_summary",
      ["users", "revenue", "bookings", "venues", "engagement", "retention", "support", "errors"],
      "weekly@monday",
      ["email", "in_app"]
    );
  }
  return generateReport(config.id);
}

// ─── Anomaly detection ────────────────────────────────────────

export function detectAnomalies(snapshots: MetricSnapshot[]): Anomaly[] {
  if (snapshots.length < 7) return [];

  const anomalies: Anomaly[] = [];
  const metrics: MetricType[] = ["users", "revenue", "bookings", "venues", "engagement", "retention", "support", "errors"];

  for (const metric of metrics) {
    const values = snapshots.map((s) => s.metrics[metric]).filter((v) => v !== undefined);
    if (values.length < 5) continue;

    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const stdDev = Math.sqrt(
      values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / values.length
    );

    const latest = values[values.length - 1];
    const min = mean - 2 * stdDev;
    const max = mean + 2 * stdDev;

    if (latest < min || latest > max) {
      const direction = latest > max ? "above" : "below";
      const deviation = Math.abs(latest - mean) / (stdDev || 1);

      anomalies.push({
        metric,
        description: `${METRIC_LABELS[metric]} is ${deviation.toFixed(1)} std devs ${direction} the recent average (${formatMetric(metric, latest)} vs avg ${formatMetric(metric, mean)}).`,
        severity: deviation > 3 ? "critical" : deviation > 2.5 ? "warning" : "info",
        detectedAt: new Date().toISOString(),
        value: latest,
        expectedRange: {
          min: Math.round(min * 100) / 100,
          max: Math.round(max * 100) / 100,
        },
      });
    }
  }

  return anomalies;
}

// ─── Report history ───────────────────────────────────────────

export function getReportHistory(configId?: string, limit: number = 20): GeneratedReport[] {
  let reports = [...reportStore];
  if (configId) {
    reports = reports.filter((r) => r.configId === configId);
  }
  return reports
    .sort((a, b) => new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime())
    .slice(0, limit);
}

// ─── Latest report of a type ──────────────────────────────────

export function getLatestReport(type: ReportType): GeneratedReport | undefined {
  return reportStore
    .filter((r) => r.type === type)
    .sort((a, b) => new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime())[0];
}

// ─── Active configs ───────────────────────────────────────────

export function getActiveConfigs(): ReportConfig[] {
  return configStore.filter((c) => c.isActive);
}

// ─── Update config ────────────────────────────────────────────

export async function updateConfig(
  configId: string,
  updates: Partial<Pick<ReportConfig, "name" | "metrics" | "schedule" | "delivery" | "recipientEmail">>
): Promise<ReportConfig | null> {
  const config = configStore.find((c) => c.id === configId);
  if (!config) return null;

  Object.assign(config, updates);
  if (updates.schedule) {
    config.nextRunAt = computeNextRun(updates.schedule);
  }

  try {
    await supabase.from("report_configs").upsert(config);
  } catch {
    // local-only mode
  }

  return config;
}

// ─── Pause config ─────────────────────────────────────────────

export async function pauseConfig(configId: string): Promise<boolean> {
  const config = configStore.find((c) => c.id === configId);
  if (!config) return false;
  config.isActive = false;
  config.nextRunAt = undefined;

  try {
    await supabase.from("report_configs").upsert(config);
  } catch {
    // local-only mode
  }

  return true;
}

// ─── Get metric snapshot ──────────────────────────────────────

export function getMetricSnapshot(date?: string): MetricSnapshot {
  if (date) {
    const found = snapshotStore.find((s) => s.date === date);
    if (found) return found;
  }
  return getCurrentSnapshotInternal();
}

// ─── Get metric trend (time series) ──────────────────────────

export function getMetricTrend(
  metric: MetricType,
  days: number = 30
): Array<{ date: string; value: number }> {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);

  return snapshotStore
    .filter((s) => new Date(s.date) >= cutoff)
    .map((s) => ({
      date: s.date,
      value: s.metrics[metric] ?? 0,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

// ─── Seed demo data ───────────────────────────────────────────

export async function seedReportsDemo(): Promise<{
  configs: number;
  reports: number;
  snapshots: number;
}> {
  // Generate 90 days of metric snapshots
  snapshotStore = [];
  const today = new Date();

  for (let i = 89; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);

    // Growth factor: metrics increase over time
    const growthFactor = 1 + (90 - i) * 0.008;
    // Weekend boost for engagement metrics
    const dayOfWeek = date.getDay();
    const weekendBoost = dayOfWeek === 0 || dayOfWeek === 5 || dayOfWeek === 6 ? 1.25 : 1.0;
    // Random noise
    const noise = () => 0.9 + Math.random() * 0.2;

    const snapshot: MetricSnapshot = {
      date: date.toISOString().split("T")[0],
      metrics: {
        users: Math.round(1200 * growthFactor * weekendBoost * noise()),
        revenue: Math.round(850 * growthFactor * noise()),
        bookings: Math.round(180 * growthFactor * weekendBoost * noise()),
        venues: Math.round(320 + (90 - i) * 1.5 * noise()),
        engagement: Math.round(62 * noise() * 10) / 10,
        retention: Math.round(38 * noise() * (1 + (90 - i) * 0.002) * 10) / 10,
        support: Math.round(15 * noise()),
        errors: Math.round(2.1 * noise() * 100) / 100,
      },
    };

    snapshotStore.push(snapshot);
  }

  // Create default report configs
  configStore = [];
  await createReportConfig(
    "Daily Digest",
    "daily_digest",
    ["users", "revenue", "bookings", "engagement", "errors"],
    "daily@9am",
    ["in_app"]
  );
  await createReportConfig(
    "Weekly Summary",
    "weekly_summary",
    ["users", "revenue", "bookings", "venues", "engagement", "retention", "support", "errors"],
    "weekly@monday",
    ["email", "in_app"]
  );
  await createReportConfig(
    "Monthly Review",
    "monthly_review",
    ["users", "revenue", "bookings", "venues", "engagement", "retention", "support", "errors"],
    "monthly@1st",
    ["email", "slack"]
  );
  await createReportConfig(
    "Error Spike Alert",
    "anomaly_alert",
    ["errors", "support"],
    "daily@6am",
    ["push", "slack"]
  );

  // Generate sample reports
  reportStore = [];
  for (const config of configStore) {
    await generateReport(config.id);
  }

  return {
    configs: configStore.length,
    reports: reportStore.length,
    snapshots: snapshotStore.length,
  };
}

// ─── Internal helpers ─────────────────────────────────────────

function getCurrentSnapshotInternal(): MetricSnapshot {
  if (snapshotStore.length > 0) {
    return snapshotStore[snapshotStore.length - 1];
  }
  // Fallback defaults
  return {
    date: new Date().toISOString().split("T")[0],
    metrics: {
      users: 1800,
      revenue: 1250,
      bookings: 245,
      venues: 450,
      engagement: 64.2,
      retention: 41.5,
      support: 12,
      errors: 1.8,
    },
  };
}

function formatMetric(metric: MetricType, value: number): string {
  const unit = METRIC_UNITS[metric];
  if (unit === "$") return `$${Math.round(value).toLocaleString()}`;
  if (unit === "%") return `${(Math.round(value * 10) / 10)}%`;
  return `${Math.round(value).toLocaleString()} ${unit}`;
}

function generateNarrative(
  metric: MetricType,
  current: number,
  previous: number,
  changePercent: number
): string {
  const label = METRIC_LABELS[metric];
  const direction = changePercent > 0 ? "grew" : changePercent < 0 ? "declined" : "remained stable";
  const absChange = Math.abs(Math.round(changePercent * 10) / 10);

  const narratives: Record<MetricType, string> = {
    users: changePercent > 5
      ? `${label} ${direction} ${absChange}% week-over-week, driven by the new venue discovery feature and organic growth.`
      : changePercent < -5
      ? `${label} ${direction} ${absChange}% this period. Consider running a re-engagement push notification campaign.`
      : `${label} ${direction} at ${formatMetric(metric, current)}, tracking within normal range.`,
    revenue: changePercent > 5
      ? `Revenue ${direction} ${absChange}% to ${formatMetric(metric, current)}. Business tier upgrades and booking fees are the top contributors.`
      : changePercent < -5
      ? `Revenue ${direction} ${absChange}% to ${formatMetric(metric, current)}. Review pricing tiers and boost campaign conversions.`
      : `Revenue held steady at ${formatMetric(metric, current)}, in line with projections.`,
    bookings: changePercent > 0
      ? `Bookings ${direction} ${absChange}% to ${Math.round(current)}. Weekend events and group plans are the primary drivers.`
      : `Bookings ${direction} ${absChange}%. Consider featuring trending venues or launching a booking promotion.`,
    venues: `Active venues reached ${Math.round(current)}, ${changePercent > 0 ? `up ${absChange}%` : `down ${absChange}%`} this period. Onboarding pipeline is ${changePercent > 3 ? "strong" : "steady"}.`,
    engagement: `Engagement rate is at ${(Math.round(current * 10) / 10)}%, ${changePercent > 0 ? "trending upward" : "trending downward"} by ${absChange} points.`,
    retention: `${Math.round(current)}% of users returned this period. ${current > 40 ? "Strong retention signal." : "Retention is below the 40% target — review onboarding flow."}`,
    support: changePercent > 10
      ? `Support tickets spiked ${absChange}% to ${Math.round(current)}. Investigate top categories for recurring issues.`
      : `Support volume is normal at ${Math.round(current)} tickets.`,
    errors: current > 3
      ? `Error rate is elevated at ${(Math.round(current * 100) / 100)}%. Investigate recent deployments and API timeouts.`
      : `Error rate is healthy at ${(Math.round(current * 100) / 100)}%.`,
  };

  return narratives[metric];
}

function generateSummary(sections: ReportSection[], anomalies: Anomaly[]): string {
  const highlights = sections
    .filter((s) => Math.abs(s.changePercent) > 5)
    .map((s) => {
      const dir = s.changePercent > 0 ? "up" : "down";
      return `${s.title} is ${dir} ${Math.abs(s.changePercent)}%`;
    });

  let summary = highlights.length > 0
    ? `Key movements: ${highlights.join("; ")}.`
    : "All metrics are tracking within normal ranges.";

  if (anomalies.length > 0) {
    const critical = anomalies.filter((a) => a.severity === "critical").length;
    const warnings = anomalies.filter((a) => a.severity === "warning").length;
    if (critical > 0) {
      summary += ` ${critical} critical anomal${critical === 1 ? "y" : "ies"} detected — immediate attention recommended.`;
    } else if (warnings > 0) {
      summary += ` ${warnings} metric${warnings === 1 ? "" : "s"} flagged for review.`;
    }
  }

  return summary;
}

function generateReportTitle(type: ReportType, date: Date): string {
  const dateStr = date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  switch (type) {
    case "daily_digest":
      return `Confetti Daily Digest — ${dateStr}`;
    case "weekly_summary":
      return `Confetti Weekly Summary — Week of ${dateStr}`;
    case "monthly_review":
      return `Confetti Monthly Review — ${date.toLocaleDateString("en-US", { month: "long", year: "numeric" })}`;
    case "anomaly_alert":
      return `Anomaly Alert — ${dateStr}`;
    case "custom":
      return `Custom Report — ${dateStr}`;
  }
}

function computeNextRun(schedule: string): string {
  const now = new Date();
  const next = new Date(now);

  if (schedule.startsWith("daily")) {
    next.setDate(next.getDate() + 1);
    next.setHours(9, 0, 0, 0);
  } else if (schedule.startsWith("weekly")) {
    const daysUntilMonday = ((1 - now.getDay() + 7) % 7) || 7;
    next.setDate(next.getDate() + daysUntilMonday);
    next.setHours(9, 0, 0, 0);
  } else if (schedule.startsWith("monthly")) {
    next.setMonth(next.getMonth() + 1, 1);
    next.setHours(9, 0, 0, 0);
  } else {
    next.setDate(next.getDate() + 1);
    next.setHours(9, 0, 0, 0);
  }

  return next.toISOString();
}
