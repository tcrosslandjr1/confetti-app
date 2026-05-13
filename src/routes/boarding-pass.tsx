import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Play } from "lucide-react";
import {
  BoardingPassV2,
  sampleMothersDayData,
  type BoardingPassData,
  type BoardingStop,
} from "@/components/BoardingPassV2";
import {
  getActiveLoop,
  subscribeActiveLoop,
  type ActiveLoop,
  type LoopStop,
} from "@/lib/loop-store";

export const Route = createFileRoute("/boarding-pass")({
  head: () => ({ meta: [{ title: "Boarding Pass — Confetti" }] }),
  component: BoardingPassPage,
});

const VIBE_EMOJI: Record<string, string> = {
  celebration: "🌸",
  foodie: "🍽",
  shopping: "🛍",
  eco: "💚",
  romantic: "💕",
  chill: "🌿",
  party: "🎉",
  date: "💕",
  family: "👨‍👩‍👧",
  brunch: "🥂",
  drinks: "🍸",
  music: "🎶",
  art: "🎨",
  walk: "🚶",
  outdoors: "🌳",
};

function vibeChip(label: string): { emoji: string; label: string } {
  const key = label.toLowerCase().trim();
  return { emoji: VIBE_EMOJI[key] ?? "✨", label: label[0].toUpperCase() + label.slice(1) };
}

function code3(s: string | undefined, fallback: string) {
  if (!s) return fallback;
  const letters = s.replace(/[^A-Za-z]/g, "");
  return (letters.slice(0, 3) || fallback).toUpperCase();
}

function mapStop(s: LoopStop, i: number, total: number): BoardingStop {
  const kind: BoardingStop["type"] =
    s.kind ?? (i === 0 ? "departure" : i === total - 1 ? "destination" : "layover");
  return {
    type: kind,
    time: s.time || "",
    name: s.name,
    detail: s.detail || [s.type, s.area].filter(Boolean).join(" · "),
    emoji: s.emoji || "📍",
    parkingInfo: s.parking,
    sundayParking: s.sundayParking,
    appleMapUrl: s.address
      ? `maps://maps.apple.com/?daddr=${encodeURIComponent(s.address)}&dirflg=d`
      : undefined,
    googleMapUrl: s.address
      ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(s.address)}`
      : undefined,
    tags: s.tags?.map((t) => t.label) ?? (s.type ? [s.type] : undefined),
    evInfo: s.ev
      ? { network: s.ev.brand, spec: s.ev.spec, time: s.ev.chargeTime, detail: s.ev.sub ?? "" }
      : undefined,
    driveTo: s.driveAfter
      ? { minutes: s.driveAfter.minutes, toLabel: s.driveAfter.destination.toUpperCase() }
      : undefined,
  };
}

function mapLoop(loop: ActiveLoop): BoardingPassData {
  const stops = loop.stops.map((s, i) => mapStop(s, i, loop.stops.length));
  const first = loop.stops[0];
  const last = loop.stops[loop.stops.length - 1];
  const hoods = new Set(loop.stops.map((s) => s.area).filter(Boolean));
  return {
    flightCode: `CNFT-${code3(loop.occasion ?? loop.vibe, "TRP")}-${loop.id.slice(-4).toUpperCase()}`,
    occasionEmoji: loop.occasionEmoji ?? "✨",
    occasionLabel: loop.occasion ?? loop.vibe ?? "Your Confetti plan",
    date: loop.date || "",
    passengers: `${loop.groupSize} GUEST${loop.groupSize === 1 ? "" : "S"}`,
    day: (loop.day ?? "").toUpperCase(),
    origin: {
      code: code3(loop.fromName ?? first?.area ?? loop.from, "ORG"),
      name: loop.fromName ?? first?.area ?? loop.from ?? "Start",
    },
    destination: {
      code: code3(loop.toName ?? last?.area ?? loop.to, "DST"),
      name: loop.toName ?? last?.area ?? loop.to ?? "End",
    },
    vibes: (loop.vibes && loop.vibes.length ? loop.vibes : loop.vibe ? [loop.vibe] : []).map(
      vibeChip,
    ),
    stops,
    stats: {
      stops: loop.stops.length,
      hoods: hoods.size,
      duration: `${Math.max(1, loop.stops.length * 1.5)}h`,
      evReady: loop.stops.some((s) => !!s.ev),
    },
    reward: loop.confettiPoints ?? 100,
    passengerName: loop.passenger,
  };
}

function BoardingPassPage() {
  const [data, setData] = useState<BoardingPassData | null>(null);

  useEffect(() => {
    const sync = () => {
      const loop = getActiveLoop();
      setData(loop ? mapLoop(loop) : null);
    };
    sync();
    return subscribeActiveLoop(sync);
  }, []);

  // Fall back to the static demo only when no plan exists yet.
  const passData = data ?? sampleMothersDayData;

  return (
    <div className="min-h-screen pb-32" style={{ background: "#fdf6ee" }}>
      <div className="mx-auto max-w-md px-4 pt-6">
        <Link
          to="/portal"
          className="inline-flex items-center gap-1 font-mono text-xs font-bold uppercase tracking-widest text-ink/70 hover:text-ink"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back
        </Link>
        <h1 className="mt-4 font-display text-3xl font-extrabold tracking-tight">
          Your plan is ready
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Show this at each stop. Earn Confetti as you go.
        </p>
        {!data && (
          <p className="mt-2 font-mono text-[10px] uppercase tracking-widest text-ink/50">
            Showing sample plan — build a night to see your own here.
          </p>
        )}
      </div>
      <div className="mt-6 px-4">
        <BoardingPassV2 data={passData} />
        <div className="mx-auto mt-5 max-w-md">
          <Link
            to="/active-loop"
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-ink bg-coral px-4 py-3 font-display text-sm font-bold uppercase tracking-wide text-cream shadow-brut transition-pop hover:-translate-y-0.5"
          >
            <Play className="h-4 w-4" /> Start the Plan
          </Link>
        </div>
      </div>
    </div>
  );
}
