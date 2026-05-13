import { Flame, Bookmark, CalendarCheck, Sparkles, Star, MapPin, Users, Info, ThumbsUp, ThumbsDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { trackPickEvent } from "@/lib/pick-analytics";

export type PickSignalKind =
  | "trending"
  | "most-saved"
  | "most-booked"
  | "highly-rated"
  | "near-you"
  | "matches-vibe"
  | "crowd-favorite"
  | "fresh";

export type PickSignal = {
  kind: PickSignalKind;
  label: string;
};

const SIGNAL_META: Record<
  PickSignalKind,
  { Icon: typeof Flame; tone: string }
> = {
  trending: { Icon: Flame, tone: "bg-rose-500/10 text-rose-600 border-rose-500/30" },
  "most-saved": { Icon: Bookmark, tone: "bg-amber-500/10 text-amber-700 border-amber-500/30" },
  "most-booked": { Icon: CalendarCheck, tone: "bg-emerald-500/10 text-emerald-700 border-emerald-500/30" },
  "highly-rated": { Icon: Star, tone: "bg-yellow-500/10 text-yellow-700 border-yellow-500/30" },
  "near-you": { Icon: MapPin, tone: "bg-sky-500/10 text-sky-700 border-sky-500/30" },
  "matches-vibe": { Icon: Sparkles, tone: "bg-purple/15 text-purple border-purple/30" },
  "crowd-favorite": { Icon: Users, tone: "bg-coral/15 text-coral border-coral/30" },
  fresh: { Icon: Sparkles, tone: "bg-teal-500/10 text-teal-700 border-teal-500/30" },
};

type Props = {
  signals: PickSignal[];
  /** Optional one-line plain-English explanation. */
  rationale?: string;
  className?: string;
  compact?: boolean;
  /** Stable id (e.g. venue id or stop id) used to persist feedback. */
  pickId?: string;
  /** Optional context attached to the feedback signal (e.g. "viral-now"). */
  context?: string;
};

const FEEDBACK_KEY = "confetti.pickFeedback.v1";

type FeedbackVote = "up" | "down";

function readFeedback(): Record<string, FeedbackVote> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(FEEDBACK_KEY) || "{}");
  } catch {
    return {};
  }
}

function writeFeedback(map: Record<string, FeedbackVote>) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(FEEDBACK_KEY, JSON.stringify(map));
  } catch {
    /* ignore quota */
  }
}

export function WhyThisPick({ signals, rationale, className = "", compact = false, pickId, context }: Props) {
  const trimmed = signals.filter(Boolean).slice(0, 3);
  const signalKinds = trimmed.map((s) => s.kind);
  const [vote, setVote] = useState<FeedbackVote | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const impressionFired = useRef(false);

  useEffect(() => {
    if (!pickId) return;
    setVote(readFeedback()[pickId] ?? null);
  }, [pickId]);

  // Impression tracking: fire once when the card scrolls into view.
  useEffect(() => {
    if (!pickId || trimmed.length === 0) return;
    const node = rootRef.current;
    if (!node || typeof IntersectionObserver === "undefined") return;
    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting && !impressionFired.current) {
            impressionFired.current = true;
            trackPickEvent("pick_impression", { pickId, context, signals: signalKinds });
            obs.disconnect();
            break;
          }
        }
      },
      { threshold: 0.5 },
    );
    obs.observe(node);
    return () => obs.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pickId]);

  // Click tracking: listen on the closest interactive ancestor (link/button/article).
  useEffect(() => {
    if (!pickId || trimmed.length === 0) return;
    const node = rootRef.current;
    if (!node) return;
    const target = (node.closest("a, button, article, [data-pick-trackable]") as HTMLElement | null) ?? node.parentElement;
    if (!target) return;
    const onClick = (ev: Event) => {
      // Ignore clicks that originated from the feedback buttons themselves.
      const path = ev.composedPath?.() ?? [];
      if (path.some((n) => n instanceof HTMLElement && n.dataset?.pickFeedback === "1")) return;
      trackPickEvent("pick_click", { pickId, context, signals: signalKinds });
    };
    target.addEventListener("click", onClick);
    return () => target.removeEventListener("click", onClick);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pickId]);

  if (trimmed.length === 0 && !rationale) return null;

  const submitVote = (next: FeedbackVote) => {
    if (!pickId) return;
    const current = readFeedback();
    if (current[pickId] === next) {
      delete current[pickId];
      setVote(null);
    } else {
      current[pickId] = next;
      setVote(next);
      toast.success(next === "up" ? "Thanks — we'll show more like this." : "Got it — we'll tune this down.");
      trackPickEvent(next === "up" ? "pick_feedback_up" : "pick_feedback_down", {
        pickId,
        context,
        signals: signalKinds,
      });
    }
    writeFeedback(current);
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("confetti:pick-feedback", {
          detail: { pickId, vote: current[pickId] ?? null, context, signals: signalKinds },
        }),
      );
    }
  };

  return (
    <div
      ref={rootRef}
      className={`rounded-xl border border-dashed border-ink/20 bg-background/60 px-2.5 py-2 ${className}`}
      aria-label="Why this pick"
    >
      <div className="flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-widest text-ink/60">
        <Info className="h-3 w-3" /> Why this pick
      </div>
      {trimmed.length > 0 && (
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {trimmed.map((s, i) => {
            const meta = SIGNAL_META[s.kind];
            const Icon = meta.Icon;
            return (
              <span
                key={`${s.kind}-${i}`}
                className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${meta.tone}`}
              >
                <Icon className="h-2.5 w-2.5" /> {s.label}
              </span>
            );
          })}
        </div>
      )}
      {rationale && !compact && (
        <p className="mt-1.5 text-[11px] leading-snug text-muted-foreground">{rationale}</p>
      )}
      {pickId && (
        <div className="mt-1.5 flex items-center justify-between gap-2 border-t border-ink/10 pt-1.5">
          <span className="text-[10px] text-muted-foreground">Was this helpful?</span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              data-pick-feedback="1"
              onClick={(e) => { e.stopPropagation(); e.preventDefault(); submitVote("up"); }}
              aria-label="Helpful pick"
              aria-pressed={vote === "up"}
              className={`inline-flex h-6 w-6 items-center justify-center rounded-full border transition ${
                vote === "up"
                  ? "border-emerald-500/50 bg-emerald-500/15 text-emerald-700"
                  : "border-ink/15 text-ink/60 hover:border-ink/30 hover:text-ink"
              }`}
            >
              <ThumbsUp className="h-3 w-3" />
            </button>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); e.preventDefault(); submitVote("down"); }}
              aria-label="Not helpful"
              aria-pressed={vote === "down"}
              className={`inline-flex h-6 w-6 items-center justify-center rounded-full border transition ${
                vote === "down"
                  ? "border-rose-500/50 bg-rose-500/15 text-rose-700"
                  : "border-ink/15 text-ink/60 hover:border-ink/30 hover:text-ink"
              }`}
            >
              <ThumbsDown className="h-3 w-3" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/** Heuristic helper: turn raw signals into PickSignal objects + one-line rationale. */
export function derivePickSignals(input: {
  trendScore?: number | null;
  rating?: number | null;
  reviewCount?: number | null;
  saveCount?: number | null;
  bookingCount?: number | null;
  distanceKm?: number | null;
  vibeMatch?: string | null;
}): { signals: PickSignal[]; rationale: string } {
  const signals: PickSignal[] = [];
  const reasons: string[] = [];

  if (typeof input.trendScore === "number" && input.trendScore >= 0.6) {
    signals.push({ kind: "trending", label: "Trending now" });
    reasons.push("trending across the city this week");
  }
  if (typeof input.bookingCount === "number" && input.bookingCount >= 25) {
    signals.push({ kind: "most-booked", label: `${input.bookingCount}+ booked` });
    reasons.push("one of the most-booked spots on Confetti");
  }
  if (typeof input.saveCount === "number" && input.saveCount >= 25) {
    signals.push({ kind: "most-saved", label: `Saved ${input.saveCount}×` });
    reasons.push("saved by lots of locals");
  }
  if (typeof input.rating === "number" && input.rating >= 4.4) {
    const rc = input.reviewCount ? ` · ${formatCount(input.reviewCount)} reviews` : "";
    signals.push({ kind: "highly-rated", label: `${input.rating.toFixed(1)}★${rc}` });
    reasons.push("rated highly by recent guests");
  }
  if (typeof input.distanceKm === "number" && input.distanceKm <= 3) {
    signals.push({
      kind: "near-you",
      label: input.distanceKm < 1
        ? `${Math.round(input.distanceKm * 1000)} m away`
        : `${input.distanceKm.toFixed(1)} km away`,
    });
    reasons.push("close to where you are right now");
  }
  if (input.vibeMatch) {
    signals.push({ kind: "matches-vibe", label: `Matches ${input.vibeMatch}` });
    reasons.push(`matches your ${input.vibeMatch.toLowerCase()} vibe`);
  }

  const rationale = reasons.length
    ? `Picked because it's ${reasons.slice(0, 2).join(" and ")}.`
    : "";
  return { signals: signals.slice(0, 3), rationale };
}

function formatCount(n: number) {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}
