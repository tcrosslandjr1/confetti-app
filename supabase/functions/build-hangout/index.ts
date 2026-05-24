// ============================================================
// build-hangout — Confetti's "your whole hangout, planned for you"
//
// Goes beyond venue itineraries. Generates a full real-life
// hangout brief: menu, groceries, drinks, supplies, timeline,
// music, games, nearby stores, weather backup, cleanup.
//
// Supported occasions (free-text accepted, these get richer prompts):
//   crabs-backyard, game-night, cookout, bbq, park-lunch, picnic,
//   family-day, kids-day, potluck, porch-drinks, movie-night,
//   tailgate, beach-day, sunday-chill, birthday-at-home,
//   low-key-hang, outdoor-gathering.
//
// POST { occasion, city, guestCount, budget, vibe?, startTime?,
//        notes?, mode?: "host"|"outdoor"|"stay-in" }
// ============================================================

import { serve } from "../_shared/server.ts";
import { jsonResponse, errorResponse, supabaseAdmin } from "../_shared/supabase-client.ts";
import { consumeRateLimit, callerIdentity } from "../_shared/ratelimit.ts";
import { ensureCityVenues } from "../_shared/venue-discovery.ts";

interface Body {
  /** Free-text occasion. We map common ones to prompts; everything else falls through. */
  occasion: string;
  /** City (used for nearby stores / weather context). */
  city?: string;
  /** How many people, default 6. */
  guestCount?: number;
  /** "$" | "$$" | "$$$" — total event budget tier. */
  budget?: string;
  /** Free-text vibe modifier ("low-key", "rowdy", "kid-friendly", etc.). */
  vibe?: string;
  /** ISO date + HH:MM. */
  date?: string;
  startTime?: string;
  /** Free-text extras / dietary / allergies / theme. */
  notes?: string;
  /** Plan mode — affects which sections matter. Default "host". */
  mode?: "host" | "outdoor" | "stay-in";
  /** Indoor / outdoor (steers weather backup + supplies). */
  setting?: "indoor" | "outdoor" | "either";
}

// Per-occasion guidance the LLM uses to fill the plan.
const OCCASION_PLAYBOOK: Record<string, string> = {
  "crabs-backyard": `Maryland-style crab feast — 6-12 live blue crabs/person, Old Bay heavy, vinegar, mallets, brown paper for the table, big foil pans, lots of paper towels, ice. Sides: corn on the cob, potato salad, coleslaw, hush puppies. Drinks: Natty Boh, light beer, lemonade, sweet tea. Music: classic R&B, beach music, party hits. Find the closest seafood market for live crabs (Baltimore: Conrad's, Faidley's; DC: Jessie Taylor; otherwise the highest-rated crab/seafood spot you know). Weather backup: tarp + screened porch.`,
  "game-night": `Curated 3-4 games for the group size (Codenames, Telestrations, Catan, Werewolf, party-card decks). Snacks: charcuterie, popcorn flights, sliders, finger foods. Drinks: cocktails + mocktails. Setup: seating around a big table + side seating, lighting. Activities: prizes, team rotations. Late-night food order pre-saved for 11pm pivot.`,
  "cookout": `Classic American backyard cookout. Menu: burgers, dogs, wings, ribs OR brisket if smoker. Sides: mac & cheese, baked beans, slaw, watermelon. Drinks: beer, lemonade, sweet tea, cocktails. Supplies: charcoal/propane, lighter fluid, foil, tongs, thermometer, plates, cups, ice. Setup timeline: meats start prep 4hrs ahead, grill 90min before guests. Music: BBQ playlist (R&B, soul, country, hip-hop). Backup: pop-up canopy + plan B indoors.`,
  "bbq": `Same as cookout but lean smoke + low-and-slow if pitmaster vibe. Brisket / pulled pork / ribs / smoked chicken. Sides: collards, mac & cheese, beans, cornbread.`,
  "park-lunch": `Find the right park for the group (nearest scenic park with picnic tables + shade + parking + restrooms). Menu: sandwiches, salads, fruit, cookies, lemonade. Cooler list. Blanket, frisbee, ball. Kids: bubbles, chalk. Parking + restroom note. Pack-out reminder.`,
  "picnic": `Charcuterie picnic energy. Spread + cheese + fruit + bread + chocolate. Wine + sparkling water. Blanket, board, cute napkins. Find the most photogenic park or waterfront nearby.`,
  "family-day": `Multigenerational. Kid-friendly first stop (zoo/aquarium/park) + family-style lunch + treat (ice cream/dessert). Light on the booze. Activities: scavenger hunt, group photo, simple games.`,
  "kids-day": `Toddler-friendly stops + snack rotation + nap/quiet hour built in. Indoor backup. Hand wipes, sunscreen, change of clothes.`,
  "potluck": `Assigned dish list by guest. Theme suggestion (taco bar, brunch, soul food). Setup: big table buffet + drinks station. Reminder text template for guests.`,
  "porch-drinks": `Spritzes, frozen drinks, small bites, candles, soft playlist. 3-hour window. Easy clean.`,
  "movie-night": `2-film lineup with intermission snack. Popcorn bar (4-5 toppings), pizza or sliders, candy. Bean bags, blankets, projector check.`,
  "tailgate": `Tailgate menu — wings, sliders, queso. Cooler. Cornhole, ladder ball. Team jerseys. Speakers. Parking arrive time + lot info.`,
  "beach-day": `Sun, snacks, drinks, games. Beach cart, umbrella, towels, sunscreen, water shoes. Sandwiches in cooler, fruit, chips. Find the closest public beach with parking + restrooms.`,
  "sunday-chill": `Bagels, mimosas, NYT crossword energy. Lazy playlist. 2-3 hours. Brunch spread + Bloody Mary bar.`,
  "birthday-at-home": `Cake + theme. Photo backdrop. Activity (paint + sip, karaoke, game). Music. Surprise moment. Bakery pickup.`,
  "low-key-hang": `Small spread, easy drinks, no fuss. 4-6 people max suggestion.`,
  "outdoor-gathering": `Generic outdoor — folding chairs, citronella, bug spray, string lights, blankets if cool.`,
  "theme-park": `Theme park day. Plan around rope-drop OR off-peak afternoon arrival. Park essentials: sunscreen (reapply window), refillable water bottles, snack pack (granola bars, fruit, pretzels), portable phone chargers, ponchos for water rides, comfortable walking shoes, hand sanitizer, wet wipes, advil. Food strategy: 1 sit-down + quick-service for the rest; mobile-order to skip lines. Single-rider lines for thrill rides; rider-swap for kids. Build in regroup points every 2-3 hours (a specific bench, fountain, or stand). Sensory-regulation break: a quiet area mid-day. Budget per person realistic: $80-120 food/snacks/treats above ticket. Parking lane note + tram tip. End-of-day cleanup back at hotel: laundry, restock kit, charge devices. Nearby stores worth knowing: nearest drugstore (sunscreen/advil refills), grocery (water by the case), Target (cheap ponchos).`,
};

interface VenueRow {
  id: string;
  name: string;
  cuisine: string | null;
  cuisine_tags: string[] | null;
  vibe_tags: string[] | null;
  neighborhood: string | null;
  address: string | null;
  city: string;
}

/** Look up "store-type" venues in the city for the nearby_stores section. */
async function fetchNearbyStores(city: string): Promise<VenueRow[]> {
  const tokens = [
    "grocery", "supermarket", "seafood", "fish", "butcher",
    "bakery", "liquor", "wine", "farmer", "bbq",
  ];
  const orParts: string[] = [];
  for (const t of tokens) {
    orParts.push(`cuisine.ilike.%${t}%`, `name.ilike.%${t}%`);
  }
  const { data, error } = await supabaseAdmin
    .from("venues")
    .select("id,name,cuisine,cuisine_tags,vibe_tags,neighborhood,address,city")
    .ilike("city", city)
    .or(orParts.join(","))
    .order("popularity_score", { ascending: false, nullsFirst: false })
    .limit(20);
  if (error) {
    console.warn("[build-hangout] nearby stores error:", error.message);
    return [];
  }
  return (data as VenueRow[]) ?? [];
}

serve(async (req: Request) => {
  try {
    if (req.method === "OPTIONS") return jsonResponse({ ok: true });
    if (req.method !== "POST") return errorResponse("Method not allowed", 405);

    const allowed = await consumeRateLimit({
      scope: "build-hangout",
      identity: callerIdentity(req),
      burst: 10,
      refillPerSec: 10 / 60,
    });
    if (!allowed) return errorResponse("Rate limit exceeded", 429);

    let body: Body;
    try {
      body = (await req.json()) as Body;
    } catch {
      return errorResponse("Invalid JSON body");
    }
    if (!body.occasion || !body.occasion.trim()) {
      return errorResponse("occasion required");
    }

    const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!apiKey) return errorResponse("ANTHROPIC_API_KEY not configured", 500);

    const occasionKey = body.occasion.toLowerCase().trim().replace(/[\s_]+/g, "-");
    const playbook = OCCASION_PLAYBOOK[occasionKey] ?? "Use general party-planning best practices for this occasion.";
    const guestCount = Math.max(2, Math.min(body.guestCount ?? 6, 60));
    const setting = body.setting ?? "either";

    // Warm city venues so nearby_stores has things to point at.
    if (body.city) {
      await ensureCityVenues(
        body.city,
        15,
        25,
        "groceries, supermarkets, seafood markets, liquor stores, bakeries, farmers markets",
      );
    }

    const nearbyStores = body.city ? await fetchNearbyStores(body.city) : [];
    const storeBlock = nearbyStores.length > 0
      ? `\n\nNEARBY STORE CANDIDATES (use these for nearby_stores when relevant — pick by category fit):\n${nearbyStores.map((s) => `- ${s.name} (${s.cuisine ?? "venue"}${s.neighborhood ? `, ${s.neighborhood}` : ""}, ${s.address ?? ""})`).join("\n")}`
      : "";

    const system = `You are Confetti's hangout planner. You design a complete, ready-to-execute real-life hangout for occasion "${body.occasion}" with ${guestCount} guests${body.city ? ` in ${body.city}` : ""}.

Your voice is playful, opinionated, and warm — like a well-prepared friend who's hosted a hundred of these. NOT a generic checklist. Make decisions; don't leave the user choosing between five options for every step.

OCCASION GUIDANCE: ${playbook}

VIBE: ${body.vibe ?? "match the occasion default"}
BUDGET: ${body.budget ?? "moderate"}
SETTING: ${setting}
START TIME: ${body.startTime ?? "TBD"}
NOTES FROM USER: ${body.notes ?? "(none)"}
${storeBlock}

RULES:
- Quantities matter. "6 lbs ribs", "8 lemons", "2 24-packs of beer for 10 adults". Never just "ribs" or "beer".
- Setup timeline is anchored. If startTime is 14:00 and guests arrive at 14:00, your prep tasks should be "T-4h", "T-90m", "T-15m" relative to that.
- Weather backup is concrete — what to do if it rains, not just "have a plan".
- Music suggestion is a vibe + 2-3 specific playlist or artist names.
- Cleanup checklist is ordered actions, not just "clean up".
- Nearby stores must reference the CANDIDATE LIST above when there's a match. Otherwise list a sensible generic ("nearest H Mart for sides", "any Trader Joe's for crudité").
- Skip irrelevant sections — a movie night doesn't need a charcoal reminder. Set fields to null/empty if they don't apply.
- Keep total under ~500 tokens of content; this is a brief, not a novel.
- Return ONLY the tool call. No prose.`;

    const tool = {
      name: "return_hangout_plan",
      description: "Return a full real-life hangout plan",
      input_schema: {
        type: "object",
        properties: {
          title: { type: "string", description: "Catchy 4-8 word plan title" },
          summary: { type: "string", description: "1-2 sentence vibe summary" },
          guest_count: { type: "integer" },
          budget_estimate: { type: "string", description: "e.g. '$180-250 total' or '$25/person'" },
          setting: { type: "string", enum: ["indoor", "outdoor", "either"] },
          menu: {
            type: "array",
            description: "Food items with quantities",
            items: {
              type: "object",
              properties: {
                item: { type: "string" },
                quantity: { type: "string", description: "e.g. '6 lbs', '24 sliders'" },
                notes: { type: "string" },
              },
              required: ["item", "quantity"],
            },
          },
          drinks: {
            type: "array",
            items: {
              type: "object",
              properties: {
                item: { type: "string" },
                quantity: { type: "string" },
                notes: { type: "string" },
              },
              required: ["item", "quantity"],
            },
          },
          grocery_list: {
            type: "array",
            description: "Flat shopping list — grouped by aisle isn't necessary, single string per item is fine",
            items: { type: "string" },
          },
          supplies: {
            type: "array",
            description: "Non-food: plates, ice, charcoal, mallets, tarp, etc.",
            items: { type: "string" },
          },
          setup_timeline: {
            type: "array",
            description: "Ordered prep steps relative to startTime",
            items: {
              type: "object",
              properties: {
                when: { type: "string", description: "e.g. 'T-4h' or '10:00 AM'" },
                task: { type: "string" },
              },
              required: ["when", "task"],
            },
          },
          music: {
            type: "object",
            properties: {
              vibe: { type: "string", description: "1-sentence vibe" },
              playlist_hints: {
                type: "array",
                items: { type: "string" },
                description: "Spotify playlist name suggestions or artists",
              },
            },
          },
          games_activities: {
            type: "array",
            description: "Games or activities for the day",
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                why: { type: "string", description: "Why this fits the group" },
              },
              required: ["name"],
            },
          },
          nearby_stores: {
            type: "array",
            description: "Where to source the food/supplies. Reference the CANDIDATE LIST when matched.",
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                purpose: { type: "string", description: "e.g. 'live blue crabs', 'liquor', 'cake'" },
                neighborhood: { type: "string" },
                address: { type: "string" },
              },
              required: ["name", "purpose"],
            },
          },
          weather_backup: {
            type: "object",
            properties: {
              if_rain: { type: "string", description: "Specific action plan for rain" },
              if_hot: { type: "string" },
              if_cold: { type: "string" },
            },
          },
          cleanup_checklist: {
            type: "array",
            description: "Ordered cleanup tasks",
            items: { type: "string" },
          },
          pickup_links: {
            type: "array",
            description: "Optional reservation/order links — e.g. Instacart, restaurant pickup, bakery order",
            items: {
              type: "object",
              properties: {
                label: { type: "string" },
                url: { type: "string" },
                notes: { type: "string" },
              },
              required: ["label", "url"],
            },
          },
        },
        required: [
          "title",
          "summary",
          "guest_count",
          "budget_estimate",
          "menu",
          "supplies",
          "setup_timeline",
          "music",
          "cleanup_checklist",
        ],
      },
    };

    const claudeRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 4096,
        system,
        messages: [{ role: "user", content: "Plan the hangout now." }],
        tools: [tool],
        tool_choice: { type: "tool", name: tool.name },
      }),
    });
    if (!claudeRes.ok) {
      const txt = await claudeRes.text().catch(() => "");
      return errorResponse(`AI error ${claudeRes.status}: ${txt.slice(0, 200)}`, 502);
    }
    const data = await claudeRes.json();
    const toolUse = (data.content ?? []).find((c: { type?: string }) => c?.type === "tool_use");
    if (!toolUse) return errorResponse("AI did not return a plan", 502);
    const plan = (toolUse as { input: Record<string, unknown> }).input;

    return jsonResponse({
      plan,
      generated_at: new Date().toISOString(),
      model: "claude-sonnet-4-20250514",
      meta: {
        occasion: body.occasion,
        occasion_key: occasionKey,
        city: body.city ?? null,
        guest_count: guestCount,
        nearby_store_candidates: nearbyStores.length,
      },
    });
  } catch (err) {
    console.error("[build-hangout] uncaught:", (err as Error).stack ?? err);
    return errorResponse(`Unhandled: ${(err as Error).message ?? String(err)}`, 500);
  }
});
