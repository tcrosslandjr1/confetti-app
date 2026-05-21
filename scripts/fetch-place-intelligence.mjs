#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";

const GOOGLE_FIELD_MASK = [
  "places.id",
  "places.displayName",
  "places.formattedAddress",
  "places.location",
  "places.rating",
  "places.userRatingCount",
  "places.priceLevel",
  "places.types",
  "places.primaryType",
  "places.googleMapsUri",
  "places.websiteUri",
  "places.nationalPhoneNumber",
  "nextPageToken"
].join(",");

const SEARCH_LANES = [
  {
    key: "trending",
    label: "Trending Now",
    queries: [
      "trending restaurants",
      "popular bars",
      "viral food spots",
      "best new restaurants",
      "popular brunch spots",
      "rooftop bars"
    ]
  },
  {
    key: "new",
    label: "New Spots",
    queries: [
      "new restaurants",
      "new bars",
      "grand opening restaurants",
      "new brunch spots",
      "new cafes",
      "new lounges"
    ]
  },
  {
    key: "things-to-do",
    label: "Things To Do",
    queries: [
      "things to do this weekend",
      "live music",
      "comedy shows",
      "museums",
      "immersive experiences",
      "local events"
    ]
  },
  {
    key: "social-buzz",
    label: "Social Buzz",
    queries: [
      "TikTok restaurants",
      "Instagrammable restaurants",
      "Instagram spots",
      "viral dessert spots",
      "photo worthy bars",
      "aesthetic cafes"
    ]
  },
  {
    key: "local-favorites",
    label: "Locals Love",
    queries: [
      "hidden gem restaurants",
      "locals favorite bars",
      "neighborhood restaurants",
      "best local breakfast",
      "local coffee shops",
      "underrated things to do"
    ]
  }
];

const HELP = `
Fetch Confetti place intelligence for a city.

Usage:
  npm run fetch:places -- --location "Miami, FL" --out data/place-intelligence/miami-fl.json

Useful options:
  --location <text>       City or region to search. Required.
  --lat <number>          Optional latitude for event radius searches.
  --lng <number>          Optional longitude for event radius searches.
  --limit <number>        Max places/events in output. Default: 120.
  --min-reviews <number>  Minimum Google/Yelp review count. Default: 10.
  --pages-per-query <n>   Google pages per query, max 3. Default: 1.
  --out <path>            Output JSON file. Default: place-intelligence.json.
  --google-key <key>      Defaults to GOOGLE_PLACES_API_KEY.
  --yelp-key <key>        Defaults to YELP_API_KEY.
  --ticketmaster-key <key> Defaults to TICKETMASTER_API_KEY.

At least one of GOOGLE_PLACES_API_KEY, YELP_API_KEY, or TICKETMASTER_API_KEY is required.
`;

await loadEnvFile(".env");

function parseArgs(argv) {
  const args = {
    limit: 120,
    minReviews: 10,
    pagesPerQuery: 1,
    out: "place-intelligence.json",
    googleKey: process.env.GOOGLE_PLACES_API_KEY,
    yelpKey: process.env.YELP_API_KEY,
    ticketmasterKey: process.env.TICKETMASTER_API_KEY
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const next = argv[index + 1];

    if (arg === "--help" || arg === "-h") {
      args.help = true;
      continue;
    }

    if (!arg.startsWith("--")) continue;
    if (!next || next.startsWith("--")) throw new Error(`Missing value for ${arg}`);
    index += 1;

    if (arg === "--location") args.location = next;
    else if (arg === "--lat") args.lat = numberArg(next, "lat");
    else if (arg === "--lng") args.lng = numberArg(next, "lng");
    else if (arg === "--limit") args.limit = positiveInteger(next, "limit");
    else if (arg === "--min-reviews") args.minReviews = positiveInteger(next, "min-reviews");
    else if (arg === "--pages-per-query") args.pagesPerQuery = Math.min(3, positiveInteger(next, "pages-per-query"));
    else if (arg === "--out") args.out = next;
    else if (arg === "--google-key") args.googleKey = next;
    else if (arg === "--yelp-key") args.yelpKey = next;
    else if (arg === "--ticketmaster-key") args.ticketmasterKey = next;
    else throw new Error(`Unknown option: ${arg}`);
  }

  return args;
}

async function loadEnvFile(filePath) {
  try {
    const text = await fs.readFile(filePath, "utf8");
    for (const line of text.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
      const [rawKey, ...rawValueParts] = trimmed.split("=");
      const key = rawKey.trim();
      if (process.env[key]) continue;
      const value = rawValueParts.join("=").trim().replace(/^['"]|['"]$/g, "");
      process.env[key] = value;
    }
  } catch {
    // .env is optional.
  }
}

function positiveInteger(value, label) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isInteger(parsed) || parsed < 1) throw new Error(`--${label} must be a positive integer`);
  return parsed;
}

function numberArg(value, label) {
  const parsed = Number.parseFloat(value);
  if (!Number.isFinite(parsed)) throw new Error(`--${label} must be a number`);
  return parsed;
}

async function searchGooglePlaces({ apiKey, textQuery, pageToken }) {
  const response = await fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask": GOOGLE_FIELD_MASK
    },
    body: JSON.stringify({
      textQuery,
      pageSize: 20,
      rankPreference: "RELEVANCE",
      ...(pageToken ? { pageToken } : {})
    })
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`Google Places failed (${response.status}): ${text.slice(0, 500)}`);
  }

  return response.json();
}

async function fetchGoogleLane(options, lane, query) {
  const places = [];
  let pageToken;

  for (let page = 1; page <= options.pagesPerQuery; page += 1) {
    const textQuery = `${query} in ${options.location}`;
    const result = await searchGooglePlaces({ apiKey: options.googleKey, textQuery, pageToken });
    const rawPlaces = result.places ?? [];

    for (const place of rawPlaces) {
      const normalized = normalizeGooglePlace(place, lane, query, options.location);
      if (normalized.reviewCount < options.minReviews) continue;
      places.push(normalized);
    }

    console.log(`[Google:${lane.label}] ${query}: page ${page}, ${rawPlaces.length} results`);
    pageToken = result.nextPageToken;
    if (!pageToken) break;
    await sleep(2_000);
  }

  return places;
}

function normalizeGooglePlace(place, lane, query, location) {
  return {
    sourceId: place.id,
    source: "google",
    name: place.displayName?.text ?? "Unknown place",
    cityQuery: location,
    address: place.formattedAddress ?? "",
    lat: place.location?.latitude ?? null,
    lng: place.location?.longitude ?? null,
    rating: place.rating ?? 0,
    reviewCount: place.userRatingCount ?? 0,
    priceLevel: place.priceLevel ?? null,
    category: lane.key,
    categoryLabel: lane.label,
    primaryType: place.primaryType ?? null,
    types: place.types ?? [],
    phone: place.nationalPhoneNumber ?? null,
    websiteUrl: place.websiteUri ?? null,
    googleMapsUrl: place.googleMapsUri ?? null,
    sourceUrl: place.googleMapsUri ?? place.websiteUri ?? null,
    matchedQueries: [query],
    matchedLanes: [lane.key]
  };
}

async function searchYelp(options, lane, query) {
  const url = new URL("https://api.yelp.com/v3/businesses/search");
  url.searchParams.set("term", query);
  url.searchParams.set("location", options.location);
  url.searchParams.set("limit", "50");
  url.searchParams.set("sort_by", lane.key === "local-favorites" ? "rating" : "best_match");

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${options.yelpKey}`,
      Accept: "application/json"
    }
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`Yelp failed (${response.status}): ${text.slice(0, 500)}`);
  }

  const data = await response.json();
  console.log(`[Yelp:${lane.label}] ${query}: ${data.businesses?.length ?? 0} results`);

  return (data.businesses ?? [])
    .map((business) => normalizeYelpBusiness(business, lane, query, options.location))
    .filter((business) => business.reviewCount >= options.minReviews);
}

function normalizeYelpBusiness(business, lane, query, location) {
  return {
    sourceId: business.id,
    source: "yelp",
    name: business.name ?? "Unknown place",
    cityQuery: location,
    address: business.location?.display_address?.join(", ") ?? business.location?.address1 ?? "",
    city: business.location?.city ?? null,
    state: business.location?.state ?? null,
    lat: business.coordinates?.latitude ?? null,
    lng: business.coordinates?.longitude ?? null,
    rating: business.rating ?? 0,
    reviewCount: business.review_count ?? 0,
    priceLevel: business.price ?? null,
    category: lane.key,
    categoryLabel: lane.label,
    primaryType: business.categories?.[0]?.title ?? null,
    types: (business.categories ?? []).map((category) => category.title),
    phone: business.display_phone || business.phone || null,
    websiteUrl: null,
    sourceUrl: business.url ?? null,
    imageUrl: business.image_url ?? null,
    matchedQueries: [query],
    matchedLanes: [lane.key]
  };
}

async function searchTicketmaster(options) {
  const cityParts = parseCityState(options.location);
  const startDate = new Date();
  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + 14);

  const url = new URL("https://app.ticketmaster.com/discovery/v2/events.json");
  url.searchParams.set("apikey", options.ticketmasterKey);
  url.searchParams.set("city", cityParts.city);
  if (cityParts.state) url.searchParams.set("stateCode", cityParts.state);
  if (options.lat && options.lng) {
    url.searchParams.delete("city");
    url.searchParams.delete("stateCode");
    url.searchParams.set("latlong", `${options.lat},${options.lng}`);
    url.searchParams.set("radius", "25");
  }
  url.searchParams.set("startDateTime", startDate.toISOString().replace(/\.\d+Z$/, "Z"));
  url.searchParams.set("endDateTime", endDate.toISOString().replace(/\.\d+Z$/, "Z"));
  url.searchParams.set("sort", "date,asc");
  url.searchParams.set("size", "100");

  const response = await fetch(url);
  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`Ticketmaster failed (${response.status}): ${text.slice(0, 500)}`);
  }

  const data = await response.json();
  const events = data._embedded?.events ?? [];
  console.log(`[Ticketmaster] next 14 days: ${events.length} results`);
  return events.map((event) => normalizeTicketmasterEvent(event, options.location));
}

function normalizeTicketmasterEvent(event, location) {
  const venue = event._embedded?.venues?.[0] ?? {};
  const classification = event.classifications?.[0] ?? {};
  const image = event.images?.find((item) => item.ratio === "16_9" && item.width >= 640) ?? event.images?.[0];
  const price = event.priceRanges?.[0];

  return {
    sourceId: event.id,
    source: "ticketmaster",
    name: event.name ?? "Untitled event",
    cityQuery: location,
    address: [venue.address?.line1, venue.city?.name, venue.state?.stateCode].filter(Boolean).join(", "),
    city: venue.city?.name ?? null,
    state: venue.state?.stateCode ?? null,
    lat: venue.location?.latitude ? Number(venue.location.latitude) : null,
    lng: venue.location?.longitude ? Number(venue.location.longitude) : null,
    rating: 0,
    reviewCount: 0,
    priceLevel: price ? `$${Math.round(price.min)}-${Math.round(price.max)}` : null,
    category: "things-to-do",
    categoryLabel: "Things To Do",
    primaryType: classification.genre?.name ?? classification.segment?.name ?? "Event",
    types: [classification.segment?.name, classification.genre?.name, classification.subGenre?.name].filter(Boolean),
    phone: null,
    websiteUrl: event.url ?? null,
    sourceUrl: event.url ?? null,
    imageUrl: image?.url ?? null,
    eventDate: event.dates?.start?.localDate ?? null,
    eventTime: event.dates?.start?.localTime ?? null,
    matchedQueries: ["ticketed events"],
    matchedLanes: ["things-to-do"]
  };
}

function parseCityState(location) {
  const [city, state] = location.split(",").map((part) => part.trim());
  return { city, state };
}

function mergePlaces(records) {
  const byKey = new Map();

  for (const record of records) {
    const key = matchKey(record);
    const existing = byKey.get(key);
    if (!existing) {
      byKey.set(key, record);
      continue;
    }

    byKey.set(key, {
      ...existing,
      ...emptySafeMerge(existing, record),
      rating: Math.max(existing.rating ?? 0, record.rating ?? 0),
      reviewCount: Math.max(existing.reviewCount ?? 0, record.reviewCount ?? 0),
      matchedQueries: unique([...(existing.matchedQueries ?? []), ...(record.matchedQueries ?? [])]),
      matchedLanes: unique([...(existing.matchedLanes ?? []), ...(record.matchedLanes ?? [])]),
      types: unique([...(existing.types ?? []), ...(record.types ?? [])]),
      sources: unique([...(existing.sources ?? [existing.source]), record.source])
    });
  }

  return [...byKey.values()];
}

function emptySafeMerge(existing, incoming) {
  const merged = {};
  for (const [key, value] of Object.entries(incoming)) {
    if (existing[key] === null || existing[key] === undefined || existing[key] === "" || existing[key]?.length === 0) {
      merged[key] = value;
    }
  }
  return merged;
}

function matchKey(record) {
  if (record.source === "ticketmaster") return `event:${record.sourceId}`;
  const name = cleanText(record.name);
  const address = cleanText(record.address).slice(0, 32);
  return `${name}:${address}`;
}

function cleanText(value) {
  return String(value ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function enrichAndScore(records) {
  const maxReviewCount = Math.max(...records.map((record) => record.reviewCount ?? 0), 1);

  return records.map((record) => {
    const lanes = new Set(record.matchedLanes ?? []);
    const ratingScore = ((record.rating ?? 0) / 5) * 22;
    const reviewScore = (Math.log10((record.reviewCount ?? 0) + 1) / Math.log10(maxReviewCount + 1)) * 22;
    const sourceScore = Math.min(record.sources?.length ?? 1, 3) * 5;
    const queryScore = Math.min(record.matchedQueries?.length ?? 1, 6) * 2;
    const profileScore = (record.websiteUrl ? 3 : 0) + (record.sourceUrl ? 2 : 0) + (record.imageUrl ? 2 : 0);
    const eventScore = record.source === "ticketmaster" ? 18 : 0;

    const socialTrendScore = scoreLane(record, lanes, "social-buzz", 25) + keywordScore(record, [
      "tiktok",
      "instagram",
      "viral",
      "photo",
      "aesthetic",
      "rooftop"
    ], 2);

    const freshnessScore = scoreLane(record, lanes, "new", 25) + keywordScore(record, [
      "new",
      "grand opening",
      "opening",
      "pop up"
    ], 3);

    const localLoveScore = scoreLane(record, lanes, "local-favorites", 25) + keywordScore(record, [
      "hidden",
      "local",
      "neighborhood",
      "underrated",
      "breakfast",
      "coffee"
    ], 2);

    const popularityScore = ratingScore + reviewScore + sourceScore + queryScore + profileScore + eventScore;
    const confettiFitScore = popularityScore + Math.max(socialTrendScore, freshnessScore, localLoveScore) * 0.55;

    return {
      id: stableId(record),
      ...record,
      sources: record.sources ?? [record.source],
      isTrending: lanes.has("trending") || socialTrendScore >= 12,
      isNewPlace: lanes.has("new") || freshnessScore >= 12,
      isLowKeyLocalFavorite: lanes.has("local-favorites") || localLoveScore >= 12,
      socialTrendScore: round(socialTrendScore),
      freshnessScore: round(freshnessScore),
      localLoveScore: round(localLoveScore),
      popularityScore: round(popularityScore),
      confettiFitScore: round(confettiFitScore)
    };
  });
}

function scoreLane(record, lanes, laneKey, max) {
  if (!lanes.has(laneKey)) return 0;
  return Math.min(max, 12 + Math.min(record.matchedQueries?.length ?? 1, 5) * 2.5);
}

function keywordScore(record, keywords, weight) {
  const haystack = [
    record.name,
    record.primaryType,
    ...(record.types ?? []),
    ...(record.matchedQueries ?? [])
  ].join(" ").toLowerCase();

  return keywords.reduce((sum, keyword) => sum + (haystack.includes(keyword) ? weight : 0), 0);
}

function stableId(record) {
  return `${record.source}_${cleanText(record.sourceId || record.name).replaceAll(" ", "_")}`;
}

function round(value) {
  return Number(value.toFixed(2));
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function summarize(records) {
  return {
    trending: records.filter((record) => record.isTrending).length,
    newPlaces: records.filter((record) => record.isNewPlace).length,
    localFavorites: records.filter((record) => record.isLowKeyLocalFavorite).length,
    thingsToDo: records.filter((record) => record.category === "things-to-do").length,
    socialBuzz: records.filter((record) => record.socialTrendScore > 0).length
  };
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  const options = parseArgs(process.argv.slice(2));

  if (options.help) {
    console.log(HELP.trim());
    return;
  }

  if (!options.location) throw new Error("Missing --location. Example: --location \"Miami, FL\"");
  if (!options.googleKey && !options.yelpKey && !options.ticketmasterKey) {
    throw new Error("Add at least one key: GOOGLE_PLACES_API_KEY, YELP_API_KEY, or TICKETMASTER_API_KEY.");
  }

  const collected = [];

  for (const lane of SEARCH_LANES) {
    for (const query of lane.queries) {
      if (options.googleKey) {
        collected.push(...(await fetchGoogleLane(options, lane, query)));
      }

      if (options.yelpKey && lane.key !== "things-to-do") {
        collected.push(...(await searchYelp(options, lane, query)));
      }
    }
  }

  if (options.ticketmasterKey) {
    collected.push(...(await searchTicketmaster(options)));
  }

  const ranked = enrichAndScore(mergePlaces(collected))
    .sort((a, b) => b.confettiFitScore - a.confettiFitScore)
    .slice(0, options.limit);

  const payload = {
    location: options.location,
    generatedAt: new Date().toISOString(),
    sourcesUsed: {
      googlePlaces: Boolean(options.googleKey),
      yelp: Boolean(options.yelpKey),
      ticketmaster: Boolean(options.ticketmasterKey)
    },
    summary: summarize(ranked),
    scoring:
      "Confetti fit combines ratings, review volume, source/query diversity, profile completeness, event freshness, social-buzz queries, new-place queries, and local-favorite queries.",
    count: ranked.length,
    places: ranked
  };

  const outDir = path.dirname(options.out);
  if (outDir !== ".") await fs.mkdir(outDir, { recursive: true });
  await fs.writeFile(options.out, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  console.log(`Wrote ${ranked.length} places to ${options.out}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
