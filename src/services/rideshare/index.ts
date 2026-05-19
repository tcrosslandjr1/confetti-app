/**
 * Rideshare Service — Deep Links
 * Generates Uber and Lyft deep links. No API keys needed.
 * Auto-selects XL for parties > 4.
 */

export interface RideOption {
  provider: "uber" | "lyft";
  label: string;
  url: string;
  estimatedMinutes?: number;
  icon: string;
}

export interface RideLocation {
  lat: number;
  lng: number;
  name?: string;
  address?: string;
}

export function buildUberLink(pickup: RideLocation, dropoff: RideLocation, partySize?: number): string {
  const product = partySize && partySize > 4 ? "UberXL" : "UberX";
  const params = new URLSearchParams({
    action: "setPickup",
    "pickup[latitude]": pickup.lat.toString(),
    "pickup[longitude]": pickup.lng.toString(),
    "pickup[nickname]": pickup.name || "Pickup",
    "dropoff[latitude]": dropoff.lat.toString(),
    "dropoff[longitude]": dropoff.lng.toString(),
    "dropoff[nickname]": dropoff.name || "Dropoff",
    product_id: product,
  });
  return `https://m.uber.com/ul/?${params}`;
}

export function buildLyftLink(pickup: RideLocation, dropoff: RideLocation, partySize?: number): string {
  const rideType = partySize && partySize > 4 ? "lyft_xl" : "lyft";
  const params = new URLSearchParams({
    id: rideType,
    "pickup[latitude]": pickup.lat.toString(),
    "pickup[longitude]": pickup.lng.toString(),
    "destination[latitude]": dropoff.lat.toString(),
    "destination[longitude]": dropoff.lng.toString(),
    partner: "confetti-app",
  });
  return `https://lyft.com/ride?${params}`;
}

export function getRideOptions(pickup: RideLocation, dropoff: RideLocation, partySize?: number): RideOption[] {
  return [
    {
      provider: "uber",
      label: partySize && partySize > 4 ? "Uber XL" : "Uber",
      url: buildUberLink(pickup, dropoff, partySize),
      icon: "🚗",
    },
    {
      provider: "lyft",
      label: partySize && partySize > 4 ? "Lyft XL" : "Lyft",
      url: buildLyftLink(pickup, dropoff, partySize),
      icon: "🩷",
    },
  ];
}

export function rideBetweenStops(
  stops: { lat: number; lng: number; name: string }[],
  partySize?: number
): { from: string; to: string; rides: RideOption[] }[] {
  const legs: { from: string; to: string; rides: RideOption[] }[] = [];
  for (let i = 0; i < stops.length - 1; i++) {
    legs.push({
      from: stops[i].name,
      to: stops[i + 1].name,
      rides: getRideOptions(stops[i], stops[i + 1], partySize),
    });
  }
  return legs;
}
