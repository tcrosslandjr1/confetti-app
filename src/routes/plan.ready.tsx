import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Apple, Calendar, Check, CheckCircle2, Clock, Copy, Link as LinkIcon, MapPin, PartyPopper, Send, Sparkles } from "lucide-react";
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
  { time: "1:15 PM",  name: "The Marigold Rooftop", neighborhood: "Warehouse District" },
  { time: "3:15 PM",  name: "Lantern Hill Overlook", neighborhood: "Riverbend" },
  { time: "5:30 PM",  name: "Osteria di Pesca",     neighborhood: "Old Market" },
];

const TRIP = {
  id: "PLN-A7K2",
  title: "Confetti — Date Night Day",
  description: "A little romance, end-to-end. 4 stops curated by Confetti.",
  // Saturday 11:30 AM – 7:30 PM (next Saturday)
  start: nextSaturdayAt(11, 30),
  end:   nextSaturdayAt(19, 30),
  location: "Old Market & East Side",
};

function nextSaturdayAt(h: number, m: number) {
  const d = new Date();
  const delta = (6 - d.getDay() + 7) % 7 || 7;
  d.setDate(d.getDate() + delta);
  d.setHours(h, m, 0, 0);
  return d;
}

function fmtUTC(d: Date) {
  // YYYYMMDDTHHmmssZ
  return d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

function buildIcs() {
  const stopLines = STOPS.map((s) => `${s.time} — ${s.name} (${s.neighborhood})`).join("\\n");
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Confetti//Plan//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${TRIP.id}@confetti.app`,
    `DTSTAMP:${fmtUTC(new Date())}`,
    `DTSTART:${fmtUTC(TRIP.start)}`,
    `DTEND:${fmtUTC(TRIP.end)}`,
    `SUMMARY:${TRIP.title}`,
    `DESCRIPTION:${TRIP.description}\\n\\nItinerary:\\n${stopLines}`,
    `LOCATION:${TRIP.location}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}

function buildGoogleUrl() {
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: TRIP.title,
    dates: `${fmtUTC(TRIP.start)}/${fmtUTC(TRIP.end)}`,
    details: `${TRIP.description}\n\n` + STOPS.map((s) => `${s.time} — ${s.name} (${s.neighborhood})`).join("\n"),
    location: TRIP.location,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

function ReadyPage() {
  const [showConfetti, setShowConfetti] = useState(true);
  const [copied, setCopied] = useState(false);

  const shareUrl = useMemo(() => {
    if (typeof window === "undefined") return `https://confetti.app/trips/${TRIP.id}`;
    return `${window.location.origin}/trips/${TRIP.id}`;
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setShowConfetti(false), 2500);
    return () => clearTimeout(t);
  }, []);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success("Link copied", { description: "Send it to whoever's coming along." });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Couldn't copy — long-press the link instead.");
    }
  }

  function downloadIcs() {
    const blob = new Blob([buildIcs()], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "confetti-plan.ics";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1500);
    toast.success("Apple Calendar file ready", { description: "Open the .ics to add it." });
  }

  function openGoogle() {
    window.open(buildGoogleUrl(), "_blank", "noopener,noreferrer");
    toast.success("Opening Google Calendar…");
  }

  async function appleInvites() {
    const text = `${TRIP.title}\n${TRIP.description}\n\n${shareUrl}`;
    if (typeof navigator !== "undefined" && "share" in navigator) {
      try {
        await (navigator as Navigator & { share: (d: ShareData) => Promise<void> }).share({
          title: TRIP.title,
          text,
          url: shareUrl,
        });
        return;
      } catch {
        // user cancelled or unsupported — fall through
      }
    }
    await navigator.clipboard?.writeText(text);
    toast.success("Invite text copied", { description: "Paste it into Apple Invites or Messages." });
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
            <Sparkles className="h-3 w-3 text-primary" /> Plan saved · {TRIP.id}
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

        {/* Shareable link */}
        <section className="mt-6 rounded-3xl border border-border bg-card p-4 shadow-card sm:p-5">
          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            <LinkIcon className="h-3.5 w-3.5 text-primary" /> Shareable trip link
          </div>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="flex min-w-0 flex-1 items-center gap-2 rounded-xl border border-border bg-muted/40 px-3 py-2.5">
              <span className="truncate font-mono text-xs text-foreground">{shareUrl}</span>
            </div>
            <button
              onClick={copyLink}
              className={`inline-flex items-center justify-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm font-semibold transition-all hover:-translate-y-0.5 hover:border-primary hover:text-primary hover:shadow-pop ${copied ? "border-primary text-primary" : ""}`}
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? "Copied" : "Copy link"}
            </button>
          </div>
          <p className="mt-2 text-[11px] text-muted-foreground">
            Anyone with the link can view the plan. They don't need an account.
          </p>
        </section>

        {/* Calendar + invites */}
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <button onClick={downloadIcs} className="group inline-flex flex-col items-start gap-1.5 rounded-2xl border border-border bg-card p-4 text-left transition-all hover:-translate-y-0.5 hover:border-primary hover:shadow-pop">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-foreground text-background">
              <Apple className="h-4 w-4" />
            </span>
            <span className="text-sm font-semibold">Apple Calendar</span>
            <span className="text-[11px] text-muted-foreground">Downloads a .ics file</span>
          </button>
          <button onClick={openGoogle} className="group inline-flex flex-col items-start gap-1.5 rounded-2xl border border-border bg-card p-4 text-left transition-all hover:-translate-y-0.5 hover:border-primary hover:shadow-pop">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 via-emerald-500 to-amber-500 text-white">
              <Calendar className="h-4 w-4" />
            </span>
            <span className="text-sm font-semibold">Google Calendar</span>
            <span className="text-[11px] text-muted-foreground">Opens a pre-filled event</span>
          </button>
          <button onClick={appleInvites} className="group inline-flex flex-col items-start gap-1.5 rounded-2xl border border-border bg-card p-4 text-left transition-all hover:-translate-y-0.5 hover:border-primary hover:shadow-pop">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-pink-500 to-purple-500 text-white">
              <Send className="h-4 w-4" />
            </span>
            <span className="text-sm font-semibold">Apple Invites</span>
            <span className="text-[11px] text-muted-foreground">Share via system sheet</span>
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
