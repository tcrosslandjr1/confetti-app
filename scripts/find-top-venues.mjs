#!/usr/bin/env node

const SEARCH_GROUPS = [
  {
    key: "dining",
    label: "Dining",
    queries: ["best restaurants", "popular brunch spots", "food halls", "chef table experiences"]
  },
  {
    key: "drinks-nightlife",
    label: "Drinks & Nightlife",
    queries: ["best cocktail bars", "rooftop bars", "hidden speakeasies", "nightclubs"]
  },
  {
    key: "live-entertainment",
    label: "Live Entertainment",
    queries: ["events tonight", "live music events", "comedy shows", "theater events", "ticketed events", "jazz clubs"]
  },
  {
    key: "arts-culture",
    label: "Arts & Culture",
    queries: ["best museums", "art galleries", "cultural exhibits", "cultural centers"]
  },
  {
    key: "immersive-experiences",
    label: "Immersive Experiences",
    queries: ["immersive experiences", "escape rooms", "interactive pop ups", "VR experiences"]
  },
  {
    key: "outdoor-nature",
    label: "Outdoor & Nature",
    queries: ["best parks", "sunset hikes", "scenic walks", "waterfront gardens"]
  },
  {
    key: "sports-recreation",
    label: "Sports & Recreation",
    queries: ["golf courses", "mini golf", "driving ranges", "indoor golf simulators", "bowling alleys", "pickleball courts", "arcades", "barcades", "skating rinks"]
  },
  {
    key: "wellness-relaxation",
    label: "Wellness & Relaxation",
    queries: ["best spas", "sauna experiences", "sound baths", "yoga studios"]
  },
  {
    key: "shopping-markets",
    label: "Shopping & Markets",
    queries: ["vintage shops", "farmers markets", "flea markets", "boutiques"]
  },
  {
    key: "family-kids",
    label: "Family & Kids",
    queries: ["kids activities", "family friendly things to do", "interactive kids museums", "aquariums"]
  },
  {
    key: "romantic-date-night",
    label: "Romantic / Date Night",
    queries: ["date night restaurants", "romantic bars", "sunset date spots", "wine bars"]
  },
  {
    key: "social-group-activities",
    label: "Social Group Activities",
    queries: ["game night venues", "board game cafes", "barcades", "karaoke bars", "trivia nights", "game bars", "paint and sip"]
  },
  {
    key: "viral-eats",
    label: "Foodie / Viral Eats",
    queries: ["viral food spots", "TikTok restaurants", "popular dessert spots", "food trucks"]
  },
  {
    key: "luxury-special-occasion",
    label: "Luxury & Special Occasion",
    queries: ["fine dining", "private dining rooms", "luxury lounges", "bottle service"]
  },
  {
    key: "learning-classes",
    label: "Learning & Classes",
    queries: ["cooking classes", "pottery classes", "mixology classes", "dance classes"]
  },
  {
    key: "festivals-seasonal",
    label: "Festivals & Seasonal Events",
    queries: ["events this weekend", "things to do this weekend", "festivals this weekend", "seasonal pop ups", "street fairs", "holiday markets", "local events"]
  },
  {
    key: "local-exploration",
    label: "Travel-Lite Local Exploration",
    queries: ["neighborhood tours", "local landmarks", "day trips", "walking tours"]
  },
  {
    key: "adult-after-dark",
    label: "Adult / After-Dark Experiences",
    queries: ["adult nightlife", "burlesque shows", "cigar lounges", "supper clubs"]
  }
];

const DEFAULT_FIELD_MASK = [
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
  "places.regularOpeningHours",
  "nextPageToken"
].join(",");

const HELP = `
Find the top popular venues for a location using Google Places Text Search.

Usage:
  GOOGLE_PLACES_API_KEY=... npm run find:venues -- --location "Washington, DC"

Options:
  --location <text>        City, neighborhood, region, or address to search in. Required.
  --limit <number>         Number of venues to export. Default: 100.
  --out <path>             Output JSON path. Default: top-venues.json.
  --min-reviews <number>   Ignore venues below this review count. Default: 25.
  --pages-per-query <n>    Fetch up to 3 pages per search query. Default: 1.
  --api-key <key>          Google Places API key. Defaults to GOOGLE_PLACES_API_KEY.
  --help                   Show this message.
`;

function parseArgs(argv) {
  const args = {
    limit: 100,
    out: "top-venues.json",
    minReviews: 25,
    pagesPerQuery: 1,
    apiKey: process.env.GOOGLE_PLACES_API_KEY
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const next = argv[index + 1];

    if (arg === "--help" || arg === "-h") {
      args.help = true;
      continue;
    }

    if (!arg.startsWith("--")) {
      continue;
    }

    const key = arg.slice(2);
    if (!next || next.startsWith("--")) {
      throw new Error(`Missing value for ${arg}`);
    }

    index += 1;
    if (key === "location") args.location = next;
    else if (key === "limit") args.limit = positiveInteger(next, "limit");
    else if (key === "out") args.out = next;
    else if (key === "min-reviews") args.minReviews = positiveInteger(next, "min-reviews");
    else if (key === "pages-per-query") args.pagesPerQuery = Math.min(3, positiveInteger(next, "pages-per-query"));
    else if (key === "api-key") args.apiKey = next;
    else throw new Error(`Unknown option: ${arg}`);
  }

  return args;
}

function positiveInteger(value, label) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isInteger(parsed) || parsed < 1) {
    throw new Error(`--${label} must be a positive integer`);
  }
  return parsed;
}

async function searchPlaces({ apiKey, textQuery, pageToken }) {
  const response = await fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask": DEFAULT_FIELD_MASK
    },
    body: JSON.stringify({
      textQuery,
      pageSize: 20,
      rankPreference: "RELEVANCE",
      ...(pageToken ? { pageToken } : {})
    })
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Google Places request failed (${response.status}): ${text}`);
  }

  return response.json();
}

function normalizePlace(place, group, query) {
  return {
    googlePlaceId: place.id,
    name: place.displayName?.text ?? "Unknown venue",
    address: place.formattedAddress ?? "",
    category: group.key,
    categoryLabel: group.label,
    rating: place.rating ?? 0,
    reviewCount: place.userRatingCount ?? 0,
    priceLevel: place.priceLevel ?? null,
    primaryType: place.primaryType ?? null,
    types: place.types ?? [],
    lat: place.location?.latitude ?? null,
    lng: place.location?.longitude ?? null,
    googleMapsUri: place.googleMapsUri ?? null,
    websiteUri: place.websiteUri ?? null,
    openNow: place.regularOpeningHours?.openNow ?? null,
    matchedQueries: [query],
    matchedCategories: [group.key]
  };
}

function mergePlace(existing, incoming) {
  const matchedQueries = new Set([...existing.matchedQueries, ...incoming.matchedQueries]);
  const matchedCategories = new Set([...existing.matchedCategories, ...incoming.matchedCategories]);
  const types = new Set([...existing.types, ...incoming.types]);

  return {
    ...existing,
    rating: Math.max(existing.rating, incoming.rating),
    reviewCount: Math.max(existing.reviewCount, incoming.reviewCount),
    priceLevel: existing.priceLevel ?? incoming.priceLevel,
    primaryType: existing.primaryType ?? incoming.primaryType,
    types: [...types],
    websiteUri: existing.websiteUri ?? incoming.websiteUri,
    openNow: existing.openNow ?? incoming.openNow,
    matchedQueries: [...matchedQueries],
    matchedCategories: [...matchedCategories]
  };
}

function scoreVenues(venues) {
  const maxReviewCount = Math.max(...venues.map((venue) => venue.reviewCount), 1);

  return venues
    .map((venue) => {
      const ratingScore = (venue.rating / 5) * 55;
      const reviewScore = (Math.log10(venue.reviewCount + 1) / Math.log10(maxReviewCount + 1)) * 35;
      const queryDiversityScore = Math.min(venue.matchedQueries.length, 4) * 1.75;
      const categoryDiversityScore = Math.min(venue.matchedCategories.length, 3) * 1.5;
      const profileScore = (venue.websiteUri ? 1.5 : 0) + (venue.googleMapsUri ? 1 : 0);
      const popularityScore = ratingScore + reviewScore + queryDiversityScore + categoryDiversityScore + profileScore;

      return {
        ...venue,
        popularityScore: Number(popularityScore.toFixed(2))
      };
    })
    .sort((a, b) => {
      if (b.popularityScore !== a.popularityScore) return b.popularityScore - a.popularityScore;
      if (b.reviewCount !== a.reviewCount) return b.reviewCount - a.reviewCount;
      return b.rating - a.rating;
    });
}

async function collectVenues(options) {
  const venuesById = new Map();

  for (const group of SEARCH_GROUPS) {
    for (const seedQuery of group.queries) {
      let pageToken;
      const textQuery = `${seedQuery} in ${options.location}`;

      for (let page = 1; page <= options.pagesPerQuery; page += 1) {
        const result = await searchPlaces({ apiKey: options.apiKey, textQuery, pageToken });
        const places = result.places ?? [];

        for (const place of places) {
          const normalized = normalizePlace(place, group, seedQuery);
          if (!normalized.googlePlaceId || normalized.reviewCount < options.minReviews) {
            continue;
          }

          const existing = venuesById.get(normalized.googlePlaceId);
          venuesById.set(
            normalized.googlePlaceId,
            existing ? mergePlace(existing, normalized) : normalized
          );
        }

        console.log(`[${group.label}] ${seedQuery}: page ${page}, ${places.length} results`);

        pageToken = result.nextPageToken;
        if (!pageToken) break;
        await sleep(2_000);
      }
    }
  }

  return [...venuesById.values()];
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

  if (!options.location) {
    throw new Error("Missing --location. Example: --location \"Washington, DC\"");
  }

  if (!options.apiKey) {
    throw new Error("Missing Google Places API key. Set GOOGLE_PLACES_API_KEY or pass --api-key.");
  }

  const venues = await collectVenues(options);
  const rankedVenues = scoreVenues(venues).slice(0, options.limit);
  const payload = {
    location: options.location,
    generatedAt: new Date().toISOString(),
    source: "Google Places Text Search",
    scoring:
      "Popularity score combines rating, review volume, query/category matches, and profile completeness.",
    count: rankedVenues.length,
    venues: rankedVenues
  };

  const fs = await import("node:fs/promises");
  const path = await import("node:path");
  const outDir = path.dirname(options.out);
  if (outDir !== ".") {
    await fs.mkdir(outDir, { recursive: true });
  }
  await fs.writeFile(options.out, `${JSON.stringify(payload, null, 2)}\n`, "utf8");

  console.log(`Wrote ${rankedVenues.length} venues to ${options.out}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
