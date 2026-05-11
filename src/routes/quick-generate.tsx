import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  WandSparkles,
  ArrowUp,
  ArrowDown,
  Repeat,
  Sparkles,
  Lock,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { makeDemoLoop, setActiveLoop } from "@/lib/loop-store";
import { ConfettiMap } from "@/components/maps/ConfettiMap";
import { useGeocodedPoints } from "@/lib/geocode";

export const Route = createFileRoute("/quick-generate")({
  head: () => ({ meta: [{ title: "Quick Generate — Confetti" }] }),
  component: QuickGenerate,
});

type Stop = {
  emoji: string;
  name: string;
  type: string;
  area: string;
  price: string;
  match: number;
  time: string;
  duration: string;
  alternatives: { emoji: string; name: string; type: string }[];
};

const STOPS: Stop[] = [
  {
    emoji: "🌮",
    name: "Birria Boss",
    type: "Mexican Street Food",
    area: "Echo Park",
    price: "$$",
    match: 96,
    time: "7:00 PM",
    duration: "60 min",
    alternatives: [
      { emoji: "🌯", name: "Sonoratown", type: "Sonoran Tacos" },
      { emoji: "🫔", name: "Holbox", type: "Yucatecan Seafood" },
    ],
  },
  {
    emoji: "🥃",
    name: "The Looking Glass",
    type: "Speakeasy Cocktail Bar",
    area: "Downtown",
    price: "$$$",
    match: 93,
    time: "8:30 PM",
    duration: "75 min",
    alternatives: [
      { emoji: "🍸", name: "Death & Co", type: "Craft Cocktails" },
      { emoji: "🥂", name: "Apt 503", type: "Hidden Lounge" },
    ],
  },
  {
    emoji: "🌃",
    name: "Luma Rooftop",
    type: "Rooftop Lounge",
    area: "Arts District",
    price: "$$$",
    match: 92,
    time: "10:00 PM",
    duration: "90 min",
    alternatives: [
      { emoji: "✨", name: "Mama Shelter", type: "Rooftop Bar" },
      { emoji: "🌆", name: "Perch LA", type: "French Rooftop" },
    ],
  },
];

const TWEAKS = ["More chill", "Add dessert", "Make it fancy", "Kid-friendly"];

function QuickGenerate() {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<"gen" | "ready">("gen");
  const [progress, setProgress] = useState(0);
  const [statusStep, setStatusStep] = useState(0);
  const [stops, setStops] = useState(STOPS);
  const [openSwap, setOpenSwap] = useState<number | null>(null);
  const [showTweaks, setShowTweaks] = useState(false);
  const [tweak, setTweak] = useState("");

  useEffect(() => {
    if (phase !== "gen") return;
    const start = Date.now();
    const iv = setInterval(() => {
      const p = Math.min(100, ((Date.now() - start) / 2600) * 100);
      setProgress(p);
    }, 50);
    const t1 = setTimeout(() => setStatusStep(1), 600);
    const t2 = setTimeout(() => setStatusStep(2), 1300);
    const t3 = setTimeout(() => setStatusStep(3), 2000);
    const done = setTimeout(() => {
      const loop = makeDemoLoop({
        stops: STOPS.map((s, i) => ({
          id: `s${i + 1}`,
          name: s.name,
          type: s.type,
          time: s.time,
          area: s.area,
        })),
      });
      setActiveLoop(loop);
      navigate({ to: "/boarding-pass", replace: true });
    }, 2800);
    return () => {
      clearInterval(iv);
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(done);
    };
  }, [phase, navigate]);

  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= stops.length) return;
    const next = [...stops];
    [next[i], next[j]] = [next[j], next[i]];
    setStops(next);
  };

  const swap = (i: number, alt: { emoji: string; name: string; type: string }) => {
    const next = [...stops];
    next[i] = { ...next[i], emoji: alt.emoji, name: alt.name, type: alt.type };
    setStops(next);
    setOpenSwap(null);
  };

  const regenerate = () => {
    setPhase("gen");
    setProgress(0);
    setStatusStep(0);
    setShowTweaks(false);
    setTweak("");
  };

  if (phase === "gen") {
    const lines = [
      "Analyzing your taste profile",
      "Matching trending spots near you",
      "Optimizing route & timing",
    ];
    return (
      <div className="fixed inset-0 grid place-items-center bg-background p-6">
        <div className="flex w-full max-w-md flex-col items-center text-center">
          <div className="relative h-40 w-40">
            <div className="absolute inset-0 animate-spin rounded-full bg-[conic-gradient(from_0deg,#a855f7,#14b8a6,#f97373,#a855f7)] [animation-duration:2.4s]" />
            <div className="absolute inset-2 grid place-items-center rounded-full bg-background">
              <WandSparkles className="h-10 w-10 text-primary" />
            </div>
          </div>
          <h1 className="mt-8 font-display text-3xl font-bold">Generating your plan…</h1>
          <ul className="mt-6 w-full space-y-2 text-sm">
            {lines.map((l, i) => (
              <li
                key={l}
                className={`transition-all duration-500 ${i < statusStep ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"}`}
              >
                <span className="inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-primary" /> {l}
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-8 w-full">
            <Progress value={progress} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-4 pb-24 sm:p-6">
      <header>
        <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
          Your plan
        </p>
        <h1 className="mt-1 font-display text-3xl font-bold">Tonight's plan</h1>
      </header>

      <section className="rounded-3xl border border-border bg-gradient-to-br from-primary/15 via-background to-accent/10 p-6 shadow-card">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
              Vibe Match Score
            </div>
            <div className="mt-1 font-display text-5xl font-bold">94%</div>
          </div>
          <div className="grid h-16 w-16 place-items-center rounded-full bg-gradient-vibe text-primary-foreground">
            <Sparkles className="h-7 w-7" />
          </div>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          Curated from your taste profile and live trending data.
        </p>
      </section>

      <ul className="space-y-3">
        {stops.map((s, i) => (
          <li key={s.name + i} className="rounded-2xl border border-border bg-card p-4 shadow-card">
            <div className="flex items-start gap-3">
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-muted text-2xl">
                {s.emoji}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="font-display text-lg font-bold leading-tight">{s.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {s.type} · {s.area} · {s.price}
                    </div>
                  </div>
                  <span className="shrink-0 rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-bold text-primary">
                    {s.match}%
                  </span>
                </div>
                <div className="mt-2 text-xs text-muted-foreground">
                  {s.time} · {s.duration}
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => move(i, -1)}
                    disabled={i === 0}
                    className="grid h-8 w-8 place-items-center rounded-full border border-border disabled:opacity-30"
                  >
                    <ArrowUp className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => move(i, 1)}
                    disabled={i === stops.length - 1}
                    className="grid h-8 w-8 place-items-center rounded-full border border-border disabled:opacity-30"
                  >
                    <ArrowDown className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => setOpenSwap(openSwap === i ? null : i)}
                    className="ml-auto inline-flex items-center gap-1 rounded-full border border-border px-3 py-1.5 text-xs font-semibold hover:bg-muted"
                  >
                    <Repeat className="h-3.5 w-3.5" /> Swap
                  </button>
                </div>
                {openSwap === i && (
                  <div className="mt-3 space-y-2 border-t border-border pt-3 animate-fade-in">
                    {s.alternatives.map((a) => (
                      <button
                        key={a.name}
                        onClick={() => swap(i, a)}
                        className="flex w-full items-center gap-3 rounded-xl border border-border bg-background p-2.5 text-left hover:bg-muted"
                      >
                        <span className="text-xl">{a.emoji}</span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-semibold">{a.name}</span>
                          <span className="block text-xs text-muted-foreground">{a.type}</span>
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </li>
        ))}
      </ul>

      <section className="rounded-2xl border border-border bg-card p-4 shadow-card">
        <button
          onClick={() => setShowTweaks(!showTweaks)}
          className="flex w-full items-center justify-between font-semibold"
        >
          <span className="inline-flex items-center gap-2">
            <Repeat className="h-4 w-4" /> Regenerate with tweaks
          </span>
          <ChevronDown
            className={`h-4 w-4 transition-transform ${showTweaks ? "rotate-180" : ""}`}
          />
        </button>
        {showTweaks && (
          <div className="mt-4 space-y-3 animate-fade-in">
            <div className="flex flex-wrap gap-2">
              {TWEAKS.map((t) => (
                <button
                  key={t}
                  onClick={() => setTweak(tweak ? `${tweak}, ${t}` : t)}
                  className="rounded-full border border-border bg-background px-3 py-1.5 text-xs font-semibold hover:bg-muted"
                >
                  {t}
                </button>
              ))}
            </div>
            <Input
              value={tweak}
              onChange={(e) => setTweak(e.target.value)}
              placeholder="Anything else to adjust?"
            />
            <Button onClick={regenerate} className="w-full">
              Regenerate
            </Button>
          </div>
        )}
      </section>

      <div className="fixed inset-x-0 bottom-4 mx-auto w-[calc(100%-2rem)] max-w-2xl">
        <Button
          onClick={() => {
            const loop = makeDemoLoop({
              stops: stops.map((s, i) => ({
                id: `s${i + 1}`,
                name: s.name,
                type: s.type,
                time: s.time,
                area: s.area,
              })),
            });
            setActiveLoop(loop);
            navigate({ to: "/boarding-pass" });
          }}
          className="h-14 w-full gap-2 rounded-2xl bg-gradient-vibe text-base font-bold shadow-pop"
        >
          <Lock className="h-5 w-5" /> Lock In This Plan
        </Button>
      </div>
    </div>
  );
}
