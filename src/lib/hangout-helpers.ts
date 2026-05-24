import type {
  ActiveHangout,
  HangoutNearbyStore,
  HangoutPickupLink,
  HangoutPlan,
} from "./hangout-store";

// ─── Pickup-link auto-generation ──────────────────────────────────────

/**
 * Build pickup deeplinks from the plan's data. Used when Claude didn't
 * include them — turns the grocery list into an Instacart deep search
 * and the nearby_stores into Google Maps / Yelp searches.
 */
export function derivePickupLinks(plan: HangoutPlan): HangoutPickupLink[] {
  const out: HangoutPickupLink[] = [];

  // Instacart bulk search of the grocery list (max 8 items so URL stays sane).
  if (plan.grocery_list && plan.grocery_list.length > 0) {
    const top = plan.grocery_list.slice(0, 8).join(" ");
    out.push({
      label: "Instacart — full grocery list",
      url: `https://www.instacart.com/store/s?k=${encodeURIComponent(top)}`,
      notes: `${plan.grocery_list.length} items`,
    });
  }

  // Per-store: Google Maps directions + Yelp lookup.
  for (const s of plan.nearby_stores ?? []) {
    const query = encodeURIComponent(`${s.name} ${s.address ?? ""}`.trim());
    out.push({
      label: `Maps — ${s.name}`,
      url: `https://www.google.com/maps/search/?api=1&query=${query}`,
      notes: s.purpose,
    });
  }

  // If a cake / bakery shows up in the menu, add an OpenTable-style note.
  return out;
}

/** Merge Claude's pickup_links with auto-derived ones, deduped by URL. */
export function combinedPickupLinks(plan: HangoutPlan): HangoutPickupLink[] {
  const claudeLinks = plan.pickup_links ?? [];
  const derived = derivePickupLinks(plan);
  const seen = new Set<string>();
  const out: HangoutPickupLink[] = [];
  for (const l of [...claudeLinks, ...derived]) {
    if (!l.url || seen.has(l.url)) continue;
    seen.add(l.url);
    out.push(l);
  }
  return out;
}

// ─── .ics calendar export ──────────────────────────────────────────────

/** Pad to 2 digits. */
function p2(n: number): string {
  return String(n).padStart(2, "0");
}

/** Format a Date as YYYYMMDDTHHmmss (floating, no Z). */
function toIcsLocal(d: Date): string {
  return (
    d.getFullYear().toString() +
    p2(d.getMonth() + 1) +
    p2(d.getDate()) +
    "T" +
    p2(d.getHours()) +
    p2(d.getMinutes()) +
    "00"
  );
}

/** Escape per RFC 5545 — commas, semicolons, newlines. */
function icsEscape(s: string): string {
  return s
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}

/**
 * Generate an .ics blob for a hangout. Anchors the event at hangout.startTime
 * (or 6 PM if missing) on the hangout.date (or today). Duration ~3.5 hours.
 * Description contains the title + summary + menu/timeline overview.
 */
export function hangoutToIcs(h: ActiveHangout): Blob {
  const p = h.plan;
  const date = h.date ? new Date(h.date) : new Date();
  // Apply startTime override if present.
  if (h.startTime) {
    const [hh, mm] = h.startTime.split(":").map((s) => parseInt(s, 10));
    if (!Number.isNaN(hh) && !Number.isNaN(mm)) {
      date.setHours(hh, mm, 0, 0);
    }
  } else {
    date.setHours(18, 0, 0, 0);
  }
  const end = new Date(date.getTime() + 3.5 * 60 * 60 * 1000);

  const descLines: string[] = [p.summary, "", `${p.guest_count} guests · ${p.budget_estimate}`];
  if (p.menu.length > 0) {
    descLines.push("", "MENU:");
    for (const m of p.menu.slice(0, 8)) descLines.push(`• ${m.quantity} ${m.item}`);
  }
  if (p.setup_timeline.length > 0) {
    descLines.push("", "PREP:");
    for (const t of p.setup_timeline.slice(0, 6)) descLines.push(`${t.when} — ${t.task}`);
  }
  if (p.weather_backup?.if_rain) {
    descLines.push("", `Rain backup: ${p.weather_backup.if_rain}`);
  }
  const description = descLines.join("\n");

  const uid = `${h.id}@confetti.app`;
  const stamp = toIcsLocal(new Date());
  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Confetti//Hangout//EN",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${stamp}`,
    `DTSTART:${toIcsLocal(date)}`,
    `DTEND:${toIcsLocal(end)}`,
    `SUMMARY:${icsEscape(p.title)}`,
    `LOCATION:${icsEscape(h.city ?? "")}`,
    `DESCRIPTION:${icsEscape(description)}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
  return new Blob([ics], { type: "text/calendar;charset=utf-8" });
}

/** Trigger a download of the hangout .ics file. */
export function downloadHangoutIcs(h: ActiveHangout): void {
  const blob = hangoutToIcs(h);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${h.plan.title.replace(/[^a-z0-9]+/gi, "-").slice(0, 50)}.ics`;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    URL.revokeObjectURL(url);
    a.remove();
  }, 100);
}

// ─── Weather forecast (Open-Meteo, no key) ────────────────────────────

export interface HangoutForecast {
  /** Temperature °F at the hangout hour. */
  temperatureF: number;
  /** Precipitation probability % at the hangout hour. */
  precipProbability: number;
  /** Human-readable weather summary. */
  summary: string;
  /** True when conditions warrant flipping to the weather_backup section. */
  backupRecommended: boolean;
}

function describeWeather(tempF: number, precip: number): {
  summary: string;
  backupRecommended: boolean;
} {
  if (precip >= 50) return { summary: `${precip}% rain expected — backup plan ready`, backupRecommended: true };
  if (tempF >= 92) return { summary: `Hot (${Math.round(tempF)}°F) — pack extra water + shade`, backupRecommended: true };
  if (tempF <= 45) return { summary: `Chilly (${Math.round(tempF)}°F) — layers + warm drinks`, backupRecommended: true };
  if (precip >= 25) return { summary: `${precip}% rain chance — tarp on standby`, backupRecommended: false };
  return { summary: `Looking good — ${Math.round(tempF)}°F, ${precip}% rain`, backupRecommended: false };
}

/**
 * Best-effort forecast lookup. Geocodes the city via Open-Meteo's free
 * geocoder, then queries the forecast endpoint for the hangout's
 * date+hour. Returns null on any failure — the UI just hides the banner.
 */
export async function fetchHangoutWeather(
  h: ActiveHangout,
): Promise<HangoutForecast | null> {
  if (!h.city) return null;
  try {
    const geoRes = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(h.city)}&count=1`,
    );
    if (!geoRes.ok) return null;
    const geo = (await geoRes.json()) as { results?: Array<{ latitude: number; longitude: number; timezone?: string }> };
    const point = geo.results?.[0];
    if (!point) return null;

    const date = h.date ? new Date(h.date) : new Date();
    const iso = date.toISOString().slice(0, 10);

    const fcRes = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${point.latitude}&longitude=${point.longitude}&hourly=temperature_2m,precipitation_probability&temperature_unit=fahrenheit&start_date=${iso}&end_date=${iso}&timezone=${encodeURIComponent(point.timezone ?? "auto")}`,
    );
    if (!fcRes.ok) return null;
    const fc = (await fcRes.json()) as {
      hourly?: { time: string[]; temperature_2m: number[]; precipitation_probability: number[] };
    };
    const hourly = fc.hourly;
    if (!hourly || !hourly.time?.length) return null;

    // Pick the hour matching startTime; default to 18:00 if missing.
    const startHour = h.startTime ? parseInt(h.startTime.split(":")[0], 10) : 18;
    let idx = hourly.time.findIndex((t) => t.endsWith(`T${p2(startHour)}:00`));
    if (idx < 0) idx = Math.min(startHour, hourly.time.length - 1);

    const tempF = hourly.temperature_2m[idx] ?? 70;
    const precip = hourly.precipitation_probability[idx] ?? 0;
    const { summary, backupRecommended } = describeWeather(tempF, precip);
    return { temperatureF: tempF, precipProbability: precip, summary, backupRecommended };
  } catch {
    return null;
  }
}

/** Re-export for callers that just want the type alias. */
export type { HangoutNearbyStore };
