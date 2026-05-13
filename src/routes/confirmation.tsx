import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Check, Wallet, Apple, Share2 } from "lucide-react";
import { getActiveLoop, makeDemoLoop, type ActiveLoop } from "@/lib/loop-store";
import { toast } from "sonner";

export const Route = createFileRoute("/confirmation")({
  head: () => ({ meta: [{ title: "Confirmed — Confetti" }] }),
  component: ConfirmationPage,
});

const COLORS = ["bg-coral", "bg-gold", "bg-purple", "bg-pink-400", "bg-emerald-500", "bg-teal"];

function ConfirmationPage() {
  const [loop, setLoop] = useState<ActiveLoop | null>(null);
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    let next: ActiveLoop | null = null;
    try {
      next = getActiveLoop() || makeDemoLoop();
    } catch (err) {
      console.error("[confirmation] failed to read active loop", err);
      try {
        next = makeDemoLoop();
      } catch (err2) {
        console.error("[confirmation] makeDemoLoop also failed", err2);
      }
    }
    setLoop(next);
    setHydrated(true);
  }, []);

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

  if (!loop) {
    return (
      <div className="relative min-h-screen bg-background pb-32">
        <div className="mx-auto max-w-md px-4 pt-16 text-center">
          <div className="mx-auto h-24 w-24 animate-pulse rounded-full border-2 border-ink/10 bg-card" />
          <div className="mx-auto mt-6 h-8 w-3/4 animate-pulse rounded bg-card" />
          <div className="mx-auto mt-3 h-4 w-1/2 animate-pulse rounded bg-card" />
          <div className="mt-8 h-40 animate-pulse rounded-3xl border-2 border-ink/10 bg-card" />
          {hydrated && (
            <div className="mt-6 space-y-3">
              <p className="text-sm text-muted-foreground">
                We couldn't find a plan to confirm. Build one and we'll lock it in.
              </p>
              <Link
                to="/create"
                className="inline-flex w-full items-center justify-center rounded-2xl border-2 border-ink bg-coral px-4 py-4 font-display text-sm font-bold uppercase tracking-wide text-cream shadow-brut"
              >
                Build my night
              </Link>
            </div>
          )}
        </div>
      </div>
    );
  }

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
        <h1 className="mt-6 font-display text-4xl font-extrabold tracking-tight">
          You're all set!
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Your plan is locked. Confirmation sent.
        </p>

        <div className="mt-6 rounded-3xl border-2 border-ink bg-card p-5 text-left shadow-brut">
          <div className="flex items-center justify-between">
            <div className="font-mono text-[10px] font-bold uppercase tracking-widest text-ink/60">
              Plan summary
            </div>
            {loop.booking?.ref && (
              <div className="font-mono text-[10px] font-bold uppercase tracking-widest text-coral">
                {loop.booking.ref}
              </div>
            )}
          </div>
          <div className="mt-2 grid grid-cols-3 gap-2 text-center">
            <Stat label="Stops" value={loop.stops.length.toString()} />
            <Stat label="Date" value={loop.date.split(",")[0]} />
            <Stat label="Party" value={String(loop.groupSize)} />
          </div>

          {loop.booking && (
            <ul className="mt-4 space-y-1.5">
              {loop.stops.map((s, i) => {
                const ref = loop.booking!.stops[s.id];
                return (
                  <li
                    key={s.id}
                    className="flex items-center justify-between gap-2 rounded-lg border border-ink/15 bg-background px-2.5 py-1.5 text-xs"
                  >
                    <span className="flex items-center gap-2 truncate">
                      <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full border-2 border-ink bg-cream font-mono text-[9px] font-bold">
                        {i + 1}
                      </span>
                      <span className="truncate font-semibold">{s.name}</span>
                    </span>
                    <span className="font-mono text-[10px] text-ink/70">
                      {ref ?? "—"}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          <button
            onClick={() => toast.success("Apple Wallet pass coming soon")}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border-2 border-ink bg-ink px-4 py-3 text-sm font-bold text-cream shadow-brut transition-pop hover:-translate-y-0.5"
          >
            <Apple className="h-4 w-4" /> Apple Wallet
          </button>
          <button
            onClick={() => toast.success("Google Wallet pass coming soon")}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border-2 border-ink bg-cream px-4 py-3 text-sm font-bold text-ink shadow-brut transition-pop hover:-translate-y-0.5"
          >
            <Wallet className="h-4 w-4" /> Google Wallet
          </button>
        </div>

        <Link
          to="/boarding-pass"
          className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-ink bg-coral px-4 py-4 font-display text-sm font-bold uppercase tracking-wide text-cream shadow-brut transition-pop hover:-translate-y-0.5"
        >
          View Boarding Pass
        </Link>
        <button
          onClick={() => {
            navigator
              .share?.({ title: "Confetti", text: "Check out my Confetti plan", url: location.href })
              .catch(() => toast.success("Share link copied"));
          }}
          className="mt-3 inline-flex items-center justify-center gap-2 text-sm font-semibold text-ink/70 hover:text-ink"
        >
          <Share2 className="h-3.5 w-3.5" /> Share with friends
        </button>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-background p-2">
      <div className="font-mono text-[9px] font-bold uppercase tracking-widest text-ink/60">
        {label}
      </div>
      <div className="font-display text-lg font-extrabold">{value}</div>
    </div>
  );
}
