import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
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
} from "lucide-react";
import { getConfetti, subscribeConfetti } from "@/lib/loop-store";

export const Route = createFileRoute("/passport")({
  head: () => ({ meta: [{ title: "Passport — Confetti" }] }),
  component: PassportPage,
});

const BADGES = [
  { id: "explorer", label: "Explorer", icon: Compass, unlocked: true, hint: "Visit 3 cities" },
  { id: "night-owl", label: "Night Owl", icon: Moon, unlocked: true, hint: "After 11pm × 5" },
  { id: "foodie", label: "Foodie", icon: Pizza, unlocked: true, hint: "10 dinners booked" },
  { id: "social", label: "Social Butterfly", icon: Users, unlocked: false, hint: "Invite 3 friends" },
  { id: "trail", label: "Trailblazer", icon: MapIcon, unlocked: false, hint: "Try a new vibe" },
  { id: "legend", label: "Local Legend", icon: Crown, unlocked: false, hint: "25 check-ins" },
];

const REWARDS = [
  { id: "r1", label: "$10 off a Booking", sub: "Any dinner reservation", cost: 500, icon: Ticket },
  { id: "r2", label: "Free cocktail", sub: "At partner bars", cost: 250, icon: Sparkles },
  { id: "r3", label: "VIP rooftop entry", sub: "Skip the line", cost: 1000, icon: Crown },
];

function PassportPage() {
  const [confetti, setConfettiCount] = useState(0);
  useEffect(() => {
    setConfettiCount(getConfetti());
    return subscribeConfetti(() => setConfettiCount(getConfetti()));
  }, []);
  const level = Math.floor(confetti / 250) + 1;
  const nextLevelAt = level * 250;
  const progress = Math.min(100, ((confetti % 250) / 250) * 100);
  const unlockedCount = BADGES.filter((b) => b.unlocked).length;

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
          {/* decorative confetti specks */}
          <div className="pointer-events-none absolute inset-0 opacity-60">
            <span className="absolute left-[14%] top-[18%] h-1.5 w-1.5 rounded-full bg-cream/80" />
            <span className="absolute left-[78%] top-[22%] h-2 w-2 rotate-12 bg-cream/70" />
            <span className="absolute left-[88%] top-[68%] h-1 w-3 rounded-full bg-cream/60" />
            <span className="absolute left-[8%] top-[72%] h-1.5 w-1.5 rounded-full bg-cream/70" />
          </div>
          <div className="relative flex items-center justify-between gap-2">
            <div className="inline-flex items-center gap-2 rounded-full bg-cream/15 px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-widest backdrop-blur">
              <Award className="h-3.5 w-3.5" /> Confetti Passport
            </div>
            <button
              type="button"
              className="inline-flex items-center gap-1 rounded-full border border-cream/40 bg-cream/10 px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-widest backdrop-blur hover:bg-cream/20"
            >
              <Share2 className="h-3 w-3" /> Share
            </button>
          </div>
          <div className="relative mt-3 flex items-end justify-between gap-3">
            <div>
              <div className="font-display text-6xl font-extrabold leading-none drop-shadow-[0_2px_0_rgba(0,0,0,0.2)]">
                L{level}
              </div>
              <div className="mt-1.5 inline-flex items-center gap-1 text-xs opacity-95">
                <Sparkles className="h-3 w-3" /> Level {level} Explorer
              </div>
            </div>
            <div className="text-right">
              <div className="font-display text-3xl font-extrabold tabular-nums">
                {confetti.toLocaleString()}
              </div>
              <div className="font-mono text-[10px] uppercase tracking-widest opacity-90">
                Confetti
              </div>
            </div>
          </div>
          <div className="relative mt-4">
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-ink/30">
              <div
                className="h-full rounded-full bg-cream shadow-[0_0_12px_rgba(255,255,255,0.5)] transition-all duration-700"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="mt-1.5 flex justify-between font-mono text-[9px] uppercase tracking-widest opacity-90">
              <span>Level {level}</span>
              <span>
                {nextLevelAt - confetti} to L{level + 1}
              </span>
            </div>
          </div>
        </div>

        {/* Quick stats row */}
        <div className="mt-3 grid grid-cols-3 gap-2">
          <StatTile icon={Flame} value="7" label="Streak" tint="coral" />
          <StatTile icon={Award} value={`${unlockedCount}/${BADGES.length}`} label="Badges" tint="ink" />
          <StatTile icon={TrendingUp} value="12" label="Check-ins" tint="coral" />
        </div>

        {/* Badges */}
        <section className="mt-6">
          <div className="flex items-end justify-between">
            <h2 className="font-display text-lg font-bold">Badges</h2>
            <span className="font-mono text-[10px] uppercase tracking-widest text-ink/60">
              {unlockedCount} of {BADGES.length}
            </span>
          </div>
          <div className="mt-3 grid grid-cols-3 gap-3">
            {BADGES.map((b) => (
              <div
                key={b.id}
                className={`group relative flex flex-col items-center gap-2 rounded-2xl border-2 p-3 text-center transition-all ${
                  b.unlocked
                    ? "border-ink bg-card shadow-brut hover:-translate-y-0.5"
                    : "border-dashed border-ink/30 bg-card/50"
                }`}
              >
                <span
                  className={`relative grid h-12 w-12 place-items-center rounded-full ${
                    b.unlocked
                      ? "bg-gradient-vibe text-cream shadow-[0_4px_12px_rgba(0,0,0,0.15)]"
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
                    <button
                      disabled={!can}
                      className="shrink-0 rounded-full border-2 border-ink bg-coral px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-widest text-cream shadow-brut transition-transform hover:-translate-y-0.5 disabled:translate-y-0 disabled:opacity-40 disabled:shadow-none"
                    >
                      {can ? "Redeem" : "Locked"}
                    </button>
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
