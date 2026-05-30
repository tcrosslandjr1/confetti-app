import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { CalendarPlus, MapPin, Sparkles } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { useAuth } from "@/lib/auth-context";
import { listItineraries, type Itinerary } from "@/lib/itineraries";
import { PullToRefresh } from "@/components/PullToRefresh";

export const Route = createFileRoute("/trips/")({
  head: () => ({
    meta: [
      { title: "My trips — Confetti" },
      { name: "description", content: "All your saved day plans and reservations in one place." },
    ],
  }),
  component: TripsList,
});

function TripsList() {
  const { user, loading: authLoading, viewAs } = useAuth();
  const nav = useNavigate();
  const [trips, setTrips] = useState<Itinerary[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    return listItineraries()
      .then(setTrips)
      .catch((e) => setErr(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      nav({ to: "/auth" });
      return;
    }
    if (viewAs === "admin") {
      nav({ to: "/business/dashboard" });
      return;
    }
    if (viewAs === "business") {
      nav({ to: "/business/dashboard" });
      return;
    }
    if (viewAs === "visitor") {
      nav({ to: "/" });
      return;
    }
    load();
  }, [user, authLoading, viewAs, nav, load]);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <PullToRefresh onRefresh={load}>
        <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="font-display text-4xl font-bold tracking-tight">My trips</h1>
              <p className="mt-1 text-muted-foreground">Saved day plans, ready when you are.</p>
            </div>
            <Link
              to="/new/plan"
              className="inline-flex h-11 items-center gap-2 rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-pop"
            >
              <CalendarPlus className="h-4 w-4" /> Plan a new day
            </Link>
          </div>

          {err && (
            <p className="rounded-lg bg-destructive/10 px-4 py-2 text-sm text-destructive">{err}</p>
          )}
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : trips.length === 0 ? (
            <div className="rounded-3xl border-2 border-dashed border-border bg-card p-12 text-center">
              <Sparkles className="mx-auto h-10 w-10 text-primary" />
              <h3 className="mt-4 font-display text-xl font-bold">No trips yet</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Build your first one — pick an occasion or describe your perfect day.
              </p>
              <div className="mt-5 flex flex-wrap justify-center gap-3">
                <Link
                  to="/new/plan"
                  className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
                >
                  <CalendarPlus className="h-4 w-4" /> Plan a day
                </Link>
                <Link
                  to="/"
                  className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2 text-sm font-semibold"
                >
                  Browse occasions
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {trips.map((t) => (
                <Link
                  key={t.id}
                  to="/trips/$id"
                  params={{ id: t.id }}
                  className="group rounded-2xl border border-border bg-card p-5 shadow-card transition-pop hover:-translate-y-1 hover:shadow-pop"
                >
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-display text-lg font-bold leading-tight group-hover:text-primary">
                      {t.title}
                    </h3>
                    {t.est_total_cost && (
                      <span className="rounded-full bg-muted px-2 py-1 text-xs font-semibold">
                        {t.est_total_cost}
                      </span>
                    )}
                  </div>
                  {t.summary && (
                    <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{t.summary}</p>
                  )}
                  <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
                    {t.date && (
                      <span>
                        {new Date(t.date).toLocaleDateString(undefined, {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    )}
                    {t.city && (
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="h-3 w-3" /> {t.city}
                      </span>
                    )}
                    <span className="ml-auto opacity-70">
                      {new Date(t.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </PullToRefresh>
    </div>
  );
}
