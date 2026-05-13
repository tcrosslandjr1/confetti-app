import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  Users, User, Heart, Cake, Briefcase, Home, Sparkles,
  ArrowRight, ArrowLeft, Calendar, Clock, Check, MapPin, Loader2, Pencil,
} from "lucide-react";
import { makeDemoLoop, setActiveLoop, type ActiveLoop } from "@/lib/loop-store";
import { MOODS } from "@/lib/concierge-data";
import { CITIES } from "@/lib/agents/city-context";
import { generatePlan } from "@/lib/generate-plan.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/create")({
  head: () => ({ meta: [{ title: "Create a Plan — Confetti" }] }),
  component: CreatePage,
});

const GROUP = [
  { id: "solo", label: "Solo", desc: "Just you — flying solo tonight", size: 1, Icon: User },
  { id: "couple", label: "Couple", desc: "Two of you, one shared vibe", size: 2, Icon: Heart },
  { id: "small", label: "3–5 friends", desc: "Small crew, easy to coordinate", size: 4, Icon: Users },
  { id: "squad", label: "6+ squad", desc: "Big group — we'll size venues to fit", size: 6, Icon: Users },
];

const OCCASIONS = [
  { id: "date", label: "Date Night", desc: "Romantic, intimate, swoon-worthy", emoji: "🌹", Icon: Heart },
  { id: "bday", label: "Birthday", desc: "Celebrating someone special", emoji: "🎂", Icon: Cake },
  { id: "girls", label: "Girls Night", desc: "Glam, photo-worthy, fun", emoji: "💃", Icon: Sparkles },
  { id: "biz", label: "Business", desc: "Impress clients or close deals", emoji: "💼", Icon: Briefcase },
  { id: "fam", label: "Family", desc: "All-ages friendly outings", emoji: "👨‍👩‍👧", Icon: Home },
  { id: "just", label: "Just Because", desc: "No occasion needed — just go", emoji: "✨", Icon: Sparkles },
];

const DURATIONS = [
  { value: "2 hr", desc: "Quick" },
  { value: "3 hr", desc: "Classic" },
  { value: "4 hr", desc: "Long" },
  { value: "All night", desc: "Marathon" },
];

const STEP_LABELS = ["Group", "Occasion", "When", "Vibe"];
const STEP_TITLES = ["Who's coming?", "What's the occasion?", "When & where?", "Pick your mood"];
const STEP_HINTS = [
  "We size venues and tables for your crew.",
  "This shapes the energy of every stop.",
  "Time of day changes which spots are open and hot.",
  "The single biggest signal we use to pick stops.",
];

function CreatePage() {
  const navigate = useNavigate();
  const generate = useServerFn(generatePlan);
  const [step, setStep] = useState(0);
  const [group, setGroup] = useState<(typeof GROUP)[number] | null>(null);
  const [occasion, setOccasion] = useState<(typeof OCCASIONS)[number] | null>(null);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [time, setTime] = useState("19:00");
  const [duration, setDuration] = useState("3 hr");
  const [vibe, setVibe] = useState<(typeof MOODS)[number] | null>(null);
  const [city, setCity] = useState(CITIES[0].label);
  const [generating, setGenerating] = useState(false);

  const totalSteps = 4;
  const canNext = [group, occasion, true, vibe][step];

  async function finish() {
    if (generating) return;
    setGenerating(true);
    try {
      let tasteSummaryStr: string | undefined;
      try {
        const { loadPrefs, tasteSummary } = await import("@/lib/taste");
        const prefs = await loadPrefs();
        const s = tasteSummary(prefs);
        if (s) tasteSummaryStr = s;
      } catch {
        /* anon user */
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
            id: s.id, name: s.name, type: s.type, time: s.time, area: s.area,
            venueId: s.venueId, lat: s.lat, lng: s.lng, rationale: s.rationale, slot: s.slot,
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
          city, occasionId: occasion?.id, occasionLabel: occasion?.label,
          vibeId: vibe?.id, vibeLabel: vibe?.label, groupSize: group?.size ?? 2,
          date, startTime: time, duration,
        },
      };
      setActiveLoop(loop);
      navigate({ to: "/boarding-pass" });
    } catch (err) {
      console.error("[create] finish failed", err);
      toast.error("Couldn't build your night. Try again.");
      try {
        const fallback = makeDemoLoop({
          passenger: "GUEST", groupSize: group?.size ?? 2,
          occasion: occasion?.label, vibe: vibe?.label,
          to: occasion?.label.toUpperCase() ?? "NIGHT OUT",
          boardingTime: time.replace(/^0/, ""),
        });
        setActiveLoop(fallback);
        navigate({ to: "/boarding-pass" });
      } catch { /* swallow */ }
    } finally {
      setGenerating(false);
    }
  }

  // Picks-so-far chips — always show all 4 with completed/pending status
  const picks: { key: string; label: string; step: number; done: boolean; placeholder: string }[] = [
    { key: "g", step: 0, placeholder: "Group", done: !!group, label: group ? group.label : "Group" },
    { key: "o", step: 1, placeholder: "Occasion", done: !!occasion, label: occasion ? `${occasion.emoji} ${occasion.label}` : "Occasion" },
    { key: "w", step: 2, placeholder: "When", done: step >= 2, label: step >= 2 ? `${time} · ${duration}` : "When" },
    { key: "v", step: 3, placeholder: "Vibe", done: !!vibe, label: vibe ? `${vibe.emoji} ${vibe.label}` : "Vibe" },
  ];
  const completedCount = picks.filter((p) => p.done).length;

  return (
    <div className="min-h-screen bg-background pb-32">
      <div className="mx-auto max-w-md px-4 pt-5">
        {/* Top bar */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => (step === 0 ? history.back() : setStep(step - 1))}
            className="inline-flex items-center gap-1 font-mono text-xs font-bold uppercase tracking-widest text-ink/70 hover:text-ink"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back
          </button>
          <span className="font-mono text-[10px] uppercase tracking-widest text-ink/60">
            Step {step + 1} of {totalSteps} · {STEP_LABELS[step]}
          </span>
        </div>

        {/* Progress bar with step dots */}
        <div className="mt-3 flex items-center gap-1.5">
          {STEP_LABELS.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full transition-colors ${
                i < step ? "bg-coral" : i === step ? "bg-gradient-vibe" : "bg-muted"
              }`}
            />
          ))}
        </div>

        {/* Picks-so-far chip strip — shows status for every step */}
        <div className="mt-3 flex items-center justify-between">
          <span className="font-mono text-[9px] font-bold uppercase tracking-widest text-ink/50">
            Your picks
          </span>
          <span className="font-mono text-[9px] font-bold uppercase tracking-widest text-ink/50">
            {completedCount} / {picks.length} done
          </span>
        </div>
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {picks.map((p) => {
            const isCurrent = step === p.step;
            return (
              <button
                key={p.key}
                onClick={() => setStep(p.step)}
                aria-label={`${p.done ? "Edit" : "Go to"} ${STEP_LABELS[p.step]}: ${p.done ? p.label : "not selected yet"}`}
                className={`group inline-flex items-center gap-1.5 rounded-full border pl-1.5 pr-1.5 py-1 text-[11px] font-medium transition-colors ${
                  p.done
                    ? "border-ink/20 bg-card text-ink/85 hover:border-ink hover:bg-cream"
                    : isCurrent
                    ? "border-coral border-dashed bg-coral/5 text-ink/70"
                    : "border-ink/15 border-dashed bg-transparent text-ink/40 hover:border-ink/40 hover:text-ink/70"
                }`}
              >
                {/* status indicator */}
                {p.done ? (
                  <span className="grid h-4 w-4 place-items-center rounded-full bg-coral text-cream">
                    <Check className="h-2.5 w-2.5" strokeWidth={3} />
                  </span>
                ) : (
                  <span
                    className={`grid h-4 w-4 place-items-center rounded-full border ${
                      isCurrent ? "border-coral" : "border-ink/30"
                    }`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        isCurrent ? "bg-coral animate-pulse" : "bg-ink/30"
                      }`}
                    />
                  </span>
                )}
                <span className="px-0.5">{p.label}</span>
                {p.done ? (
                  <span className="ml-0.5 inline-flex items-center gap-0.5 rounded-full bg-ink/5 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-ink/70 group-hover:bg-ink group-hover:text-cream">
                    <Pencil className="h-2.5 w-2.5" /> Edit
                  </span>
                ) : (
                  <span className={`ml-0.5 rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                    isCurrent ? "bg-coral/15 text-coral" : "bg-ink/5 text-ink/50"
                  }`}>
                    {isCurrent ? "Now" : "Pending"}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Heading */}
        <div className="mt-6 space-y-1.5">
          <h1 className="font-display text-2xl font-extrabold tracking-tight leading-tight">
            {STEP_TITLES[step]}
          </h1>
          <p className="text-sm text-muted-foreground leading-snug">{STEP_HINTS[step]}</p>
        </div>

        {/* Step content */}
        <div className="mt-5">
          {step === 0 && (
            <div className="space-y-2.5">
              {GROUP.map((g) => {
                const active = group?.id === g.id;
                return (
                  <button
                    key={g.id}
                    onClick={() => setGroup(g)}
                    className={`flex w-full items-center gap-3 rounded-2xl border-2 p-4 text-left transition-pop ${
                      active ? "border-ink bg-coral text-cream shadow-brut" : "border-ink/15 bg-card hover:border-ink"
                    }`}
                  >
                    <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-full ${active ? "bg-cream/20" : "bg-cream"}`}>
                      <g.Icon className="h-5 w-5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-display text-base font-bold leading-tight">{g.label}</span>
                      <span className={`block text-xs leading-snug ${active ? "text-cream/85" : "text-muted-foreground"}`}>
                        {g.desc}
                      </span>
                    </span>
                    {active && <Check className="h-5 w-5 shrink-0" />}
                  </button>
                );
              })}
            </div>
          )}

          {step === 1 && (
            <div className="space-y-2.5">
              {OCCASIONS.map((o) => {
                const active = occasion?.id === o.id;
                return (
                  <button
                    key={o.id}
                    onClick={() => setOccasion(o)}
                    className={`flex w-full items-center gap-3 rounded-2xl border-2 p-4 text-left transition-pop ${
                      active ? "border-ink bg-coral text-cream shadow-brut" : "border-ink/15 bg-card hover:border-ink"
                    }`}
                  >
                    <span className="text-2xl">{o.emoji}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-display text-base font-bold leading-tight">{o.label}</span>
                      <span className={`block text-xs leading-snug ${active ? "text-cream/85" : "text-muted-foreground"}`}>
                        {o.desc}
                      </span>
                    </span>
                    {active && <Check className="h-5 w-5 shrink-0" />}
                  </button>
                );
              })}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-ink/60 flex items-center gap-1">
                    <Calendar className="h-3 w-3" /> Date
                  </span>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="mt-1 w-full rounded-xl border-2 border-ink bg-card px-3 py-3 font-display text-sm font-bold"
                  />
                </label>
                <label className="block">
                  <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-ink/60 flex items-center gap-1">
                    <Clock className="h-3 w-3" /> Start
                  </span>
                  <input
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="mt-1 w-full rounded-xl border-2 border-ink bg-card px-3 py-3 font-display text-sm font-bold"
                  />
                </label>
              </div>

              <label className="block">
                <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-ink/60 flex items-center gap-1">
                  <MapPin className="h-3 w-3" /> City
                </span>
                <select
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="mt-1 w-full rounded-xl border-2 border-ink bg-card px-3 py-3 font-display text-sm font-bold"
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
                <p className="mt-0.5 text-xs text-muted-foreground">How long the whole loop should run.</p>
                <div className="mt-2 grid grid-cols-4 gap-2">
                  {DURATIONS.map((d) => {
                    const active = duration === d.value;
                    return (
                      <button
                        key={d.value}
                        onClick={() => setDuration(d.value)}
                        className={`flex flex-col items-center gap-0.5 rounded-xl border-2 py-2.5 transition-pop ${
                          active ? "border-ink bg-coral text-cream shadow-brut" : "border-ink/15 bg-card hover:border-ink"
                        }`}
                      >
                        <span className="font-display text-xs font-bold leading-none">{d.value}</span>
                        <span className={`text-[10px] leading-none ${active ? "text-cream/80" : "text-muted-foreground"}`}>{d.desc}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-2.5">
              {MOODS.map((m) => {
                const active = vibe?.id === m.id;
                return (
                  <button
                    key={m.id}
                    onClick={() => setVibe(m)}
                    className={`flex w-full items-center gap-3 rounded-2xl border-2 p-4 text-left transition-pop ${
                      active ? "border-ink bg-coral text-cream shadow-brut" : "border-ink/15 bg-card hover:border-ink"
                    }`}
                  >
                    <span className="text-2xl">{m.emoji}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-display text-base font-bold leading-tight">{m.label}</span>
                      <span className={`block text-xs leading-snug ${active ? "text-cream/85" : "text-muted-foreground"}`}>
                        {m.blurb}
                      </span>
                    </span>
                    {active && <Check className="h-5 w-5 shrink-0" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Final review summary on step 3 */}
        {step === 3 && vibe && (
          <div className="mt-6 rounded-2xl border-2 border-ink bg-cream p-4 shadow-brut">
            <div className="flex items-center justify-between">
              <div className="font-mono text-[10px] font-bold uppercase tracking-widest text-ink/70">
                Your night, ready to build
              </div>
              <Sparkles className="h-4 w-4 text-coral" />
            </div>
            <ul className="mt-2.5 space-y-1.5 text-sm">
              <li className="flex items-start gap-2">
                <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-coral" />
                <span><span className="font-bold">{group?.label}</span> · party of {group?.size}</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-coral" />
                <span>{occasion?.emoji} <span className="font-bold">{occasion?.label}</span></span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-coral" />
                <span>{date} · <span className="font-bold">{time}</span> · {duration} · {city}</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-coral" />
                <span>{vibe.emoji} <span className="font-bold">{vibe.label}</span> — {vibe.blurb}</span>
              </li>
            </ul>
          </div>
        )}
      </div>

      {/* Sticky CTA */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-ink/10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="mx-auto max-w-md px-4 py-3">
          <button
            disabled={!canNext || generating}
            onClick={() => (step < totalSteps - 1 ? setStep(step + 1) : finish())}
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-ink bg-ink px-4 py-4 font-display text-sm font-bold uppercase tracking-wide text-cream shadow-brut transition-pop hover:-translate-y-0.5 disabled:opacity-40"
          >
            {generating ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Building your night…</>
            ) : step < totalSteps - 1 ? (
              <>Continue to {STEP_LABELS[step + 1]} <ArrowRight className="h-4 w-4" /></>
            ) : (
              <>Build my night <ArrowRight className="h-4 w-4" /></>
            )}
          </button>
          {!canNext && step !== 2 && (
            <p className="mt-1.5 text-center text-[11px] text-muted-foreground">
              Pick a {STEP_LABELS[step].toLowerCase()} to continue
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
