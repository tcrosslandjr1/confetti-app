/**
 * Lightweight debug instrumentation for marquee ad impressions.
 *
 * Enable by adding `?debug=ads` to the URL (persists in localStorage), or
 * by running `localStorage.setItem("confetti.debugAds","1")` in DevTools.
 * Disable with `?debug=ads-off` or by removing the localStorage key.
 */

const KEY = "confetti.debugAds";

export type AdDebugEvent = {
  slot: string;
  surface: string;
  brand: string;
  occasion: string;
  ts: number;
};

export function isAdDebugEnabled(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const url = new URL(window.location.href);
    const flag = url.searchParams.get("debug");
    if (flag === "ads") {
      window.localStorage.setItem(KEY, "1");
      return true;
    }
    if (flag === "ads-off") {
      window.localStorage.removeItem(KEY);
      return false;
    }
    return window.localStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
}

const EVT = "confetti:ad-debug";

export function recordAdDebug(e: Omit<AdDebugEvent, "ts">) {
  if (typeof window === "undefined") return;
  const detail: AdDebugEvent = { ...e, ts: Date.now() };
  window.dispatchEvent(new CustomEvent<AdDebugEvent>(EVT, { detail }));
}

export function subscribeAdDebug(handler: (e: AdDebugEvent) => void): () => void {
  if (typeof window === "undefined") return () => {};
  const listener = (ev: Event) => handler((ev as CustomEvent<AdDebugEvent>).detail);
  window.addEventListener(EVT, listener);
  return () => window.removeEventListener(EVT, listener);
}
