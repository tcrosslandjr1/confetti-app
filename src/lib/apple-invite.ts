// Apple Invites doesn't expose a public "create event" URL API, but the
// Apple Invites app (and Apple Calendar) imports standard .ics files. We
// generate one client-side and trigger a download — on iOS/macOS it opens
// directly in Apple Invites / Calendar; elsewhere it lands as a calendar file.

export type AppleInviteEvent = {
  id: string;
  title: string;
  startsAt: string | Date;
  durationMinutes?: number;
  location?: string | null;
  notes?: string | null;
  url?: string | null;
};

const pad = (n: number) => String(n).padStart(2, "0");

function toICSDate(d: Date): string {
  return (
    d.getUTCFullYear().toString() +
    pad(d.getUTCMonth() + 1) +
    pad(d.getUTCDate()) +
    "T" +
    pad(d.getUTCHours()) +
    pad(d.getUTCMinutes()) +
    pad(d.getUTCSeconds()) +
    "Z"
  );
}

function escapeICS(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}

export function buildICS(evt: AppleInviteEvent): string {
  const start = new Date(evt.startsAt);
  const end = new Date(start.getTime() + (evt.durationMinutes ?? 120) * 60_000);
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//LoopPlan//Apple Invites//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${evt.id}@confettiplan`,
    `DTSTAMP:${toICSDate(new Date())}`,
    `DTSTART:${toICSDate(start)}`,
    `DTEND:${toICSDate(end)}`,
    `SUMMARY:${escapeICS(evt.title)}`,
    evt.location ? `LOCATION:${escapeICS(evt.location)}` : null,
    evt.notes ? `DESCRIPTION:${escapeICS(evt.notes)}` : null,
    evt.url ? `URL:${escapeICS(evt.url)}` : null,
    "END:VEVENT",
    "END:VCALENDAR",
  ].filter(Boolean);
  return lines.join("\r\n");
}

export function downloadAppleInvite(evt: AppleInviteEvent) {
  const ics = buildICS(evt);
  const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${evt.title.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function isAppleDevice(): boolean {
  if (typeof navigator === "undefined") return false;
  return /iPhone|iPad|iPod|Macintosh/.test(navigator.userAgent);
}
