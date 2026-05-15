import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import {
  type Advertiser,
  type AdvertiserSubscription,
  type Campaign,
  bucketEventsByDay,
  createCampaign,
  deleteCampaign,
  getCampaignStats,
  getMyAdvertiser,
  getMySubscription,
  listMyCampaigns,
  listRecentAdEvents,
  PACKAGES,
  PLACEMENT_LABELS,
  type PackageTier,
  type Placement,
  placementsForTier,
  updateCampaignStatus,
} from "@/lib/ads";
import { SubscriptionPanel } from "@/components/advertiser/SubscriptionPanel";
import { ClaimVenuePanel } from "@/components/advertiser/ClaimVenuePanel";
import {
  Loader2,
  Lock,
  Megaphone,
  Plus,
  Eye,
  MousePointerClick,
  Pause,
  Play,
  Sparkles,
  Trash2,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";


export const Route = createFileRoute("/advertise/portal")({
  component: AdvertiserPortal,
});

function AdvertiserPortal() {
  const { user, loading, viewAs } = useAuth();
  const nav = useNavigate();
  const [advertiser, setAdvertiser] = useState<Advertiser | null>(null);
  const [subscription, setSubscription] = useState<AdvertiserSubscription | null>(null);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [stats, setStats] = useState<Record<string, { impressions: number; clicks: number }>>({});
  const [series, setSeries] = useState<ReturnType<typeof bucketEventsByDay>>([]);
  const [busy, setBusy] = useState(false);
  const [showNew, setShowNew] = useState(false);

  const refresh = useCallback(async (uid: string) => {
    setBusy(true);
    const a = await getMyAdvertiser(uid);
    setAdvertiser(a);
    if (a) {
      const [cs, sub] = await Promise.all([
        listMyCampaigns(a.id),
        getMySubscription(a.id),
      ]);
      setCampaigns(cs);
      setSubscription(sub);
      const ids = new Set(cs.map((c) => c.id));
      const [s, evs] = await Promise.all([
        getCampaignStats(cs.map((c) => c.id)),
        listRecentAdEvents(30),
      ]);
      setStats(s);
      setSeries(bucketEventsByDay(evs.filter((e) => e.campaign_id && ids.has(e.campaign_id)), 30));
    }
    setBusy(false);
  }, []);

  async function handleStatus(c: Campaign, status: "paused" | "approved") {
    try {
      await updateCampaignStatus(c.id, status);
      toast.success(status === "paused" ? "Campaign paused" : "Campaign resumed");
      if (user) await refresh(user.id);
    } catch (err) {
      toast.error((err as Error).message);
    }
  }

  async function handleDelete(c: Campaign) {
    if (!window.confirm(`Delete campaign "${c.headline}"? This cannot be undone.`)) return;
    try {
      await deleteCampaign(c.id);
      toast.success("Campaign deleted");
      if (user) await refresh(user.id);
    } catch (err) {
      toast.error((err as Error).message);
    }
  }


  useEffect(() => {
    if (loading) return;
    if (!user) {
      nav({ to: "/auth" });
      return;
    }
    // Real business owners sign in as "customer" (only admins can impersonate
    // other roles), so we allow customer + admin + business viewers to reach
    // their advertiser portal. Visitors (signed-out preview) still bounce to
    // the marketing page.
    if (viewAs === "visitor") { nav({ to: "/advertise" }); return; }
    void refresh(user.id);
  }, [user, loading, viewAs, nav, refresh]);

  if (loading || busy) {
    return (
      <div className="grid min-h-[60vh] place-items-center text-sm text-muted-foreground">
        <Loader2 className="mr-2 inline h-4 w-4 animate-spin" /> Loading…
      </div>
    );
  }

  if (!advertiser) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-16 text-center">
        <Megaphone className="mx-auto h-10 w-10 text-primary" />
        <h1 className="mt-4 font-display text-3xl font-bold">No advertiser account yet</h1>
        <p className="mt-2 text-sm text-muted-foreground">Sign up first — takes about a minute.</p>
        <Link
          to="/advertise"
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-3 text-sm font-bold text-background"
        >
          Go to signup <ChevronRight className="h-4 w-4" />
        </Link>
      </main>
    );
  }

  const totalImpressions = Object.values(stats).reduce((s, v) => s + v.impressions, 0);
  const totalClicks = Object.values(stats).reduce((s, v) => s + v.clicks, 0);
  const ctr = totalImpressions ? ((totalClicks / totalImpressions) * 100).toFixed(1) : "0.0";

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
            Advertiser portal
          </p>
          <h1 className="font-display text-3xl font-bold">{advertiser.business_name}</h1>
          <p className="text-sm text-muted-foreground">
            Status: <StatusBadge status={advertiser.status} />
            {advertiser.city ? (
              <span className="ml-2 text-muted-foreground/70">· {advertiser.city}</span>
            ) : null}
          </p>
        </div>
        <NewCampaignButton
          subscription={subscription}
          onClick={() => setShowNew((s) => !s)}
        />
      </header>

      {/* Stats */}
      <div className="mt-6 grid gap-3 sm:grid-cols-4">
        <StatCard
          label="Active campaigns"
          value={campaigns.filter((c) => c.status === "approved").length}
        />
        <StatCard label="Impressions" value={totalImpressions} icon={Eye} />
        <StatCard label="Clicks" value={totalClicks} icon={MousePointerClick} />
        <StatCard label="CTR" value={`${ctr}%`} />
      </div>

      {/* Subscription + claims */}
      <div className="mt-6 grid gap-4 lg:grid-cols-[1.2fr_1fr]">
        <SubscriptionPanel
          advertiserId={advertiser.id}
          onChange={(s) => setSubscription(s)}
        />
        <ClaimVenuePanel
          advertiserId={advertiser.id}
          subscriptionTier={subscription?.tier ?? "starter"}
          contactEmail={advertiser.contact_email}
        />
      </div>

      {showNew && subscription?.status === "active" && (
        <NewCampaignForm
          advertiserId={advertiser.id}
          allowedPlacements={placementsForTier(subscription.tier)}
          onCreated={(c) => {
            setCampaigns((prev) => [c, ...prev]);
            setShowNew(false);
            toast.success("Campaign submitted for review");
          }}
          onCancel={() => setShowNew(false)}
        />
      )}


      {/* 30-day trend */}
      {totalImpressions > 0 && (
        <section className="mt-6 rounded-2xl border border-border bg-card p-5 shadow-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
                Last 30 days
              </p>
              <h3 className="font-display text-lg font-bold">Reach across your campaigns</h3>
            </div>
          </div>
          <div className="mt-3 h-44 w-full">
            <ResponsiveContainer>
              <AreaChart data={series} margin={{ left: -10, right: 8, top: 8, bottom: 0 }}>
                <defs>
                  <linearGradient id="po-imp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" tickFormatter={(v) => v.slice(5)} fontSize={11} />
                <YAxis allowDecimals={false} fontSize={11} width={28} />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="impressions"
                  stroke="hsl(var(--primary))"
                  fill="url(#po-imp)"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="clicks"
                  stroke="hsl(var(--destructive))"
                  fill="hsl(var(--destructive) / 0.15)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>
      )}

      {/* Campaigns list */}
      <section className="mt-8 space-y-3">
        <h2 className="font-display text-xl font-bold">Campaigns</h2>
        {campaigns.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center text-sm text-muted-foreground">
            No campaigns yet. Click <strong>New campaign</strong> to get started.
          </div>
        ) : (
          <div className="grid gap-3">
            {campaigns.map((c) => (
              <article
                key={c.id}
                className="rounded-2xl border border-border bg-card p-4 shadow-card"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-display text-lg font-bold">{c.headline}</h3>
                      <StatusBadge status={c.status} />
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{c.blurb || "—"}</p>
                    <div className="mt-2 flex flex-wrap gap-2 text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
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
                    {c.admin_note && c.status === "rejected" && (
                      <p className="mt-2 rounded-md bg-destructive/10 px-2 py-1 text-xs text-destructive">
                        Admin: {c.admin_note}
                      </p>
                    )}
                  </div>
                  <div className="text-right text-xs text-muted-foreground">
                    <div className="flex items-center justify-end gap-1">
                      <Eye className="h-3 w-3" /> {stats[c.id]?.impressions ?? 0}
                    </div>
                    <div className="mt-1 flex items-center justify-end gap-1">
                      <MousePointerClick className="h-3 w-3" /> {stats[c.id]?.clicks ?? 0}
                    </div>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {c.status === "approved" && (
                    <button
                      onClick={() => handleStatus(c, "paused")}
                      className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1 text-xs hover:bg-muted"
                    >
                      <Pause className="h-3 w-3" /> Pause
                    </button>
                  )}
                  {c.status === "paused" && (
                    <button
                      onClick={() => handleStatus(c, "approved")}
                      className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1 text-xs hover:bg-muted"
                    >
                      <Play className="h-3 w-3" /> Resume
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(c)}
                    className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-3 w-3" /> Delete
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

function NewCampaignButton({
  subscription,
  onClick,
}: {
  subscription: AdvertiserSubscription | null;
  onClick: () => void;
}) {
  const active = subscription?.status === "active";
  return (
    <button
      onClick={onClick}
      disabled={!active}
      title={active ? "" : "Activate a plan first"}
      className="inline-flex items-center gap-2 rounded-full bg-foreground px-4 py-2 text-sm font-bold text-background hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
    >
      {active ? <Plus className="h-4 w-4" /> : <Lock className="h-4 w-4" />} New campaign
    </button>
  );
}

function NewCampaignForm({
  advertiserId,
  allowedPlacements,
  onCreated,
  onCancel,
}: {
  advertiserId: string;
  allowedPlacements: Placement[];
  onCreated: (c: Campaign) => void;
  onCancel: () => void;
}) {
  const [headline, setHeadline] = useState("");
  const [blurb, setBlurb] = useState("");
  const [placement, setPlacement] = useState<Placement>(allowedPlacements[0] ?? "featured_card");
  const [tier, setTier] = useState<PackageTier>("featured");
  const [city, setCity] = useState("");
  const [ctaUrl, setCtaUrl] = useState("");
  const [ctaLabel, setCtaLabel] = useState("Visit");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const c = await createCampaign({
        advertiser_id: advertiserId,
        headline,
        blurb,
        placement,
        package_tier: tier,
        city,
        cta_url: ctaUrl || null,
        cta_label: ctaLabel || null,
      });
      onCreated(c);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const placementOptions = Object.entries(PLACEMENT_LABELS).filter(([k]) =>
    allowedPlacements.includes(k as Placement),
  );

  return (
    <form
      onSubmit={submit}
      className="mt-6 grid gap-3 rounded-2xl border-2 border-primary/40 bg-card p-5 shadow-pop sm:grid-cols-2"
    >
      <div className="sm:col-span-2 flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-primary">
        <Sparkles className="h-3.5 w-3.5" /> New campaign
      </div>
      <Inp label="Headline *" value={headline} onChange={setHeadline} required />
      <Inp label="City" value={city} onChange={setCity} />
      <div className="sm:col-span-2">
        <label className="text-xs font-mono font-bold uppercase tracking-wider text-muted-foreground">
          Tagline / blurb
        </label>
        <textarea
          value={blurb}
          onChange={(e) => setBlurb(e.target.value)}
          rows={2}
          className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
        />
      </div>
      <Select
        label="Placement"
        value={placement}
        onChange={(v) => setPlacement(v as Placement)}
        options={placementOptions}
      />
      <Select
        label="Package"
        value={tier}
        onChange={(v) => setTier(v as PackageTier)}
        options={Object.entries(PACKAGES).map(([k, v]) => [k, `${v.label} — ${v.price}`])}
      />

      <Inp label="CTA URL" value={ctaUrl} onChange={setCtaUrl} placeholder="https://..." />
      <Inp label="CTA label" value={ctaLabel} onChange={setCtaLabel} />
      <div className="sm:col-span-2 flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-full px-4 py-2 text-sm hover:bg-muted"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={busy}
          className="inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-2 text-sm font-bold text-background disabled:opacity-60"
        >
          {busy && <Loader2 className="h-4 w-4 animate-spin" />} Submit for review
        </button>
      </div>
    </form>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number | string;
  icon?: typeof Eye;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-card">
      <div className="flex items-center gap-1 text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
        {Icon && <Icon className="h-3 w-3" />} {label}
      </div>
      <div className="mt-1 font-display text-2xl font-bold">{value}</div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const tone =
    status === "approved"
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
  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${tone}`}
    >
      {status}
    </span>
  );
}

function Inp({
  label,
  value,
  onChange,
  required,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="text-xs font-mono font-bold uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        placeholder={placeholder}
        className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
      />
    </label>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: [string, string][];
}) {
  return (
    <label className="block">
      <span className="text-xs font-mono font-bold uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
      >
        {options.map(([k, v]) => (
          <option key={k} value={k}>
            {v}
          </option>
        ))}
      </select>
    </label>
  );
}
