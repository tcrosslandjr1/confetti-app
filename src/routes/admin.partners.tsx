import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  Megaphone,
  Pause,
  Play,
  PlusCircle,
  RefreshCw,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import {
  listPartnerCampaigns,
  approveCampaign,
  rejectCampaign,
  pauseCampaign,
  resumeCampaign,
  createDemoSponsorship,
  runVerifyBackfillBatch,
  getVerifyStatus,
  type CampaignStatus,
  type PartnerCampaign,
} from "@/lib/admin/partner-ads";
import { BadgeCheck, Loader2 } from "lucide-react";

export const Route = createFileRoute("/admin/partners")({
  beforeLoad: async () => {
    const { requireAdminAccess } = await import("@/lib/admin-guards");
    await requireAdminAccess();
  },
  component: AdminPartners,
});

/* PIN Gate removed — admin access enforced via beforeLoad + Supabase user_roles */

const TABS: { key: CampaignStatus | "all"; label: string }[] = [
  { key: "pending", label: "Pending review" },
  { key: "active", label: "Live" },
  { key: "paused", label: "Paused" },
  { key: "draft", label: "Draft / rejected" },
  { key: "expired", label: "Expired" },
  { key: "all", label: "All" },
];

function AdminPartners() {
  // Auth + admin role enforced by beforeLoad guard.
  const [tab, setTab] = useState<CampaignStatus | "all">("pending");
  const [campaigns, setCampaigns] = useState<PartnerCampaign[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [verifyState, setVerifyState] = useState<{
    running: boolean;
    processed: number;
    verified: number;
    remaining: number | null;
  }>({ running: false, processed: 0, verified: 0, remaining: null });

  // Fetch current verify status once on mount so the badge has a count.
  useEffect(() => {
    getVerifyStatus()
      .then((s) => setVerifyState((v) => ({ ...v, remaining: s.remaining })))
      .catch(() => null);
  }, []);

  async function handleRunBackfill() {
    if (verifyState.running) return;
    setVerifyState({ running: true, processed: 0, verified: 0, remaining: null });
    const MAX_BATCHES = 30; // safety cap (~1,200 venues)
    let totalProcessed = 0;
    let totalVerified = 0;
    let lastRemaining = 0;
    for (let i = 0; i < MAX_BATCHES; i++) {
      try {
        const r = await runVerifyBackfillBatch(40);
        totalProcessed += r.processed;
        totalVerified += r.verified;
        lastRemaining = r.remaining;
        setVerifyState({
          running: true,
          processed: totalProcessed,
          verified: totalVerified,
          remaining: r.remaining,
        });
        if (r.processed === 0 || r.remaining === 0) break;
      } catch (e) {
        toast.error("Backfill batch failed", { description: (e as Error).message });
        break;
      }
    }
    setVerifyState({
      running: false,
      processed: totalProcessed,
      verified: totalVerified,
      remaining: lastRemaining,
    });
    toast.success(
      `Backfill complete — ${totalVerified} verified in this run, ${lastRemaining} unverified left`,
    );
  }

  async function refresh() {
    setLoading(true);
    setError(null);
    try {
      const rows = await listPartnerCampaigns(tab);
      setCampaigns(rows);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  async function handleApprove(c: PartnerCampaign) {
    try {
      await approveCampaign(c.id);
      toast.success(`Approved ${c.name}`);
      refresh();
    } catch (e) {
      toast.error((e as Error).message);
    }
  }
  async function handleReject(c: PartnerCampaign) {
    if (!confirm(`Reject "${c.name}" back to draft?`)) return;
    try {
      await rejectCampaign(c.id);
      toast.success(`Rejected ${c.name}`);
      refresh();
    } catch (e) {
      toast.error((e as Error).message);
    }
  }
  async function handlePause(c: PartnerCampaign) {
    try {
      await pauseCampaign(c.id);
      toast.success(`Paused ${c.name}`);
      refresh();
    } catch (e) {
      toast.error((e as Error).message);
    }
  }
  async function handleResume(c: PartnerCampaign) {
    try {
      await resumeCampaign(c.id);
      toast.success(`Resumed ${c.name}`);
      refresh();
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  async function handleCreateDemo() {
    if (creating) return;
    setCreating(true);
    try {
      const result = await createDemoSponsorship({
        city: "Cincinnati",
        targetVibes: ["cocktails", "speakeasy", "rooftop", "outdoor", "intimate"],
      });
      toast.success(`Created demo sponsorship for ${result.venueName}`, {
        description: "Switch to Live tab to see it.",
      });
      setTab("active");
    } catch (e) {
      toast.error("Couldn't create demo", { description: (e as Error).message });
    } finally {
      setCreating(false);
    }
  }

  const counts = useMemo(() => {
    const m: Record<string, number> = {};
    for (const c of campaigns) m[c.status] = (m[c.status] ?? 0) + 1;
    return m;
  }, [campaigns]);

  return (
    <div className="min-h-screen bg-cream">
      <header className="border-b-2 border-cream/10 bg-cream">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-5 py-4">
          <div className="flex items-center gap-3">
            <Link
              to="/admin/console"
              className="inline-flex items-center gap-1 rounded-full border-2 border-cream/20 bg-cream px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-widest hover:bg-gold"
            >
              <ArrowLeft className="h-3 w-3" /> Admin
            </Link>
            <div>
              <h1 className="font-display text-2xl font-black tracking-tight">Partner Ads</h1>
              <p className="font-mono text-[11px] uppercase tracking-widest text-cream/50">
                Approve, pause, and audit sponsored placements
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleRunBackfill}
              disabled={verifyState.running}
              className="inline-flex items-center gap-2 rounded-full border-2 border-emerald-600 bg-emerald-600/10 px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-widest text-emerald-700 hover:bg-emerald-600 hover:text-cream disabled:opacity-50"
            >
              {verifyState.running ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <BadgeCheck className="h-3.5 w-3.5" />
              )}
              {verifyState.running
                ? `Verifying ${verifyState.processed} (${verifyState.remaining ?? "?"} left)`
                : verifyState.remaining !== null
                  ? `Verify backfill (${verifyState.remaining} unverified)`
                  : "Verify backfill"}
            </button>
            <button
              type="button"
              onClick={handleCreateDemo}
              disabled={creating}
              className="inline-flex items-center gap-2 rounded-full border-2 border-purple bg-purple/10 px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-widest text-purple hover:bg-purple hover:text-cream disabled:opacity-50"
            >
              <PlusCircle className="h-3.5 w-3.5" /> {creating ? "Creating…" : "Demo sponsor"}
            </button>
            <button
              type="button"
              onClick={refresh}
              disabled={loading}
              className="inline-flex items-center gap-1.5 rounded-full border-2 border-ink bg-cream px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-widest hover:bg-gold disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
            </button>
          </div>
        </div>
        <div className="mx-auto flex max-w-6xl gap-2 overflow-x-auto px-5 pb-3">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={`shrink-0 rounded-full border-2 px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-widest transition-colors ${
                tab === t.key
                  ? "border-ink bg-ink text-cream"
                  : "border-cream/20 bg-cream hover:bg-gold"
              }`}
            >
              {t.label}
              {counts[t.key] !== undefined && tab === t.key && (
                <span className="ml-1.5 rounded-full bg-cream/20 px-1.5 py-0.5 text-[8px]">
                  {counts[t.key]}
                </span>
              )}
            </button>
          ))}
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 py-6">
        {error && (
          <div className="mb-4 rounded-xl border-2 border-red-500 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}
        {loading && campaigns.length === 0 ? (
          <div className="py-16 text-center text-sm text-cream/60">Loading campaigns…</div>
        ) : campaigns.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-cream/20 bg-cream/40 px-6 py-12 text-center">
            <Megaphone className="mx-auto h-8 w-8 text-cream/30" />
            <p className="mt-3 font-display text-lg font-bold">No campaigns in this bucket</p>
            <p className="mt-1 text-sm text-cream/60">
              {tab === "pending"
                ? "Nothing waiting for review. Try the Live tab, or create a demo sponsorship to test the flow."
                : "Try a different tab."}
            </p>
          </div>
        ) : (
          <ul className="space-y-3">
            {campaigns.map((c) => (
              <li key={c.id}>
                <article className="rounded-2xl border-2 border-cream/10 bg-cream p-4 shadow-card">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-widest ${
                            c.status === "active"
                              ? "bg-emerald-500 text-cream"
                              : c.status === "pending"
                                ? "bg-amber-500 text-cream"
                                : c.status === "paused"
                                  ? "bg-ink/30 text-cream"
                                  : c.status === "expired"
                                    ? "bg-ink/15 text-cream/60"
                                    : "bg-coral/80 text-cream"
                          }`}
                        >
                          {c.status}
                        </span>
                        <span className="font-mono text-[10px] uppercase tracking-widest text-cream/50">
                          Boost {c.boost_strength}/10
                        </span>
                      </div>
                      <h3 className="mt-1 font-display text-lg font-bold leading-snug">
                        {c.name}
                      </h3>
                      <div className="mt-0.5 text-sm text-cream/70">
                        {c.venue_name}
                        {c.venue_city ? ` · ${c.venue_city}` : ""}
                        {c.business_name ? ` · ${c.business_name}` : ""}
                        {c.business_tier ? ` (${c.business_tier})` : ""}
                      </div>
                      <div className="mt-2 grid gap-1 text-[11px] text-cream/60 sm:grid-cols-2">
                        <div>
                          <span className="font-bold">Cities:</span>{" "}
                          {(c.target_cities ?? []).join(", ") || "—"}
                        </div>
                        <div>
                          <span className="font-bold">Vibes:</span>{" "}
                          {(c.target_vibes ?? []).join(", ") || "—"}
                        </div>
                        <div>
                          <span className="font-bold">Budget:</span> {c.daily_credit_budget}/day,
                          spent {c.total_credits_spent}
                        </div>
                        <div>
                          <span className="font-bold">Runs:</span>{" "}
                          {new Date(c.start_date).toLocaleDateString()} →{" "}
                          {c.end_date ? new Date(c.end_date).toLocaleDateString() : "no end"}
                        </div>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-3 text-[11px] text-cream/70">
                        <span>
                          <span className="font-bold">{c.impressions}</span> impressions
                        </span>
                        <span>
                          <span className="font-bold">{c.click_throughs}</span> clicks
                        </span>
                        <span>
                          <span className="font-bold">{c.check_ins}</span> check-ins
                        </span>
                        {c.impressions > 0 && (
                          <span>
                            <span className="font-bold">
                              {((c.click_throughs / c.impressions) * 100).toFixed(1)}%
                            </span>{" "}
                            CTR
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex shrink-0 flex-wrap gap-1.5">
                      {c.status === "pending" && (
                        <>
                          <button
                            type="button"
                            onClick={() => handleApprove(c)}
                            className="inline-flex items-center gap-1 rounded-full border-2 border-emerald-600 bg-emerald-600 px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-widest text-cream hover:bg-emerald-700"
                          >
                            <CheckCircle2 className="h-3 w-3" /> Approve
                          </button>
                          <button
                            type="button"
                            onClick={() => handleReject(c)}
                            className="inline-flex items-center gap-1 rounded-full border-2 border-red-600 bg-cream px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-widest text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="h-3 w-3" /> Reject
                          </button>
                        </>
                      )}
                      {c.status === "active" && (
                        <button
                          type="button"
                          onClick={() => handlePause(c)}
                          className="inline-flex items-center gap-1 rounded-full border-2 border-ink bg-cream px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-widest hover:bg-gold"
                        >
                          <Pause className="h-3 w-3" /> Pause
                        </button>
                      )}
                      {c.status === "paused" && (
                        <button
                          type="button"
                          onClick={() => handleResume(c)}
                          className="inline-flex items-center gap-1 rounded-full border-2 border-emerald-600 bg-emerald-600 px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-widest text-cream hover:bg-emerald-700"
                        >
                          <Play className="h-3 w-3" /> Resume
                        </button>
                      )}
                      {(c.status === "draft" || c.status === "expired") && (
                        <button
                          type="button"
                          onClick={() => handleResume(c)}
                          className="inline-flex items-center gap-1 rounded-full border-2 border-emerald-600 bg-cream px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-widest text-emerald-600 hover:bg-emerald-50"
                        >
                          <Play className="h-3 w-3" /> Activate
                        </button>
                      )}
                    </div>
                  </div>
                </article>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
