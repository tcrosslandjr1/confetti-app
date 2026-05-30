import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Loader2,
  Users,
  DollarSign,
  Sparkles,
  CheckCircle2,
  Circle,
} from "lucide-react";
import { toast } from "sonner";
import {
  claimItem,
  getClaimerName,
  getClaimerToken,
  getSharedHangout,
  setClaimerName,
  subscribeClaims,
  unclaimItem,
  type ClaimCategory,
  type HangoutClaim,
  type SharedHangoutFetch,
} from "@/lib/hangout-collab";

export const Route = createFileRoute("/hangout/$token")({
  component: SharedHangoutPage,
});

function SharedHangoutPage() {
  const { token } = Route.useParams();
  const [data, setData] = useState<SharedHangoutFetch | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [name, setName] = useState(() => getClaimerName(""));
  const myToken = getClaimerToken();

  const refresh = useCallback(async () => {
    try {
      const d = await getSharedHangout(token);
      setData(d);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Live sync — subscribe once we know the hangout id.
  useEffect(() => {
    if (!data?.hangout?.id) return;
    return subscribeClaims(data.hangout.id, refresh);
  }, [data?.hangout?.id, refresh]);

  // Index claims by "<category>:<key>" for fast lookup.
  const claimsByKey = useMemo(() => {
    const m = new Map<string, HangoutClaim>();
    for (const c of data?.claims ?? []) {
      m.set(`${c.item_category}:${c.item_key}`, c);
    }
    return m;
  }, [data?.claims]);

  async function handleToggle(cat: ClaimCategory, idx: number, label: string) {
    if (!data) return;
    const trimmed = name.trim();
    if (!trimmed) {
      toast.error("Add your name first so the host knows who's bringing what");
      return;
    }
    setClaimerName(trimmed);
    const key = String(idx);
    const existing = claimsByKey.get(`${cat}:${key}`);
    try {
      if (existing && existing.claimed_by_token === myToken) {
        await unclaimItem({ token, category: cat, itemKey: key });
      } else if (existing) {
        toast(`Already claimed by ${existing.claimed_by_name}`);
        return;
      } else {
        await claimItem({ token, category: cat, itemKey: key, itemLabel: label, name: trimmed });
      }
      refresh();
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  if (loading) {
    return (
      <div className="grid min-h-[60vh] place-items-center">
        <Loader2 className="size-6 animate-spin text-cream/40" />
      </div>
    );
  }
  if (err || !data) {
    return (
      <div className="grid min-h-[60vh] place-items-center px-4">
        <div className="rounded-3xl border-2 border-ink bg-cream px-6 py-10 text-center shadow-brut max-w-sm w-full">
          <div className="mb-4 text-4xl">🎟️</div>
          <h1 className="font-display text-xl font-extrabold tracking-tight text-ink">
            This hangout has expired
          </h1>
          <p className="mt-2 text-sm text-ink/60">
            The link may have expired or the hangout was cancelled. Ask the host for a fresh link.
          </p>
          <div className="mt-6 flex flex-col gap-3">
            <Link
              to="/app/plan"
              className="inline-flex items-center justify-center rounded-xl border-2 border-ink bg-coral px-4 py-2.5 font-mono text-[11px] font-bold uppercase tracking-widest text-white shadow-brut transition-pop hover:-translate-y-0.5"
            >
              Plan my own night
            </Link>
            <Link
              to="/app"
              className="font-mono text-[10px] uppercase tracking-widest text-ink/50 underline"
            >
              ← Back to Confetti
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const { hangout: h } = data;
  const p = h.plan;
  const claimedCount = data.claims.length;
  const totalClaimable =
    (p.menu?.length ?? 0) +
    (p.drinks?.length ?? 0) +
    (p.supplies?.length ?? 0) +
    (p.grocery_list?.length ?? 0);

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 pb-24">
      {/* Title card */}
      <div className="rounded-3xl border-2 border-ink bg-cream p-6 shadow-brut">
        <div className="font-mono text-[10px] font-bold uppercase tracking-widest text-coral">
          {h.host_name ? `${h.host_name} is hosting` : "You're invited"}
          {h.city ? ` · ${h.city}` : ""}
        </div>
        <h1 className="mt-1 font-display text-3xl font-extrabold leading-tight tracking-tight">
          {p.title}
        </h1>
        <p className="mt-2 text-sm text-cream/70">{p.summary}</p>
        <div className="mt-4 flex flex-wrap gap-3 text-[12px] font-bold text-cream/80">
          <span className="inline-flex items-center gap-1"><Users className="size-3.5" /> {p.guest_count}</span>
          <span className="inline-flex items-center gap-1"><DollarSign className="size-3.5" /> {p.budget_estimate}</span>
          {h.start_time && (
            <span className="rounded-full bg-gold/40 px-2 py-0.5 font-mono text-[10px]">starts {h.start_time}</span>
          )}
          <span className="ml-auto rounded-full border-2 border-purple/30 bg-purple/10 px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-widest text-purple">
            <Sparkles className="mr-0.5 inline size-2.5" /> {claimedCount}/{totalClaimable} claimed
          </span>
        </div>
      </div>

      {/* Your name */}
      <div className="mt-4 rounded-2xl border-2 border-cream/20 bg-cream/60 p-4">
        <label className="block">
          <div className="font-mono text-[10px] font-bold uppercase tracking-widest text-cream/60">
            Your name (so the host knows who's bringing what)
          </div>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Tyler"
            className="mt-1 w-full rounded-xl border-2 border-cream/20 bg-white px-3 py-2 text-sm focus:border-ink focus:outline-none"
            maxLength={40}
          />
        </label>
      </div>

      <ClaimSection
        title="I'll bring food"
        category="menu"
        items={(p.menu ?? []).map((m) => `${m.quantity} ${m.item}`)}
        claimsByKey={claimsByKey}
        onToggle={handleToggle}
        myToken={myToken}
      />
      <ClaimSection
        title="I'll bring drinks"
        category="drinks"
        items={(p.drinks ?? []).map((d) => `${d.quantity} ${d.item}`)}
        claimsByKey={claimsByKey}
        onToggle={handleToggle}
        myToken={myToken}
      />
      <ClaimSection
        title="I'll grab supplies"
        category="supplies"
        items={p.supplies ?? []}
        claimsByKey={claimsByKey}
        onToggle={handleToggle}
        myToken={myToken}
      />
      <ClaimSection
        title="I'll pick up groceries"
        category="grocery"
        items={p.grocery_list ?? []}
        claimsByKey={claimsByKey}
        onToggle={handleToggle}
        myToken={myToken}
      />
    </div>
  );
}

function ClaimSection({
  title,
  category,
  items,
  claimsByKey,
  onToggle,
  myToken,
}: {
  title: string;
  category: ClaimCategory;
  items: string[];
  claimsByKey: Map<string, HangoutClaim>;
  onToggle: (cat: ClaimCategory, idx: number, label: string) => void;
  myToken: string;
}) {
  if (items.length === 0) return null;
  return (
    <section className="mt-4 rounded-2xl border-2 border-cream/15 bg-cream p-4">
      <h2 className="font-display text-base font-extrabold tracking-tight">{title}</h2>
      <ul className="mt-2 space-y-1.5">
        {items.map((label, idx) => {
          const key = `${category}:${idx}`;
          const claim = claimsByKey.get(key);
          const mine = claim?.claimed_by_token === myToken;
          return (
            <li key={idx}>
              <button
                type="button"
                onClick={() => onToggle(category, idx, label)}
                disabled={!!claim && !mine}
                className={`flex w-full items-center gap-2 rounded-xl border-2 px-3 py-2 text-left text-[13px] transition-colors ${
                  mine
                    ? "border-emerald-500 bg-emerald-50 text-emerald-900"
                    : claim
                      ? "border-cream/15 bg-cream/[0.04] text-cream/60"
                      : "border-cream/15 bg-cream hover:border-ink hover:bg-gold/30"
                }`}
              >
                {claim ? (
                  <CheckCircle2 className={`size-4 shrink-0 ${mine ? "text-emerald-600" : "text-cream/40"}`} />
                ) : (
                  <Circle className="size-4 shrink-0 text-cream/30" />
                )}
                <span className="flex-1">{label}</span>
                {claim && (
                  <span className="shrink-0 rounded-full bg-cream/10 px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-widest text-cream/70">
                    {claim.claimed_by_name}
                  </span>
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
