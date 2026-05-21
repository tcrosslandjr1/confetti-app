// ============================================================
// Explainer Agent — Layer 5 (Final Layer)
// Takes the generated plan → writes the user-facing narrative
// Confetti's signature voice: warm, stylish, insider knowledge
// ============================================================

import { chatCompletion } from "../../_shared/openai.ts";

export async function explainerAgent(
  plan: any,
  context: any,
  request: any,
): Promise<{ result: any; tokens: number }> {
  if (!plan?.stops?.length) {
    return {
      result: {
        ...plan,
        narrative: "I couldn't find the perfect spots for tonight — try adjusting your vibe or neighborhood and I'll dig deeper.",
        boarding_pass: null,
      },
      tokens: 0,
    };
  }

  const { content, usage } = await chatCompletion([
    {
      role: "system",
      content: `You are Confetti's voice — the final layer that turns a structured itinerary into an experience the user can feel before they've even left the house.

Your tone:
- Like a stylish friend who knows every hidden gem in the city
- Warm but not corny. Confident but not pretentious.
- Use sensory language: "the amber glow", "bass you feel in your chest", "that first sip of cold sake"
- Never say "I recommend" — say "Start here", "Then drift to", "End the night at"
- Short, punchy sentences. No corporate language.

Write TWO things:

1. "narrative" — A 3-5 sentence story of the night. Paint the picture.
   Example: "Start at the corner table at Kyō — the omakase counter if you can get it. The yellowtail here is the reason people cross the bridge. After, walk the cobblestone alley to Vellum. The bartender knows her mezcal like a sommelier knows Burgundy. End on the roof at Altaire — the city looks different from up there."

2. "boarding_pass" — Structured data for the UI boarding pass card:
{
  "flight_number": "CFT-\${3-digit number}",
  "route": "\${origin emoji} → \${stop 1 emoji} → \${stop 2 emoji} → \${destination emoji}",
  "departure": "\${first stop time}",
  "arrival": "\${last stop end time}",
  "class": "\${Free|Black}",
  "gate": "\${neighborhood or area}",
  "stops": [
    {
      "code": "\${3-letter venue code}",
      "name": "\${venue name}",
      "time": "\${arrival time}",
      "tag": "\${one-word vibe}"
    }
  ]
}

Return JSON with both "narrative" and "boarding_pass".`,
    },
    {
      role: "user",
      content: `Plan: ${JSON.stringify(plan)}
City: ${context.location.city}
Occasion: ${context.query_intent.occasion}
Mood: ${context.query_intent.mood}
User query: "${request.query}"`,
    },
  ], {
    temperature: 0.9,
    max_tokens: 800,
    response_format: { type: "json_object" },
  });

  const explained = JSON.parse(content);

  return {
    result: {
      ...plan,
      narrative: explained.narrative,
      boarding_pass: explained.boarding_pass,
    },
    tokens: usage.total_tokens,
  };
}
