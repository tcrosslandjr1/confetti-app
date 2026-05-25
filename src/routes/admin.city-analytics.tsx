import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, BarChart3, Eye, MousePointerClick, Sparkles, RefreshCw, Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { CITIES } from "@/lib/cities";

export const Route = createFileRoute("/admin/city-analytics")({
  component: AdminCityAnalyticsPage,
});

const ADMIN_PIN = "236166";
const PIN_KEY = "confetti.admin.pinOk";

type RangeKey = "24h" | "7d" | "30d";

const RANGES: { key: RangeKey; label: string; ms: number }[] = [
  { key: "24h", label: "24h", ms: 24 * 60 * 60 * 1000 },
  { key: "7d", label: "7 days", ms: 7 * 24 * 60 * 60 * 1000 },
  { key: "30d", label: "30 days", ms: 30 * 24 * 60 * 60 * 1000 },
];

type EventRow = {
  event_type: string;
  event_name: string;
  path: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
};

type CityStat = {
  city: string;
  slug: string | null;
  pageViews: number;
  planCompleted: number;
  planBooked: number;
  planSaved: number;
  adClicks: number;
  ctaClicks: number;
};

function PinGate({ onUnlock }: { onUnlock: () => void }) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);

  const submit = () => {
    if (pin === ADMIN_PIN) {
      sessionStorage.setItem(PIN_KEY, "1");
      onUnlock();
    } else {
      setError(true);
      setPin("");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-6 rounded-2xl border-2 border-border bg-card p-8 text-center shadow-md">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border-2 border-primary bg-primary/10">
          <Lock className="h-7 w-7 text-primary" />
        </div>
        <h1 className="font-display text-2xl font-black tracking-tight">City Analytics</h1>
        <input
          type="password"
          inputMode="numeric"
          maxLength={6}
          value={pin}
          onChange={(e) => {
            setError(false);
            setPin(e.target.value.replace(/\D/g, ""));
          }}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder="••••••"
          className={`w-full rounded-xl border-2 bg-muted/30 px-4 py-3 text-center font-mono text-2xl tracking-[0.5em] focus:outline-none ${
            error ? "border-destructive" : "border-border focus:border-primary"
          }`}
        />
        <button
          onClick={submit}
          disabled={pin.length < 4}
          className="w-full rounded-xl bg-primary px-4 py-3 font-mono text-sm font-bold uppercase tracking-widest text-primary-foreground disabled:opacity-40"
        >
          Unlock
        </button>
      </div>
    </div>
  );
}

function AdminCityAnalyticsPage() {
  const [unlocked, setUnlocked] = useState(false);
  useEffect(() => {
    setUnlocked(sessionStorage.getItem(PIN_KEY) === "1");
  }, []);
  if (!unlocked) return <PinGate onUnlock={() => setUnlocked(true)} />;
  return <Dashboard />;
}

function Dashboard() {
  const [range, setRange] = useState<RangeKey>("7d");
  const [rows, setRows] = useState<EventRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    const since = new Date(Date.now() - (RANGES.find((r) => r.key === range)?.ms ?? 0)).toISOString();
    const { data, error } = await supabase
      .from("analytics_events")
      .select("event_type,event_name,path,metadata,created_at")
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(10000);
    if (error) {
      setError(error.message);
      setRows([]);
    } else {
      setRows((data ?? []) as EventRow[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range]);

  const stats = useMemo<CityStat[]>(() => {
    const bySlug = new Map<string, CityStat>();
    const ensure = (slug: string | null, name: string): CityStat => {
      const key = slug ?? `__${name}`;
      let s = bySlug.get(key);
      if (!s) {
        s = { city: name, slug, pageViews: 0, planCompleted: 0, planBooked: 0, planSaved: 0, adClicks: 0, ctaClicks: 0 };
        bySlug.set(key, s);
      }
      return s;
    };

    for (const r of rows) {
      const meta = (r.metadata ?? {}) as Record<string, unknown>;
      const metaCity = (meta.city as string) || null;
      const metaSlug = (meta.citySlug as string) || null;

      // City page views from /cities/:slug
      if (r.event_type === "pageview" && r.path.startsWith("/cities/") && r.path !== "/cities") {
        const slug = r.path.replace("/cities/", "").split("/")[0];
        const city = CITIES.find((c) => c.slug === slug);
        if (city) {
          ensure(city.slug, city.name).pageViews += 1;
          continue;
        }
      }

      if (!metaSlug && !metaCity) continue;
      const cityName = metaCity ?? CITIES.find((c) => c.slug === metaSlug)?.name ?? metaSlug ?? "Unknown";
      const s = ensure(metaSlug, cityName);

      if (r.event_name === "plan_completed") s.planCompleted += 1;
      else if (r.event_name === "plan_booked") s.planBooked += 1;
      else if (r.event_name === "plan_saved") s.planSaved += 1;
      else if (r.event_name === "ad_click") s.adClicks += 1;
      else if (r.event_type === "cta_click") s.ctaClicks += 1;
    }

    return Array.from(bySlug.values()).sort((a, b) => {
      const ta = a.pageViews + a.planCompleted + a.adClicks;
      const tb = b.pageViews + b.planCompleted + b.adClicks;
      return tb - ta;
    });
  }, [rows]);

  const totals = useMemo(() => {
    return stats.reduce(
      (acc, s) => ({
        pageViews: acc.pageViews + s.pageViews,
        planCompleted: acc.planCompleted + s.planCompleted,
        planBooked: acc.planBooked + s.planBooked,
        planSaved: acc.planSaved + s.planSaved,
        adClicks: acc.adClicks + s.adClicks,
        ctaClicks: acc.ctaClicks + s.ctaClicks,
      }),
      { pageViews: 0, planCompleted: 0, planBooked: 0, planSaved: 0, adClicks: 0, ctaClicks: 0 },
    );
  }, [stats]);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <Link to="/admin/console" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4" /> Admin
            </Link>
            <span className="text-muted-foreground">/</span>
            <h1 className="flex items-center gap-2 font-display text-xl font-black tracking-tight">
              <BarChart3 className="h-5 w-5 text-primary" /> City Analytics
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex rounded-lg border border-border bg-muted/30 p-1">
              {RANGES.map((r) => (
                <button
                  key={r.key}
                  onClick={() => setRange(r.key)}
                  className={`rounded-md px-3 py-1 font-mono text-xs font-bold uppercase tracking-wider ${
                    range === r.key ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
            <button
              onClick={() => void load()}
              className="rounded-lg border border-border bg-card p-2 hover:bg-muted"
              title="Refresh"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8">
        {error && (
          <div className="mb-6 rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
            {error}
          </div>
        )}

        {/* Totals */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <StatCard icon={<Eye className="h-4 w-4" />} label="City Page Views" value={totals.pageViews} />
          <StatCard icon={<Sparkles className="h-4 w-4" />} label="Plans Completed" value={totals.planCompleted} />
          <StatCard icon={<Sparkles className="h-4 w-4" />} label="Plans Booked" value={totals.planBooked} />
          <StatCard icon={<MousePointerClick className="h-4 w-4" />} label="Ad Clicks" value={totals.adClicks} />
        </div>

        {/* Table */}
        <div className="mt-8 overflow-hidden rounded-xl border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border px-5 py-3">
            <h2 className="font-mono text-xs font-bold uppercase tracking-widest">By City</h2>
            <span className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
              {stats.length} cities tracked
            </span>
          </div>

          {loading ? (
            <div className="p-10 text-center text-muted-foreground">Loading…</div>
          ) : stats.length === 0 ? (
            <div className="p-10 text-center text-muted-foreground">
              No events yet in this range. Try a wider window or wait for traffic.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 text-left font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  <tr>
                    <th className="px-5 py-3">City</th>
                    <th className="px-3 py-3 text-right">Views</th>
                    <th className="px-3 py-3 text-right">Plans</th>
                    <th className="px-3 py-3 text-right">Booked</th>
                    <th className="px-3 py-3 text-right">Saved</th>
                    <th className="px-3 py-3 text-right">Ad Clicks</th>
                    <th className="px-3 py-3 text-right">CTA Clicks</th>
                    <th className="px-5 py-3 text-right">CVR</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.map((s) => {
                    const cvr = s.pageViews > 0 ? ((s.planCompleted / s.pageViews) * 100).toFixed(1) : "—";
                    return (
                      <tr key={s.slug ?? s.city} className="border-t border-border/60 hover:bg-muted/30">
                        <td className="px-5 py-3 font-medium">
                          {s.slug ? (
                            <Link to="/cities/$slug" params={{ slug: s.slug }} className="hover:text-primary hover:underline">
                              {s.city}
                            </Link>
                          ) : (
                            s.city
                          )}
                        </td>
                        <td className="px-3 py-3 text-right font-mono">{s.pageViews}</td>
                        <td className="px-3 py-3 text-right font-mono">{s.planCompleted}</td>
                        <td className="px-3 py-3 text-right font-mono">{s.planBooked}</td>
                        <td className="px-3 py-3 text-right font-mono">{s.planSaved}</td>
                        <td className="px-3 py-3 text-right font-mono">{s.adClicks}</td>
                        <td className="px-3 py-3 text-right font-mono">{s.ctaClicks}</td>
                        <td className="px-5 py-3 text-right font-mono text-primary">
                          {cvr === "—" ? cvr : `${cvr}%`}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <p className="mt-6 text-xs text-muted-foreground">
          City Page Views: hits on <code>/cities/[slug]</code>. Plans/Ad Clicks: events tagged with the
          user's selected city. CVR = plans completed ÷ city page views.
        </p>
      </main>
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
        {icon} {label}
      </div>
      <div className="mt-2 font-display text-3xl font-black tracking-tight">{value.toLocaleString()}</div>
    </div>
  );
}
