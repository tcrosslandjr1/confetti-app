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
  region?: string;           // e.g. "DC · MD · VA" — disambiguates city name
  lat?: number | null;       // selected city coords for Places location bias
  lng?: number | null;
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

// ---------- Google Places verification ----------
// LLMs hallucinate venue names. We re-check every named stop against Google Places
// and only keep ones that exist AND are OPERATIONAL. Closed / not-found stops fall
// back to a category search around the user's selected city so we never falsely
// advertise a venue that isn't there.
const PLACES_FIELDS =
  "places.id,places.displayName,places.formattedAddress,places.shortFormattedAddress,places.location,places.rating,places.userRatingCount,places.priceLevel,places.businessStatus,places.googleMapsUri,places.websiteUri,places.types";

const CATEGORY_QUERY: Record<string, string> = {
  meal: "popular restaurant",
  drinks: "cocktail bar",
  activity: "fun activity",
  scenic: "scenic spot",
  travel: "landmark",
  other: "popular spot",
};

type PlaceHit = {
  id: string;
  displayName?: { text?: string };
  formattedAddress?: string;
  shortFormattedAddress?: string;
  location?: { latitude?: number; longitude?: number };
  rating?: number;
  userRatingCount?: number;
  businessStatus?: string;
  googleMapsUri?: string;
  websiteUri?: string;
};

async function placesSearch(
  textQuery: string,
  key: string,
  bias?: { lat: number; lng: number },
): Promise<PlaceHit[]> {
  try {
    const body: Record<string, unknown> = { textQuery, pageSize: 5 };
    if (bias) {
      body.locationBias = {
        circle: {
          center: { latitude: bias.lat, longitude: bias.lng },
          radius: 30000,
        },
      };
    }
    const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": key,
        "X-Goog-FieldMask": PLACES_FIELDS,
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      console.warn("[build-itinerary] places error", res.status);
      return [];
    }
    const data = await res.json();
    return (data.places ?? []) as PlaceHit[];
  } catch (e) {
    console.warn("[build-itinerary] places fetch failed", (e as Error).message);
    return [];
  }
}

function operational(hits: PlaceHit[]): PlaceHit[] {
  return hits.filter((h) => !h.businessStatus || h.businessStatus === "OPERATIONAL");
}

function nameSimilar(a: string, b: string): boolean {
  const norm = (s: string) =>
    s.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9 ]+/g, "").trim();
  const A = norm(a);
  const B = norm(b);
  if (!A || !B) return false;
  if (A === B || A.includes(B) || B.includes(A)) return true;
  const at = new Set(A.split(/\s+/).filter((w) => w.length > 2));
  const bt = new Set(B.split(/\s+/).filter((w) => w.length > 2));
  let overlap = 0;
  at.forEach((w) => bt.has(w) && overlap++);
  return overlap >= Math.max(1, Math.min(at.size, bt.size) - 1);
}

async function verifyStop(
  stop: Record<string, unknown>,
  cityLabel: string,
  bias: { lat: number; lng: number } | undefined,
  used: Set<string>,
  key: string,
): Promise<{ stop: Record<string, unknown>; verified: boolean }> {
  const name = String(stop.name ?? "").trim();
  const category = String(stop.category ?? "other");
  const cityForQuery = cityLabel || "";

  // 1) Try exact name lookup first
  if (name) {
    const direct = operational(
      await placesSearch(cityForQuery ? `${name} ${cityForQuery}` : name, key, bias),
    );
    const match = direct.find((h) => nameSimilar(h.displayName?.text ?? "", name) && !used.has(h.id));
    if (match) {
      used.add(match.id);
      return { stop: applyHit(stop, match), verified: true };
    }
  }

  // 2) Fallback: search by category in the chosen city
  const fallbackQ = `${CATEGORY_QUERY[category] ?? "popular spot"} ${cityForQuery}`.trim();
  const fb = operational(await placesSearch(fallbackQ, key, bias)).filter((h) => !used.has(h.id));
  // Prefer best-rated with enough reviews
  fb.sort((a, b) => {
    const ar = (a.rating ?? 0) * Math.log10((a.userRatingCount ?? 0) + 10);
    const br = (b.rating ?? 0) * Math.log10((b.userRatingCount ?? 0) + 10);
    return br - ar;
  });
  const pick = fb[0];
  if (pick) {
    used.add(pick.id);
    return { stop: applyHit(stop, pick), verified: true };
  }
  return { stop, verified: false };
}

function applyHit(stop: Record<string, unknown>, hit: PlaceHit): Record<string, unknown> {
  const realName = hit.displayName?.text ?? String(stop.name ?? "");
  const realAddr = hit.formattedAddress ?? hit.shortFormattedAddress ?? String(stop.address ?? "");
  const mapsUri =
    hit.googleMapsUri ??
    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${realName} ${realAddr}`)}`;
  return {
    ...stop,
    name: realName,
    address: realAddr,
    bookingUrl: hit.websiteUri ?? mapsUri,
    bookingProvider: hit.websiteUri ? "website" : "google-maps",
    placeId: hit.id,
    rating: hit.rating ?? null,
    userRatingCount: hit.userRatingCount ?? null,
    lat: hit.location?.latitude ?? null,
    lng: hit.location?.longitude ?? null,
    mapsUri,
    verified: true,
  };
}

async function verifyItinerary(
  itinerary: { stops?: Array<Record<string, unknown>> },
  body: Body,
  key: string,
) {
  const stops = itinerary.stops ?? [];
  const cityLabel = [body.city, body.region].filter(Boolean).join(", ");
  const bias =
    typeof body.lat === "number" && typeof body.lng === "number"
      ? { lat: body.lat, lng: body.lng }
      : undefined;
  const used = new Set<string>();
  const out: Array<Record<string, unknown>> = [];
  for (const s of stops) {
    const { stop, verified } = await verifyStop(s, cityLabel, bias, used, key);
    if (verified) out.push(stop);
    // Drop unverifiable stops entirely — never falsely advertise a venue.
  }
  return { ...itinerary, stops: out };
}

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
- 2-3 tips: insider advice like best time to arrive, what to skip, kid-friendly notes.
- dressCode: 3-10 word note on what to wear at THIS stop. Be specific to the venue/activity (e.g. "Smart casual — no athleticwear", "Closed-toe shoes required", "Swimwear + cover-up", "Cocktail attire", "Layers — patio gets cool", "Comfy walking shoes", "Kid-friendly play clothes that can get messy"). NEVER omit — pick a sensible default if unsure.

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
                  dressCode: {
                    type: "string",
                    description: "3-10 word note on what to wear at this stop, specific to the venue/activity.",
                  },
                  travelFromPrev: {
                    type: "object",
                    description: "How to get here from the previous stop. Omit/null on the first stop.",
                    properties: {
                      mode: { type: "string", enum: ["walk", "car", "transit", "lyft", "uber", "rideshare", "bike"] },
                      durationMinutes: { type: "integer" },
                      distance: { type: "string" },
                      instructions: { type: "string" },
                      estCost: { type: "string" },
                    },
                    required: ["mode", "durationMinutes", "instructions"],
                  },
                },
                required: ["name", "category", "description", "address", "startTime", "durationMinutes", "estCost", "whatToDo", "bookingUrl", "bookingProvider", "reviewSnippets", "parking", "tips", "dressCode"],
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
