import { useEffect, useState } from "react";
import { CornerUpLeft, CornerUpRight, ArrowUp, MapPin, Flag, Footprints, Car } from "lucide-react";
import type { DirectionsStepLite, TravelMode } from "@/components/maps/ConfettiMap";

function maneuverIcon(maneuver?: string) {
  if (!maneuver) return ArrowUp;
  if (maneuver.includes("left")) return CornerUpLeft;
  if (maneuver.includes("right")) return CornerUpRight;
  return ArrowUp;
}

export function DirectionsPanel({
  fromName,
  toName,
  steps,
  distanceText,
  durationText,
  travelMode,
}: {
  fromName: string;
  toName: string;
  steps: DirectionsStepLite[];
  distanceText?: string;
  durationText?: string;
  travelMode?: TravelMode;
}) {
  // Active step index — advance manually as user travels. Reset whenever the leg or mode changes.
  const [activeStep, setActiveStep] = useState(0);
  useEffect(() => {
    setActiveStep(0);
  }, [steps, travelMode]);

  if (!steps.length) return null;
  const advance = () => setActiveStep((i) => Math.min(i + 1, steps.length - 1));
  const back = () => setActiveStep((i) => Math.max(i - 1, 0));
  const atEnd = activeStep >= steps.length - 1;
  const ModeIcon = travelMode === "WALKING" ? Footprints : Car;
  const modeLabel = travelMode === "WALKING" ? "Walking" : "Driving";

  return (
    <div className="mt-4 rounded-3xl border-2 border-ink bg-card shadow-brut overflow-hidden">
      <div className="flex items-center justify-between gap-2 bg-coral/10 px-4 py-3 border-b-2 border-ink">
        <div className="min-w-0">
          <div className="font-mono text-[10px] font-bold uppercase tracking-widest text-coral inline-flex items-center gap-1">
            <ModeIcon className="h-3 w-3" /> {modeLabel} · Active leg
          </div>
          <div className="font-display text-sm font-extrabold tracking-tight truncate">
            {fromName} → {toName}
          </div>
        </div>
        {(distanceText || durationText) && (
          <div className="text-right shrink-0">
            <div className="font-mono text-[10px] uppercase tracking-widest text-ink/60">
              {durationText}
            </div>
            <div className="font-display text-sm font-extrabold">{distanceText}</div>
          </div>
        )}
      </div>

      <ol className="divide-y divide-ink/10 max-h-[260px] overflow-y-auto">
        {steps.map((step, i) => {
          const Icon = i === steps.length - 1 ? Flag : maneuverIcon(step.maneuver);
          const isActive = i === activeStep;
          const isPast = i < activeStep;
          return (
            <li
              key={i}
              className={`flex items-start gap-3 px-4 py-3 transition-colors ${
                isActive
                  ? "bg-coral/15"
                  : isPast
                  ? "bg-ink/[0.03] opacity-60"
                  : "bg-transparent"
              }`}
            >
              <span
                className={`grid h-8 w-8 shrink-0 place-items-center rounded-full border-2 ${
                  isActive
                    ? "border-coral bg-coral text-cream shadow-brut"
                    : isPast
                    ? "border-ink/30 bg-cream text-ink/40 line-through"
                    : "border-ink/30 bg-cream text-ink"
                }`}
              >
                <Icon className="h-4 w-4" strokeWidth={isActive ? 3 : 2} />
              </span>
              <div className="min-w-0 flex-1">
                <div
                  className={`text-sm leading-snug ${isActive ? "font-bold text-ink" : isPast ? "text-ink/50" : "text-ink/80"}`}
                  // Google returns sanitized HTML with <b>, <div class="...">; safe to render.
                  dangerouslySetInnerHTML={{ __html: step.instructionHtml }}
                />
                {(step.distanceText || step.durationText) && (
                  <div className="mt-0.5 font-mono text-[10px] uppercase tracking-widest text-ink/50">
                    {step.distanceText}
                    {step.distanceText && step.durationText ? " · " : ""}
                    {step.durationText}
                  </div>
                )}
              </div>
              {isActive && (
                <span className="flex h-2 w-2 shrink-0 mt-2">
                  <span className="absolute inline-flex h-2 w-2 animate-ping rounded-full bg-coral opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-coral" />
                </span>
              )}
            </li>
          );
        })}
      </ol>

      <div className="flex items-center justify-between gap-2 border-t-2 border-ink/10 bg-cream px-4 py-2.5">
        <button
          onClick={back}
          disabled={activeStep === 0}
          className="inline-flex items-center gap-1 rounded-lg border border-ink/30 bg-cream px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-widest text-ink hover:bg-ink/5 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          ← Prev
        </button>
        <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-ink/60">
          <MapPin className="inline h-3 w-3 mb-0.5" /> Step {activeStep + 1} of {steps.length}
        </span>
        <button
          onClick={advance}
          disabled={atEnd}
          className="inline-flex items-center gap-1 rounded-lg border-2 border-ink bg-coral px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-widest text-cream shadow-brut transition-pop hover:-translate-y-0.5 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0"
        >
          Next →
        </button>
      </div>
    </div>
  );
}
