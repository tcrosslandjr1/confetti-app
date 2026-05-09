// In-memory log of denied access attempts (visitors trying to reach gated
// pages/CTAs). Module singleton; resets on full reload.
import { useSyncExternalStore } from "react";

export type DenialSource = "gated-link" | "route-guard";
export type DenialFeature = "planning" | "booking" | "portal" | "concierge" | "trips" | "reservations" | "other";

export type DenialEntry = {
  id: string;
  at: string; // ISO
  source: DenialSource;
  feature: DenialFeature;
  attemptedPath: string;
  fromPath: string;
  viewerRole: string; // "visitor" | "anonymous" etc.
  userId?: string | null;
  note?: string;
};

const KEY = "concierge.access-denials.v1";
const MAX = 250;

const listeners = new Set<() => void>();
let entries: DenialEntry[] = load();

function load(): DenialEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as DenialEntry[];
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

export function logAccessDenial(entry: Omit<DenialEntry, "id" | "at">) {
  const next: DenialEntry = {
    id: `AD-${Math.floor(Math.random() * 900000) + 100000}`,
    at: new Date().toISOString(),
    ...entry,
  };
  entries = [next, ...entries].slice(0, MAX);
  persist();
  emit();
}

export function clearAccessDenials() {
  entries = [];
  persist();
  emit();
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function useAccessDenials() {
  return useSyncExternalStore(subscribe, () => entries, () => entries);
}

export function inferFeatureFromPath(path: string): DenialFeature {
  if (path.startsWith("/plan")) return "planning";
  if (path.startsWith("/portal/bookings") || path.includes("booking")) return "booking";
  if (path.startsWith("/portal")) return "portal";
  if (path.startsWith("/concierge")) return "concierge";
  if (path.startsWith("/trips")) return "trips";
  if (path.startsWith("/reservations")) return "reservations";
  return "other";
}
