import { useEffect, useState } from "react";
import {
  type AdvertiserSubscription,
  cancelSubscription,
  getMySubscription,
  PACKAGES,
  type PackageTier,
  startStubCheckout,
} from "@/lib/ads";
import { Loader2, Check, CreditCard, Sparkles } from "lucide-react";
import { toast } from "sonner";

type Props = {
  advertiserId: string;
  onChange?: (sub: AdvertiserSubscription | null) => void;
};

export function SubscriptionPanel({ advertiserId, onChange }: Props) {
  const [sub, setSub] = useState<AdvertiserSubscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyTier, setBusyTier] = useState<PackageTier | null>(null);

  useEffect(() => {
    let cancelled = false;
    getMySubscription(advertiserId).then((s) => {
      if (cancelled) return;
      setSub(s);
      setLoading(false);
      onChange?.(s);
    });
    return () => {
      cancelled = true;
    };
  }, [advertiserId, onChange]);

  async function pick(tier: PackageTier) {
    setBusyTier(tier);
    try {
      const next = await startStubCheckout(advertiserId, tier);
      setSub(next);
      onChange?.(next);
      toast.success(`${PACKAGES[tier].label} plan active (stub checkout)`);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusyTier(null);
    }
  }

  async function cancel() {
    if (!confirm("Cancel subscription? Active campaigns will continue until period end.")) return;
    try {
      await cancelSubscription(advertiserId);
      const s = await getMySubscription(advertiserId);
      setSub(s);
      onChange?.(s);
      toast.success("Subscription cancelled");
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  if (loading) {
    return (
      <div className="rounded-2xl border border-border bg-card p-4 text-sm text-muted-foreground">
        <Loader2 className="mr-2 inline h-4 w-4 animate-spin" /> Loading plan…
      </div>
    );
  }

  return (
    <section className="rounded-3xl border-2 border-foreground/10 bg-gradient-to-br from-card to-card/50 p-5 shadow-card">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-wider text-primary">
            <CreditCard className="h-3 w-3" /> Subscription
          </p>
          <h2 className="mt-1 font-display text-xl font-bold">
            {sub?.status === "active"
              ? `${PACKAGES[sub.tier].label} plan`
              : "Pick a plan to go live"}
          </h2>
          {sub?.status === "active" && sub.current_period_end && (
            <p className="text-xs text-muted-foreground">
              Renews {new Date(sub.current_period_end).toLocaleDateString()} ·{" "}
              {sub.stub ? "Stub billing (no card charged)" : "Live billing"}
            </p>
          )}
          {sub?.status === "cancelled" && (
            <p className="text-xs text-amber-600">
              Cancelled — re-pick a plan to reactivate.
            </p>
          )}
        </div>
        {sub?.status === "active" && (
          <button
            onClick={cancel}
            className="rounded-full border border-border px-3 py-1.5 text-xs hover:bg-muted"
          >
            Cancel
          </button>
        )}
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {(Object.keys(PACKAGES) as PackageTier[]).map((tier) => {
          const pkg = PACKAGES[tier];
          const active = sub?.status === "active" && sub.tier === tier;
          return (
            <div
              key={tier}
              className={`relative rounded-2xl border p-4 transition ${
                active
                  ? "border-primary bg-primary/5 shadow-pop"
                  : "border-border bg-background hover:border-foreground/30"
              }`}
            >
              {active && (
                <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-primary px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-primary-foreground">
                  <Check className="h-2.5 w-2.5" /> Current
                </span>
              )}
              <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                {pkg.label}
              </div>
              <div className="mt-1 font-display text-2xl font-bold">{pkg.price}</div>
              <p className="mt-1 text-xs text-muted-foreground">{pkg.blurb}</p>
              <ul className="mt-3 space-y-1 text-xs">
                {pkg.perks.map((p) => (
                  <li key={p} className="flex items-start gap-1.5">
                    <Check className="mt-0.5 h-3 w-3 shrink-0 text-primary" />
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
              <button
                onClick={() => pick(tier)}
                disabled={active || busyTier !== null}
                className={`mt-4 inline-flex w-full items-center justify-center gap-1.5 rounded-full px-3 py-2 text-xs font-bold transition disabled:opacity-60 ${
                  active
                    ? "bg-muted text-muted-foreground"
                    : "bg-foreground text-background hover:opacity-90"
                }`}
              >
                {busyTier === tier && <Loader2 className="h-3 w-3 animate-spin" />}
                {active ? "Active" : tier === "starter" ? "Switch to free" : "Choose plan"}
              </button>
            </div>
          );
        })}
      </div>

      <p className="mt-3 flex items-center gap-1.5 text-[11px] text-muted-foreground">
        <Sparkles className="h-3 w-3" /> Stub billing for now — no card needed. Real Stripe
        checkout coming soon.
      </p>
    </section>
  );
}
