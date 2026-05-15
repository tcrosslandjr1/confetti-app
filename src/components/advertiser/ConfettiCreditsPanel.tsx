import { useEffect, useState } from "react";
import {
  CREDIT_PACKAGES,
  buyCreditPackage,
  confettiToDollars,
  getAdvertiserBalance,
  listAdvertiserGrants,
  listPurchases,
  type AdvertiserBalance,
  type CreditPackage,
  type Grant,
  type Purchase,
} from "@/lib/confetti-credits";
import { Loader2, PartyPopper, Sparkles, Check, Gift } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

export function ConfettiCreditsPanel({ advertiserId }: { advertiserId: string }) {
  const [balance, setBalance] = useState<AdvertiserBalance | null>(null);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [grants, setGrants] = useState<Grant[]>([]);
  const [loading, setLoading] = useState(true);
  const [buyingKey, setBuyingKey] = useState<string | null>(null);

  const refresh = async () => {
    setLoading(true);
    const [b, p, g] = await Promise.all([
      getAdvertiserBalance(advertiserId),
      listPurchases(advertiserId),
      listAdvertiserGrants(advertiserId),
    ]);
    setBalance(b);
    setPurchases(p);
    setGrants(g);
    setLoading(false);
  };

  useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [advertiserId]);

  const handleBuy = async (pkg: CreditPackage) => {
    setBuyingKey(pkg.key);
    try {
      await buyCreditPackage(advertiserId, pkg);
      toast.success(`Added ${pkg.credits.toLocaleString()} Confetti to your balance`);
      await refresh();
    } catch (e) {
      toast.error((e as Error).message || "Couldn't complete purchase");
    } finally {
      setBuyingKey(null);
    }
  };

  return (
    <section className="mt-6 rounded-3xl border border-border bg-card p-5 shadow-card">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-primary">
            <PartyPopper className="h-3 w-3" /> Confetti Credits
          </div>
          <h2 className="mt-2 font-display text-xl font-bold">Reward your guests</h2>
          <p className="mt-1 max-w-xl text-sm text-muted-foreground">
            Buy Confetti credits and we'll automatically award them to anyone who books
            your venue. Guests redeem Confetti for cash off their next experience —
            bringing them back to you and the platform.
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-gradient-to-br from-primary/15 to-primary/5 p-4 text-right">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Balance
          </div>
          <div className="mt-1 font-display text-2xl font-bold text-primary">
            {loading ? "—" : (balance?.balance_credits ?? 0).toLocaleString()}
          </div>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
            Confetti
          </div>
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        {CREDIT_PACKAGES.map((pkg) => {
          const busy = buyingKey === pkg.key;
          const dollars = `$${(pkg.price_cents / 100).toFixed(0)}`;
          return (
            <div
              key={pkg.key}
              className={`relative rounded-2xl border p-4 transition-pop ${
                pkg.popular
                  ? "border-primary bg-primary/5 shadow-pop"
                  : "border-border bg-background"
              }`}
            >
              {pkg.popular && (
                <div className="absolute -top-2 left-4 rounded-full bg-primary px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-primary-foreground">
                  Most popular
                </div>
              )}
              <div className="flex items-center gap-1.5 text-sm font-semibold">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                {pkg.label}
              </div>
              <div className="mt-2 font-display text-2xl font-bold">
                {pkg.credits.toLocaleString()}{" "}
                <span className="text-xs font-normal text-muted-foreground">Confetti</span>
              </div>
              <div className="text-xs text-muted-foreground">{dollars} one-time</div>
              <p className="mt-2 text-xs text-muted-foreground">{pkg.blurb}</p>
              <button
                onClick={() => void handleBuy(pkg)}
                disabled={busy}
                className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground shadow-pop transition-pop active:scale-95 disabled:opacity-60"
              >
                {busy ? (
                  <>
                    <Loader2 className="h-3 w-3 animate-spin" /> Processing
                  </>
                ) : (
                  <>
                    <Check className="h-3 w-3" /> Buy {dollars}
                  </>
                )}
              </button>
            </div>
          );
        })}
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Recent purchases
          </div>
          {purchases.length === 0 ? (
            <div className="mt-2 rounded-xl border border-dashed border-border p-3 text-xs text-muted-foreground">
              No purchases yet.
            </div>
          ) : (
            <ul className="mt-2 space-y-1.5">
              {purchases.slice(0, 4).map((p) => (
                <li
                  key={p.id}
                  className="flex items-center justify-between rounded-xl border border-border bg-background px-3 py-2 text-xs"
                >
                  <span className="font-medium capitalize">{p.package_key} pack</span>
                  <span className="text-muted-foreground">
                    +{p.credits.toLocaleString()} ·{" "}
                    {formatDistanceToNow(new Date(p.created_at), { addSuffix: true })}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Recently rewarded guests
          </div>
          {grants.length === 0 ? (
            <div className="mt-2 rounded-xl border border-dashed border-border p-3 text-xs text-muted-foreground">
              <Gift className="mb-1 h-3 w-3" />
              Once guests start booking, you'll see them rewarded here.
            </div>
          ) : (
            <ul className="mt-2 space-y-1.5">
              {grants.slice(0, 4).map((g) => (
                <li
                  key={g.id}
                  className="flex items-center justify-between rounded-xl border border-border bg-background px-3 py-2 text-xs"
                >
                  <span className="truncate font-medium">{g.venue_name ?? "Booking"}</span>
                  <span className="text-muted-foreground">
                    {g.credits} Confetti · {confettiToDollars(g.credits)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
