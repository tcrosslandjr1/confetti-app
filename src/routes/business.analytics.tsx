import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Eye,
  MousePointerClick,
  CalendarPlus,
  ShoppingBag,
  Users,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Minus,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import {
  useManagedVenues,
  VenueSwitcher,
  NoVenueClaim,
} from "@/components/business/useManagedVenue";
import { getVenueAnalytics } from "@/lib/business-api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export const Route = createFileRoute("/business/analytics")({
  beforeLoad: async () => {
    const { requireBusinessAccess } = await import("@/lib/business-guards");
    await requireBusinessAccess();
  },
  component: BusinessAnalyticsPage,
  head: () => ({
    meta: [
      { title: "Analytics — Confetti for Business" },
      { name: "description", content: "Detailed venue performance analytics." },
    ],
  }),
});

const RANGE_OPTIONS = [
  { label: "7 days", days: 7 },
  { label: "14 days", days: 14 },
  { label: "30 days", days: 30 },
  { label: "90 days", days: 90 },
];

function BusinessAnalyticsPage() {
  useAuth();
  const { venues, activeId, setActiveId, isLoading: venuesLoading } = useManagedVenues();
  const [days, setDays] = useState(30);

  const { data, isLoading } = useQuery({
    queryKey: ["venue-analytics-full", activeId, days],
    queryFn: () => getVenueAnalytics({ venueId: activeId!, days }),
    enabled: !!activeId,
  });

  const totals = data?.totals;
  const daily: any[] = data?.daily ?? [];

  if (venuesLoading) return <PageShell>Loading venues...</PageShell>;
  if (!venues.length)
    return (
      <PageShell>
        <NoVenueClaim />
      </PageShell>
    );

  const kpis = [
    {
      icon: Eye,
      label: "Profile Views",
      value: totals?.profile_views ?? 0,
      color: "text-blue-500",
    },
    {
      icon: MousePointerClick,
      label: "Clicks",
      value: totals?.clicks ?? 0,
      color: "text-purple-500",
    },
    {
      icon: CalendarPlus,
      label: "Bookings",
      value: totals?.bookings_count ?? 0,
      color: "text-emerald-500",
    },
    {
      icon: ShoppingBag,
      label: "Pre-Orders",
      value: totals?.pre_orders_count ?? 0,
      color: "text-amber-500",
    },
    {
      icon: Users,
      label: "Unique Visitors",
      value: totals?.unique_visitors ?? 0,
      color: "text-cyan-500",
    },
    {
      icon: DollarSign,
      label: "Revenue",
      value: `$${((totals?.revenue_cents ?? 0) / 100).toLocaleString()}`,
      color: "text-green-600",
      raw: totals?.revenue_cents ?? 0,
    },
  ];

  return (
    <PageShell>
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link to="/business/dashboard" className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-2xl font-bold">Analytics</h1>
          <VenueSwitcher venues={venues} activeId={activeId} onChange={setActiveId} />
        </div>
        <div className="flex gap-1 rounded-lg border p-1">
          {RANGE_OPTIONS.map((opt) => (
            <button
              key={opt.days}
              onClick={() => setDays(opt.days)}
              className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                days === opt.days
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <p className="mt-8 text-center text-sm text-muted-foreground">Loading analytics...</p>
      ) : (
        <>
          {/* KPI Grid */}
          <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
            {kpis.map((k, i) => (
              <motion.div
                key={k.label}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
              >
                <Card className="p-4">
                  <div className={`rounded-lg bg-background p-2 inline-block ${k.color}`}>
                    <k.icon className="h-4 w-4" />
                  </div>
                  <div className="mt-2 text-2xl font-bold">
                    {typeof k.value === "number" ? k.value.toLocaleString() : k.value}
                  </div>
                  <div className="text-xs text-muted-foreground">{k.label}</div>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Charts */}
          <div className="mt-8 grid gap-6 md:grid-cols-2">
            <BarChart
              label="Profile Views"
              data={daily}
              field="profile_views"
              color="bg-blue-500/70"
            />
            <BarChart label="Clicks" data={daily} field="clicks" color="bg-purple-500/70" />
            <BarChart
              label="Bookings"
              data={daily}
              field="bookings_count"
              color="bg-emerald-500/70"
            />
            <BarChart
              label="Revenue ($)"
              data={daily}
              field="revenue_cents"
              color="bg-green-500/70"
              isCents
            />
          </div>

          {/* Daily Table */}
          {daily.length > 0 && (
            <Card className="mt-8 overflow-hidden">
              <div className="p-4">
                <h3 className="font-semibold">Daily Breakdown</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b bg-muted/50 text-xs text-muted-foreground">
                    <tr>
                      <th className="px-4 py-2">Date</th>
                      <th className="px-4 py-2 text-right">Views</th>
                      <th className="px-4 py-2 text-right">Clicks</th>
                      <th className="px-4 py-2 text-right">Bookings</th>
                      <th className="px-4 py-2 text-right">Visitors</th>
                      <th className="px-4 py-2 text-right">Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...daily].reverse().map((row) => (
                      <tr key={row.date} className="border-b last:border-0">
                        <td className="px-4 py-2 font-medium">{row.date}</td>
                        <td className="px-4 py-2 text-right">{row.profile_views ?? 0}</td>
                        <td className="px-4 py-2 text-right">{row.clicks ?? 0}</td>
                        <td className="px-4 py-2 text-right">{row.bookings_count ?? 0}</td>
                        <td className="px-4 py-2 text-right">{row.unique_visitors ?? 0}</td>
                        <td className="px-4 py-2 text-right">
                          ${((row.revenue_cents ?? 0) / 100).toFixed(0)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </>
      )}
    </PageShell>
  );
}

function BarChart({
  label,
  data,
  field,
  color,
  isCents,
}: {
  label: string;
  data: any[];
  field: string;
  color: string;
  isCents?: boolean;
}) {
  const values = data.map((r) => {
    const v = r[field] ?? 0;
    return isCents ? v / 100 : v;
  });
  const max = Math.max(...values, 1);
  const total = values.reduce((s, v) => s + v, 0);

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium">{label}</div>
        <div className="text-lg font-bold">
          {isCents
            ? `$${total.toLocaleString(undefined, { maximumFractionDigits: 0 })}`
            : total.toLocaleString()}
        </div>
      </div>
      <div className="mt-4 flex h-28 items-end gap-[2px]">
        {values.length > 0 ? (
          values.map((v, i) => (
            <div
              key={i}
              className={`flex-1 rounded-t-sm ${color} transition-all`}
              style={{ height: `${Math.max((v / max) * 100, 2)}%` }}
              title={`${data[i]?.date}: ${isCents ? `$${v.toFixed(0)}` : v}`}
            />
          ))
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
            No data
          </div>
        )}
      </div>
      {values.length > 0 && (
        <div className="mt-2 flex justify-between text-[10px] text-muted-foreground">
          <span>{data[0]?.date}</span>
          <span>{data[data.length - 1]?.date}</span>
        </div>
      )}
    </Card>
  );
}

function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <div className="mx-auto max-w-6xl space-y-6 px-4 py-10 md:px-6">{children}</div>
    </div>
  );
}
