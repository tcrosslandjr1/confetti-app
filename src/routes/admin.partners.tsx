import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  Eye,
  EyeOff,
  Lock,
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
  type CampaignStatus,
  type PartnerCampaign,
} from "@/lib/admin/partner-ads";

const ADMIN_PIN = "236166";
const PIN_KEY = "confetti.admin.pinOk";
const PIN_VALUE_KEY = "confetti.admin.pin";

export const Route = createFileRoute("/admin/partners")({
  component: AdminPartners,
});

function PinGate({ onUnlock }: { onUnlock: () => void }) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);
  const [show, setShow] = useState(false);

  const submit = () => {
    if (pin === ADMIN_PIN) {
      sessionStorage.setItem(PIN_KEY, "1");
      sessionStorage.setItem(PIN_VALUE_KEY, pin);
      onUnlock();
    } else {
      setError(true);
      setPin("");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink px-4">
      <div className="w-full max-w-sm space-y-6 rounded-2xl border-2 border-cream/20 bg-ink p-8 text-center shadow-brut">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border-2 border-coral bg-coral/10">
          <Lock className="h-7 w-7 text-coral" />
        </div>
        <div>
          <h1 className="font-display text-2xl font-black tracking-tight text-cream">Partner Ads</h1>
          <p className="mt-1 font-mono text-xs uppercase tracking-widest text-cream/50">
            Enter your PIN to continue
          </p>
        </div>
        <div className="space-y-3 text-left">
          <div className="relative">
            <input
              type={show ? "text" : "password"}
              value={pin}
              onChange={(e) => {
                setPin(e.target.value);
                setError(false);
              }}
              onKeyDown={(e) => e.key === "Enter" && submit()}
              placeholder="••••••"
              className="w-full rounded-xl border-2 border-cream/20 bg-cream/5 px-4 py-3 text-center font-mono text-2xl tracking-widest text-cream focus:border-coral focus:outline-none"
              autoFocus
            />
            <button
              type="button"
              onClick={() => setShow((s) => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-cream/40"
            >
              {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {error && (
            <p className="text-center text-xs text-coral">Wrong PIN. Try again.</p>
          )}
          <button
            type="button"
            onClick={submit}
            className="w-full rounded-xl bg-coral px-4 py-3 font-mono text-sm font-black uppercase tracking-widest text-ink hover:bg-coral/90"
          >
            Unlock
          </button>
        </div>
      </div>
    </div>
  );
}

const TABS: { key: CampaignStatus | "all"; label: string }[] = [
  { key: "pending", label: "Pending review" },
  { key: "active", label: "Live" },
  { key: "paused", label: "Paused" },
  { key: "draft", label: "Draft / rejected" },
  { key: "expired", label: "Expired" },
  { key: "all", label: "All" },
];

function AdminPartners() {
  const [unlocked, setUnlocked] = useState(() =>
    typeof sessionStorage !== "undefined" && sessionStorage.getItem(PIN_KEY) === "1",
  );
  const [tab, setTab] = useState<CampaignStatus | "all">("pending");
  const [campaigns, setCampaigns] = useState<PartnerCampaign[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

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
    if (!unlocked) return;
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unlocked, tab]);

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

  if (!unlocked) return <PinGate onUnlock={() => setUnlocked(true)} />;

  return (
    <div className="min-h-screen bg-cream">
      <header className="border-b-2 border-ink/10 bg-cream">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-5 py-4">
          <div className="flex items-center gap-3">
            <Link
              to="/admin/console"
              className="inline-flex items-center gap-1 rounded-full border-2 border-ink/20 bg-cream px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-widest hover:bg-gold"
            >
              <ArrowLeft className="h-3 w-3" /> Admin
            </Link>
            <div>
              <h1 className="font-display text-2xl font-black tracking-tight">Partner Ads</h1>
              <p className="font-mono text-[11px] uppercase tracking-widest text-ink/50">
                Approve, pause, and audit sponsored placements
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
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
                  : "border-ink/20 bg-cream hover:bg-gold"
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
          <div className="py-16 text-center text-sm text-ink/60">Loading campaigns…</div>
        ) : campaigns.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-ink/20 bg-cream/40 px-6 py-12 text-center">
            <Megaphone className="mx-auto h-8 w-8 text-ink/30" />
            <p className="mt-3 font-display text-lg font-bold">No campaigns in this bucket</p>
            <p className="mt-1 text-sm text-ink/60">
              {tab === "pending"
                ? "Nothing waiting for review. Try the Live tab, or create a demo sponsorship to test the flow."
                : "Try a different tab."}
            </p>
          </div>
        ) : (
          <ul className="space-y-3">
            {campaigns.map((c) => (
              <li key={c.id}>
                <article className="rounded-2xl border-2 border-ink/10 bg-cream p-4 shadow-card">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-widest ${
                            c.status === "active"
                              ? "bg-emerald-500 text-cream"
                              : c.status === "pending"
                                ? "bg-amber-500 text-ink"
                                : c.status === "paused"
                                  ? "bg-ink/30 text-cream"
                                  : c.status === "expired"
                                    ? "bg-ink/15 text-ink/60"
                                    : "bg-coral/80 text-cream"
                          }`}
                        >
                          {c.status}
                        </span>
                        <span className="font-mono text-[10px] uppercase tracking-widest text-ink/50">
                          Boost {c.boost_strength}/10
                        </span>
                      </div>
                      <h3 className="mt-1 font-display text-lg font-bold leading-snug">
                        {c.name}
                      </h3>
                      <div className="mt-0.5 text-sm text-ink/70">
                        {c.venue_name}
                        {c.venue_city ? ` · ${c.venue_city}` : ""}
                        {c.business_name ? ` · ${c.business_name}` : ""}
                        {c.business_tier ? ` (${c.business_tier})` : ""}
                      </div>
                      <div className="mt-2 grid gap-1 text-[11px] text-ink/60 sm:grid-cols-2">
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
                      <div className="mt-2 flex flex-wrap gap-3 text-[11px] text-ink/70">
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
