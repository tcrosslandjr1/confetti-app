import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Gift,
  Copy,
  Check,
  Mail,
  Share2,
  Sparkles,
  Loader2,
  Ticket,
  Users,
  Trophy,
  Flame,
  Star,
  Crown,
  Lock,
  Medal,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import {
  buildReferralLink,
  getMyReferralBadges,
  getMyReferralStats,
  getOrCreateMyReferralCode,
  getReferralLeaderboard,
  inviteByEmail,
  listMyInvites,
  listMyRewards,
  type LeaderboardRow,
  type MyReferralStats,
  type ReferralBadge,
} from "@/lib/referrals";

export const Route = createFileRoute("/portal/refer")({
  head: () => ({
    meta: [
      { title: "Refer friends — Concierge" },
      {
        name: "description",
        content:
          "Share Concierge. Friends get $25 off their first booking, you get a $25 gift card.",
      },
    ],
  }),
  component: ReferPage,
});

function ReferPage() {
  const { user } = useAuth();
  const [code, setCode] = useState<string | null>(null);
  const [stats, setStats] = useState<MyReferralStats | null>(null);
  const [invites, setInvites] = useState<Awaited<ReturnType<typeof listMyInvites>>>([]);
  const [rewards, setRewards] = useState<Awaited<ReturnType<typeof listMyRewards>>>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardRow[]>([]);
  const [badges, setBadges] = useState<ReferralBadge[]>([]);
  const [emailsRaw, setEmailsRaw] = useState("");
  const [sending, setSending] = useState(false);
  const [sentMsg, setSentMsg] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const refresh = async () => {
    const [c, s, i, r, lb, b] = await Promise.all([
      getOrCreateMyReferralCode(),
      getMyReferralStats(),
      listMyInvites(),
      listMyRewards(),
      getReferralLeaderboard(20),
      getMyReferralBadges(),
    ]);
    setCode(c);
    setStats(s);
    setInvites(i);
    setRewards(r);
    setLeaderboard(lb);
    setBadges(b);
  };

  useEffect(() => {
    refresh();
  }, []);

  const link = code ? buildReferralLink(code) : "";

  const onCopy = async () => {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };

  const onShare = async () => {
    if (!link || typeof navigator === "undefined" || !navigator.share) return onCopy();
    try {
      await navigator.share({
        title: "Concierge — $25 off your first booking",
        text: "Use my link to get $25 off your first booking on Concierge.",
        url: link,
      });
    } catch {}
  };

  const onSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setSentMsg(null);
    try {
      const list = emailsRaw.split(/[\s,;]+/).filter(Boolean);
      const n = await inviteByEmail(list);
      setSentMsg(
        n > 0
          ? `Opened your mail client for ${n} invite${n > 1 ? "s" : ""}.`
          : "No valid emails found.",
      );
      setEmailsRaw("");
      await refresh();
    } catch (err: any) {
      setSentMsg(err?.message ?? "Could not send.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-primary/15 via-card to-card p-6 shadow-card sm:p-10">
        <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-primary/30 blur-3xl" />
        <div className="absolute -bottom-20 -left-20 h-56 w-56 rounded-full bg-secondary/30 blur-3xl" />
        <div className="relative max-w-2xl">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-primary">
            <Sparkles className="h-4 w-4" /> Refer & earn
          </div>
          <h1 className="mt-3 font-display text-3xl font-bold leading-tight sm:text-5xl">
            Share the city. Pocket the rewards.
          </h1>
          <p className="mt-3 max-w-xl text-sm text-muted-foreground sm:text-base">
            Send a friend $25 off their first Concierge booking. The moment they book, we'll drop a{" "}
            <span className="font-semibold text-foreground">$25 gift card</span> in your account.
          </p>

          <div className="mt-6 grid grid-cols-3 gap-3 sm:max-w-md">
            <Stat icon={Users} label="Invited" value={stats?.invited ?? 0} />
            <Stat icon={Ticket} label="Joined" value={stats?.signedUp ?? 0} />
            <Stat
              icon={Gift}
              label="Earned"
              value={`$${((stats?.earnedCents ?? 0) / 100).toFixed(0)}`}
            />
          </div>
        </div>
      </section>

      {/* Share */}
      <section className="rounded-3xl border border-border bg-card p-6 shadow-card">
        <h2 className="font-display text-xl font-bold">Your invite link</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Share this anywhere — texts, DMs, group chats.
        </p>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <div className="flex-1 truncate rounded-2xl border border-dashed border-border bg-background px-4 py-3 font-mono text-sm">
            {link || "…"}
          </div>
          <div className="flex gap-2">
            <button
              onClick={onCopy}
              disabled={!link}
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-2xl bg-foreground px-4 py-3 text-sm font-semibold text-background transition active:scale-95 disabled:opacity-50 sm:flex-initial"
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? "Copied" : "Copy"}
            </button>
            <button
              onClick={onShare}
              disabled={!link}
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-2xl border border-border bg-background px-4 py-3 text-sm font-semibold transition hover:bg-accent disabled:opacity-50 sm:flex-initial"
            >
              <Share2 className="h-4 w-4" /> Share
            </button>
          </div>
        </div>
        {code && (
          <p className="mt-3 text-xs text-muted-foreground">
            Or have them enter your code at signup:{" "}
            <span className="font-mono font-semibold text-foreground">{code}</span>
          </p>
        )}
      </section>

      {/* Email invites */}
      <section className="rounded-3xl border border-border bg-card p-6 shadow-card">
        <h2 className="flex items-center gap-2 font-display text-xl font-bold">
          <Mail className="h-5 w-5" /> Invite by email
        </h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Drop in one or more emails (commas or spaces). We'll prep the invite in your mail client.
        </p>
        <form onSubmit={onSend} className="mt-4 space-y-3">
          <textarea
            value={emailsRaw}
            onChange={(e) => setEmailsRaw(e.target.value)}
            placeholder="alex@example.com, sam@example.com"
            rows={3}
            className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm outline-none ring-ring/30 focus:ring-2"
          />
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground">{sentMsg}</p>
            <button
              disabled={sending || !emailsRaw.trim()}
              className="inline-flex items-center gap-1.5 rounded-2xl bg-gradient-vibe px-5 py-3 text-sm font-semibold text-primary-foreground shadow-pop transition-pop active:scale-95 disabled:opacity-50"
            >
              {sending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Mail className="h-4 w-4" />
              )}
              Send invites
            </button>
          </div>
        </form>
      </section>

      {/* Rewards */}
      <section className="rounded-3xl border border-border bg-card p-6 shadow-card">
        <h2 className="font-display text-xl font-bold">Your rewards</h2>
        {rewards.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">
            No rewards yet. They land here the moment a friend completes their first booking.
          </p>
        ) : (
          <ul className="mt-4 space-y-2">
            {rewards.map((r) => (
              <li
                key={r.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-background px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <div className="grid h-9 w-9 place-items-center rounded-full bg-primary/15 text-primary">
                    <Gift className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold">
                      {r.type === "gift_card" ? "$25 gift card" : "First-booking discount"}
                    </div>
                    {r.redeem_code && (
                      <div className="font-mono text-xs text-muted-foreground">
                        Code: {r.redeem_code}
                      </div>
                    )}
                  </div>
                </div>
                <span
                  className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${
                    r.status === "issued"
                      ? "bg-primary/15 text-primary"
                      : r.status === "redeemed"
                        ? "bg-muted text-muted-foreground"
                        : "bg-secondary text-secondary-foreground"
                  }`}
                >
                  {r.status}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Invites */}
      <section className="rounded-3xl border border-border bg-card p-6 shadow-card">
        <h2 className="font-display text-xl font-bold">Invites</h2>
        {invites.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">No invites sent yet.</p>
        ) : (
          <ul className="mt-4 divide-y divide-border">
            {invites.map((i) => (
              <li key={i.id} className="flex items-center justify-between py-3">
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold">
                    {i.referee_email ?? "via link"}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {i.channel} · {new Date(i.created_at).toLocaleDateString()}
                  </div>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${
                    i.status === "completed"
                      ? "bg-primary/15 text-primary"
                      : i.status === "signed_up"
                        ? "bg-secondary text-secondary-foreground"
                        : "bg-muted text-muted-foreground"
                  }`}
                >
                  {i.status === "completed"
                    ? "Booked"
                    : i.status === "signed_up"
                      ? "Joined"
                      : "Pending"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Badges */}
      <section className="rounded-3xl border border-border bg-card p-6 shadow-card">
        <h2 className="flex items-center gap-2 font-display text-xl font-bold">
          <Medal className="h-5 w-5" /> Referral badges
        </h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Unlock these by getting friends to book through your link.
        </p>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {badges.map((b) => (
            <BadgeCard key={b.code} badge={b} />
          ))}
        </div>
      </section>

      {/* Leaderboard */}
      <section className="rounded-3xl border border-border bg-card p-6 shadow-card">
        <h2 className="flex items-center gap-2 font-display text-xl font-bold">
          <Trophy className="h-5 w-5 text-primary" /> Top referrers
        </h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Ranked by friends who've made a booking. Updated live.
        </p>
        {leaderboard.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">
            No referrals yet — be the first on the board.
          </p>
        ) : (
          <ol className="mt-4 space-y-2">
            {leaderboard.map((row, idx) => {
              const rank = idx + 1;
              const isMe = user?.id === row.user_id;
              return (
                <li
                  key={row.user_id}
                  className={`flex items-center justify-between gap-3 rounded-2xl border px-4 py-3 ${
                    isMe ? "border-primary/40 bg-primary/10" : "border-border bg-background"
                  }`}
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <RankPill rank={rank} />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-sm font-semibold">
                          {row.display_name}
                          {isMe && (
                            <span className="ml-2 rounded-full bg-primary/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
                              You
                            </span>
                          )}
                        </span>
                        <TierIcon tier={row.tier} />
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Lv {row.level} · {row.signed_up} joined
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-display text-lg font-bold leading-none">
                      {row.completed}
                    </div>
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                      booked
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </section>
    </div>
  );
}

const BADGE_ICONS: Record<string, typeof Sparkles> = {
  sparkles: Sparkles,
  flame: Flame,
  star: Star,
  crown: Crown,
};

function BadgeCard({ badge }: { badge: ReferralBadge }) {
  const Icon = BADGE_ICONS[badge.icon] ?? Medal;
  return (
    <div
      className={`relative overflow-hidden rounded-2xl border p-3 text-center ${
        badge.unlocked
          ? "border-primary/40 bg-gradient-to-br from-primary/15 to-card"
          : "border-border bg-background opacity-70"
      }`}
    >
      <div
        className={`mx-auto grid h-12 w-12 place-items-center rounded-full ${
          badge.unlocked ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
        }`}
      >
        {badge.unlocked ? <Icon className="h-6 w-6" /> : <Lock className="h-5 w-5" />}
      </div>
      <div className="mt-2 text-xs font-bold leading-tight">{badge.title}</div>
      <div className="mt-1 line-clamp-2 text-[10px] text-muted-foreground">{badge.description}</div>
      <div className="mt-1 text-[10px] font-semibold text-primary">+{badge.xp_reward} XP</div>
    </div>
  );
}

function RankPill({ rank }: { rank: number }) {
  const styles =
    rank === 1
      ? "bg-amber-400/20 text-amber-600 dark:text-amber-300 border-amber-400/40"
      : rank === 2
        ? "bg-slate-400/20 text-slate-600 dark:text-slate-300 border-slate-400/40"
        : rank === 3
          ? "bg-orange-400/20 text-orange-600 dark:text-orange-300 border-orange-400/40"
          : "bg-muted text-muted-foreground border-border";
  return (
    <div
      className={`grid h-9 w-9 shrink-0 place-items-center rounded-full border font-display text-sm font-bold ${styles}`}
    >
      {rank}
    </div>
  );
}

function TierIcon({ tier }: { tier: LeaderboardRow["tier"] }) {
  if (tier === "legend") return <Crown className="h-4 w-4 text-amber-500" />;
  if (tier === "super") return <Star className="h-4 w-4 text-primary" />;
  if (tier === "rising") return <Flame className="h-4 w-4 text-orange-500" />;
  if (tier === "first") return <Sparkles className="h-4 w-4 text-secondary-foreground" />;
  return null;
}

function Stat({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Gift;
  label: string;
  value: number | string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-background/80 p-3 backdrop-blur">
      <Icon className="h-4 w-4 text-primary" />
      <div className="mt-2 font-display text-2xl font-bold leading-none">{value}</div>
      <div className="mt-1 text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
    </div>
  );
}
