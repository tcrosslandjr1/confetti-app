import { createFileRoute, Link } from "@tanstack/react-router";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { z } from "zod";
import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Calendar, Check, CheckCircle2, Clock, MapPin, PartyPopper, Play, Sparkles, X } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { findInviteByToken, loadInviteVideo, setInviteStatus, type Invite } from "@/lib/invites";
import { checkStopFits } from "@/lib/hours";
import { formatUpdatedAt, loadStatus, shiftTimeLabel, subscribeStatus, type TripStatus } from "@/lib/trip-status";
import { LiveElapsed } from "@/components/LiveElapsed";

const rsvpSearchSchema = z.object({
  invite: fallback(z.string(), "").default(""),
  v: fallback(z.string(), "").default(""),
});

export const Route = createFileRoute("/rsvp/$tripId")({
  validateSearch: zodValidator(rsvpSearchSchema),
  head: () => ({
    meta: [
      { title: "You're invited — Loop" },
      { name: "description", content: "Accept or decline your Loop invite." },
    ],
  }),
  component: RsvpPage,
});

const TRIP_PREVIEW = {
  title: "Loop — Date Night Day",
  date: "This Saturday",
  window: "11:30 AM – 7:30 PM",
  city: "Old Market & East Side",
  day: "sat" as const,
  stops: [
    { time: "11:30 AM", durationMin: 75,  name: "Bluebird Coffee Social", neighborhood: "East Side" },
    { time: "1:15 PM",  durationMin: 90,  name: "The Marigold Rooftop",   neighborhood: "Warehouse District" },
    { time: "3:15 PM",  durationMin: 90,  name: "Lantern Hill Overlook",  neighborhood: "Riverbend" },
    { time: "5:30 PM",  durationMin: 120, name: "Osteria di Pesca",       neighborhood: "Old Market" },
  ],
};

function RsvpPage() {
  const { tripId } = Route.useParams();
  const { invite: token, v: videoFromUrl } = Route.useSearch();
  const [invite, setInvite] = useState<Invite | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [pulse, setPulse] = useState(false);
  const [revealedStops, setRevealedStops] = useState(0);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoProgress, setVideoProgress] = useState(0);
  const [videoDone, setVideoDone] = useState(false);
  const [tripStatus, setTripStatus] = useState<TripStatus | null>(null);

  useEffect(() => {
    if (!token) { setLoaded(true); return; }
    setInvite(findInviteByToken(tripId, token));
    setLoaded(true);
  }, [tripId, token]);

  // Live host status (running late / on time) — synced via storage events.
  useEffect(() => {
    setTripStatus(loadStatus(tripId));
    return subscribeStatus(tripId, () => setTripStatus(loadStatus(tripId)));
  }, [tripId]);

  // Resolve video URL: prefer the one in the link (works cross-device), fall back to localStorage.
  useEffect(() => {
    if (videoFromUrl) {
      try { setVideoUrl(decodeURIComponent(videoFromUrl)); return; } catch { /* ignore */ }
    }
    setVideoUrl(loadInviteVideo(tripId));
  }, [tripId, videoFromUrl]);

  // Staggered timeline reveal — waits until the host's video has played (if present).
  useEffect(() => {
    if (videoUrl && !videoDone) return;
    setRevealedStops(0);
    const timers = TRIP_PREVIEW.stops.map((_, i) =>
      setTimeout(() => setRevealedStops((n) => Math.max(n, i + 1)), 600 + i * 550)
    );
    return () => timers.forEach(clearTimeout);
  }, [videoUrl, videoDone]);

  const status = invite?.status ?? null;
  const accepted = status === "accepted";
  const declined = status === "declined";

  const headline = useMemo(() => {
    if (accepted) return "You're in. 🎉";
    if (declined) return "Maybe next time.";
    return "You're invited.";
  }, [accepted, declined]);

  function respond(next: "accepted" | "declined") {
    if (!token) return;
    const updated = setInviteStatus(tripId, token, next);
    if (updated) {
      setInvite(updated);
      setPulse(true);
      setTimeout(() => setPulse(false), 700);
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <SiteHeader />
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 -z-0 h-[420px] bg-gradient-to-b from-primary/15 via-coral/10 to-transparent blur-2xl" />

      <div className="relative z-10 mx-auto max-w-2xl px-4 py-12 sm:px-6">
        <div className="text-center">
          <div className={`mx-auto mb-5 inline-flex h-16 w-16 items-center justify-center rounded-full text-primary-foreground shadow-pop transition-transform ${accepted ? "bg-gradient-to-br from-emerald-500 to-primary" : declined ? "bg-gradient-to-br from-muted-foreground to-foreground" : "bg-gradient-to-br from-primary to-coral"} ${pulse ? "scale-110" : ""}`}>
            {accepted ? <CheckCircle2 className="h-8 w-8" strokeWidth={2.5} /> : declined ? <X className="h-8 w-8" strokeWidth={2.5} /> : <PartyPopper className="h-8 w-8" strokeWidth={2.5} />}
          </div>

          <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            <Sparkles className="h-3 w-3 text-primary" /> Invite · {tripId}
          </span>

          <h1 className="mt-4 font-display text-4xl font-bold tracking-tight sm:text-5xl">{headline}</h1>

          {loaded && !token && (
            <p className="mx-auto mt-3 max-w-md text-muted-foreground">
              This link is missing the invite code. Ask whoever sent it to share the full link.
            </p>
          )}

          {loaded && token && !invite && (
            <p className="mx-auto mt-3 max-w-md text-muted-foreground">
              We couldn't find this invite. It may have been removed, or the link was opened on a different device than the one that created the plan.
            </p>
          )}

          {invite && !accepted && !declined && (
            <p className="mx-auto mt-3 max-w-md text-muted-foreground">
              <span className="font-semibold text-foreground">{invite.email}</span> — your friend rallied a day. Wanna join?
            </p>
          )}

          {invite && accepted && (
            <p className="mx-auto mt-3 max-w-md text-muted-foreground">
              We told the host — they'll see your name on the guest list. Add it to your calendar so you don't forget.
            </p>
          )}

          {invite && declined && (
            <p className="mx-auto mt-3 max-w-md text-muted-foreground">
              No stress — we let the host know. You can change your mind anytime.
            </p>
          )}
        </div>

        {/* Personal video from the host */}
        {videoUrl && (
          <section className="mt-8 overflow-hidden rounded-3xl border border-border bg-black shadow-card animate-rsvp-rise">
            <div className="flex items-center justify-between gap-2 bg-gradient-to-r from-primary/20 to-coral/20 px-4 py-2 text-[11px] font-semibold uppercase tracking-wider text-primary-foreground">
              <span className="inline-flex items-center gap-2"><Play className="h-3.5 w-3.5" /> A note from your host</span>
              <span className="text-[10px] opacity-80">{videoDone ? "Walkthrough ready" : "Intro playing…"}</span>
            </div>
            <div className="relative">
              <video
                src={videoUrl}
                controls
                autoPlay
                muted
                playsInline
                onTimeUpdate={(e) => {
                  const v = e.currentTarget;
                  if (v.duration > 0) setVideoProgress((v.currentTime / v.duration) * 100);
                }}
                onEnded={() => { setVideoProgress(100); setVideoDone(true); }}
                className="aspect-video w-full bg-black object-cover"
              />
              {/* Lightweight playback progress indicator */}
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1 bg-white/15">
                <div
                  className="h-full bg-gradient-to-r from-primary to-coral transition-[width] duration-200 ease-linear"
                  style={{ width: `${videoProgress}%` }}
                />
              </div>
            </div>
            {!videoDone && (
              <div className="flex items-center justify-between gap-3 px-4 py-2 text-[11px] text-primary-foreground/80">
                <span className="opacity-80">Walkthrough unlocks when the intro finishes</span>
                <button
                  type="button"
                  onClick={() => { setVideoProgress(100); setVideoDone(true); }}
                  className="rounded-full border border-white/20 px-2.5 py-1 font-semibold text-white/90 transition-colors hover:border-white/60 hover:text-white"
                >
                  Skip intro
                </button>
              </div>
            )}
          </section>
        )}

        {/* Animated trip preview */}
        <section className="mt-8 overflow-hidden rounded-3xl border border-border bg-card shadow-card animate-rsvp-rise" style={{ animationDelay: "120ms" }}>
          <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-gradient-to-r from-primary/5 to-coral/5 p-5 sm:p-6">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{TRIP_PREVIEW.date}</p>
              <p className="mt-0.5 font-display text-xl font-semibold">{TRIP_PREVIEW.title}</p>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              {tripStatus && tripStatus.minutesLate > 0 && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 px-2.5 py-1 font-semibold text-amber-700">
                  <span className="relative inline-flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-500 opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-500" />
                  </span>
                  Running ~{tripStatus.minutesLate} min late · {formatUpdatedAt(tripStatus.updatedAt)} · <LiveElapsed since={tripStatus.updatedAt} />
                </span>
              )}
              <span className="inline-flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" /> {TRIP_PREVIEW.window}</span>
              <span className="inline-flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /> {TRIP_PREVIEW.city}</span>
            </div>
          </header>

          <div className="relative p-4 sm:p-6">
            {/* Animated progress spine */}
            <div className="absolute bottom-6 left-8 top-6 w-0.5 overflow-hidden rounded-full bg-border sm:left-10">
              <div
                className="w-full bg-gradient-to-b from-primary to-coral transition-all duration-700 ease-out"
                style={{ height: `${(revealedStops / TRIP_PREVIEW.stops.length) * 100}%` }}
              />
            </div>

            <ol className="relative space-y-4">
              {TRIP_PREVIEW.stops.map((s, i) => {
                const shown = i < revealedStops;
                const fit = checkStopFits(s.name, s.time, s.durationMin, TRIP_PREVIEW.day);
                return (
                  <li
                    key={i}
                    className={`flex items-center gap-4 transition-all duration-500 ease-out ${shown ? "translate-x-0 opacity-100" : "translate-x-3 opacity-0"}`}
                  >
                    <span
                      className={`relative grid h-9 w-9 shrink-0 place-items-center rounded-full text-xs font-bold transition-all duration-500 ${shown ? "bg-gradient-to-br from-primary to-coral text-primary-foreground shadow-pop" : "bg-muted text-muted-foreground"}`}
                    >
                      {i + 1}
                      {shown && i === revealedStops - 1 && (
                        <span className="absolute inset-0 -z-10 animate-rsvp-ping rounded-full bg-primary/40" />
                      )}
                    </span>
                    <div className="min-w-0 flex-1 rounded-xl border border-border bg-background/60 p-3">
                      <p className="truncate text-sm font-semibold">{s.name}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {s.neighborhood}
                        {fit.state !== "unknown" && <> · {fit.hoursLabel}</>}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      {tripStatus && tripStatus.minutesLate > 0 ? (
                        <span className="flex items-baseline gap-1.5">
                          <span className="text-[11px] text-muted-foreground line-through">{s.time}</span>
                          <span className="text-sm font-semibold text-amber-700">{shiftTimeLabel(s.time, tripStatus.minutesLate)}</span>
                        </span>
                      ) : (
                        <span className="text-sm font-semibold text-muted-foreground">{s.time}</span>
                      )}
                      {fit.state === "open" && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-700">
                          <Check className="h-3 w-3" /> Open
                        </span>
                      )}
                      {fit.state === "tight" && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-700">
                          <AlertTriangle className="h-3 w-3" /> Tight
                        </span>
                      )}
                      {fit.state === "closed" && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-destructive/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-destructive">
                          <AlertTriangle className="h-3 w-3" /> {fit.reason}
                        </span>
                      )}
                    </div>
                  </li>
                );
              })}
            </ol>
          </div>
        </section>

        {/* Actions */}
        {invite && (
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => respond("accepted")}
              disabled={accepted}
              className={`inline-flex items-center justify-center gap-2 rounded-2xl px-6 py-3.5 text-sm font-semibold shadow-pop transition-all ${accepted ? "bg-emerald-500/15 text-emerald-700 ring-1 ring-emerald-500/40" : "bg-primary text-primary-foreground hover:-translate-y-0.5"}`}
            >
              {accepted ? <Check className="h-4 w-4" /> : <PartyPopper className="h-4 w-4" />}
              {accepted ? "You're in" : "Count me in"}
            </button>
            <button
              type="button"
              onClick={() => respond("declined")}
              disabled={declined}
              className={`inline-flex items-center justify-center gap-2 rounded-2xl border px-6 py-3.5 text-sm font-semibold transition-all ${declined ? "border-border bg-muted text-muted-foreground" : "border-border bg-card text-foreground hover:-translate-y-0.5 hover:border-destructive hover:text-destructive"}`}
            >
              <X className="h-4 w-4" />
              {declined ? "Declined" : "Can't make it"}
            </button>
          </div>
        )}

        {(accepted || declined) && (
          <div className="mt-3 flex justify-center">
            <button
              type="button"
              onClick={() => respond(accepted ? "declined" : "accepted")}
              className="text-xs font-semibold text-muted-foreground underline-offset-2 hover:text-primary hover:underline"
            >
              Change my response
            </button>
          </div>
        )}

        <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Link to="/" className="inline-flex items-center justify-center gap-2 rounded-full border border-border bg-card px-6 py-3 text-sm font-semibold text-foreground transition-colors hover:border-primary hover:text-primary">
            <Calendar className="h-4 w-4" /> Build your own day
          </Link>
        </div>
      </div>
    </div>
  );
}
