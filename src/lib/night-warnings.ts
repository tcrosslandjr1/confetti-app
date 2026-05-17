// Heuristic "night mode" risk engine.
// Derives live warnings (kitchen closing, peak wait, last call, late arrival)
// for each stop on the active loop based on its time + venue type.
// Pure frontend: no real-time venue API yet — but the shape is ready for one.

import type { LoopStop } from "./loop-store";

export type WarningSeverity = "info" | "warn" | "critical";

export type StopWarning = {
  stopId: string;
  severity: WarningSeverity;
  /** Short lowercase tag, e.g. "kitchen closing". */
  tag: string;
  /** Single-line human message. */
  message: string;
  /** Optional minutes until the issue hits (kitchen closes in 22m, etc). */
  minutesUntil?: number;
};

const SEVERITY_RANK: Record<WarningSeverity, number> = {
  critical: 3,
  warn: 2,
  info: 1,
};

/** Parse a "10:30 PM" / "22:30" / "10pm" style label into minutes-since-midnight. */
function parseTimeLabel(label?: string): number | null {
  if (!label) return null;
  const m = label
    .trim()
    .toLowerCase()
    .match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)?$/);
  if (!m) return null;
  let h = parseInt(m[1], 10);
  const min = m[2] ? parseInt(m[2], 10) : 0;
  const mer = m[3];
  if (mer === "pm" && h < 12) h += 12;
  if (mer === "am" && h === 12) h = 0;
  if (h > 23 || min > 59) return null;
  return h * 60 + min;
}

function classifyType(t?: string): "food" | "bar" | "club" | "show" | "other" {
  const s = (t || "").toLowerCase();
  if (/(restaurant|dinner|food|kitchen|tasting|brunch|cafe|bistro|pizza|sushi|tacos|ramen)/.test(s))
    return "food";
  if (/(club|nightclub|dance|rave|warehouse)/.test(s)) return "club";
  if (/(bar|cocktail|lounge|speakeasy|brewery|pub|wine|natural wine)/.test(s)) return "bar";
  if (/(show|concert|live|comedy|theater|theatre|dj|set)/.test(s)) return "show";
  return "other";
}

/** "now" snapshot in minutes-since-midnight, treating after-midnight as +24h relative to evening. */
function nowMinutes(now: Date): number {
  return now.getHours() * 60 + now.getMinutes();
}

/**
 * Build live warnings for the loop. Stops that have already been completed
 * are skipped. Warnings are sorted strongest-first.
 */
export function computeNightWarnings(stops: LoopStop[], now: Date = new Date()): StopWarning[] {
  const out: StopWarning[] = [];
  const tNow = nowMinutes(now);

  for (const s of stops) {
    if (s.done) continue;
    const t = parseTimeLabel(s.time);
    const kind = classifyType(s.type);

    // Compare in a window that wraps midnight: if scheduled time is "earlier"
    // than now but it's evening, it's probably tomorrow morning (after-hours).
    let delta = t == null ? null : t - tNow;
    if (delta != null && delta < -180) delta += 24 * 60; // wrap

    // Heuristic close times (minutes-since-midnight on a "logical" night).
    // food kitchens close ~22:30, bars ~01:30 (next day = 25:30), clubs ~02:30.
    const closeMin =
      kind === "food"
        ? 22 * 60 + 30
        : kind === "bar"
          ? 25 * 60 + 30
          : kind === "club"
            ? 26 * 60 + 30
            : kind === "show"
              ? 23 * 60 + 30
              : null;

    if (t != null && closeMin != null) {
      // arrivalAbs treats stops scheduled before noon as next-day.
      const arrivalAbs = t < 12 * 60 ? t + 24 * 60 : t;
      const minsBeforeClose = closeMin - arrivalAbs;

      if (kind === "food") {
        if (minsBeforeClose <= 0) {
          out.push({
            stopId: s.id,
            severity: "critical",
            tag: "kitchen closed",
            message: `Kitchen likely closed by your ${s.time} arrival — call ahead`,
          });
        } else if (minsBeforeClose <= 45) {
          out.push({
            stopId: s.id,
            severity: "warn",
            tag: "kitchen closing",
            message: `Kitchen closes ~${minsBeforeClose}m after you arrive — order fast`,
            minutesUntil: minsBeforeClose,
          });
        }
      } else if (kind === "bar" || kind === "club" || kind === "show") {
        if (minsBeforeClose <= 30 && minsBeforeClose > 0) {
          out.push({
            stopId: s.id,
            severity: "warn",
            tag: "last call",
            message: `Only ~${minsBeforeClose}m left after arrival before last call`,
            minutesUntil: minsBeforeClose,
          });
        }
      }
    }

    // Peak-hour capacity: bars/clubs between 22:30 and 00:30 → expect a wait.
    if (kind === "bar" || kind === "club") {
      const arrivalAbs = t == null ? null : t < 12 * 60 ? t + 24 * 60 : t;
      if (arrivalAbs != null && arrivalAbs >= 22 * 60 + 30 && arrivalAbs <= 24 * 60 + 30) {
        // Synthetic wait estimate — replace with live signal when available.
        const wait = kind === "club" ? 25 + Math.floor((arrivalAbs % 7) * 2) : 15;
        out.push({
          stopId: s.id,
          severity: wait >= 30 ? "warn" : "info",
          tag: "peak wait",
          message: `Peak hours — est. ${wait}m wait at the door`,
          minutesUntil: wait,
        });
      }
    }

    // Running-late nudge: scheduled time already passed and not checked in.
    if (delta != null && delta <= -10) {
      out.push({
        stopId: s.id,
        severity: "warn",
        tag: "running late",
        message: `You're ${Math.abs(delta)}m past the planned ${s.time} arrival`,
      });
    }
  }

  return out.sort((a, b) => SEVERITY_RANK[b.severity] - SEVERITY_RANK[a.severity]);
}

/** Index warnings by stopId for fast lookup in the stops list. */
export function indexWarnings(warnings: StopWarning[]): Map<string, StopWarning[]> {
  const map = new Map<string, StopWarning[]>();
  for (const w of warnings) {
    const arr = map.get(w.stopId) || [];
    arr.push(w);
    map.set(w.stopId, arr);
  }
  return map;
}

export function topSeverity(list: StopWarning[] | undefined): WarningSeverity | null {
  if (!list || list.length === 0) return null;
  return list.reduce<WarningSeverity>(
    (acc, w) => (SEVERITY_RANK[w.severity] > SEVERITY_RANK[acc] ? w.severity : acc),
    "info",
  );
}
