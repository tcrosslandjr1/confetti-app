// ============================================================
// Scanner: Google Places — New Openings & Venue Verification
// ============================================================
// This is the backbone scanner. It:
// 1. Finds newly listed venues via Places API (new openings)
// 2. Resolves venue names from other platforms to place_ids
// 3. Verifies venue existence and pulls structured data
//
// Runs: Daily for new openings, on-demand for verification
// ============================================================

import { GOOGLE_PLACES_API_KEY, SEARCH_QUERIES } from '../config';
import type { PlatformResult, ResolvedVenue } from '../types';

const PLACES_BASE = 'https://places.googleapis.com/v1/places';
const TEXTSEARCH_URL = `${PLACES_BASE}:searchText`;

interface PlacesTextSearchResult {
  places?: Array<{
    id: string;
    displayName: { text: string };
    formattedAddress: string;
    location: { latitude: number; longitude: number };
    primaryType?: string;
    rating?: number;
    userRatingCount?: number;
    photos?: Array<{ name: string }>;
    businessStatus?: string;
    regularOpeningHours?: { openNow?: boolean };
  }>;
}

/**
 * Scan for newly opened venues in a city
 */
export async function scanNewOpenings(city: string): Promise<PlatformResult[]> {
  const results: PlatformResult[] = [];
  const queries = [
    `new restaurant ${city}`,
    `just opened ${city}`,
    `new bar ${city}`,
    `new cafe ${city}`,
    `grand opening ${city}`
  ];

  for (const query of queries) {
    try {
      const places = await textSearch(query);
      for (const place of places) {
        // Only include places that are operational
        if (place.businessStatus && place.businessStatus !== 'OPERATIONAL') continue;

        results.push({
          venue_name: place.displayName.text,
          venue_address: place.formattedAddress,
          city,
          category: classifyPlaceType(place.primaryType),
          platform: 'google_places',
          post_id: place.id,
          engagement_likes: place.userRatingCount || 0,
          engagement_comments: 0,
          engagement_shares: 0,
          sentiment: place.rating ? (place.rating - 3) / 2 : undefined,  // normalize 1-5 to -1..1
          snippet: `${place.displayName.text} — ${place.rating || 'New'}★ (${place.userRatingCount || 0} reviews)`
        });
      }
    } catch (err) {
      console.warn(`Google Places search failed for "${query}":`, err);
    }
  }

  // Deduplicate by place ID
  const seen = new Set<string>();
  return results.filter(r => {
    if (!r.post_id || seen.has(r.post_id)) return false;
    seen.add(r.post_id);
    return true;
  });
}

/**
 * Resolve a venue name + city to a Google Places result
 * Used by other scanners to get structured venue data
 */
export async function resolveToGooglePlace(name: string, city: string): Promise<ResolvedVenue | null> {
  const query = `${name} ${city}`;
  const places = await textSearch(query);

  if (places.length === 0) return null;

  const best = places[0];
  return {
    name: best.displayName.text,
    city,
    country: 'US',  // TODO: derive from address
    category: classifyPlaceType(best.primaryType),
    address: best.formattedAddress,
    lat: best.location.latitude,
    lng: best.location.longitude,
    google_place_id: best.id,
    image_url: best.photos?.[0]
      ? `https://places.googleapis.com/v1/${best.photos[0].name}/media?key=${GOOGLE_PLACES_API_KEY}&maxWidthPx=800`
      : undefined
  };
}

// ---- Internal helpers ----

async function textSearch(query: string): Promise<PlacesTextSearchResult['places'] extends (infer T)[] ? T[] : never[]> {
  const res = await fetch(TEXTSEARCH_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': GOOGLE_PLACES_API_KEY,
      'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.location,places.primaryType,places.rating,places.userRatingCount,places.photos,places.businessStatus'
    },
    body: JSON.stringify({
      textQuery: query,
      maxResultCount: 10,
      languageCode: 'en'
    })
  });

  if (!res.ok) {
    throw new Error(`Places API ${res.status}: ${await res.text()}`);
  }

  const data: PlacesTextSearchResult = await res.json();
  return (data.places || []) as any;
}

function classifyPlaceType(type?: string): string {
  if (!type) return 'restaurant';
  const t = type.toLowerCase();
  if (t.includes('bar') || t.includes('night_club') || t.includes('lounge')) return 'bar';
  if (t.includes('cafe') || t.includes('coffee')) return 'cafe';
  if (t.includes('club') || t.includes('night')) return 'club';
  if (t.includes('amusement') || t.includes('tourist') || t.includes('museum')) return 'experience';
  return 'restaurant';
}
