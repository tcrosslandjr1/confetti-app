/**
 * Content CMS Agent
 *
 * AI content pipeline for Confetti. Manages push notifications,
 * blog posts, in-app messages, email campaigns, and social posts
 * with audience segmentation, scheduling, and delivery metrics.
 *
 * Features:
 *  - Create and manage content across multiple channels
 *  - AI content generation using templates and tone control
 *  - Audience segmentation (free, Black tier, inactive, new, etc.)
 *  - Content calendar with scheduling
 *  - Delivery metrics: sent, opened, clicked, converted
 *  - Default templates for common content types
 */

import { supabase } from "../supabase";

// ═══════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════

export type ContentType = "push_notification" | "in_app_message" | "blog_post" | "email_campaign" | "social_post";
export type ContentStatus = "draft" | "scheduled" | "published" | "archived";
export type AudienceSegment = "all_users" | "free_users" | "black_tier" | "inactive_30d" | "new_users_7d" | "venue_owners" | "promoters";

export interface ContentMetrics {
  sent: number;
  opened: number;
  clicked: number;
  converted: number;
}

export interface ContentItem {
  id: string;
  type: ContentType;
  title: string;
  body: string;
  richBody?: string;
  imageUrl?: string;
  ctaText?: string;
  ctaUrl?: string;
  audience: AudienceSegment[];
  status: ContentStatus;
  scheduledAt?: string;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
  metrics: ContentMetrics;
}

export interface ContentTemplate {
  id: string;
  type: ContentType;
  name: string;
  bodyTemplate: string;
  variables: string[];
}

export interface ContentCalendarEntry {
  contentId: string;
  title: string;
  type: ContentType;
  scheduledAt: string;
  audience: AudienceSegment[];
  status: ContentStatus;
}

export interface OverallMetrics {
  totalSent: number;
  totalOpened: number;
  totalClicked: number;
  totalConverted: number;
  openRate: number;
  clickRate: number;
  conversionRate: number;
  byType: Record<ContentType, ContentMetrics>;
}

// ═══════════════════════════════════════════════════════════
// Constants — Default Templates
// ═══════════════════════════════════════════════════════════

const DEFAULT_TEMPLATES: ContentTemplate[] = [
  {
    id: "tmpl_welcome_push",
    type: "push_notification",
    name: "Welcome Push",
    bodyTemplate: "Welcome to Confetti, {{userName}}! Ready to discover your city's best-kept secrets? Tap to plan your first night out.",
    variables: ["userName"],
  },
  {
    id: "tmpl_weekly_digest",
    type: "email_campaign",
    name: "Weekly Digest",
    bodyTemplate: "Hey {{userName}}, here's what's hot in {{city}} this week: {{highlights}}. Your personalized picks are waiting inside the app!",
    variables: ["userName", "city", "highlights"],
  },
  {
    id: "tmpl_venue_spotlight",
    type: "blog_post",
    name: "Venue Spotlight",
    bodyTemplate: "Spotlight: {{venueName}} in {{city}}. {{description}} Whether you're in the mood for {{vibe}}, this spot delivers. {{specialOffer}}",
    variables: ["venueName", "city", "description", "vibe", "specialOffer"],
  },
  {
    id: "tmpl_promo_announcement",
    type: "in_app_message",
    name: "Promo Announcement",
    bodyTemplate: "{{promoTitle}} — {{promoDescription}}. Available {{availability}}. Don't miss out!",
    variables: ["promoTitle", "promoDescription", "availability"],
  },
  {
    id: "tmpl_reengagement_nudge",
    type: "push_notification",
    name: "Re-engagement Nudge",
    bodyTemplate: "We miss you, {{userName}}! {{city}} has {{newVenueCount}} new spots since your last visit. Come back and see what's changed.",
    variables: ["userName", "city", "newVenueCount"],
  },
];

const TONE_PRESETS: Record<string, { prefix: string; suffix: string; emoji: boolean }> = {
  playful: { prefix: "", suffix: " Let's go!", emoji: true },
  professional: { prefix: "", suffix: "", emoji: false },
  urgent: { prefix: "Don't miss out: ", suffix: " Act now.", emoji: false },
  casual: { prefix: "Hey! ", suffix: " Check it out.", emoji: true },
  luxe: { prefix: "An exclusive invitation: ", suffix: " Reserve your experience.", emoji: false },
};

// ═══════════════════════════════════════════════════════════
// In-Memory Store (local-first)
// ═══════════════════════════════════════════════════════════

const contentStore = new Map<string, ContentItem>();
const templateStore = new Map<string, ContentTemplate>();

let idCounter = 6000;
function nextId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${(idCounter++).toString(36)}`;
}

// Initialize default templates
for (const t of DEFAULT_TEMPLATES) {
  templateStore.set(t.id, t);
}

// ═══════════════════════════════════════════════════════════
// Content Creation
// ═══════════════════════════════════════════════════════════

/** Create a new content item as a draft */
export function createContent(
  type: ContentType,
  title: string,
  body: string,
  audience: AudienceSegment[],
  opts?: {
    richBody?: string;
    imageUrl?: string;
    ctaText?: string;
    ctaUrl?: string;
  }
): ContentItem {
  const item: ContentItem = {
    id: nextId("cnt"),
    type,
    title,
    body,
    richBody: opts?.richBody,
    imageUrl: opts?.imageUrl,
    ctaText: opts?.ctaText,
    ctaUrl: opts?.ctaUrl,
    audience,
    status: "draft",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    metrics: { sent: 0, opened: 0, clicked: 0, converted: 0 },
  };
  contentStore.set(item.id, item);
  return item;
}

/** AI-generate content using templates and tone presets */
export function generateContent(
  type: ContentType,
  topic: string,
  tone: string = "playful",
  variables?: Record<string, string>
): ContentItem {
  // Find a matching template
  const template = Array.from(templateStore.values()).find((t) => t.type === type);
  const tonePreset = TONE_PRESETS[tone] ?? TONE_PRESETS.playful;

  let body: string;
  if (template && variables) {
    // Fill in template variables
    body = template.bodyTemplate;
    for (const [key, value] of Object.entries(variables)) {
      body = body.replace(new RegExp(`\\{\\{${key}\\}\\}`, "g"), value);
    }
    // Replace any remaining unfilled variables with the topic
    body = body.replace(/\{\{[^}]+\}\}/g, topic);
  } else {
    // Generate from topic + tone
    body = `${tonePreset.prefix}${topic}${tonePreset.suffix}`;
  }

  // Apply tone adjustments
  if (tonePreset.emoji) {
    const emojis: Record<ContentType, string> = {
      push_notification: " \u{1F389}",
      in_app_message: " ✨",
      blog_post: " \u{1F4DD}",
      email_campaign: " \u{1F4E8}",
      social_post: " \u{1F525}",
    };
    body += emojis[type] ?? "";
  }

  const title = generateTitle(type, topic);

  return createContent(type, title, body, ["all_users"]);
}

/** Generate a title from type + topic */
function generateTitle(type: ContentType, topic: string): string {
  const prefixes: Record<ContentType, string> = {
    push_notification: "",
    in_app_message: "",
    blog_post: "Confetti Spotlight: ",
    email_campaign: "This Week on Confetti: ",
    social_post: "",
  };
  return `${prefixes[type]}${topic}`;
}

// ═══════════════════════════════════════════════════════════
// Content Lifecycle
// ═══════════════════════════════════════════════════════════

/** Schedule content for future publication */
export function scheduleContent(contentId: string, scheduledAt: string): ContentItem | null {
  const item = contentStore.get(contentId);
  if (!item) return null;

  item.status = "scheduled";
  item.scheduledAt = scheduledAt;
  item.updatedAt = new Date().toISOString();
  return item;
}

/** Publish content immediately */
export function publishContent(contentId: string): ContentItem | null {
  const item = contentStore.get(contentId);
  if (!item) return null;

  item.status = "published";
  item.publishedAt = new Date().toISOString();
  item.updatedAt = new Date().toISOString();

  // Simulate initial send metrics based on audience
  const audienceSize = estimateAudienceSize(item.audience);
  item.metrics.sent = audienceSize;
  item.metrics.opened = Math.floor(audienceSize * (0.15 + Math.random() * 0.25));
  item.metrics.clicked = Math.floor(item.metrics.opened * (0.05 + Math.random() * 0.15));
  item.metrics.converted = Math.floor(item.metrics.clicked * (0.02 + Math.random() * 0.08));

  return item;
}

/** Archive content */
export function archiveContent(contentId: string): ContentItem | null {
  const item = contentStore.get(contentId);
  if (!item) return null;

  item.status = "archived";
  item.updatedAt = new Date().toISOString();
  return item;
}

/** Estimate audience size for a set of segments */
function estimateAudienceSize(segments: AudienceSegment[]): number {
  const sizes: Record<AudienceSegment, number> = {
    all_users: 10000,
    free_users: 8500,
    black_tier: 1500,
    inactive_30d: 2200,
    new_users_7d: 800,
    venue_owners: 150,
    promoters: 75,
  };
  // Use max segment size (avoid double-counting overlapping segments)
  return Math.max(...segments.map((s) => sizes[s] ?? 100));
}

// ═══════════════════════════════════════════════════════════
// Content Retrieval
// ═══════════════════════════════════════════════════════════

/** Get content calendar — scheduled items in a date range */
export function getContentCalendar(startDate: string, endDate: string): ContentCalendarEntry[] {
  const start = new Date(startDate).getTime();
  const end = new Date(endDate).getTime();

  return Array.from(contentStore.values())
    .filter((item) => {
      if (!item.scheduledAt) return false;
      const scheduled = new Date(item.scheduledAt).getTime();
      return scheduled >= start && scheduled <= end;
    })
    .map((item) => ({
      contentId: item.id,
      title: item.title,
      type: item.type,
      scheduledAt: item.scheduledAt!,
      audience: item.audience,
      status: item.status,
    }))
    .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());
}

/** Get content by status */
export function getContentByStatus(status: ContentStatus): ContentItem[] {
  return Array.from(contentStore.values())
    .filter((item) => item.status === status)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

/** Get a single content item */
export function getContent(contentId: string): ContentItem | null {
  return contentStore.get(contentId) ?? null;
}

// ═══════════════════════════════════════════════════════════
// Templates
// ═══════════════════════════════════════════════════════════

/** Get available templates, optionally filtered by type */
export function getTemplates(type?: ContentType): ContentTemplate[] {
  const all = Array.from(templateStore.values());
  return type ? all.filter((t) => t.type === type) : all;
}

/** Create a new content template */
export function createTemplate(
  type: ContentType,
  name: string,
  bodyTemplate: string,
  variables: string[]
): ContentTemplate {
  const template: ContentTemplate = {
    id: nextId("tmpl"),
    type,
    name,
    bodyTemplate,
    variables,
  };
  templateStore.set(template.id, template);
  return template;
}

// ═══════════════════════════════════════════════════════════
// Metrics
// ═══════════════════════════════════════════════════════════

/** Get delivery metrics for a single content item */
export function getContentMetrics(contentId: string): ContentMetrics | null {
  const item = contentStore.get(contentId);
  return item?.metrics ?? null;
}

/** Get aggregate metrics across all content in a date range */
export function getOverallMetrics(dateRange?: { start: string; end: string }): OverallMetrics {
  let items = Array.from(contentStore.values()).filter((i) => i.status === "published");

  if (dateRange) {
    const start = new Date(dateRange.start).getTime();
    const end = new Date(dateRange.end).getTime();
    items = items.filter((i) => {
      const pub = i.publishedAt ? new Date(i.publishedAt).getTime() : 0;
      return pub >= start && pub <= end;
    });
  }

  const byType: Record<ContentType, ContentMetrics> = {
    push_notification: { sent: 0, opened: 0, clicked: 0, converted: 0 },
    in_app_message: { sent: 0, opened: 0, clicked: 0, converted: 0 },
    blog_post: { sent: 0, opened: 0, clicked: 0, converted: 0 },
    email_campaign: { sent: 0, opened: 0, clicked: 0, converted: 0 },
    social_post: { sent: 0, opened: 0, clicked: 0, converted: 0 },
  };

  let totalSent = 0;
  let totalOpened = 0;
  let totalClicked = 0;
  let totalConverted = 0;

  for (const item of items) {
    totalSent += item.metrics.sent;
    totalOpened += item.metrics.opened;
    totalClicked += item.metrics.clicked;
    totalConverted += item.metrics.converted;

    const bt = byType[item.type];
    bt.sent += item.metrics.sent;
    bt.opened += item.metrics.opened;
    bt.clicked += item.metrics.clicked;
    bt.converted += item.metrics.converted;
  }

  return {
    totalSent,
    totalOpened,
    totalClicked,
    totalConverted,
    openRate: totalSent > 0 ? totalOpened / totalSent : 0,
    clickRate: totalOpened > 0 ? totalClicked / totalOpened : 0,
    conversionRate: totalClicked > 0 ? totalConverted / totalClicked : 0,
    byType,
  };
}

// ═══════════════════════════════════════════════════════════
// Demo Seed
// ═══════════════════════════════════════════════════════════

/** Create sample content items for demo */
export function seedContentDemo(): ContentItem[] {
  const items: ContentItem[] = [];

  // Published push notification
  const push1 = createContent(
    "push_notification",
    "Weekend Vibes Await",
    "DC's hottest new rooftop just dropped. Swipe to see your personalized Friday night plan.",
    ["all_users"],
    { ctaText: "See My Plan", ctaUrl: "/plans/tonight" }
  );
  push1.status = "published";
  push1.publishedAt = new Date(Date.now() - 2 * 86400000).toISOString();
  push1.metrics = { sent: 8500, opened: 2800, clicked: 420, converted: 85 };

  // Scheduled email campaign
  const email1 = createContent(
    "email_campaign",
    "This Week on Confetti: Summer Kickoff",
    "Summer is here and so are the patios! Check out our curated list of the best outdoor dining and rooftop bars in your city. Plus, Confetti Black members get exclusive early access to 3 new venue openings this month.",
    ["all_users"],
    { ctaText: "Explore Summer Picks", ctaUrl: "/discover/summer" }
  );
  email1.status = "scheduled";
  email1.scheduledAt = new Date(Date.now() + 3 * 86400000).toISOString();

  // Draft blog post
  const blog1 = createContent(
    "blog_post",
    "Confetti Spotlight: Hidden Gems of Adams Morgan",
    "Adams Morgan has always been DC's melting pot of culture and cuisine. But beyond the well-known strips, a new wave of spots is redefining the neighborhood. Here are 5 places our AI concierge keeps recommending.",
    ["all_users"],
    { imageUrl: "/images/blog/adams-morgan-hero.jpg" }
  );

  // In-app message for Black tier
  const inApp1 = createContent(
    "in_app_message",
    "Confetti Black: Your June Perks",
    "Your $10 outing credit has refreshed! Plus 3 new prime reservation slots are ready. Tap to browse this month's exclusive experiences.",
    ["black_tier"],
    { ctaText: "View My Perks", ctaUrl: "/account/perks" }
  );
  inApp1.status = "published";
  inApp1.publishedAt = new Date(Date.now() - 1 * 86400000).toISOString();
  inApp1.metrics = { sent: 1500, opened: 890, clicked: 340, converted: 120 };

  // Re-engagement nudge
  const push2 = createContent(
    "push_notification",
    "We Miss You!",
    "It's been a while! 12 new spots have opened in DC since your last visit. Come back and see what's changed.",
    ["inactive_30d"]
  );
  push2.status = "scheduled";
  push2.scheduledAt = new Date(Date.now() + 1 * 86400000).toISOString();

  // Social post
  const social1 = createContent(
    "social_post",
    "Friday Night Sorted",
    "Stop scrolling Yelp. Let Confetti's AI plan your entire night out in 30 seconds. Dinner, drinks, dancing — all matched to your vibe. Link in bio.",
    ["all_users"]
  );
  social1.status = "published";
  social1.publishedAt = new Date(Date.now() - 5 * 86400000).toISOString();
  social1.metrics = { sent: 0, opened: 0, clicked: 245, converted: 38 };

  items.push(push1, email1, blog1, inApp1, push2, social1);
  return items;
}
