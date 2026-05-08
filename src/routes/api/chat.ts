import "@tanstack/react-start";
import { createFileRoute } from "@tanstack/react-router";
import { streamText, type ModelMessage } from "ai";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";

type ChatBody = {
  messages: { role: "user" | "assistant" | "system"; content: string }[];
  preferences?: {
    cuisines?: string[];
    activities?: string[];
    budget_min?: number;
    budget_max?: number;
  } | null;
  mood?: string | null;
};

const SYSTEM_PROMPT = `You are the AI Lifestyle Concierge — a warm, witty insider who knows every great spot for dining, nightlife, and curated experiences across the DMV (Washington DC, Maryland, Virginia).

Your style:
- Talk like a knowledgeable friend, not a search engine. Casual, confident, fun.
- Always give 2–4 specific, real-feeling venue picks with neighborhood, vibe, and a one-line "why this spot."
- Match the user's mood, budget, and tastes. Reference their preferences when you have them.
- Suggest concrete next steps: a reservation tip, what to order, when to arrive.
- Keep replies tight and scannable. Use short paragraphs or bullets. No corporate fluff.

Geography: DC neighborhoods (14th St, U Street, Georgetown, H Street, Adams Morgan, Shaw, Capitol Hill, NoMa, Navy Yard, Dupont), MD (Bethesda, Silver Spring, National Harbor), VA (Arlington, Old Town Alexandria, Tysons).`;

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }: { request: Request }) => {
        const body = (await request.json()) as ChatBody;
        const key = process.env.LOVABLE_API_KEY;
        if (!key) return new Response("Missing LOVABLE_API_KEY", { status: 500 });

        const ctx: string[] = [];
        if (body.preferences) {
          const p = body.preferences;
          if (p.cuisines?.length) ctx.push(`Favorite cuisines: ${p.cuisines.join(", ")}`);
          if (p.activities?.length) ctx.push(`Loves: ${p.activities.join(", ")}`);
          if (p.budget_max) ctx.push(`Budget per person: $${p.budget_min ?? 0}–$${p.budget_max}`);
        }
        if (body.mood) ctx.push(`Current mood: ${body.mood}`);
        const system = ctx.length ? `${SYSTEM_PROMPT}\n\nUser context:\n- ${ctx.join("\n- ")}` : SYSTEM_PROMPT;

        const modelMessages: ModelMessage[] = body.messages.map((m) => ({
          role: m.role,
          content: m.content,
        })) as ModelMessage[];

        const gateway = createLovableAiGatewayProvider(key);
        const result = streamText({
          model: gateway("google/gemini-3-flash-preview"),
          system,
          messages: modelMessages,
        });

        return result.toTextStreamResponse();
      },
    },
  },
});
