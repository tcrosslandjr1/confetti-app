import { useEffect, useRef } from "react";

/**
 * Calls `onEnter` every time the observed element transitions into the
 * viewport. Returns a ref to attach to the element. Re-attaches if the
 * callback identity changes.
 */
export function useViewportImpression<T extends Element>(
  onEnter: () => void,
  options?: { rootMargin?: string; threshold?: number },
) {
  const ref = useRef<T | null>(null);
  const cbRef = useRef(onEnter);
  useEffect(() => {
    cbRef.current = onEnter;
  }, [onEnter]);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    let visible = false;
    const obs = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const isIn = entry.isIntersecting && entry.intersectionRatio > 0;
          if (isIn && !visible) {
            visible = true;
            cbRef.current();
          } else if (!isIn) {
            visible = false;
          }
        }
      },
      {
        threshold: options?.threshold ?? 0.5,
        rootMargin: options?.rootMargin ?? "0px",
      },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [options?.rootMargin, options?.threshold]);

  return ref;
}
