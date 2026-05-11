// Lightweight localStorage-backed store for the Loop demo features.
// Holds the active loop itinerary, confetti currency, and onboarding flag.

export type LoopStop = {
  id: string;
  name: string;
  type: string;
  time: string;
  area?: string;
  done?: boolean;
  venueId?: string;
};

export type ActiveLoop = {
  id: string;
  passenger: string;
  date: string;
  groupSize: number;
  from: string;
  to: string;
  gate: string;
  boardingTime: string;
  occasion?: string;
  vibe?: string;
  stops: LoopStop[];
};

const KEY_LOOP = "loop:active";
const KEY_CONFETTI = "loop:confetti";
const KEY_ONBOARDED = "loop:onboarded";
const KEY_ONBOARDING = "loop:onboarding";

const EVENT_LOOP = "loop:active:changed";
const EVENT_CONFETTI = "loop:confetti:changed";

export function isClient() {
  return typeof window !== "undefined";
}

function emit(event: string) {
  if (!isClient()) return;
  window.dispatchEvent(new CustomEvent(event));
}

/** Subscribe to active-loop changes (same-tab + cross-tab). Returns unsubscribe. */
export function subscribeActiveLoop(cb: () => void): () => void {
  if (!isClient()) return () => {};
  const onStorage = (e: StorageEvent) => { if (e.key === KEY_LOOP) cb(); };
  window.addEventListener(EVENT_LOOP, cb);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(EVENT_LOOP, cb);
    window.removeEventListener("storage", onStorage);
  };
}

/** Subscribe to confetti changes (same-tab + cross-tab). Returns unsubscribe. */
export function subscribeConfetti(cb: () => void): () => void {
  if (!isClient()) return () => {};
  const onStorage = (e: StorageEvent) => { if (e.key === KEY_CONFETTI) cb(); };
  window.addEventListener(EVENT_CONFETTI, cb);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(EVENT_CONFETTI, cb);
    window.removeEventListener("storage", onStorage);
  };
}

export function getActiveLoop(): ActiveLoop | null {
  if (!isClient()) return null;
  try {
    const raw = localStorage.getItem(KEY_LOOP);
    return raw ? (JSON.parse(raw) as ActiveLoop) : null;
  } catch {
    return null;
  }
}

export function setActiveLoop(loop: ActiveLoop) {
  if (!isClient()) return;
  localStorage.setItem(KEY_LOOP, JSON.stringify(loop));
  emit(EVENT_LOOP);
}

export function clearActiveLoop() {
  if (!isClient()) return;
  localStorage.removeItem(KEY_LOOP);
  emit(EVENT_LOOP);
}

/** Toggle/set a stop's `done` flag and persist. Returns the updated loop. */
export function setStopDone(stopId: string, done = true): ActiveLoop | null {
  const loop = getActiveLoop();
  if (!loop) return null;
  const updated: ActiveLoop = {
    ...loop,
    stops: loop.stops.map((s) => (s.id === stopId ? { ...s, done } : s)),
  };
  setActiveLoop(updated);
  return updated;
}

export function getConfetti(): number {
  if (!isClient()) return 0;
  return Number(localStorage.getItem(KEY_CONFETTI) || 0);
}

export function addConfetti(amount: number): number {
  if (!isClient()) return 0;
  const next = getConfetti() + amount;
  localStorage.setItem(KEY_CONFETTI, String(next));
  emit(EVENT_CONFETTI);
  return next;
}

export function setConfetti(value: number) {
  if (!isClient()) return;
  localStorage.setItem(KEY_CONFETTI, String(Math.max(0, value)));
  emit(EVENT_CONFETTI);
}

export function isOnboarded(): boolean {
  if (!isClient()) return true;
  return localStorage.getItem(KEY_ONBOARDED) === "1";
}

export function markOnboarded() {
  if (!isClient()) return;
  localStorage.setItem(KEY_ONBOARDED, "1");
}

export function saveOnboarding(data: unknown) {
  if (!isClient()) return;
  localStorage.setItem(KEY_ONBOARDING, JSON.stringify(data));
}

export function loadOnboarding<T = Record<string, unknown>>(): T | null {
  if (!isClient()) return null;
  try {
    const raw = localStorage.getItem(KEY_ONBOARDING);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export function makeDemoLoop(input: Partial<ActiveLoop> = {}): ActiveLoop {
  const today = new Date();
  return {
    id: `LP-${Math.random().toString(36).slice(2, 7).toUpperCase()}`,
    passenger: input.passenger || "GUEST",
    date: input.date || today.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }),
    groupSize: input.groupSize ?? 2,
    from: input.from || "HOME",
    to: input.to || "NIGHT OUT",
    gate: input.gate || "SHAW",
    boardingTime: input.boardingTime || "6:30 PM",
    occasion: input.occasion,
    vibe: input.vibe,
    stops: input.stops || [
      { id: "s1", name: "Lila's Patio", type: "Small plates", time: "6:30 PM", area: "Shaw" },
      { id: "s2", name: "Mason St. Records", type: "Vinyl + nat wine", time: "8:15 PM", area: "U Street" },
      { id: "s3", name: "Aera Rooftop", type: "Nightcap", time: "10:00 PM", area: "Logan Circle" },
    ],
  };
}
