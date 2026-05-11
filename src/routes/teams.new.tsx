import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { getItinerary } from "@/lib/itineraries";
import {
  Briefcase,
  ArrowRight,
  ArrowLeft,
  Loader2,
  AlertCircle,
  Check,
  Calendar as CalendarIcon,
  Users as UsersIcon,
  DollarSign,
  Sparkles,
  MapPin,
  Utensils,
  ClipboardList,
  Save,
  Trash2,
} from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  createCorporateEvent,
  parseAttendeeList,
  PURPOSE_LABELS,
  dayCount,
  type CorporatePurpose,
} from "@/lib/corporate";

export const Route = createFileRoute("/teams/new")({
  validateSearch: (search: Record<string, unknown>) => ({
    fromTrip: typeof search.fromTrip === "string" ? search.fromTrip : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Plan a team event — Loop" },
      {
        name: "description",
        content:
          "Build a multi-day team event in minutes — venues, RSVPs, and budgets handled, end to end.",
      },
      { property: "og:title", content: "Plan a team event — Loop" },
      {
        property: "og:description",
        content: "From client dinners to multi-day offsites: build it in minutes with Loop.",
      },
    ],
  }),
  component: NewTeamEventPage,
});

const VIBE_TAGS = [
  "Upscale",
  "Casual",
  "Lively",
  "Intimate",
  "Outdoors",
  "Hidden gem",
  "Iconic",
  "Late night",
] as const;
type Vibe = (typeof VIBE_TAGS)[number];

const DIETARY_OPTIONS = [
  "Vegetarian-friendly",
  "Vegan options",
  "Gluten-free",
  "Halal",
  "Kosher",
  "Allergy-aware",
] as const;
type Dietary = (typeof DIETARY_OPTIONS)[number];

const STEPS = [
  { id: "basics", label: "Basics", icon: Briefcase },
  { id: "schedule", label: "Schedule", icon: CalendarIcon },
  { id: "people", label: "People", icon: UsersIcon },
  { id: "vibe", label: "Vibe", icon: Sparkles },
  { id: "review", label: "Review", icon: ClipboardList },
] as const;
type StepId = (typeof STEPS)[number]["id"];

function NewTeamEventPage() {
  const { user } = useAuth();
  const nav = useNavigate();
  const { fromTrip } = Route.useSearch();
  const [busy, setBusy] = useState(false);
  const [stepIdx, setStepIdx] = useState(0);
  const [prefilled, setPrefilled] = useState(false);

  // Basics
  const [orgName, setOrgName] = useState("");
  const [title, setTitle] = useState("");
  const [purpose, setPurpose] = useState<CorporatePurpose>("team-outing");

  // Schedule
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // People
  const [headcount, setHeadcount] = useState(8);
  const [budget, setBudget] = useState(150);
  const [attendeesRaw, setAttendeesRaw] = useState("");

  // Vibe / preferences
  const [city, setCity] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [vibes, setVibes] = useState<Set<Vibe>>(new Set());
  const [dietary, setDietary] = useState<Set<Dietary>>(new Set());
  const [notes, setNotes] = useState("");

  // Prefill from an existing trip when arriving via /teams/new?fromTrip=<id>
  useEffect(() => {
    if (!fromTrip || !user) return;
    let cancelled = false;
    (async () => {
      try {
        const { itinerary } = await getItinerary(fromTrip);
        if (cancelled || !itinerary) return;
        if (itinerary.title) setTitle(itinerary.title);
        if (itinerary.city) setCity(itinerary.city);
        if (itinerary.date) setStartDate(itinerary.date);
        // end_date isn't on the Itinerary type today; single-day trips are fine without it.
        if (itinerary.vibe) {
          const matched = VIBE_TAGS.filter((v) =>
            itinerary.vibe!.toLowerCase().includes(v.toLowerCase()),
          );
          if (matched.length) setVibes(new Set(matched));
        }
        const noteParts: string[] = [];
        if (itinerary.summary) noteParts.push(itinerary.summary);
        if (itinerary.est_total_cost)
          noteParts.push(`Original trip budget: ${itinerary.est_total_cost}`);
        if (noteParts.length) setNotes(noteParts.join("\n\n"));
        setPrefilled(true);
        toast.success("Prefilled from your trip — tweak anything and continue");
      } catch (err) {
        console.error("[teams/new] prefill failed", err);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [fromTrip, user]);

  const parsed = useMemo(() => parseAttendeeList(attendeesRaw), [attendeesRaw]);
  const days = startDate ? dayCount(startDate, endDate || startDate) : 1;
  const totalCents = headcount * budget * 100 * days;

  const stepValid: Record<StepId, boolean> = {
    basics: orgName.trim().length > 0 && title.trim().length > 0,
    schedule: !!startDate && (!endDate || endDate >= startDate),
    people: headcount >= 2 && budget >= 25,
    vibe: true,
    review: true,
  };
  const currentStep = STEPS[stepIdx];
  const canAdvance = stepValid[currentStep.id];

  const toggle = <T,>(set: Set<T>, val: T, setter: (s: Set<T>) => void) => {
    const next = new Set(set);
    if (next.has(val)) next.delete(val);
    else next.add(val);
    setter(next);
  };

  const composeNotes = () => {
    const lines: string[] = [];
    if (city || neighborhood)
      lines.push(`Location preference: ${[neighborhood, city].filter(Boolean).join(", ")}`);
    if (vibes.size) lines.push(`Vibe: ${[...vibes].join(", ")}`);
    if (dietary.size) lines.push(`Dietary: ${[...dietary].join(", ")}`);
    if (notes.trim()) lines.push(notes.trim());
    return lines.join("\n");
  };

  const submit = async () => {
    if (!user) {
      toast.error("Sign in first to save your event");
      nav({ to: "/auth" });
      return;
    }
    if (!stepValid.basics || !stepValid.schedule || !stepValid.people) {
      toast.error("A few fields still need attention");
      return;
    }
    setBusy(true);
    try {
      const ev = await createCorporateEvent({
        org_name: orgName.trim(),
        title: title.trim(),
        purpose,
        starts_at: new Date(startDate + "T18:00:00").toISOString(),
        ends_at: endDate ? new Date(endDate + "T23:00:00").toISOString() : null,
        headcount,
        budget_per_person_cents: Math.round(budget * 100),
        notes: composeNotes() || undefined,
        attendees: parsed,
      });
      toast.success("Event created — let's plan it");
      nav({ to: "/teams/$id", params: { id: ev.id } });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't create event");
    } finally {
      setBusy(false);
    }
  };

  const next = () => {
    if (!canAdvance) {
      toast.error("Fill in the required fields to continue");
      return;
    }
    if (stepIdx < STEPS.length - 1) setStepIdx(stepIdx + 1);
  };
  const back = () => stepIdx > 0 && setStepIdx(stepIdx - 1);

  return (
    <>
      <SiteHeader />
      <main className="bg-cream">
        <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
          <Link
            to="/teams"
            className="font-mono text-[11px] uppercase tracking-widest text-ink/60 hover:text-ink"
          >
            ← For Teams
          </Link>
          <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="flex items-center gap-3 font-display text-4xl font-extrabold sm:text-5xl">
                <Briefcase className="h-8 w-8" /> Plan a team event
              </h1>
              <p className="mt-2 text-ink/70">
                Five quick steps. We'll generate a draft and you can tune from there.
              </p>
            </div>
            <div className="rounded-full border-2 border-ink bg-cream px-4 py-2 font-mono text-[11px] uppercase tracking-widest shadow-brut">
              Step {stepIdx + 1} of {STEPS.length}
            </div>
          </div>

          {prefilled && fromTrip && (
            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border-2 border-ink bg-gold/40 p-4 text-sm">
              <div className="flex items-start gap-2">
                <Sparkles className="mt-0.5 h-4 w-4" />
                <span>
                  Prefilled from{" "}
                  <Link
                    to="/trips/$id"
                    params={{ id: fromTrip }}
                    className="font-bold underline"
                  >
                    your trip
                  </Link>
                  . Edit anything below.
                </span>
              </div>
            </div>
          )}

          {!user && (
            <div className="mt-6 flex items-start gap-3 rounded-2xl border-2 border-ink bg-gold/40 p-4">
              <AlertCircle className="mt-0.5 h-5 w-5" />
              <div className="text-sm">
                You'll need a free account to save your event and send invites.
                <Link to="/auth" className="ml-2 font-bold underline">
                  Sign in →
                </Link>
              </div>
            </div>
          )}

          <Stepper
            stepIdx={stepIdx}
            stepValid={stepValid}
            onJump={(i) => i <= stepIdx && setStepIdx(i)}
          />

          <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className="rounded-3xl border-2 border-ink bg-cream p-6 shadow-brut">
              {currentStep.id === "basics" && (
                <div className="space-y-6">
                  <SectionHeading
                    icon={Briefcase}
                    title="The basics"
                    hint="Who's hosting and what are we calling it?"
                  />
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Organization" required>
                      <Input
                        value={orgName}
                        onChange={(e) => setOrgName(e.target.value)}
                        placeholder="Acme Inc."
                        maxLength={100}
                      />
                    </Field>
                    <Field label="Event title" required>
                      <Input
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Q3 client dinner"
                        maxLength={120}
                      />
                    </Field>
                  </div>
                  <Field label="What kind of event is it?">
                    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                      {(Object.keys(PURPOSE_LABELS) as CorporatePurpose[]).map((p) => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setPurpose(p)}
                          className={`rounded-xl border-2 px-3 py-3 text-left text-sm font-bold transition-pop ${purpose === p ? "border-ink bg-ink text-cream shadow-brut" : "border-ink/30 bg-cream hover:border-ink"}`}
                        >
                          {PURPOSE_LABELS[p]}
                        </button>
                      ))}
                    </div>
                  </Field>
                </div>
              )}

              {currentStep.id === "schedule" && (
                <div className="space-y-6">
                  <SectionHeading
                    icon={CalendarIcon}
                    title="When is it?"
                    hint="Single evening or multi-day — both work."
                  />
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Start date" required>
                      <Input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                      />
                    </Field>
                    <Field label="End date (leave blank for single day)">
                      <Input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        min={startDate}
                      />
                    </Field>
                  </div>
                  {startDate && (
                    <div className="rounded-xl bg-ink/5 px-4 py-3 font-mono text-xs uppercase tracking-widest text-ink/70">
                      {days} {days === 1 ? "day" : "days"} of programming
                    </div>
                  )}
                </div>
              )}

              {currentStep.id === "people" && (
                <div className="space-y-6">
                  <SectionHeading
                    icon={UsersIcon}
                    title="Who's coming?"
                    hint="Set headcount, budget, and (optionally) attendees."
                  />
                  <div className="grid gap-6 sm:grid-cols-2">
                    <Field label={`Headcount: ${headcount}`}>
                      <input
                        type="range"
                        min={2}
                        max={250}
                        value={headcount}
                        onChange={(e) => setHeadcount(parseInt(e.target.value))}
                        className="w-full accent-ink"
                      />
                      <div className="mt-1 flex justify-between font-mono text-[10px] uppercase tracking-widest text-ink/50">
                        <span>2</span>
                        <span>250</span>
                      </div>
                    </Field>
                    <Field label={`Budget per person · per day: $${budget}`}>
                      <input
                        type="range"
                        min={25}
                        max={500}
                        step={5}
                        value={budget}
                        onChange={(e) => setBudget(parseInt(e.target.value))}
                        className="w-full accent-ink"
                      />
                      <div className="mt-1 flex justify-between font-mono text-[10px] uppercase tracking-widest text-ink/50">
                        <span>$25</span>
                        <span>$500</span>
                      </div>
                    </Field>
                  </div>
                  <Field label="Attendees (optional — paste emails, one per line)">
                    <Textarea
                      value={attendeesRaw}
                      onChange={(e) => setAttendeesRaw(e.target.value)}
                      rows={5}
                      placeholder={"alex@acme.com\nJane Doe <jane@acme.com>\nsam@acme.com"}
                      className="font-mono text-xs"
                    />
                    <div className="mt-1 font-mono text-[11px] uppercase tracking-widest text-ink/60">
                      {parsed.length} valid {parsed.length === 1 ? "address" : "addresses"} detected
                    </div>
                  </Field>
                </div>
              )}

              {currentStep.id === "vibe" && (
                <div className="space-y-6">
                  <SectionHeading
                    icon={Sparkles}
                    title="Vibe & preferences"
                    hint="Helps us pick the right venues from the jump."
                  />
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="City">
                      <Input
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder="Washington DC"
                      />
                    </Field>
                    <Field label="Neighborhood (optional)">
                      <Input
                        value={neighborhood}
                        onChange={(e) => setNeighborhood(e.target.value)}
                        placeholder="Shaw, Capitol Hill…"
                      />
                    </Field>
                  </div>
                  <Field label="Vibe">
                    <div className="flex flex-wrap gap-2">
                      {VIBE_TAGS.map((v) => {
                        const on = vibes.has(v);
                        return (
                          <button
                            key={v}
                            type="button"
                            onClick={() => toggle(vibes, v, setVibes)}
                            className={`rounded-full border-2 px-3 py-1.5 font-mono text-[11px] uppercase tracking-widest transition-pop ${on ? "border-ink bg-ink text-cream shadow-brut" : "border-ink/30 bg-cream hover:border-ink"}`}
                          >
                            {v}
                          </button>
                        );
                      })}
                    </div>
                  </Field>
                  <Field label="Dietary considerations">
                    <div className="flex flex-wrap gap-2">
                      {DIETARY_OPTIONS.map((d) => {
                        const on = dietary.has(d);
                        return (
                          <button
                            key={d}
                            type="button"
                            onClick={() => toggle(dietary, d, setDietary)}
                            className={`inline-flex items-center gap-1.5 rounded-full border-2 px-3 py-1.5 font-mono text-[11px] uppercase tracking-widest transition-pop ${on ? "border-ink bg-coral text-ink shadow-brut" : "border-ink/30 bg-cream hover:border-ink"}`}
                          >
                            <Utensils className="h-3 w-3" /> {d}
                          </button>
                        );
                      })}
                    </div>
                  </Field>
                  <Field label="Anything else? (optional)">
                    <Textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={3}
                      maxLength={1000}
                      placeholder="2 vegetarians, one wheelchair-accessible venue, no late nights."
                    />
                  </Field>
                </div>
              )}

              {currentStep.id === "review" && (
                <div className="space-y-5">
                  <SectionHeading
                    icon={ClipboardList}
                    title="Review & launch"
                    hint="Confirm the basics and we'll spin up your event."
                  />
                  <ReviewRow label="Organization" value={orgName || "—"} />
                  <ReviewRow label="Title" value={title || "—"} />
                  <ReviewRow label="Purpose" value={PURPOSE_LABELS[purpose]} />
                  <ReviewRow
                    label="When"
                    value={
                      startDate
                        ? `${startDate}${endDate ? ` → ${endDate}` : ""} (${days} ${days === 1 ? "day" : "days"})`
                        : "—"
                    }
                  />
                  <ReviewRow label="Headcount" value={`${headcount} people`} />
                  <ReviewRow label="Budget" value={`$${budget}/person/day`} />
                  <ReviewRow
                    label="Attendees"
                    value={`${parsed.length} email${parsed.length === 1 ? "" : "s"} on file`}
                  />
                  {(city || neighborhood) && (
                    <ReviewRow
                      label="Where"
                      value={[neighborhood, city].filter(Boolean).join(", ")}
                    />
                  )}
                  {vibes.size > 0 && <ReviewRow label="Vibe" value={[...vibes].join(" · ")} />}
                  {dietary.size > 0 && (
                    <ReviewRow label="Dietary" value={[...dietary].join(" · ")} />
                  )}
                </div>
              )}

              <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t-2 border-dashed border-ink/30 pt-5">
                <Button
                  type="button"
                  variant="outline"
                  onClick={back}
                  disabled={stepIdx === 0 || busy}
                  className="gap-2"
                >
                  <ArrowLeft className="h-4 w-4" /> Back
                </Button>
                {currentStep.id === "review" ? (
                  <Button onClick={submit} disabled={busy} size="lg" className="gap-2">
                    {busy ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Check className="h-4 w-4" />
                    )}
                    Create event
                  </Button>
                ) : (
                  <Button onClick={next} disabled={!canAdvance || busy} size="lg" className="gap-2">
                    Next <ArrowRight className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>

            <aside className="lg:sticky lg:top-24 lg:self-start">
              <div className="rounded-3xl border-2 border-ink bg-ink p-6 text-cream shadow-brut">
                <div className="font-mono text-[10px] uppercase tracking-widest text-cream/60">
                  Live summary
                </div>
                <div className="mt-2 font-display text-2xl font-extrabold">
                  {title || "Your event"}
                </div>
                <div className="mt-1 text-sm text-cream/70">
                  {orgName || "Set an organization →"}
                </div>

                <dl className="mt-5 grid grid-cols-2 gap-3 text-sm">
                  <SummaryStat
                    icon={CalendarIcon}
                    label="Dates"
                    value={startDate ? `${startDate}${endDate ? ` → ${endDate}` : ""}` : "—"}
                  />
                  <SummaryStat icon={UsersIcon} label="Headcount" value={`${headcount}`} />
                  <SummaryStat icon={DollarSign} label="Per person" value={`$${budget}/day`} />
                  <SummaryStat icon={MapPin} label="City" value={city || "—"} />
                </dl>

                <div className="mt-5 rounded-2xl border border-cream/20 bg-cream/5 p-4">
                  <div className="font-mono text-[10px] uppercase tracking-widest text-cream/60">
                    Estimated total
                  </div>
                  <div className="mt-1 font-display text-3xl font-extrabold">
                    ${(totalCents / 100).toLocaleString()}
                  </div>
                  <div className="mt-1 text-[11px] text-cream/60">
                    {headcount} × ${budget} × {days} {days === 1 ? "day" : "days"}
                  </div>
                </div>

                {(vibes.size > 0 || dietary.size > 0) && (
                  <div className="mt-5 flex flex-wrap gap-1.5">
                    {[...vibes, ...dietary].slice(0, 8).map((t) => (
                      <span
                        key={t}
                        className="rounded-full border border-cream/30 px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <p className="mt-3 px-2 font-mono text-[10px] uppercase tracking-widest text-ink/50">
                Free to plan · Pay only when you book
              </p>
            </aside>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

function Stepper({
  stepIdx,
  stepValid,
  onJump,
}: {
  stepIdx: number;
  stepValid: Record<StepId, boolean>;
  onJump: (i: number) => void;
}) {
  return (
    <ol className="mt-6 grid grid-cols-5 gap-2">
      {STEPS.map((s, i) => {
        const Icon = s.icon;
        const active = i === stepIdx;
        const done = i < stepIdx && stepValid[s.id];
        const reachable = i <= stepIdx;
        return (
          <li key={s.id}>
            <button
              type="button"
              onClick={() => onJump(i)}
              disabled={!reachable}
              className={`flex w-full items-center gap-2 rounded-xl border-2 px-3 py-2 text-left transition-pop ${active ? "border-ink bg-ink text-cream shadow-brut" : done ? "border-ink bg-gold/60" : "border-ink/30 bg-cream"} ${reachable ? "hover:border-ink" : "cursor-not-allowed opacity-60"}`}
            >
              <span
                className={`grid h-6 w-6 shrink-0 place-items-center rounded-full border ${active ? "border-cream/60" : "border-ink/30"}`}
              >
                {done ? <Check className="h-3.5 w-3.5" /> : <Icon className="h-3.5 w-3.5" />}
              </span>
              <span className="hidden font-mono text-[11px] font-bold uppercase tracking-widest sm:inline">
                {s.label}
              </span>
            </button>
          </li>
        );
      })}
    </ol>
  );
}

function SectionHeading({
  icon: Icon,
  title,
  hint,
}: {
  icon: typeof Briefcase;
  title: string;
  hint?: string;
}) {
  return (
    <div>
      <h2 className="flex items-center gap-2 font-display text-2xl font-extrabold">
        <Icon className="h-5 w-5" /> {title}
      </h2>
      {hint && <p className="mt-1 text-sm text-ink/60">{hint}</p>}
    </div>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <Label className="mb-1.5 block font-mono text-[11px] uppercase tracking-widest text-ink/70">
        {label} {required && <span className="text-coral">*</span>}
      </Label>
      {children}
    </div>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-dashed border-ink/15 pb-2">
      <div className="font-mono text-[11px] uppercase tracking-widest text-ink/60">{label}</div>
      <div className="text-right text-sm font-semibold">{value}</div>
    </div>
  );
}

function SummaryStat({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Briefcase;
  label: string;
  value: string;
}) {
  return (
    <div>
      <div className="flex items-center gap-1 font-mono text-[10px] uppercase tracking-widest text-cream/60">
        <Icon className="h-3 w-3" /> {label}
      </div>
      <div className="mt-0.5 truncate font-bold">{value}</div>
    </div>
  );
}
