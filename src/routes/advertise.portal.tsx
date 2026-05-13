import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import {
  type Advertiser,
  type AdvertiserSubscription,
  type Campaign,
  createCampaign,
  getCampaignStats,
  getMyAdvertiser,
  getMySubscription,
  listMyCampaigns,
  PACKAGES,
  PLACEMENT_LABELS,
  type PackageTier,
  type Placement,
  placementsForTier,
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
  Sparkles,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";


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
      setStats(await getCampaignStats(cs.map((c) => c.id)));
    }
    setBusy(false);
  }, []);


  useEffect(() => {
    if (loading) return;
    if (!user) {
      nav({ to: "/auth" });
      return;
    }
    // Keep the business portal scoped to the Business view. Admins must switch
    // to "Business" via the role switcher to land here, so admin/customer/visitor
    // accounts don't accidentally edit ad campaigns from the wrong context.
    if (viewAs === "admin") { nav({ to: "/admin" }); return; }
    if (viewAs === "customer") { nav({ to: "/portal" }); return; }
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
        <button
          onClick={() => setShowNew((s) => !s)}
          className="inline-flex items-center gap-2 rounded-full bg-foreground px-4 py-2 text-sm font-bold text-background hover:opacity-90"
        >
          <Plus className="h-4 w-4" /> New campaign
        </button>
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

      {showNew && (
        <NewCampaignForm
          advertiserId={advertiser.id}
          onCreated={(c) => {
            setCampaigns((prev) => [c, ...prev]);
            setShowNew(false);
            toast.success("Campaign submitted for review");
          }}
          onCancel={() => setShowNew(false)}
        />
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
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

function NewCampaignForm({
  advertiserId,
  onCreated,
  onCancel,
}: {
  advertiserId: string;
  onCreated: (c: Campaign) => void;
  onCancel: () => void;
}) {
  const [headline, setHeadline] = useState("");
  const [blurb, setBlurb] = useState("");
  const [placement, setPlacement] = useState<Placement>("featured_card");
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
        options={Object.entries(PLACEMENT_LABELS)}
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
