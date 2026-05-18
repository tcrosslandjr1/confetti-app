// Confetti v6 — The 7 Missing Engines.
//
// Deterministic, prompt-shaping helpers. Each engine produces (a) a directive
// chunk appended to the AI prompt and (b) plain-text notes attached to the
// output so the UI can render them.
//
// Imported by src/lib/generate-plan.functions.ts and src/routes/vibe-plans.tsx.

import type { CityContext } from "./city-context";
import type { ServerForecast } from "../weather.server";

// ── Types ─────────────────────────────────────────────────────────

export type PersonalityId =
  | "classy"
  | "chaotic"
  | "soft_life"
  | "bougie"
  | "adventurous"
  | "romantic"
  | "corporate"
  | "family_friendly"
  | "genz_playful"
  | "luxury_concierge"
  | "calm"
  | "local_friend";

export type BudgetMode = "save" | "balanced" | "upgrade";

export type GroupType =
  | "friends"
  | "couples"
  | "in_laws"
  | "coworkers"
  | "bachelor"
  | "bachelorette"
  | "family"
  | "solo";

export type TimeOfDay =
  | "sunrise"
  | "morning"
  | "brunch"
  | "afternoon"
  | "after_work"
  | "evening"
  | "late_night"
  | "all_day"
  | "weekend";

export type SafetyMode =
  | "in_laws"
  | "family"
  | "meet_parents"
  | "coworker"
  | "solo"
  | "solo_women"
  | "first_date"
  | "older_group"
  | "conservative";

export type LocalFlavorLevel = "light" | "medium" | "heavy";

// ── Engine 1: Personality ─────────────────────────────────────────

const PERSONALITY_TONE: Record<PersonalityId, { label: string; tone: string; directive: string }> = {
  classy: {
    label: "Classy",
    tone: "Polished, refined, calmer pacing.",
    directive:
      "Voice: refined, low-key sophisticated. Prefer quieter, well-reviewed venues; avoid chaotic clubs.",
  },
  chaotic: {
    label: "Chaotic",
    tone: "High-energy, spontaneous, loud and fun.",
    directive:
      "Voice: high-energy, playful, a little unhinged. Prefer loud, social, late-running venues; favor unpredictability.",
  },
  soft_life: {
    label: "Soft Life",
    tone: "Spa, rooftops, champagne, easy transitions.",
    directive:
      "Voice: dreamy, indulgent, low-stress. Prefer rooftops, spa, waterfront, champagne, aesthetic plates. Smooth pacing.",
  },
  bougie: {
    label: "Bougie",
    tone: "Upscale, reservations preferred.",
    directive:
      "Voice: upscale, status-aware. Pick higher-rated, reservation-friendly venues. Mark reservation_recommended=true.",
  },
  adventurous: {
    label: "Adventurous",
    tone: "Movement, activities, unique local experiences.",
    directive:
      "Voice: bold and curious. Include at least one activity-driven or unusual local experience.",
  },
  romantic: {
    label: "Romantic",
    tone: "Intimate seating, scenic stops, dessert.",
    directive:
      "Voice: warm and intimate. Prefer low-noise venues, candlelight, scenic views, dessert moments.",
  },
  corporate: {
    label: "Corporate",
    tone: "Professional, low-risk, conversation-friendly.",
    directive:
      "Voice: professional and safe. Conversation-friendly noise levels, group seating, no risque content.",
  },
  family_friendly: {
    label: "Family-Friendly",
    tone: "Safe, daytime, accessible, no adult venues.",
    directive:
      "Voice: warm and inclusive. All ages welcome. NO clubs, strip clubs, heavy drinking. Daytime-leaning.",
  },
  genz_playful: {
    label: "Gen-Z Playful",
    tone: "Catchy, photo moments, cute copy.",
    directive:
      "Voice: bubbly, internet-fluent. Prioritize photo moments, viral spots, aesthetic plates.",
  },
  luxury_concierge: {
    label: "Luxury Concierge",
    tone: "Premium venues, elevated pacing.",
    directive:
      "Voice: white-glove. Pick premium venues only. Suggest private transport. Reservations required.",
  },
  calm: {
    label: "Calm",
    tone: "Fewer steps, easy logistics, quiet venues.",
    directive:
      "Voice: gentle, unhurried. Keep to 2–3 stops max. Quiet venues. Short distances between stops.",
  },
  local_friend: {
    label: "Local Friend",
    tone: "Casual, warm, city-aware.",
    directive:
      "Voice: like a friend who lives there. Lead with hidden gems, neighborhood favorites, local slang.",
  },
};

export function personalityEngine(p?: PersonalityId | null) {
  if (!p) return null;
  const def = PERSONALITY_TONE[p];
  if (!def) return null;
  return { id: p, label: def.label, tone: def.tone, directive: `Personality (${def.label}): ${def.directive}` };
}

// ── Engine 2: Budget-Smart ────────────────────────────────────────

export function budgetSmartEngine(input: {
  perPersonBudgetUsd?: number; // user's per-person ceiling (UI slider)
  budgetTier: 1 | 2 | 3 | 4; // resolved $ tier
  groupSize: number;
  mode?: BudgetMode;
}) {
  const mode: BudgetMode = input.mode ?? "balanced";
  const perPerson = input.perPersonBudgetUsd ?? [25, 60, 120, 220][input.budgetTier - 1] ?? 60;
  const groupTotal = perPerson * Math.max(1, input.groupSize);

  const modeDirective =
    mode === "save"
      ? "Budget mode = SAVE: bias toward the cheapest on-vibe option per slot. Always include 2 cheaper_swaps."
      : mode === "upgrade"
        ? "Budget mode = UPGRADE: bias one slot up a tier when it elevates the night. Always include 2 luxury_upgrades."
        : "Budget mode = BALANCED: keep per-person spend near the user's ceiling; include 1 cheaper_swap and 1 luxury_upgrade.";

  return {
    perPersonEstimate: `~$${Math.round(perPerson)}/person`,
    groupTotalEstimate: `~$${Math.round(groupTotal)} for ${input.groupSize}`,
    budgetSummary: `${perPersonOf(input.budgetTier)} · ${input.groupSize} guests · ${modeLabel(mode)}`,
    directive: [
      `Per-person ceiling ≈ $${Math.round(perPerson)}. Group of ${input.groupSize} → ~$${Math.round(groupTotal)} total.`,
      modeDirective,
      "Always return cheaper_swaps (same vibe, ~30–50% cheaper) and luxury_upgrades (same vibe, premium tier).",
      "If any single stop would push the per-person total over the ceiling, swap or flag in budget_warning.",
    ].join(" "),
    mode,
  };
}

function modeLabel(m: BudgetMode) {
  return m === "save" ? "Save Money" : m === "upgrade" ? "Upgrade Me" : "Balanced";
}
function perPersonOf(tier: 1 | 2 | 3 | 4) {
  return ["$", "$$", "$$$", "$$$$"][tier - 1];
}

// ── Engine 3: Group Dynamics ──────────────────────────────────────

export function groupDynamicsEngine(size: number, type?: GroupType | null) {
  const tier =
    size <= 1
      ? "solo"
      : size === 2
        ? "duo"
        : size <= 5
          ? "small"
          : size <= 8
            ? "medium"
            : size <= 12
              ? "large"
              : size <= 20
                ? "xlarge"
                : "group_booking";

  const pacingStyle =
    tier === "solo"
      ? "low-pressure, walkable"
      : tier === "duo"
        ? "intimate, conversational"
        : tier === "small"
          ? "flexible, social"
          : tier === "medium"
            ? "group-friendly with reservations"
            : tier === "large"
              ? "private sections, fewer moves"
              : tier === "xlarge"
                ? "private rooms, transport planning"
                : "structured itinerary, private venues";

  const reservationRecommended = size >= 6;
  const transportationNote =
    size >= 9
      ? "Plan transport ahead (sprinter or 2+ rideshares)."
      : size >= 6
        ? "Two rideshares or a single sprinter recommended."
        : "Standard rideshare or walking is fine.";

  const typeDirective: Record<GroupType, string> = {
    friends: "vibe-driven, flexible.",
    couples: "romantic, scenic, intimate.",
    in_laws: "calm, classy, conversation-friendly. NO clubs, strip clubs, dive bars.",
    coworkers: "professional, low-risk, not too intimate. Conversation-friendly noise.",
    bachelor: "high-energy. Adult-only stops allowed ONLY if explicitly toggled.",
    bachelorette: "high-energy, photo moments. Adult-only stops allowed ONLY if explicitly toggled.",
    family: "accessible, family-safe, daytime-friendly. NO adult venues.",
    solo: "solo-safe, easy parking, walkable, low-pressure.",
  };

  return {
    reservationRecommended,
    transportationNote,
    pacingStyle,
    directive: [
      `Group size ${size} (${tier}): ${pacingStyle}. ${transportationNote}${reservationRecommended ? " Reservations recommended." : ""}`,
      type ? `Group type ${type}: ${typeDirective[type] ?? ""}` : "",
    ]
      .filter(Boolean)
      .join(" "),
  };
}

// ── Engine 4: Weather ─────────────────────────────────────────────

export function weatherEngineFromForecast(f?: ServerForecast | null) {
  if (!f) return null;
  const rain = f.precipProb >= 60;
  const hot = f.tMaxF >= 90;
  const cold = f.tMaxF <= 45;

  const notes: string[] = [];
  const directives: string[] = [];

  if (rain) {
    notes.push("Rain likely — covered/indoor backups built in.");
    directives.push(
      "Rain: swap rooftops → indoor lounges; outdoor walks → museums/cafés; yachts → indoor dinner + spa.",
    );
  }
  if (hot) {
    notes.push("Extreme heat — daytime indoor pivots.");
    directives.push(
      "Heat: outdoor walks → AC cafés/museums; brunch patios → indoor brunch; hikes → early morning only.",
    );
  }
  if (cold) {
    notes.push("Cold — cozy indoor leans.");
    directives.push(
      "Cold: rooftops → cozy lounges; waterfront walks → dessert café or jazz lounge; outdoor markets → indoor markets.",
    );
  }
  if (!rain && !hot && !cold) {
    notes.push(`${f.emoji} ${f.label} — weather is on your side.`);
  }

  return {
    note: notes.join(" "),
    directive: directives.length
      ? `Weather engine — ${directives.join(" ")}`
      : `Weather engine — clear conditions; no fallback needed.`,
  };
}

// ── Engine 5: Time-of-Day ─────────────────────────────────────────

const TIME_BEHAVIOR: Record<TimeOfDay, string> = {
  sunrise: "Sunrise: coffee, hikes, breakfast, wellness, sunrise photo spot.",
  morning: "Morning: breakfast, coffee, hikes, wellness, markets.",
  brunch: "Brunch: brunch, mimosas, shopping, photos. Day party optional.",
  afternoon: "Afternoon: museums, shopping, activities, sightseeing.",
  after_work: "After-work: dinner, wine bar, lounge, one light activity.",
  evening: "Evening: dinner, rooftop, show, dessert.",
  late_night: "Late-night: clubs, lounges, casino, late-night food.",
  all_day: "All-day: 5–7 stops with breaks and pacing across morning → night.",
  weekend: "Weekend: mix daytime social moments + an evening anchor.",
};

export function timeOfDayEngine(t?: TimeOfDay | null) {
  if (!t) return null;
  return {
    id: t,
    directive: `Time-of-day engine — ${TIME_BEHAVIOR[t]} Flag opening_hours_warning on any stop that might be closed at that time.`,
  };
}

// ── Engine 6: Safety & Comfort ────────────────────────────────────

export function safetyComfortEngine(modes: SafetyMode[]) {
  if (!modes.length) return null;
  const sensitive = modes.some((m) =>
    ["in_laws", "family", "meet_parents", "coworker", "first_date", "solo_women", "older_group", "conservative"].includes(m),
  );
  const notes: string[] = [];
  if (modes.includes("in_laws") || modes.includes("meet_parents"))
    notes.push("Calm and conversation-friendly — chosen for in-laws / parents.");
  if (modes.includes("family")) notes.push("All-ages safe — no adult venues.");
  if (modes.includes("coworker")) notes.push("Coworker-appropriate — low-risk, professional.");
  if (modes.includes("solo") || modes.includes("solo_women"))
    notes.push("Solo-safe — walkable, well-lit, easy rideshare.");
  if (modes.includes("first_date")) notes.push("First-date friendly — conversation > chaos.");

  return {
    notes: notes.join(" "),
    directive: [
      `Safety modes active: ${modes.join(", ")}.`,
      sensitive
        ? "Avoid unsafe areas, chaotic venues, adult entertainment (default OFF), heavy drinking. Prefer well-lit, walkable, rideshare-friendly stops."
        : "Standard safety filters apply.",
      "Special rules: gun ranges → no alcohol BEFORE; casinos → adult-only + responsible gambling copy; adult entertainment → never default.",
    ].join(" "),
  };
}

// ── Engine 7: Local Flavor ────────────────────────────────────────

export function localFlavorEngine(cityCtx: CityContext, level: LocalFlavorLevel = "medium") {
  const neighborhoods = cityCtx.signatureNeighborhoods ?? cityCtx.neighborhoods.map((n) => n.name);
  const sigExperiences = cityCtx.signatureExperiences ?? [];
  const tags = [
    ...neighborhoods.slice(0, 3).map((n) => `📍 ${n}`),
    ...sigExperiences.slice(0, 3).map((s) => `✨ ${s}`),
  ];

  const intensity =
    level === "heavy"
      ? "Lead with local slang, neighborhoods, hidden gems, iconic local moments in EVERY stop's rationale."
      : level === "light"
        ? "Lightly sprinkle one local reference across the night."
        : "Reference at least one local neighborhood and one signature experience.";

  return {
    tags,
    note: `Local flavor: ${neighborhoods.slice(0, 2).join(" · ")}${sigExperiences[0] ? ` · ${sigExperiences[0]}` : ""}.`,
    directive: [
      `Local flavor engine (${level}) — ${intensity}`,
      `Signature neighborhoods: ${neighborhoods.join(", ")}.`,
      sigExperiences.length ? `Signature experiences: ${sigExperiences.slice(0, 4).join(" · ")}.` : "",
    ]
      .filter(Boolean)
      .join(" "),
  };
}

// ── Composer ──────────────────────────────────────────────────────

export type V6Input = {
  personality?: PersonalityId | null;
  budgetMode?: BudgetMode;
  perPersonBudgetUsd?: number;
  budgetTier: 1 | 2 | 3 | 4;
  groupSize: number;
  groupType?: GroupType | null;
  timeOfDay?: TimeOfDay | null;
  safetyModes?: SafetyMode[];
  localFlavorLevel?: LocalFlavorLevel;
  weatherAware?: boolean;
  forecast?: ServerForecast | null;
  cityCtx: CityContext;
};

export type V6Result = {
  directive: string;
  personalityTone?: string;
  budgetSummary: string;
  perPersonEstimate: string;
  groupTotalEstimate: string;
  weatherNotes?: string;
  safetyNotes?: string;
  localFlavorNotes?: string;
  localFlavorTags: string[];
  reservationRecommended: boolean;
  transportationNote: string;
  pacingStyle: string;
};

export function runV6Engines(input: V6Input): V6Result {
  const personality = personalityEngine(input.personality);
  const budget = budgetSmartEngine({
    perPersonBudgetUsd: input.perPersonBudgetUsd,
    budgetTier: input.budgetTier,
    groupSize: input.groupSize,
    mode: input.budgetMode,
  });
  const group = groupDynamicsEngine(input.groupSize, input.groupType);
  const weather = input.weatherAware ? weatherEngineFromForecast(input.forecast ?? null) : null;
  const time = timeOfDayEngine(input.timeOfDay);
  const safety = safetyComfortEngine(input.safetyModes ?? []);
  const local = localFlavorEngine(input.cityCtx, input.localFlavorLevel ?? "medium");

  const directive = [
    "# Confetti v6 — engine directives (must be honored)",
    personality?.directive,
    budget.directive,
    group.directive,
    weather?.directive,
    time?.directive,
    safety?.directive,
    local.directive,
    "Promo-safe rule: NEVER expose words like sponsored, promoted, ad, paid, partner, boosted, or 'featured because paid'. All user-facing copy treats every stop as a neutral pick.",
  ]
    .filter(Boolean)
    .join("\n");

  return {
    directive,
    personalityTone: personality?.tone,
    budgetSummary: budget.budgetSummary,
    perPersonEstimate: budget.perPersonEstimate,
    groupTotalEstimate: budget.groupTotalEstimate,
    weatherNotes: weather?.note,
    safetyNotes: safety?.notes,
    localFlavorNotes: local.note,
    localFlavorTags: local.tags,
    reservationRecommended: group.reservationRecommended,
    transportationNote: group.transportationNote,
    pacingStyle: group.pacingStyle,
  };
}

// Convenience exports for UI option lists.
export const PERSONALITY_OPTIONS: { id: PersonalityId; label: string; emoji: string }[] = [
  { id: "classy", label: "Classy", emoji: "🥂" },
  { id: "chaotic", label: "Chaotic", emoji: "🎉" },
  { id: "soft_life", label: "Soft Life", emoji: "🤍" },
  { id: "bougie", label: "Bougie", emoji: "💎" },
  { id: "adventurous", label: "Adventurous", emoji: "🎢" },
  { id: "romantic", label: "Romantic", emoji: "💋" },
  { id: "corporate", label: "Corporate", emoji: "💼" },
  { id: "family_friendly", label: "Family", emoji: "👨‍👩‍👧" },
  { id: "genz_playful", label: "Gen-Z", emoji: "📸" },
  { id: "luxury_concierge", label: "Luxury", emoji: "🛎️" },
  { id: "calm", label: "Calm", emoji: "🌙" },
  { id: "local_friend", label: "Local", emoji: "📍" },
];

export const BUDGET_MODE_OPTIONS: { id: BudgetMode; label: string }[] = [
  { id: "save", label: "Save Money" },
  { id: "balanced", label: "Balanced" },
  { id: "upgrade", label: "Upgrade Me" },
];

export const GROUP_TYPE_OPTIONS: { id: GroupType; label: string }[] = [
  { id: "friends", label: "Friends" },
  { id: "couples", label: "Couples" },
  { id: "in_laws", label: "In-Laws" },
  { id: "coworkers", label: "Coworkers" },
  { id: "family", label: "Family" },
  { id: "bachelor", label: "Bachelor" },
  { id: "bachelorette", label: "Bachelorette" },
  { id: "solo", label: "Solo" },
];

export const TIME_OF_DAY_OPTIONS: { id: TimeOfDay; label: string }[] = [
  { id: "sunrise", label: "Sunrise" },
  { id: "morning", label: "Morning" },
  { id: "brunch", label: "Brunch" },
  { id: "afternoon", label: "Afternoon" },
  { id: "after_work", label: "After Work" },
  { id: "evening", label: "Evening" },
  { id: "late_night", label: "Late Night" },
  { id: "all_day", label: "All Day" },
  { id: "weekend", label: "Weekend" },
];

export const SAFETY_MODE_OPTIONS: { id: SafetyMode; label: string }[] = [
  { id: "in_laws", label: "In-Laws" },
  { id: "family", label: "Family" },
  { id: "meet_parents", label: "Meet Parents" },
  { id: "coworker", label: "Coworker" },
  { id: "solo", label: "Solo" },
  { id: "solo_women", label: "Solo Women" },
  { id: "first_date", label: "First Date" },
  { id: "older_group", label: "Older Group" },
  { id: "conservative", label: "Conservative" },
];

export const LOCAL_FLAVOR_LEVELS: { id: LocalFlavorLevel; label: string }[] = [
  { id: "light", label: "Light" },
  { id: "medium", label: "Medium" },
  { id: "heavy", label: "Heavy" },
];
