import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { rankName, levelFromXp, xpToNextLevel } from "@/lib/concierge-data";
import { BookMarked, MapPin, Plus, Sparkles, Trophy } from "lucide-react";
import { format } from "date-fns";

export const Route = createFileRoute("/concierge/passport")({
  head: () => ({ meta: [{ title: "Passport — Concierge" }] }),
  component: Passport,
});

type Visit = { id: string; venue_name: string; visited_at: string; xp_earned: number; notes: string | null };
type Achievement = { id: string; code: string; title: string; description: string; xp_reward: number; icon: string };
type Unlocked = { achievement_id: string };

function Passport() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<{ xp: number; display_name: string | null } | null>(null);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [unlocked, setUnlocked] = useState<Set<string>>(new Set());
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");

  const reload = async () => {
    if (!user) return;
    const [{ data: p }, { data: v }, { data: a }, { data: ua }] = await Promise.all([
      supabase.from("profiles").select("xp,display_name").eq("id", user.id).maybeSingle(),
      supabase.from("visits").select("*").eq("user_id", user.id).order("visited_at", { ascending: false }),
      supabase.from("achievements").select("*"),
      supabase.from("user_achievements").select("achievement_id").eq("user_id", user.id),
    ]);
    setProfile(p as any);
    setVisits((v ?? []) as Visit[]);
    setAchievements((a ?? []) as Achievement[]);
    setUnlocked(new Set((ua ?? []).map((x: any) => x.achievement_id)));
  };

  useEffect(() => { reload(); }, [user]);

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
    await supabase.from("profiles").update({ xp: newXp, level: levelFromXp(newXp) }).eq("id", user.id);

    // Unlock first_visit
    const firstVisit = achievements.find((a) => a.code === "first_visit");
    if (firstVisit && !unlocked.has(firstVisit.id)) {
      await supabase.from("user_achievements").insert({ user_id: user.id, achievement_id: firstVisit.id });
    }
    // Unlock dmv_native at 10 visits
    const dmvNative = achievements.find((a) => a.code === "dmv_native");
    if (dmvNative && !unlocked.has(dmvNative.id) && visits.length + 1 >= 10) {
      await supabase.from("user_achievements").insert({ user_id: user.id, achievement_id: dmvNative.id });
    }

    setName("");
    setAdding(false);
    void reload();
  };

  const xp = profile?.xp ?? 0;
  const { current, needed, level, next } = xpToNextLevel(xp);
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
            <div className="font-display text-2xl font-bold">{xp}</div>
          </div>
        </div>
        <div className="mt-4">
          <div className="h-2 overflow-hidden rounded-full bg-black/20">
            <div className="h-full bg-white" style={{ width: `${pct}%` }} />
          </div>
          <div className="mt-2 flex justify-between text-[11px] opacity-90">
            <span>{current} / {needed} XP</span>
            <span>Next: {next} XP</span>
          </div>
        </div>
      </div>

      {/* Quick add */}
      <form onSubmit={addVisit} className="mt-6 flex gap-2 rounded-2xl border border-border bg-card p-2 shadow-card">
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
                  got ? "border-transparent bg-gradient-warm text-primary-foreground shadow-pop" : "border-border bg-card opacity-70"
                }`}
              >
                <div className="grid h-9 w-9 place-items-center rounded-xl bg-black/15">
                  <Trophy className="h-4 w-4" />
                </div>
                <div className="mt-3 font-display text-sm font-bold">{a.title}</div>
                <div className="mt-1 text-[11px] opacity-90">{a.description}</div>
                <div className="mt-2 text-[10px] font-semibold uppercase tracking-wider">+{a.xp_reward} XP</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Visits */}
      <div className="mt-8">
        <h2 className="font-display text-lg font-bold">Stamps collected</h2>
        {visits.length === 0 ? (
          <div className="mt-3 rounded-3xl border border-dashed border-border bg-card/50 p-6 text-center">
            <BookMarked className="mx-auto h-7 w-7 text-muted-foreground" />
            <div className="mt-3 font-semibold">No stamps yet</div>
            <div className="mt-1 text-xs text-muted-foreground">Log your first visit to start your map.</div>
            <button
              onClick={() => navigate({ to: "/concierge" })}
              className="mt-4 inline-flex items-center gap-1 rounded-full bg-gradient-vibe px-4 py-2 text-xs font-semibold text-primary-foreground"
            >
              <Sparkles className="h-3.5 w-3.5" /> Find somewhere to go
            </button>
          </div>
        ) : (
          <div className="mt-3 space-y-2">
            {visits.map((v) => (
              <div key={v.id} className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 shadow-card">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-cool text-primary-foreground">
                  <MapPin className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate font-semibold">{v.venue_name}</div>
                  <div className="text-[11px] text-muted-foreground">
                    {format(new Date(v.visited_at), "MMM d, yyyy")}
                  </div>
                </div>
                <div className="text-xs font-semibold text-accent">+{v.xp_earned} XP</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
