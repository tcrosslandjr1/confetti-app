// Lovable AI Gateway — build a full-day itinerary
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type SeedIdea = {
  title: string;
  hook?: string;
  description?: string;
  vibeTags?: string[];
};

type Body = {
  occasion: string;          // e.g. "Date night"
  vibe?: string;             // tagline / extra hint
  city?: string;
  date?: string;             // ISO date
  startTime?: string;        // "11:00"
  durationHours?: number;    // total day length
  budget?: string;           // '$' | '$$' | '$$$' or freeform
  neighborhood?: string;
  seedIdea?: SeedIdea;       // expand a flashcard into a day
  notes?: string;
  tasteSummary?: string;
  transportMode?: "auto" | "car" | "transit" | "lyft" | "uber" | "walk"; // user preference
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const b = (await req.json()) as Body;
    if (!b.occasion) return json({ error: "occasion required" }, 400);

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) return json({ error: "missing LOVABLE_API_KEY" }, 500);

    const seedBlock = b.seedIdea
      ? `Expand this seed idea into the full day:\nTitle: ${b.seedIdea.title}\n${b.seedIdea.hook ?? ""}\n${b.seedIdea.description ?? ""}\nVibe tags: ${(b.seedIdea.vibeTags ?? []).join(", ")}`
      : "No seed idea — design from scratch.";

    const sys = `You are a thoughtful day-planner for an app called Confetti.
Create ONE full-day itinerary for occasion: "${b.occasion}"${b.vibe ? ` (vibe: ${b.vibe})` : ""}.
City: ${b.city ?? "user's city"} ${b.neighborhood ? `(focus near ${b.neighborhood})` : ""}.
Date: ${b.date ?? "flexible"}, start around ${b.startTime ?? "late morning"}, total length ~${b.durationHours ?? 6} hours.
Budget: ${b.budget ?? "moderate"}.
Extra notes: ${b.notes ?? "(none)"}.
${b.tasteSummary ? `\nUSER TASTE PROFILE (use this to personalize every stop — match age/life-stage/energy/scenes/music/cities/budget; honor "avoid" strictly): ${b.tasteSummary}\n` : ""}

OCCASION PLAYBOOK — match every stop to who's actually going. Do NOT default to "restaurant + bar + restaurant" for every plan.

• Kids / Family day: jump/trampoline parks, indoor playgrounds, paint-your-own pottery, slime studios, kids' cooking class, aquarium, children's museum, zoo, splash pads, mini golf, go-karts, arcade + pizza combos, laser tag, drive-in. Always weave in FREE local programs when possible: Home Depot Kids Workshop (first Saturday), Lowe's Kids Workshop, Michaels kids events, library story time, farmers market, free museum days, town parades, fire-station open houses. Restaurants must be kid-friendly (booths, kid menus, fast service).

• Girls' night out: vibrant, flowery, photogenic, feminine-coded — rooftop brunch with floral installs, pink/aesthetic cafés, paint-and-sip, candle-making or flower-arranging workshop, sushi/saké, hibachi, karaoke, dance class, spa/sauna, comedy show, bottomless mimosa brunch, speakeasy, jazz lounge, drag brunch, vintage shopping crawl.

• Guys' night out: paintball, axe throwing, indoor shooting range, top-golf or driving range, real golf, bowling, billiards/pool hall, sports bar with multiple screens, wings + craft beer, BBQ joint, hibachi, cigar lounge, hiking, kayaking, escape room, go-karts, esports/arcade bar, late-night taco run.

• Date night: tune to the vibe — romantic (low-light, wine bar, jazz), adventurous (rooftop, unusual food, live music), chill (board game café, dessert + walk).

• Meet-the-parents / in-laws: classy and safe — quiet upscale restaurant, wine tasting, scenic drive, brunch at a country club, garden walk, light comedy, museum exhibit, afternoon tea.

• Mature married couple (40s-60s, settled): grown-up scenes — wine country day, chef's-table dinner, jazz/blues club, supper club, theater, gallery opening, distillery tour, neighborhood food walk, B&B getaway, clean comedy, historic-district stroll, cooking class for two, private boat charter. Avoid loud/college-coded venues unless the profile says otherwise.

• Elders / multigenerational: botanical gardens, art museums, historic walking tours, scenic train rides, classical concerts, matinees, garden-restaurant lunch, tea rooms, riverside parks. Keep walking distances short and venues accessible.

• Anniversary / romantic: prix-fixe tasting menu, sunset spot, couples spa, harbor cruise, jazz, hidden speakeasy.

Pick stop categories that fit (don't force "drinks" on a kids day, don't force "museum" on a guys' night). Match the energy and demographics in every venue, what_to_do, parking note, and tip.

${seedBlock}

Return a tight 3-6 stop plan that flows naturally — no backtracking, sensible drive/walk times between stops.
Each stop must include a category, a clear "what to do" or "what to order", and a likely booking provider when relevant (opentable, resy, eventbrite, ticketmaster, or "website").
Use realistic-sounding but generic venue names if exact names aren't known — never invent fake addresses; leave address as a neighborhood / cross-streets hint.
For booking_url, provide a SEARCH URL (e.g. https://www.opentable.com/s?term=...&covers=2 or https://www.google.com/maps/search/...) so the user can confirm the real spot.

For each stop also produce:
- 2-3 short reviewSnippets — one sentence each, what real visitors typically say (varied tone). These are AI-summarized, not real quotes.
- A parking object: type (lot|street|valet|garage|transit), cost ("$5-10/hr" or "free"), access (1 short sentence on how to access).
- 2-3 tips: insider advice like best time to arrive, what to skip, dress code, kid-friendly notes.

TRAVEL PLANNING — for EVERY stop AFTER the first one, include a travelFromPrev object describing how to get from the previous stop to this one:
- mode: pick the BEST mode for this leg given user preference "${b.transportMode ?? "auto"}". If "auto", choose realistically: walk (<0.5mi), transit (dense urban + good transit city), car (suburban / multi-stop with gear), rideshare (drinking involved, no parking, late night).
- durationMinutes: realistic travel time (account for traffic / typical wait).
- distance: e.g. "0.4 mi" or "3.2 mi".
- instructions: 1 short sentence ("Hop on the Red Line northbound 4 stops" / "Quick 8-min drive up Lamar" / "Grab a Lyft — surge unlikely at this hour").
- estCost: e.g. "free", "$2.50 fare", "$12-18 Uber". Use null for walking.
The first stop has no travelFromPrev. Make the schedule realistic — startTime of stop N+1 must be roughly stop N's startTime + durationMinutes + travel time.`;

    const tool = {
      type: "function",
      function: {
        name: "return_itinerary",
        description: "Return a full-day itinerary",
        parameters: {
          type: "object",
          properties: {
            title: { type: "string", description: "Catchy 4-8 word title" },
            summary: { type: "string", description: "1-2 sentence summary of the day's vibe" },
            estTotalCost: { type: "string", description: "e.g. '$80-140 / couple'" },
            stops: {
              type: "array",
              minItems: 3,
              maxItems: 6,
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  category: { type: "string", enum: ["meal", "activity", "drinks", "scenic", "travel", "other"] },
                  description: { type: "string", description: "1-2 sentence description" },
                  address: { type: "string", description: "Neighborhood or cross-streets hint" },
                  startTime: { type: "string", description: "HH:MM 24h" },
                  durationMinutes: { type: "integer" },
                  estCost: { type: "string", description: "e.g. '$$' or '$30-50'" },
                  whatToDo: { type: "string", description: "Specific recommendation: what to order, what to see, etc." },
                  bookingUrl: { type: "string", description: "Search URL the user can use to find/book this stop" },
                  bookingProvider: { type: "string", description: "opentable | resy | eventbrite | ticketmaster | google-maps | website" },
                  reviewSnippets: {
                    type: "array",
                    minItems: 2, maxItems: 3,
                    items: { type: "string", description: "1 sentence, what visitors typically say" },
                  },
                  parking: {
                    type: "object",
                    properties: {
                      type: { type: "string", enum: ["lot", "street", "valet", "garage", "transit"] },
                      cost: { type: "string" },
                      access: { type: "string", description: "1 short sentence on how to access it" },
                    },
                    required: ["type", "cost", "access"],
                  },
                  tips: {
                    type: "array", minItems: 2, maxItems: 3,
                    items: { type: "string" },
                  },
                },
                required: ["name", "category", "description", "address", "startTime", "durationMinutes", "estCost", "whatToDo", "bookingUrl", "bookingProvider", "reviewSnippets", "parking", "tips"],
              },
            },
          },
          required: ["title", "summary", "estTotalCost", "stops"],
        },
      },
    };

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "system", content: sys }, { role: "user", content: "Build the itinerary now." }],
        tools: [tool],
        tool_choice: { type: "function", function: { name: "return_itinerary" } },
      }),
    });

    if (resp.status === 429) return json({ error: "Rate limit — try again in a moment." }, 429);
    if (resp.status === 402) return json({ error: "AI credits exhausted. Add credits in workspace usage." }, 402);
    if (!resp.ok) return json({ error: `AI error ${resp.status}: ${await resp.text()}` }, 500);

    const data = await resp.json();
    const call = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!call) return json({ error: "No tool call returned" }, 500);
    const args = JSON.parse(call.function.arguments);
    return json({ itinerary: args });
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
}
