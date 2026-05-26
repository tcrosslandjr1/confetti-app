import { useEffect, useState } from "react";
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
} from "lucide-react";
import {
  formatRelative,
  getActivityForTrip,
  readLog,
  subscribeActivity,
  type ActivityEntry,
  type ActivityKind,
} from "@/lib/activity-log";

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

type Props = {
  /** Limit to a single trip; omit to show portal-wide feed. */
  tripId?: string;
  title?: string;
  emptyHint?: string;
  limit?: number;
  className?: string;
  showTripTitle?: boolean;
};

export function ActivityFeed({
  tripId,
  title = "Group activity",
  emptyHint = "No activity yet — check in or swap a stop to get started.",
  limit = 12,
  className = "",
  showTripTitle,
}: Props) {
  const [entries, setEntries] = useState<ActivityEntry[]>([]);

  useEffect(() => {
    const load = () => {
      const all = tripId ? getActivityForTrip(tripId) : readLog();
      setEntries(all.slice(0, limit));
    };
    load();
    return subscribeActivity(load);
  }, [tripId, limit]);

  const showTitle = showTripTitle ?? !tripId;

  return (
    <section
      className={`rounded-2xl border-2 border-ink bg-card p-4 shadow-brut ${className}`}
      aria-label={title}
    >
      <header className="flex items-center justify-between">
        <h3 className="inline-flex items-center gap-2 font-display text-base font-extrabold tracking-tight">
          <Activity className="h-4 w-4 text-coral" /> {title}
        </h3>
        {entries.length > 0 && (
          <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-cream/60">
            {entries.length}
          </span>
        )}
      </header>

      {entries.length === 0 ? (
        <p className="mt-3 text-xs text-muted-foreground">{emptyHint}</p>
      ) : (
        <ol className="mt-3 space-y-2.5">
          {entries.map((e) => {
            const Icon = ICONS[e.kind] ?? Activity;
            return (
              <li key={e.id} className="flex items-start gap-3">
                <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full border-2 border-ink bg-cream text-cream">
                  <Icon className="h-3.5 w-3.5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm leading-snug">
                    <span className="font-semibold">{e.actor}</span>{" "}
                    <span className="text-cream/80">{e.message}</span>
                  </p>
                  <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[11px] text-muted-foreground">
                    <span>{formatRelative(e.ts)}</span>
                    {showTitle && e.tripTitle && (
                      <>
                        <span aria-hidden>·</span>
                        <span className="font-mono uppercase tracking-wider">{e.tripTitle}</span>
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
      )}
    </section>
  );
}
