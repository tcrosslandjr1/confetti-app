// Confetti AI — extract taste-profile signals from a user's pasted social content.
import { getCorsHeaders } from "../_shared/cors.ts";

// Reassigned per-request inside the handler so CORS echoes the caller's origin
// (works on both confettiplan.com and the vercel.app production domain).
let corsHeaders = getCorsHeaders();

type TasteProfile = {
  age_range?: string;
  life_stage?: string;
  energy?: "chill" | "balanced" | "high_energy";
  music_taste?: string[];
  scene_keywords?: string[];
  loves?: string[];
  avoid?: string[];
  cities?: string[];
};

type Body = {
  current?: TasteProfile;
  handles?: Record<string, string>;
  pasted: string; // bio + hashtags + favorite creators + recent post captions
};

Deno.serve(async (req) => {
  corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const b = (await req.json()) as Body;
    if (!b.pasted || b.pasted.trim().length < 5)
      return json({ error: "Need some pasted content" }, 400);

    const apiKey = Deno.env.get("OPENROUTER_API_KEY");
    if (!apiKey) return json({ error: "missing OPENROUTER_API_KEY" }, 500);

    const handlesBlock =
      Object.entries(b.handles ?? {})
        .filter(([, v]) => v)
        .map(([k, v]) => `${k}: @${v}`)
        .join("\n") || "(none)";

    const sys = `You are a taste analyst for Confetti, a day-planning app.
The user pasted social-media content (their bio, top hashtags, favorite creators, recent captions, etc.).
Your job: extract durable lifestyle signals into a JSON taste profile.

Their handles:
${handlesBlock}

Existing profile (merge — keep what's still true, add new, don't wipe valuable signal):
${JSON.stringify(b.current ?? {}, null, 2)}

Rules:
- Only output what's strongly implied. Do NOT invent.
- "loves" should be specific (e.g. "natural-wine bars", "indie bookstores", "matcha cafés"), not generic ("food").
- "avoid" goes there only if the content actively suggests dislike (e.g. "sober-curious" → avoid heavy drinking scenes).
- "scene_keywords" = aesthetic vibes (cottagecore, dark academia, soft girl, streetwear, outdoorsy, etc.).
- "music_taste" = genres/scenes (afrobeats, jazz, indie, EDM, K-pop, country).
- Cap each list at 8 items, keep entries 1-3 words.
- Return a short user-facing summary (1-2 sentences) of what you learned.`;

    const tool = {
      type: "function",
      function: {
        name: "return_signals",
        description: "Return updated taste profile + summary",
        parameters: {
          type: "object",
          properties: {
            profile: {
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
              },
            },
            summary: { type: "string" },
          },
          required: ["profile", "summary"],
        },
      },
    };

    const resp = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: sys },
          { role: "user", content: `Pasted content:\n\n${b.pasted.slice(0, 8000)}` },
        ],
        tools: [tool],
        tool_choice: { type: "function", function: { name: "return_signals" } },
      }),
    });

    if (resp.status === 429) return json({ error: "Rate limit — try again in a moment." }, 429);
    if (resp.status === 402) return json({ error: "AI credits exhausted." }, 402);
    if (!resp.ok) return json({ error: `AI error ${resp.status}: ${await resp.text()}` }, 500);

    const data = await resp.json();
    const call = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!call) return json({ error: "No analysis returned" }, 500);
    const args = JSON.parse(call.function.arguments);
    return json(args);
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
