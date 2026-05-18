// Confetti v9 — Organic Promo Engine
// Selects partner deals that fit the plan context without overriding safety/vibe/budget.

import type { GeneratedPlan, PlanStop } from "./types";
import type { PersonalizationProfile } from "./personalization";

export type PartnerDeal = {
  id: string;
  venue_id: string | null;
  venue_name: string | null;
  city: string | null;
  deal_type: "save" | "upgrade" | "time_limited" | "optional";
  title: string;
  description: string | null;
  vibe_tags: string[];
  category_tags: string[];
  group_size_min: number;
  group_size_max: number;
  budget_tier_min: number;
  budget_tier_max: number;
  adult_only: boolean;
  family_safe: boolean;
  valid_from: string | null;
  valid_until: string | null;
};

export type PromoStep = {
  dealId: string;
  attachedToStopId?: string;
  label: "optional" | "upgrade" | "deal" | "save" | "available offer";
  title: string;
  description: string | null;
  disclosure: string;
  fitScore: number;
  nonPromoAlternative?: { name: string; reason: string };
};

export type PromoSelection = {
  promoSteps: PromoStep[];
  disclosures: string[];
};

const ALLOWED_LABELS: PromoStep["label"][] = [
  "optional",
  "upgrade",
  "deal",
  "save",
  "available offer",
];

type Filters = {
  vibe?: string;
  category?: string;
  budgetTier: number;
  groupSize: number;
  safetyModes: string[];
  adultOptIn: boolean;
};

function isSensitive(safety: string[]) {
  return safety.some((s) => ["in_laws", "family", "meet_parents", "coworker"].includes(s));
}

function labelFor(type: PartnerDeal["deal_type"]): PromoStep["label"] {
  switch (type) {
    case "save":
      return "save";
    case "upgrade":
      return "upgrade";
    case "time_limited":
      return "deal";
    default:
      return "optional";
  }
}

function score(deal: PartnerDeal, plan: GeneratedPlan, f: Filters): number {
  let s = 0.5;
  const vibe = (f.vibe ?? plan.vibeLabel ?? "").toLowerCase();
  if (deal.vibe_tags.some((t) => vibe.includes(t.toLowerCase()))) s += 0.2;
  const cats = plan.stops.map((st: PlanStop) => st.type.toLowerCase());
  if (deal.category_tags.some((t) => cats.some((c) => c.includes(t.toLowerCase())))) s += 0.2;
  if (f.budgetTier >= deal.budget_tier_min && f.budgetTier <= deal.budget_tier_max) s += 0.1;
  return Math.min(1, s);
}

export function selectPromos(
  plan: GeneratedPlan,
  deals: PartnerDeal[],
  profile: PersonalizationProfile | null,
  filters: Filters,
): PromoSelection {
  // Hard filters: never override safety/budget/vibe/family-mode/adult-only rules.
  const sensitive = isSensitive(filters.safetyModes);
  const promoSens = profile?.promo_sensitivity ?? "medium";
  if (promoSens === "low") return { promoSteps: [], disclosures: [] };

  const candidates = deals.filter((d) => {
    if (d.adult_only && !filters.adultOptIn) return false;
    if (sensitive && !d.family_safe) return false;
    if (filters.groupSize < d.group_size_min || filters.groupSize > d.group_size_max) return false;
    if (filters.budgetTier < d.budget_tier_min || filters.budgetTier > d.budget_tier_max)
      return false;
    const now = Date.now();
    if (d.valid_from && new Date(d.valid_from).getTime() > now) return false;
    if (d.valid_until && new Date(d.valid_until).getTime() < now) return false;
    return true;
  });

  const ranked = candidates
    .map((d) => ({ d, s: score(d, plan, filters) }))
    .sort((a, b) => b.s - a.s)
    .slice(0, 2); // max 2 promos per itinerary

  const promoSteps: PromoStep[] = ranked
    .map(({ d, s }) => {
      const attached = plan.stops.find((st) =>
        d.category_tags.some((t) => st.type.toLowerCase().includes(t.toLowerCase())),
      );
      const label = labelFor(d.deal_type);
      if (!ALLOWED_LABELS.includes(label)) {
        // Defensive: never leak forbidden labels.
        return null as unknown as PromoStep;
      }
      return {
        dealId: d.id,
        attachedToStopId: attached?.id,
        label,
        title: d.title,
        description: d.description,
        disclosure: "This step includes a partner deal.",
        fitScore: s,
        nonPromoAlternative: attached
          ? {
              name: attached.name,
              reason: "Keep your original pick — same vibe, no deal attached.",
            }
          : undefined,
      };
    })
    .filter(Boolean);

  return {
    promoSteps,
    disclosures: promoSteps.map((p) => p.disclosure),
  };
}
