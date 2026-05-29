// ============================================================
// social-trend-scraper — Bright Data-powered venue intelligence
//
// Pulls trending TikTok & Instagram venue content for a city
// using Bright Data's SERP API (no user OAuth required).
// Claude extracts venue signals → social_venue_signals table.
//
// POST { city_slug, city_name, category?, dry_run? }
//   - city_slug + city_name: single city, all bundled categories
//   - city_slug + city_name + category: single city, one category
//   - category only: all DMV cities, one category (batch mode)
// GET (cron mode — scrapes all active cities, bundled queries)
//
// Env vars required:
//   BRIGHTDATA_API_KEY       — from Bright Data Control Panel
//   BRIGHTDATA_SERP_ZONE     — your SERP zone name (e.g. "confetti_serp")
//   ANTHROPIC_API_KEY        — for Claude extraction (tool use)
// ============================================================

import { serve } from "../_shared/server.ts";
import {
  supabaseAdmin,
  corsHeaders,
  jsonResponse,
  errorResponse,
} from "../_shared/supabase-client.ts";

// ── Types ─────────────────────────────────────────────────────

interface ScrapeBody {
  city_slug?: string;   // e.g. "dc", "nyc"
  city_name?: string;   // e.g. "Washington DC"
  category?: string;    // e.g. "Jazz" — triggers per-category mode
  queries?: string[];   // override default queries
  dry_run?: boolean;    // extract but don't write to DB
}

interface SerpResult {
  title: string;
  link: string;
  description: string;
  rank: number;
}

interface ExtractedSignal {
  venue_name: string;
  venue_slug: string;
  signal_type: "trending" | "popular" | "new" | "lowkey" | "unique";
  platform: "tiktok" | "instagram" | "multi";
  engagement_score: number;
  sentiment: "positive" | "neutral" | "mixed" | "negative";
  hashtags: string[];
  snippet: string;
  neighborhood?: string;
  category?: string;
}

// ── Active cities for cron / batch mode ───────────────────────

const DMV_CITIES = [
  { city_slug: "dc",             city_name: "Washington DC" },
  { city_slug: "baltimore",      city_name: "Baltimore" },
  { city_slug: "arlington-va",   city_name: "Arlington Virginia" },
  { city_slug: "alexandria-va",  city_name: "Alexandria Virginia" },
  { city_slug: "richmond-va",    city_name: "Richmond Virginia" },
  { city_slug: "virginia-beach", city_name: "Virginia Beach" },
  { city_slug: "bethesda-md",    city_name: "Bethesda Maryland" },
  { city_slug: "annapolis-md",   city_name: "Annapolis Maryland" },
];

const CRON_CITIES = [
  ...DMV_CITIES,
  { city_slug: "nyc",     city_name: "New York City" },
  { city_slug: "miami",   city_name: "Miami" },
  { city_slug: "la",      city_name: "Los Angeles" },
  { city_slug: "chicago", city_name: "Chicago" },
  { city_slug: "atlanta", city_name: "Atlanta" },
];

// ── Per-category targeted queries ─────────────────────────────
// Each category gets 3 focused queries: TikTok, Instagram, general web.
// This keeps Claude's 25-venue cap fully allocated to ONE category.

const CATEGORY_QUERIES: Record<string, (cityName: string) => string[]> = {
  "Rooftops": (city) => [
    `site:tiktok.com "${city}" rooftop bar restaurant outdoor views 2025`,
    `site:instagram.com "${city}" rooftop bar skyline outdoor dining`,
    `"${city}" best rooftop bars restaurants terraces trending viral 2025`,
  ],
  "Brunch": (city) => [
    `site:tiktok.com "${city}" brunch bottomless mimosas must try 2025`,
    `site:instagram.com "${city}" brunch spot aesthetic food weekend`,
    `"${city}" best brunch spots going viral TikTok Instagram 2025`,
  ],
  "Nightlife": (city) => [
    `site:tiktok.com "${city}" club nightclub lounge night out 2025`,
    `site:instagram.com "${city}" nightclub lounge nightlife bar scene`,
    `"${city}" best nightclubs lounges nightlife trending 2025`,
  ],
  "Cocktails": (city) => [
    `site:tiktok.com "${city}" craft cocktails cocktail bar mixology drinks 2025`,
    `site:instagram.com "${city}" cocktail bar craft drinks mixology aesthetic`,
    `"${city}" best cocktail bars craft drinks trending viral 2025`,
  ],
  "Speakeasy": (city) => [
    `site:tiktok.com "${city}" speakeasy hidden bar secret entrance underground 2025`,
    `site:instagram.com "${city}" speakeasy hidden gem secret bar underground`,
    `"${city}" speakeasy hidden bar secret cocktail lounge going viral 2025`,
  ],
  "Live Music": (city) => [
    `site:tiktok.com "${city}" live music venue concert bar performance 2025`,
    `site:instagram.com "${city}" live music venue performance bar concert`,
    `"${city}" best live music venues bars trending 2025`,
  ],
  "Jazz": (city) => [
    `site:tiktok.com "${city}" jazz bar live jazz club lounge music 2025`,
    `site:instagram.com "${city}" jazz club bar live music lounge`,
    `"${city}" best jazz bars clubs live jazz trending 2025`,
  ],
  "Wine Bar": (city) => [
    `site:tiktok.com "${city}" wine bar natural wine tasting bottle 2025`,
    `site:instagram.com "${city}" wine bar natural wine aesthetic tasting`,
    `"${city}" best wine bars natural wine trending viral 2025`,
  ],
  "Café": (city) => [
    `site:tiktok.com "${city}" cafe coffee shop aesthetic cozy must visit 2025`,
    `site:instagram.com "${city}" cafe coffee aesthetic interior cozy`,
    `"${city}" best cafes coffee shops aesthetic trending 2025`,
  ],
  "Fine Dining": (city) => [
    `site:tiktok.com "${city}" fine dining tasting menu upscale restaurant special occasion 2025`,
    `site:instagram.com "${city}" fine dining upscale restaurant tasting menu chef`,
    `"${city}" best fine dining restaurants tasting menu viral 2025`,
  ],
  "Happy Hour": (city) => [
    `site:tiktok.com "${city}" happy hour deals drinks bar food specials 2025`,
    `site:instagram.com "${city}" happy hour deals drinks specials bar`,
    `"${city}" best happy hour bars restaurants deals trending 2025`,
  ],
  "Late Night": (city) => [
    `site:tiktok.com "${city}" late night food eats bar open late after hours 2025`,
    `site:instagram.com "${city}" late night food eats open late bar`,
    `"${city}" best late night spots food bars open late 2025`,
  ],
  "Dining": (city) => [
    `site:tiktok.com "${city}" restaurant must try new opening viral food 2025`,
    `site:instagram.com "${city}" restaurant food viral trending must try`,
    `"${city}" best restaurants trending viral new opening 2025`,
  ],
  "Experience": (city) => [
    `site:tiktok.com "${city}" unique experience activity date night immersive 2025`,
    `site:instagram.com "${city}" unique experience interactive immersive attraction`,
    `"${city}" unique experiences activities things to do viral 2025`,
  ],
  "Pop-Up": (city) => [
    `site:tiktok.com "${city}" pop up event food market experience limited 2025`,
    `site:instagram.com "${city}" pop up event market food experience`,
    `"${city}" pop up events food market experience trending 2025`,
  ],
  "Seafood": (city) => [
    `site:tiktok.com "${city}" seafood restaurant oysters lobster shrimp fresh 2025`,
    `site:instagram.com "${city}" seafood restaurant oysters lobster fresh fish`,
    `"${city}" best seafood restaurants oyster bar trending 2025`,
  ],
};

// ── Bundled fallback queries (cron mode) ─────────────────────

function buildBundledQueries(cityName: string): string[] {
  return [
    `site:tiktok.com "${cityName}" restaurant rooftop bar brunch cocktails 2025`,
    `site:tiktok.com "${cityName}" speakeasy jazz live music club nightlife hidden gem`,
    `site:tiktok.com "${cityName}" wine bar fine dining tasting menu cafe happy hour`,
    `site:instagram.com "${cityName}" restaurant rooftop bar cocktails date night`,
    `site:instagram.com "${cityName}" speakeasy jazz live music unique experience pop-up`,
    `"${cityName}" trending viral restaurant bar nightclub brunch TikTok Instagram 2025`,
    `"${cityName}" hidden gem new opening speakeasy jazz wine bar cafe going viral`,
  ];
}

function buildQueries(cityName: string, category?: string): string[] {
  if (category && CATEGORY_QUERIES[category]) {
    return CATEGORY_QUERIES[category](cityName);
  }
  return buildBundledQueries(cityName);
}

// ── Bright Data SERP fetch ─────────────────────────────────────

async function fetchSerpResults(
  query: string,
  apiKey: string,
  zone: string,
): Promise<SerpResult[]> {
  const googleUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}&brd_json=1&gl=us&hl=en&num=10`;

  const res = await fetch("https://api.brightdata.com/request", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      zone,
      url: googleUrl,
      format: "raw",
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Bright Data SERP error ${res.status}: ${text.slice(0, 200)}`);
  }

  const data = await res.json();
  return (data.organic ?? []).map((r: Record<string, unknown>) => ({
    title:       String(r.title ?? ""),
    link:        String(r.link ?? ""),
    description: String(r.description ?? ""),
    rank:        Number(r.rank ?? 0),
  }));
}

// ── Claude extraction ──────────────────────────────────────────

async function extractVenueSignals(
  serpResults: SerpResult[],
  cityName: string,
  citySlug: string,
  anthropicKey: string,
  category?: string,
): Promise<ExtractedSignal[]> {
  if (serpResults.length === 0) return [];

  const resultsText = serpResults.map((r, i) =>
    `[${i + 1}] ${r.title}\n${r.link}\n${r.description}`
  ).join("\n\n");

  // Build focused or broad system prompt depending on category mode
  const categoryInstruction = category
    ? `You are extracting ONLY "${category}" venues. Every venue you return MUST be a ${category} — discard anything that doesn't fit.`
    : `Cover ALL categories: rooftops, brunch, nightlife, cocktails, speakeasies, live music, jazz, wine bars, cafés, fine dining, happy hour, late night, pop-ups, unique experiences. Maximize variety across ALL categories, not just one.`;

  const forcedCategory = category
    ? `- Set category = "${category}" for every venue you extract.`
    : `- Assign the most accurate category from: Dining | Nightlife | Rooftops | Brunch | Cocktails | Speakeasy | Live Music | Jazz | Wine Bar | Café | Happy Hour | Late Night | Fine Dining | Experience | Pop-Up | Seafood`;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key":         anthropicKey,
      "anthropic-version": "2023-06-01",
      "Content-Type":      "application/json",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 4096,
      tools: [{
        name: "return_venue_signals",
        description: "Return venue signals extracted from social search results",
        input_schema: {
          type: "object",
          required: ["venues"],
          properties: {
            venues: {
              type: "array",
              items: {
                type: "object",
                required: ["venue_name", "venue_slug", "signal_type", "platform", "engagement_score", "sentiment", "hashtags", "snippet"],
                properties: {
                  venue_name:       { type: "string", description: "Exact venue name as it appears" },
                  venue_slug:       { type: "string", description: "kebab-case slug, e.g. 'le-diplomate'" },
                  signal_type:      { type: "string", enum: ["trending", "popular", "new", "lowkey", "unique"] },
                  platform:         { type: "string", enum: ["tiktok", "instagram", "multi"] },
                  engagement_score: { type: "number", description: "0.0 to 1.0 — relative social buzz" },
                  sentiment:        { type: "string", enum: ["positive", "neutral", "mixed", "negative"] },
                  hashtags:         { type: "array", items: { type: "string" } },
                  snippet:          { type: "string", description: "1-2 sentence social proof blurb for the app" },
                  neighborhood:     { type: "string", description: "Neighborhood if identifiable" },
                  category:         { type: "string", description: "Dining | Nightlife | Rooftops | Brunch | Cocktails | Speakeasy | Live Music | Jazz | Wine Bar | Café | Happy Hour | Late Night | Fine Dining | Experience | Pop-Up | Seafood" },
                },
              },
            },
          },
        },
      }],
      tool_choice: { type: "tool", name: "return_venue_signals" },
      system: `You are a venue intelligence engine for Confetti, an AI nightlife & dining concierge app in ${cityName}.

${categoryInstruction}

Rules:
- Only extract SPECIFIC, NAMED venues you can clearly identify (restaurant, bar, club, café, experience, etc.)
- signal_type: "trending" = going viral now, "popular" = well-established buzz, "new" = recently opened, "lowkey" = hidden gem, "unique" = one-of-a-kind
- engagement_score: 0.1 (mild) → 1.0 (massively viral) based on how it's described
- snippet: write like a friend recommending it — exciting, specific, 1-2 sentences
${forcedCategory}
- Ignore generic listicles with no specific venue names
- Max 25 venues per call
- DO NOT invent venues. Only extract what's clearly in the search results.`,
      messages: [
        {
          role: "user",
          content: `Extract venue social signals from these ${cityName} search results:\n\n${resultsText}`,
        },
      ],
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Anthropic API error ${res.status}: ${text.slice(0, 300)}`);
  }

  const data = await res.json();
  const toolUse = data.content?.find((c: Record<string, unknown>) => c.type === "tool_use");
  if (!toolUse) {
    console.error("No tool_use block from Claude:", JSON.stringify(data).slice(0, 500));
    return [];
  }

  return ((toolUse.input as Record<string, unknown>).venues ?? []) as ExtractedSignal[];
}

// ── Scrape a single city (one category or bundled) ────────────

async function scrapeCity(
  citySlug: string,
  cityName: string,
  queries: string[],
  apiKey: string,
  serpZone: string,
  anthropicKey: string,
  category: string | undefined,
  dryRun = false,
): Promise<{ signals: ExtractedSignal[]; duration_ms: number; error?: string }> {
  const catTag   = category ? `-${category.toLowerCase().replace(/\s+/g, "-")}` : "";
  const batchId  = `social-${citySlug}${catTag}-${new Date().toISOString().slice(0, 10)}`;
  const startTime = Date.now();

  if (!dryRun) {
    await supabaseAdmin.from("social_collection_log").insert({
      batch_id: batchId,
      city_slug: citySlug,
      trigger: "scheduled",
      status: "running",
    });
  }

  try {
    const allResults: SerpResult[] = [];
    for (const query of queries) {
      try {
        const results = await fetchSerpResults(query, apiKey, serpZone);
        allResults.push(...results);
        await new Promise(r => setTimeout(r, 500));
      } catch (err) {
        console.warn(`SERP query failed: "${query}" — ${err}`);
      }
    }

    const seen = new Set<string>();
    const dedupedResults = allResults.filter(r => {
      if (seen.has(r.link)) return false;
      seen.add(r.link);
      return true;
    });

    console.log(`[${citySlug}${catTag}] ${dedupedResults.length} unique SERP results`);

    const signals = await extractVenueSignals(
      dedupedResults,
      cityName,
      citySlug,
      anthropicKey,
      category,
    );

    console.log(`[${citySlug}${catTag}] Extracted ${signals.length} venue signals`);

    if (!dryRun && signals.length > 0) {
      const rows = signals.map(s => ({
        city_slug:        citySlug,
        venue_name:       s.venue_name,
        venue_slug:       s.venue_slug,
        signal_type:      s.signal_type,
        platform:         s.platform,
        engagement_score: s.engagement_score,
        sentiment:        s.sentiment,
        hashtags:         JSON.stringify(s.hashtags),
        snippet:          s.snippet,
        neighborhood:     s.neighborhood ?? null,
        category:         s.category ?? category ?? null,
        generation_batch: batchId,
        collected_at:     new Date().toISOString(),
        is_active:        true,
      }));

      const { error: upsertErr } = await supabaseAdmin
        .from("social_venue_signals")
        .upsert(rows, { onConflict: "city_slug,venue_slug,platform" });

      if (upsertErr) throw new Error(`Upsert failed: ${upsertErr.message}`);
    }

    const duration_ms = Date.now() - startTime;

    if (!dryRun) {
      const byType = signals.reduce((acc, s) => {
        acc[s.signal_type] = (acc[s.signal_type] ?? 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      await supabaseAdmin.from("social_collection_log")
        .update({
          status: "completed",
          signals_collected: signals.length,
          signals_by_type: byType,
          model_used: "claude-haiku-4-5",
          duration_ms,
          completed_at: new Date().toISOString(),
        })
        .eq("batch_id", batchId);
    }

    return { signals, duration_ms };

  } catch (err) {
    const duration_ms = Date.now() - startTime;
    const errorMessage = String(err);

    if (!dryRun) {
      await supabaseAdmin.from("social_collection_log")
        .update({
          status: "failed",
          error_message: errorMessage,
          duration_ms,
          completed_at: new Date().toISOString(),
        })
        .eq("batch_id", batchId);
    }

    return { signals: [], duration_ms, error: errorMessage };
  }
}

// ── Handler ───────────────────────────────────────────────────

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders() });
  }

  const apiKey       = Deno.env.get("BRIGHTDATA_API_KEY");
  const serpZone     = Deno.env.get("BRIGHTDATA_SERP_ZONE") ?? "confetti_serp";
  const anthropicKey = Deno.env.get("ANTHROPIC_API_KEY");

  if (!apiKey)        return errorResponse("BRIGHTDATA_API_KEY not configured", 503);
  if (!anthropicKey)  return errorResponse("ANTHROPIC_API_KEY not configured", 503);

  // ── GET — cron mode, all cities, bundled queries ─────────────
  if (req.method === "GET") {
    const authHeader = req.headers.get("Authorization");
    const cronSecret = Deno.env.get("CRON_SECRET");
    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return errorResponse("Unauthorized", 401);
    }

    const results: Record<string, unknown> = {};
    for (const { city_slug, city_name } of CRON_CITIES) {
      const queries = buildBundledQueries(city_name);
      const result  = await scrapeCity(city_slug, city_name, queries, apiKey, serpZone, anthropicKey, undefined);
      results[city_slug] = {
        signals: result.signals.length,
        duration_ms: result.duration_ms,
        error: result.error ?? null,
      };
    }

    return jsonResponse({ ok: true, cities: results });
  }

  // ── POST ─────────────────────────────────────────────────────
  let body: ScrapeBody;
  try {
    body = await req.json();
  } catch {
    return errorResponse("Invalid JSON body", 400);
  }

  const { city_slug, city_name, category, dry_run } = body;

  // Mode A: single city + single category (or bundled)
  if (city_slug && city_name) {
    const queries = body.queries ?? buildQueries(city_name, category);
    const result  = await scrapeCity(
      city_slug, city_name, queries,
      apiKey, serpZone, anthropicKey,
      category, dry_run ?? false,
    );
    return jsonResponse({
      ok:          !result.error,
      mode:        category ? "single-city-category" : "single-city-bundled",
      city_slug,
      city_name,
      category:    category ?? null,
      count:       result.signals.length,
      signals:     result.signals,
      duration_ms: result.duration_ms,
      error:       result.error ?? null,
    });
  }

  // Mode B: category only → run all DMV cities for that one category
  if (category) {
    if (!CATEGORY_QUERIES[category]) {
      return errorResponse(`Unknown category: "${category}". Valid: ${Object.keys(CATEGORY_QUERIES).join(", ")}`, 400);
    }

    const cityResults: Record<string, unknown> = {};
    let totalCount = 0;

    for (const { city_slug: cs, city_name: cn } of DMV_CITIES) {
      const queries = CATEGORY_QUERIES[category](cn);
      const result  = await scrapeCity(cs, cn, queries, apiKey, serpZone, anthropicKey, category, dry_run ?? false);
      cityResults[cs] = { count: result.signals.length, duration_ms: result.duration_ms, error: result.error ?? null };
      totalCount += result.signals.length;
    }

    return jsonResponse({
      ok:       true,
      mode:     "all-dmv-cities-category",
      category,
      total:    totalCount,
      cities:   cityResults,
    });
  }

  return errorResponse("Provide city_slug+city_name (single city) or category (all DMV cities for that category)", 400);
});
