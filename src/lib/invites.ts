// Lightweight local-only invite store used by the demo invite + RSVP flow.
// Real implementation will be backed by the database; this keeps the UX
// consistent across the ready and RSVP pages within the same browser.

export type InviteStatus = "pending" | "sent" | "accepted" | "declined";

export type Invite = {
  id: string;
  email: string;
  token: string;
  status: InviteStatus;
  respondedAt?: string;
};

const STORAGE_PREFIX = "confetti.invites.";
const STORAGE_EVENT = "confetti.invites.changed";

function key(tripId: string) {
  return STORAGE_PREFIX + tripId;
}

export function loadInvites(tripId: string): Invite[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(key(tripId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Invite[]) : [];
  } catch {
    return [];
  }
}

export function saveInvites(tripId: string, invites: Invite[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key(tripId), JSON.stringify(invites));
    window.dispatchEvent(new CustomEvent(STORAGE_EVENT, { detail: { tripId } }));
  } catch {
    // ignore quota / privacy mode
  }
}

export function findInviteByToken(tripId: string, token: string): Invite | null {
  return loadInvites(tripId).find((i) => i.token === token) ?? null;
}

export function setInviteStatus(tripId: string, token: string, status: InviteStatus): Invite | null {
  const invites = loadInvites(tripId);
  const idx = invites.findIndex((i) => i.token === token);
  if (idx === -1) return null;
  const next: Invite = { ...invites[idx], status, respondedAt: new Date().toISOString() };
  invites[idx] = next;
  saveInvites(tripId, invites);
  return next;
}

/**
 * Subscribe to invite changes (cross-tab via `storage`, same-tab via custom event).
 * Returns an unsubscribe function.
 */
export function subscribeInvites(tripId: string, onChange: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const onStorage = (e: StorageEvent) => {
    if (e.key === key(tripId)) onChange();
  };
  const onCustom = (e: Event) => {
    const detail = (e as CustomEvent<{ tripId?: string }>).detail;
    if (!detail?.tripId || detail.tripId === tripId) onChange();
  };
  window.addEventListener("storage", onStorage);
  window.addEventListener(STORAGE_EVENT, onCustom);
  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(STORAGE_EVENT, onCustom);
  };
}
