import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { CUISINES, ACTIVITIES } from "@/lib/concierge-data";
import { ArrowRight, Check, Loader2, Sparkles } from "lucide-react";

export const Route = createFileRoute("/onboarding")({
  head: () => ({ meta: [{ title: "Set up — Concierge" }] }),
  component: Onboarding,
});

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-4 py-2.5 text-sm font-medium transition-pop ${
        active
          ? "border-transparent bg-gradient-vibe text-primary-foreground shadow-pop"
          : "border-border bg-card text-foreground"
      }`}
    >
      {active && <Check className="mr-1 inline h-3.5 w-3.5" />}
      {children}
    </button>
  );
}

function Onboarding() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [cuisines, setCuisines] = useState<string[]>([]);
  const [activities, setActivities] = useState<string[]>([]);
  const [budget, setBudget] = useState<[number, number]>([25, 100]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) navigate({ to: "/auth" });
  }, [user, authLoading, navigate]);

  const toggle = (arr: string[], setArr: (v: string[]) => void, v: string) =>
    setArr(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);

  const finish = async () => {
    if (!user) return;
    setSaving(true);
    await supabase.from("user_preferences").upsert({
      user_id: user.id,
      cuisines,
      activities,
      budget_min: budget[0],
      budget_max: budget[1],
    });
    await supabase.from("profiles").update({ onboarding_complete: true }).eq("id", user.id);
    setSaving(false);
    navigate({ to: "/concierge" });
  };

  const steps = [
    {
      title: "What do you eat?",
      sub: "Pick a few cuisines you love — we'll prioritize them.",
      content: (
        <div className="flex flex-wrap gap-2">
          {CUISINES.map((c) => (
            <Chip key={c} active={cuisines.includes(c)} onClick={() => toggle(cuisines, setCuisines, c)}>
              {c}
            </Chip>
          ))}
        </div>
      ),
      canNext: cuisines.length > 0,
    },
    {
      title: "What's your scene?",
      sub: "Activities and vibes that get you out of the house.",
      content: (
        <div className="flex flex-wrap gap-2">
          {ACTIVITIES.map((a) => (
            <Chip key={a} active={activities.includes(a)} onClick={() => toggle(activities, setActivities, a)}>
              {a}
            </Chip>
          ))}
        </div>
      ),
      canNext: activities.length > 0,
    },
    {
      title: "What's your budget?",
      sub: "Per person, per outing. We'll respect it.",
      content: (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Easy", min: 0, max: 40, emoji: "🪙" },
              { label: "Mid", min: 25, max: 75, emoji: "💵" },
              { label: "Treat", min: 50, max: 150, emoji: "💎" },
              { label: "Splurge", min: 100, max: 400, emoji: "🥂" },
            ].map((b) => {
              const active = budget[0] === b.min && budget[1] === b.max;
              return (
                <button
                  key={b.label}
                  type="button"
                  onClick={() => setBudget([b.min, b.max])}
                  className={`rounded-2xl border p-4 text-left transition-pop ${
                    active ? "border-transparent bg-gradient-cool text-primary-foreground shadow-pop" : "border-border bg-card"
                  }`}
                >
                  <div className="text-2xl">{b.emoji}</div>
                  <div className="mt-2 font-display text-lg font-bold">{b.label}</div>
                  <div className="text-xs opacity-80">${b.min}–${b.max}</div>
                </button>
              );
            })}
          </div>
        </div>
      ),
      canNext: true,
    },
  ];

  const cur = steps[step];

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto flex min-h-screen max-w-md flex-col px-6 py-8">
        <div className="flex items-center gap-3">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-vibe">
            <Sparkles className="h-4 w-4 text-primary-foreground" />
          </div>
          <div className="text-xs text-muted-foreground">Step {step + 1} of {steps.length}</div>
        </div>

        <div className="mt-3 flex gap-1.5">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full ${i <= step ? "bg-gradient-vibe" : "bg-muted"}`}
            />
          ))}
        </div>

        <div className="mt-8">
          <h1 className="font-display text-3xl font-bold leading-tight">{cur.title}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{cur.sub}</p>
        </div>

        <div className="mt-8 flex-1">{cur.content}</div>

        <div className="safe-bottom pt-6">
          <button
            disabled={!cur.canNext || saving}
            onClick={() => (step < steps.length - 1 ? setStep(step + 1) : finish())}
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-vibe py-4 text-sm font-semibold text-primary-foreground shadow-pop transition-pop active:scale-95 disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : (
              <>
                {step < steps.length - 1 ? "Continue" : "Finish setup"}
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
          {step > 0 && (
            <button onClick={() => setStep(step - 1)} className="mt-3 w-full text-center text-sm text-muted-foreground">
              Back
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
