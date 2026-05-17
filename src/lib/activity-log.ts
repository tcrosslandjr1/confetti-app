// Lightweight localStorage activity log shared across the loop / portal.
// Each entry is scoped to a tripId so per-trip and portal-wide views can read
// the same store. Keep entries small — this is a UX log, not analytics.

export type ActivityKind =
  | "check_in"
  | "stop_swapped"
  | "stop_added"
  | "stop_removed"
  | "rescheduled"
  | "joined"
  | "left"
  | "voted"
  | "booked"
  | "comment"
  | "plan_started"
  | "plan_completed";

export type ActivityEntry = {
  id: string;
  tripId: string;
  tripTitle?: string;
  actor: string;
  kind: ActivityKind;
  message: string;
  detail?: string;
  ts: number;
};

const KEY = "confetti:activity-log:v1";
const EVENT = "confetti:activity-log:changed";
const MAX = 300;

function isClient() {
  return typeof window !== "undefined";
}

export function readLog(): ActivityEntry[] {
  if (!isClient()) return [];
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as ActivityEntry[]) : [];
  } catch {
    return [];
  }
}

function writeLog(entries: ActivityEntry[]) {
  if (!isClient()) return;
  const trimmed = entries.slice(0, MAX);
  localStorage.setItem(KEY, JSON.stringify(trimmed));
  window.dispatchEvent(new CustomEvent(EVENT));
}

export function logActivity(
  input: Omit<ActivityEntry, "id" | "ts"> & { ts?: number },
): ActivityEntry {
  const entry: ActivityEntry = {
    id: `a-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    ts: input.ts ?? Date.now(),
    ...input,
  };
  const next = [entry, ...readLog()];
  writeLog(next);
  return entry;
}

export function getActivityForTrip(tripId: string): ActivityEntry[] {
  return readLog().filter((e) => e.tripId === tripId);
}

export function clearActivityForTrip(tripId: string) {
  writeLog(readLog().filter((e) => e.tripId !== tripId));
}

export function subscribeActivity(cb: () => void): () => void {
  if (!isClient()) return () => {};
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) cb();
  };
  window.addEventListener(EVENT, cb);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(EVENT, cb);
    window.removeEventListener("storage", onStorage);
  };
}

export function formatRelative(ts: number): string {
  const diff = Date.now() - ts;
  const s = Math.floor(diff / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(ts).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}
