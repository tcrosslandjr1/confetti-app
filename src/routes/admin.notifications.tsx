import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useState } from "react";
import { Bell, Loader2, Mail, RefreshCw, Search, Send } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { resolveVenueNotificationEmail } from "@/lib/booking-notifications.functions";

export const Route = createFileRoute("/admin/notifications")({
  component: AdminNotificationsPage,
});

type Delivery = {
  id: string;
  booking_id: string | null;
  venue_id: string | null;
  venue_name: string | null;
  recipient_email: string | null;
  source: string;
  channel: string;
  status: string;
  error: string | null;
  subject: string | null;
  body: string | null;
  test: boolean;
  created_at: string;
  updated_at: string;
};

const STATUSES = ["all", "pending", "sent", "failed", "skipped"] as const;
const SOURCE_LABEL: Record<string, string> = {
  venue_staff_email: "Venue staff email",
  linked_advertiser: "Linked advertiser",
  ops_fallback: "Ops fallback",
  unresolved: "Unresolved",
};
const STATUS_BADGE: Record<string, string> = {
  pending: "bg-amber-500/15 text-amber-600 border-amber-500/30",
  sent: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30",
  failed: "bg-destructive/15 text-destructive border-destructive/30",
  skipped: "bg-muted text-muted-foreground border-border",
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60_000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

function AdminNotificationsPage() {
  const [rows, setRows] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<(typeof STATUSES)[number]>("all");
  const [preview, setPreview] = useState<Delivery | null>(null);
  const [resendingId, setResendingId] = useState<string | null>(null);
  const resolveEmail = useServerFn(resolveVenueNotificationEmail);

  const onResend = async (r: Delivery) => {
    setResendingId(r.id);
    try {
      const result = r.venue_id ? await resolveEmail({ data: { venueId: r.venue_id } }) : null;
      const recipient = result?.email ?? r.recipient_email ?? null;
      const source = result?.source ?? r.source;

      const insertRow = {
        booking_id: r.booking_id,
        venue_id: r.venue_id,
        venue_name: r.venue_name,
        recipient_email: recipient,
        source,
        channel: r.channel,
        status: recipient ? "sent" : "failed",
        error: recipient ? null : "No recipient resolved on retry",
        subject: r.subject ? `${r.subject} (retry)` : "Booking notification (retry)",
        body: r.body,
        test: r.test,
      };
      const { error: insErr } = await supabase
        .from("booking_notification_deliveries")
        .insert(insertRow);
      if (insErr) throw insErr;

      // Mark the original as resolved so it stops appearing in failed counts.
      const { error: updErr } = await supabase
        .from("booking_notification_deliveries")
        .update({ status: "skipped", error: "Superseded by retry" })
        .eq("id", r.id);
      if (updErr) throw updErr;

      if (recipient) {
        toast.success(`Resent to ${recipient}`, { description: `Via ${source}.` });
      } else {
        toast.error("Retry still failed", { description: "No recipient could be resolved." });
      }
    } catch (e) {
      toast.error("Resend failed", { description: (e as Error).message });
    } finally {
      setResendingId(null);
    }
  };

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("booking_notification_deliveries")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) toast.error("Couldn't load deliveries", { description: error.message });
    else setRows((data as Delivery[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    void load();
    const ch = supabase
      .channel("admin-bnd")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "booking_notification_deliveries" },
        () => void load(),
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(ch);
    };
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((r) => {
      if (status !== "all" && r.status !== status) return false;
      if (!q) return true;
      return (
        (r.venue_name ?? "").toLowerCase().includes(q) ||
        (r.recipient_email ?? "").toLowerCase().includes(q) ||
        (r.subject ?? "").toLowerCase().includes(q) ||
        (r.source ?? "").toLowerCase().includes(q)
      );
    });
  }, [rows, query, status]);

  const counts = useMemo(() => {
    const c = { total: rows.length, pending: 0, sent: 0, failed: 0, skipped: 0 } as Record<
      string,
      number
    >;
    for (const r of rows) c[r.status] = (c[r.status] ?? 0) + 1;
    return c;
  }, [rows]);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
            Notifications
          </p>
          <h1 className="font-display text-3xl font-bold leading-tight flex items-center gap-2">
            <Bell className="h-7 w-7" /> Booking notification log
          </h1>
          <p className="text-sm text-muted-foreground">
            Every booking notification: which address it routed to, the source, status, and a
            preview of the message.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => void load()}>
          <RefreshCw className="mr-1 h-4 w-4" /> Refresh
        </Button>
      </header>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        {[
          { k: "total", label: "Total" },
          { k: "pending", label: "Pending" },
          { k: "sent", label: "Sent" },
          { k: "failed", label: "Failed" },
          { k: "skipped", label: "Skipped" },
        ].map((s) => (
          <div key={s.k} className="rounded-2xl border border-border bg-card p-4 shadow-card">
            <div className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
              {s.label}
            </div>
            <div className="mt-1 font-display text-2xl font-bold">{counts[s.k] ?? 0}</div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="flex flex-wrap gap-1">
          {STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={`rounded-full border px-3 py-1 text-xs capitalize transition ${
                status === s
                  ? "border-foreground bg-foreground text-background"
                  : "border-border bg-card text-muted-foreground hover:text-foreground"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
        <div className="relative ml-auto min-w-[260px] flex-1 sm:flex-none">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by venue, recipient, subject…"
            className="pl-9"
          />
        </div>
      </div>

      {loading ? (
        <div className="grid place-items-center rounded-2xl border border-dashed border-border bg-card/50 p-10 text-sm text-muted-foreground">
          <Loader2 className="mb-2 h-5 w-5 animate-spin" />
          Loading deliveries…
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card/50 p-10 text-center text-sm text-muted-foreground">
          {rows.length === 0 ? "No notifications logged yet." : "No deliveries match your filters."}
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-2 text-left font-medium">When</th>
                <th className="px-4 py-2 text-left font-medium">Venue</th>
                <th className="px-4 py-2 text-left font-medium">Recipient</th>
                <th className="px-4 py-2 text-left font-medium">Source</th>
                <th className="px-4 py-2 text-left font-medium">Status</th>
                <th className="px-4 py-2 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => {
                const canResend = r.status === "failed" || r.status === "pending";
                return (
                  <tr key={r.id} className="border-t border-border/60">
                    <td className="px-4 py-2 align-top text-xs text-muted-foreground">
                      {timeAgo(r.created_at)}
                      {r.test && (
                        <span className="ml-1 rounded bg-muted px-1 py-0.5 font-mono text-[10px] uppercase">
                          test
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2 align-top font-medium">{r.venue_name || "—"}</td>
                    <td className="px-4 py-2 align-top font-mono text-xs">
                      {r.recipient_email || <span className="text-muted-foreground">—</span>}
                    </td>
                    <td className="px-4 py-2 align-top text-xs text-muted-foreground">
                      {SOURCE_LABEL[r.source] ?? r.source}
                    </td>
                    <td className="px-4 py-2 align-top">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] capitalize ${STATUS_BADGE[r.status] ?? "border-border bg-muted text-muted-foreground"}`}
                      >
                        {r.status}
                      </span>
                      {r.error && (
                        <p
                          className="mt-1 max-w-[28ch] truncate text-[11px] text-destructive"
                          title={r.error}
                        >
                          {r.error}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-2 text-right align-top">
                      <div className="flex justify-end gap-1">
                        {canResend && (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={resendingId === r.id}
                            onClick={() => void onResend(r)}
                          >
                            {resendingId === r.id ? (
                              <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Send className="mr-1 h-3.5 w-3.5" />
                            )}
                            Resend
                          </Button>
                        )}
                        <Button size="sm" variant="ghost" onClick={() => setPreview(r)}>
                          <Mail className="mr-1 h-3.5 w-3.5" /> View
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={!!preview} onOpenChange={(o) => !o && setPreview(null)}>
        <DialogContent className="max-w-lg">
          {preview && (
            <>
              <DialogHeader>
                <DialogTitle>{preview.subject || "Booking notification"}</DialogTitle>
                <DialogDescription>
                  To <span className="font-mono">{preview.recipient_email || "(unresolved)"}</span>{" "}
                  · {SOURCE_LABEL[preview.source] ?? preview.source}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-3 text-sm">
                <div className="rounded-md border border-border bg-muted/30 p-3 font-mono text-xs whitespace-pre-wrap">
                  {preview.body || "(no body)"}
                </div>
                <dl className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                  <dt>Venue</dt>
                  <dd className="text-foreground">{preview.venue_name || "—"}</dd>
                  <dt>Channel</dt>
                  <dd className="text-foreground">{preview.channel}</dd>
                  <dt>Status</dt>
                  <dd className="text-foreground capitalize">{preview.status}</dd>
                  <dt>Logged</dt>
                  <dd className="text-foreground">
                    {new Date(preview.created_at).toLocaleString()}
                  </dd>
                </dl>
                {preview.error && (
                  <p className="rounded-md border border-destructive/30 bg-destructive/10 p-2 text-xs text-destructive">
                    {preview.error}
                  </p>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
