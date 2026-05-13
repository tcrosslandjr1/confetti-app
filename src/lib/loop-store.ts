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

  return { loop: updated, stop: updatedStop, awarded: award, alreadyAwarded };
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

// ─── Preset plan library — used by the "Switch plan" quick switcher ──
export type PlanPreset = {
  key: string;
  label: string;
  emoji: string;
  blurb: string;
  build: () => ActiveLoop;
};

export const PLAN_PRESETS: PlanPreset[] = [
  {
    key: "shaw-night",
    label: "Shaw Night Out",
    emoji: "🥂",
    blurb: "Small plates → vinyl bar → rooftop nightcap",
    build: () =>
      makeDemoLoop({
        from: "HOME",
        to: "NIGHT OUT",
        gate: "SHAW",
        boardingTime: "6:30 PM",
        occasion: "Date night",
        occasionEmoji: "🌙",
        vibes: ["✨ Date night", "🎶 Vinyl"],
        stops: [
          { id: "s1", name: "Lila's Patio", type: "Small plates", time: "6:30 PM", area: "Shaw" },
          { id: "s2", name: "Mason St. Records", type: "Vinyl + nat wine", time: "8:15 PM", area: "U Street" },
          { id: "s3", name: "Aera Rooftop", type: "Nightcap", time: "10:00 PM", area: "Logan Circle" },
        ],
      }),
  },
  {
    key: "georgetown-brunch",
    label: "Georgetown Brunch",
    emoji: "🥞",
    blurb: "Brunch → waterfront walk → coffee tasting",
    build: () =>
      makeDemoLoop({
        from: "HOME",
        to: "BRUNCH",
        gate: "GTOWN",
        boardingTime: "10:30 AM",
        occasion: "Sunday brunch",
        occasionEmoji: "☀",
        vibes: ["🥐 Slow morning", "🚶 Stroll"],
        stops: [
          { id: "s1", name: "Bluestone Lane", type: "Brunch + flat whites", time: "10:30 AM", area: "Georgetown" },
          { id: "s2", name: "Georgetown Waterfront", type: "Riverside walk", time: "12:00 PM", area: "Waterfront" },
          { id: "s3", name: "Grace Street Coffee", type: "Tasting flight", time: "1:15 PM", area: "Georgetown" },
        ],
      }),
  },
  {
    key: "h-street-crawl",
    label: "H Street Crawl",
    emoji: "🎤",
    blurb: "Tacos → arcade bar → live music",
    build: () =>
      makeDemoLoop({
        from: "HOME",
        to: "H STREET",
        gate: "ATLAS",
        boardingTime: "7:00 PM",
        occasion: "Friends night",
        occasionEmoji: "🎉",
        vibes: ["🎮 Playful", "🎤 Live music"],
        stops: [
          { id: "s1", name: "Taqueria Habanero", type: "Tacos + mezcal", time: "7:00 PM", area: "H Street" },
          { id: "s2", name: "Atlas Arcade", type: "Arcade bar", time: "8:30 PM", area: "Atlas District" },
          { id: "s3", name: "Pie Shop", type: "Live music + pie", time: "10:00 PM", area: "H Street" },
        ],
      }),
  },
  {
    key: "wharf-sunset",
    label: "Wharf Sunset",
    emoji: "🌅",
    blurb: "Oysters → sunset cruise → speakeasy",
    build: () =>
      makeDemoLoop({
        from: "HOME",
        to: "THE WHARF",
        gate: "WHARF",
        boardingTime: "5:30 PM",
        occasion: "Anniversary",
        occasionEmoji: "💐",
        vibes: ["🌊 Waterfront", "🥂 Romantic"],
        stops: [
          { id: "s1", name: "Rappahannock Oyster Bar", type: "Oysters + bubbles", time: "5:30 PM", area: "The Wharf" },
          { id: "s2", name: "Sunset Cruise", type: "Potomac River", time: "7:00 PM", area: "The Wharf" },
          { id: "s3", name: "Bar Spero", type: "Speakeasy nightcap", time: "9:15 PM", area: "Capitol Crossing" },
        ],
      }),
  },
];

