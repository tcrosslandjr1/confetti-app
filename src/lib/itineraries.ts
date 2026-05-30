import { supabase } from "@/integrations/supabase/client";
import { awardXP } from "@/lib/gamification";

export type Stop = {
  id?: string;
  position: number;
  name: string;
  category: "meal" | "activity" | "drinks" | "scenic" | "travel" | "other" | string;
  description?: string;
  address?: string;
  start_time?: string | null; // 'HH:MM:SS'
  duration_minutes?: number | null;
  est_cost?: string;
  what_to_do?: string;
  booking_url?: string;
  booking_provider?: string;
  booking_status?: "unbooked" | "pending" | "confirmed";
  booking_ref?: string | null;
  user_notes?: string | null;
  review_snippets?: string[] | null;
  parking?: { type: string; cost: string; access: string } | null;
  tips?: string[] | null;
  user_rating?: number | null;
  user_review?: string | null;
  completed_at?: string | null;
  travel_from_prev?: TravelLeg | null;
  party_size?: number | null;
  reservation_time?: string | null;
  contact_phone?: string | null;
  contact_email?: string | null;
  confirmation_note?: string | null;
  dress_code?: string | null;
};

export type TravelLeg = {
  mode: "walk" | "car" | "transit" | "lyft" | "uber" | "rideshare" | "bike" | string;
  durationMinutes: number;
  distance?: string;
  instructions: string;
  estCost?: string;
};

export type Itinerary = {
  id: string;
  user_id: string;
  title: string;
  occasion_slug?: string | null;
  vibe?: string | null;
  summary?: string | null;
  date?: string | null;
  start_time?: string | null;
  city?: string | null;
  est_total_cost?: string | null;
  source: "planner" | "card" | "ai" | string;
  created_at: string;
  updated_at: string;
  completed_at?: string | null;
  overall_rating?: number | null;
  overall_review?: string | null;
  transport_mode?: string | null;
};

type AiStop = {
  name: string;
  category: string;
  description: string;
  address: string;
  startTime: string;
  durationMinutes: number;
  estCost: string;
  whatToDo: string;
  bookingUrl: string;
  bookingProvider: string;
  reviewSnippets?: string[];
  parking?: { type: string; cost: string; access: string };
  tips?: string[];
  travelFromPrev?: TravelLeg | null;
  dressCode?: string;
};
type AiItinerary = {
  title: string;
  summary: string;
  estTotalCost: string;
  stops: AiStop[];
};

export type BuildPayload = {
  occasion: string;
  vibe?: string;
  city?: string;
  region?: string;
  lat?: number | null;
  lng?: number | null;
  date?: string;
  startTime?: string;
  durationHours?: number;
  budget?: string;
  neighborhood?: string;
  notes?: string;
  seedIdea?: { title: string; hook?: string; description?: string; vibeTags?: string[] };
  occasionSlug?: string;
  transportMode?: "auto" | "car" | "transit" | "lyft" | "uber" | "walk";
};

export async function buildAndSaveItinerary(payload: BuildPayload): Promise<{ id: string }> {
  const { data: userRes } = await supabase.auth.getUser();
  const user = userRes.user;
  if (!user) throw new Error("Sign in required to save itineraries.");

  const { loadPrefs, tasteSummary } = await import("@/lib/taste");
  const prefs = await loadPrefs();

  // Pull selected city + coords so the edge function can verify venues
  // against Google Places in the right metro area.
  const { getSelectedCity } = await import("@/lib/cities");
  const sel = getSelectedCity();
  const enriched: BuildPayload = {
    ...payload,
    city: payload.city ?? sel?.name,
    region: payload.region ?? sel?.region,
    lat: payload.lat ?? sel?.lat ?? null,
    lng: payload.lng ?? sel?.lng ?? null,
  };

  const { data, error } = await supabase.functions.invoke("build-itinerary", {
    body: { ...enriched, tasteSummary: tasteSummary(prefs) },
  });
  if (error) throw new Error(error.message);
  const it = data?.itinerary as AiItinerary & { _unverified?: boolean };
  if (!it?.stops?.length) {
    throw new Error(
      "Couldn't verify any real venues for this plan in your selected city. Try a different vibe or change your city.",
    );
  }
  if ((it as { _unverified?: boolean })._unverified) {
    console.warn("[build-itinerary] returned unverified stops");
  }

  // Insert itinerary
  const { data: ins, error: insErr } = await supabase
    .from("itineraries")
    .insert({
      user_id: user.id,
      title: it.title,
      occasion_slug: payload.occasionSlug ?? null,
      vibe: payload.vibe ?? null,
      summary: it.summary,
      date: payload.date ?? null,
      start_time: payload.startTime ? `${payload.startTime}:00` : null,
      city: payload.city ?? null,
      est_total_cost: it.estTotalCost,
      source: payload.seedIdea ? "card" : "planner",
      transport_mode: payload.transportMode ?? "auto",
    })
    .select("id")
    .single();
  if (insErr || !ins) throw new Error(insErr?.message ?? "Failed to save plan");

  // Insert stops
  const stops = it.stops.map((s, idx) => ({
    itinerary_id: ins.id,
    position: idx,
    name: s.name,
    category: s.category,
    description: s.description,
    address: s.address,
    start_time: s.startTime ? `${s.startTime}:00` : null,
    duration_minutes: s.durationMinutes,
    est_cost: s.estCost,
    what_to_do: s.whatToDo,
    booking_url: s.bookingUrl,
    booking_provider: s.bookingProvider,
    review_snippets: s.reviewSnippets ?? [],
    parking: s.parking ?? null,
    tips: s.tips ?? [],
    travel_from_prev: idx === 0 ? null : (s.travelFromPrev ?? null),
    dress_code: s.dressCode ?? null,
  }));
  const { error: stopsErr } = await supabase.from("itinerary_stops").insert(stops);
  if (stopsErr) throw new Error(stopsErr.message);

  // Award XP for creating an itinerary
  awardXP(user.id, "create_itinerary");

  return { id: ins.id };
}

/* ── Two-phase build: navigate early, populate in background ── */

/**
 * Phase 1: Insert a skeleton itinerary row instantly and return its ID.
 * The caller navigates to /trips/:id immediately while Phase 2 runs.
 */
export async function createSkeletonItinerary(payload: BuildPayload): Promise<{ id: string }> {
  const { data: userRes } = await supabase.auth.getUser();
  const user = userRes.user;
  if (!user) throw new Error("Sign in required to save itineraries.");

  const { data: ins, error: insErr } = await supabase
    .from("itineraries")
    .insert({
      user_id: user.id,
      title: payload.occasion || "Building your day…",
      occasion_slug: payload.occasionSlug ?? null,
      vibe: payload.vibe ?? null,
      summary: null,
      date: payload.date ?? null,
      start_time: payload.startTime ? `${payload.startTime}:00` : null,
      city: payload.city ?? null,
      est_total_cost: null,
      source: "building" as string,
      transport_mode: payload.transportMode ?? "auto",
    })
    .select("id")
    .single();
  if (insErr || !ins) throw new Error(insErr?.message ?? "Failed to create plan");
  return { id: ins.id };
}

/**
 * Phase 2: Call the edge function, verify venues, insert stops,
 * then update the itinerary row with real data.
 * Returns true on success, throws on failure.
 */
export async function populateItinerary(
  itineraryId: string,
  payload: BuildPayload,
): Promise<boolean> {
  const { loadPrefs, tasteSummary } = await import("@/lib/taste");
  const prefs = await loadPrefs();

  const { getSelectedCity } = await import("@/lib/cities");
  const sel = getSelectedCity();
  const enriched: BuildPayload = {
    ...payload,
    city: payload.city ?? sel?.name,
    region: payload.region ?? sel?.region,
    lat: payload.lat ?? sel?.lat ?? null,
    lng: payload.lng ?? sel?.lng ?? null,
  };

  const { data, error } = await supabase.functions.invoke("build-itinerary", {
    body: { ...enriched, tasteSummary: tasteSummary(prefs) },
  });
  if (error) throw new Error(error.message);
  const it = data?.itinerary as AiItinerary & { _unverified?: boolean };
  if (!it?.stops?.length) {
    // Clean up the skeleton row on failure
    await supabase.from("itineraries").delete().eq("id", itineraryId);
    throw new Error(
      "Couldn't verify any real venues for this plan in your selected city. Try a different vibe or change your city.",
    );
  }

  // Update itinerary with real data
  const { error: updErr } = await supabase
    .from("itineraries")
    .update({
      title: it.title,
      summary: it.summary,
      est_total_cost: it.estTotalCost,
      source: payload.seedIdea ? "card" : "planner",
    })
    .eq("id", itineraryId);
  if (updErr) throw new Error(updErr.message);

  // Insert stops
  const stops = it.stops.map((s, idx) => ({
    itinerary_id: itineraryId,
    position: idx,
    name: s.name,
    category: s.category,
    description: s.description,
    address: s.address,
    start_time: s.startTime ? `${s.startTime}:00` : null,
    duration_minutes: s.durationMinutes,
    est_cost: s.estCost,
    what_to_do: s.whatToDo,
    booking_url: s.bookingUrl,
    booking_provider: s.bookingProvider,
    review_snippets: s.reviewSnippets ?? [],
    parking: s.parking ?? null,
    tips: s.tips ?? [],
    travel_from_prev: idx === 0 ? null : (s.travelFromPrev ?? null),
    dress_code: s.dressCode ?? null,
  }));
  const { error: stopsErr } = await supabase.from("itinerary_stops").insert(stops);
  if (stopsErr) throw new Error(stopsErr.message);

  emitItineraryChanged();
  return true;
}

export async function listItineraries(): Promise<Itinerary[]> {
  const { data, error } = await supabase
    .from("itineraries")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data as Itinerary[];
}

export async function getItinerary(id: string): Promise<{ itinerary: Itinerary; stops: Stop[] }> {
  const { data: it, error: e1 } = await supabase
    .from("itineraries")
    .select("*")
    .eq("id", id)
    .single();
  if (e1 || !it) throw new Error(e1?.message ?? "Not found");
  const { data: stops, error: e2 } = await supabase
    .from("itinerary_stops")
    .select("*")
    .eq("itinerary_id", id)
    .order("position");
  if (e2) throw new Error(e2.message);
  return { itinerary: it as Itinerary, stops: (stops ?? []) as Stop[] };
}

export const ITINERARY_CHANGED_EVENT = "itinerary:changed";

function emitItineraryChanged() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(ITINERARY_CHANGED_EVENT));
}

export async function updateStop(stopId: string, patch: Partial<Stop>): Promise<void> {
  const { error } = await supabase.from("itinerary_stops").update(patch).eq("id", stopId);
  if (error) throw new Error(error.message);
  emitItineraryChanged();
}

/**
 * Append a new stop to the end of an itinerary. Computes the next `position`
 * by reading the current max from `itinerary_stops`.
 */
export async function insertStop(
  itineraryId: string,
  payload: Omit<Stop, "id" | "position">,
): Promise<{ id: string }> {
  // Find the highest existing position so we can append.
  const { data: maxRow, error: maxErr } = await supabase
    .from("itinerary_stops")
    .select("position")
    .eq("itinerary_id", itineraryId)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (maxErr) throw new Error(maxErr.message);
  const nextPosition = (maxRow?.position ?? -1) + 1;

  const { data, error } = await supabase
    .from("itinerary_stops")
    .insert({
      itinerary_id: itineraryId,
      position: nextPosition,
      name: payload.name,
      category: payload.category,
      description: payload.description ?? null,
      address: payload.address ?? null,
      start_time: payload.start_time ?? null,
      duration_minutes: payload.duration_minutes ?? null,
      est_cost: payload.est_cost ?? null,
      what_to_do: payload.what_to_do ?? null,
      booking_url: payload.booking_url ?? null,
      booking_provider: payload.booking_provider ?? null,
      review_snippets: payload.review_snippets ?? [],
      parking: payload.parking ?? null,
      tips: payload.tips ?? [],
      dress_code: payload.dress_code ?? null,
    })
    .select("id")
    .single();
  if (error || !data) throw new Error(error?.message ?? "Failed to add stop");
  emitItineraryChanged();
  return { id: data.id };
}

/**
 * Persist a new order for all stops on an itinerary.
 * `orderedStopIds` is the new sequence; positions are renumbered 0..N-1.
 */
export async function reorderItineraryStops(
  itineraryId: string,
  orderedStopIds: string[],
): Promise<void> {
  // Issue updates in parallel — each row is keyed by id so order doesn't matter.
  const updates = orderedStopIds.map((stopId, idx) =>
    supabase
      .from("itinerary_stops")
      .update({ position: idx })
      .eq("id", stopId)
      .eq("itinerary_id", itineraryId),
  );
  const results = await Promise.all(updates);
  const failed = results.find((r) => r.error);
  if (failed?.error) throw new Error(failed.error.message);
  emitItineraryChanged();
}

/**
 * Remove a stop and renumber the remaining positions to keep them contiguous.
 */
export async function deleteStop(stopId: string): Promise<void> {
  // Look up the itinerary so we can renumber afterwards.
  const { data: row, error: lookupErr } = await supabase
    .from("itinerary_stops")
    .select("itinerary_id, position")
    .eq("id", stopId)
    .maybeSingle();
  if (lookupErr) throw new Error(lookupErr.message);
  if (!row) return;

  const { error: delErr } = await supabase.from("itinerary_stops").delete().eq("id", stopId);
  if (delErr) throw new Error(delErr.message);

  // Renumber subsequent stops (best-effort; if it fails, the gap is harmless).
  const { data: laterStops } = await supabase
    .from("itinerary_stops")
    .select("id, position")
    .eq("itinerary_id", row.itinerary_id)
    .gt("position", row.position)
    .order("position", { ascending: true });
  if (laterStops) {
    for (const s of laterStops) {
      await supabase
        .from("itinerary_stops")
        .update({ position: s.position - 1 })
        .eq("id", s.id);
    }
  }
  emitItineraryChanged();
}

export async function deleteItinerary(id: string): Promise<void> {
  const { error } = await supabase.from("itineraries").delete().eq("id", id);
  if (error) throw new Error(error.message);
  emitItineraryChanged();
}

export async function updateItinerary(id: string, patch: Partial<Itinerary>): Promise<void> {
  const { error } = await supabase.from("itineraries").update(patch).eq("id", id);
  if (error) throw new Error(error.message);
  emitItineraryChanged();
}

export async function completeItinerary(id: string): Promise<void> {
  await updateItinerary(id, { completed_at: new Date().toISOString() });
}

/** Duplicate an itinerary + its stops. Used to "rebook the same day" on a new date. */
export async function cloneItinerary(
  id: string,
  overrides: { date?: string | null; start_time?: string | null; title?: string } = {},
): Promise<{ id: string }> {
  const { itinerary, stops } = await getItinerary(id);
  const { data: userRes } = await supabase.auth.getUser();
  const user = userRes.user;
  if (!user) throw new Error("Sign in required.");

  const { data: ins, error: insErr } = await supabase
    .from("itineraries")
    .insert({
      user_id: user.id,
      title: overrides.title ?? `${itinerary.title} (rebook)`,
      occasion_slug: itinerary.occasion_slug ?? null,
      vibe: itinerary.vibe ?? null,
      summary: itinerary.summary ?? null,
      date: overrides.date ?? null,
      start_time: overrides.start_time ?? itinerary.start_time ?? null,
      city: itinerary.city ?? null,
      est_total_cost: itinerary.est_total_cost ?? null,
      source: itinerary.source,
      transport_mode: itinerary.transport_mode ?? null,
    })
    .select("id")
    .single();
  if (insErr || !ins) throw new Error(insErr?.message ?? "Failed to rebook");

  if (stops.length) {
    const cloned = stops.map((s, idx) => ({
      itinerary_id: ins.id,
      position: idx,
      name: s.name,
      category: s.category,
      description: s.description ?? null,
      address: s.address ?? null,
      start_time: s.start_time ?? null,
      duration_minutes: s.duration_minutes ?? null,
      est_cost: s.est_cost ?? null,
      what_to_do: s.what_to_do ?? null,
      booking_url: s.booking_url ?? null,
      booking_provider: s.booking_provider ?? null,
      booking_status: "unbooked" as const,
      review_snippets: s.review_snippets ?? [],
      parking: s.parking ?? null,
      tips: s.tips ?? [],
      travel_from_prev: s.travel_from_prev ?? null,
      party_size: s.party_size ?? null,
      dress_code: s.dress_code ?? null,
    }));
    const { error: e } = await supabase.from("itinerary_stops").insert(cloned);
    if (e) throw new Error(e.message);
  }
  return { id: ins.id };
}

export type Reservation = Stop & {
  itinerary_id: string;
  itinerary_title: string;
  itinerary_date: string | null;
  itinerary_city: string | null;
};

export async function listReservations(): Promise<Reservation[]> {
  const { data, error } = await supabase
    .from("itinerary_stops")
    .select("*, itineraries!inner(id, title, date, city, user_id)")
    .in("booking_status", ["pending", "confirmed"])
    .order("position");
  if (error) throw new Error(error.message);
  return (data ?? []).map((r: any) => ({
    ...r,
    itinerary_id: r.itineraries.id,
    itinerary_title: r.itineraries.title,
    itinerary_date: r.itineraries.date,
    itinerary_city: r.itineraries.city,
  })) as Reservation[];
}
