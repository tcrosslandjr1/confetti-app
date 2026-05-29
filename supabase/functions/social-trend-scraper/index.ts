// ============================================================
// social-trend-scraper — Bright Data-powered venue intelligence
//
// Pulls trending TikTok & Instagram venue content for a city
// using Bright Data's SERP API (no user OAuth required).
// Claude extracts venue signals → social_venue_signals table.
//
// POST { city_slug, city_name, queries?: string[] }
// or GET (cron mode — scrapes all active cities)
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
  city_slug: string;    // e.g. "dc", "nyc", "miami"
  city_name: string;   // e.g. "Washington DC", "New York City", "Miami"
  queries?: string[];   // override default queries
  dry_run?: boolean;   // extract but don't write to DB
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
  engagement_score: number;   // 0..1
  sentiment: "positive" | "neutral" | "mixed" | "negative";
  hashtags: string[];
  snippet: string;
  neighborhood?: string;
  category?: string;
}

// ── Active cities for cron mode ────────────────────────────────

const CRON_CITIES = [
  { city_slug: "dc",        city_name: "Washington DC" },
  { city_slug: "baltimore", city_name: "Baltimore" },
  { city_slug: "nyc",       city_name: "New York City" },
  { city_slug: "miami",     city_name: "Miami" },
  { city_slug: "la",        city_name: "Los Angeles" },
  { city_slug: "chicago",   city_name: "Chicago" },
  { city_slug: "atlanta",   city_name: "Atlanta" },
];

// ── Default search queries per city ───────────────────────────

function buildQueries(cityName: string): string[] {
  return [
    // TikTok — food & dining
    `site:tiktok.com "${cityName}" restaurant rooftop bar 2025`,
    `site:tiktok.com "${cityName}" hidden gem food spot viral`,
    `site:tiktok.com "${cityName}" best brunch cocktails nightlife`,
    // Instagram — location posts
    `site:instagram.com "${cityName}" restaurant bar dinner date night`,
    `site:instagram.com "${cityName}" rooftop views cocktails vibes`,
    // General social discovery
    `"${cityName}" trending restaurant bar TikTok Instagram 2025`,
    `"${cityName}" hidden gem speakeasy rooftop going viral social media`,
  ];
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
): Promise<ExtractedSignal[]> {
  if (serpResults.length === 0) return [];

  const resultsText = serpResults.map((r, i) =>
    `[${i + 1}] ${r.title}\n${r.link}\n${r.description}`
  ).join("\n\n");

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
                  hashtags:         { type: "array", items: { type: "string" }, description: "Hashtags seen in results" },
                  snippet:          { type: "string", description: "1-2 sentence social proof blurb for the app" },
                  neighborhood:     { type: "string", description: "Neighborhood if identifiable" },
                  category:         { type: "string", description: "Dining | Nightlife | Rooftops | Brunch | Cocktails | Live Music | Café | Experience" },
                },
              },
            },
          },
        },
      }],
      tool_choice: { type: "tool", name: "return_venue_signals" },
      system: `You are a venue intelligence engine for Confetti, an AI nightlife & dining concierge app in ${cityName}.

Extract SPECIFIC, NAMED venues from these social media search results. Rules:
- Only extract venues you can clearly identify by name (restaurant, bar, club, rooftop, experience venue, café, etc.)
- signal_type: "trending" = going viral now, "popular" = well-established buzz, "new" = recently opened, "lowkey" = hidden gem vibe, "unique" = one-of-a-kind experience
- engagement_score: estimate 0.1 (mild) → 1.0 (massively viral) based on how it's described
- snippet: write like a friend recommending it — exciting, specific, 1-2 sentences
- Ignore generic listicles with no specific venue names
- Max 15 venues per call — pick the most signal-rich ones
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

// ── Main scrape for a single city ─────────────────────────────

async function scrapeCity(
  citySlug: string,
  cityName: string,
  queries: string[],
  apiKey: string,
  serpZone: string,
  anthropicKey: string,
  dryRun = false,
): Promise<{ signals: ExtractedSignal[]; duration_ms: number; error?: string }> {
  const batchId = `social-${citySlug}-${new Date().toISOString().slice(0, 10)}`;
  const startTime = Date.now();

  // Log batch start
  if (!dryRun) {
    await supabaseAdmin.from("social_collection_log").insert({
      batch_id: batchId,
      city_slug: citySlug,
      trigger: "scheduled",
      status: "running",
    });
  }

  try {
    // 1. Fetch SERP results for all queries (sequential to respect rate limits)
    const allResults: SerpResult[] = [];
    for (const query of queries) {
      try {
        const results = await fetchSerpResults(query, apiKey, serpZone);
        allResults.push(...results);
        // Small delay between requests
        await new Promise(r => setTimeout(r, 500));
      } catch (err) {
        console.warn(`SERP query failed: "${query}" — ${err}`);
      }
    }

    // Deduplicate by URL
    const seen = new Set<string>();
    const dedupedResults = allResults.filter(r => {
      if (seen.has(r.link)) return false;
      seen.add(r.link);
      return true;
    });

    console.log(`[${citySlug}] Got ${dedupedResults.length} unique SERP results`);

    // 2. Extract venue signals via Claude
    const signals = await extractVenueSignals(
      dedupedResults,
      cityName,
      citySlug,
      anthropicKey,
    );

    console.log(`[${citySlug}] Extracted ${signals.length} venue signals`);

    // 3. Upsert to social_venue_signals
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
        category:         s.category ?? null,
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

    // Log completion
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

  // ── Cron / GET mode — scrape all cities ──────────────────────
  if (req.method === "GET") {
    const authHeader = req.headers.get("Authorization");
    const cronSecret = Deno.env.get("CRON_SECRET");
    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return errorResponse("Unauthorized", 401);
    }

    const results: Record<string, unknown> = {};
    for (const { city_slug, city_name } of CRON_CITIES) {
      const queries = buildQueries(city_name);
      const result  = await scrapeCity(city_slug, city_name, queries, apiKey, serpZone, anthropicKey);
      results[city_slug] = {
        signals: result.signals.length,
        duration_ms: result.duration_ms,
        error: result.error ?? null,
      };
    }

    return jsonResponse({ ok: true, cities: results });
  }

  // ── POST mode — single city on-demand ────────────────────────
  let body: ScrapeBody;
  try {
    body = await req.json();
  } catch {
    return errorResponse("Invalid JSON body", 400);
  }

  if (!body.city_slug || !body.city_name) {
    return errorResponse("city_slug and city_name are required", 400);
  }

  const queries  = body.queries ?? buildQueries(body.city_name);
  const result   = await scrapeCity(
    body.city_slug,
    body.city_name,
    queries,
    apiKey,
    serpZone,
    anthropicKey,
    body.dry_run ?? false,
  );

  return jsonResponse({
    ok:         !result.error,
    city_slug:  body.city_slug,
    city_name:  body.city_name,
    signals:    result.signals,
    count:      result.signals.length,
    duration_ms: result.duration_ms,
    error:      result.error ?? null,
  });
});
