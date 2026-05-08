import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowLeft, Bookmark, Camera, Clock, MapPin, RefreshCw, Sparkles, Utensils, Wine } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { toast } from "sonner";

export const Route = createFileRoute("/plan/preview")({
  head: () => ({
    meta: [
      { title: "Preview your day — Confetti" },
      { name: "description", content: "A live preview of your AI-built day: stops, timing, vibes, and a map." },
    ],
  }),
  component: PreviewPage,
});

type Stop = {
  time: string;
  duration: string;
  name: string;
  category: "meal" | "drinks" | "scenic" | "activity";
  neighborhood: string;
  blurb: string;
  vibes: string[];
  pin: { x: number; y: number };
};

const VARIANTS: Stop[][] = [
  [
    { time: "11:30 AM", duration: "1h 15m", name: "Bluebird Coffee Social", category: "meal", neighborhood: "East Side", blurb: "Sun-drenched corner café with house-roasted beans and flaky kouign-amann.", vibes: ["Cozy", "Light bites", "Walkable"], pin: { x: 22, y: 38 } },
    { time: "1:15 PM", duration: "1h 30m", name: "The Marigold Rooftop", category: "drinks", neighborhood: "Warehouse District", blurb: "Skyline views, frozen palomas, and a chef's antipasto board to share.", vibes: ["Romantic", "Golden-hour", "Bring a jacket"], pin: { x: 48, y: 26 } },
    { time: "3:15 PM", duration: "1h 45m", name: "Lantern Hill Overlook", category: "scenic", neighborhood: "Riverbend", blurb: "Short trail to a quiet bluff — perfect for slow walks and slow conversations.", vibes: ["Outdoors", "Photo-friendly", "Free"], pin: { x: 72, y: 58 } },
    { time: "5:30 PM", duration: "2h", name: "Osteria di Pesca", category: "meal", neighborhood: "Old Market", blurb: "Hand-pulled pasta, candlelit booths, a sommelier who actually listens.", vibes: ["Elegant", "Date-worthy", "Reservation suggested"], pin: { x: 58, y: 78 } },
  ],
  [
    { time: "12:00 PM", duration: "1h", name: "Six Spoons Brunch Room", category: "meal", neighborhood: "Midtown", blurb: "Sourdough pancakes, citrus mimosas, and the kind of corner booth you don't want to leave.", vibes: ["Brunch", "Lively", "Family-friendly"], pin: { x: 30, y: 30 } },
    { time: "2:00 PM", duration: "2h", name: "Glasshouse Modern Art", category: "activity", neighborhood: "Cultural Mile", blurb: "A walkable, sun-lit gallery with a rotating textile exhibit on now.", vibes: ["Creative", "Quiet", "Indoor"], pin: { x: 52, y: 50 } },
    { time: "4:30 PM", duration: "1h 15m", name: "Harborline Promenade", category: "scenic", neighborhood: "Waterfront", blurb: "Salt air, street musicians, and ice cream from the corner cart.", vibes: ["Outdoors", "Stroll", "Photo-friendly"], pin: { x: 70, y: 70 } },
    { time: "6:30 PM", duration: "1h 45m", name: "The Velvet Banquette", category: "drinks", neighborhood: "Old Market", blurb: "Hidden cocktail room behind a record store. Order the smoked Negroni.", vibes: ["Speakeasy", "Romantic", "21+"], pin: { x: 42, y: 82 } },
  ],
];

const CAT_ICON = { meal: Utensils, drinks: Wine, scenic: Camera, activity: Sparkles } as const;
const CAT_TONE: Record<Stop["category"], string> = {
  meal: "bg-coral/15 text-coral border-coral/30",
  drinks: "bg-purple/15 text-purple border-purple/30",
  scenic: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30",
  activity: "bg-amber-500/15 text-amber-600 border-amber-500/30",
};

function PreviewPage() {
  const [variant, setVariant] = useState(0);
  const [saved, setSaved] = useState(false);
  const nav = useNavigate();
  const stops = useMemo(() => VARIANTS[variant % VARIANTS.length], [variant]);

  function regenerate() {
    setVariant((v) => v + 1);
    setSaved(false);
    toast.success("Fresh plan ready", { description: "We swapped in a new set of stops." });
  }

  function save() {
    setSaved(true);
    toast.success("Plan saved to your trips");
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center justify-between gap-4">
          <Link to="/plan" className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Back to planner
          </Link>
          <span className="inline-flex items-center gap-2 rounded-full border border-dashed border-border bg-card px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            <Sparkles className="h-3 w-3 text-primary" /> Preview · sample data
          </span>
        </div>

        <div className="mb-8">
          <h1 className="font-display text-4xl font-bold tracking-tight sm:text-5xl">
            Your <span className="text-gradient">date-night</span> day
          </h1>
          <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" /> 11:30 AM – 7:30 PM</span>
            <span className="inline-flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /> 4 stops · ~6.5 mi</span>
            <span>· $$ budget · Romantic vibe</span>
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1fr_22rem]">
          {/* Timeline */}
          <ol className="relative space-y-5 border-l-2 border-dashed border-border pl-6 sm:pl-8">
            {stops.map((s, i) => {
              const Icon = CAT_ICON[s.category];
              return (
                <li key={`${variant}-${i}`} className="relative">
                  <span className={`absolute -left-[34px] sm:-left-[42px] top-4 grid h-9 w-9 place-items-center rounded-full border-2 ${CAT_TONE[s.category]} bg-background shadow-card`}>
                    <Icon className="h-4 w-4" />
                  </span>
                  <article className="rounded-3xl border border-border bg-card p-5 shadow-card transition-all hover:border-primary/40 hover:shadow-pop sm:p-6">
                    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                      <span className="text-sm font-bold text-primary">{s.time}</span>
                      <span className="text-xs text-muted-foreground">· {s.duration}</span>
                      <span className="ml-auto inline-flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3" /> {s.neighborhood}
                      </span>
                    </div>
                    <h2 className="mt-1.5 font-display text-2xl font-semibold leading-tight">{s.name}</h2>
                    <p className="mt-1.5 text-sm text-muted-foreground">{s.blurb}</p>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {s.vibes.map((v) => (
                        <span key={v} className="rounded-full bg-muted px-2.5 py-0.5 text-[11px] font-semibold text-muted-foreground">{v}</span>
                      ))}
                    </div>
                  </article>
                </li>
              );
            })}
          </ol>

          {/* Sidebar: map + actions */}
          <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
            <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-card">
              <div className="relative h-72 w-full overflow-hidden bg-gradient-to-br from-muted via-background to-muted">
                {/* Faux map grid */}
                <div className="absolute inset-0 opacity-40" style={{
                  backgroundImage:
                    "linear-gradient(to right, color-mix(in oklab, var(--border) 60%, transparent) 1px, transparent 1px), linear-gradient(to bottom, color-mix(in oklab, var(--border) 60%, transparent) 1px, transparent 1px)",
                  backgroundSize: "32px 32px",
                }} />
                {/* Faux river */}
                <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                  <path d="M -5 70 Q 30 55 50 65 T 105 50" stroke="color-mix(in oklab, var(--primary) 35%, transparent)" strokeWidth="6" fill="none" strokeLinecap="round" />
                </svg>
                {/* Route line through pins */}
                <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                  <polyline
                    points={stops.map((s) => `${s.pin.x},${s.pin.y}`).join(" ")}
                    fill="none"
                    stroke="var(--primary)"
                    strokeWidth="0.8"
                    strokeDasharray="2 1.5"
                    strokeLinecap="round"
                  />
                </svg>
                {/* Pins */}
                {stops.map((s, i) => (
                  <div
                    key={i}
                    className="absolute -translate-x-1/2 -translate-y-full"
                    style={{ left: `${s.pin.x}%`, top: `${s.pin.y}%` }}
                  >
                    <div className="grid h-7 w-7 place-items-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground shadow-pop ring-2 ring-background">
                      {i + 1}
                    </div>
                  </div>
                ))}
                <span className="absolute bottom-2 right-2 rounded-full bg-background/80 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground backdrop-blur">
                  Map preview
                </span>
              </div>
              <div className="space-y-1 border-t border-border p-4 text-xs text-muted-foreground">
                <p className="font-semibold text-foreground">Route summary</p>
                <p>~6.5 mi total · mostly walkable with one rideshare</p>
                <p>Best parking: Old Market garage (covered)</p>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <button
                onClick={save}
                disabled={saved}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-pop transition-pop hover:scale-[1.02] disabled:opacity-70"
              >
                <Bookmark className="h-4 w-4" />
                {saved ? "Saved to your trips" : "Save this plan"}
              </button>
              <button
                onClick={regenerate}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-border bg-card px-5 py-3 text-sm font-semibold text-foreground transition-colors hover:border-primary hover:text-primary"
              >
                <RefreshCw className="h-4 w-4" />
                Regenerate
              </button>
              <p className="px-1 text-center text-[11px] text-muted-foreground">
                Sample stops shown — real AI generation arrives with the backend.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
