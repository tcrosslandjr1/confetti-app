/**
 * OpenTable API Integration
 * Docs: https://platform.opentable.com
 *
 * Handles: restaurant search, availability checks, reservation booking/cancellation
 * Auth: OAuth 2.0 partner credentials
 * Rate limit: 100 req/min per partner
 */

import type {
  BookingRequest,
  BookingConfirmation,
  BookingError,
  AvailabilitySlot,
  VenueSearchResult,
} from "../types";

const OPENTABLE_BASE = "https://platform.opentable.com/v2";

interface OpenTableConfig {
  clientId: string;
  clientSecret: string;
  partnerId: string;
}

let config: OpenTableConfig | null = null;
let accessToken: string | null = null;
let tokenExpiry: number = 0;

// ─── Auth ────────────────────────────────────────────────────────────
export function configure(cfg: OpenTableConfig) {
  config = cfg;
}

async function getToken(): Promise<string> {
  if (accessToken && Date.now() < tokenExpiry) return accessToken;
  if (!config) throw new Error("OpenTable not configured. Call configure() first.");

  const res = await fetch(`${OPENTABLE_BASE}/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      grant_type: "client_credentials",
      client_id: config.clientId,
      client_secret: config.clientSecret,
    }),
  });

  if (!res.ok) throw new Error(`OpenTable auth failed: ${res.status}`);
  const data = await res.json();
  accessToken = data.access_token;
  tokenExpiry = Date.now() + data.expires_in * 1000 - 60000; // refresh 1 min early
  return accessToken!;
}

async function authedFetch(path: string, options: RequestInit = {}) {
  const token = await getToken();
  return fetch(`${OPENTABLE_BASE}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...options.headers,
    },
  });
}

// ─── Search ──────────────────────────────────────────────────────────
export async function searchRestaurants(
  query: string,
  location: { lat: number; lng: number },
  radius: number = 5000
): Promise<VenueSearchResult[]> {
  const res = await authedFetch(
    `/restaurants?query=${encodeURIComponent(query)}&lat=${location.lat}&lng=${location.lng}&radius=${radius}`
  );
  if (!res.ok) return [];
  const data = await res.json();

  return data.restaurants.map((r: any) => ({
    provider: "opentable" as const,
    venueId: r.id,
    name: r.name,
    cuisine: r.cuisine,
    neighborhood: r.neighborhood,
    rating: r.rating,
    priceLevel: r.price_level,
    imageUrl: r.primary_photo_url,
    bookable: r.is_bookable,
  }));
}

// ─── Availability ────────────────────────────────────────────────────
export async function checkAvailability(
  venueId: string,
  date: string,
  partySize: number
): Promise<AvailabilitySlot[]> {
  const res = await authedFetch(
    `/restaurants/${venueId}/availability?date=${date}&party_size=${partySize}`
  );
  if (!res.ok) return [];
  const data = await res.json();

  return data.time_slots.map((slot: any) => ({
    time: slot.time,
    partySize,
    type: slot.area_name || "dining room",
    available: slot.is_available,
  }));
}

// ─── Book ────────────────────────────────────────────────────────────
export async function createReservation(
  req: BookingRequest
): Promise<BookingConfirmation | BookingError> {
  const res = await authedFetch(`/reservations`, {
    method: "POST",
    body: JSON.stringify({
      restaurant_id: req.venueId,
      date: req.date,
      time: req.time,
      party_size: req.partySize,
      first_name: "Confetti",
      last_name: "Guest",
      email: req.userId, // Confetti user email
      special_requests: req.notes || "",
      seating_preference: req.preferences?.seating || "any",
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    return {
      provider: "opentable",
      code: res.status === 409 ? "NO_AVAILABILITY" : "UNKNOWN",
      message: err.message || `Booking failed with status ${res.status}`,
      retryable: res.status >= 500,
    };
  }

  const data = await res.json();
  return {
    provider: "opentable",
    confirmationId: data.confirmation_number,
    venueName: data.restaurant_name,
    date: data.date,
    time: data.time,
    partySize: data.party_size,
    status: "booked",
    deepLink: `https://www.opentable.com/booking/confirmation?id=${data.confirmation_number}`,
    cancellationPolicy: data.cancellation_policy,
    createdAt: new Date().toISOString(),
  };
}

// ─── Cancel ──────────────────────────────────────────────────────────
export async function cancelReservation(
  confirmationId: string
): Promise<boolean> {
  const res = await authedFetch(`/reservations/${confirmationId}`, {
    method: "DELETE",
  });
  return res.ok;
}
