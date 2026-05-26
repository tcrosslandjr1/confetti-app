import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Zap,
  Lock,
  Eye,
  EyeOff,
  Check,
  X,
  ExternalLink,
  Flame,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/trend-radar")({
  component: TrendRadarPage,
});

/* ─────────────── PIN Gate (same pattern as admin.console) ─────────────── */

const ADMIN_PIN = "236166";
const PIN_KEY = "confetti.admin.pinOk";

function PinGate({ onUnlock }: { onUnlock: () => void }) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);
  const [show, setShow] = useState(false);

  const submit = () => {
    if (pin === ADMIN_PIN) {
      sessionStorage.setItem(PIN_KEY, "1");
      onUnlock();
    } else {
      setError(true);
      setPin("");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink px-4">
      <div className="w-full max-w-sm space-y-6 rounded-2xl border-2 border-cream/20 bg-ink p-8 text-center shadow-brut">
        <Lock className="mx-auto size-10 text-coral" />
        <h1 className="font-display text-2xl font-extrabold text-cream">Trend Radar</h1>
        <p className="text-sm text-cream/60">Enter admin PIN to continue</p>
        <div className="relative">
          <input
            type={show ? "text" : "password"}
            value={pin}
            onChange={(e) => {
              setPin(e.target.value);
              setError(false);
            }}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            maxLength={6}
            className="w-full rounded-xl border-2 border-cream/20 bg-ink px-4 py-3 text-center font-mono text-lg tracking-[0.3em] text-cream focus:border-coral focus:outline-none"
            placeholder="• • • • • •"
            autoFocus
          />
          <button
            type="button"
            onClick={() => setShow(!show)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-cream/40 hover:text-cream"
          >
            {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
        {error && <p className="text-sm font-bold text-red-400">Wrong PIN</p>}
        <Button variant="default" className="w-full" onClick={submit}>
          Unlock
        </Button>
      </div>
    </div>
  );
}

/* ─────────────── Trend Radar Dashboard ─────────────── */

type Tab = "pending" | "approved" | "all";

function TrendRadarDashboard() {
  const [activeTab, setActiveTab] = useState<Tab>("pending");
  const queryClient = useQueryClient();

  const { data: venues, isLoading } = useQuery({
    queryKey: ["admin", "trend-radar", activeTab],
    queryFn: async () => {
      let query = supabase
        .from("viral_venues")
        .select("*")
        .order("trend_score", { ascending: false })
        .limit(50);

      if (activeTab === "pending") query = query.eq("verified", false);
      if (activeTab === "approved") query = query.eq("verified", true);

      const { data } = await query;
      return data ?? [];
    },
  });

  const { data: stats } = useQuery({
    queryKey: ["admin", "trend-radar", "stats"],
    queryFn: async () => {
      const { count: total } = await supabase
        .from("viral_venues")
        .select("*", { count: "exact", head: true });
      const { count: pending } = await supabase
        .from("viral_venues")
        .select("*", { count: "exact", head: true })
        .eq("verified", false);
      const { count: approved } = await supabase
        .from("viral_venues")
        .select("*", { count: "exact", head: true })
        .eq("verified", true);
      return {
        total: total ?? 0,
        pending: pending ?? 0,
        approved: approved ?? 0,
      };
    },
  });

  async function handleApprove(venueId: string) {
    await supabase
      .from("viral_venues")
      .update({ verified: true })
      .eq("id", venueId);
    queryClient.invalidateQueries({ queryKey: ["admin", "trend-radar"] });
    toast.success("Venue approved — now live in customer feed");
  }

  async function handleReject(venueId: string) {
    await supabase
      .from("viral_venues")
      .delete()
      .eq("id", venueId);
    queryClient.invalidateQueries({ queryKey: ["admin", "trend-radar"] });
    toast("Venue rejected and removed");
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: "pending", label: `Pending (${stats?.pending ?? "…"})` },
    { key: "approved", label: `Approved (${stats?.approved ?? "…"})` },
    { key: "all", label: `All (${stats?.total ?? "…"})` },
  ];

  return (
    <div className="min-h-screen bg-cream pb-10">
      {/* Header */}
      <div className="border-b-2 border-cream/10 bg-white px-5 pb-5 pt-8">
        <div className="flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-coral">
          <Zap className="size-3.5" /> Admin
        </div>
        <h1 className="mt-2 font-display text-2xl font-extrabold tracking-tight text-cream">
          Trend Radar
        </h1>
        <p className="mt-1 text-[13px] text-cream/60">
          Review AI-discovered venues before they go live
        </p>

        {/* Stats row */}
        <div className="mt-4 flex gap-3">
          <div className="flex-1 rounded-xl border-2 border-cream/10 bg-cream/60 p-3 text-center">
            <div className="font-display text-xl font-extrabold text-cream">{stats?.total ?? "—"}</div>
            <div className="font-mono text-[9px] uppercase tracking-widest text-cream/45">Total</div>
          </div>
          <div className="flex-1 rounded-xl border-2 border-coral/30 bg-coral/5 p-3 text-center">
            <div className="font-display text-xl font-extrabold text-coral">{stats?.pending ?? "—"}</div>
            <div className="font-mono text-[9px] uppercase tracking-widest text-cream/45">Pending</div>
          </div>
          <div className="flex-1 rounded-xl border-2 border-green-500/30 bg-green-50 p-3 text-center">
            <div className="font-display text-xl font-extrabold text-green-600">{stats?.approved ?? "—"}</div>
            <div className="font-mono text-[9px] uppercase tracking-widest text-cream/45">Approved</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b-2 border-cream/10 bg-white px-5 py-2">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`rounded-full px-4 py-1.5 font-mono text-[10px] font-bold uppercase tracking-widest transition-all ${
              activeTab === t.key
                ? "bg-ink text-cream shadow-brut"
                : "text-cream/50 hover:bg-cream/5 hover:text-cream"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Venue cards */}
      <div className="space-y-3 px-5 pt-4">
        {isLoading && (
          <Card className="p-8 text-center">
            <Zap className="mx-auto size-6 animate-pulse text-coral" />
            <p className="mt-2 font-mono text-[10px] uppercase tracking-widest text-cream/40">
              Scanning the radar…
            </p>
          </Card>
        )}

        {!isLoading && !venues?.length && (
          <Card className="p-8 text-center">
            <p className="font-mono text-[11px] uppercase tracking-widest text-cream/35">
              {activeTab === "pending"
                ? "No venues waiting for review"
                : activeTab === "approved"
                  ? "No approved venues yet"
                  : "No venues discovered yet"}
            </p>
          </Card>
        )}

        {(venues ?? []).map((v: any) => (
          <Card key={v.id} className="overflow-hidden border-2 border-cream/10">
            <div className="flex gap-3 p-4">
              {/* Thumbnail */}
              {v.photo_url ? (
                <img
                  src={v.photo_url}
                  alt={v.venue_name}
                  className="size-20 shrink-0 rounded-xl border-2 border-cream/10 object-cover"
                />
              ) : (
                <div className="grid size-20 shrink-0 place-items-center rounded-xl border-2 border-dashed border-cream/15 bg-cream/[0.03]">
                  <Flame className="size-6 text-cream/20" />
                </div>
              )}

              {/* Info */}
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-display text-[15px] font-extrabold leading-tight text-cream">
                    {v.venue_name}
                  </h3>
                  <span className="shrink-0 rounded-full border-2 border-coral/30 bg-coral/10 px-2 py-0.5 font-mono text-[10px] font-bold text-coral">
                    🔥 {Number(v.trend_score ?? 0).toFixed(1)}
                  </span>
                </div>

                <div className="mt-0.5 font-mono text-[10px] uppercase tracking-wide text-cream/45">
                  {v.neighborhood}{v.city ? ` · ${v.city}` : ""}
                </div>

                {v.summary && (
                  <p className="mt-1.5 line-clamp-2 text-[12px] leading-relaxed text-cream/60">
                    {v.summary}
                  </p>
                )}

                {/* Tags */}
                {v.tags?.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {(v.tags as string[]).slice(0, 5).map((tag: string) => (
                      <span
                        key={tag}
                        className="rounded-full bg-cream/5 px-2 py-0.5 font-mono text-[9px] uppercase tracking-widest text-cream/50"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Meta */}
                <div className="mt-2 flex items-center gap-3 font-mono text-[9px] uppercase tracking-widest text-cream/35">
                  <span>{v.mention_count ?? 0} mentions</span>
                  <span>·</span>
                  <span>
                    {v.discovered_at
                      ? new Date(v.discovered_at).toLocaleDateString()
                      : "—"}
                  </span>
                  {v.source_urls && Object.keys(v.source_urls).length > 0 && (
                    <>
                      <span>·</span>
                      <span className="flex items-center gap-0.5">
                        <ExternalLink className="size-2.5" />{" "}
                        {Array.isArray(v.source_urls) ? v.source_urls.length : Object.keys(v.source_urls).length} sources
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Actions */}
            {!v.verified && (
              <div className="flex border-t-2 border-cream/10">
                <button
                  onClick={() => handleApprove(v.id)}
                  className="flex flex-1 items-center justify-center gap-1.5 py-2.5 font-mono text-[10px] font-bold uppercase tracking-widest text-green-600 transition-colors hover:bg-green-50"
                >
                  <Check className="size-3.5" /> Approve
                </button>
                <div className="w-px bg-ink/8" />
                <button
                  onClick={() => handleReject(v.id)}
                  className="flex flex-1 items-center justify-center gap-1.5 py-2.5 font-mono text-[10px] font-bold uppercase tracking-widest text-red-500 transition-colors hover:bg-red-50"
                >
                  <X className="size-3.5" /> Reject
                </button>
              </div>
            )}

            {v.verified && (
              <div className="flex items-center justify-center border-t-2 border-cream/10 py-2 font-mono text-[10px] uppercase tracking-widest text-green-600">
                <Check className="mr-1.5 size-3" /> Approved — live in feed
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}

/* ─────────────── Page Wrapper ─────────────── */

function TrendRadarPage() {
  const [pinOk, setPinOk] = useState(
    () => sessionStorage.getItem(PIN_KEY) === "1",
  );

  if (!pinOk) {
    return <PinGate onUnlock={() => setPinOk(true)} />;
  }

  return <TrendRadarDashboard />;
}
