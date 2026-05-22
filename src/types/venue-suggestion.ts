/**
 * Venue Suggestions — Events, Experiences & Promotions
 *
 * These types model suggestions submitted by venues and surfaced in:
 * 1. The "Tonight" feed for users
 * 2. AI recommendation agent itineraries
 */

// ─── Enums ──────────────────────────────────────────────────

export type SuggestionType = "event" | "experience" | "promo";
export type SuggestionStatus = "draft" | "pending_review" | "active" | "expired" | "archived";

// ─── Core Type ──────────────────────────────────────────────

export type VenueSuggestion = {
  id: string;
  venueId: string;
  type: SuggestionType;
  status: SuggestionStatus;

  // Content
  title: string;
  subtitle: string;
  description: string;
  imageUrl: string;
  tags: string[];

  // Scheduling
  startsAt: string | null; // ISO timestamp
  endsAt: string | null;
  recurring: boolean;
  recurrenceRule: string; // iCal RRULE
  timezone: string;

  // Pricing / Promo
  originalPrice: number | null;
  offerPrice: number | null;
  discountPct: number | null;
  promoCode: string;
  redemptionUrl: string;
  capacity: number | null;
  rsvpCount: number;

  // Targeting
  targetMoods: string[];
  targetAudience: string[];
  boostLevel: 0 | 1 | 2;

  // Metadata
  createdBy: string | null;
  approvedBy: string | null;
  approvedAt: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

// ─── Tonight Feed (joined with venue data) ──────────────────

export type TonightSuggestion = VenueSuggestion & {
  venueName: string;
  venueCity: string;
  venueNeighborhood: string;
  venueCategory: string;
  venueImage: string;
  venueRating: number;
  venuePriceLevel: number;
};

// ─── Form Input (create / update) ───────────────────────────

export type VenueSuggestionInput = {
  venueId: string;
  type: SuggestionType;
  title: string;
  subtitle?: string;
  description: string;
  imageUrl?: string;
  tags?: string[];
  startsAt?: string;
  endsAt?: string;
  recurring?: boolean;
  recurrenceRule?: string;
  timezone?: string;
  originalPrice?: number;
  offerPrice?: number;
  discountPct?: number;
  promoCode?: string;
  redemptionUrl?: string;
  capacity?: number;
  targetMoods?: string[];
  targetAudience?: string[];
};

// ─── Row mapper (snake_case DB → camelCase) ─────────────────

export function mapSuggestionRow(row: Record<string, unknown>): VenueSuggestion {
  return {
    id: row.id as string,
    venueId: row.venue_id as string,
    type: row.type as SuggestionType,
    status: row.status as SuggestionStatus,
    title: row.title as string,
    subtitle: (row.subtitle as string) ?? "",
    description: row.description as string,
    imageUrl: (row.image_url as string) ?? "",
    tags: Array.isArray(row.tags) ? row.tags : [],
    startsAt: (row.starts_at as string) ?? null,
    endsAt: (row.ends_at as string) ?? null,
    recurring: Boolean(row.recurring),
    recurrenceRule: (row.recurrence_rule as string) ?? "",
    timezone: (row.timezone as string) ?? "America/New_York",
    originalPrice: row.original_price != null ? Number(row.original_price) : null,
    offerPrice: row.offer_price != null ? Number(row.offer_price) : null,
    discountPct: row.discount_pct != null ? Number(row.discount_pct) : null,
    promoCode: (row.promo_code as string) ?? "",
    redemptionUrl: (row.redemption_url as string) ?? "",
    capacity: row.capacity != null ? Number(row.capacity) : null,
    rsvpCount: Number(row.rsvp_count ?? 0),
    targetMoods: Array.isArray(row.target_moods) ? row.target_moods : [],
    targetAudience: Array.isArray(row.target_audience) ? row.target_audience : [],
    boostLevel: [0, 1, 2].includes(Number(row.boost_level)) ? (Number(row.boost_level) as 0 | 1 | 2) : 0,
    createdBy: (row.created_by as string) ?? null,
    approvedBy: (row.approved_by as string) ?? null,
    approvedAt: (row.approved_at as string) ?? null,
    metadata: (row.metadata as Record<string, unknown>) ?? {},
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

export function mapTonightRow(row: Record<string, unknown>): TonightSuggestion {
  return {
    ...mapSuggestionRow(row),
    venueName: (row.venue_name as string) ?? "",
    venueCity: (row.venue_city as string) ?? "",
    venueNeighborhood: (row.venue_neighborhood as string) ?? "",
    venueCategory: (row.venue_category as string) ?? "",
    venueImage: (row.venue_image as string) ?? "",
    venueRating: Number(row.venue_rating ?? 0),
    venuePriceLevel: Number(row.venue_price_level ?? 2),
  };
}
