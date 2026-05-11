// Lightweight localStorage-backed store for the Loop demo features.
// Holds the active loop itinerary, confetti currency, and onboarding flag.

export type LoopStop = {
  id: string;
  name: string;
  type: string;
  time: string;
  area?: string;
  done?: boolean;
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

export function isClient() {
  return typeof window !== "undefined";
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
}

export function getConfetti(): number {
  if (!isClient()) return 0;
  return Number(localStorage.getItem(KEY_CONFETTI) || 0);
}

export function addConfetti(amount: number): number {
  if (!isClient()) return 0;
  const next = getConfetti() + amount;
  localStorage.setItem(KEY_CONFETTI, String(next));
  return next;
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
