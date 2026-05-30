/**
 * Pricing Agent
 *
 * Subscription modeling, ad rates, promo pricing for Confetti.
 * AI recommends pricing optimizations, Tyrone decides.
 *
 * Features:
 *   - Multi-tier pricing plans (consumer + business)
 *   - A/B pricing experiments with conversion tracking
 *   - Promo code management with redemption limits
 *   - AI-generated pricing suggestions based on plan performance
 *   - MRR projections and revenue modeling
 *   - Pricing dashboard with all active plans, experiments, and promos
 */

import { supabase } from "../supabase";

// ═══════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════

export type PricingModel = "subscription" | "credits" | "commission" | "flat_fee" | "freemium";
export type PlanType = "consumer" | "business";

export interface PricingPlan {
  id: string;
  name: string;
  type: PlanType;
  model: PricingModel;
  price: number;
  billingCycle: "monthly" | "annual" | "one_time";
  features: string[];
  limits: Record<string, number>;
  isActive: boolean;
  subscriberCount: number;
  mrr: number;
  createdAt: string;
  updatedAt: string;
}

export interface PricingExperiment {
  id: string;
  name: string;
  description: string;
  controlPlanId: string;
  variantPlanId: string;
  trafficSplit: number;
  status: "draft" | "running" | "completed" | "cancelled";
  startDate?: string;
  endDate?: string;
  controlConversion: number;
  variantConversion: number;
  controlRevenue: number;
  variantRevenue: number;
  winner?: "control" | "variant" | "inconclusive";
}

export interface PromoCode {
  id: string;
  code: string;
  discountType: "percent" | "flat" | "trial_extension";
  discountValue: number;
  maxRedemptions: number;
  currentRedemptions: number;
  validFrom: string;
  validUntil: string;
  applicablePlans: string[];
  isActive: boolean;
}

export interface PricingSuggestion {
  type: "price_change" | "new_tier" | "promo" | "sunset";
  description: string;
  rationale: string;
  estimatedImpact: string;
  confidence: "high" | "medium" | "low";
}

export interface RevenueProjection {
  period: string;
  currentMRR: number;
  projectedMRR: number;
  assumptions: string[];
}

// ═══════════════════════════════════════════════════════════
// In-Memory Store (local-first)
// ═══════════════════════════════════════════════════════════

const planStore = new Map<string, PricingPlan>();
const experimentStore = new Map<string, PricingExperiment>();
const promoStore = new Map<string, PromoCode>();
const redemptionLog = new Map<string, string[]>(); // promoId -> userId[]

let idCounter = 10000;
function nextId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${(idCounter++).toString(36)}`;
}

// ═══════════════════════════════════════════════════════════
// Plan Management
// ═══════════════════════════════════════════════════════════

/** Create a new pricing plan */
export function createPlan(
  name: string,
  type: PlanType,
  model: PricingModel,
  price: number,
  billingCycle: "monthly" | "annual" | "one_time",
  features: string[],
  limits: Record<string, number>,
): PricingPlan {
  const plan: PricingPlan = {
    id: nextId("plan"),
    name,
    type,
    model,
    price,
    billingCycle,
    features,
    limits,
    isActive: true,
    subscriberCount: 0,
    mrr: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  planStore.set(plan.id, plan);
  return plan;
}

/** Update plan — REQUIRES ADMIN for price changes */
export function updatePlan(
  planId: string,
  updates: Partial<Pick<PricingPlan, "name" | "price" | "features" | "limits" | "billingCycle">>,
): PricingPlan | null {
  const plan = planStore.get(planId);
  if (!plan) return null;

  if (updates.name !== undefined) plan.name = updates.name;
  if (updates.price !== undefined) plan.price = updates.price;
  if (updates.features !== undefined) plan.features = updates.features;
  if (updates.limits !== undefined) plan.limits = updates.limits;
  if (updates.billingCycle !== undefined) plan.billingCycle = updates.billingCycle;

  // Recalculate MRR
  if (updates.price !== undefined) {
    plan.mrr =
      plan.billingCycle === "annual"
        ? (plan.price / 12) * plan.subscriberCount
        : plan.billingCycle === "monthly"
          ? plan.price * plan.subscriberCount
          : 0;
  }

  plan.updatedAt = new Date().toISOString();
  return plan;
}

/** Sunset a plan — prevents new signups, existing subscribers remain */
export function deactivatePlan(planId: string): PricingPlan | null {
  const plan = planStore.get(planId);
  if (!plan) return null;

  plan.isActive = false;
  plan.updatedAt = new Date().toISOString();
  return plan;
}

/** Get all active plans, optionally by type */
export function getActivePlans(type?: PlanType): PricingPlan[] {
  const plans = Array.from(planStore.values()).filter((p) => p.isActive);
  if (type) return plans.filter((p) => p.type === type);
  return plans.sort((a, b) => a.price - b.price);
}

/** Get metrics for a specific plan */
export function getPlanMetrics(planId: string): { plan: PricingPlan; churnRate: number } | null {
  const plan = planStore.get(planId);
  if (!plan) return null;

  // Simulated churn rate based on price tier
  const churnRate = plan.price === 0 ? 0 : plan.price < 10 ? 0.05 : plan.price < 100 ? 0.08 : 0.03;

  return { plan, churnRate };
}

// ═══════════════════════════════════════════════════════════
// A/B Pricing Experiments
// ═══════════════════════════════════════════════════════════

/** Create a pricing experiment (A/B test) */
export function createExperiment(
  name: string,
  controlPlanId: string,
  variantPlanId: string,
  trafficSplit: number,
  description?: string,
): PricingExperiment | null {
  if (!planStore.has(controlPlanId) || !planStore.has(variantPlanId)) return null;

  const experiment: PricingExperiment = {
    id: nextId("exp"),
    name,
    description: description ?? `A/B test: ${name}`,
    controlPlanId,
    variantPlanId,
    trafficSplit: Math.min(Math.max(trafficSplit, 0.1), 0.9),
    status: "draft",
    controlConversion: 0,
    variantConversion: 0,
    controlRevenue: 0,
    variantRevenue: 0,
  };

  experimentStore.set(experiment.id, experiment);
  return experiment;
}

/** Start running an experiment */
export function startExperiment(experimentId: string): PricingExperiment | null {
  const exp = experimentStore.get(experimentId);
  if (!exp || exp.status !== "draft") return null;

  exp.status = "running";
  exp.startDate = new Date().toISOString();
  return exp;
}

/** Record a conversion in an experiment */
export function recordExperimentConversion(
  experimentId: string,
  variant: "control" | "variant",
  revenue: number,
): PricingExperiment | null {
  const exp = experimentStore.get(experimentId);
  if (!exp || exp.status !== "running") return null;

  if (variant === "control") {
    exp.controlConversion++;
    exp.controlRevenue += revenue;
  } else {
    exp.variantConversion++;
    exp.variantRevenue += revenue;
  }

  return exp;
}

/** End an experiment and declare a winner */
export function endExperiment(experimentId: string): PricingExperiment | null {
  const exp = experimentStore.get(experimentId);
  if (!exp || exp.status !== "running") return null;

  exp.status = "completed";
  exp.endDate = new Date().toISOString();

  // Determine winner by conversion rate weighted by revenue
  const controlScore = exp.controlConversion > 0 ? exp.controlRevenue / exp.controlConversion : 0;
  const variantScore = exp.variantConversion > 0 ? exp.variantRevenue / exp.variantConversion : 0;
  const totalSamples = exp.controlConversion + exp.variantConversion;

  if (totalSamples < 100) {
    exp.winner = "inconclusive";
  } else if (variantScore > controlScore * 1.1) {
    exp.winner = "variant";
  } else if (controlScore > variantScore * 1.1) {
    exp.winner = "control";
  } else {
    exp.winner = "inconclusive";
  }

  return exp;
}

// ═══════════════════════════════════════════════════════════
// Promo Codes
// ═══════════════════════════════════════════════════════════

/** Create a new promotional code */
export function createPromo(
  code: string,
  discountType: PromoCode["discountType"],
  value: number,
  maxRedemptions: number,
  validFrom: string,
  validUntil: string,
  applicablePlans: string[],
): PromoCode {
  const promo: PromoCode = {
    id: nextId("promo"),
    code: code.toUpperCase(),
    discountType,
    discountValue: value,
    maxRedemptions,
    currentRedemptions: 0,
    validFrom,
    validUntil,
    applicablePlans,
    isActive: true,
  };

  promoStore.set(promo.id, promo);
  redemptionLog.set(promo.id, []);
  return promo;
}

/** Redeem a promo code for a user */
export function redeemPromo(
  code: string,
  userId: string,
): { success: boolean; promo?: PromoCode; error?: string } {
  const promo = Array.from(promoStore.values()).find((p) => p.code === code.toUpperCase());
  if (!promo) return { success: false, error: "Promo code not found" };

  const validation = validatePromo(code);
  if (!validation.valid) return { success: false, error: validation.reason };

  // Check if user already redeemed
  const redeemed = redemptionLog.get(promo.id) ?? [];
  if (redeemed.includes(userId)) {
    return { success: false, error: "User has already redeemed this code" };
  }

  promo.currentRedemptions++;
  redeemed.push(userId);
  redemptionLog.set(promo.id, redeemed);

  if (promo.currentRedemptions >= promo.maxRedemptions) {
    promo.isActive = false;
  }

  return { success: true, promo };
}

/** Validate a promo code */
export function validatePromo(code: string): {
  valid: boolean;
  reason?: string;
  promo?: PromoCode;
} {
  const promo = Array.from(promoStore.values()).find((p) => p.code === code.toUpperCase());
  if (!promo) return { valid: false, reason: "Code not found" };
  if (!promo.isActive) return { valid: false, reason: "Code is no longer active" };

  const now = new Date().toISOString();
  if (now < promo.validFrom) return { valid: false, reason: "Code is not yet valid" };
  if (now > promo.validUntil) return { valid: false, reason: "Code has expired" };
  if (promo.currentRedemptions >= promo.maxRedemptions) {
    return { valid: false, reason: "Code has reached maximum redemptions" };
  }

  return { valid: true, promo };
}

// ═══════════════════════════════════════════════════════════
// AI Pricing Suggestions
// ═══════════════════════════════════════════════════════════

/** AI analyzes current plans and market, suggests optimizations */
export function generatePricingSuggestions(): PricingSuggestion[] {
  const plans = Array.from(planStore.values()).filter((p) => p.isActive);
  const suggestions: PricingSuggestion[] = [];

  // Check for plans with low subscriber counts
  const underperforming = plans.filter(
    (p) => p.subscriberCount < 10 && p.price > 0 && p.type === "consumer",
  );
  for (const plan of underperforming) {
    suggestions.push({
      type: "price_change",
      description: `Consider reducing ${plan.name} price from $${plan.price} to $${(plan.price * 0.8).toFixed(2)}`,
      rationale: `${plan.name} has only ${plan.subscriberCount} subscribers. A 20% price reduction could increase conversions.`,
      estimatedImpact: `Potential +30% subscriber growth, net MRR impact: +$${(plan.subscriberCount * 0.3 * plan.price * 0.8 - plan.subscriberCount * plan.price * 0.2).toFixed(0)}/mo`,
      confidence: "medium",
    });
  }

  // Check gap between free and first paid tier
  const freePlan = plans.find((p) => p.price === 0 && p.type === "consumer");
  const cheapestPaid = plans
    .filter((p) => p.price > 0 && p.type === "consumer")
    .sort((a, b) => a.price - b.price)[0];

  if (freePlan && cheapestPaid && cheapestPaid.price > 3) {
    suggestions.push({
      type: "new_tier",
      description: `Add a $1.99/mo "Confetti Lite" tier between Free and ${cheapestPaid.name}`,
      rationale: `The jump from Free to $${cheapestPaid.price}/mo may be too steep. A lite tier can capture price-sensitive users who want premium features.`,
      estimatedImpact: "Potential to convert 5-10% of free users, adding $500-1000 MRR",
      confidence: "medium",
    });
  }

  // Suggest annual pricing if only monthly exists
  const monthlyOnly = plans.filter(
    (p) =>
      p.billingCycle === "monthly" &&
      p.price > 0 &&
      !plans.some((a) => a.name.includes("Annual") && a.type === p.type),
  );
  if (monthlyOnly.length > 0) {
    suggestions.push({
      type: "new_tier",
      description: "Add annual billing options with 2-month discount",
      rationale: "Annual plans reduce churn by 40-60% and improve cash flow predictability.",
      estimatedImpact: "20-30% of monthly subscribers typically switch to annual when offered",
      confidence: "high",
    });
  }

  // Suggest referral promo if no promos exist
  const activePromos = Array.from(promoStore.values()).filter((p) => p.isActive);
  if (activePromos.length === 0) {
    suggestions.push({
      type: "promo",
      description: "Launch a referral promo: CONFETTI50 for 50% off first month",
      rationale:
        "No active promos exist. Referral codes are the highest-converting acquisition channel for consumer apps.",
      estimatedImpact: "Typical referral programs drive 15-25% of new signups",
      confidence: "high",
    });
  }

  // Sunset suggestion for inactive plans with 0 subscribers
  const deadPlans = plans.filter((p) => p.subscriberCount === 0 && p.price > 0);
  for (const plan of deadPlans) {
    suggestions.push({
      type: "sunset",
      description: `Consider sunsetting "${plan.name}" — zero subscribers`,
      rationale: `${plan.name} at $${plan.price}/${plan.billingCycle} has no subscribers. Simplifying the pricing page improves conversion.`,
      estimatedImpact: "Reduces pricing page complexity, may improve overall conversion by 5-10%",
      confidence: "low",
    });
  }

  return suggestions;
}

/** Project MRR over N months based on growth trends */
export function projectRevenue(months: number): RevenueProjection[] {
  const plans = Array.from(planStore.values()).filter((p) => p.isActive);
  const currentMRR = plans.reduce((sum, p) => sum + p.mrr, 0);

  // Base growth assumptions
  const monthlyGrowthRate = 0.12; // 12% month-over-month
  const churnRate = 0.05; // 5% monthly churn

  const projections: RevenueProjection[] = [];
  let projectedMRR = currentMRR;

  for (let i = 1; i <= months; i++) {
    const newMRR = projectedMRR * monthlyGrowthRate;
    const churnedMRR = projectedMRR * churnRate;
    projectedMRR = projectedMRR + newMRR - churnedMRR;

    const date = new Date();
    date.setMonth(date.getMonth() + i);

    projections.push({
      period: date.toISOString().slice(0, 7), // YYYY-MM
      currentMRR,
      projectedMRR: Math.round(projectedMRR * 100) / 100,
      assumptions: [
        `${(monthlyGrowthRate * 100).toFixed(0)}% monthly growth rate`,
        `${(churnRate * 100).toFixed(0)}% monthly churn rate`,
        `Net growth: ${((monthlyGrowthRate - churnRate) * 100).toFixed(0)}% MoM`,
      ],
    });
  }

  return projections;
}

// ═══════════════════════════════════════════════════════════
// Dashboard
// ═══════════════════════════════════════════════════════════

/** Pricing dashboard overview */
export function getPricingDashboard(): {
  plans: PricingPlan[];
  experiments: PricingExperiment[];
  promos: PromoCode[];
  totalMRR: number;
  totalSubscribers: number;
  suggestions: PricingSuggestion[];
} {
  const plans = Array.from(planStore.values()).filter((p) => p.isActive);
  const experiments = Array.from(experimentStore.values());
  const promos = Array.from(promoStore.values()).filter((p) => p.isActive);

  return {
    plans: plans.sort((a, b) => a.price - b.price),
    experiments,
    promos,
    totalMRR: plans.reduce((sum, p) => sum + p.mrr, 0),
    totalSubscribers: plans.reduce((sum, p) => sum + p.subscriberCount, 0),
    suggestions: generatePricingSuggestions(),
  };
}

// ═══════════════════════════════════════════════════════════
// Demo Seed
// ═══════════════════════════════════════════════════════════

/** Seed Confetti's current pricing plans for demo */
export function seedPricingDemo(): PricingPlan[] {
  const planDefs: Array<{
    name: string;
    type: PlanType;
    model: PricingModel;
    price: number;
    billingCycle: "monthly" | "annual" | "one_time";
    features: string[];
    limits: Record<string, number>;
    subscribers: number;
  }> = [
    {
      name: "Free",
      type: "consumer",
      model: "freemium",
      price: 0,
      billingCycle: "monthly",
      features: [
        "AI-powered venue discovery",
        "3 itineraries per month",
        "Community feed access",
        "Basic taste profile",
      ],
      limits: { itineraries_per_month: 3, group_size: 4, saved_plans: 5 },
      subscribers: 8500,
    },
    {
      name: "Confetti Black",
      type: "consumer",
      model: "subscription",
      price: 4.99,
      billingCycle: "monthly",
      features: [
        "Unlimited itineraries",
        "Priority venue access",
        "Exclusive partner deals",
        "Advanced taste profile",
        "Group plans up to 12",
        "Confetti Fund wallet",
      ],
      limits: { itineraries_per_month: -1, group_size: 12, saved_plans: -1 },
      subscribers: 1200,
    },
    {
      name: "Spotlight",
      type: "business",
      model: "subscription",
      price: 99,
      billingCycle: "monthly",
      features: [
        "Venue listing boost",
        "Analytics dashboard",
        "50 boost credits/month",
        "Coupon creation",
        "Basic campaign tools",
      ],
      limits: { boost_credits: 50, campaigns: 3, coupons: 10 },
      subscribers: 45,
    },
    {
      name: "Boost",
      type: "business",
      model: "subscription",
      price: 299,
      billingCycle: "monthly",
      features: [
        "Everything in Spotlight",
        "200 boost credits/month",
        "Priority placement",
        "A/B campaign testing",
        "Advanced analytics",
        "API access",
      ],
      limits: { boost_credits: 200, campaigns: 10, coupons: 50 },
      subscribers: 18,
    },
    {
      name: "Partner",
      type: "business",
      model: "subscription",
      price: 799,
      billingCycle: "monthly",
      features: [
        "Everything in Boost",
        "500 boost credits/month",
        "Dedicated account manager",
        "Custom campaigns",
        "Revenue share program",
        "White-label options",
      ],
      limits: { boost_credits: 500, campaigns: -1, coupons: -1 },
      subscribers: 6,
    },
    {
      name: "Enterprise",
      type: "business",
      model: "flat_fee",
      price: 2500,
      billingCycle: "monthly",
      features: [
        "Everything in Partner",
        "Unlimited boost credits",
        "Multi-location support",
        "Custom integrations",
        "SLA guarantee",
        "Quarterly business reviews",
      ],
      limits: { boost_credits: -1, campaigns: -1, coupons: -1, locations: -1 },
      subscribers: 2,
    },
  ];

  const created: PricingPlan[] = [];

  for (const def of planDefs) {
    const plan = createPlan(
      def.name,
      def.type,
      def.model,
      def.price,
      def.billingCycle,
      def.features,
      def.limits,
    );
    plan.subscriberCount = def.subscribers;

    // Calculate MRR
    if (plan.billingCycle === "monthly") {
      plan.mrr = plan.price * plan.subscriberCount;
    } else if (plan.billingCycle === "annual") {
      plan.mrr = (plan.price / 12) * plan.subscriberCount;
    }

    created.push(plan);
  }

  // Add sample promos
  const now = new Date();
  const threeMonthsOut = new Date();
  threeMonthsOut.setMonth(threeMonthsOut.getMonth() + 3);

  createPromo("CONFETTI50", "percent", 50, 500, now.toISOString(), threeMonthsOut.toISOString(), [
    created[1].id, // Confetti Black
  ]);

  createPromo(
    "LAUNCH2026",
    "trial_extension",
    30,
    1000,
    now.toISOString(),
    threeMonthsOut.toISOString(),
    [
      created[1].id, // Confetti Black
    ],
  );

  createPromo("VENUE20", "percent", 20, 100, now.toISOString(), threeMonthsOut.toISOString(), [
    created[2].id, // Spotlight
    created[3].id, // Boost
  ]);

  // Add sample experiment
  if (created[1]) {
    const variant = createPlan(
      "Confetti Black (Test: $3.99)",
      "consumer",
      "subscription",
      3.99,
      "monthly",
      created[1].features,
      created[1].limits,
    );
    variant.isActive = false; // Experiment variant, not visible

    const exp = createExperiment(
      "Black Price Sensitivity Test",
      created[1].id,
      variant.id,
      0.5,
      "Testing $3.99 vs $4.99 for Confetti Black to optimize conversion",
    );
    if (exp) {
      startExperiment(exp.id);
      // Simulate some results
      for (let i = 0; i < 150; i++) {
        recordExperimentConversion(exp.id, "control", 4.99);
      }
      for (let i = 0; i < 180; i++) {
        recordExperimentConversion(exp.id, "variant", 3.99);
      }
    }
  }

  return created;
}
