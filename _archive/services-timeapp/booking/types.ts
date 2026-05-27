// ─── Confetti Booking Service Types ─────────────────────────────────

export type BookingProvider =
  | "opentable"
  | "resy"
  | "chargepoint"
  | "viator"
  | "mindbody"
  | "google_reserve";

export type BookingStatus =
  | "idle"
  | "searching"
  | "confirming"
  | "booked"
  | "failed"
  | "cancelled";

export interface BookingRequest {
  provider: BookingProvider;
  venueId: string;
  date: string; // ISO 8601
  time: string; // "18:30"
  partySize: number;
  userId: string;
  notes?: string;
  preferences?: {
    seating?: "indoor" | "outdoor" | "bar" | "any";
    dietary?: string[];
    evVehicleType?: string;
  };
}

export interface BookingConfirmation {
  provider: BookingProvider;
  confirmationId: string;
  venueName: string;
  date: string;
  time: string;
  partySize: number;
  status: BookingStatus;
  deepLink?: string; // link to manage reservation in provider app
  cancellationPolicy?: string;
  createdAt: string;
}

export interface BookingError {
  provider: BookingProvider;
  code: "NO_AVAILABILITY" | "AUTH_EXPIRED" | "VENUE_NOT_FOUND" | "RATE_LIMIT" | "UNKNOWN";
  message: string;
  retryable: boolean;
}

export interface AvailabilitySlot {
  time: string;
  partySize: number;
  type?: string; // "dining room", "patio", "bar"
  available: boolean;
}

export interface VenueSearchResult {
  provider: BookingProvider;
  venueId: string;
  name: string;
  cuisine?: string;
  neighborhood: string;
  rating?: number;
  priceLevel?: 1 | 2 | 3 | 4;
  imageUrl?: string;
  bookable: boolean;
}

// ─── Stripe / Payment Types ─────────────────────────────────────────

export interface PaymentIntent {
  stripePaymentIntentId: string;
  amount: number; // cents
  currency: string;
  status: "created" | "processing" | "succeeded" | "failed";
  loopCode: string; // ties payment to a specific Confetti itinerary
}

// ─── EV Charging Types ──────────────────────────────────────────────

export interface ChargingStation {
  stationId: string;
  name: string;
  address: string;
  connectorTypes: string[];
  available: boolean;
  pricing: string;
  network: "chargepoint" | "evgo" | "electrify_america";
}

export interface ChargingSession {
  sessionId: string;
  stationId: string;
  status: "queued" | "charging" | "complete";
  kwhDelivered?: number;
  cost?: number;
  startTime: string;
  estimatedEndTime?: string;
}
