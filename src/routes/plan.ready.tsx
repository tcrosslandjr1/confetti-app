import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CalendarPlus, CheckCircle2, Clock, MapPin, PartyPopper, Share2, Sparkles, Users } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { toast } from "sonner";

export const Route = createFileRoute("/plan/ready")({
  head: () => ({
    meta: [
      { title: "You're ready to roll — Confetti" },
      { name: "description", content: "Your day is saved. Share it, add it to your calendar, or rally the crew." },
    ],
  }),
  component: ReadyPage,
});

const STOPS = [
  { time: "11:30 AM", name: "Bluebird Coffee Social", neighborhood: "East Side" },
  { time: "1:15 PM", name: "The Marigold Rooftop", neighborhood: "Warehouse District" },
  { time: "3:15 PM", name: "Lantern Hill Overlook", neighborhood: "Riverbend" },
  { time: "5:30 PM", name: "Osteria di Pesca", neighborhood: "Old Market" },
];

function ReadyPage() {
  const [showConfetti, setShowConfetti] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setShowConfetti(false), 2500);
    return () => clearTimeout(t);
  }, []);

  function copyLink() {
    navigator.clipboard?.writeText(window.location.origin + "/plan/preview");
    toast.success("Link copied", { description: "Send it to whoever's coming along." });
  }

  function addToCalendar() {
    toast.success("Added to your calendar", { description: "Saturday, 11:30 AM – 7:30 PM" });
  }

  function invite() {
    toast.success("Invite sheet ready", { description: "Pick people to bring along." });
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <SiteHeader />

      {/* Soft glow background */}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 -z-0 h-[420px] bg-gradient-to-b from-primary/15 via-coral/10 to-transparent blur-2xl" />

      {/* Confetti burst */}
      {showConfetti && (
        <div aria-hidden className="pointer-events-none absolute inset-x-0 top-24 z-0 mx-auto h-64 max-w-3xl">
          {Array.from({ length: 28 }).map((_, i) => {
            const left = (i * 37) % 100;
            const delay = (i % 8) * 0.08;
            const colors = ["bg-primary", "bg-coral", "bg-purple", "bg-amber-400", "bg-emerald-500"];
            const color = colors[i % colors.length];
            return (
              <span
                key={i}
                className={`absolute top-0 h-2.5 w-2.5 rounded-sm ${color} animate-confetti-fall`}
                style={{ left: `${left}%`, animationDelay: `${delay}s`, transform: `rotate(${(i * 23) % 360}deg)` }}
              />
            );
          })}
        </div>
      )}

      <div className="relative z-10 mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="text-center">
          <div className="mx-auto mb-5 inline-flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-primary to-coral text-primary-foreground shadow-pop">
            <CheckCircle2 className="h-8 w-8" strokeWidth={2.5} />
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            <Sparkles className="h-3 w-3 text-primary" /> Plan saved
          </span>
          <h1 className="mt-4 font-display text-4xl font-bold tracking-tight sm:text-5xl">
            You're <span className="text-gradient">ready to roll.</span>
          </h1>
          <p className="mx-auto mt-3 max-w-md text-muted-foreground">
            Your date-night day is locked in. Share it with your crew, drop it in your calendar, and just show up.
          </p>
        </div>

        {/* Recap card */}
        <section className="mt-8 overflow-hidden rounded-3xl border border-border bg-card shadow-card">
          <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-gradient-to-r from-primary/5 to-coral/5 p-5 sm:p-6">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Saturday · Date night</p>
              <p className="mt-0.5 font-display text-xl font-semibold">A little romance, end-to-end</p>
            </div>
            <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" /> 11:30 AM – 7:30 PM</span>
              <span className="inline-flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /> 4 stops · ~6.5 mi</span>
            </div>
          </header>
          <ol className="divide-y divide-border">
            {STOPS.map((s, i) => (
              <li key={i} className="flex items-center gap-4 p-4 sm:px-6">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{s.name}</p>
                  <p className="text-xs text-muted-foreground">{s.neighborhood}</p>
                </div>
                <span className="shrink-0 text-sm font-semibold text-muted-foreground">{s.time}</span>
              </li>
            ))}
          </ol>
        </section>

        {/* Actions */}
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <button onClick={addToCalendar} className="inline-flex items-center justify-center gap-2 rounded-2xl border border-border bg-card p-4 text-sm font-semibold transition-all hover:border-primary hover:text-primary hover:shadow-pop">
            <CalendarPlus className="h-4 w-4" /> Add to calendar
          </button>
          <button onClick={copyLink} className="inline-flex items-center justify-center gap-2 rounded-2xl border border-border bg-card p-4 text-sm font-semibold transition-all hover:border-primary hover:text-primary hover:shadow-pop">
            <Share2 className="h-4 w-4" /> Share the plan
          </button>
          <button onClick={invite} className="inline-flex items-center justify-center gap-2 rounded-2xl border border-border bg-card p-4 text-sm font-semibold transition-all hover:border-primary hover:text-primary hover:shadow-pop">
            <Users className="h-4 w-4" /> Invite the crew
          </button>
        </div>

        {/* Primary CTAs */}
        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Link to="/trips" className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-pop transition-pop hover:scale-[1.02] sm:w-auto">
            <PartyPopper className="h-4 w-4" /> View in my trips
          </Link>
          <Link to="/plan" className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-border bg-card px-6 py-3 text-sm font-semibold text-foreground transition-colors hover:border-primary hover:text-primary sm:w-auto">
            Plan another day
          </Link>
        </div>
      </div>
    </div>
  );
}
