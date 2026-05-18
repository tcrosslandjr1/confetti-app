import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { apiError, json, orders, reservations, verifySignature } from "@/lib/partner-api";

// Inbound webhook: venue → Confetti. Verified via HMAC-SHA256 in X-Confetti-Signature.
const Body = z.object({
  event: z.enum([
    "reservation.confirmed",
    "reservation.cancelled",
    "reservation.updated",
    "order.confirmed",
    "order.preparing",
    "order.ready",
    "order.cancelled",
    "menu.updated",
  ]),
  venue_id: z.string().min(1),
  resource_id: z.string().min(1).optional(),
  timestamp: z.string().datetime().optional(),
  data: z.record(z.string(), z.unknown()).optional(),
});

export const Route = createFileRoute("/api/public/webhooks/partner")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const raw = await request.text();
        const sig = request.headers.get("x-confetti-signature");
        if (!verifySignature(raw, sig)) return apiError("INVALID_TOKEN", "Invalid signature");

        let payload: z.infer<typeof Body>;
        try {
          payload = Body.parse(JSON.parse(raw));
        } catch (e) {
          return apiError("VALIDATION", "Invalid payload", { issues: String(e) });
        }

        // Apply to in-memory store
        if (payload.resource_id) {
          if (payload.event.startsWith("reservation.")) {
            const r = reservations.get(payload.resource_id);
            if (r && r.venue_id === payload.venue_id) {
              const map: Record<string, typeof r.status> = {
                "reservation.confirmed": "confirmed",
                "reservation.cancelled": "cancelled",
                "reservation.updated": r.status,
              };
              reservations.upsert(r.reservation_id, {
                ...r,
                status: map[payload.event] ?? r.status,
                updated_at: new Date().toISOString(),
              });
            }
          } else if (payload.event.startsWith("order.")) {
            const o = orders.get(payload.resource_id);
            if (o && o.venue_id === payload.venue_id) {
              const map: Record<string, typeof o.status> = {
                "order.confirmed": "confirmed",
                "order.preparing": "preparing",
                "order.ready": "ready",
                "order.cancelled": "cancelled",
              };
              orders.upsert(o.order_id, {
                ...o,
                status: map[payload.event] ?? o.status,
                updated_at: new Date().toISOString(),
              });
            }
          }
        }

        return json({ received: true, event: payload.event });
      },
    },
  },
});
