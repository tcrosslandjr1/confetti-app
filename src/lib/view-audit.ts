// On-screen audit of view-switch / route-guard / redirect decisions.
// Lightweight singleton store so any component can record a step and the
// floating ViewAuditOverlay re-renders.
import { useSyncExternalStore } from "react";

export type ViewAuditKind =
  | "guard"           // a route guard ran
  | "redirect"        // a navigation/redirect was issued
  | "view-change"     // viewAs / effectiveRole changed
  | "auth"            // sign-in / sign-out / session change
  | "note";           // misc trace point

export type ViewAuditEntry = {
  id: string;
  at: number;
  kind: ViewAuditKind;
  source: string;     // e.g. "Landing", "AdminLayout", "AuthProvider"
  role?: string | null;       // effective role at the time
  viewAs?: string | null;
  realRole?: string | null;
  path?: string | null;
  target?: string | null;     // redirect destination if any
  decision?: string | null;   // short verdict: "allow" | "redirect" | "block" | ...
  reason?: string | null;     // why
};

const MAX = 100;
const listeners = new Set<() => void>();
let entries: ViewAuditEntry[] = [];
let counter = 0;

function emit() { for (const l of listeners) l(); }

export function logViewAudit(entry: Omit<ViewAuditEntry, "id" | "at">) {
  counter += 1;
  const next: ViewAuditEntry = {
    id: `VA-${counter}`,
    at: Date.now(),
    ...entry,
  };
  entries = [next, ...entries].slice(0, MAX);
  if (typeof window !== "undefined") {
    // Mirror to console so users can also grep the devtools log.
    // eslint-disable-next-line no-console
    console.info(
      `[view-audit] ${next.kind} · ${next.source}` +
        (next.decision ? ` · ${next.decision}` : "") +
        (next.path ? ` · path=${next.path}` : "") +
        (next.target ? ` → ${next.target}` : ""),
      next,
    );
  }
  emit();
}

export function clearViewAudit() {
  entries = [];
  emit();
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function useViewAudit() {
  return useSyncExternalStore(subscribe, () => entries, () => entries);
}
