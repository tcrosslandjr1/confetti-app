/**
 * Viator API Integration (TripAdvisor)
 * Docs: https://docs.viator.com/partner-api/
 *
 * Handles: activity/tour search, availability, booking
 * Auth: API key (partner program — free)
 * Use for: Things to do stops in Confetti itineraries
 */

import type {
  BookingRequest,
  BookingConfirmation,
  BookingError,
  AvailabilitySlot,
  VenueSearchResult,
} from "../types";

const VIATOR_BASE = "https://api.viator.com/partner";

interface ViatorConfig {
  apiKey: string;
}

let config: ViatorConfig | null = null;

export function configure(cfg: ViatorConfig) {
  config = cfg;
}

function headers() {
  if (!config) throw new Error("Viator not configured.");
  return {
    "exp-api-key": config.apiKey,
    "Content-Type": "application/json",
    Accept: "application/json;version=2.0",
  };
}

// ─── Search Activities ───────────────────────────────────────────────
export async function searchActivities(
  query: string,
  destinationId: string = "684" // Washington DC
): Promise<VenueSearchResult[]> {
  const res = await fetch(`${VIATOR_BASE}/products/search`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({
      filtering: {
        destination: destinationId,
        searchTerm: query,
      },
      sorting: { sort: "TRAVELER_RATING", order: "DESCENDING" },
      pagination: { start: 1, count: 20 },
    }),
  });

  if (!res.ok) return [];
  const data = await res.json();

  return (data.products || []).map((p: any) => ({
    provider: "viator" as const,
    venueId: p.productCode,
    name: p.title,
    cuisine: undefined,
    neighborhood: p.location?.address?.city || "DC",
    rating: p.reviews?.combinedAverageRating,
    priceLevel: undefined,
    imageUrl: p.images?.[0]?.variants?.[0]?.url,
    bookable: p.bookingConfirmation === "INSTANT",
  }));
}

// ─── Availability ────────────────────────────────────────────────────
export async function checkAvailability(
  productCode: string,
  date: string,
  partySize: number
): Promise<AvailabilitySlot[]> {
  const res = await fetch(`${VIATOR_BASE}/availability/check`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({
      productCode,
      travelDate: date,
      paxMix: [{ ageBand: "ADULT", numberOfTravelers: partySize }],
    }),
  });

  if (!res.ok) return [];
  const data = await res.json();

  return (data.bookableItems || []).map((item: any) => ({
    time: item.startTime || "flexible",
    partySize,
    type: item.label || "standard",
    available: item.available,
  }));
}

// ─── Book ────────────────────────────────────────────────────────────
export async function createBooking(
  req: BookingRequest
): Promise<BookingConfirmation | BookingError> {
  // Step 1: Hold the booking
  const holdRes = await fetch(`${VIATOR_BASE}/bookings/hold`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({
      productCode: req.venueId,
      travelDate: req.date,
      startTime: req.time,
      paxMix: [{ ageBand: "ADULT", numberOfTravelers: req.partySize }],
      currency: "USD",
      partnerBookingRef: `confetti-${req.userId}-${Date.now()}`,
    }),
  });

  if (!holdRes.ok) {
    return {
      provider: "viator",
      code: "NO_AVAILABILITY",
      message: "Activity not available for selected time",
      retryable: false,
    };
  }

  const holdData = await holdRes.json();

  // Step 2: Confirm the hold
  const confirmRes = await fetch(`${VIATOR_BASE}/bookings/book`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({
      bookingHoldId: holdData.bookingHoldId,
      bookerInfo: {
        firstName: "Confetti",
        lastName: "Guest",
        email: req.userId,
      },
      communication: { email: true },
    }),
  });

  if (!confirmRes.ok) {
    return {
      provider: "viator",
      code: "UNKNOWN",
      message: "Booking confirmation failed",
      retryable: true,
    };
  }

  const confirmData = await confirmRes.json();
  return {
    provider: "viator",
    confirmationId: confirmData.bookingRef,
    venueName: confirmData.productTitle || req.venueId,
    date: req.date,
    time: req.time,
    partySize: req.partySize,
    status: "booked",
    deepLink: confirmData.voucherUrl,
    cancellationPolicy: confirmData.cancellationPolicy?.description,
    createdAt: new Date().toISOString(),
  };
}

// ─── Cancel ──────────────────────────────────────────────────────────
export async function cancelBooking(bookingRef: string): Promise<boolean> {
  const res = await fetch(`${VIATOR_BASE}/bookings/${bookingRef}/cancel`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ reason: "Customer requested cancellation via Confetti" }),
  });
  return res.ok;
}
