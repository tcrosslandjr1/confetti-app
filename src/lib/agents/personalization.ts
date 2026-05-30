// Confetti v7 — Personalization Engine
// Aggregates signals into a learned profile and exposes smart defaults.

export type IdentityContext =
  | "lgbtq"
  | "ally"
  | "queer_woman"
  | "queer_man"
  | "trans"
  | "nonbinary"
  | null;

export type PersonalizationProfile = {
  preferred_vibes: string[];
  preferred_categories: string[];
  disliked_categories: string[];
  preferred_price_tier: number | null;
  preferred_time_slots: string[];
  preferred_neighborhoods: string[];
  preferred_business_types: string[];
  disliked_business_types: string[];
  favorite_city_features: string[];
  risk_tolerance: "low" | "medium" | "high";
  nightlife_intensity: "low" | "medium" | "high";
  comfort_level: "low" | "medium" | "high";
  promo_sensitivity: "low" | "medium" | "high";
  personalized_name_style: string;
  adult_opt_in: boolean;
  /** Optional self-identified context — drives safe-venue routing & event matching. */
  identity_context: IdentityContext;
  /** When true, prioritize lgbtq_safe venues and surface pride/drag/ballroom events. */
  lgbtq_safe_mode: boolean;
};

export const DEFAULT_PROFILE: PersonalizationProfile = {
  preferred_vibes: [],
  preferred_categories: [],
  disliked_categories: [],
  preferred_price_tier: null,
  preferred_time_slots: [],
  preferred_neighborhoods: [],
  preferred_business_types: [],
  disliked_business_types: [],
  favorite_city_features: [],
  risk_tolerance: "medium",
  nightlife_intensity: "medium",
  comfort_level: "medium",
  promo_sensitivity: "medium",
  personalized_name_style: "playful",
  adult_opt_in: false,
  identity_context: null,
  lgbtq_safe_mode: false,
};

type Signal = { signal_type: string; payload: Record<string, unknown>; city: string | null };

function topK(items: string[], k: number): string[] {
  const counts = new Map<string, number>();
  for (const it of items) counts.set(it, (counts.get(it) ?? 0) + 1);
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, k)
    .map(([v]) => v);
}

/** Learn a profile from raw signal rows (most recent first). */
export function learnProfileFromSignals(
  signals: Signal[],
  base: PersonalizationProfile = DEFAULT_PROFILE,
): PersonalizationProfile {
  const vibes: string[] = [];
  const cats: string[] = [];
  const dislikedCats: string[] = [];
  const slots: string[] = [];
  const hoods: string[] = [];
  const bizLiked: string[] = [];
  const bizDisliked: string[] = [];
  const prices: number[] = [];
  let promoClicks = 0;
  let promoDismisses = 0;

  for (const s of signals) {
    const p = s.payload || {};
    switch (s.signal_type) {
      case "vibe_chosen":
        if (typeof p.vibe === "string") vibes.push(p.vibe);
        break;
      case "category_chosen":
        if (typeof p.category === "string") cats.push(p.category);
        break;
      case "venue_liked":
        if (typeof p.category === "string") bizLiked.push(p.category);
        break;
      case "venue_disliked":
      case "step_swapped":
        if (typeof p.category === "string") bizDisliked.push(p.category);
        if (typeof p.category === "string") dislikedCats.push(p.category);
        break;
      case "time_of_day":
        if (typeof p.slot === "string") slots.push(p.slot);
        break;
      case "neighborhood":
        if (typeof p.name === "string") hoods.push(p.name);
        break;
      case "budget":
        if (typeof p.tier === "number") prices.push(p.tier);
        break;
      case "promo_clicked":
        promoClicks++;
        break;
      case "promo_dismissed":
        promoDismisses++;
        break;
      case "identity_set":
        // identity_context is set explicitly by user, not learned from frequency
        break;
    }
  }

  // Identity context: use most recent explicit signal if present
  const identitySignal = signals.find((s) => s.signal_type === "identity_set");
  const identityContext =
    (identitySignal?.payload?.identity as IdentityContext) ?? base.identity_context;
  const lgbtqSafe =
    identityContext != null && identityContext !== "ally" ? true : base.lgbtq_safe_mode;

  const avgPrice = prices.length
    ? Math.round(prices.reduce((a, b) => a + b, 0) / prices.length)
    : null;
  const promoSens: "low" | "medium" | "high" =
    promoDismisses > promoClicks * 2 ? "low" : promoClicks > promoDismisses * 2 ? "high" : "medium";

  return {
    ...base,
    preferred_vibes: topK(vibes, 5),
    preferred_categories: topK(cats, 5),
    disliked_categories: topK(dislikedCats, 5),
    preferred_price_tier: avgPrice ?? base.preferred_price_tier,
    preferred_time_slots: topK(slots, 3),
    preferred_neighborhoods: topK(hoods, 5),
    preferred_business_types: topK(bizLiked, 8),
    disliked_business_types: topK(bizDisliked, 8),
    promo_sensitivity: promoSens,
    identity_context: identityContext,
    lgbtq_safe_mode: lgbtqSafe,
  };
}

/** Smart defaults the planner uses to pre-fill form fields. */
export function getDefaultsFromProfile(profile: PersonalizationProfile) {
  return {
    defaultVibe: profile.preferred_vibes[0],
    defaultCategory: profile.preferred_categories[0],
    defaultBudgetTier: profile.preferred_price_tier ?? undefined,
    defaultTimeOfDay: profile.preferred_time_slots[0],
    nameStyle: profile.personalized_name_style,
    avoidCategories: profile.disliked_categories,
  };
}

/** Filter inputs for safety — never personalize toward adult/risky unless opted in. */
export function applySafetyGuards<T extends { vibeLabel?: string; occasionLabel?: string }>(
  input: T,
  profile: PersonalizationProfile,
): T {
  if (profile.adult_opt_in) return input;
  const blocked = /strip|casino|adult|18\+|21\+/i;
  return {
    ...input,
    vibeLabel: input.vibeLabel && blocked.test(input.vibeLabel) ? undefined : input.vibeLabel,
    occasionLabel:
      input.occasionLabel && blocked.test(input.occasionLabel) ? undefined : input.occasionLabel,
  };
}
