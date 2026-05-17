import { useEffect, useMemo, useState } from "react";
import { ArrowUpRight, Check, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { useHistoryDismiss } from "@/hooks/use-history-dismiss";

export type TapToGoStop = {
  id: string;
  time: string;
  title: string;
  type: string;
  source: "RESY" | "OPENTABLE" | "EVENTBRITE" | "WALK-IN" | "LYFT";
  cost: string;
  emoji?: string;
};

export type TapToGoSummary = {
  stops: string;
  totalTime: string;
  walking: string;
  lyft: string;
  estTotal: string;
  reward: string;
};

type Props = {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle: string;
  date: string;
  guests: number;
  stops: TapToGoStop[];
  summary: TapToGoSummary;
  onConfirm?: () => void;
};

type Status = "idle" | "booking" | "booked";

const SOURCE_STYLES: Record<TapToGoStop["source"], string> = {
  RESY: "bg-coral",
  OPENTABLE: "bg-gold",
  EVENTBRITE: "bg-purple text-cream",
  "WALK-IN": "bg-background",
  LYFT: "bg-purple text-cream",
};

function makeRef(id: string) {
  const tail =
    id
      .replace(/[^a-zA-Z0-9]/g, "")
      .slice(-3)
      .toUpperCase() || "STP";
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `CF-${tail}-${rand}`;
}

export function TapToGoBookingModal({
  open,
  onClose,
  title,
  subtitle,
  date,
  guests,
  stops,
  summary,
  onConfirm,
}: Props) {
  const bookable = useMemo(() => stops.filter((s) => s.source !== "WALK-IN"), [stops]);
  const [status, setStatus] = useState<Record<string, Status>>({});
  const [refs, setRefs] = useState<Record<string, string>>({});
  const [planRef, setPlanRef] = useState<string | null>(null);

  // Reset whenever modal opens
  useEffect(() => {
    if (!open) return;
    setStatus({});
    setRefs({});
    setPlanRef(null);
  }, [open]);

  const allBooked = bookable.length > 0 && bookable.every((s) => status[s.id] === "booked");

  // Lock body scroll while open
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // Browser/system Back closes the modal
  useHistoryDismiss(open, onClose);

  // Finalize once all stops booked
  useEffect(() => {
    if (!allBooked || planRef) return;
    const ref = `CF-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
    setPlanRef(ref);
    toast.success("Plan booked!", { description: ref });
    onConfirm?.();
  }, [allBooked, planRef, onConfirm]);

  function bookOne(id: string) {
    if (status[id] === "booked" || status[id] === "booking") return;
    setStatus((p) => ({ ...p, [id]: "booking" }));
    window.setTimeout(() => {
      setRefs((p) => ({ ...p, [id]: makeRef(id) }));
      setStatus((p) => ({ ...p, [id]: "booked" }));
    }, 900);
  }

  function bookAll() {
    bookable.forEach((s, i) => {
      window.setTimeout(() => bookOne(s.id), i * 350);
    });
  }

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Tap to go — book this plan"
      className="fixed inset-0 z-[100] grid place-items-end sm:place-items-center bg-ink/60 p-0 sm:p-4 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-3xl border-2 border-ink bg-cream shadow-brut-lg animate-scale-in sm:max-w-lg sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="shrink-0 bg-ink px-5 py-4 text-cream">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="font-mono text-[10px] uppercase tracking-[0.25em] opacity-60">
                Tap to go · book this plan
              </div>
              <div className="mt-1 truncate font-display text-lg font-extrabold leading-tight">
                {title}
              </div>
              <div className="mt-0.5 truncate text-[11px] opacity-75">{subtitle}</div>
            </div>
            <button
              onClick={onClose}
              aria-label="Close"
              className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-cream/30 transition hover:bg-cream/10"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2">
            {[
              { label: "Date", value: date },
              { label: "Guests", value: String(guests) },
              { label: "Stops", value: String(stops.length) },
            ].map((m) => (
              <div key={m.label}>
                <div className="font-mono text-[9px] uppercase tracking-widest opacity-60">
                  {m.label}
                </div>
                <div className="font-display text-[12px] font-extrabold truncate">{m.value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Body */}
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          <ul className="space-y-2.5">
            {stops.map((s) => {
              const st = status[s.id] ?? "idle";
              const ref = refs[s.id];
              const isWalkin = s.source === "WALK-IN";
              return (
                <li
                  key={s.id}
                  className="rounded-2xl border-2 border-ink bg-background p-3 shadow-brut"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`grid h-12 w-12 shrink-0 place-items-center rounded-lg border-2 border-ink ${SOURCE_STYLES[s.source]} font-mono text-[11px] font-extrabold`}
                    >
                      {s.time}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        {s.emoji && (
                          <span aria-hidden className="text-base">
                            {s.emoji}
                          </span>
                        )}
                        <div className="truncate font-display text-sm font-extrabold">
                          {s.title}
                        </div>
                      </div>
                      <div className="truncate text-[11px] text-ink/60">
                        {s.type} · {s.cost}
                      </div>
                    </div>
                    {isWalkin ? (
                      <span className="shrink-0 rounded-full border-2 border-ink bg-background px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-widest">
                        Walk-in
                      </span>
                    ) : (
                      <button
                        onClick={() => bookOne(s.id)}
                        disabled={st !== "idle"}
                        className={`shrink-0 inline-flex h-9 min-w-[88px] items-center justify-center gap-1 rounded-full border-2 border-ink px-3 font-mono text-[10px] font-bold uppercase tracking-widest shadow-brut transition-pop disabled:translate-x-0 disabled:translate-y-0 ${
                          st === "booked"
                            ? "bg-ink text-cream"
                            : st === "booking"
                              ? "bg-gold/60"
                              : `${SOURCE_STYLES[s.source]} hover:-translate-y-0.5`
                        }`}
                      >
                        {st === "booking" ? (
                          <>
                            <Loader2 className="h-3 w-3 animate-spin" /> Booking
                          </>
                        ) : st === "booked" ? (
                          <>
                            <Check className="h-3 w-3" /> {ref?.slice(-4) ?? "Done"}
                          </>
                        ) : (
                          <>{s.source}</>
                        )}
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>

          {/* Summary */}
          <div className="mt-5 rounded-2xl border-2 border-ink bg-background p-4">
            <div className="border-b-2 border-dashed border-ink pb-2 font-mono text-[10px] uppercase tracking-widest">
              Reservation summary
            </div>
            <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              {[
                ["Stops", summary.stops],
                ["Total time", summary.totalTime],
                ["Walking", summary.walking],
                ["Lyft", summary.lyft],
                ["Est. total", summary.estTotal],
                ["Reward", summary.reward],
              ].map(([k, v]) => (
                <div
                  key={k}
                  className="flex items-baseline justify-between gap-2 border-b border-dashed border-ink/30 pb-1.5"
                >
                  <dt className="font-mono text-[10px] uppercase tracking-widest text-ink/60">
                    {k}
                  </dt>
                  <dd className="font-display text-[13px] font-extrabold">{v}</dd>
                </div>
              ))}
            </dl>
          </div>

          {planRef && (
            <div className="mt-4 rounded-2xl border-2 border-ink bg-gold/40 p-4 text-center animate-fade-in">
              <div className="font-mono text-[10px] uppercase tracking-widest text-ink/70">
                Confirmation
              </div>
              <div className="mt-1 font-display text-xl font-extrabold">{planRef}</div>
              <div className="mt-1 text-xs text-ink/70">
                Itinerary, route, and tickets sent to your wallet.
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className="shrink-0 border-t-2 border-ink bg-cream px-5 py-4"
          style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 1rem)" }}
        >
          {!allBooked ? (
            <>
              <button
                onClick={bookAll}
                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full border-2 border-ink bg-coral px-5 font-display text-sm font-bold text-cream shadow-brut transition-pop hover:-translate-y-0.5"
              >
                Confirm itinerary — tap to book all <ArrowUpRight className="h-4 w-4" />
              </button>
              <p className="mt-2 text-center font-mono text-[10px] uppercase tracking-widest text-ink/50">
                {bookable.length} reservations · no charge until you arrive
              </p>
            </>
          ) : (
            <button
              onClick={onClose}
              className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full border-2 border-ink bg-ink px-5 font-display text-sm font-bold text-cream shadow-brut transition-pop hover:-translate-y-0.5"
            >
              Done <Check className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
