/**
 * Venue Suggestions API Layer
 *
 * CRUD operations for venue suggestions + Tonight feed queries.
 * Used by both the venue dashboard and the user-facing Tonight feed.
 */

import { supabase } from "@/lib/supabase";
import {
  mapSuggestionRow,
  mapTonightRow,
  type VenueSuggestion,
  type VenueSuggestionInput,
  type TonightSuggestion,
  type SuggestionType,
  type SuggestionStatus,
} from "@/types/venue-suggestion";

// ─── Venue Dashboard (manager-facing) ───────────────────────

/** Fetch all suggestions for a venue (for the dashboard). */
export async function getVenueSuggestions(venueId: string): Promise<VenueSuggestion[]> {
  const { data, error } = await supabase
    .from("venue_suggestions")
    .select("*")
    .eq("venue_id", venueId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(`Failed to fetch suggestions: ${error.message}`);
  return (data ?? []).map(mapSuggestionRow);
}

/** Create a new suggestion. */
export async function createSuggestion(input: VenueSuggestionInput): Promise<VenueSuggestion> {
  const { data: session } = await supabase.auth.getSession();
  const userId = session?.session?.user?.id;

  const row = {
    venue_id: input.venueId,
    type: input.type,
    title: input.title,
    subtitle: input.subtitle ?? null,
    description: input.description,
    image_url: input.imageUrl ?? null,
    tags: input.tags ?? [],
    starts_at: input.startsAt ?? null,
    ends_at: input.endsAt ?? null,
    recurring: input.recurring ?? false,
    recurrence_rule: input.recurrenceRule ?? null,
    timezone: input.timezone ?? "America/New_York",
    original_price: input.originalPrice ?? null,
    offer_price: input.offerPrice ?? null,
    discount_pct: input.discountPct ?? null,
    promo_code: input.promoCode ?? null,
    redemption_url: input.redemptionUrl ?? null,
    capacity: input.capacity ?? null,
    target_moods: input.targetMoods ?? [],
    target_audience: input.targetAudience ?? [],
    created_by: userId,
    status: "draft" as const,
  };

  const { data, error } = await supabase
    .from("venue_suggestions")
    .insert(row)
    .select()
    .single();

  if (error) throw new Error(`Failed to create suggestion: ${error.message}`);
  return mapSuggestionRow(data);
}

/** Update an existing suggestion. */
export async function updateSuggestion(
  id: string,
  updates: Partial<VenueSuggestionInput> & { status?: SuggestionStatus }
): Promise<VenueSuggestion> {
  const row: Record<string, unknown> = {};

  if (updates.title !== undefined) row.title = updates.title;
  if (updates.subtitle !== undefined) row.subtitle = updates.subtitle;
  if (updates.description !== undefined) row.description = updates.description;
  if (updates.imageUrl !== undefined) row.image_url = updates.imageUrl;
  if (updates.tags !== undefined) row.tags = updates.tags;
  if (updates.startsAt !== undefined) row.starts_at = updates.startsAt;
  if (updates.endsAt !== undefined) row.ends_at = updates.endsAt;
  if (updates.recurring !== undefined) row.recurring = updates.recurring;
  if (updates.recurrenceRule !== undefined) row.recurrence_rule = updates.recurrenceRule;
  if (updates.timezone !== undefined) row.timezone = updates.timezone;
  if (updates.originalPrice !== undefined) row.original_price = updates.originalPrice;
  if (updates.offerPrice !== undefined) row.offer_price = updates.offerPrice;
  if (updates.discountPct !== undefined) row.discount_pct = updates.discountPct;
  if (updates.promoCode !== undefined) row.promo_code = updates.promoCode;
  if (updates.redemptionUrl !== undefined) row.redemption_url = updates.redemptionUrl;
  if (updates.capacity !== undefined) row.capacity = updates.capacity;
  if (updates.targetMoods !== undefined) row.target_moods = updates.targetMoods;
  if (updates.targetAudience !== undefined) row.target_audience = updates.targetAudience;
  if (updates.status !== undefined) row.status = updates.status;
  if (updates.type !== undefined) row.type = updates.type;

  const { data, error } = await supabase
    .from("venue_suggestions")
    .update(row)
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(`Failed to update suggestion: ${error.message}`);
  return mapSuggestionRow(data);
}

/** Submit a draft for review. */
export async function submitForReview(id: string): Promise<VenueSuggestion> {
  return updateSuggestion(id, { status: "pending_review" });
}

/** Archive a suggestion. */
export async function archiveSuggestion(id: string): Promise<VenueSuggestion> {
  return updateSuggestion(id, { status: "archived" });
}

// ─── Admin Operations ───────────────────────────────────────

/** Approve a pending suggestion (admin only). */
export async function approveSuggestion(id: string): Promise<VenueSuggestion> {
  const { data: session } = await supabase.auth.getSession();
  const adminId = session?.session?.user?.id;

  const { data, error } = await supabase
    .from("venue_suggestions")
    .update({ status: "active", approved_by: adminId, approved_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(`Failed to approve suggestion: ${error.message}`);
  return mapSuggestionRow(data);
}

/** Fetch all pending suggestions (admin review queue). */
export async function getPendingSuggestions(): Promise<VenueSuggestion[]> {
  const { data, error } = await supabase
    .from("venue_suggestions")
    .select("*")
    .eq("status", "pending_review")
    .order("created_at", { ascending: true });

  if (error) throw new Error(`Failed to fetch pending: ${error.message}`);
  return (data ?? []).map(mapSuggestionRow);
}

// ─── Tonight Feed (user-facing) ─────────────────────────────

export type TonightFeedFilters = {
  city?: string;
  type?: SuggestionType;
  moods?: string[];
  audience?: string[];
  limit?: number;
  offset?: number;
};

/** Fetch tonight's active suggestions for the user feed. */
export async function getTonightFeed(filters: TonightFeedFilters = {}): Promise<TonightSuggestion[]> {
  let query = supabase
    .from("tonight_suggestions")
    .select("*")
    .order("boost_level", { ascending: false })
    .order("starts_at", { ascending: true });

  if (filters.city) {
    query = query.eq("venue_city", filters.city);
  }
  if (filters.type) {
    query = query.eq("type", filters.type);
  }
  if (filters.moods?.length) {
    query = query.overlaps("target_moods", filters.moods);
  }
  if (filters.audience?.length) {
    query = query.overlaps("target_audience", filters.audience);
  }
  if (filters.limit) {
    query = query.limit(filters.limit);
  }
  if (filters.offset) {
    query = query.range(filters.offset, filters.offset + (filters.limit ?? 20) - 1);
  }

  const { data, error } = await query;
  if (error) throw new Error(`Failed to fetch tonight feed: ${error.message}`);
  return (data ?? []).map(mapTonightRow);
}

/** Get suggestions relevant for AI recommendation context. */
export async function getSuggestionsForAI(params: {
  city: string;
  moods?: string[];
  audience?: string[];
  limit?: number;
}): Promise<TonightSuggestion[]> {
  return getTonightFeed({
    city: params.city,
    moods: params.moods,
    audience: params.audience,
    limit: params.limit ?? 10,
  });
}

// ─── Public API (for external venue integrations) ───────────

/** Public endpoint payload shape for external integrations. */
export type PublicSuggestionPayload = {
  venue_id: string;
  api_key: string;
  type: SuggestionType;
  title: string;
  subtitle?: string;
  description: string;
  image_url?: string;
  tags?: string[];
  starts_at?: string;
  ends_at?: string;
  recurring?: boolean;
  recurrence_rule?: string;
  timezone?: string;
  original_price?: number;
  offer_price?: number;
  discount_pct?: number;
  promo_code?: string;
  redemption_url?: string;
  capacity?: number;
  target_moods?: string[];
  target_audience?: string[];
};

/** Convert a public API payload to the internal input format. */
export function publicPayloadToInput(payload: PublicSuggestionPayload): VenueSuggestionInput {
  return {
    venueId: payload.venue_id,
    type: payload.type,
    title: payload.title,
    subtitle: payload.subtitle,
    description: payload.description,
    imageUrl: payload.image_url,
    tags: payload.tags,
    startsAt: payload.starts_at,
    endsAt: payload.ends_at,
    recurring: payload.recurring,
    recurrenceRule: payload.recurrence_rule,
    timezone: payload.timezone,
    originalPrice: payload.original_price,
    offerPrice: payload.offer_price,
    discountPct: payload.discount_pct,
    promoCode: payload.promo_code,
    redemptionUrl: payload.redemption_url,
    capacity: payload.capacity,
    targetMoods: payload.target_moods,
    targetAudience: payload.target_audience,
  };
}
