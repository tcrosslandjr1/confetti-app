// Lightweight hours-of-operation registry + validators for the demo trip.
// Keeps stop data + opening hours in one place so the Ready, Collab and RSVP
// pages can all show consistent "Open / Outside hours" badges.

export type DayKey = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";
export type HoursWindow = { open: string; close: string }; // "HH:MM" 24h
export type WeeklyHours = Partial<Record<DayKey, HoursWindow[]>>;

// Hand-curated for the demo itinerary. Replace with live business data when wired up.
export const VENUE_HOURS: Record<string, WeeklyHours> = {
  "Bluebird Coffee Social": {
    mon: [{ open: "07:00", close: "16:00" }],
    tue: [{ open: "07:00", close: "16:00" }],
    wed: [{ open: "07:00", close: "16:00" }],
    thu: [{ open: "07:00", close: "16:00" }],
    fri: [{ open: "07:00", close: "18:00" }],
    sat: [{ open: "08:00", close: "15:00" }],
    sun: [{ open: "08:00", close: "14:00" }],
  },
  "The Marigold Rooftop": {
    wed: [{ open: "16:00", close: "23:00" }],
    thu: [{ open: "16:00", close: "23:00" }],
    fri: [{ open: "12:00", close: "01:00" }],
    sat: [{ open: "12:00", close: "01:00" }],
    sun: [{ open: "12:00", close: "21:00" }],
  },
  // Public outdoor space — open dawn till dusk.
  "Lantern Hill Overlook": {
    mon: [{ open: "06:00", close: "21:00" }],
    tue: [{ open: "06:00", close: "21:00" }],
    wed: [{ open: "06:00", close: "21:00" }],
    thu: [{ open: "06:00", close: "21:00" }],
    fri: [{ open: "06:00", close: "22:00" }],
    sat: [{ open: "06:00", close: "22:00" }],
    sun: [{ open: "06:00", close: "21:00" }],
  },
  "Osteria di Pesca": {
    tue: [{ open: "17:00", close: "22:00" }],
    wed: [{ open: "17:00", close: "22:00" }],
    thu: [{ open: "17:00", close: "22:00" }],
    fri: [{ open: "17:00", close: "23:00" }],
    sat: [{ open: "17:00", close: "23:00" }],
    sun: [{ open: "17:00", close: "21:00" }],
  },
};

const DAY_ORDER: DayKey[] = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
const DAY_LABEL: Record<DayKey, string> = {
  mon: "Mon", tue: "Tue", wed: "Wed", thu: "Thu", fri: "Fri", sat: "Sat", sun: "Sun",
};

export function dayKeyFromDate(d: Date): DayKey {
  return DAY_ORDER[d.getDay()];
}

// Parse a label like "11:30 AM" or "5:30 PM" into minutes past midnight.
export function parseTimeLabel(label: string): number | null {
  const m = label.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (!m) return null;
  let h = parseInt(m[1], 10);
  const min = parseInt(m[2], 10);
  const mer = m[3]?.toUpperCase();
  if (mer === "PM" && h < 12) h += 12;
  if (mer === "AM" && h === 12) h = 0;
  return h * 60 + min;
}

function parseHM(hm: string): number {
  const [h, m] = hm.split(":").map((n) => parseInt(n, 10));
  return h * 60 + m;
}

function fmt12(minutes: number): string {
  const h24 = Math.floor(minutes / 60) % 24;
  const m = minutes % 60;
  const mer = h24 >= 12 ? "PM" : "AM";
  const h = ((h24 + 11) % 12) + 1;
  return `${h}:${m.toString().padStart(2, "0")} ${mer}`;
}

export type FitStatus =
  | { state: "open"; hoursLabel: string }
  | { state: "tight"; hoursLabel: string; minutesAfterClose: number }
  | { state: "closed"; hoursLabel: string; reason: string }
  | { state: "unknown" };

export function hoursLabelFor(venue: string, day: DayKey): string {
  const wk = VENUE_HOURS[venue];
  if (!wk) return "Hours unavailable";
  const windows = wk[day];
  if (!windows || windows.length === 0) return `Closed ${DAY_LABEL[day]}`;
  return windows.map((w) => `${fmt12(parseHM(w.open))} – ${fmt12(parseHM(w.close))}`).join(", ");
}

/**
 * Validate that a stop starting at `startLabel` and lasting `durationMin`
 * fits inside the venue's hours for `day`.
 */
export function checkStopFits(
  venue: string,
  startLabel: string,
  durationMin: number,
  day: DayKey,
): FitStatus {
  const wk = VENUE_HOURS[venue];
  if (!wk) return { state: "unknown" };

  const hoursLabel = hoursLabelFor(venue, day);
  const windows = wk[day];
  if (!windows || windows.length === 0) {
    return { state: "closed", hoursLabel, reason: `Closed on ${DAY_LABEL[day]}` };
  }

  const start = parseTimeLabel(startLabel);
  if (start == null) return { state: "unknown" };
  const end = start + Math.max(0, durationMin);

  for (const w of windows) {
    const open = parseHM(w.open);
    // Treat a close after 24:00 (e.g. "01:00") as next-day overnight.
    const rawClose = parseHM(w.close);
    const close = rawClose <= open ? rawClose + 24 * 60 : rawClose;

    if (start >= open && end <= close) return { state: "open", hoursLabel };
    if (start >= open && start < close && end > close) {
      return { state: "tight", hoursLabel, minutesAfterClose: end - close };
    }
  }

  // Find the closest reason for the friendliest message.
  const earliestOpen = Math.min(...windows.map((w) => parseHM(w.open)));
  const latestClose = Math.max(...windows.map((w) => {
    const o = parseHM(w.open); const c = parseHM(w.close); return c <= o ? c + 24 * 60 : c;
  }));
  const reason =
    start < earliestOpen ? `Opens at ${fmt12(earliestOpen)}` :
    start >= latestClose ? `Closed after ${fmt12(latestClose % (24 * 60))}` :
    "Outside opening hours";
  return { state: "closed", hoursLabel, reason };
}
