import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { generateText, Output } from "ai";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { createLovableAiGatewayProvider } from "./ai-gateway.server";

/* -------------------------------------------------------------------------- */
/*  Shared shapes                                                              */
/* -------------------------------------------------------------------------- */

export type MenuItem = {
  id: string;
  emoji: string;
  name: string;
  desc: string;
  price: number; // dollars
  category?: string;
};

const MenuItemSchema = z.object({
  id: z.string().min(1).max(60),
  emoji: z.string().min(1).max(8),
  name: z.string().min(1).max(80),
  desc: z.string().min(1).max(160),
  price: z.number().min(1).max(500),
  category: z.string().max(40).optional(),
});

const MenuSchema = z.object({
  items: z.array(MenuItemSchema).min(2).max(8),
});

const isUuid = (s: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);

/* -------------------------------------------------------------------------- */
/*  Fallback menus by category (used when AI is unavailable)                   */
/* -------------------------------------------------------------------------- */

const FALLBACK: Record<string, MenuItem[]> = {
  drinks: [
    { id: "old-fashioned", emoji: "🥃", name: "Old Fashioned", desc: "Bourbon, demerara, angostura, orange", price: 16 },
    { id: "spritz", emoji: "🥂", name: "Aperol Spritz", desc: "Aperol, prosecco, soda, orange", price: 14 },
    { id: "negroni", emoji: "🍹", name: "Negroni", desc: "Gin, Campari, sweet vermouth", price: 15 },
    { id: "house-lager", emoji: "🍺", name: "House Lager", desc: "Local craft, 16oz draft", price: 8 },
  ],
  meal: [
    { id: "burger", emoji: "🍔", name: "Smash Burger", desc: "Double patty, american, pickles, special sauce", price: 18 },
    { id: "caesar", emoji: "🥗", name: "Little Gem Caesar", desc: "Anchovy, parmesan, sourdough crumbs", price: 14 },
    { id: "pasta", emoji: "🍝", name: "Cacio e Pepe", desc: "Tonnarelli, pecorino, black pepper", price: 22 },
    { id: "tiramisu", emoji: "🍰", name: "Tiramisu", desc: "Espresso-soaked savoiardi, mascarpone", price: 12 },
  ],
  activity: [
    { id: "entry", emoji: "🎟️", name: "General Entry", desc: "One adult ticket, valid today", price: 25 },
    { id: "guide", emoji: "📖", name: "Guided Add-on", desc: "45-min expert walkthrough", price: 15 },
  ],
  scenic: [
    { id: "skip", emoji: "⚡", name: "Skip-the-Line", desc: "Priority entry, valid today", price: 20 },
    { id: "audio", emoji: "🎧", name: "Audio Guide", desc: "Self-paced narrated tour", price: 8 },
  ],
};

function fallbackMenu(category?: string): MenuItem[] {
  const key = (category ?? "drinks").toLowerCase();
  return FALLBACK[key] ?? FALLBACK.drinks;
}

/* -------------------------------------------------------------------------- */
/*  getStopMenu — returns cached menu or generates via AI                      */
/* -------------------------------------------------------------------------- */

const GetMenuSchema = z.object({
  stopId: z.string().min(1).max(80),
  stopName: z.string().min(1).max(120),
  category: z.string().max(40).optional(),
  city: z.string().max(80).optional(),
  refresh: z.boolean().optional(),
});

export const getStopMenu = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => GetMenuSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const persistable = isUuid(data.stopId);

    // 1. Try cache
    if (persistable && !data.refresh) {
      const { data: cached } = await supabase
        .from("stop_menus")
        .select("items, generated_at")
        .eq("stop_id", data.stopId)
        .maybeSingle();
      if (cached?.items && Array.isArray(cached.items) && cached.items.length) {
        return { items: cached.items as MenuItem[], cached: true };
      }
    }

    // 2. Generate via Lovable AI
    let items: MenuItem[] = [];
    const apiKey = process.env.LOVABLE_API_KEY;
    if (apiKey) {
      try {
        const gateway = createLovableAiGatewayProvider(apiKey);
        const model = gateway("google/gemini-2.5-flash");
        const cat = (data.category ?? "drinks").toLowerCase();
        const venueDesc = data.city
          ? `${data.stopName} in ${data.city}`
          : data.stopName;

        const system =
          "You generate concise, realistic pre-order menus for a night-out booking app. Items must feel native to the venue type. Prices in USD, integer dollars. Each desc is a short ingredient/details line under 120 chars. Use one emoji per item. Provide 4 items.";

        const prompt =
          cat === "meal"
            ? `Generate a 4-item small-plates pre-order menu for ${venueDesc}. Mix shareable starters and one main. Realistic restaurant pricing.`
            : cat === "activity" || cat === "scenic"
            ? `Generate a 4-item pre-order add-on menu for ${venueDesc} (an ${cat}). Think tickets, upgrades, snacks, merch. Realistic pricing.`
            : `Generate a 4-item signature cocktail pre-order menu for ${venueDesc}. Mix two cocktails, one beer/wine, one non-alcoholic. Realistic bar pricing.`;

        const { experimental_output } = await generateText({
          model,
          system,
          prompt,
          experimental_output: Output.object({ schema: MenuSchema }),
        });
        const parsed = experimental_output;
        if (parsed?.items?.length) {
          items = parsed.items.map((it) => ({
            ...it,
            id: it.id
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, "-")
              .replace(/^-|-$/g, "")
              .slice(0, 40) || `item-${Math.random().toString(36).slice(2, 8)}`,
          }));
        }
      } catch {
        // fall through to fallback
      }
    }

    if (!items.length) {
      items = fallbackMenu(data.category);
    }

    // 3. Cache when possible
    if (persistable && items.length) {
      await supabase
        .from("stop_menus")
        .upsert({
          stop_id: data.stopId,
          items: items as unknown as never,
          source: apiKey ? "ai" : "fallback",
          generated_at: new Date().toISOString(),
        });
    }

    return { items, cached: false };
  });

/* -------------------------------------------------------------------------- */
/*  placeStopOrder — records a pre-order                                       */
/* -------------------------------------------------------------------------- */

const PlaceOrderSchema = z.object({
  itineraryId: z.string().uuid(),
  stopId: z.string().uuid(),
  items: z
    .array(
      z.object({
        id: z.string().min(1).max(60),
        name: z.string().min(1).max(80),
        qty: z.number().int().min(1).max(20),
        price: z.number().min(0).max(500),
      }),
    )
    .min(1)
    .max(20),
  note: z.string().max(280).optional(),
});

export const placeStopOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => PlaceOrderSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    // Gate: only verified business venues may accept pre-orders.
    const { data: stopRow } = await supabase
      .from("itinerary_stops")
      .select("name")
      .eq("id", data.stopId)
      .maybeSingle();
    if (!stopRow?.name) throw new Error("Stop not found");
    const { data: verifiedMatch } = await supabase
      .from("venues")
      .select("id")
      .eq("verified", true)
      .ilike("name", stopRow.name)
      .limit(1)
      .maybeSingle();
    if (!verifiedMatch) {
      throw new Error("This venue isn't verified with Confetti — pre-orders unavailable.");
    }

    const totalCents = Math.round(
      data.items.reduce((acc, it) => acc + it.price * it.qty, 0) * 100,
    );
    const { data: inserted, error } = await supabase
      .from("stop_orders")
      .insert({
        user_id: userId,
        itinerary_id: data.itineraryId,
        stop_id: data.stopId,
        items: data.items as unknown as never,
        total_cents: totalCents,
        note: data.note ?? null,
        status: "placed",
      })
      .select("id, total_cents, created_at")
      .single();
    if (error) throw new Error(error.message);
    return { id: inserted.id, totalCents: inserted.total_cents, createdAt: inserted.created_at };
  });

/* -------------------------------------------------------------------------- */
/*  listStopOrders — current order(s) for a stop                               */
/* -------------------------------------------------------------------------- */

export const listStopOrders = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ stopId: z.string().uuid() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: rows, error } = await supabase
      .from("stop_orders")
      .select("id, items, total_cents, status, note, created_at")
      .eq("stop_id", data.stopId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return { orders: rows ?? [] };
  });

/* -------------------------------------------------------------------------- */
/*  listVerifiedStopNames — which of these stop names are at Confetti-verified */
/*  business venues (so pre-order should be offered).                          */
/* -------------------------------------------------------------------------- */

export const listVerifiedStopNames = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        names: z.array(z.string().min(1).max(200)).min(1).max(30),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const uniq = Array.from(new Set(data.names.map((n) => n.trim()).filter(Boolean)));
    if (!uniq.length) return { verified: [] as string[] };
    const orExpr = uniq.map((n) => `name.ilike.${n.replace(/[(),]/g, " ")}`).join(",");
    const { data: rows, error } = await supabaseAdmin
      .from("venues")
      .select("name")
      .eq("verified", true)
      .or(orExpr);
    if (error) return { verified: [] as string[] };
    const set = new Set((rows ?? []).map((r) => (r.name ?? "").toLowerCase()));
    return { verified: uniq.filter((n) => set.has(n.toLowerCase())) };
  });
