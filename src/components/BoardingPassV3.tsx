/**
 * BoardingPassV3 — Confetti boarding pass, wired to an ActiveLoop.
 *
 * Sections, in order:
 *   1. Header chip (logo + LIVE pulse)
 *   2. Route strip — origin/destination codes, mood tags, kickoff/stops/crew
 *   3. Progress rail — Home → stops → Done (derived from stop.done)
 *   4. Itinerary cards (flip front/back) per stop, with travel-time connectors
 *   5. Night Intel — budget, weather, dress
 *   6. Crew manifest (derived from groupSize)
 *   7. On My Way control (idle → live → arrived)
 *   8. Quick actions
 *   9. Pre-order drawer (per-stop mock menu)
 *
 * Designed to be dropped into /boarding-pass — sticky wallet footer is owned
 * by the parent route.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import {
  ChevronDown,
  X,
  MapPin,
  Info,
  Menu as MenuIcon,
  Wallet,
  Music,
  MessageCircle,
  Camera,
  Car,
  Wifi,
  Phone,
  Crown,
  Plus,
  Minus,
} from "lucide-react";
import type { ActiveLoop, LoopStop } from "@/lib/loop-store";

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                    */
/* -------------------------------------------------------------------------- */

const code3 = (s: string | undefined, fallback: string) => {
  if (!s) return fallback;
  const letters = s.replace(/[^A-Za-z]/g, "");
  return (letters.slice(0, 3) || fallback).toUpperCase();
};

const CREW_AVATARS = ["👑", "💃", "🎯", "🎶", "🕺", "🪩", "🌟", "🎨"];

type CrewMember = {
  name: string;
  role: string;
  status: "ready" | "pending";
  transport: string;
  phone: string;
  avatar: string;
};

function deriveCrew(loop: ActiveLoop): CrewMember[] {
  const size = Math.max(1, Math.min(loop.groupSize ?? 1, 8));
  const captain = loop.passenger?.split("@")[0] || "Captain";
  const seeds = [
    { name: captain, role: "Captain", status: "ready" as const, transport: "Driving · Tesla Model 3" },
    { name: "Maya", role: "ETA 7:25p", status: "ready" as const, transport: "Metro" },
    { name: "Jordan", role: "Invited", status: "pending" as const, transport: "Rideshare" },
    { name: "Alex", role: "ETA 7:35p", status: "ready" as const, transport: "Riding w/ Captain" },
    { name: "Sam", role: "ETA 7:40p", status: "ready" as const, transport: "Walking" },
    { name: "Rio", role: "Invited", status: "pending" as const, transport: "Bike" },
    { name: "Quinn", role: "ETA 7:45p", status: "ready" as const, transport: "Rideshare" },
    { name: "Ash", role: "Invited", status: "pending" as const, transport: "Metro" },
  ];
  return seeds.slice(0, size).map((m, i) => ({
    ...m,
    avatar: CREW_AVATARS[i % CREW_AVATARS.length],
    phone: `(202) 555-${String(1001 + i).padStart(4, "0")}`,
  }));
}

const STOP_EMOJI_DEFAULT = "📍";

/* -------------------------------------------------------------------------- */
/*  Pre-order mock menu (per stop, deterministic)                              */
/* -------------------------------------------------------------------------- */

type MenuItem = { id: string; emoji: string; name: string; desc: string; price: number };

const MENU_POOL: MenuItem[] = [
  { id: "old-fashioned", emoji: "🥃", name: "Old Fashioned", desc: "Bourbon, demerara, angostura, orange", price: 16 },
  { id: "spritz", emoji: "🥂", name: "Aperol Spritz", desc: "Aperol, prosecco, soda, orange", price: 14 },
  { id: "negroni", emoji: "🍹", name: "Negroni", desc: "Gin, campari, sweet vermouth", price: 15 },
  { id: "margarita", emoji: "🍸", name: "Margarita", desc: "Tequila, lime, triple sec", price: 14 },
  { id: "beer", emoji: "🍺", name: "House Lager", desc: "Local craft, 16oz draft", price: 8 },
  { id: "wine", emoji: "🍷", name: "Glass of Red", desc: "Tempranillo, by the glass", price: 12 },
];

function menuForStop(stopId: string): MenuItem[] {
  // Deterministic 4-item slice based on the stop id.
  let h = 0;
  for (let i = 0; i < stopId.length; i++) h = (h * 31 + stopId.charCodeAt(i)) | 0;
  const start = Math.abs(h) % MENU_POOL.length;
  return Array.from({ length: 4 }, (_, i) => MENU_POOL[(start + i) % MENU_POOL.length]);
}

/* -------------------------------------------------------------------------- */
/*  Section: Header                                                            */
/* -------------------------------------------------------------------------- */

function PassHeader() {
  return (
    <div className="flex items-center justify-between py-5">
      <div className="font-display text-[22px] font-extrabold tracking-tight text-ink">
        confetti<span className="text-coral">.</span>
      </div>
      <div className="inline-flex items-center gap-1.5 rounded-full border-2 border-ink bg-white px-3 py-1 font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-ink/60">
        <span className="block h-1.5 w-1.5 animate-pulse rounded-full bg-coral" /> Live
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Section: Route strip                                                       */
/* -------------------------------------------------------------------------- */

function RouteStrip({ loop }: { loop: ActiveLoop }) {
  const firstStop = loop.stops[0];
  const lastStop = loop.stops[loop.stops.length - 1];
  const originCode = code3(loop.fromName ?? loop.from ?? firstStop?.area, "ORG");
  const destCode = code3(loop.toName ?? loop.to ?? lastStop?.area, "DST");
  const kickoff = firstStop?.time || loop.boardingTime || "—";
  const vibes = loop.vibes && loop.vibes.length ? loop.vibes : loop.vibe ? [loop.vibe] : [];

  return (
    <div className="mb-3 rounded-3xl border-2 border-ink bg-white p-5">
      <div className="mb-5 flex items-start justify-between gap-3">
        <div className="flex flex-1 items-center gap-3">
          <div>
            <div className="font-display text-[32px] font-extrabold leading-none tracking-tight">{originCode}</div>
            <div className="mt-1 font-mono text-[9px] tracking-widest text-ink/55">
              {(loop.fromName ?? firstStop?.area ?? "Home").toUpperCase()}
            </div>
          </div>
          <div className="flex flex-1 items-center px-2">
            <span className="h-2 w-2 shrink-0 rounded-full bg-coral" />
            <span className="h-[2px] flex-1 bg-gradient-to-r from-coral to-amber-400 opacity-60" />
            <span className="h-2 w-2 shrink-0 rounded-full bg-amber-400" />
          </div>
          <div className="text-right">
            <div className="font-display text-[32px] font-extrabold leading-none tracking-tight">{destCode}</div>
            <div className="mt-1 font-mono text-[9px] tracking-widest text-ink/55">
              {(loop.toName ?? lastStop?.area ?? "Out").toUpperCase()}
            </div>
          </div>
        </div>
      </div>

      {vibes.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-1.5">
          {vibes.map((v) => (
            <span
              key={v}
              className="rounded-full border-2 border-ink bg-ink px-3 py-1 font-mono text-[9px] font-bold uppercase tracking-[0.12em] text-cream"
            >
              {v}
            </span>
          ))}
        </div>
      )}

      <div className="grid grid-cols-3 divide-x-2 divide-ink/10">
        <Stat label="Kickoff" value={kickoff} />
        <Stat label="Stops" value={String(loop.stops.length)} />
        <Stat label="Crew" value={String(loop.groupSize ?? 1)} />
      </div>
      {loop.date && (
        <div className="mt-3 text-center font-mono text-[10px] uppercase tracking-[0.2em] text-ink/50">
          {loop.day ? `${loop.day} · ` : ""}
          {loop.date}
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="px-2 text-center">
      <div className="mb-1 font-mono text-[8px] font-semibold uppercase tracking-[0.2em] text-ink/40">
        {label}
      </div>
      <div className="font-display text-base font-bold">{value}</div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Section: Progress rail                                                     */
/* -------------------------------------------------------------------------- */

function ProgressRail({ loop }: { loop: ActiveLoop }) {
  const nodes = [{ label: "Home", done: true, current: false }, ...loop.stops.map((s, i) => {
    const done = !!s.done;
    const current = !done && (i === 0 ? true : !!loop.stops[i - 1]?.done);
    return { label: s.area || s.name || `Stop ${i + 1}`, done, current };
  }), { label: "Done", done: loop.stops.every((s) => s.done), current: false }];

  return (
    <div className="mb-3 rounded-2xl border-2 border-ink bg-white px-5 py-4">
      <div className="mb-2.5 flex items-center">
        {nodes.map((n, i) => (
          <RailNode key={i} node={n} isLast={i === nodes.length - 1} prevDone={i > 0 && nodes[i - 1].done} />
        ))}
      </div>
      <div className="flex justify-between">
        {nodes.map((n, i) => (
          <span
            key={i}
            className={`font-mono text-[8px] font-semibold uppercase tracking-[0.15em] ${
              n.current ? "text-coral font-bold" : n.done ? "text-emerald-600" : "text-ink/40"
            }`}
          >
            {n.label.length > 8 ? n.label.slice(0, 6) + "…" : n.label}
          </span>
        ))}
      </div>
    </div>
  );
}

function RailNode({
  node,
  isLast,
  prevDone,
}: {
  node: { done: boolean; current: boolean };
  isLast: boolean;
  prevDone: boolean;
}) {
  return (
    <>
      <span
        className={`h-3.5 w-3.5 shrink-0 rounded-full border-2 transition ${
          node.current
            ? "border-coral bg-coral animate-pulse shadow-[0_0_0_4px_rgba(255,80,50,0.2)]"
            : node.done
              ? "border-emerald-500 bg-emerald-500"
              : "border-ink/20 bg-white"
        }`}
      />
      {!isLast && (
        <span className={`h-[3px] flex-1 rounded-full ${prevDone ? "bg-emerald-500" : "bg-ink/10"}`} />
      )}
    </>
  );
}

/* -------------------------------------------------------------------------- */
/*  Section: Stop cards (flip)                                                 */
/* -------------------------------------------------------------------------- */

function StopCard({
  stop,
  index,
  isCurrent,
  onPreorder,
}: {
  stop: LoopStop;
  index: number;
  isCurrent: boolean;
  onPreorder: (stop: LoopStop) => void;
}) {
  const [flipped, setFlipped] = useState(false);
  const navUrl = stop.address
    ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(stop.address)}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(stop.name)}`;
  const vibeLine = stop.tags?.map((t) => t.label).join(" · ") || stop.type || "";

  const flipStyle: CSSProperties = {
    transformStyle: "preserve-3d",
    transition: "transform 600ms cubic-bezier(0.16,1,0.3,1)",
    transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
  };
  const faceStyle: CSSProperties = { backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden" };

  return (
    <div style={{ perspective: "1000px" }}>
      <div className="relative" style={flipStyle}>
        {/* Front */}
        <div
          className="overflow-hidden rounded-3xl border-2 border-ink bg-white p-5"
          style={faceStyle}
        >
          <div className="mb-3 flex items-start justify-between">
            <div className="font-mono text-[9px] font-semibold uppercase tracking-[0.2em] text-ink/40">
              Stop {String(index + 1).padStart(2, "0")}
              {isCurrent && <span className="ml-2 text-coral">· Now</span>}
            </div>
            <div className="font-mono text-[13px] font-semibold">{stop.time || "—"}</div>
          </div>
          <h3 className="font-display text-[22px] font-extrabold leading-tight tracking-tight">
            {stop.name}
          </h3>
          {stop.area && (
            <div className="mt-1 font-mono text-[10px] font-medium uppercase tracking-[0.18em] text-ink/55">
              {stop.area}
            </div>
          )}
          {vibeLine && (
            <div className="mt-3 font-display italic text-[13px] text-purple-700/80">"{vibeLine}"</div>
          )}
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <a
              href={navUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-full border-2 border-ink bg-gradient-to-br from-coral to-pink-500 px-3.5 py-2 font-mono text-[9px] font-bold uppercase tracking-[0.15em] text-white"
            >
              <MapPin className="h-3 w-3" /> Navigate
            </a>
            <button
              type="button"
              onClick={() => onPreorder(stop)}
              className="inline-flex items-center gap-1.5 rounded-full border-2 border-ink bg-white px-3.5 py-2 font-mono text-[9px] font-bold uppercase tracking-[0.15em] text-ink transition hover:bg-cream"
            >
              <MenuIcon className="h-3 w-3" /> Menu
            </button>
            <button
              type="button"
              onClick={() => setFlipped(true)}
              className="ml-auto inline-flex items-center gap-1.5 rounded-full border-2 border-ink/20 bg-transparent px-3.5 py-2 font-mono text-[9px] font-bold uppercase tracking-[0.15em] text-ink/60 transition hover:border-ink"
            >
              <Info className="h-3 w-3" /> Details
            </button>
          </div>
        </div>

        {/* Back */}
        <div
          className="absolute inset-0 overflow-hidden rounded-3xl border-2 border-ink bg-white p-5"
          style={{ ...faceStyle, transform: "rotateY(180deg)" }}
        >
          <div className="mb-3 flex items-center justify-between">
            <div className="font-mono text-[9px] font-semibold uppercase tracking-[0.2em] text-coral">
              {stop.name} · Details
            </div>
            <button
              type="button"
              onClick={() => setFlipped(false)}
              className="grid h-7 w-7 place-items-center rounded-full border-2 border-ink bg-white"
              aria-label="Close details"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <BackCell icon={<Car className="h-4 w-4" />} label="Parking">
              {stop.parking?.primary || "Street parking nearby"}
              {stop.parking?.secondary && <div className="mt-1 text-ink/60">{stop.parking.secondary}</div>}
              {stop.ev && (
                <div className="mt-2 inline-flex items-center gap-1 rounded-full border-2 border-emerald-600 bg-emerald-50 px-2 py-0.5 font-mono text-[8px] font-bold uppercase tracking-widest text-emerald-700">
                  ⚡ {stop.ev.brand}
                </div>
              )}
            </BackCell>
            <BackCell icon={<Wifi className="h-4 w-4" />} label="Transit">
              {stop.area ? `Near ${stop.area}` : "Check local transit"}
            </BackCell>
            <BackCell icon={<MenuIcon className="h-4 w-4" />} label="Must Try">
              {stop.type || "Ask the bartender"}
            </BackCell>
            <BackCell icon={<Info className="h-4 w-4" />} label="Notes">
              {stop.rationale ||
                (stop.bookable ? "Reservation recommended" : "Walk-ins welcome")}
            </BackCell>
          </div>
        </div>
      </div>
    </div>
  );
}

function BackCell({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border-2 border-ink/10 bg-cream p-3.5">
      <div className="mb-1.5 text-ink/70">{icon}</div>
      <div className="mb-1.5 font-mono text-[8px] font-semibold uppercase tracking-[0.2em] text-ink/40">
        {label}
      </div>
      <div className="text-[12px] leading-snug text-ink/75">{children}</div>
    </div>
  );
}

function TravelConnector({ minutes, to }: { minutes: number; to?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-2.5">
      <span className="h-6 w-[2px] bg-gradient-to-b from-ink to-ink/10" />
      <span className="inline-flex items-center gap-1.5 rounded-full border-2 border-ink bg-white px-3 py-1 font-mono text-[9px] font-semibold uppercase tracking-[0.15em] text-ink/70">
        <Car className="h-3 w-3" /> {minutes} min{to ? ` · ${to}` : ""}
      </span>
      <span className="h-6 w-[2px] bg-gradient-to-b from-ink/10 to-ink" />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Section: Night Intel                                                       */
/* -------------------------------------------------------------------------- */

function NightIntel({ loop }: { loop: ActiveLoop }) {
  const budget = loop.estimatedSpend || `~$${60 * (loop.groupSize ?? 1)}`;
  return (
    <div className="mb-3 grid grid-cols-3 gap-2">
      <IntelCard icon="💰" label="Budget" value={budget} />
      <IntelCard icon="🌡️" label="Weather" value="72°F" />
      <IntelCard icon="👔" label="Dress" value="Smart" />
    </div>
  );
}

function IntelCard({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="rounded-2xl border-2 border-ink bg-white p-3.5 text-center">
      <div className="mb-1.5 text-xl">{icon}</div>
      <div className="mb-1 font-mono text-[7px] font-semibold uppercase tracking-[0.2em] text-ink/40">
        {label}
      </div>
      <div className="font-display text-[15px] font-bold">{value}</div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Section: Crew manifest                                                     */
/* -------------------------------------------------------------------------- */

function CrewManifest({ crew }: { crew: CrewMember[] }) {
  return (
    <div className="mb-3 rounded-3xl border-2 border-ink bg-white p-5">
      <div className="space-y-3">
        {crew.map((m, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full border-2 border-ink bg-cream text-lg">
              {m.avatar}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[13px] font-semibold leading-tight">{m.name}</div>
              <div className="font-mono text-[9px] text-ink/55 tracking-wide">
                <span className={m.status === "ready" ? "text-emerald-600" : "text-amber-600"}>
                  ●{" "}
                </span>
                {m.role}
              </div>
              <div className="font-mono text-[8px] text-ink/40 tracking-wide mt-0.5">{m.transport}</div>
            </div>
            <a
              href={`tel:${m.phone.replace(/\D/g, "")}`}
              className="grid h-8 w-8 place-items-center rounded-full border-2 border-ink bg-white text-ink/70"
              aria-label={`Call ${m.name}`}
            >
              <Phone className="h-3.5 w-3.5" />
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Section: On My Way                                                         */
/* -------------------------------------------------------------------------- */

type OmwState = "idle" | "live" | "arrived";

function OnMyWay({ targetName }: { targetName: string }) {
  const [state, setState] = useState<OmwState>("idle");
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (state !== "live") return;
    setProgress(0);
    let p = 0;
    const t = window.setInterval(() => {
      p = Math.min(100, p + 4);
      setProgress(p);
      if (p >= 100) {
        window.clearInterval(t);
        setState("arrived");
      }
    }, 250);
    return () => window.clearInterval(t);
  }, [state]);

  if (state === "arrived") {
    return (
      <div className="mb-3 rounded-3xl border-2 border-ink bg-white p-6 text-center">
        <div className="mb-3 text-5xl">🎉</div>
        <div className="font-display text-[22px] font-extrabold">You're here!</div>
        <div className="mt-1.5 text-[12px] text-ink/60">
          Your order is ready at the bar. Enjoy the night.
        </div>
        <div className="mt-3 inline-flex items-center rounded-full border-2 border-ink bg-gradient-to-r from-amber-100 to-coral/20 px-3.5 py-1.5 font-mono text-[10px] font-bold uppercase tracking-widest text-amber-800">
          +25 Confetti earned
        </div>
        <button
          type="button"
          onClick={() => setState("idle")}
          className="mt-4 block w-full rounded-2xl border-2 border-ink bg-cream px-3 py-3 font-mono text-[10px] font-bold uppercase tracking-[0.15em] text-ink/70"
        >
          Reset
        </button>
      </div>
    );
  }

  if (state === "live") {
    const minutes = Math.max(1, Math.round(((100 - progress) / 100) * 12));
    return (
      <div className="mb-3 rounded-3xl border-2 border-ink bg-white p-5">
        <div className="mb-4 inline-flex items-center gap-2 font-mono text-[8px] font-bold uppercase tracking-[0.2em] text-coral">
          <span className="h-2 w-2 animate-pulse rounded-full bg-coral" />
          Live — On My Way to {targetName}
        </div>
        <div className="mb-3 flex items-baseline gap-2">
          <span className="font-display text-5xl font-extrabold leading-none">{minutes}</span>
          <span className="font-mono text-sm font-semibold text-ink/55">min</span>
          <span className="ml-auto font-mono text-[10px] text-ink/40">{(minutes * 0.2).toFixed(1)} mi</span>
        </div>
        <div className="mb-4 h-1.5 overflow-hidden rounded-full bg-ink/5">
          <div
            className="h-full rounded-full bg-gradient-to-r from-coral to-amber-400 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="mb-4 flex flex-wrap gap-1.5">
          <Pill kind="done">✓ Crew notified</Pill>
          <Pill kind="done">✓ Venue alerted</Pill>
          <Pill kind="pending">🍸 Pre-order pending</Pill>
        </div>
        <button
          type="button"
          onClick={() => setState("arrived")}
          className="w-full rounded-2xl border-2 border-ink bg-ink px-3 py-3.5 font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-cream"
        >
          🎉 I've arrived
        </button>
      </div>
    );
  }

  return (
    <div className="mb-3 rounded-3xl border-2 border-ink bg-white p-5">
      <div className="mb-4 flex items-start gap-3">
        <div className="text-2xl">🎯</div>
        <div className="min-w-0 flex-1">
          <div className="font-display text-[15px] font-bold">Heading to {targetName}?</div>
          <div className="mt-0.5 text-[11px] leading-snug text-ink/60">
            Alert your crew and the venue. Drinks can be ready when you arrive.
          </div>
        </div>
      </div>
      <button
        type="button"
        onClick={() => setState("live")}
        className="relative w-full overflow-hidden rounded-2xl border-2 border-ink bg-gradient-to-br from-coral to-pink-500 px-3 py-4 font-mono text-[12px] font-bold uppercase tracking-[0.2em] text-white"
      >
        🚗 On My Way
      </button>
    </div>
  );
}

function Pill({ kind, children }: { kind: "done" | "pending"; children: React.ReactNode }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border-2 px-2.5 py-1 font-mono text-[8px] font-bold uppercase tracking-widest ${
        kind === "done"
          ? "border-emerald-600 bg-emerald-50 text-emerald-700"
          : "border-amber-600 bg-amber-50 text-amber-700"
      }`}
    >
      {children}
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/*  Section: Quick actions                                                     */
/* -------------------------------------------------------------------------- */

function QuickActions() {
  const items = [
    { icon: <Music className="h-5 w-5" />, label: "Playlist" },
    { icon: <MessageCircle className="h-5 w-5" />, label: "Group" },
    { icon: <Camera className="h-5 w-5" />, label: "Photos" },
    { icon: <Car className="h-5 w-5" />, label: "Ride" },
  ];
  return (
    <div className="mb-3 grid grid-cols-4 gap-2">
      {items.map((it) => (
        <button
          key={it.label}
          type="button"
          className="rounded-2xl border-2 border-ink bg-white px-2 py-4 text-center transition hover:-translate-y-0.5 hover:bg-cream"
        >
          <div className="mb-1.5 grid place-items-center text-ink">{it.icon}</div>
          <div className="font-mono text-[7px] font-bold uppercase tracking-[0.15em] text-ink/55">
            {it.label}
          </div>
        </button>
      ))}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Section: Pre-order drawer                                                  */
/* -------------------------------------------------------------------------- */

function PreorderDrawer({
  stop,
  onClose,
}: {
  stop: LoopStop | null;
  onClose: () => void;
}) {
  const [qty, setQty] = useState<Record<string, number>>({});
  const menu = useMemo(() => (stop ? menuForStop(stop.id) : []), [stop]);

  useEffect(() => {
    if (!stop) setQty({});
  }, [stop]);

  const total = menu.reduce((acc, m) => acc + (qty[m.id] || 0) * m.price, 0);
  const count = Object.values(qty).reduce((a, b) => a + b, 0);
  const open = !!stop;

  return (
    <div
      className={`fixed inset-0 z-[500] flex items-end justify-center bg-ink/40 backdrop-blur-sm transition-opacity ${
        open ? "opacity-100" : "pointer-events-none opacity-0"
      }`}
      onClick={onClose}
    >
      <div
        className="w-full max-w-[440px] max-h-[85vh] overflow-y-auto rounded-t-3xl border-t-2 border-x-2 border-ink bg-cream transition-transform duration-300"
        style={{ transform: open ? "translateY(0)" : "translateY(100%)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mt-3 h-1 w-9 rounded-full bg-ink/15" />
        <div className="flex items-start justify-between px-5 pb-3 pt-4">
          <div>
            <div className="font-display text-[18px] font-extrabold">
              🍸 Pre-order for {stop?.name}
            </div>
            <div className="mt-0.5 text-[11px] text-ink/55">Ready when you arrive</div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-7 w-7 place-items-center rounded-full border-2 border-ink bg-white"
            aria-label="Close"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2 p-5 pt-0">
          {menu.map((m) => {
            const q = qty[m.id] || 0;
            return (
              <div
                key={m.id}
                className={`rounded-2xl border-2 bg-white p-4 transition ${
                  q > 0 ? "border-coral" : "border-ink"
                }`}
              >
                <div className="mb-1.5 text-2xl">{m.emoji}</div>
                <div className="text-[13px] font-bold leading-tight">{m.name}</div>
                <div className="mt-1 line-clamp-2 text-[10px] text-ink/55">{m.desc}</div>
                <div className="mt-2 font-mono text-[12px] font-bold text-coral">${m.price}</div>
                {q === 0 ? (
                  <button
                    type="button"
                    onClick={() => setQty((p) => ({ ...p, [m.id]: 1 }))}
                    className="mt-2 inline-flex items-center gap-1 rounded-full border-2 border-ink bg-white px-2.5 py-1 font-mono text-[8px] font-bold uppercase tracking-widest text-ink/70"
                  >
                    <Plus className="h-3 w-3" /> Add
                  </button>
                ) : (
                  <div className="mt-2 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setQty((p) => ({ ...p, [m.id]: Math.max(0, (p[m.id] || 0) - 1) }))
                      }
                      className="grid h-7 w-7 place-items-center rounded-full border-2 border-ink bg-white"
                      aria-label="Decrease"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="font-mono text-sm font-bold">{q}</span>
                    <button
                      type="button"
                      onClick={() => setQty((p) => ({ ...p, [m.id]: (p[m.id] || 0) + 1 }))}
                      className="grid h-7 w-7 place-items-center rounded-full border-2 border-ink bg-white"
                      aria-label="Increase"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="sticky bottom-0 border-t-2 border-ink bg-cream px-5 pb-[max(16px,env(safe-area-inset-bottom))] pt-4">
          <div className="mb-2 flex items-center justify-between">
            <span className="font-mono text-[10px] font-semibold uppercase tracking-widest text-ink/55">
              {count} item{count === 1 ? "" : "s"}
            </span>
            <span className="font-display text-[20px] font-extrabold">${total.toFixed(2)}</span>
          </div>
          <button
            type="button"
            disabled={count === 0}
            onClick={onClose}
            className={`w-full rounded-2xl border-2 px-3 py-4 font-mono text-[11px] font-bold uppercase tracking-[0.15em] transition ${
              count > 0
                ? "border-ink bg-gradient-to-br from-coral to-pink-500 text-white"
                : "cursor-not-allowed border-ink/15 bg-ink/5 text-ink/40"
            }`}
          >
            {count > 0 ? `Send order · $${total.toFixed(2)}` : "Add items to pre-order"}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="mt-2 w-full py-3 font-mono text-[10px] font-bold uppercase tracking-widest text-ink/55"
          >
            Skip for now
          </button>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Section label                                                              */
/* -------------------------------------------------------------------------- */

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-3 mt-5 flex items-center gap-2 font-mono text-[9px] font-semibold uppercase tracking-[0.3em] text-coral">
      {children}
      <span className="h-px flex-1 bg-gradient-to-r from-ink/40 to-transparent" />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Main                                                                       */
/* -------------------------------------------------------------------------- */

export function BoardingPassV3({ loop, containerRef }: { loop: ActiveLoop; containerRef?: React.RefObject<HTMLDivElement> }) {
  const [preorderStop, setPreorderStop] = useState<LoopStop | null>(null);
  const crew = useMemo(() => deriveCrew(loop), [loop]);
  const currentIdx = loop.stops.findIndex((s) => !s.done);
  const targetStop = loop.stops[currentIdx >= 0 ? currentIdx : 0];

  return (
    <div ref={containerRef} className="relative mx-auto max-w-[400px] px-4">
      {/* Ambient orbs */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-[8%] -right-[10%] h-72 w-72 rounded-full bg-coral/12 blur-[100px]" />
        <div className="absolute bottom-[10%] -left-[8%] h-64 w-64 rounded-full bg-purple-500/10 blur-[100px]" />
        <div className="absolute top-1/2 left-[40%] h-52 w-52 rounded-full bg-amber-400/10 blur-[100px]" />
      </div>

      <PassHeader />
      <RouteStrip loop={loop} />
      <ProgressRail loop={loop} />

      <SectionLabel>Itinerary</SectionLabel>
      {loop.stops.map((stop, i) => {
        const isCurrent = i === currentIdx;
        const next = loop.stops[i + 1];
        const drive = stop.driveAfter;
        return (
          <div key={stop.id}>
            <StopCard stop={stop} index={i} isCurrent={isCurrent} onPreorder={setPreorderStop} />
            {next && drive && (
              <TravelConnector minutes={drive.minutes} to={drive.destination} />
            )}
            {next && !drive && <div className="h-3" />}
          </div>
        );
      })}

      <SectionLabel>Night Intel</SectionLabel>
      <NightIntel loop={loop} />

      <SectionLabel>Crew</SectionLabel>
      <CrewManifest crew={crew} />

      <SectionLabel>On My Way</SectionLabel>
      <OnMyWay targetName={targetStop?.name || "your first stop"} />

      <SectionLabel>Quick Actions</SectionLabel>
      <QuickActions />

      <PreorderDrawer stop={preorderStop} onClose={() => setPreorderStop(null)} />
    </div>
  );
}

export default BoardingPassV3;
