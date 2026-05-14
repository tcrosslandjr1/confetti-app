import { useEffect, useState } from "react";

/**
 * Returns `true` when the window has scrolled past `threshold` pixels.
 *
 * Throttled with `requestAnimationFrame` and only triggers a state update
 * when the boolean flips, so consumers (e.g. the sticky header) re-render
 * at most twice per scroll session — never per scroll event.
 *
 * Also respects `prefers-reduced-motion` indirectly: there's no animation
 * here, just a passive listener that does nothing while the boolean is stable.
 */
export function useScrolled(threshold = 8): boolean {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    let raf = 0;
    let last = scrolled;

    const compute = () => {
      raf = 0;
      const next = window.scrollY > threshold;
      if (next !== last) {
        last = next;
        setScrolled(next);
      }
    };

    const onScroll = () => {
      if (raf) return; // already queued — coalesce to next frame
      raf = window.requestAnimationFrame(compute);
    };

    // Sync initial state (e.g. when navigating to a pre-scrolled page).
    compute();

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (raf) window.cancelAnimationFrame(raf);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [threshold]);

  return scrolled;
}
