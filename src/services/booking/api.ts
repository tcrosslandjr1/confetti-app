/**
 * Booking API — Client-side wrapper for the booking-orchestrator edge function.
 *
 * All external provider calls (Viator, Stripe, OpenTable, etc.) route through
 * the server-side edge function to keep credentials secure.
 *
 * Usage:
 *   import { bookingApi } from "@/services/booking/api";
 *   const availability = await bookingApi.checkAvailability("viator", { productCode, travelDate });
 *   const payment = await bookingApi.createPayment({ amountCents: 5000, confettiCode: "ABC123" });
 */

import { supabase } from "@/integrations/supabase/client";

type Provider = "viator" | "opentable" | "resy" | "mindbody" | "chargepoint" | "stripe";

type Action =
  | "check_availability"
  | "create_booking"
  | "cancel_booking"
  | "create_payment"
  | "confirm_payment"
  | "provider_status";

interface BookingResponse<T = unknown> {
  data: T | null;
  error: string | null;
}

async function invoke<T = unknown>(
  action: Action,
  provider: Provider,
  params: Record<string, unknown> = {},
): Promise<BookingResponse<T>> {
  const { data, error } = await supabase.functions.invoke("booking-orchestrator", {
    body: { action, provider, params },
  });

  if (error) {
    return { data: null, error: error.message ?? "Booking request failed" };
  }
  if (data?.error) {
    return { data: null, error: data.error };
  }
  return { data: data as T, error: null };
}

export const bookingApi = {
  /** Check which providers are configured and ready */
  async getProviderStatus() {
    return invoke<{
      providers: Record<Provider, { configured: boolean; partnership: string }>;
    }>("provider_status", "viator");
  },

  /** Check availability for a specific provider */
  async checkAvailability(provider: Provider, params: Record<string, unknown>) {
    return invoke("check_availability", provider, params);
  },

  /** Create a booking */
  async createBooking(provider: Provider, params: Record<string, unknown>) {
    return invoke("create_booking", provider, params);
  },

  /** Cancel a booking */
  async cancelBooking(provider: Provider, params: Record<string, unknown>) {
    return invoke("cancel_booking", provider, params);
  },

  /** Create a Stripe payment intent (returns client_secret for Elements) */
  async createPayment(params: { amountCents: number; confettiCode: string; description?: string }) {
    return invoke<{
      paymentIntentId: string;
      clientSecret: string;
      amount: number;
      currency: string;
      status: string;
    }>("create_payment", "stripe", params);
  },

  /** Check payment status */
  async confirmPayment(paymentIntentId: string) {
    return invoke<{
      paymentIntentId: string;
      status: string;
      amount: number;
    }>("confirm_payment", "stripe", { paymentIntentId });
  },
};
