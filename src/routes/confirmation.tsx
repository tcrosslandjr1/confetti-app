import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Check, Wallet, Apple, Share2 } from "lucide-react";
import { TabBar } from "@/components/loop/TabBar";
import { getActiveLoop, makeDemoLoop, type ActiveLoop } from "@/lib/loop-store";
import { toast } from "sonner";

export const Route = createFileRoute("/confirmation")({
  head: () => ({ meta: [{ title: "Confirmed — Loop" }] }),
  component: ConfirmationPage,
});

const COLORS = ["bg-coral", "bg-gold", "bg-purple", "bg-pink-400", "bg-emerald-500", "bg-teal"];

function ConfirmationPage() {
  const [loop, setLoop] = useState<ActiveLoop | null>(null);
  useEffect(() => setLoop(getActiveLoop() || makeDemoLoop()), []);

  const pieces = useMemo(
    () =>
      Array.from({ length: 42 }).map((_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 2.5,
        duration: 2 + Math.random() * 2,
        color: COLORS[i % COLORS.length],
        rot: Math.random() * 360,
      })),
    [],
  );

  if (!loop) return null;

  return (
    <div className="relative min-h-screen overflow-hidden bg-background pb-32">
      {/* Confetti */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        {pieces.map((p) => (
          <span
            key={p.id}
            className={`absolute h-2.5 w-2.5 rounded-[2px] ${p.color}`}
            style={{
              left: `${p.left}%`,
              top: -20,
              transform: `rotate(${p.rot}deg)`,
              animation: `confetti-fall ${p.duration}s cubic-bezier(.3,.7,.4,1) ${p.delay}s infinite`,
            }}
          />
        ))}
      </div>

      <div className="relative mx-auto max-w-md px-4 pt-16 text-center">
        <div className="mx-auto grid h-24 w-24 place-items-center rounded-full border-2 border-ink bg-gradient-vibe text-cream shadow-brut-lg">
          <Check className="h-12 w-12" strokeWidth={3} />
        </div>
        <h1 className="mt-6 font-display text-4xl font-extrabold tracking-tight">You're all set!</h1>
        <p className="mt-2 text-sm text-muted-foreground">Your Loop is locked. Confirmation sent.</p>

        <div className="mt-6 rounded-3xl border-2 border-ink bg-card p-5 text-left shadow-brut">
          <div className="font-mono text-[10px] font-bold uppercase tracking-widest text-ink/60">Loop summary</div>
          <div className="mt-2 grid grid-cols-3 gap-2 text-center">
            <Stat label="Stops" value={loop.stops.length.toString()} />
            <Stat label="Date" value={loop.date.split(",")[0]} />
            <Stat label="Party" value={String(loop.groupSize)} />
          </div>
        </div>

        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          <button onClick={() => toast.success("Apple Wallet pass coming soon")} className="inline-flex items-center justify-center gap-2 rounded-2xl border-2 border-ink bg-ink px-4 py-3 text-sm font-bold text-cream shadow-brut transition-pop hover:-translate-y-0.5">
            <Apple className="h-4 w-4" /> Apple Wallet
          </button>
          <button onClick={() => toast.success("Google Wallet pass coming soon")} className="inline-flex items-center justify-center gap-2 rounded-2xl border-2 border-ink bg-cream px-4 py-3 text-sm font-bold text-ink shadow-brut transition-pop hover:-translate-y-0.5">
            <Wallet className="h-4 w-4" /> Google Wallet
          </button>
        </div>

        <Link to="/boarding-pass" className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-ink bg-coral px-4 py-4 font-display text-sm font-bold uppercase tracking-wide text-cream shadow-brut transition-pop hover:-translate-y-0.5">
          View Boarding Pass
        </Link>
        <button
          onClick={() => {
            navigator.share?.({ title: "Loop", text: "Check out my Loop", url: location.href }).catch(() => toast.success("Share link copied"));
          }}
          className="mt-3 inline-flex items-center justify-center gap-2 text-sm font-semibold text-ink/70 hover:text-ink"
        >
          <Share2 className="h-3.5 w-3.5" /> Share with friends
        </button>
      </div>
      <TabBar />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-background p-2">
      <div className="font-mono text-[9px] font-bold uppercase tracking-widest text-ink/60">{label}</div>
      <div className="font-display text-lg font-extrabold">{value}</div>
    </div>
  );
}
