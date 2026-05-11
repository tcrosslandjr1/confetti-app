import { useEffect, useRef, useState, type ReactNode } from "react";

type RevealProps = {
  children: ReactNode;
  as?: React.ElementType;
  className?: string;
  delay?: number;
  variant?: "up" | "scale";
  threshold?: number;
  once?: boolean;
};

export function Reveal({
  children,
  as: Tag = "div",
  className = "",
  delay = 0,
  variant = "up",
  threshold = 0.15,
  once = true,
}: RevealProps) {
  const ref = useRef<HTMLElement | null>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setShown(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setShown(true);
            if (once) io.disconnect();
          } else if (!once) {
            setShown(false);
          }
        });
      },
      { threshold, rootMargin: "0px 0px -8% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [threshold, once]);

  const cls = ["reveal", variant === "scale" ? "reveal-scale" : "", shown ? "in" : "", className]
    .filter(Boolean)
    .join(" ");

  return (
    <Tag ref={ref} className={cls} style={{ animationDelay: `${delay}ms` }}>
      {children}
    </Tag>
  );
}

export function RevealStagger({
  children,
  className = "",
  step = 90,
  startDelay = 0,
  variant,
}: {
  children: ReactNode[];
  className?: string;
  step?: number;
  startDelay?: number;
  variant?: "up" | "scale";
}) {
  return (
    <>
      {children.map((c, i) => (
        <Reveal key={i} className={className} delay={startDelay + i * step} variant={variant}>
          {c}
        </Reveal>
      ))}
    </>
  );
}
