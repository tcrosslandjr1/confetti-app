/**
 * Taste Profile Server — loads the computed taste intelligence
 * for a given user from the taste_profiles + user_preferences tables.
 *
 * This is the bridge between the taste learning engine (user-intelligence.ts)
 * and the production /api/chat route. It reads server-side using supabaseAdmin
 * so no client-side prefs need to be passed in the request body.
 */
import { supabaseAdmin } from "@/integrations/supabase/client.server";

// ─── Types ──────────────────────────────────────────────────────

interface TasteScores {
  cuisine_scores: Record<string, number>;
  vibe_scores: Record<string, number>;
  price_preference: string | number; // DB stores text ($/$$/$$$/$$$$) or numeric
  time_patterns: Record<string, number>;
  neighborhood_scores: Record<string, number>;
  occasion_scores: Record<string, number>;
  adventure_score: number;
  social_score: number;
  event_count: number;
}

interface ExplicitPrefs {
  cuisines?: string[] | null;
  activities?: string[] | null;
  budget_min?: number | null;
  budget_max?: number | null;
  taste_profile?: {
    diet?: string | null;
    allergens?: string[] | null;
    vibe?: string[] | null;
    drink?: string | null;
    dress?: string | null;
    loves?: string[] | null;
    avoid?: string[] | null;
  } | null;
  about_me?: string | null;
}

export interface UserTasteContext {
  /** Top cuisines the user gravitates toward (from behavior) */
  topCuisines: string[];
  /** Top vibes/atmospheres preferred */
  topVibes: string[];
  /** Price comfort: 1=budget, 2=mid, 3=upscale, 4=luxury */
  priceLevel: number;
  /** Adventure appetite: 0=safe picks only, 1=loves exploring */
  adventureScore: number;
  /** Social preference: 0=solo/intimate, 1=big groups/loud */
  socialScore: number;
  /** Best time slots based on behavior (e.g., "dinner", "late night") */
  activeTimeSlots: string[];
  /** Top neighborhoods by engagement */
  topNeighborhoods: string[];
  /** Explicit hard constraints */
  diet: string | null;
  allergens: string[];
  /** Loved / avoided categories from explicit + confirmed signals */
  loves: string[];
  avoids: string[];
  /** How much data we have (low < 10, medium 10-50, high > 50) */
  profileStrength: "cold" | "warming" | "strong";
  /** Budget from explicit prefs */
  budgetMin: number | null;
  budgetMax: number | null;
  /** Free-text about user */
  aboutMe: string | null;
}

// ─── Helpers ────────────────────────────────────────────────────

function topN(scores: Record<string, number>, n: number): string[] {
  return Object.entries(scores)
    .filter(([, v]) => v > 0.1)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([k]) => k);
}

function priceBucket(score: string | number): number {
  // Handle text format from DB: $, $$, $$$, $$$$
  if (typeof score === "string") {
    const len = score.replace(/[^$]/g, "").length;
    return len >= 1 && len <= 4 ? len : 2;
  }
  if (score <= 1.5) return 1;
  if (score <= 2.5) return 2;
  if (score <= 3.5) return 3;
  return 4;
}

function profileStrength(eventCount: number): "cold" | "warming" | "strong" {
  if (eventCount < 10) return "cold";
  if (eventCount < 50) return "warming";
  return "strong";
}

// ─── Main Loader ────────────────────────────────────────────────

/**
 * Load full taste context for a user server-side.
 * Combines computed behavioral profile + explicit preferences.
 * Returns null if user not found.
 */
export async function loadUserTasteContext(userId: string): Promise<UserTasteContext | null> {
  // Parallel fetch: computed profile + explicit prefs
  const [profileRes, prefsRes] = await Promise.all([
    supabaseAdmin.from("taste_profiles").select("*").eq("user_id", userId).maybeSingle(),
    supabaseAdmin.from("user_preferences").select("*").eq("user_id", userId).maybeSingle(),
  ]);

  const profile = profileRes.data as TasteScores | null;
  const prefs = prefsRes.data as ExplicitPrefs | null;

  // If no profile AND no prefs, return cold context
  if (!profile && !prefs) {
    return {
      topCuisines: [],
      topVibes: [],
      priceLevel: 2,
      adventureScore: 0.5,
      socialScore: 0.5,
      activeTimeSlots: [],
      topNeighborhoods: [],
      diet: null,
      allergens: [],
      loves: [],
      avoids: [],
      profileStrength: "cold",
      budgetMin: null,
      budgetMax: null,
      aboutMe: null,
    };
  }

  const taste = prefs?.taste_profile;

  return {
    topCuisines: profile ? topN(profile.cuisine_scores ?? {}, 5) : (prefs?.cuisines ?? []),
    topVibes: profile ? topN(profile.vibe_scores ?? {}, 4) : (taste?.vibe ?? []),
    priceLevel: profile
      ? priceBucket(profile.price_preference ?? 2)
      : prefs?.budget_max
        ? prefs.budget_max > 100
          ? 3
          : 2
        : 2,
    adventureScore: profile?.adventure_score ?? 0.5,
    socialScore: profile?.social_score ?? 0.5,
    activeTimeSlots: profile ? topN(profile.time_patterns ?? {}, 3) : [],
    topNeighborhoods: profile ? topN(profile.neighborhood_scores ?? {}, 4) : [],
    diet: taste?.diet ?? null,
    allergens: taste?.allergens ?? [],
    loves: [...(taste?.loves ?? []), ...(prefs?.cuisines ?? []), ...(prefs?.activities ?? [])],
    avoids: taste?.avoid ?? [],
    profileStrength: profileStrength(profile?.event_count ?? 0),
    budgetMin: prefs?.budget_min ?? null,
    budgetMax: prefs?.budget_max ?? null,
    aboutMe: prefs?.about_me ?? null,
  };
}

// ─── Prompt Builder ─────────────────────────────────────────────

/**
 * Generates a taste-aware context block to inject into the system prompt.
 * Adapts verbosity based on profile strength.
 */
export function buildTastePromptBlock(ctx: UserTasteContext): string {
  const lines: string[] = [];

  // Hard constraints always come first
  if (ctx.diet) lines.push(`Diet: ${ctx.diet} (HARD CONSTRAINT — never violate)`);
  if (ctx.allergens.length)
    lines.push(`Allergens: ${ctx.allergens.join(", ")} (HARD CONSTRAINT — life-threatening)`);

  if (ctx.profileStrength === "cold") {
    // New user — don't over-assume
    if (ctx.loves.length) lines.push(`Stated interests: ${ctx.loves.join(", ")}`);
    if (ctx.budgetMax) lines.push(`Budget: $${ctx.budgetMin ?? 0}–$${ctx.budgetMax} per person`);
    if (ctx.aboutMe) lines.push(`About them: ${ctx.aboutMe.slice(0, 200)}`);
    lines.push(`(New user — still learning their taste. Ask clarifying questions.)`);
    return lines.join("\n");
  }

  // Warming or strong profile — inject behavioral intelligence
  if (ctx.topCuisines.length) lines.push(`Gravitates toward: ${ctx.topCuisines.join(", ")}`);
  if (ctx.topVibes.length) lines.push(`Preferred vibes: ${ctx.topVibes.join(", ")}`);
  if (ctx.topNeighborhoods.length)
    lines.push(`Favorite neighborhoods: ${ctx.topNeighborhoods.join(", ")}`);

  const priceLabel = ["", "budget-friendly", "mid-range", "upscale", "luxury"][ctx.priceLevel];
  lines.push(`Price comfort: ${priceLabel}`);

  if (ctx.adventureScore > 0.7) lines.push(`Loves trying new things — surprise them!`);
  else if (ctx.adventureScore < 0.3) lines.push(`Prefers familiar favorites over experiments.`);

  if (ctx.socialScore > 0.7) lines.push(`Social butterfly — think groups, energy, buzz.`);
  else if (ctx.socialScore < 0.3) lines.push(`Prefers intimate, quiet, low-key settings.`);

  if (ctx.activeTimeSlots.length) lines.push(`Most active: ${ctx.activeTimeSlots.join(", ")}`);

  if (ctx.loves.length) lines.push(`Explicitly loves: ${ctx.loves.slice(0, 8).join(", ")}`);
  if (ctx.avoids.length) lines.push(`Avoids: ${ctx.avoids.join(", ")}`);

  if (ctx.budgetMax) lines.push(`Budget: $${ctx.budgetMin ?? 0}–$${ctx.budgetMax} per person`);
  if (ctx.aboutMe) lines.push(`About them: ${ctx.aboutMe.slice(0, 200)}`);

  if (ctx.profileStrength === "strong")
    lines.push(`(Strong profile — 50+ interactions. Trust these signals heavily.)`);

  return lines.join("\n");
}
