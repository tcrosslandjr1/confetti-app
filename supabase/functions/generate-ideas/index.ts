// Lovable AI Gateway — generate outing ideas for an occasion
const corsHeaders = {
  "Access-Control-Allow-Origin": (Deno.env.get("ALLOWED_ORIGIN") ?? "https://confettiplan.lovable.app"),
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type Body = {
  occasion: string;
  vibe?: string;
  format: "quick" | "bundle" | "full";
  count?: number;
  city?: string;
  excludeTitles?: string[];
  tasteSummary?: string;
};

const FORMAT_PROMPT: Record<Body["format"], string> = {
  quick: "Each idea is ONE single venue, activity, or moment. Short, punchy. No multi-stop plans.",
  bundle:
    "Each idea is a themed evening BUNDLE: dinner + a main activity + a nightcap. Give a brief 3-step timeline.",
  full: "Each idea is a FULL plan: vibe summary, 2-3 venue/activity suggestions bundled, est. cost, time of day, what to wear, conversation starters.",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = (await req.json()) as Body;
    const {
      occasion,
      vibe,
      format,
      count = 6,
      city = "your city",
      excludeTitles = [],
      tasteSummary,
    } = body;
    if (!occasion || !format) return json({ error: "occasion and format required" }, 400);

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) return json({ error: "missing LOVABLE_API_KEY" }, 500);

    const tasteBlock = tasteSummary
      ? `\nUSER TASTE PROFILE (use this to personalize every idea — match age/life-stage/energy/scenes/music/cities/budget; honor "avoid" strictly): ${tasteSummary}\n`
      : "";

    const sys = `You are a creative outing-planner for an app called Confetti.
Generate ${count} fresh, specific, evocative outing IDEAS for: "${occasion}"${vibe ? ` (vibe: ${vibe})` : ""} in ${city}.
${FORMAT_PROMPT[format]}
Avoid these titles already shown: ${excludeTitles.slice(0, 20).join(" | ") || "(none)"}.
${tasteBlock}

OCCASION PLAYBOOK — match the suggestions to who's going. Think outside the box; do not default to "dinner + drinks" for everything.

• Kids / Family day: jump/trampoline parks, indoor playgrounds, bounce houses, paint-your-own pottery, slime studios, kids' cooking class, aquarium, children's museum, zoo, splash pad, mini golf, go-karts, arcade + pizza combos, laser tag, drive-in movies. Always include FREE local options too: Home Depot Kids Workshop (first Saturday), Lowe's Kids Workshop, Michaels kids events, library story time, farmers market, free museum days, town parades, local fire-station open houses, splash pads at parks. Mention "check the local town/parks-and-rec calendar" when relevant.

• Girls' night out: vibrant, flowery, photogenic, feminine-coded scenery — rooftop brunch with floral installs, pink/aesthetic cafés, paint-and-sip, candle-making, flower-arranging workshop, sushi + saké, hibachi, karaoke, dance class (heels/Beyoncé), spa day, infrared sauna, comedy show, brunch + bottomless mimosas, cute speakeasy, bookstore café crawl, vintage shopping, jazz lounge, drag brunch.

• Guys' night out: paintball, axe throwing, indoor shooting range, top-golf / driving range, real golf, bowling, billiards/pool hall, sports bar with multiple screens, wings + craft beer, BBQ joint, hibachi, cigar lounge, hiking, kayaking, escape room, go-karts, esports/arcade bar, late-night taco run, boxing/MMA gym class.

• Date night: depends on vibe — romantic (low-light, wine bar, jazz), adventurous (rooftop, unusual food, live music), chill (board game café, dessert + walk).

• Meet-the-parents / in-laws: classy and safe — quiet upscale restaurants, wine tasting, scenic drives, brunch at a country club, garden walks, light comedy, museum exhibits, afternoon tea.

• Mature married couple (40s-60s, settled): grown-up scenes — wine country day trips, chef's-table dinners, jazz/blues clubs, supper clubs, Broadway/regional theater, art-gallery openings, distillery tours, neighborhood walking food tours, weekend B&B getaways, comedy clubs (clean), historic-district strolls, cooking class for two, private boat charter. Skip loud/college-coded venues unless the profile says otherwise.

• Elders / multigenerational: botanical gardens, art museums (especially special exhibits), historic walking tours, scenic train rides, classical concerts, matinees, garden-restaurant lunch, tea rooms, riverside parks, low-walking outings, comfortable accessible venues.

• Anniversary / romantic: prix-fixe tasting menus, sunset spots, couples spa, hot air balloon, harbor cruise, jazz, hidden speakeasy.

For ALL ideas: be specific (name the venue type and what to do/order), match the energy and demographics, include at least one budget-friendly or free option per batch, vary times of day, and skip clichés. No emojis in titles.`;

    const tool = {
      type: "function",
      function: {
        name: "return_ideas",
        description: "Return a list of outing ideas",
        parameters: {
          type: "object",
          properties: {
            ideas: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string", description: "5-9 word evocative title" },
                  hook: { type: "string", description: "One-sentence hook, max 140 chars" },
                  description: { type: "string", description: "2-3 sentence description" },
                  vibeTags: {
                    type: "array",
                    items: { type: "string" },
                    description: "3-5 short vibe tags",
                  },
                  estCost: {
                    type: "string",
                    description: "e.g. '$', '$$', '$$$' or '$40-80 / couple'",
                  },
                  timeOfDay: {
                    type: "string",
                    enum: ["Morning", "Afternoon", "Evening", "Late night", "All day"],
                  },
                  duration: { type: "string", description: "e.g. '2 hours', 'Half day'" },
                  steps: {
                    type: "array",
                    description: "For bundle/full: ordered timeline steps. Empty for quick.",
                    items: {
                      type: "object",
                      properties: {
                        label: { type: "string" },
                        detail: { type: "string" },
                      },
                      required: ["label", "detail"],
                    },
                  },
                  whatToWear: {
                    type: "string",
                    description: "For full plan only; otherwise empty string",
                  },
                  conversationStarter: {
                    type: "string",
                    description: "For full plan only; otherwise empty string",
                  },
                  imagePrompt: {
                    type: "string",
                    description: "Short evocative prompt for a hero image",
                  },
                },
                required: [
                  "title",
                  "hook",
                  "description",
                  "vibeTags",
                  "estCost",
                  "timeOfDay",
                  "duration",
                  "steps",
                  "whatToWear",
                  "conversationStarter",
                  "imagePrompt",
                ],
              },
            },
          },
          required: ["ideas"],
        },
      },
    };

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: sys },
          { role: "user", content: `Generate ${count} ideas now.` },
        ],
        tools: [tool],
        tool_choice: { type: "function", function: { name: "return_ideas" } },
      }),
    });

    if (resp.status === 429) return json({ error: "Rate limit — try again in a moment." }, 429);
    if (resp.status === 402)
      return json({ error: "AI credits exhausted. Add credits in workspace usage." }, 402);
    if (!resp.ok) return json({ error: `AI error ${resp.status}: ${await resp.text()}` }, 500);

    const data = await resp.json();
    const call = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!call) return json({ error: "No tool call returned" }, 500);
    const args = JSON.parse(call.function.arguments);
    return json({ ideas: args.ideas ?? [] });
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
