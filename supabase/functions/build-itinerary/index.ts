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

${seedBlock}

Return a tight 3-6 stop plan that flows naturally — no backtracking, sensible drive/walk times between stops.
Each stop must include a category, a clear "what to do" or "what to order", and a likely booking provider when relevant (opentable, resy, eventbrite, ticketmaster, or "website").
Use realistic-sounding but generic venue names if exact names aren't known — never invent fake addresses; leave address as a neighborhood / cross-streets hint.
For booking_url, provide a SEARCH URL (e.g. https://www.opentable.com/s?term=...&covers=2 or https://www.google.com/maps/search/...) so the user can confirm the real spot.`;

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
