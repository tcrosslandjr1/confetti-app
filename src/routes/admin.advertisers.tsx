import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  listAdminAdvertisers,
  updateCampaignStatus,
  type Advertiser,
  type Campaign,
  PACKAGES,
  PLACEMENT_LABELS,
} from "@/lib/ads";
import { Megaphone, CheckCircle2, XCircle, Pause, Search, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/admin/advertisers")({
  component: AdminAdvertisersPage,
});

function AdminAdvertisersPage() {
  const [advertisers, setAdvertisers] = useState<Advertiser[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected" | "paused">(
    "pending",
  );
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(true);

  const load = async () => {
    setBusy(true);
    const { advertisers, campaigns } = await listAdminAdvertisers();
    setAdvertisers(advertisers);
    setCampaigns(campaigns);
    setBusy(false);
  };

  useEffect(() => {
    void load();
  }, []);

  const advertiserById = useMemo(
    () => Object.fromEntries(advertisers.map((a) => [a.id, a])),
    [advertisers],
  );

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return campaigns.filter((c) => {
      if (filter !== "all" && c.status !== filter) return false;
      if (s) {
        const a = advertiserById[c.advertiser_id];
        const hay = `${c.headline} ${c.blurb ?? ""} ${a?.business_name ?? ""}`.toLowerCase();
        if (!hay.includes(s)) return false;
      }
      return true;
    });
  }, [campaigns, filter, q, advertiserById]);

  async function decide(c: Campaign, status: "approved" | "rejected" | "paused") {
    const note =
      status === "rejected"
        ? (window.prompt("Reason (shown to advertiser)?") ?? undefined)
        : undefined;
    try {
      await updateCampaignStatus(c.id, status, note);
      toast.success(`Campaign ${status}`);
      await load();
    } catch (err) {
      toast.error((err as Error).message);
    }
  }

  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Programs</p>
        <h1 className="font-display text-3xl font-bold leading-tight flex items-center gap-2">
          <Megaphone className="h-7 w-7" /> Advertisers
        </h1>
        <p className="text-sm text-muted-foreground">
          Review submitted campaigns, approve placements, and pause active runs.
        </p>
      </header>

      <div className="grid gap-3 sm:grid-cols-4">
        <KPI label="Advertisers" value={advertisers.length} />
        <KPI
          label="Pending campaigns"
          value={campaigns.filter((c) => c.status === "pending").length}
        />
        <KPI label="Approved" value={campaigns.filter((c) => c.status === "approved").length} />
        <KPI label="Rejected" value={campaigns.filter((c) => c.status === "rejected").length} />
      </div>

      <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-border bg-card p-3 shadow-card">
        <div className="relative flex-1 min-w-[260px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search business or headline…"
            className="pl-9"
          />
        </div>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value as typeof filter)}
          className="rounded-md border border-border bg-background px-3 py-2 text-sm"
        >
          {(["pending", "approved", "rejected", "paused", "all"] as const).map((f) => (
            <option key={f} value={f}>
              {f}
            </option>
          ))}
        </select>
      </div>

      {busy ? (
        <div className="grid place-items-center py-16 text-sm text-muted-foreground">
          <Loader2 className="mr-2 inline h-4 w-4 animate-spin" /> Loading…
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center text-sm text-muted-foreground">
          No campaigns match your filters.
        </div>
      ) : (
        <div className="grid gap-3">
          {filtered.map((c) => {
            const a = advertiserById[c.advertiser_id];
            return (
              <article
                key={c.id}
                className="rounded-2xl border border-border bg-card p-4 shadow-card"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-display text-lg font-bold">{c.headline}</h3>
                      <Badge variant="outline">{c.status}</Badge>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{c.blurb || "—"}</p>
                    <div className="mt-2 flex flex-wrap gap-2 text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
                      <span className="rounded-full bg-muted px-2 py-0.5">
                        {a?.business_name ?? "Unknown advertiser"}
                      </span>
                      <span className="rounded-full bg-muted px-2 py-0.5">
                        {PLACEMENT_LABELS[c.placement]}
                      </span>
                      <span className="rounded-full bg-muted px-2 py-0.5">
                        {PACKAGES[c.package_tier].label}
                      </span>
                      {c.city && (
                        <span className="rounded-full bg-muted px-2 py-0.5">{c.city}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-shrink-0 gap-2">
                    {c.status !== "approved" && (
                      <Button size="sm" onClick={() => decide(c, "approved")}>
                        <CheckCircle2 className="mr-1 h-3.5 w-3.5" /> Approve
                      </Button>
                    )}
                    {c.status === "approved" && (
                      <Button size="sm" variant="outline" onClick={() => decide(c, "paused")}>
                        <Pause className="mr-1 h-3.5 w-3.5" /> Pause
                      </Button>
                    )}
                    {c.status !== "rejected" && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive hover:text-destructive"
                        onClick={() => decide(c, "rejected")}
                      >
                        <XCircle className="mr-1 h-3.5 w-3.5" /> Reject
                      </Button>
                    )}
                  </div>
                </div>
                {c.admin_note && (
                  <p className="mt-2 rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground">
                    Admin note: {c.admin_note}
                  </p>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

function KPI({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-card">
      <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-1 font-display text-2xl font-bold">{value}</p>
    </div>
  );
}
