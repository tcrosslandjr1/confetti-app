// Lightweight client-side analytics for Boarding Pass share actions.
// Mirrors wallet-analytics: persists to localStorage so we can inspect usage
// without a backend dependency.

export type ShareEventName =
  | "share_menu_open"
  | "share_link_native" // navigator.share invoked
  | "share_link_clipboard" // navigator.share unavailable → copied to clipboard
  | "share_copy_link" // explicit "Copy link" button
  | "share_email_link" // mailto:
  | "share_save_image" // PNG download
  | "share_save_pdf" // print → PDF
  | "share_add_to_calendar" // .ics download
  | "share_error";

export type ShareEvent = {
  name: ShareEventName;
  at: string;
  platform: "android" | "ios" | "desktop" | "other";
  loopId?: string;
  meta?: Record<string, unknown>;
};

const STORAGE_KEY = "confetti:share-analytics:v1";
const MAX_EVENTS = 200;

function detectPlatform(): ShareEvent["platform"] {
  if (typeof navigator === "undefined") return "other";
  const ua = navigator.userAgent;
  if (/android/i.test(ua)) return "android";
  if (/iPad|iPhone|iPod/.test(ua)) return "ios";
  if (
    navigator.platform === "MacIntel" &&
    (navigator as Navigator & { maxTouchPoints?: number }).maxTouchPoints! > 1
  )
    return "ios";
  if (typeof window !== "undefined") return "desktop";
  return "other";
}

function read(): ShareEvent[] {
  if (typeof localStorage === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as ShareEvent[]) : [];
  } catch {
    return [];
  }
}

function write(events: ShareEvent[]) {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(events.slice(-MAX_EVENTS)));
  } catch {
    /* quota — ignore */
  }
}

export function trackShareEvent(
  name: ShareEventName,
  opts: { loopId?: string; meta?: Record<string, unknown> } = {},
) {
  const evt: ShareEvent = {
    name,
    at: new Date().toISOString(),
    platform: detectPlatform(),
    loopId: opts.loopId,
    meta: opts.meta,
  };
  write([...read(), evt]);
  if (typeof console !== "undefined") {
    console.info("[share-analytics]", evt);
  }
}

export function getShareEvents(): ShareEvent[] {
  return read();
}

export function clearShareEvents() {
  write([]);
}
