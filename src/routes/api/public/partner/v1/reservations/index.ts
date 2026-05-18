import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import {
  apiError, authenticate, checkRate, confirmationCode, genId, json,
  reservations, type Reservation,
} from "@/lib/partner-api";

const Body = z.object({
  user_id: z.string().min(1),
  venue_id: z.string().min(1),
  datetime: z.string().datetime({ offset: true }),
  party_size: z.number().int().min(1).max(50),
  notes: z.string().max(500).optional(),
  source: z.enum(["itinerary", "direct", "party_room"]),
  itinerary_id: z.string().optional(),
  deposit: z.object({
    required: z.boolean(),
    amount: z.number().nonnegative(),
    currency: z.string().length(3),
    payment_method_id: z.string().optional(),
  }).optional(),
});

export const Route = createFileRoute("/api/public/partner/v1/reservations/")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const auth = authenticate(request);
        if (auth instanceof Response) return auth;
        const limited = checkRate(auth.venue_id);
        if (limited) return limited;

        let raw: unknown;
        try { raw = await request.json(); } catch { return apiError("VALIDATION", "Invalid JSON"); }
        const parsed = Body.safeParse(raw);
        if (!parsed.success) return apiError("VALIDATION", "Invalid request", parsed.error.flatten());
        const data = parsed.data;

        if (auth.venue_id !== data.venue_id) {
          return apiError("INVALID_TOKEN", "Token does not match venue_id");
        }
        if (new Date(data.datetime).getTime() < Date.now()) {
          return apiError("VALIDATION", "datetime must be in the future");
        }
        if (data.party_size > 12) {
          return apiError("PARTY_TOO_LARGE", "Party size exceeds venue maximum", { max: 12 });
        }

        const now = new Date().toISOString();
        const id = genId("res");
        const dtMs = new Date(data.datetime).getTime();
        const reservation: Reservation = {
          reservation_id: id,
          venue_id: data.venue_id,
          user_id: data.user_id,
          datetime: data.datetime,
          party_size: data.party_size,
          status: auth.tier === 3 ? "confirmed" : "pending",
          confirmation_code: confirmationCode(),
          deposit_status: data.deposit?.required ? "paid" : "none",
          notes: data.notes,
          source: data.source,
          created_at: now,
          updated_at: now,
          cancellation_policy: {
            free_cancel_before: new Date(dtMs - 2 * 60 * 60 * 1000).toISOString(),
            late_cancel_fee: 25,
          },
        };
        reservations.upsert(id, reservation);

        return json(reservation, reservation.status === "confirmed" ? 201 : 202);
      },

      GET: async ({ request }) => {
        const auth = authenticate(request);
        if (auth instanceof Response) return auth;
        const limited = checkRate(auth.venue_id);
        if (limited) return limited;
        return json({ reservations: reservations.forVenue(auth.venue_id) });
      },
    },
  },
});
