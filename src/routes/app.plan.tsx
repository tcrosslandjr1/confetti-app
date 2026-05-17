import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Sparkles } from "lucide-react";
import { MobileHeader } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/app/plan")({
  component: PlanMyNightPage,
});

const OCCASIONS = ["Date", "Friends", "Birthday", "Solo", "Out-of-towner"];
const VIBES = ["Chill", "Classy", "Rooftop", "Turn-up", "Live music"];
const BUDGETS = ["$", "$$", "$$$", "$$$$"];
const TIMES = ["Now", "Tonight", "This weekend", "Pick a date"];

function PlanMyNightPage() {
  const [step, setStep] = useState(0);
  const [occasion, setOccasion] = useState<string | null>(null);
  const [vibe, setVibe] = useState<string | null>(null);
  const [budget, setBudget] = useState<string | null>(null);
  const [groupSize, setGroupSize] = useState(2);
  const [when, setWhen] = useState<string | null>(null);

  const steps = [
    {
      title: "What's the occasion?",
      choices: OCCASIONS,
      value: occasion,
      set: setOccasion,
    },
    { title: "Pick a vibe", choices: VIBES, value: vibe, set: setVibe },
    { title: "Budget per person", choices: BUDGETS, value: budget, set: setBudget },
    { title: "When?", choices: TIMES, value: when, set: setWhen },
  ];
  const current = steps[step];
  const isReady = step >= steps.length;

  return (
    <div className="pb-6">
      <MobileHeader eyebrow="AI Planner" title="Let me cook." />
      <div className="px-5">
        <div className="mb-4 flex items-center gap-1.5">
          {steps.map((_, i) => (
            <div
              key={i}
              className={cn("h-1 flex-1 rounded-full", i <= step ? "bg-primary" : "bg-muted")}
            />
          ))}
        </div>

        {!isReady ? (
          <Card className="p-5">
            <h2 className="text-lg font-semibold">{current.title}</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {current.choices.map((c) => (
                <button
                  key={c}
                  onClick={() => current.set(c)}
                  className={cn(
                    "rounded-full border px-4 py-2 text-sm font-medium",
                    current.value === c
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-card hover:bg-muted",
                  )}
                >
                  {c}
                </button>
              ))}
            </div>
            {step === 1 && (
              <div className="mt-5">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Group size
                </label>
                <div className="mt-2 flex items-center gap-3">
                  <button
                    className="grid size-9 place-items-center rounded-full bg-muted text-lg"
                    onClick={() => setGroupSize((g) => Math.max(1, g - 1))}
                  >
                    −
                  </button>
                  <span className="w-8 text-center text-lg font-bold">{groupSize}</span>
                  <button
                    className="grid size-9 place-items-center rounded-full bg-muted text-lg"
                    onClick={() => setGroupSize((g) => g + 1)}
                  >
                    +
                  </button>
                </div>
              </div>
            )}
            <div className="mt-6 flex justify-between">
              <Button variant="ghost" disabled={step === 0} onClick={() => setStep((s) => s - 1)}>
                Back
              </Button>
              <Button disabled={!current.value} onClick={() => setStep((s) => s + 1)}>
                Next
              </Button>
            </div>
          </Card>
        ) : (
          <div className="space-y-4">
            <Card className="bg-gradient-to-br from-primary to-primary/70 p-5 text-primary-foreground">
              <div className="flex items-center gap-2 text-xs uppercase tracking-widest opacity-90">
                <Sparkles className="size-3.5" /> 3 plans cooked up
              </div>
              <p className="mt-2 text-sm">
                {occasion} · {vibe} · {budget} · party of {groupSize} · {when?.toLowerCase()}
              </p>
            </Card>

            {["A", "B", "C"].map((id, i) => (
              <Card key={id} className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-xs uppercase tracking-widest text-primary">Plan {id}</div>
                    <h3 className="mt-1 text-lg font-semibold">
                      {["Rooftop opener", "Classy crawl", "Late-night spin"][i]}
                    </h3>
                  </div>
                  <span className="rounded-full bg-muted px-3 py-1 text-xs">3 stops</span>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  Vibe-matched stops with timing and estimated cost.
                </p>
                <div className="mt-4 flex gap-2">
                  <Button asChild variant="outline" size="sm" className="flex-1">
                    <Link to="/app">Save</Link>
                  </Button>
                  <Button asChild size="sm" className="flex-1">
                    <Link to="/app">Book</Link>
                  </Button>
                </div>
              </Card>
            ))}

            <Button variant="ghost" className="w-full" onClick={() => setStep(0)}>
              Start over
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
