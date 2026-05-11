import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Calendar,
  Clock,
  Send,
  Sparkles,
  Timer,
  X,
  AlertOctagon,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import {
  appendNotifications,
  setMinutesLate,
  setRescheduled,
  setCancelled,
  shiftTimeLabel,
} from "@/lib/trip-status";

type Stop = { time: string; name: string; durationMin?: number };

type Props = {
  tripId: string;
  partyName: string;
  groupSize: number;
  stops: Stop[];
};

type Mode = null | "menu" | "late" | "reschedule" | "pickDate" | "cancelConfirm";

const QUICK_LATE = [10, 20, 30, 45, 60];

export function LateRescheduleFab({ tripId, partyName, groupSize, stops }: Props) {
  const [mode, setMode] = useState<Mode>(null);
  const [lateMin, setLateMin] = useState<number>(15);
  const [sending, setSending] = useState(false);
  const [newDate, setNewDate] = useState<string>("");
  const [newTime, setNewTime] = useState<string>("18:00");
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  // Lock scroll while sheet open
  useEffect(() => {
    if (mode && mode !== "menu") {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [mode]);

  // Esc to close
  useEffect(() => {
    if (!mode) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMode(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mode]);

  const firstStop = stops[0];
  const originalTime = firstStop?.time ?? "—";
  const newEta = firstStop ? shiftTimeLabel(firstStop.time, lateMin) : "—";

  function staggerVenueToasts(
    kind: "late" | "reschedule" | "cancel",
    buildMsg: (venue: string) => string,
  ) {
    const venues = stops.map((s) => s.name);
    const sentItems: { kind: "late" | "reschedule" | "cancel"; venue: string; message: string }[] =
      [];
    venues.forEach((v, i) => {
      setTimeout(
        () => {
          toast.success(`Notified ${v} ✓`, {
            icon: <CheckCircle2 className="h-4 w-4 text-emerald-500" />,
          });
          sentItems.push({ kind, venue: v, message: buildMsg(v) });
          if (i === venues.length - 1) {
            // persist all to history once everything has fired
            setTimeout(() => {
              appendNotifications(tripId, sentItems);
              appendNotifications(tripId, [
                {
                  kind,
                  venue: "Guests",
                  message: `${partyName} (${groupSize} ppl): ${buildMsg("everyone")}`,
                },
              ]);
            }, 200);
          }
        },
        600 + i * 1100,
      );
    });
    return venues.length;
  }

  function confirmLate() {
    setSending(true);
    setMinutesLate(tripId, lateMin);
    const count = staggerVenueToasts(
      "late",
      (v) =>
        `Heads up — ${partyName} running ~${lateMin} min late. New ETA at ${v}: ${shiftTimeLabel(firstStop?.time ?? "12:00 PM", lateMin)}.`,
    );
    setTimeout(
      () => {
        setSending(false);
        setMode(null);
        toast(`Sent updates to ${count} venue${count === 1 ? "" : "s"} + guests`, {
          description: `Status badge is live: Running ~${lateMin} min late.`,
        });
      },
      600 + count * 1100 + 300,
    );
  }

  function confirmReschedule() {
    if (!newDate) {
      toast.error("Pick a new date first.");
      return;
    }
    const iso = new Date(`${newDate}T${newTime || "18:00"}`).toISOString();
    setSending(true);
    setRescheduled(tripId, iso);
    const pretty = new Date(iso).toLocaleString([], {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
    const count = staggerVenueToasts(
      "reschedule",
      (v) => `${partyName} rescheduled to ${pretty} at ${v}.`,
    );
    setTimeout(
      () => {
        setSending(false);
        setMode(null);
        toast.success("Rescheduled", { description: `New start: ${pretty}` });
      },
      600 + count * 1100 + 300,
    );
  }

  function confirmCancel() {
    setSending(true);
    setCancelled(tripId);
    const count = staggerVenueToasts(
      "cancel",
      (v) => `${partyName} cancelled their reservation at ${v}. Apologies for the late notice.`,
    );
    setTimeout(
      () => {
        setSending(false);
        setMode(null);
        toast.error("Plan cancelled", { description: "Guests and venues have been notified." });
      },
      600 + count * 1100 + 300,
    );
  }

  return (
    <>
      {/* FAB + fan-out */}
      <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-3 sm:bottom-8 sm:right-8">
        <AnimatePresence>
          {mode === "menu" && (
            <motion.div
              key="fan"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-end gap-3"
            >
              {[
                { key: "late", label: "Running Late", icon: Clock, bg: "bg-amber-300" },
                {
                  key: "reschedule",
                  label: "Reschedule / Cancel",
                  icon: Calendar,
                  bg: "bg-sky-300",
                },
              ].map((opt, i) => (
                <motion.button
                  key={opt.key}
                  initial={{ opacity: 0, y: 16, scale: 0.85 }}
                  animate={{
                    opacity: 1,
                    y: 0,
                    scale: 1,
                    transition: { delay: i * 0.05, type: "spring", stiffness: 360, damping: 22 },
                  }}
                  exit={{ opacity: 0, y: 12, scale: 0.85, transition: { duration: 0.12 } }}
                  whileHover={{ x: -4, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setMode(opt.key === "late" ? "late" : "reschedule")}
                  className={`group inline-flex items-center gap-2.5 rounded-full border-[3px] border-foreground ${opt.bg} px-4 py-2.5 text-sm font-bold text-foreground shadow-[4px_4px_0_0_hsl(var(--foreground))] transition-shadow hover:shadow-[6px_6px_0_0_hsl(var(--foreground))]`}
                >
                  <opt.icon className="h-4 w-4" strokeWidth={2.6} />
                  {opt.label}
                </motion.button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button
          type="button"
          aria-label={mode === "menu" ? "Close quick actions" : "Open quick actions"}
          onClick={() => setMode(mode === "menu" ? null : "menu")}
          animate={{ rotate: mode === "menu" ? 45 : 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.92 }}
          className="grid h-16 w-16 place-items-center rounded-full border-[3px] border-foreground bg-coral text-foreground shadow-[6px_6px_0_0_hsl(var(--foreground))] transition-shadow hover:shadow-[8px_8px_0_0_hsl(var(--foreground))]"
        >
          {mode === "menu" ? (
            <X className="h-7 w-7" strokeWidth={3} />
          ) : (
            <Clock className="h-7 w-7" strokeWidth={2.8} />
          )}
        </motion.button>
      </div>

      {/* Backdrop + bottom sheet */}
      <AnimatePresence>
        {mode && mode !== "menu" && (
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/40 backdrop-blur-sm sm:items-center"
            onClick={() => !sending && setMode(null)}
          >
            <motion.div
              key="sheet"
              role="dialog"
              aria-modal="true"
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              transition={{ type: "spring", stiffness: 320, damping: 32 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-lg overflow-hidden rounded-t-3xl border-[3px] border-foreground bg-card shadow-[8px_8px_0_0_hsl(var(--foreground))] sm:rounded-3xl"
            >
              <div className="absolute right-3 top-3">
                <button
                  ref={closeBtnRef}
                  type="button"
                  onClick={() => !sending && setMode(null)}
                  className="grid h-9 w-9 place-items-center rounded-full border-2 border-foreground bg-card text-foreground transition-colors hover:bg-muted"
                  aria-label="Close"
                >
                  <X className="h-4 w-4" strokeWidth={2.6} />
                </button>
              </div>

              {mode === "late" && (
                <LateSheet
                  partyName={partyName}
                  groupSize={groupSize}
                  originalTime={originalTime}
                  newEta={newEta}
                  lateMin={lateMin}
                  setLateMin={setLateMin}
                  onConfirm={confirmLate}
                  sending={sending}
                  venueCount={stops.length}
                />
              )}

              {mode === "reschedule" && (
                <RescheduleMenu
                  onPickDate={() => setMode("pickDate")}
                  onCancel={() => setMode("cancelConfirm")}
                />
              )}

              {mode === "pickDate" && (
                <PickDateSheet
                  newDate={newDate}
                  setNewDate={setNewDate}
                  newTime={newTime}
                  setNewTime={setNewTime}
                  onBack={() => setMode("reschedule")}
                  onConfirm={confirmReschedule}
                  sending={sending}
                  partyName={partyName}
                  groupSize={groupSize}
                />
              )}

              {mode === "cancelConfirm" && (
                <CancelSheet
                  partyName={partyName}
                  groupSize={groupSize}
                  venueCount={stops.length}
                  onBack={() => setMode("reschedule")}
                  onConfirm={confirmCancel}
                  sending={sending}
                />
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

/* ───────── Sub-components ───────── */

function SheetHeader({
  title,
  subtitle,
  accent,
}: {
  title: string;
  subtitle: string;
  accent: string;
}) {
  return (
    <div className={`border-b-[3px] border-foreground ${accent} px-5 py-4`}>
      <p className="text-[11px] font-bold uppercase tracking-wider text-foreground/70">
        {subtitle}
      </p>
      <h2 className="mt-0.5 font-display text-xl font-bold text-foreground">{title}</h2>
    </div>
  );
}

function PartyPreview({
  partyName,
  groupSize,
  originalTime,
  newEta,
}: {
  partyName: string;
  groupSize: number;
  originalTime: string;
  newEta?: string;
}) {
  return (
    <div className="rounded-2xl border-2 border-foreground bg-muted/40 p-4">
      <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Party</p>
      <p className="mt-0.5 text-base font-bold">{partyName}</p>
      <p className="text-xs text-muted-foreground">
        {groupSize} {groupSize === 1 ? "person" : "people"}
      </p>
      <div className="mt-3 flex items-center gap-3 text-sm">
        <span className="inline-flex items-center gap-1 rounded-md bg-card px-2 py-1 font-mono text-xs line-through opacity-70">
          {originalTime}
        </span>
        {newEta && (
          <>
            <span className="text-muted-foreground">→</span>
            <span className="inline-flex items-center gap-1 rounded-md bg-amber-300 px-2 py-1 font-mono text-xs font-bold text-foreground">
              {newEta}
            </span>
          </>
        )}
      </div>
    </div>
  );
}

function LateSheet({
  partyName,
  groupSize,
  originalTime,
  newEta,
  lateMin,
  setLateMin,
  onConfirm,
  sending,
  venueCount,
}: {
  partyName: string;
  groupSize: number;
  originalTime: string;
  newEta: string;
  lateMin: number;
  setLateMin: (n: number) => void;
  onConfirm: () => void;
  sending: boolean;
  venueCount: number;
}) {
  return (
    <>
      <SheetHeader title="Running Late" subtitle="Day-of update" accent="bg-amber-200" />
      <div className="space-y-4 p-5">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            How late?
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {QUICK_LATE.map((m) => {
              const active = lateMin === m;
              return (
                <button
                  key={m}
                  type="button"
                  onClick={() => setLateMin(m)}
                  className={`rounded-full border-2 border-foreground px-3.5 py-1.5 text-xs font-bold transition-all ${
                    active
                      ? "bg-amber-300 shadow-[3px_3px_0_0_hsl(var(--foreground))]"
                      : "bg-card hover:-translate-y-0.5"
                  }`}
                >
                  +{m === 60 ? "1 hr" : `${m} min`}
                </button>
              );
            })}
          </div>
        </div>

        <PartyPreview
          partyName={partyName}
          groupSize={groupSize}
          originalTime={originalTime}
          newEta={newEta}
        />

        <button
          type="button"
          disabled={sending}
          onClick={onConfirm}
          className="relative inline-flex w-full items-center justify-center gap-2 rounded-2xl border-[3px] border-foreground bg-coral px-4 py-3.5 text-sm font-bold text-foreground shadow-[4px_4px_0_0_hsl(var(--foreground))] transition-all enabled:hover:-translate-y-0.5 enabled:hover:shadow-[6px_6px_0_0_hsl(var(--foreground))] disabled:opacity-80"
        >
          {sending ? (
            <>
              <motion.span
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                className="inline-block h-4 w-4 rounded-full border-2 border-foreground border-t-transparent"
              />
              Notifying {venueCount} venue{venueCount === 1 ? "" : "s"}…
            </>
          ) : (
            <>
              <Send className="h-4 w-4" strokeWidth={2.8} />
              Notify All Venues
            </>
          )}
        </button>
        <p className="text-center text-[11px] text-muted-foreground">
          Sends a heads-up to each venue and updates the live status badge for guests.
        </p>
      </div>
    </>
  );
}

function RescheduleMenu({
  onPickDate,
  onCancel,
}: {
  onPickDate: () => void;
  onCancel: () => void;
}) {
  return (
    <>
      <SheetHeader title="Reschedule or Cancel" subtitle="Big change" accent="bg-sky-200" />
      <div className="space-y-3 p-5">
        <button
          type="button"
          onClick={onPickDate}
          className="group flex w-full items-center gap-4 rounded-2xl border-[3px] border-foreground bg-sky-200 p-4 text-left shadow-[4px_4px_0_0_hsl(var(--foreground))] transition-all hover:-translate-y-0.5 hover:shadow-[6px_6px_0_0_hsl(var(--foreground))]"
        >
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl border-2 border-foreground bg-card">
            <Calendar className="h-5 w-5" strokeWidth={2.6} />
          </span>
          <span className="flex-1">
            <span className="block text-base font-bold">Pick New Date &amp; Time</span>
            <span className="block text-[11px] text-foreground/70">
              Move the whole night to another slot
            </span>
          </span>
        </button>

        <button
          type="button"
          onClick={onCancel}
          className="group flex w-full items-center gap-4 rounded-2xl border-[3px] border-foreground bg-rose-200 p-4 text-left shadow-[4px_4px_0_0_hsl(var(--foreground))] transition-all hover:-translate-y-0.5 hover:shadow-[6px_6px_0_0_hsl(var(--foreground))]"
        >
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl border-2 border-foreground bg-card">
            <AlertOctagon className="h-5 w-5" strokeWidth={2.6} />
          </span>
          <span className="flex-1">
            <span className="block text-base font-bold">Cancel This Plan</span>
            <span className="block text-[11px] text-foreground/70">
              Releases venues and notifies guests
            </span>
          </span>
        </button>
      </div>
    </>
  );
}

function PickDateSheet({
  newDate,
  setNewDate,
  newTime,
  setNewTime,
  onBack,
  onConfirm,
  sending,
  partyName,
  groupSize,
}: {
  newDate: string;
  setNewDate: (s: string) => void;
  newTime: string;
  setNewTime: (s: string) => void;
  onBack: () => void;
  onConfirm: () => void;
  sending: boolean;
  partyName: string;
  groupSize: number;
}) {
  const today = new Date().toISOString().slice(0, 10);
  return (
    <>
      <SheetHeader title="Pick New Date & Time" subtitle="Reschedule" accent="bg-sky-200" />
      <div className="space-y-4 p-5">
        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              New date
            </span>
            <input
              type="date"
              min={today}
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
              className="mt-1 w-full rounded-xl border-2 border-foreground bg-card px-3 py-2.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-coral"
            />
          </label>
          <label className="block">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Start time
            </span>
            <input
              type="time"
              value={newTime}
              onChange={(e) => setNewTime(e.target.value)}
              className="mt-1 w-full rounded-xl border-2 border-foreground bg-card px-3 py-2.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-coral"
            />
          </label>
        </div>

        <div className="rounded-2xl border-2 border-foreground bg-muted/40 p-4">
          <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            Will notify
          </p>
          <p className="mt-1 text-sm font-semibold">
            {partyName} · {groupSize} {groupSize === 1 ? "person" : "people"}
          </p>
          {newDate && (
            <p className="mt-1 text-xs text-muted-foreground">
              New start:{" "}
              <span className="font-bold text-foreground">
                {new Date(`${newDate}T${newTime || "18:00"}`).toLocaleString([], {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </span>
            </p>
          )}
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={onBack}
            disabled={sending}
            className="rounded-2xl border-2 border-foreground bg-card px-4 py-3 text-sm font-bold transition-all hover:-translate-y-0.5"
          >
            Back
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={sending}
            className="relative inline-flex flex-1 items-center justify-center gap-2 rounded-2xl border-[3px] border-foreground bg-sky-300 px-4 py-3 text-sm font-bold text-foreground shadow-[4px_4px_0_0_hsl(var(--foreground))] transition-all enabled:hover:-translate-y-0.5 enabled:hover:shadow-[6px_6px_0_0_hsl(var(--foreground))] disabled:opacity-80"
          >
            {sending ? (
              <>
                <motion.span
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                  className="inline-block h-4 w-4 rounded-full border-2 border-foreground border-t-transparent"
                />
                Sending…
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" strokeWidth={2.8} /> Confirm reschedule
              </>
            )}
          </button>
        </div>
      </div>
    </>
  );
}

function CancelSheet({
  partyName,
  groupSize,
  venueCount,
  onBack,
  onConfirm,
  sending,
}: {
  partyName: string;
  groupSize: number;
  venueCount: number;
  onBack: () => void;
  onConfirm: () => void;
  sending: boolean;
}) {
  return (
    <>
      <SheetHeader title="Cancel This Plan?" subtitle="This can't be undone" accent="bg-rose-200" />
      <div className="space-y-4 p-5">
        <div className="rounded-2xl border-2 border-foreground bg-rose-50 p-4">
          <div className="flex items-start gap-3">
            <AlertOctagon className="mt-0.5 h-5 w-5 shrink-0 text-rose-600" strokeWidth={2.6} />
            <div className="text-sm">
              <p className="font-bold">
                {partyName} · {groupSize} {groupSize === 1 ? "person" : "people"}
              </p>
              <p className="mt-1 text-foreground/70">
                Cancellation emails go to all <strong>{venueCount}</strong> venue
                {venueCount === 1 ? "" : "s"} and your guests. The plan will show a "Cancelled"
                overlay.
              </p>
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={onBack}
            disabled={sending}
            className="flex-1 rounded-2xl border-2 border-foreground bg-card px-4 py-3 text-sm font-bold transition-all hover:-translate-y-0.5"
          >
            Keep plan
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={sending}
            className="relative inline-flex flex-1 items-center justify-center gap-2 rounded-2xl border-[3px] border-foreground bg-rose-400 px-4 py-3 text-sm font-bold text-foreground shadow-[4px_4px_0_0_hsl(var(--foreground))] transition-all enabled:hover:-translate-y-0.5 enabled:hover:shadow-[6px_6px_0_0_hsl(var(--foreground))] disabled:opacity-80"
          >
            {sending ? (
              <>
                <motion.span
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                  className="inline-block h-4 w-4 rounded-full border-2 border-foreground border-t-transparent"
                />
                Cancelling…
              </>
            ) : (
              <>
                <Timer className="h-4 w-4" strokeWidth={2.8} /> Yes, cancel
              </>
            )}
          </button>
        </div>
      </div>
    </>
  );
}
