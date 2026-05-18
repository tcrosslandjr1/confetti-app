// Confetti v8 — Trip Engine (multi-day)
// Composes per-day itineraries with energy curve, rest blocks, and venue dedup.

export type EnergyCurve =
  | "chill-turnup-chill"
  | "steady-chill"
  | "steady-turnup"
  | "soft-life"
  | "family-safe"
  | "bachelor"
  | "bachelorette"
  | "adventure-heavy"
  | "food-and-culture";

export type TripInput = {
  destinationCity: string;
  tripLengthDays: number;
  groupSize: number;
  groupType?: string;
  budgetTotal?: number;
  budgetPerDay?: number;
  energyCurve: EnergyCurve;
  mustDoCategories?: string[];
  avoidCategories?: string[];
  homeBaseArea?: string;
  arrivalTime?: string;
  departureTime?: string;
};

export type DayPlanSeed = {
  dayIndex: number;
  dayTheme: string;
  vibe: string;
  occasionId: string;
  timeOfDay: string;
  restBlocks: { label: string; afterStopIndex?: number }[];
};

const CURVES: Record<EnergyCurve, string[]> = {
  "chill-turnup-chill": ["chill", "turnup", "chill"],
  "steady-chill": ["chill", "chill", "chill"],
  "steady-turnup": ["turnup", "turnup", "turnup"],
  "soft-life": ["brunch", "soft-life", "soft-life"],
  "family-safe": ["family", "family", "family"],
  bachelor: ["warmup", "turnup", "recovery"],
  bachelorette: ["brunch", "turnup", "recovery"],
  "adventure-heavy": ["adventure", "adventure", "chill"],
  "food-and-culture": ["culture", "food", "culture"],
};

const THEME_BY_BEAT: Record<
  string,
  { theme: string; vibe: string; occasion: string; time: string }
> = {
  chill: { theme: "Easygoing Day", vibe: "easygoing", occasion: "casual", time: "afternoon" },
  turnup: { theme: "Big Night", vibe: "hyped", occasion: "night-out", time: "late_night" },
  brunch: { theme: "Brunch & Photos", vibe: "soft", occasion: "brunch-baddies", time: "brunch" },
  "soft-life": { theme: "Soft Life", vibe: "soft", occasion: "wellness", time: "afternoon" },
  family: { theme: "Family Day", vibe: "easygoing", occasion: "family", time: "afternoon" },
  warmup: { theme: "Arrival & Warmup", vibe: "easygoing", occasion: "casual", time: "evening" },
  recovery: { theme: "Recovery & Local Gems", vibe: "soft", occasion: "brunch", time: "brunch" },
  adventure: { theme: "Adventure Day", vibe: "adventurous", occasion: "outdoors", time: "morning" },
  culture: { theme: "Culture Crawl", vibe: "curious", occasion: "culture", time: "afternoon" },
  food: { theme: "Food Tour", vibe: "curious", occasion: "food", time: "evening" },
};

export function planTripDays(input: TripInput): DayPlanSeed[] {
  const base = CURVES[input.energyCurve];
  const seeds: DayPlanSeed[] = [];
  for (let i = 0; i < input.tripLengthDays; i++) {
    const beat = base[Math.min(i, base.length - 1)];
    const t = THEME_BY_BEAT[beat] ?? THEME_BY_BEAT.chill;
    seeds.push({
      dayIndex: i,
      dayTheme: t.theme,
      vibe: t.vibe,
      occasionId: t.occasion,
      timeOfDay: t.time,
      restBlocks: i > 0 && beat === "turnup" ? [{ label: "Midday rest", afterStopIndex: 1 }] : [],
    });
  }
  return seeds;
}

/** Avoid repeating the same venue/category across days. */
export function dedupeAcrossDays<T extends { stops: { venueId?: string; type: string }[] }>(
  days: T[],
): T[] {
  const usedVenues = new Set<string>();
  const usedTypes = new Map<string, number>();
  return days.map((d) => ({
    ...d,
    stops: d.stops
      .map((s) => s)
      .filter((s) => {
        if (s.venueId && usedVenues.has(s.venueId)) return false;
        const count = usedTypes.get(s.type) ?? 0;
        if (count >= 2) return false;
        if (s.venueId) usedVenues.add(s.venueId);
        usedTypes.set(s.type, count + 1);
        return true;
      }),
  }));
}
