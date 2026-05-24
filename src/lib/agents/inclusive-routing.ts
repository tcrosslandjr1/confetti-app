// Confetti — Inclusive Routing Engine
// Bridges PersonalizationProfile → category selection so that lgbtq_safe_mode,
// identity_context, and gendered categories all route correctly.

import type { PersonalizationProfile, IdentityContext } from "./personalization";
import type { OutingCategory } from "./outing-categories";

/**
 * LGBTQ+ category IDs — used to boost these into results when lgbtq_safe_mode is on.
 */
const LGBTQ_CATEGORY_IDS = [
  "pride_night",
  "queer_date",
  "drag_brunch",
  "ballroom_night",
  "chosen_family_night",
  "queer_comedy",
  "sapphic_night",
  "bear_night",
  "trans_safe_night",
  "queer_wellness",
] as const;

/**
 * Gendered category aliases — when lgbtq_safe_mode is on, gendered categories
 * get expanded with queer equivalents so the user sees inclusive options.
 * Key: original category, Value: inclusive alternative(s) to also surface.
 */
const GENDERED_ALTERNATIVES: Record<string, string[]> = {
  girls_night: ["sapphic_night", "pride_night", "chosen_family_night"],
  guys_night: ["bear_night", "pride_night", "chosen_family_night"],
  couples_night: ["queer_date"],
  double_date: ["queer_date", "chosen_family_night"],
  bachelorette: ["pride_night", "drag_brunch"],
  bachelor: ["pride_night", "bear_night"],
};

/**
 * Identity-specific boosts — certain identities get priority categories surfaced.
 */
const IDENTITY_BOOSTS: Record<Exclude<IdentityContext, null | "ally">, string[]> = {
  lgbtq: ["pride_night", "chosen_family_night", "queer_date", "drag_brunch"],
  queer_woman: ["sapphic_night", "queer_date", "drag_brunch", "chosen_family_night"],
  queer_man: ["bear_night", "pride_night", "ballroom_night", "chosen_family_night"],
  trans: ["trans_safe_night", "chosen_family_night", "queer_wellness", "queer_date"],
  nonbinary: ["chosen_family_night", "trans_safe_night", "queer_wellness", "pride_night"],
};

/**
 * Given a user's profile and a set of candidate categories, re-rank and expand
 * to ensure inclusive coverage. Does NOT remove anything — only adds and boosts.
 */
export function applyInclusiveRouting(
  profile: PersonalizationProfile,
  candidateIds: string[],
  allCategories: OutingCategory[],
): string[] {
  if (!profile.lgbtq_safe_mode) return candidateIds;

  const result = new Set(candidateIds);
  const allIds = new Set(allCategories.map((c) => c.id));

  // 1. Expand gendered categories with inclusive alternatives
  for (const id of candidateIds) {
    const alts = GENDERED_ALTERNATIVES[id];
    if (alts) {
      for (const alt of alts) {
        if (allIds.has(alt)) result.add(alt);
      }
    }
  }

  // 2. Apply identity boosts — inject top-priority categories for this identity
  const identity = profile.identity_context;
  if (identity && identity !== "ally") {
    const boosts = IDENTITY_BOOSTS[identity];
    if (boosts) {
      for (const id of boosts) {
        if (allIds.has(id)) result.add(id);
      }
    }
  }

  return Array.from(result);
}

/**
 * Filter out categories that conflict with a trans user's safety needs.
 * For example, venues requiring strict gender-matching ID checks.
 */
export function filterForTransSafety(
  categoryIds: string[],
  allCategories: OutingCategory[],
): string[] {
  return categoryIds.filter((id) => {
    const cat = allCategories.find((c) => c.id === id);
    if (!cat) return false;
    // If the venue types include strip_club and the category isn't explicitly trans_safe,
    // it may have hostile ID policies. Exclude unless it has trans_affirming filter.
    if (
      cat.venueTypes.includes("strip_club") &&
      !cat.safetyFilters.includes("trans_affirming")
    ) {
      return false;
    }
    return true;
  });
}

/**
 * Build the safety filter directive string that gets appended to the LLM prompt
 * when lgbtq_safe_mode is active.
 */
export function buildLgbtqSafetyDirective(profile: PersonalizationProfile): string | null {
  if (!profile.lgbtq_safe_mode) return null;

  const parts: string[] = [
    "LGBTQ+ SAFE MODE ACTIVE:",
    "- Only recommend venues known to be LGBTQ+-friendly or inclusive",
    "- Avoid areas known for hostility toward LGBTQ+ people",
    "- Prefer venues with inclusive staff training or community reputation",
  ];

  if (profile.identity_context === "trans" || profile.identity_context === "nonbinary") {
    parts.push(
      "- TRANS SAFETY: Avoid venues with gendered ID checks at door",
      "- Prefer venues with all-gender restrooms",
      "- Prioritize trans-affirming businesses with explicit inclusion policies",
    );
  }

  if (profile.identity_context === "queer_woman") {
    parts.push("- Prioritize sapphic/WLW-friendly spaces when available");
  }

  if (profile.identity_context === "queer_man") {
    parts.push("- Include bear/leather/queer men spaces when matching vibe");
  }

  return parts.join("\n");
}

/**
 * Determine if a "Surprise Me" flow should pull from the LGBTQ+ idea library.
 */
export function shouldUseLgbtqSurprises(profile: PersonalizationProfile): boolean {
  return profile.lgbtq_safe_mode && profile.identity_context !== "ally";
}

/**
 * Get recommended LGBTQ+ categories based on vibe and identity — used by
 * the Surprise Me flow when no specific category is selected.
 */
export function getRecommendedLgbtqCategories(
  profile: PersonalizationProfile,
  requestedVibes: string[],
): string[] {
  if (!profile.lgbtq_safe_mode) return [];

  const vibeSet = new Set(requestedVibes);
  const recs: string[] = [];

  // Vibe-based matching
  if (vibeSet.has("romantic") || vibeSet.has("soft_life")) recs.push("queer_date");
  if (vibeSet.has("turn_up") || vibeSet.has("wild")) recs.push("pride_night", "ballroom_night");
  if (vibeSet.has("social") || vibeSet.has("chill")) recs.push("chosen_family_night");
  if (vibeSet.has("instagrammy")) recs.push("drag_brunch", "sapphic_night");
  if (vibeSet.has("live_music")) recs.push("ballroom_night", "queer_comedy");
  if (vibeSet.has("wellness") || vibeSet.has("soft_life")) recs.push("queer_wellness");

  // Identity boosts on top
  const identity = profile.identity_context;
  if (identity && identity !== "ally") {
    const boosts = IDENTITY_BOOSTS[identity];
    if (boosts) recs.push(...boosts);
  }

  // Dedupe + return max 5
  return Array.from(new Set(recs)).slice(0, 5);
}
