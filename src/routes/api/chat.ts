import "@tanstack/react-start";
import { createFileRoute } from "@tanstack/react-router";
import { streamText, type ModelMessage } from "ai";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { findCityLoose, type CityContext } from "@/lib/agents/city-context";

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
  city?: { slug?: string | null; name?: string | null; region?: string | null } | null;
};

function buildSystemPrompt(opts: {
  cityLabel: string;
  cityRegion?: string | null;
  ctx?: CityContext | null;
}): string {
  const { cityLabel, cityRegion, ctx } = opts;
  const market = cityRegion ? `${cityLabel} (${cityRegion})` : cityLabel;
  const neighborhoodsLine = ctx?.neighborhoods?.length
    ? ctx.neighborhoods.map((n) => `${n.name} — ${n.vibe}`).join("; ")
    : `Use well-known neighborhoods of ${cityLabel}.`;
  const signature = ctx?.signatureExperiences?.length
    ? `Signature ${cityLabel} experiences to draw from when relevant: ${ctx.signatureExperiences.join(", ")}.`
    : "";
  const allowed = ctx?.allowedActivities?.length
    ? `Bias toward these on-brand activities: ${ctx.allowedActivities.join(", ")}.`
    : "";
  const avoid = ctx?.avoid?.length
    ? `Do NOT recommend (off-brand for this city): ${ctx.avoid.join(", ")}.`
    : "";

  return `You are the Confetti Concierge — a warm, witty insider for the full spectrum of fun across ${market}: restaurants, nightlife, immersive experiences, casinos, date nights, day-dates, group adventures, and one-of-a-kind things to do.

VOICE
- Talk like a confident friend, not a search engine. Casual, specific, fun. Light humor; no corporate fluff.
- Match the user's mood, budget, dietary needs, and tastes. Reference their context when you have it.
- Always close with a clear next step ("Want me to lock in 7:30?", "I can build the full night.").

WHAT YOU RECOMMEND (be expansive, not just restaurants)
- Dining: tasting menus, hidden gems, brunch, late-night, food halls, pop-ups
- Nightlife: cocktail dens, speakeasies, dance clubs, rooftops, live music, jazz, comedy
- Immersive & experiential: art rooms, escape rooms, axe throwing, themed bars, VR arcades, candle/pottery/painting studios
- Casinos & gaming where they exist locally — slots, tables, poker rooms, attached restaurants and shows
- Date night: candlelit dinners, walking tours, sunset cruises, planetarium shows, jazz + dessert combos, couples spa
- Group fun: bowling lounges, karaoke rooms, sports bars, trivia nights, brewery crawls, golf simulators
- Daytime adventures: kayaking, hiking, museum hops, farmers markets, vineyard day-trips
- Seasonal: rooftop pools, ice rinks, holiday markets, waterfront fireworks
- Live & ticketed: concerts, theater, sports, festivals
${signature ? `\n${signature}` : ""}${allowed ? `\n${allowed}` : ""}${avoid ? `\n${avoid}` : ""}

INTELLIGENCE
- When the user is vague ("something fun tonight", "surprise me"), bias toward what's TRENDING and POPULAR right now — use the LIVE TRENDING and POPULAR THIS MONTH context blocks below if provided. Call it out naturally ("everyone's been booking…", "blowing up on TikTok this week…").
- Mix categories on open-ended asks: don't return 4 restaurants when they said "fun night" — give a dinner + an after activity, or a late-night bite.
- Be specific. Name the dish, the cocktail, the table to ask for, the floor with the best vibe.

ANSWER SHAPE
- Lead with one tight sentence framing the pick.
- Then 2–4 venues. For each venue, OUTPUT A CARD using the fenced block below — do NOT bullet venue details in plain text.
- After cards, add a brief "Pro tip" line (reservation timing, what to order, where to sit, how to skip the line).

VENUE CARD FORMAT (REQUIRED for every venue you recommend)
Use a fenced code block with the language tag \`venue\` containing minified JSON:
\`\`\`venue
{"name":"Maydan","neighborhood":"14th St","cuisine":"Live-fire Middle Eastern","price":"$$$","vibe":"Smoky, romantic, loud","why":"Hearth-cooked everything; the lamb shoulder is the move.","book":"Resy, 2-3 wk out","best_for":["date","group"]}
\`\`\`
Keys: name, neighborhood, cuisine (or category — use "Casino", "Immersive", "Live Music", "Activity", etc. when not food), price ($/$$/$$$/$$$$), vibe, why (≤140 chars), book, best_for (array). Omit a key only if you genuinely don't know — never fabricate hours or addresses.

RULES
- Stay inside ${market}. If a user asks elsewhere, gently redirect.
- Honor allergens & diet hard. If a user is vegan/celiac/kosher and a spot can't accommodate, do NOT recommend it.
- Respect budget when stated. Don't push $$$$ when they said cheap.
- Never invent reservation links, phone numbers, or specific available time slots. Speak in general terms ("usually books up 1–2 weeks out on Resy").
- If you don't know, say so and offer to dig deeper.

NEIGHBORHOODS TO KNOW IN ${cityLabel.toUpperCase()}
${neighborhoodsLine}`;
}

function partOfDay(d: Date) {
  const h = d.getHours();
  if (h < 5) return "late night";
  if (h < 11) return "morning";
  if (h < 14) return "lunch";
  if (h < 17) return "afternoon";
  if (h < 21) return "dinner / early night";
  return "late night";
}

import { getAuthedUserId, unauthorizedResponse } from "@/lib/require-auth.server";

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }: { request: Request }) => {
        const userId = await getAuthedUserId(request);
        if (!userId) return unauthorizedResponse();
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
          if (t?.allergens?.length)
            ctx.push(`Allergens to avoid: ${t.allergens.join(", ")} (HARD CONSTRAINT)`);
          if (t?.vibe?.length) ctx.push(`Preferred vibes: ${t.vibe.join(", ")}`);
          if (t?.drink) ctx.push(`Drink preference: ${t.drink}`);
          if (t?.dress) ctx.push(`Typical dress: ${t.dress}`);
          if (p.about_me) ctx.push(`About them: ${p.about_me.slice(0, 240)}`);
        }
        if (body.mood) ctx.push(`Current mood: ${body.mood}`);

        const recent = (body.recentBookings ?? []).filter((b) => b.venue_name).slice(0, 8);
        if (recent.length) {
          const venues = Array.from(new Set(recent.map((r) => r.venue_name)))
            .slice(0, 6)
            .join(", ");
          ctx.push(`Recently booked venues (avoid recommending these unless asked): ${venues}`);
        }

        // Live intelligence: pull trending + most-booked + most-saved venues so the model
        // can ground recommendations in real signal instead of static memory.
        try {
          const [viralRes, bookingRes, savedRes] = await Promise.all([
            supabaseAdmin
              .from("viral_venues")
              .select("venue_name,neighborhood,tags,trend_score")
              .order("trend_score", { ascending: false, nullsFirst: false })
              .limit(8),
            supabaseAdmin
              .from("bookings")
              .select("venue_name")
              .gte("created_at", new Date(Date.now() - 30 * 86400000).toISOString())
              .limit(500),
            supabaseAdmin
              .from("saved_venues")
              .select("venue_id, venues(name,category,neighborhood)")
              .order("created_at", { ascending: false })
              .limit(200),
          ]);

          const viral = (viralRes.data ?? [])
            .map((v) => {
              const tags =
                Array.isArray(v.tags) && v.tags.length ? ` [${v.tags.slice(0, 3).join(", ")}]` : "";
              const hood = v.neighborhood ? ` (${v.neighborhood})` : "";
              return `${v.venue_name}${hood}${tags}`;
            })
            .slice(0, 8);
          if (viral.length) ctx.push(`LIVE TRENDING right now: ${viral.join(" • ")}`);

          const bookCounts = new Map<string, number>();
          for (const b of bookingRes.data ?? []) {
            if (!b.venue_name) continue;
            bookCounts.set(b.venue_name, (bookCounts.get(b.venue_name) ?? 0) + 1);
          }
          const topBooked = [...bookCounts.entries()]
            .sort((a, b) => b[1] - a[1])
            .slice(0, 8)
            .map(([n, c]) => `${n} (${c})`);
          if (topBooked.length)
            ctx.push(`MOST-BOOKED on Confetti (last 30d): ${topBooked.join(" • ")}`);

          const saveCounts = new Map<
            string,
            { count: number; cat?: string; hood?: string | null }
          >();
          for (const s of (savedRes.data ?? []) as Array<{
            venues?: { name?: string; category?: string; neighborhood?: string | null } | null;
          }>) {
            const v = s.venues;
            if (!v?.name) continue;
            const cur = saveCounts.get(v.name) ?? {
              count: 0,
              cat: v.category,
              hood: v.neighborhood,
            };
            cur.count += 1;
            saveCounts.set(v.name, cur);
          }
          const topSaved = [...saveCounts.entries()]
            .sort((a, b) => b[1].count - a[1].count)
            .slice(0, 8)
            .map(([n, v]) => `${n}${v.cat ? ` — ${v.cat}` : ""}`);
          if (topSaved.length) ctx.push(`MOST-SAVED by users: ${topSaved.join(" • ")}`);
        } catch (err) {
          console.warn("[chat] trending context fetch failed", err);
        }

        const cityCtx = findCityLoose(body.city?.slug, body.city?.name);
        const cityLabel = cityCtx?.label ?? body.city?.name ?? "your city";
        const cityRegion = body.city?.region ?? null;
        const SYSTEM_PROMPT = buildSystemPrompt({ cityLabel, cityRegion, ctx: cityCtx });

        const system = ctx.length
          ? `${SYSTEM_PROMPT}\n\nUSER CONTEXT\n- ${ctx.join("\n- ")}`
          : SYSTEM_PROMPT;

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
