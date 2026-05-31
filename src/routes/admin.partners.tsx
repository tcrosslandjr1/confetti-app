import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft, CheckCircle2, Megaphone, Pause, Play,
  PlusCircle, RefreshCw, Trash2, Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import {
  listPartnerCampaigns, approveCampaign, rejectCampaign,
  pauseCampaign, resumeCampaign, createDemoSponsorship,
  runVerifyBackfillBatch, getVerifyStatus,
  type CampaignStatus, type PartnerCampaign,
} from "@/lib/admin/partner-ads";
import { BadgeCheck, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/admin/partners")({
  beforeLoad: async () => {
    const { requireAdminAccess } = await import("@/lib/admin-guards");
    await requireAdminAccess();
  },
  component: AdminPartners,
});

// ── Creator types ─────────────────────────────────────────────────────────────
type CreatorStatus = "pending" | "reviewing" | "approved" | "rejected";

interface CreatorApplication {
  id: string; created_at: string; name: string; email: string;
  instagram_handle: string | null; tiktok_handle: string | null;
  follower_count: string; primary_city: string; content_niche: string | null;
  tier: string; status: CreatorStatus; notes: string | null;
}

const CREATOR_TABS: { key: CreatorStatus | "all"; label: string }[] = [
  { key: "pending",   label: "Pending" },
  { key: "reviewing", label: "Reviewing" },
  { key: "approved",  label: "Approved" },
  { key: "rejected",  label: "Rejected" },
  { key: "all",       label: "All" },
];

const TIER_BADGE: Record<string, string> = {
  Explorer:   "bg-pink-500 text-white",
  Tastemaker: "bg-purple text-cream",
  Headliner:  "bg-gold text-ink",
};

// ── Creator Applications Panel ────────────────────────────────────────────────
function CreatorApplications() {
  const [tab, setTab]   = useState<CreatorStatus | "all">("pending");
  const [apps, setApps] = useState<CreatorApplication[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  async function refresh() {
    setLoading(true); setError(null);
    try {
      let q = supabase.from("creator_applications").select("*").order("created_at", { ascending: false });
      if (tab !== "all") q = q.eq("status", tab);
      const { data, error: err } = await q;
      if (err) throw err;
      setApps((data as CreatorApplication[]) ?? []);
    } catch (e) { setError((e as Error).message); }
    finally { setLoading(false); }
  }

  useEffect(() => { refresh(); }, [tab]); // eslint-disable-line

  async function updateStatus(id: string, status: CreatorStatus, name: string) {
    const { error: err } = await supabase.from("creator_applications").update({ status }).eq("id", id);
    if (err) { toast.error(err.message); return; }
    toast.success(`${name} marked as ${status}`);
    refresh();
  }

  const counts = useMemo(() => {
    const m: Record<string, number> = {};
    for (const a of apps) m[a.status] = (m[a.status] ?? 0) + 1;
    return m;
  }, [apps]);

  return (
    <>
      <div className="mx-auto flex max-w-6xl gap-2 overflow-x-auto px-5 pb-3">
        {CREATOR_TABS.map((t) => (
          <button key={t.key} type="button" onClick={() => setTab(t.key)}
            className={`shrink-0 rounded-full border-2 px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-widest transition-colors ${
              tab === t.key ? "border-ink bg-ink text-cream" : "border-cream/20 bg-cream hover:bg-gold"
            }`}>
            {t.label}
            {counts[t.key] !== undefined && tab === t.key && (
              <span className="ml-1.5 rounded-full bg-cream/20 px-1.5 py-0.5 text-[8px]">{counts[t.key]}</span>
            )}
          </button>
        ))}
        <button type="button" onClick={refresh} disabled={loading}
          className="ml-auto inline-flex items-center gap-1.5 rounded-full border-2 border-ink bg-cream px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-widest hover:bg-gold disabled:opacity-50">
          <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} /> Refresh
        </button>
      </div>

      <main className="mx-auto max-w-6xl px-5 py-6">
        {error && <div className="mb-4 rounded-xl border-2 border-red-500 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
        {loading && apps.length === 0 ? (
          <div className="py-16 text-center text-sm text-cream/60">Loading applications…</div>
        ) : apps.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-cream/20 bg-cream/40 px-6 py-12 text-center">
            <Sparkles className="mx-auto h-8 w-8 text-cream/30" />
            <p className="mt-3 font-display text-lg font-bold">No creator applications here</p>
            <p className="mt-1 text-sm text-cream/60">
              {tab === "pending" ? "Share confettiplan.com/creators to start getting submissions." : "Try a different tab."}
            </p>
          </div>
        ) : (
          <ul className="space-y-3">
            {apps.map((a) => (
              <li key={a.id}>
                <article className="rounded-2xl border-2 border-cream/10 bg-cream p-4 shadow-card">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-widest ${
                          a.status === "approved"  ? "bg-emerald-500 text-cream" :
                          a.status === "pending"   ? "bg-amber-500 text-cream" :
                          a.status === "reviewing" ? "bg-blue-500 text-cream" :
                          "bg-red-400 text-cream"
                        }`}>{a.status}</span>
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-widest ${TIER_BADGE[a.tier] ?? "bg-ink/20 text-ink"}`}>{a.tier}</span>
                        <span className="font-mono text-[10px] text-cream/50">{new Date(a.created_at).toLocaleDateString()}</span>
                      </div>
                      <h3 className="mt-1 font-display text-lg font-bold leading-snug">{a.name}</h3>
                      <a href={`mailto:${a.email}`} className="text-sm text-purple hover:underline">{a.email}</a>
                      <div className="mt-2 grid gap-1 text-[11px] text-cream/70 sm:grid-cols-3">
                        {a.instagram_handle && <div><span className="font-bold">Instagram:</span> {a.instagram_handle}</div>}
                        {a.tiktok_handle    && <div><span className="font-bold">TikTok:</span> {a.tiktok_handle}</div>}
                        <div><span className="font-bold">Followers:</span> {a.follower_count}</div>
                        <div><span className="font-bold">City:</span> {a.primary_city}</div>
                        {a.content_niche && <div><span className="font-bold">Niche:</span> {a.content_niche}</div>}
                      </div>
                      {a.notes && (
                        <p className="mt-2 rounded-xl bg-cream/60 px-3 py-2 text-[11px] text-ink/70 italic">"{a.notes}"</p>
                      )}
                    </div>
                    <div className="flex shrink-0 flex-wrap gap-1.5">
                      {a.status === "pending" && (
                        <button type="button" onClick={() => updateStatus(a.id, "reviewing", a.name)}
                          className="inline-flex items-center gap-1 rounded-full border-2 border-blue-500 bg-cream px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-widest text-blue-500 hover:bg-blue-50">
                          Review
                        </button>
                      )}
                      {(a.status === "pending" || a.status === "reviewing") && (
                        <button type="button" onClick={() => updateStatus(a.id, "approved", a.name)}
                          className="inline-flex items-center gap-1 rounded-full border-2 border-emerald-600 bg-emerald-600 px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-widest text-cream hover:bg-emerald-700">
                          <CheckCircle2 className="h-3 w-3" /> Approve
                        </button>
                      )}
                      {a.status !== "rejected" && (
                        <button type="button" onClick={() => updateStatus(a.id, "rejected", a.name)}
                          className="inline-flex items-center gap-1 rounded-full border-2 border-red-500 bg-cream px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-widest text-red-500 hover:bg-red-50">
                          <Trash2 className="h-3 w-3" /> Reject
                        </button>
                      )}
                      {a.status === "rejected" && (
                        <button type="button" onClick={() => updateStatus(a.id, "pending", a.name)}
                          className="inline-flex items-center gap-1 rounded-full border-2 border-ink bg-cream px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-widest hover:bg-gold">
                          Restore
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
    </>
  );
}

// ── Partner Ads TABS ──────────────────────────────────────────────────────────
const TABS: { key: CampaignStatus | "all"; label: string }[] = [
  { key: "pending", label: "Pending review" },
  { key: "active",  label: "Live" },
  { key: "paused",  label: "Paused" },
  { key: "draft",   label: "Draft / rejected" },
  { key: "expired", label: "Expired" },
  { key: "all",     label: "All" },
];

type TopView = "ads" | "creators";

function AdminPartners() {
  const [topView, setTopView] = useState<TopView>("ads");
  const [tab, setTab]         = useState<CampaignStatus | "all">("pending");
  const [campaigns, setCampaigns] = useState<PartnerCampaign[]>([]);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState<string | null>(null);
  const [creating, setCreating]   = useState(false);
  const [verifyState, setVerifyState] = useState<{
    running: boolean; processed: number; verified: number; remaining: number | null;
  }>({ running: false, processed: 0, verified: 0, remaining: null });

  useEffect(() => {
    getVerifyStatus().then((s) => setVerifyState((v) => ({ ...v, remaining: s.remaining }))).catch(() => null);
  }, []);

  async function handleRunBackfill() {
    if (verifyState.running) return;
    setVerifyState({ running: true, processed: 0, verified: 0, remaining: null });
    const MAX_BATCHES = 30;
    let tp = 0, tv = 0, lr = 0;
    for (let i = 0; i < MAX_BATCHES; i++) {
      try {
        const r = await runVerifyBackfillBatch(40);
        tp += r.processed; tv += r.verified; lr = r.remaining;
        setVerifyState({ running: true, processed: tp, verified: tv, remaining: r.remaining });
        if (r.processed === 0 || r.remaining === 0) break;
      } catch (e) { toast.error("Backfill batch failed", { description: (e as Error).message }); break; }
    }
    setVerifyState({ running: false, processed: tp, verified: tv, remaining: lr });
    toast.success(`Backfill complete — ${tv} verified, ${lr} unverified left`);
  }

  async function refresh() {
    setLoading(true); setError(null);
    try { setCampaigns(await listPartnerCampaigns(tab)); }
    catch (e) { setError((e as Error).message); }
    finally { setLoading(false); }
  }

  useEffect(() => { if (topView === "ads") refresh(); }, [tab, topView]); // eslint-disable-line

  async function handleApprove(c: PartnerCampaign) {
    try { await approveCampaign(c.id); toast.success(`Approved ${c.name}`); refresh(); }
    catch (e) { toast.error((e as Error).message); }
  }
  async function handleReject(c: PartnerCampaign) {
    if (!confirm(`Reject "${c.name}" back to draft?`)) return;
    try { await rejectCampaign(c.id); toast.success(`Rejected ${c.name}`); refresh(); }
    catch (e) { toast.error((e as Error).message); }
  }
  async function handlePause(c: PartnerCampaign) {
    try { await pauseCampaign(c.id); toast.success(`Paused ${c.name}`); refresh(); }
    catch (e) { toast.error((e as Error).message); }
  }
  async function handleResume(c: PartnerCampaign) {
    try { await resumeCampaign(c.id); toast.success(`Resumed ${c.name}`); refresh(); }
    catch (e) { toast.error((e as Error).message); }
  }
  async function handleCreateDemo() {
    if (creating) return; setCreating(true);
    try {
      const result = await createDemoSponsorship({ city: "Cincinnati", targetVibes: ["cocktails","speakeasy","rooftop","outdoor","intimate"] });
      toast.success(`Created demo sponsorship for ${result.venueName}`, { description: "Switch to Live tab to see it." });
      setTab("active");
    } catch (e) { toast.error("Couldn't create demo", { description: (e as Error).message }); }
    finally { setCreating(false); }
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
            <Link to="/admin/console"
              className="inline-flex items-center gap-1 rounded-full border-2 border-cream/20 bg-cream px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-widest hover:bg-gold">
              <ArrowLeft className="h-3 w-3" /> Admin
            </Link>
            <div>
              <h1 className="font-display text-2xl font-black tracking-tight">
                {topView === "creators" ? "Creator Applications" : "Partner Ads"}
              </h1>
              <p className="font-mono text-[11px] uppercase tracking-widest text-cream/50">
                {topView === "creators" ? "Review, approve and manage influencer applications" : "Approve, pause, and audit sponsored placements"}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* View switcher */}
            <div className="flex overflow-hidden rounded-full border-2 border-ink">
              <button type="button" onClick={() => setTopView("ads")}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-widest transition-colors ${topView === "ads" ? "bg-ink text-cream" : "bg-cream text-ink hover:bg-gold"}`}>
                <Megaphone className="h-3 w-3" /> Ads
              </button>
              <button type="button" onClick={() => setTopView("creators")}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-widest transition-colors ${topView === "creators" ? "bg-ink text-cream" : "bg-cream text-ink hover:bg-gold"}`}>
                <Sparkles className="h-3 w-3" /> Creators
              </button>
            </div>

            {topView === "ads" && (
              <>
                <button type="button" onClick={handleRunBackfill} disabled={verifyState.running}
                  className="inline-flex items-center gap-2 rounded-full border-2 border-emerald-600 bg-emerald-600/10 px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-widest text-emerald-700 hover:bg-emerald-600 hover:text-cream disabled:opacity-50">
                  {verifyState.running ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <BadgeCheck className="h-3.5 w-3.5" />}
                  {verifyState.running ? `Verifying ${verifyState.processed} (${verifyState.remaining ?? "?"} left)` :
                   verifyState.remaining !== null ? `Verify backfill (${verifyState.remaining} unverified)` : "Verify backfill"}
                </button>
                <button type="button" onClick={handleCreateDemo} disabled={creating}
                  className="inline-flex items-center gap-2 rounded-full border-2 border-purple bg-purple/10 px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-widest text-purple hover:bg-purple hover:text-cream disabled:opacity-50">
                  <PlusCircle className="h-3.5 w-3.5" /> {creating ? "Creating…" : "Demo sponsor"}
                </button>
                <button type="button" onClick={refresh} disabled={loading}
                  className="inline-flex items-center gap-1.5 rounded-full border-2 border-ink bg-cream px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-widest hover:bg-gold disabled:opacity-50">
                  <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
                </button>
              </>
            )}
          </div>
        </div>

        {topView === "ads" && (
          <div className="mx-auto flex max-w-6xl gap-2 overflow-x-auto px-5 pb-3">
            {TABS.map((t) => (
              <button key={t.key} type="button" onClick={() => setTab(t.key)}
                className={`shrink-0 rounded-full border-2 px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-widest transition-colors ${tab === t.key ? "border-ink bg-ink text-cream" : "border-cream/20 bg-cream hover:bg-gold"}`}>
                {t.label}
                {counts[t.key] !== undefined && tab === t.key && (
                  <span className="ml-1.5 rounded-full bg-cream/20 px-1.5 py-0.5 text-[8px]">{counts[t.key]}</span>
                )}
              </button>
            ))}
          </div>
        )}
      </header>

      {topView === "creators" && <CreatorApplications />}

      {topView === "ads" && (
        <main className="mx-auto max-w-6xl px-5 py-6">
          {error && <div className="mb-4 rounded-xl border-2 border-red-500 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
          {loading && campaigns.length === 0 ? (
            <div className="py-16 text-center text-sm text-cream/60">Loading campaigns…</div>
          ) : campaigns.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-cream/20 bg-cream/40 px-6 py-12 text-center">
              <Megaphone className="mx-auto h-8 w-8 text-cream/30" />
              <p className="mt-3 font-display text-lg font-bold">No campaigns in this bucket</p>
              <p className="mt-1 text-sm text-cream/60">
                {tab === "pending" ? "Nothing waiting for review. Try the Live tab, or create a demo sponsorship to test the flow." : "Try a different tab."}
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
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-widest ${
                            c.status === "active" ? "bg-emerald-500 text-cream" :
                            c.status === "pending" ? "bg-amber-500 text-cream" :
                            c.status === "paused" ? "bg-ink/30 text-cream" :
                            c.status === "expired" ? "bg-ink/15 text-cream/60" :
                            "bg-coral/80 text-cream"}`}>{c.status}</span>
                          <span className="font-mono text-[10px] uppercase tracking-widest text-cream/50">Boost {c.boost_strength}/10</span>
                        </div>
                        <h3 className="mt-1 font-display text-lg font-bold leading-snug">{c.name}</h3>
                        <div className="mt-0.5 text-sm text-cream/70">
                          {c.venue_name}{c.venue_city ? ` · ${c.venue_city}` : ""}{c.business_name ? ` · ${c.business_name}` : ""}{c.business_tier ? ` (${c.business_tier})` : ""}
                        </div>
                        <div className="mt-2 grid gap-1 text-[11px] text-cream/60 sm:grid-cols-2">
                          <div><span className="font-bold">Cities:</span> {(c.target_cities ?? []).join(", ") || "—"}</div>
                          <div><span className="font-bold">Vibes:</span> {(c.target_vibes ?? []).join(", ") || "—"}</div>
                          <div><span className="font-bold">Budget:</span> {c.daily_credit_budget}/day, spent {c.total_credits_spent}</div>
                          <div><span className="font-bold">Runs:</span> {new Date(c.start_date).toLocaleDateString()} → {c.end_date ? new Date(c.end_date).toLocaleDateString() : "no end"}</div>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-3 text-[11px] text-cream/70">
                          <span><span className="font-bold">{c.impressions}</span> impressions</span>
                          <span><span className="font-bold">{c.click_throughs}</span> clicks</span>
                          <span><span className="font-bold">{c.check_ins}</span> check-ins</span>
                          {c.impressions > 0 && <span><span className="font-bold">{((c.click_throughs / c.impressions) * 100).toFixed(1)}%</span> CTR</span>}
                        </div>
                      </div>
                      <div className="flex shrink-0 flex-wrap gap-1.5">
                        {c.status === "pending" && (
                          <>
                            <button type="button" onClick={() => handleApprove(c)} className="inline-flex items-center gap-1 rounded-full border-2 border-emerald-600 bg-emerald-600 px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-widest text-cream hover:bg-emerald-700"><CheckCircle2 className="h-3 w-3" /> Approve</button>
                            <button type="button" onClick={() => handleReject(c)} className="inline-flex items-center gap-1 rounded-full border-2 border-red-600 bg-cream px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-widest text-red-600 hover:bg-red-50"><Trash2 className="h-3 w-3" /> Reject</button>
                          </>
                        )}
                        {c.status === "active"  && <button type="button" onClick={() => handlePause(c)}  className="inline-flex items-center gap-1 rounded-full border-2 border-ink bg-cream px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-widest hover:bg-gold"><Pause className="h-3 w-3" /> Pause</button>}
                        {c.status === "paused"  && <button type="button" onClick={() => handleResume(c)} className="inline-flex items-center gap-1 rounded-full border-2 border-emerald-600 bg-emerald-600 px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-widest text-cream hover:bg-emerald-700"><Play className="h-3 w-3" /> Resume</button>}
                        {(c.status === "draft" || c.status === "expired") && <button type="button" onClick={() => handleResume(c)} className="inline-flex items-center gap-1 rounded-full border-2 border-emerald-600 bg-cream px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-widest text-emerald-600 hover:bg-emerald-50"><Play className="h-3 w-3" /> Activate</button>}
                      </div>
                    </div>
                  </article>
                </li>
              ))}
            </ul>
          )}
        </main>
      )}
    </div>
  );
}
