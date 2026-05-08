import { useEffect, useState } from "react";

export function TypingCounter({
  target = 2847,
  suffix = " plans built today",
  className = "",
}: {
  target?: number;
  suffix?: string;
  className?: string;
}) {
  const full = `${target.toLocaleString()}${suffix}`;
  const [count, setCount] = useState(0);
  const [typed, setTyped] = useState(0);

  // count-up to target
  useEffect(() => {
    const dur = 1400;
    const start = performance.now();
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      setCount(Math.round(target * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target]);

  // type out the suffix after the count finishes
  useEffect(() => {
    const id = window.setInterval(() => {
      setTyped((n) => {
        if (n >= suffix.length) {
          window.clearInterval(id);
          return n;
        }
        return n + 1;
      });
    }, 55);
    return () => window.clearInterval(id);
  }, [suffix]);

  // gentle drift after the initial count (so it feels live)
  useEffect(() => {
    const id = window.setInterval(() => {
      setCount((c) => c + Math.floor(Math.random() * 2));
    }, 4200);
    return () => window.clearInterval(id);
  }, []);

  const shown = `${count.toLocaleString()}${suffix.slice(0, typed)}`;
  const done = typed >= suffix.length;

  return (
    <span
      className={`typing-caret font-mono tabular-nums ${className}`}
      aria-label={full}
      style={done ? { animation: "none" } : undefined}
    >
      {shown}
    </span>
  );
}
