import { useEffect, useRef } from "react";

/**
 * Lightweight pub/sub used by PullToRefresh wrappers (in layouts) to ask
 * the currently-mounted page to reload its data. Pages opt-in by calling
 * useRefreshable(loadFn).
 *
 * triggerRefresh() awaits all subscriber handlers in parallel so the
 * PullToRefresh spinner stays visible until every page-level reload
 * resolves.
 */
type Handler = () => unknown | Promise<unknown>;
const handlers = new Set<Handler>();

export function triggerRefresh(): Promise<void> {
  const all = Array.from(handlers).map((h) => {
    try {
      return Promise.resolve(h());
    } catch {
      return Promise.resolve();
    }
  });
  return Promise.all(all).then(() => undefined);
}

export function useRefreshable(handler: Handler) {
  const ref = useRef(handler);
  ref.current = handler;
  useEffect(() => {
    const wrapped: Handler = () => ref.current?.();
    handlers.add(wrapped);
    return () => {
      handlers.delete(wrapped);
    };
  }, []);
}
