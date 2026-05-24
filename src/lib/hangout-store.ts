// Local persistence for "build-hangout" plans. Mirrors loop-store shape:
// a single "active hangout" lives in localStorage so the /hangout/$id
// route can render it after the user submits the planner form.

export interface HangoutPlanMenuItem {
  item: string;
  quantity: string;
  notes?: string;
}
export interface HangoutTimelineStep {
  when: string;
  task: string;
}
export interface HangoutGame {
  name: string;
  why?: string;
}
export interface HangoutNearbyStore {
  name: string;
  purpose: string;
  neighborhood?: string;
  address?: string;
}
export interface HangoutPickupLink {
  label: string;
  url: string;
  notes?: string;
}

export interface HangoutPlan {
  title: string;
  summary: string;
  guest_count: number;
  budget_estimate: string;
  setting?: "indoor" | "outdoor" | "either";
  menu: HangoutPlanMenuItem[];
  drinks?: HangoutPlanMenuItem[];
  grocery_list?: string[];
  supplies: string[];
  setup_timeline: HangoutTimelineStep[];
  music: { vibe?: string; playlist_hints?: string[] };
  games_activities?: HangoutGame[];
  nearby_stores?: HangoutNearbyStore[];
  weather_backup?: { if_rain?: string; if_hot?: string; if_cold?: string };
  cleanup_checklist: string[];
  pickup_links?: HangoutPickupLink[];
}

export interface ActiveHangout {
  id: string;
  occasion: string;
  occasionKey: string;
  city?: string | null;
  startTime?: string | null;
  date?: string | null;
  mode?: "host" | "outdoor" | "stay-in";
  plan: HangoutPlan;
  generatedAt: string;
}

const KEY = "confetti.activeHangout";
const EVENT = "confetti.hangout-changed";

function isClient(): boolean {
  return typeof window !== "undefined";
}

export function subscribeActiveHangout(cb: () => void): () => void {
  if (!isClient()) return () => {};
  const handler = () => cb();
  window.addEventListener(EVENT, handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener(EVENT, handler);
    window.removeEventListener("storage", handler);
  };
}

export function getActiveHangout(): ActiveHangout | null {
  if (!isClient()) return null;
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as ActiveHangout) : null;
  } catch {
    return null;
  }
}

export function setActiveHangout(hangout: ActiveHangout) {
  if (!isClient()) return;
  localStorage.setItem(KEY, JSON.stringify(hangout));
  window.dispatchEvent(new Event(EVENT));
}

export function clearActiveHangout() {
  if (!isClient()) return;
  localStorage.removeItem(KEY);
  window.dispatchEvent(new Event(EVENT));
}
