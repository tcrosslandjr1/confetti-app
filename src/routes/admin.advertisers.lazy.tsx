import { createLazyFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { bucketEventsByDay, estimateMrrCents, formatCents, getCampaignStats, linkVenueToAdvertiser, listAdminAdvertisers, listAdminVenues, listRecentAdEvents, setCampaignTier, setVenueFeatured, setVenueVerified, updateAdvertiser, updateAdvertiserStatus, adminDecideAdvertiser, updateCampaign, updateCampaignStatus, deleteCampaign, listAdminClaims, reviewVenueClaim, type AdEventRow, type AdminVenue, type Advertiser, type Campaign, type VenueClaim, PACKAGES, PACKAGE_PRICE_CENTS, PLACEMENT_LABELS, type PackageTier } from "@/lib/ads";
import { BadgeCheck, CheckCircle2, Eye, Gem, Link as LinkIcon, Loader2, Megaphone, MousePointerClick, Pause, Pencil, Search, Star, Trash2, TrendingUp, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Area, AreaChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export const Route = createLazyFileRoute("/admin/advertisers")({
  component: AdminAdvertisersPage,
});

function AdminAdvertisersPage() {
    const [advertisers, setAdvertisers] = useState<Advertiser[]>([]);
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [venues, setVenues] = useState<AdminVenue[]>([]);
    const [events, setEvents] = useState<AdEventRow[]>([]);
    const [stats, setStats] = useState<Record<string, {
        impressions: number;
        clicks: number;
    }>>({});
    const [claims, setClaims] = useState<VenueClaim[]>([]);
    const [busy, setBusy] = useState(true);
    const [tab, setTab] = useState("overview");
    const load = async () => {
        setBusy(true);
        const [{ advertisers, campaigns }, vs, evs, cls] = await Promise.all([
            listAdminAdvertisers(),
            listAdminVenues(),
            listRecentAdEvents(30),
            listAdminClaims(),
        ]);
        setAdvertisers(advertisers);
        setCampaigns(campaigns);
        setVenues(vs);
        setEvents(evs);
        setClaims(cls);
        if (campaigns.length)
            setStats(await getCampaignStats(campaigns.map((c) => c.id)));
        setBusy(false);
    };
    useEffect(() => {
        void load();
    }, []);
    const advertiserById = useMemo(() => Object.fromEntries(advertisers.map((a) => [a.id, a])), [advertisers]);
    const totals = useMemo(() => {
        const impressions = events.filter((e) => e.kind === "impression").length;
        const clicks = events.filter((e) => e.kind === "click").length;
        const ctr = impressions ? (clicks / impressions) * 100 : 0;
        return { impressions, clicks, ctr };
    }, [events]);
    const mrrCents = useMemo(() => estimateMrrCents(campaigns), [campaigns]);
    const series = useMemo(() => bucketEventsByDay(events, 30), [events]);
    return (<div className="space-y-6">
      <header>
        <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Programs</p>
        <h1 className="font-display text-3xl font-bold leading-tight flex items-center gap-2">
          <Megaphone className="h-7 w-7"/> Business operations
        </h1>
        <p className="text-sm text-muted-foreground">
          Approve campaigns, manage advertisers, verify business profiles, and watch revenue.
        </p>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <KPI label="Advertisers" value={advertisers.length} icon={Megaphone}/>
        <KPI label="Approved campaigns" value={campaigns.filter((c) => c.status === "approved").length} icon={CheckCircle2}/>
        <KPI label="Pending" value={campaigns.filter((c) => c.status === "pending").length} icon={Pause} accent="amber"/>
        <KPI label="30d impressions" value={totals.impressions.toLocaleString()} icon={Eye}/>
        <KPI label="Est. MRR" value={formatCents(mrrCents)} icon={Gem} accent="emerald"/>
      </div>

      {busy ? (<div className="grid place-items-center py-16 text-sm text-muted-foreground">
          <Loader2 className="mr-2 inline h-4 w-4 animate-spin"/> Loading…
        </div>) : (<Tabs value={tab} onValueChange={setTab}>
          <TabsList className="flex flex-wrap">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="campaigns">
              Campaigns
              {campaigns.filter((c) => c.status === "pending").length > 0 && (<Badge variant="secondary" className="ml-2">
                  {campaigns.filter((c) => c.status === "pending").length}
                </Badge>)}
            </TabsTrigger>
            <TabsTrigger value="advertisers">
              Advertisers
              {advertisers.filter((a) => a.status === "pending_review" || a.status === "pending")
                .length > 0 && (<Badge variant="secondary" className="ml-2">
                  {advertisers.filter((a) => a.status === "pending_review" || a.status === "pending").length}
                </Badge>)}
            </TabsTrigger>
            <TabsTrigger value="venues">Verified profiles</TabsTrigger>
            <TabsTrigger value="claims">
              Claims
              {claims.filter((c) => c.status === "pending").length > 0 && (<Badge variant="secondary" className="ml-2">
                  {claims.filter((c) => c.status === "pending").length}
                </Badge>)}
            </TabsTrigger>
            <TabsTrigger value="billing">Billing</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4 pt-4">
            <OverviewTab series={series} totals={totals} campaigns={campaigns}/>
          </TabsContent>
          <TabsContent value="campaigns" className="pt-4">
            <CampaignsTab campaigns={campaigns} advertiserById={advertiserById} venues={venues} stats={stats} onChange={load}/>
          </TabsContent>
          <TabsContent value="advertisers" className="pt-4">
            <AdvertisersTab advertisers={advertisers} campaigns={campaigns} onChange={load}/>
          </TabsContent>
          <TabsContent value="venues" className="pt-4">
            <VenuesTab venues={venues} advertisers={advertisers} onChange={load}/>
          </TabsContent>
          <TabsContent value="billing" className="pt-4">
            <BillingTab campaigns={campaigns} advertiserById={advertiserById} mrrCents={mrrCents}/>
          </TabsContent>
          <TabsContent value="claims" className="pt-4">
            <ClaimsTab claims={claims} advertiserById={advertiserById} venues={venues} onChange={load}/>
          </TabsContent>
        </Tabs>)}
    </div>);
}

/* ------------------------------- Overview ------------------------------- */
function OverviewTab({ series, totals, campaigns, }: {
    series: ReturnType<typeof bucketEventsByDay>;
    totals: {
        impressions: number;
        clicks: number;
        ctr: number;
    };
    campaigns: Campaign[];
}) {
    const placementCounts = useMemo(() => {
        const map: Record<string, number> = {};
        for (const c of campaigns.filter((c) => c.status === "approved")) {
            map[c.placement] = (map[c.placement] ?? 0) + 1;
        }
        return map;
    }, [campaigns]);
    return (<div className="grid gap-4 lg:grid-cols-3">
      <article className="lg:col-span-2 rounded-2xl border border-border bg-card p-5 shadow-card">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
              Last 30 days
            </p>
            <h3 className="font-display text-lg font-bold">Impressions vs clicks</h3>
          </div>
          <div className="text-right text-sm">
            <div className="text-muted-foreground">CTR</div>
            <div className="font-display text-2xl font-bold">{totals.ctr.toFixed(2)}%</div>
          </div>
        </div>
        <div className="mt-4 h-64 w-full">
          <ResponsiveContainer>
            <AreaChart data={series} margin={{ left: -10, right: 8, top: 8, bottom: 0 }}>
              <defs>
                <linearGradient id="i" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.4}/>
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="c" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--destructive))" stopOpacity={0.35}/>
                  <stop offset="100%" stopColor="hsl(var(--destructive))" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))"/>
              <XAxis dataKey="date" tickFormatter={(v) => v.slice(5)} fontSize={11}/>
              <YAxis allowDecimals={false} fontSize={11} width={32}/>
              <Tooltip />
              <Legend />
              <Area type="monotone" dataKey="impressions" stroke="hsl(var(--primary))" fill="url(#i)" strokeWidth={2}/>
              <Area type="monotone" dataKey="clicks" stroke="hsl(var(--destructive))" fill="url(#c)" strokeWidth={2}/>
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </article>

      <article className="rounded-2xl border border-border bg-card p-5 shadow-card">
        <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
          Active placements
        </p>
        <h3 className="font-display text-lg font-bold">Where ads are running</h3>
        <ul className="mt-3 space-y-2">
          {Object.entries(PLACEMENT_LABELS).map(([key, label]) => {
            const n = placementCounts[key] ?? 0;
            return (<li key={key} className="flex items-center justify-between rounded-xl bg-muted/40 px-3 py-2">
                <span className="text-sm">{label}</span>
                <span className="font-display text-lg font-bold">{n}</span>
              </li>);
        })}
        </ul>
        <div className="mt-4 rounded-xl border border-dashed border-border p-3 text-xs text-muted-foreground">
          <TrendingUp className="mr-1 inline h-3 w-3"/> Approve more pending campaigns to grow
          inventory.
        </div>
      </article>
    </div>);
}

/* ------------------------------ Campaigns ------------------------------ */
function CampaignsTab({ campaigns, advertiserById, venues, stats, onChange, }: {
    campaigns: Campaign[];
    advertiserById: Record<string, Advertiser>;
    venues: AdminVenue[];
    stats: Record<string, {
        impressions: number;
        clicks: number;
    }>;
    onChange: () => Promise<void>;
}) {
    const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected" | "paused">("pending");
    const [q, setQ] = useState("");
    const [editing, setEditing] = useState<Campaign | null>(null);
    const filtered = useMemo(() => {
        const s = q.trim().toLowerCase();
        return campaigns.filter((c) => {
            if (filter !== "all" && c.status !== filter)
                return false;
            if (s) {
                const a = advertiserById[c.advertiser_id];
                const hay = `${c.headline} ${c.blurb ?? ""} ${a?.business_name ?? ""}`.toLowerCase();
                if (!hay.includes(s))
                    return false;
            }
            return true;
        });
    }, [campaigns, filter, q, advertiserById]);
    async function decide(c: Campaign, status: "approved" | "rejected" | "paused") {
        const note = status === "rejected"
            ? (window.prompt("Reason (shown to advertiser)?") ?? undefined)
            : undefined;
        try {
            await updateCampaignStatus(c.id, status, note);
            toast.success(`Campaign ${status}`);
            await onChange();
        }
        catch (err) {
            toast.error((err as Error).message);
        }
    }
    async function remove(c: Campaign) {
        if (!window.confirm(`Delete campaign "${c.headline}"? This cannot be undone.`))
            return;
        try {
            await deleteCampaign(c.id);
            toast.success("Campaign deleted");
            await onChange();
        }
        catch (err) {
            toast.error((err as Error).message);
        }
    }
    return (<>
      <div className="mb-3 flex flex-wrap items-center gap-2 rounded-2xl border border-border bg-card p-3 shadow-card">
        <div className="relative min-w-[260px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"/>
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search business or headline…" className="pl-9"/>
        </div>
        <Select value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(["pending", "approved", "rejected", "paused", "all"] as const).map((f) => (<SelectItem key={f} value={f}>
                {f}
              </SelectItem>))}
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (<EmptyState message="No campaigns match your filters."/>) : (<div className="grid gap-3">
          {filtered.map((c) => {
                const a = advertiserById[c.advertiser_id];
                const s = stats[c.id] ?? { impressions: 0, clicks: 0 };
                const ctr = s.impressions ? ((s.clicks / s.impressions) * 100).toFixed(1) : "0.0";
                return (<article key={c.id} className="rounded-2xl border border-border bg-card p-4 shadow-card">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-display text-lg font-bold">{c.headline}</h3>
                      <StatusBadge status={c.status}/>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{c.blurb || "—"}</p>
                    <div className="mt-2 flex flex-wrap gap-2 text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
                      <Chip>{a?.business_name ?? "Unknown"}</Chip>
                      <Chip>{PLACEMENT_LABELS[c.placement]}</Chip>
                      <Chip>{PACKAGES[c.package_tier].label}</Chip>
                      {c.city && <Chip>{c.city}</Chip>}
                    </div>
                  </div>
                  <div className="text-right text-xs text-muted-foreground">
                    <div className="flex items-center justify-end gap-1">
                      <Eye className="h-3 w-3"/> {s.impressions.toLocaleString()}
                    </div>
                    <div className="mt-1 flex items-center justify-end gap-1">
                      <MousePointerClick className="h-3 w-3"/> {s.clicks.toLocaleString()}
                    </div>
                    <div className="mt-1">CTR {ctr}%</div>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  {c.status !== "approved" && (<Button size="sm" onClick={() => decide(c, "approved")}>
                      <CheckCircle2 className="mr-1 h-3.5 w-3.5"/> Approve
                    </Button>)}
                  {c.status === "approved" && (<Button size="sm" variant="outline" onClick={() => decide(c, "paused")}>
                      <Pause className="mr-1 h-3.5 w-3.5"/> Pause
                    </Button>)}
                  {c.status !== "rejected" && (<Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => decide(c, "rejected")}>
                      <XCircle className="mr-1 h-3.5 w-3.5"/> Reject
                    </Button>)}
                  <Button size="sm" variant="outline" onClick={() => setEditing(c)}>
                    <Pencil className="mr-1 h-3.5 w-3.5"/> Edit
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => remove(c)}>
                    <Trash2 className="mr-1 h-3.5 w-3.5"/> Delete
                  </Button>
                </div>

                {c.admin_note && (<p className="mt-2 rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground">
                    Admin note: {c.admin_note}
                  </p>)}
              </article>);
            })}
        </div>)}

      {editing && (<CampaignEditDialog campaign={editing} venues={venues} onClose={() => setEditing(null)} onSaved={async () => {
                setEditing(null);
                await onChange();
            }}/>)}
    </>);
}

function CampaignEditDialog({ campaign, venues, onClose, onSaved, }: {
    campaign: Campaign;
    venues: AdminVenue[];
    onClose: () => void;
    onSaved: () => Promise<void>;
}) {
    const [headline, setHeadline] = useState(campaign.headline);
    const [blurb, setBlurb] = useState(campaign.blurb ?? "");
    const [city, setCity] = useState(campaign.city ?? "");
    const [tier, setTier] = useState<PackageTier>(campaign.package_tier);
    const [venueId, setVenueId] = useState<string>(campaign.venue_id ?? "");
    const [ctaUrl, setCtaUrl] = useState(campaign.cta_url ?? "");
    const [ctaLabel, setCtaLabel] = useState(campaign.cta_label ?? "");
    const [busy, setBusy] = useState(false);
    async function save() {
        setBusy(true);
        try {
            await updateCampaign(campaign.id, {
                headline,
                blurb: blurb || null,
                city: city || null,
                package_tier: tier,
                venue_id: venueId || null,
                cta_url: ctaUrl || null,
                cta_label: ctaLabel || null,
            });
            toast.success("Campaign updated");
            await onSaved();
        }
        catch (err) {
            toast.error((err as Error).message);
        }
        finally {
            setBusy(false);
        }
    }
    return (<Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit campaign</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3">
          <Field label="Headline">
            <Input value={headline} onChange={(e) => setHeadline(e.target.value)}/>
          </Field>
          <Field label="Blurb">
            <textarea value={blurb} onChange={(e) => setBlurb(e.target.value)} rows={2} className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"/>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="City">
              <Input value={city} onChange={(e) => setCity(e.target.value)}/>
            </Field>
            <Field label="Package">
              <Select value={tier} onValueChange={(v) => setTier(v as PackageTier)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(PACKAGES).map(([k, v]) => (<SelectItem key={k} value={k}>
                      {v.label} — {v.price}
                    </SelectItem>))}
                </SelectContent>
              </Select>
            </Field>
          </div>
          <Field label="Linked venue">
            <Select value={venueId || "__none"} onValueChange={(v) => setVenueId(v === "__none" ? "" : v)}>
              <SelectTrigger>
                <SelectValue placeholder="None"/>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none">— None —</SelectItem>
                {venues.map((v) => (<SelectItem key={v.id} value={v.id}>
                    {v.name} {v.city ? `· ${v.city}` : ""}
                  </SelectItem>))}
              </SelectContent>
            </Select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="CTA URL">
              <Input value={ctaUrl} onChange={(e) => setCtaUrl(e.target.value)} placeholder="https://"/>
            </Field>
            <Field label="CTA label">
              <Input value={ctaLabel} onChange={(e) => setCtaLabel(e.target.value)}/>
            </Field>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={save} disabled={busy}>
            {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>} Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>);
}

/* ------------------------------ Advertisers ------------------------------ */
function AdvertisersTab({ advertisers, campaigns, onChange, }: {
    advertisers: Advertiser[];
    campaigns: Campaign[];
    onChange: () => Promise<void>;
}) {
    const [q, setQ] = useState("");
    const [editing, setEditing] = useState<Advertiser | null>(null);
    const filtered = useMemo(() => {
        const s = q.trim().toLowerCase();
        if (!s)
            return advertisers;
        return advertisers.filter((a) => `${a.business_name} ${a.contact_email} ${a.city ?? ""} ${a.category ?? ""}`
            .toLowerCase()
            .includes(s));
    }, [advertisers, q]);
    const counts = useMemo(() => {
        const map: Record<string, number> = {};
        for (const c of campaigns)
            map[c.advertiser_id] = (map[c.advertiser_id] ?? 0) + 1;
        return map;
    }, [campaigns]);
    async function setStatus(a: Advertiser, status: Advertiser["status"]) {
        try {
            await updateAdvertiserStatus(a.id, status);
            toast.success(`Advertiser ${status}`);
            await onChange();
        }
        catch (err) {
            toast.error((err as Error).message);
        }
    }
    async function decide(a: Advertiser, decision: "approve" | "reject") {
        const note = decision === "reject"
            ? (window.prompt("Reason (shown to the business owner)?") ?? undefined)
            : undefined;
        if (decision === "reject" && !note)
            return;
        try {
            await adminDecideAdvertiser(a.id, decision, note);
            toast.success(decision === "approve" ? "Business approved" : "Business rejected");
            await onChange();
        }
        catch (err) {
            toast.error((err as Error).message);
        }
    }
    return (<>
      <div className="mb-3 rounded-2xl border border-border bg-card p-3 shadow-card">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"/>
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search advertisers…" className="pl-9"/>
        </div>
      </div>

      {filtered.length === 0 ? (<EmptyState message="No advertisers found."/>) : (<div className="grid gap-3">
          {filtered.map((a) => (<article key={a.id} className="rounded-2xl border border-border bg-card p-4 shadow-card">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-display text-lg font-bold">{a.business_name}</h3>
                    <StatusBadge status={a.status}/>
                  </div>
                  <div className="mt-1 text-sm text-muted-foreground">
                    {a.owner_name ? (<span className="font-medium text-foreground">{a.owner_name} · </span>) : null}
                    {a.contact_email}
                    {a.contact_phone ? ` · ${a.contact_phone}` : ""}
                  </div>
                  <div className="mt-1 text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
                    Submitted {new Date(a.submitted_at ?? a.created_at).toLocaleString()}
                    {a.package_selected ? ` · ${a.package_selected}` : ""}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2 text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
                    {a.category && <Chip>{a.category}</Chip>}
                    {a.city && <Chip>{a.city}</Chip>}
                    {a.website && (<Chip>
                        <a href={a.website} target="_blank" rel="noopener noreferrer" className="hover:underline">
                          {a.website.replace(/^https?:\/\//, "")}
                        </a>
                      </Chip>)}
                    <Chip>{counts[a.id] ?? 0} campaigns</Chip>
                  </div>
                  {a.notes && (<p className="mt-2 rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground">
                      {a.notes}
                    </p>)}
                </div>
                <div className="flex flex-shrink-0 flex-wrap gap-2">
                  {(a.status === "pending_review" || a.status === "pending") && (<>
                      <Button size="sm" onClick={() => decide(a, "approve")}>
                        <CheckCircle2 className="mr-1 h-3.5 w-3.5"/> Approve
                      </Button>
                      <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => decide(a, "reject")}>
                        <XCircle className="mr-1 h-3.5 w-3.5"/> Reject
                      </Button>
                    </>)}
                  {a.status !== "approved" &&
                    a.status !== "active" &&
                    a.status !== "pending_review" &&
                    a.status !== "pending" && (<Button size="sm" onClick={() => setStatus(a, "active")}>
                        <CheckCircle2 className="mr-1 h-3.5 w-3.5"/> Activate
                      </Button>)}
                  {a.status !== "suspended" &&
                    a.status !== "rejected" &&
                    a.status !== "pending_review" &&
                    a.status !== "pending" && (<Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => setStatus(a, "suspended")}>
                        <XCircle className="mr-1 h-3.5 w-3.5"/> Suspend
                      </Button>)}
                  <Button size="sm" variant="outline" onClick={() => setEditing(a)}>
                    <Pencil className="mr-1 h-3.5 w-3.5"/> Edit
                  </Button>
                </div>
              </div>
            </article>))}
        </div>)}

      {editing && (<AdvertiserEditDialog advertiser={editing} onClose={() => setEditing(null)} onSaved={async () => {
                setEditing(null);
                await onChange();
            }}/>)}
    </>);
}

function AdvertiserEditDialog({ advertiser, onClose, onSaved, }: {
    advertiser: Advertiser;
    onClose: () => void;
    onSaved: () => Promise<void>;
}) {
    const [name, setName] = useState(advertiser.business_name);
    const [email, setEmail] = useState(advertiser.contact_email);
    const [phone, setPhone] = useState(advertiser.contact_phone ?? "");
    const [website, setWebsite] = useState(advertiser.website ?? "");
    const [category, setCategory] = useState(advertiser.category ?? "");
    const [city, setCity] = useState(advertiser.city ?? "");
    const [notes, setNotes] = useState(advertiser.notes ?? "");
    const [busy, setBusy] = useState(false);
    async function save() {
        setBusy(true);
        try {
            await updateAdvertiser(advertiser.id, {
                business_name: name,
                contact_email: email,
                contact_phone: phone || null,
                website: website || null,
                category: category || null,
                city: city || null,
                notes: notes || null,
            });
            toast.success("Advertiser updated");
            await onSaved();
        }
        catch (err) {
            toast.error((err as Error).message);
        }
        finally {
            setBusy(false);
        }
    }
    return (<Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit advertiser</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3">
          <Field label="Business name">
            <Input value={name} onChange={(e) => setName(e.target.value)}/>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Email">
              <Input value={email} onChange={(e) => setEmail(e.target.value)} type="email"/>
            </Field>
            <Field label="Phone">
              <Input value={phone} onChange={(e) => setPhone(e.target.value)}/>
            </Field>
          </div>
          <Field label="Website">
            <Input value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://"/>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Category">
              <Input value={category} onChange={(e) => setCategory(e.target.value)}/>
            </Field>
            <Field label="City">
              <Input value={city} onChange={(e) => setCity(e.target.value)}/>
            </Field>
          </div>
          <Field label="Notes">
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"/>
          </Field>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={save} disabled={busy}>
            {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>} Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>);
}

/* -------------------------------- Venues -------------------------------- */
function VenuesTab({ venues, advertisers, onChange, }: {
    venues: AdminVenue[];
    advertisers: Advertiser[];
    onChange: () => Promise<void>;
}) {
    const [q, setQ] = useState("");
    const [only, setOnly] = useState<"all" | "verified" | "featured" | "unclaimed">("all");
    const filtered = useMemo(() => {
        const s = q.trim().toLowerCase();
        return venues.filter((v) => {
            if (only === "verified" && !v.verified)
                return false;
            if (only === "featured" && !v.featured)
                return false;
            if (only === "unclaimed" && v.advertiser_id)
                return false;
            if (s && !`${v.name} ${v.city ?? ""} ${v.neighborhood ?? ""}`.toLowerCase().includes(s)) {
                return false;
            }
            return true;
        });
    }, [venues, q, only]);
    async function toggleVerified(v: AdminVenue, checked: boolean) {
        try {
            await setVenueVerified(v.id, checked);
            toast.success(checked ? "Verified" : "Verification removed");
            await onChange();
        }
        catch (err) {
            toast.error((err as Error).message);
        }
    }
    async function toggleFeatured(v: AdminVenue, checked: boolean) {
        try {
            await setVenueFeatured(v.id, checked);
            toast.success(checked ? "Now featured" : "Removed from featured");
            await onChange();
        }
        catch (err) {
            toast.error((err as Error).message);
        }
    }
    async function link(v: AdminVenue, advertiserId: string) {
        try {
            await linkVenueToAdvertiser(v.id, advertiserId === "__none" ? null : advertiserId);
            toast.success("Updated");
            await onChange();
        }
        catch (err) {
            toast.error((err as Error).message);
        }
    }
    return (<>
      <div className="mb-3 flex flex-wrap items-center gap-2 rounded-2xl border border-border bg-card p-3 shadow-card">
        <div className="relative min-w-[260px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"/>
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search venues…" className="pl-9"/>
        </div>
        <Select value={only} onValueChange={(v) => setOnly(v as typeof only)}>
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All venues</SelectItem>
            <SelectItem value="verified">Verified only</SelectItem>
            <SelectItem value="featured">Featured only</SelectItem>
            <SelectItem value="unclaimed">Unclaimed only</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (<EmptyState message="No venues match."/>) : (<div className="grid gap-2">
          {filtered.map((v) => (<article key={v.id} className="flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-card p-3 shadow-card">
              <div className="h-12 w-12 flex-shrink-0 rounded-xl bg-muted bg-cover bg-center" style={v.image_url ? { backgroundImage: `url(${v.image_url})` } : undefined}/>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-bold">{v.name}</span>
                  {v.verified && (<Badge variant="outline" className="border-emerald-400/40 bg-emerald-500/10 text-emerald-700">
                      <BadgeCheck className="mr-1 h-3 w-3"/> Verified
                    </Badge>)}
                  {v.featured && (<Badge variant="outline" className="border-amber-400/40 bg-amber-500/10 text-amber-700">
                      <Star className="mr-1 h-3 w-3 fill-amber-500"/> Featured
                    </Badge>)}
                </div>
                <div className="text-xs text-muted-foreground">
                  {v.category ?? "Venue"}
                  {v.city ? ` · ${v.city}` : ""}
                  {v.neighborhood ? ` · ${v.neighborhood}` : ""}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <label className="flex items-center gap-2 text-xs">
                  <Switch checked={v.verified} onCheckedChange={(c) => toggleVerified(v, c)}/>
                  Verified
                </label>
                <label className="flex items-center gap-2 text-xs">
                  <Switch checked={v.featured} onCheckedChange={(c) => toggleFeatured(v, c)}/>
                  Featured
                </label>
                <Select value={v.advertiser_id ?? "__none"} onValueChange={(val) => link(v, val)}>
                  <SelectTrigger className="h-8 w-44 text-xs">
                    <LinkIcon className="mr-1 inline h-3 w-3"/>
                    <SelectValue placeholder="Link advertiser"/>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none">— Unlinked —</SelectItem>
                    {advertisers.map((a) => (<SelectItem key={a.id} value={a.id}>
                        {a.business_name}
                      </SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
            </article>))}
        </div>)}
    </>);
}

/* -------------------------------- Billing -------------------------------- */
function BillingTab({ campaigns, advertiserById, mrrCents, }: {
    campaigns: Campaign[];
    advertiserById: Record<string, Advertiser>;
    mrrCents: number;
}) {
    const approved = campaigns.filter((c) => c.status === "approved");
    const tierBreakdown = useMemo(() => {
        const out: Record<PackageTier, {
            count: number;
            cents: number;
        }> = {
            starter: { count: 0, cents: 0 },
            featured: { count: 0, cents: 0 },
            spotlight: { count: 0, cents: 0 },
        };
        for (const c of approved) {
            out[c.package_tier].count++;
            out[c.package_tier].cents += PACKAGE_PRICE_CENTS[c.package_tier];
        }
        return out;
    }, [approved]);
    const byAdvertiser = useMemo(() => {
        const map: Record<string, {
            advertiser: Advertiser | undefined;
            cents: number;
            count: number;
        }> = {};
        for (const c of approved) {
            const id = c.advertiser_id;
            if (!map[id])
                map[id] = { advertiser: advertiserById[id], cents: 0, count: 0 };
            map[id].count++;
            map[id].cents += PACKAGE_PRICE_CENTS[c.package_tier];
        }
        return Object.values(map).sort((a, b) => b.cents - a.cents);
    }, [approved, advertiserById]);
    async function changeTier(c: Campaign, tier: PackageTier) {
        try {
            await setCampaignTier(c.id, tier);
            toast.success(`Moved to ${PACKAGES[tier].label}`);
        }
        catch (err) {
            toast.error((err as Error).message);
        }
    }
    return (<div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        {(Object.keys(PACKAGES) as PackageTier[]).map((tier) => (<article key={tier} className="rounded-2xl border border-border bg-card p-4 shadow-card">
            <div className="flex items-center justify-between">
              <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
                {PACKAGES[tier].label}
              </p>
              <Badge variant="secondary">{PACKAGES[tier].price}</Badge>
            </div>
            <div className="mt-1 font-display text-3xl font-bold">{tierBreakdown[tier].count}</div>
            <div className="text-xs text-muted-foreground">
              {formatCents(tierBreakdown[tier].cents)} / mo · {PACKAGES[tier].blurb}
            </div>
          </article>))}
      </div>

      <article className="rounded-2xl border border-border bg-card p-5 shadow-card">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
              Estimated monthly recurring
            </p>
            <h3 className="font-display text-3xl font-bold">{formatCents(mrrCents)}</h3>
          </div>
          <p className="text-xs text-muted-foreground">
            Sum of approved campaigns at list price. Discounts and one-offs not included.
          </p>
        </div>
      </article>

      <article className="rounded-2xl border border-border bg-card p-5 shadow-card">
        <h3 className="font-display text-lg font-bold">Top advertisers by run-rate</h3>
        <div className="mt-3 divide-y divide-border">
          {byAdvertiser.length === 0 ? (<p className="py-6 text-sm text-muted-foreground">No active advertisers yet.</p>) : (byAdvertiser.slice(0, 12).map((row) => (<div key={row.advertiser?.id ?? Math.random()} className="flex items-center justify-between py-2">
                <div>
                  <div className="font-bold">{row.advertiser?.business_name ?? "Unknown"}</div>
                  <div className="text-xs text-muted-foreground">
                    {row.count} campaign{row.count === 1 ? "" : "s"}
                  </div>
                </div>
                <div className="font-display text-lg font-bold">{formatCents(row.cents)}</div>
              </div>)))}
        </div>
      </article>

      <article className="rounded-2xl border border-border bg-card p-5 shadow-card">
        <h3 className="font-display text-lg font-bold">Plan changes</h3>
        <p className="text-xs text-muted-foreground">
          Upgrade or downgrade a live campaign's package tier instantly.
        </p>
        <div className="mt-3 space-y-2">
          {approved.length === 0 ? (<p className="text-sm text-muted-foreground">Nothing live yet.</p>) : (approved.slice(0, 8).map((c) => (<div key={c.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-muted/40 px-3 py-2">
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-bold">{c.headline}</div>
                  <div className="text-xs text-muted-foreground">
                    {advertiserById[c.advertiser_id]?.business_name ?? "—"}
                  </div>
                </div>
                <Select value={c.package_tier} onValueChange={(v) => changeTier(c, v as PackageTier)}>
                  <SelectTrigger className="h-8 w-44">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(PACKAGES).map(([k, v]) => (<SelectItem key={k} value={k}>
                        {v.label} — {v.price}
                      </SelectItem>))}
                  </SelectContent>
                </Select>
              </div>)))}
        </div>
      </article>
    </div>);
}

/* ------------------------------- Helpers ------------------------------- */
function KPI({ label, value, icon: Icon, accent, }: {
    label: string;
    value: number | string;
    icon?: typeof Eye;
    accent?: "amber" | "emerald";
}) {
    const tone = accent === "amber"
        ? "text-amber-700"
        : accent === "emerald"
            ? "text-emerald-700"
            : "text-foreground";
    return (<div className="rounded-2xl border border-border bg-card p-4 shadow-card">
      <div className="flex items-center gap-1 text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
        {Icon && <Icon className="h-3 w-3"/>} {label}
      </div>
      <div className={`mt-1 font-display text-2xl font-bold ${tone}`}>{value}</div>
    </div>);
}

function StatusBadge({ status }: {
    status: string;
}) {
    const tone = status === "approved"
        ? "bg-emerald-500/15 text-emerald-700"
        : status === "pending"
            ? "bg-amber-500/15 text-amber-700"
            : status === "rejected"
                ? "bg-destructive/15 text-destructive"
                : status === "paused"
                    ? "bg-muted text-muted-foreground"
                    : status === "suspended"
                        ? "bg-destructive/15 text-destructive"
                        : "bg-muted text-muted-foreground";
    return (<span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${tone}`}>
      {status}
    </span>);
}

function Chip({ children }: {
    children: React.ReactNode;
}) {
    return <span className="rounded-full bg-muted px-2 py-0.5">{children}</span>;
}

function Field({ label, children }: {
    label: string;
    children: React.ReactNode;
}) {
    return (<div className="grid gap-1">
      <Label className="text-xs font-mono font-bold uppercase tracking-wider text-muted-foreground">
        {label}
      </Label>
      {children}
    </div>);
}

function EmptyState({ message }: {
    message: string;
}) {
    return (<div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center text-sm text-muted-foreground">
      {message}
    </div>);
}

/* -------------------------------- Claims -------------------------------- */
function ClaimsTab({ claims, advertiserById, venues, onChange, }: {
    claims: VenueClaim[];
    advertiserById: Record<string, Advertiser>;
    venues: AdminVenue[];
    onChange: () => Promise<void>;
}) {
    const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("pending");
    const venueById = useMemo(() => Object.fromEntries(venues.map((v) => [v.id, v])), [venues]);
    const filtered = claims.filter((c) => filter === "all" || c.status === filter);
    async function decide(c: VenueClaim, status: "approved" | "rejected") {
        const note = status === "rejected"
            ? (window.prompt("Reason (shown to advertiser)?") ?? undefined)
            : undefined;
        try {
            await reviewVenueClaim(c.id, status, note);
            toast.success(`Claim ${status}`);
            await onChange();
        }
        catch (err) {
            toast.error((err as Error).message);
        }
    }
    return (<>
      <div className="mb-3 flex flex-wrap items-center gap-2 rounded-2xl border border-border bg-card p-3 shadow-card">
        <Select value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(["pending", "approved", "rejected", "all"] as const).map((f) => (<SelectItem key={f} value={f}>
                {f}
              </SelectItem>))}
          </SelectContent>
        </Select>
      </div>
      {filtered.length === 0 ? (<EmptyState message="No venue claims match your filter."/>) : (<div className="grid gap-3">
          {filtered.map((c) => {
                const a = advertiserById[c.advertiser_id];
                const v = venueById[c.venue_id];
                return (<article key={c.id} className="rounded-2xl border border-border bg-card p-4 shadow-card">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-display text-lg font-bold">
                        {v?.name ?? "Unknown venue"}
                      </h3>
                      <StatusBadge status={c.status}/>
                      <Chip>{c.verification_tier.replace("_", " ")}</Chip>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Requested by <strong>{a?.business_name ?? "Unknown"}</strong>
                      {c.contact_email ? <> · {c.contact_email}</> : null}
                    </p>
                    {c.proof_url && (<a href={c.proof_url} target="_blank" rel="noreferrer" className="mt-1 inline-flex items-center gap-1 text-xs text-primary hover:underline">
                        <LinkIcon className="h-3 w-3"/> Proof
                      </a>)}
                    {c.notes && (<p className="mt-2 rounded-md bg-muted px-2 py-1 text-xs">{c.notes}</p>)}
                    {c.admin_note && (<p className="mt-2 rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground">
                        Admin note: {c.admin_note}
                      </p>)}
                  </div>
                </div>
                {c.status === "pending" && (<div className="mt-3 flex flex-wrap gap-2">
                    <Button size="sm" onClick={() => decide(c, "approved")}>
                      <CheckCircle2 className="mr-1 h-3.5 w-3.5"/> Approve & verify
                    </Button>
                    <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => decide(c, "rejected")}>
                      <XCircle className="mr-1 h-3.5 w-3.5"/> Reject
                    </Button>
                  </div>)}
              </article>);
            })}
        </div>)}
    </>);
}
