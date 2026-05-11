import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";

type Props = {
  children: ReactNode;
  className?: string;
  /** 0 < ease <= 1 — lower = smoother/slower. */
  ease?: number;
  /** Wheel speed multiplier. */
  wheelSpeed?: number;
};

/**
 * Horizontal scroller with a custom thumb. Native scrollbar is hidden so we
 * can ease scrollbar drag/click through requestAnimationFrame instead of the
 * browser's instant jump.
 */
export function SmoothScrollRow({
  children,
  className = "",
  ease = 0.18,
  wheelSpeed = 0.25,
}: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const targetRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const [thumb, setThumb] = useState({ width: 0, left: 0, visible: false });
  const dragRef = useRef<{ pointerId: number; startX: number; startTarget: number } | null>(null);

  // Animate scrollLeft toward targetRef.
  const tick = () => {
    const el = scrollRef.current;
    if (!el) {
      rafRef.current = null;
      return;
    }
    const max = el.scrollWidth - el.clientWidth;
    targetRef.current = Math.max(0, Math.min(max, targetRef.current));
    const current = el.scrollLeft;
    const diff = targetRef.current - current;
    if (Math.abs(diff) < 0.5) {
      el.scrollLeft = targetRef.current;
      rafRef.current = null;
      updateThumb();
      return;
    }
    el.scrollLeft = current + diff * ease;
    updateThumb();
    rafRef.current = requestAnimationFrame(tick);
  };

  const animateTo = (next: number) => {
    targetRef.current = next;
    if (rafRef.current == null) rafRef.current = requestAnimationFrame(tick);
  };

  const updateThumb = () => {
    const el = scrollRef.current;
    const track = trackRef.current;
    if (!el || !track) return;
    const trackW = track.clientWidth;
    const ratio = el.clientWidth / Math.max(1, el.scrollWidth);
    const visible = ratio < 1;
    const width = Math.max(32, trackW * ratio);
    const max = el.scrollWidth - el.clientWidth;
    const left = max > 0 ? (el.scrollLeft / max) * (trackW - width) : 0;
    setThumb({ width, left, visible });
  };

  useLayoutEffect(() => {
    updateThumb();
    const el = scrollRef.current;
    if (!el) return;
    const onScroll = () => {
      // Keep target aligned with non-animated scroll sources (touch swipe etc.)
      if (rafRef.current == null) targetRef.current = el.scrollLeft;
      updateThumb();
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    const ro = new ResizeObserver(updateThumb);
    ro.observe(el);
    Array.from(el.children).forEach((c) => ro.observe(c as Element));
    return () => {
      el.removeEventListener("scroll", onScroll);
      ro.disconnect();
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  // Wheel slowdown
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      if (delta === 0) return;
      e.preventDefault();
      animateTo(targetRef.current + delta * wheelSpeed);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wheelSpeed]);

  // Track click: smooth-jump so the click position becomes the thumb center
  const onTrackPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const track = trackRef.current;
    const el = scrollRef.current;
    if (!track || !el) return;
    if ((e.target as HTMLElement).dataset.thumb === "1") return; // handled by thumb
    const rect = track.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const max = el.scrollWidth - el.clientWidth;
    const trackW = rect.width - thumb.width;
    const ratio = trackW > 0 ? Math.max(0, Math.min(1, (x - thumb.width / 2) / trackW)) : 0;
    animateTo(ratio * max);
  };

  // Thumb drag: smoothly follow the pointer
  const onThumbPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = scrollRef.current;
    if (!el) return;
    e.preventDefault();
    (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
    dragRef.current = { pointerId: e.pointerId, startX: e.clientX, startTarget: el.scrollLeft };
    targetRef.current = el.scrollLeft;
  };

  const onThumbPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    const track = trackRef.current;
    const el = scrollRef.current;
    if (!drag || !track || !el || drag.pointerId !== e.pointerId) return;
    const trackW = track.clientWidth - thumb.width;
    const max = el.scrollWidth - el.clientWidth;
    if (trackW <= 0 || max <= 0) return;
    const dx = e.clientX - drag.startX;
    const next = drag.startTarget + (dx / trackW) * max;
    animateTo(next);
  };

  const onThumbPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== e.pointerId) return;
    try {
      (e.currentTarget as HTMLDivElement).releasePointerCapture(e.pointerId);
    } catch {
      /* noop */
    }
    dragRef.current = null;
  };

  return (
    <div className="relative">
      <div
        ref={scrollRef}
        className={`flex gap-3 overflow-x-auto pb-3 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden ${className}`}
      >
        {children}
      </div>
      {thumb.visible && (
        <div
          ref={trackRef}
          onPointerDown={onTrackPointerDown}
          className="relative mx-1 h-1.5 rounded-full bg-ink/10"
        >
          <div
            data-thumb="1"
            onPointerDown={onThumbPointerDown}
            onPointerMove={onThumbPointerMove}
            onPointerUp={onThumbPointerUp}
            onPointerCancel={onThumbPointerUp}
            style={{ width: thumb.width, transform: `translateX(${thumb.left}px)` }}
            className="absolute top-0 left-0 h-1.5 cursor-grab touch-none rounded-full bg-ink/60 active:cursor-grabbing hover:bg-ink/80"
          />
        </div>
      )}
    </div>
  );
}
