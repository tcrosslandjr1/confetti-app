import { createFileRoute, useNavigate, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  Users,
  User,
  Heart,
  Cake,
  Briefcase,
  Home,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Calendar,
  Clock,
  Check,
  MapPin,
  Loader2,
  Pencil,
  Replace,
  X,
} from "lucide-react";
import { makeDemoLoop, setActiveLoop, type ActiveLoop } from "@/lib/loop-store";
import { MOODS } from "@/lib/concierge-data";
import { CITIES } from "@/lib/agents/city-context";
import { createSkeletonItinerary, populateItinerary, type BuildPayload } from "@/lib/itineraries";
import { toast } from "sonner";
import { ForecastForDate } from "@/components/ForecastForDate";
import { recordPickSignal } from "@/lib/pick-signals.functions";
import {
  usePageview,
  useScrollDepth,
  useTimeToInteraction,
  trackCta,
  trackEvent,
} from "@/lib/analytics";

const MOOD_CHIPS = [
  { id: "hyped", label: "Hyped", emoji: "🔥" },
  { id: "mellow", label: "Mellow", emoji: "🌿" },
  { id: "romantic", label: "Romantic", emoji: "🌹" },
  { id: "adventurous", label: "Adventurous", emoji: "🧭" },
  { id: "recovering", label: "Recovering", emoji: "🫧" },
];

const SWAP_REASONS = [
  { id: "too_pricey", label: "Too pricey", emoji: "💸" },
  { id: "wrong_vibe", label: "Wrong vibe", emoji: "🎭" },
  { id: "been_there", label: "Been there", emoji: "🔁" },
  { id: "too_far", label: "Too far", emoji: "🗺️" },
];

export const Route = createFileRoute("/create")({
  head: () => ({ meta: [{ title: "Create a Plan — Confetti" }] }),
  beforeLoad: async ({ location }) => {
    if (typeof window === "undefined") return;
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      throw redirect({
        to: "/auth",
        search: { mode: "signup", redirect: location.href },
      });
    }
  },
  component: CreatePage,
});


const GROUP = [
  {
    id: "solo",
    label: "Solo",
    desc: "Just you — flying solo tonight",
    size: 1,
    Icon: User,
    tableHint: "Bar seats & counters",
    spendHint: "€25–€60 / night",
    bestFor: "Chef's counters, listening bars, quick hops",
    optimizesFor: "Walkable distance, solo-friendly seating, no reservation gates",
    avoids: "Min-spend tables, group-only menus",
  },
  {
    id: "couple",
    label: "Couple",
    desc: "Two of you, one shared vibe",
    size: 2,
    Icon: Heart,
    tableHint: "2-tops, banquettes, window seats",
    spendHint: "€80–€180 / night",
    bestFor: "Intimate dinners, wine bars, dessert + nightcap",
    optimizesFor: "Romance, shared plates, low-noise rooms",
    avoids: "Loud sports bars, rowdy late-night clubs",
  },
  {
    id: "small",
    label: "3–5 friends",
    desc: "Small crew, easy to coordinate",
    size: 4,
    Icon: Users,
    tableHint: "4-tops, round tables, booths",
    spendHint: "€40–€90 / person",
    bestFor: "Sharing menus, cocktail bars, fun second stops",
    optimizesFor: "Walkable routes, varied vibes, easy splits",
    avoids: "Single-seat counters, strict 2-person tasting menus",
  },
  {
    id: "squad",
    label: "6+ squad",
    desc: "Big group — we'll size venues to fit",
    size: 6,
    Icon: Users,
    tableHint: "Long tables, group rooms, semi-private",
    spendHint: "€50–€110 / person",
    bestFor: "Group menus, karaoke, late-night dance floors",
    optimizesFor: "Capacity, advance holds, splittable bills",
    avoids: "Tiny rooms, walk-in-only spots, no-reservation venues",
  },
];

const GROUP_EXTRAS = [
  { id: "kids", label: "Kids in tow", emoji: "👧" },
  { id: "accessible", label: "Step-free access", emoji: "♿️" },
  { id: "veg", label: "Vegan / veggie", emoji: "🌱" },
  { id: "halal", label: "Halal", emoji: "🕌" },
  { id: "gf", label: "Gluten-free", emoji: "🌾" },
  { id: "split", label: "Splitting the bill", emoji: "💳" },
  { id: "quiet", label: "Quiet rooms", emoji: "🤫" },
  { id: "dog", label: "Dog-friendly", emoji: "🐶" },
];

const OCCASIONS = [
  {
    id: "date",
    label: "Date Night",
    desc: "Romantic, intimate, swoon-worthy",
    emoji: "🌹",
    Icon: Heart,
  },
  { id: "bday", label: "Birthday", desc: "Celebrating someone special", emoji: "🎂", Icon: Cake },
  {
    id: "girls",
    label: "Girls Night",
    desc: "Glam, photo-worthy, fun",
    emoji: "💃",
    Icon: Sparkles,
  },
  {
    id: "biz",
    label: "Business",
    desc: "Impress clients or close deals",
    emoji: "💼",
    Icon: Briefcase,
  },
  { id: "fam", label: "Family", desc: "All-ages friendly outings", emoji: "👨‍👩‍👧", Icon: Home },
  {
    id: "just",
    label: "Just Because",
    desc: "No occasion needed — just go",
    emoji: "✨",
    Icon: Sparkles,
  },
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
  const recordSignal = useServerFn(recordPickSignal);
  const [step, setStep] = useState(0);
  usePageview("create_wizard", "/create");
  useScrollDepth("/create");
  useTimeToInteraction("/create");
  const [group, setGroup] = useState<(typeof GROUP)[number] | null>(null);
  const [occasion, setOccasion] = useState<(typeof OCCASIONS)[number] | null>(null);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [time, setTime] = useState("19:00");
  const [duration, setDuration] = useState("3 hr");
  const [vibe, setVibe] = useState<(typeof MOODS)[number] | null>(null);
  const [city, setCity] = useState(CITIES[0].label);
  const [generating, setGenerating] = useState(false);
  const [quickEdit, setQuickEdit] = useState<null | "g" | "o" | "w" | "v">(null);
  const [currentMood, setCurrentMood] = useState<string | null>(null);
  const [pendingSwap, setPendingSwap] = useState<null | {
    field: string;
    from: string;
    to: string;
  }>(null);
  const [extras, setExtras] = useState<Set<string>>(new Set());
  const [exactSize, setExactSize] = useState<number | null>(null);

  function toggleExtra(id: string) {
    setExtras((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      logSignal("mood", `extra:${id}`, { step: STEP_LABELS[step] });
      return next;
    });
  }

  // Fire-and-forget signal logger; ignore failure (e.g. anon user).
  function logSignal(
    kind: "mood" | "swap_reason",
    value: string,
    ctx: Record<string, unknown> = {},
  ) {
    recordSignal({ data: { kind, value, context: ctx } }).catch(() => {});
  }

  function pickMood(id: string) {
    setCurrentMood(id);
    logSignal("mood", id, { step: STEP_LABELS[step] });
  }

  // Wraps a quick-edit setter so we capture the swap + prompt for a reason.
  function handleSwap(
    field: "group" | "occasion" | "vibe",
    fromLabel: string | undefined,
    toLabel: string,
  ) {
    if (fromLabel && fromLabel !== toLabel) {
      setPendingSwap({ field, from: fromLabel, to: toLabel });
    }
  }

  function chooseSwapReason(reason: string) {
    if (!pendingSwap) return;
    logSignal("swap_reason", reason, pendingSwap);
    setPendingSwap(null);
  }

  const totalSteps = 4;
  const canNext = [group, occasion, true, vibe][step];

  async function finish() {
    if (generating) return;
    setGenerating(true);
    trackCta("build_my_night_finish", {
      groupSize: group?.size,
      occasion: occasion?.id,
      vibe: vibe?.id,
    });
    try {
      const buildPayload: BuildPayload = {
        occasion: occasion?.label ?? "Night Out",
        vibe: vibe?.label,
        city,
        date,
        startTime: time,
        durationHours: parseInt(duration) || 3,
        occasionSlug: occasion?.id,
        transportMode: "auto",
      };

      // Phase 1: create skeleton row instantly → navigate
      const { id } = await createSkeletonItinerary(buildPayload);
      navigate({ to: "/trips/$id", params: { id } });

      // Phase 2: populate with AI-generated stops in background
      populateItinerary(id, buildPayload).catch((err) => {
        console.error("[create] background populate failed", err);
        toast.error((err as Error).message ?? "Couldn't build your night — try again.");
      });
    } catch (err) {
      console.error("[create] finish failed", err);
      void trackEvent("error", "create_finish_failed", {
        path: "/create",
        metadata: { msg: String(err).slice(0, 300) },
      });
      toast.error("Couldn't build your night. Try again.");
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
        navigate({ to: "/boarding-pass" });
      } catch {
        /* swallow */
      }
    } finally {
      setGenerating(false);
    }
  }

  // Picks-so-far chips — always show all 4 with completed/pending status
  const picks: { key: string; label: string; step: number; done: boolean; placeholder: string }[] =
    [
      {
        key: "g",
        step: 0,
        placeholder: "Group",
        done: !!group,
        label: group ? group.label : "Group",
      },
      {
        key: "o",
        step: 1,
        placeholder: "Occasion",
        done: !!occasion,
        label: occasion ? `${occasion.emoji} ${occasion.label}` : "Occasion",
      },
      {
        key: "w",
        step: 2,
        placeholder: "When",
        done: step >= 2,
        label: step >= 2 ? `${time} · ${duration}` : "When",
      },
      {
        key: "v",
        step: 3,
        placeholder: "Vibe",
        done: !!vibe,
        label: vibe ? `${vibe.emoji} ${vibe.label}` : "Vibe",
      },
    ];
  const completedCount = picks.filter((p) => p.done).length;

  return (
    <div className="relative min-h-screen overflow-hidden bg-background pb-32">
      {/* Warm ambient blobs */}
      <div
        className="pointer-events-none absolute -left-20 -top-20 h-72 w-72 rounded-full bg-coral/20 blur-[100px] animate-blob"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -right-16 top-40 h-64 w-64 rounded-full bg-purple/15 blur-[90px] animate-blob"
        style={{ animationDelay: "3s" }}
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute left-1/3 top-[60vh] h-56 w-56 rounded-full bg-gold/20 blur-[80px] animate-blob"
        style={{ animationDelay: "7s" }}
        aria-hidden="true"
      />
      {/* Subtle top glow */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-gradient-to-b from-coral/[0.08] to-transparent"
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-md px-4 pt-5 sm:max-w-xl sm:pt-8 lg:max-w-2xl lg:px-6">
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
              <div
                key={p.key}
                className={`group inline-flex items-center gap-1 rounded-full border pl-1.5 pr-1 py-0.5 text-[11px] font-medium transition-colors ${
                  p.done
                    ? "border-ink/20 bg-card text-ink/85 hover:border-ink/60"
                    : isCurrent
                      ? "border-coral border-dashed bg-coral/5 text-ink/70"
                      : "border-ink/15 border-dashed bg-transparent text-ink/40"
                }`}
              >
                {/* status indicator */}
                {p.done ? (
                  <span className="grid h-4 w-4 place-items-center rounded-full bg-coral text-cream">
                    <Check className="h-2.5 w-2.5" strokeWidth={3} />
                  </span>
                ) : (
                  <span
                    className={`grid h-4 w-4 place-items-center rounded-full border ${isCurrent ? "border-coral" : "border-ink/30"}`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${isCurrent ? "bg-coral animate-pulse" : "bg-ink/30"}`}
                    />
                  </span>
                )}

                {/* label tap-target = jump to step */}
                <button
                  onClick={() => setStep(p.step)}
                  aria-label={`Go to ${STEP_LABELS[p.step]} step`}
                  className="px-1 py-0.5"
                >
                  {p.label}
                </button>

                {p.done ? (
                  <>
                    {/* Action 1: full Edit (jump to step) */}
                    <button
                      onClick={() => setStep(p.step)}
                      aria-label={`Edit ${STEP_LABELS[p.step]} in full step`}
                      title="Edit in step"
                      className="inline-flex items-center gap-0.5 rounded-full bg-ink/5 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-ink/70 hover:bg-ink hover:text-cream"
                    >
                      <Pencil className="h-2.5 w-2.5" /> Edit
                    </button>
                    {/* Action 2: quick Swap (inline popover, doesn't change step) */}
                    <button
                      onClick={() => setQuickEdit(p.key as typeof quickEdit)}
                      aria-label={`Swap ${STEP_LABELS[p.step]} without leaving this step`}
                      title="Swap just this"
                      className="inline-flex items-center gap-0.5 rounded-full bg-coral/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-coral hover:bg-coral hover:text-cream"
                    >
                      <Replace className="h-2.5 w-2.5" /> Swap
                    </button>
                  </>
                ) : (
                  <span
                    className={`rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                      isCurrent ? "bg-coral/15 text-coral" : "bg-ink/5 text-ink/50"
                    }`}
                  >
                    {isCurrent ? "Now" : "Pending"}
                  </span>
                )}
              </div>
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
            <div className="space-y-5">
              {/* Tonight's mood — one-tap signal, distinct from long-term vibe */}
              <div className="relative overflow-hidden rounded-2xl border-2 border-dashed border-ink/20 bg-gradient-to-br from-coral/5 via-card/60 to-gold/5 p-4">
                <div className="flex items-baseline justify-between gap-2">
                  <div className="font-mono text-[10px] font-bold uppercase tracking-widest text-ink/70">
                    Tonight's mood
                  </div>
                  <span className="font-mono text-[9px] uppercase tracking-widest text-ink/40">
                    optional · shapes picks
                  </span>
                </div>
                <p className="mt-0.5 font-display text-sm font-bold text-ink/80">
                  How are you feeling?
                </p>
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  {MOOD_CHIPS.map((m) => {
                    const active = currentMood === m.id;
                    return (
                      <button
                        key={m.id}
                        onClick={() => pickMood(m.id)}
                        className={`inline-flex items-center gap-1.5 rounded-full border-2 px-3 py-1.5 text-xs font-bold transition-pop ${
                          active
                            ? "border-ink bg-ink text-cream shadow-brut -translate-y-0.5"
                            : "border-ink/15 bg-card hover:border-ink hover:-translate-y-0.5"
                        }`}
                      >
                        <span className="text-sm">{m.emoji}</span> {m.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-2.5">
                {GROUP.map((g) => {
                  const active = group?.id === g.id;
                  const dots = Math.min(g.size, 6);
                  return (
                    <button
                      key={g.id}
                      onClick={() => setGroup(g)}
                      className={`group/card relative flex w-full items-center gap-3 overflow-hidden rounded-2xl border-2 p-4 text-left transition-pop ${
                        active
                          ? "border-ink bg-gradient-to-r from-coral to-coral/85 text-cream shadow-brut -translate-y-0.5"
                          : "border-ink/15 bg-card hover:border-ink hover:-translate-y-0.5 hover:shadow-brut"
                      }`}
                    >
                      {!active && (
                        <span className="pointer-events-none absolute -right-6 -top-6 h-16 w-16 rounded-full bg-coral/5 transition-transform group-hover/card:scale-125" />
                      )}

                      <span
                        className={`relative grid h-12 w-12 shrink-0 place-items-center rounded-2xl border-2 ${
                          active
                            ? "border-cream/40 bg-cream/20"
                            : "border-ink/10 bg-gradient-to-br from-cream to-coral/10"
                        }`}
                      >
                        <g.Icon className="h-5 w-5" />
                      </span>

                      <span className="min-w-0 flex-1">
                        <span className="flex flex-wrap items-center gap-1.5">
                          <span className="font-display text-base font-bold leading-tight">
                            {g.label}
                          </span>
                          <span
                            className={`rounded-full px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-widest ${
                              active ? "bg-cream/25 text-cream" : "bg-ink/[0.08] text-ink/60"
                            }`}
                          >
                            Table for {g.size}
                            {g.size === 6 ? "+" : ""}
                          </span>
                          <span
                            className={`rounded-full px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-widest ${
                              active ? "bg-cream/25 text-cream" : "bg-gold/15 text-ink/70"
                            }`}
                          >
                            {g.spendHint}
                          </span>
                        </span>
                        <span
                          className={`mt-0.5 block text-xs leading-snug ${
                            active ? "text-cream/90" : "text-muted-foreground"
                          }`}
                        >
                          {g.desc}
                        </span>
                        <span className="mt-1.5 flex items-center gap-0.5">
                          {Array.from({ length: dots }).map((_, i) => (
                            <span
                              key={i}
                              className={`h-1.5 w-1.5 rounded-full ${
                                active ? "bg-cream/80" : "bg-ink/40"
                              }`}
                            />
                          ))}
                          {g.size > 6 && (
                            <span
                              className={`ml-0.5 font-mono text-[9px] font-bold ${
                                active ? "text-cream/80" : "text-ink/50"
                              }`}
                            >
                              +
                            </span>
                          )}
                          <span
                            className={`ml-2 font-mono text-[9px] font-bold uppercase tracking-widest ${
                              active ? "text-cream/80" : "text-ink/55"
                            }`}
                          >
                            {g.tableHint}
                          </span>
                        </span>

                        {active && (
                          <span className="mt-3 block space-y-1.5 rounded-xl bg-cream/15 p-2.5 text-[11px] leading-snug text-cream/95">
                            <span className="block">
                              <span className="font-mono text-[9px] font-bold uppercase tracking-widest text-cream/70">
                                Best for ·
                              </span>{" "}
                              {g.bestFor}
                            </span>
                            <span className="block">
                              <span className="font-mono text-[9px] font-bold uppercase tracking-widest text-cream/70">
                                We optimize for ·
                              </span>{" "}
                              {g.optimizesFor}
                            </span>
                            <span className="block">
                              <span className="font-mono text-[9px] font-bold uppercase tracking-widest text-cream/70">
                                We avoid ·
                              </span>{" "}
                              {g.avoids}
                            </span>
                          </span>
                        )}
                      </span>

                      {active && (
                        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-cream/25">
                          <Check className="h-4 w-4" strokeWidth={3} />
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Exact party size — only for groups where it matters */}
              {group && (group.id === "small" || group.id === "squad") && (
                <div className="rounded-2xl border-2 border-ink/15 bg-card p-4">
                  <div className="flex items-baseline justify-between gap-2">
                    <div className="font-mono text-[10px] font-bold uppercase tracking-widest text-ink/70">
                      Exact headcount
                    </div>
                    <span className="font-mono text-[9px] uppercase tracking-widest text-ink/40">
                      helps us hold the right table
                    </span>
                  </div>
                  <div className="mt-2 flex items-center gap-3">
                    <button
                      onClick={() =>
                        setExactSize((n) => Math.max(group.size, (n ?? group.size) - 1))
                      }
                      className="grid h-10 w-10 place-items-center rounded-xl border-2 border-ink bg-card font-display text-lg font-bold hover:bg-ink hover:text-cream"
                      aria-label="Decrease headcount"
                    >
                      −
                    </button>
                    <div className="flex-1 text-center">
                      <div className="font-display text-3xl font-extrabold leading-none">
                        {exactSize ?? group.size}
                      </div>
                      <div className="mt-0.5 font-mono text-[9px] uppercase tracking-widest text-ink/50">
                        people
                      </div>
                    </div>
                    <button
                      onClick={() => setExactSize((n) => Math.min(40, (n ?? group.size) + 1))}
                      className="grid h-10 w-10 place-items-center rounded-xl border-2 border-ink bg-card font-display text-lg font-bold hover:bg-ink hover:text-cream"
                      aria-label="Increase headcount"
                    >
                      +
                    </button>
                  </div>
                </div>
              )}

              {/* Anything we should know? — sharpens picks without blocking */}
              <div className="rounded-2xl border-2 border-dashed border-ink/20 bg-gradient-to-br from-purple/5 via-card/60 to-coral/5 p-4">
                <div className="flex items-baseline justify-between gap-2">
                  <div className="font-mono text-[10px] font-bold uppercase tracking-widest text-ink/70">
                    Anything we should know?
                  </div>
                  <span className="font-mono text-[9px] uppercase tracking-widest text-ink/40">
                    optional · filters venues
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground leading-snug">
                  Tap whatever applies — we'll only suggest spots that match.
                </p>
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  {GROUP_EXTRAS.map((x) => {
                    const active = extras.has(x.id);
                    return (
                      <button
                        key={x.id}
                        onClick={() => toggleExtra(x.id)}
                        className={`inline-flex items-center gap-1.5 rounded-full border-2 px-3 py-1.5 text-xs font-bold transition-pop ${
                          active
                            ? "border-ink bg-ink text-cream shadow-brut -translate-y-0.5"
                            : "border-ink/15 bg-card hover:border-ink hover:-translate-y-0.5"
                        }`}
                      >
                        <span className="text-sm">{x.emoji}</span> {x.label}
                      </button>
                    );
                  })}
                </div>
                {extras.size > 0 && (
                  <p className="mt-2.5 font-mono text-[10px] uppercase tracking-widest text-coral">
                    {extras.size} filter{extras.size === 1 ? "" : "s"} active · we'll respect these
                    on every stop
                  </p>
                )}
              </div>
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
                      active
                        ? "border-ink bg-coral text-cream shadow-brut"
                        : "border-ink/15 bg-card hover:border-ink"
                    }`}
                  >
                    <span className="text-2xl">{o.emoji}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-display text-base font-bold leading-tight">
                        {o.label}
                      </span>
                      <span
                        className={`block text-xs leading-snug ${active ? "text-cream/85" : "text-muted-foreground"}`}
                      >
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
                    <option key={c.slug} value={c.label}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </label>

              <div>
                <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-ink/60">
                  Duration
                </span>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  How long the whole loop should run.
                </p>
                <div className="mt-2 grid grid-cols-4 gap-2">
                  {DURATIONS.map((d) => {
                    const active = duration === d.value;
                    return (
                      <button
                        key={d.value}
                        onClick={() => setDuration(d.value)}
                        className={`flex flex-col items-center gap-0.5 rounded-xl border-2 py-2.5 transition-pop ${
                          active
                            ? "border-ink bg-coral text-cream shadow-brut"
                            : "border-ink/15 bg-card hover:border-ink"
                        }`}
                      >
                        <span className="font-display text-xs font-bold leading-none">
                          {d.value}
                        </span>
                        <span
                          className={`text-[10px] leading-none ${active ? "text-cream/80" : "text-muted-foreground"}`}
                        >
                          {d.desc}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Weather forecast for selected date + city */}
              <ForecastForDate city={city} date={date} />
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
                      active
                        ? "border-ink bg-coral text-cream shadow-brut"
                        : "border-ink/15 bg-card hover:border-ink"
                    }`}
                  >
                    <span className="text-2xl">{m.emoji}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-display text-base font-bold leading-tight">
                        {m.label}
                      </span>
                      <span
                        className={`block text-xs leading-snug ${active ? "text-cream/85" : "text-muted-foreground"}`}
                      >
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
                <span>
                  <span className="font-bold">{group?.label}</span> · party of {group?.size}
                </span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-coral" />
                <span>
                  {occasion?.emoji} <span className="font-bold">{occasion?.label}</span>
                </span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-coral" />
                <span>
                  {date} · <span className="font-bold">{time}</span> · {duration} · {city}
                </span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-coral" />
                <span>
                  {vibe.emoji} <span className="font-bold">{vibe.label}</span> — {vibe.blurb}
                </span>
              </li>
            </ul>
            <div className="mt-3">
              <ForecastForDate city={city} date={date} variant="inline" />
            </div>
          </div>
        )}
      </div>

      {/* Sticky CTA */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-ink/10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="mx-auto max-w-md px-4 pt-2.5 pb-3 sm:max-w-xl lg:max-w-2xl lg:px-6">
          {/* Mini step rail above the button — keeps "where am I" visible at the tap point */}
          <div className="mb-2 flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              {STEP_LABELS.map((label, i) => {
                const done = i < step;
                const current = i === step;
                return (
                  <button
                    key={label}
                    onClick={() => i <= step && setStep(i)}
                    disabled={i > step}
                    className={`font-mono text-[9px] font-bold uppercase tracking-widest transition ${
                      done ? "text-coral hover:underline" : current ? "text-ink" : "text-ink/30"
                    }`}
                  >
                    {i + 1}·{label}
                    {i < STEP_LABELS.length - 1 && <span className="ml-1.5 text-ink/20">›</span>}
                  </button>
                );
              })}
            </div>
            <span className="font-mono text-[9px] font-bold uppercase tracking-widest text-ink/50">
              ~{Math.max(15, (totalSteps - step) * 15)}s left
            </span>
          </div>

          <button
            disabled={!canNext || generating}
            onClick={() => (step < totalSteps - 1 ? setStep(step + 1) : finish())}
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-ink bg-ink px-4 py-4 font-display text-sm font-bold uppercase tracking-wide text-cream shadow-brut transition-pop hover:-translate-y-0.5 disabled:opacity-40"
          >
            {generating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Building your night…
              </>
            ) : step < totalSteps - 1 ? (
              <>
                Continue to {STEP_LABELS[step + 1]} <ArrowRight className="h-4 w-4" />
              </>
            ) : (
              <>
                Build my night <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
          <p className="mt-1.5 text-center text-[11px] text-muted-foreground">
            {!canNext && step !== 2
              ? `Pick a ${STEP_LABELS[step].toLowerCase()} to continue`
              : step < totalSteps - 1
                ? `Next: ${STEP_TITLES[step + 1]}`
                : "Free · No signup · ~60 sec total"}
          </p>
        </div>
      </div>

      {/* Quick-edit bottom sheet — swap one field without leaving the current step */}
      {quickEdit && (
        <div
          className="fixed inset-0 z-50 flex flex-col justify-end"
          role="dialog"
          aria-modal="true"
        >
          <button
            aria-label="Close"
            onClick={() => setQuickEdit(null)}
            className="absolute inset-0 bg-ink/40 backdrop-blur-sm"
          />
          <div className="relative mx-auto w-full max-w-md rounded-t-3xl border-t-2 border-ink bg-background p-4 pb-6 shadow-brut animate-in slide-in-from-bottom duration-200">
            <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-ink/20" />
            <div className="mb-3 flex items-center justify-between">
              <div>
                <div className="font-mono text-[9px] font-bold uppercase tracking-widest text-ink/60">
                  Quick swap · stays on this step
                </div>
                <div className="font-display text-lg font-extrabold leading-tight">
                  Change{" "}
                  {quickEdit === "g"
                    ? "group"
                    : quickEdit === "o"
                      ? "occasion"
                      : quickEdit === "w"
                        ? "when & where"
                        : "vibe"}
                </div>
              </div>
              <button
                onClick={() => setQuickEdit(null)}
                aria-label="Close"
                className="grid h-8 w-8 place-items-center rounded-full border border-ink/15 hover:border-ink"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="max-h-[60vh] space-y-2 overflow-y-auto">
              {quickEdit === "g" &&
                GROUP.map((g) => {
                  const active = group?.id === g.id;
                  return (
                    <button
                      key={g.id}
                      onClick={() => {
                        setGroup(g);
                        setQuickEdit(null);
                      }}
                      className={`flex w-full items-center gap-3 rounded-2xl border-2 p-3 text-left transition-pop ${active ? "border-ink bg-coral text-cream" : "border-ink/15 bg-card hover:border-ink"}`}
                    >
                      <g.Icon className="h-5 w-5 shrink-0" />
                      <span className="min-w-0 flex-1">
                        <span className="block font-display text-sm font-bold leading-tight">
                          {g.label}
                        </span>
                        <span
                          className={`block text-[11px] leading-snug ${active ? "text-cream/85" : "text-muted-foreground"}`}
                        >
                          {g.desc}
                        </span>
                      </span>
                      {active && <Check className="h-4 w-4 shrink-0" />}
                    </button>
                  );
                })}

              {quickEdit === "o" &&
                OCCASIONS.map((o) => {
                  const active = occasion?.id === o.id;
                  return (
                    <button
                      key={o.id}
                      onClick={() => {
                        setOccasion(o);
                        setQuickEdit(null);
                      }}
                      className={`flex w-full items-center gap-3 rounded-2xl border-2 p-3 text-left transition-pop ${active ? "border-ink bg-coral text-cream" : "border-ink/15 bg-card hover:border-ink"}`}
                    >
                      <span className="text-xl">{o.emoji}</span>
                      <span className="min-w-0 flex-1">
                        <span className="block font-display text-sm font-bold leading-tight">
                          {o.label}
                        </span>
                        <span
                          className={`block text-[11px] leading-snug ${active ? "text-cream/85" : "text-muted-foreground"}`}
                        >
                          {o.desc}
                        </span>
                      </span>
                      {active && <Check className="h-4 w-4 shrink-0" />}
                    </button>
                  );
                })}

              {quickEdit === "v" &&
                MOODS.map((m) => {
                  const active = vibe?.id === m.id;
                  return (
                    <button
                      key={m.id}
                      onClick={() => {
                        setVibe(m);
                        setQuickEdit(null);
                      }}
                      className={`flex w-full items-center gap-3 rounded-2xl border-2 p-3 text-left transition-pop ${active ? "border-ink bg-coral text-cream" : "border-ink/15 bg-card hover:border-ink"}`}
                    >
                      <span className="text-xl">{m.emoji}</span>
                      <span className="min-w-0 flex-1">
                        <span className="block font-display text-sm font-bold leading-tight">
                          {m.label}
                        </span>
                        <span
                          className={`block text-[11px] leading-snug ${active ? "text-cream/85" : "text-muted-foreground"}`}
                        >
                          {m.blurb}
                        </span>
                      </span>
                      {active && <Check className="h-4 w-4 shrink-0" />}
                    </button>
                  );
                })}

              {quickEdit === "w" && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <label className="block">
                      <span className="font-mono text-[9px] font-bold uppercase tracking-widest text-ink/60 flex items-center gap-1">
                        <Calendar className="h-3 w-3" /> Date
                      </span>
                      <input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="mt-1 w-full rounded-xl border-2 border-ink bg-card px-3 py-2.5 font-display text-sm font-bold"
                      />
                    </label>
                    <label className="block">
                      <span className="font-mono text-[9px] font-bold uppercase tracking-widest text-ink/60 flex items-center gap-1">
                        <Clock className="h-3 w-3" /> Start
                      </span>
                      <input
                        type="time"
                        value={time}
                        onChange={(e) => setTime(e.target.value)}
                        className="mt-1 w-full rounded-xl border-2 border-ink bg-card px-3 py-2.5 font-display text-sm font-bold"
                      />
                    </label>
                  </div>
                  <label className="block">
                    <span className="font-mono text-[9px] font-bold uppercase tracking-widest text-ink/60 flex items-center gap-1">
                      <MapPin className="h-3 w-3" /> City
                    </span>
                    <select
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="mt-1 w-full rounded-xl border-2 border-ink bg-card px-3 py-2.5 font-display text-sm font-bold"
                    >
                      {CITIES.map((c) => (
                        <option key={c.slug} value={c.label}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <div>
                    <span className="font-mono text-[9px] font-bold uppercase tracking-widest text-ink/60">
                      Duration
                    </span>
                    <div className="mt-1 grid grid-cols-4 gap-2">
                      {DURATIONS.map((d) => {
                        const active = duration === d.value;
                        return (
                          <button
                            key={d.value}
                            onClick={() => setDuration(d.value)}
                            className={`rounded-xl border-2 py-2 font-display text-xs font-bold transition-pop ${active ? "border-ink bg-coral text-cream" : "border-ink/15 bg-card hover:border-ink"}`}
                          >
                            {d.value}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <button
                    onClick={() => setQuickEdit(null)}
                    className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-ink bg-ink px-4 py-3 font-display text-sm font-bold uppercase tracking-wide text-cream shadow-brut"
                  >
                    Done
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
