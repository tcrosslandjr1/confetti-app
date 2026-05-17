import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ThumbsUp, ThumbsDown, Loader2, Check } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { getRecap, REASONS_DOWN, REASONS_UP, type RecapItinerary } from "@/lib/recap";
import { saveItineraryRecap, recordPickSignal } from "@/lib/pick-signals.functions";

export const Route = createFileRoute("/recap/$itineraryId")({
  head: () => ({ meta: [{ title: "Last night's recap — Confetti" }] }),
  component: RecapPage,
});

type Sentiment = "up" | "down" | null;

type StopState = {
  sentiment: Sentiment;
  reasons: string[]; // 0-3
};

function RecapPage() {
  const { itineraryId } = Route.useParams();
  const navigate = useNavigate();
  const save = useServerFn(saveItineraryRecap);
  const signal = useServerFn(recordPickSignal);

  const [data, setData] = useState<RecapItinerary | null>(null);
  const [loading, setLoading] = useState(true);
  const [stopState, setStopState] = useState<Record<string, StopState>>({});
  const [overall, setOverall] = useState<Sentiment>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let alive = true;
    getRecap(itineraryId)
      .then((r) => {
        if (!alive) return;
        setData(r);
        if (r) {
          const init: Record<string, StopState> = {};
          for (const s of r.stops) init[s.id] = { sentiment: null, reasons: [] };
          setStopState(init);
        }
      })
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [itineraryId]);

  const ratedCount = useMemo(
    () => Object.values(stopState).filter((s) => s.sentiment).length,
    [stopState],
  );

  function setSentiment(stopId: string, s: Sentiment) {
    setStopState((prev) => ({
      ...prev,
      [stopId]: {
        sentiment: s,
        reasons: prev[stopId]?.sentiment === s ? prev[stopId].reasons : [],
      },
    }));
  }

  function toggleReason(stopId: string, reason: string) {
    setStopState((prev) => {
      const cur = prev[stopId] ?? { sentiment: null, reasons: [] };
      const has = cur.reasons.includes(reason);
      const reasons = has
        ? cur.reasons.filter((r) => r !== reason)
        : cur.reasons.length >= 3
          ? cur.reasons
          : [...cur.reasons, reason];
      return { ...prev, [stopId]: { ...cur, reasons } };
    });
  }

  async function submit() {
    if (!data) return;
    setSubmitting(true);
    try {
      const stops = data.stops
        .map((s) => {
          const st = stopState[s.id];
          if (!st?.sentiment) return null;
          return {
            stopId: s.id,
            rating: st.sentiment === "up" ? 5 : 1,
            review: st.reasons.length ? st.reasons.join(", ") : undefined,
          };
        })
        .filter(Boolean) as Array<{ stopId: string; rating: number; review?: string }>;

      await save({
        data: {
          itineraryId: data.id,
          overallRating: overall === "up" ? 5 : overall === "down" ? 1 : undefined,
          stops,
        },
      });

      // Fire one taste signal per reason so the personalization model learns.
      const sigs = data.stops.flatMap((s) => {
        const st = stopState[s.id];
        if (!st?.sentiment) return [];
        return st.reasons.map((reason) =>
          signal({
            data: {
              kind: "recap_note" as const,
              value: reason,
              context: {
                stopId: s.id,
                stopName: s.name,
                category: s.category ?? undefined,
                sentiment: st.sentiment,
                itineraryId: data.id,
              },
            },
          }).catch(() => null),
        );
      });
      await Promise.all(sigs);

      toast.success("Thanks — your taste profile just got smarter ✨");
      navigate({ to: "/passport" });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't save recap");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center text-sm text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }
  if (!data) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <h1 className="font-display text-xl font-extrabold">No recap available</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          We couldn't find that night. Maybe it's already been rated.
        </p>
        <Link
          to="/passport"
          className="mt-6 inline-flex items-center rounded-full border-2 border-ink bg-cream px-4 py-2 font-mono text-xs font-bold uppercase tracking-widest text-ink"
        >
          Back to Passport
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-32">
      <div className="mx-auto max-w-md px-4 pt-8">
        <div className="font-mono text-[10px] font-bold uppercase tracking-widest text-coral">
          Morning recap
        </div>
        <h1 className="mt-2 font-display text-3xl font-extrabold leading-tight tracking-tight">
          How was last night?
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {data.title}
          {data.city ? ` · ${data.city}` : ""}
        </p>

        {/* Overall */}
        <section className="mt-6 rounded-3xl border-2 border-ink bg-card p-5 shadow-brut">
          <div className="font-mono text-[10px] font-bold uppercase tracking-widest text-ink/60">
            Overall
          </div>
          <div className="mt-3 flex gap-2">
            <SentimentButton
              active={overall === "up"}
              kind="up"
              onClick={() => setOverall(overall === "up" ? null : "up")}
              label="Loved it"
            />
            <SentimentButton
              active={overall === "down"}
              kind="down"
              onClick={() => setOverall(overall === "down" ? null : "down")}
              label="Skip next time"
            />
          </div>
        </section>

        {/* Per-stop */}
        <section className="mt-4 space-y-3">
          {data.stops.map((s, i) => {
            const st = stopState[s.id] ?? { sentiment: null, reasons: [] };
            const reasons = st.sentiment === "up" ? REASONS_UP : REASONS_DOWN;
            return (
              <div key={s.id} className="rounded-2xl border-2 border-ink bg-card p-4 shadow-brut">
                <div className="flex items-center gap-2">
                  <span className="grid h-6 w-6 place-items-center rounded-full border-2 border-ink bg-cream font-mono text-[9px] font-bold">
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-display text-base font-bold">{s.name}</div>
                    {s.category && (
                      <div className="text-xs text-muted-foreground">{s.category}</div>
                    )}
                  </div>
                  {st.sentiment && (
                    <span className="rounded-full border border-ink/30 bg-cream px-1.5 py-px font-mono text-[9px] font-bold uppercase tracking-widest text-ink/60">
                      <Check className="inline h-2.5 w-2.5" /> rated
                    </span>
                  )}
                </div>

                <div className="mt-3 flex gap-2">
                  <SentimentButton
                    active={st.sentiment === "up"}
                    kind="up"
                    onClick={() => setSentiment(s.id, st.sentiment === "up" ? null : "up")}
                  />
                  <SentimentButton
                    active={st.sentiment === "down"}
                    kind="down"
                    onClick={() => setSentiment(s.id, st.sentiment === "down" ? null : "down")}
                  />
                </div>

                {st.sentiment && (
                  <div className="mt-3">
                    <div className="font-mono text-[9px] font-bold uppercase tracking-widest text-ink/50">
                      Why? (pick up to 3)
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {reasons.map((r) => {
                        const picked = st.reasons.includes(r);
                        const disabled = !picked && st.reasons.length >= 3;
                        return (
                          <button
                            key={r}
                            type="button"
                            disabled={disabled}
                            onClick={() => toggleReason(s.id, r)}
                            className={`rounded-full border-2 px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-widest transition-colors ${
                              picked
                                ? st.sentiment === "up"
                                  ? "border-ink bg-coral text-cream"
                                  : "border-ink bg-ink text-cream"
                                : disabled
                                  ? "border-ink/20 bg-cream text-ink/30"
                                  : "border-ink bg-cream text-ink hover:bg-coral/10"
                            }`}
                          >
                            {r}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </section>

        <div className="mt-6 flex items-center gap-3">
          <button
            onClick={submit}
            disabled={submitting || (ratedCount === 0 && !overall)}
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-2xl border-2 border-ink bg-coral px-4 py-3 font-display text-sm font-bold uppercase tracking-wide text-cream shadow-brut transition-pop active:scale-95 disabled:opacity-50"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Save recap ({ratedCount}/{data.stops.length})
          </button>
        </div>
        <p className="mt-3 text-center text-[11px] text-muted-foreground">
          Your reasons train Confetti's picks — what you skip stops being suggested.
        </p>
      </div>
    </div>
  );
}

function SentimentButton({
  active,
  kind,
  onClick,
  label,
}: {
  active: boolean;
  kind: "up" | "down";
  onClick: () => void;
  label?: string;
}) {
  const Icon = kind === "up" ? ThumbsUp : ThumbsDown;
  const activeCls =
    kind === "up" ? "border-ink bg-coral text-cream" : "border-ink bg-ink text-cream";
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex flex-1 items-center justify-center gap-2 rounded-xl border-2 px-3 py-2 font-mono text-[11px] font-bold uppercase tracking-widest transition-colors ${
        active ? activeCls : "border-ink bg-cream text-ink hover:bg-coral/10"
      }`}
    >
      <Icon className="h-4 w-4" />
      {label ?? (kind === "up" ? "Up" : "Down")}
    </button>
  );
}
