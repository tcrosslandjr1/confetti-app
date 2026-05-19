/**
 * Rideshare Deep Link Service
 * No API key required — generates universal links for Uber & Lyft
 *
 * These deep links open the rider app with destination pre-filled.
 * If the app isn't installed, they fall back to the mobile web experience.
 */

// ─── Types ──────────────────────────────────────────────────────────

export interface RideRequest {
  pickup: {
    lat: number;
    lng: number;
    address?: string;
    nickname?: string; // "The Roosevelt"
  };
  dropoff: {
    lat: number;
    lng: number;
    address?: string;
    nickname?: string;
  };
  partySize?: number;
}

export interface RideDeepLink {
  provider: "uber" | "lyft";
  url: string;
  fallbackUrl: string; // web version if app not installed
  estimatedPickupMinutes?: number; // placeholder for future API integration
}

// ─── Uber Deep Links ────────────────────────────────────────────────

/**
 * Uber Universal Link
 * Docs: https://developer.uber.com/docs/riders/ride-requests/tutorials/deep-links/introduction
 *
 * Opens Uber app with ride pre-filled. Falls back to m.uber.com.
 * No API key needed for deep links.
 */
export function buildUberLink(req: RideRequest): RideDeepLink {
  const params = new URLSearchParams();

  // Action
  params.set("action", "setPickup");

  // Pickup
  if (req.pickup.lat && req.pickup.lng) {
    params.set("pickup[latitude]", req.pickup.lat.toString());
    params.set("pickup[longitude]", req.pickup.lng.toString());
    if (req.pickup.nickname) params.set("pickup[nickname]", req.pickup.nickname);
    if (req.pickup.address) params.set("pickup[formatted_address]", req.pickup.address);
  } else {
    params.set("pickup", "my_location");
  }

  // Dropoff
  params.set("dropoff[latitude]", req.dropoff.lat.toString());
  params.set("dropoff[longitude]", req.dropoff.lng.toString());
  if (req.dropoff.nickname) params.set("dropoff[nickname]", req.dropoff.nickname);
  if (req.dropoff.address) params.set("dropoff[formatted_address]", req.dropoff.address);

  // Product (XL if party > 4)
  if (req.partySize && req.partySize > 4) {
    params.set("product_id", "821415d8-3bd5-4e27-9571-7b08e8b0d452"); // UberXL
  }

  const url = `uber://?${params.toString()}`;
  const fallbackUrl = `https://m.uber.com/ul/?${params.toString()}`;

  return { provider: "uber", url, fallbackUrl };
}

// ─── Lyft Deep Links ────────────────────────────────────────────────

/**
 * Lyft Universal Link
 * Docs: https://developer.lyft.com/docs/deeplinks
 *
 * Opens Lyft app with ride pre-filled. Falls back to lyft.com.
 * No API key needed for deep links.
 */
export function buildLyftLink(req: RideRequest): RideDeepLink {
  const params = new URLSearchParams();

  // Ride type (XL if party > 4)
  const rideType = req.partySize && req.partySize > 4 ? "lyft_xl" : "lyft";
  params.set("id", rideType);

  // Pickup
  params.set("pickup[latitude]", req.pickup.lat.toString());
  params.set("pickup[longitude]", req.pickup.lng.toString());
  if (req.pickup.address) params.set("pickup[address]", req.pickup.address);

  // Destination
  params.set("destination[latitude]", req.dropoff.lat.toString());
  params.set("destination[longitude]", req.dropoff.lng.toString());
  if (req.dropoff.address) params.set("destination[address]", req.dropoff.address);

  // Partner attribution
  params.set("partner", "confetti-app");

  const url = `lyft://ridetype?${params.toString()}`;
  const fallbackUrl = `https://ride.lyft.com/ridetype?${params.toString()}`;

  return { provider: "lyft", url, fallbackUrl };
}

// ─── Unified Ride Request ───────────────────────────────────────────

/**
 * Returns deep links for both providers.
 * The app UI can show both options or let user pick their default.
 */
export function getRideOptions(req: RideRequest): RideDeepLink[] {
  return [buildUberLink(req), buildLyftLink(req)];
}

/**
 * Generate a ride link between two Confetti itinerary stops.
 * Convenience wrapper for the trip planner.
 */
export function rideBetweenStops(
  from: { name: string; lat: number; lng: number; address?: string },
  to: { name: string; lat: number; lng: number; address?: string },
  partySize?: number
): RideDeepLink[] {
  return getRideOptions({
    pickup: { lat: from.lat, lng: from.lng, address: from.address, nickname: from.name },
    dropoff: { lat: to.lat, lng: to.lng, address: to.address, nickname: to.name },
    partySize,
  });
}
