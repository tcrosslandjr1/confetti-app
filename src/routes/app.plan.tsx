import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { Sparkles, ArrowUpRight, Loader2, Home, Tent, Users, Wine, Heart, Trees, MapPin, Clock, DollarSign } from "lucide-react";
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
import type { ActiveLoop } from "@/lib/loop-store";
import { getSelectedCity } from "@/lib/cities";
import { generateAiPlan, type AiItinerary } from "@/lib/generate-plan-client";
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
    vibe: (search.vibe as string) || undefined,
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

/**
 * Maps home-page vibe chip slugs → plan wizard preset values.
 * Lets every chip produce a distinct, pre-populated plan.
 */
const VIBE_CHIP_PRESETS: Record<string, { occasion: string; vibe: string; planType: PlanType }> = {
  "date-night":     { occasion: "Date",      vibe: "Classy",     planType: "date"    },
  "rooftop":        { occasion: "Friends",   vibe: "Rooftop",    planType: "go-out"  },
  "dive-bar-crawl": { occasion: "Friends",   vibe: "Chill",      planType: "go-out"  },
  "girls-night":    { occasion: "Friends",   vibe: "Turn-up",    planType: "friends" },
  "cozy":           { occasion: "Solo",      vibe: "Chill",      planType: "go-out"  },
  "birthday":       { occasion: "Birthday",  vibe: "Turn-up",    planType: "go-out"  },
  "foodie":         { occasion: "Friends",   vibe: "Chill",      planType: "go-out"  },
  "live-music":     { occasion: "Friends",   vibe: "Live music", planType: "go-out"  },
  "speakeasy":      { occasion: "Date",      vibe: "Classy",     planType: "go-out"  },
  "brunch":         { occasion: "Friends",   vibe: "Chill",      planType: "go-out"  },
};

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

  // AI plan generation state
  const [generatingPlan, setGeneratingPlan] = useState(false);
  const [aiItinerary, setAiItinerary] = useState<AiItinerary | null>(null);
  const [aiLoop, setAiLoop] = useState<ActiveLoop | null>(null);
  const [genError, setGenError] = useState<string | null>(null);
  const generationTriggered = useRef(false);

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

  /* ── AI Plan Generation ── */
  async function handleGeneratePlan(opts?: { surprise?: boolean }) {
    if (generatingPlan) return;
    setGeneratingPlan(true);
    setGenError(null);
    setAiItinerary(null);
    setAiLoop(null);
    try {
      const { itinerary, loop } = await generateAiPlan({
        occasion: occasion ?? "Night out",
        vibe: vibe ?? undefined,
        budget: budget ?? undefined,
        timeOfDay: when ?? undefined,
        groupSize,
        planType: planType ?? "go-out",
        surpriseMode: opts?.surprise ?? false,
      });
      setAiItinerary(itinerary);
      setAiLoop(loop);
    } catch (e) {
      const msg = (e as Error).message;
      setGenError(msg);
      toast.error("Couldn't generate plan", { description: msg });
    } finally {
      setGeneratingPlan(false);
    }
  }

  // Auto-trigger generation when wizard reaches results step
  useEffect(() => {
    if (step >= 4 && !generatingPlan && !aiItinerary && !genError && !generationTriggered.current) {
      generationTriggered.current = true;
      handleGeneratePlan({ surprise: mode === "surprise" });
    }
  }, [step]);

  // Reset generation state when user starts over
  useEffect(() => {
    if (step < 4) {
      generationTriggered.current = false;
      setAiItinerary(null);
      setAiLoop(null);
      setGenError(null);
    }
  }, [step]);

  /* ── Surprise Me mode — auto-trigger from home feed ── */
  const { mode, vibe: vibeParam } = Route.useSearch();
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

  /* ── Vibe chip — pre-populate from home page chip slug ── */
  useEffect(() => {
    if (!vibeParam) return;
    const preset = VIBE_CHIP_PRESETS[vibeParam];
    if (!preset) return;
    // Seed all wizard state from the chip so the right plan generates immediately.
    generationTriggered.current = false;
    setPlanType(preset.planType);
    setOccasion(preset.occasion);
    setVibe(preset.vibe);
    setBudget("$$");
    setWhen("Tonight");
    setStep(4); // jump straight to results — user already told us what they want
    const city = getSelectedCity();
    trackConversion("plan_completed", {
      occasion: preset.occasion,
      vibe: preset.vibe,
      budget: "$$",
      groupSize,
      when: "Tonight",
      vibeChip: vibeParam,
      city: city?.name ?? null,
      citySlug: city?.slug ?? null,
    });
  }, [vibeParam]);

  /* ── Book → boarding pass (localStorage-backed) ── */
  function handleBook() {
    if (aiLoop) {
      // Use real AI-generated loop
      aiLoop.passenger = user?.user_metadata?.display_name ?? user?.email ?? "YOU";
      setActiveLoop(aiLoop);
    } else {
      // Fallback if AI generation failed
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
      setActiveLoop(loop);
    }
    const city = getSelectedCity();
    trackConversion("plan_booked", {
      plan: aiItinerary?.title ?? "AI Plan",
      occasion, vibe, budget, groupSize, when,
      city: city?.name ?? null, citySlug: city?.slug ?? null,
    });
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
                "h-2 flex-1 rounded-full border-2 border-ink/20 transition-all",
                i < step ? "bg-coral" : i === step ? "bg-gold" : "bg-ink/10",
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
                  "inline-flex items-center gap-1.5 rounded-full border border-ink/20 px-3 py-1.5 font-mono text-[11px] font-bold uppercase tracking-widest transition-pop",
                  planType === key
                    ? "bg-coral text-cream shadow-sm"
                    : "bg-white text-ink/80 hover:-translate-y-0.5 hover:bg-ink/10",
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
            <div className="mb-5 rounded-2xl border border-dashed border-ink/15 bg-white p-3">
              <div className="font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-ink/50">
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
                    className="rounded-full border border-ink/20 bg-white px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-widest text-ink/70 hover:border-ink/40 hover:bg-gold/20 hover:text-ink"
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-coral">
              Pick the hangout
            </div>
            <h2 className="mt-1 font-display text-xl font-extrabold tracking-tight text-ink">
              What are we doing?
            </h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {HANGOUT_OCCASIONS.map((o) => (
                <button
                  key={o.key}
                  type="button"
                  onClick={() => setHangoutOccasion(o)}
                  className={cn(
                    "rounded-full border border-ink/20 px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-widest transition-pop",
                    hangoutOccasion?.key === o.key
                      ? "bg-coral text-cream shadow-sm"
                      : "bg-white text-ink/70 hover:-translate-y-0.5 hover:bg-ink/10",
                  )}
                >
                  {o.label}
                </button>
              ))}
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <label className="block">
                <div className="font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-ink/50">
                  City
                </div>
                <input
                  type="text"
                  value={hangoutCity}
                  onChange={(e) => setHangoutCity(e.target.value)}
                  placeholder="Washington, Baltimore…"
                  className="mt-1 w-full rounded-xl border border-ink/20 bg-white px-3 py-2 text-sm text-ink placeholder:text-ink/30 focus:border-coral focus:outline-none"
                />
              </label>
              <label className="block">
                <div className="font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-ink/50">
                  Start time
                </div>
                <input
                  type="time"
                  value={hangoutStart}
                  onChange={(e) => setHangoutStart(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-ink/20 bg-white px-3 py-2 text-sm text-ink focus:border-coral focus:outline-none"
                />
              </label>
              <div>
                <div className="font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-ink/50">
                  Guests
                </div>
                <div className="mt-1 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setHangoutGuests((g) => Math.max(2, g - 1))}
                    className="grid size-10 place-items-center rounded-full border border-ink/20 bg-white text-lg text-ink transition-pop hover:-translate-y-0.5 hover:bg-ink/10"
                  >
                    −
                  </button>
                  <span className="w-10 text-center font-display text-2xl font-extrabold text-ink">
                    {hangoutGuests}
                  </span>
                  <button
                    type="button"
                    onClick={() => setHangoutGuests((g) => Math.min(60, g + 1))}
                    className="grid size-10 place-items-center rounded-full border border-ink/20 bg-white text-lg text-ink transition-pop hover:-translate-y-0.5 hover:bg-ink/10"
                  >
                    +
                  </button>
                </div>
              </div>
              <div>
                <div className="font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-ink/50">
                  Budget tier
                </div>
                <div className="mt-1 flex flex-wrap gap-2">
                  {BUDGETS.map((b) => (
                    <button
                      key={b}
                      type="button"
                      onClick={() => setHangoutBudget(b)}
                      className={cn(
                        "rounded-full border border-ink/20 px-3 py-1.5 font-mono text-[11px] font-bold uppercase tracking-widest",
                        hangoutBudget === b ? "bg-coral text-cream shadow-sm" : "bg-white text-ink/70",
                      )}
                    >
                      {b}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <label className="mt-4 block">
              <div className="font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-ink/50">
                Anything else? (dietary, theme, kids ages, etc.)
              </div>
              <textarea
                value={hangoutNotes}
                onChange={(e) => setHangoutNotes(e.target.value)}
                rows={2}
                placeholder="e.g. one vegetarian, gluten-free, two kids under 5"
                className="mt-1 w-full resize-none rounded-xl border border-ink/20 bg-white px-3 py-2 text-sm text-ink placeholder:text-ink/30 focus:border-coral focus:outline-none"
              />
            </label>

            <div className="mt-6 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setPlanType(null)}
                className="font-mono text-[11px] font-bold uppercase tracking-widest text-ink/50 hover:text-ink"
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
                    "rounded-full border border-ink/20 px-4 py-2 font-mono text-[11px] font-bold uppercase tracking-widest transition-pop",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral focus-visible:ring-offset-2 focus-visible:ring-offset-cream",
                    current.value === c
                      ? "bg-coral text-cream shadow-sm"
                      : "bg-white text-ink/70 hover:-translate-y-0.5 hover:bg-ink/10",
                  )}
                >
                  {c}
                </button>
              ))}
            </div>
            {step === 1 && (
              <div className="mt-6">
                <label className="font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-ink/50">
                  Group size
                </label>
                <div className="mt-2 flex items-center gap-3">
                  <button
                    className="grid size-10 place-items-center rounded-full border border-ink/20 bg-white text-lg text-ink transition-pop hover:-translate-y-0.5 hover:bg-ink/10"
                    onClick={() => setGroupSize((g) => Math.max(1, g - 1))}
                  >
                    −
                  </button>
                  <span className="w-10 text-center font-display text-2xl font-extrabold text-ink">
                    {groupSize}
                  </span>
                  <button
                    className="grid size-10 place-items-center rounded-full border border-ink/20 bg-white text-lg text-ink transition-pop hover:-translate-y-0.5 hover:bg-ink/10"
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
                className="font-mono text-[11px] font-bold uppercase tracking-widest text-ink/50 hover:text-ink disabled:opacity-40"
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
            {/* Loading state while AI generates */}
            {generatingPlan && (
              <BrandCard tone="ink">
                <div className="relative p-6">
                  <div className="pointer-events-none absolute -right-6 -top-6 size-28 rounded-full bg-coral/40 blur-2xl" />
                  <div className="flex flex-col items-center gap-4 py-8">
                    <div className="relative">
                      <div className="absolute inset-0 animate-ping rounded-full bg-coral/20" />
                      <div className="relative grid size-14 place-items-center rounded-full bg-coral/10">
                        <Sparkles className="size-6 animate-pulse text-coral" />
                      </div>
                    </div>
                    <div className="text-center">
                      <p className="font-display text-lg font-extrabold text-cream">Cooking your night…</p>
                      <p className="mt-1 font-mono text-[11px] uppercase tracking-widest text-cream/50">
                        AI is finding real venues that match your vibe
                      </p>
                    </div>
                  </div>
                </div>
              </BrandCard>
            )}

            {/* Error state */}
            {genError && !generatingPlan && (
              <BrandCard tone="ink">
                <div className="p-5 text-center">
                  <p className="font-display text-base font-bold text-cream">Couldn't generate your plan</p>
                  <p className="mt-1 text-sm text-cream/60">{genError}</p>
                  <Button
                    variant="default"
                    size="sm"
                    className="mt-4"
                    onClick={() => {
                      generationTriggered.current = false;
                      setGenError(null);
                      handleGeneratePlan({ surprise: mode === "surprise" });
                    }}
                  >
                    Try again
                  </Button>
                </div>
              </BrandCard>
            )}

            {/* AI-generated plan display */}
            {aiItinerary && !generatingPlan && (
              <>
                <BrandCard tone="ink">
                  <div className="relative p-5">
                    <div className="pointer-events-none absolute -right-6 -top-6 size-28 rounded-full bg-coral/40 blur-2xl" />
                    <div className="flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-gold">
                      <Sparkles className="size-3.5" /> {aiItinerary.mood_emoji} Your night is plotted
                    </div>
                    <h2 className="mt-2 font-display text-xl font-extrabold tracking-tight text-cream">
                      {aiItinerary.title}
                    </h2>
                    <p className="mt-1 text-[13px] leading-relaxed text-cream/70">
                      {aiItinerary.tagline}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <span className="inline-flex items-center gap-1 rounded-full border border-cream/15 bg-cream/10 px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-widest text-cream/60">
                        <DollarSign className="size-3" /> {aiItinerary.total_budget_estimate}
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full border border-cream/15 bg-cream/10 px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-widest text-cream/60">
                        <Clock className="size-3" /> {aiItinerary.time_window}
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full border border-cream/15 bg-cream/10 px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-widest text-cream/60">
                        <Users className="size-3" /> {aiItinerary.group_size}
                      </span>
                    </div>
                  </div>
                </BrandCard>

                {/* Stops */}
                {aiItinerary.stops.map((stop, i) => (
                  <BrandCard key={`stop-${i}`} className="p-4">
                    <div className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className={cn(
                          "grid size-8 shrink-0 place-items-center rounded-full font-mono text-[11px] font-bold",
                          i === (aiItinerary.twist?.stop_number ?? 0) - 1
                            ? "bg-gold text-ink"
                            : "bg-coral/15 text-coral"
                        )}>
                          {i + 1}
                        </div>
                        {i < aiItinerary.stops.length - 1 && (
                          <div className="mt-1 h-full w-px bg-ink/10" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1 pb-3">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h4 className="font-display text-[15px] font-extrabold tracking-tight text-ink">
                              {stop.venue_name}
                              {i === (aiItinerary.twist?.stop_number ?? 0) - 1 && " ✨"}
                            </h4>
                            <div className="mt-0.5 flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wide text-ink/45">
                              <MapPin className="size-3" />
                              {stop.neighborhood}
                            </div>
                          </div>
                          <span className="shrink-0 rounded-full border border-ink/15 bg-white px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-widest text-ink/50">
                            {stop.arrival}
                          </span>
                        </div>
                        <p className="mt-1.5 text-[12px] leading-relaxed text-ink/60">
                          {stop.purpose}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          <span className="rounded-full bg-ink/5 px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-widest text-ink/40">
                            {stop.vibe}
                          </span>
                          <span className="rounded-full bg-ink/5 px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-widest text-ink/40">
                            {stop.duration}
                          </span>
                          <span className="rounded-full bg-ink/5 px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-widest text-ink/40">
                            {stop.category.replace(/_/g, " ")}
                          </span>
                        </div>
                        {stop.pro_tip && (
                          <div className="mt-2 rounded-lg border border-gold/20 bg-gold/5 px-2.5 py-1.5">
                            <span className="font-mono text-[9px] font-bold uppercase tracking-widest text-gold/70">Pro tip: </span>
                            <span className="text-[11px] text-ink/60">{stop.pro_tip}</span>
                          </div>
                        )}
                        {stop.logistics && i > 0 && (
                          <p className="mt-1.5 font-mono text-[10px] italic text-ink/30">
                            {stop.logistics}
                          </p>
                        )}
                      </div>
                    </div>
                  </BrandCard>
                ))}

                {/* Twist callout */}
                {aiItinerary.twist && (
                  <BrandCard className="border-gold/30 bg-gold/5 p-4">
                    <div className="flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-gold">
                      ✨ Twist moment
                    </div>
                    <p className="mt-1 text-[13px] text-ink/70">{aiItinerary.twist.description}</p>
                  </BrandCard>
                )}

                {/* Captain's note */}
                {aiItinerary.boarding_pass?.captain_note && (
                  <BrandCard className="p-4">
                    <div className="font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-ink/40">
                      Captain's note
                    </div>
                    <p className="mt-1 text-[13px] italic text-ink/60">
                      "{aiItinerary.boarding_pass.captain_note}"
                    </p>
                  </BrandCard>
                )}

                {/* Action buttons */}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    disabled={saving}
                    onClick={() => handleSave(aiItinerary.title)}
                  >
                    {saving ? <Loader2 className="size-3.5 animate-spin" /> : "Save trip"}
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    className="flex-1 gap-1.5"
                    onClick={() => handleBook()}
                  >
                    <Sparkles className="size-3.5" /> Get boarding pass
                  </Button>
                </div>
              </>
            )}

            <button
              className="w-full py-3 font-mono text-[11px] font-bold uppercase tracking-widest text-ink/50 hover:text-ink"
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
