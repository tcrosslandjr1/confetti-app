import { useEffect, useRef, useState, type ReactNode } from "react";
import { Loader2, ArrowDown } from "lucide-react";

type Props = {
  onRefresh: () => Promise<unknown> | void;
  children: ReactNode;
  /** Distance in px the user must pull past the trigger threshold. */
  threshold?: number;
  /** Maximum pull distance (visual cap). */
  maxPull?: number;
  /** Disable entirely (e.g. on desktop). */
  disabled?: boolean;
  className?: string;
};

/**
 * Mobile pull-to-refresh wrapper. Only activates when the scroll container
 * is at the very top and the user drags downward with a touch gesture.
 * Desktop users see no UI and pay no overhead.
 */
export function PullToRefresh({
  onRefresh,
  children,
  threshold = 70,
  maxPull = 120,
  disabled = false,
  className,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const startY = useRef<number | null>(null);
  const pulling = useRef(false);
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (disabled) return;
    const el = containerRef.current;
    if (!el) return;
    // Skip on coarse-less (desktop) pointers.
    if (typeof window !== "undefined" && window.matchMedia) {
      if (!window.matchMedia("(pointer: coarse)").matches) return;
    }

    const atTop = () =>
      (document.scrollingElement?.scrollTop ?? window.scrollY ?? 0) <= 0;

    const onTouchStart = (e: TouchEvent) => {
      if (refreshing) return;
      if (!atTop()) return;
      startY.current = e.touches[0].clientY;
      pulling.current = false;
    };

    const onTouchMove = (e: TouchEvent) => {
      if (refreshing || startY.current == null) return;
      const dy = e.touches[0].clientY - startY.current;
      if (dy <= 0) {
        setPull(0);
        pulling.current = false;
        return;
      }
      if (!atTop()) {
        startY.current = null;
        setPull(0);
        return;
      }
      pulling.current = true;
      // Resistance curve.
      const resisted = Math.min(maxPull, dy * 0.5);
      setPull(resisted);
      if (e.cancelable) e.preventDefault();
    };

    const onTouchEnd = async () => {
      if (!pulling.current) {
        startY.current = null;
        setPull(0);
        return;
      }
      const reached = pull >= threshold;
      startY.current = null;
      pulling.current = false;
      if (reached) {
        setRefreshing(true);
        setPull(threshold);
        try {
          await onRefresh();
        } finally {
          setRefreshing(false);
          setPull(0);
        }
      } else {
        setPull(0);
      }
    };

    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("touchend", onTouchEnd, { passive: true });
    window.addEventListener("touchcancel", onTouchEnd, { passive: true });
    return () => {
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
      window.removeEventListener("touchcancel", onTouchEnd);
    };
  }, [disabled, maxPull, threshold, onRefresh, pull, refreshing]);

  const visible = pull > 0 || refreshing;
  const progress = Math.min(1, pull / threshold);

  return (
    <div ref={containerRef} className={className} style={{ position: "relative" }}>
      <div
        aria-hidden={!visible}
        className="pointer-events-none absolute left-0 right-0 top-0 z-40 flex justify-center"
        style={{
          transform: `translateY(${Math.max(0, pull - 40)}px)`,
          opacity: visible ? 1 : 0,
          transition: pulling.current ? "none" : "transform 200ms ease, opacity 200ms ease",
        }}
      >
        <div className="mt-2 grid h-10 w-10 place-items-center rounded-full border-2 border-ink bg-cream shadow-brut">
          {refreshing ? (
            <Loader2 className="h-4 w-4 animate-spin text-ink" />
          ) : (
            <ArrowDown
              className="h-4 w-4 text-ink transition-transform"
              style={{ transform: `rotate(${progress * 180}deg)` }}
            />
          )}
        </div>
      </div>
      <div
        style={{
          transform: `translateY(${pull}px)`,
          transition: pulling.current ? "none" : "transform 220ms ease",
        }}
      >
        {children}
      </div>
    </div>
  );
}

export default PullToRefresh;
