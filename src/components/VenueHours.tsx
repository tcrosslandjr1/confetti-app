/**
 * VenueHours — shows business hours for each day with open/closed badge.
 * Highlights the current day and shows real-time status.
 */

import { Clock, MapPin } from "lucide-react";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

export type DayHours = {
  dayOfWeek: number; // 0=Sun … 6=Sat
  openTime: string;  // "11:00"
  closeTime: string; // "23:00"
  isClosed: boolean;
};

function formatTime(t: string): string {
  const [h, m] = t.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const hr = h % 12 || 12;
  return m === 0 ? `${hr} ${ampm}` : `${hr}:${m.toString().padStart(2, "0")} ${ampm}`;
}

function isOpenNow(hours: DayHours[]): { open: boolean; label: string } {
  const now = new Date();
  const day = now.getDay();
  const today = hours.find((h) => h.dayOfWeek === day);
  if (!today || today.isClosed) return { open: false, label: "Closed now" };

  const current = now.getHours() * 60 + now.getMinutes();
  const [oh, om] = today.openTime.split(":").map(Number);
  const [ch, cm] = today.closeTime.split(":").map(Number);
  const openMin = oh * 60 + om;
  let closeMin = ch * 60 + cm;

  // Handle past-midnight closing (e.g. closes at 2 AM)
  if (closeMin <= openMin) closeMin += 24 * 60;
  const adjustedCurrent = current < openMin ? current + 24 * 60 : current;

  if (adjustedCurrent >= openMin && adjustedCurrent < closeMin) {
    // Closing soon?
    const minsLeft = closeMin - adjustedCurrent;
    if (minsLeft <= 60) return { open: true, label: `Closes in ${minsLeft} min` };
    return { open: true, label: "Open now" };
  }
  return { open: false, label: "Closed now" };
}

export function VenueHours({ hours }: { hours: DayHours[] }) {
  const today = new Date().getDay();
  const status = isOpenNow(hours);

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-ink/10 bg-white/60 p-4 backdrop-blur">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-ink/50" />
          <span className="font-display text-sm font-bold text-ink">Hours</span>
        </div>
        <span
          className={`rounded-full px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-widest ${
            status.open
              ? "bg-emerald-100 text-emerald-700"
              : "bg-red-100 text-red-600"
          }`}
        >
          {status.label}
        </span>
      </div>

      <div className="flex flex-col gap-1">
        {DAYS.map((name, i) => {
          const entry = hours.find((h) => h.dayOfWeek === i);
          const isToday = i === today;
          return (
            <div
              key={i}
              className={`flex items-center justify-between rounded-lg px-2 py-1 ${
                isToday ? "bg-coral/5 font-bold" : ""
              }`}
            >
              <span
                className={`w-10 font-mono text-[11px] uppercase tracking-widest ${
                  isToday ? "text-coral" : "text-ink/50"
                }`}
              >
                {name}
              </span>
              <span
                className={`font-mono text-[11px] ${
                  isToday ? "text-ink" : "text-ink/70"
                }`}
              >
                {!entry || entry.isClosed
                  ? "Closed"
                  : `${formatTime(entry.openTime)} – ${formatTime(entry.closeTime)}`}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
