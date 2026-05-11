import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Check,
  Clock,
  MapPin,
  Sparkles,
  ThumbsDown,
  ThumbsUp,
  Users,
  HelpCircle,
} from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import {
  castVote,
  getVoterName,
  loadVotes,
  setVoterName,
  subscribeVotes,
  tallyStop,
  getVoterId,
  type VoteValue,
} from "@/lib/votes";
import { checkStopFits } from "@/lib/hours";
import { formatUpdatedAt, loadStatus, subscribeStatus, type TripStatus } from "@/lib/trip-status";
import { LiveElapsed } from "@/components/LiveElapsed";

export const Route = createFileRoute("/collab/$tripId")({
  head: () => ({
    meta: [
      { title: "Build the night together — Loop" },
      {
        name: "description",
        content: "Vote on each stop with your crew. Live tallies, no account needed.",
      },
    ],
  }),
  component: CollabPage,
});

const TRIP_PREVIEW = {
  title: "Loop — Date Night Day",
  date: "This Saturday",
  window: "11:30 AM – 7:30 PM",
  city: "Old Market & East Side",
  // Saturday demo trip — `day` keyed off the saved plan's start date.
  day: "sat" as const,
  stops: [
    {
      time: "11:30 AM",
      durationMin: 75,
      name: "Bluebird Coffee Social",
      neighborhood: "East Side",
      note: "Slow brews, sunlit corner table.",
    },
    {
      time: "1:15 PM",
      durationMin: 90,
      name: "The Marigold Rooftop",
      neighborhood: "Warehouse District",
      note: "Aperitivo with skyline views.",
    },
    {
      time: "3:15 PM",
      durationMin: 90,
      name: "Lantern Hill Overlook",
      neighborhood: "Riverbend",
      note: "Golden-hour walk + photos.",
    },
    {
      time: "5:30 PM",
      durationMin: 120,
      name: "Osteria di Pesca",
      neighborhood: "Old Market",
      note: "Hand-rolled pasta, cozy booth.",
    },
  ],
};

const VOTE_OPTIONS: { value: VoteValue; label: string; icon: typeof ThumbsUp; tone: string }[] = [
  { value: "in", label: "I'm in", icon: ThumbsUp, tone: "from-emerald-500 to-primary" },
  { value: "maybe", label: "Maybe", icon: HelpCircle, tone: "from-amber-400 to-coral" },
  { value: "out", label: "Pass", icon: ThumbsDown, tone: "from-muted-foreground to-foreground" },
];

function CollabPage() {
  const { tripId } = Route.useParams();
  const [name, setName] = useState("");
  const [votes, setVotes] = useState<ReturnType<typeof loadVotes>>({});
  const voterId = useMemo(() => (typeof window === "undefined" ? "" : getVoterId()), []);
  const [tripStatus, setTripStatus] = useState<TripStatus | null>(null);

  useEffect(() => {
    setName(getVoterName());
    setVotes(loadVotes(tripId));
    setTripStatus(loadStatus(tripId));
    const unsubV = subscribeVotes(tripId, () => setVotes(loadVotes(tripId)));
    const unsubS = subscribeStatus(tripId, () => setTripStatus(loadStatus(tripId)));
    return () => {
      unsubV();
      unsubS();
    };
  }, [tripId]);

  function commitName(v: string) {
    setName(v);
    setVoterName(v);
  }

  function vote(stopIndex: number, value: VoteValue) {
    castVote(tripId, stopIndex, value);
  }

  const totalVoters = useMemo(() => {
    const ids = new Set<string>();
    Object.values(votes).forEach((stop) => Object.keys(stop).forEach((id) => ids.add(id)));
    return ids.size;
  }, [votes]);

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <SiteHeader />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-0 h-[420px] bg-gradient-to-b from-primary/15 via-coral/10 to-transparent blur-2xl"
      />

      <div className="relative z-10 mx-auto max-w-2xl px-4 py-12 sm:px-6">
        <div className="text-center">
          <div className="mx-auto mb-5 inline-flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-primary to-coral text-primary-foreground shadow-pop">
            <Users className="h-8 w-8" strokeWidth={2.5} />
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            <Sparkles className="h-3 w-3 text-primary" /> Build together · {tripId}
          </span>
          <h1 className="mt-4 font-display text-4xl font-bold tracking-tight sm:text-5xl">
            Shape the <span className="text-gradient">night together.</span>
          </h1>
          <p className="mx-auto mt-3 max-w-md text-muted-foreground">
            Vote on each stop. Tallies update live for everyone with the link — no account needed.
          </p>
        </div>

        {/* Name field */}
        <section className="mt-8 rounded-3xl border border-border bg-card p-4 shadow-card sm:p-5">
          <label className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            <Users className="h-3.5 w-3.5 text-primary" /> Your name (optional)
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => commitName(e.target.value)}
            placeholder="So your friends know who voted"
            maxLength={40}
            className="mt-2 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none transition-colors focus:border-primary"
          />
          <p className="mt-2 text-[11px] text-muted-foreground">
            {totalVoters > 0
              ? `${totalVoters} ${totalVoters === 1 ? "person has" : "people have"} weighed in so far.`
              : "Be the first to vote."}
          </p>
        </section>

        {/* Trip header */}
        <section className="mt-6 overflow-hidden rounded-3xl border border-border bg-card shadow-card">
          <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-gradient-to-r from-primary/5 to-coral/5 p-5 sm:p-6">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                {TRIP_PREVIEW.date}
              </p>
              <p className="mt-0.5 font-display text-xl font-semibold">{TRIP_PREVIEW.title}</p>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              {tripStatus && tripStatus.minutesLate > 0 && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 px-2.5 py-1 font-semibold text-amber-700">
                  <span className="relative inline-flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-500 opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-500" />
                  </span>
                  Running ~{tripStatus.minutesLate} min late ·{" "}
                  {formatUpdatedAt(tripStatus.updatedAt)} ·{" "}
                  <LiveElapsed since={tripStatus.updatedAt} />
                </span>
              )}
              <span className="inline-flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" /> {TRIP_PREVIEW.window}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5" /> {TRIP_PREVIEW.city}
              </span>
            </div>
          </header>

          <ul className="divide-y divide-border">
            {TRIP_PREVIEW.stops.map((s, i) => {
              const tally = tallyStop(votes, i);
              const myVote = votes[String(i)]?.[voterId]?.value;
              const total = tally.in + tally.maybe + tally.out;
              const inPct = total ? (tally.in / total) * 100 : 0;
              const maybePct = total ? (tally.maybe / total) * 100 : 0;
              const outPct = total ? (tally.out / total) * 100 : 0;
              const fit = checkStopFits(s.name, s.time, s.durationMin, TRIP_PREVIEW.day);
              return (
                <li key={i} className="space-y-3 p-4 sm:p-5">
                  <div className="flex items-start gap-3">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-primary to-coral text-xs font-bold text-primary-foreground shadow-pop">
                      {i + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{s.name}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {s.neighborhood} · {s.note}
                        {fit.state !== "unknown" && (
                          <>
                            {" "}
                            · <span className="font-medium">{fit.hoursLabel}</span>
                          </>
                        )}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <span className="text-sm font-semibold text-muted-foreground">{s.time}</span>
                      {fit.state === "open" && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-700">
                          <Check className="h-3 w-3" /> Open
                        </span>
                      )}
                      {fit.state === "tight" && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-700">
                          <AlertTriangle className="h-3 w-3" /> Tight
                        </span>
                      )}
                      {fit.state === "closed" && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-destructive/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-destructive">
                          <AlertTriangle className="h-3 w-3" /> {fit.reason}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Vote buttons */}
                  <div className="grid grid-cols-3 gap-2">
                    {VOTE_OPTIONS.map((opt) => {
                      const Icon = opt.icon;
                      const active = myVote === opt.value;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => vote(i, opt.value)}
                          className={`group inline-flex items-center justify-center gap-1.5 rounded-xl border px-2 py-2 text-xs font-semibold transition-all hover:-translate-y-0.5 ${
                            active
                              ? `border-transparent bg-gradient-to-br ${opt.tone} text-primary-foreground shadow-pop`
                              : "border-border bg-card text-foreground hover:border-primary"
                          }`}
                        >
                          <Icon className="h-3.5 w-3.5" />
                          {opt.label}
                          {active && <Check className="h-3 w-3" />}
                        </button>
                      );
                    })}
                  </div>

                  {/* Tally bar */}
                  {total > 0 ? (
                    <div className="space-y-1.5">
                      <div className="flex h-2 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full bg-emerald-500 transition-all duration-300"
                          style={{ width: `${inPct}%` }}
                        />
                        <div
                          className="h-full bg-amber-400 transition-all duration-300"
                          style={{ width: `${maybePct}%` }}
                        />
                        <div
                          className="h-full bg-muted-foreground transition-all duration-300"
                          style={{ width: `${outPct}%` }}
                        />
                      </div>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          <span className="h-2 w-2 rounded-full bg-emerald-500" /> {tally.in} in
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <span className="h-2 w-2 rounded-full bg-amber-400" /> {tally.maybe} maybe
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <span className="h-2 w-2 rounded-full bg-muted-foreground" /> {tally.out}{" "}
                          out
                        </span>
                      </div>
                      {tally.voters.some((v) => v.voterName) && (
                        <p className="text-[11px] text-muted-foreground">
                          {tally.voters
                            .filter((v) => v.voterName)
                            .map((v) => `${v.voterName} (${v.value})`)
                            .join(" · ")}
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-[11px] text-muted-foreground">No votes yet — kick it off.</p>
                  )}
                </li>
              );
            })}
          </ul>
        </section>

        <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Link
            to="/"
            className="inline-flex items-center justify-center gap-2 rounded-full border border-border bg-card px-6 py-3 text-sm font-semibold text-foreground transition-colors hover:border-primary hover:text-primary"
          >
            Build your own day
          </Link>
        </div>
      </div>
    </div>
  );
}
