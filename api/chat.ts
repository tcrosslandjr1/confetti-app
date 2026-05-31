/**
 * Confetti /api/chat — Vercel Edge Function
 * Handles AI concierge streaming chat. Self-contained to avoid @/ alias issues.
 */
import { createAnthropic } from "@ai-sdk/anthropic";
import { streamText, type ModelMessage } from "ai";
import { createClient } from "@supabase/supabase-js";
import { findCityLoose, type CityContext } from "../src/lib/agents/city-context";

export const config = { runtime: "edge" };

// ─── CORS ───────────────────────────────────────────────────────
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

// ─── Supabase clients ────────────────────────────────────────────
const SUPABASE_URL = process.env.SUPABASE_URL ?? "https://zfeckvxkulreyapadanf.supabase.co";
const SUPABASE_ANON_KEY =
  process.env.SUPABASE_PUBLISHABLE_KEY ??
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpmZWNrdnhrdWxyZXlhcGFkYW5mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg0NzU1MDgsImV4cCI6MjA5NDA1MTUwOH0.KPYif0ntCEVwqOIUWX8r3ZYGI2xGmYIU3oKgnI8aYM0";

// Admin client is optional — only used for trending context queries.
// If SUPABASE_SERVICE_ROLE_KEY is not set, trending data is simply skipped.
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
const supabaseAdmin = SERVICE_ROLE_KEY
  ? createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
  : null;

// ─── Types ───────────────────────────────────────────────────────
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
  now?: string | null;
  city?: { slug?: string | null; name?: string | null; region?: string | null } | null;
};

// ─── Taste context (inlined to avoid @/ alias in edge runtime) ───

interface TasteScores {
  cuisine_scores: Record<string, number>;
  vibe_scores: Record<string, number>;
  price_preference: string | number;
  time_patterns: Record<string, number>;
  neighborhood_scores: Record<string, number>;
  occasion_scores: Record<string, number>;
  adventure_score: number;
  social_score: number;
  event_count: number;
}

interface ExplicitPrefs {
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
    loves?: string[] | null;
    avoid?: string[] | null;
  } | null;
  about_me?: string | null;
}

interface UserTasteContext {
  topCuisines: string[];
  topVibes: string[];
  priceLevel: number;
  adventureScore: number;
  socialScore: number;
  activeTimeSlots: string[];
  topNeighborhoods: string[];
  diet: string | null;
  allergens: string[];
  loves: string[];
  avoids: string[];
  profileStrength: "cold" | "warming" | "strong";
  budgetMin: number | null;
  budgetMax: number | null;
  aboutMe: string | null;
}

function topN(scores: Record<string, number>, n: number): string[] {
  return Object.entries(scores)
    .filter(([, v]) => v > 0.1)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([k]) => k);
}

function priceBucket(score: string | number): number {
  if (typeof score === "string") {
    const len = score.replace(/[^$]/g, "").length;
    return len >= 1 && len <= 4 ? len : 2;
  }
  if (score <= 1.5) return 1;
  if (score <= 2.5) return 2;
  if (score <= 3.5) return 3;
  return 4;
}

function profileStrength(eventCount: number): "cold" | "warming" | "strong" {
  if (eventCount < 10) return "cold";
  if (eventCount < 50) return "warming";
  return "strong";
}

async function loadUserTasteContext(userId: string): Promise<UserTasteContext | null> {
  if (!supabaseAdmin) return null;
  const [profileRes, prefsRes] = await Promise.all([
    supabaseAdmin.from("taste_profiles").select("*").eq("user_id", userId).maybeSingle(),
    supabaseAdmin.from("user_preferences").select("*").eq("user_id", userId).maybeSingle(),
  ]);

  const profile = profileRes.data as TasteScores | null;
  const prefs = prefsRes.data as ExplicitPrefs | null;

  if (!profile && !prefs) {
    return {
      topCuisines: [],
      topVibes: [],
      priceLevel: 2,
      adventureScore: 0.5,
      socialScore: 0.5,
      activeTimeSlots: [],
      topNeighborhoods: [],
      diet: null,
      allergens: [],
      loves: [],
      avoids: [],
      profileStrength: "cold",
      budgetMin: null,
      budgetMax: null,
      aboutMe: null,
    };
  }

  const taste = prefs?.taste_profile;

  return {
    topCuisines: profile ? topN(profile.cuisine_scores ?? {}, 5) : (prefs?.cuisines ?? []),
    topVibes: profile ? topN(profile.vibe_scores ?? {}, 4) : (taste?.vibe ?? []),
    priceLevel: profile
      ? priceBucket(profile.price_preference ?? 2)
      : prefs?.budget_max
        ? prefs.budget_max > 100
          ? 3
          : 2
        : 2,
    adventureScore: profile?.adventure_score ?? 0.5,
    socialScore: profile?.social_score ?? 0.5,
    activeTimeSlots: profile ? topN(profile.time_patterns ?? {}, 3) : [],
    topNeighborhoods: profile ? topN(profile.neighborhood_scores ?? {}, 4) : [],
    diet: taste?.diet ?? null,
    allergens: taste?.allergens ?? [],
    loves: [...(taste?.loves ?? []), ...(prefs?.cuisines ?? []), ...(prefs?.activities ?? [])],
    avoids: taste?.avoid ?? [],
    profileStrength: profileStrength(profile?.event_count ?? 0),
    budgetMin: prefs?.budget_min ?? null,
    budgetMax: prefs?.budget_max ?? null,
    aboutMe: prefs?.about_me ?? null,
  };
}

function buildTastePromptBlock(ctx: UserTasteContext): string {
  const lines: string[] = [];

  if (ctx.diet) lines.push(`Diet: ${ctx.diet} (HARD CONSTRAINT — never violate)`);
  if (ctx.allergens.length)
    lines.push(`Allergens: ${ctx.allergens.join(", ")} (HARD CONSTRAINT — life-threatening)`);

  if (ctx.profileStrength === "cold") {
    if (ctx.loves.length) lines.push(`Stated interests: ${ctx.loves.join(", ")}`);
    if (ctx.budgetMax) lines.push(`Budget: $${ctx.budgetMin ?? 0}–$${ctx.budgetMax} per person`);
    if (ctx.aboutMe) lines.push(`About them: ${ctx.aboutMe.slice(0, 200)}`);
    lines.push(`(New user — still learning their taste. Ask clarifying questions.)`);
    return lines.join("\n");
  }

  if (ctx.topCuisines.length) lines.push(`Gravitates toward: ${ctx.topCuisines.join(", ")}`);
  if (ctx.topVibes.length) lines.push(`Preferred vibes: ${ctx.topVibes.join(", ")}`);
  if (ctx.topNeighborhoods.length)
    lines.push(`Favorite neighborhoods: ${ctx.topNeighborhoods.join(", ")}`);

  const priceLabel = ["", "budget-friendly", "mid-range", "upscale", "luxury"][ctx.priceLevel];
  lines.push(`Price comfort: ${priceLabel}`);

  if (ctx.adventureScore > 0.7) lines.push(`Loves trying new things — surprise them!`);
  else if (ctx.adventureScore < 0.3) lines.push(`Prefers familiar favorites over experiments.`);

  if (ctx.socialScore > 0.7) lines.push(`Social butterfly — think groups, energy, buzz.`);
  else if (ctx.socialScore < 0.3) lines.push(`Prefers intimate, quiet, low-key settings.`);

  if (ctx.activeTimeSlots.length) lines.push(`Most active: ${ctx.activeTimeSlots.join(", ")}`);

  if (ctx.loves.length) lines.push(`Explicitly loves: ${ctx.loves.slice(0, 8).join(", ")}`);
  if (ctx.avoids.length) lines.push(`Avoids: ${ctx.avoids.join(", ")}`);

  if (ctx.budgetMax) lines.push(`Budget: $${ctx.budgetMin ?? 0}–$${ctx.budgetMax} per person`);
  if (ctx.aboutMe) lines.push(`About them: ${ctx.aboutMe.slice(0, 200)}`);

  if (ctx.profileStrength === "strong")
    lines.push(`(Strong profile — 50+ interactions. Trust these signals heavily.)`);

  return lines.join("\n");
}

// ─── System prompt ───────────────────────────────────────────────

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

// ─── Handler ─────────────────────────────────────────────────────

export default async function handler(req: Request): Promise<Response> {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS });
  }

  // Only allow POST
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  }

  // Auth: extract Bearer token
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Unauthorized: Bearer token required" }), {
      status: 401,
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  }
  const token = authHeader.replace("Bearer ", "").trim();
  if (!token) {
    return new Response(JSON.stringify({ error: "Unauthorized: No token provided" }), {
      status: 401,
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  }

  // Validate token via Supabase anon client
  const supabaseAnon = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const {
    data: { user },
    error: authError,
  } = await supabaseAnon.auth.getUser(token);

  if (authError || !user) {
    return new Response(JSON.stringify({ error: "Unauthorized: Invalid token" }), {
      status: 401,
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  }

  // Parse body
  let body: ChatBody;
  try {
    body = (await req.json()) as ChatBody;
  } catch {
    return new Response(JSON.stringify({ error: "Bad request: invalid JSON" }), {
      status: 400,
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  }

  // Load taste context server-side
  const tasteCtx = await loadUserTasteContext(user.id).catch(() => null);

  // Build context block
  const ctx: string[] = [];
  const now = body.now ? new Date(body.now) : new Date();
  ctx.push(
    `Right now: ${now.toLocaleString("en-US", {
      weekday: "long",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      timeZone: "America/New_York",
    })} ET (${partOfDay(now)})`,
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

  // Live intelligence: trending + most-booked + most-saved
  // Only runs when SUPABASE_SERVICE_ROLE_KEY is configured.
  try {
    if (!supabaseAdmin) throw new Error("no admin client");
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
    if (topBooked.length) ctx.push(`MOST-BOOKED on Confetti (last 30d): ${topBooked.join(" • ")}`);

    const saveCounts = new Map<string, { count: number; cat?: string; hood?: string | null }>();
    for (const s of (savedRes.data ?? []) as Array<{
      venues?: { name?: string; category?: string; neighborhood?: string | null } | null;
    }>) {
      const v = s.venues;
      if (!v?.name) continue;
      const cur = saveCounts.get(v.name) ?? { count: 0, cat: v.category, hood: v.neighborhood };
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

  // Inject taste intelligence
  if (tasteCtx) {
    const tasteBlock = buildTastePromptBlock(tasteCtx);
    if (tasteBlock) ctx.push(`TASTE PROFILE\n${tasteBlock}`);
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

  // Create Anthropic provider using the key already configured in Vercel.
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  if (!anthropicKey) {
    return new Response(
      JSON.stringify({ error: "Server misconfiguration: ANTHROPIC_API_KEY not set" }),
      { status: 500, headers: { ...CORS, "Content-Type": "application/json" } },
    );
  }

  const anthropic = createAnthropic({ apiKey: anthropicKey });

  const result = streamText({
    // claude-3-5-haiku: fast, smart, cost-effective for conversational recommendations
    model: anthropic("claude-3-5-haiku-20241022"),
    system,
    messages: modelMessages,
    // AI SDK v5+/v6 renamed `maxTokens` → `maxOutputTokens`. The old name is
    // silently ignored, so it must be the new name to take effect.
    maxOutputTokens: 2048,
    // Surface model/provider errors in Vercel logs instead of swallowing them.
    onError: ({ error }) => {
      console.error("[chat] streamText error:", error);
    },
  });

  // Pump the text stream manually so a mid-stream model error becomes a
  // VISIBLE message to the user (the default toTextStreamResponse() returns a
  // 200 with an empty body when the model errors — which renders as a blank
  // chat bubble). This matches the raw-text reader in new.chat.tsx.
  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let emittedAny = false;
      try {
        for await (const chunk of result.textStream) {
          if (chunk) emittedAny = true;
          controller.enqueue(encoder.encode(chunk));
        }
        if (!emittedAny) {
          controller.enqueue(
            encoder.encode("Hmm, I couldn't pull that together just now — mind trying again?"),
          );
        }
      } catch (err) {
        console.error("[chat] stream pump error:", err);
        controller.enqueue(
          encoder.encode("\n\n⚠️ I hit a snag building that. Give it another shot in a moment."),
        );
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: { ...CORS, "Content-Type": "text/plain; charset=utf-8" },
  });
}
