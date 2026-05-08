// Lovable AI Gateway — generate outing ideas for an occasion
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
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
};

const FORMAT_PROMPT: Record<Body["format"], string> = {
  quick: "Each idea is ONE single venue, activity, or moment. Short, punchy. No multi-stop plans.",
  bundle: "Each idea is a themed evening BUNDLE: dinner + a main activity + a nightcap. Give a brief 3-step timeline.",
  full: "Each idea is a FULL plan: vibe summary, 2-3 venue/activity suggestions bundled, est. cost, time of day, what to wear, conversation starters.",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = (await req.json()) as Body;
    const { occasion, vibe, format, count = 6, city = "your city", excludeTitles = [] } = body;
    if (!occasion || !format) return json({ error: "occasion and format required" }, 400);

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) return json({ error: "missing LOVABLE_API_KEY" }, 500);

    const sys = `You are a creative outing-planner for an app called Confetti.
Generate ${count} fresh, specific, evocative outing IDEAS for: "${occasion}"${vibe ? ` (vibe: ${vibe})` : ""} in ${city}.
${FORMAT_PROMPT[format]}
Avoid these titles already shown: ${excludeTitles.slice(0, 20).join(" | ") || "(none)"}.
Be inclusive, tasteful, and varied (mix budgets and energy levels). No clichés. No emojis in titles.`;

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
                  vibeTags: { type: "array", items: { type: "string" }, description: "3-5 short vibe tags" },
                  estCost: { type: "string", description: "e.g. '$', '$$', '$$$' or '$40-80 / couple'" },
                  timeOfDay: { type: "string", enum: ["Morning", "Afternoon", "Evening", "Late night", "All day"] },
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
                  whatToWear: { type: "string", description: "For full plan only; otherwise empty string" },
                  conversationStarter: { type: "string", description: "For full plan only; otherwise empty string" },
                  imagePrompt: { type: "string", description: "Short evocative prompt for a hero image" },
                },
                required: ["title", "hook", "description", "vibeTags", "estCost", "timeOfDay", "duration", "steps", "whatToWear", "conversationStarter", "imagePrompt"],
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
        messages: [{ role: "system", content: sys }, { role: "user", content: `Generate ${count} ideas now.` }],
        tools: [tool],
        tool_choice: { type: "function", function: { name: "return_ideas" } },
      }),
    });

    if (resp.status === 429) return json({ error: "Rate limit — try again in a moment." }, 429);
    if (resp.status === 402) return json({ error: "AI credits exhausted. Add credits in workspace usage." }, 402);
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
