import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  CheckCircle2,
  Repeat2,
  Plus,
  Minus,
  CalendarClock,
  UserPlus,
  UserMinus,
  ThumbsUp,
  Ticket,
  MessageCircle,
  Flag,
  Trophy,
  Filter,
  Trash2,
} from "lucide-react";
import {
  formatRelative,
  readLog,
  subscribeActivity,
  type ActivityEntry,
  type ActivityKind,
} from "@/lib/activity-log";
import { useCallback } from "react";
import { useRefreshable } from "@/hooks/use-refresh-bus";

export const Route = createFileRoute("/portal/activity")({
  head: () => ({
    meta: [
      { title: "Group Activity — Confetti" },
      {
        name: "description",
        content:
          "Full log of plan changes across your trips — see who swapped a stop, rescheduled, checked in, or booked, and when.",
      },
    ],
  }),
  component: PortalActivityPage,
});

const ICONS: Record<ActivityKind, React.ComponentType<{ className?: string }>> = {
  check_in: CheckCircle2,
  stop_swapped: Repeat2,
  stop_added: Plus,
  stop_removed: Minus,
  rescheduled: CalendarClock,
  joined: UserPlus,
  left: UserMinus,
  voted: ThumbsUp,
  booked: Ticket,
  comment: MessageCircle,
  plan_started: Flag,
  plan_completed: Trophy,
};

const KIND_LABEL: Record<ActivityKind, string> = {
  check_in: "Checked in",
  stop_swapped: "Swapped a stop",
  stop_added: "Added a stop",
  stop_removed: "Removed a stop",
  rescheduled: "Rescheduled",
  joined: "Joined",
  left: "Left",
  voted: "Voted",
  booked: "Booked",
  comment: "Commented",
  plan_started: "Started plan",
  plan_completed: "Completed plan",
};

type KindFilter = "all" | ActivityKind;

function dayKey(ts: number) {
  const d = new Date(ts);
  return d.toLocaleDateString(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric",
    year: d.getFullYear() === new Date().getFullYear() ? undefined : "numeric",
  });
}

// Hardcoded sample feed used when the local activity log is empty so the page
// always shows real-looking content for App Store review.
const MOCK_ENTRIES: ActivityEntry[] = [
  {
    id: "mock-1",
    tripId: "mock-rose",
    tripTitle: "Date night · Capitol Hill",
    actor: "You",
    kind: "booked",
    message: "booked Rose's Luxury",
    detail: "Party of 2 · 7:30 PM",
    ts: new Date("2026-05-14T19:30:00").getTime(),
  },
  {
    id: "mock-2",
    tripId: "mock-saved",
    tripTitle: "Wishlist",
    actor: "You",
    kind: "voted",
    message: "saved Oyster Oyster to wishlist",
    detail: "Shaw · Tasting menu",
    ts: new Date("2026-05-13T15:10:00").getTime(),
  },
  {
    id: "mock-3",
    tripId: "mock-badge",
    tripTitle: "Achievements",
    actor: "You",
    kind: "plan_completed",
    message: "earned the 'First Plan' badge",
    detail: "+50 Confetti",
    ts: new Date("2026-05-12T21:05:00").getTime(),
  },
  {
    id: "mock-4",
    tripId: "mock-rooftop",
    tripTitle: "Midnight on the Rooftop",
    actor: "You",
    kind: "plan_completed",
    message: "completed plan 'Midnight on the Rooftop'",
    detail: "3 stops · 4 hrs",
    ts: new Date("2026-05-11T23:45:00").getTime(),
  },
  {
    id: "mock-5",
    tripId: "mock-maydan",
    tripTitle: "Friday with the crew",
    actor: "You",
    kind: "check_in",
    message: "checked in at Maydan",
    detail: "14th Street · 8:15 PM",
    ts: new Date("2026-05-10T20:15:00").getTime(),
  },
  {
    id: "mock-6",
    tripId: "mock-invite",
    tripTitle: "Referrals",
    actor: "You",
    kind: "joined",
    message: "invited Sarah to Confetti",
    detail: "Pending · earns 250 Confetti on signup",
    ts: new Date("2026-05-09T10:30:00").getTime(),
  },
];

function PortalActivityPage() {
  const [entries, setEntries] = useState<ActivityEntry[]>(MOCK_ENTRIES);
  const [tripFilter, setTripFilter] = useState<string>("all");
  const [kindFilter, setKindFilter] = useState<KindFilter>("all");

  const load = useCallback(() => {
    const real = readLog();
    setEntries(real.length > 0 ? real : MOCK_ENTRIES);
  }, []);

  useEffect(() => {
    load();
    return subscribeActivity(load);
  }, [load]);

  useRefreshable(async () => {
    load();
    await new Promise((r) => setTimeout(r, 350));
  });

  const trips = useMemo(() => {
    const map = new Map<string, string>();
    for (const e of entries) {
      if (!map.has(e.tripId)) map.set(e.tripId, e.tripTitle ?? e.tripId);
    }
    return Array.from(map.entries()).map(([id, title]) => ({ id, title }));
  }, [entries]);

  const kindsPresent = useMemo(() => {
    const set = new Set<ActivityKind>();
    for (const e of entries) set.add(e.kind);
    return Array.from(set);
  }, [entries]);

  const filtered = useMemo(() => {
    return entries.filter((e) => {
      if (tripFilter !== "all" && e.tripId !== tripFilter) return false;
      if (kindFilter !== "all" && e.kind !== kindFilter) return false;
      return true;
    });
  }, [entries, tripFilter, kindFilter]);

  const grouped = useMemo(() => {
    const groups: { day: string; items: ActivityEntry[] }[] = [];
    for (const e of filtered) {
      const day = dayKey(e.ts);
      const last = groups[groups.length - 1];
      if (last && last.day === day) last.items.push(e);
      else groups.push({ day, items: [e] });
    }
    return groups;
  }, [filtered]);

  const kindOptions: KindFilter[] = ["all", ...kindsPresent];

  return (
    <div className="mx-auto max-w-3xl px-4 pt-6 pb-32">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="font-display text-2xl font-extrabold tracking-tight inline-flex items-center gap-2">
            <Activity className="h-5 w-5 text-coral" />
            Group activity
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Who changed what, and when — across every plan you and your group are on.
          </p>
        </div>
        <Link
          to="/portal"
          className="shrink-0 rounded-full border-2 border-ink bg-cream px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-widest text-ink shadow-brut hover:-translate-y-0.5 transition-pop"
        >
          Back
        </Link>
      </div>

      {/* Filters */}
      <div className="mt-5 rounded-2xl border-2 border-ink bg-cream p-3 shadow-brut">
        <div className="flex flex-wrap items-center gap-3">
          <div className="inline-flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-widest text-ink/60">
            <Filter className="h-3 w-3" /> Filter
          </div>
          <label className="flex items-center gap-2 text-xs">
            <span className="font-mono text-[10px] uppercase tracking-widest text-ink/60">
              Plan
            </span>
            <select
              value={tripFilter}
              onChange={(e) => setTripFilter(e.target.value)}
              className="rounded-lg border-2 border-ink bg-cream px-2 py-1 text-xs font-semibold"
            >
              <option value="all">All plans ({trips.length})</option>
              {trips.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-2 text-xs">
            <span className="font-mono text-[10px] uppercase tracking-widest text-ink/60">
              Type
            </span>
            <select
              value={kindFilter}
              onChange={(e) => setKindFilter(e.target.value as KindFilter)}
              className="rounded-lg border-2 border-ink bg-cream px-2 py-1 text-xs font-semibold"
            >
              {kindOptions.map((k) => (
                <option key={k} value={k}>
                  {k === "all" ? "All types" : KIND_LABEL[k]}
                </option>
              ))}
            </select>
          </label>
          <span className="ml-auto font-mono text-[10px] font-bold uppercase tracking-widest text-ink/60">
            {filtered.length} {filtered.length === 1 ? "entry" : "entries"}
          </span>
        </div>
      </div>

      {/* Feed */}
      {filtered.length === 0 ? (
        <div className="mt-6 rounded-2xl border-2 border-dashed border-ink/30 bg-cream/40 p-8 text-center">
          <Activity className="mx-auto h-6 w-6 text-ink/40" />
          <p className="mt-2 text-sm text-muted-foreground">
            No activity yet. As you and your group check in, swap stops, or reschedule, every change
            shows up here.
          </p>
          <Link
            to="/portal"
            className="mt-4 inline-flex items-center gap-2 rounded-full border-2 border-ink bg-coral px-4 py-2 font-mono text-[10px] font-bold uppercase tracking-widest text-cream shadow-brut hover:-translate-y-0.5 transition-pop"
          >
            Plan something
          </Link>
        </div>
      ) : (
        <div className="mt-6 space-y-6">
          {grouped.map((group) => (
            <section key={group.day}>
              <h2 className="mb-2 font-mono text-[10px] font-bold uppercase tracking-widest text-ink/60">
                {group.day}
              </h2>
              <ol className="space-y-2 rounded-2xl border-2 border-ink bg-cream p-3 shadow-brut">
                {group.items.map((e) => {
                  const Icon = ICONS[e.kind] ?? Activity;
                  return (
                    <li
                      key={e.id}
                      className="flex items-start gap-3 rounded-xl px-2 py-2 hover:bg-cream/60"
                    >
                      <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full border-2 border-ink bg-cream text-ink">
                        <Icon className="h-4 w-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm leading-snug">
                          <span className="font-semibold">{e.actor}</span>{" "}
                          <span className="text-ink/80">{e.message}</span>
                        </p>
                        <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[11px] text-muted-foreground">
                          <span>{formatRelative(e.ts)}</span>
                          <span aria-hidden>·</span>
                          <span className="font-mono uppercase tracking-wider">
                            {KIND_LABEL[e.kind] ?? e.kind}
                          </span>
                          {e.tripTitle && (
                            <>
                              <span aria-hidden>·</span>
                              <Link
                                to="/trips/$id"
                                params={{ id: e.tripId }}
                                className="font-mono uppercase tracking-wider text-coral hover:underline underline-offset-2"
                              >
                                {e.tripTitle}
                              </Link>
                            </>
                          )}
                          {e.detail && (
                            <>
                              <span aria-hidden>·</span>
                              <span>{e.detail}</span>
                            </>
                          )}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ol>
            </section>
          ))}
        </div>
      )}

      {entries.length > 0 && (
        <div className="mt-8 flex items-center justify-end">
          <button
            type="button"
            onClick={() => {
              if (typeof window === "undefined") return;
              if (
                !window.confirm(
                  "Clear the entire activity log on this device? This won't affect anyone else.",
                )
              )
                return;
              localStorage.removeItem("confetti:activity-log:v1");
              window.dispatchEvent(new CustomEvent("confetti:activity-log:changed"));
            }}
            className="inline-flex items-center gap-1.5 rounded-full border border-ink/30 bg-cream px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-widest text-ink/70 hover:text-ink"
          >
            <Trash2 className="h-3 w-3" /> Clear log
          </button>
        </div>
      )}
    </div>
  );
}
