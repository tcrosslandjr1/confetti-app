import { useCallback, useState, type CSSProperties } from "react";

type Particle = { id: number; x: number; y: number; bx: number; by: number; br: number; color: string };

const COLORS = ["bg-coral", "bg-gold", "bg-purple", "bg-ink", "bg-emerald-500", "bg-pink-400"];

let counter = 0;

export function useConfettiBurst() {
  const [particles, setParticles] = useState<Particle[]>([]);

  const burst = useCallback((x: number, y: number) => {
    const next: Particle[] = Array.from({ length: 22 }).map(() => {
      counter += 1;
      const angle = Math.random() * Math.PI * 2;
      const dist = 80 + Math.random() * 140;
      return {
        id: counter,
        x,
        y,
        bx: Math.cos(angle) * dist,
        by: Math.sin(angle) * dist - 40,
        br: (Math.random() * 720 - 360),
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
      };
    });
    setParticles((p) => [...p, ...next]);
    const ids = new Set(next.map((n) => n.id));
    setTimeout(() => setParticles((p) => p.filter((q) => !ids.has(q.id))), 1100);
  }, []);

  const layer = (
    <div className="pointer-events-none fixed inset-0 z-[80]" aria-hidden>
      {particles.map((p) => (
        <span
          key={p.id}
          className={`absolute h-2 w-2 rounded-[2px] ${p.color}`}
          style={{
            left: p.x,
            top: p.y,
            ["--bx" as keyof CSSProperties]: `${p.bx}px`,
            ["--by" as keyof CSSProperties]: `${p.by}px`,
            ["--br" as keyof CSSProperties]: `${p.br}deg`,
            animation: "confetti-burst 1s cubic-bezier(.2,.7,.3,1) forwards",
          } as CSSProperties}
        />
      ))}
    </div>
  );

  return { burst, layer };
}

/** Wrap children with a click handler that fires confetti from the click point. */
export function LoopClick({
  children,
  onClick,
  className = "",
}: {
  children: React.ReactNode;
  onClick?: (e: React.MouseEvent<HTMLSpanElement>) => void;
  className?: string;
}) {
  const { burst, layer } = useConfettiBurst();
  return (
    <>
      <span
        className={className}
        onClick={(e) => {
          burst(e.clientX, e.clientY);
          onClick?.(e);
        }}
      >
        {children}
      </span>
      {layer}
    </>
  );
}
