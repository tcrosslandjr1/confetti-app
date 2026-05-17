// Lightweight client-side analytics for the Google Wallet fallback flow.
// Persists events to localStorage so we can inspect desktop/iOS fallback usage
// without a backend dependency. Mirrors the activity-log subscription pattern.

export type WalletEventName =
  | "wallet_qr_modal_open" // QR modal shown (desktop or iOS popup-blocked)
  | "wallet_copy_link" // user copied the save link
  | "wallet_direct_open_success" // window.open returned a window (Android / iOS new-tab worked)
  | "wallet_direct_open_blocked" // iOS popup blocked → fell back to QR
  | "wallet_print_qr" // user opened the print-friendly QR view
  | "wallet_open_link_click"; // user clicked "Open save link in new tab" inside the modal

export type WalletEvent = {
  name: WalletEventName;
  at: string;
  platform: "android" | "ios" | "desktop" | "other";
  loopId?: string;
  meta?: Record<string, unknown>;
};

const STORAGE_KEY = "confetti:wallet-analytics:v1";
const MAX_EVENTS = 200;

function detectPlatform(): WalletEvent["platform"] {
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

function read(): WalletEvent[] {
  if (typeof localStorage === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as WalletEvent[]) : [];
  } catch {
    return [];
  }
}

function write(events: WalletEvent[]) {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(events.slice(-MAX_EVENTS)));
  } catch {
    /* quota — ignore */
  }
}

export function trackWalletEvent(
  name: WalletEventName,
  opts: { loopId?: string; meta?: Record<string, unknown> } = {},
) {
  const evt: WalletEvent = {
    name,
    at: new Date().toISOString(),
    platform: detectPlatform(),
    loopId: opts.loopId,
    meta: opts.meta,
  };
  const next = [...read(), evt];
  write(next);
  if (typeof console !== "undefined") {
    // Visible in dev tools so the team can verify locally.
    console.info("[wallet-analytics]", evt);
  }
}

export function getWalletEvents(): WalletEvent[] {
  return read();
}

export function clearWalletEvents() {
  write([]);
}
