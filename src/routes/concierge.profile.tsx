import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { CUISINES, ACTIVITIES, rankName, levelFromXp } from "@/lib/concierge-data";
import { listUserGrants, listUserRedemptions, userBalance } from "@/lib/confetti-credits";
import { LogOut, Save, Sparkles, User as UserIcon } from "lucide-react";

export const Route = createFileRoute("/concierge/profile")({
  head: () => ({ meta: [{ title: "Profile — Confetti" }] }),
  component: Profile,
});

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-pop ${
        active
          ? "border-transparent bg-gradient-vibe text-primary-foreground shadow-pop"
          : "border-border bg-card text-foreground"
      }`}
    >
      {children}
    </button>
  );
}

const DIET_OPTIONS = [
  { k: "none", label: "No restriction" },
  { k: "vegan", label: "Vegan" },
  { k: "vegetarian", label: "Vegetarian" },
  { k: "pescatarian", label: "Pescatarian" },
  { k: "gluten-free", label: "Gluten-free" },
] as const;
type DietKey = (typeof DIET_OPTIONS)[number]["k"];

const ALLERGEN_OPTIONS = [
  "peanuts",
  "tree nuts",
  "shellfish",
  "dairy",
  "eggs",
  "soy",
  "sesame",
  "wheat/gluten",
  "fish",
];

function Profile() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [xp, setXp] = useState(0);
  const [cuisines, setCuisines] = useState<string[]>([]);
  const [activities, setActivities] = useState<string[]>([]);
  const [budget, setBudget] = useState<[number, number]>([25, 100]);
  const [diet, setDiet] = useState<DietKey>("none");
  const [allergens, setAllergens] = useState<string[]>([]);
  const [tasteProfile, setTasteProfile] = useState<Record<string, unknown>>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [{ data: p }, { data: prefs }, grants, redemptions] = await Promise.all([
        supabase.from("profiles").select("display_name,xp").eq("id", user.id).maybeSingle(),
        supabase.from("user_preferences").select("*").eq("user_id", user.id).maybeSingle(),
        listUserGrants(user.id),
        listUserRedemptions(user.id),
      ]);
      setName(p?.display_name ?? "");
      // Confetti balance maps 1:1 to XP so the profile reflects what's in the wallet.
      const confettiBalance = userBalance(grants, redemptions);
      setXp(Math.max(p?.xp ?? 0, confettiBalance));
      if (prefs) {
        setCuisines(prefs.cuisines ?? []);
        setActivities(prefs.activities ?? []);
        setBudget([prefs.budget_min ?? 25, prefs.budget_max ?? 100]);
        const tp = (prefs.taste_profile ?? {}) as Record<string, unknown>;
        setTasteProfile(tp);
        const dietRaw = String((tp.diet as string) ?? "").toLowerCase();
        const matched =
          DIET_OPTIONS.find((d) => d.k !== "none" && dietRaw.includes(d.k))?.k ?? "none";
        setDiet(matched as DietKey);
        const arr = Array.isArray(tp.allergens)
          ? (tp.allergens as unknown[]).map((s) => String(s).toLowerCase())
          : [];
        setAllergens(arr);
      }
    })();
  }, [user]);

  const toggle = (arr: string[], setArr: (v: string[]) => void, v: string) =>
    setArr(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);

  const save = async () => {
    if (!user) return;
    setSaving(true);
    await supabase.from("profiles").update({ display_name: name }).eq("id", user.id);
    const nextTp = { ...tasteProfile, diet: diet === "none" ? "" : diet, allergens };
    await supabase.from("user_preferences").upsert({
      user_id: user.id,
      cuisines,
      activities,
      budget_min: budget[0],
      budget_max: budget[1],
      taste_profile: nextTp,
    });
    setTasteProfile(nextTp);
    setSaving(false);
    setSaved(true);
    // Signal other surfaces (wizard, dashboard) to re-pull and re-filter
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("loop:diet-prefs-updated", { detail: { diet, allergens } }),
      );
    }
    setTimeout(() => setSaved(false), 1500);
  };


  const level = levelFromXp(xp);

  return (
    <div>
      <div className="text-xs uppercase tracking-wider text-muted-foreground">Account center</div>
      <h1 className="mt-1 font-display text-5xl font-bold tracking-tight">Your profile</h1>
      <p className="mt-3 max-w-2xl text-muted-foreground">
        Keep your tastes, budget, and outing preferences current so Confetti can plan better days and
        nights out.
      </p>

      <div className="mt-8 grid gap-8 xl:grid-cols-[minmax(0,1fr)_320px]">
        <section className="rounded-3xl border border-border bg-card p-6 shadow-card sm:p-8">
          <div className="flex flex-col gap-5 border-b border-border pb-6 sm:flex-row sm:items-center">
            <div className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-gradient-vibe text-primary-foreground">
              <UserIcon className="h-7 w-7" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate font-display text-2xl font-bold">{name || user?.email}</div>
              <div className="truncate text-sm text-muted-foreground">{user?.email}</div>
              <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-[10px] font-semibold uppercase tracking-wider">
                <Sparkles className="h-3 w-3" /> Lvl {level} · {rankName(level)}
              </div>
            </div>
          </div>

          <div className="mt-8 grid gap-7 lg:grid-cols-2">
            <div className="lg:col-span-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Display name
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-2 w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm outline-none ring-ring/30 focus:ring-2"
              />
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Favorite cuisines
              </label>
              <div className="mt-3 flex flex-wrap gap-2">
                {CUISINES.map((c) => (
                  <Chip
                    key={c}
                    active={cuisines.includes(c)}
                    onClick={() => toggle(cuisines, setCuisines, c)}
                  >
                    {c}
                  </Chip>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Activities you like
              </label>
              <div className="mt-3 flex flex-wrap gap-2">
                {ACTIVITIES.map((a) => (
                  <Chip
                    key={a}
                    active={activities.includes(a)}
                    onClick={() => toggle(activities, setActivities, a)}
                  >
                    {a}
                  </Chip>
                ))}
              </div>
            </div>

            <div className="lg:col-span-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Diet
              </label>
              <div className="mt-3 flex flex-wrap gap-2">
                {DIET_OPTIONS.map((d) => (
                  <Chip key={d.k} active={diet === d.k} onClick={() => setDiet(d.k)}>
                    {d.label}
                  </Chip>
                ))}
              </div>
            </div>

            <div className="lg:col-span-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Allergens to avoid
              </label>
              <div className="mt-3 flex flex-wrap gap-2">
                {ALLERGEN_OPTIONS.map((a) => (
                  <Chip
                    key={a}
                    active={allergens.includes(a)}
                    onClick={() => toggle(allergens, setAllergens, a)}
                  >
                    ⚠ {a}
                  </Chip>
                ))}
                {allergens.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setAllergens([])}
                    className="text-xs font-semibold uppercase tracking-wider text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                  >
                    Clear
                  </button>
                )}
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Dish picks re-filter immediately — these flow into the planner and concierge chat.
              </p>
            </div>

            <div className="lg:col-span-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Budget
              </label>
              <div className="mt-3 grid gap-3 sm:grid-cols-4">
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
                      className={`rounded-2xl border p-4 text-left text-sm font-semibold transition-pop ${
                        active
                          ? "border-transparent bg-gradient-cool text-primary-foreground shadow-pop"
                          : "border-border bg-background hover:bg-muted"
                      }`}
                    >
                      <div>{b.label}</div>
                      <div className="text-xs opacity-80">
                        ${b.min}–${b.max} per person
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <button
              onClick={save}
              disabled={saving}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-vibe px-6 py-3.5 text-sm font-semibold text-primary-foreground shadow-pop disabled:opacity-60"
            >
              <Save className="h-4 w-4" />{" "}
              {saved ? "Saved!" : saving ? "Saving..." : "Save changes"}
            </button>

            <button
              onClick={async () => {
                await signOut();
                navigate({ to: "/auth" });
              }}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-border bg-background px-6 py-3.5 text-sm font-semibold hover:bg-muted"
            >
              <LogOut className="h-4 w-4" /> Sign out
            </button>
          </div>
        </section>

        <aside className="rounded-3xl border border-border bg-card p-6 shadow-card">
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Taste snapshot
          </div>
          <div className="mt-4 space-y-4 text-sm">
            <div>
              <div className="font-semibold">Budget range</div>
              <div className="text-muted-foreground">
                ${budget[0]}–${budget[1]} per person
              </div>
            </div>
            <div>
              <div className="font-semibold">Cuisine picks</div>
              <div className="text-muted-foreground">
                {cuisines.length ? cuisines.join(", ") : "Choose a few favorites"}
              </div>
            </div>
            <div>
              <div className="font-semibold">Activity signals</div>
              <div className="text-muted-foreground">
                {activities.length ? activities.slice(0, 5).join(", ") : "Add the outings you like"}
              </div>
            </div>
            <div>
              <div className="font-semibold">Diet</div>
              <div className="text-muted-foreground">
                {DIET_OPTIONS.find((d) => d.k === diet)?.label ?? "No restriction"}
              </div>
            </div>
            <div>
              <div className="font-semibold">Avoiding</div>
              <div className="text-muted-foreground">
                {allergens.length ? allergens.join(", ") : "No allergens flagged"}
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
