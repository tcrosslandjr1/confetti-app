/**
 * Resy API Integration
 * Docs: Partner API (Amex-owned, requires partnership agreement)
 *
 * Handles: venue lookup, availability, reservation booking
 * Auth: API key + user auth token
 * Note: Resy API is not publicly documented — endpoints based on partner specs
 */

import type {
  BookingRequest,
  BookingConfirmation,
  BookingError,
  AvailabilitySlot,
  VenueSearchResult,
} from "../types";

const RESY_BASE = "https://api.resy.com/v3";

interface ResyConfig {
  apiKey: string;
  clientSecret: string;
}

let config: ResyConfig | null = null;

export function configure(cfg: ResyConfig) {
  config = cfg;
}

function headers() {
  if (!config) throw new Error("Resy not configured. Call configure() first.");
  return {
    Authorization: `ResyAPI api_key="${config.apiKey}"`,
    "Content-Type": "application/json",
    "X-Resy-Auth-Token": config.clientSecret,
  };
}

// ─── Search ──────────────────────────────────────────────────────────
export async function searchVenues(
  query: string,
  location: { lat: number; lng: number }
): Promise<VenueSearchResult[]> {
  const res = await fetch(
    `${RESY_BASE}/venuesearch/search?query=${encodeURIComponent(query)}&lat=${location.lat}&long=${location.lng}&limit=20`,
    { headers: headers() }
  );
  if (!res.ok) return [];
  const data = await res.json();

  return (data.results?.venues || []).map((v: any) => ({
    provider: "resy" as const,
    venueId: v.venue.id.toString(),
    name: v.venue.name,
    cuisine: v.venue.cuisine,
    neighborhood: v.venue.neighborhood,
    rating: v.venue.rating,
    priceLevel: v.venue.price_range,
    imageUrl: v.venue.images?.[0],
    bookable: true,
  }));
}

// ─── Availability ────────────────────────────────────────────────────
export async function checkAvailability(
  venueId: string,
  date: string,
  partySize: number
): Promise<AvailabilitySlot[]> {
  const res = await fetch(
    `${RESY_BASE}/find?venue_id=${venueId}&day=${date}&party_size=${partySize}&lat=0&long=0`,
    { headers: headers() }
  );
  if (!res.ok) return [];
  const data = await res.json();

  return (data.results?.venues?.[0]?.slots || []).map((slot: any) => ({
    time: slot.date.start,
    partySize,
    type: slot.config?.type || "dining room",
    available: true,
  }));
}

// ─── Book ────────────────────────────────────────────────────────────
export async function createReservation(
  req: BookingRequest
): Promise<BookingConfirmation | BookingError> {
  // Step 1: Get config token for the slot
  const configRes = await fetch(`${RESY_BASE}/details`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({
      venue_id: req.venueId,
      day: req.date,
      party_size: req.partySize,
      time_slot: req.time,
    }),
  });

  if (!configRes.ok) {
    return {
      provider: "resy",
      code: "NO_AVAILABILITY",
      message: "Slot not available or venue not found",
      retryable: false,
    };
  }

  const configData = await configRes.json();
  const bookToken = configData.book_token?.value;

  if (!bookToken) {
    return {
      provider: "resy",
      code: "NO_AVAILABILITY",
      message: "No booking token returned — slot may be taken",
      retryable: true,
    };
  }

  // Step 2: Book with token
  const bookRes = await fetch(`${RESY_BASE}/book`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({
      book_token: bookToken,
      struct_payment_method: null, // no pre-payment
      source_id: "confetti-app",
    }),
  });

  if (!bookRes.ok) {
    return {
      provider: "resy",
      code: "UNKNOWN",
      message: `Booking failed: ${bookRes.status}`,
      retryable: bookRes.status >= 500,
    };
  }

  const bookData = await bookRes.json();
  return {
    provider: "resy",
    confirmationId: bookData.resy_token || bookData.reservation_id,
    venueName: bookData.venue?.name || req.venueId,
    date: req.date,
    time: req.time,
    partySize: req.partySize,
    status: "booked",
    deepLink: `https://resy.com/confirmation/${bookData.resy_token}`,
    cancellationPolicy: bookData.cancellation?.display,
    createdAt: new Date().toISOString(),
  };
}

// ─── Cancel ──────────────────────────────────────────────────────────
export async function cancelReservation(resyToken: string): Promise<boolean> {
  const res = await fetch(`${RESY_BASE}/cancel`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ resy_token: resyToken }),
  });
  return res.ok;
}
