/**
 * Feedback Pipeline Agent
 *
 * Ingest, categorize, deduplicate, and prioritize user feedback
 * for Confetti. Supports bug reports, feature requests, complaints,
 * praise, and suggestions from multiple sources.
 *
 * Features:
 *  - Auto-triage: AI categorizes, sets priority, detects sentiment
 *  - Duplicate detection via keyword overlap scoring (>60% = duplicate)
 *  - Vote-based prioritization for feature requests
 *  - Trending analysis: category counts + sentiment shifts
 *  - Export feedback reports for roadmap planning
 *  - Multi-source ingestion: in-app, App Store, email, social, support tickets
 */

import { supabase } from "../supabase";

// ═══════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════

export type FeedbackType = "bug_report" | "feature_request" | "complaint" | "praise" | "suggestion";
export type FeedbackStatus =
  | "new"
  | "triaged"
  | "in_progress"
  | "shipped"
  | "won't_fix"
  | "duplicate";
export type FeedbackPriority = "critical" | "high" | "medium" | "low";
export type FeedbackSource = "in_app" | "app_store" | "email" | "social" | "support_ticket";

export interface FeedbackItem {
  id: string;
  userId?: string;
  userEmail?: string;
  type: FeedbackType;
  source: FeedbackSource;
  title: string;
  description: string;
  priority: FeedbackPriority;
  status: FeedbackStatus;
  category: string;
  tags: string[];
  duplicateOfId?: string;
  voteCount: number;
  aiSummary?: string;
  aiSentiment?: "positive" | "negative" | "neutral";
  deviceInfo?: string;
  appVersion?: string;
  screenshotUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FeedbackTrend {
  category: string;
  count: number;
  avgSentiment: number;
  trending: "up" | "down" | "stable";
}

export interface FeedbackQueueFilter {
  type?: FeedbackType;
  status?: FeedbackStatus;
  priority?: FeedbackPriority;
  source?: FeedbackSource;
}

export interface FeedbackStats {
  totalFeedback: number;
  byType: Record<FeedbackType, number>;
  byStatus: Record<FeedbackStatus, number>;
  bySource: Record<FeedbackSource, number>;
  avgTimeToTriageMs: number;
  duplicateRate: number;
}

export interface FeedbackReport {
  dateRange: { start: string; end: string };
  totalItems: number;
  topFeatureRequests: FeedbackItem[];
  criticalBugs: FeedbackItem[];
  trends: FeedbackTrend[];
  sentimentBreakdown: { positive: number; negative: number; neutral: number };
  sourceBreakdown: Record<FeedbackSource, number>;
}

// ═══════════════════════════════════════════════════════════
// Constants
// ═══════════════════════════════════════════════════════════

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  ui_ux: [
    "design",
    "layout",
    "button",
    "screen",
    "ui",
    "ux",
    "color",
    "font",
    "dark mode",
    "interface",
    "navigation",
    "menu",
  ],
  performance: [
    "slow",
    "lag",
    "loading",
    "speed",
    "freeze",
    "hang",
    "timeout",
    "memory",
    "battery",
  ],
  ai_recommendations: [
    "recommendation",
    "suggest",
    "ai",
    "wrong venue",
    "bad pick",
    "irrelevant",
    "taste",
    "vibe",
    "match",
  ],
  group_features: ["group", "party", "friends", "invite", "vote", "merge", "collab", "room"],
  booking_reservations: [
    "booking",
    "reservation",
    "table",
    "rsvp",
    "cancel",
    "waitlist",
    "confirm",
  ],
  payments_billing: [
    "payment",
    "billing",
    "charge",
    "refund",
    "subscription",
    "price",
    "coupon",
    "credit",
  ],
  venue_data: ["venue", "restaurant", "bar", "club", "hours", "address", "closed", "menu", "phone"],
  notifications: ["notification", "push", "alert", "email", "spam", "too many", "turn off"],
  onboarding: [
    "onboarding",
    "signup",
    "sign up",
    "new user",
    "tutorial",
    "getting started",
    "first time",
  ],
  social_sharing: ["share", "social", "post", "story", "instagram", "tiktok", "twitter"],
};

const SENTIMENT_KEYWORDS = {
  positive: [
    "love",
    "great",
    "awesome",
    "amazing",
    "perfect",
    "excellent",
    "best",
    "wonderful",
    "fantastic",
    "brilliant",
    "helpful",
    "beautiful",
    "intuitive",
  ],
  negative: [
    "hate",
    "terrible",
    "awful",
    "worst",
    "horrible",
    "broken",
    "useless",
    "annoying",
    "frustrating",
    "disappointed",
    "waste",
    "garbage",
    "trash",
  ],
};

const PRIORITY_KEYWORDS: Record<FeedbackPriority, string[]> = {
  critical: [
    "crash",
    "data loss",
    "can't login",
    "security",
    "locked out",
    "money",
    "charged",
    "urgent",
    "broken completely",
  ],
  high: ["not working", "error", "fail", "bug", "wrong", "missing", "deleted", "lost"],
  medium: ["should", "could", "improve", "better", "slow", "confusing", "hard to"],
  low: ["nice to have", "idea", "wish", "maybe", "someday", "minor", "small"],
};

// Stop words to exclude from overlap comparison
const STOP_WORDS = new Set([
  "the",
  "a",
  "an",
  "is",
  "are",
  "was",
  "were",
  "be",
  "been",
  "being",
  "have",
  "has",
  "had",
  "do",
  "does",
  "did",
  "will",
  "would",
  "could",
  "should",
  "may",
  "might",
  "can",
  "shall",
  "to",
  "of",
  "in",
  "for",
  "on",
  "with",
  "at",
  "by",
  "from",
  "as",
  "into",
  "through",
  "during",
  "before",
  "after",
  "above",
  "below",
  "between",
  "out",
  "off",
  "over",
  "under",
  "again",
  "further",
  "then",
  "once",
  "here",
  "there",
  "when",
  "where",
  "why",
  "how",
  "all",
  "each",
  "every",
  "both",
  "few",
  "more",
  "most",
  "other",
  "some",
  "such",
  "no",
  "nor",
  "not",
  "only",
  "own",
  "same",
  "so",
  "than",
  "too",
  "very",
  "just",
  "because",
  "but",
  "and",
  "or",
  "if",
  "while",
  "about",
  "up",
  "it",
  "its",
  "i",
  "my",
  "me",
  "we",
  "our",
  "you",
  "your",
  "they",
  "their",
  "this",
  "that",
  "these",
  "what",
  "which",
  "who",
  "whom",
  "app",
  "confetti",
]);

// ═══════════════════════════════════════════════════════════
// In-Memory Store (local-first)
// ═══════════════════════════════════════════════════════════

const feedbackStore = new Map<string, FeedbackItem>();
const voteStore = new Map<string, Set<string>>(); // feedbackId → set of userIds who voted

let idCounter = 8000;
function nextId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${(idCounter++).toString(36)}`;
}

// ═══════════════════════════════════════════════════════════
// Triage & Classification
// ═══════════════════════════════════════════════════════════

/** AI-triage a feedback item: categorize, prioritize, detect sentiment, check duplicates */
export function triageFeedback(feedbackId: string): FeedbackItem | null {
  const item = feedbackStore.get(feedbackId);
  if (!item) return null;

  const text = `${item.title} ${item.description}`.toLowerCase();

  // Categorize
  item.category = detectCategory(text);

  // Prioritize
  item.priority = detectPriority(text, item.type);

  // Sentiment
  item.aiSentiment = detectSentiment(text);

  // Generate summary
  item.aiSummary = generateSummary(item);

  // Auto-tag
  item.tags = generateTags(text, item.type, item.category);

  // Check for duplicates
  const duplicates = findDuplicates(feedbackId);
  if (duplicates.length > 0) {
    item.duplicateOfId = duplicates[0].id;
    item.status = "duplicate";
  } else {
    item.status = "triaged";
  }

  item.updatedAt = new Date().toISOString();
  return item;
}

/** Detect the most likely category using keyword matching */
function detectCategory(text: string): string {
  let bestCategory = "general";
  let bestScore = 0;

  for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    const score = keywords.filter((kw) => text.includes(kw)).length;
    if (score > bestScore) {
      bestScore = score;
      bestCategory = cat;
    }
  }
  return bestCategory;
}

/** Detect priority from keyword patterns + feedback type */
function detectPriority(text: string, type: FeedbackType): FeedbackPriority {
  for (const priority of ["critical", "high", "medium", "low"] as FeedbackPriority[]) {
    if (PRIORITY_KEYWORDS[priority].some((kw) => text.includes(kw))) {
      return priority;
    }
  }
  // Defaults by type
  switch (type) {
    case "bug_report":
      return "medium";
    case "complaint":
      return "medium";
    case "feature_request":
      return "low";
    case "praise":
      return "low";
    case "suggestion":
      return "low";
    default:
      return "low";
  }
}

/** Detect sentiment using keyword scoring */
function detectSentiment(text: string): "positive" | "negative" | "neutral" {
  const posScore = SENTIMENT_KEYWORDS.positive.filter((kw) => text.includes(kw)).length;
  const negScore = SENTIMENT_KEYWORDS.negative.filter((kw) => text.includes(kw)).length;

  if (posScore > negScore && posScore > 0) return "positive";
  if (negScore > posScore && negScore > 0) return "negative";
  return "neutral";
}

/** Generate a brief AI summary */
function generateSummary(item: FeedbackItem): string {
  const typeLabel: Record<FeedbackType, string> = {
    bug_report: "Bug report",
    feature_request: "Feature request",
    complaint: "Complaint",
    praise: "Positive feedback",
    suggestion: "Suggestion",
  };
  return `${typeLabel[item.type]} about ${item.category.replace(/_/g, " ")}: ${item.title}`;
}

/** Generate tags from content analysis */
function generateTags(text: string, type: FeedbackType, category: string): string[] {
  const tags: string[] = [type, category];

  // Add matched category keywords as tags
  for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    for (const kw of keywords) {
      if (text.includes(kw) && !tags.includes(kw)) {
        tags.push(kw);
      }
    }
  }

  return tags.slice(0, 8); // cap at 8 tags
}

// ═══════════════════════════════════════════════════════════
// Duplicate Detection
// ═══════════════════════════════════════════════════════════

/** Find potential duplicates using keyword overlap scoring (>60% = duplicate) */
export function findDuplicates(feedbackId: string): FeedbackItem[] {
  const item = feedbackStore.get(feedbackId);
  if (!item) return [];

  const itemWords = extractKeywords(`${item.title} ${item.description}`);
  if (itemWords.size === 0) return [];

  const duplicates: Array<{ item: FeedbackItem; overlap: number }> = [];

  for (const [otherId, other] of feedbackStore) {
    if (otherId === feedbackId) continue;
    // Only compare within same type or closely related types
    if (other.type !== item.type && !areRelatedTypes(item.type, other.type)) continue;

    const otherWords = extractKeywords(`${other.title} ${other.description}`);
    if (otherWords.size === 0) continue;

    const overlap = calculateOverlap(itemWords, otherWords);
    if (overlap > 0.6) {
      duplicates.push({ item: other, overlap });
    }
  }

  return duplicates.sort((a, b) => b.overlap - a.overlap).map((d) => d.item);
}

/** Extract meaningful keywords from text, excluding stop words */
function extractKeywords(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, "")
      .split(/\s+/)
      .filter((w) => w.length > 2 && !STOP_WORDS.has(w)),
  );
}

/** Calculate Jaccard-like overlap between two keyword sets */
function calculateOverlap(a: Set<string>, b: Set<string>): number {
  let intersection = 0;
  for (const word of a) {
    if (b.has(word)) intersection++;
  }
  const union = a.size + b.size - intersection;
  return union > 0 ? intersection / union : 0;
}

/** Check if two feedback types are related enough for duplicate comparison */
function areRelatedTypes(a: FeedbackType, b: FeedbackType): boolean {
  const relatedGroups: FeedbackType[][] = [
    ["bug_report", "complaint"],
    ["feature_request", "suggestion"],
  ];
  return relatedGroups.some((group) => group.includes(a) && group.includes(b));
}

// ═══════════════════════════════════════════════════════════
// Feedback Management
// ═══════════════════════════════════════════════════════════

/** Submit new feedback — creates and auto-triages */
export function submitFeedback(
  type: FeedbackType,
  title: string,
  description: string,
  source: FeedbackSource,
  userId?: string,
  metadata?: {
    userEmail?: string;
    deviceInfo?: string;
    appVersion?: string;
    screenshotUrl?: string;
  },
): FeedbackItem {
  const item: FeedbackItem = {
    id: nextId("fb"),
    userId,
    userEmail: metadata?.userEmail,
    type,
    source,
    title,
    description,
    priority: "low", // will be overridden by triage
    status: "new",
    category: "general", // will be overridden by triage
    tags: [],
    voteCount: 0,
    deviceInfo: metadata?.deviceInfo,
    appVersion: metadata?.appVersion,
    screenshotUrl: metadata?.screenshotUrl,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  feedbackStore.set(item.id, item);
  voteStore.set(item.id, new Set());

  // Auto-triage
  triageFeedback(item.id);

  return feedbackStore.get(item.id)!;
}

/** Vote on a feedback item (upvote a feature request, etc.) */
export function voteFeedback(feedbackId: string, userId: string): FeedbackItem | null {
  const item = feedbackStore.get(feedbackId);
  if (!item) return null;

  const voters = voteStore.get(feedbackId) ?? new Set();
  if (voters.has(userId)) return item; // already voted

  voters.add(userId);
  voteStore.set(feedbackId, voters);
  item.voteCount = voters.size;
  item.updatedAt = new Date().toISOString();
  return item;
}

/** Update feedback status */
export function updateFeedbackStatus(
  feedbackId: string,
  status: FeedbackStatus,
): FeedbackItem | null {
  const item = feedbackStore.get(feedbackId);
  if (!item) return null;

  item.status = status;
  item.updatedAt = new Date().toISOString();
  return item;
}

// ═══════════════════════════════════════════════════════════
// Retrieval & Filtering
// ═══════════════════════════════════════════════════════════

/** Get filtered feedback queue */
export function getFeedbackQueue(filter?: FeedbackQueueFilter): FeedbackItem[] {
  let items = Array.from(feedbackStore.values());

  if (filter?.type) items = items.filter((i) => i.type === filter.type);
  if (filter?.status) items = items.filter((i) => i.status === filter.status);
  if (filter?.priority) items = items.filter((i) => i.priority === filter.priority);
  if (filter?.source) items = items.filter((i) => i.source === filter.source);

  // Sort: critical first, then by votes, then by date
  const priorityRank: Record<FeedbackPriority, number> = {
    critical: 4,
    high: 3,
    medium: 2,
    low: 1,
  };
  return items.sort((a, b) => {
    const pDiff = priorityRank[b.priority] - priorityRank[a.priority];
    if (pDiff !== 0) return pDiff;
    if (b.voteCount !== a.voteCount) return b.voteCount - a.voteCount;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}

/** Get most-voted feature requests */
export function getTopRequested(limit: number = 10): FeedbackItem[] {
  return Array.from(feedbackStore.values())
    .filter((i) => i.type === "feature_request" && i.status !== "duplicate")
    .sort((a, b) => b.voteCount - a.voteCount)
    .slice(0, limit);
}

/** Get bugs sorted by priority */
export function getBugsByPriority(): FeedbackItem[] {
  const priorityRank: Record<FeedbackPriority, number> = {
    critical: 4,
    high: 3,
    medium: 2,
    low: 1,
  };
  return Array.from(feedbackStore.values())
    .filter((i) => i.type === "bug_report" && i.status !== "duplicate")
    .sort((a, b) => priorityRank[b.priority] - priorityRank[a.priority]);
}

// ═══════════════════════════════════════════════════════════
// Trends & Analytics
// ═══════════════════════════════════════════════════════════

/** Get trending categories and sentiment shifts over a time window */
export function getFeedbackTrends(days: number = 30): FeedbackTrend[] {
  const cutoff = Date.now() - days * 86400000;
  const midpoint = Date.now() - (days / 2) * 86400000;

  const recentItems = Array.from(feedbackStore.values()).filter(
    (i) => new Date(i.createdAt).getTime() >= cutoff,
  );

  // Aggregate by category
  const categoryData = new Map<
    string,
    { count: number; sentimentSum: number; recentHalf: number; olderHalf: number }
  >();

  for (const item of recentItems) {
    const cat = item.category;
    const data = categoryData.get(cat) ?? {
      count: 0,
      sentimentSum: 0,
      recentHalf: 0,
      olderHalf: 0,
    };
    data.count++;
    data.sentimentSum +=
      item.aiSentiment === "positive" ? 1 : item.aiSentiment === "negative" ? -1 : 0;

    if (new Date(item.createdAt).getTime() >= midpoint) {
      data.recentHalf++;
    } else {
      data.olderHalf++;
    }
    categoryData.set(cat, data);
  }

  const trends: FeedbackTrend[] = [];
  for (const [category, data] of categoryData) {
    let trending: "up" | "down" | "stable" = "stable";
    if (data.recentHalf > data.olderHalf * 1.3) trending = "up";
    else if (data.recentHalf < data.olderHalf * 0.7) trending = "down";

    trends.push({
      category,
      count: data.count,
      avgSentiment: data.count > 0 ? data.sentimentSum / data.count : 0,
      trending,
    });
  }

  return trends.sort((a, b) => b.count - a.count);
}

/** Get feedback stats */
export function getFeedbackStats(): FeedbackStats {
  const items = Array.from(feedbackStore.values());

  const byType: Record<FeedbackType, number> = {
    bug_report: 0,
    feature_request: 0,
    complaint: 0,
    praise: 0,
    suggestion: 0,
  };
  const byStatus: Record<FeedbackStatus, number> = {
    new: 0,
    triaged: 0,
    in_progress: 0,
    shipped: 0,
    "won't_fix": 0,
    duplicate: 0,
  };
  const bySource: Record<FeedbackSource, number> = {
    in_app: 0,
    app_store: 0,
    email: 0,
    social: 0,
    support_ticket: 0,
  };

  let triagedCount = 0;
  let totalTriageTime = 0;
  let duplicateCount = 0;

  for (const item of items) {
    byType[item.type]++;
    byStatus[item.status]++;
    bySource[item.source]++;

    if (item.status !== "new") {
      triagedCount++;
      totalTriageTime += new Date(item.updatedAt).getTime() - new Date(item.createdAt).getTime();
    }
    if (item.status === "duplicate") duplicateCount++;
  }

  return {
    totalFeedback: items.length,
    byType,
    byStatus,
    bySource,
    avgTimeToTriageMs: triagedCount > 0 ? totalTriageTime / triagedCount : 0,
    duplicateRate: items.length > 0 ? duplicateCount / items.length : 0,
  };
}

/** Export a feedback report for roadmap planning */
export function exportFeedbackReport(dateRange: { start: string; end: string }): FeedbackReport {
  const startTime = new Date(dateRange.start).getTime();
  const endTime = new Date(dateRange.end).getTime();

  const items = Array.from(feedbackStore.values()).filter((i) => {
    const t = new Date(i.createdAt).getTime();
    return t >= startTime && t <= endTime;
  });

  const sentimentBreakdown = { positive: 0, negative: 0, neutral: 0 };
  const sourceBreakdown: Record<FeedbackSource, number> = {
    in_app: 0,
    app_store: 0,
    email: 0,
    social: 0,
    support_ticket: 0,
  };

  for (const item of items) {
    if (item.aiSentiment) sentimentBreakdown[item.aiSentiment]++;
    sourceBreakdown[item.source]++;
  }

  return {
    dateRange,
    totalItems: items.length,
    topFeatureRequests: items
      .filter((i) => i.type === "feature_request" && i.status !== "duplicate")
      .sort((a, b) => b.voteCount - a.voteCount)
      .slice(0, 10),
    criticalBugs: items
      .filter((i) => i.type === "bug_report" && i.priority === "critical")
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    trends: getFeedbackTrends(Math.ceil((endTime - startTime) / 86400000)),
    sentimentBreakdown,
    sourceBreakdown,
  };
}

// ═══════════════════════════════════════════════════════════
// Demo Seed
// ═══════════════════════════════════════════════════════════

/** Create sample feedback items for demo */
export function seedFeedbackDemo(): FeedbackItem[] {
  const samples: Array<{
    type: FeedbackType;
    title: string;
    description: string;
    source: FeedbackSource;
    userId?: string;
  }> = [
    {
      type: "bug_report",
      title: "App crashes when switching between group tabs",
      description:
        "Every time I switch between the group chat and the group plan tab, the app crashes. Happens on iOS 18. This is really frustrating because I lose my place in the conversation.",
      source: "in_app",
      userId: "user_001",
    },
    {
      type: "feature_request",
      title: "Add dark mode please!",
      description:
        "Love the app but using it at night in bars and clubs is way too bright. A dark mode option would be amazing. Maybe even an auto-switch based on time of day?",
      source: "in_app",
      userId: "user_002",
    },
    {
      type: "feature_request",
      title: "Dark mode for nighttime use",
      description:
        "It would be great to have dark mode. The screen is very bright when I'm out at restaurants in the evening. A darker theme would help a lot.",
      source: "app_store",
      userId: "user_009",
    },
    {
      type: "praise",
      title: "Best night out planning app ever!",
      description:
        "This app is amazing! Planned a whole birthday night out for my friend and every single recommendation was perfect. The AI really understood the vibe we were going for. Love it!",
      source: "app_store",
      userId: "user_003",
    },
    {
      type: "complaint",
      title: "AI recommendations are terrible for my area",
      description:
        "I live in a smaller city and the AI keeps recommending venues that are 30+ miles away. The recommendations feel irrelevant and the app is basically useless outside of major cities.",
      source: "email",
      userId: "user_004",
    },
    {
      type: "suggestion",
      title: "Integration with Apple Maps for directions",
      description:
        "It would be nice if the itinerary stops could open directly in Apple Maps or Google Maps for turn-by-turn navigation between venues.",
      source: "in_app",
      userId: "user_005",
    },
    {
      type: "bug_report",
      title: "Can't login after updating to latest version",
      description:
        "After updating the app I can't login anymore. It just shows a white screen. I've tried reinstalling and resetting my password but nothing works. Locked out of my account completely.",
      source: "support_ticket",
      userId: "user_006",
    },
    {
      type: "feature_request",
      title: "Budget tracker for group outings",
      description:
        "When planning with a group, it would be helpful to have a shared budget tracker so everyone can see the estimated cost per person for the night out.",
      source: "in_app",
      userId: "user_007",
    },
    {
      type: "complaint",
      title: "Too many push notifications",
      description:
        "I'm getting way too many push notifications from this app. Multiple per day about venues I'm not even interested in. There's no way to control notification frequency in settings.",
      source: "app_store",
      userId: "user_008",
    },
    {
      type: "suggestion",
      title: "Add Spotify playlist integration for venue vibes",
      description:
        "Would be cool if each venue had a Spotify playlist that matches the vibe so you can preview what the atmosphere will be like before you go.",
      source: "social",
      userId: "user_010",
    },
  ];

  const items: FeedbackItem[] = [];

  for (const s of samples) {
    const item = submitFeedback(s.type, s.title, s.description, s.source, s.userId);
    items.push(item);
  }

  // Add some votes to feature requests
  const featureRequests = items.filter((i) => i.type === "feature_request");
  if (featureRequests.length > 0) {
    // Dark mode gets lots of votes
    for (let i = 0; i < 47; i++) {
      voteFeedback(featureRequests[0].id, `voter_${i}`);
    }
    // Budget tracker gets some votes
    if (featureRequests.length > 1) {
      for (let i = 0; i < 23; i++) {
        voteFeedback(featureRequests[featureRequests.length - 1].id, `voter_budget_${i}`);
      }
    }
  }

  return items;
}
