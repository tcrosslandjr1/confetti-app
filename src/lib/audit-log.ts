// Simple in-memory audit log store for admin actions.
// Persists across route navigations (module singleton) but resets on full reload.
import { useSyncExternalStore } from "react";

export type AuditAction =
  | "approve"
  | "remove"
  | "reject"
  | "confirm"
  | "cancel"
  | "edit"
  | "role"
  | "status";
export type AuditEntity = "booking" | "venue" | "report" | "user";

export type AuditEntry = {
  id: string;
  at: string; // ISO
  admin: string;
  action: AuditAction;
  entity: AuditEntity;
  targetId: string;
  summary: string;
};

const listeners = new Set<() => void>();
let entries: AuditEntry[] = seed();

function seed(): AuditEntry[] {
  const now = Date.now();
  const mk = (mins: number, e: Omit<AuditEntry, "id" | "at">): AuditEntry => ({
    id: `AL-${(10000 - mins).toString()}`,
    at: new Date(now - mins * 60_000).toISOString(),
    ...e,
  });
  return [
    mk(3, {
      admin: "admin@confetti.com",
      action: "approve",
      entity: "report",
      targetId: "RP-2037",
      summary: "Approved review report on Albi",
    }),
    mk(22, {
      admin: "admin@confetti.com",
      action: "remove",
      entity: "report",
      targetId: "RP-2036",
      summary: "Removed harassing comment",
    }),
    mk(64, {
      admin: "devon@h.dev",
      action: "approve",
      entity: "venue",
      targetId: "VN-300",
      summary: "Approved Maydan listing",
    }),
    mk(120, {
      admin: "admin@confetti.com",
      action: "confirm",
      entity: "booking",
      targetId: "BK-1041",
      summary: "Confirmed booking at Albi",
    }),
    mk(240, {
      admin: "admin@confetti.com",
      action: "role",
      entity: "user",
      targetId: "U-1040",
      summary: "Set role to moderator",
    }),
  ];
}

function emit() {
  for (const l of listeners) l();
}

export function logAudit(entry: Omit<AuditEntry, "id" | "at">) {
  const next: AuditEntry = {
    id: `AL-${Math.floor(Math.random() * 90000) + 10000}`,
    at: new Date().toISOString(),
    ...entry,
  };
  entries = [next, ...entries];
  emit();
}

export function clearAudit() {
  entries = [];
  emit();
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function useAuditLog() {
  return useSyncExternalStore(
    subscribe,
    () => entries,
    () => entries,
  );
}
