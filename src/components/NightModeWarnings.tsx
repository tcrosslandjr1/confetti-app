import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Clock, Flame, Info, Users } from "lucide-react";
import type { LoopStop } from "@/lib/loop-store";
import {
  computeNightWarnings,
  type StopWarning,
  type WarningSeverity,
} from "@/lib/night-warnings";

type Props = {
  stops: LoopStop[];
  onJump?: (stopId: string) => void;
};

const TONE: Record<WarningSeverity, string> = {
  critical: "border-destructive bg-destructive/10 text-destructive",
  warn: "border-coral bg-coral/10 text-coral",
  info: "border-ink/30 bg-cream text-ink/80",
};

function iconFor(tag: string) {
  if (tag.includes("kitchen")) return Flame;
  if (tag.includes("wait") || tag.includes("peak")) return Users;
  if (tag.includes("late") || tag.includes("call")) return Clock;
  if (tag.includes("closed")) return AlertTriangle;
  return Info;
}

export function NightModeWarnings({ stops, onJump }: Props) {
  // Recompute every minute so "running late" / time deltas stay live.
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => setTick((n) => n + 1), 60_000);
    return () => window.clearInterval(id);
  }, []);

  const warnings = useMemo(
    () => computeNightWarnings(stops, new Date()),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [stops, tick],
  );

  if (warnings.length === 0) return null;

  // Map stopId -> name for the inline pill
  const nameById = new Map(stops.map((s) => [s.id, s.name]));

  return (
    <section
      aria-label="Live night mode warnings"
      className="mt-4 rounded-3xl border-2 border-ink bg-card p-4 shadow-brut"
    >
      <div className="flex items-center gap-2">
        <span className="relative flex h-2.5 w-2.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-coral opacity-70" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-coral" />
        </span>
        <h2 className="font-mono text-[10px] font-bold uppercase tracking-widest text-coral">
          Night mode · live
        </h2>
        <span className="ml-auto font-mono text-[10px] uppercase tracking-widest text-ink/50">
          {warnings.length} alert{warnings.length === 1 ? "" : "s"}
        </span>
      </div>

      <ul className="mt-3 space-y-2">
        {warnings.map((w, i) => {
          const Icon = iconFor(w.tag);
          return (
            <li key={`${w.stopId}-${i}`}>
              <button
                type="button"
                onClick={() => onJump?.(w.stopId)}
                className={`flex w-full items-start gap-2 rounded-xl border-2 px-3 py-2 text-left transition-colors hover:bg-coral/5 ${TONE[w.severity]}`}
              >
                <Icon className="mt-0.5 h-4 w-4 shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate font-display text-sm font-bold text-ink">
                      {nameById.get(w.stopId) || "Stop"}
                    </span>
                    <span className="rounded-full border border-current px-1.5 py-px font-mono text-[9px] font-bold uppercase tracking-widest">
                      {w.tag}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-ink/80">{w.message}</p>
                </div>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export type { StopWarning };
