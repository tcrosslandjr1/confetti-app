import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { rankName, levelFromXp, xpToNextLevel } from "@/lib/concierge-data";
import { listUserGrants, listUserRedemptions, userBalance } from "@/lib/confetti-credits";
import { BookMarked, MapPin, Plus, Sparkles, Trophy } from "lucide-react";


export const Route = createFileRoute("/concierge/passport")({
  head: () => ({ meta: [{ title: "Passport — Confetti" }] }),
  component: Passport,
});

type Visit = {
  id: string;
  venue_name: string;
  visited_at: string;
  xp_earned: number;
  notes: string | null;
};
type Achievement = {
  id: string;
  code: string;
  title: string;
  description: string;
  xp_reward: number;
  icon: string;
};
type Unlocked = { achievement_id: string };

function Passport() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<{ xp: number; display_name: string | null } | null>(null);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [unlocked, setUnlocked] = useState<Set<string>>(new Set());
  const [walletBalance, setWalletBalance] = useState(0);
  const [walletEarned, setWalletEarned] = useState(0);
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");

  const reload = async () => {
    if (!user) return;
    const [{ data: p }, { data: v }, { data: a }, { data: ua }, grants, redemptions] =
      await Promise.all([
        supabase.from("profiles").select("xp,display_name").eq("id", user.id).maybeSingle(),
        supabase
          .from("visits")
          .select("*")
          .eq("user_id", user.id)
          .order("visited_at", { ascending: false }),
        supabase.from("achievements").select("*"),
        supabase.from("user_achievements").select("achievement_id").eq("user_id", user.id),
        listUserGrants(user.id),
        listUserRedemptions(user.id),
      ]);
    setProfile(p as any);
    setVisits((v ?? []) as Visit[]);
    setAchievements((a ?? []) as Achievement[]);
    setUnlocked(new Set((ua ?? []).map((x: any) => x.achievement_id)));
    const earned = grants.reduce((s, g) => s + g.credits, 0);
    setWalletEarned(earned);
    setWalletBalance(userBalance(grants, redemptions));
  };

  useEffect(() => {
    reload();
  }, [user]);

  const addVisit = async (e: FormEvent) => {
    e.preventDefault();
    if (!user || !name.trim()) return;
    setAdding(true);
    const xpEarned = 25;
    await supabase.from("visits").insert({
      user_id: user.id,
      venue_name: name.trim(),
      xp_earned: xpEarned,
    });
    // Award XP
    const newXp = (profile?.xp ?? 0) + xpEarned;
    await supabase
      .from("profiles")
      .update({ xp: newXp, level: levelFromXp(newXp) })
      .eq("id", user.id);

    // Unlock first_visit
    const firstVisit = achievements.find((a) => a.code === "first_visit");
    if (firstVisit && !unlocked.has(firstVisit.id)) {
      await supabase
        .from("user_achievements")
        .insert({ user_id: user.id, achievement_id: firstVisit.id });
    }
    // Unlock dmv_native at 10 visits
    const dmvNative = achievements.find((a) => a.code === "dmv_native");
    if (dmvNative && !unlocked.has(dmvNative.id) && visits.length + 1 >= 10) {
      await supabase
        .from("user_achievements")
        .insert({ user_id: user.id, achievement_id: dmvNative.id });
    }

    setName("");
    setAdding(false);
    void reload();
  };

  const MOCK_STAMPS: { id: string; theme: string; city: string; date: string; stops: number; xp: number }[] = [
    { id: "ms-1", theme: "Harbor Heatwave", city: "Washington DC", date: "May 10, 2026", stops: 4, xp: 120 },
    { id: "ms-2", theme: "Moonlit Mischief", city: "Washington DC", date: "April 28, 2026", stops: 3, xp: 90 },
    { id: "ms-3", theme: "Velvet & Vinyl", city: "New York", date: "April 15, 2026", stops: 4, xp: 150 },
    { id: "ms-4", theme: "Neon Nomads", city: "Miami", date: "March 22, 2026", stops: 5, xp: 200 },
  ];
  const totalAdventures = MOCK_STAMPS.length;
  const citiesVisited = new Set(MOCK_STAMPS.map((s) => s.city)).size;

  // XP reflects actual wallet progress: Confetti earned (1:1 with XP) merged
  // with any direct profile XP from referrals/achievements.
  const xp = Math.max(profile?.xp ?? 0, walletEarned);
  const progress = xpToNextLevel(xp);
  const level = progress.level;
  const current = progress.current;
  const needed = progress.needed;
  const next = progress.next;
  const pct = Math.min(100, Math.round((current / needed) * 100));

  return (
    <div className="px-5 pt-10">
      <div className="text-xs uppercase tracking-wider text-muted-foreground">Your passport</div>
      <h1 className="mt-1 font-display text-3xl font-bold">{rankName(level)}</h1>

      {/* XP card */}
      <div className="mt-5 overflow-hidden rounded-3xl bg-gradient-hero p-5 text-primary-foreground shadow-pop">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs uppercase tracking-wider opacity-80">Level</div>
            <div className="font-display text-4xl font-bold leading-none">{level}</div>
          </div>
          <div className="text-right">
            <div className="text-xs uppercase tracking-wider opacity-80">XP</div>
            <div className="font-display text-2xl font-bold">{xp.toLocaleString()}</div>
            <div className="mt-0.5 text-[10px] uppercase tracking-wider opacity-80">
              {walletBalance.toLocaleString()} Confetti in wallet
            </div>
          </div>
        </div>
        <div className="mt-4">
          <div className="h-2 overflow-hidden rounded-full bg-black/20">
            <div
              className="h-full bg-white transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className="mt-2 flex justify-between text-[11px] opacity-90">
            <span>
              {current} / {needed} XP
            </span>
            <span>Next: Lvl {level + 1} · {next} XP</span>
          </div>
        </div>
      </div>

      {/* Quick add */}
      <form
        onSubmit={addVisit}
        className="mt-6 flex gap-2 rounded-2xl border border-border bg-card p-2 shadow-card"
      >
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Log a visit (e.g. Le Diplomate)"
          className="flex-1 bg-transparent px-3 py-2.5 text-sm outline-none placeholder:text-muted-foreground"
        />
        <button
          type="submit"
          disabled={!name.trim() || adding}
          className="inline-flex items-center gap-1 rounded-xl bg-gradient-vibe px-3 py-2 text-xs font-semibold text-primary-foreground shadow-pop disabled:opacity-50"
        >
          <Plus className="h-3.5 w-3.5" /> +25 XP
        </button>
      </form>

      {/* Achievements */}
      <div className="mt-8">
        <h2 className="font-display text-lg font-bold">Achievements</h2>
        <div className="mt-3 grid grid-cols-2 gap-3">
          {achievements.map((a) => {
            const got = unlocked.has(a.id);
            return (
              <div
                key={a.id}
                className={`rounded-2xl border p-4 ${
                  got
                    ? "border-transparent bg-gradient-warm text-primary-foreground shadow-pop"
                    : "border-border bg-card opacity-70"
                }`}
              >
                <div className="grid h-9 w-9 place-items-center rounded-xl bg-black/15">
                  <Trophy className="h-4 w-4" />
                </div>
                <div className="mt-3 font-display text-sm font-bold">{a.title}</div>
                <div className="mt-1 text-[11px] opacity-90">{a.description}</div>
                <div className="mt-2 text-[10px] font-semibold uppercase tracking-wider">
                  +{a.xp_reward} XP
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Stamps */}
      <div className="mt-8">
        <h2 className="font-display text-lg font-bold">Stamps collected</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {MOCK_STAMPS.map((s) => (
            <div
              key={s.id}
              className="relative overflow-hidden rounded-2xl border-2 border-ink bg-card p-4 shadow-card"
            >
              <div className="flex items-start gap-3">
                <div className="grid h-20 w-20 shrink-0 place-items-center rounded-full border-4 border-dashed border-coral bg-cream text-center">
                  <div>
                    <div className="font-mono text-[8px] uppercase tracking-widest text-coral">
                      Confetti
                    </div>
                    <div className="mt-0.5 font-display text-[9px] font-extrabold leading-tight text-ink">
                      {s.city.split(" ")[0].toUpperCase()}
                      <br />
                      {(s.city.split(" ").slice(1).join(" ") || "STAMP").toUpperCase()}
                    </div>
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                    <MapPin className="h-3 w-3" /> {s.city}
                  </div>
                  <div className="mt-1 font-display text-base font-extrabold text-ink">
                    {s.theme}
                  </div>
                  <div className="text-[11px] text-muted-foreground">{s.date}</div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <span className="inline-flex items-center gap-1 rounded-full border-2 border-ink bg-background px-2 py-0.5 text-[10px] font-bold text-ink">
                      <Sparkles className="h-2.5 w-2.5 text-coral" /> {s.stops} stops
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full border-2 border-ink bg-coral px-2 py-0.5 text-[10px] font-bold text-cream">
                      <Trophy className="h-2.5 w-2.5" /> {s.xp} XP
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Stats footer */}
      <div className="mt-6 grid gap-3 rounded-2xl border-2 border-ink bg-card p-5 shadow-card sm:grid-cols-3">
        <div className="text-center">
          <div className="font-display text-3xl font-extrabold text-coral">{totalAdventures}</div>
          <div className="mt-1 text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
            Total Adventures
          </div>
        </div>
        <div className="text-center">
          <div className="font-display text-3xl font-extrabold text-coral">{citiesVisited}</div>
          <div className="mt-1 text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
            Cities Visited
          </div>
        </div>
        <div className="text-center">
          <div className="font-display text-3xl font-extrabold text-coral">{xp.toLocaleString()}</div>
          <div className="mt-1 text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
            Total XP
          </div>
        </div>
      </div>
    </div>
  );
}
