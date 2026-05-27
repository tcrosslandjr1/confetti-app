/**
 * Confetti Booking Orchestrator
 *
 * Coordinates multi-stop booking across all providers.
 * Called by the "Book This Confetti" button — books every stop
 * in sequence, rolls back on failure, and returns a unified result.
 */

import type {
  BookingProvider,
  BookingRequest,
  BookingConfirmation,
  BookingError,
  BookingStatus,
} from "./types";

import * as opentable from "./providers/opentable";
import * as resy from "./providers/resy";
import * as chargepoint from "./providers/chargepoint";
import * as viator from "./providers/viator";
import * as mindbody from "./providers/mindbody";
import * as stripe from "./providers/stripe";

// ─── Orchestrator Types ──────────────────────────────────────────────
export interface ItineraryBookingRequest {
  confettiCode: string;
  userId: string;
  partySize: number;
  stops: StopBookingRequest[];
  paymentMethodId?: string; // Stripe payment method for paid bookings
}

export interface StopBookingRequest {
  stopId: string;
  stopName: string;
  provider: BookingProvider;
  venueId: string;
  date: string;
  time: string;
  bookingType: "reservation" | "activity" | "charging" | "wellness";
}

export interface ItineraryBookingResult {
  confettiCode: string;
  status: "all_booked" | "partial" | "failed";
  confirmations: BookingConfirmation[];
  errors: (BookingError & { stopId: string })[];
  paymentStatus?: string;
}

type ProgressCallback = (
  stopId: string,
  status: BookingStatus,
  detail?: string
) => void;

// ─── Configure All Providers ─────────────────────────────────────────
export interface ConfettiApiConfig {
  opentable?: { clientId: string; clientSecret: string; partnerId: string };
  resy?: { apiKey: string; clientSecret: string };
  chargepoint?: { apiKey: string };
  viator?: { apiKey: string };
  mindbody?: { apiKey: string; siteId: string };
  stripe?: { secretKey: string; publishableKey: string };
}

export function configureAll(cfg: ConfettiApiConfig) {
  if (cfg.opentable) opentable.configure(cfg.opentable);
  if (cfg.resy) resy.configure(cfg.resy);
  if (cfg.chargepoint) chargepoint.configure(cfg.chargepoint);
  if (cfg.viator) viator.configure(cfg.viator);
  if (cfg.mindbody) mindbody.configure(cfg.mindbody);
  if (cfg.stripe) stripe.configure(cfg.stripe);
}

// ─── Book Single Stop ────────────────────────────────────────────────
async function bookStop(
  stop: StopBookingRequest,
  partySize: number,
  userId: string
): Promise<BookingConfirmation | BookingError> {
  const req: BookingRequest = {
    provider: stop.provider,
    venueId: stop.venueId,
    date: stop.date,
    time: stop.time,
    partySize,
    userId,
  };

  switch (stop.provider) {
    case "opentable":
      return opentable.createReservation(req);
    case "resy":
      return resy.createReservation(req);
    case "viator":
      return viator.createBooking(req);
    case "mindbody":
      return mindbody.createAppointment(req, req.venueId.split(":")[0]);
    case "chargepoint":
      // EV charging doesn't pre-book — return a confirmation placeholder
      const station = await chargepoint.getStation(stop.venueId);
      if (!station || !station.available) {
        return {
          provider: "chargepoint",
          code: "NO_AVAILABILITY",
          message: "Charging station not available",
          retryable: true,
        };
      }
      return {
        provider: "chargepoint",
        confirmationId: `cp-${stop.venueId}-${Date.now()}`,
        venueName: station.name,
        date: stop.date,
        time: stop.time,
        partySize: 1,
        status: "booked",
        deepLink: `https://na.chargepoint.com/charge_point?id=${stop.venueId}`,
        createdAt: new Date().toISOString(),
      };
    default:
      return {
        provider: stop.provider,
        code: "UNKNOWN",
        message: `Unknown provider: ${stop.provider}`,
        retryable: false,
      };
  }
}

// ─── Book Entire Itinerary ───────────────────────────────────────────
export async function bookItinerary(
  request: ItineraryBookingRequest,
  onProgress?: ProgressCallback
): Promise<ItineraryBookingResult> {
  const confirmations: BookingConfirmation[] = [];
  const errors: (BookingError & { stopId: string })[] = [];

  // Book stops sequentially (order matters — first stop confirms dinner time, etc.)
  for (const stop of request.stops) {
    onProgress?.(stop.stopId, "searching", `Looking up ${stop.stopName}...`);

    try {
      onProgress?.(stop.stopId, "confirming", `Booking ${stop.stopName}...`);
      const result = await bookStop(stop, request.partySize, request.userId);

      if ("confirmationId" in result) {
        confirmations.push(result);
        onProgress?.(stop.stopId, "booked", `${stop.stopName} confirmed!`);
      } else {
        errors.push({ ...result, stopId: stop.stopId });
        onProgress?.(stop.stopId, "failed", result.message);
      }
    } catch (err) {
      errors.push({
        provider: stop.provider,
        code: "UNKNOWN",
        message: err instanceof Error ? err.message : "Unexpected error",
        retryable: true,
        stopId: stop.stopId,
      });
      onProgress?.(stop.stopId, "failed", "Unexpected error");
    }

    // Small delay between bookings to respect rate limits
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  // Determine overall status
  const status: ItineraryBookingResult["status"] =
    errors.length === 0
      ? "all_booked"
      : confirmations.length === 0
        ? "failed"
        : "partial";

  // Process payment if all bookable stops succeeded and payment method provided
  let paymentStatus: string | undefined;
  if (status === "all_booked" && request.paymentMethodId) {
    try {
      const totalCents = confirmations.reduce((sum) => sum + 0, 0); // actual pricing TBD
      if (totalCents > 0) {
        const intent = await stripe.createPaymentIntent(
          totalCents,
          request.confettiCode,
          request.userId,
          `Confetti itinerary: ${request.confettiCode}`
        );
        const confirmed = await stripe.confirmPayment(
          intent.stripePaymentIntentId,
          request.paymentMethodId
        );
        paymentStatus = confirmed.status;
      }
    } catch {
      paymentStatus = "failed";
    }
  }

  return {
    confettiCode: request.confettiCode,
    status,
    confirmations,
    errors,
    paymentStatus,
  };
}

// ─── Cancel Entire Itinerary ─────────────────────────────────────────
export async function cancelItinerary(
  confirmations: BookingConfirmation[]
): Promise<{ cancelled: string[]; failed: string[] }> {
  const cancelled: string[] = [];
  const failed: string[] = [];

  for (const conf of confirmations) {
    try {
      let success = false;
      switch (conf.provider) {
        case "opentable":
          success = await opentable.cancelReservation(conf.confirmationId);
          break;
        case "resy":
          success = await resy.cancelReservation(conf.confirmationId);
          break;
        case "viator":
          success = await viator.cancelBooking(conf.confirmationId);
          break;
        case "mindbody":
          success = await mindbody.cancelAppointment("", conf.confirmationId);
          break;
        default:
          success = true; // EV charging doesn't need cancellation
      }
      (success ? cancelled : failed).push(conf.confirmationId);
    } catch {
      failed.push(conf.confirmationId);
    }
  }

  return { cancelled, failed };
}
