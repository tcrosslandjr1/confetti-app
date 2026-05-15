import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import {
  CONFETTI_PER_DOLLAR,
  cancelRedemption,
  confettiToDollars,
  createRedemption,
  listUserGrants,
  listUserRedemptions,
  userBalance,
  type Grant,
  type Redemption,
} from "@/lib/confetti-credits";
import { QRCodeSVG } from "qrcode.react";
import {
  ArrowLeft,
  Copy,
  Gift,
  Loader2,
  PartyPopper,
  Sparkles,
  Ticket,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

export const Route = createFileRoute("/portal/wallet")({
  head: () => ({ meta: [{ title: "Wallet — Confetti" }] }),
  component: WalletPage,
});

const MOCK_GRANTS: Grant[] = [
  {
    id: "mg1",
    user_id: "mock",
    advertiser_id: null,
    venue_name: "Le Diplomate",
    booking_id: null,
    credits: 250,
    reason: "booking",
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "mg2",
    user_id: "mock",
    advertiser_id: null,
    venue_name: "Rose's Luxury",
    booking_id: null,
    credits: 400,
    reason: "booking",
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "mg3",
    user_id: "mock",
    advertiser_id: null,
    venue_name: "Maydan",
    booking_id: null,
    credits: 150,
    reason: "check-in",
    created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

function WalletPage() {
  const { user } = useAuth();
  const [grants, setGrants] = useState<Grant[]>([]);
  const [redemptions, setRedemptions] = useState<Redemption[]>([]);
  const [loading, setLoading] = useState(true);
  const [amount, setAmount] = useState(200);
  const [busy, setBusy] = useState(false);
  const [activeRedemption, setActiveRedemption] = useState<Redemption | null>(null);

  const refresh = async () => {
    if (!user) return;
    setLoading(true);
    const [g, r] = await Promise.all([
      listUserGrants(user.id),
      listUserRedemptions(user.id),
    ]);
    setGrants(g.length > 0 ? g : MOCK_GRANTS);
    setRedemptions(r);
    setLoading(false);
  };

  useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const balance = useMemo(() => userBalance(grants, redemptions), [grants, redemptions]);
  const pendingRedemptions = redemptions.filter((r) => r.status === "pending");

  const handleRedeem = async () => {
    if (!user) {
      toast.error("Please sign in");
      return;
    }
    if (amount > balance) {
      toast.error("Not enough Confetti");
      return;
    }
    if (amount < 100) {
      toast.error("Minimum redemption is 100 Confetti");
      return;
    }
    setBusy(true);
    try {
      const r = await createRedemption(user.id, amount);
      setActiveRedemption(r);
      await refresh();
      toast.success("Show this code at the venue to redeem");
    } catch (e) {
      toast.error((e as Error).message || "Couldn't create redemption");
    } finally {
      setBusy(false);
    }
  };

  const handleCancel = async (id: string) => {
    await cancelRedemption(id);
    toast.success("Redemption cancelled");
    setActiveRedemption(null);
    await refresh();
  };

  const copyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      toast.success("Code copied");
    } catch {
      toast.error("Couldn't copy");
    }
  };

  return (
    <div className="px-5 pt-10 pb-32">
      <Link
        to="/portal"
        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-3 w-3" /> Back
      </Link>

      <div className="mt-3">
        <div className="text-xs uppercase tracking-wider text-muted-foreground">Wallet</div>
        <h1 className="mt-1 font-display text-3xl font-bold">Your Confetti</h1>
      </div>

      {/* Balance card */}
      <div className="mt-5 rounded-3xl bg-gradient-to-br from-primary to-primary/70 p-5 text-primary-foreground shadow-pop">
        <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider opacity-80">
          <PartyPopper className="h-3 w-3" /> Available balance
        </div>
        <div className="mt-2 font-display text-5xl font-bold">
          {loading ? "—" : balance.toLocaleString()}
        </div>
        <div className="mt-1 text-sm opacity-90">
          Confetti · worth {confettiToDollars(balance)} cash
        </div>
        <div className="mt-3 text-[11px] opacity-80">
          Earn Confetti by booking, checking in, and inviting friends.{" "}
          {CONFETTI_PER_DOLLAR} Confetti = $1.00 cash off your next experience.
        </div>
      </div>

      {/* Active redemption */}
      {activeRedemption && (
        <div className="mt-5 rounded-3xl border-2 border-primary bg-card p-5 text-center shadow-pop">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-primary">
            <Ticket className="h-3 w-3" /> Active redemption
          </div>
          <div className="mt-3 font-display text-2xl font-bold">
            {confettiToDollars(activeRedemption.credits)} off
          </div>
          <div className="text-xs text-muted-foreground">
            {activeRedemption.credits.toLocaleString()} Confetti
          </div>

          <div className="mt-4 flex justify-center">
            <div className="rounded-2xl bg-white p-3 shadow-card">
              <QRCodeSVG value={activeRedemption.redeem_code} size={160} />
            </div>
          </div>

          <button
            onClick={() => copyCode(activeRedemption.redeem_code)}
            className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5 font-mono text-sm font-semibold tracking-wider hover:bg-muted/80"
          >
            {activeRedemption.redeem_code} <Copy className="h-3 w-3" />
          </button>

          <p className="mt-3 text-xs text-muted-foreground">
            Show this code or QR to venue staff at checkout. Valid until used.
          </p>

          <button
            onClick={() => void handleCancel(activeRedemption.id)}
            className="mt-3 inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-destructive"
          >
            <X className="h-3 w-3" /> Cancel & return Confetti
          </button>
        </div>
      )}

      {/* Redeem form */}
      {!activeRedemption && (
        <div className="mt-5 rounded-3xl border border-border bg-card p-5 shadow-card">
          <div className="font-semibold">Cash out your Confetti</div>
          <p className="mt-1 text-xs text-muted-foreground">
            Generate a redemption code worth real cash off your next booking.
          </p>

          <div className="mt-4 grid grid-cols-3 gap-2">
            {[100, 250, 500].map((v) => (
              <button
                key={v}
                onClick={() => setAmount(v)}
                disabled={v > balance}
                className={`rounded-2xl border px-3 py-3 text-center transition-pop active:scale-95 disabled:opacity-40 ${
                  amount === v
                    ? "border-primary bg-primary/10"
                    : "border-border bg-background hover:bg-muted/40"
                }`}
              >
                <div className="font-display text-lg font-bold">{v}</div>
                <div className="text-[10px] text-muted-foreground">
                  ={confettiToDollars(v)}
                </div>
              </button>
            ))}
          </div>

          <button
            onClick={() => void handleRedeem()}
            disabled={busy || balance < 100}
            className="mt-4 inline-flex w-full items-center justify-center gap-1.5 rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-pop transition-pop active:scale-95 disabled:opacity-50"
          >
            {busy ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Generating
              </>
            ) : (
              <>
                <Ticket className="h-4 w-4" /> Generate redemption code
              </>
            )}
          </button>
          {balance < 100 && (
            <p className="mt-2 text-center text-[11px] text-muted-foreground">
              Earn at least 100 Confetti to redeem.
            </p>
          )}
        </div>
      )}

      {/* Pending redemptions */}
      {pendingRedemptions.length > 0 && !activeRedemption && (
        <div className="mt-5">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Active codes
          </div>
          <ul className="mt-2 space-y-2">
            {pendingRedemptions.map((r) => (
              <li
                key={r.id}
                className="flex items-center justify-between rounded-2xl border border-border bg-card p-3 shadow-card"
              >
                <div>
                  <div className="font-mono text-sm font-semibold tracking-wider">
                    {r.redeem_code}
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    {confettiToDollars(r.credits)} ·{" "}
                    {formatDistanceToNow(new Date(r.created_at), { addSuffix: true })}
                  </div>
                </div>
                <button
                  onClick={() => setActiveRedemption(r)}
                  className="rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground"
                >
                  Show
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Earnings history */}
      <div className="mt-6">
        <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          How you earned it
        </div>
        {grants.length === 0 ? (
          <div className="mt-2 rounded-2xl border border-dashed border-border p-6 text-center">
            <Gift className="mx-auto h-6 w-6 text-muted-foreground" />
            <div className="mt-2 text-sm font-semibold">No Confetti yet</div>
            <p className="mt-1 text-xs text-muted-foreground">
              Book a venue to start earning.
            </p>
          </div>
        ) : (
          <ul className="mt-2 space-y-1.5">
            {grants.slice(0, 12).map((g) => (
              <li
                key={g.id}
                className="flex items-center justify-between rounded-2xl border border-border bg-card px-4 py-3 shadow-card"
              >
                <div>
                  <div className="text-sm font-semibold">
                    {g.venue_name ?? "Booking reward"}
                  </div>
                  <div className="text-[11px] text-muted-foreground capitalize">
                    {g.reason} ·{" "}
                    {formatDistanceToNow(new Date(g.created_at), { addSuffix: true })}
                  </div>
                </div>
                <div className="inline-flex items-center gap-1 text-sm font-bold text-primary">
                  <Sparkles className="h-3.5 w-3.5" />+{g.credits}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
