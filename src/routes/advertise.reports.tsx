import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import {
  BarChart3,
  CalendarCheck,
  Download,
  Eye,
  RefreshCw,
  Sparkles,
  Star,
  TrendingUp,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";

export const Route = createFileRoute("/advertise/reports")({
  head: () => ({
    meta: [
      { title: "Venue Reports — Confetti for Business" },
      {
        name: "description",
        content:
          "Daily and weekly performance reports for your Confetti venues — bookings, views, boost ROI, and trend lines.",
      },
    ],
  }),
  component: AdvertiseReportsPage,
});

type Range = "24h" | "7d" | "30d";

function sinceIso(range: Range) {
  const d = new Date();
  if (range === "24h") d.setHours(d.getHours() - 24);
  else if (range === "7d") d.setDate(d.getDate() - 7);
  else d.setDate(d.getDate() - 30);
  return d.toISOString();
}

function AdvertiseReportsPage() {
  const { user } = useAuth();
  const [range, setRange] = useState<Range>("7d");

  const { data: myVenues } = useQuery({
    enabled: !!user?.id,
    queryKey: ["advertise", "reports", "venues", user?.id],
    queryFn: async () => {
      // venues owned via advertiser
      const { data: advertisers } = await supabase
        .from("advertisers" as any)
        .select("id")
        .eq("owner_id", user!.id);
      const advIds = (advertisers ?? []).map((a: any) => a.id);
      if (advIds.length === 0) return [];
      const { data } = await supabase
        .from("venues" as any)
        .select("id, name, neighborhood, city, boost_until, boost_tier, published")
        .in("advertiser_id", advIds);
      return (data ?? []) as any[];
    },
  });

  const venueIds = useMemo(() => (myVenues ?? []).map((v: any) => v.id), [myVenues]);

  const { data: bookings, isFetching, refetch } = useQuery({
    enabled: venueIds.length > 0,
    queryKey: ["advertise", "reports", "bookings", venueIds.join(","), range],
    queryFn: async () => {
      const { data } = await supabase
        .from("bookings" as any)
        .select("id, venue_id, venue_name, party_size, created_at, starts_at")
        .in("venue_id", venueIds)
        .gte("created_at", sinceIso(range))
        .order("created_at", { ascending: false });
      return (data ?? []) as any[];
    },
  });

  const byVenue = useMemo(() => {
    const map = new Map<string, { name: string; bookings: number; covers: number }>();
    for (const v of myVenues ?? []) {
      map.set(v.id, { name: v.name, bookings: 0, covers: 0 });
    }
    for (const b of bookings ?? []) {
      const row = map.get(b.venue_id);
      if (!row) continue;
      row.bookings += 1;
      row.covers += b.party_size ?? 0;
    }
    return [...map.entries()].map(([id, r]) => ({ id, ...r }));
  }, [myVenues, bookings]);

  const totals = useMemo(() => {
    const totalBookings = (bookings ?? []).length;
    const totalCovers = (bookings ?? []).reduce(
      (s: number, b: any) => s + (b.party_size ?? 0),
      0,
    );
    const boosted = (myVenues ?? []).filter(
      (v: any) => v.boost_until && new Date(v.boost_until) > new Date(),
    ).length;
    return {
      totalBookings,
      totalCovers,
      boosted,
      venues: myVenues?.length ?? 0,
    };
  }, [bookings, myVenues]);

  const exportCsv = () => {
    const rows = [
      ["venue_id", "venue_name", "bookings", "covers"],
      ...byVenue.map((r) => [r.id, r.name, r.bookings, r.covers]),
    ];
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `confetti-venue-report-${range}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Report downloaded");
  };

  if (!user) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <h1 className="font-display text-2xl font-extrabold">Sign in to view reports</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Reports are available to verified business owners.
        </p>
        <Link
          to="/auth"
          className="mt-6 inline-flex items-center gap-2 rounded-full border-2 border-ink bg-coral px-4 py-2 font-mono text-xs font-bold uppercase tracking-widest text-cream shadow-brut"
        >
          Sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <header className="rounded-3xl border-2 border-ink bg-gradient-to-br from-coral via-orange-400 to-gold p-6 shadow-brut">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="min-w-0">
            <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-ink/70">
              Venue reports
            </p>
            <h1 className="mt-1 font-display text-3xl font-extrabold leading-tight text-ink sm:text-4xl">
              Performance brief
            </h1>
            <p className="mt-2 max-w-lg text-sm text-ink/80">
              Bookings, covers, and boost activity across your Confetti venues.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex overflow-hidden rounded-full border-2 border-ink bg-cream shadow-brut">
              {(["24h", "7d", "30d"] as Range[]).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRange(r)}
                  className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition ${
                    range === r ? "bg-ink text-cream" : "text-ink hover:bg-cream/70"
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => refetch()}
              disabled={isFetching}
              className="inline-flex items-center gap-1.5 rounded-full border-2 border-ink bg-cream px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-ink shadow-brut disabled:opacity-60"
            >
              <RefreshCw className={`h-3 w-3 ${isFetching ? "animate-spin" : ""}`} />
              Refresh
            </button>
            <button
              type="button"
              onClick={exportCsv}
              className="inline-flex items-center gap-1.5 rounded-full border-2 border-ink bg-ink px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-cream shadow-brut"
            >
              <Download className="h-3 w-3" /> CSV
            </button>
          </div>
        </div>
      </header>

      <section className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Bookings", value: totals.totalBookings, icon: CalendarCheck, tone: "from-coral/25 to-coral/5" },
          { label: "Covers", value: totals.totalCovers, icon: TrendingUp, tone: "from-emerald-400/25 to-emerald-100/5" },
          { label: "Venues live", value: totals.venues, icon: Star, tone: "from-gold/25 to-gold/5" },
          { label: "Boosted now", value: totals.boosted, icon: Sparkles, tone: "from-purple/25 to-purple/5" },
        ].map((s) => (
          <div
            key={s.label}
            className={`rounded-2xl border-2 border-ink bg-gradient-to-br ${s.tone} p-4 shadow-brut`}
          >
            <s.icon className="h-4 w-4 text-ink" />
            <div className="mt-2 font-display text-3xl font-extrabold tabular-nums text-ink">
              {s.value.toLocaleString()}
            </div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-ink/80">
              {s.label}
            </div>
          </div>
        ))}
      </section>

      <section className="mt-6 rounded-2xl border-2 border-ink bg-cream p-5 shadow-brut">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-lg font-extrabold inline-flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-coral" />
            Per-venue breakdown
          </h2>
          <Link
            to="/advertise/portal"
            className="text-xs font-bold text-coral hover:underline"
          >
            Manage venues →
          </Link>
        </div>
        {byVenue.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No venues yet.{" "}
            <Link to="/advertise" className="font-bold text-coral hover:underline">
              Get started →
            </Link>
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-ink/15 text-left font-mono text-[10px] uppercase tracking-widest text-ink/60">
                  <th className="py-2">Venue</th>
                  <th className="py-2 text-right">Bookings</th>
                  <th className="py-2 text-right">Covers</th>
                  <th className="py-2 text-right">Avg party</th>
                </tr>
              </thead>
              <tbody>
                {byVenue
                  .sort((a, b) => b.bookings - a.bookings)
                  .map((r) => (
                    <tr key={r.id} className="border-b border-ink/10">
                      <td className="py-2 font-semibold">{r.name}</td>
                      <td className="py-2 text-right tabular-nums">{r.bookings}</td>
                      <td className="py-2 text-right tabular-nums">{r.covers}</td>
                      <td className="py-2 text-right tabular-nums">
                        {r.bookings > 0 ? (r.covers / r.bookings).toFixed(1) : "—"}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="mt-6 rounded-2xl border border-dashed border-ink/30 bg-cream/50 p-5">
        <div className="mb-2 inline-flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-widest text-ink/60">
          <Eye className="h-3 w-3 text-coral" /> Tip
        </div>
        <p className="text-sm">
          Run a <span className="font-bold">boost</span> on your top performer to lift conversions
          15–40% over the next 7 days.{" "}
          <Link to="/advertise/portal" className="font-bold text-coral hover:underline">
            Open business portal →
          </Link>
        </p>
      </section>
    </div>
  );
}
