import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { CUISINES, ACTIVITIES, rankName, levelFromXp } from "@/lib/concierge-data";
import { LogOut, Save, Sparkles, User as UserIcon } from "lucide-react";

export const Route = createFileRoute("/concierge/profile")({
  head: () => ({ meta: [{ title: "Profile — Concierge" }] }),
  component: Profile,
});



function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-pop ${
        active ? "border-transparent bg-gradient-vibe text-primary-foreground shadow-pop" : "border-border bg-card text-foreground"
      }`}
    >
      {children}
    </button>
  );
}

function Profile() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [xp, setXp] = useState(0);
  const [cuisines, setCuisines] = useState<string[]>([]);
  const [activities, setActivities] = useState<string[]>([]);
  const [budget, setBudget] = useState<[number, number]>([25, 100]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [{ data: p }, { data: prefs }] = await Promise.all([
        supabase.from("profiles").select("display_name,xp").eq("id", user.id).maybeSingle(),
        supabase.from("user_preferences").select("*").eq("user_id", user.id).maybeSingle(),
      ]);
      setName(p?.display_name ?? "");
      setXp(p?.xp ?? 0);
      if (prefs) {
        setCuisines(prefs.cuisines ?? []);
        setActivities(prefs.activities ?? []);
        setBudget([prefs.budget_min ?? 25, prefs.budget_max ?? 100]);
      }
    })();
  }, [user]);

  const toggle = (arr: string[], setArr: (v: string[]) => void, v: string) =>
    setArr(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);

  const save = async () => {
    if (!user) return;
    setSaving(true);
    await supabase.from("profiles").update({ display_name: name }).eq("id", user.id);
    await supabase.from("user_preferences").upsert({
      user_id: user.id,
      cuisines, activities,
      budget_min: budget[0], budget_max: budget[1],
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  const level = levelFromXp(xp);

  return (
    <div className="px-5 pt-10">
      <div className="text-xs uppercase tracking-wider text-muted-foreground">Profile</div>
      <h1 className="mt-1 font-display text-3xl font-bold">You</h1>

      <div className="mt-5 flex items-center gap-4 rounded-3xl border border-border bg-card p-4 shadow-card">
        <div className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-vibe text-primary-foreground">
          <UserIcon className="h-6 w-6" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate font-display text-lg font-bold">{name || user?.email}</div>
          <div className="truncate text-xs text-muted-foreground">{user?.email}</div>
          <div className="mt-1 inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider">
            <Sparkles className="h-3 w-3" /> Lvl {level} · {rankName(level)}
          </div>
        </div>
      </div>

      <div className="mt-6 space-y-5">
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Display name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-2 w-full rounded-2xl border border-border bg-card px-4 py-3 text-sm outline-none ring-ring/30 focus:ring-2"
          />
        </div>

        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Favorite cuisines</label>
          <div className="mt-2 flex flex-wrap gap-2">
            {CUISINES.map((c) => (
              <Chip key={c} active={cuisines.includes(c)} onClick={() => toggle(cuisines, setCuisines, c)}>{c}</Chip>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Activities you like</label>
          <div className="mt-2 flex flex-wrap gap-2">
            {ACTIVITIES.map((a) => (
              <Chip key={a} active={activities.includes(a)} onClick={() => toggle(activities, setActivities, a)}>{a}</Chip>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Budget</label>
          <div className="mt-2 grid grid-cols-4 gap-2">
            {[
              { label: "Easy", min: 0, max: 40 },
              { label: "Mid", min: 25, max: 75 },
              { label: "Treat", min: 50, max: 150 },
              { label: "Splurge", min: 100, max: 400 },
            ].map((b) => {
              const active = budget[0] === b.min && budget[1] === b.max;
              return (
                <button
                  key={b.label}
                  onClick={() => setBudget([b.min, b.max])}
                  className={`rounded-2xl border p-3 text-xs font-semibold transition-pop ${
                    active ? "border-transparent bg-gradient-cool text-primary-foreground shadow-pop" : "border-border bg-card"
                  }`}
                >
                  <div>{b.label}</div>
                  <div className="text-[10px] opacity-80">${b.min}–${b.max}</div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <button
        onClick={save}
        disabled={saving}
        className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-vibe py-3.5 text-sm font-semibold text-primary-foreground shadow-pop disabled:opacity-60"
      >
        <Save className="h-4 w-4" /> {saved ? "Saved!" : saving ? "Saving..." : "Save changes"}
      </button>

      <button
        onClick={async () => { await signOut(); navigate({ to: "/auth" }); }}
        className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-border bg-card py-3.5 text-sm font-semibold"
      >
        <LogOut className="h-4 w-4" /> Sign out
      </button>
    </div>
  );
}
