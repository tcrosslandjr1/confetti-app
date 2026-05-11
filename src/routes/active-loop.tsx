import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { MapPin, Check, Navigation, X } from "lucide-react";
import { useConfettiBurst } from "@/components/ConfettiBurst";
import { addConfetti, getActiveLoop, getConfetti, makeDemoLoop, setActiveLoop, subscribeActiveLoop, subscribeConfetti, type ActiveLoop } from "@/lib/loop-store";
import { toast } from "sonner";

export const Route = createFileRoute("/active-loop")({
  head: () => ({ meta: [{ title: "Active Loop — Loop" }] }),
  component: ActiveLoopPage,
});

function ActiveLoopPage() {
  const [loop, setLoop] = useState<ActiveLoop | null>(null);
  const [confetti, setConfettiCount] = useState(0);
  const { burst, layer } = useConfettiBurst();
  const navigate = useNavigate();

  useEffect(() => {
    const existing = getActiveLoop() || makeDemoLoop();
    setActiveLoop(existing);
    setLoop(existing);
    setConfettiCount(getConfetti());
  }, []);

  if (!loop) return <div className="grid min-h-screen place-items-center text-sm text-muted-foreground">Loading…</div>;

  const currentIdx = loop.stops.findIndex((s) => !s.done);
  const current = currentIdx >= 0 ? loop.stops[currentIdx] : null;
  const next = currentIdx >= 0 ? loop.stops[currentIdx + 1] : null;
  const completed = currentIdx === -1;

  function checkIn(e: React.MouseEvent) {
    if (!current || !loop) return;
    burst(e.clientX, e.clientY);
    const updated: ActiveLoop = {
      ...loop,
      stops: loop.stops.map((s, i) => (i === currentIdx ? { ...s, done: true } : s)),
    };
    setActiveLoop(updated);
    setLoop(updated);
    const newTotal = addConfetti(50);
    setConfettiCount(newTotal);
    toast.success("+50 Confetti", { description: `Checked in at ${current.name}` });
  }

  function endEarly() {
    if (confirm("End this Loop early?")) {
      navigate({ to: "/passport" });
    }
  }

  return (
    <div className="min-h-screen bg-background pb-32">
      {layer}
      <div className="mx-auto max-w-md px-4 pt-6">
        <div className="flex items-center justify-between">
          <Link to="/boarding-pass" className="font-mono text-xs font-bold uppercase tracking-widest text-ink/70 hover:text-ink">← Pass</Link>
          <span className="rounded-full border-2 border-ink bg-gold px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-widest text-ink">
            {confetti} Confetti
          </span>
        </div>

        {/* Mini map placeholder */}
        <div className="mt-4 relative h-44 overflow-hidden rounded-3xl border-2 border-ink shadow-brut bg-gradient-cool">
          <div className="absolute inset-0 grid-paper opacity-30" />
          {loop.stops.map((s, i) => (
            <span
              key={s.id}
              className={`absolute grid h-8 w-8 place-items-center rounded-full border-2 border-ink ${i === currentIdx ? "bg-coral text-cream animate-pulse-glow" : s.done ? "bg-cream text-ink" : "bg-cream/80 text-ink"}`}
              style={{ top: `${20 + i * 22}%`, left: `${15 + i * 28}%` }}
            >
              {s.done ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : <span className="font-mono text-[10px] font-bold">{i + 1}</span>}
            </span>
          ))}
          <div className="absolute bottom-2 left-2 rounded-full bg-cream/90 px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-widest text-ink">Live route</div>
        </div>

        {completed ? (
          <div className="mt-6 rounded-3xl border-2 border-ink bg-coral p-6 text-cream shadow-brut text-center">
            <div className="font-display text-2xl font-extrabold">Loop complete 🎉</div>
            <p className="mt-1 text-sm opacity-90">You earned {confetti} Confetti tonight.</p>
            <Link to="/passport" className="mt-4 inline-flex items-center gap-1 rounded-full border-2 border-cream bg-cream px-4 py-2 font-mono text-xs font-bold uppercase tracking-widest text-ink">
              See your Passport →
            </Link>
          </div>
        ) : current ? (
          <div className="mt-6 rounded-3xl border-2 border-ink bg-card p-5 shadow-brut">
            <div className="flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-coral opacity-75" />
                <span className="relative inline-flex h-3 w-3 rounded-full bg-coral" />
              </span>
              <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-coral">Now</span>
              <span className="ml-auto font-mono text-[10px] uppercase tracking-widest text-ink/60">{current.time}</span>
            </div>
            <div className="mt-3 font-display text-2xl font-extrabold tracking-tight">{current.name}</div>
            <div className="text-sm text-muted-foreground">{current.type}{current.area ? ` · ${current.area}` : ""}</div>
            <button
              onClick={checkIn}
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-ink bg-coral px-4 py-3 font-display text-sm font-bold uppercase tracking-wide text-cream shadow-brut transition-pop active:scale-95"
            >
              <Navigation className="h-4 w-4" /> I'm Here
            </button>
          </div>
        ) : null}

        {next && !completed && (
          <div className="mt-4 rounded-2xl border-2 border-dashed border-ink/40 bg-card p-4">
            <div className="font-mono text-[10px] font-bold uppercase tracking-widest text-ink/60">Next stop</div>
            <div className="mt-1 flex items-baseline justify-between gap-3">
              <div>
                <div className="font-display text-base font-bold">{next.name}</div>
                <div className="text-xs text-muted-foreground flex items-center gap-1"><MapPin className="h-3 w-3" /> {next.area || "Nearby"} · ETA 12 min</div>
              </div>
              <span className="font-mono text-xs font-bold text-ink/70">{next.time}</span>
            </div>
          </div>
        )}

        <div className="mt-8 grid gap-2">
          <div className="rounded-2xl border border-border bg-card p-4">
            <div className="font-mono text-[10px] font-bold uppercase tracking-widest text-ink/60 mb-2">All stops</div>
            <ol className="space-y-2">
              {loop.stops.map((s, i) => (
                <li key={s.id} className="flex items-center gap-2">
                  <span className={`grid h-6 w-6 place-items-center rounded-full border-2 border-ink ${s.done ? "bg-coral text-cream" : i === currentIdx ? "bg-gold" : "bg-cream"}`}>
                    {s.done ? <Check className="h-3 w-3" strokeWidth={3} /> : <span className="font-mono text-[9px] font-bold">{i + 1}</span>}
                  </span>
                  <div className="flex-1 text-sm font-semibold">{s.name}</div>
                  <span className="font-mono text-[10px] text-ink/60">{s.time}</span>
                </li>
              ))}
            </ol>
          </div>
          {!completed && (
            <button
              onClick={endEarly}
              className="inline-flex items-center justify-center gap-1 rounded-xl border border-border py-2 text-xs font-semibold text-muted-foreground hover:text-destructive"
            >
              <X className="h-3 w-3" /> End Loop early
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
