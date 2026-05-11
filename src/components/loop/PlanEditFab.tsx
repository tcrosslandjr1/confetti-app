import { useState } from "react";
import { Pencil, Repeat2, CalendarClock, X, Bell } from "lucide-react";
import { toast } from "sonner";
import { setActiveLoop, type ActiveLoop, type LoopStop } from "@/lib/loop-store";
import { logActivity } from "@/lib/activity-log";

type Props = {
  loop: ActiveLoop;
  /** Display name to attribute changes to in the activity log. */
  actor?: string;
  className?: string;
};

/**
 * Floating "Quick edit" toolbar with two actions:
 *   - Swap stop (replace name/type/area/time of any stop)
 *   - Reschedule (shift boarding time / date for the whole plan)
 * Each action persists to the active-loop store, logs an activity entry,
 * and fires a toast "notification" to the rest of the group.
 */
export function PlanEditFab({ loop, actor = "You", className = "" }: Props) {
  const [open, setOpen] = useState<null | "swap" | "reschedule">(null);

  return (
    <>
      <div
        className={`inline-flex items-center gap-1 rounded-full border-2 border-ink bg-cream p-0.5 shadow-brut ${className}`}
        role="group"
        aria-label="Quick plan edits"
      >
        <button
          type="button"
          onClick={() => setOpen("swap")}
          className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-widest text-ink hover:bg-ink/5"
        >
          <Repeat2 className="h-3 w-3" /> Swap
        </button>
        <button
          type="button"
          onClick={() => setOpen("reschedule")}
          className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-widest text-ink hover:bg-ink/5"
        >
          <CalendarClock className="h-3 w-3" /> Reschedule
        </button>
      </div>

      {open === "swap" && (
        <SwapStopDialog loop={loop} actor={actor} onClose={() => setOpen(null)} />
      )}
      {open === "reschedule" && (
        <RescheduleDialog loop={loop} actor={actor} onClose={() => setOpen(null)} />
      )}
    </>
  );
}

function Backdrop({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-ink/40 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="w-full max-w-md rounded-3xl border-2 border-ink bg-cream p-5 shadow-brut"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

function notifyGroup(message: string) {
  toast.message("Group notified", {
    description: message,
    icon: <Bell className="h-3.5 w-3.5" />,
  });
}

function SwapStopDialog({
  loop,
  actor,
  onClose,
}: {
  loop: ActiveLoop;
  actor: string;
  onClose: () => void;
}) {
  const [stopId, setStopId] = useState<string>(loop.stops[0]?.id ?? "");
  const stop = loop.stops.find((s) => s.id === stopId);
  const [name, setName] = useState(stop?.name ?? "");
  const [type, setType] = useState(stop?.type ?? "");
  const [area, setArea] = useState(stop?.area ?? "");
  const [time, setTime] = useState(stop?.time ?? "");

  function selectStop(id: string) {
    setStopId(id);
    const s = loop.stops.find((x) => x.id === id);
    setName(s?.name ?? "");
    setType(s?.type ?? "");
    setArea(s?.area ?? "");
    setTime(s?.time ?? "");
  }

  function save() {
    if (!stop) return;
    const next: ActiveLoop = {
      ...loop,
      stops: loop.stops.map((s) =>
        s.id === stopId
          ? {
              ...s,
              name: name.trim() || s.name,
              type: type.trim() || s.type,
              area: area.trim() || s.area,
              time: time.trim() || s.time,
              // Coordinates no longer match — clear so the geocoder re-resolves.
              lat: undefined,
              lng: undefined,
            }
          : s
      ),
    };
    setActiveLoop(next);
    const swappedFrom = stop.name;
    const swappedTo = name.trim() || stop.name;
    logActivity({
      tripId: loop.id,
      tripTitle: `${loop.from} → ${loop.to}`,
      actor,
      kind: "stop_swapped",
      message: `swapped ${swappedFrom} → ${swappedTo}`,
      detail: [area, time].filter(Boolean).join(" · "),
    });
    notifyGroup(`${actor} swapped a stop: ${swappedFrom} → ${swappedTo}`);
    onClose();
  }

  return (
    <Backdrop onClose={onClose}>
      <Header title="Swap a stop" onClose={onClose} />
      <p className="mt-1 text-xs text-muted-foreground">
        Replace the venue, vibe, time or neighborhood for any stop. The group will be notified.
      </p>

      <label className="mt-4 block font-mono text-[10px] font-bold uppercase tracking-widest text-ink/70">
        Stop
      </label>
      <select
        value={stopId}
        onChange={(e) => selectStop(e.target.value)}
        className="mt-1 w-full rounded-xl border-2 border-ink bg-card px-3 py-2 text-sm"
      >
        {loop.stops.map((s, i) => (
          <option key={s.id} value={s.id}>
            #{i + 1} · {s.name}
          </option>
        ))}
      </select>

      <Field label="Name" value={name} onChange={setName} />
      <Field label="Vibe / type" value={type} onChange={setType} />
      <div className="grid grid-cols-2 gap-3">
        <Field label="Neighborhood" value={area} onChange={setArea} />
        <Field label="Time" value={time} onChange={setTime} placeholder="7:30 PM" />
      </div>

      <Actions onSave={save} onClose={onClose} saveLabel={<><Repeat2 className="h-3.5 w-3.5" /> Swap & notify</>} />
    </Backdrop>
  );
}

function RescheduleDialog({
  loop,
  actor,
  onClose,
}: {
  loop: ActiveLoop;
  actor: string;
  onClose: () => void;
}) {
  const [date, setDate] = useState(loop.date);
  const [boardingTime, setBoardingTime] = useState(loop.boardingTime);
  const [shiftMin, setShiftMin] = useState(0);

  function save() {
    let nextStops: LoopStop[] = loop.stops;
    if (shiftMin) {
      nextStops = loop.stops.map((s) => ({ ...s, time: shiftTime(s.time, shiftMin) }));
    }
    const next: ActiveLoop = {
      ...loop,
      date: date.trim() || loop.date,
      boardingTime: boardingTime.trim() || loop.boardingTime,
      stops: nextStops,
    };
    setActiveLoop(next);
    const detail =
      shiftMin !== 0 ? `${shiftMin > 0 ? "+" : ""}${shiftMin} min for all stops` : undefined;
    logActivity({
      tripId: loop.id,
      tripTitle: `${loop.from} → ${loop.to}`,
      actor,
      kind: "rescheduled",
      message: `rescheduled the plan to ${next.boardingTime}, ${next.date}`,
      detail,
    });
    notifyGroup(`${actor} moved boarding to ${next.boardingTime}`);
    onClose();
  }

  return (
    <Backdrop onClose={onClose}>
      <Header title="Reschedule plan" onClose={onClose} />
      <p className="mt-1 text-xs text-muted-foreground">
        Shift the start time or date. Optionally bump every stop by the same amount.
      </p>

      <Field label="Date" value={date} onChange={setDate} placeholder="May 15, 2026" />
      <Field label="Boarding time" value={boardingTime} onChange={setBoardingTime} placeholder="6:30 PM" />

      <label className="mt-4 block font-mono text-[10px] font-bold uppercase tracking-widest text-ink/70">
        Shift every stop by
      </label>
      <div className="mt-1 flex flex-wrap gap-2">
        {[-60, -30, -15, 0, 15, 30, 60].map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setShiftMin(m)}
            className={`rounded-full border-2 border-ink px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-widest ${
              shiftMin === m ? "bg-coral text-cream" : "bg-cream text-ink hover:bg-ink/5"
            }`}
          >
            {m === 0 ? "No shift" : `${m > 0 ? "+" : ""}${m}m`}
          </button>
        ))}
      </div>

      <Actions
        onSave={save}
        onClose={onClose}
        saveLabel={<><CalendarClock className="h-3.5 w-3.5" /> Save & notify</>}
      />
    </Backdrop>
  );
}

function Header({ title, onClose }: { title: string; onClose: () => void }) {
  return (
    <div className="flex items-center justify-between">
      <h2 className="inline-flex items-center gap-2 font-display text-xl font-extrabold tracking-tight">
        <Pencil className="h-4 w-4 text-coral" /> {title}
      </h2>
      <button
        onClick={onClose}
        className="grid h-8 w-8 place-items-center rounded-full border-2 border-ink bg-cream"
        aria-label="Close"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="mt-3">
      <label className="block font-mono text-[10px] font-bold uppercase tracking-widest text-ink/70">
        {label}
      </label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-1 w-full rounded-xl border-2 border-ink bg-card px-3 py-2 text-sm"
      />
    </div>
  );
}

function Actions({
  onSave,
  onClose,
  saveLabel,
}: {
  onSave: () => void;
  onClose: () => void;
  saveLabel: React.ReactNode;
}) {
  return (
    <div className="mt-5 flex items-center justify-end gap-2">
      <button
        type="button"
        onClick={onClose}
        className="rounded-xl border-2 border-ink bg-cream px-3 py-2 font-mono text-[11px] font-bold uppercase tracking-widest text-ink"
      >
        Cancel
      </button>
      <button
        type="button"
        onClick={onSave}
        className="inline-flex items-center gap-1.5 rounded-xl border-2 border-ink bg-coral px-3 py-2 font-mono text-[11px] font-bold uppercase tracking-widest text-cream shadow-brut"
      >
        {saveLabel}
      </button>
    </div>
  );
}

/** Shift "h:mm AM/PM" by N minutes. Returns original on parse failure. */
function shiftTime(label: string, minutes: number): string {
  const m = label.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (!m) return label;
  let h = parseInt(m[1], 10) % 12;
  const min = parseInt(m[2], 10);
  const pm = m[3].toUpperCase() === "PM";
  if (pm) h += 12;
  const total = h * 60 + min + minutes;
  const wrapped = ((total % 1440) + 1440) % 1440;
  let nh = Math.floor(wrapped / 60);
  const nm = wrapped % 60;
  const mer = nh >= 12 ? "PM" : "AM";
  nh = ((nh + 11) % 12) + 1;
  return `${nh}:${nm.toString().padStart(2, "0")} ${mer}`;
}
