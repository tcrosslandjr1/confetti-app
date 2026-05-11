// Discover viral venues for a city using Firecrawl web search + Lovable AI extraction
// + Google Places verification. Idempotent — upserts into viral_venues by (city, normalized_name).
//
// Auth: gated by `apikey` header equal to the Supabase anon key (for pg_cron + admin UI).
import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { generateText, Output } from "ai";
import { z } from "zod";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";
import {
  authorityFor,
  computeTrendScore,
  normalizeName,
  TAG_VOCAB,
  type CandidateMention,
  type Signal,
  type ViralTag,
} from "@/lib/viral-scoring.server";

const QUERIES = [
  "TikTok restaurants in {city}",
  "viral food spots {city}",
  "Instagrammable places in {city}",
  "best date night spots {city} TikTok",
  "hidden gems {city} Instagram",
  "things to do {city} this weekend TikTok",
];

type FirecrawlSearchResult = {
  url: string;
  title?: string;
  description?: string;
  markdown?: string;
};

type Candidate = {
  name: string;
  neighborhood?: string;
  why_trending?: string;
  signals: Signal[];
  sourceUrl: string;
  sourceQuery: string;
};

type PlaceResult = {
  venue: string;
  placeId?: string;
  displayName?: string;
  formattedAddress?: string;
  rating?: number;
  priceLevel?: number;
  photos?: string[];
  found: boolean;
};

const ExtractionSchema = z.object({
  venues: z
    .array(
      z.object({
        name: z.string().min(2).max(120),
        neighborhood: z.string().max(80).optional(),
        why_trending: z.string().max(240).optional(),
        signals: z.array(z.enum(["tiktok", "instagram", "press", "blog", "creator"])).default([]),
      }),
    )
    .max(15),
});

const TaggingSchema = z.object({
  results: z.array(
    z.object({
      normalized_name: z.string(),
      tags: z.array(z.enum(TAG_VOCAB)).max(3),
    }),
  ),
});

async function firecrawlSearch(query: string, apiKey: string): Promise<FirecrawlSearchResult[]> {
  const res = await fetch("https://api.firecrawl.dev/v2/search", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query,
      limit: 8,
      tbs: "qdr:m",
      sources: ["web"],
    }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Firecrawl search failed (${res.status}): ${text.slice(0, 200)}`);
  }
  const data = (await res.json()) as {
    success?: boolean;
    data?: { web?: FirecrawlSearchResult[] } | FirecrawlSearchResult[];
  };
  if (Array.isArray(data.data)) return data.data;
  return data.data?.web ?? [];
}

function detectSignals(url: string, text: string): Signal[] {
  const sig: Set<Signal> = new Set();
  const u = url.toLowerCase();
  const t = (text || "").toLowerCase();
  if (u.includes("tiktok.com") || /\btiktok\b/.test(t)) sig.add("tiktok");
  if (u.includes("instagram.com") || /\binstagram|\breels?\b/.test(t)) sig.add("instagram");
  if (u.includes("youtube.com")) sig.add("creator");
  if (/blog|substack|medium\.com/.test(u)) sig.add("blog");
  if (sig.size === 0) sig.add("press");
  return [...sig];
}

async function extractCandidatesForResult(
  model: ReturnType<ReturnType<typeof createLovableAiGatewayProvider>>,
  result: FirecrawlSearchResult,
  city: string,
  query: string,
): Promise<Candidate[]> {
  const snippet = (result.markdown || result.description || "").slice(0, 6000);
  if (snippet.length < 80) return [];
  const sigs = detectSignals(result.url, `${result.title} ${snippet}`);
  try {
    const { experimental_output } = await generateText({
      model,
      experimental_output: Output.object({ schema: ExtractionSchema }),
      prompt: `From the following ${city} listicle/article, extract specific venue names mentioned as trending, viral, or noteworthy. Only include real, named venues (restaurants, bars, cafes, attractions). Do NOT include generic phrases like "the rooftop" or neighborhood names.

For each venue:
- name: the exact venue name
- neighborhood: if mentioned (e.g. "Shaw", "Adams Morgan")
- why_trending: a short reason in <=20 words
- signals: which platform signals apply (tiktok, instagram, press, blog, creator)

Source URL: ${result.url}
Title: ${result.title ?? ""}

CONTENT:
${snippet}`,
    });
    return experimental_output.venues.map((v) => ({
      name: v.name.trim(),
      neighborhood: v.neighborhood?.trim(),
      why_trending: v.why_trending?.trim(),
      signals: v.signals.length ? (v.signals as Signal[]) : sigs,
      sourceUrl: result.url,
      sourceQuery: query,
    }));
  } catch (e) {
    console.warn("[discover-viral] extract failed", result.url, (e as Error).message);
    return [];
  }
}

async function verifyWithGooglePlaces(
  candidates: { name: string; neighborhood?: string }[],
  city: string,
  supabaseUrl: string,
  anonKey: string,
): Promise<Map<string, PlaceResult>> {
  const out = new Map<string, PlaceResult>();
  // batch in chunks of 10
  for (let i = 0; i < candidates.length; i += 10) {
    const chunk = candidates.slice(i, i + 10);
    try {
      const res = await fetch(`${supabaseUrl}/functions/v1/google-places`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: anonKey,
          Authorization: `Bearer ${anonKey}`,
        },
        body: JSON.stringify({
          queries: chunk.map((c) => ({
            venue: c.name,
            neighborhood: c.neighborhood,
            address: city,
          })),
        }),
      });
      if (!res.ok) continue;
      const data = (await res.json()) as { results?: PlaceResult[] };
      for (const r of data.results ?? []) out.set(r.venue, r);
    } catch (e) {
      console.warn("[discover-viral] places batch failed", (e as Error).message);
    }
  }
  return out;
}

async function tagVenues(
  model: ReturnType<ReturnType<typeof createLovableAiGatewayProvider>>,
  rows: { normalized_name: string; venue_name: string; summary: string; signals: Signal[] }[],
): Promise<Map<string, ViralTag[]>> {
  if (!rows.length) return new Map();
  try {
    const { experimental_output } = await generateText({
      model,
      experimental_output: Output.object({ schema: TaggingSchema }),
      prompt: `Assign 1-3 vibe tags from this exact vocabulary to each venue based on the summary and signals.

Vocabulary:
- tiktok_viral: gone viral on TikTok recently
- instagrammable: highly photogenic / aesthetic
- hidden_gem: lesser-known, off-the-beaten-path
- creator_mentioned: recommended by named creators/influencers
- trending_this_week: hot RIGHT NOW
- date_night: romantic / great for couples
- foodie_hype: serious food scene buzz
- photo_op: a specific photogenic moment/spot
- worth_the_wait: famous for long lines / hard reservations

Return one entry per venue with the venue's normalized_name and 1-3 tags.

VENUES:
${rows.map((r) => `- ${r.normalized_name} | ${r.venue_name} | signals: ${r.signals.join(",")} | ${r.summary}`).join("\n")}`,
    });
    const map = new Map<string, ViralTag[]>();
    for (const r of experimental_output.results) map.set(r.normalized_name, r.tags as ViralTag[]);
    return map;
  } catch (e) {
    console.warn("[discover-viral] tagging failed", (e as Error).message);
    return new Map();
  }
}

async function discoverForCity(city: string) {
  const lovableKey = process.env.LOVABLE_API_KEY;
  const firecrawlKey = process.env.FIRECRAWL_API_KEY;
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anonKey = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!lovableKey) throw new Error("LOVABLE_API_KEY not set");
  if (!firecrawlKey) throw new Error("FIRECRAWL_API_KEY not set");
  if (!supabaseUrl || !serviceKey || !anonKey) throw new Error("Supabase env not set");

  const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });
  const startedAt = Date.now();
  const { data: runRow } = await admin
    .from("viral_discovery_runs")
    .insert({ city, queries_run: QUERIES.length })
    .select("id")
    .single();
  const runId = runRow?.id as string | undefined;

  try {
    const provider = createLovableAiGatewayProvider(lovableKey);
    const model = provider("google/gemini-3-flash-preview");

    // 1. Search
    const allResults: { result: FirecrawlSearchResult; query: string }[] = [];
    for (const tmpl of QUERIES) {
      const q = tmpl.replace("{city}", city);
      try {
        const results = await firecrawlSearch(q, firecrawlKey);
        for (const r of results) allResults.push({ result: r, query: q });
      } catch (e) {
        console.warn("[discover-viral] search failed", q, (e as Error).message);
      }
    }

    // 2. Extract candidates (parallel, capped)
    const extractions = await Promise.all(
      allResults
        .slice(0, 40)
        .map(({ result, query }) => extractCandidatesForResult(model, result, city, query)),
    );
    const flat = extractions.flat();

    // 3. Dedupe + aggregate by normalized name
    const byKey = new Map<
      string,
      { name: string; neighborhood?: string; whys: string[]; mentions: CandidateMention[] }
    >();
    for (const c of flat) {
      const key = normalizeName(c.name);
      if (!key || key.length < 3) continue;
      const existing = byKey.get(key);
      const mention: CandidateMention = {
        signals: c.signals,
        sourceUrl: c.sourceUrl,
        sourceQuery: c.sourceQuery,
        fetchedAt: Date.now(),
      };
      if (existing) {
        existing.mentions.push(mention);
        if (c.why_trending) existing.whys.push(c.why_trending);
        if (!existing.neighborhood && c.neighborhood) existing.neighborhood = c.neighborhood;
      } else {
        byKey.set(key, {
          name: c.name,
          neighborhood: c.neighborhood,
          whys: c.why_trending ? [c.why_trending] : [],
          mentions: [mention],
        });
      }
    }

    // 4. Verify with Google Places
    const candidatesArr = [...byKey.entries()].map(([key, v]) => ({ key, ...v }));
    const placeMap = await verifyWithGooglePlaces(
      candidatesArr.map((c) => ({ name: c.name, neighborhood: c.neighborhood })),
      city,
      supabaseUrl,
      anonKey,
    );

    // 5. Build rows + score
    const baseRows = candidatesArr.map((c) => {
      const place = placeMap.get(c.name);
      const summary = c.whys[0] || "Trending across recent posts";
      const score = computeTrendScore({
        mentions: c.mentions,
        rating: place?.rating,
        appEngagement: 0,
      });
      const sources = c.mentions.map((m) => ({
        url: m.sourceUrl,
        query: m.sourceQuery,
        authority: authorityFor(m.sourceUrl),
      }));
      const allSignals = [...new Set(c.mentions.flatMap((m) => m.signals))];
      return {
        normalized_name: c.key,
        city,
        venue_name: place?.displayName || c.name,
        google_place_id: place?.placeId ?? null,
        address: place?.formattedAddress ?? null,
        neighborhood: c.neighborhood ?? null,
        photo_url: place?.photos?.[0] ?? null,
        rating: place?.rating ?? null,
        trend_score: score,
        mention_count: c.mentions.length,
        last_mentioned_at: new Date().toISOString(),
        source_urls: sources,
        summary,
        verified: !!place?.found,
        refreshed_at: new Date().toISOString(),
        _signals: allSignals,
      };
    });

    // 6. AI tags
    const tagMap = await tagVenues(
      model,
      baseRows.map((r) => ({
        normalized_name: r.normalized_name,
        venue_name: r.venue_name,
        summary: r.summary,
        signals: r._signals,
      })),
    );

    const upsertRows = baseRows.map(({ _signals, ...r }) => ({
      ...r,
      tags: tagMap.get(r.normalized_name) ?? [],
    }));

    // 7. Upsert
    let upserted = 0;
    if (upsertRows.length) {
      const { error, count } = await admin
        .from("viral_venues")
        .upsert(upsertRows, { onConflict: "city,normalized_name", count: "exact" });
      if (error) throw error;
      upserted = count ?? upsertRows.length;
    }

    const durationMs = Date.now() - startedAt;
    if (runId) {
      await admin
        .from("viral_discovery_runs")
        .update({
          finished_at: new Date().toISOString(),
          candidates_found: flat.length,
          venues_upserted: upserted,
          duration_ms: durationMs,
        })
        .eq("id", runId);
    }

    return {
      city,
      queriesRun: QUERIES.length,
      searchResults: allResults.length,
      candidatesFound: flat.length,
      venuesUpserted: upserted,
      durationMs,
    };
  } catch (e) {
    const message = (e as Error).message;
    if (runId) {
      await admin
        .from("viral_discovery_runs")
        .update({
          finished_at: new Date().toISOString(),
          error: message,
          duration_ms: Date.now() - startedAt,
        })
        .eq("id", runId);
    }
    throw e;
  }
}

export const Route = createFileRoute("/api/public/hooks/discover-viral")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apiKey = request.headers.get("apikey");
        const expected = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_PUBLISHABLE_KEY;
        if (!expected || apiKey !== expected) {
          return new Response(JSON.stringify({ error: "unauthorized" }), {
            status: 401,
            headers: { "Content-Type": "application/json" },
          });
        }
        let city = "Washington DC";
        try {
          const body = (await request.json()) as { city?: string };
          if (body?.city) city = body.city;
        } catch {
          /* empty body ok */
        }
        try {
          const result = await discoverForCity(city);
          return Response.json({ ok: true, ...result });
        } catch (e) {
          console.error("[discover-viral] failed", e);
          return new Response(JSON.stringify({ ok: false, error: (e as Error).message }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }
      },
    },
  },
});
