import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Sparkles, ArrowUpRight, Loader2, Home, Tent, Users, Wine, Heart, Trees } from "lucide-react";
import { PageHero, BrandCard } from "@/components/PageHero";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { NotificationBell } from "@/components/NotificationBell";
import { useAuth } from "@/lib/auth-context";
import {
  usePageview,
  trackCta,
  trackEngagement,
  trackConversion,
} from "@/lib/analytics";
import { setActiveLoop, makeDemoLoop } from "@/lib/loop-store";
import { getSelectedCity } from "@/lib/cities";
import {
  createSkeletonItinerary,
  populateItinerary,
  type BuildPayload,
} from "@/lib/itineraries";
import { setActiveHangout, type HangoutPlan } from "@/lib/hangout-store";
import { toast } from "sonner";

export const Route = createFileRoute("/app/plan")({
  component: PlanMyNightPage,
  validateSearch: (search: Record<string, unknown>) => ({
    mode: (search.mode as string) || undefined,
  }),
});

const OCCASIONS = ["Date", "Friends", "Birthday", "Solo", "Out-of-towner"];
const VIBES = ["Chill", "Classy", "Rooftop", "Turn-up", "Live music"];
const BUDGETS = ["$", "$$", "$$$", "$$$$"];
const TIMES = ["Now", "Tonight", "This weekend", "Pick a date"];

type PlanType = "go-out" | "stay-in" | "host" | "outdoor" | "family" | "date" | "friends";

const PLAN_TYPES: Array<{ key: PlanType; label: string; icon: React.ComponentType<{ className?: string }>; hint: string }> = [
  { key: "go-out",   label: "Go out",   icon: ArrowUpRight, hint: "Bars, dinner, rooftops" },
  { key: "stay-in",  label: "Stay in",  icon: Home,         hint: "Movie night, porch drinks" },
  { key: "host",     label: "Host",     icon: Users,        hint: "Cookout, potluck, birthday" },
  { key: "outdoor",  label: "Outdoor",  icon: Tent,         hint: "Picnic, beach, tailgate" },
  { key: "family",   label: "Family",   icon: Heart,        hint: "Family day, kids day" },
  { key: "date",     label: "Date",     icon: Wine,         hint: "Date-night plans" },
  { key: "friends",  label: "Friends",  icon: Trees,        hint: "Low-key hang" },
];

/** 17 hangout occasions per the spec. */
const HANGOUT_OCCASIONS: Array<{ key: string; label: string }> = [
  { key: "crabs-backyard",     label: "Crabs in the backyard" },
  { key: "cookout",            label: "Cookout" },
  { key: "bbq",                label: "BBQ" },
  { key: "tailgate",           label: "Tailgate" },
  { key: "park-lunch",         label: "Park lunch" },
  { key: "picnic",             label: "Picnic" },
  { key: "beach-day",          label: "Beach day" },
  { key: "outdoor-gathering",  label: "Outdoor gathering" },
  { key: "game-night",         label: "Game night" },
  { key: "movie-night",        label: "Movie night" },
  { key: "porch-drinks",       label: "Porch drinks" },
  { key: "potluck",            label: "Potluck" },
  { key: "birthday-at-home",   label: "Birthday at home" },
  { key: "sunday-chill",       label: "Sunday chill" },
  { key: "family-day",         label: "Family day" },
  { key: "kids-day",           label: "Kids day out" },
  { key: "low-key-hang",       label: "Low-key hang" },
  { key: "theme-park",         label: "Theme park day" },
];

/** Which plan-type modes route through build-hangout vs the existing nightlife wizard. */
function isHangoutMode(t: PlanType): boolean {
  return t === "stay-in" || t === "host" || t === "outdoor" || t === "family";
}

function PlanMyNightPage() {
  usePageview("app_plan", "/app/plan");
  const { user } = useAuth();
  const navigate = useNavigate();
  const [planType, setPlanType] = useState<PlanType | null>(null);
  const [step, setStep] = useState(0);
  const [occasion, setOccasion] = useState<string | null>(null);
  const [vibe, setVibe] = useState<string | null>(null);
  const [budget, setBudget] = useState<string | null>(null);
  const [groupSize, setGroupSize] = useState(2);
  const [when, setWhen] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Hangout flow state (used when planType is one of the host/outdoor/stay-in/family modes)
  const [hangoutOccasion, setHangoutOccasion] = useState<{ key: string; label: string } | null>(null);
  const [hangoutCity, setHangoutCity] = useState("Washington");
  const [hangoutGuests, setHangoutGuests] = useState(6);
  const [hangoutBudget, setHangoutBudget] = useState<string>("$$");
  const [hangoutStart, setHangoutStart] = useState("18:00");
  const [hangoutNotes, setHangoutNotes] = useState("");
  const [buildingHangout, setBuildingHangout] = useState(false);

  async function handleBuildHangout() {
    if (!hangoutOccasion || buildingHangout) return;
    setBuildingHangout(true);
    try {
      const url = import.meta.env.VITE_SUPABASE_URL;
      const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      if (!url || !key) throw new Error("Supabase env missing");
      const res = await fetch(`${url}/functions/v1/build-hangout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: key,
          Authorization: `Bearer ${key}`,
        },
        body: JSON.stringify({
          occasion: hangoutOccasion.key,
          city: hangoutCity || undefined,
          guestCount: hangoutGuests,
          budget: hangoutBudget,
          startTime: hangoutStart,
          notes: hangoutNotes || undefined,
          setting: planType === "outdoor" || hangoutOccasion.key.includes("backyard") || hangoutOccasion.key.includes("park") || hangoutOccasion.key.includes("beach") || hangoutOccasion.key.includes("picnic") || hangoutOccasion.key.includes("tailgate") || hangoutOccasion.key.includes("cookout") || hangoutOccasion.key.includes("bbq")
            ? "outdoor"
            : planType === "stay-in"
              ? "indoor"
              : "either",
          mode: planType === "host" ? "host" : planType === "outdoor" ? "outdoor" : "stay-in",
        }),
      });
      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(`AI ${res.status}: ${txt.slice(0, 120)}`);
      }
      const data = (await res.json()) as { plan?: HangoutPlan; meta?: { occasion_key?: string } };
      if (!data.plan) throw new Error("No plan returned");
      setActiveHangout({
        id: `hangout-${Date.now()}`,
        occasion: hangoutOccasion.label,
        occasionKey: data.meta?.occasion_key ?? hangoutOccasion.key,
        city: hangoutCity || null,
        startTime: hangoutStart || null,
        date: null,
        mode: planType === "host" ? "host" : planType === "outdoor" ? "outdoor" : "stay-in",
        plan: data.plan,
        generatedAt: new Date().toISOString(),
      });
      trackConversion("hangout_built", {
        occasion: hangoutOccasion.key,
        city: hangoutCity,
        guestCount: hangoutGuests,
      });
      toast.success("Your hangout's plotted — let's go.");
      navigate({ to: "/hangout" });
    } catch (e) {
      toast.error("Couldn't build hangout", { description: (e as Error).message });
    } finally {
      setBuildingHangout(false);
    }
  }

  /* ── Surprise Me mode — auto-trigger from home feed ── */
  const { mode } = Route.useSearch();
  useEffect(() => {
    if (mode === "surprise") {
      setOccasion("Solo");
      setVibe("Chill");
      setBudget("$$");
      setWhen("Tonight");
      setStep(4); // skip wizard, jump to results
      const city = getSelectedCity();
      trackConversion("plan_completed", {
        occasion: "Solo",
        vibe: "Chill",
        budget: "$$",
        groupSize,
        when: "Tonight",
        surpriseMode: true,
        city: city?.name ?? null,
        citySlug: city?.slug ?? null,
      });
    }
  }, [mode]);

  /* ── Book → boarding pass (localStorage-backed) ── */
  function handleBook(planLabel: string) {
    const loop = makeDemoLoop({
      occasion: occasion ?? undefined,
      planParams: {
        occasionId: occasion ?? undefined,
        vibeId: vibe ?? undefined,
        groupSize,
        budget: budget ? (Number(budget) as 1 | 2 | 3 | 4) : undefined,
      },
      groupSize,
      passenger: user?.user_metadata?.display_name ?? user?.email ?? "Guest",
    });
    loop.to = `${vibe ?? "Epic"} ${occasion ?? "Night"}`;
    loop.gate = planLabel;
    setActiveLoop(loop);
    const city = getSelectedCity();
    trackConversion("plan_booked", { plan: planLabel, occasion, vibe, budget, groupSize, when, city: city?.name ?? null, citySlug: city?.slug ?? null });
    toast.success("Boarding pass ready — let's go!");
    navigate({ to: "/boarding-pass" });
  }

  /* ── Save → Supabase itinerary ── */
  async function handleSave(planLabel: string) {
    setSaving(true);
    try {
      const payload: BuildPayload = {
        occasion: occasion ?? "Night out",
        vibe: vibe ?? undefined,
        budget: budget ?? undefined,
      };
      const { id } = await createSkeletonItinerary(payload);
      const city = getSelectedCity();
      trackConversion("plan_saved", { plan: planLabel, itineraryId: id, city: city?.name ?? null, citySlug: city?.slug ?? null });
      toast.success("Trip saved — building your stops…");
      navigate({ to: "/trips/$id", params: { id } });
      populateItinerary(id, payload);
    } catch (err) {
      console.error(err);
      toast.error("Couldn't save the plan — try again.");
    } finally {
      setSaving(false);
    }
  }

  const steps = [
    { title: "What's the occasion?", choices: OCCASIONS, value: occasion, set: setOccasion },
    { title: "Pick a vibe", choices: VIBES, value: vibe, set: setVibe },
    { title: "Budget per person", choices: BUDGETS, value: budget, set: setBudget },
    { title: "When?", choices: TIMES, value: when, set: setWhen },
  ];
  const current = steps[step];
  const isReady = step >= steps.length;

  return (
    <div className="pb-8">
      <PageHero
        eyebrow="AI Planner // let's cook"
        badge="Beta"
        title={
          <>
            Let me <span className="font-serif italic font-normal text-coral">cook.</span>
          </>
        }
        subtitle="Four taps and your night is plotted, paced and priced."
        right={<NotificationBell userId={user?.id} />}
      >
        <div className="flex items-center gap-1.5">
          {steps.map((_, i) => (
            <div
              key={i}
              className={cn(
                "h-2 flex-1 rounded-full border-2 border-ink transition-all",
                i < step ? "bg-coral" : i === step ? "bg-gold" : "bg-white",
              )}
            />
          ))}
        </div>
      </PageHero>

      <div className="px-5 pt-5">
        {/* Plan type — choose Go out vs. a hangout flavor */}
        <BrandCard className="mb-4 p-4">
          <div className="font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-coral">
            What kind of plan?
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {PLAN_TYPES.map(({ key, label, icon: Icon, hint }) => (
              <button
                key={key}
                type="button"
                onClick={() => {
                  setPlanType(key);
                  trackEngagement("plan_type_chosen", { type: key });
                }}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border-2 border-ink px-3 py-1.5 font-mono text-[11px] font-bold uppercase tracking-widest transition-pop",
                  planType === key
                    ? "bg-ink text-cream shadow-brut"
                    : "bg-white text-ink hover:-translate-y-0.5 hover:shadow-brut",
                )}
                title={hint}
              >
                <Icon className="size-3.5" /> {label}
              </button>
            ))}
          </div>
        </BrandCard>

        {planType && isHangoutMode(planType) ? (
          <BrandCard className="p-6">
            <div className="mb-5 rounded-2xl border-2 border-dashed border-ink/20 bg-cream/40 p-3">
              <div className="font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-ink/60">
                Or try a demo
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {[
                  { label: "🦀 Crabs in Baltimore", o: HANGOUT_OCCASIONS[0], city: "Baltimore", guests: 8, budget: "$$", start: "14:00", notes: "" },
                  { label: "🎲 Game night DC", o: HANGOUT_OCCASIONS[8], city: "Washington", guests: 6, budget: "$", start: "19:30", notes: "close friends, competitive" },
                  { label: "🔥 Cookout backyard", o: HANGOUT_OCCASIONS[1], city: "Washington", guests: 10, budget: "$$", start: "15:00", notes: "" },
                  { label: "🧺 Park picnic", o: HANGOUT_OCCASIONS[4], city: "Washington", guests: 4, budget: "$", start: "12:30", notes: "" },
                ].map((d) => (
                  <button
                    key={d.label}
                    type="button"
                    onClick={() => {
                      setHangoutOccasion(d.o);
                      setHangoutCity(d.city);
                      setHangoutGuests(d.guests);
                      setHangoutBudget(d.budget);
                      setHangoutStart(d.start);
                      setHangoutNotes(d.notes);
                    }}
                    className="rounded-full border-2 border-ink/30 bg-cream px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-widest hover:border-ink hover:bg-gold/40"
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-coral">
              Pick the hangout
            </div>
            <h2 className="mt-1 font-display text-xl font-extrabold tracking-tight">
              What are we doing?
            </h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {HANGOUT_OCCASIONS.map((o) => (
                <button
                  key={o.key}
                  type="button"
                  onClick={() => setHangoutOccasion(o)}
                  className={cn(
                    "rounded-full border-2 border-ink px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-widest transition-pop",
                    hangoutOccasion?.key === o.key
                      ? "bg-ink text-cream shadow-brut"
                      : "bg-white text-ink hover:-translate-y-0.5 hover:shadow-brut",
                  )}
                >
                  {o.label}
                </button>
              ))}
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <label className="block">
                <div className="font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-ink/60">
                  City
                </div>
                <input
                  type="text"
                  value={hangoutCity}
                  onChange={(e) => setHangoutCity(e.target.value)}
                  placeholder="Washington, Baltimore…"
                  className="mt-1 w-full rounded-xl border-2 border-ink/20 bg-white px-3 py-2 text-sm focus:border-ink focus:outline-none"
                />
              </label>
              <label className="block">
                <div className="font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-ink/60">
                  Start time
                </div>
                <input
                  type="time"
                  value={hangoutStart}
                  onChange={(e) => setHangoutStart(e.target.value)}
                  className="mt-1 w-full rounded-xl border-2 border-ink/20 bg-white px-3 py-2 text-sm focus:border-ink focus:outline-none"
                />
              </label>
              <div>
                <div className="font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-ink/60">
                  Guests
                </div>
                <div className="mt-1 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setHangoutGuests((g) => Math.max(2, g - 1))}
                    className="grid size-10 place-items-center rounded-full border-2 border-ink bg-white text-lg shadow-brut transition-pop hover:-translate-y-0.5"
                  >
                    −
                  </button>
                  <span className="w-10 text-center font-display text-2xl font-extrabold">
                    {hangoutGuests}
                  </span>
                  <button
                    type="button"
                    onClick={() => setHangoutGuests((g) => Math.min(60, g + 1))}
                    className="grid size-10 place-items-center rounded-full border-2 border-ink bg-white text-lg shadow-brut transition-pop hover:-translate-y-0.5"
                  >
                    +
                  </button>
                </div>
              </div>
              <div>
                <div className="font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-ink/60">
                  Budget tier
                </div>
                <div className="mt-1 flex flex-wrap gap-2">
                  {BUDGETS.map((b) => (
                    <button
                      key={b}
                      type="button"
                      onClick={() => setHangoutBudget(b)}
                      className={cn(
                        "rounded-full border-2 border-ink px-3 py-1.5 font-mono text-[11px] font-bold uppercase tracking-widest",
                        hangoutBudget === b ? "bg-ink text-cream shadow-brut" : "bg-white text-ink",
                      )}
                    >
                      {b}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <label className="mt-4 block">
              <div className="font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-ink/60">
                Anything else? (dietary, theme, kids ages, etc.)
              </div>
              <textarea
                value={hangoutNotes}
                onChange={(e) => setHangoutNotes(e.target.value)}
                rows={2}
                placeholder="e.g. one vegetarian, gluten-free, two kids under 5"
                className="mt-1 w-full resize-none rounded-xl border-2 border-ink/20 bg-white px-3 py-2 text-sm focus:border-ink focus:outline-none"
              />
            </label>

            <div className="mt-6 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setPlanType(null)}
                className="font-mono text-[11px] font-bold uppercase tracking-widest text-ink/60 hover:text-ink"
              >
                ← Back
              </button>
              <Button
                variant="default"
                size="sm"
                onClick={handleBuildHangout}
                disabled={!hangoutOccasion || buildingHangout}
                className="gap-1.5"
              >
                {buildingHangout ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin" /> Cooking…
                  </>
                ) : (
                  <>
                    <Sparkles className="size-3.5" /> Build my hangout
                  </>
                )}
              </Button>
            </div>
          </BrandCard>
        ) : !isReady ? (
          <BrandCard className="p-6">
            <div className="font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-coral">
              Step {step + 1} of {steps.length}
            </div>
            <h2 className="mt-1 font-display text-xl font-extrabold tracking-tight text-ink">
              {current.title}
            </h2>
            <div className="mt-5 flex flex-wrap gap-2">
              {current.choices.map((c) => (
                <button
                  key={c}
                  onClick={() => {
                    current.set(c);
                    trackEngagement("plan_choice", { step: current.title, choice: c });
                  }}
                  className={cn(
                    "rounded-full border-2 border-ink px-4 py-2 font-mono text-[11px] font-bold uppercase tracking-widest transition-pop",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral focus-visible:ring-offset-2 focus-visible:ring-offset-white",
                    current.value === c
                      ? "bg-ink text-cream shadow-brut"
                      : "bg-white text-ink hover:-translate-y-0.5 hover:shadow-brut",
                  )}
                >
                  {c}
                </button>
              ))}
            </div>
            {step === 1 && (
              <div className="mt-6">
                <label className="font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-ink/60">
                  Group size
                </label>
                <div className="mt-2 flex items-center gap-3">
                  <button
                    className="grid size-10 place-items-center rounded-full border-2 border-ink bg-white text-lg shadow-brut transition-pop hover:-translate-y-0.5"
                    onClick={() => setGroupSize((g) => Math.max(1, g - 1))}
                  >
                    −
                  </button>
                  <span className="w-10 text-center font-display text-2xl font-extrabold">
                    {groupSize}
                  </span>
                  <button
                    className="grid size-10 place-items-center rounded-full border-2 border-ink bg-white text-lg shadow-brut transition-pop hover:-translate-y-0.5"
                    onClick={() => setGroupSize((g) => g + 1)}
                  >
                    +
                  </button>
                </div>
              </div>
            )}
            <div className="mt-7 flex items-center justify-between">
              <button
                disabled={step === 0}
                onClick={() => setStep((s) => s - 1)}
                className="font-mono text-[11px] font-bold uppercase tracking-widest text-ink/60 hover:text-ink disabled:opacity-40"
              >
                ← Back
              </button>
              <Button
                variant="default"
                size="sm"
                onClick={() => {
                  if (!current.value) return;
                  trackCta("plan_next", { step });
                  setStep((s) => s + 1);
                  if (step === steps.length - 1) {
                    const city = getSelectedCity();
                    trackConversion("plan_completed", {
                      occasion,
                      vibe,
                      budget,
                      groupSize,
                      when,
                      city: city?.name ?? null,
                      citySlug: city?.slug ?? null,
                    });
                  }
                }}
                disabled={!current.value}
                className="gap-1.5"
              >
                Next <ArrowUpRight className="size-3.5" />
              </Button>
            </div>
          </BrandCard>
        ) : (
          <div className="space-y-4">
            <BrandCard tone="ink">
              <div className="relative p-5">
                <div className="pointer-events-none absolute -right-6 -top-6 size-28 rounded-full bg-coral/40 blur-2xl" />
                <div className="flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-gold">
                  <Sparkles className="size-3.5" /> 3 plans cooked up
                </div>
                <p className="mt-2 font-display text-base font-bold">
                  {occasion} · {vibe} · {budget} · party of {groupSize} ·{" "}
                  {when?.toLowerCase()}
                </p>
              </div>
            </BrandCard>

            {["A", "B", "C"].map((id, i) => {
              const planLabel = ["Rooftop opener", "Classy crawl", "Late-night spin"][i];
              return (
                <BrandCard key={id} interactive className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-coral">
                        Plan {id}
                      </div>
                      <h3 className="mt-1 font-display text-lg font-extrabold">
                        {planLabel}
                      </h3>
                    </div>
                    <span className="rounded-full border-2 border-ink bg-gold px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-widest shadow-brut">
                      3 stops
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-ink/70">
                    Vibe-matched stops with timing and estimated cost.
                  </p>
                  <div className="mt-4 flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      disabled={saving}
                      onClick={() => handleSave(planLabel)}
                    >
                      {saving ? <Loader2 className="size-3.5 animate-spin" /> : "Save"}
                    </Button>
                    <Button
                      variant="default"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleBook(planLabel)}
                    >
                      Book
                    </Button>
                  </div>
                </BrandCard>
              );
            })}

            <button
              className="w-full py-3 font-mono text-[11px] font-bold uppercase tracking-widest text-ink/60 hover:text-ink"
              onClick={() => setStep(0)}
            >
              ↺ Start over
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
