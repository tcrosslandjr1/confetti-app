/**
 * Community Agent
 * Powers the social layer of Confetti — shared plans, experience reviews,
 * reputation system, and community-driven AI learning.
 *
 * Features:
 *   - Share plans (custom or AI-generated) for Confetti points
 *   - Map-based community feed with filterable shared plans
 *   - Experience reviews (per-stop ratings, full stories, auto-tracked visits)
 *   - Reputation system (level + Confetti points combined)
 *   - AI learning pipeline: aggregate community data improves recommendations
 */

import { supabase } from "../supabase";
import type { TripPlan, TripStop } from "./trip-planner";

// ─── Types ─────────────────────────────────────────────────────

export type PlanOrigin = "ai_generated" | "custom" | "remixed";
export type ReviewType = "stop_rating" | "full_story" | "auto_tracked";
export type ReputationTier = "newcomer" | "explorer" | "local_guide" | "tastemaker" | "legend";

export interface SharedPlan {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  authorTier: ReputationTier;
  origin: PlanOrigin;
  originalPlanId?: string; // if remixed from another plan
  title: string;
  description?: string;
  city: string;
  state?: string;
  region?: string; // e.g., "DMV", "Bay Area", "SoCal"
  coverImage?: string;
  stops: SharedPlanStop[];
  vibeTags: string[];
  occasionTags: string[];
  totalStops: number;
  totalDurationHours: number;
  estimatedCost?: string; // "$", "$$", "$$$"
  // Map data
  centerLat: number;
  centerLng: number;
  routePoints: Array<{ lat: number; lng: number }>;
  // Engagement
  saves: number;
  completions: number;
  avgRating: number;
  reviewCount: number;
  remixCount: number;
  // Metadata
  createdAt: string;
  updatedAt: string;
  featured: boolean;
}

export interface SharedPlanStop {
  id: string;
  stopOrder: number;
  name: string;
  category: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  notes?: string;
  authorTip?: string; // personal recommendation from author
  avgRating?: number;
  reviewCount?: number;
}

export interface ExperienceReview {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  userTier: ReputationTier;
  planId: string;
  reviewType: ReviewType;
  // Stop ratings (always collected if user rates)
  stopRatings: StopRating[];
  // Full story (optional)
  title?: string;
  body?: string;
  photos?: string[];
  // Auto-tracked data
  stopsVisited?: string[]; // stop IDs actually visited
  totalTimeSpent?: number; // minutes
  visitedAt?: string;
  // Overall
  overallRating: number; // 1-5
  wouldRecommend: boolean;
  highlight?: string; // one-line takeaway
  createdAt: string;
}

export interface StopRating {
  stopId: string;
  stopName: string;
  rating: number; // 1-5
  note?: string; // quick note
}

export interface UserReputation {
  userId: string;
  tier: ReputationTier;
  totalPoints: number;
  confettiEarned: number; // Confetti reward currency earned from community
  plansShared: number;
  reviewsWritten: number;
  plansCompleted: number; // other people's plans this user completed
  helpfulVotes: number;
  currentStreak: number; // days active in community
  joinedAt: string;
  badges: CommunityBadge[];
}

export interface CommunityBadge {
  id: string;
  name: string;
  icon: string;
  description: string;
  earnedAt: string;
}

export interface CommunityFeedQuery {
  city?: string;
  region?: string;
  lat?: number;
  lng?: number;
  radiusMiles?: number;
  vibeTags?: string[];
  occasionTags?: string[];
  sortBy?: "popular" | "newest" | "top_rated" | "nearby";
  limit?: number;
  offset?: number;
}

export interface AIInsight {
  venueId?: string;
  city: string;
  insight: string;
  confidence: number; // 0-1
  basedOnReviews: number;
  category: "trending" | "hidden_gem" | "overrated" | "seasonal" | "crowd_favorite";
}

// ─── Constants ─────────────────────────────────────────────────

const REPUTATION_TIERS: Record<ReputationTier, { minPoints: number; label: string; icon: string }> =
  {
    newcomer: { minPoints: 0, label: "Newcomer", icon: "🌱" },
    explorer: { minPoints: 100, label: "Explorer", icon: "🧭" },
    local_guide: { minPoints: 500, label: "Local Guide", icon: "📍" },
    tastemaker: { minPoints: 2000, label: "Tastemaker", icon: "✨" },
    legend: { minPoints: 10000, label: "Legend", icon: "👑" },
  };

const POINTS = {
  sharePlan: 50,
  writeStopRating: 10,
  writeFullStory: 30,
  addPhoto: 5,
  planGetsSaved: 5,
  planGetsCompleted: 15,
  planGetsRemixed: 20,
  receiveHelpfulVote: 3,
  completeSomeonesPlan: 20,
  dailyActive: 2,
};

const CONFETTI_EARN = {
  sharePlan: 25,
  writeFullStory: 15,
  planGetsSaved: 2,
  planGetsCompleted: 10,
  planGetsRemixed: 10,
  completeSomeonesPlan: 10,
};

const BADGES: Omit<CommunityBadge, "earnedAt">[] = [
  {
    id: "first_share",
    name: "First Share",
    icon: "🎉",
    description: "Shared your first plan with the community",
  },
  {
    id: "first_review",
    name: "First Review",
    icon: "⭐",
    description: "Left your first experience review",
  },
  {
    id: "popular_plan",
    name: "Crowd Pleaser",
    icon: "🔥",
    description: "One of your plans got 10+ saves",
  },
  {
    id: "storyteller",
    name: "Storyteller",
    icon: "📝",
    description: "Wrote 5 full experience stories",
  },
  {
    id: "globetrotter",
    name: "Globetrotter",
    icon: "🌍",
    description: "Shared plans in 5+ different cities",
  },
  {
    id: "helpful",
    name: "Helpful Local",
    icon: "🤝",
    description: "Received 25+ helpful votes on reviews",
  },
  {
    id: "tastemaker_100",
    name: "Tastemaker 100",
    icon: "💎",
    description: "100+ people completed your plans",
  },
  { id: "streak_7", name: "On a Roll", icon: "🔥", description: "7-day community activity streak" },
  {
    id: "photographer",
    name: "Photographer",
    icon: "📸",
    description: "Shared 20+ photos with reviews",
  },
  {
    id: "remix_master",
    name: "Remix Master",
    icon: "🎨",
    description: "Your plans were remixed 10+ times",
  },
];

// ─── In-memory stores (local-first, syncs to Supabase) ────────

let sharedPlanStore: SharedPlan[] = [];
let reviewStore: ExperienceReview[] = [];
let reputationStore: Map<string, UserReputation> = new Map();
let aiInsightStore: AIInsight[] = [];

// ─── Share a plan ──────────────────────────────────────────────

export async function sharePlan(
  userId: string,
  userName: string,
  plan: TripPlan,
  options: {
    origin: PlanOrigin;
    description?: string;
    vibeTags?: string[];
    occasionTags?: string[];
    coverImage?: string;
    authorTips?: Record<string, string>; // stopId → tip
  },
): Promise<SharedPlan> {
  const rep = getOrCreateReputation(userId);

  const shared: SharedPlan = {
    id: crypto.randomUUID?.() ?? `shared-${Date.now()}`,
    authorId: userId,
    authorName: userName,
    authorTier: rep.tier,
    origin: options.origin,
    originalPlanId: plan.id,
    title: plan.title,
    description: options.description,
    city: plan.origin.city,
    state: plan.origin.state,
    coverImage: options.coverImage,
    stops: plan.stops.map((s) => ({
      id: s.id,
      stopOrder: s.stopOrder,
      name: s.name,
      category: s.stopType,
      city: s.city,
      latitude: s.latitude,
      longitude: s.longitude,
      notes: s.notes,
      authorTip: options.authorTips?.[s.id],
      avgRating: undefined,
      reviewCount: 0,
    })),
    vibeTags: options.vibeTags ?? [],
    occasionTags: options.occasionTags ?? [],
    totalStops: plan.stops.length,
    totalDurationHours: plan.totalDurationHours ?? 0,
    estimatedCost: estimatePlanCost(plan),
    centerLat: calculateCenter(plan.stops).lat,
    centerLng: calculateCenter(plan.stops).lng,
    routePoints: plan.stops
      .filter((s) => s.latitude && s.longitude)
      .map((s) => ({ lat: s.latitude!, lng: s.longitude! })),
    saves: 0,
    completions: 0,
    avgRating: 0,
    reviewCount: 0,
    remixCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    featured: false,
  };

  sharedPlanStore.push(shared);

  // Award points
  awardPoints(userId, POINTS.sharePlan, CONFETTI_EARN.sharePlan);
  checkBadges(userId);

  // Persist
  await saveSharedPlan(shared).catch(() => {});

  return shared;
}

// ─── Remix a shared plan ───────────────────────────────────────

export function remixPlan(
  sharedPlan: SharedPlan,
  userId: string,
  modifications: {
    addStops?: SharedPlanStop[];
    removeStopIds?: string[];
    reorderStops?: string[]; // stop IDs in new order
    newTitle?: string;
    newDescription?: string;
    newVibeTags?: string[];
  },
): Partial<TripPlan> {
  let stops = [...sharedPlan.stops];

  if (modifications.removeStopIds) {
    stops = stops.filter((s) => !modifications.removeStopIds!.includes(s.id));
  }
  if (modifications.addStops) {
    stops = [...stops, ...modifications.addStops];
  }
  if (modifications.reorderStops) {
    const orderMap = new Map(modifications.reorderStops.map((id, i) => [id, i]));
    stops.sort((a, b) => (orderMap.get(a.id) ?? 99) - (orderMap.get(b.id) ?? 99));
  }

  // Increment remix count on original
  const original = sharedPlanStore.find((p) => p.id === sharedPlan.id);
  if (original) {
    original.remixCount++;
    awardPoints(original.authorId, POINTS.planGetsRemixed, CONFETTI_EARN.planGetsRemixed);
  }

  return {
    id: crypto.randomUUID?.() ?? `remix-${Date.now()}`,
    userId,
    title: modifications.newTitle ?? `${sharedPlan.title} (Remix)`,
    origin: sharedPlan.stops[0]
      ? { city: sharedPlan.city, state: sharedPlan.state }
      : { city: "Unknown" },
    destination: sharedPlan.stops[sharedPlan.stops.length - 1]
      ? {
          city: sharedPlan.stops[sharedPlan.stops.length - 1].city ?? sharedPlan.city,
        }
      : { city: sharedPlan.city },
    stops: stops.map((s, i) => ({
      id: s.id,
      stopOrder: i + 1,
      stopType: s.category as any,
      name: s.name,
      city: s.city,
      latitude: s.latitude,
      longitude: s.longitude,
      notes: s.notes,
      status: "planned" as const,
    })),
    status: "planning",
  };
}

// ─── Save a plan (bookmark) ────────────────────────────────────

export function savePlanToCollection(planId: string, userId: string): void {
  const plan = sharedPlanStore.find((p) => p.id === planId);
  if (plan) {
    plan.saves++;
    awardPoints(plan.authorId, POINTS.planGetsSaved, CONFETTI_EARN.planGetsSaved);
  }
}

// ─── Submit experience review ──────────────────────────────────

export async function submitReview(
  review: Omit<ExperienceReview, "id" | "createdAt">,
): Promise<ExperienceReview> {
  const fullReview: ExperienceReview = {
    ...review,
    id: crypto.randomUUID?.() ?? `review-${Date.now()}`,
    createdAt: new Date().toISOString(),
  };

  reviewStore.push(fullReview);

  // Update plan ratings
  const plan = sharedPlanStore.find((p) => p.id === review.planId);
  if (plan) {
    const planReviews = reviewStore.filter((r) => r.planId === plan.id);
    plan.reviewCount = planReviews.length;
    plan.avgRating = planReviews.reduce((sum, r) => sum + r.overallRating, 0) / planReviews.length;

    // Update individual stop ratings
    for (const stop of plan.stops) {
      const stopRatings = planReviews.flatMap((r) =>
        r.stopRatings.filter((sr) => sr.stopId === stop.id),
      );
      if (stopRatings.length > 0) {
        stop.avgRating = stopRatings.reduce((sum, sr) => sum + sr.rating, 0) / stopRatings.length;
        stop.reviewCount = stopRatings.length;
      }
    }
  }

  // Award points based on review type
  if (review.reviewType === "stop_rating") {
    awardPoints(review.userId, POINTS.writeStopRating, 0);
  } else if (review.reviewType === "full_story") {
    awardPoints(review.userId, POINTS.writeFullStory, CONFETTI_EARN.writeFullStory);
  }
  if (review.photos && review.photos.length > 0) {
    awardPoints(review.userId, POINTS.addPhoto * review.photos.length, 0);
  }

  // Award the plan author for a completion
  if (plan && plan.authorId !== review.userId) {
    plan.completions++;
    awardPoints(plan.authorId, POINTS.planGetsCompleted, CONFETTI_EARN.planGetsCompleted);
    awardPoints(review.userId, POINTS.completeSomeonesPlan, CONFETTI_EARN.completeSomeonesPlan);
  }

  checkBadges(review.userId);

  // Feed into AI learning
  processReviewForAI(fullReview);

  await saveReview(fullReview).catch(() => {});

  return fullReview;
}

// ─── Auto-track a visit ────────────────────────────────────────

export function autoTrackVisit(
  userId: string,
  userName: string,
  planId: string,
  stopsVisited: string[],
  totalMinutes: number,
): ExperienceReview {
  const review: ExperienceReview = {
    id: crypto.randomUUID?.() ?? `auto-${Date.now()}`,
    userId,
    userName,
    userTier: getOrCreateReputation(userId).tier,
    planId,
    reviewType: "auto_tracked",
    stopRatings: [],
    stopsVisited,
    totalTimeSpent: totalMinutes,
    visitedAt: new Date().toISOString(),
    overallRating: 0, // no rating for auto-tracked
    wouldRecommend: true,
    createdAt: new Date().toISOString(),
  };

  reviewStore.push(review);

  const plan = sharedPlanStore.find((p) => p.id === planId);
  if (plan && plan.authorId !== userId) {
    plan.completions++;
    awardPoints(plan.authorId, POINTS.planGetsCompleted, CONFETTI_EARN.planGetsCompleted);
    awardPoints(userId, POINTS.completeSomeonesPlan, CONFETTI_EARN.completeSomeonesPlan);
  }

  return review;
}

// ─── Community feed (map-based) ────────────────────────────────

export function getCommunityFeed(query: CommunityFeedQuery): SharedPlan[] {
  let results = [...sharedPlanStore];

  // Filter by city
  if (query.city) {
    results = results.filter((p) => p.city.toLowerCase().includes(query.city!.toLowerCase()));
  }

  // Filter by region
  if (query.region) {
    results = results.filter((p) => p.region?.toLowerCase() === query.region!.toLowerCase());
  }

  // Filter by proximity (if lat/lng provided)
  if (query.lat !== undefined && query.lng !== undefined) {
    const radius = query.radiusMiles ?? 25;
    results = results.filter((p) => {
      const dist = haversineDistance(query.lat!, query.lng!, p.centerLat, p.centerLng);
      return dist <= radius;
    });
  }

  // Filter by vibe tags
  if (query.vibeTags && query.vibeTags.length > 0) {
    results = results.filter((p) => query.vibeTags!.some((tag) => p.vibeTags.includes(tag)));
  }

  // Filter by occasion
  if (query.occasionTags && query.occasionTags.length > 0) {
    results = results.filter((p) =>
      query.occasionTags!.some((tag) => p.occasionTags.includes(tag)),
    );
  }

  // Sort
  switch (query.sortBy) {
    case "popular":
      results.sort((a, b) => b.saves + b.completions - (a.saves + a.completions));
      break;
    case "top_rated":
      results.sort((a, b) => b.avgRating - a.avgRating);
      break;
    case "nearby":
      if (query.lat !== undefined && query.lng !== undefined) {
        results.sort(
          (a, b) =>
            haversineDistance(query.lat!, query.lng!, a.centerLat, a.centerLng) -
            haversineDistance(query.lat!, query.lng!, b.centerLat, b.centerLng),
        );
      }
      break;
    case "newest":
    default:
      results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  // Pagination
  const offset = query.offset ?? 0;
  const limit = query.limit ?? 20;
  return results.slice(offset, offset + limit);
}

export function getSharedPlan(planId: string): SharedPlan | undefined {
  return sharedPlanStore.find((p) => p.id === planId);
}

export function getPlanReviews(planId: string): ExperienceReview[] {
  return reviewStore
    .filter((r) => r.planId === planId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function getUserSharedPlans(userId: string): SharedPlan[] {
  return sharedPlanStore
    .filter((p) => p.authorId === userId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

// ─── Reputation system ─────────────────────────────────────────

function getOrCreateReputation(userId: string): UserReputation {
  let rep = reputationStore.get(userId);
  if (!rep) {
    rep = {
      userId,
      tier: "newcomer",
      totalPoints: 0,
      confettiEarned: 0,
      plansShared: 0,
      reviewsWritten: 0,
      plansCompleted: 0,
      helpfulVotes: 0,
      currentStreak: 0,
      joinedAt: new Date().toISOString(),
      badges: [],
    };
    reputationStore.set(userId, rep);
  }
  return rep;
}

export function getUserReputation(userId: string): UserReputation {
  return getOrCreateReputation(userId);
}

function awardPoints(userId: string, points: number, confetti: number): void {
  const rep = getOrCreateReputation(userId);
  rep.totalPoints += points;
  rep.confettiEarned += confetti;
  rep.tier = calculateTier(rep.totalPoints);
}

function calculateTier(points: number): ReputationTier {
  if (points >= 10000) return "legend";
  if (points >= 2000) return "tastemaker";
  if (points >= 500) return "local_guide";
  if (points >= 100) return "explorer";
  return "newcomer";
}

export function getReputationTierInfo(tier: ReputationTier) {
  return REPUTATION_TIERS[tier];
}

export function getAllTiers(): Array<{
  tier: ReputationTier;
  minPoints: number;
  label: string;
  icon: string;
}> {
  return (
    Object.entries(REPUTATION_TIERS) as Array<
      [ReputationTier, { minPoints: number; label: string; icon: string }]
    >
  )
    .map(([tier, info]) => ({ tier, ...info }))
    .sort((a, b) => a.minPoints - b.minPoints);
}

function checkBadges(userId: string): void {
  const rep = getOrCreateReputation(userId);
  const userPlans = sharedPlanStore.filter((p) => p.authorId === userId);
  const userReviews = reviewStore.filter((r) => r.userId === userId);
  const earnedIds = new Set(rep.badges.map((b) => b.id));

  const maybeAward = (badgeId: string, condition: boolean) => {
    if (condition && !earnedIds.has(badgeId)) {
      const badge = BADGES.find((b) => b.id === badgeId);
      if (badge) {
        rep.badges.push({ ...badge, earnedAt: new Date().toISOString() });
      }
    }
  };

  maybeAward("first_share", userPlans.length >= 1);
  maybeAward("first_review", userReviews.length >= 1);
  maybeAward(
    "popular_plan",
    userPlans.some((p) => p.saves >= 10),
  );
  maybeAward("storyteller", userReviews.filter((r) => r.reviewType === "full_story").length >= 5);
  maybeAward("globetrotter", new Set(userPlans.map((p) => p.city.toLowerCase())).size >= 5);
  maybeAward("helpful", rep.helpfulVotes >= 25);
  maybeAward("tastemaker_100", userPlans.reduce((sum, p) => sum + p.completions, 0) >= 100);
  maybeAward("streak_7", rep.currentStreak >= 7);
  maybeAward(
    "photographer",
    userReviews.reduce((sum, r) => sum + (r.photos?.length ?? 0), 0) >= 20,
  );
  maybeAward("remix_master", userPlans.reduce((sum, p) => sum + p.remixCount, 0) >= 10);

  // Update stats
  rep.plansShared = userPlans.length;
  rep.reviewsWritten = userReviews.length;
}

// ─── AI Learning Pipeline ──────────────────────────────────────

function processReviewForAI(review: ExperienceReview): void {
  // Aggregate stop ratings to generate venue insights
  for (const sr of review.stopRatings) {
    const allRatingsForStop = reviewStore
      .flatMap((r) => r.stopRatings)
      .filter((r) => r.stopId === sr.stopId);

    if (allRatingsForStop.length >= 3) {
      const avg = allRatingsForStop.reduce((s, r) => s + r.rating, 0) / allRatingsForStop.length;

      // Find plan for city context
      const plan = sharedPlanStore.find((p) => p.id === review.planId);
      const city = plan?.city ?? "Unknown";

      // Generate insight
      let category: AIInsight["category"];
      if (avg >= 4.5) category = "crowd_favorite";
      else if (avg >= 4.0 && allRatingsForStop.length < 10) category = "hidden_gem";
      else if (avg < 3.0) category = "overrated";
      else category = "trending";

      const existing = aiInsightStore.findIndex((i) => i.venueId === sr.stopId);
      const insight: AIInsight = {
        venueId: sr.stopId,
        city,
        insight: generateInsightText(sr.stopName, category, avg, allRatingsForStop.length),
        confidence: Math.min(allRatingsForStop.length / 20, 1),
        basedOnReviews: allRatingsForStop.length,
        category,
      };

      if (existing >= 0) {
        aiInsightStore[existing] = insight;
      } else {
        aiInsightStore.push(insight);
      }
    }
  }
}

function generateInsightText(
  stopName: string,
  category: AIInsight["category"],
  avg: number,
  count: number,
): string {
  switch (category) {
    case "crowd_favorite":
      return `${stopName} is a community favorite — ${avg.toFixed(1)}★ across ${count} reviews. Consistently great.`;
    case "hidden_gem":
      return `${stopName} is a hidden gem — rated ${avg.toFixed(1)}★ but not widely known yet.`;
    case "overrated":
      return `${stopName} might not live up to the hype — community rates it ${avg.toFixed(1)}★.`;
    case "trending":
      return `${stopName} is trending in the community — ${count} recent reviews.`;
    default:
      return `${stopName} has ${count} community reviews averaging ${avg.toFixed(1)}★.`;
  }
}

export function getAIInsights(city: string, limit = 10): AIInsight[] {
  return aiInsightStore
    .filter((i) => i.city.toLowerCase() === city.toLowerCase())
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, limit);
}

export function getCommunityStats(): {
  totalPlans: number;
  totalReviews: number;
  totalUsers: number;
  topCities: Array<{ city: string; planCount: number }>;
} {
  const cityMap = new Map<string, number>();
  for (const plan of sharedPlanStore) {
    cityMap.set(plan.city, (cityMap.get(plan.city) ?? 0) + 1);
  }

  return {
    totalPlans: sharedPlanStore.length,
    totalReviews: reviewStore.length,
    totalUsers: reputationStore.size,
    topCities: Array.from(cityMap.entries())
      .map(([city, planCount]) => ({ city, planCount }))
      .sort((a, b) => b.planCount - a.planCount)
      .slice(0, 10),
  };
}

// ─── Helpers ───────────────────────────────────────────────────

function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 3959; // miles
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

function calculateCenter(stops: TripStop[]): { lat: number; lng: number } {
  const withCoords = stops.filter((s) => s.latitude && s.longitude);
  if (withCoords.length === 0) return { lat: 38.9072, lng: -77.0369 }; // default DC

  const lat = withCoords.reduce((sum, s) => sum + s.latitude!, 0) / withCoords.length;
  const lng = withCoords.reduce((sum, s) => sum + s.longitude!, 0) / withCoords.length;
  return { lat, lng };
}

function estimatePlanCost(plan: TripPlan): string {
  const stops = plan.stops.length;
  if (stops <= 2) return "$";
  if (stops <= 4) return "$$";
  return "$$$";
}

// ─── Database persistence ──────────────────────────────────────

async function saveSharedPlan(plan: SharedPlan): Promise<void> {
  const { error } = await supabase.from("shared_plans").upsert({
    id: plan.id,
    author_id: plan.authorId,
    author_name: plan.authorName,
    origin: plan.origin,
    original_plan_id: plan.originalPlanId,
    title: plan.title,
    description: plan.description,
    city: plan.city,
    state: plan.state,
    region: plan.region,
    cover_image: plan.coverImage,
    stops: plan.stops,
    vibe_tags: plan.vibeTags,
    occasion_tags: plan.occasionTags,
    total_stops: plan.totalStops,
    total_duration_hours: plan.totalDurationHours,
    estimated_cost: plan.estimatedCost,
    center_lat: plan.centerLat,
    center_lng: plan.centerLng,
    route_points: plan.routePoints,
  });
  if (error) console.warn("[Community] Failed to save shared plan:", error.message);
}

async function saveReview(review: ExperienceReview): Promise<void> {
  const { error } = await supabase.from("experience_reviews").upsert({
    id: review.id,
    user_id: review.userId,
    user_name: review.userName,
    plan_id: review.planId,
    review_type: review.reviewType,
    stop_ratings: review.stopRatings,
    title: review.title,
    body: review.body,
    photos: review.photos,
    stops_visited: review.stopsVisited,
    total_time_spent: review.totalTimeSpent,
    overall_rating: review.overallRating,
    would_recommend: review.wouldRecommend,
    highlight: review.highlight,
  });
  if (error) console.warn("[Community] Failed to save review:", error.message);
}

// ─── Seed demo data ────────────────────────────────────────────

export function seedCommunityDemo(): void {
  // Demo shared plans
  const demoPlans: SharedPlan[] = [
    {
      id: "demo-plan-1",
      authorId: "demo-user-sarah",
      authorName: "Sarah M.",
      authorTier: "local_guide",
      origin: "custom",
      title: "Georgetown Sunset Crawl",
      description:
        "My go-to date night route through Georgetown. Start with cocktails, walk the waterfront, end with a rooftop dinner.",
      city: "Washington",
      state: "DC",
      region: "DMV",
      stops: [
        {
          id: "ds1",
          stopOrder: 1,
          name: "The Alex",
          category: "bar",
          city: "Georgetown",
          latitude: 38.9065,
          longitude: -77.0644,
          authorTip: "Get the espresso martini — best in DC",
          avgRating: 4.6,
          reviewCount: 12,
        },
        {
          id: "ds2",
          stopOrder: 2,
          name: "Georgetown Waterfront Park",
          category: "experience",
          city: "Georgetown",
          latitude: 38.9025,
          longitude: -77.0595,
          authorTip: "Arrive right at golden hour",
          avgRating: 4.8,
          reviewCount: 8,
        },
        {
          id: "ds3",
          stopOrder: 3,
          name: "Fiola Mare",
          category: "dining",
          city: "Georgetown",
          latitude: 38.9027,
          longitude: -77.0605,
          authorTip: "Ask for the patio — harbor view is unbeatable",
          avgRating: 4.7,
          reviewCount: 15,
        },
      ],
      vibeTags: ["Romantic", "Scenic", "Upscale"],
      occasionTags: ["Date Night", "Anniversary"],
      totalStops: 3,
      totalDurationHours: 4,
      estimatedCost: "$$$",
      centerLat: 38.9039,
      centerLng: -77.0615,
      routePoints: [
        { lat: 38.9065, lng: -77.0644 },
        { lat: 38.9025, lng: -77.0595 },
        { lat: 38.9027, lng: -77.0605 },
      ],
      saves: 47,
      completions: 18,
      avgRating: 4.7,
      reviewCount: 15,
      remixCount: 6,
      createdAt: "2026-05-01T18:00:00Z",
      updatedAt: "2026-05-10T12:00:00Z",
      featured: true,
    },
    {
      id: "demo-plan-2",
      authorId: "demo-user-marcus",
      authorName: "Marcus T.",
      authorTier: "explorer",
      origin: "ai_generated",
      title: "H Street Late Night",
      description:
        "Best late-night food and vibes on H Street NE. Live music → street food → dive bar.",
      city: "Washington",
      state: "DC",
      region: "DMV",
      stops: [
        {
          id: "ds4",
          stopOrder: 1,
          name: "Rock & Roll Hotel",
          category: "experience",
          city: "H Street NE",
          latitude: 38.9002,
          longitude: -76.9878,
          authorTip: "Check who's playing that night — rooftop opens at 9",
          avgRating: 4.3,
          reviewCount: 9,
        },
        {
          id: "ds5",
          stopOrder: 2,
          name: "Toki Underground",
          category: "dining",
          city: "H Street NE",
          latitude: 38.9005,
          longitude: -76.9895,
          authorTip: "There's always a line — put your name in first, then come back",
          avgRating: 4.5,
          reviewCount: 22,
        },
        {
          id: "ds6",
          stopOrder: 3,
          name: "Copycat Co.",
          category: "bar",
          city: "H Street NE",
          latitude: 38.9001,
          longitude: -76.991,
          authorTip: "Hidden speakeasy upstairs — ring the bell",
          avgRating: 4.4,
          reviewCount: 11,
        },
      ],
      vibeTags: ["Nightlife", "Live Music", "Foodie"],
      occasionTags: ["Crew Night", "Weekend"],
      totalStops: 3,
      totalDurationHours: 5,
      estimatedCost: "$$",
      centerLat: 38.9003,
      centerLng: -76.9894,
      routePoints: [
        { lat: 38.9002, lng: -76.9878 },
        { lat: 38.9005, lng: -76.9895 },
        { lat: 38.9001, lng: -76.991 },
      ],
      saves: 31,
      completions: 12,
      avgRating: 4.4,
      reviewCount: 22,
      remixCount: 3,
      createdAt: "2026-05-05T22:00:00Z",
      updatedAt: "2026-05-09T14:00:00Z",
      featured: false,
    },
    {
      id: "demo-plan-3",
      authorId: "demo-user-jade",
      authorName: "Jade K.",
      authorTier: "tastemaker",
      origin: "custom",
      title: "14th Street Brunch Marathon",
      description:
        "The ultimate brunch hop — three spots, three vibes, one perfect Saturday morning.",
      city: "Washington",
      state: "DC",
      region: "DMV",
      stops: [
        {
          id: "ds7",
          stopOrder: 1,
          name: "Compass Coffee",
          category: "cafe",
          city: "14th St NW",
          latitude: 38.9138,
          longitude: -77.032,
          authorTip: "Best cold brew in DC, period",
          avgRating: 4.5,
          reviewCount: 18,
        },
        {
          id: "ds8",
          stopOrder: 2,
          name: "Le Diplomate",
          category: "dining",
          city: "14th St NW",
          latitude: 38.9155,
          longitude: -77.0324,
          authorTip: "Steak frites at brunch is the move",
          avgRating: 4.8,
          reviewCount: 32,
        },
        {
          id: "ds9",
          stopOrder: 3,
          name: "The Rooftop at the Graham",
          category: "bar",
          city: "14th St NW",
          latitude: 38.916,
          longitude: -77.0319,
          authorTip: "Mimosa flights and 360 views — get there before 1pm",
          avgRating: 4.3,
          reviewCount: 14,
        },
      ],
      vibeTags: ["Brunch", "Foodie", "Instagrammable"],
      occasionTags: ["Girls Brunch", "Weekend", "Birthday"],
      totalStops: 3,
      totalDurationHours: 3.5,
      estimatedCost: "$$$",
      centerLat: 38.9151,
      centerLng: -77.0321,
      routePoints: [
        { lat: 38.9138, lng: -77.032 },
        { lat: 38.9155, lng: -77.0324 },
        { lat: 38.916, lng: -77.0319 },
      ],
      saves: 82,
      completions: 34,
      avgRating: 4.6,
      reviewCount: 32,
      remixCount: 11,
      createdAt: "2026-04-20T10:00:00Z",
      updatedAt: "2026-05-11T08:00:00Z",
      featured: true,
    },
  ];

  sharedPlanStore = demoPlans;

  // Demo reputations
  reputationStore.set("demo-user-sarah", {
    userId: "demo-user-sarah",
    tier: "local_guide",
    totalPoints: 780,
    confettiEarned: 340,
    plansShared: 8,
    reviewsWritten: 15,
    plansCompleted: 12,
    helpfulVotes: 45,
    currentStreak: 5,
    joinedAt: "2026-03-01T00:00:00Z",
    badges: [
      {
        id: "first_share",
        name: "First Share",
        icon: "🎉",
        description: "Shared your first plan",
        earnedAt: "2026-03-05T00:00:00Z",
      },
      {
        id: "popular_plan",
        name: "Crowd Pleaser",
        icon: "🔥",
        description: "One of your plans got 10+ saves",
        earnedAt: "2026-04-15T00:00:00Z",
      },
    ],
  });

  reputationStore.set("demo-user-jade", {
    userId: "demo-user-jade",
    tier: "tastemaker",
    totalPoints: 2450,
    confettiEarned: 890,
    plansShared: 22,
    reviewsWritten: 48,
    plansCompleted: 30,
    helpfulVotes: 112,
    currentStreak: 14,
    joinedAt: "2026-01-15T00:00:00Z",
    badges: [
      {
        id: "first_share",
        name: "First Share",
        icon: "🎉",
        description: "Shared your first plan",
        earnedAt: "2026-01-20T00:00:00Z",
      },
      {
        id: "popular_plan",
        name: "Crowd Pleaser",
        icon: "🔥",
        description: "One of your plans got 10+ saves",
        earnedAt: "2026-02-28T00:00:00Z",
      },
      {
        id: "storyteller",
        name: "Storyteller",
        icon: "📝",
        description: "Wrote 5 full experience stories",
        earnedAt: "2026-03-10T00:00:00Z",
      },
      {
        id: "helpful",
        name: "Helpful Local",
        icon: "🤝",
        description: "Received 25+ helpful votes",
        earnedAt: "2026-04-01T00:00:00Z",
      },
      {
        id: "tastemaker_100",
        name: "Tastemaker 100",
        icon: "💎",
        description: "100+ people completed your plans",
        earnedAt: "2026-05-01T00:00:00Z",
      },
    ],
  });

  // Demo reviews
  reviewStore = [
    {
      id: "demo-review-1",
      userId: "demo-user-alex",
      userName: "Alex R.",
      userTier: "explorer",
      planId: "demo-plan-1",
      reviewType: "full_story",
      stopRatings: [
        { stopId: "ds1", stopName: "The Alex", rating: 5, note: "Best espresso martini I've had" },
        {
          stopId: "ds2",
          stopName: "Georgetown Waterfront Park",
          rating: 5,
          note: "Golden hour was perfect",
        },
        {
          stopId: "ds3",
          stopName: "Fiola Mare",
          rating: 4,
          note: "Food was amazing, service was slow",
        },
      ],
      title: "Perfect anniversary evening",
      body: "Followed this plan for our 3rd anniversary and it was absolutely perfect. The timing between stops was spot on.",
      photos: [],
      overallRating: 5,
      wouldRecommend: true,
      highlight: "The waterfront walk at sunset made the whole night",
      createdAt: "2026-05-08T23:00:00Z",
    },
    {
      id: "demo-review-2",
      userId: "demo-user-kim",
      userName: "Kim L.",
      userTier: "newcomer",
      planId: "demo-plan-3",
      reviewType: "stop_rating",
      stopRatings: [
        { stopId: "ds7", stopName: "Compass Coffee", rating: 5, note: "The cold brew is no joke" },
        {
          stopId: "ds8",
          stopName: "Le Diplomate",
          rating: 5,
          note: "Steak frites is life-changing",
        },
        {
          stopId: "ds9",
          stopName: "The Rooftop at the Graham",
          rating: 4,
          note: "Views are great, drinks are pricey",
        },
      ],
      overallRating: 5,
      wouldRecommend: true,
      highlight: "Le Diplomate brunch alone is worth the whole plan",
      createdAt: "2026-05-10T14:00:00Z",
    },
  ];
}
