// Confetti AI — taste-profile chat. Returns assistant reply + updated profile.
import { getCorsHeaders } from "../_shared/cors.ts";

// Reassigned per-request inside the handler so CORS echoes the caller's origin
// (works on both confettiplan.com and the vercel.app production domain).
let corsHeaders = getCorsHeaders();

type Msg = { role: "user" | "assistant"; content: string };
type Profile = {
  age_range?: string; // "20s" | "30s" | "40s" | "50s+" | freeform
  life_stage?: string; // single | dating | married | married_with_kids | empty_nest | retired | freeform
  energy?: string; // chill | balanced | high_energy
  music_taste?: string[]; // ["jazz","r&b","afrobeats","classical","country","hip hop","edm",...]
  scene_keywords?: string[]; // ["upscale","cozy","outdoorsy","intimate","loud","family-friendly","historic","trendy",...]
  loves?: string[]; // hobbies / activities they love
  avoid?: string[]; // things they don't like
  cities?: string[]; // home city + frequent travel cities
};

type Body = { messages: Msg[]; profile?: Profile };

Deno.serve(async (req) => {
  corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { messages, profile = {} } = (await req.json()) as Body;
    const apiKey = Deno.env.get("OPENROUTER_API_KEY");
    if (!apiKey) return json({ error: "missing OPENROUTER_API_KEY" }, 500);

    const sys = `You are Confetti's taste-discovery host. In a friendly, warm 4-7 turn chat,
learn enough about the user to plan outings they'd actually love.

Current profile: ${JSON.stringify(profile)}

Goals (in priority order):
1. Age range and life stage (single, dating, married, married with kids, empty nest, retired).
2. Typical energy: chill, balanced, or high energy.
3. Music / scene taste (jazz, r&b, afrobeats, country, classical, hip hop, edm, indie...).
4. Vibe keywords they gravitate to (upscale, cozy, outdoorsy, intimate, loud, family-friendly, historic, trendy...).
5. 2-3 things they love doing and 1-2 things to avoid.
6. Home city and any cities they visit often.

Rules:
- Ask ONE short question at a time. Reference what they just said.
- Never re-ask info already in profile.
- Be conversational, never form-like. Light humor okay.
- After roughly 5-7 useful exchanges, write a brief recap and tell them they can keep chatting any time to refine it.
- ALWAYS call the update_profile tool with the FULL merged profile after every user reply, even if you only learned one new thing. Preserve previous values; only overwrite when the user changes their mind.`;

    const tool = {
      type: "function",
      function: {
        name: "update_profile",
        description: "Persist the merged taste profile.",
        parameters: {
          type: "object",
          properties: {
            age_range: { type: "string" },
            life_stage: { type: "string" },
            energy: { type: "string", enum: ["chill", "balanced", "high_energy"] },
            music_taste: { type: "array", items: { type: "string" } },
            scene_keywords: { type: "array", items: { type: "string" } },
            loves: { type: "array", items: { type: "string" } },
            avoid: { type: "array", items: { type: "string" } },
            cities: { type: "array", items: { type: "string" } },
            assistant_message: {
              type: "string",
              description: "The next message to show the user.",
            },
          },
          required: ["assistant_message"],
        },
      },
    };

    const resp = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "system", content: sys }, ...messages],
        tools: [tool],
        tool_choice: { type: "function", function: { name: "update_profile" } },
      }),
    });

    if (resp.status === 429) return json({ error: "Rate limit — try again in a moment." }, 429);
    if (resp.status === 402) return json({ error: "AI credits exhausted." }, 402);
    if (!resp.ok) return json({ error: `AI error ${resp.status}: ${await resp.text()}` }, 500);

    const data = await resp.json();
    const call = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!call) return json({ error: "No tool call returned" }, 500);
    const args = JSON.parse(call.function.arguments) as Profile & { assistant_message: string };
    const { assistant_message, ...rest } = args;
    const merged: Profile = { ...profile, ...rest };
    return json({ message: assistant_message, profile: merged });
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
