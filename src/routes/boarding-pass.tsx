import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Share2, Check, Play, Mail, ImageDown, Loader2 } from "lucide-react";
import { trackShareEvent } from "@/lib/share-analytics";
import { toast } from "sonner";
import { BoardingPassV3 } from "@/components/BoardingPassV3";
import {
  getActiveLoop,
  makeDemoLoop,
  subscribeActiveLoop,
  type ActiveLoop,
  type LoopStop,
} from "@/lib/loop-store";

export const Route = createFileRoute("/boarding-pass")({
  head: () => ({ meta: [{ title: "Boarding Pass — Confetti" }] }),
  component: BoardingPassPage,
});

/**
 * Built-in sample loop used when no active plan is in localStorage —
 * keeps the page presentable for first-time visitors.
 */
const SAMPLE_LOOP: ActiveLoop = makeDemoLoop({
  id: "SAMPLE-DC-NIGHT",
  passenger: "Tyrone",
  from: "HOME",
  to: "NIGHT OUT",
  fromName: "Adams Morgan",
  toName: "Shaw",
  gate: "ADMO",
  boardingTime: "7:30 PM",
  date: "Sat · May 17",
  day: "Saturday",
  groupSize: 4,
  occasion: "Night Out",
  occasionEmoji: "🌙",
  vibes: ["Date night", "Cocktail-forward", "Late night"],
  estimatedSpend: "~$180",
  stops: [
    {
      id: "s1",
      name: "Dauphine's",
      type: "Southern · craft cocktails",
      time: "7:30 PM",
      area: "Adams Morgan",
      address: "1100 15th St NW, Washington, DC",
      tags: [{ label: "southern charm", variant: "vibe" }, { label: "craft cocktails", variant: "vibe" }],
      parking: { primary: "Street meters free after 6:30p", secondary: "Garage on Belmont St ($12)" },
      ev: { brand: "ChargePoint", spec: "L2", chargeTime: "30 min", sub: "0.2mi away" },
      driveAfter: { minutes: 8, destination: "U Street" },
      bookable: true,
    },
    {
      id: "s2",
      name: "The Gibson",
      type: "Speakeasy · intimate",
      time: "9:15 PM",
      area: "U Street Corridor",
      address: "2009 14th St NW, Washington, DC",
      tags: [{ label: "speakeasy", variant: "vibe" }, { label: "bespoke drinks", variant: "vibe" }],
      parking: { primary: "Street on 14th St", secondary: "ParkWhiz lot on U ($8 evening)" },
      ev: { brand: "Blink", spec: "L2", chargeTime: "45 min", sub: "0.1mi on 14th" },
      driveAfter: { minutes: 6, destination: "Shaw" },
    },
    {
      id: "s3",
      name: "Flash",
      type: "Rooftop · house music",
      time: "11:00 PM",
      area: "Shaw",
      address: "645 Florida Ave NW, Washington, DC",
      tags: [{ label: "rooftop", variant: "vibe" }, { label: "late night", variant: "vibe" }],
      parking: { primary: "Garage on 9th & P ($15 flat)", secondary: "Rideshare recommended" },
      ev: { brand: "EVgo", spec: "DC", chargeTime: "20 min", sub: "0.3mi on 7th St" },
    },
  ] satisfies LoopStop[],
});

function BoardingPassPage() {
  const [loop, setLoop] = useState<ActiveLoop | null>(null);
  const [shared, setShared] = useState(false);
  const [imageBusy, setImageBusy] = useState(false);
  const passRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sync = () => setLoop(getActiveLoop());
    sync();
    return subscribeActiveLoop(sync);
  }, []);

  const usingSample = !loop;
  const activeLoop = loop ?? SAMPLE_LOOP;

  const buildShareContent = () => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    const occasion = activeLoop.occasion ?? "Confetti night";
    const subject = `${activeLoop.occasionEmoji ?? "✨"} ${occasion} — Confetti itinerary`;
    const stopsText = activeLoop.stops
      .map((s, i) => `${i + 1}. ${s.time ? s.time + " — " : ""}${s.name}${s.area ? ` · ${s.area}` : ""}`)
      .join("\n");
    const body =
      `${subject}\n${activeLoop.date ?? ""}\n\nItinerary:\n${stopsText}\n\n` +
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
        toast.success("Shared!", { position: "bottom-center", duration: 3000 });
        setTimeout(() => setShared(false), 2200);
        return;
      }
      if (nav?.clipboard?.writeText) {
        await nav.clipboard.writeText(body);
        setShared(true);
        toast.success("Copied to clipboard", { position: "bottom-center", duration: 3000 });
        setTimeout(() => setShared(false), 2200);
        return;
      }
    } catch (err) {
      if ((err as { name?: string })?.name === "AbortError") return;
      toast.error("Couldn't share — try again", { position: "bottom-center" });
    }
  };

  const handleEmailShare = () => {
    const { subject, body } = buildShareContent();
    if (typeof window !== "undefined") {
      window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    }
  };

  const handleShareImage = async () => {
    if (!passRef.current) return;
    setImageBusy(true);
    try {
      const { toPng } = await import("html-to-image");
      const dataUrl = await toPng(passRef.current, {
        cacheBust: true,
        pixelRatio: 3,
        backgroundColor: "#FBF5E5",
      });
      const fileName = `confetti-${activeLoop.id.toLowerCase()}.png`;
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      trackShareEvent("share_save_image", { loopId: activeLoop.id });
      toast.success("Image saved", { position: "bottom-center", duration: 3000 });
    } catch {
      toast.error("Couldn't generate image — try again", { position: "bottom-center" });
    } finally {
      setImageBusy(false);
    }
  };

  return (
    <div className="min-h-screen pb-32" style={{ background: "#FBF5E5" }}>
      <div className="mx-auto flex max-w-[400px] items-center justify-between gap-3 px-4 pt-4">
        <Link
          to="/portal"
          className="inline-flex items-center gap-1 font-mono text-[10px] font-bold uppercase tracking-widest text-ink/70 hover:text-ink"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back
        </Link>
        <button
          type="button"
          onClick={handleShare}
          className="inline-flex items-center gap-1.5 rounded-full border-2 border-ink bg-white px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-widest text-ink"
        >
          {shared ? <Check className="h-3.5 w-3.5" /> : <Share2 className="h-3.5 w-3.5" />}
          {shared ? "Copied" : "Share"}
        </button>
      </div>

      {usingSample && (
        <p className="mx-auto max-w-[400px] px-4 pt-2 text-center font-mono text-[10px] uppercase tracking-widest text-ink/45">
          Showing sample plan — build a night to see your own here.
        </p>
      )}

      <div className="mt-2">
        <BoardingPassV3 loop={activeLoop} containerRef={passRef} />
      </div>

      {/* Sticky wallet footer */}
      <div
        className="fixed inset-x-0 bottom-0 z-40 border-t-2 border-ink bg-cream/95 backdrop-blur"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="mx-auto flex max-w-[400px] items-stretch gap-2 px-4 py-3">
          <Link
            to="/active-loop"
            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-2xl border-2 border-ink bg-gradient-to-br from-coral to-pink-500 px-3 py-3 font-mono text-[10px] font-bold uppercase tracking-[0.15em] text-white"
          >
            <Play className="h-3.5 w-3.5" /> Start
          </Link>
          <button
            type="button"
            onClick={handleEmailShare}
            aria-label="Email"
            className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border-2 border-ink bg-white"
          >
            <Mail className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={handleShareImage}
            disabled={imageBusy}
            aria-label="Save image"
            className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border-2 border-ink bg-white disabled:opacity-50"
          >
            {imageBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImageDown className="h-4 w-4" />}
          </button>
          <button
            type="button"
            onClick={handleShare}
            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-2xl border-2 border-ink bg-white px-3 py-3 font-mono text-[10px] font-bold uppercase tracking-[0.15em] text-ink"
          >
            {shared ? <Check className="h-3.5 w-3.5" /> : <Share2 className="h-3.5 w-3.5" />}
            {shared ? "Copied" : "Share"}
          </button>
        </div>
      </div>
    </div>
  );
}
