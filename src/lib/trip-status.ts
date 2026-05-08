// Local store for the host's "running late / reschedule" status.
// Mirrors the pattern in src/lib/invites.ts so the Ready, Collab, and RSVP
// pages stay in sync via storage + custom events without a backend round-trip.

export type TripStatus = {
  minutesLate: number;          // 0 = on time
  updatedAt: string;            // ISO timestamp
  note?: string;                // optional host message
  rescheduledAt?: string;       // ISO datetime if host picked a new date/time
  cancelled?: boolean;          // true if host cancelled the plan
};

const STORAGE_PREFIX = "confetti.status.";
const STORAGE_EVENT = "confetti.status.changed";

function key(tripId: string) {
  return STORAGE_PREFIX + tripId;
}

export function loadStatus(tripId: string): TripStatus | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(key(tripId));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed.minutesLate !== "number") return null;
    return parsed as TripStatus;
  } catch {
    return null;
  }
}

export function saveStatus(tripId: string, status: TripStatus | null) {
  if (typeof window === "undefined") return;
  try {
    if (status) window.localStorage.setItem(key(tripId), JSON.stringify(status));
    else window.localStorage.removeItem(key(tripId));
    window.dispatchEvent(new CustomEvent(STORAGE_EVENT, { detail: { tripId } }));
  } catch {
    // ignore quota / private mode
  }
}

export function setMinutesLate(tripId: string, minutesLate: number, note?: string): TripStatus {
  const next: TripStatus = {
    minutesLate: Math.max(0, Math.round(minutesLate)),
    updatedAt: new Date().toISOString(),
    note: note?.trim() || undefined,
  };
  saveStatus(tripId, next);
  return next;
}

export function clearStatus(tripId: string) {
  saveStatus(tripId, null);
}

export function subscribeStatus(tripId: string, onChange: () => void): () => void {
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

/** Format a relative-ish "Updated 8:42 PM" string for the badge. */
export function formatUpdatedAt(iso: string): string {
  try {
    const d = new Date(iso);
    return `Updated ${d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`;
  } catch {
    return "Updated just now";
  }
}

/** Apply minutesLate to a "11:30 AM"-style label, returning a shifted label. */
export function shiftTimeLabel(label: string, minutesLate: number): string {
  const m = label.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (!m) return label;
  let h = parseInt(m[1], 10);
  const min = parseInt(m[2], 10);
  const mer = m[3]?.toUpperCase();
  if (mer === "PM" && h < 12) h += 12;
  if (mer === "AM" && h === 12) h = 0;
  const total = (h * 60 + min + minutesLate + 24 * 60) % (24 * 60);
  const h24 = Math.floor(total / 60);
  const mm = total % 60;
  const outMer = h24 >= 12 ? "PM" : "AM";
  const h12 = ((h24 + 11) % 12) + 1;
  return `${h12}:${mm.toString().padStart(2, "0")} ${outMer}`;
}
