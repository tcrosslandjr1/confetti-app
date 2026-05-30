// Confetti — DMV Happy Hour Monitoring Engine
//
// Scoring, filtering, and route-planning helpers for Happy Hour venues
// across the DC / MD / VA metro area. Each function is deterministic and
// side-effect-free so it can run on both client and edge.

// ── Types ─────────────────────────────────────────────────────────

export type VibeTag =
  | "happy_hour"
  | "culture"
  | "sports"
  | "girls_night"
  | "guys_night"
  | "trending"
  | "rooftop"
  | "patio"
  | "waterfront";

export type RegionId = "DC" | "MD" | "VA";

export type ClusterId =
  | "dc_navy_yard"
  | "dc_u_street"
  | "dc_14th_street"
  | "dc_wharf"
  | "dc_h_street"
  | "dc_chinatown"
  | "dc_georgetown"
  | "md_bethesda"
  | "md_silver_spring"
  | "md_national_harbor"
  | "md_hyattsville"
  | "va_clarendon"
  | "va_ballston"
  | "va_old_town"
  | "va_tysons";

export type HappyHourWindow = {
  days: string[];
  start: string; // HH:MM (24-hour)
  end: string; // HH:MM (24-hour)
  highlights: string[];
};

export type HHVenue = {
  id: string;
  name: string;
  region: RegionId;
  neighborhood: string;
  cluster_id: ClusterId;
  metro_access: boolean;
  nearest_metro?: string;
  attributes: Record<VibeTag, boolean>;
  vibe_scores: Record<VibeTag, number>;
  primary_vibe: VibeTag;
  secondary_vibes: VibeTag[];
  price_tier: "$" | "$$" | "$$$" | "$$$$";
  energy_level: number; // 1-10
  best_for: string[];
  category: string;
  happy_hour: HappyHourWindow;
  trend_score: number;
  venue_score: number;
  deal_value_score: number;
};

export type ClusterMeta = {
  label: string;
  region: RegionId;
  metro_lines: string[];
  walkable_radius_mi: number;
};

export type UserHHPreferences = {
  vibe_weights?: Partial<Record<VibeTag, number>>;
  max_price_tier?: "$" | "$$" | "$$$" | "$$$$";
  require_metro?: boolean;
  preferred_clusters?: ClusterId[];
  min_energy?: number;
  max_energy?: number;
};

// ── Constants ─────────────────────────────────────────────────────

export const HH_PRIME_TIME = { start: "16:00", end: "19:00" } as const;

export const VIBE_WEIGHTS: Record<VibeTag, number> = {
  happy_hour: 1.0,
  culture: 0.8,
  sports: 0.7,
  girls_night: 0.75,
  guys_night: 0.75,
  trending: 0.9,
  rooftop: 0.85,
  patio: 0.8,
  waterfront: 0.85,
};

export const CLUSTER_META: Record<ClusterId, ClusterMeta> = {
  dc_navy_yard: {
    label: "Navy Yard",
    region: "DC",
    metro_lines: ["Green"],
    walkable_radius_mi: 0.4,
  },
  dc_u_street: {
    label: "U Street Corridor",
    region: "DC",
    metro_lines: ["Green", "Yellow"],
    walkable_radius_mi: 0.5,
  },
  dc_14th_street: {
    label: "14th Street NW",
    region: "DC",
    metro_lines: ["Green", "Yellow"],
    walkable_radius_mi: 0.4,
  },
  dc_wharf: {
    label: "The Wharf",
    region: "DC",
    metro_lines: ["Green"],
    walkable_radius_mi: 0.3,
  },
  dc_h_street: {
    label: "H Street NE",
    region: "DC",
    metro_lines: ["Red"],
    walkable_radius_mi: 0.5,
  },
  dc_chinatown: {
    label: "Chinatown / Penn Quarter",
    region: "DC",
    metro_lines: ["Red", "Green", "Yellow"],
    walkable_radius_mi: 0.4,
  },
  dc_georgetown: {
    label: "Georgetown",
    region: "DC",
    metro_lines: [],
    walkable_radius_mi: 0.6,
  },
  md_bethesda: {
    label: "Bethesda",
    region: "MD",
    metro_lines: ["Red"],
    walkable_radius_mi: 0.4,
  },
  md_silver_spring: {
    label: "Silver Spring",
    region: "MD",
    metro_lines: ["Red"],
    walkable_radius_mi: 0.4,
  },
  md_national_harbor: {
    label: "National Harbor",
    region: "MD",
    metro_lines: [],
    walkable_radius_mi: 0.5,
  },
  md_hyattsville: {
    label: "Hyattsville",
    region: "MD",
    metro_lines: ["Green"],
    walkable_radius_mi: 0.3,
  },
  va_clarendon: {
    label: "Clarendon",
    region: "VA",
    metro_lines: ["Orange", "Silver"],
    walkable_radius_mi: 0.4,
  },
  va_ballston: {
    label: "Ballston",
    region: "VA",
    metro_lines: ["Orange", "Silver"],
    walkable_radius_mi: 0.3,
  },
  va_old_town: {
    label: "Old Town Alexandria",
    region: "VA",
    metro_lines: ["Blue", "Yellow"],
    walkable_radius_mi: 0.5,
  },
  va_tysons: {
    label: "Tysons Corner",
    region: "VA",
    metro_lines: ["Silver"],
    walkable_radius_mi: 0.3,
  },
};

// ── Scoring Functions ─────────────────────────────────────────────

/** Composite vibe score: (attributes + specials + crowd + social) / 4 */
export function computeVibeScore(venue: HHVenue): number {
  const attributeCount = Object.values(venue.attributes).filter(Boolean).length;
  const attributeScore = Math.min(attributeCount / 4, 1) * 10;

  const specialsScore = Math.min(venue.happy_hour.highlights.length / 3, 1) * 10;

  // crowd score derived from energy level
  const crowdScore = venue.energy_level;

  // social score from secondary vibes breadth
  const socialScore = Math.min(venue.secondary_vibes.length / 3, 1) * 10;

  return Math.round(((attributeScore + specialsScore + crowdScore + socialScore) / 4) * 10) / 10;
}

/** Deal value score: (avg_discount + drink_quality + food_quality + time_window) / 4 */
export function computeDealValueScore(venue: HHVenue): number {
  // price tier maps to implied discount attractiveness
  const discountMap: Record<string, number> = { $: 6, $$: 8, $$$: 7, $$$$: 5 };
  const avgDiscount = discountMap[venue.price_tier] ?? 5;

  // drink quality approximated from highlight keywords
  const hl = venue.happy_hour.highlights.join(" ").toLowerCase();
  const drinkQuality =
    (hl.includes("cocktail") ? 3 : 0) +
    (hl.includes("wine") ? 2 : 0) +
    (hl.includes("beer") ? 1 : 0) +
    (hl.includes("half") || hl.includes("off") ? 2 : 0) +
    2; // baseline

  // food quality from highlight mentions
  const foodQuality =
    (hl.includes("oyster") ? 3 : 0) +
    (hl.includes("taco") ? 2 : 0) +
    (hl.includes("wing") ? 2 : 0) +
    (hl.includes("appetizer") || hl.includes("app") ? 2 : 0) +
    2; // baseline

  // time window score: longer HH = higher score (max 4 hours → 10)
  const [startH, startM] = venue.happy_hour.start.split(":").map(Number);
  const [endH, endM] = venue.happy_hour.end.split(":").map(Number);
  const durationMin = endH * 60 + endM - (startH * 60 + startM);
  const timeWindow = Math.min(durationMin / 24, 10); // 240 min (4h) = 10

  return (
    Math.round(
      ((Math.min(avgDiscount, 10) +
        Math.min(drinkQuality, 10) +
        Math.min(foodQuality, 10) +
        timeWindow) /
        4) *
        10,
    ) / 10
  );
}

/** Composite venue score: (vibe + deal_value + accessibility + trend) / 4 */
export function computeVenueScore(venue: HHVenue): number {
  const vibe = computeVibeScore(venue);
  const dealValue = computeDealValueScore(venue);

  // accessibility: metro access + walkable cluster
  const metroBonus = venue.metro_access ? 8 : 4;
  const clusterWalk = CLUSTER_META[venue.cluster_id]?.walkable_radius_mi ?? 0.3;
  const accessibility = Math.min(metroBonus + clusterWalk * 5, 10);

  const trend = Math.min(venue.trend_score, 10);

  return Math.round(((vibe + dealValue + accessibility + trend) / 4) * 10) / 10;
}

/** Trend score: (checkins + mentions + reviews + velocity) / 4 */
export function computeTrendScore(signals: {
  checkins: number;
  mentions: number;
  reviews: number;
  velocity: number;
}): number {
  const cap = (v: number, max: number) => Math.min(v / max, 1) * 10;
  return (
    Math.round(
      ((cap(signals.checkins, 200) +
        cap(signals.mentions, 50) +
        cap(signals.reviews, 100) +
        cap(signals.velocity, 20)) /
        4) *
        10,
    ) / 10
  );
}

// ── Time Helpers ──────────────────────────────────────────────────

/** Returns true when the current time falls inside the venue's HH window. */
export function isHappyHourActive(venue: HHVenue, now: Date): boolean {
  const dayNames = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
  const todayName = dayNames[now.getDay()];

  const matchesDay = venue.happy_hour.days.some((d) => d.toLowerCase() === todayName);
  if (!matchesDay) return false;

  const nowMin = now.getHours() * 60 + now.getMinutes();
  const [startH, startM] = venue.happy_hour.start.split(":").map(Number);
  const [endH, endM] = venue.happy_hour.end.split(":").map(Number);

  return nowMin >= startH * 60 + startM && nowMin <= endH * 60 + endM;
}

/** Filter to only venues with an active HH right now. */
export function getActiveHappyHours(venues: HHVenue[], now: Date): HHVenue[] {
  return venues.filter((v) => isHappyHourActive(v, now));
}

// ── Filtering Helpers ─────────────────────────────────────────────

/** Filter venues by neighborhood cluster. */
export function getVenuesByCluster(venues: HHVenue[], clusterId: ClusterId): HHVenue[] {
  return venues.filter((v) => v.cluster_id === clusterId);
}

/** Filter by vibe tag with a minimum score threshold. */
export function getVenuesByVibe(venues: HHVenue[], vibe: VibeTag, minScore = 5): HHVenue[] {
  return venues.filter((v) => v.attributes[vibe] && v.vibe_scores[vibe] >= minScore);
}

// ── Ranking & Route Planning ──────────────────────────────────────

const PRICE_ORDER: Record<string, number> = { $: 1, $$: 2, $$$: 3, $$$$: 4 };

/** Rank venues by weighted composite score, applying user preferences. */
export function rankVenues(venues: HHVenue[], preferences: UserHHPreferences): HHVenue[] {
  const weights = { ...VIBE_WEIGHTS, ...preferences.vibe_weights };

  const scored = venues
    .filter((v) => {
      if (
        preferences.max_price_tier &&
        PRICE_ORDER[v.price_tier] > PRICE_ORDER[preferences.max_price_tier]
      ) {
        return false;
      }
      if (preferences.require_metro && !v.metro_access) return false;
      if (
        preferences.preferred_clusters?.length &&
        !preferences.preferred_clusters.includes(v.cluster_id)
      ) {
        return false;
      }
      if (preferences.min_energy != null && v.energy_level < preferences.min_energy) return false;
      if (preferences.max_energy != null && v.energy_level > preferences.max_energy) return false;
      return true;
    })
    .map((v) => {
      // Weighted vibe bonus
      const vibeBonus =
        v.secondary_vibes.reduce((sum, tag) => sum + (weights[tag] ?? 0.5), 0) +
        (weights[v.primary_vibe] ?? 1);

      const composite = computeVenueScore(v) + vibeBonus;
      return { venue: v, composite };
    })
    .sort((a, b) => b.composite - a.composite);

  return scored.map((s) => s.venue);
}

/**
 * Suggest a walkable Happy Hour crawl route: 2-3 venues in the same
 * cluster sorted by optimal visit order (earliest HH start → latest).
 */
export function suggestRoute(venues: HHVenue[], maxStops: number = 3): HHVenue[] {
  // Group by cluster
  const clusters = new Map<ClusterId, HHVenue[]>();
  for (const v of venues) {
    const list = clusters.get(v.cluster_id) ?? [];
    list.push(v);
    clusters.set(v.cluster_id, list);
  }

  // Find the cluster with the most options (and at least 2)
  let bestCluster: HHVenue[] = [];
  let bestScore = 0;

  for (const [, group] of clusters) {
    if (group.length < 2) continue;
    const avgScore = group.reduce((s, v) => s + v.venue_score, 0) / group.length;
    if (avgScore > bestScore || (avgScore === bestScore && group.length > bestCluster.length)) {
      bestScore = avgScore;
      bestCluster = group;
    }
  }

  // Sort by HH start time for a natural walk order
  const sorted = [...bestCluster].sort((a, b) => {
    const aMin = toMinutes(a.happy_hour.start);
    const bMin = toMinutes(b.happy_hour.start);
    return aMin - bMin;
  });

  return sorted.slice(0, Math.min(maxStops, sorted.length));
}

// ── Internal Helpers ──────────────────────────────────────────────

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}
