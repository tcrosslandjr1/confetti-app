import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  Users, User, Heart, Cake, Briefcase, Home, Sparkles, Wand2,
  ArrowRight, ArrowLeft, Calendar, Clock, Check, MapPin, Loader2,
} from "lucide-react";
import { makeDemoLoop, setActiveLoop, type ActiveLoop } from "@/lib/loop-store";
import { VIBES } from "@/lib/concierge-data";
import { CITIES } from "@/lib/agents/city-context";
import { generatePlan } from "@/lib/generate-plan.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/create")({
  head: () => ({ meta: [{ title: "Create a Plan — Confetti" }] }),
  component: CreatePage,
});

const GROUP = [
  { id: "solo", label: "Solo", size: 1, Icon: User },
  { id: "couple", label: "Couple", size: 2, Icon: Heart },
  { id: "small", label: "3–5", size: 4, Icon: Users },
  { id: "squad", label: "6+", size: 6, Icon: Users },
];

const OCCASIONS = [
  { id: "date", label: "Date Night", emoji: "🌹", Icon: Heart },
  { id: "bday", label: "Birthday", emoji: "🎂", Icon: Cake },
  { id: "girls", label: "Girls Night", emoji: "💃", Icon: Sparkles },
  { id: "biz", label: "Business", emoji: "💼", Icon: Briefcase },
  { id: "fam", label: "Family", emoji: "👨‍👩‍👧", Icon: Home },
  { id: "just", label: "Just Because", emoji: "✨", Icon: Sparkles },
];

const DURATIONS = ["2 hr", "3 hr", "4 hr", "All night"];

function CreatePage() {
  const navigate = useNavigate();
  const generate = useServerFn(generatePlan);
  const [step, setStep] = useState(0);
  const [group, setGroup] = useState<(typeof GROUP)[number] | null>(null);
  const [occasion, setOccasion] = useState<(typeof OCCASIONS)[number] | null>(null);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [time, setTime] = useState("19:00");
  const [duration, setDuration] = useState("3 hr");
  const [vibe, setVibe] = useState<(typeof VIBES)[number] | null>(null);
  const [city, setCity] = useState(CITIES[0].label);
  const [generating, setGenerating] = useState(false);

  const totalSteps = 4;
  const canNext = [group, occasion, true, vibe][step];

  async function finish() {
    if (generating) return;
    setGenerating(true);
    try {
      // Taste Learning Agent input — pulled from the user's stored profile.
      let tasteSummaryStr: string | undefined;
      try {
        const { loadPrefs, tasteSummary } = await import("@/lib/taste");
        const prefs = await loadPrefs();
        const s = tasteSummary(prefs);
        if (s) tasteSummaryStr = s;
      } catch {
        /* anon user — no taste graph */
      }
      const plan = await generate({
        data: {
          city,
          occasionId: occasion?.id,
          occasionLabel: occasion?.label,
          vibeId: vibe?.id,
          vibeLabel: vibe?.label,
          groupSize: group?.size ?? 2,
          date,
          startTime: time,
          duration,
          tasteSummary: tasteSummaryStr,
        },
      });
      const loop: ActiveLoop = {
        ...makeDemoLoop({
          passenger: "GUEST",
          groupSize: group?.size ?? 2,
          occasion: occasion?.label,
          vibe: vibe?.label,
          to: occasion?.label.toUpperCase() ?? "NIGHT OUT",
          boardingTime: plan.stops[0]?.time ?? time.replace(/^0/, ""),
          stops: plan.stops.map((s) => ({
            id: s.id,
            name: s.name,
            type: s.type,
            time: s.time,
            area: s.area,
            venueId: s.venueId,
            lat: s.lat,
            lng: s.lng,
            rationale: s.rationale,
            slot: s.slot,
          })),
        }),
        city: plan.city,
        experienceName: plan.experienceName,
        experienceTagline: plan.experienceTagline,
        blueprint: plan.blueprint,
        estimatedSpend: plan.estimatedSpend,
        fitScore: plan.fitScore,
        guardrailNote: plan.guardrailNote,
        bonusMove: plan.bonus,
        planParams: {
          city,
          occasionId: occasion?.id,
          occasionLabel: occasion?.label,
          vibeId: vibe?.id,
          vibeLabel: vibe?.label,
          groupSize: group?.size ?? 2,
          date,
          startTime: time,
          duration,
        },
      };
      setActiveLoop(loop);
      navigate({ to: "/boarding-pass" });
    } catch (err) {
      console.error("[create] finish failed", err);
      toast.error("Couldn't build your night. Try again.");
      // Fallback so the user isn't stuck — drop them into the demo loop.
      try {
        const fallback = makeDemoLoop({
          passenger: "GUEST",
          groupSize: group?.size ?? 2,
          occasion: occasion?.label,
          vibe: vibe?.label,
          to: occasion?.label.toUpperCase() ?? "NIGHT OUT",
          boardingTime: time.replace(/^0/, ""),
        });
        setActiveLoop(fallback);
        navigate({ to: "/confirmation" });
      } catch {
        /* swallow */
      }
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="min-h-screen bg-background pb-32">
      <div className="mx-auto max-w-md px-4 pt-6">
        <div className="flex items-center justify-between">
          <button
            onClick={() => (step === 0 ? history.back() : setStep(step - 1))}
            className="inline-flex items-center gap-1 font-mono text-xs font-bold uppercase tracking-widest text-ink/70 hover:text-ink"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back
          </button>
          <span className="font-mono text-[10px] uppercase tracking-widest text-ink/60">
            Step {step + 1} / {totalSteps}
          </span>
        </div>
        <div className="mt-3 flex gap-1.5">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full ${i <= step ? "bg-gradient-vibe" : "bg-muted"}`}
            />
          ))}
        </div>

        <div className="mt-8 space-y-2">
          <h1 className="font-display text-3xl font-extrabold tracking-tight">
            {["Who's coming?", "What's the vibe?", "When?", "Pick your mood"][step]}
          </h1>
          <p className="text-sm text-muted-foreground">
            {
              [
                "Group size sets the table.",
                "We'll match the occasion.",
                "Choose your start.",
                "Set the energy.",
              ][step]
            }
          </p>
        </div>

        <div className="mt-8">
          {step === 0 && (
            <div className="space-y-4">
              <Link
                to="/quick-generate"
                className="block rounded-2xl border-2 border-ink bg-gradient-vibe p-5 text-cream shadow-brut transition-pop hover:-translate-y-0.5"
              >
                <div className="flex items-center gap-3">
                  <span className="grid h-12 w-12 place-items-center rounded-full bg-cream/20">
                    <Wand2 className="h-5 w-5" />
                  </span>
                  <div>
                    <div className="font-display text-lg font-bold">Generate for me</div>
                    <div className="text-xs opacity-90">
                      Skip the wizard — AI builds it from your taste profile.
                    </div>
                  </div>
                  <ArrowRight className="ml-auto h-5 w-5" />
                </div>
              </Link>
              <div className="grid grid-cols-2 gap-3">
                {GROUP.map((g) => {
                  const active = group?.id === g.id;
                  return (
                    <button
                      key={g.id}
                      onClick={() => setGroup(g)}
                      className={`group flex flex-col items-center gap-2 rounded-2xl border-2 p-5 transition-pop ${active ? "border-ink bg-coral text-cream shadow-brut" : "border-ink/15 bg-card hover:-translate-y-0.5 hover:border-ink"}`}
                    >
                      <g.Icon
                        className={`h-8 w-8 transition-transform ${active ? "scale-110" : "group-hover:scale-110"}`}
                      />
                      <div className="font-display text-base font-bold">{g.label}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="grid grid-cols-2 gap-3">
              {OCCASIONS.map((o) => {
                const active = occasion?.id === o.id;
                return (
                  <button
                    key={o.id}
                    onClick={() => setOccasion(o)}
                    className={`flex flex-col items-start gap-2 rounded-2xl border-2 p-4 text-left transition-pop ${active ? "border-ink bg-coral text-cream shadow-brut" : "border-ink/15 bg-card hover:-translate-y-0.5 hover:border-ink"}`}
                  >
                    <span className="text-3xl">{o.emoji}</span>
                    <div className="font-display text-sm font-bold">{o.label}</div>
                  </button>
                );
              })}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <label className="block">
                <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-ink/60 flex items-center gap-1">
                  <Calendar className="h-3 w-3" /> Date
                </span>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="mt-1 w-full rounded-xl border-2 border-ink bg-card px-4 py-3 font-display text-base font-bold"
                />
              </label>
              <label className="block">
                <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-ink/60 flex items-center gap-1">
                  <Clock className="h-3 w-3" /> Start time
                </span>
                <input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="mt-1 w-full rounded-xl border-2 border-ink bg-card px-4 py-3 font-display text-base font-bold"
                />
              </label>
              <label className="block">
                <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-ink/60 flex items-center gap-1">
                  <MapPin className="h-3 w-3" /> City
                </span>
                <select
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="mt-1 w-full rounded-xl border-2 border-ink bg-card px-4 py-3 font-display text-base font-bold"
                >
                  {CITIES.map((c) => (
                    <option key={c.slug} value={c.label}>{c.label}</option>
                  ))}
                </select>
              </label>
              <div>
                <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-ink/60">
                  Duration
                </span>
                <div className="mt-1 grid grid-cols-4 gap-2">
                  {DURATIONS.map((d) => (
                    <button
                      key={d}
                      onClick={() => setDuration(d)}
                      className={`rounded-xl border-2 py-3 font-display text-sm font-bold transition-pop ${duration === d ? "border-ink bg-coral text-cream shadow-brut" : "border-ink/15 bg-card hover:border-ink"}`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="grid grid-cols-2 gap-3">
              {VIBES.map((v) => {
                const active = vibe?.id === v.id;
                return (
                  <button
                    key={v.id}
                    onClick={() => setVibe(v)}
                    className={`flex flex-col items-center gap-2 rounded-2xl border-2 p-5 transition-pop ${active ? "border-ink bg-coral text-cream shadow-brut" : "border-ink/15 bg-card hover:-translate-y-0.5 hover:border-ink"}`}
                  >
                    <span className="text-3xl">{v.emoji}</span>
                    <div className="font-display text-sm font-bold">{v.label}</div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {step === 3 && vibe && (
          <div className="mt-6 rounded-2xl border-2 border-dashed border-ink/40 bg-card p-4">
            <div className="font-mono text-[10px] font-bold uppercase tracking-widest text-ink/60">
              Plan summary
            </div>
            <ul className="mt-2 space-y-1 text-sm">
              <li className="flex items-center gap-2">
                <Check className="h-3.5 w-3.5 text-coral" /> {group?.label} · party of {group?.size}
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-3.5 w-3.5 text-coral" /> {occasion?.emoji} {occasion?.label}
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-3.5 w-3.5 text-coral" /> {date} · {time} · {duration}
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-3.5 w-3.5 text-coral" /> {vibe.emoji} {vibe.label}
              </li>
            </ul>
          </div>
        )}

        <div className="mt-8">
          <button
            disabled={!canNext || generating}
            onClick={() => (step < totalSteps - 1 ? setStep(step + 1) : finish())}
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-ink bg-ink px-4 py-4 font-display text-sm font-bold uppercase tracking-wide text-cream shadow-brut transition-pop hover:-translate-y-0.5 disabled:opacity-40"
          >
            {generating ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Building your night…</>
            ) : (
              <>{step < totalSteps - 1 ? "Continue" : "Create My Plan"} <ArrowRight className="h-4 w-4" /></>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
