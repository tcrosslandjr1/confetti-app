import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Gift, Copy, Check, ArrowRight } from "lucide-react";
import {
  getOrCreateMyReferralCode,
  getMyReferralStats,
  buildReferralLink,
  type MyReferralStats,
} from "@/lib/referrals";

export function ReferralWidget() {
  const [code, setCode] = useState<string | null>(null);
  const [stats, setStats] = useState<MyReferralStats | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      const [c, s] = await Promise.all([getOrCreateMyReferralCode(), getMyReferralStats()]);
      if (!alive) return;
      setCode(c);
      setStats(s);
    })();
    return () => {
      alive = false;
    };
  }, []);

  const onCopy = async () => {
    if (!code) return;
    try {
      await navigator.clipboard.writeText(buildReferralLink(code));
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };

  return (
    <div className="relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-primary/10 via-card to-card p-5 shadow-card">
      <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-primary/20 blur-3xl" />
      <div className="relative">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-primary">
          <Gift className="h-4 w-4" /> Refer & earn
        </div>
        <h3 className="mt-2 font-display text-xl font-bold leading-tight">
          Give $25 off, get a $25 gift card
        </h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Friends get a discount on their first booking. You get a $25 gift card the moment they
          book.
        </p>

        <div className="mt-4 flex items-center gap-2">
          <div className="flex-1 truncate rounded-xl border border-dashed border-border bg-background px-3 py-2.5 font-mono text-sm">
            {code ?? "…"}
          </div>
          <button
            onClick={onCopy}
            disabled={!code}
            className="inline-flex items-center gap-1.5 rounded-xl bg-foreground px-3 py-2.5 text-xs font-semibold text-background transition active:scale-95 disabled:opacity-50"
          >
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? "Copied" : "Copy link"}
          </button>
        </div>

        {stats && (
          <div className="mt-4 grid grid-cols-3 gap-2 text-center">
            <Stat label="Invited" value={stats.invited} />
            <Stat label="Joined" value={stats.signedUp} />
            <Stat label="Earned" value={`$${(stats.earnedCents / 100).toFixed(0)}`} />
          </div>
        )}

        <Link
          to={"/portal/refer" as "/"}
          className="mt-4 inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-border bg-background py-2.5 text-xs font-semibold transition hover:bg-accent"
        >
          Open referral hub <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-xl bg-background/70 py-2">
      <div className="font-display text-lg font-bold leading-none">{value}</div>
      <div className="mt-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
    </div>
  );
}
