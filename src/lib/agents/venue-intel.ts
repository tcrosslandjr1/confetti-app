/**
 * On-Demand Venue Intel Fetcher
 *
 * When a boarding-pass stop has no enriched data (priceLevel, dressCode,
 * signature, crowd, phone, bestFor, waitTime), this module:
 *   1. Fuzzy-searches the local venue-knowledge.ts (1,074 curated venues)
 *   2. If no match, calls the ai-recommend Supabase edge function for a
 *      Claude-powered lookup
 *   3. Merges the enriched fields back into the LoopStop and persists to
 *      the loop store
 *
 * The caller gets back an enriched stop — or null if nothing was found.
 */

import { VENUE_KNOWLEDGE, type VenueKnowledge } from "./venue-knowledge";
import { getActiveLoop, setActiveLoop, type LoopStop, type ActiveLoop } from "@/lib/loop-store";

// ─── Types ──────────────────────────────────────────────────────

export interface VenueIntel {
  venueId?: string;
  address?: string;
  lat?: number;
  lng?: number;
  priceLevel?: string;
  dressCode?: string;
  signature?: string;
  crowd?: string;
  phone?: string;
  bestFor?: string;
  waitTime?: string;
  parking?: string;
  vibeNotes?: string;
  cuisineTags?: string[];
  vibeTags?: string[];
  photo?: string;
  rating?: number;
  /** Where the data came from */
  source: "local-kb" | "ai-recommend" | "none";
}

export type FetchStatus = "idle" | "loading" | "success" | "not-found" | "error";

// ─── Fuzzy name matching ────────────────────────────────────────

/** Normalize a venue name for comparison: lowercase, strip punctuation, collapse whitespace */
function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/[''`]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Score how well two normalized strings match (0-1). */
function similarityScore(a: string, b: string): number {
  if (a === b) return 1;
  // One contains the other
  if (a.includes(b) || b.includes(a)) return 0.85;
  // Check word overlap
  const aWords = new Set(a.split(" "));
  const bWords = new Set(b.split(" "));
  const overlap = [...aWords].filter((w) => bWords.has(w)).length;
  const union = new Set([...aWords, ...bWords]).size;
  return union > 0 ? overlap / union : 0;
}

/**
 * Search the local knowledge base by venue name and optional city/neighborhood.
 * Returns the best match above a similarity threshold, or null.
 */
export function findLocalVenue(
  name: string,
  city?: string,
  neighborhood?: string,
): VenueKnowledge | null {
  const normName = normalize(name);
  if (!normName) return null;

  let candidates = VENUE_KNOWLEDGE;

  // Narrow by city first if available
  if (city) {
    const normCity = normalize(city);
    const cityFiltered = candidates.filter(
      (v) => normalize(v.city).includes(normCity) || normCity.includes(normalize(v.city)),
    );
    if (cityFiltered.length > 0) candidates = cityFiltered;
  }

  // Narrow by neighborhood if available
  if (neighborhood) {
    const normHood = normalize(neighborhood);
    const hoodFiltered = candidates.filter(
      (v) =>
        normalize(v.neighborhood).includes(normHood) ||
        normHood.includes(normalize(v.neighborhood)),
    );
    if (hoodFiltered.length > 0) candidates = hoodFiltered;
  }

  // Score every candidate by name similarity
  let bestScore = 0;
  let bestMatch: VenueKnowledge | null = null;

  for (const v of candidates) {
    const score = similarityScore(normName, normalize(v.name));
    if (score > bestScore) {
      bestScore = score;
      bestMatch = v;
    }
  }

  // Require at least 0.5 similarity
  return bestScore >= 0.5 ? bestMatch : null;
}

// ─── Convert local KB entry → VenueIntel ────────────────────────

function kbToIntel(kb: VenueKnowledge): VenueIntel {
  const priceMap: Record<number, string> = { 1: "$", 2: "$$", 3: "$$$", 4: "$$$$" };
  return {
    venueId: kb.id,
    address: kb.address,
    lat: kb.lat,
    lng: kb.lng,
    priceLevel: priceMap[kb.priceLevel] ?? "$$",
    vibeNotes: kb.vibeNotes,
    cuisineTags: kb.cuisineTags,
    vibeTags: kb.vibeTags,
    source: "local-kb",
  };
}

// ─── Claude AI lookup via ai-recommend edge function ────────────

async function fetchAiIntel(
  stopName: string,
  stopType: string,
  area: string,
  city: string,
): Promise<VenueIntel | null> {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) return null;

  try {
    const res = await fetch(`${supabaseUrl}/functions/v1/venue-intel`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${supabaseKey}`,
        apikey: supabaseKey,
      },
      body: JSON.stringify({
        venue_name: stopName,
        venue_type: stopType,
        area,
        city,
      }),
    });

    if (!res.ok) {
      console.error(`[Confetti] venue-intel error ${res.status}`);
      return null;
    }

    const data = await res.json();
    if (!data || data.error) return null;

    return {
      address: data.address,
      lat: data.lat,
      lng: data.lng,
      priceLevel: data.price_level,
      dressCode: data.dress_code,
      signature: data.signature,
      crowd: data.crowd,
      phone: data.phone,
      bestFor: data.best_for,
      waitTime: data.wait_time,
      parking: data.parking,
      photo: data.photo,
      rating: data.rating,
      source: "ai-recommend",
    };
  } catch (err) {
    console.error("[Confetti] venue-intel fetch failed:", err);
    return null;
  }
}

// ─── Main entry point ───────────────────────────────────────────

/**
 * Fetch enriched venue intelligence for a stop.
 *
 * Strategy:
 *   1. Check if the stop already has intel (priceLevel, dressCode, etc.) → skip
 *   2. Fuzzy-match against the 1,074-venue local knowledge base
 *   3. If no local match, call the venue-intel edge function (Claude-powered)
 *   4. Merge results into the LoopStop and persist to localStorage
 *
 * Returns the enriched VenueIntel, or { source: "none" } if nothing found.
 */
export async function fetchVenueIntel(
  stopId: string,
  /** Override city (falls back to the active loop's city) */
  city?: string,
): Promise<VenueIntel> {
  const loop = getActiveLoop();
  if (!loop) return { source: "none" };

  const stop = loop.stops.find((s) => s.id === stopId);
  if (!stop) return { source: "none" };

  // Already enriched? Return what we have.
  if (stopHasIntel(stop)) {
    return {
      venueId: stop.venueId,
      address: stop.address,
      priceLevel: stop.priceLevel,
      dressCode: stop.dressCode,
      signature: stop.signature,
      crowd: stop.crowd,
      phone: stop.phone,
      bestFor: stop.bestFor,
      waitTime: stop.waitTime,
      parking: stop.parking?.primary,
      source: "local-kb", // already present
    };
  }

  const resolvedCity = city ?? loop.city ?? loop.toName ?? loop.to ?? "Washington";

  // 1) Try local knowledge base
  const localMatch = findLocalVenue(stop.name, resolvedCity, stop.area);
  if (localMatch) {
    const intel = kbToIntel(localMatch);
    mergeIntelIntoLoop(loop, stopId, intel);
    return intel;
  }

  // 2) Try Claude-powered edge function
  const aiIntel = await fetchAiIntel(
    stop.name,
    stop.type ?? stop.category ?? "",
    stop.area ?? "",
    resolvedCity,
  );
  if (aiIntel) {
    mergeIntelIntoLoop(loop, stopId, aiIntel);
    return aiIntel;
  }

  return { source: "none" };
}

// ─── Helpers ────────────────────────────────────────────────────

/** Check if a stop already has at least some enriched intel fields. */
export function stopHasIntel(stop: LoopStop): boolean {
  return !!(
    stop.priceLevel ||
    stop.dressCode ||
    stop.signature ||
    stop.crowd ||
    stop.phone ||
    stop.bestFor ||
    stop.waitTime
  );
}

/** Merge VenueIntel fields into the stop within a loop and persist. */
function mergeIntelIntoLoop(loop: ActiveLoop, stopId: string, intel: VenueIntel) {
  const updated: ActiveLoop = {
    ...loop,
    stops: loop.stops.map((s) => {
      if (s.id !== stopId) return s;
      return {
        ...s,
        venueId: intel.venueId ?? s.venueId,
        address: intel.address ?? s.address,
        lat: intel.lat ?? s.lat,
        lng: intel.lng ?? s.lng,
        priceLevel: intel.priceLevel ?? s.priceLevel,
        dressCode: intel.dressCode ?? s.dressCode,
        signature: intel.signature ?? s.signature,
        crowd: intel.crowd ?? s.crowd,
        phone: intel.phone ?? s.phone,
        bestFor: intel.bestFor ?? s.bestFor,
        waitTime: intel.waitTime ?? s.waitTime,
        parking: s.parking ?? (intel.parking ? { primary: intel.parking } : undefined),
      };
    }),
  };
  setActiveLoop(updated);
}
