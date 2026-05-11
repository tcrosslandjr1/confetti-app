import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight, ArrowLeft, Check, Sparkles } from "lucide-react";
import { markOnboarded, saveOnboarding } from "@/lib/loop-store";

export const Route = createFileRoute("/onboarding")({
  head: () => ({ meta: [{ title: "Welcome — Confetti" }] }),
  component: Onboarding,
});

const CITIES = ["DC", "NYC", "LA", "Miami", "Atlanta", "Chicago"];
const CUISINES = [
  "Italian",
  "Mexican",
  "Japanese",
  "Seafood",
  "Korean",
  "Mediterranean",
  "Soul Food",
  "Indian",
  "Thai",
  "American",
  "Ethiopian",
  "Vegan",
];
const VIBES = [
  "Rooftop bars",
  "Live music",
  "Speakeasies",
  "Art galleries",
  "Outdoor dining",
  "Food halls",
  "Wine bars",
  "Comedy clubs",
  "Dancing",
  "Karaoke",
  "Breweries",
  "Jazz clubs",
];
const GROUPS = [
  { id: "solo", label: "Solo", emoji: "🚶" },
  { id: "couple", label: "Couple", emoji: "💑" },
  { id: "small", label: "Small group (3–5)", emoji: "👥" },
  { id: "squad", label: "Squad (6+)", emoji: "🎉" },
];

function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [city, setCity] = useState<string | null>(null);
  const [tastes, setTastes] = useState<string[]>([]);
  const [vibes, setVibes] = useState<string[]>([]);
  const [budget, setBudget] = useState(150);
  const [group, setGroup] = useState<string | null>(null);

  const totalSteps = 5;
  const titles = [
    "What city are you exploring?",
    "What are you into?",
    "Pick your vibe",
    "Your comfort zone",
    "Who's coming?",
  ];
  const subs = [
    "Pick your home base.",
    "Cuisines you love.",
    "Activities that pull you out.",
    "Per person, per outing.",
    "Default group size.",
  ];
  const canNext = [city, tastes.length > 0, vibes.length > 0, true, group][step];

  function toggle(arr: string[], setArr: (v: string[]) => void, v: string) {
    setArr(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);
  }

  function finish() {
    saveOnboarding({ city, tastes, vibes, budget, group });
    markOnboarded();
    navigate({ to: "/portal" });
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto flex min-h-screen max-w-md flex-col px-6 py-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-vibe text-cream">
              <Sparkles className="h-4 w-4" />
            </span>
            <span className="font-display text-lg font-extrabold">
              loop<span className="text-coral">.</span>
            </span>
          </div>
          <button
            onClick={finish}
            className="font-mono text-[10px] font-bold uppercase tracking-widest text-ink/60 hover:text-ink"
          >
            Skip
          </button>
        </div>

        <div className="mt-4 flex gap-1.5">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full transition-all ${i <= step ? "bg-gradient-vibe" : "bg-muted"}`}
            />
          ))}
        </div>

        <div className="mt-8">
          <h1 className="font-display text-3xl font-extrabold tracking-tight">{titles[step]}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{subs[step]}</p>
        </div>

        <div key={step} className="mt-8 flex-1 animate-[reveal-up_0.4s_ease-out]">
          {step === 0 && (
            <div className="grid grid-cols-3 gap-2">
              {CITIES.map((c) => (
                <Chip key={c} active={city === c} onClick={() => setCity(c)}>
                  {c}
                </Chip>
              ))}
            </div>
          )}
          {step === 1 && (
            <div className="flex flex-wrap gap-2">
              {CUISINES.map((c) => (
                <Chip
                  key={c}
                  active={tastes.includes(c)}
                  onClick={() => toggle(tastes, setTastes, c)}
                >
                  {c}
                </Chip>
              ))}
            </div>
          )}
          {step === 2 && (
            <div className="flex flex-wrap gap-2">
              {VIBES.map((v) => (
                <Chip key={v} active={vibes.includes(v)} onClick={() => toggle(vibes, setVibes, v)}>
                  {v}
                </Chip>
              ))}
            </div>
          )}
          {step === 3 && (
            <div>
              <div className="text-center">
                <div className="font-display text-5xl font-extrabold tracking-tight">
                  ${budget}
                  {budget >= 500 && "+"}
                </div>
                <div className="font-mono text-[10px] uppercase tracking-widest text-ink/60">
                  per person
                </div>
              </div>
              <input
                type="range"
                min={50}
                max={500}
                step={25}
                value={budget}
                onChange={(e) => setBudget(Number(e.target.value))}
                className="mt-6 w-full accent-coral"
              />
              <div className="mt-1 flex justify-between font-mono text-[10px] uppercase tracking-widest text-ink/60">
                <span>$50</span>
                <span>$500+</span>
              </div>
            </div>
          )}
          {step === 4 && (
            <div className="grid grid-cols-2 gap-3">
              {GROUPS.map((g) => (
                <button
                  key={g.id}
                  onClick={() => setGroup(g.id)}
                  className={`flex flex-col items-center gap-2 rounded-2xl border-2 p-5 transition-pop ${group === g.id ? "border-ink bg-coral text-cream shadow-brut" : "border-ink/15 bg-card hover:-translate-y-0.5 hover:border-ink"}`}
                >
                  <span className="text-3xl">{g.emoji}</span>
                  <div className="font-display text-sm font-bold text-center">{g.label}</div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="safe-bottom pt-6">
          <button
            disabled={!canNext}
            onClick={() => (step < totalSteps - 1 ? setStep(step + 1) : finish())}
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-ink bg-ink py-4 font-display text-sm font-bold uppercase tracking-wide text-cream shadow-brut transition-pop active:scale-95 disabled:opacity-40"
          >
            {step < totalSteps - 1 ? "Continue" : "Finish"} <ArrowRight className="h-4 w-4" />
          </button>
          {step > 0 && (
            <button
              onClick={() => setStep(step - 1)}
              className="mt-3 inline-flex w-full items-center justify-center gap-1 text-sm font-semibold text-ink/60 hover:text-ink"
            >
              <ArrowLeft className="h-3 w-3" /> Back
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

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
      className={`rounded-full border-2 px-4 py-2.5 text-sm font-semibold transition-pop ${
        active
          ? "border-ink bg-coral text-cream shadow-brut"
          : "border-ink/20 bg-card text-ink hover:border-ink"
      }`}
    >
      {active && <Check className="mr-1 inline h-3.5 w-3.5" />}
      {children}
    </button>
  );
}
