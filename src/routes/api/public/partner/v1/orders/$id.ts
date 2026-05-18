import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { apiError, authenticate, checkRate, json, orders } from "@/lib/partner-api";

const Patch = z.object({
  add_items: z.array(z.object({
    menu_item_id: z.string(),
    name: z.string(),
    quantity: z.number().int().min(1),
    price: z.number().nonnegative(),
  })).max(50).optional(),
  remove_items: z.array(z.string()).max(50).optional(),
  new_total: z.number().nonnegative().optional(),
  status: z.enum(["confirmed", "preparing", "ready", "picked_up", "cancelled"]).optional(),
});

export const Route = createFileRoute("/api/public/partner/v1/orders/$id")({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        const auth = authenticate(request);
        if (auth instanceof Response) return auth;
        const limited = checkRate(auth.venue_id);
        if (limited) return limited;
        const o = orders.get(params.id);
        if (!o || o.venue_id !== auth.venue_id) return apiError("NOT_FOUND", "Order not found");
        return json(o);
      },

      PATCH: async ({ request, params }) => {
        const auth = authenticate(request);
        if (auth instanceof Response) return auth;
        const limited = checkRate(auth.venue_id);
        if (limited) return limited;
        const o = orders.get(params.id);
        if (!o || o.venue_id !== auth.venue_id) return apiError("NOT_FOUND", "Order not found");
        if (["preparing", "ready", "picked_up"].includes(o.status)) {
          return apiError("ORDER_LOCKED", "Order is already being prepared");
        }

        let raw: unknown;
        try { raw = await request.json(); } catch { return apiError("VALIDATION", "Invalid JSON"); }
        const parsed = Patch.safeParse(raw);
        if (!parsed.success) return apiError("VALIDATION", "Invalid request", parsed.error.flatten());

        let items = o.items;
        if (parsed.data.remove_items?.length) {
          const drop = new Set(parsed.data.remove_items);
          items = items.filter((i) => !drop.has(i.menu_item_id));
        }
        if (parsed.data.add_items?.length) {
          items = [...items, ...parsed.data.add_items];
        }

        const updated = {
          ...o,
          items,
          total: parsed.data.new_total ?? o.total,
          status: parsed.data.status ?? o.status,
          updated_at: new Date().toISOString(),
        };
        orders.upsert(params.id, updated);
        return json(updated);
      },

      DELETE: async ({ request, params }) => {
        const auth = authenticate(request);
        if (auth instanceof Response) return auth;
        const limited = checkRate(auth.venue_id);
        if (limited) return limited;
        const o = orders.get(params.id);
        if (!o || o.venue_id !== auth.venue_id) return apiError("NOT_FOUND", "Order not found");

        const cancelled = { ...o, status: "cancelled" as const, payment_status: "refunded" as const, updated_at: new Date().toISOString() };
        orders.upsert(params.id, cancelled);

        return json({
          order_id: cancelled.order_id,
          status: "cancelled",
          refund_status: "processing",
          refund_amount: o.total,
          cancelled_at: cancelled.updated_at,
        });
      },
    },
  },
});
