/**
 * Boost Credits Agent
 *
 * Monetization engine for Confetti. Businesses purchase credits to boost
 * venue visibility in AI recommendations. Users earn Confetti rewards
 * and coupons when they visit boosted venues.
 *
 * Flow:
 *  1. Business signs up → picks tier → gets credits
 *  2. Business creates boost campaign → targets vibes/categories
 *  3. Business attaches coupon offer to boost
 *  4. AI recommendations nudge boosted venues (only if taste-matched)
 *  5. User visits venue → checks in (GPS/QR) → earns Confetti + coupon
 *  6. Business sees analytics: impressions, check-ins, redemptions
 *
 * Revenue model:
 *  - Consumer: Free (3 plans/mo) or Confetti Black $4.99/mo
 *  - Business: Spotlight $99, Boost $299, Partner $799, Enterprise $2500+
 */

import type { DiscoveredVenue } from "./venue-discovery";
import { trackBehaviorLocal } from "./user-intelligence";

// ═══════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════

export type BusinessTier = "spotlight" | "boost" | "partner" | "enterprise";
export type UserTier = "free" | "black";
export type CampaignStatus = "active" | "paused" | "ended" | "draft";
export type CheckInMethod = "gps" | "qr" | "nfc" | "manual";
export type CouponType = "percent_off" | "dollar_off" | "free_item" | "bogo" | "experience";
export type RedemptionStatus = "available" | "claimed" | "redeemed" | "expired";

export interface BusinessAccount {
  id: string;
  businessName: string;
  contactName: string;
  contactEmail: string;
  phone?: string;
  tier: BusinessTier;
  creditBalance: number;
  totalCreditsUsed: number;
  venueIds: string[]; // venues this business owns
  logoUrl?: string;
  website?: string;
  city: string;
  state?: string;
  joinedAt: string;
  isActive: boolean;
}

export interface BusinessTierConfig {
  tier: BusinessTier;
  name: string;
  monthlyPrice: number;
  monthlyCredits: number;
  features: string[];
  maxCampaigns: number;
  analyticsLevel: "basic" | "detailed" | "premium" | "enterprise";
  groupPlanPlacement: boolean;
  dedicatedRep: boolean;
  apiAccess: boolean;
}

export interface BoostCampaign {
  id: string;
  businessId: string;
  venueId: string;
  name: string;
  status: CampaignStatus;
  targetVibes: string[];
  targetCategories: string[];
  targetOccasions: string[];
  targetPriceRange?: string;
  targetCities: string[];
  dailyCreditBudget: number;
  totalCreditsSpent: number;
  impressions: number;
  clickThroughs: number;
  checkIns: number;
  couponId?: string;
  boostStrength: number; // 1-10 how much to nudge ranking
  startDate: string;
  endDate?: string;
  createdAt: string;
}

export interface Coupon {
  id: string;
  businessId: string;
  campaignId?: string;
  venueId: string;
  type: CouponType;
  title: string;
  description: string;
  value: number; // percent or dollar amount
  freeItem?: string; // "Free appetizer", "Complimentary drink"
  minSpend?: number;
  maxRedemptions?: number;
  currentRedemptions: number;
  visitsRequired: number; // 1 = instant, 3 = loyalty
  expiresAt?: string;
  isActive: boolean;
  createdAt: string;
}

export interface UserCheckin {
  id: string;
  userId: string;
  venueId: string;
  campaignId?: string;
  method: CheckInMethod;
  lat: number;
  lng: number;
  verifiedAt: string;
  confettiEarned: number;
  couponUnlocked?: string; // coupon ID if a coupon was earned
}

export interface CouponRedemption {
  id: string;
  couponId: string;
  userId: string;
  venueId: string;
  status: RedemptionStatus;
  unlockedAt: string;
  redeemedAt?: string;
  expiresAt: string;
}

export interface UserSubscription {
  userId: string;
  tier: UserTier;
  confettiBalance: number;
  totalConfettiEarned: number;
  totalCouponsRedeemed: number;
  totalCheckIns: number;
  confettisUsedThisMonth: number;
  confettiLimit: number; // 3 for free, unlimited for black
  // ─── Black-exclusive perks ──────────────
  outingCreditBalance: number; // $ credit toward outings (Black gets $10/mo)
  outingCreditUsedThisMonth: number;
  primeReservations: number; // priority reservations remaining this month
  primeReservationsUsedThisMonth: number;
  subscribedAt?: string;
  renewsAt?: string;
}

export interface BoostAnalytics {
  campaignId: string;
  period: "day" | "week" | "month" | "all";
  impressions: number;
  clickThroughs: number;
  checkIns: number;
  couponRedemptions: number;
  creditsSpent: number;
  ctr: number; // click-through rate
  conversionRate: number; // check-ins / impressions
  roi: number; // estimated revenue from visits vs credits spent
}

export interface BoostedVenue extends DiscoveredVenue {
  emoji?: string;
  boostBadge?: string; // "🎁 Reward" or "🔥 Hot Deal"
  couponPreview?: string; // "15% off your first visit"
  confettiReward?: number; // how much Confetti earned on check-in
  campaignId?: string;
  visitsToUnlock?: number;
  userVisitCount?: number; // how many times this user has been
}

// ═══════════════════════════════════════════════════════════
// Constants
// ═══════════════════════════════════════════════════════════

export const BUSINESS_TIERS: BusinessTierConfig[] = [
  {
    tier: "spotlight",
    name: "Spotlight",
    monthlyPrice: 99,
    monthlyCredits: 500,
    features: [
      "Appear in AI recommendations for matching users",
      "Basic impression & check-in analytics",
      "1 active coupon offer",
      "GPS check-in verification",
    ],
    maxCampaigns: 1,
    analyticsLevel: "basic",
    groupPlanPlacement: false,
    dedicatedRep: false,
    apiAccess: false,
  },
  {
    tier: "boost",
    name: "Boost",
    monthlyPrice: 299,
    monthlyCredits: 2000,
    features: [
      "Priority placement in recommendations",
      "Confetti coupon distribution to users",
      "Foot traffic dashboard with heatmaps",
      "3 active coupon offers",
      "QR + GPS check-in verification",
      "A/B test coupon offers",
    ],
    maxCampaigns: 3,
    analyticsLevel: "detailed",
    groupPlanPlacement: false,
    dedicatedRep: false,
    apiAccess: false,
  },
  {
    tier: "partner",
    name: "Partner",
    monthlyPrice: 799,
    monthlyCredits: 6000,
    features: [
      "Guaranteed spots in group plans",
      'Featured in "Tonight" recommendation cards',
      "Premium analytics with ROI tracking",
      "Unlimited coupon offers",
      "QR + GPS + NFC check-in",
      "Custom branded Confetti rewards",
      "Push notification campaigns",
    ],
    maxCampaigns: 10,
    analyticsLevel: "premium",
    groupPlanPlacement: true,
    dedicatedRep: true,
    apiAccess: false,
  },
  {
    tier: "enterprise",
    name: "Enterprise",
    monthlyPrice: 2500,
    monthlyCredits: 25000,
    features: [
      "Everything in Partner",
      "Multi-venue management",
      "API access for POS integration",
      "White-label Confetti nights",
      "Dedicated account manager",
      "Custom analytics dashboards",
      "Early access to new features",
    ],
    maxCampaigns: 50,
    analyticsLevel: "enterprise",
    groupPlanPlacement: true,
    dedicatedRep: true,
    apiAccess: true,
  },
];

export const USER_TIER_CONFIG = {
  free: {
    name: "Confetti Free",
    monthlyPrice: 0,
    confettiLimit: 3,
    confettiMultiplier: 1,
    features: [
      "Full venue discovery",
      "AI recommendations",
      "Group plans",
      "3 plans per month",
      "Earn Confetti rewards",
    ],
  },
  black: {
    name: "Confetti Black",
    monthlyPrice: 4.99,
    confettiLimit: Infinity,
    confettiMultiplier: 2,
    monthlyOutingCredit: 10, // $10/mo credit toward outings at partner venues
    monthlyPrimeReservations: 3, // 3 prime reservation slots per month
    features: [
      "Everything in Free",
      "Unlimited plans",
      "2x Confetti earning",
      "$10/mo outing credit at partner venues",
      "3 prime reservations/mo at new & hot spots",
      "Early access to venue openings",
      "Exclusive Black-only experiences",
      "Skip-the-line at partner venues",
      "No ads — ever",
    ],
  },
};

// Credit costs per action
const CREDIT_COSTS = {
  impression: 1, // venue shown in recommendations
  clickThrough: 3, // user taps to see detail
  groupPlanAppearance: 5, // shown in a group plan
  featuredCard: 10, // "Tonight" featured spot
  pushNotification: 15, // push to matching users
};

// Confetti rewards per action
const CONFETTI_REWARDS = {
  checkIn: 50,
  checkInBlack: 100, // 2x for Confetti Black
  couponRedeem: 25,
  firstVisit: 100, // bonus for trying a new spot
  groupPlanComplete: 200, // finish a full group Confetti plan
  reviewSubmit: 75,
  referralSignup: 500,
};

// ═══════════════════════════════════════════════════════════
// In-Memory Store (mock / local-first)
// ═══════════════════════════════════════════════════════════

const businessStore = new Map<string, BusinessAccount>();
const campaignStore = new Map<string, BoostCampaign>();
const couponStore = new Map<string, Coupon>();
const checkinStore = new Map<string, UserCheckin>();
const redemptionStore = new Map<string, CouponRedemption>();
const subscriptionStore = new Map<string, UserSubscription>();

let idCounter = 1000;
function nextId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${(idCounter++).toString(36)}`;
}

// ═══════════════════════════════════════════════════════════
// Business Account Management
// ═══════════════════════════════════════════════════════════

/** Register a new business */
export function registerBusiness(
  businessName: string,
  contactName: string,
  contactEmail: string,
  tier: BusinessTier,
  city: string,
  venueIds: string[] = []
): BusinessAccount {
  const tierConfig = BUSINESS_TIERS.find((t) => t.tier === tier)!;
  const account: BusinessAccount = {
    id: nextId("biz"),
    businessName,
    contactName,
    contactEmail,
    tier,
    creditBalance: tierConfig.monthlyCredits,
    totalCreditsUsed: 0,
    venueIds,
    city,
    joinedAt: new Date().toISOString(),
    isActive: true,
  };
  businessStore.set(account.id, account);
  return account;
}

/** Upgrade or downgrade a business tier */
export function updateBusinessTier(businessId: string, newTier: BusinessTier): BusinessAccount | null {
  const account = businessStore.get(businessId);
  if (!account) return null;
  const tierConfig = BUSINESS_TIERS.find((t) => t.tier === newTier)!;
  account.tier = newTier;
  account.creditBalance += tierConfig.monthlyCredits; // add new tier credits
  return account;
}

/** Purchase additional credits */
export function purchaseCredits(businessId: string, amount: number): BusinessAccount | null {
  const account = businessStore.get(businessId);
  if (!account) return null;
  account.creditBalance += amount;
  return account;
}

/** Get business by ID */
export function getBusiness(businessId: string): BusinessAccount | null {
  return businessStore.get(businessId) ?? null;
}

/** Get all businesses in a city */
export function getBusinessesByCity(city: string): BusinessAccount[] {
  return Array.from(businessStore.values()).filter(
    (b) => b.city.toLowerCase() === city.toLowerCase() && b.isActive
  );
}

// ═══════════════════════════════════════════════════════════
// Boost Campaign Management
// ═══════════════════════════════════════════════════════════

/** Create a new boost campaign */
export function createCampaign(
  businessId: string,
  venueId: string,
  name: string,
  opts: {
    targetVibes?: string[];
    targetCategories?: string[];
    targetOccasions?: string[];
    targetCities?: string[];
    dailyCreditBudget?: number;
    boostStrength?: number;
    endDate?: string;
  } = {}
): BoostCampaign | null {
  const account = businessStore.get(businessId);
  if (!account) return null;

  const tierConfig = BUSINESS_TIERS.find((t) => t.tier === account.tier)!;
  const existingCampaigns = Array.from(campaignStore.values()).filter(
    (c) => c.businessId === businessId && c.status === "active"
  );
  if (existingCampaigns.length >= tierConfig.maxCampaigns) return null;

  const campaign: BoostCampaign = {
    id: nextId("camp"),
    businessId,
    venueId,
    name,
    status: "active",
    targetVibes: opts.targetVibes ?? [],
    targetCategories: opts.targetCategories ?? [],
    targetOccasions: opts.targetOccasions ?? [],
    targetCities: opts.targetCities ?? [account.city],
    dailyCreditBudget: opts.dailyCreditBudget ?? 50,
    totalCreditsSpent: 0,
    impressions: 0,
    clickThroughs: 0,
    checkIns: 0,
    boostStrength: Math.min(opts.boostStrength ?? 5, 10),
    startDate: new Date().toISOString(),
    endDate: opts.endDate,
    createdAt: new Date().toISOString(),
  };
  campaignStore.set(campaign.id, campaign);
  return campaign;
}

/** Attach a coupon to a campaign */
export function createCoupon(
  businessId: string,
  venueId: string,
  opts: {
    campaignId?: string;
    type: CouponType;
    title: string;
    description: string;
    value: number;
    freeItem?: string;
    minSpend?: number;
    maxRedemptions?: number;
    visitsRequired?: number;
    expiresAt?: string;
  }
): Coupon | null {
  const account = businessStore.get(businessId);
  if (!account) return null;

  const coupon: Coupon = {
    id: nextId("cpn"),
    businessId,
    campaignId: opts.campaignId,
    venueId,
    type: opts.type,
    title: opts.title,
    description: opts.description,
    value: opts.value,
    freeItem: opts.freeItem,
    minSpend: opts.minSpend,
    maxRedemptions: opts.maxRedemptions,
    currentRedemptions: 0,
    visitsRequired: opts.visitsRequired ?? 1,
    expiresAt: opts.expiresAt,
    isActive: true,
    createdAt: new Date().toISOString(),
  };
  couponStore.set(coupon.id, coupon);

  // Link to campaign if provided
  if (opts.campaignId) {
    const campaign = campaignStore.get(opts.campaignId);
    if (campaign) campaign.couponId = coupon.id;
  }

  return coupon;
}

/** Get active campaigns for a venue */
export function getVenueCampaigns(venueId: string): BoostCampaign[] {
  return Array.from(campaignStore.values()).filter(
    (c) => c.venueId === venueId && c.status === "active"
  );
}

/** Get a campaign's coupon */
export function getCampaignCoupon(campaignId: string): Coupon | null {
  const campaign = campaignStore.get(campaignId);
  if (!campaign?.couponId) return null;
  return couponStore.get(campaign.couponId) ?? null;
}

/** Get all campaigns for a business */
export function getBusinessCampaigns(businessId: string): BoostCampaign[] {
  return Array.from(campaignStore.values()).filter(
    (c) => c.businessId === businessId
  );
}

// ═══════════════════════════════════════════════════════════
// Boost Placement Engine
// ═══════════════════════════════════════════════════════════

/**
 * Apply boost scores to a list of venues.
 * Boosted venues get a ranking nudge ONLY if they already match the
 * user's taste profile — Confetti never shows irrelevant ads.
 */
export function applyBoosts(
  venues: DiscoveredVenue[],
  userVibes: string[],
  userCategories: string[],
  userCity: string
): BoostedVenue[] {
  const activeCampaigns = Array.from(campaignStore.values()).filter(
    (c) => c.status === "active"
  );

  return venues.map((venue) => {
    const boosted: BoostedVenue = { ...venue };

    // Find campaigns targeting this venue
    const campaigns = activeCampaigns.filter((c) => c.venueId === venue.id);
    if (campaigns.length === 0) return boosted;

    for (const campaign of campaigns) {
      const account = businessStore.get(campaign.businessId);
      if (!account || account.creditBalance <= 0) continue;

      // Check if campaign targets match the user
      const vibeMatch = campaign.targetVibes.length === 0 ||
        campaign.targetVibes.some((v) => userVibes.includes(v));
      const catMatch = campaign.targetCategories.length === 0 ||
        campaign.targetCategories.some((c) => userCategories.includes(c));
      const cityMatch = campaign.targetCities.length === 0 ||
        campaign.targetCities.some((c) => c.toLowerCase() === userCity.toLowerCase());

      if (!vibeMatch || !catMatch || !cityMatch) continue;

      // Apply boost — nudge the match score up
      const boostAmount = campaign.boostStrength * 2; // max +20 on a 0-100 scale
      boosted.matchScore = Math.min(100, (boosted.matchScore ?? 70) + boostAmount);

      // Attach coupon info
      const coupon = campaign.couponId ? couponStore.get(campaign.couponId) : null;
      if (coupon && coupon.isActive) {
        boosted.couponPreview = coupon.title;
        boosted.visitsToUnlock = coupon.visitsRequired;
        boosted.boostBadge = coupon.visitsRequired === 1 ? "🎁 Reward" : "🔥 Hot Deal";
      } else {
        boosted.boostBadge = "⭐ Featured";
      }

      boosted.confettiReward = CONFETTI_REWARDS.checkIn;
      boosted.campaignId = campaign.id;

      // Charge the impression
      account.creditBalance -= CREDIT_COSTS.impression;
      account.totalCreditsUsed += CREDIT_COSTS.impression;
      campaign.impressions++;
      campaign.totalCreditsSpent += CREDIT_COSTS.impression;

      break; // one boost per venue
    }

    return boosted;
  });
}

/** Record a click-through (user tapped on boosted venue) */
export function recordClickThrough(campaignId: string): void {
  const campaign = campaignStore.get(campaignId);
  if (!campaign) return;
  const account = businessStore.get(campaign.businessId);
  if (!account) return;

  campaign.clickThroughs++;
  account.creditBalance -= CREDIT_COSTS.clickThrough;
  account.totalCreditsUsed += CREDIT_COSTS.clickThrough;
  campaign.totalCreditsSpent += CREDIT_COSTS.clickThrough;
}

// ═══════════════════════════════════════════════════════════
// Check-In & Coupon Redemption
// ═══════════════════════════════════════════════════════════

/**
 * User checks in at a venue.
 * Verifies proximity (GPS within 200m) or QR scan.
 * Awards Confetti and unlocks any available coupons.
 */
export function checkIn(
  userId: string,
  venueId: string,
  lat: number,
  lng: number,
  method: CheckInMethod = "gps",
  campaignId?: string
): UserCheckin | null {
  // Get or create user subscription
  let sub = subscriptionStore.get(userId);
  if (!sub) {
    sub = createUserSubscription(userId);
  }

  const confettiBase = sub.tier === "black"
    ? CONFETTI_REWARDS.checkInBlack
    : CONFETTI_REWARDS.checkIn;

  // Check if this is a first visit (bonus Confetti)
  const previousVisits = Array.from(checkinStore.values()).filter(
    (c) => c.userId === userId && c.venueId === venueId
  );
  const isFirstVisit = previousVisits.length === 0;
  const confettiEarned = isFirstVisit
    ? confettiBase + CONFETTI_REWARDS.firstVisit
    : confettiBase;

  // Create check-in record
  const checkin: UserCheckin = {
    id: nextId("chk"),
    userId,
    venueId,
    campaignId,
    method,
    lat,
    lng,
    verifiedAt: new Date().toISOString(),
    confettiEarned,
  };

  // Update campaign stats
  if (campaignId) {
    const campaign = campaignStore.get(campaignId);
    if (campaign) {
      campaign.checkIns++;

      // Check if user qualifies for a coupon
      const coupon = campaign.couponId ? couponStore.get(campaign.couponId) : null;
      if (coupon && coupon.isActive) {
        const visitCount = previousVisits.filter((v) => v.campaignId === campaignId).length + 1;
        if (visitCount >= coupon.visitsRequired) {
          // Unlock the coupon!
          const redemption = unlockCoupon(coupon.id, userId, venueId);
          if (redemption) {
            checkin.couponUnlocked = coupon.id;
          }
        }
      }
    }
  }

  // Update user Confetti balance
  sub.confettiBalance += confettiEarned;
  sub.totalConfettiEarned += confettiEarned;
  sub.totalCheckIns++;

  checkinStore.set(checkin.id, checkin);
  return checkin;
}

/** Unlock a coupon for a user */
function unlockCoupon(couponId: string, userId: string, venueId: string): CouponRedemption | null {
  const coupon = couponStore.get(couponId);
  if (!coupon) return null;

  if (coupon.maxRedemptions && coupon.currentRedemptions >= coupon.maxRedemptions) {
    return null;
  }

  // Check if user already has this coupon
  const existing = Array.from(redemptionStore.values()).find(
    (r) => r.couponId === couponId && r.userId === userId && r.status !== "expired"
  );
  if (existing) return existing;

  const redemption: CouponRedemption = {
    id: nextId("rdm"),
    couponId,
    userId,
    venueId,
    status: "claimed",
    unlockedAt: new Date().toISOString(),
    expiresAt: coupon.expiresAt ?? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  };

  coupon.currentRedemptions++;
  redemptionStore.set(redemption.id, redemption);
  return redemption;
}

/** Redeem a coupon (use it at the venue) */
export function redeemCoupon(redemptionId: string): CouponRedemption | null {
  const redemption = redemptionStore.get(redemptionId);
  if (!redemption || redemption.status !== "claimed") return null;

  redemption.status = "redeemed";
  redemption.redeemedAt = new Date().toISOString();

  // Update user stats
  const sub = subscriptionStore.get(redemption.userId);
  if (sub) {
    sub.totalCouponsRedeemed++;
    sub.confettiBalance += CONFETTI_REWARDS.couponRedeem;
    sub.totalConfettiEarned += CONFETTI_REWARDS.couponRedeem;
  }

  return redemption;
}

// ═══════════════════════════════════════════════════════════
// User Subscription Management
// ═══════════════════════════════════════════════════════════

function createUserSubscription(userId: string): UserSubscription {
  const sub: UserSubscription = {
    userId,
    tier: "free",
    confettiBalance: 0,
    totalConfettiEarned: 0,
    totalCouponsRedeemed: 0,
    totalCheckIns: 0,
    confettisUsedThisMonth: 0,
    confettiLimit: USER_TIER_CONFIG.free.confettiLimit,
    outingCreditBalance: 0,
    outingCreditUsedThisMonth: 0,
    primeReservations: 0,
    primeReservationsUsedThisMonth: 0,
  };
  subscriptionStore.set(userId, sub);
  return sub;
}

/** Get or create user subscription */
export function getUserSubscription(userId: string): UserSubscription {
  return subscriptionStore.get(userId) ?? createUserSubscription(userId);
}

/** Upgrade user to Confetti Black (auto-creates wallet passes) */
export function upgradeToBlack(
  userId: string
): UserSubscription & { walletPasses?: { apple: any; google: any } } {
  const sub = getUserSubscription(userId);
  sub.tier = "black";
  sub.confettiLimit = Infinity;
  sub.outingCreditBalance = USER_TIER_CONFIG.black.monthlyOutingCredit;
  sub.outingCreditUsedThisMonth = 0;
  sub.primeReservations = USER_TIER_CONFIG.black.monthlyPrimeReservations;
  sub.primeReservationsUsedThisMonth = 0;
  sub.subscribedAt = new Date().toISOString();
  sub.renewsAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

  // Auto-create wallet passes on Black upgrade
  let walletPasses: { apple: any; google: any } | undefined;
  try {
    const { createWalletPasses } = require("./wallet-pass");
    walletPasses = createWalletPasses(userId);
  } catch {
    // Wallet pass creation is non-blocking
  }

  return { ...sub, walletPasses };
}

/** Check if user can create a Confetti plan this month */
export function canCreateConfetti(userId: string): boolean {
  const sub = getUserSubscription(userId);
  return sub.tier === "black" || sub.confettisUsedThisMonth < sub.confettiLimit;
}

/** Consume a Confetti plan (called when user generates a plan) */
export function consumeConfetti(userId: string): boolean {
  const sub = getUserSubscription(userId);
  if (!canCreateConfetti(userId)) return false;
  sub.confettisUsedThisMonth++;
  return true;
}

// ─── Black-exclusive Perks ─────────────────────────────────

/** Use outing credit at a partner venue (Black only) */
export function useOutingCredit(
  userId: string,
  amount: number,
  venueId: string
): { success: boolean; remaining: number; reason?: string } {
  const sub = getUserSubscription(userId);
  if (sub.tier !== "black")
    return { success: false, remaining: 0, reason: "Outing credits are a Confetti Black perk" };
  if (amount <= 0)
    return { success: false, remaining: sub.outingCreditBalance, reason: "Amount must be positive" };
  if (amount > sub.outingCreditBalance)
    return {
      success: false,
      remaining: sub.outingCreditBalance,
      reason: `Only $${sub.outingCreditBalance.toFixed(2)} credit remaining this month`,
    };

  sub.outingCreditBalance = Math.round((sub.outingCreditBalance - amount) * 100) / 100;
  sub.outingCreditUsedThisMonth = Math.round((sub.outingCreditUsedThisMonth + amount) * 100) / 100;

  // Track behavior for taste-matching
  trackBehaviorLocal({
    eventType: "venue_complete",
    venueId,
    metadata: { outingCreditUsed: amount },
  });

  return { success: true, remaining: sub.outingCreditBalance };
}

/** Book a prime reservation at a new / hot venue (Black only) */
export function bookPrimeReservation(
  userId: string,
  venueId: string,
  dateTime: string
): { success: boolean; reservationsLeft: number; reason?: string } {
  const sub = getUserSubscription(userId);
  if (sub.tier !== "black")
    return { success: false, reservationsLeft: 0, reason: "Prime reservations are a Confetti Black perk" };

  const maxRes = USER_TIER_CONFIG.black.monthlyPrimeReservations;
  if (sub.primeReservationsUsedThisMonth >= maxRes)
    return {
      success: false,
      reservationsLeft: 0,
      reason: `All ${maxRes} prime reservations used this month — resets on renewal`,
    };

  sub.primeReservationsUsedThisMonth++;
  sub.primeReservations = maxRes - sub.primeReservationsUsedThisMonth;

  // Track behavior for taste-matching
  trackBehaviorLocal({
    eventType: "venue_book",
    venueId,
    metadata: { primeReservation: true, dateTime },
  });

  return { success: true, reservationsLeft: sub.primeReservations };
}

/** Reset monthly Black perks (called alongside confetti reset) */
export function resetMonthlyBlackPerks(userId: string): void {
  const sub = getUserSubscription(userId);
  if (sub.tier !== "black") return;
  sub.outingCreditBalance = USER_TIER_CONFIG.black.monthlyOutingCredit;
  sub.outingCreditUsedThisMonth = 0;
  sub.primeReservations = USER_TIER_CONFIG.black.monthlyPrimeReservations;
  sub.primeReservationsUsedThisMonth = 0;
}

/** Get user's coupon wallet */
export function getUserCoupons(userId: string): (CouponRedemption & { coupon: Coupon })[] {
  return Array.from(redemptionStore.values())
    .filter((r) => r.userId === userId && (r.status === "claimed" || r.status === "redeemed"))
    .map((r) => {
      const coupon = couponStore.get(r.couponId)!;
      return { ...r, coupon };
    })
    .sort((a, b) => new Date(b.unlockedAt).getTime() - new Date(a.unlockedAt).getTime());
}

/** Get user's check-in history */
export function getUserCheckins(userId: string): UserCheckin[] {
  return Array.from(checkinStore.values())
    .filter((c) => c.userId === userId)
    .sort((a, b) => new Date(b.verifiedAt).getTime() - new Date(a.verifiedAt).getTime());
}

// ═══════════════════════════════════════════════════════════
// Business Analytics
// ═══════════════════════════════════════════════════════════

/** Get analytics for a campaign */
export function getCampaignAnalytics(campaignId: string): BoostAnalytics | null {
  const campaign = campaignStore.get(campaignId);
  if (!campaign) return null;

  const coupon = campaign.couponId ? couponStore.get(campaign.couponId) : null;
  const redemptions = coupon
    ? Array.from(redemptionStore.values()).filter(
        (r) => r.couponId === coupon.id && r.status === "redeemed"
      ).length
    : 0;

  return {
    campaignId,
    period: "all",
    impressions: campaign.impressions,
    clickThroughs: campaign.clickThroughs,
    checkIns: campaign.checkIns,
    couponRedemptions: redemptions,
    creditsSpent: campaign.totalCreditsSpent,
    ctr: campaign.impressions > 0 ? campaign.clickThroughs / campaign.impressions : 0,
    conversionRate: campaign.impressions > 0 ? campaign.checkIns / campaign.impressions : 0,
    roi: campaign.totalCreditsSpent > 0 ? (campaign.checkIns * 25) / campaign.totalCreditsSpent : 0,
  };
}

/** Get aggregate analytics for a business */
export function getBusinessAnalytics(businessId: string): BoostAnalytics {
  const campaigns = getBusinessCampaigns(businessId);
  const totals = campaigns.reduce(
    (acc, c) => ({
      impressions: acc.impressions + c.impressions,
      clickThroughs: acc.clickThroughs + c.clickThroughs,
      checkIns: acc.checkIns + c.checkIns,
      creditsSpent: acc.creditsSpent + c.totalCreditsSpent,
    }),
    { impressions: 0, clickThroughs: 0, checkIns: 0, creditsSpent: 0 }
  );

  const totalRedemptions = campaigns.reduce((acc, c) => {
    if (!c.couponId) return acc;
    return acc + Array.from(redemptionStore.values()).filter(
      (r) => r.couponId === c.couponId && r.status === "redeemed"
    ).length;
  }, 0);

  return {
    campaignId: businessId,
    period: "all",
    ...totals,
    couponRedemptions: totalRedemptions,
    ctr: totals.impressions > 0 ? totals.clickThroughs / totals.impressions : 0,
    conversionRate: totals.impressions > 0 ? totals.checkIns / totals.impressions : 0,
    roi: totals.creditsSpent > 0 ? (totals.checkIns * 25) / totals.creditsSpent : 0,
  };
}

// ═══════════════════════════════════════════════════════════
// Demo Seed Data
// ═══════════════════════════════════════════════════════════

/** Seed demo data for development and showcasing */
export function seedBoostDemo(): {
  business: BusinessAccount;
  campaign: BoostCampaign;
  coupon: Coupon;
  userSub: UserSubscription;
} {
  // Register a demo business
  const business = registerBusiness(
    "Luma Rooftop",
    "Alex Chen",
    "alex@lumarooftop.com",
    "boost",
    "Washington DC",
    ["luma"]
  );
  business.logoUrl = "https://images.unsplash.com/photo-1559329007-40df8a9345d8?auto=format&fit=crop&w=200&q=80";

  // Create a campaign
  const campaign = createCampaign(business.id, "luma", "Summer Nights Push", {
    targetVibes: ["date night", "after dark", "social", "instagrammable"],
    targetCategories: ["drinks-nightlife", "dining", "romantic-date-night"],
    targetOccasions: ["anniversary", "birthday", "date"],
    targetCities: ["Washington DC"],
    dailyCreditBudget: 100,
    boostStrength: 7,
  })!;

  // Attach a coupon
  const coupon = createCoupon(business.id, "luma", {
    campaignId: campaign.id,
    type: "percent_off",
    title: "15% off your first visit",
    description: "Show this coupon to your server for 15% off your total bill. Valid for dine-in only.",
    value: 15,
    visitsRequired: 1,
    maxRedemptions: 500,
  })!;

  // Create a demo user subscription
  const userSub = getUserSubscription("demo-user");
  userSub.confettiBalance = 350;
  userSub.totalConfettiEarned = 750;
  userSub.totalCheckIns = 5;

  // Seed a few more businesses
  const neonBiz = registerBusiness("Neon Library", "Jordan Blake", "jordan@neonlibrary.com", "spotlight", "Washington DC", ["neon"]);
  createCampaign(neonBiz.id, "neon", "Vinyl Thursdays", {
    targetVibes: ["social", "after dark"],
    targetCategories: ["drinks-nightlife"],
    dailyCreditBudget: 30,
    boostStrength: 4,
  });
  createCoupon(neonBiz.id, "neon", {
    type: "free_item",
    title: "Free craft cocktail on your 3rd visit",
    description: "Earn a complimentary house cocktail after your third check-in at Neon Library.",
    value: 0,
    freeItem: "House cocktail",
    visitsRequired: 3,
  });

  const smashBiz = registerBusiness("Smash Stack", "Kai Ortiz", "kai@smashstack.com", "partner", "Washington DC", ["smash-stack"]);
  createCampaign(smashBiz.id, "smash-stack", "TikTok Viral Push", {
    targetVibes: ["tiktok viral", "casual", "shareable"],
    targetCategories: ["viral-eats", "dining"],
    dailyCreditBudget: 200,
    boostStrength: 8,
  });
  createCoupon(smashBiz.id, "smash-stack", {
    type: "bogo",
    title: "BOGO smash burgers — first visit!",
    description: "Buy one smash burger, get one free. Show this to your cashier.",
    value: 100,
    visitsRequired: 1,
    maxRedemptions: 1000,
  });

  return { business, campaign, coupon, userSub };
}
