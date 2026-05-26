/**
 * Social Signal Collector — scrapes TikTok, Instagram, and X for
 * trending venue mentions by city and classifies them into signal types.
 *
 * Signal types:
 *   - trending  — high post velocity in last 7 days, viral engagement spikes
 *   - popular   — consistent high mentions over 30+ days, established favorites
 *   - new       — venue first appeared in social data within last 30 days
 *   - lowkey    — low post count but high sentiment, "hidden gem" language
 *   - unique    — niche category, unusual cuisine/experience, "you won't believe"
 *
 * Feeds enriched context into the AI Content Engine's prompt builders so the
 * Recommendation Agent reasons over real social momentum — not just general knowledge.
 *
 * Runs server-side only. Uses OpenRouter for classification and
 * supabaseAdmin for persistence.
 */

import { generateText } from "ai";
import { getAiProvider } from "../ai-gateway.server";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { CITIES, type CityContext } from "./city-context";

// ─── Types ────────────────────────────────────────────────────

export type SignalType = "trending" | "popular" | "new" | "lowkey" | "unique";
export type SocialPlatform = "tiktok" | "instagram" | "x";

export interface SocialSignal {
  venue_name: string;
  venue_slug: string;
  signal_type: SignalType;
  platform: SocialPlatform;
  post_count: number;
  engagement_score: number;
  sentiment: "positive" | "neutral" | "mixed";
  hashtags: string[];
  snippet: string;
  neighborhood?: string;
  category?: string;
  first_seen?: string;
}

export interface SocialContext {
  city_slug: string;
  city_label: string;
  trending: SocialSignal[];
  popular: SocialSignal[];
  new_spots: SocialSignal[];
  lowkey: SocialSignal[];
  unique: SocialSignal[];
  collected_at: string;
}

export interface CollectionResult {
  batchId: string;
  citiesProcessed: string[];
  signalsCollected: number;
  durationMs: number;
  status: "completed" | "failed";
  error?: string;
}

// ─── City Hashtag Map ────────────────────────────────────────

/**
 * Per-city hashtag seeds for social discovery.
 * The AI uses these as starting points to find venue mentions.
 */
const CITY_HASHTAGS: Record<string, string[]> = {
  dc: [
    "dcfoodie", "dceats", "washingtondc", "dcnightlife", "dcrooftops",
    "dchiddenGem", "dcbrunch", "wharfdc", "dccocktails", "dcbars",
    "shawdc", "ustreetdc", "dcrestaurants", "dcdining", "dcdatenight",
  ],
  vegas: [
    "vegasfoodie", "lasvegaseats", "vegasnightlife", "vegasstrip",
    "vegasrooftop", "vegashiddengem", "vegasclubs", "fremontstreet",
    "vegasrestaurants", "vegasdining", "vegasnewspot", "vegascocktails",
  ],
  miami: [
    "miamifoodie", "miamieats", "miaminightlife", "southbeach",
    "wynwood", "brickell", "miamirooftop", "miamihiddengem",
    "littlehavana", "miamidining", "miamibrunch", "miaminewspot",
  ],
  nyc: [
    "nycfoodie", "nyceats", "nycnightlife", "nycrooftops",
    "nychiddengem", "nycspeakeasy", "williamsburg", "lesnyc",
    "nycbrunch", "nyccocktails", "nycdatenight", "nycnewrestaurant",
  ],
  seattle: [
    "seattlefoodie", "seattleeats", "seattlenightlife", "capitolhill",
    "seattlerooftop", "seattlehiddengem", "pikeplace", "ballard",
    "seattledining", "seattlebrunch", "seattlenewspot", "pnwfoodie",
  ],
  chi: [
    "chicagofoodie", "chicagoeats", "chicagonightlife", "wickerpark",
    "chicagorooftop", "chicagohiddengem", "rivernorthchi", "westloop",
    "chicagodining", "chicagobrunch", "chicagonewspot", "chicagobars",
  ],
  la: [
    "lafoodie", "laeats", "lanightlife", "weho", "dtla",
    "larooftop", "lahiddengem", "silverlake", "venice",
    "ladining", "labrunch", "lanewspot", "losangelesfood",
  ],
  sf: [
    "sffoodie", "sfeats", "sfnightlife", "missiondistrict",
    "sfrooftop", "sfhiddengem", "northbeachsf", "hayesvalley",
    "sfdining", "sfbrunch", "sfnewspot", "bayareafoodie",
  ],
  hou: [
    "houstonfoodie", "houstoneats", "houstonnightlife", "montrose",
    "houstonrooftop", "houstonhiddengem", "midtownhou", "eadohouston",
    "houstondining", "houstonbrunch", "houstonnewspot", "houstonbbq",
  ],
  atl: [
    "atlantafoodie", "atlantaeats", "atlantanightlife", "buckhead",
    "atlantarooftop", "atlantahiddengem", "beltlineatl", "edgewood",
    "atlantadining", "atlantabrunch", "atlantanewspot", "atlantabars",
  ],
  nash: [
    "nashvillefoodie", "nashvilleeats", "nashvillenightlife", "broadway",
    "nashvillerooftop", "nashvillehiddengem", "thegulch", "12south",
    "nashvilledining", "nashvillebrunch", "nashvillenewspot", "nashvillebars",
  ],
  mem: [
    "memphisfoodie", "memphiseats", "memphisnightlife", "bealestreet",
    "memphishiddengem", "memphisbbq", "cooperyoung", "memphisblues",
    "memphisdining", "memphisbrunch", "memphisnewspot", "memphissoul",
  ],
  knox: [
    "knoxvillefoodie", "knoxvilleeats", "knoxvillenightlife", "marketsquare",
    "oldcityknox", "knoxvillebrunch", "knoxvillenewspot", "knoxvillebars",
  ],
  chatt: [
    "chattanoogafoodie", "chattanoogaeats", "northshorechatt",
    "chattanoogabrunch", "chattanooganewspot", "chattanoogadining",
  ],
  gat: [
    "gatlinburgfood", "gatlinburgeats", "smokymountainsdining",
    "gatlinburgmoonshine", "gatlinburgnewspot", "pigeonforge",
  ],
  phx: [
    "phoenixfoodie", "scottsdalefoodie", "phoenixeats", "scottsdaleeats",
    "oldtownscottsdale", "phoenixnightlife", "scottsdalenightlife",
    "phoenixrooftop", "phoenixhiddengem", "phoenixnewspot", "scottsdalebars",
  ],
};

// ─── AI Prompt for Social Signal Classification ─────────────

function buildSocialDiscoveryPrompt(
  city: CityContext,
  hashtags: string[],
): string {
  return `You are the Confetti Social Intelligence Engine. Your job is to identify
venues that are generating social media buzz in ${city.label}.

CITY CONTEXT:
NEIGHBORHOODS: ${city.neighborhoods.map((n) => `${n.name} (${n.vibe})`).join("; ")}
ALLOWED ACTIVITIES: ${city.allowedActivities.join(", ")}
ENVIRONMENT: ${city.environmentFeatures.join(", ")}

SOCIAL HASHTAGS TO ANALYZE: ${hashtags.map((h) => `#${h}`).join(", ")}

Your task: Based on your knowledge of ${city.label}'s current dining, nightlife,
and experience scene, identify venues that would realistically be generating
social media buzz RIGHT NOW. Think about:

1. TRENDING (3-4 venues): Places with viral momentum — recently went viral on
   TikTok/Instagram, celebrity visit, challenge, or dramatic food/drink presentation.
   These are the "everyone's posting about it" spots.

2. POPULAR (3-4 venues): Established crowd favorites with consistent social presence.
   Always busy, always being tagged. The reliable hits.

3. NEW (2-3 venues): Recently opened (last 1-3 months) or newly renovated spots
   generating "just opened" or "first look" content. Early buzz.

4. LOWKEY (2-3 venues): Hidden gems with small but passionate followings.
   Low post volume but high sentiment. "Don't tell everyone" energy.
   Speakeasies, basement bars, chef's counter spots.

5. UNIQUE (2-3 venues): Truly unusual or one-of-a-kind experiences.
   Niche cuisine, immersive dining, unexpected format. "You won't believe this exists" content.

For EACH venue, provide:
- venue_name: realistic venue name for ${city.label}
- venue_slug: kebab-case
- signal_type: "trending" | "popular" | "new" | "lowkey" | "unique"
- platform: primary platform ("tiktok" | "instagram" | "x") — which platform drives most buzz
- post_count: estimated recent post volume (realistic numbers)
- engagement_score: 0-100 relative engagement strength
- sentiment: "positive" | "neutral" | "mixed"
- hashtags: 2-4 hashtags associated with this venue
- snippet: a 1-sentence description of WHY this venue is buzzing (like a social caption)
- neighborhood: which neighborhood in ${city.label}
- category: "Dining" | "Nightlife" | "Rooftops" | "Live Music" | "Cocktails" | "Experiences" | "Brunch" | "Late Night"

Return ONLY a JSON array. NO markdown. NO explanation.`;
}

// ─── AI Call (reuses same pattern as idea-generator) ──────────

async function callAI(prompt: string): Promise<string> {
  const provider = getAiProvider();
  const { text } = await generateText({
    model: provider("gpt-4o-mini"),
    prompt,
    temperature: 0.9, // slightly higher creativity for social discovery
    maxTokens: 4000,
  });

  return text;
}

function parseJsonArray<T>(raw: string): T[] {
  let cleaned = raw.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
  }
  try {
    const parsed = JSON.parse(cleaned);
    if (!Array.isArray(parsed)) throw new Error("Expected JSON array");
    return parsed;
  } catch (e) {
    console.error("[social-signal] JSON parse failed:", cleaned.slice(0, 200));
    throw new Error(`Failed to parse social signal response: ${e}`);
  }
}

// ─── Core Collector ─────────────────────────────────────────

/**
 * Collect social signals for a single city.
 * Uses AI to identify venue buzz based on city context and hashtag seeds.
 */
export async function collectSignalsForCity(
  citySlug: string,
  batchId?: string,
): Promise<SocialSignal[]> {
  const city = CITIES.find((c) => c.slug === citySlug);
  if (!city) throw new Error(`Unknown city: ${citySlug}`);

  const hashtags = CITY_HASHTAGS[citySlug] ?? [];
  if (!hashtags.length) {
    console.warn(`[social-signal] No hashtags configured for ${citySlug}, using generic`);
  }

  const prompt = buildSocialDiscoveryPrompt(
    city,
    hashtags.length ? hashtags : [`${city.city.toLowerCase().replace(/\s+/g, "")}foodie`],
  );

  const raw = await callAI(prompt);
  const signals = parseJsonArray<SocialSignal>(raw);

  // Persist to Supabase — upsert on (city_slug, venue_slug, platform)
  const rows = signals.map((s) => ({
    city_slug: citySlug,
    venue_name: s.venue_name,
    venue_slug: s.venue_slug,
    signal_type: s.signal_type,
    platform: s.platform,
    post_count: s.post_count,
    engagement_score: s.engagement_score,
    sentiment: s.sentiment,
    hashtags: s.hashtags,
    snippet: s.snippet,
    neighborhood: s.neighborhood ?? null,
    category: s.category ?? null,
    first_seen: s.first_seen ?? new Date().toISOString(),
    generation_batch: batchId ?? null,
    is_active: true,
    collected_at: new Date().toISOString(),
  }));

  if (rows.length) {
    const { error } = await supabaseAdmin
      .from("social_venue_signals")
      .upsert(rows, { onConflict: "city_slug,venue_slug,platform" });
    if (error) console.error("[social-signal] Upsert error:", error.message);
  }

  return signals;
}

// ─── Social Context Builder (feeds into AI prompts) ─────────

/**
 * Load social signals for a city and structure them as prompt context.
 * This is what gets injected into buildIdeaPrompt / buildVenuePrompt.
 */
export async function loadSocialContext(
  citySlug: string,
): Promise<SocialContext | null> {
  const city = CITIES.find((c) => c.slug === citySlug);
  if (!city) return null;

  const { data, error } = await supabaseAdmin
    .from("social_venue_signals")
    .select("*")
    .eq("city_slug", citySlug)
    .eq("is_active", true)
    .order("engagement_score", { ascending: false })
    .limit(50);

  if (error || !data?.length) return null;

  const byType = (type: SignalType) =>
    data
      .filter((d) => d.signal_type === type)
      .map((d) => ({
        venue_name: d.venue_name,
        venue_slug: d.venue_slug,
        signal_type: d.signal_type as SignalType,
        platform: d.platform as SocialPlatform,
        post_count: d.post_count,
        engagement_score: d.engagement_score,
        sentiment: d.sentiment as "positive" | "neutral" | "mixed",
        hashtags: d.hashtags ?? [],
        snippet: d.snippet,
        neighborhood: d.neighborhood ?? undefined,
        category: d.category ?? undefined,
        first_seen: d.first_seen ?? undefined,
      }));

  return {
    city_slug: citySlug,
    city_label: city.label,
    trending: byType("trending"),
    popular: byType("popular"),
    new_spots: byType("new"),
    lowkey: byType("lowkey"),
    unique: byType("unique"),
    collected_at: data[0]?.collected_at ?? new Date().toISOString(),
  };
}

/**
 * Format social context as a prompt block for injection into AI prompts.
 */
export function formatSocialContextBlock(ctx: SocialContext): string {
  const formatList = (label: string, signals: SocialSignal[]) => {
    if (!signals.length) return "";
    const items = signals
      .slice(0, 4)
      .map(
        (s) =>
          `  - ${s.venue_name} (${s.neighborhood ?? "unknown"}) — ${s.snippet} [${s.platform}, ${s.post_count} posts, engagement: ${s.engagement_score}/100]`,
      )
      .join("\n");
    return `${label}:\n${items}`;
  };

  const blocks = [
    formatList("TRENDING NOW (viral momentum, everyone's posting)", ctx.trending),
    formatList("POPULAR STAPLES (consistent crowd favorites)", ctx.popular),
    formatList("JUST OPENED (new spots generating first-look buzz)", ctx.new_spots),
    formatList("HIDDEN GEMS (low-key spots with passionate fans)", ctx.lowkey),
    formatList("UNIQUE FINDS (one-of-a-kind, unexpected experiences)", ctx.unique),
  ].filter(Boolean);

  if (!blocks.length) return "";

  return `
SOCIAL MEDIA INTELLIGENCE for ${ctx.city_label} (collected ${ctx.collected_at}):
${blocks.join("\n\n")}

INSTRUCTIONS FOR USING SOCIAL DATA:
- Weave trending spots into FOMO-driven occasions (birthday, girls night, bachelor party)
- Recommend hidden gems for intimate occasions (anniversary, first date, date night)
- Flag "just opened" spots with a discovery angle for adventurous users
- Lead with the novelty for unique spots — what makes them different
- Cross-reference social buzz with user taste profile when available
- Always mention WHY a spot is buzzing (the social proof angle)
`;
}

// ─── Daily Batch Collection ──────────────────────────────────

/**
 * Run a full social signal collection across all (or specified) cities.
 * Designed to run on the same daily schedule as the AI Content Engine batch.
 */
export async function runSocialSignalBatch(
  options: {
    citySlugs?: string[];
  } = {},
): Promise<CollectionResult> {
  const start = Date.now();
  const batchId = `social-${new Date().toISOString().slice(0, 10)}`;

  const targetCities = options.citySlugs
    ? CITIES.filter((c) => options.citySlugs!.includes(c.slug))
    : CITIES;

  let totalSignals = 0;

  try {
    for (const city of targetCities) {
      try {
        const signals = await collectSignalsForCity(city.slug, batchId);
        totalSignals += signals.length;
        console.log(
          `[social-signal] ${city.label}: ${signals.length} signals collected`,
        );
      } catch (err) {
        console.error(
          `[social-signal] Collection failed for ${city.slug}:`,
          err,
        );
      }
    }

    return {
      batchId,
      citiesProcessed: targetCities.map((c) => c.slug),
      signalsCollected: totalSignals,
      durationMs: Date.now() - start,
      status: "completed",
    };
  } catch (err) {
    return {
      batchId,
      citiesProcessed: targetCities.map((c) => c.slug),
      signalsCollected: totalSignals,
      durationMs: Date.now() - start,
      status: "failed",
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

// ─── On-Demand Collection ───────────────────────────────────

/**
 * Collect fresh social signals for a specific city on-demand.
 * Returns the structured social context ready for prompt injection.
 */
export async function collectOnDemand(
  citySlug: string,
): Promise<SocialContext | null> {
  const batchId = `social-ondemand-${Date.now()}`;

  try {
    await collectSignalsForCity(citySlug, batchId);
  } catch (err) {
    console.warn("[social-signal] On-demand collection failed, using cached:", err);
  }

  return loadSocialContext(citySlug);
}
