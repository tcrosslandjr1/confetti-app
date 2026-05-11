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
} from "lucide-react";
import { getConfetti, subscribeConfetti } from "@/lib/loop-store";

export const Route = createFileRoute("/passport")({
  head: () => ({ meta: [{ title: "Passport — Confetti" }] }),
  component: PassportPage,
});

const BADGES = [
  { id: "explorer", label: "Explorer", icon: Compass, unlocked: true },
  { id: "night-owl", label: "Night Owl", icon: Moon, unlocked: true },
  { id: "foodie", label: "Foodie", icon: Pizza, unlocked: true },
  { id: "social", label: "Social Butterfly", icon: Users, unlocked: false },
  { id: "trail", label: "Trailblazer", icon: MapIcon, unlocked: false },
  { id: "legend", label: "Local Legend", icon: Crown, unlocked: false },
];

const REWARDS = [
  { id: "r1", label: "$10 off a Booking", cost: 500 },
  { id: "r2", label: "Free cocktail", cost: 250 },
  { id: "r3", label: "VIP rooftop entry", cost: 1000 },
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
        <div className="mt-4 rounded-3xl border-2 border-ink bg-gradient-vibe p-6 text-cream shadow-brut-lg">
          <div className="flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-widest opacity-90">
            <Award className="h-3.5 w-3.5" /> Confetti Passport
          </div>
          <div className="mt-2 flex items-end justify-between gap-3">
            <div>
              <div className="font-display text-5xl font-extrabold leading-none">L{level}</div>
              <div className="mt-1 text-xs opacity-90">Level {level} Explorer</div>
            </div>
            <div className="text-right">
              <div className="font-display text-3xl font-extrabold">
                {confetti.toLocaleString()}
              </div>
              <div className="font-mono text-[10px] uppercase tracking-widest opacity-90">
                Confetti
              </div>
            </div>
          </div>
          <div className="mt-4">
            <div className="h-2 w-full overflow-hidden rounded-full bg-cream/20">
              <div className="h-full bg-cream" style={{ width: `${progress}%` }} />
            </div>
            <div className="mt-1 flex justify-between font-mono text-[9px] uppercase tracking-widest opacity-80">
              <span>Level {level}</span>
              <span>
                {nextLevelAt - confetti} to L{level + 1}
              </span>
            </div>
          </div>
        </div>

        {/* Badges */}
        <section className="mt-6">
          <h2 className="font-display text-lg font-bold">Badges</h2>
          <div className="mt-3 grid grid-cols-3 gap-3">
            {BADGES.map((b) => (
              <div
                key={b.id}
                className={`flex flex-col items-center gap-2 rounded-2xl border-2 p-4 text-center ${b.unlocked ? "border-ink bg-card shadow-brut" : "border-dashed border-ink/30 bg-card/50 opacity-60"}`}
              >
                <span
                  className={`grid h-12 w-12 place-items-center rounded-full ${b.unlocked ? "bg-gradient-vibe text-cream" : "bg-muted text-muted-foreground"}`}
                >
                  <b.icon className="h-5 w-5" />
                </span>
                <div className="font-display text-xs font-bold leading-tight">{b.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Activity */}
        <section className="mt-6">
          <h2 className="font-display text-lg font-bold">Recent activity</h2>
          <ul className="mt-3 space-y-2">
            {[
              { t: "+50 Confetti · Lila's Patio check-in", d: "Tonight" },
              { t: "Badge unlocked · Foodie", d: "Last week" },
              { t: "+50 Confetti · Aera Rooftop check-in", d: "Last week" },
            ].map((a, i) => (
              <li
                key={i}
                className="flex items-start gap-3 rounded-xl border border-border bg-card p-3"
              >
                <span className="grid h-9 w-9 place-items-center rounded-full bg-coral/10 text-coral">
                  <Sparkles className="h-4 w-4" />
                </span>
                <div>
                  <div className="text-sm font-semibold">{a.t}</div>
                  <div className="text-xs text-muted-foreground">{a.d}</div>
                </div>
              </li>
            ))}
          </ul>
        </section>

        {/* Rewards */}
        <section className="mt-6">
          <h2 className="font-display text-lg font-bold flex items-center gap-2">
            <Gift className="h-5 w-5" /> Redeem Confetti
          </h2>
          <ul className="mt-3 space-y-2">
            {REWARDS.map((r) => {
              const can = confetti >= r.cost;
              return (
                <li
                  key={r.id}
                  className="flex items-center justify-between rounded-xl border-2 border-ink bg-card p-3 shadow-brut"
                >
                  <div>
                    <div className="font-display text-sm font-bold">{r.label}</div>
                    <div className="font-mono text-[10px] uppercase tracking-widest text-ink/60">
                      {r.cost} Confetti
                    </div>
                  </div>
                  <button
                    disabled={!can}
                    className="rounded-full border-2 border-ink bg-coral px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-widest text-cream disabled:opacity-40"
                  >
                    {can ? "Redeem" : "Locked"}
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      </div>
    </div>
  );
}
