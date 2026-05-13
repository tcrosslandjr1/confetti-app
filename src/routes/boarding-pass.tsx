import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Play, Share2, Check, Mail, Lock, Pencil, ImageDown, Loader2 } from "lucide-react";
import { trackShareEvent } from "@/lib/share-analytics";
import { ChangeMyNight } from "@/components/ChangeMyNight";
import { toast } from "sonner";
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
  const [shared, setShared] = useState(false);
  const [imageBusy, setImageBusy] = useState(false);
  const passRef = useRef<HTMLDivElement>(null);

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

  const buildShareContent = () => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    const subject = `${passData.occasionEmoji} ${passData.occasionLabel} — Confetti itinerary`;
    const stopsText = passData.stops
      .map((s, i) => {
        const tags = s.tags?.length ? ` (${s.tags.slice(0, 2).join(", ")})` : "";
        const detail = s.detail ? `\n   ${s.detail}` : "";
        return `${i + 1}. ${s.time ? s.time + " — " : ""}${s.name}${tags}${detail}`;
      })
      .join("\n\n");
    const header = `${passData.occasionEmoji} ${passData.occasionLabel}${
      passData.date ? ` · ${passData.date}` : ""
    }`;
    const body =
      `${header}\n${passData.origin.name} → ${passData.destination.name}\n` +
      `${passData.passengers}\n\n` +
      `Itinerary:\n${stopsText}\n\n` +
      (url ? `View the full boarding pass:\n${url}\n\n` : "") +
      `Built with Confetti — confettiplan.lovable.app`;
    return { subject, body, url };
  };

  const handleShare = async () => {
    const { subject, body, url } = buildShareContent();
    try {
      const nav = typeof navigator !== "undefined" ? navigator : undefined;
      if (nav && typeof nav.share === "function") {
        await nav.share({ title: subject, text: body, url });
        setShared(true);
        toast.success("Shared!", {
          description: "Your itinerary is on its way.",
          duration: 3500,
          position: "bottom-center",
        });
        setTimeout(() => setShared(false), 2200);
        return;
      }
      if (nav?.clipboard?.writeText) {
        await nav.clipboard.writeText(`${body}`);
        setShared(true);
        toast.success("Copied to clipboard", {
          description: "Paste it into any chat or email.",
          duration: 3500,
          position: "bottom-center",
        });
        setTimeout(() => setShared(false), 2200);
        return;
      }
      toast.message("Sharing isn't supported on this device", {
        position: "bottom-center",
      });
    } catch (err) {
      if ((err as { name?: string })?.name === "AbortError") return;
      toast.error("Couldn't share — try again", { position: "bottom-center" });
    }
  };

  const handleEmailShare = () => {
    const { subject, body } = buildShareContent();
    const mailto = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    if (typeof window !== "undefined") {
      window.location.href = mailto;
      toast.success("Email draft opened", {
        description: "Check your mail app to send it.",
        duration: 3500,
        position: "bottom-center",
      });
    }
  };

  return (
    <div className="min-h-screen pb-32" style={{ background: "#fdf6ee" }}>
      <div className="mx-auto max-w-md px-4 pt-6">
        <div className="flex items-center justify-between gap-3">
          <Link
            to="/portal"
            className="inline-flex items-center gap-1 font-mono text-xs font-bold uppercase tracking-widest text-ink/70 hover:text-ink"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back
          </Link>
          <button
            type="button"
            onClick={handleShare}
            aria-label="Share itinerary with friends"
            className="inline-flex items-center gap-1.5 rounded-full border-2 border-ink bg-cream px-3 py-1.5 font-mono text-[11px] font-bold uppercase tracking-widest text-ink shadow-brut transition-pop hover:-translate-y-0.5 hover:bg-gold"
          >
            {shared ? <Check className="h-3.5 w-3.5" /> : <Share2 className="h-3.5 w-3.5" />}
            {shared ? "Copied" : "Share"}
          </button>
        </div>
        <h1 className="mt-4 font-display text-3xl font-extrabold tracking-tight">
          Review your plan
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Tap <span className="font-bold">Try a different vibe</span> to explore alternatives, or lock it in below.
        </p>
        {!data && (
          <p className="mt-2 font-mono text-[10px] uppercase tracking-widest text-ink/50">
            Showing sample plan — build a night to see your own here.
          </p>
        )}
      </div>
      <div className="mt-6 px-4">
        <BoardingPassV2 data={passData} />

        {/* Explore alternatives + edit before locking in */}
        {data && (
          <div className="mx-auto mt-5 max-w-md">
            <ChangeMyNight />
            <div className="mt-3 grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={handleShare}
                aria-label="Share this plan with friends"
                className="inline-flex items-center justify-center gap-1.5 rounded-2xl border-2 border-ink bg-gold px-2 py-3 font-display text-xs font-bold uppercase tracking-wide text-ink shadow-brut transition-pop hover:-translate-y-0.5"
              >
                {shared ? <Check className="h-4 w-4" /> : <Share2 className="h-4 w-4" />}
                {shared ? "Copied" : "Share"}
              </button>
              <Link
                to="/create"
                className="inline-flex items-center justify-center gap-1.5 rounded-2xl border-2 border-ink bg-cream px-2 py-3 font-display text-xs font-bold uppercase tracking-wide text-ink shadow-brut transition-pop hover:-translate-y-0.5"
              >
                <Pencil className="h-4 w-4" /> Edit
              </Link>
              <Link
                to="/confirmation"
                className="inline-flex items-center justify-center gap-1.5 rounded-2xl border-2 border-ink bg-gradient-vibe px-2 py-3 font-display text-xs font-bold uppercase tracking-wide text-cream shadow-brut transition-pop hover:-translate-y-0.5"
              >
                <Lock className="h-4 w-4" /> Lock in
              </Link>
            </div>
            <p className="mt-2 text-center font-mono text-[10px] uppercase tracking-widest text-ink/50">
              Share to get a vibe-check before you lock it in
            </p>
          </div>
        )}
        {/* Desktop / tablet inline actions */}
        <div className="mx-auto mt-5 hidden max-w-md gap-3 sm:grid sm:grid-cols-[1fr_auto_auto]">
          <Link
            to="/active-loop"
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-ink bg-coral px-4 py-3 font-display text-sm font-bold uppercase tracking-wide text-cream shadow-brut transition-pop hover:-translate-y-0.5"
          >
            <Play className="h-4 w-4" /> Start the Plan
          </Link>
          <button
            type="button"
            onClick={handleEmailShare}
            aria-label="Share itinerary by email"
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-ink bg-cream px-4 py-3 font-display text-sm font-bold uppercase tracking-wide text-ink shadow-brut transition-pop hover:-translate-y-0.5 hover:bg-gold sm:w-auto"
          >
            <Mail className="h-4 w-4" /> Email
          </button>
          <button
            type="button"
            onClick={handleShare}
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-ink bg-cream px-4 py-3 font-display text-sm font-bold uppercase tracking-wide text-ink shadow-brut transition-pop hover:-translate-y-0.5 hover:bg-gold sm:w-auto"
          >
            {shared ? <Check className="h-4 w-4" /> : <Share2 className="h-4 w-4" />}
            {shared ? "Copied" : "Share"}
          </button>
        </div>
      </div>

      {/* Mobile sticky bottom action bar — thumb-friendly, one-handed */}
      <div
        className="fixed inset-x-0 bottom-0 z-40 border-t-2 border-ink bg-cream/95 backdrop-blur supports-[backdrop-filter]:bg-cream/80 sm:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="mx-auto flex max-w-md items-stretch gap-2 px-3 py-3">
          <Link
            to="/active-loop"
            aria-label="Start the plan"
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl border-2 border-ink bg-coral px-3 py-3 font-display text-sm font-bold uppercase tracking-wide text-cream shadow-brut active:translate-y-0.5"
          >
            <Play className="h-4 w-4" /> Start
          </Link>
          <button
            type="button"
            onClick={handleEmailShare}
            aria-label="Share itinerary by email"
            className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border-2 border-ink bg-cream shadow-brut active:translate-y-0.5"
          >
            <Mail className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={handleShare}
            aria-label="Share itinerary"
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl border-2 border-ink bg-gold px-3 py-3 font-display text-sm font-bold uppercase tracking-wide text-ink shadow-brut active:translate-y-0.5"
          >
            {shared ? <Check className="h-4 w-4" /> : <Share2 className="h-4 w-4" />}
            {shared ? "Copied" : "Share"}
          </button>
        </div>
      </div>
    </div>
  );
}
