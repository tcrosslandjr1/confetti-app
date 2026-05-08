import { useEffect, useState } from "react";

/** Returns a live-updating "Xs / Xm / Xh ago" string for the given ISO timestamp. */
export function formatElapsed(iso: string, now: number = Date.now()): string {
  const then = new Date(iso).getTime();
  const sec = Math.max(0, Math.floor((now - then) / 1000));
  if (sec < 60) return `${sec}s ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ${sec % 60}s ago`;
  const hr = Math.floor(min / 60);
  return `${hr}h ${min % 60}m ago`;
}

/** Renders a live-updating elapsed-time string. Ticks every second. */
export function LiveElapsed({ since, className }: { since: string; className?: string }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  return <span className={className}>{formatElapsed(since, now)}</span>;
}
