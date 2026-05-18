import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { apiError, authenticate, checkRate, json, reservations } from "@/lib/partner-api";

const Patch = z.object({
  datetime: z.string().datetime({ offset: true }).optional(),
  party_size: z.number().int().min(1).max(50).optional(),
  notes: z.string().max(500).optional(),
  table_assignment: z.string().optional(),
  status: z.enum(["confirmed", "cancelled", "no_show", "completed"]).optional(),
});

const Cancel = z.object({
  reason: z.enum(["user_cancelled", "itinerary_changed", "venue_swap"]).optional(),
  refund_deposit: z.boolean().optional(),
});

export const Route = createFileRoute("/api/public/partner/v1/reservations/$id")({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        const auth = authenticate(request);
        if (auth instanceof Response) return auth;
        const limited = checkRate(auth.venue_id);
        if (limited) return limited;
        const r = reservations.get(params.id);
        if (!r || r.venue_id !== auth.venue_id) return apiError("NOT_FOUND", "Reservation not found");
        return json(r);
      },

      PATCH: async ({ request, params }) => {
        const auth = authenticate(request);
        if (auth instanceof Response) return auth;
        const limited = checkRate(auth.venue_id);
        if (limited) return limited;
        const r = reservations.get(params.id);
        if (!r || r.venue_id !== auth.venue_id) return apiError("NOT_FOUND", "Reservation not found");

        let raw: unknown;
        try { raw = await request.json(); } catch { return apiError("VALIDATION", "Invalid JSON"); }
        const parsed = Patch.safeParse(raw);
        if (!parsed.success) return apiError("VALIDATION", "Invalid request", parsed.error.flatten());

        const updated = { ...r, ...parsed.data, updated_at: new Date().toISOString() };
        reservations.upsert(params.id, updated);
        return json(updated);
      },

      DELETE: async ({ request, params }) => {
        const auth = authenticate(request);
        if (auth instanceof Response) return auth;
        const limited = checkRate(auth.venue_id);
        if (limited) return limited;
        const r = reservations.get(params.id);
        if (!r || r.venue_id !== auth.venue_id) return apiError("NOT_FOUND", "Reservation not found");

        let body: z.infer<typeof Cancel> = {};
        try {
          const text = await request.text();
          body = text ? Cancel.parse(JSON.parse(text)) : {};
        } catch { /* allow empty body */ }

        const cancelled = {
          ...r,
          status: "cancelled" as const,
          deposit_status: body.refund_deposit ? "refunded" as const : r.deposit_status,
          updated_at: new Date().toISOString(),
        };
        reservations.upsert(params.id, cancelled);

        return json({
          reservation_id: cancelled.reservation_id,
          status: "cancelled",
          refund_status: body.refund_deposit ? "processing" : "no_refund",
          refund_amount: body.refund_deposit && r.deposit_status === "paid" ? 50 : 0,
          cancelled_at: cancelled.updated_at,
        });
      },
    },
  },
});
