import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Stamp, Star, MapPin, Sparkles } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { useAuth } from "@/lib/auth-context";
import {
  completeItinerary,
  getItinerary,
  updateItinerary,
  updateStop,
  type Itinerary,
  type Stop,
} from "@/lib/itineraries";

export const Route = createFileRoute("/trips/$id/passport")({
  component: Passport,
});

function Passport() {
  const { id } = Route.useParams();
  const { user, loading: authLoading } = useAuth();
  const nav = useNavigate();
  const [it, setIt] = useState<Itinerary | null>(null);
  const [stops, setStops] = useState<Stop[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [overall, setOverall] = useState<{ rating: number; review: string }>({
    rating: 0,
    review: "",
  });
  const [saving, setSaving] = useState(false);
  const [savedOk, setSavedOk] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      nav({ to: "/auth" });
      return;
    }
    (async () => {
      try {
        const data = await getItinerary(id);
        if (!data.itinerary.completed_at) await completeItinerary(id);
        setIt(data.itinerary);
        setStops(data.stops);
        setOverall({
          rating: data.itinerary.overall_rating ?? 0,
          review: data.itinerary.overall_review ?? "",
        });
      } catch (e) {
        setErr((e as Error).message);
      } finally {
        setLoading(false);
      }
    })();
  }, [id, user, authLoading, nav]);

  function rateStop(stopId: string, rating: number) {
    setStops((prev) => prev.map((s) => (s.id === stopId ? { ...s, user_rating: rating } : s)));
    updateStop(stopId, { user_rating: rating }).catch((e) => setErr((e as Error).message));
  }

  function reviewStop(stopId: string, review: string) {
    setStops((prev) => prev.map((s) => (s.id === stopId ? { ...s, user_review: review } : s)));
  }

  function saveStopReview(stopId: string, review: string) {
    updateStop(stopId, { user_review: review }).catch((e) => setErr((e as Error).message));
  }

  async function saveOverall() {
    setSaving(true);
    try {
      await updateItinerary(id, { overall_rating: overall.rating, overall_review: overall.review });
      setSavedOk(true);
      setTimeout(() => setSavedOk(false), 2400);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  if (loading)
    return (
      <div className="grid min-h-screen place-items-center text-sm text-muted-foreground">
        Loading passport…
      </div>
    );
  if (err)
    return (
      <div className="grid min-h-screen place-items-center">
        <p className="text-destructive">{err}</p>
      </div>
    );
  if (!it) return null;

  const stamped = new Date(it.completed_at ?? new Date().toISOString());

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
        <Link
          to="/trips/$id"
          params={{ id }}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Back to trip
        </Link>

        {/* Passport header */}
        <article className="mt-5 overflow-hidden rounded-3xl border-2 border-dashed border-primary/40 bg-gradient-to-br from-amber-50 via-background to-rose-50 dark:from-amber-950/20 dark:to-rose-950/20 p-8 shadow-pop">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-primary">
                Loop Passport
              </p>
              <h1 className="mt-2 font-display text-4xl font-bold tracking-tight">{it.title}</h1>
              {it.city && (
                <p className="mt-1 inline-flex items-center gap-1 text-sm text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5" /> {it.city}
                </p>
              )}
            </div>
            <div className="grid h-24 w-24 shrink-0 -rotate-12 place-items-center rounded-full border-4 border-primary/70 text-center">
              <div>
                <Stamp className="mx-auto h-6 w-6 text-primary" />
                <p className="mt-1 text-[10px] font-bold uppercase leading-tight text-primary">
                  Stamped
                  <br />
                  {stamped.toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                </p>
              </div>
            </div>
          </div>
        </article>

        {/* Per-stop reviews */}
        <h2 className="mt-10 font-display text-2xl font-bold">Rate each stop</h2>
        <p className="text-sm text-muted-foreground">
          Your ratings train your algorithm for next time.
        </p>

        <ul className="mt-5 space-y-4">
          {stops.map((s, i) => (
            <li key={s.id} className="rounded-2xl border border-border bg-card p-5 shadow-card">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Stop {i + 1}
                  </p>
                  <h3 className="font-display text-lg font-bold">{s.name}</h3>
                </div>
                <StarPicker
                  value={s.user_rating ?? 0}
                  onChange={(v) => s.id && rateStop(s.id, v)}
                />
              </div>
              <textarea
                value={s.user_review ?? ""}
                onChange={(e) => s.id && reviewStop(s.id, e.target.value)}
                onBlur={(e) => s.id && saveStopReview(s.id, e.target.value)}
                rows={2}
                placeholder="What did you actually think? (optional)"
                className="mt-3 w-full rounded-xl border border-border bg-background p-3 text-sm outline-none focus:border-primary"
              />
            </li>
          ))}
        </ul>

        {/* Overall review */}
        <div className="mt-10 rounded-2xl border border-border bg-card p-6 shadow-card">
          <h2 className="flex items-center gap-2 font-display text-2xl font-bold">
            <Sparkles className="h-5 w-5 text-primary" /> Rate the whole day
          </h2>
          <div className="mt-4 flex items-center gap-3">
            <StarPicker
              value={overall.rating}
              onChange={(v) => setOverall((p) => ({ ...p, rating: v }))}
              size="lg"
            />
            <span className="text-sm text-muted-foreground">
              {overall.rating ? `${overall.rating}/5` : "Tap a star"}
            </span>
          </div>
          <textarea
            value={overall.review}
            onChange={(e) => setOverall((p) => ({ ...p, review: e.target.value }))}
            rows={4}
            placeholder="How did the AI do? Anything we should learn for next time?"
            className="mt-4 w-full rounded-xl border border-border bg-background p-3 text-sm outline-none focus:border-primary"
          />
          <div className="mt-4 flex items-center gap-3">
            <button
              onClick={saveOverall}
              disabled={saving}
              className="rounded-full bg-primary px-5 py-2 text-sm font-bold text-primary-foreground shadow-pop hover:scale-105 transition-pop disabled:opacity-60"
            >
              {saving ? "Saving…" : "Save passport"}
            </button>
            {savedOk && <span className="text-sm text-emerald-600 font-semibold">Saved ✓</span>}
          </div>
        </div>
      </div>
    </div>
  );
}

function StarPicker({
  value,
  onChange,
  size = "md",
}: {
  value: number;
  onChange: (v: number) => void;
  size?: "md" | "lg";
}) {
  const sz = size === "lg" ? "h-7 w-7" : "h-5 w-5";
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} type="button" onClick={() => onChange(n)} aria-label={`${n} star`}>
          <Star
            className={`${sz} ${n <= value ? "fill-amber-400 text-amber-400" : "text-muted-foreground/40"}`}
          />
        </button>
      ))}
    </div>
  );
}
