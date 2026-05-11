import "@tanstack/react-start";
import { createFileRoute } from "@tanstack/react-router";
import { streamText, type ModelMessage } from "ai";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";

type Prefs = {
  cuisines?: string[] | null;
  activities?: string[] | null;
  budget_min?: number | null;
  budget_max?: number | null;
  taste_profile?: {
    diet?: string | null;
    allergens?: string[] | null;
    vibe?: string[] | null;
    drink?: string | null;
    dress?: string | null;
  } | null;
  about_me?: string | null;
} | null;

type RecentBooking = {
  venue_name?: string | null;
  starts_at?: string | null;
  party_size?: number | null;
};

type ChatBody = {
  messages: { role: "user" | "assistant" | "system"; content: string }[];
  preferences?: Prefs;
  recentBookings?: RecentBooking[] | null;
  mood?: string | null;
  now?: string | null; // ISO from client; used so the model knows local time
};

const SYSTEM_PROMPT = `You are the AI Lifestyle Concierge — a warm, witty insider for dining, nightlife, and curated experiences across the DMV (DC, MD, VA).

VOICE
- Talk like a confident friend, not a search engine. Casual, specific, fun. Light humor; no corporate fluff.
- Match the user's mood, budget, dietary needs, and tastes. Reference their context when you have it.
- Always close with a clear next step ("Want me to lock in 7:30?", "I can build the full night.").

ANSWER SHAPE
- Lead with one tight sentence framing the pick.
- Then 2–4 venues. For each venue, OUTPUT A CARD using the fenced block below — do NOT bullet venue details in plain text.
- After cards, add a brief "Pro tip" line (reservation timing, what to order, where to sit).

VENUE CARD FORMAT (REQUIRED for every venue you recommend)
Use a fenced code block with the language tag \`venue\` containing minified JSON:
\`\`\`venue
{"name":"Maydan","neighborhood":"14th St","cuisine":"Live-fire Middle Eastern","price":"$$$","vibe":"Smoky, romantic, loud","why":"Hearth-cooked everything; the lamb shoulder is the move.","book":"Resy, 2-3 wk out","best_for":["date","group"]}
\`\`\`
Keep keys exactly: name, neighborhood, cuisine, price ($/$$/$$$/$$$$), vibe, why (≤140 chars), book, best_for (array).
Omit a key only if you genuinely don't know — never fabricate hours or addresses.

RULES
- Stay inside the DMV. If a user asks elsewhere, gently redirect.
- Honor allergens & diet hard. If a user is vegan/celiac/kosher and a spot can't accommodate, do NOT recommend it.
- Respect budget when stated. Don't push $$$$ when they said cheap.
- Never invent reservation links, phone numbers, or specific available time slots. Speak in general terms ("usually books up 1–2 weeks out on Resy").
- If you don't know, say so and offer to dig deeper.

NEIGHBORHOODS TO KNOW
DC: 14th St, U Street, Shaw, Logan Circle, Dupont, Adams Morgan, Georgetown, H Street, Capitol Hill, NoMa, Navy Yard, Union Market, Mt Vernon Triangle, Penn Quarter, The Wharf.
MD: Bethesda, Silver Spring, National Harbor, Rockville.
VA: Arlington (Clarendon, Rosslyn), Old Town Alexandria, Tysons, Mosaic District.`;

function partOfDay(d: Date) {
  const h = d.getHours();
  if (h < 5) return "late night";
  if (h < 11) return "morning";
  if (h < 14) return "lunch";
  if (h < 17) return "afternoon";
  if (h < 21) return "dinner / early night";
  return "late night";
}

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }: { request: Request }) => {
        const body = (await request.json()) as ChatBody;
        const key = process.env.LOVABLE_API_KEY;
        if (!key) return new Response("Missing LOVABLE_API_KEY", { status: 500 });

        const ctx: string[] = [];
        const now = body.now ? new Date(body.now) : new Date();
        ctx.push(
          `Right now: ${now.toLocaleString("en-US", { weekday: "long", month: "short", day: "numeric", hour: "numeric", minute: "2-digit", timeZone: "America/New_York" })} ET (${partOfDay(now)})`,
        );

        const p = body.preferences;
        if (p) {
          if (p.cuisines?.length) ctx.push(`Loves cuisines: ${p.cuisines.join(", ")}`);
          if (p.activities?.length) ctx.push(`Into: ${p.activities.join(", ")}`);
          if (p.budget_max) ctx.push(`Budget per person: $${p.budget_min ?? 0}–$${p.budget_max}`);
          const t = p.taste_profile;
          if (t?.diet) ctx.push(`Diet: ${t.diet} (HARD CONSTRAINT)`);
          if (t?.allergens?.length) ctx.push(`Allergens to avoid: ${t.allergens.join(", ")} (HARD CONSTRAINT)`);
          if (t?.vibe?.length) ctx.push(`Preferred vibes: ${t.vibe.join(", ")}`);
          if (t?.drink) ctx.push(`Drink preference: ${t.drink}`);
          if (t?.dress) ctx.push(`Typical dress: ${t.dress}`);
          if (p.about_me) ctx.push(`About them: ${p.about_me.slice(0, 240)}`);
        }
        if (body.mood) ctx.push(`Current mood: ${body.mood}`);

        const recent = (body.recentBookings ?? []).filter((b) => b.venue_name).slice(0, 8);
        if (recent.length) {
          const venues = Array.from(new Set(recent.map((r) => r.venue_name))).slice(0, 6).join(", ");
          ctx.push(`Recently booked venues (avoid recommending these unless asked): ${venues}`);
        }

        const system = ctx.length ? `${SYSTEM_PROMPT}\n\nUSER CONTEXT\n- ${ctx.join("\n- ")}` : SYSTEM_PROMPT;

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
