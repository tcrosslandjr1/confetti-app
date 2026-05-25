import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Sparkles, ArrowUpRight, Loader2 } from "lucide-react";
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

function PlanMyNightPage() {
  usePageview("app_plan", "/app/plan");
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [occasion, setOccasion] = useState<string | null>(null);
  const [vibe, setVibe] = useState<string | null>(null);
  const [budget, setBudget] = useState<string | null>(null);
  const [groupSize, setGroupSize] = useState(2);
  const [when, setWhen] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

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
      trackConversion("plan_saved", { plan: planLabel, itineraryId: id });
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
        {!isReady ? (
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
