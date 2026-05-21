import { createLazyFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { MapPin, Check, Navigation, X, Footprints, Car } from "lucide-react";
import { useConfettiBurst } from "@/components/ConfettiBurst";
import { addConfetti, getActiveLoop, getConfetti, makeDemoLoop, setActiveLoop, subscribeActiveLoop, subscribeConfetti, type ActiveLoop } from "@/lib/loop-store";
import { LoopMap, type ActiveLegInfo, type TravelMode } from "@/components/loop/LoopMap";
import { DirectionsPanel } from "@/components/loop/DirectionsPanel";
import { StopSearchBox } from "@/components/loop/StopSearchBox";
import { PlanEditFab } from "@/components/loop/PlanEditFab";
import { ActivityFeed } from "@/components/activity/ActivityFeed";
import { NightModeWarnings } from "@/components/NightModeWarnings";
import { computeNightWarnings, indexWarnings, topSeverity } from "@/lib/night-warnings";
import { logActivity } from "@/lib/activity-log";
import { toast } from "sonner";

export const Route = createLazyFileRoute("/active-loop")({
  component: ActiveLoopPage,
});

function ActiveLoopPage() {
    const [loop, setLoop] = useState<ActiveLoop | null>(null);
    const [confetti, setConfettiCount] = useState(0);
    const [activeLeg, setActiveLeg] = useState<ActiveLegInfo>(null);
    const [travelMode, setTravelMode] = useState<TravelMode>("DRIVING");
    const [focusStopId, setFocusStopId] = useState<string | null>(null);
    const { burst, layer } = useConfettiBurst();
    const navigate = useNavigate();
    const startedRef = useRef(false);
    useEffect(() => {
        const existing = getActiveLoop() || makeDemoLoop();
        setActiveLoop(existing);
        setLoop(existing);
        setConfettiCount(getConfetti());
        if (!startedRef.current) {
            startedRef.current = true;
            logActivity({
                tripId: existing.id,
                tripTitle: `${existing.from} → ${existing.to}`,
                actor: "You",
                kind: "plan_started",
                message: `started the plan with ${existing.stops.length} stops`,
            });
        }
        const offLoop = subscribeActiveLoop(() => setLoop(getActiveLoop()));
        const offConfetti = subscribeConfetti(() => setConfettiCount(getConfetti()));
        return () => {
            offLoop();
            offConfetti();
        };
    }, []);
    if (!loop)
        return (<div className="grid min-h-screen place-items-center text-sm text-muted-foreground">
        Loading…
      </div>);
    const currentIdx = loop.stops.findIndex((s) => !s.done);
    const current = currentIdx >= 0 ? loop.stops[currentIdx] : null;
    const next = currentIdx >= 0 ? loop.stops[currentIdx + 1] : null;
    const completed = currentIdx === -1;
    const warningIndex = indexWarnings(computeNightWarnings(loop.stops));
    function jumpToStop(stopId: string) {
        // Re-trigger by setting null first if same id
        setFocusStopId(null);
        requestAnimationFrame(() => setFocusStopId(stopId));
    }
    function checkIn(e: React.MouseEvent) {
        if (!current || !loop)
            return;
        burst(e.clientX, e.clientY);
        const updated: ActiveLoop = {
            ...loop,
            stops: loop.stops.map((s, i) => (i === currentIdx ? { ...s, done: true } : s)),
        };
        setActiveLoop(updated);
        setLoop(updated);
        const newTotal = addConfetti(50);
        setConfettiCount(newTotal);
        logActivity({
            tripId: loop.id,
            tripTitle: `${loop.from} → ${loop.to}`,
            actor: "You",
            kind: "check_in",
            message: `checked in at ${current.name}`,
            detail: "+50 Confetti",
        });
        const allDone = updated.stops.every((s) => s.done);
        if (allDone) {
            logActivity({
                tripId: loop.id,
                tripTitle: `${loop.from} → ${loop.to}`,
                actor: "You",
                kind: "plan_completed",
                message: `completed the plan`,
                detail: `${newTotal} Confetti earned`,
            });
        }
        toast.success("+50 Confetti", { description: `Checked in at ${current.name}` });
    }
    function endEarly() {
        if (confirm("End this plan early?")) {
            navigate({ to: "/passport" });
        }
    }
    return (<div className="min-h-screen bg-background pb-32">
      {layer}
      <div className="mx-auto max-w-md px-4 pt-6">
        <div className="flex items-center justify-between">
          <Link to="/boarding-pass" className="font-mono text-xs font-bold uppercase tracking-widest text-ink/70 hover:text-ink">
            ← Pass
          </Link>
          <span className="rounded-full border-2 border-ink bg-gold px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-widest text-ink">
            {confetti} Confetti
          </span>
        </div>

        {/* Search + quick edit toolbar */}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <StopSearchBox stops={loop.stops} currentIdx={currentIdx} onJump={jumpToStop} className="min-w-0 flex-1"/>
          <PlanEditFab loop={loop} actor="You"/>
        </div>

        {/* Interactive Google Map: numbered markers, polyline route, user pulse, current bounce */}
        <div className="mt-3 relative h-[220px] overflow-hidden rounded-3xl border-2 border-ink shadow-brut bg-cream">
          <LoopMap stops={loop.stops} currentIdx={currentIdx} fallbackCity={loop.stops[0]?.area || "Washington, DC"} travelMode={travelMode} onActiveLegChange={setActiveLeg} focusStopId={focusStopId}/>
          <div className="pointer-events-none absolute bottom-2 left-2 rounded-full bg-cream/95 px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-widest text-ink shadow-sm">
            Live route · {loop.stops.length} stops
          </div>

          {/* Travel mode toggle */}
          <div role="tablist" aria-label="Directions mode" className="absolute top-2 right-2 inline-flex rounded-full border-2 border-ink bg-cream p-0.5 shadow-brut">
            {[
            { mode: "WALKING" as const, label: "Walk", Icon: Footprints },
            { mode: "DRIVING" as const, label: "Drive", Icon: Car },
        ].map(({ mode, label, Icon }) => {
            const active = travelMode === mode;
            return (<button key={mode} role="tab" aria-selected={active} onClick={() => setTravelMode(mode)} className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-widest transition-colors ${active ? "bg-coral text-cream" : "text-ink hover:bg-ink/5"}`}>
                  <Icon className="h-3 w-3"/> {label}
                </button>);
        })}
          </div>
        </div>

        {activeLeg && activeLeg.steps.length > 0 && !completed && (<DirectionsPanel fromName={loop.stops[activeLeg.fromIdx]?.name || "Start"} toName={loop.stops[activeLeg.toIdx]?.name || "Next"} steps={activeLeg.steps} distanceText={activeLeg.distanceText} durationText={activeLeg.durationText} travelMode={activeLeg.travelMode}/>)}

        {!completed && <NightModeWarnings stops={loop.stops} onJump={jumpToStop}/>}

        {completed ? (<div className="mt-6 rounded-3xl border-2 border-ink bg-coral p-6 text-cream shadow-brut text-center">
            <div className="font-display text-2xl font-extrabold">Plan complete 🎉</div>
            <p className="mt-1 text-sm opacity-90">You earned {confetti} Confetti tonight.</p>
            <Link to="/passport" className="mt-4 inline-flex items-center gap-1 rounded-full border-2 border-cream bg-cream px-4 py-2 font-mono text-xs font-bold uppercase tracking-widest text-ink">
              See your Passport →
            </Link>
          </div>) : current ? (<div className="mt-6 rounded-3xl border-2 border-ink bg-card p-5 shadow-brut">
            <div className="flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-coral opacity-75"/>
                <span className="relative inline-flex h-3 w-3 rounded-full bg-coral"/>
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
            <button onClick={checkIn} className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-ink bg-coral px-4 py-3 font-display text-sm font-bold uppercase tracking-wide text-cream shadow-brut transition-pop active:scale-95">
              <Navigation className="h-4 w-4"/> I'm Here
            </button>
          </div>) : null}

        {next && !completed && (<div className="mt-4 rounded-2xl border-2 border-dashed border-ink/40 bg-card p-4">
            <div className="font-mono text-[10px] font-bold uppercase tracking-widest text-ink/60">
              Next stop
            </div>
            <div className="mt-1 flex items-baseline justify-between gap-3">
              <div>
                <div className="font-display text-base font-bold">{next.name}</div>
                <div className="text-xs text-muted-foreground flex items-center gap-1">
                  <MapPin className="h-3 w-3"/> {next.area || "Nearby"} · ETA 12 min
                </div>
              </div>
              <span className="font-mono text-xs font-bold text-ink/70">{next.time}</span>
            </div>
          </div>)}

        <div className="mt-8 grid gap-2">
          <div className="rounded-2xl border border-border bg-card p-4">
            <div className="mb-3 flex items-baseline justify-between">
              <div className="font-mono text-[10px] font-bold uppercase tracking-widest text-ink/60">
                All stops
              </div>
              <div className="font-mono text-[10px] font-bold uppercase tracking-widest text-ink/40">
                {loop.stops.filter((s) => s.done).length}/{loop.stops.length} done
              </div>
            </div>
            <ol className="relative">
              {/* Vertical rail */}
              <div className="pointer-events-none absolute left-[15px] top-2 bottom-2 w-[2px] rounded-full bg-ink/10" aria-hidden="true" />
              {(() => {
                const total = loop.stops.length;
                const doneCount = loop.stops.filter((s) => s.done).length;
                const pct = total > 1 ? Math.min(100, (doneCount / (total - 1)) * 100) : 0;
                return (
                  <div
                    className="pointer-events-none absolute left-[15px] top-2 w-[2px] rounded-full bg-gradient-to-b from-coral to-gold transition-all duration-700"
                    style={{ height: `calc((100% - 16px) * ${pct / 100})` }}
                    aria-hidden="true"
                  />
                );
              })()}

              {loop.stops.map((s, i) => {
                const sev = topSeverity(warningIndex.get(s.id));
                const isCurrent = i === currentIdx;
                const isLast = i === loop.stops.length - 1;
                const sevPill =
                  sev === "critical"
                    ? "border-destructive text-destructive bg-destructive/5"
                    : sev === "warn"
                      ? "border-coral text-coral bg-coral/5"
                      : sev === "info"
                        ? "border-ink/30 text-ink/60 bg-ink/5"
                        : "";
                return (
                  <li key={s.id} className="relative">
                    <button
                      type="button"
                      onClick={() => jumpToStop(s.id)}
                      className={`group flex w-full items-stretch gap-3 rounded-xl px-1 py-2 text-left transition-all hover:bg-coral/5 ${isCurrent ? "bg-gold/10" : ""}`}
                    >
                      {/* Node */}
                      <div className="relative z-10 flex w-8 shrink-0 justify-center pt-0.5">
                        <span
                          className={`grid h-8 w-8 place-items-center rounded-full border-2 border-ink shadow-[2px_2px_0_0_rgba(26,20,16,0.15)] transition-transform group-hover:-translate-y-0.5 ${
                            s.done
                              ? "bg-coral text-cream"
                              : isCurrent
                                ? "bg-gold text-ink animate-pulse"
                                : "bg-cream text-ink"
                          }`}
                        >
                          {s.done ? (
                            <Check className="h-4 w-4" strokeWidth={3} />
                          ) : (
                            <span className="font-mono text-[10px] font-bold">{i + 1}</span>
                          )}
                        </span>
                      </div>

                      {/* Body */}
                      <div className="flex flex-1 flex-col gap-1 border-b border-dashed border-ink/10 pb-3 last:border-b-0 last:pb-0" style={isLast ? { borderBottom: 0, paddingBottom: 0 } : undefined}>
                        <div className="flex items-baseline justify-between gap-2">
                          <div className="font-display text-sm font-bold leading-tight">
                            {s.name}
                          </div>
                          <span className="font-mono text-[10px] font-bold text-ink/60">
                            {s.time}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                          {s.area && (
                            <span className="inline-flex items-center gap-1">
                              <MapPin className="h-3 w-3" /> {s.area}
                            </span>
                          )}
                          {isCurrent && !s.done && (
                            <span className="rounded-full bg-gold/20 px-1.5 py-px font-mono text-[9px] font-bold uppercase tracking-widest text-ink">
                              You're here
                            </span>
                          )}
                          {sev && !s.done && (
                            <span className={`rounded-full border px-1.5 py-px font-mono text-[9px] font-bold uppercase tracking-widest ${sevPill}`}>
                              At risk
                            </span>
                          )}
                          {s.done && (
                            <span className="rounded-full border border-coral/40 bg-coral/5 px-1.5 py-px font-mono text-[9px] font-bold uppercase tracking-widest text-coral">
                              Checked in
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ol>
          </div>

          <ActivityFeed tripId={loop.id} className="mt-2"/>

          {!completed && (<button onClick={endEarly} className="inline-flex items-center justify-center gap-1 rounded-xl border border-border py-2 text-xs font-semibold text-muted-foreground hover:text-destructive">
              <X className="h-3 w-3"/> End plan early
            </button>)}
        </div>
      </div>
    </div>);
}
