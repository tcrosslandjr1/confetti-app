import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import {
  apiError,
  authenticate,
  checkRate,
  genId,
  json,
  orders,
  type Order,
} from "@/lib/partner-api";

const Item = z.object({
  menu_item_id: z.string(),
  name: z.string(),
  quantity: z.number().int().min(1).max(50),
  price: z.number().nonnegative(),
  modifications: z.array(z.string().max(120)).max(10).optional(),
});

const Body = z.object({
  user_id: z.string().min(1),
  venue_id: z.string().min(1),
  reservation_id: z.string().optional(),
  type: z.enum(["dine_in_preorder", "pickup"]),
  pickup_time: z.string().datetime({ offset: true }),
  items: z.array(Item).min(1).max(50),
  subtotal: z.number().nonnegative(),
  tax: z.number().nonnegative(),
  tip: z.number().nonnegative().optional().default(0),
  total: z.number().nonnegative(),
  payment_method_id: z.string().optional(),
  special_instructions: z.string().max(500).optional(),
});

export const Route = createFileRoute("/api/public/partner/v1/orders/")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const auth = authenticate(request);
        if (auth instanceof Response) return auth;
        const limited = checkRate(auth.venue_id);
        if (limited) return limited;

        let raw: unknown;
        try {
          raw = await request.json();
        } catch {
          return apiError("VALIDATION", "Invalid JSON");
        }
        const parsed = Body.safeParse(raw);
        if (!parsed.success)
          return apiError("VALIDATION", "Invalid request", parsed.error.flatten());
        const data = parsed.data;

        if (auth.venue_id !== data.venue_id)
          return apiError("INVALID_TOKEN", "Token does not match venue_id");

        const now = new Date().toISOString();
        const id = genId("ord");
        const order: Order = {
          order_id: id,
          venue_id: data.venue_id,
          user_id: data.user_id,
          reservation_id: data.reservation_id,
          type: data.type,
          pickup_time: data.pickup_time,
          items: data.items,
          subtotal: data.subtotal,
          tax: data.tax,
          tip: data.tip,
          total: data.total,
          status: auth.tier === 3 ? "confirmed" : "pending_venue",
          payment_status: "paid",
          estimated_ready: data.pickup_time,
          created_at: now,
          updated_at: now,
        };
        orders.upsert(id, order);

        return json(
          {
            order_id: order.order_id,
            venue_id: order.venue_id,
            status: order.status,
            estimated_ready: order.estimated_ready,
            payment_status: order.payment_status,
            items_confirmed: true,
            created_at: order.created_at,
          },
          201,
        );
      },

      GET: async ({ request }) => {
        const auth = authenticate(request);
        if (auth instanceof Response) return auth;
        const limited = checkRate(auth.venue_id);
        if (limited) return limited;
        return json({ orders: orders.forVenue(auth.venue_id) });
      },
    },
  },
});
