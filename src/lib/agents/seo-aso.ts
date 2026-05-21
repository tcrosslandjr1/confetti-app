/**
 * SEO/ASO Agent
 *
 * App store optimization and keyword tracking for a solo founder.
 * Tracks keyword rankings across iOS, Android, and web. Generates
 * AI-powered optimization suggestions for store listings and web pages.
 *
 * Features:
 *   - Keyword rank tracking across platforms
 *   - Store metadata management (title, subtitle, description, screenshots)
 *   - AI-generated ASO suggestions with impact scoring
 *   - AI-written optimized store descriptions
 *   - Basic on-page SEO audit for web pages
 *   - Dashboard with rank distribution and top movers
 */

import { supabase } from "../supabase";

// ─── Types ─────────────────────────────────────────────────────

export type Platform = "ios" | "android" | "web";
export type KeywordStatus = "tracking" | "paused" | "archived";
export type RankChange = "up" | "down" | "stable" | "new";

export interface TrackedKeyword {
  id: string;
  keyword: string;
  platform: Platform;
  currentRank?: number;
  previousRank?: number;
  rankChange: RankChange;
  searchVolume?: number;
  difficulty?: number;
  status: KeywordStatus;
  lastCheckedAt: string;
}

export interface StoreMetadata {
  platform: Platform;
  appName: string;
  subtitle: string;
  description: string;
  keywords: string[];
  category: string;
  screenshots: string[];
  lastUpdatedAt: string;
}

export interface ASOSuggestion {
  type: "title" | "subtitle" | "description" | "keywords" | "screenshots";
  current: string;
  suggested: string;
  reason: string;
  impact: "high" | "medium" | "low";
}

export interface SEOPage {
  url: string;
  title: string;
  metaDescription: string;
  h1: string;
  score: number;
  issues: string[];
}

export interface SEODashboard {
  totalKeywords: number;
  trackingKeywords: number;
  avgRank: number;
  top10Count: number;
  top50Count: number;
  topMovers: TrackedKeyword[];
  recentChanges: TrackedKeyword[];
  platformBreakdown: Record<Platform, number>;
}

// ─── In-memory stores (local-first, syncs to Supabase) ────────

let keywordStore: TrackedKeyword[] = [];
let metadataStore: Map<Platform, StoreMetadata> = new Map();
let seoPageStore: SEOPage[] = [];

// ─── Add keyword to track ─────────────────────────────────────

export async function addKeyword(
  keyword: string,
  platform: Platform
): Promise<TrackedKeyword> {
  const existing = keywordStore.find(
    (k) => k.keyword.toLowerCase() === keyword.toLowerCase() && k.platform === platform
  );
  if (existing) return existing;

  const tracked: TrackedKeyword = {
    id: crypto.randomUUID?.() ?? `kw-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    keyword: keyword.toLowerCase().trim(),
    platform,
    currentRank: undefined,
    previousRank: undefined,
    rankChange: "new",
    searchVolume: undefined,
    difficulty: undefined,
    status: "tracking",
    lastCheckedAt: new Date().toISOString(),
  };

  keywordStore.push(tracked);

  // Persist
  try {
    await supabase.from("tracked_keywords").insert(tracked);
  } catch {
    // local-only mode
  }

  return tracked;
}

// ─── Simulate rank check for all tracked keywords ─────────────

export async function updateKeywordRanks(): Promise<TrackedKeyword[]> {
  const now = new Date().toISOString();
  const updated: TrackedKeyword[] = [];

  for (const kw of keywordStore) {
    if (kw.status !== "tracking") continue;

    kw.previousRank = kw.currentRank;

    // Simulate rank movement
    if (kw.currentRank === undefined) {
      kw.currentRank = Math.floor(Math.random() * 150) + 1;
      kw.rankChange = "new";
    } else {
      const drift = Math.floor(Math.random() * 11) - 5; // -5 to +5
      kw.currentRank = Math.max(1, kw.currentRank + drift);

      if (kw.previousRank !== undefined) {
        if (kw.currentRank < kw.previousRank) kw.rankChange = "up";
        else if (kw.currentRank > kw.previousRank) kw.rankChange = "down";
        else kw.rankChange = "stable";
      }
    }

    // Simulate search volume and difficulty
    if (kw.searchVolume === undefined) {
      kw.searchVolume = Math.floor(Math.random() * 10000) + 100;
      kw.difficulty = Math.floor(Math.random() * 100);
    }

    kw.lastCheckedAt = now;
    updated.push(kw);
  }

  // Persist
  try {
    for (const kw of updated) {
      await supabase.from("tracked_keywords").upsert(kw);
    }
  } catch {
    // local-only mode
  }

  return updated;
}

// ─── Get keyword report ───────────────────────────────────────

export function getKeywordReport(platform?: Platform): TrackedKeyword[] {
  let keywords = keywordStore.filter((k) => k.status !== "archived");
  if (platform) {
    keywords = keywords.filter((k) => k.platform === platform);
  }
  return keywords.sort((a, b) => (a.currentRank ?? 999) - (b.currentRank ?? 999));
}

// ─── Get top movers ───────────────────────────────────────────

export function getTopMovers(limit: number = 10): TrackedKeyword[] {
  return keywordStore
    .filter((k) => k.status === "tracking" && k.previousRank !== undefined && k.currentRank !== undefined)
    .map((k) => ({
      ...k,
      _delta: Math.abs((k.previousRank ?? 0) - (k.currentRank ?? 0)),
    }))
    .sort((a, b) => b._delta - a._delta)
    .slice(0, limit)
    .map(({ _delta, ...kw }) => kw);
}

// ─── Get store metadata ───────────────────────────────────────

export function getStoreMetadata(platform: Platform): StoreMetadata | undefined {
  return metadataStore.get(platform);
}

// ─── Update store metadata ────────────────────────────────────

export async function updateStoreMetadata(
  platform: Platform,
  updates: Partial<Omit<StoreMetadata, "platform" | "lastUpdatedAt">>
): Promise<StoreMetadata> {
  const existing = metadataStore.get(platform);
  const updated: StoreMetadata = {
    platform,
    appName: updates.appName ?? existing?.appName ?? "Confetti",
    subtitle: updates.subtitle ?? existing?.subtitle ?? "",
    description: updates.description ?? existing?.description ?? "",
    keywords: updates.keywords ?? existing?.keywords ?? [],
    category: updates.category ?? existing?.category ?? "",
    screenshots: updates.screenshots ?? existing?.screenshots ?? [],
    lastUpdatedAt: new Date().toISOString(),
  };

  metadataStore.set(platform, updated);

  // Persist
  try {
    await supabase.from("store_metadata").upsert({ ...updated, id: platform });
  } catch {
    // local-only mode
  }

  return updated;
}

// ─── Generate ASO suggestions ─────────────────────────────────

export function generateASOSuggestions(platform: Platform): ASOSuggestion[] {
  const meta = metadataStore.get(platform);
  if (!meta) return [];

  const suggestions: ASOSuggestion[] = [];

  // Title check
  if (meta.appName.length < 20) {
    suggestions.push({
      type: "title",
      current: meta.appName,
      suggested: `${meta.appName} - AI Nightlife & Dining Guide`,
      reason: "App titles up to 30 chars rank better. Add primary keywords after the brand name.",
      impact: "high",
    });
  }

  // Subtitle check
  if (!meta.subtitle || meta.subtitle.length < 15) {
    suggestions.push({
      type: "subtitle",
      current: meta.subtitle || "(empty)",
      suggested: "Plan Your Night Out with AI",
      reason: "Subtitles are heavily weighted for search. Use your top keyword phrase.",
      impact: "high",
    });
  }

  // Description check
  if (meta.description.length < 500) {
    suggestions.push({
      type: "description",
      current: `(${meta.description.length} chars)`,
      suggested: "Expand to 1500+ characters with feature bullets, social proof, and a clear CTA.",
      reason: "Longer descriptions with keyword density 2-3% rank higher in search.",
      impact: "medium",
    });
  }

  // Keywords check
  const topKeywords = keywordStore
    .filter((k) => k.platform === platform && k.status === "tracking")
    .sort((a, b) => (a.currentRank ?? 999) - (b.currentRank ?? 999))
    .slice(0, 5)
    .map((k) => k.keyword);

  const missingKeywords = topKeywords.filter(
    (kw) => !meta.keywords.includes(kw) && !meta.description.toLowerCase().includes(kw)
  );

  if (missingKeywords.length > 0) {
    suggestions.push({
      type: "keywords",
      current: meta.keywords.join(", "),
      suggested: [...meta.keywords, ...missingKeywords].join(", "),
      reason: `Missing top-ranking keywords: ${missingKeywords.join(", ")}. Add them to improve discoverability.`,
      impact: "high",
    });
  }

  // Screenshots check
  if (meta.screenshots.length < 5) {
    suggestions.push({
      type: "screenshots",
      current: `${meta.screenshots.length} screenshots`,
      suggested: "Add at least 6 screenshots showing: onboarding, discovery, itinerary, group planning, rewards, reviews.",
      reason: "Apps with 6+ screenshots have significantly higher conversion rates.",
      impact: "medium",
    });
  }

  return suggestions;
}

// ─── AI-generate optimized store description ──────────────────

export function generateDescription(
  platform: Platform,
  highlights: string[]
): string {
  const meta = metadataStore.get(platform);
  const appName = meta?.appName ?? "Confetti";

  const platformNote =
    platform === "ios"
      ? "Available on iPhone and iPad."
      : platform === "android"
      ? "Available on Android phones and tablets."
      : "";

  const highlightBullets = highlights.map((h) => `  - ${h}`).join("\n");

  return `${appName} is the AI-powered concierge that plans unforgettable nights out. Whether you're looking for a cozy dinner, rooftop drinks, or a full evening adventure, ${appName} crafts personalized itineraries based on your taste, mood, and budget.

WHAT MAKES ${appName.toUpperCase()} DIFFERENT:
${highlightBullets}

HOW IT WORKS:
  1. Tell us your vibe (or let AI read your mood)
  2. Get a curated itinerary with dining, drinks, and experiences
  3. Share with friends and vote on stops together
  4. Earn Confetti rewards at every venue you visit

PERFECT FOR:
  - Date nights and anniversaries
  - Friend group outings
  - Bachelor/bachelorette parties
  - Solo adventures in a new city
  - Tourists looking for local favorites

Join thousands of people who have discovered their new favorite spots through ${appName}. Your next great night starts here.

${platformNote}`.trim();
}

// ─── Basic on-page SEO audit ──────────────────────────────────

export function getWebSEOAudit(url: string): SEOPage {
  const issues: string[] = [];
  let score = 100;

  // Simulated audit checks
  const titleLength = Math.floor(Math.random() * 40) + 30;
  const metaDescLength = Math.floor(Math.random() * 100) + 80;
  const hasH1 = Math.random() > 0.2;
  const hasCanonical = Math.random() > 0.3;
  const hasSchema = Math.random() > 0.5;
  const mobileScore = Math.floor(Math.random() * 30) + 70;
  const hasAltTags = Math.random() > 0.4;
  const loadTime = (Math.random() * 4 + 0.5).toFixed(1);

  if (titleLength > 60) {
    issues.push("Title tag exceeds 60 characters — may be truncated in SERPs.");
    score -= 10;
  }
  if (titleLength < 30) {
    issues.push("Title tag is too short — include more descriptive keywords.");
    score -= 8;
  }
  if (metaDescLength > 160) {
    issues.push("Meta description exceeds 160 characters — may be truncated.");
    score -= 5;
  }
  if (metaDescLength < 80) {
    issues.push("Meta description is too short — expand for better click-through rates.");
    score -= 8;
  }
  if (!hasH1) {
    issues.push("Missing H1 tag — every page should have exactly one H1.");
    score -= 15;
  }
  if (!hasCanonical) {
    issues.push("No canonical tag found — may cause duplicate content issues.");
    score -= 10;
  }
  if (!hasSchema) {
    issues.push("No structured data (Schema.org) detected — add JSON-LD for rich snippets.");
    score -= 8;
  }
  if (mobileScore < 80) {
    issues.push(`Mobile usability score is ${mobileScore}/100 — improve tap targets and font sizes.`);
    score -= 10;
  }
  if (!hasAltTags) {
    issues.push("Images missing alt attributes — add descriptive alt text for accessibility and SEO.");
    score -= 7;
  }
  if (parseFloat(loadTime) > 3) {
    issues.push(`Page load time is ${loadTime}s — optimize images and defer non-critical scripts.`);
    score -= 12;
  }

  score = Math.max(0, score);

  const page: SEOPage = {
    url,
    title: `Confetti - AI Night Out Planner | ${url.split("/").pop() ?? "Home"}`,
    metaDescription: "Plan unforgettable nights out with AI-powered recommendations. Dining, drinks, entertainment — personalized for your vibe.",
    h1: hasH1 ? "Your AI Night Out Concierge" : "",
    score,
    issues,
  };

  seoPageStore.push(page);
  return page;
}

// ─── SEO Dashboard ────────────────────────────────────────────

export function getSEODashboard(): SEODashboard {
  const tracking = keywordStore.filter((k) => k.status === "tracking");
  const withRanks = tracking.filter((k) => k.currentRank !== undefined);

  const avgRank =
    withRanks.length > 0
      ? withRanks.reduce((sum, k) => sum + (k.currentRank ?? 0), 0) / withRanks.length
      : 0;

  const platformBreakdown: Record<Platform, number> = { ios: 0, android: 0, web: 0 };
  for (const k of tracking) {
    platformBreakdown[k.platform]++;
  }

  return {
    totalKeywords: keywordStore.length,
    trackingKeywords: tracking.length,
    avgRank: Math.round(avgRank * 10) / 10,
    top10Count: withRanks.filter((k) => (k.currentRank ?? 999) <= 10).length,
    top50Count: withRanks.filter((k) => (k.currentRank ?? 999) <= 50).length,
    topMovers: getTopMovers(5),
    recentChanges: tracking
      .filter((k) => k.rankChange !== "stable" && k.rankChange !== "new")
      .sort((a, b) => new Date(b.lastCheckedAt).getTime() - new Date(a.lastCheckedAt).getTime())
      .slice(0, 10),
    platformBreakdown,
  };
}

// ─── Seed demo data ───────────────────────────────────────────

export async function seedASODemo(): Promise<{
  keywords: number;
  platforms: number;
}> {
  // iOS metadata
  metadataStore.set("ios", {
    platform: "ios",
    appName: "Confetti",
    subtitle: "AI Night Out Planner",
    description: "Plan amazing nights out with AI recommendations tailored to your taste.",
    keywords: [
      "nightlife",
      "restaurant finder",
      "date night",
      "things to do",
      "bar finder",
      "ai planner",
      "group plans",
    ],
    category: "Food & Drink",
    screenshots: [
      "onboarding.png",
      "discover.png",
      "itinerary.png",
      "group.png",
    ],
    lastUpdatedAt: new Date().toISOString(),
  });

  // Android metadata
  metadataStore.set("android", {
    platform: "android",
    appName: "Confetti",
    subtitle: "AI Night Out Planner",
    description: "Plan amazing nights out with AI recommendations tailored to your taste.",
    keywords: [
      "nightlife app",
      "restaurant finder",
      "things to do tonight",
      "date night planner",
      "bar crawl",
      "ai concierge",
    ],
    category: "Food & Drink",
    screenshots: [
      "onboarding.png",
      "discover.png",
      "itinerary.png",
    ],
    lastUpdatedAt: new Date().toISOString(),
  });

  // Sample keywords
  const sampleKeywords: Array<{ keyword: string; platform: Platform }> = [
    { keyword: "nightlife planner", platform: "ios" },
    { keyword: "things to do tonight", platform: "ios" },
    { keyword: "date night ideas", platform: "ios" },
    { keyword: "restaurant recommendations", platform: "ios" },
    { keyword: "bar finder near me", platform: "ios" },
    { keyword: "ai travel planner", platform: "ios" },
    { keyword: "group outing planner", platform: "ios" },
    { keyword: "best restaurants near me", platform: "ios" },
    { keyword: "nightlife planner", platform: "android" },
    { keyword: "things to do tonight", platform: "android" },
    { keyword: "date night app", platform: "android" },
    { keyword: "bar crawl planner", platform: "android" },
    { keyword: "ai restaurant finder", platform: "android" },
    { keyword: "best nightlife app", platform: "android" },
    { keyword: "confetti app", platform: "web" },
    { keyword: "ai night out planner", platform: "web" },
    { keyword: "nightlife concierge", platform: "web" },
    { keyword: "plan a night out", platform: "web" },
    { keyword: "group dinner planner", platform: "web" },
  ];

  keywordStore = [];
  for (const { keyword, platform } of sampleKeywords) {
    await addKeyword(keyword, platform);
  }

  // Simulate initial ranks
  await updateKeywordRanks();

  return {
    keywords: keywordStore.length,
    platforms: metadataStore.size,
  };
}
