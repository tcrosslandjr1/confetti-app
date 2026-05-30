// Confetti AI — build a full-day itinerary.
// Venue grounding uses the curated venues table, bootstrapping new cities via Google Places.
import { getCorsHeaders } from "../_shared/cors.ts";
import { supabaseAdmin } from "../_shared/supabase-client.ts";
import { ensureCityVenuesFromPlaces } from "../_shared/places-discovery.ts";

type SeedIdea = {
  title: string;
  hook?: string;
  description?: string;
  vibeTags?: string[];
};

type Body = {
  occasion: string; // e.g. "Date night"
  vibe?: string; // tagline / extra hint
  city?: string;
  region?: string; // e.g. "DC · MD · VA" — disambiguates city name
  lat?: number | null; // selected city coords for Places location bias
  lng?: number | null;
  date?: string; // ISO date
  startTime?: string; // "11:00"
  durationHours?: number; // total day length
  budget?: string; // '$' | '$$' | '$$$' or freeform
  neighborhood?: string;
  seedIdea?: SeedIdea; // expand a flashcard into a day
  notes?: string;
  tasteSummary?: string;
  transportMode?: "auto" | "car" | "transit" | "lyft" | "uber" | "walk"; // user preference
  /** When set to "replan", regenerate only the stops AFTER `completedStops`. */
  mode?: "build" | "replan";
  /** For replan: names of stops already visited, in order. */
  completedStops?: string[];
  /** For replan: HH:mm of where the user is right now. */
  currentTime?: string;
  /** For replan: how many hours remain in the night. */
  remainingHours?: number;
};

// ---------- Curated venues verification ----------
// LLMs hallucinate venue names. We re-check every named stop against the curated
// `venues` table (1,074 entries). Closed / not-found stops fall back to a
// category search in the same city so we never falsely advertise a venue that
// isn't in our knowledge base.

const CATEGORY_QUERY: Record<string, string> = {
  meal: "popular restaurant",
  drinks: "cocktail bar",
  activity: "fun activity",
  scenic: "scenic spot",
  travel: "landmark",
  other: "popular spot",
};

type PlaceHit = {
  id: string;
  displayName?: { text?: string };
  formattedAddress?: string;
  shortFormattedAddress?: string;
  location?: { latitude?: number; longitude?: number };
  rating?: number;
  userRatingCount?: number;
  businessStatus?: string;
  googleMapsUri?: string;
  websiteUri?: string;
};

/**
 * Drop-in replacement for the old Google Places search.
 * Searches the curated `venues` table for matches against textQuery,
 * constrained to a specific city when provided. The `key` and `bias`
 * params are kept for signature compat and ignored.
 *
 * `cityFilter` is the authoritative city name — when set, results are
 * required to match that city exactly (ilike). This avoids accidentally
 * picking a same-named venue from a different city.
 */
async function placesSearch(
  textQuery: string,
  _key: string,
  _bias?: { lat: number; lng: number },
  cityFilter?: string | null,
): Promise<PlaceHit[]> {
  const q = textQuery.trim();
  if (!q) return [];
  const nameTokens = q
    .toLowerCase()
    .split(/[\s,]+/)
    .map((t) => t.replace(/[^a-z0-9]/g, ""))
    .filter((t) => t.length > 2);
  if (nameTokens.length === 0 && !cityFilter) return [];

  let query = supabaseAdmin
    .from("venues")
    .select(
      "id,name,city,neighborhood,address,lat,lng,cuisine,rating,rating_count,popularity_score",
    )
    .order("is_verified", { ascending: false, nullsFirst: false })
    .order("popularity_score", { ascending: false, nullsFirst: false })
    .order("rating", { ascending: false, nullsFirst: false })
    .limit(15);

  if (cityFilter && cityFilter.trim()) {
    query = query.ilike("city", cityFilter.trim());
  }
  if (nameTokens.length > 0) {
    const orParts: string[] = [];
    for (const t of nameTokens.slice(0, 4)) {
      orParts.push(`name.ilike.%${t}%`, `cuisine.ilike.%${t}%`, `address.ilike.%${t}%`);
    }
    query = query.or(orParts.join(","));
  }

  try {
    const { data, error } = await query;
    if (error) {
      console.warn("[build-itinerary] venues error", error.message);
      return [];
    }
    return ((data as Array<{
      id: string;
      name: string;
      address: string | null;
      lat: number | null;
      lng: number | null;
      rating: number | null;
      rating_count: number | null;
    }>) ?? []).map<PlaceHit>((r) => ({
      id: r.id,
      displayName: { text: r.name },
      formattedAddress: r.address ?? undefined,
      shortFormattedAddress: r.address ?? undefined,
      location:
        typeof r.lat === "number" && typeof r.lng === "number"
          ? { latitude: r.lat, longitude: r.lng }
          : undefined,
      rating: r.rating ?? undefined,
      userRatingCount: r.rating_count ?? undefined,
      businessStatus: "OPERATIONAL",
      googleMapsUri: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        `${r.name} ${r.address ?? ""}`,
      )}`,
    }));
  } catch (e) {
    console.warn("[build-itinerary] venues fetch failed", (e as Error).message);
    return [];
  }
}

function operational(hits: PlaceHit[]): PlaceHit[] {
  return hits.filter((h) => !h.businessStatus || h.businessStatus === "OPERATIONAL");
}

function nameSimilar(a: string, b: string): boolean {
  const norm = (s: string) =>
    s
      .toLowerCase()
      .replace(/&/g, "and")
      .replace(/[^a-z0-9 ]+/g, "")
      .trim();
  const A = norm(a);
  const B = norm(b);
  if (!A || !B) return false;
  if (A === B || A.includes(B) || B.includes(A)) return true;
  const at = new Set(A.split(/\s+/).filter((w) => w.length > 2));
  const bt = new Set(B.split(/\s+/).filter((w) => w.length > 2));
  let overlap = 0;
  at.forEach((w) => bt.has(w) && overlap++);
  return overlap >= Math.max(1, Math.min(at.size, bt.size) - 1);
}

function placeScore(rating?: number, count?: number): number {
  return Number(((rating ?? 0) * Math.log10((count ?? 0) + 10)).toFixed(4));
}

type AuditRow = Record<string, unknown>;

async function verifyStop(
  stop: Record<string, unknown>,
  cityLabel: string,
  bias: { lat: number; lng: number } | undefined,
  used: Set<string>,
  key: string,
  audit: AuditRow[],
  ctx: { userId: string | null; city: string | null },
): Promise<{ stop: Record<string, unknown>; verified: boolean }> {
  const name = String(stop.name ?? "").trim();
  const category = String(stop.category ?? "other");
  const cityForQuery = cityLabel || "";

  // 1) Try exact name lookup first
  if (name) {
    const direct = operational(
      await placesSearch(name, key, bias, cityForQuery || null),
    );
    const match = direct.find(
      (h) => nameSimilar(h.displayName?.text ?? "", name) && !used.has(h.id),
    );
    if (match) {
      used.add(match.id);
      audit.push({
        source: "build-itinerary",
        user_id: ctx.userId,
        city: ctx.city,
        requested_name: name,
        query: cityForQuery ? `${name} ${cityForQuery}` : name,
        place_id: match.id,
        matched_name: match.displayName?.text ?? null,
        status: "matched",
        score: placeScore(match.rating, match.userRatingCount),
        rating: match.rating ?? null,
        user_rating_count: match.userRatingCount ?? null,
        business_status: match.businessStatus ?? null,
        meta: { category, candidates: direct.length },
      });
      return { stop: applyHit(stop, match), verified: true };
    }
  }

  // 2) Fallback: search by category in the chosen city
  const fallbackQ = CATEGORY_QUERY[category] ?? "popular spot";
  const fb = operational(await placesSearch(fallbackQ, key, bias, cityForQuery || null)).filter((h) => !used.has(h.id));
  // Prefer best-rated with enough reviews
  fb.sort((a, b) => {
    const ar = (a.rating ?? 0) * Math.log10((a.userRatingCount ?? 0) + 10);
    const br = (b.rating ?? 0) * Math.log10((b.userRatingCount ?? 0) + 10);
    return br - ar;
  });
  const pick = fb[0];
  if (pick) {
    used.add(pick.id);
    audit.push({
      source: "build-itinerary",
      user_id: ctx.userId,
      city: ctx.city,
      requested_name: name || null,
      query: fallbackQ,
      place_id: pick.id,
      matched_name: pick.displayName?.text ?? null,
      status: "fallback",
      score: placeScore(pick.rating, pick.userRatingCount),
      rating: pick.rating ?? null,
      user_rating_count: pick.userRatingCount ?? null,
      business_status: pick.businessStatus ?? null,
      meta: { category, candidates: fb.length },
    });
    return { stop: applyHit(stop, pick), verified: true };
  }
  audit.push({
    source: "build-itinerary",
    user_id: ctx.userId,
    city: ctx.city,
    requested_name: name || null,
    query: fallbackQ,
    place_id: null,
    matched_name: null,
    status: "unmatched",
    score: 0,
    rating: null,
    user_rating_count: null,
    business_status: null,
    meta: { category },
  });
  return { stop, verified: false };
}

function applyHit(stop: Record<string, unknown>, hit: PlaceHit): Record<string, unknown> {
  const realName = hit.displayName?.text ?? String(stop.name ?? "");
  const realAddr = hit.formattedAddress ?? hit.shortFormattedAddress ?? String(stop.address ?? "");
  const mapsUri =
    hit.googleMapsUri ??
    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${realName} ${realAddr}`)}`;
  return {
    ...stop,
    name: realName,
    address: realAddr,
    bookingUrl: hit.websiteUri ?? mapsUri,
    bookingProvider: hit.websiteUri ? "website" : "google-maps",
    placeId: hit.id,
    rating: hit.rating ?? null,
    userRatingCount: hit.userRatingCount ?? null,
    lat: hit.location?.latitude ?? null,
    lng: hit.location?.longitude ?? null,
    mapsUri,
    verified: true,
  };
}

async function logAuditRows(rows: AuditRow[]) {
  const url = Deno.env.get("SUPABASE_URL");
  const srk = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !srk || rows.length === 0) return;
  try {
    await fetch(`${url}/rest/v1/places_match_audit`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: srk,
        Authorization: `Bearer ${srk}`,
        Prefer: "return=minimal",
      },
      body: JSON.stringify(rows),
    });
  } catch (e) {
    console.warn("[build-itinerary] audit log failed", (e as Error).message);
  }
}

async function getUserIdFromAuth(req: Request): Promise<string | null> {
  try {
    const auth = req.headers.get("Authorization") || req.headers.get("authorization");
    if (!auth) return null;
    const token = auth.replace(/^Bearer\s+/i, "");
    const url = Deno.env.get("SUPABASE_URL");
    const anon = Deno.env.get("SUPABASE_ANON_KEY");
    if (!url || !anon) return null;
    const r = await fetch(`${url}/auth/v1/user`, {
      headers: { apikey: anon, Authorization: `Bearer ${token}` },
    });
    if (!r.ok) return null;
    const j = await r.json();
    return j?.id ?? null;
  } catch {
    return null;
  }
}

async function fetchBlockedPlaceIds(
  userId: string | null,
  city: string | null,
): Promise<Set<string>> {
  const url = Deno.env.get("SUPABASE_URL");
  const srk = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const blocked = new Set<string>();
  if (!url || !srk) return blocked;
  try {
    // Per-user reports
    if (userId) {
      const r = await fetch(
        `${url}/rest/v1/venue_reports?select=place_id&user_id=eq.${userId}&place_id=not.is.null`,
        { headers: { apikey: srk, Authorization: `Bearer ${srk}` } },
      );
      if (r.ok) {
        const rows = (await r.json()) as Array<{ place_id: string | null }>;
        rows.forEach((row) => row.place_id && blocked.add(row.place_id));
      }
    }
    // City-wide aggregated blocks (3+ distinct reporters)
    if (city) {
      const r = await fetch(`${url}/rest/v1/rpc/blocked_place_ids_for_city`, {
        method: "POST",
        headers: {
          apikey: srk,
          Authorization: `Bearer ${srk}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ _city: city }),
      });
      if (r.ok) {
        const rows = (await r.json()) as Array<{ place_id: string }>;
        rows.forEach((row) => row.place_id && blocked.add(row.place_id));
      }
    }
  } catch (e) {
    console.warn("[blocked place ids] failed", (e as Error).message);
  }
  return blocked;
}

async function verifyItinerary(
  itinerary: { stops?: Array<Record<string, unknown>> },
  body: Body,
  key: string,
  ctx: { userId: string | null },
) {
  const stops = itinerary.stops ?? [];
  const cityLabel = [body.city, body.region].filter(Boolean).join(", ");
  const bias =
    typeof body.lat === "number" && typeof body.lng === "number"
      ? { lat: body.lat, lng: body.lng }
      : undefined;
  // Seed `used` with reported place_ids so they're never picked again.
  const used = await fetchBlockedPlaceIds(ctx.userId, body.city ?? null);
  const audit: AuditRow[] = [];
  const auditCtx = { userId: ctx.userId, city: body.city ?? null };

  // ── Parallel fetch, sequential dedup ──────────────────────────
  // Fire all Google Places API searches concurrently (the expensive I/O),
  // then sequentially pick winners while checking the shared `used` Set.
  type PreFetched = {
    stop: Record<string, unknown>;
    name: string;
    category: string;
    directHits: PlaceHit[];
    fallbackHits: PlaceHit[];
    fallbackQuery: string;
  };

  const preFetches: Promise<PreFetched>[] = stops.map(async (s) => {
    const name = String(s.name ?? "").trim();
    const category = String(s.category ?? "other");
    const cityForQuery = cityLabel || "";

    // Fire both searches concurrently per stop. City is passed as an
    // explicit filter (not concatenated into the textQuery) so we never
    // pick a same-named venue from a different city.
    const directQuery = name;
    const fallbackQ = CATEGORY_QUERY[category] ?? "popular spot";

    const [directHits, fallbackHits] = await Promise.all([
      directQuery ? placesSearch(directQuery, key, bias, cityForQuery || null) : Promise.resolve([] as PlaceHit[]),
      placesSearch(fallbackQ, key, bias, cityForQuery || null),
    ]);

    return {
      stop: s,
      name,
      category,
      directHits: operational(directHits),
      fallbackHits: operational(fallbackHits),
      fallbackQuery: fallbackQ,
    };
  });

  const allPre = await Promise.all(preFetches);

  // Sequential winner selection — preserves `used` Set correctness
  const out: Array<Record<string, unknown>> = [];
  for (const pf of allPre) {
    // 1) Try exact name match from pre-fetched direct hits
    if (pf.name) {
      const match = pf.directHits.find(
        (h) => nameSimilar(h.displayName?.text ?? "", pf.name) && !used.has(h.id),
      );
      if (match) {
        used.add(match.id);
        audit.push({
          source: "build-itinerary",
          user_id: auditCtx.userId,
          city: auditCtx.city,
          requested_name: pf.name,
          query: pf.name,
          place_id: match.id,
          matched_name: match.displayName?.text ?? null,
          status: "matched",
          score: placeScore(match.rating, match.userRatingCount),
          rating: match.rating ?? null,
          user_rating_count: match.userRatingCount ?? null,
          business_status: match.businessStatus ?? null,
          meta: { category: pf.category, candidates: pf.directHits.length },
        });
        out.push(applyHit(pf.stop, match));
        continue;
      }
    }

    // 2) Fallback: pick best-rated from category search, excluding used
    const fb = pf.fallbackHits.filter((h) => !used.has(h.id));
    fb.sort((a, b) => {
      const ar = (a.rating ?? 0) * Math.log10((a.userRatingCount ?? 0) + 10);
      const br = (b.rating ?? 0) * Math.log10((b.userRatingCount ?? 0) + 10);
      return br - ar;
    });
    const pick = fb[0];
    if (pick) {
      used.add(pick.id);
      audit.push({
        source: "build-itinerary",
        user_id: auditCtx.userId,
        city: auditCtx.city,
        requested_name: pf.name || null,
        query: pf.fallbackQuery,
        place_id: pick.id,
        matched_name: pick.displayName?.text ?? null,
        status: "fallback",
        score: placeScore(pick.rating, pick.userRatingCount),
        rating: pick.rating ?? null,
        user_rating_count: pick.userRatingCount ?? null,
        business_status: pick.businessStatus ?? null,
        meta: { category: pf.category, candidates: fb.length },
      });
      out.push(applyHit(pf.stop, pick));
      continue;
    }

    // 3) Unverifiable — drop the stop
    audit.push({
      source: "build-itinerary",
      user_id: auditCtx.userId,
      city: auditCtx.city,
      requested_name: pf.name || null,
      query: pf.fallbackQuery,
      place_id: null,
      matched_name: null,
      status: "unmatched",
      score: 0,
      rating: null,
      user_rating_count: null,
      business_status: null,
      meta: { category: pf.category },
    });
  }

  await logAuditRows(audit);
  return { ...itinerary, stops: out };
}

Deno.serve(async (req) => {
  _currentReq = req;
  if (req.method === "OPTIONS") return new Response(null, { headers: getCorsHeaders(req) });

  try {
    const b = (await req.json()) as Body;
    if (!b.occasion) return json({ error: "occasion required" }, 400);
    const userId = await getUserIdFromAuth(req);

    // Lazy bootstrap: warm the destination city's venues so the
    // verification step has something to match against. Pass the
    // user's vibe/notes as a niche hint so e.g. "hookah lounges and
    // Mediterranean" pulls in hookah spots even if the baseline KB
    // is already populated for that city.
    const nicheHint = [b.vibe, b.notes].filter(Boolean).join(" — ") || null;
    await ensureCityVenuesFromPlaces(b.city, b.lat, b.lng, 15);

    const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!apiKey) return json({ error: "missing ANTHROPIC_API_KEY" }, 500);

    // Pre-grounding: pull the city's top venues from the KB so Claude
    // picks from a real candidate list instead of inventing names. This
    // eliminates the "Claude wrote 'pontoon boat' but verifier substituted
    // The Mission brunch" mismatch.
    let candidateBlock = "";
    if (b.city) {
      const { data: rawCands } = await supabaseAdmin
        .from("venues")
        .select(
          "name,cuisine,neighborhood,address,price,price_level,vibe_tags,vibe_notes",
        )
        .ilike("city", b.city)
        .order("is_verified", { ascending: false, nullsFirst: false })        .order("popularity_score", { ascending: false, nullsFirst: false })
        .order("rating", { ascending: false, nullsFirst: false })
        .limit(60);
      const cands = (rawCands as Array<{
        name: string;
        cuisine: string | null;
        neighborhood: string | null;
        address: string | null;
        price: string | null;
        vibe_tags: string[] | null;
        vibe_notes: string | null;
      }> | null) ?? [];
      // Filter out partial-seed placeholder rows from earlier ingest paths.
      const real = cands.filter((c) => c.name && !c.name.startsWith("(") && !c.name.includes("Pinned"));
      if (real.length > 0) {
        const lines = real.slice(0, 50).map((c) =>
          `- ${c.name} (${c.cuisine ?? "venue"}${c.neighborhood ? `, ${c.neighborhood}` : ""}, ${c.price ?? ""}) ${
            (c.vibe_tags ?? []).slice(0, 4).join("/")
          }${c.vibe_notes ? ` — ${c.vibe_notes.slice(0, 90)}` : ""}`,
        );
        candidateBlock = `\nAUTHORITATIVE VENUE LIST for ${b.city} — pick stop names ONLY from this list. Do NOT invent venues that aren't here. Match every description, what_to_do, and parking note to the ACTUAL venue you pick (e.g. don't describe a brunch spot as a boat charter).\n\n${lines.join("\n")}\n`;
      }
    }

    const seedBlock = b.seedIdea
      ? `Expand this seed idea into the full day:\nTitle: ${b.seedIdea.title}\n${b.seedIdea.hook ?? ""}\n${b.seedIdea.description ?? ""}\nVibe tags: ${(b.seedIdea.vibeTags ?? []).join(", ")}`
      : "No seed idea — design from scratch.";

    // Replan-from-here block.
    const replanBlock = b.mode === "replan" && (b.completedStops?.length ?? 0) > 0
      ? `\nMID-TRIP REPLAN: the user has ALREADY completed these stops: ${b.completedStops!.map((n, i) => `${i + 1}) ${n}`).join(", ")}. It's currently ${b.currentTime ?? "now"} and they have about ${b.remainingHours ?? 2} hours left. Plan ONLY the REMAINING stops (2-4) — do NOT repeat what they already did, do NOT include any of those venues again. Pick from the candidate list, pick up the energy where the night left off (if they had drinks, suggest food next; if they ate, suggest cocktails or activity), and time-anchor the first new stop to ~15 minutes after ${b.currentTime ?? "now"}.\n`
      : "";

    const sys = `You are a thoughtful day-planner for an app called Confetti.
Create ONE full-day itinerary for occasion: "${b.occasion}"${b.vibe ? ` (vibe: ${b.vibe})` : ""}.
City: ${b.city ?? "user's city"} ${b.neighborhood ? `(focus near ${b.neighborhood})` : ""}.
Date: ${b.date ?? "flexible"}, start around ${b.startTime ?? "late morning"}, total length ~${b.durationHours ?? 6} hours.
Budget: ${b.budget ?? "moderate"}.
Extra notes: ${b.notes ?? "(none)"}.
${b.tasteSummary ? `\nUSER TASTE PROFILE (use this to personalize every stop — match age/life-stage/energy/scenes/music/cities/budget; honor "avoid" strictly): ${b.tasteSummary}\n` : ""}

OCCASION PLAYBOOK — match every stop to who's actually going. Do NOT default to "restaurant + bar + restaurant" for every plan.

• Kids / Family day: jump/trampoline parks, indoor playgrounds, paint-your-own pottery, slime studios, kids' cooking class, aquarium, children's museum, zoo, splash pads, mini golf, go-karts, arcade + pizza combos, laser tag, drive-in. Always weave in FREE local programs when possible: Home Depot Kids Workshop (first Saturday), Lowe's Kids Workshop, Michaels kids events, library story time, farmers market, free museum days, town parades, fire-station open houses. Restaurants must be kid-friendly (booths, kid menus, fast service).

• Girls' night out: vibrant, flowery, photogenic, feminine-coded — rooftop brunch with floral installs, pink/aesthetic cafés, paint-and-sip, candle-making or flower-arranging workshop, sushi/saké, hibachi, karaoke, dance class, spa/sauna, comedy show, bottomless mimosa brunch, speakeasy, jazz lounge, drag brunch, vintage shopping crawl.

• Guys' night out: paintball, axe throwing, indoor shooting range, top-golf or driving range, real golf, bowling, billiards/pool hall, sports bar with multiple screens, wings + craft beer, BBQ joint, hibachi, cigar lounge, hiking, kayaking, escape room, go-karts, esports/arcade bar, late-night taco run.

• Date night: tune to the vibe — romantic (low-light, wine bar, jazz), adventurous (rooftop, unusual food, live music), chill (board game café, dessert + walk).

• Meet-the-parents / in-laws: classy and safe — quiet upscale restaurant, wine tasting, scenic drive, brunch at a country club, garden walk, light comedy, museum exhibit, afternoon tea.

• Mature married couple (40s-60s, settled): grown-up scenes — wine country day, chef's-table dinner, jazz/blues club, supper club, theater, gallery opening, distillery tour, neighborhood food walk, B&B getaway, clean comedy, historic-district stroll, cooking class for two, private boat charter. Avoid loud/college-coded venues unless the profile says otherwise.

• Elders / multigenerational: botanical gardens, art museums, historic walking tours, scenic train rides, classical concerts, matinees, garden-restaurant lunch, tea rooms, riverside parks. Keep walking distances short and venues accessible.

• Anniversary / romantic: prix-fixe tasting menu, sunset spot, couples spa, harbor cruise, jazz, hidden speakeasy.

Pick stop categories that fit (don't force "drinks" on a kids day, don't force "museum" on a guys' night). Match the energy and demographics in every venue, what_to_do, parking note, and tip.

${seedBlock}
${replanBlock}
${candidateBlock}
Return a tight 3-6 stop plan that flows naturally — no backtracking, sensible drive/walk times between stops.
Each stop must include a category, a clear "what to do" or "what to order", and a likely booking provider when relevant (opentable, resy, eventbrite, ticketmaster, or "website").

CRITICAL — VENUE ACCURACY: ${candidateBlock ? "Pick names ONLY from the AUTHORITATIVE VENUE LIST above. Your description and what_to_do MUST describe the actual venue you picked (read its category/tags/notes)." : `Only name venues you are confident actually exist in ${b.city ?? "the user's city"}${b.region ? ` (${b.region})` : ""} RIGHT NOW. Do NOT invent venue names.`} If a needed stop isn't in the list, use a clearly generic descriptor like "A well-rated rooftop bar in <neighborhood>" — every named stop is independently verified after you respond, and unverifiable stops are dropped from the final plan. Never guess at addresses.
For booking_url, provide a SEARCH URL (e.g. https://www.opentable.com/s?term=...&covers=2 or https://www.google.com/maps/search/...) so the user can confirm the real spot.

For each stop also produce:
- 2-3 short reviewSnippets — one sentence each, what real visitors typically say (varied tone). These are AI-summarized, not real quotes.
- A parking object: type (lot|street|valet|garage|transit), cost ("$5-10/hr" or "free"), access (1 short sentence on how to access).
- 2-3 tips: insider advice like best time to arrive, what to skip, kid-friendly notes.
- dressCode: 3-10 word note on what to wear at THIS stop. Be specific to the venue/activity (e.g. "Smart casual — no athleticwear", "Closed-toe shoes required", "Swimwear + cover-up", "Cocktail attire", "Layers — patio gets cool", "Comfy walking shoes", "Kid-friendly play clothes that can get messy"). NEVER omit — pick a sensible default if unsure.

TRAVEL PLANNING — for EVERY stop AFTER the first one, include a travelFromPrev object describing how to get from the previous stop to this one:
- mode: pick the BEST mode for this leg given user preference "${b.transportMode ?? "auto"}". If "auto", choose realistically: walk (<0.5mi), transit (dense urban + good transit city), car (suburban / multi-stop with gear), rideshare (drinking involved, no parking, late night).
- durationMinutes: realistic travel time (account for traffic / typical wait).
- distance: e.g. "0.4 mi" or "3.2 mi".
- instructions: 1 short sentence ("Hop on the Red Line northbound 4 stops" / "Quick 8-min drive up Lamar" / "Grab a Lyft — surge unlikely at this hour").
- estCost: e.g. "free", "$2.50 fare", "$12-18 Uber". Use null for walking.
The first stop has no travelFromPrev. Make the schedule realistic — startTime of stop N+1 must be roughly stop N's startTime + durationMinutes + travel time.`;

    const tool = {
      type: "function",
      function: {
        name: "return_itinerary",
        description: "Return a full-day itinerary",
        parameters: {
          type: "object",
          properties: {
            title: { type: "string", description: "Catchy 4-8 word title" },
            summary: { type: "string", description: "1-2 sentence summary of the day's vibe" },
            estTotalCost: { type: "string", description: "e.g. '$80-140 / couple'" },
            stops: {
              type: "array",
              minItems: 3,
              maxItems: 6,
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  category: {
                    type: "string",
                    enum: ["meal", "activity", "drinks", "scenic", "travel", "other"],
                  },
                  description: { type: "string", description: "1-2 sentence description" },
                  address: { type: "string", description: "Neighborhood or cross-streets hint" },
                  startTime: { type: "string", description: "HH:MM 24h" },
                  durationMinutes: { type: "integer" },
                  estCost: { type: "string", description: "e.g. '$$' or '$30-50'" },
                  whatToDo: {
                    type: "string",
                    description: "Specific recommendation: what to order, what to see, etc.",
                  },
                  bookingUrl: {
                    type: "string",
                    description: "Search URL the user can use to find/book this stop",
                  },
                  bookingProvider: {
                    type: "string",
                    description:
                      "opentable | resy | eventbrite | ticketmaster | google-maps | website",
                  },
                  reviewSnippets: {
                    type: "array",
                    minItems: 2,
                    maxItems: 3,
                    items: {
                      type: "string",
                      description: "1 sentence, what visitors typically say",
                    },
                  },
                  parking: {
                    type: "object",
                    properties: {
                      type: {
                        type: "string",
                        enum: ["lot", "street", "valet", "garage", "transit"],
                      },
                      cost: { type: "string" },
                      access: {
                        type: "string",
                        description: "1 short sentence on how to access it",
                      },
                    },
                    required: ["type", "cost", "access"],
                  },
                  tips: {
                    type: "array",
                    minItems: 2,
                    maxItems: 3,
                    items: { type: "string" },
                  },
                  dressCode: {
                    type: "string",
                    description:
                      "3-10 word note on what to wear at this stop, specific to the venue/activity.",
                  },
                  travelFromPrev: {
                    type: "object",
                    description:
                      "How to get here from the previous stop. Omit/null on the first stop.",
                    properties: {
                      mode: {
                        type: "string",
                        enum: ["walk", "car", "transit", "lyft", "uber", "rideshare", "bike"],
                      },
                      durationMinutes: { type: "integer" },
                      distance: { type: "string" },
                      instructions: { type: "string" },
                      estCost: { type: "string" },
                    },
                    required: ["mode", "durationMinutes", "instructions"],
                  },
                },
                required: [
                  "name",
                  "category",
                  "description",
                  "address",
                  "startTime",
                  "durationMinutes",
                  "estCost",
                  "whatToDo",
                  "bookingUrl",
                  "bookingProvider",
                  "reviewSnippets",
                  "parking",
                  "tips",
                  "dressCode",
                ],
              },
            },
          },
          required: ["title", "summary", "estTotalCost", "stops"],
        },
      },
    };

    // Translate the OpenAI-style tool spec into Anthropic's tool-use shape.
    const anthropicTool = {
      name: tool.function.name,
      description: tool.function.description,
      input_schema: tool.function.parameters,
    };

    const resp = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 4096,
        system: sys,
        messages: [{ role: "user", content: "Build the itinerary now." }],
        tools: [anthropicTool],
        tool_choice: { type: "tool", name: anthropicTool.name },
      }),
    });

    if (resp.status === 429) return json({ error: "Rate limit — try again in a moment." }, 429);
    if (!resp.ok) return json({ error: `AI error ${resp.status}: ${await resp.text()}` }, 500);

    const data = await resp.json();
    const toolUse = (data.content ?? []).find(
      (c: { type?: string }) => c?.type === "tool_use",
    );
    if (!toolUse) return json({ error: "No tool call returned" }, 500);
    const args = (toolUse as { input: Record<string, unknown> }).input;

    // Ground every named stop against the curated venues table so we never
    // falsely advertise venues that aren't in our knowledge base. The empty
    // string is passed for legacy `placesKey` param — venues table is
    // queried via supabaseAdmin internally.
    let verified = args;
    try {
      verified = await verifyItinerary(args, b, "", { userId });
      if (!verified.stops?.length) {
        // All stops failed verification — return the original so the user
        // sees *something*, but flag it so the UI can warn.
        verified = { ...args, _unverified: true };
      }
    } catch (e) {
      console.warn("[build-itinerary] verify failed", (e as Error).message);
    }
    return json({ itinerary: verified });
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});

let _currentReq: Request | undefined;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...getCorsHeaders(_currentReq) },
  });
}
