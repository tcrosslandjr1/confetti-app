import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { MapPin, Check, Navigation, X, Footprints, Car } from "lucide-react";
import { useConfettiBurst } from "@/components/ConfettiBurst";
import {
  addConfetti,
  getActiveLoop,
  getConfetti,
  makeDemoLoop,
  setActiveLoop,
  subscribeActiveLoop,
  subscribeConfetti,
  type ActiveLoop,
} from "@/lib/loop-store";
import { LoopMap, type ActiveLegInfo, type TravelMode } from "@/components/loop/LoopMap";
import { DirectionsPanel } from "@/components/loop/DirectionsPanel";
import { toast } from "sonner";

export const Route = createFileRoute("/active-loop")({
  head: () => ({ meta: [{ title: "Active Confetti — Confetti" }] }),
  component: ActiveLoopPage,
});

function ActiveLoopPage() {
  const [loop, setLoop] = useState<ActiveLoop | null>(null);
  const [confetti, setConfettiCount] = useState(0);
  const [activeLeg, setActiveLeg] = useState<ActiveLegInfo>(null);
  const [travelMode, setTravelMode] = useState<TravelMode>("DRIVING");
  const { burst, layer } = useConfettiBurst();
  const navigate = useNavigate();

  useEffect(() => {
    const existing = getActiveLoop() || makeDemoLoop();
    setActiveLoop(existing);
    setLoop(existing);
    setConfettiCount(getConfetti());
    const offLoop = subscribeActiveLoop(() => setLoop(getActiveLoop()));
    const offConfetti = subscribeConfetti(() => setConfettiCount(getConfetti()));
    return () => {
      offLoop();
      offConfetti();
    };
  }, []);

  if (!loop)
    return (
      <div className="grid min-h-screen place-items-center text-sm text-muted-foreground">
        Loading…
      </div>
    );

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
    if (confirm("End this plan early?")) {
      navigate({ to: "/passport" });
    }
  }

  return (
    <div className="min-h-screen bg-background pb-32">
      {layer}
      <div className="mx-auto max-w-md px-4 pt-6">
        <div className="flex items-center justify-between">
          <Link
            to="/boarding-pass"
            className="font-mono text-xs font-bold uppercase tracking-widest text-ink/70 hover:text-ink"
          >
            ← Pass
          </Link>
          <span className="rounded-full border-2 border-ink bg-gold px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-widest text-ink">
            {confetti} Confetti
          </span>
        </div>

        {/* Interactive Google Map: numbered markers, polyline route, user pulse, current bounce */}
        <div className="mt-4 relative h-[220px] overflow-hidden rounded-3xl border-2 border-ink shadow-brut bg-cream">
          <LoopMap
            stops={loop.stops}
            currentIdx={currentIdx}
            fallbackCity={loop.stops[0]?.area || "Washington, DC"}
            travelMode={travelMode}
            onActiveLegChange={setActiveLeg}
          />
          <div className="pointer-events-none absolute bottom-2 left-2 rounded-full bg-cream/95 px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-widest text-ink shadow-sm">
            Live route · {loop.stops.length} stops
          </div>

          {/* Travel mode toggle */}
          <div
            role="tablist"
            aria-label="Directions mode"
            className="absolute top-2 right-2 inline-flex rounded-full border-2 border-ink bg-cream p-0.5 shadow-brut"
          >
            {(
              [
                { mode: "WALKING" as const, label: "Walk", Icon: Footprints },
                { mode: "DRIVING" as const, label: "Drive", Icon: Car },
              ]
            ).map(({ mode, label, Icon }) => {
              const active = travelMode === mode;
              return (
                <button
                  key={mode}
                  role="tab"
                  aria-selected={active}
                  onClick={() => setTravelMode(mode)}
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-widest transition-colors ${
                    active ? "bg-coral text-cream" : "text-ink hover:bg-ink/5"
                  }`}
                >
                  <Icon className="h-3 w-3" /> {label}
                </button>
              );
            })}
          </div>
        </div>

        {activeLeg && activeLeg.steps.length > 0 && !completed && (
          <DirectionsPanel
            fromName={loop.stops[activeLeg.fromIdx]?.name || "Start"}
            toName={loop.stops[activeLeg.toIdx]?.name || "Next"}
            steps={activeLeg.steps}
            distanceText={activeLeg.distanceText}
            durationText={activeLeg.durationText}
            travelMode={activeLeg.travelMode}
          />
        )}

        {completed ? (
          <div className="mt-6 rounded-3xl border-2 border-ink bg-coral p-6 text-cream shadow-brut text-center">
            <div className="font-display text-2xl font-extrabold">Plan complete 🎉</div>
            <p className="mt-1 text-sm opacity-90">You earned {confetti} Confetti tonight.</p>
            <Link
              to="/passport"
              className="mt-4 inline-flex items-center gap-1 rounded-full border-2 border-cream bg-cream px-4 py-2 font-mono text-xs font-bold uppercase tracking-widest text-ink"
            >
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
              <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-coral">
                Now
              </span>
              <span className="ml-auto font-mono text-[10px] uppercase tracking-widest text-ink/60">
                {current.time}
              </span>
            </div>
            <div className="mt-3 font-display text-2xl font-extrabold tracking-tight">
              {current.name}
            </div>
            <div className="text-sm text-muted-foreground">
              {current.type}
              {current.area ? ` · ${current.area}` : ""}
            </div>
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
            <div className="font-mono text-[10px] font-bold uppercase tracking-widest text-ink/60">
              Next stop
            </div>
            <div className="mt-1 flex items-baseline justify-between gap-3">
              <div>
                <div className="font-display text-base font-bold">{next.name}</div>
                <div className="text-xs text-muted-foreground flex items-center gap-1">
                  <MapPin className="h-3 w-3" /> {next.area || "Nearby"} · ETA 12 min
                </div>
              </div>
              <span className="font-mono text-xs font-bold text-ink/70">{next.time}</span>
            </div>
          </div>
        )}

        <div className="mt-8 grid gap-2">
          <div className="rounded-2xl border border-border bg-card p-4">
            <div className="font-mono text-[10px] font-bold uppercase tracking-widest text-ink/60 mb-2">
              All stops
            </div>
            <ol className="space-y-2">
              {loop.stops.map((s, i) => (
                <li key={s.id} className="flex items-center gap-2">
                  <span
                    className={`grid h-6 w-6 place-items-center rounded-full border-2 border-ink ${s.done ? "bg-coral text-cream" : i === currentIdx ? "bg-gold" : "bg-cream"}`}
                  >
                    {s.done ? (
                      <Check className="h-3 w-3" strokeWidth={3} />
                    ) : (
                      <span className="font-mono text-[9px] font-bold">{i + 1}</span>
                    )}
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
              <X className="h-3 w-3" /> End plan early
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
