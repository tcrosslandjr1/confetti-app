/**
 * Feature Flags Agent
 *
 * Toggle features, percentage rollouts, user segment targeting,
 * and auto-rollback for Confetti. Supports multi-environment
 * flags (dev/staging/production) with a full audit trail.
 *
 * Features:
 *  - Create flags with environment scoping
 *  - Rollout strategies: all, percentage, user_segment, user_list, gradual
 *  - Evaluate flags per-user with deterministic hashing
 *  - Error tracking with auto-rollback when threshold is exceeded
 *  - Full audit log of every flag change
 *  - Metrics: enabled/disabled user counts, error counts
 */

import { supabase } from "../supabase";

// ═══════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════

export type FlagStatus = "active" | "inactive" | "archived";
export type RolloutStrategy = "all" | "percentage" | "user_segment" | "user_list" | "gradual";
export type FlagEnvironment = "development" | "staging" | "production";

export interface FeatureFlag {
  id: string;
  key: string;
  name: string;
  description: string;
  status: FlagStatus;
  environment: FlagEnvironment[];
  rolloutStrategy: RolloutStrategy;
  rolloutPercentage: number;
  targetSegments: string[];
  targetUserIds: string[];
  createdAt: string;
  updatedAt: string;
  lastToggledAt?: string;
  lastToggledBy?: string;
  errorThreshold?: number;
  autoRollback: boolean;
  rollbackTriggered: boolean;
}

export interface FlagEvaluation {
  flagKey: string;
  userId: string;
  enabled: boolean;
  reason: string;
}

export interface FlagAuditEntry {
  flagId: string;
  action: string;
  performedBy: string;
  previousValue: any;
  newValue: any;
  timestamp: string;
}

export interface FlagMetrics {
  flagId: string;
  flagKey: string;
  evaluations: number;
  enabledCount: number;
  disabledCount: number;
  errorCount: number;
  rollbackTriggered: boolean;
}

// ═══════════════════════════════════════════════════════════
// In-Memory Store (local-first)
// ═══════════════════════════════════════════════════════════

const flagStore = new Map<string, FeatureFlag>();
const auditStore = new Map<string, FlagAuditEntry[]>();
const errorCountStore = new Map<string, number>();
const evaluationCountStore = new Map<string, { enabled: number; disabled: number; total: number }>();

let idCounter = 7000;
function nextId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${(idCounter++).toString(36)}`;
}

// ═══════════════════════════════════════════════════════════
// Flag Management
// ═══════════════════════════════════════════════════════════

/** Create a new feature flag (starts inactive) */
export function createFlag(
  key: string,
  name: string,
  description: string,
  environment: FlagEnvironment[] = ["development"]
): FeatureFlag {
  const flag: FeatureFlag = {
    id: nextId("flag"),
    key,
    name,
    description,
    status: "inactive",
    environment,
    rolloutStrategy: "all",
    rolloutPercentage: 100,
    targetSegments: [],
    targetUserIds: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    autoRollback: false,
    rollbackTriggered: false,
  };
  flagStore.set(flag.id, flag);
  auditStore.set(flag.id, []);
  errorCountStore.set(flag.key, 0);
  evaluationCountStore.set(flag.key, { enabled: 0, disabled: 0, total: 0 });

  addAuditEntry(flag.id, "created", "system", null, { key, name, environment });
  return flag;
}

/** Toggle a flag on or off with audit trail */
export function toggleFlag(flagId: string, enabled: boolean, performedBy: string): FeatureFlag | null {
  const flag = flagStore.get(flagId);
  if (!flag) return null;

  const previousStatus = flag.status;
  flag.status = enabled ? "active" : "inactive";
  flag.lastToggledAt = new Date().toISOString();
  flag.lastToggledBy = performedBy;
  flag.updatedAt = new Date().toISOString();

  // Reset rollback if manually re-enabled
  if (enabled && flag.rollbackTriggered) {
    flag.rollbackTriggered = false;
    errorCountStore.set(flag.key, 0);
  }

  addAuditEntry(flagId, "toggled", performedBy, previousStatus, flag.status);
  return flag;
}

/** Configure rollout strategy for a flag */
export function setRolloutStrategy(
  flagId: string,
  strategy: RolloutStrategy,
  opts?: {
    percentage?: number;
    segments?: string[];
    userIds?: string[];
  }
): FeatureFlag | null {
  const flag = flagStore.get(flagId);
  if (!flag) return null;

  const previous = {
    strategy: flag.rolloutStrategy,
    percentage: flag.rolloutPercentage,
    segments: [...flag.targetSegments],
    userIds: [...flag.targetUserIds],
  };

  flag.rolloutStrategy = strategy;
  if (opts?.percentage !== undefined) flag.rolloutPercentage = Math.min(100, Math.max(0, opts.percentage));
  if (opts?.segments) flag.targetSegments = opts.segments;
  if (opts?.userIds) flag.targetUserIds = opts.userIds;
  flag.updatedAt = new Date().toISOString();

  addAuditEntry(flag.id, "rollout_changed", "system", previous, {
    strategy: flag.rolloutStrategy,
    percentage: flag.rolloutPercentage,
    segments: flag.targetSegments,
    userIds: flag.targetUserIds,
  });

  return flag;
}

/** Archive a flag */
export function archiveFlag(flagId: string): FeatureFlag | null {
  const flag = flagStore.get(flagId);
  if (!flag) return null;

  const prev = flag.status;
  flag.status = "archived";
  flag.updatedAt = new Date().toISOString();
  addAuditEntry(flagId, "archived", "system", prev, "archived");
  return flag;
}

/** Get a single flag by ID */
export function getFlag(flagId: string): FeatureFlag | null {
  return flagStore.get(flagId) ?? null;
}

/** Get a flag by key */
export function getFlagByKey(key: string): FeatureFlag | null {
  return Array.from(flagStore.values()).find((f) => f.key === key) ?? null;
}

/** List all flags, optionally filtered by environment */
export function getAllFlags(environment?: FlagEnvironment): FeatureFlag[] {
  let flags = Array.from(flagStore.values()).filter((f) => f.status !== "archived");
  if (environment) {
    flags = flags.filter((f) => f.environment.includes(environment));
  }
  return flags.sort((a, b) => a.key.localeCompare(b.key));
}

// ═══════════════════════════════════════════════════════════
// Flag Evaluation
// ═══════════════════════════════════════════════════════════

/** Evaluate whether a flag is enabled for a specific user */
export function evaluateFlag(
  flagKey: string,
  userId: string,
  userSegments: string[] = []
): FlagEvaluation {
  const flag = Array.from(flagStore.values()).find((f) => f.key === flagKey);

  if (!flag || flag.status !== "active") {
    trackEvaluation(flagKey, false);
    return { flagKey, userId, enabled: false, reason: flag ? "flag_inactive" : "flag_not_found" };
  }

  if (flag.rollbackTriggered) {
    trackEvaluation(flagKey, false);
    return { flagKey, userId, enabled: false, reason: "auto_rollback_triggered" };
  }

  let enabled = false;
  let reason = "";

  switch (flag.rolloutStrategy) {
    case "all":
      enabled = true;
      reason = "strategy_all";
      break;

    case "percentage":
      enabled = hashUserToPercentage(userId, flagKey) < flag.rolloutPercentage;
      reason = enabled ? `percentage_included (${flag.rolloutPercentage}%)` : `percentage_excluded (${flag.rolloutPercentage}%)`;
      break;

    case "user_segment":
      enabled = flag.targetSegments.some((seg) => userSegments.includes(seg));
      reason = enabled ? `segment_match: ${userSegments.join(", ")}` : "segment_no_match";
      break;

    case "user_list":
      enabled = flag.targetUserIds.includes(userId);
      reason = enabled ? "user_in_list" : "user_not_in_list";
      break;

    case "gradual":
      // Gradual rollout: percentage increases over time since flag was activated
      const daysSinceToggle = flag.lastToggledAt
        ? (Date.now() - new Date(flag.lastToggledAt).getTime()) / 86400000
        : 0;
      const gradualPercent = Math.min(flag.rolloutPercentage, daysSinceToggle * 10); // +10% per day
      enabled = hashUserToPercentage(userId, flagKey) < gradualPercent;
      reason = enabled ? `gradual_included (${Math.round(gradualPercent)}%)` : `gradual_excluded (${Math.round(gradualPercent)}%)`;
      break;
  }

  trackEvaluation(flagKey, enabled);
  return { flagKey, userId, enabled, reason };
}

/** Evaluate all active flags for a user */
export function evaluateFlags(
  userId: string,
  userSegments: string[] = []
): FlagEvaluation[] {
  const activeFlags = Array.from(flagStore.values()).filter((f) => f.status === "active");
  return activeFlags.map((f) => evaluateFlag(f.key, userId, userSegments));
}

/** Deterministic hash: maps (userId, flagKey) to 0-99 */
function hashUserToPercentage(userId: string, flagKey: string): number {
  const str = `${userId}:${flagKey}`;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash) % 100;
}

/** Track evaluation counts */
function trackEvaluation(flagKey: string, enabled: boolean): void {
  const counts = evaluationCountStore.get(flagKey) ?? { enabled: 0, disabled: 0, total: 0 };
  counts.total++;
  if (enabled) counts.enabled++;
  else counts.disabled++;
  evaluationCountStore.set(flagKey, counts);
}

// ═══════════════════════════════════════════════════════════
// Error Tracking & Auto-Rollback
// ═══════════════════════════════════════════════════════════

/** Record an error for a flag — triggers auto-rollback if threshold exceeded */
export function recordFlagError(flagKey: string): {
  errorCount: number;
  rollbackTriggered: boolean;
} {
  const currentCount = (errorCountStore.get(flagKey) ?? 0) + 1;
  errorCountStore.set(flagKey, currentCount);

  const flag = Array.from(flagStore.values()).find((f) => f.key === flagKey);
  let rollbackTriggered = false;

  if (flag && flag.autoRollback && flag.errorThreshold && currentCount >= flag.errorThreshold) {
    flag.rollbackTriggered = true;
    flag.status = "inactive";
    flag.updatedAt = new Date().toISOString();
    rollbackTriggered = true;
    addAuditEntry(flag.id, "auto_rollback", "system", "active", `inactive (${currentCount} errors exceeded threshold ${flag.errorThreshold})`);
  }

  return { errorCount: currentCount, rollbackTriggered };
}

// ═══════════════════════════════════════════════════════════
// Audit Log
// ═══════════════════════════════════════════════════════════

/** Add an audit entry */
function addAuditEntry(
  flagId: string,
  action: string,
  performedBy: string,
  previousValue: any,
  newValue: any
): void {
  const entries = auditStore.get(flagId) ?? [];
  entries.push({
    flagId,
    action,
    performedBy,
    previousValue,
    newValue,
    timestamp: new Date().toISOString(),
  });
  auditStore.set(flagId, entries);
}

/** Get the audit log for a flag */
export function getFlagAuditLog(flagId: string): FlagAuditEntry[] {
  return auditStore.get(flagId) ?? [];
}

// ═══════════════════════════════════════════════════════════
// Metrics
// ═══════════════════════════════════════════════════════════

/** Get metrics for a specific flag */
export function getFlagMetrics(flagId: string): FlagMetrics | null {
  const flag = flagStore.get(flagId);
  if (!flag) return null;

  const counts = evaluationCountStore.get(flag.key) ?? { enabled: 0, disabled: 0, total: 0 };
  const errors = errorCountStore.get(flag.key) ?? 0;

  return {
    flagId: flag.id,
    flagKey: flag.key,
    evaluations: counts.total,
    enabledCount: counts.enabled,
    disabledCount: counts.disabled,
    errorCount: errors,
    rollbackTriggered: flag.rollbackTriggered,
  };
}

// ═══════════════════════════════════════════════════════════
// Demo Seed
// ═══════════════════════════════════════════════════════════

/** Create sample feature flags for demo */
export function seedFlagDemo(): FeatureFlag[] {
  const flags: FeatureFlag[] = [];

  // Dark mode — fully rolled out
  const darkMode = createFlag("dark_mode", "Dark Mode", "Enable dark mode theme across the app", ["development", "staging", "production"]);
  toggleFlag(darkMode.id, true, "tyrone");
  flags.push(darkMode);

  // New chat UI — percentage rollout in production
  const newChat = createFlag("new_chat_ui", "New Chat UI", "Redesigned AI chat interface with streaming responses", ["development", "staging", "production"]);
  setRolloutStrategy(newChat.id, "percentage", { percentage: 25 });
  toggleFlag(newChat.id, true, "tyrone");
  flags.push(newChat);

  // AI v2 model — segment rollout to Black tier only
  const aiV2 = createFlag("ai_v2_model", "AI V2 Model", "GPT-4o powered recommendations (upgraded from GPT-3.5)", ["development", "staging"]);
  setRolloutStrategy(aiV2.id, "user_segment", { segments: ["black_tier", "beta_testers"] });
  toggleFlag(aiV2.id, true, "tyrone");
  flags.push(aiV2);

  // Group video chat — user list for internal testing
  const videoChat = createFlag("group_video_chat", "Group Video Chat", "Live video chat during group plan creation", ["development"]);
  setRolloutStrategy(videoChat.id, "user_list", { userIds: ["user_tyrone", "user_test_001", "user_test_002"] });
  toggleFlag(videoChat.id, true, "tyrone");
  flags.push(videoChat);

  // Venue AR preview — gradual rollout with auto-rollback
  const arPreview = createFlag("venue_ar_preview", "Venue AR Preview", "Augmented reality venue preview from the street", ["development"]);
  arPreview.autoRollback = true;
  arPreview.errorThreshold = 50;
  setRolloutStrategy(arPreview.id, "gradual", { percentage: 100 });
  toggleFlag(arPreview.id, true, "tyrone");
  flags.push(arPreview);

  return flags;
}
