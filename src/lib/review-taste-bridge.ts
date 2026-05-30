// @ts-nocheck — references schema (AI content tables, eventbrite_events, venue cuisine/vibe/lat/lng columns) not yet migrated.
/**
 * review-taste-bridge.ts
 * Persists a venue review to the `reviews` table, then extracts taste
 * signals from the review + venue metadata and merges them into the
 * user's TasteProfile in `user_preferences`.
 *
 * Signal logic:
 *   - Overall rating >= 4 → venue's vibe_tags/cuisine_tags → loves / scene_keywords / cuisines
 *   - Overall rating <= 2 → venue's vibe_tags/cuisine_tags → avoid
 *   - Ambiance rating >= 4 → vibe_tags → scene_keywords
 *   - Food rating >= 4 → cuisine_tags → cuisines (top-level pref)
 *   - Occasion tag → scene_keywords (e.g. "Date Night" → "date night")
 */

import { supabase } from "@/integrations/supabase/client";
import { loadPrefs, saveTasteProfile, type TasteProfile } from "@/lib/taste";

export type VenueReviewPayload = {
  venueId: string;
  rating: number;
  foodRating?: number;
  ambianceRating?: number;
  serviceRating?: number;
  occasionTag?: string;
  body: string;
  photoUrls: string[];
};

/** Persist review + update taste profile in one call. */
export async function submitVenueReview(review: VenueReviewPayload) {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) throw new Error("Not authenticated");

  // 1. Insert into reviews table
  const { error: insertErr } = await supabase.from("reviews").insert({
    user_id: u.user.id,
    venue_id: review.venueId,
    rating: review.rating,
    food_rating: review.foodRating ?? null,
    ambiance_rating: review.ambianceRating ?? null,
    service_rating: review.serviceRating ?? null,
    occasion_tag: review.occasionTag ?? null,
    body: review.body,
    photo_urls: review.photoUrls,
  });
  if (insertErr) throw new Error(insertErr.message);

  // 2. Fetch venue metadata for taste signal extraction
  const { data: venue } = await supabase
    .from("venues")
    .select("category, vibe_tags, cuisine_tags")
    .eq("id", review.venueId)
    .maybeSingle();

  // 3. Update venue's average_rating
  const { data: allRatings } = await supabase
    .from("reviews")
    .select("rating")
    .eq("venue_id", review.venueId);

  if (allRatings?.length) {
    const avg = allRatings.reduce((sum, r) => sum + r.rating, 0) / allRatings.length;
    await supabase
      .from("venues")
      .update({ average_rating: Math.round(avg * 10) / 10 })
      .eq("id", review.venueId);
  }

  // 4. Extract taste signals and merge into profile
  if (venue) {
    await mergeTasteSignals(review, venue, u.user.id);
  }
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

async function mergeTasteSignals(
  review: VenueReviewPayload,
  venue: { category: string | null; vibe_tags: string[] | null; cuisine_tags: string[] | null },
  _userId: string,
) {
  const prefs = await loadPrefs();
  const tp: TasteProfile = { ...prefs.taste_profile };

  const vibeTags = venue.vibe_tags ?? [];
  const cuisineTags = venue.cuisine_tags ?? [];

  // Ensure arrays exist
  tp.loves = tp.loves ?? [];
  tp.avoid = tp.avoid ?? [];
  tp.scene_keywords = tp.scene_keywords ?? [];

  const loved = review.rating >= 4;
  const disliked = review.rating <= 2;

  if (loved) {
    // Positive signals → loves + scene_keywords
    tp.loves = addUnique(tp.loves, [...vibeTags, ...cuisineTags]);
    tp.scene_keywords = addUnique(tp.scene_keywords, vibeTags);
    // Remove from avoid if previously disliked
    tp.avoid = removeAll(tp.avoid, [...vibeTags, ...cuisineTags]);
  } else if (disliked) {
    // Negative signals → avoid
    tp.avoid = addUnique(tp.avoid, [...vibeTags, ...cuisineTags]);
    // Remove from loves if previously loved
    tp.loves = removeAll(tp.loves, [...vibeTags, ...cuisineTags]);
    tp.scene_keywords = removeAll(tp.scene_keywords, vibeTags);
  }

  // Ambiance sub-rating → scene keywords
  if (review.ambianceRating && review.ambianceRating >= 4) {
    tp.scene_keywords = addUnique(tp.scene_keywords, vibeTags);
  }

  // Occasion tag → scene keywords (normalised)
  if (review.occasionTag) {
    const tag = review.occasionTag.toLowerCase();
    tp.scene_keywords = addUnique(tp.scene_keywords, [tag]);
  }

  // Food sub-rating → top-level cuisines pref (if we have cuisine tags)
  if (review.foodRating && review.foodRating >= 4 && cuisineTags.length) {
    const updatedCuisines = addUnique(prefs.cuisines, cuisineTags);
    if (updatedCuisines.length !== prefs.cuisines.length) {
      await supabase
        .from("user_preferences")
        .upsert(
          { user_id: (await supabase.auth.getUser()).data.user!.id, cuisines: updatedCuisines },
          { onConflict: "user_id" },
        );
    }
  }

  // Category → scene keywords (e.g. "rooftop bar" → scene)
  if (loved && venue.category) {
    tp.scene_keywords = addUnique(tp.scene_keywords, [venue.category.toLowerCase()]);
  }

  await saveTasteProfile(tp);
}

function addUnique(arr: string[], items: string[]): string[] {
  const set = new Set(arr.map((s) => s.toLowerCase()));
  const result = [...arr];
  for (const item of items) {
    const lower = item.toLowerCase();
    if (lower && !set.has(lower)) {
      set.add(lower);
      result.push(item);
    }
  }
  return result;
}

function removeAll(arr: string[], items: string[]): string[] {
  const remove = new Set(items.map((s) => s.toLowerCase()));
  return arr.filter((s) => !remove.has(s.toLowerCase()));
}
