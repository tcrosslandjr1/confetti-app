// Security trace log: records (a) viewAs role switches and (b) protected
// action attempts (allowed or denied). Module singleton, persisted to
// localStorage so admins can trace recent activity across navigations.
import { useSyncExternalStore } from "react";

export type SecurityTraceKind =
  | "view-switch"
  | "view-exit"
  | "protected-attempt";

export type SecurityTraceOutcome = "allowed" | "denied" | "info";

export type SecurityTraceEntry = {
  id: string;
  at: string; // ISO
  kind: SecurityTraceKind;
  outcome: SecurityTraceOutcome;
  /** "admin" | "customer" | "business" | "visitor" | "anonymous" */
  actorRole: string;
  /** True viewer role behind any impersonation (e.g. real "admin"). */
  realRole?: string | null;
  userId?: string | null;
  userEmail?: string | null;
  /** For view-switch: the role being switched into. */
  toRole?: string | null;
  /** For view-switch: the role being switched out of. */
  fromRole?: string | null;
  /** For protected-attempt: the action / feature name. */
  action?: string | null;
  path?: string | null;
  note?: string;
};

const KEY = "confetti.security-trace.v1";
const MAX = 300;

const listeners = new Set<() => void>();
let entries: SecurityTraceEntry[] = load();

function load(): SecurityTraceEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as SecurityTraceEntry[];
    return Array.isArray(parsed) ? parsed.slice(0, MAX) : [];
  } catch {
    return [];
  }
}

function persist() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(entries.slice(0, MAX)));
  } catch {
    // ignore quota
  }
}

function emit() {
  for (const l of listeners) l();
}

export function logSecurityTrace(entry: Omit<SecurityTraceEntry, "id" | "at">) {
  const next: SecurityTraceEntry = {
    id: `ST-${Math.floor(Math.random() * 900000) + 100000}`,
    at: new Date().toISOString(),
    ...entry,
  };
  entries = [next, ...entries].slice(0, MAX);
  persist();
  emit();
}

export function clearSecurityTrace() {
  entries = [];
  persist();
  emit();
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function useSecurityTrace() {
  return useSyncExternalStore(
    subscribe,
    () => entries,
    () => entries,
  );
}
