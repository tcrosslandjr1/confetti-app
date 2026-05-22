import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Sparkles, Loader2, Wand2 } from "lucide-react";
import { toast } from "sonner";
import { getActiveLoop, type ActiveLoop } from "@/lib/loop-store";
import { buildAndSaveItinerary, type BuildPayload } from "@/lib/itineraries";

const TWEAKS: { id: string; label: string; emoji: string; directive: string }[] = [
  {
    id: "hype",
    label: "More hype",
    emoji: "🔥",
    directive: "Crank up the energy — louder, busier, more dance-floor and rooftop scenes.",
  },
  {
    id: "chill",
    label: "More chill",
    emoji: "🌙",
    directive: "Quieter and slower — cozy bars, low-lit lounges, conversation-friendly.",
  },
  {
    id: "cheaper",
    label: "Cheaper",
    emoji: "💸",
    directive: "Drop the price tier — happy hours, neighborhood spots, no cover venues.",
  },
  {
    id: "romantic",
    label: "More romantic",
    emoji: "💞",
    directive: "Lean into intimacy — candlelit, scenic views, slow-paced.",
  },
  {
    id: "closer",
    label: "Keep it closer",
    emoji: "🧭",
    directive: "Cluster all stops within ~8 minutes of each other; minimize travel.",
  },
  {
    id: "insta",
    label: "More Instagram-y",
    emoji: "📸",
    directive: "Optimize for visual moments — viewpoints, neon, plated bites, bold interiors.",
  },
  {
    id: "group",
    label: "Group friendly",
    emoji: "🫶",
    directive: "Bias toward group seating, big tables, shareable plates, group-friendly logistics.",
  },
];

/**
 * Live Rerouting Agent UI — re-runs the multi-agent pipeline against the
 * current loop's saved planParams + a steering directive, then swaps the
 * active loop in place.
 */
export function ChangeMyNight() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

  async function applyTweak(tweakId: string, directive: string) {
    const loop = getActiveLoop();
    if (!loop) {
      toast.error("No active plan to reroute.");
      return;
    }
    setBusy(tweakId);
    try {
      const params = loop.planParams ?? {};
      const payload: BuildPayload = {
        occasion: params.occasionLabel ?? loop.occasion ?? "Night Out",
        vibe: params.vibeLabel ?? loop.vibe,
        city: params.city ?? loop.city,
        date: params.date ?? loop.date,
        startTime: params.startTime,
        durationHours: params.duration ? parseInt(String(params.duration)) || 3 : 3,
        notes: directive,
        transportMode: "auto",
      };

      const { id } = await buildAndSaveItinerary(payload);
      toast.success("Rerouted your night!");
      setOpen(false);
      navigate({ to: "/trips/$id", params: { id } });
    } catch (err) {
      console.error("[ChangeMyNight] reroute failed", err);
      toast.error("Couldn't reroute the night. Try again.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="mt-6">
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-ink/40 bg-cream px-4 py-3 font-display text-sm font-bold text-ink transition-pop hover:-translate-y-0.5 hover:border-ink"
        >
          <Wand2 className="h-4 w-4" /> Change my night
        </button>
      ) : (
        <div className="rounded-2xl border-2 border-ink bg-card p-4 shadow-brut">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-widest text-ink/70">
              <Sparkles className="h-3 w-3 text-coral" /> Live Reroute Agent
            </div>
            <button
              onClick={() => setOpen(false)}
              className="font-mono text-[10px] uppercase tracking-widest text-ink/50 hover:text-ink"
              disabled={busy !== null}
            >
              Close
            </button>
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground">
            Tap a vibe shift — we'll rerun the agents and rebuild your boarding pass.
          </p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {TWEAKS.map((t) => {
              const loading = busy === t.id;
              return (
                <button
                  key={t.id}
                  disabled={busy !== null}
                  onClick={() => applyTweak(t.id, t.directive)}
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl border-2 border-ink/15 bg-background px-3 py-2.5 text-xs font-bold transition-pop hover:-translate-y-0.5 hover:border-ink disabled:opacity-40"
                >
                  {loading ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <span>{t.emoji}</span>
                  )}
                  <span>{t.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
