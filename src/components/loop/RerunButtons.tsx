import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { Loader2, Sparkles, Clock, DollarSign, Repeat } from "lucide-react";
import { type ActiveLoop } from "@/lib/loop-store";
import { buildAndSaveItinerary, type BuildPayload } from "@/lib/itineraries";

type RerunKind = "swap-stops" | "earlier" | "cheaper";

const TWEAKS: Record<
  RerunKind,
  { label: string; icon: typeof Sparkles; directive: string; minutesShift: number }
> = {
  "swap-stops": {
    label: "Different stops",
    icon: Sparkles,
    directive:
      "Pick entirely different venues than the current ones. Preserve the same vibe, occasion, and time of night. Avoid any venue named in the current plan.",
    minutesShift: 0,
  },
  earlier: {
    label: "Start earlier",
    icon: Clock,
    directive:
      "Shift the night earlier by 90 minutes. Re-time every stop, keep stops where they make sense at the new earlier hour, swap any that don't.",
    minutesShift: -90,
  },
  cheaper: {
    label: "Cheaper",
    icon: DollarSign,
    directive:
      "Trim the per-person spend by ~30% by picking lower-priced venues that fit the same vibe. Keep dressier picks only when they're proven good value.",
    minutesShift: 0,
  },
};

function shiftStartTime(startTime: string | undefined, minutes: number): string | undefined {
  if (!startTime || !/^\d{2}:\d{2}$/.test(startTime)) return startTime;
  if (minutes === 0) return startTime;
  const [h, m] = startTime.split(":").map(Number);
  let total = h * 60 + m + minutes;
  if (total < 0) total = 0;
  if (total >= 24 * 60) total = 24 * 60 - 1;
  const nh = Math.floor(total / 60);
  const nm = total % 60;
  return `${String(nh).padStart(2, "0")}:${String(nm).padStart(2, "0")}`;
}

export function RerunButtons({ loop }: { loop: ActiveLoop }) {
  const navigate = useNavigate();
  const [busy, setBusy] = useState<RerunKind | null>(null);

  async function rerun(kind: RerunKind) {
    if (busy) return;
    setBusy(kind);
    const params = loop.planParams ?? {};
    const tweak = TWEAKS[kind];

    // For "swap stops" — name the current venues so the model truly avoids them.
    const directive =
      kind === "swap-stops"
        ? `${tweak.directive}\nCurrent venues to AVOID: ${loop.stops.map((s) => `"${s.name}"`).join(", ")}.`
        : tweak.directive;

    try {
      const payload: BuildPayload = {
        occasion: params.occasionLabel ?? loop.occasion ?? "Night Out",
        vibe: params.vibeLabel ?? loop.vibe,
        city: params.city ?? loop.city,
        date: params.date ?? loop.date,
        startTime: shiftStartTime(params.startTime, tweak.minutesShift),
        durationHours: params.duration ? parseInt(String(params.duration)) || 3 : 3,
        notes: directive,
        transportMode: "auto",
      };

      const { id } = await buildAndSaveItinerary(payload);
      toast.success(`Replanned: ${tweak.label.toLowerCase()}`);
      navigate({ to: "/trips/$id", params: { id } });
    } catch (err) {
      console.error("[RerunButtons] failed", err);
      toast.error("Couldn't replan — try again");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="mb-3 print:hidden">
      <div className="mb-1.5 flex items-center gap-1.5 font-mono text-[9px] font-bold uppercase tracking-widest text-cream/60">
        <Repeat className="h-3 w-3" />
        Re-run
      </div>
      <div className="grid grid-cols-3 gap-1.5">
        {(Object.keys(TWEAKS) as RerunKind[]).map((k) => {
          const t = TWEAKS[k];
          const Icon = t.icon;
          const active = busy === k;
          return (
            <button
              key={k}
              type="button"
              onClick={() => rerun(k)}
              disabled={busy !== null}
              className="inline-flex items-center justify-center gap-1.5 rounded-2xl border-2 border-ink bg-cream px-2 py-2 text-[11px] font-bold text-cream shadow-brut transition-pop hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {active ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Icon className="h-3.5 w-3.5" />
              )}
              <span className="truncate">{t.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
