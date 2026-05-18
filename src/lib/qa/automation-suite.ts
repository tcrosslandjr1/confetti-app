// Confetti QA — Prioritized Automation Suite
// Subset runners for smoke, booking, and personalization tiers.
// Import and call from /qa UI or CI.

import { SUITES } from "./test-definitions";

export type Priority = "smoke" | "booking" | "personalization" | "full";

const SMOKE_IDS = new Set([
  "S1", // Onboarding
  "S2", // Vibes
  "S3", // Categories
  "S4", // Cities
  "S5", // Itinerary
  "S10", // Weather
  "S11", // Safety
  "S12", // Time-of-day
  "S19", // Orchestration
  "E2E", // Final E2E
]);

const BOOKING_IDS = new Set([
  "S7", // Booking tiers
  "S8", // Order-ahead
  "S13", // Swaps
  "S14", // Save & Share
  "S18", // Promo
]);

const PERSONALIZATION_IDS = new Set([
  "S6", // Naming
  "S15", // Recap
  "S16", // Personalization
  "S17", // Multi-day
  "S9", // Group
]);

export function runByPriority(priority: Priority) {
  const ids =
    priority === "smoke"
      ? SMOKE_IDS
      : priority === "booking"
        ? BOOKING_IDS
        : priority === "personalization"
          ? PERSONALIZATION_IDS
          : null;

  const suites = ids ? SUITES.filter((s) => ids.has(s.id)) : SUITES;
  const rows: { suiteId: string; suiteName: string; result: import("./test-definitions").TestResult }[] = [];
  for (const s of suites) {
    try {
      for (const r of s.run()) rows.push({ suiteId: s.id, suiteName: s.name, result: r });
    } catch (e) {
      rows.push({
        suiteId: s.id,
        suiteName: s.name,
        result: {
          id: `${s.id}.ERR`,
          name: "Suite threw",
          status: "fail",
          notes: e instanceof Error ? e.message : String(e),
        },
      });
    }
  }
  return rows;
}

export function getPrioritySummary(priority: Priority) {
  const rows = runByPriority(priority);
  const summary = rows.reduce(
    (acc, r) => {
      acc.total++;
      acc[r.result.status]++;
      return acc;
    },
    { pass: 0, fail: 0, skip: 0, total: 0 },
  );
  return { summary, rows };
}
