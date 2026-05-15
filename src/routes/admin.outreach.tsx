import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { Calendar, Download, Loader2, RefreshCcw, Mail, MapPin, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  getOutreachRanking,
  getOutreachCsv,
  getLatestOutreachSnapshot,
  type LatestOutreachSnapshot,
  type OutreachVenue,
} from "@/lib/outreach-ranking.functions";

export const Route = createFileRoute("/admin/outreach")({
  head: () => ({
    meta: [
      { title: "Weekly Outreach — Admin" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminOutreachPage,
});

function AdminOutreachPage() {
  const fetchRanking = useServerFn(getOutreachRanking);
  const fetchCsv = useServerFn(getOutreachCsv);
  const fetchSnapshot = useServerFn(getLatestOutreachSnapshot);

  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [venues, setVenues] = useState<OutreachVenue[]>([]);
  const [generatedAt, setGeneratedAt] = useState<string | null>(null);
  const [snapshot, setSnapshot] = useState<LatestOutreachSnapshot>(null);

  const loadSnapshot = async () => {
    try {
      const snap = await fetchSnapshot({ data: undefined });
      setSnapshot(snap);
    } catch {
      // non-fatal
    }
  };


  const load = async (d = days) => {
    setLoading(true);
    try {
      const res = await fetchRanking({ data: { days: d, limit: 100 } });
      setVenues(res.venues);
      setGeneratedAt(res.generatedAt);
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to load outreach ranking");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(days);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onDownload = async () => {
    setDownloading(true);
    try {
      const { filename, csv } = await fetchCsv({ data: { days, limit: 500 } });
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success(`Exported ${filename}`);
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to export CSV");
    } finally {
      setDownloading(false);
    }
  };

  const top = venues.slice(0, 10);
  const rest = venues.slice(10);

  return (
    <div className="p-6 space-y-6 max-w-6xl">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            Weekly outreach
          </h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
            Top organic (unclaimed) venues ranked by recent itinerary appearances,
            bookings and saves. Use the CSV with your outreach tool — keep cold
            sends off the transactional sender domain.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select
            value={String(days)}
            onValueChange={(v) => {
              const d = Number(v);
              setDays(d);
              load(d);
            }}
          >
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={() => load()} disabled={loading}>
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCcw className="h-4 w-4" />
            )}
          </Button>
          <Button onClick={onDownload} disabled={downloading || venues.length === 0}>
            {downloading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Download className="h-4 w-4 mr-2" />
            )}
            Download CSV
          </Button>
        </div>
      </header>

      {generatedAt && (
        <div className="text-xs text-muted-foreground">
          Generated {new Date(generatedAt).toLocaleString()} · {venues.length} venues ·{" "}
          window {days}d
        </div>
      )}

      {loading && venues.length === 0 ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : venues.length === 0 ? (
        <div className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">
          No organic venues with activity in the last {days} days.
        </div>
      ) : (
        <>
          <section>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">
              Top 10 to pitch this week
            </h2>
            <div className="grid gap-3 md:grid-cols-2">
              {top.map((v, i) => (
                <article
                  key={v.venue_id}
                  className="rounded-lg border bg-card p-4 flex flex-col gap-2"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-primary">#{i + 1}</span>
                        <h3 className="font-semibold">{v.name}</h3>
                      </div>
                      <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                        <MapPin className="h-3 w-3" />
                        {[v.neighborhood, v.city].filter(Boolean).join(" · ") || "—"}
                        <span className="mx-1">·</span>
                        <span className="capitalize">{v.category}</span>
                      </div>
                    </div>
                    <Badge variant="secondary" className="font-mono">
                      {v.score}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs">
                    <Badge variant="outline">{v.itinerary_appearances} itinerary</Badge>
                    <Badge variant="outline">{v.bookings_count} bookings</Badge>
                    <Badge variant="outline">{v.saves_count} saves</Badge>
                  </div>
                  {v.staff_email ? (
                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                      <Mail className="h-3 w-3" /> {v.staff_email}
                    </div>
                  ) : (
                    <div className="text-xs text-muted-foreground italic">
                      No contact email — enrich before sending
                    </div>
                  )}
                </article>
              ))}
            </div>
          </section>

          {rest.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">
                Next {rest.length}
              </h2>
              <div className="rounded-lg border overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
                    <tr>
                      <th className="px-3 py-2 text-left">#</th>
                      <th className="px-3 py-2 text-left">Venue</th>
                      <th className="px-3 py-2 text-left">City</th>
                      <th className="px-3 py-2 text-right">Score</th>
                      <th className="px-3 py-2 text-right">Itin.</th>
                      <th className="px-3 py-2 text-right">Bookings</th>
                      <th className="px-3 py-2 text-right">Saves</th>
                      <th className="px-3 py-2 text-left">Email</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rest.map((v, i) => (
                      <tr key={v.venue_id} className="border-t">
                        <td className="px-3 py-2 text-muted-foreground">{i + 11}</td>
                        <td className="px-3 py-2 font-medium">{v.name}</td>
                        <td className="px-3 py-2 text-muted-foreground">{v.city ?? "—"}</td>
                        <td className="px-3 py-2 text-right font-mono">{v.score}</td>
                        <td className="px-3 py-2 text-right">{v.itinerary_appearances}</td>
                        <td className="px-3 py-2 text-right">{v.bookings_count}</td>
                        <td className="px-3 py-2 text-right">{v.saves_count}</td>
                        <td className="px-3 py-2 text-xs text-muted-foreground">
                          {v.staff_email ?? "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
