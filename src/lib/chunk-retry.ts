// Retry helper for failed lazy route chunk imports.
//
// When a route's JS chunk fails to load (flaky network, brief outage,
// a stale deploy that hasn't fully propagated), TanStack Router throws
// the error straight to the error boundary and the user sees
// "This page didn't load". Most of the time the chunk would load fine
// on a second attempt a moment later — so we retry with exponential
// backoff + cache-busting first, and only fall back to the error UI
// if every retry still fails.

import { isStaleModuleError } from "./stale-page-recovery";

const RETRY_DELAYS_MS = [250, 600, 1400] as const;

/** Parse the failing chunk URL out of a Vite dynamic-import error. */
export function extractChunkUrl(error: unknown): string | null {
  const msg = error instanceof Error ? `${error.message} ${error.stack ?? ""}` : String(error ?? "");
  // Vite/Chrome: "Failed to fetch dynamically imported module: https://host/assets/foo-abc.js"
  // Safari:     "Importing a module script failed."  → URL sometimes in stack
  const m = msg.match(/https?:\/\/[^\s'")]+\.m?js(\?[^\s'")]*)?/);
  return m ? m[0] : null;
}

/** Wait for `navigator.onLine` to become true, capped at `maxMs`. */
function waitForOnline(maxMs: number): Promise<void> {
  return new Promise((resolve) => {
    if (typeof navigator === "undefined" || navigator.onLine) return resolve();
    const done = () => {
      window.removeEventListener("online", done);
      clearTimeout(timer);
      resolve();
    };
    const timer = setTimeout(done, maxMs);
    window.addEventListener("online", done, { once: true });
  });
}

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/**
 * Try to re-fetch the failed chunk by issuing a fresh dynamic import with
 * a cache-busting query string. Resolves on success, throws on final failure.
 */
async function refetchChunk(url: string, attempt: number): Promise<void> {
  const bust = new URL(url, window.location.href);
  bust.searchParams.set("_r", `${Date.now().toString(36)}-${attempt}`);
  // Use the native dynamic import so the browser executes the module
  // (rather than just warming the HTTP cache via fetch()).
  /* @vite-ignore */
  await import(/* @vite-ignore */ bust.toString());
}

export type RetryOutcome = "recovered" | "exhausted" | "not-retryable";

/**
 * Attempt to recover from a chunk-load error before the error UI is shown.
 *
 * @param error  The error caught by the route error boundary.
 * @param onAttempt  Optional progress callback `(attempt, totalAttempts)`.
 */
export async function retryChunkLoad(
  error: unknown,
  onAttempt?: (attempt: number, total: number) => void,
): Promise<RetryOutcome> {
  if (typeof window === "undefined") return "not-retryable";
  if (!isStaleModuleError(error)) return "not-retryable";

  const url = extractChunkUrl(error);
  const total = RETRY_DELAYS_MS.length;

  for (let i = 0; i < total; i++) {
    onAttempt?.(i + 1, total);
    // If we're offline, wait for network up to this attempt's budget.
    await waitForOnline(RETRY_DELAYS_MS[i]);
    await sleep(RETRY_DELAYS_MS[i]);

    try {
      if (url) {
        await refetchChunk(url, i + 1);
      }
      // Chunk re-fetched (or no URL to target, but delay elapsed under network).
      // Let the caller invalidate the router so the loader/component re-runs.
      return "recovered";
    } catch {
      // try again
    }
  }

  return "exhausted";
}
