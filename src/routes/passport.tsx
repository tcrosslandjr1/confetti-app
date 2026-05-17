import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  Award,
  Compass,
  Moon,
  Pizza,
  Users,
  Map as MapIcon,
  Crown,
  Gift,
  Sparkles,
  ArrowLeft,
  Flame,
  Ticket,
  TrendingUp,
  Lock,
  Share2,
  QrCode,
  Stamp,
  Zap,
  Calendar,
  ChevronRight,
  Star,
} from "lucide-react";
import {
  addConfetti,
  getConfetti,
  subscribeConfetti,
  getStamps,
  subscribeStamps,
  type PassportStamp,
} from "@/lib/loop-store";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  PassportShareCard,
  encodePassport,
  type PassportShareData,
} from "@/components/passport/PassportShareCard";
import { toPng } from "html-to-image";
import { Copy, Download, Check } from "lucide-react";
import { toast } from "sonner";
import { usePassportStats } from "@/hooks/usePassportStats";

const EMPTY_STREAK: boolean[] = [false, false, false, false, false, false, false];

type ClaimedReward = { id: string; label: string; cost: number; code: string; at: number };
const CLAIMED_KEY = "passport:claimed-rewards";

function loadClaimed(): ClaimedReward[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(CLAIMED_KEY) || "[]") as ClaimedReward[];
  } catch {
    return [];
  }
}
function saveClaimed(list: ClaimedReward[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(CLAIMED_KEY, JSON.stringify(list));
}
function genCode() {
  const a = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  let s = "CF-";
  for (let i = 0; i < 6; i++) s += a[Math.floor(Math.random() * a.length)];
  return s;
}

export const Route = createFileRoute("/passport")({
  head: () => ({ meta: [{ title: "Passport — Confetti" }] }),
  component: PassportPage,
});

/**
 * Badge catalogue rendered on the Passport. `code` matches `achievements.code`
 * in the database, so unlock status is hydrated from `user_achievements`.
 * Items without a `code` are demo-only placeholders shown when the user has no
 * matching achievement row.
 */
const BADGES: {
  id: string;
  code?: string;
  label: string;
  icon: typeof Compass;
  hint: string;
  fallbackUnlocked?: boolean;
}[] = [
  { id: "first-visit", code: "first_visit", label: "First Steps", icon: Compass, hint: "Complete your first trip" },
  { id: "night-owl", code: "night_owl", label: "Night Owl", icon: Moon, hint: "After 11pm × 5" },
  { id: "foodie", code: "foodie_explorer", label: "Foodie Explorer", icon: Pizza, hint: "10 dinners booked" },
  { id: "weekend", code: "weekend_warrior", label: "Weekend Warrior", icon: Flame, hint: "3 weekends in a row" },
  { id: "dmv", code: "dmv_native", label: "DMV Native", icon: MapIcon, hint: "10 trips in the DMV" },
  { id: "referral", code: "referral_first", label: "First Referral", icon: Users, hint: "Invite a friend" },
];

const REWARDS = [
  { id: "r1", label: "$10 off a Booking", sub: "Any dinner reservation", cost: 500, icon: Ticket },
  { id: "r2", label: "Free cocktail", sub: "At partner bars", cost: 250, icon: Sparkles },
  { id: "r3", label: "VIP rooftop entry", sub: "Skip the line", cost: 1000, icon: Crown },
];

// Seed stamps shown alongside ones earned from live check-ins.
const SEED_STAMPS: PassportStamp[] = [
  { id: "seed-dc-1", city: "DC", theme: "Harbor Heatwave", date: "May 10", earnedAt: "2025-05-10T00:00:00Z" },
  { id: "seed-dc-2", city: "DC", theme: "Moonlit Mischief", date: "Apr 28", earnedAt: "2025-04-28T00:00:00Z" },
  { id: "seed-nyc-1", city: "NYC", theme: "Velvet & Vinyl", date: "Apr 15", earnedAt: "2025-04-15T00:00:00Z" },
  { id: "seed-mia-1", city: "MIA", theme: "Neon Nomads", date: "Mar 22", earnedAt: "2025-03-22T00:00:00Z" },
];

const TIERS = [
  { name: "Spark", at: 0, icon: Sparkles },
  { name: "Glow", at: 500, icon: Star },
  { name: "Blaze", at: 1500, icon: Flame },
  { name: "Legend", at: 3000, icon: Crown },
];

// Streak: last 7 days, true = checked-in
// (streak data is now provided by usePassportStats)
const STREAK_LABELS = ["M", "T", "W", "T", "F", "S", "S"];

function PassportPage() {
  const passport = usePassportStats();
  const [localConfetti, setLocalConfetti] = useState(0);
  const [claimed, setClaimed] = useState<ClaimedReward[]>([]);
  const [pending, setPending] = useState<(typeof REWARDS)[number] | null>(null);
  const [redeeming, setRedeeming] = useState(false);
  const [justClaimed, setJustClaimed] = useState<ClaimedReward | null>(null);
  const [localStamps, setLocalStamps] = useState<PassportStamp[]>([]);
  const [shareOpen, setShareOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    setLocalConfetti(getConfetti());
    setClaimed(loadClaimed());
    setLocalStamps(getStamps());
    const unsubC = subscribeConfetti(() => setLocalConfetti(getConfetti()));
    const unsubS = subscribeStamps(() => setLocalStamps(getStamps()));
    return () => {
      unsubC();
      unsubS();
    };
  }, []);

  // Real account data wins; localStorage demo data is the fallback for guests.
  const confetti = passport.signedIn ? passport.confetti : localConfetti;
  const earnedStamps = passport.signedIn ? passport.stamps : localStamps;

  // Merge earned stamps with seed examples only for guests; signed-in users see
  // their real trips with locked "Plan next" tiles instead of demo cities.
  const stamps: (PassportStamp & { earned: boolean })[] = passport.signedIn
    ? earnedStamps.map((s) => ({ ...s, earned: true }))
    : [
        ...earnedStamps.map((s) => ({ ...s, earned: true })),
        ...SEED_STAMPS.filter((s) => !earnedStamps.some((e) => e.id === s.id)).map((s) => ({
          ...s,
          earned: false,
        })),
      ];

  function handleConfirmRedeem() {
    if (!pending) return;
    if (getConfetti() < pending.cost) {
      toast.error("Not enough Confetti");
      setPending(null);
      return;
    }
    addConfetti(-pending.cost);
    const record: ClaimedReward = {
      id: pending.id,
      label: pending.label,
      cost: pending.cost,
      code: genCode(),
      at: Date.now(),
    };
    const next = [record, ...claimed];
    setClaimed(next);
    saveClaimed(next);
    setPending(null);
    setJustClaimed(record);
    toast.success(`Redeemed ${pending.label}`, { description: `Code ${record.code}` });
  }
  const level = Math.floor(confetti / 250) + 1;
  const nextLevelAt = level * 250;
  const progress = Math.min(100, ((confetti % 250) / 250) * 100);

  // Hydrate per-badge unlock state from the user's achievement rows. Fall back
  // to the demo `fallbackUnlocked` flag when there's no signed-in account.
  const badges = BADGES.map((b) => ({
    ...b,
    unlocked: passport.signedIn
      ? !!b.code && passport.unlockedBadgeCodes.has(b.code)
      : !!b.fallbackUnlocked,
  }));
  const unlockedCount = badges.filter((b) => b.unlocked).length;
  const totalBadges = badges.length;

  // Streak: real activity when signed in, otherwise an empty 7-day strip.
  const streakDays = passport.signedIn ? passport.streakDays : EMPTY_STREAK;

  const currentTierIndex = Math.max(
    0,
    TIERS.findIndex((t, i) => confetti < (TIERS[i + 1]?.at ?? Infinity)),
  );
  const currentTier = TIERS[currentTierIndex];
  const nextTier = TIERS[currentTierIndex + 1];


  const shareData: PassportShareData = {
    name: passport.displayName || "Guest Explorer",
    level,
    tier: currentTier.name as PassportShareData["tier"],
    confetti,
    stamps: earnedStamps.length,
    badges: unlockedCount,
  };
  const shareCode = encodePassport(shareData);
  const shareUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/p/${shareCode}`
      : `/p/${shareCode}`;

  async function handleCopyLink() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success("Link copied");
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Couldn't copy");
    }
  }

  async function handleDownloadImage() {
    if (!cardRef.current) return;
    try {
      const dataUrl = await toPng(cardRef.current, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: "transparent",
      });
      const link = document.createElement("a");
      link.download = `confetti-passport-L${level}.png`;
      link.href = dataUrl;
      link.click();
      toast.success("Image downloaded");
    } catch {
      toast.error("Couldn't export image");
    }
  }

  async function handleNativeShare() {
    if (typeof navigator === "undefined" || !navigator.share) {
      handleCopyLink();
      return;
    }
    try {
      await navigator.share({
        title: "My Confetti Passport",
        text: `L${level} ${currentTier.name} · ${confetti.toLocaleString()} Confetti`,
        url: shareUrl,
      });
    } catch {
      /* user cancelled */
    }
  }

  return (
    <div className="min-h-screen bg-background pb-32">
      <div className="mx-auto max-w-md px-4 pt-6">
        <Link
          to="/portal"
          className="inline-flex items-center gap-1 font-mono text-xs font-bold uppercase tracking-widest text-ink/70 hover:text-ink"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back
        </Link>

        {/* Passport hero */}
        <div className="relative mt-4 overflow-hidden rounded-3xl border-2 border-ink bg-gradient-vibe p-6 text-cream shadow-brut-lg">
          {/* layered glow */}
          <div className="pointer-events-none absolute -left-20 -top-20 h-56 w-56 rounded-full bg-cream/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -right-16 h-64 w-64 rounded-full bg-ink/30 blur-3xl" />
          {/* dotted grid texture */}
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.12]"
            style={{
              backgroundImage:
                "radial-gradient(rgba(255,255,255,0.9) 1px, transparent 1px)",
              backgroundSize: "14px 14px",
            }}
          />
          {/* shimmer sweep */}
          <div className="pointer-events-none absolute -inset-x-1 inset-y-0 -translate-x-full animate-[shimmer_3.5s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-cream/25 to-transparent" />
          {/* decorative confetti specks */}
          <div className="pointer-events-none absolute inset-0 opacity-70">
            <span className="absolute left-[12%] top-[18%] h-1.5 w-1.5 rotate-12 rounded-sm bg-cream/90 animate-[float_4s_ease-in-out_infinite]" />
            <span className="absolute left-[80%] top-[20%] h-2 w-2 rotate-45 bg-cream/80 animate-[float_5s_ease-in-out_infinite_0.4s]" />
            <span className="absolute left-[90%] top-[70%] h-1 w-3 rounded-full bg-cream/70 animate-[float_4.5s_ease-in-out_infinite_0.8s]" />
            <span className="absolute left-[6%] top-[74%] h-1.5 w-1.5 rounded-full bg-cream/80 animate-[float_5.5s_ease-in-out_infinite_1.1s]" />
            <span className="absolute left-[48%] top-[10%] h-1 w-1 rounded-full bg-cream/70" />
          </div>

          <div className="relative flex items-center justify-between gap-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-cream/30 bg-cream/15 px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-widest backdrop-blur">
              <Award className="h-3.5 w-3.5" /> Confetti Passport
            </div>
            <button
              type="button"
              onClick={() => setShareOpen(true)}
              className="inline-flex items-center gap-1 rounded-full border border-cream/40 bg-cream/10 px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-widest backdrop-blur hover:bg-cream/20"
            >
              <Share2 className="h-3 w-3" /> Share
            </button>
          </div>

          <div className="relative mt-4 flex items-end justify-between gap-3">
            <div>
              <div className="flex items-baseline gap-2">
                <div className="font-display text-7xl font-extrabold leading-none drop-shadow-[0_3px_0_rgba(0,0,0,0.25)]">
                  L{level}
                </div>
                <div className="font-serif text-2xl italic opacity-80">explorer</div>
              </div>
              <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-ink/25 px-2.5 py-1 text-[11px] backdrop-blur">
                <currentTier.icon className="h-3 w-3" />
                <span className="font-mono font-bold uppercase tracking-widest">{currentTier.name} tier</span>
              </div>
            </div>
            <div className="text-right">
              <div className="font-display text-4xl font-extrabold tabular-nums leading-none drop-shadow-[0_2px_0_rgba(0,0,0,0.2)]">
                {confetti.toLocaleString()}
              </div>
              <div className="mt-1 font-mono text-[10px] uppercase tracking-widest opacity-90">
                Confetti
              </div>
            </div>
          </div>

          <div className="relative mt-5">
            <div className="h-3 w-full overflow-hidden rounded-full bg-ink/35 ring-1 ring-cream/10">
              <div
                className="relative h-full rounded-full bg-cream shadow-[0_0_14px_rgba(255,255,255,0.6)] transition-all duration-700"
                style={{ width: `${progress}%` }}
              >
                <div className="absolute inset-0 animate-[shimmer_2s_linear_infinite] bg-gradient-to-r from-transparent via-coral/40 to-transparent" />
              </div>
            </div>
            <div className="mt-2 flex justify-between font-mono text-[10px] uppercase tracking-widest opacity-95">
              <span className="inline-flex items-center gap-1">
                <Zap className="h-3 w-3" /> Level {level}
              </span>
              <span>
                {nextLevelAt - confetti} to L{level + 1}
              </span>
            </div>
          </div>
        </div>

        {/* Quick stats row */}
        <div className="mt-4 grid grid-cols-3 gap-2">
          <StatTile icon={Flame} value={String(streakDays.filter(Boolean).length)} label="Streak" tint="coral" />
          <StatTile icon={Award} value={`${unlockedCount}/${totalBadges}`} label="Badges" tint="ink" />
          <StatTile icon={TrendingUp} value={String(earnedStamps.length)} label="Check-ins" tint="coral" />
        </div>

        {/* Streak strip */}
        <section className="mt-5 overflow-hidden rounded-2xl border-2 border-ink bg-card p-4 shadow-brut">
          <div className="flex items-center justify-between">
            <h3 className="flex items-center gap-2 font-display text-sm font-bold">
              <Flame className="h-4 w-4 text-coral" /> 7-day streak
            </h3>
            <span className="font-mono text-[10px] uppercase tracking-widest text-ink/60">
              +25 / day
            </span>
          </div>
          <div className="mt-3 grid grid-cols-7 gap-1.5">
            {streakDays.map((on, i) => (
              <div key={i} className="flex flex-col items-center gap-1">
                <div
                  className={`grid h-9 w-full place-items-center rounded-lg border-2 text-[11px] font-bold transition-transform hover:-translate-y-0.5 ${
                    on
                      ? "border-ink bg-gradient-vibe text-cream shadow-[0_2px_0_rgba(0,0,0,0.9)]"
                      : "border-dashed border-ink/30 bg-background text-ink/30"
                  }`}
                >
                  {on ? <Flame className="h-3.5 w-3.5" /> : "·"}
                </div>
                <span className="font-mono text-[9px] uppercase text-ink/50">{STREAK_LABELS[i]}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Tier ladder */}
        <section className="mt-5">
          <div className="flex items-end justify-between">
            <h2 className="flex items-center gap-2 font-display text-lg font-bold">
              <TrendingUp className="h-4 w-4 text-coral" /> Tier ladder
            </h2>
            {nextTier && (
              <span className="font-mono text-[10px] uppercase tracking-widest text-ink/60">
                {(nextTier.at - confetti).toLocaleString()} to {nextTier.name}
              </span>
            )}
          </div>
          <div className="mt-3 grid grid-cols-4 gap-2">
            {TIERS.map((t, i) => {
              const reached = confetti >= t.at;
              const isCurrent = i === currentTierIndex;
              return (
                <div
                  key={t.name}
                  className={`relative flex flex-col items-center gap-1.5 rounded-2xl border-2 p-3 text-center transition-all ${
                    isCurrent
                      ? "border-ink bg-gradient-vibe text-cream shadow-brut"
                      : reached
                        ? "border-ink bg-card shadow-brut"
                        : "border-dashed border-ink/30 bg-card/40 text-ink/40"
                  }`}
                >
                  <t.icon className="h-4 w-4" />
                  <div className="font-display text-xs font-extrabold leading-none">{t.name}</div>
                  <div
                    className={`font-mono text-[9px] uppercase tracking-widest ${isCurrent ? "opacity-90" : "opacity-70"}`}
                  >
                    {t.at}
                  </div>
                  {isCurrent && (
                    <span className="absolute -top-1.5 right-1.5 grid h-4 w-4 place-items-center rounded-full border-2 border-ink bg-coral">
                      <span className="h-1 w-1 rounded-full bg-cream" />
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* Stamps row */}
        <section className="mt-6">
          <div className="flex items-end justify-between">
            <h2 className="flex items-center gap-2 font-display text-lg font-bold">
              <Stamp className="h-4 w-4 text-coral" /> Stamps
              <span className="ml-1 rounded-full bg-ink/10 px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-widest text-ink/70">
                {earnedStamps.length} earned
              </span>
            </h2>
            <Link
              to="/portal/passport"
              className="inline-flex items-center gap-0.5 font-mono text-[10px] font-bold uppercase tracking-widest text-ink/60 hover:text-ink"
            >
              View all <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="mt-3 -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {stamps.map((s) => (
              <div
                key={s.id}
                className={`relative snap-start shrink-0 overflow-hidden rounded-2xl border-2 p-4 transition-all ${
                  s.earned
                    ? "border-ink bg-cream shadow-brut"
                    : "border-ink/30 bg-card/40 opacity-60 grayscale"
                }`}
                style={{ width: 140 }}
              >
                <div className="pointer-events-none absolute -right-6 -top-6 h-20 w-20 rounded-full bg-coral/10 blur-xl" />
                {s.earned && (
                  <span className="absolute right-2 top-2 rounded-full border border-ink bg-coral px-1.5 py-0.5 font-mono text-[8px] font-bold uppercase tracking-widest text-cream">
                    New
                  </span>
                )}
                {!s.earned && (
                  <span className="absolute right-2 top-2 grid h-5 w-5 place-items-center rounded-full border border-ink/40 bg-cream/80 text-ink/60">
                    <Lock className="h-2.5 w-2.5" />
                  </span>
                )}
                <div
                  className={`mx-auto grid h-20 w-20 -rotate-6 place-items-center rounded-full border-4 border-dashed bg-cream text-center ${
                    s.earned ? "border-coral" : "border-ink/30"
                  }`}
                >
                  <div>
                    <div
                      className={`font-mono text-[8px] font-bold uppercase tracking-widest ${
                        s.earned ? "text-coral" : "text-ink/40"
                      }`}
                    >
                      Confetti
                    </div>
                    <div className="mt-0.5 font-display text-[11px] font-extrabold leading-none text-ink">
                      {s.city}
                    </div>
                    <div className="mt-0.5 font-mono text-[7px] uppercase text-ink/60">{s.date}</div>
                  </div>
                </div>
                <div className="mt-3 text-center font-display text-[11px] font-bold leading-tight text-ink">
                  {s.theme}
                </div>
              </div>
            ))}
            <div
              className="grid snap-start shrink-0 place-items-center rounded-2xl border-2 border-dashed border-ink/30 bg-card/40 p-4 text-center"
              style={{ width: 140 }}
            >
              <div>
                <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-ink/10 text-ink/40">
                  <Calendar className="h-5 w-5" />
                </div>
                <div className="mt-2 font-mono text-[9px] uppercase tracking-widest text-ink/50">
                  Plan your next
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Badges */}
        <section className="mt-6">
          <div className="flex items-end justify-between">
            <h2 className="font-display text-lg font-bold">Badges</h2>
            <span className="font-mono text-[10px] uppercase tracking-widest text-ink/60">
              {unlockedCount} of {totalBadges}
            </span>
          </div>
          <div className="mt-3 grid grid-cols-3 gap-3">
            {badges.map((b) => (
              <div
                key={b.id}
                className={`group relative flex flex-col items-center gap-2 rounded-2xl border-2 p-3 text-center transition-all ${
                  b.unlocked
                    ? "border-ink bg-card shadow-brut hover:-translate-y-0.5"
                    : "border-dashed border-ink/30 bg-card/50"
                }`}
              >
                {b.unlocked && (
                  <span className="absolute -top-1.5 -right-1.5 rounded-full border-2 border-ink bg-gold px-1.5 py-0.5 font-mono text-[8px] font-bold uppercase tracking-widest text-ink">
                    new
                  </span>
                )}
                <span
                  className={`relative grid h-12 w-12 place-items-center rounded-full ${
                    b.unlocked
                      ? "bg-gradient-vibe text-cream shadow-[0_4px_12px_rgba(0,0,0,0.18)]"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  <b.icon className="h-5 w-5" />
                  {!b.unlocked && (
                    <span className="absolute -bottom-1 -right-1 grid h-5 w-5 place-items-center rounded-full border-2 border-background bg-ink text-cream">
                      <Lock className="h-2.5 w-2.5" />
                    </span>
                  )}
                </span>
                <div
                  className={`font-display text-xs font-bold leading-tight ${b.unlocked ? "" : "text-ink/60"}`}
                >
                  {b.label}
                </div>
                <div className="font-mono text-[9px] uppercase tracking-wider text-ink/50">
                  {b.hint}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Featured perk */}
        <section className="mt-6 relative overflow-hidden rounded-2xl border-2 border-ink bg-ink p-5 text-cream shadow-brut-lg">
          <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-coral/40 blur-3xl" />
          <div className="pointer-events-none absolute -left-8 -bottom-8 h-28 w-28 rounded-full bg-gold/30 blur-2xl" />
          <div className="relative flex items-start gap-3">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border-2 border-cream/30 bg-cream/10 backdrop-blur">
              <Gift className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="inline-flex items-center gap-1 rounded-full bg-coral px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-widest text-cream">
                Featured perk
              </div>
              <h3 className="mt-1.5 font-display text-lg font-extrabold leading-tight">
                Double Confetti weekend
              </h3>
              <p className="mt-1 text-xs leading-snug opacity-90">
                Every check-in Fri–Sun earns 2× rewards. Stack with your streak bonus.
              </p>
              <button
                type="button"
                className="mt-3 inline-flex items-center gap-1 rounded-full border-2 border-cream/40 bg-cream/10 px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-widest hover:bg-cream/20"
              >
                See partners <ChevronRight className="h-3 w-3" />
              </button>
            </div>
          </div>
        </section>

        {/* Rewards */}
        <section className="mt-6">
          <div className="flex items-end justify-between">
            <h2 className="flex items-center gap-2 font-display text-lg font-bold">
              <Gift className="h-5 w-5 text-coral" /> Redeem Confetti
            </h2>
            <span className="font-mono text-[10px] uppercase tracking-widest text-ink/60">
              {confetti.toLocaleString()} avail
            </span>
          </div>
          <ul className="mt-3 space-y-2">
            {REWARDS.map((r) => {
              const can = confetti >= r.cost;
              const pct = Math.min(100, (confetti / r.cost) * 100);
              return (
                <li
                  key={r.id}
                  className={`relative overflow-hidden rounded-xl border-2 border-ink bg-card p-3 shadow-brut transition-transform ${can ? "hover:-translate-y-0.5" : ""}`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <span
                        className={`grid h-10 w-10 shrink-0 place-items-center rounded-full ${can ? "bg-gradient-vibe text-cream" : "bg-muted text-muted-foreground"}`}
                      >
                        <r.icon className="h-4 w-4" />
                      </span>
                      <div className="min-w-0">
                        <div className="font-display text-sm font-bold leading-tight">{r.label}</div>
                        <div className="truncate font-mono text-[10px] uppercase tracking-widest text-ink/60">
                          {r.sub} · {r.cost} Confetti
                        </div>
                      </div>
                    </div>
                    {(() => {
                      const isClaimed = claimed.some((c) => c.id === r.id);
                      return (
                        <button
                          type="button"
                          disabled={!can || isClaimed}
                          onClick={() => setPending(r)}
                          className="shrink-0 rounded-full border-2 border-ink bg-coral px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-widest text-cream shadow-brut transition-transform hover:-translate-y-0.5 disabled:translate-y-0 disabled:opacity-40 disabled:shadow-none"
                        >
                          {isClaimed ? "Claimed" : can ? "Redeem" : "Locked"}
                        </button>
                      );
                    })()}
                  </div>
                  {!can && (
                    <div className="mt-2.5">
                      <div className="h-1 w-full overflow-hidden rounded-full bg-ink/10">
                        <div
                          className="h-full rounded-full bg-coral/70"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <div className="mt-1 font-mono text-[9px] uppercase tracking-widest text-ink/50">
                        {(r.cost - confetti).toLocaleString()} more to unlock
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </section>

        {/* Claimed rewards */}
        {claimed.length > 0 && (
          <section className="mt-6">
            <div className="flex items-end justify-between">
              <h2 className="flex items-center gap-2 font-display text-lg font-bold">
                <Ticket className="h-4 w-4 text-coral" /> Your rewards
              </h2>
              <span className="font-mono text-[10px] uppercase tracking-widest text-ink/60">
                {claimed.length} claimed
              </span>
            </div>
            <ul className="mt-3 space-y-2">
              {claimed.map((c) => (
                <li
                  key={c.code}
                  className="flex items-center justify-between gap-3 rounded-xl border-2 border-ink bg-card p-3 shadow-brut"
                >
                  <div className="min-w-0">
                    <div className="font-display text-sm font-bold leading-tight">{c.label}</div>
                    <div className="font-mono text-[10px] uppercase tracking-widest text-ink/60">
                      Redeemed · {new Date(c.at).toLocaleDateString()}
                    </div>
                  </div>
                  <code className="shrink-0 rounded-md border-2 border-dashed border-ink/40 bg-background px-2 py-1 font-mono text-[11px] font-bold tracking-widest text-ink">
                    {c.code}
                  </code>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Activity */}
        <section className="mt-6">
          <h2 className="font-display text-lg font-bold">Recent activity</h2>
          <ul className="mt-3 space-y-2">
            {[
              { t: "+50 Confetti · Lila's Patio check-in", d: "Tonight", earn: true },
              { t: "Badge unlocked · Foodie", d: "Last week", earn: false },
              { t: "+50 Confetti · Aera Rooftop check-in", d: "Last week", earn: true },
            ].map((a, i) => (
              <li
                key={i}
                className="flex items-start gap-3 rounded-xl border-2 border-ink/10 bg-card p-3 transition-colors hover:border-ink/30"
              >
                <span
                  className={`grid h-9 w-9 shrink-0 place-items-center rounded-full ${a.earn ? "bg-coral/15 text-coral" : "bg-ink/10 text-ink"}`}
                >
                  {a.earn ? <Sparkles className="h-4 w-4" /> : <Award className="h-4 w-4" />}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold">{a.t}</div>
                  <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                    {a.d}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </section>

        {/* Scan-to-earn footer */}
        <div className="mt-6 flex items-center justify-between gap-3 rounded-2xl border-2 border-dashed border-ink/30 bg-cream/60 p-4">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-ink text-cream">
              <QrCode className="h-5 w-5" />
            </span>
            <div>
              <div className="font-display text-sm font-bold leading-tight">Earn at the door</div>
              <div className="font-mono text-[10px] uppercase tracking-widest text-ink/60">
                Scan to check in
              </div>
            </div>
          </div>
          <Link
            to="/scan"
            className="rounded-full border-2 border-ink bg-background px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-widest text-ink hover:bg-ink hover:text-cream"
          >
            Scan
          </Link>
        </div>
      </div>

      <AlertDialog open={!!pending} onOpenChange={(o) => !o && setPending(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Redeem {pending?.label}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will deduct <strong>{pending?.cost.toLocaleString()} Confetti</strong> from your
              balance and generate a one-time redemption code. New balance:{" "}
              <strong>{Math.max(0, confetti - (pending?.cost ?? 0)).toLocaleString()}</strong>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmRedeem}>Confirm redeem</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!justClaimed} onOpenChange={(o) => !o && setJustClaimed(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-coral" /> Reward unlocked
            </AlertDialogTitle>
            <AlertDialogDescription>
              Show this code at the venue to claim <strong>{justClaimed?.label}</strong>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="rounded-xl border-2 border-dashed border-ink/40 bg-cream/60 p-4 text-center">
            <div className="font-mono text-[10px] uppercase tracking-widest text-ink/60">
              Redemption code
            </div>
            <div className="mt-1 font-display text-2xl font-extrabold tracking-widest text-ink">
              {justClaimed?.code}
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setJustClaimed(null)}>Done</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Share passport modal */}
      <Dialog open={shareOpen} onOpenChange={setShareOpen}>
        <DialogContent className="max-w-md border-2 border-ink bg-card p-0 shadow-brut-lg">
          <DialogHeader className="px-6 pt-6">
            <DialogTitle className="font-display text-2xl font-extrabold">
              Share your Passport
            </DialogTitle>
            <DialogDescription className="font-serif italic text-ink/70">
              A snapshot of your tier, Confetti, and a QR code to your profile.
            </DialogDescription>
          </DialogHeader>

          <div className="flex justify-center px-6 pt-2">
            <PassportShareCard ref={cardRef} data={shareData} shareUrl={shareUrl} />
          </div>

          <div className="px-6 pb-6 pt-4">
            <div className="flex items-center gap-2 rounded-xl border-2 border-ink bg-cream/60 px-3 py-2">
              <code className="flex-1 truncate font-mono text-[11px] text-ink">{shareUrl}</code>
              <button
                type="button"
                onClick={handleCopyLink}
                className="inline-flex items-center gap-1 rounded-full border-2 border-ink bg-cream px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-widest text-ink shadow-brut hover:-translate-y-0.5 transition-transform"
              >
                {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                {copied ? "Copied" : "Copy"}
              </button>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleDownloadImage}
                className="inline-flex items-center justify-center gap-1.5 rounded-full border-2 border-ink bg-cream px-3 py-2 font-mono text-[11px] font-bold uppercase tracking-widest text-ink shadow-brut hover:-translate-y-0.5 transition-transform"
              >
                <Download className="h-3.5 w-3.5" /> Download
              </button>
              <button
                type="button"
                onClick={handleNativeShare}
                className="inline-flex items-center justify-center gap-1.5 rounded-full border-2 border-ink bg-coral px-3 py-2 font-mono text-[11px] font-bold uppercase tracking-widest text-cream shadow-brut hover:-translate-y-0.5 transition-transform"
              >
                <Share2 className="h-3.5 w-3.5" /> Share
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StatTile({
  icon: Icon,
  value,
  label,
  tint,
}: {
  icon: React.ComponentType<{ className?: string }>;
  value: string;
  label: string;
  tint: "coral" | "ink";
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-1 rounded-2xl border-2 border-ink bg-card p-3 shadow-brut">
      <span
        className={`grid h-7 w-7 place-items-center rounded-full ${tint === "coral" ? "bg-coral/15 text-coral" : "bg-ink/10 text-ink"}`}
      >
        <Icon className="h-3.5 w-3.5" />
      </span>
      <div className="font-display text-lg font-extrabold leading-none">{value}</div>
      <div className="font-mono text-[9px] uppercase tracking-widest text-ink/60">{label}</div>
    </div>
  );
}
