import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CalendarPlus, Loader2, Sparkles } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { useAuth } from "@/lib/auth-context";
import { OCCASIONS } from "@/lib/occasions";
import { buildAndSaveItinerary } from "@/lib/itineraries";

export const Route = createFileRoute("/plan")({
  head: () => ({
    meta: [
      { title: "Plan my day — Confetti" },
      { name: "description", content: "Tell us the occasion and we'll build a full-day itinerary with stops, timing, and booking links." },
    ],
  }),
  component: PlanPage,
});

function PlanPage() {
  const { user, loading } = useAuth();
  const nav = useNavigate();
  const [occasionSlug, setOccasionSlug] = useState(OCCASIONS[0].slug);
  const [city, setCity] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("11:00");
  const [durationHours, setDurationHours] = useState(6);
  const [budget, setBudget] = useState("$$");
  const [notes, setNotes] = useState("");
  const [transportMode, setTransportMode] = useState<"auto" | "car" | "transit" | "lyft" | "uber" | "walk">("auto");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) nav({ to: "/auth" });
  }, [user, loading, nav]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    try {
      const occ = OCCASIONS.find((o) => o.slug === occasionSlug)!;
      const { id } = await buildAndSaveItinerary({
        occasion: occ.title,
        vibe: occ.tagline,
        occasionSlug: occ.slug,
        city: city || undefined,
        neighborhood: neighborhood || undefined,
        date: date || undefined,
        startTime,
        durationHours,
        budget,
        notes: notes || undefined,
        transportMode,
      });
      nav({ to: "/trips/$id", params: { id } });
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-8 text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5 text-primary" /> AI day planner
          </span>
          <h1 className="mt-4 font-display text-4xl font-bold tracking-tight sm:text-5xl">
            Plan the <span className="text-gradient">whole day.</span>
          </h1>
          <p className="mt-3 text-muted-foreground">Tell us the vibe — we'll build a 3-6 stop itinerary with timing, costs, and booking links.</p>
        </div>

        <form onSubmit={submit} className="space-y-5 rounded-3xl border border-border bg-card p-6 shadow-card sm:p-8">
          <Field label="Occasion">
            <select value={occasionSlug} onChange={(e) => setOccasionSlug(e.target.value)} className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20">
              {OCCASIONS.map((o) => (<option key={o.slug} value={o.slug}>{o.emoji} {o.title}</option>))}
            </select>
          </Field>

          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="City">
              <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="e.g. Austin" className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
            </Field>
            <Field label="Neighborhood (optional)">
              <input value={neighborhood} onChange={(e) => setNeighborhood(e.target.value)} placeholder="e.g. East Side" className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
            </Field>
          </div>

          <div className="grid gap-5 sm:grid-cols-3">
            <Field label="Date">
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
            </Field>
            <Field label="Start time">
              <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
            </Field>
            <Field label="Length (hrs)">
              <input type="number" min={2} max={14} value={durationHours} onChange={(e) => setDurationHours(Number(e.target.value))} className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
            </Field>
          </div>

          <Field label="Budget">
            <div className="flex gap-2">
              {["$", "$$", "$$$", "$$$$"].map((b) => (
                <button key={b} type="button" onClick={() => setBudget(b)}
                  className={`flex-1 rounded-full border px-3 py-2 text-sm font-semibold transition-colors ${
                    budget === b ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background text-muted-foreground hover:text-foreground"
                  }`}>{b}</button>
              ))}
            </div>
          </Field>

          <Field label="How are you getting around?">
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
              {([
                { k: "auto", label: "Auto", emoji: "✨" },
                { k: "car", label: "Car", emoji: "🚗" },
                { k: "transit", label: "Transit", emoji: "🚇" },
                { k: "lyft", label: "Lyft", emoji: "🩷" },
                { k: "uber", label: "Uber", emoji: "🖤" },
                { k: "walk", label: "Walk", emoji: "🚶" },
              ] as const).map((m) => (
                <button key={m.k} type="button" onClick={() => setTransportMode(m.k)}
                  className={`rounded-xl border px-2 py-2 text-xs font-semibold transition-colors ${
                    transportMode === m.k ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background text-muted-foreground hover:text-foreground"
                  }`}>
                  <span className="mr-1">{m.emoji}</span>{m.label}
                </button>
              ))}
            </div>
            <p className="mt-1.5 text-xs text-muted-foreground">Auto = AI picks the best mode for each leg (walk short hops, rideshare when drinking, transit downtown).</p>
          </Field>


            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3}
              placeholder="Allergies, can't drink, want it walkable, kids in tow..." className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
          </Field>

          {err && <p className="rounded-lg bg-destructive/10 px-4 py-2 text-sm text-destructive">{err}</p>}

          <button type="submit" disabled={busy}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-base font-semibold text-primary-foreground shadow-pop transition-pop hover:scale-[1.02] disabled:opacity-60">
            {busy ? <><Loader2 className="h-4 w-4 animate-spin" /> Building your day...</> : <><CalendarPlus className="h-4 w-4" /> Build my day</>}
          </button>
        </form>
      </div>

    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}
