import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { apiError, authenticate, checkRate, json } from "@/lib/partner-api";

// Mock menu store; replace with venue_menus table.
const MENU: Record<string, unknown> = {
  ven_xyz789: {
    venue_id: "ven_xyz789",
    last_updated: "2026-05-15T09:00:00Z",
    categories: [
      {
        name: "Brunch",
        available_hours: "09:00-15:00",
        items: [
          {
            id: "mi_001",
            name: "Chicken & Waffles",
            description: "Buttermilk fried chicken, Belgian waffle, house maple",
            price: 18.0,
            image_url: "https://cdn.confetti.app/menus/mi_001.jpg",
            dietary: ["gluten"],
            available: true,
            popular: true,
          },
        ],
      },
    ],
  },
};

const PutBody = z.object({
  categories: z
    .array(
      z.object({
        name: z.string().min(1).max(80),
        available_hours: z.string().max(40).optional(),
        items: z
          .array(
            z.object({
              id: z.string(),
              name: z.string().min(1).max(120),
              description: z.string().max(500).optional(),
              price: z.number().nonnegative(),
              image_url: z.string().url().optional(),
              dietary: z.array(z.string()).max(20).optional(),
              available: z.boolean().default(true),
              popular: z.boolean().optional(),
            }),
          )
          .max(500),
      }),
    )
    .max(50),
});

export const Route = createFileRoute("/api/public/partner/v1/menu")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const auth = authenticate(request);
        if (auth instanceof Response) return auth;
        const limited = checkRate(auth.venue_id);
        if (limited) return limited;
        const menu = MENU[auth.venue_id] ?? {
          venue_id: auth.venue_id,
          last_updated: null,
          categories: [],
        };
        return json(menu as never);
      },

      PUT: async ({ request }) => {
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
        const parsed = PutBody.safeParse(raw);
        if (!parsed.success) return apiError("VALIDATION", "Invalid menu", parsed.error.flatten());

        MENU[auth.venue_id] = {
          venue_id: auth.venue_id,
          last_updated: new Date().toISOString(),
          categories: parsed.data.categories,
        };
        return json({ ok: true, last_updated: new Date().toISOString() });
      },
    },
  },
});
