import { useState } from "react";
import { Sparkles, MapPin, Car, Ticket } from "lucide-react";

type Step = {
  n: string;
  kicker: string;
  title: string;
  body: string;
  color: string;
  glow: string;
  rot: string;
};

const STEPS: Step[] = [
  {
    n: "01",
    kicker: "drop the vibe",
    title: "Tell us what kind of night you want.",
    body: "Pick a vibe — or type one in your own words. ‘Cute, slow, walkable, under $80.’ We get it.",
    color: "bg-coral",
    glow: "glow-coral",
    rot: "-0.5deg",
  },
  {
    n: "02",
    kicker: "we plot the path",
    title: "An AI agent builds the whole evening.",
    body: "Three to five real stops, timed to the minute, routed by car, transit, Uber or Lyft. No tabs. No spirals.",
    color: "bg-purple",
    glow: "glow-purple",
    rot: "1deg",
  },
  {
    n: "03",
    kicker: "you just show up",
    title: "Reservations and rides land in one place.",
    body: "Confirmations, addresses, dress code, parking notes — all in your trip vault. Share it. Send it. Save it.",
    color: "bg-gold",
    glow: "glow-gold",
    rot: "-1deg",
  },
];

export function StepsShowcase() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div className="relative mt-12">
      {/* hand-drawn arrows — only on lg+ where steps sit in a row */}
      <svg
        aria-hidden
        viewBox="0 0 1200 60"
        preserveAspectRatio="none"
        className="pointer-events-none absolute inset-x-0 top-[34%] hidden h-16 w-full lg:block"
      >
        <defs>
          <marker id="ah1" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse">
            <path d="M0,0 L10,5 L0,10 z" fill="var(--ink)" />
          </marker>
        </defs>
        {/* arrow 1 → 2 */}
        <path
          d="M 360 30 C 410 -10, 470 60, 540 28"
          fill="none"
          stroke="var(--ink)"
          strokeWidth="3"
          strokeLinecap="round"
          markerEnd="url(#ah1)"
          className="[stroke-dasharray:6_8]"
        />
        {/* arrow 2 → 3 */}
        <path
          d="M 760 28 C 820 70, 880 -8, 960 32"
          fill="none"
          stroke="var(--ink)"
          strokeWidth="3"
          strokeLinecap="round"
          markerEnd="url(#ah1)"
          className="[stroke-dasharray:6_8]"
        />
        {/* squiggle scribbles for charm */}
        <path d="M 470 8 q 6 -8 12 0 t 12 0" fill="none" stroke="var(--coral)" strokeWidth="2" strokeLinecap="round" />
        <path d="M 850 50 q 6 -8 12 0 t 12 0" fill="none" stroke="var(--coral)" strokeWidth="2" strokeLinecap="round" />
      </svg>

      <div className="grid gap-6 lg:grid-cols-3">
        {STEPS.map((s, i) => {
          const isOpen = open === i;
          return (
            <div
              key={s.n}
              style={{ transform: `rotate(${s.rot})` }}
              onMouseEnter={() => setOpen(i)}
              onFocus={() => setOpen(i)}
            >
              <button
                type="button"
                onClick={() => setOpen(isOpen ? null : i)}
                aria-expanded={isOpen}
                className={`tilt-3d grain ${s.glow} group relative w-full overflow-hidden rounded-3xl border-2 border-ink ${s.color} p-7 text-left text-ink shadow-brut`}
              >
                <div className="flex items-baseline justify-between">
                  <span className="font-display text-7xl font-extrabold leading-none">{s.n}</span>
                  <span className="font-mono text-[11px] uppercase tracking-widest">{s.kicker}</span>
                </div>
                <h3 className="mt-8 font-display text-2xl font-extrabold leading-tight">{s.title}</h3>
                <p className="mt-3 text-base leading-snug">{s.body}</p>

                {/* mini animated preview */}
                <div
                  className={`mt-5 grid overflow-hidden transition-all duration-500 ease-out ${
                    isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                  }`}
                >
                  <div className="min-h-0">
                    <div className="rounded-2xl border-2 border-ink bg-cream/70 p-4">
                      {i === 0 && <PreviewVibe active={isOpen} />}
                      {i === 1 && <PreviewRoute active={isOpen} />}
                      {i === 2 && <PreviewVault active={isOpen} />}
                    </div>
                  </div>
                </div>

                <span className="mt-4 inline-flex items-center gap-1 font-mono text-[11px] uppercase tracking-widest opacity-70">
                  {isOpen ? "tap to collapse" : "tap to peek inside"}
                </span>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ============= mini animated previews ============= */

function PreviewVibe({ active }: { active: boolean }) {
  const chips = ["cute", "walkable", "slow drinks", "under $80", "no line"];
  return (
    <div>
      <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest">
        <Sparkles className="h-3 w-3" /> picking a vibe…
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {chips.map((c, i) => (
          <span
            key={c}
            style={{
              animation: active ? `chip-in 0.45s cubic-bezier(.34,1.56,.64,1) ${i * 0.12}s both` : undefined,
            }}
            className="rounded-full border-2 border-ink bg-background px-2.5 py-1 text-[11px] font-bold"
          >
            {c}
          </span>
        ))}
      </div>
      <style>{`
        @keyframes chip-in {
          0%   { transform: translateY(8px) scale(0.6); opacity: 0; }
          100% { transform: translateY(0)   scale(1);   opacity: 1; }
        }
      `}</style>
    </div>
  );
}

function PreviewRoute({ active }: { active: boolean }) {
  const stops = [
    { t: "6:30", n: "Lila’s Patio", icon: MapPin },
    { t: "8:15", n: "Mason St. bar", icon: MapPin },
    { t: "10:00", n: "Aera rooftop", icon: MapPin },
  ];
  return (
    <div>
      <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest">
        <Car className="h-3 w-3" /> agent plotting…
      </div>
      <div className="relative mt-3">
        <svg viewBox="0 0 220 12" className="h-3 w-full">
          <line x1="6" y1="6" x2="214" y2="6" stroke="var(--ink)" strokeWidth="2" strokeDasharray="3 4" />
          <line
            x1="6" y1="6" x2="214" y2="6"
            stroke="var(--coral)" strokeWidth="3" strokeLinecap="round"
            style={{
              strokeDasharray: 220,
              strokeDashoffset: active ? 0 : 220,
              transition: "stroke-dashoffset 1.4s ease",
            }}
          />
        </svg>
        <div className="mt-2 grid grid-cols-3 gap-2">
          {stops.map((s, i) => (
            <div
              key={s.t}
              style={{
                animation: active ? `pop-in 0.4s cubic-bezier(.34,1.56,.64,1) ${0.3 + i * 0.25}s both` : undefined,
              }}
              className="rounded-lg border-2 border-ink bg-background p-2"
            >
              <div className="font-mono text-[10px] font-bold">{s.t}</div>
              <div className="truncate text-[11px] font-bold">{s.n}</div>
            </div>
          ))}
        </div>
      </div>
      <style>{`
        @keyframes pop-in { from { transform: scale(0.6); opacity: 0; } to { transform: scale(1); opacity: 1; } }
      `}</style>
    </div>
  );
}

function PreviewVault({ active }: { active: boolean }) {
  const items = [
    { label: "Resy · 6:30p · party of 2", tag: "BOOKED" },
    { label: "Lyft · 9:48p · 4 min away", tag: "QUEUED" },
    { label: "Dress · smart casual", tag: "NOTE" },
  ];
  return (
    <div>
      <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest">
        <Ticket className="h-3 w-3" /> landing in your vault…
      </div>
      <ul className="mt-3 space-y-1.5">
        {items.map((it, i) => (
          <li
            key={it.label}
            style={{
              animation: active ? `slide-in 0.4s ease ${i * 0.18}s both` : undefined,
            }}
            className="flex items-center justify-between rounded-lg border-2 border-ink bg-background px-3 py-1.5 text-[11px] font-bold"
          >
            <span className="truncate">{it.label}</span>
            <span className="ml-2 rounded-full bg-ink px-2 py-0.5 font-mono text-[9px] tracking-widest text-cream">
              {it.tag}
            </span>
          </li>
        ))}
      </ul>
      <style>{`
        @keyframes slide-in { from { transform: translateX(-12px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
      `}</style>
    </div>
  );
}
