import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Trophy, Lock, Crown, Flame, Star, Medal, Sparkles, ArrowLeft, Search, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/portal/achievements")({
  head: () => ({
    meta: [
      { title: "Achievements — Concierge" },
      { name: "description", content: "Track your unlocked badges and learn how to earn the next one." },
    ],
  }),
  component: AchievementsPage,
});

type Achievement = {
  id: string;
  code: string;
  title: string;
  description: string;
  icon: string;
  xp_reward: number;
  unlocked: boolean;
  unlocked_at: string | null;
};

/** Friendly "how to unlock" hints, keyed by achievement.code with a sensible fallback. */
function unlockHint(a: Achievement): string {
  const code = (a.code || "").toLowerCase();
  const map: Record<string, string> = {
    first_steps: "Complete onboarding and log your first visit anywhere on Concierge.",
    first_visit: "Visit any venue and tap “Mark as visited” to log it.",
    first_booking: "Book your first reservation through Concierge.",
    first_referral: "Share your referral link and have a friend sign up.",
    weekend_warrior: "Log 3 visits across a single Friday–Sunday window.",
    night_owl: "Visit 5 different nightlife spots (bars, clubs, late-night eats).",
    foodie: "Visit 10 restaurants across at least 3 cuisines.",
    explorer: "Check in at venues in 5 different neighborhoods.",
    streak_3: "Log a visit on 3 consecutive weekends.",
    streak_5: "Log a visit on 5 consecutive weekends.",
    big_spender: "Cross $500 in tracked bookings on Concierge.",
    early_bird: "Book a reservation before 10am.",
    late_night: "Book or visit somewhere after midnight.",
    social_butterfly: "Connect at least 2 social accounts to your profile.",
    completionist: "Unlock every other achievement first — this one comes last.",
  };
  if (map[code]) return map[code];
  // Fallback: use the description if it reads like an instruction
  if (/visit|book|invite|share|complete|connect|earn|log/i.test(a.description)) return a.description;
  return `Keep using Concierge — this one unlocks for: ${a.description.toLowerCase()}.`;
}

function AchIcon({ name, className = "h-5 w-5" }: { name: string; className?: string }) {
  switch (name) {
    case "crown": return <Crown className={className} />;
    case "flame": return <Flame className={className} />;
    case "star": return <Star className={className} />;
    case "medal": return <Medal className={className} />;
    case "sparkles": return <Sparkles className={className} />;
    default: return <Trophy className={className} />;
  }
}

function formatDate(iso: string | null) {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  } catch { return ""; }
}

function AchievementsPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<"all" | "unlocked" | "locked">("all");

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    setLoading(true);
    (async () => {
      const [achRes, uaRes] = await Promise.all([
        supabase.from("achievements").select("id, code, title, description, icon, xp_reward"),
        supabase.from("user_achievements").select("achievement_id, unlocked_at").eq("user_id", user.id),
      ]);
      if (cancelled) return;
      const unlockedMap = new Map(((uaRes.data ?? []) as { achievement_id: string; unlocked_at: string | null }[]).map((r) => [r.achievement_id, r.unlocked_at]));
      const merged: Achievement[] = ((achRes.data ?? []) as Omit<Achievement, "unlocked" | "unlocked_at">[])
        .map((d) => ({ ...d, unlocked: unlockedMap.has(d.id), unlocked_at: unlockedMap.get(d.id) ?? null }))
        .sort((a, b) => Number(b.unlocked) - Number(a.unlocked) || a.xp_reward - b.xp_reward);
      setItems(merged);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [user]);

  const totals = useMemo(() => {
    const total = items.length;
    const unlocked = items.filter((a) => a.unlocked).length;
    const xpEarned = items.reduce((s, a) => s + (a.unlocked ? a.xp_reward : 0), 0);
    const xpAvailable = items.reduce((s, a) => s + (a.unlocked ? 0 : a.xp_reward), 0);
    const pct = total ? Math.round((unlocked / total) * 100) : 0;
    return { total, unlocked, xpEarned, xpAvailable, pct };
  }, [items]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((a) => {
      if (tab === "unlocked" && !a.unlocked) return false;
      if (tab === "locked" && a.unlocked) return false;
      if (!q) return true;
      return [a.title, a.description, a.code].some((s) => s.toLowerCase().includes(q));
    });
  }, [items, query, tab]);

  const unlocked = visible.filter((a) => a.unlocked);
  const locked = visible.filter((a) => !a.unlocked);

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-3">
        <Link to="/portal/profile" className="inline-flex items-center gap-1 text-xs font-mono uppercase tracking-wider text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to profile
        </Link>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground">My Portal</p>
            <h1 className="mt-1 flex items-center gap-2 font-display text-4xl font-bold"><Trophy className="h-8 w-8 text-primary" /> Achievements</h1>
            <p className="mt-2 max-w-2xl text-muted-foreground">Badges you've earned plus exactly how to unlock the next ones.</p>
          </div>
        </div>
      </header>

      {/* Progress summary */}
      <section className="rounded-3xl border border-border bg-card p-6 shadow-card">
        <div className="grid gap-4 sm:grid-cols-4">
          <Stat label="Unlocked" value={`${totals.unlocked}/${totals.total || "—"}`} hint={`${totals.pct}% complete`} />
          <Stat label="XP earned" value={totals.xpEarned.toLocaleString()} hint="From badges" />
          <Stat label="XP available" value={totals.xpAvailable.toLocaleString()} hint="Still on the table" />
          <Stat label="Next milestone" value={totals.unlocked === totals.total ? "All done!" : `${totals.total - totals.unlocked} to go`} hint="Keep exploring" />
        </div>
        <div className="mt-5 h-3 w-full overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-gradient-vibe transition-all" style={{ width: `${totals.pct}%` }} />
        </div>
      </section>

      {/* Filters */}
      <section className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search badges…" className="pl-9" />
        </div>
        <div role="tablist" className="flex rounded-full border border-border bg-card p-1 text-sm">
          {(["all", "unlocked", "locked"] as const).map((t) => (
            <button
              key={t}
              role="tab"
              aria-selected={tab === t}
              onClick={() => setTab(t)}
              className={`rounded-full px-3 py-1 font-semibold capitalize transition-colors ${tab === t ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              {t}
            </button>
          ))}
        </div>
      </section>

      {loading ? (
        <p className="rounded-2xl border border-dashed border-border bg-card/50 p-8 text-center text-sm text-muted-foreground">Loading achievements…</p>
      ) : visible.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border bg-card/50 p-8 text-center text-sm text-muted-foreground">No badges match your search.</p>
      ) : (
        <>
          {tab !== "locked" && unlocked.length > 0 && (
            <section>
              <h2 className="mb-3 flex items-center gap-2 font-display text-xl font-bold"><CheckCircle2 className="h-5 w-5 text-emerald-500" /> Unlocked</h2>
              <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {unlocked.map((a) => (
                  <li key={a.id} className="rounded-2xl border border-primary/40 bg-primary/5 p-4 shadow-card transition-pop hover:scale-[1.01] hover:shadow-pop">
                    <div className="flex items-start gap-3">
                      <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-gradient-vibe text-primary-foreground">
                        <AchIcon name={a.icon} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="truncate font-display text-base font-bold">{a.title}</h3>
                          <span className="shrink-0 font-mono text-[10px] uppercase tracking-widest text-primary">+{a.xp_reward} XP</span>
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">{a.description}</p>
                        {a.unlocked_at && (
                          <p className="mt-2 font-mono text-[10px] uppercase tracking-widest text-emerald-600 dark:text-emerald-400">Unlocked {formatDate(a.unlocked_at)}</p>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {tab !== "unlocked" && locked.length > 0 && (
            <section>
              <h2 className="mb-3 flex items-center gap-2 font-display text-xl font-bold"><Lock className="h-5 w-5 text-muted-foreground" /> Up next</h2>
              <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {locked.map((a) => (
                  <li key={a.id} className="rounded-2xl border border-border bg-card p-4 shadow-card transition-pop hover:scale-[1.01] hover:shadow-pop">
                    <div className="flex items-start gap-3">
                      <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-muted text-muted-foreground">
                        <Lock className="h-5 w-5" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="truncate font-display text-base font-bold">{a.title}</h3>
                          <span className="shrink-0 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">+{a.xp_reward} XP</span>
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">{a.description}</p>
                        <div className="mt-3 rounded-lg border border-dashed border-border bg-background/60 p-2.5">
                          <div className="flex items-start gap-2">
                            <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                            <p className="text-[11px] leading-snug text-foreground/80"><span className="font-semibold">How to unlock:</span> {unlockHint(a)}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}
    </div>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-2xl bg-muted/40 px-4 py-3">
      <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="mt-0.5 font-display text-2xl font-extrabold leading-tight">{value}</div>
      {hint && <div className="text-xs text-muted-foreground">{hint}</div>}
    </div>
  );
}
