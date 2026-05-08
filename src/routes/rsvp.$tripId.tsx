import { createFileRoute, Link } from "@tanstack/react-router";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { z } from "zod";
import { useEffect, useMemo, useState } from "react";
import { Calendar, Check, CheckCircle2, Clock, MapPin, PartyPopper, Play, Sparkles, X } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { findInviteByToken, loadInviteVideo, setInviteStatus, type Invite } from "@/lib/invites";

const rsvpSearchSchema = z.object({
  invite: fallback(z.string(), "").default(""),
  v: fallback(z.string(), "").default(""),
});

export const Route = createFileRoute("/rsvp/$tripId")({
  validateSearch: zodValidator(rsvpSearchSchema),
  head: () => ({
    meta: [
      { title: "You're invited — Confetti" },
      { name: "description", content: "Accept or decline your Confetti invite." },
    ],
  }),
  component: RsvpPage,
});

const TRIP_PREVIEW = {
  title: "Confetti — Date Night Day",
  date: "This Saturday",
  window: "11:30 AM – 7:30 PM",
  city: "Old Market & East Side",
  stops: [
    { time: "11:30 AM", name: "Bluebird Coffee Social", neighborhood: "East Side" },
    { time: "1:15 PM",  name: "The Marigold Rooftop",   neighborhood: "Warehouse District" },
    { time: "3:15 PM",  name: "Lantern Hill Overlook",  neighborhood: "Riverbend" },
    { time: "5:30 PM",  name: "Osteria di Pesca",       neighborhood: "Old Market" },
  ],
};

function RsvpPage() {
  const { tripId } = Route.useParams();
  const { invite: token } = Route.useSearch();
  const [invite, setInvite] = useState<Invite | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    if (!token) { setLoaded(true); return; }
    setInvite(findInviteByToken(tripId, token));
    setLoaded(true);
  }, [tripId, token]);

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

        {/* Trip preview */}
        <section className="mt-8 overflow-hidden rounded-3xl border border-border bg-card shadow-card">
          <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-gradient-to-r from-primary/5 to-coral/5 p-5 sm:p-6">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{TRIP_PREVIEW.date}</p>
              <p className="mt-0.5 font-display text-xl font-semibold">{TRIP_PREVIEW.title}</p>
            </div>
            <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" /> {TRIP_PREVIEW.window}</span>
              <span className="inline-flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /> {TRIP_PREVIEW.city}</span>
            </div>
          </header>
          <ol className="divide-y divide-border">
            {TRIP_PREVIEW.stops.map((s, i) => (
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
