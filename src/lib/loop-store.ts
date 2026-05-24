// Lightweight localStorage-backed store for the plan demo features.
// Holds the active loop itinerary, confetti currency, and onboarding flag.

export type StopKind = "departure" | "layover" | "destination";

export type LoopStop = {
  id: string;
  name: string;
  type: string;
  time: string;
  area?: string;
  done?: boolean;
  /** True once Confetti points have been awarded for checking in here. */
  awarded?: boolean;
  /** ISO timestamp recorded the first time this stop was checked in. */
  checkedInAt?: string;
  /** Per-stop Confetti override; defaults to even split of loop.confettiPoints. */
  points?: number;
  venueId?: string;
  /** Optional pre-resolved coordinates — skips geocoding lookup. */
  lat?: number;
  lng?: number;
  /** "Why this pick" rationale from the Itinerary Agent. */
  rationale?: string;
  /** Template slot the stop fills (e.g. "Pre-game", "Main"). */
  slot?: string;
  // Rich boarding-pass extras (all optional for back-compat)
  kind?: StopKind;
  emoji?: string;
  detail?: string;
  address?: string;
  parking?: { primary: string; secondary?: string };
  sundayParking?: string;
  ev?: { brand: string; spec: string; chargeTime: string; sub?: string };
  driveAfter?: { minutes: number; destination: string };
  tags?: { label: string; variant: "vibe" | "ev" | "time" }[];
  bookable?: boolean;
  bookingType?: "reservation" | "parking" | "both";
  /** Source category for pre-order menu generation (meal/drinks/activity/scenic). */
  category?: string;
  // ── Extra stop details (all optional, surfaced on the boarding pass) ──
  /** Per-person spend tier, e.g. "$", "$$", "$$$", "$$$$". */
  priceLevel?: string;
  /** Dress code hint, e.g. "Smart casual", "No sneakers", "Anything goes". */
  dressCode?: string;
  /** House signature — drink, dish, or moment to try. */
  signature?: string;
  /** Crowd / age vibe, e.g. "Late-20s creatives", "Date-night couples". */
  crowd?: string;
  /** Direct phone for last-minute calls. */
  phone?: string;
  /** Best for / occasion fit, e.g. "Birthdays", "First dates". */
  bestFor?: string;
  /** Typical wait window if walk-in, e.g. "15–30 min after 9pm". */
  waitTime?: string;
  /** True when this stop was inserted via a sponsored partner campaign. */
  sponsored?: boolean;
  /** Customer-facing label, e.g. "Partner Pick · Matches your vibe". */
  partnerLabel?: string;
  /** Boost campaign id for click/booking attribution. */
  boostCampaignId?: string;
};

export type LoopBonusMove = {
  name: string;
  reason: string;
  time?: string;
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
  // Rich boarding-pass extras (all optional)
  occasionEmoji?: string;
  day?: string;
  vibes?: string[];
  confettiPoints?: number;
  fromName?: string;
  toName?: string;
  // ── Multi-agent pipeline output (all optional for back-compat) ──
  /** City the plan is anchored in, e.g. "Washington DC" */
  city?: string;
  /** Themed boarding-pass title from the Naming Agent */
  experienceName?: string;
  /** One-line tagline */
  experienceTagline?: string;
  /** Template Agent blueprint name, e.g. "Glitter & Giggles" */
  blueprint?: string;
  /** "$60–$90" per-person estimate */
  estimatedSpend?: string;
  /** 0-1 fit score from the Relevance Agent */
  fitScore?: number;
  /** Optional Quality Guardrail note */
  guardrailNote?: string;
  /** Optional Impromptu Ideas Agent bonus move */
  bonusMove?: LoopBonusMove;
  /** Original generator inputs — used by "Change My Night" / Live Rerouting Agent. */
  planParams?: {
    city?: string;
    occasionId?: string;
    occasionLabel?: string;
    vibeId?: string;
    vibeLabel?: string;
    groupSize?: number;
    date?: string;
    startTime?: string;
    duration?: string;
    budget?: 1 | 2 | 3 | 4;
  };
  /** Filled when the plan has been booked end-to-end via the BookingModal. */
  booking?: {
    ref: string;
    bookedAt: string;
    /** Per-stop confirmation refs keyed by stop id. */
    stops: Record<string, string>;
  };
};

const KEY_LOOP = "loop:active";
const KEY_CONFETTI = "loop:confetti";
const KEY_ONBOARDED = "loop:onboarded";
const KEY_ONBOARDING = "loop:onboarding";
const KEY_STAMPS = "loop:stamps";

const EVENT_LOOP = "loop:active:changed";
const EVENT_CONFETTI = "loop:confetti:changed";
const EVENT_STAMPS = "loop:stamps:changed";

export type PassportStamp = {
  /** Unique key — usually the loop id so one loop earns one stamp. */
  id: string;
  city: string;
  theme: string;
  /** Short display date, e.g. "May 10". */
  date: string;
  /** ISO timestamp the stamp was earned. */
  earnedAt: string;
};

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
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY_LOOP) cb();
  };
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
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY_CONFETTI) cb();
  };
  window.addEventListener(EVENT_CONFETTI, cb);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(EVENT_CONFETTI, cb);
    window.removeEventListener("storage", onStorage);
  };
}

/** Subscribe to stamp changes (same-tab + cross-tab). Returns unsubscribe. */
export function subscribeStamps(cb: () => void): () => void {
  if (!isClient()) return () => {};
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY_STAMPS) cb();
  };
  window.addEventListener(EVENT_STAMPS, cb);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(EVENT_STAMPS, cb);
    window.removeEventListener("storage", onStorage);
  };
}

export function getStamps(): PassportStamp[] {
  if (!isClient()) return [];
  try {
    const raw = localStorage.getItem(KEY_STAMPS);
    return raw ? (JSON.parse(raw) as PassportStamp[]) : [];
  } catch {
    return [];
  }
}

function saveStamps(list: PassportStamp[]) {
  if (!isClient()) return;
  localStorage.setItem(KEY_STAMPS, JSON.stringify(list));
  emit(EVENT_STAMPS);
}

/** Add a stamp if one with the same id doesn't already exist. Returns true if added. */
export function addStamp(stamp: PassportStamp): boolean {
  const list = getStamps();
  if (list.some((s) => s.id === stamp.id)) return false;
  saveStamps([stamp, ...list]);
  return true;
}

export function clearStamps() {
  if (!isClient()) return;
  localStorage.removeItem(KEY_STAMPS);
  emit(EVENT_STAMPS);
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

/** Remove a stop by id. Returns the updated loop, or null if no active loop / stop not found. */
export function removeStop(stopId: string): ActiveLoop | null {
  const loop = getActiveLoop();
  if (!loop) return null;
  const next = loop.stops.filter((s) => s.id !== stopId);
  if (next.length === loop.stops.length) return null;
  const updated: ActiveLoop = { ...loop, stops: next };
  setActiveLoop(updated);
  return updated;
}

/** Replace a stop in place. Preserves position and original `id`, `time`, and `kind`. */
export function replaceStop(
  stopId: string,
  patch: Partial<LoopStop>,
): ActiveLoop | null {
  const loop = getActiveLoop();
  if (!loop) return null;
  const idx = loop.stops.findIndex((s) => s.id === stopId);
  if (idx < 0) return null;
  const original = loop.stops[idx];
  const merged: LoopStop = {
    ...patch,
    id: original.id,
    time: patch.time ?? original.time,
    kind: patch.kind ?? original.kind,
    name: patch.name ?? original.name,
    type: patch.type ?? original.type,
    // Reset enrichment that's specific to the previous venue.
    awarded: false,
    done: false,
    checkedInAt: undefined,
  };
  const stops = [...loop.stops];
  stops[idx] = merged;
  const updated: ActiveLoop = { ...loop, stops };
  setActiveLoop(updated);
  return updated;
}

/** Reorder the stops array in-place to the given id sequence and persist. */
export function reorderStops(orderedIds: string[]): ActiveLoop | null {
  const loop = getActiveLoop();
  if (!loop) return null;
  const byId = new Map(loop.stops.map((s) => [s.id, s]));
  const next: LoopStop[] = [];
  for (const id of orderedIds) {
    const s = byId.get(id);
    if (s) {
      next.push(s);
      byId.delete(id);
    }
  }
  // Append any leftovers that weren't named (defensive — shouldn't happen).
  for (const s of byId.values()) next.push(s);
  const updated: ActiveLoop = { ...loop, stops: next };
  setActiveLoop(updated);
  return updated;
}

/** Append a stop to the end of the loop (or insert at a given index). */
export function addStop(
  stop: LoopStop,
  position?: number,
): ActiveLoop | null {
  const loop = getActiveLoop();
  if (!loop) return null;
  const stops = [...loop.stops];
  if (typeof position === "number" && position >= 0 && position <= stops.length) {
    stops.splice(position, 0, stop);
  } else {
    stops.push(stop);
  }
  const updated: ActiveLoop = { ...loop, stops };
  setActiveLoop(updated);
  return updated;
}

export type CheckInResult = {
  loop: ActiveLoop;
  stop: LoopStop;
  awarded: number;
  alreadyAwarded: boolean;
};

/**
 * Idempotent check-in for a stop. Marks it done, stamps checkedInAt, awards
 * Confetti points (only the first time), and returns what changed so callers
 * can show a toast / log activity.
 */
export function checkInStop(stopId: string): CheckInResult | null {
  const loop = getActiveLoop();
  if (!loop) return null;
  const target = loop.stops.find((s) => s.id === stopId);
  if (!target) return null;

  const alreadyAwarded = !!target.awarded;
  const perStopDefault = Math.round((loop.confettiPoints ?? 250) / Math.max(1, loop.stops.length));
  const award = alreadyAwarded ? 0 : (target.points ?? perStopDefault);
  const stamp = target.checkedInAt ?? new Date().toISOString();

  const updatedStop: LoopStop = {
    ...target,
    done: true,
    checkedInAt: stamp,
    awarded: true,
  };
  const updated: ActiveLoop = {
    ...loop,
    stops: loop.stops.map((s) => (s.id === stopId ? updatedStop : s)),
  };
  setActiveLoop(updated);
  if (award > 0) addConfetti(award);

  // Award a passport stamp on the first check-in for this loop.
  if (!alreadyAwarded) {
    const cityRaw = loop.city || loop.toName || loop.to || "Trip";
    const city = cityAbbreviation(cityRaw);
    const theme = loop.experienceName || loop.blueprint || loop.occasion || "Night Out";
    const earnedAt = new Date(stamp);
    const date = earnedAt.toLocaleDateString(undefined, { month: "short", day: "numeric" });
    addStamp({ id: loop.id, city, theme, date, earnedAt: earnedAt.toISOString() });
  }

  return { loop: updated, stop: updatedStop, awarded: award, alreadyAwarded };
}

/** Compress a city/destination string into a short 2-4 letter stamp code. */
function cityAbbreviation(input: string): string {
  const map: Record<string, string> = {
    "washington dc": "DC",
    washington: "DC",
    "new york": "NYC",
    "new york city": "NYC",
    miami: "MIA",
    "los angeles": "LA",
    "san francisco": "SF",
    chicago: "CHI",
    boston: "BOS",
    austin: "ATX",
    nashville: "BNA",
    seattle: "SEA",
    denver: "DEN",
    atlanta: "ATL",
  };
  const key = input.trim().toLowerCase();
  if (map[key]) return map[key];
  // Initials from words (max 3)
  const initials = input
    .replace(/[^a-zA-Z\s]/g, "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 3)
    .map((w) => w[0].toUpperCase())
    .join("");
  return initials || input.slice(0, 3).toUpperCase();
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
    date:
      input.date ||
      today.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }),
    groupSize: input.groupSize ?? 2,
    from: input.from || "HOME",
    to: input.to || "NIGHT OUT",
    gate: input.gate || "SHAW",
    boardingTime: input.boardingTime || "6:30 PM",
    occasion: input.occasion,
    vibe: input.vibe,
    stops: input.stops || [
      { id: "s1", name: "Lila's Patio", type: "Small plates", time: "6:30 PM", area: "Shaw" },
      {
        id: "s2",
        name: "Mason St. Records",
        type: "Vinyl + nat wine",
        time: "8:15 PM",
        area: "U Street",
      },
      { id: "s3", name: "Aera Rooftop", type: "Nightcap", time: "10:00 PM", area: "Logan Circle" },
    ],
    ...input,
  };
}

