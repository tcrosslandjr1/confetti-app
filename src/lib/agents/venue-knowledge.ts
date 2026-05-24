/**
 * Confetti Venue Knowledge Base
 * Auto-generated from Excel guides — DO NOT EDIT MANUALLY
 * Generated: 2026-05-24T11:30:50.747200
 * Total: 1074 venues across 20 cities
 *
 * This module provides the AI agents with local venue intelligence.
 * The agents use this as a FIRST source before hitting Google/Foursquare APIs.
 */

export interface VenueKnowledge {
  id: string;
  name: string;
  slug: string;
  city: string;
  state: string;
  neighborhood: string;
  address: string;
  lat: number;
  lng: number;
  cuisine: string;
  cuisineTags: string[];
  vibeTags: string[];
  occasionTags: string[];
  price: string;
  priceLevel: number;
  vibeNotes: string;
  sourceCredit: string;
}

/** Cities with curated local knowledge */
export const COVERED_CITIES = ["Atlanta", "Austin", "Boston", "California", "Chicago", "Cincinnati", "Denver", "Fort Lauderdale", "Maryland", "Miami", "Nashville", "New Jersey", "New Orleans", "New York", "Philadelphia", "San Francisco", "Seattle", "Toronto", "Virginia", "Washington"] as const;

/** City venue counts */
export const CITY_VENUE_COUNTS: Record<string, number> = {
  "Atlanta": 41,
  "Austin": 49,
  "Boston": 47,
  "California": 53,
  "Chicago": 52,
  "Cincinnati": 31,
  "Denver": 49,
  "Fort Lauderdale": 42,
  "Maryland": 51,
  "Miami": 78,
  "Nashville": 45,
  "New Jersey": 46,
  "New Orleans": 48,
  "New York": 81,
  "Philadelphia": 50,
  "San Francisco": 42,
  "Seattle": 49,
  "Toronto": 49,
  "Virginia": 47,
  "Washington": 124
};

/**
 * Query the local venue knowledge base.
 * Used by venue-discovery.ts BEFORE hitting external APIs.
 */
export function queryLocalVenues(params: {
  city: string;
  occasion?: string;
  vibes?: string[];
  priceLevel?: number;
  cuisine?: string;
  limit?: number;
}): VenueKnowledge[] {
  let results = VENUE_KNOWLEDGE.filter(v =>
    v.city.toLowerCase() === params.city.toLowerCase()
  );

  if (params.occasion) {
    const occ = params.occasion.toLowerCase();
    const withOccasion = results.filter(v =>
      v.occasionTags.some(t => t.includes(occ) || occ.includes(t))
    );
    if (withOccasion.length > 0) results = withOccasion;
  }

  if (params.vibes?.length) {
    const vibeSet = new Set(params.vibes.map(v => v.toLowerCase()));
    results.sort((a, b) => {
      const aMatch = a.vibeTags.filter(t => vibeSet.has(t)).length;
      const bMatch = b.vibeTags.filter(t => vibeSet.has(t)).length;
      return bMatch - aMatch;
    });
  }

  if (params.priceLevel) {
    results = results.filter(v => v.priceLevel <= params.priceLevel!);
  }

  if (params.cuisine) {
    const c = params.cuisine.toLowerCase();
    const withCuisine = results.filter(v =>
      v.cuisine.toLowerCase().includes(c) ||
      v.cuisineTags.some(t => t.toLowerCase().includes(c))
    );
    if (withCuisine.length > 0) results = withCuisine;
  }

  return results.slice(0, params.limit ?? 15);
}

/**
 * Check if we have local knowledge for a city.
 * If true, agents should prefer local data over API-only results.
 */
export function hasLocalKnowledge(city: string): boolean {
  return VENUE_KNOWLEDGE.some(v => v.city.toLowerCase() === city.toLowerCase());
}

/** Full venue knowledge array */
export const VENUE_KNOWLEDGE: VenueKnowledge[] = [
  {
    "id": "1124d448-6e2b-b94c-3826-a2f15f99713d",
    "name": "A Mano",
    "slug": "a-mano",
    "city": "Atlanta",
    "state": "GA",
    "neighborhood": "Old Fourth Ward",
    "address": "484 John Wesley Dobbs Ave",
    "lat": 33.749,
    "lng": -84.388,
    "cuisine": "Italian",
    "cuisineTags": [
      "Italian"
    ],
    "vibeTags": [
      "intimate"
    ],
    "occasionTags": [
      "date-night"
    ],
    "price": "$$$",
    "priceLevel": 3,
    "vibeNotes": "Handmade pasta; open kitchen; warm & intimate; James Beard semi-finalist",
    "sourceCredit": "TikTok @bswankk"
  },
  {
    "id": "f07f352c-154c-faf2-3f85-80de4be026f3",
    "name": "Boccalupo",
    "slug": "boccalupo",
    "city": "Atlanta",
    "state": "GA",
    "neighborhood": "Inman Park",
    "address": "753 Edgewood Ave",
    "lat": 33.749,
    "lng": -84.388,
    "cuisine": "Italian",
    "cuisineTags": [
      "Italian"
    ],
    "vibeTags": [
      "cozy",
      "intimate"
    ],
    "occasionTags": [
      "date-night"
    ],
    "price": "$$$",
    "priceLevel": 3,
    "vibeNotes": "Cozy Italian; house-made pasta; intimate 30 seats; neighborhood gem",
    "sourceCredit": "Instagram"
  },
  {
    "id": "f7a32916-6847-2d2a-30ed-e387a452c738",
    "name": "Marcel",
    "slug": "marcel",
    "city": "Atlanta",
    "state": "GA",
    "neighborhood": "Westside",
    "address": "1170 Howell Mill Rd",
    "lat": 33.749,
    "lng": -84.388,
    "cuisine": "Steakhouse",
    "cuisineTags": [
      "Steakhouse"
    ],
    "vibeTags": [],
    "occasionTags": [
      "date-night"
    ],
    "price": "$$$$",
    "priceLevel": 4,
    "vibeNotes": "Art Deco steakhouse; tableside service; live jazz; sophisticated",
    "sourceCredit": "Resy"
  },
  {
    "id": "479ae12e-4e4b-be3e-8138-c75c505e4731",
    "name": "Delbar",
    "slug": "delbar",
    "city": "Atlanta",
    "state": "GA",
    "neighborhood": "Inman Park",
    "address": "870 Inman Village Pkwy",
    "lat": 33.749,
    "lng": -84.388,
    "cuisine": "Persian",
    "cuisineTags": [
      "Persian"
    ],
    "vibeTags": [],
    "occasionTags": [
      "date-night"
    ],
    "price": "$$$",
    "priceLevel": 3,
    "vibeNotes": "Modern Persian; charcoal-grilled kebabs; stunning tiled interior",
    "sourceCredit": "TikTok"
  },
  {
    "id": "dd790493-0200-bff9-5227-5d392c978e29",
    "name": "Kinjo Room",
    "slug": "kinjo-room",
    "city": "Atlanta",
    "state": "GA",
    "neighborhood": "Buckhead",
    "address": "950 W Peachtree St NW",
    "lat": 33.749,
    "lng": -84.388,
    "cuisine": "Japanese",
    "cuisineTags": [
      "Japanese"
    ],
    "vibeTags": [
      "intimate"
    ],
    "occasionTags": [
      "date-night"
    ],
    "price": "$$$$",
    "priceLevel": 4,
    "vibeNotes": "Omakase counter; intimate & exclusive; chef's experience only",
    "sourceCredit": "Resy"
  },
  {
    "id": "9b56407d-0459-af6f-7544-ef4804171d0b",
    "name": "Bar Margot",
    "slug": "bar-margot",
    "city": "Atlanta",
    "state": "GA",
    "neighborhood": "Midtown",
    "address": "75 14th St NE (Four Seasons)",
    "lat": 33.749,
    "lng": -84.388,
    "cuisine": "French",
    "cuisineTags": [
      "French"
    ],
    "vibeTags": [
      "cocktails"
    ],
    "occasionTags": [
      "date-night"
    ],
    "price": "$$$",
    "priceLevel": 3,
    "vibeNotes": "Four Seasons elegance; French brasserie menu; cocktail garden",
    "sourceCredit": "Instagram"
  },
  {
    "id": "3eed6564-d538-c33d-8c77-9e8b3bcbcc98",
    "name": "Aziza",
    "slug": "aziza",
    "city": "Atlanta",
    "state": "GA",
    "neighborhood": "Inman Park",
    "address": "826 Ralph McGill Blvd",
    "lat": 33.749,
    "lng": -84.388,
    "cuisine": "Ethiopian Fine Dining",
    "cuisineTags": [
      "Ethiopian Fine Dining"
    ],
    "vibeTags": [],
    "occasionTags": [
      "date-night"
    ],
    "price": "$$$$",
    "priceLevel": 4,
    "vibeNotes": "Tasting menu; injera service; award-winning Ethiopian elevated",
    "sourceCredit": "TikTok @bswankk"
  },
  {
    "id": "206776c5-5d48-1577-6a13-129a67032670",
    "name": "Ponce City Market",
    "slug": "ponce-city-market",
    "city": "Atlanta",
    "state": "GA",
    "neighborhood": "Old Fourth Ward",
    "address": "675 Ponce De Leon Ave",
    "lat": 33.749,
    "lng": -84.388,
    "cuisine": "Food Hall",
    "cuisineTags": [
      "Food Hall"
    ],
    "vibeTags": [
      "rooftop"
    ],
    "occasionTags": [
      "group-night-out"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Multi-vendor food hall; rooftop amusement park; drinks everywhere",
    "sourceCredit": "TikTok"
  },
  {
    "id": "43aa74c6-fb3d-ce64-4bb6-5226c80c81b7",
    "name": "Spaceman",
    "slug": "spaceman",
    "city": "Atlanta",
    "state": "GA",
    "neighborhood": "East Atlanta",
    "address": "1035 Memorial Dr SE",
    "lat": 33.749,
    "lng": -84.388,
    "cuisine": "Bar / Arcade",
    "cuisineTags": [
      "Bar",
      "Arcade"
    ],
    "vibeTags": [
      "cocktails"
    ],
    "occasionTags": [
      "group-night-out"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Pinball & arcade; craft cocktails; unpretentious group hangout",
    "sourceCredit": "Instagram"
  },
  {
    "id": "a1eea01d-522a-e834-937c-b862754fe00b",
    "name": "MCK Restaurant & Bar",
    "slug": "mck-restaurant-bar",
    "city": "Atlanta",
    "state": "GA",
    "neighborhood": "West End",
    "address": "415 Memorial Dr SE",
    "lat": 33.749,
    "lng": -84.388,
    "cuisine": "Southern",
    "cuisineTags": [
      "Southern"
    ],
    "vibeTags": [
      "live-music",
      "cocktails"
    ],
    "occasionTags": [
      "group-night-out"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Black-owned; soul food & cocktails; live music nights; big group energy",
    "sourceCredit": "TikTok @bswankk"
  },
  {
    "id": "7ce051c5-1084-8388-cc55-7bda3e82d1bd",
    "name": "Lo Kee",
    "slug": "lo-kee",
    "city": "Atlanta",
    "state": "GA",
    "neighborhood": "Midtown",
    "address": "1100 Peachtree St NE",
    "lat": 33.749,
    "lng": -84.388,
    "cuisine": "Asian-Fusion Bar",
    "cuisineTags": [
      "Asian-Fusion Bar"
    ],
    "vibeTags": [
      "trendy",
      "cocktails",
      "late-night"
    ],
    "occasionTags": [
      "group-night-out"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Late-night bao buns & cocktails; neon vibes; trendy & packed",
    "sourceCredit": "Instagram"
  },
  {
    "id": "0e8e73a1-2bc4-b88f-a84b-9a0904c7be9b",
    "name": "The Painted Pin",
    "slug": "the-painted-pin",
    "city": "Atlanta",
    "state": "GA",
    "neighborhood": "Buckhead",
    "address": "737 Miami Cir NE",
    "lat": 33.749,
    "lng": -84.388,
    "cuisine": "Bowling / Bar",
    "cuisineTags": [
      "Bowling",
      "Bar"
    ],
    "vibeTags": [
      "upscale",
      "cocktails"
    ],
    "occasionTags": [
      "group-night-out"
    ],
    "price": "$$$",
    "priceLevel": 3,
    "vibeNotes": "Upscale bowling; craft cocktails; games; polished group night",
    "sourceCredit": "Yelp"
  },
  {
    "id": "c224a84f-bab5-7d0f-e509-89fc39a23f62",
    "name": "Monday Night Garage",
    "slug": "monday-night-garage",
    "city": "Atlanta",
    "state": "GA",
    "neighborhood": "Westside",
    "address": "933 Lee St SW",
    "lat": 33.749,
    "lng": -84.388,
    "cuisine": "Brewery",
    "cuisineTags": [
      "Brewery"
    ],
    "vibeTags": [],
    "occasionTags": [
      "group-night-out"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Huge taproom in a converted garage; food trucks; group-friendly",
    "sourceCredit": "TikTok"
  },
  {
    "id": "2c7dabd9-1b13-b668-9c41-f80fc6be6363",
    "name": "Ormsby's",
    "slug": "ormsby-s",
    "city": "Atlanta",
    "state": "GA",
    "neighborhood": "Westside",
    "address": "1170 Howell Mill Rd",
    "lat": 33.749,
    "lng": -84.388,
    "cuisine": "Tavern / Games",
    "cuisineTags": [
      "Tavern",
      "Games"
    ],
    "vibeTags": [
      "fun"
    ],
    "occasionTags": [
      "group-night-out"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Bocce, shuffleboard, darts; full bar & kitchen; old-school fun",
    "sourceCredit": "Instagram"
  },
  {
    "id": "f5ba7d91-56a1-a6e7-c9f3-f1151775681a",
    "name": "KR Steakbar",
    "slug": "kr-steakbar",
    "city": "Atlanta",
    "state": "GA",
    "neighborhood": "Buckhead",
    "address": "349 Peachtree Hills Ave NE",
    "lat": 33.749,
    "lng": -84.388,
    "cuisine": "Steakhouse",
    "cuisineTags": [
      "Steakhouse"
    ],
    "vibeTags": [
      "upscale",
      "intimate",
      "wine"
    ],
    "occasionTags": [
      "in-laws"
    ],
    "price": "$$$$",
    "priceLevel": 4,
    "vibeNotes": "Kevin Rathbun's; intimate & upscale; perfect steak; wine cellar",
    "sourceCredit": "Resy"
  },
  {
    "id": "44a52343-1793-da2a-b044-aa6c27972f78",
    "name": "Canoe",
    "slug": "canoe",
    "city": "Atlanta",
    "state": "GA",
    "neighborhood": "Vinings",
    "address": "4199 Paces Ferry Rd",
    "lat": 33.749,
    "lng": -84.388,
    "cuisine": "Southern Fine Dining",
    "cuisineTags": [
      "Southern Fine Dining"
    ],
    "vibeTags": [],
    "occasionTags": [
      "in-laws"
    ],
    "price": "$$$$",
    "priceLevel": 4,
    "vibeNotes": "Riverside setting; refined Southern menu; garden terrace",
    "sourceCredit": "OpenTable"
  },
  {
    "id": "0bdecfda-6da4-807e-7443-c190400ec91c",
    "name": "Aria",
    "slug": "aria",
    "city": "Atlanta",
    "state": "GA",
    "neighborhood": "Buckhead",
    "address": "490 E Paces Ferry Rd NE",
    "lat": 33.749,
    "lng": -84.388,
    "cuisine": "New American",
    "cuisineTags": [
      "New American"
    ],
    "vibeTags": [
      "elegant",
      "wine"
    ],
    "occasionTags": [
      "in-laws"
    ],
    "price": "$$$$",
    "priceLevel": 4,
    "vibeNotes": "Elegant townhouse setting; wine-pairing dinners; sophisticated",
    "sourceCredit": "Resy"
  },
  {
    "id": "b419a526-23af-e8b8-ad52-b402c93eaf25",
    "name": "Umi",
    "slug": "umi",
    "city": "Atlanta",
    "state": "GA",
    "neighborhood": "Buckhead",
    "address": "3050 Peachtree Rd NW",
    "lat": 33.749,
    "lng": -84.388,
    "cuisine": "Sushi / Japanese",
    "cuisineTags": [
      "Sushi",
      "Japanese"
    ],
    "vibeTags": [],
    "occasionTags": [
      "in-laws"
    ],
    "price": "$$$$",
    "priceLevel": 4,
    "vibeNotes": "Top-tier sushi; omakase available; sleek & refined",
    "sourceCredit": "Instagram"
  },
  {
    "id": "d7cfd2e2-ae7b-1521-b98b-baf0c9a5120d",
    "name": "Bacchanalia",
    "slug": "bacchanalia",
    "city": "Atlanta",
    "state": "GA",
    "neighborhood": "Westside",
    "address": "1198 Howell Mill Rd",
    "lat": 33.749,
    "lng": -84.388,
    "cuisine": "New American",
    "cuisineTags": [
      "New American"
    ],
    "vibeTags": [
      "elegant"
    ],
    "occasionTags": [
      "in-laws"
    ],
    "price": "$$$$",
    "priceLevel": 4,
    "vibeNotes": "Atlanta's longest-running fine dining; tasting menu; elegant",
    "sourceCredit": "Resy"
  },
  {
    "id": "10e8fa74-5b8b-880c-c00e-b401622a2ba6",
    "name": "Utopia Lounge",
    "slug": "utopia-lounge",
    "city": "Atlanta",
    "state": "GA",
    "neighborhood": "Midtown",
    "address": "1071 Spring St NW",
    "lat": 33.749,
    "lng": -84.388,
    "cuisine": "Lounge",
    "cuisineTags": [
      "Lounge"
    ],
    "vibeTags": [],
    "occasionTags": [
      "girls-night"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Black-owned lounge; bottle service; R&B vibes; girls-night essential",
    "sourceCredit": "TikTok @bswankk"
  },
  {
    "id": "7ee70d63-22d3-958e-ef4c-a176b202f7b8",
    "name": "Pinky Promise",
    "slug": "pinky-promise",
    "city": "Atlanta",
    "state": "GA",
    "neighborhood": "East Atlanta",
    "address": "Various pop-ups",
    "lat": 33.749,
    "lng": -84.388,
    "cuisine": "Pop-up Bar",
    "cuisineTags": [
      "Pop-up Bar"
    ],
    "vibeTags": [
      "cocktails",
      "instagrammable"
    ],
    "occasionTags": [
      "girls-night"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Pink-themed pop-up bar; specialty cocktails; Instagrammable",
    "sourceCredit": "Instagram"
  },
  {
    "id": "88520fce-c497-02b9-d862-0db27419b0d1",
    "name": "Gypsy Kitchen",
    "slug": "gypsy-kitchen",
    "city": "Atlanta",
    "state": "GA",
    "neighborhood": "Buckhead",
    "address": "3035 Peachtree Rd NE",
    "lat": 33.749,
    "lng": -84.388,
    "cuisine": "Mediterranean",
    "cuisineTags": [
      "Mediterranean"
    ],
    "vibeTags": [
      "patio",
      "late-night"
    ],
    "occasionTags": [
      "girls-night"
    ],
    "price": "$$$",
    "priceLevel": 3,
    "vibeNotes": "Spanish-inspired tapas; sangria; lively patio; sharing plates",
    "sourceCredit": "Resy"
  },
  {
    "id": "d5469886-ccee-0eed-0ba3-b255d86578d3",
    "name": "Red Phone Booth",
    "slug": "red-phone-booth",
    "city": "Atlanta",
    "state": "GA",
    "neighborhood": "Downtown",
    "address": "17 Andrew Young Intl Blvd",
    "lat": 33.749,
    "lng": -84.388,
    "cuisine": "Speakeasy",
    "cuisineTags": [
      "Speakeasy"
    ],
    "vibeTags": [
      "cocktails"
    ],
    "occasionTags": [
      "girls-night"
    ],
    "price": "$$$",
    "priceLevel": 3,
    "vibeNotes": "Enter through a phone booth; prohibition cocktails; secret & swanky",
    "sourceCredit": "TikTok"
  },
  {
    "id": "93ec6673-978e-90c3-8a7b-0bd07e5302d0",
    "name": "Eleven45 Lounge",
    "slug": "eleven45-lounge",
    "city": "Atlanta",
    "state": "GA",
    "neighborhood": "Midtown",
    "address": "1145 Peachtree St NE",
    "lat": 33.749,
    "lng": -84.388,
    "cuisine": "Lounge",
    "cuisineTags": [
      "Lounge"
    ],
    "vibeTags": [
      "upscale",
      "dj",
      "cocktails"
    ],
    "occasionTags": [
      "girls-night"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "DJ nights; cocktails; upscale casual; cute girls-night crowd",
    "sourceCredit": "Instagram"
  },
  {
    "id": "714d501a-bb09-df6b-2bce-f276b21e9225",
    "name": "Ladybird Grove & Mess Hall",
    "slug": "ladybird-grove-mess-hall",
    "city": "Atlanta",
    "state": "GA",
    "neighborhood": "Old Fourth Ward",
    "address": "684 John Wesley Dobbs Ave",
    "lat": 33.749,
    "lng": -84.388,
    "cuisine": "Bar / Garden",
    "cuisineTags": [
      "Bar",
      "Garden"
    ],
    "vibeTags": [
      "chill",
      "outdoor",
      "patio",
      "cocktails"
    ],
    "occasionTags": [
      "girls-night"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Treehouse patio; cocktails; chill outdoor vibes",
    "sourceCredit": "Yelp"
  },
  {
    "id": "b774b863-7a03-5baf-1fef-39eeff1e985b",
    "name": "Staplehouse",
    "slug": "staplehouse",
    "city": "Atlanta",
    "state": "GA",
    "neighborhood": "Old Fourth Ward",
    "address": "541 Edgewood Ave",
    "lat": 33.749,
    "lng": -84.388,
    "cuisine": "New American",
    "cuisineTags": [
      "New American"
    ],
    "vibeTags": [],
    "occasionTags": [
      "guys-night"
    ],
    "price": "$$$$",
    "priceLevel": 4,
    "vibeNotes": "Tasting menu; James Beard winner; serious food; boys fine dining",
    "sourceCredit": "Resy"
  },
  {
    "id": "76ee853e-56d4-8b86-da9c-4f673ce61529",
    "name": "Block & Drum",
    "slug": "block-drum",
    "city": "Atlanta",
    "state": "GA",
    "neighborhood": "Westside",
    "address": "950 W Marietta St",
    "lat": 33.749,
    "lng": -84.388,
    "cuisine": "Bowling / BBQ",
    "cuisineTags": [
      "Bowling",
      "BBQ"
    ],
    "vibeTags": [],
    "occasionTags": [
      "guys-night"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Bowling + BBQ + bar; craft beer; laid-back competitive night",
    "sourceCredit": "TikTok"
  },
  {
    "id": "31556f2a-4d52-5f26-0c6a-843a08bb9ac1",
    "name": "Ranger Station",
    "slug": "ranger-station",
    "city": "Atlanta",
    "state": "GA",
    "neighborhood": "Westside",
    "address": "969 Marietta St NW",
    "lat": 33.749,
    "lng": -84.388,
    "cuisine": "Bourbon Bar",
    "cuisineTags": [
      "Bourbon Bar"
    ],
    "vibeTags": [
      "patio"
    ],
    "occasionTags": [
      "guys-night"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Bourbon focus; leather & wood; cigars on patio; guys' retreat",
    "sourceCredit": "Instagram"
  },
  {
    "id": "21a3d9c0-e5e8-6166-59e9-6dbe772ed6a2",
    "name": "Laughing Skull",
    "slug": "laughing-skull",
    "city": "Atlanta",
    "state": "GA",
    "neighborhood": "Midtown",
    "address": "878 Peachtree St NE",
    "lat": 33.749,
    "lng": -84.388,
    "cuisine": "Comedy Club",
    "cuisineTags": [
      "Comedy Club"
    ],
    "vibeTags": [
      "intimate"
    ],
    "occasionTags": [
      "guys-night"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Intimate comedy club; up-and-coming comics; cheap drinks",
    "sourceCredit": "Yelp"
  },
  {
    "id": "6bc02da9-cbdf-5c0f-4383-e7f8ca5c929f",
    "name": "The Punchline",
    "slug": "the-punchline",
    "city": "Atlanta",
    "state": "GA",
    "neighborhood": "Sandy Springs",
    "address": "6120 Roswell Rd",
    "lat": 33.749,
    "lng": -84.388,
    "cuisine": "Comedy Club",
    "cuisineTags": [
      "Comedy Club"
    ],
    "vibeTags": [],
    "occasionTags": [
      "guys-night"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Legendary comedy club; national headliners; dinner & show",
    "sourceCredit": "TikTok"
  },
  {
    "id": "b0a6d218-e485-4c6b-d871-cf340f581fa5",
    "name": "MJQ",
    "slug": "mjq",
    "city": "Atlanta",
    "state": "GA",
    "neighborhood": "Little Five Points",
    "address": "736 Ponce De Leon Ave",
    "lat": 33.749,
    "lng": -84.388,
    "cuisine": "Underground Club",
    "cuisineTags": [
      "Underground Club"
    ],
    "vibeTags": [
      "dance",
      "late-night"
    ],
    "occasionTags": [
      "guys-night"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Underground dance club; hip-hop & house; raw late-night energy",
    "sourceCredit": "Instagram"
  },
  {
    "id": "f3a19ef9-424a-8f13-4c68-9afb410fd9b0",
    "name": "Tongue & Groove",
    "slug": "tongue-groove",
    "city": "Atlanta",
    "state": "GA",
    "neighborhood": "Buckhead",
    "address": "3055 Peachtree Rd NE",
    "lat": 33.749,
    "lng": -84.388,
    "cuisine": "Nightclub",
    "cuisineTags": [
      "Nightclub"
    ],
    "vibeTags": [],
    "occasionTags": [
      "bachelor"
    ],
    "price": "$$$",
    "priceLevel": 3,
    "vibeNotes": "Atlanta's premier nightclub; bottle service; bachelor party packages",
    "sourceCredit": "TikTok"
  },
  {
    "id": "898d8381-06c1-9370-2088-4aad8bd41488",
    "name": "Gold Room",
    "slug": "gold-room",
    "city": "Atlanta",
    "state": "GA",
    "neighborhood": "Buckhead",
    "address": "2416 Piedmont Rd NE",
    "lat": 33.749,
    "lng": -84.388,
    "cuisine": "Nightclub",
    "cuisineTags": [
      "Nightclub"
    ],
    "vibeTags": [
      "upscale"
    ],
    "occasionTags": [
      "bachelor"
    ],
    "price": "$$$",
    "priceLevel": 3,
    "vibeNotes": "Upscale club; hip-hop & EDM; VIP sections",
    "sourceCredit": "Instagram"
  },
  {
    "id": "996e64ec-ce4a-46d8-5aac-55cf2b6fcb42",
    "name": "Topgolf Midtown",
    "slug": "topgolf-midtown",
    "city": "Atlanta",
    "state": "GA",
    "neighborhood": "Midtown",
    "address": "1600 Ellsworth Industrial Blvd",
    "lat": 33.749,
    "lng": -84.388,
    "cuisine": "Entertainment",
    "cuisineTags": [
      "Entertainment"
    ],
    "vibeTags": [],
    "occasionTags": [
      "bachelor"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Driving range + bar; group competition; bachelor pre-game",
    "sourceCredit": "Yelp"
  },
  {
    "id": "7ce2fb30-9f9b-acc9-8d81-671958afae0a",
    "name": "Andretti Indoor Karting",
    "slug": "andretti-indoor-karting",
    "city": "Atlanta",
    "state": "GA",
    "neighborhood": "Marietta",
    "address": "1255 Roswell Rd",
    "lat": 33.749,
    "lng": -84.388,
    "cuisine": "Go-Karts / Arcade",
    "cuisineTags": [
      "Go-Karts",
      "Arcade"
    ],
    "vibeTags": [],
    "occasionTags": [
      "bachelor"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "High-speed go-karts; arcade; bowling; full bar; squad competition",
    "sourceCredit": "TikTok"
  },
  {
    "id": "bd2f3882-ebb5-e45c-7c64-b4de72523125",
    "name": "Cheetah Lounge",
    "slug": "cheetah-lounge",
    "city": "Atlanta",
    "state": "GA",
    "neighborhood": "Buckhead",
    "address": "887 Spring St NW",
    "lat": 33.749,
    "lng": -84.388,
    "cuisine": "Gentlemen's Club",
    "cuisineTags": [
      "Gentlemen's Club"
    ],
    "vibeTags": [
      "upscale"
    ],
    "occasionTags": [
      "bachelor"
    ],
    "price": "$$$",
    "priceLevel": 3,
    "vibeNotes": "Atlanta's upscale gentlemen's club; bottle service; bachelor classic",
    "sourceCredit": "Yelp"
  },
  {
    "id": "3dc22741-d75c-4fae-4dee-76fc0cd910ea",
    "name": "Beltline Walk",
    "slug": "beltline-walk",
    "city": "Atlanta",
    "state": "GA",
    "neighborhood": "Multiple",
    "address": "Various access points",
    "lat": 33.749,
    "lng": -84.388,
    "cuisine": "Trail / Walk",
    "cuisineTags": [
      "Trail",
      "Walk"
    ],
    "vibeTags": [],
    "occasionTags": [
      "outdoor-adventure"
    ],
    "price": "Free",
    "priceLevel": 1,
    "vibeNotes": "22-mile urban trail; restaurants & bars along route; murals & art",
    "sourceCredit": "TikTok"
  },
  {
    "id": "cfdb1917-e068-b085-2c1d-0d1b12a8e0e2",
    "name": "Stone Mountain",
    "slug": "stone-mountain",
    "city": "Atlanta",
    "state": "GA",
    "neighborhood": "Stone Mountain",
    "address": "1000 Robert E Lee Blvd",
    "lat": 33.749,
    "lng": -84.388,
    "cuisine": "Hiking",
    "cuisineTags": [
      "Hiking"
    ],
    "vibeTags": [],
    "occasionTags": [
      "outdoor-adventure"
    ],
    "price": "$",
    "priceLevel": 1,
    "vibeNotes": "Hike to summit; laser show; skyride; scenic crew day",
    "sourceCredit": "Instagram"
  },
  {
    "id": "c6929a0a-e24d-5053-2ec6-e9b550bb27fa",
    "name": "Chattahoochee River Tubing",
    "slug": "chattahoochee-river-tubing",
    "city": "Atlanta",
    "state": "GA",
    "neighborhood": "Roswell",
    "address": "Various outfitters",
    "lat": 33.749,
    "lng": -84.388,
    "cuisine": "Tubing",
    "cuisineTags": [
      "Tubing"
    ],
    "vibeTags": [],
    "occasionTags": [
      "outdoor-adventure"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Float the Hooch; cooler tubes; summer crew essential",
    "sourceCredit": "TikTok @bswankk"
  },
  {
    "id": "a79f001b-241a-bce4-0631-65267e3810e8",
    "name": "Piedmont Park",
    "slug": "piedmont-park",
    "city": "Atlanta",
    "state": "GA",
    "neighborhood": "Midtown",
    "address": "400 Park Dr NE",
    "lat": 33.749,
    "lng": -84.388,
    "cuisine": "Park",
    "cuisineTags": [
      "Park"
    ],
    "vibeTags": [],
    "occasionTags": [
      "outdoor-adventure"
    ],
    "price": "Free",
    "priceLevel": 1,
    "vibeNotes": "Skyline views; farmers market Saturdays; dog park; volleyball",
    "sourceCredit": "Instagram"
  },
  {
    "id": "f63ded03-d668-1fa0-72e8-30e134929f6c",
    "name": "Lake Lanier Islands",
    "slug": "lake-lanier-islands",
    "city": "Atlanta",
    "state": "GA",
    "neighborhood": "Buford",
    "address": "7000 Lanier Islands Pkwy",
    "lat": 33.749,
    "lng": -84.388,
    "cuisine": "Lake / Water Park",
    "cuisineTags": [
      "Lake",
      "Water Park"
    ],
    "vibeTags": [],
    "occasionTags": [
      "outdoor-adventure"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Water park; boat rentals; beach vibes; full-day group escape",
    "sourceCredit": "Yelp"
  },
  {
    "id": "94b7d4d9-afc4-bd49-fef9-6d63624e11b2",
    "name": "Emmer & Rye",
    "slug": "emmer-rye",
    "city": "Austin",
    "state": "TX",
    "neighborhood": "Rainey Street",
    "address": "51 Rainey St",
    "lat": 30.2672,
    "lng": -97.7431,
    "cuisine": "New American / Dim Sum",
    "cuisineTags": [
      "New American",
      "Dim Sum"
    ],
    "vibeTags": [
      "intimate"
    ],
    "occasionTags": [
      "date-night"
    ],
    "price": "$$$",
    "priceLevel": 3,
    "vibeNotes": "Dim sum cart service with seasonal dishes; creative and intimate",
    "sourceCredit": "TikTok"
  },
  {
    "id": "c0fda51d-5081-9171-b283-2025a3fdff4e",
    "name": "Uchi",
    "slug": "uchi",
    "city": "Austin",
    "state": "TX",
    "neighborhood": "South Lamar",
    "address": "801 S Lamar Blvd",
    "lat": 30.2672,
    "lng": -97.7431,
    "cuisine": "Japanese",
    "cuisineTags": [
      "Japanese"
    ],
    "vibeTags": [
      "iconic"
    ],
    "occasionTags": [
      "date-night"
    ],
    "price": "$$$$",
    "priceLevel": 4,
    "vibeNotes": "Tyson Cole's iconic Austin sushi; omakase is a must-do date",
    "sourceCredit": "Instagram"
  },
  {
    "id": "2e3148ec-87a5-a045-eacf-f2c9af09c686",
    "name": "Hestia",
    "slug": "hestia",
    "city": "Austin",
    "state": "TX",
    "neighborhood": "Downtown",
    "address": "507 W Colorado St",
    "lat": 30.2672,
    "lng": -97.7431,
    "cuisine": "Wood-Fired / Fine Dining",
    "cuisineTags": [
      "Wood-Fired",
      "Fine Dining"
    ],
    "vibeTags": [
      "romantic"
    ],
    "occasionTags": [
      "date-night"
    ],
    "price": "$$$$",
    "priceLevel": 4,
    "vibeNotes": "Live-fire cooking with a chef's counter; elemental and romantic",
    "sourceCredit": "TikTok"
  },
  {
    "id": "8793d71f-78b3-64b1-b552-143b1e4d436e",
    "name": "Coconut Club",
    "slug": "coconut-club",
    "city": "Austin",
    "state": "TX",
    "neighborhood": "East Austin",
    "address": "310 Colorado St",
    "lat": 30.2672,
    "lng": -97.7431,
    "cuisine": "Caribbean / Tropical",
    "cuisineTags": [
      "Caribbean",
      "Tropical"
    ],
    "vibeTags": [
      "patio",
      "cocktails",
      "late-night"
    ],
    "occasionTags": [
      "date-night"
    ],
    "price": "$$$",
    "priceLevel": 3,
    "vibeNotes": "Tropical cocktails with Caribbean-inspired plates; lush patio vibes",
    "sourceCredit": "Instagram"
  },
  {
    "id": "38e49a13-06a3-79f1-d2ba-96eb7fc3b6a3",
    "name": "Azul Rooftop",
    "slug": "azul-rooftop",
    "city": "Austin",
    "state": "TX",
    "neighborhood": "Downtown",
    "address": "300 E 4th St",
    "lat": 30.2672,
    "lng": -97.7431,
    "cuisine": "Mexican / Rooftop",
    "cuisineTags": [
      "Mexican",
      "Rooftop"
    ],
    "vibeTags": [
      "rooftop"
    ],
    "occasionTags": [
      "date-night"
    ],
    "price": "$$$",
    "priceLevel": 3,
    "vibeNotes": "Rooftop Mexican dining atop the JW Marriott with stunning skyline views",
    "sourceCredit": "TikTok"
  },
  {
    "id": "660e2f3c-791e-68b8-5f78-f0705215040b",
    "name": "Lenoir",
    "slug": "lenoir",
    "city": "Austin",
    "state": "TX",
    "neighborhood": "South 1st",
    "address": "1807 S 1st St",
    "lat": 30.2672,
    "lng": -97.7431,
    "cuisine": "Southern French",
    "cuisineTags": [
      "Southern French"
    ],
    "vibeTags": [
      "hidden-gem",
      "wine"
    ],
    "occasionTags": [
      "date-night"
    ],
    "price": "$$$",
    "priceLevel": 3,
    "vibeNotes": "Wine garden dining with a 3-course prix fixe; hidden gem feel",
    "sourceCredit": "Instagram"
  },
  {
    "id": "22c64711-fe76-f2b6-f8eb-6e432e99140f",
    "name": "Jeffrey's",
    "slug": "jeffrey-s",
    "city": "Austin",
    "state": "TX",
    "neighborhood": "Clarksville",
    "address": "1204 W Lynn St",
    "lat": 30.2672,
    "lng": -97.7431,
    "cuisine": "American Fine Dining",
    "cuisineTags": [
      "American Fine Dining"
    ],
    "vibeTags": [
      "elegant"
    ],
    "occasionTags": [
      "date-night"
    ],
    "price": "$$$$",
    "priceLevel": 4,
    "vibeNotes": "Austin's original fine-dining restaurant; classic, elegant, old-money vibes",
    "sourceCredit": "TikTok"
  },
  {
    "id": "8e896414-72fe-13a3-2c69-929b154e78d2",
    "name": "Launderette",
    "slug": "launderette",
    "city": "Austin",
    "state": "TX",
    "neighborhood": "East Austin",
    "address": "2115 Holly St",
    "lat": 30.2672,
    "lng": -97.7431,
    "cuisine": "Mediterranean / Brunch",
    "cuisineTags": [
      "Mediterranean",
      "Brunch"
    ],
    "vibeTags": [
      "brunch"
    ],
    "occasionTags": [
      "date-night"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Converted laundromat with Mediterranean fare; photogenic and delicious",
    "sourceCredit": "Instagram"
  },
  {
    "id": "ba1c168c-ea94-b5be-3784-aaf357033c9e",
    "name": "Rainey Street",
    "slug": "rainey-street",
    "city": "Austin",
    "state": "TX",
    "neighborhood": "Rainey Street",
    "address": "Rainey Street District",
    "lat": 30.2672,
    "lng": -97.7431,
    "cuisine": "Bar Crawl District",
    "cuisineTags": [
      "Bar Crawl District"
    ],
    "vibeTags": [],
    "occasionTags": [
      "group-night-out"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Entire district of converted bungalow bars; hop between 20+ spots",
    "sourceCredit": "TikTok"
  },
  {
    "id": "8135dc6f-322c-460b-df03-ecfadb3e11dd",
    "name": "The Concourse Project",
    "slug": "the-concourse-project",
    "city": "Austin",
    "state": "TX",
    "neighborhood": "East Austin",
    "address": "8509 Burleson Rd",
    "lat": 30.2672,
    "lng": -97.7431,
    "cuisine": "Warehouse Club / Music",
    "cuisineTags": [
      "Warehouse Club",
      "Music"
    ],
    "vibeTags": [
      "outdoor",
      "dj"
    ],
    "occasionTags": [
      "group-night-out",
      "bachelor"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Austin's premier electronic music venue; massive warehouse parties",
    "sourceCredit": "Instagram"
  },
  {
    "id": "932b845d-6566-fce1-3898-241c1f7be9fd",
    "name": "Easy Tiger",
    "slug": "easy-tiger",
    "city": "Austin",
    "state": "TX",
    "neighborhood": "East 6th",
    "address": "709 E 6th St",
    "lat": 30.2672,
    "lng": -97.7431,
    "cuisine": "Beer Garden / Bakery",
    "cuisineTags": [
      "Beer Garden",
      "Bakery"
    ],
    "vibeTags": [],
    "occasionTags": [
      "group-night-out"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Underground beer garden with communal tables, pretzels, and games",
    "sourceCredit": "TikTok"
  },
  {
    "id": "1ee2bc1b-62c0-9e58-d5f3-f3b679890390",
    "name": "Kung Fu Saloon",
    "slug": "kung-fu-saloon",
    "city": "Austin",
    "state": "TX",
    "neighborhood": "Dirty 6th",
    "address": "510 Rio Grande St",
    "lat": 30.2672,
    "lng": -97.7431,
    "cuisine": "Arcade Bar",
    "cuisineTags": [
      "Arcade Bar"
    ],
    "vibeTags": [
      "cocktails"
    ],
    "occasionTags": [
      "group-night-out"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Retro arcade games, skeeball, and cocktails; always a party",
    "sourceCredit": "Instagram"
  },
  {
    "id": "700c9c84-c035-7c4e-b0cf-821765e015b8",
    "name": "The Roosevelt Room",
    "slug": "the-roosevelt-room",
    "city": "Austin",
    "state": "TX",
    "neighborhood": "Downtown",
    "address": "307 W 5th St",
    "lat": 30.2672,
    "lng": -97.7431,
    "cuisine": "Cocktail Bar",
    "cuisineTags": [
      "Cocktail Bar"
    ],
    "vibeTags": [
      "cocktails"
    ],
    "occasionTags": [
      "group-night-out"
    ],
    "price": "$$$",
    "priceLevel": 3,
    "vibeNotes": "Prohibition-era cocktail bar with a rotating menu and live jazz",
    "sourceCredit": "TikTok"
  },
  {
    "id": "bfce58ce-1c85-3651-207c-d19ca31fa31a",
    "name": "Cidercade",
    "slug": "cidercade",
    "city": "Austin",
    "state": "TX",
    "neighborhood": "East Austin",
    "address": "979 Springdale Rd",
    "lat": 30.2672,
    "lng": -97.7431,
    "cuisine": "Arcade / Cider",
    "cuisineTags": [
      "Arcade",
      "Cider"
    ],
    "vibeTags": [],
    "occasionTags": [
      "group-night-out"
    ],
    "price": "$",
    "priceLevel": 1,
    "vibeNotes": "200+ arcade games with unlimited play for $12; all-you-can-cider option",
    "sourceCredit": "Instagram"
  },
  {
    "id": "1812dddb-4651-27cd-9a05-90a8e352b1ea",
    "name": "Whisler's",
    "slug": "whisler-s",
    "city": "Austin",
    "state": "TX",
    "neighborhood": "East Austin",
    "address": "1816 E 6th St",
    "lat": 30.2672,
    "lng": -97.7431,
    "cuisine": "Cocktail Bar / Mezcaleria",
    "cuisineTags": [
      "Cocktail Bar",
      "Mezcaleria"
    ],
    "vibeTags": [
      "cocktails"
    ],
    "occasionTags": [
      "group-night-out"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Craft cocktails downstairs, mezcal bar on the roof; East 6th staple",
    "sourceCredit": "TikTok"
  },
  {
    "id": "71f51a2a-e4b0-003b-4ceb-3fdd051a7891",
    "name": "Punch Bowl Social",
    "slug": "punch-bowl-social",
    "city": "Austin",
    "state": "TX",
    "neighborhood": "The Domain",
    "address": "11800 Domain Blvd",
    "lat": 30.2672,
    "lng": -97.7431,
    "cuisine": "Games / Restaurant",
    "cuisineTags": [
      "Games",
      "Restaurant"
    ],
    "vibeTags": [
      "cocktails"
    ],
    "occasionTags": [
      "group-night-out"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Bowling, karaoke, diner food, and cocktails in one massive space",
    "sourceCredit": "Instagram"
  },
  {
    "id": "ceca6a35-091a-0af4-bbf2-e8c7ce106ddd",
    "name": "Olamaie",
    "slug": "olamaie",
    "city": "Austin",
    "state": "TX",
    "neighborhood": "Downtown",
    "address": "1610 San Antonio St",
    "lat": 30.2672,
    "lng": -97.7431,
    "cuisine": "Southern",
    "cuisineTags": [
      "Southern"
    ],
    "vibeTags": [],
    "occasionTags": [
      "in-laws"
    ],
    "price": "$$$$",
    "priceLevel": 4,
    "vibeNotes": "Elevated Southern cooking in a restored house; charming and impressive",
    "sourceCredit": "TikTok"
  },
  {
    "id": "072d1bcb-aff3-0f50-857d-235750b64545",
    "name": "Clark's Oyster Bar",
    "slug": "clark-s-oyster-bar",
    "city": "Austin",
    "state": "TX",
    "neighborhood": "Clarksville",
    "address": "1200 W 6th St",
    "lat": 30.2672,
    "lng": -97.7431,
    "cuisine": "Seafood",
    "cuisineTags": [
      "Seafood"
    ],
    "vibeTags": [],
    "occasionTags": [
      "in-laws"
    ],
    "price": "$$$",
    "priceLevel": 3,
    "vibeNotes": "Classic New England-style oyster bar in a charming Clarksville cottage",
    "sourceCredit": "Instagram"
  },
  {
    "id": "4fc9843d-8eb7-e366-78b1-bde7716439e2",
    "name": "Truluck's",
    "slug": "truluck-s",
    "city": "Austin",
    "state": "TX",
    "neighborhood": "Arboretum",
    "address": "10225 Research Blvd",
    "lat": 30.2672,
    "lng": -97.7431,
    "cuisine": "Seafood / Steakhouse",
    "cuisineTags": [
      "Seafood",
      "Steakhouse"
    ],
    "vibeTags": [
      "upscale",
      "live-music"
    ],
    "occasionTags": [
      "in-laws"
    ],
    "price": "$$$$",
    "priceLevel": 4,
    "vibeNotes": "Upscale surf-and-turf with live music; reliable for impressing family",
    "sourceCredit": "TikTok"
  },
  {
    "id": "f16e9d43-7b98-801f-0907-164fb43d8621",
    "name": "Wink",
    "slug": "wink",
    "city": "Austin",
    "state": "TX",
    "neighborhood": "West Austin",
    "address": "1014 N Lamar Blvd",
    "lat": 30.2672,
    "lng": -97.7431,
    "cuisine": "New American Tasting",
    "cuisineTags": [
      "New American Tasting"
    ],
    "vibeTags": [
      "intimate"
    ],
    "occasionTags": [
      "in-laws"
    ],
    "price": "$$$$",
    "priceLevel": 4,
    "vibeNotes": "Intimate 30-seat restaurant with seasonal tasting menus",
    "sourceCredit": "Instagram"
  },
  {
    "id": "1642d803-180c-bf38-0e8a-0c12b43fa3a4",
    "name": "Hillside Farmacy",
    "slug": "hillside-farmacy",
    "city": "Austin",
    "state": "TX",
    "neighborhood": "East Austin",
    "address": "516 E 7th St",
    "lat": 30.2672,
    "lng": -97.7431,
    "cuisine": "American / Farm-to-Table",
    "cuisineTags": [
      "American",
      "Farm-to-Table"
    ],
    "vibeTags": [],
    "occasionTags": [
      "in-laws"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Converted 1950s pharmacy with locally sourced comfort food",
    "sourceCredit": "TikTok"
  },
  {
    "id": "b664fda1-21fd-2bcc-015d-9f1846519d58",
    "name": "Jack Allen's Kitchen",
    "slug": "jack-allen-s-kitchen",
    "city": "Austin",
    "state": "TX",
    "neighborhood": "Various",
    "address": "Multiple Locations",
    "lat": 30.2672,
    "lng": -97.7431,
    "cuisine": "Texas Comfort",
    "cuisineTags": [
      "Texas Comfort"
    ],
    "vibeTags": [],
    "occasionTags": [
      "in-laws"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Elevated Texas comfort food with Hill Country charm; universally loved",
    "sourceCredit": "Instagram"
  },
  {
    "id": "750c33f0-906f-0b90-8282-8968a8ec3534",
    "name": "\u00c9picerie Caf\u00e9 & Grocery",
    "slug": "picerie-caf-grocery",
    "city": "Austin",
    "state": "TX",
    "neighborhood": "Mueller",
    "address": "2307 Hancock Dr",
    "lat": 30.2672,
    "lng": -97.7431,
    "cuisine": "French Caf\u00e9",
    "cuisineTags": [
      "French Caf\u00e9"
    ],
    "vibeTags": [
      "patio"
    ],
    "occasionTags": [
      "in-laws"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Charming French caf\u00e9 with house-made pastries and a shaded patio",
    "sourceCredit": "TikTok"
  },
  {
    "id": "0710b2f9-6834-6f6a-1e29-4781c0d313f7",
    "name": "Busy Signal",
    "slug": "busy-signal",
    "city": "Austin",
    "state": "TX",
    "neighborhood": "East Austin",
    "address": "1206 E 7th St",
    "lat": 30.2672,
    "lng": -97.7431,
    "cuisine": "Speakeasy",
    "cuisineTags": [
      "Speakeasy"
    ],
    "vibeTags": [
      "cocktails"
    ],
    "occasionTags": [
      "girls-night"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Black-owned speakeasy behind a vintage electronics fa\u00e7ade; stunning cocktails",
    "sourceCredit": "TikTok"
  },
  {
    "id": "0e408fbc-744f-c6f2-c19e-dd5765016655",
    "name": "77\u00b0 Rooftop",
    "slug": "77-rooftop",
    "city": "Austin",
    "state": "TX",
    "neighborhood": "Downtown",
    "address": "300 E 4th St",
    "lat": 30.2672,
    "lng": -97.7431,
    "cuisine": "Rooftop Bar",
    "cuisineTags": [
      "Rooftop Bar"
    ],
    "vibeTags": [
      "rooftop",
      "cocktails"
    ],
    "occasionTags": [
      "girls-night"
    ],
    "price": "$$$",
    "priceLevel": 3,
    "vibeNotes": "Stylish rooftop at The LINE Hotel with poolside cocktails",
    "sourceCredit": "Instagram"
  },
  {
    "id": "fdcc4be0-8677-aa68-d942-5b9e0989d707",
    "name": "Here Nor There",
    "slug": "here-nor-there",
    "city": "Austin",
    "state": "TX",
    "neighborhood": "East Austin",
    "address": "412 E 6th St",
    "lat": 30.2672,
    "lng": -97.7431,
    "cuisine": "Speakeasy / Cocktail",
    "cuisineTags": [
      "Speakeasy",
      "Cocktail"
    ],
    "vibeTags": [
      "cocktails"
    ],
    "occasionTags": [
      "girls-night"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Secret entrance, multi-room speakeasy with theatrical cocktails",
    "sourceCredit": "TikTok"
  },
  {
    "id": "5fbae031-bcf1-dfa0-2538-f60177302088",
    "name": "Maie Day",
    "slug": "maie-day",
    "city": "Austin",
    "state": "TX",
    "neighborhood": "Downtown",
    "address": "505 W 2nd St",
    "lat": 30.2672,
    "lng": -97.7431,
    "cuisine": "Hawaiian / Cocktails",
    "cuisineTags": [
      "Hawaiian",
      "Cocktails"
    ],
    "vibeTags": [
      "cocktails",
      "late-night"
    ],
    "occasionTags": [
      "girls-night"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Tropical-meets-Hawaiian cocktail bar with shareable plates",
    "sourceCredit": "Instagram"
  },
  {
    "id": "e540dcd6-3781-1de5-45ca-79aecaa47290",
    "name": "Sway",
    "slug": "sway",
    "city": "Austin",
    "state": "TX",
    "neighborhood": "South 1st",
    "address": "1417 S 1st St",
    "lat": 30.2672,
    "lng": -97.7431,
    "cuisine": "Thai",
    "cuisineTags": [
      "Thai"
    ],
    "vibeTags": [
      "patio",
      "cocktails"
    ],
    "occasionTags": [
      "girls-night"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Gorgeous Thai restaurant with a stunning patio; cocktails are fire",
    "sourceCredit": "TikTok"
  },
  {
    "id": "47b24cf9-ddb6-3569-2eed-d20e9c6881be",
    "name": "The Upside",
    "slug": "the-upside",
    "city": "Austin",
    "state": "TX",
    "neighborhood": "East Austin",
    "address": "1908 E 6th St",
    "lat": 30.2672,
    "lng": -97.7431,
    "cuisine": "Rooftop Bar",
    "cuisineTags": [
      "Rooftop Bar"
    ],
    "vibeTags": [
      "rooftop",
      "cocktails",
      "instagrammable"
    ],
    "occasionTags": [
      "girls-night"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Instagrammable rooftop with cocktails and East Austin skyline views",
    "sourceCredit": "Instagram"
  },
  {
    "id": "85cd476e-e827-7ec8-d16c-0e098656f57d",
    "name": "Dripping Springs Distillery",
    "slug": "dripping-springs-distillery",
    "city": "Austin",
    "state": "TX",
    "neighborhood": "Dripping Springs",
    "address": "Various",
    "lat": 30.2672,
    "lng": -97.7431,
    "cuisine": "Distillery Tour",
    "cuisineTags": [
      "Distillery Tour"
    ],
    "vibeTags": [
      "fun"
    ],
    "occasionTags": [
      "girls-night"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Texas vodka/gin distillery tours with tastings; fun day trip",
    "sourceCredit": "TikTok"
  },
  {
    "id": "a01ba165-80a5-9908-5550-2abee92ac61f",
    "name": "Colleen's Kitchen",
    "slug": "colleen-s-kitchen",
    "city": "Austin",
    "state": "TX",
    "neighborhood": "East Austin",
    "address": "2532 E 12th St",
    "lat": 30.2672,
    "lng": -97.7431,
    "cuisine": "American / Wine Bar",
    "cuisineTags": [
      "American",
      "Wine Bar"
    ],
    "vibeTags": [
      "cozy",
      "wine"
    ],
    "occasionTags": [
      "girls-night"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Cozy neighborhood wine bar with comfort food and a female-owned vibe",
    "sourceCredit": "Instagram"
  },
  {
    "id": "3d3cbd25-591e-b023-8672-40f759dd1771",
    "name": "OK Corral",
    "slug": "ok-corral",
    "city": "Austin",
    "state": "TX",
    "neighborhood": "East Riverside",
    "address": "1502 E Riverside Dr",
    "lat": 30.2672,
    "lng": -97.7431,
    "cuisine": "Nightclub / Latin",
    "cuisineTags": [
      "Nightclub",
      "Latin"
    ],
    "vibeTags": [
      "live-music",
      "dance"
    ],
    "occasionTags": [
      "guys-night"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Massive Latin nightclub with live music, bull riding, and dance floors",
    "sourceCredit": "TikTok"
  },
  {
    "id": "310f169f-f6a3-d9af-c3ba-a61266b372d1",
    "name": "Dirdie Birdie",
    "slug": "dirdie-birdie",
    "city": "Austin",
    "state": "TX",
    "neighborhood": "South Austin",
    "address": "10014 Manchaca Rd",
    "lat": 30.2672,
    "lng": -97.7431,
    "cuisine": "Mini Golf / Bar",
    "cuisineTags": [
      "Mini Golf",
      "Bar"
    ],
    "vibeTags": [],
    "occasionTags": [
      "guys-night"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "18-hole mini golf course with a full bar; competitive and hilarious",
    "sourceCredit": "Instagram"
  },
  {
    "id": "797f8499-11d4-8b63-4e81-5169ccc5e5ad",
    "name": "Pinthouse Pizza",
    "slug": "pinthouse-pizza",
    "city": "Austin",
    "state": "TX",
    "neighborhood": "Various",
    "address": "Multiple Locations",
    "lat": 30.2672,
    "lng": -97.7431,
    "cuisine": "Brewery / Pizza",
    "cuisineTags": [
      "Brewery",
      "Pizza"
    ],
    "vibeTags": [],
    "occasionTags": [
      "guys-night"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Award-winning house-brewed beers with excellent pizza",
    "sourceCredit": "TikTok"
  },
  {
    "id": "bcadeaf4-6883-4407-f181-5fbd3f0c1744",
    "name": "Spokesman",
    "slug": "spokesman",
    "city": "Austin",
    "state": "TX",
    "neighborhood": "East Austin",
    "address": "1501 E 7th St",
    "lat": 30.2672,
    "lng": -97.7431,
    "cuisine": "Bike Bar",
    "cuisineTags": [
      "Bike Bar"
    ],
    "vibeTags": [],
    "occasionTags": [
      "guys-night"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Stationary bike bar where you pedal to blend your own drinks",
    "sourceCredit": "Instagram"
  },
  {
    "id": "4300b288-4e05-21f2-14e4-b895b3b62db8",
    "name": "Handlebar",
    "slug": "handlebar",
    "city": "Austin",
    "state": "TX",
    "neighborhood": "East 6th",
    "address": "121 E 5th St",
    "lat": 30.2672,
    "lng": -97.7431,
    "cuisine": "Dive Bar / Games",
    "cuisineTags": [
      "Dive Bar",
      "Games"
    ],
    "vibeTags": [],
    "occasionTags": [
      "guys-night"
    ],
    "price": "$",
    "priceLevel": 1,
    "vibeNotes": "Pool tables, cheap beer, and zero pretension on East 6th",
    "sourceCredit": "TikTok"
  },
  {
    "id": "a3d5d4de-44b2-2c83-3e71-85a4ab11c034",
    "name": "Black Star Co-op",
    "slug": "black-star-co-op",
    "city": "Austin",
    "state": "TX",
    "neighborhood": "North Loop",
    "address": "7020 Easy Wind Dr",
    "lat": 30.2672,
    "lng": -97.7431,
    "cuisine": "Brewpub",
    "cuisineTags": [
      "Brewpub"
    ],
    "vibeTags": [],
    "occasionTags": [
      "guys-night"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Worker-owned brewpub with excellent craft beer and elevated pub food",
    "sourceCredit": "Instagram"
  },
  {
    "id": "7ab85ed9-2cf1-bea1-e1c8-6887467ac922",
    "name": "The Brass Tap",
    "slug": "the-brass-tap",
    "city": "Austin",
    "state": "TX",
    "neighborhood": "The Domain",
    "address": "11800 Domain Blvd",
    "lat": 30.2672,
    "lng": -97.7431,
    "cuisine": "Craft Beer Bar",
    "cuisineTags": [
      "Craft Beer Bar"
    ],
    "vibeTags": [],
    "occasionTags": [
      "guys-night"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "60+ taps of craft beer with trivia nights and sports viewing",
    "sourceCredit": "TikTok"
  },
  {
    "id": "ae28d69e-6929-6e14-4a14-b1bdc1477c55",
    "name": "Rainey Street Crawl",
    "slug": "rainey-street-crawl",
    "city": "Austin",
    "state": "TX",
    "neighborhood": "Rainey Street",
    "address": "Various",
    "lat": 30.2672,
    "lng": -97.7431,
    "cuisine": "Bar Crawl",
    "cuisineTags": [
      "Bar Crawl"
    ],
    "vibeTags": [],
    "occasionTags": [
      "bachelor"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "20+ bars in converted bungalows; the quintessential Austin bachelor crawl",
    "sourceCredit": "Instagram"
  },
  {
    "id": "8e2a7359-5f02-90ff-ccc2-7f34b72efb1b",
    "name": "COTA",
    "slug": "cota",
    "city": "Austin",
    "state": "TX",
    "neighborhood": "Del Valle",
    "address": "9201 Circuit of the Americas Blvd",
    "lat": 30.2672,
    "lng": -97.7431,
    "cuisine": "Go-Karts / Racing",
    "cuisineTags": [
      "Go-Karts",
      "Racing"
    ],
    "vibeTags": [],
    "occasionTags": [
      "bachelor"
    ],
    "price": "$$$",
    "priceLevel": 3,
    "vibeNotes": "Formula 1 track with go-kart experiences and special events",
    "sourceCredit": "TikTok"
  },
  {
    "id": "a33cf824-8a5f-ecb3-2dbd-faf4aef2611b",
    "name": "Lake Travis Boat Rental",
    "slug": "lake-travis-boat-rental",
    "city": "Austin",
    "state": "TX",
    "neighborhood": "Lakeway",
    "address": "Various Marinas",
    "lat": 30.2672,
    "lng": -97.7431,
    "cuisine": "Lake / Boat Party",
    "cuisineTags": [
      "Lake",
      "Boat Party"
    ],
    "vibeTags": [
      "sunset"
    ],
    "occasionTags": [
      "bachelor"
    ],
    "price": "$$$",
    "priceLevel": 3,
    "vibeNotes": "Rent a party boat on Lake Travis; cliff jumping, swimming, sunset cruising",
    "sourceCredit": "Instagram"
  },
  {
    "id": "53d32b04-458f-70f6-f09f-12f949ffe16b",
    "name": "Midnight Cowboy",
    "slug": "midnight-cowboy",
    "city": "Austin",
    "state": "TX",
    "neighborhood": "Dirty 6th",
    "address": "313 E 6th St",
    "lat": 30.2672,
    "lng": -97.7431,
    "cuisine": "Reservations-Only Speakeasy",
    "cuisineTags": [
      "Reservations-Only Speakeasy"
    ],
    "vibeTags": [
      "elegant",
      "cocktails"
    ],
    "occasionTags": [
      "bachelor"
    ],
    "price": "$$$",
    "priceLevel": 3,
    "vibeNotes": "Former brothel turned elegant cocktail lounge; reservation required",
    "sourceCredit": "TikTok"
  },
  {
    "id": "ebe0f0f3-c8de-cc2d-3d24-a486d3c1cf76",
    "name": "Austin Axe Throwing",
    "slug": "austin-axe-throwing",
    "city": "Austin",
    "state": "TX",
    "neighborhood": "East Austin",
    "address": "2113 Wells Branch Pkwy",
    "lat": 30.2672,
    "lng": -97.7431,
    "cuisine": "Axe Throwing / BYOB",
    "cuisineTags": [
      "Axe Throwing",
      "BYOB"
    ],
    "vibeTags": [],
    "occasionTags": [
      "bachelor"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "BYOB axe throwing with competitive league vibes",
    "sourceCredit": "Instagram"
  },
  {
    "id": "f39879b3-012d-546f-9bf7-641f35582d84",
    "name": "Barton Springs Pool",
    "slug": "barton-springs-pool",
    "city": "Austin",
    "state": "TX",
    "neighborhood": "Zilker",
    "address": "2201 Barton Springs Rd",
    "lat": 30.2672,
    "lng": -97.7431,
    "cuisine": "Natural Pool",
    "cuisineTags": [
      "Natural Pool"
    ],
    "vibeTags": [
      "iconic"
    ],
    "occasionTags": [
      "outdoor-adventure"
    ],
    "price": "$",
    "priceLevel": 1,
    "vibeNotes": "68\u00b0F year-round natural spring pool; iconic Austin experience",
    "sourceCredit": "TikTok"
  },
  {
    "id": "28f36bc0-d8f6-c9b4-9d3b-becd65065522",
    "name": "South Congress Avenue",
    "slug": "south-congress-avenue",
    "city": "Austin",
    "state": "TX",
    "neighborhood": "SoCo",
    "address": "South Congress Ave",
    "lat": 30.2672,
    "lng": -97.7431,
    "cuisine": "Shopping / Food",
    "cuisineTags": [
      "Shopping",
      "Food"
    ],
    "vibeTags": [],
    "occasionTags": [
      "outdoor-adventure"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Walk SoCo for vintage shops, tacos, murals, and people-watching",
    "sourceCredit": "Instagram"
  },
  {
    "id": "4131ce08-a164-caa6-f9c5-4cff6c849ddc",
    "name": "Mount Bonnell",
    "slug": "mount-bonnell",
    "city": "Austin",
    "state": "TX",
    "neighborhood": "West Austin",
    "address": "3800 Mount Bonnell Rd",
    "lat": 30.2672,
    "lng": -97.7431,
    "cuisine": "Hiking / Views",
    "cuisineTags": [
      "Hiking",
      "Views"
    ],
    "vibeTags": [],
    "occasionTags": [
      "outdoor-adventure"
    ],
    "price": "Free",
    "priceLevel": 1,
    "vibeNotes": "Short hike to panoramic views of Lake Austin and the Hill Country",
    "sourceCredit": "TikTok"
  },
  {
    "id": "5276e403-9c41-ed32-cdd3-dc1e05b1ba0a",
    "name": "Jester King Brewery",
    "slug": "jester-king-brewery",
    "city": "Austin",
    "state": "TX",
    "neighborhood": "Dripping Springs",
    "address": "13187 Fitzhugh Rd",
    "lat": 30.2672,
    "lng": -97.7431,
    "cuisine": "Farmhouse Brewery",
    "cuisineTags": [
      "Farmhouse Brewery"
    ],
    "vibeTags": [],
    "occasionTags": [
      "outdoor-adventure"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Hill Country farmhouse brewery with pizza, trails, and goats",
    "sourceCredit": "Instagram"
  },
  {
    "id": "cd83ff43-bb7e-5917-f4fc-9ae0c7d44162",
    "name": "Zilker Park",
    "slug": "zilker-park",
    "city": "Austin",
    "state": "TX",
    "neighborhood": "Zilker",
    "address": "2100 Barton Springs Rd",
    "lat": 30.2672,
    "lng": -97.7431,
    "cuisine": "Park / Activities",
    "cuisineTags": [
      "Park",
      "Activities"
    ],
    "vibeTags": [
      "chill"
    ],
    "occasionTags": [
      "outdoor-adventure"
    ],
    "price": "Free",
    "priceLevel": 1,
    "vibeNotes": "Kayak Lady Bird Lake, play disc golf, or just chill on the great lawn",
    "sourceCredit": "TikTok"
  },
  {
    "id": "c8b46022-7db9-0ced-68d6-498db042dbe3",
    "name": "East Austin Food Truck Parks",
    "slug": "east-austin-food-truck-parks",
    "city": "Austin",
    "state": "TX",
    "neighborhood": "East Austin",
    "address": "Various",
    "lat": 30.2672,
    "lng": -97.7431,
    "cuisine": "Food Truck Park",
    "cuisineTags": [
      "Food Truck Park"
    ],
    "vibeTags": [],
    "occasionTags": [
      "outdoor-adventure"
    ],
    "price": "$",
    "priceLevel": 1,
    "vibeNotes": "Dozens of food trucks clustered together; tacos, BBQ, Thai, and more",
    "sourceCredit": "Instagram"
  },
  {
    "id": "cadb23f9-1f6d-5e6b-df3a-1405bfd78f35",
    "name": "Contessa",
    "slug": "contessa",
    "city": "Boston",
    "state": "MA",
    "neighborhood": "Seaport",
    "address": "33 Sleeper St",
    "lat": 42.3601,
    "lng": -71.0589,
    "cuisine": "Italian / Rooftop",
    "cuisineTags": [
      "Italian",
      "Rooftop"
    ],
    "vibeTags": [
      "romantic",
      "rooftop"
    ],
    "occasionTags": [
      "date-night"
    ],
    "price": "$$$",
    "priceLevel": 3,
    "vibeNotes": "Stunning Newbury St views, handmade pasta, romantic rooftop terrace",
    "sourceCredit": "TikTok"
  },
  {
    "id": "6baac8b3-7f81-a4df-e1e7-20036562080e",
    "name": "Bistro du Midi",
    "slug": "bistro-du-midi",
    "city": "Boston",
    "state": "MA",
    "neighborhood": "Back Bay",
    "address": "272 Boylston St",
    "lat": 42.3601,
    "lng": -71.0589,
    "cuisine": "French",
    "cuisineTags": [
      "French"
    ],
    "vibeTags": [
      "intimate"
    ],
    "occasionTags": [
      "date-night"
    ],
    "price": "$$$",
    "priceLevel": 3,
    "vibeNotes": "French bistro overlooking Public Garden; intimate, candlelit, Parisian feel",
    "sourceCredit": "TikTok"
  },
  {
    "id": "58482aeb-c74b-d8dc-ae38-3086ab8a6766",
    "name": "Mistral",
    "slug": "mistral",
    "city": "Boston",
    "state": "MA",
    "neighborhood": "South End",
    "address": "223 Columbus Ave",
    "lat": 42.3601,
    "lng": -71.0589,
    "cuisine": "French-Mediterranean",
    "cuisineTags": [
      "French-Mediterranean"
    ],
    "vibeTags": [],
    "occasionTags": [
      "date-night"
    ],
    "price": "$$$$",
    "priceLevel": 4,
    "vibeNotes": "Soaring ceilings, Proven\u00e7al cuisine, one of Boston's most beautiful restaurants",
    "sourceCredit": "Instagram"
  },
  {
    "id": "1604ebf6-d767-734c-5ad1-3fd4ec9efbd0",
    "name": "The Beehive",
    "slug": "the-beehive",
    "city": "Boston",
    "state": "MA",
    "neighborhood": "South End",
    "address": "541 Tremont St",
    "lat": 42.3601,
    "lng": -71.0589,
    "cuisine": "American / Jazz Club",
    "cuisineTags": [
      "American",
      "Jazz Club"
    ],
    "vibeTags": [
      "cocktails"
    ],
    "occasionTags": [
      "date-night"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Live jazz nightly, bohemian decor, artsy cocktails and elevated bar food",
    "sourceCredit": "TikTok"
  },
  {
    "id": "e7d0108f-3547-1e91-22a6-2dd3b6678bec",
    "name": "Mooo Seaport",
    "slug": "mooo-seaport",
    "city": "Boston",
    "state": "MA",
    "neighborhood": "Seaport",
    "address": "100 Pier 4 Blvd",
    "lat": 42.3601,
    "lng": -71.0589,
    "cuisine": "Steakhouse",
    "cuisineTags": [
      "Steakhouse"
    ],
    "vibeTags": [],
    "occasionTags": [
      "date-night"
    ],
    "price": "$$$$",
    "priceLevel": 4,
    "vibeNotes": "XV Beacon steakhouse with harbor views, dry-aged steaks, power date spot",
    "sourceCredit": "Instagram"
  },
  {
    "id": "68dac9f1-271d-9fc9-1041-26610617a2e9",
    "name": "Can Can Culinary Cabaret",
    "slug": "can-can-culinary-cabaret",
    "city": "Boston",
    "state": "MA",
    "neighborhood": "Central Square",
    "address": "958 Mass Ave",
    "lat": 42.3601,
    "lng": -71.0589,
    "cuisine": "French / Cabaret",
    "cuisineTags": [
      "French",
      "Cabaret"
    ],
    "vibeTags": [],
    "occasionTags": [
      "date-night"
    ],
    "price": "$$$",
    "priceLevel": 3,
    "vibeNotes": "Dinner theater meets fine dining; burlesque shows, French menu, unforgettable",
    "sourceCredit": "TikTok"
  },
  {
    "id": "ddd3676e-e03d-7c12-4bdf-1d0e72ee2623",
    "name": "Paper Fan Cocktail Bar",
    "slug": "paper-fan-cocktail-bar",
    "city": "Boston",
    "state": "MA",
    "neighborhood": "Chinatown",
    "address": "22 Tyler St",
    "lat": 42.3601,
    "lng": -71.0589,
    "cuisine": "Asian Cocktail Bar",
    "cuisineTags": [
      "Asian Cocktail Bar"
    ],
    "vibeTags": [
      "intimate",
      "cocktails",
      "late-night"
    ],
    "occasionTags": [
      "date-night"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Intimate 30-seat speakeasy with Asian-inspired cocktails and small plates",
    "sourceCredit": "TikTok"
  },
  {
    "id": "37928650-49d9-096d-0690-5d5c5c554d1b",
    "name": "Bambola",
    "slug": "bambola",
    "city": "Boston",
    "state": "MA",
    "neighborhood": "South End",
    "address": "75 Waltham St",
    "lat": 42.3601,
    "lng": -71.0589,
    "cuisine": "Italian / Wine Bar",
    "cuisineTags": [
      "Italian",
      "Wine Bar"
    ],
    "vibeTags": [
      "cozy",
      "wine"
    ],
    "occasionTags": [
      "date-night"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Cozy Italian wine bar with fresh pasta, wine flights, warm candlelit ambiance",
    "sourceCredit": "Instagram"
  },
  {
    "id": "d389bcdf-caac-7a48-e320-4dc617f026b8",
    "name": "Maple & Ash",
    "slug": "maple-ash",
    "city": "Boston",
    "state": "MA",
    "neighborhood": "Back Bay",
    "address": "8 Newbury St",
    "lat": 42.3601,
    "lng": -71.0589,
    "cuisine": "Steakhouse / Lounge",
    "cuisineTags": [
      "Steakhouse",
      "Lounge"
    ],
    "vibeTags": [
      "late-night"
    ],
    "occasionTags": [
      "group-night-out"
    ],
    "price": "$$$$",
    "priceLevel": 4,
    "vibeNotes": "Sexy vibe, tableside preparations, late-night scene on Newbury",
    "sourceCredit": "TikTok"
  },
  {
    "id": "0bb3ebd6-79cf-d059-5016-cbf4c404a6ed",
    "name": "Empire",
    "slug": "empire",
    "city": "Boston",
    "state": "MA",
    "neighborhood": "Seaport",
    "address": "1 Marina Park Dr",
    "lat": 42.3601,
    "lng": -71.0589,
    "cuisine": "Asian Fusion / Nightclub",
    "cuisineTags": [
      "Asian Fusion",
      "Nightclub"
    ],
    "vibeTags": [
      "waterfront"
    ],
    "occasionTags": [
      "group-night-out",
      "bachelor"
    ],
    "price": "$$$",
    "priceLevel": 3,
    "vibeNotes": "Restaurant by night, full nightclub after 11pm, waterfront views",
    "sourceCredit": "Instagram"
  },
  {
    "id": "c5523608-9561-e0d9-a728-f591da711ed9",
    "name": "The Hideout",
    "slug": "the-hideout",
    "city": "Boston",
    "state": "MA",
    "neighborhood": "South Boston",
    "address": "27 W Broadway",
    "lat": 42.3601,
    "lng": -71.0589,
    "cuisine": "Cocktail Lounge",
    "cuisineTags": [
      "Cocktail Lounge"
    ],
    "vibeTags": [
      "cocktails"
    ],
    "occasionTags": [
      "group-night-out"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Brick-walled speakeasy with craft cocktails and a secret entrance",
    "sourceCredit": "TikTok"
  },
  {
    "id": "4b085a81-ab2d-b00c-b8fc-3a001c461d2a",
    "name": "Row 34",
    "slug": "row-34",
    "city": "Boston",
    "state": "MA",
    "neighborhood": "Fort Point",
    "address": "383 Congress St",
    "lat": 42.3601,
    "lng": -71.0589,
    "cuisine": "Seafood / Oyster Bar",
    "cuisineTags": [
      "Seafood",
      "Oyster Bar"
    ],
    "vibeTags": [],
    "occasionTags": [
      "group-night-out"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Industrial-chic oyster bar, curated beer list, group-friendly communal tables",
    "sourceCredit": "Instagram"
  },
  {
    "id": "3b0b7018-98dc-8410-636f-3f797e6f909b",
    "name": "Yvonne's",
    "slug": "yvonne-s",
    "city": "Boston",
    "state": "MA",
    "neighborhood": "Downtown Crossing",
    "address": "2 Winter Pl",
    "lat": 42.3601,
    "lng": -71.0589,
    "cuisine": "Supper Club",
    "cuisineTags": [
      "Supper Club"
    ],
    "vibeTags": [],
    "occasionTags": [
      "group-night-out"
    ],
    "price": "$$$",
    "priceLevel": 3,
    "vibeNotes": "Former Locke-Ober space reimagined as glamorous supper club; great for groups",
    "sourceCredit": "TikTok"
  },
  {
    "id": "895cba8b-b060-7ed7-6b6c-a989a24ec817",
    "name": "Citrus & Salt",
    "slug": "citrus-salt",
    "city": "Boston",
    "state": "MA",
    "neighborhood": "Back Bay",
    "address": "142 Berkeley St",
    "lat": 42.3601,
    "lng": -71.0589,
    "cuisine": "Mexican",
    "cuisineTags": [
      "Mexican"
    ],
    "vibeTags": [
      "upscale",
      "cocktails"
    ],
    "occasionTags": [
      "group-night-out"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Upscale Mexican with creative cocktails, vibrant decor, lively crowd",
    "sourceCredit": "Instagram"
  },
  {
    "id": "619189c8-3467-ee41-613a-1644a88c7cc5",
    "name": "Explorateur",
    "slug": "explorateur",
    "city": "Boston",
    "state": "MA",
    "neighborhood": "Back Bay",
    "address": "186 Dartmouth St",
    "lat": 42.3601,
    "lng": -71.0589,
    "cuisine": "French Caf\u00e9 / Lounge",
    "cuisineTags": [
      "French Caf\u00e9",
      "Lounge"
    ],
    "vibeTags": [
      "dj",
      "cocktails",
      "late-night"
    ],
    "occasionTags": [
      "group-night-out",
      "bachelor"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Grand Parisian-style caf\u00e9 with craft cocktails and late-night DJ sets",
    "sourceCredit": "TikTok"
  },
  {
    "id": "97ca93a3-3173-dcc2-d5ea-d867745af86f",
    "name": "Felipe's",
    "slug": "felipe-s",
    "city": "Boston",
    "state": "MA",
    "neighborhood": "Harvard Square",
    "address": "21 Brattle St",
    "lat": 42.3601,
    "lng": -71.0589,
    "cuisine": "Mexican / Rooftop",
    "cuisineTags": [
      "Mexican",
      "Rooftop"
    ],
    "vibeTags": [
      "rooftop"
    ],
    "occasionTags": [
      "group-night-out"
    ],
    "price": "$",
    "priceLevel": 1,
    "vibeNotes": "Three floors of tacos, rooftop margaritas, Harvard Square party vibes",
    "sourceCredit": "Instagram"
  },
  {
    "id": "bf9fe60b-4599-bac1-ed47-beb9a3d896cb",
    "name": "Mastro's Ocean Club",
    "slug": "mastro-s-ocean-club",
    "city": "Boston",
    "state": "MA",
    "neighborhood": "Seaport",
    "address": "120 Seaport Blvd",
    "lat": 42.3601,
    "lng": -71.0589,
    "cuisine": "Seafood / Steakhouse",
    "cuisineTags": [
      "Seafood",
      "Steakhouse"
    ],
    "vibeTags": [
      "live-music"
    ],
    "occasionTags": [
      "in-laws",
      "guys-night"
    ],
    "price": "$$$$",
    "priceLevel": 4,
    "vibeNotes": "White-tablecloth seafood, live piano, impresses any generation",
    "sourceCredit": "TikTok"
  },
  {
    "id": "b64367d3-7783-a4fd-d522-01c64c025b6b",
    "name": "The Salty Pig",
    "slug": "the-salty-pig",
    "city": "Boston",
    "state": "MA",
    "neighborhood": "Back Bay",
    "address": "130 Dartmouth St",
    "lat": 42.3601,
    "lng": -71.0589,
    "cuisine": "Charcuterie / Italian",
    "cuisineTags": [
      "Charcuterie",
      "Italian"
    ],
    "vibeTags": [],
    "occasionTags": [
      "in-laws"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "House-cured meats, artisan pizzas, refined but relaxed Back Bay spot",
    "sourceCredit": "Instagram"
  },
  {
    "id": "b2684a6a-90bd-6efe-0dd7-d8884d7ac264",
    "name": "Toro",
    "slug": "toro",
    "city": "Boston",
    "state": "MA",
    "neighborhood": "South End",
    "address": "1704 Washington St",
    "lat": 42.3601,
    "lng": -71.0589,
    "cuisine": "Spanish Tapas",
    "cuisineTags": [
      "Spanish Tapas"
    ],
    "vibeTags": [
      "iconic"
    ],
    "occasionTags": [
      "in-laws"
    ],
    "price": "$$$",
    "priceLevel": 3,
    "vibeNotes": "Ken Oringer's iconic tapas; great for sharing, lively but approachable",
    "sourceCredit": "TikTok"
  },
  {
    "id": "fe404ea9-a67f-6e1e-e1e3-d8be14c4063c",
    "name": "Legal Sea Foods",
    "slug": "legal-sea-foods",
    "city": "Boston",
    "state": "MA",
    "neighborhood": "Seaport",
    "address": "270 Northern Ave",
    "lat": 42.3601,
    "lng": -71.0589,
    "cuisine": "Seafood",
    "cuisineTags": [
      "Seafood"
    ],
    "vibeTags": [],
    "occasionTags": [
      "in-laws"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Boston institution since 1950, reliably excellent clam chowder and lobster",
    "sourceCredit": "Instagram"
  },
  {
    "id": "ea2302ec-db35-648d-f431-66c4a6e204bf",
    "name": "Harvest",
    "slug": "harvest",
    "city": "Boston",
    "state": "MA",
    "neighborhood": "Harvard Square",
    "address": "44 Brattle St",
    "lat": 42.3601,
    "lng": -71.0589,
    "cuisine": "New American",
    "cuisineTags": [
      "New American"
    ],
    "vibeTags": [
      "elegant",
      "patio"
    ],
    "occasionTags": [
      "in-laws"
    ],
    "price": "$$$",
    "priceLevel": 3,
    "vibeNotes": "Elegant farm-to-table beside Harvard Yard; garden patio in summer",
    "sourceCredit": "TikTok"
  },
  {
    "id": "4941e486-a32e-ad63-93cb-7d157b475347",
    "name": "Union Oyster House",
    "slug": "union-oyster-house",
    "city": "Boston",
    "state": "MA",
    "neighborhood": "Faneuil Hall",
    "address": "41 Union St",
    "lat": 42.3601,
    "lng": -71.0589,
    "cuisine": "Seafood / Historic",
    "cuisineTags": [
      "Seafood",
      "Historic"
    ],
    "vibeTags": [],
    "occasionTags": [
      "in-laws"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "America's oldest restaurant (1826), classic New England seafood",
    "sourceCredit": "Instagram"
  },
  {
    "id": "c7c6c80c-62d1-67e0-f6ed-b9d951c4ca58",
    "name": "Top of the Hub",
    "slug": "top-of-the-hub",
    "city": "Boston",
    "state": "MA",
    "neighborhood": "Back Bay",
    "address": "800 Boylston St",
    "lat": 42.3601,
    "lng": -71.0589,
    "cuisine": "American / Views",
    "cuisineTags": [
      "American",
      "Views"
    ],
    "vibeTags": [
      "cocktails"
    ],
    "occasionTags": [
      "in-laws"
    ],
    "price": "$$$",
    "priceLevel": 3,
    "vibeNotes": "52nd-floor dining with panoramic Boston views, classic cocktails",
    "sourceCredit": "TikTok"
  },
  {
    "id": "4591d180-6458-4809-d243-57e3928ffd07",
    "name": "Grace by Nia",
    "slug": "grace-by-nia",
    "city": "Boston",
    "state": "MA",
    "neighborhood": "Back Bay",
    "address": "1 Huntington Ave",
    "lat": 42.3601,
    "lng": -71.0589,
    "cuisine": "American / Lounge",
    "cuisineTags": [
      "American",
      "Lounge"
    ],
    "vibeTags": [
      "dj",
      "cocktails"
    ],
    "occasionTags": [
      "girls-night"
    ],
    "price": "$$$",
    "priceLevel": 3,
    "vibeNotes": "Chic restaurant and lounge from Nia Grace, craft cocktails, DJ weekends",
    "sourceCredit": "TikTok"
  },
  {
    "id": "442db14a-61ba-5438-f06c-1cb89f0ac9f6",
    "name": "Rosa y Marigold",
    "slug": "rosa-y-marigold",
    "city": "Boston",
    "state": "MA",
    "neighborhood": "South End",
    "address": "21 Waltham St",
    "lat": 42.3601,
    "lng": -71.0589,
    "cuisine": "Mexican / Wine Bar",
    "cuisineTags": [
      "Mexican",
      "Wine Bar"
    ],
    "vibeTags": [
      "wine",
      "late-night"
    ],
    "occasionTags": [
      "girls-night"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Pink-walled wine bar with mezcal flights, small plates, total girls night vibe",
    "sourceCredit": "Instagram"
  },
  {
    "id": "c5b8d646-20a6-d3b5-5232-ec234c264ae6",
    "name": "Mr. H",
    "slug": "mr-h",
    "city": "Boston",
    "state": "MA",
    "neighborhood": "Back Bay",
    "address": "1 Dalton St",
    "lat": 42.3601,
    "lng": -71.0589,
    "cuisine": "Cocktail Lounge",
    "cuisineTags": [
      "Cocktail Lounge"
    ],
    "vibeTags": [
      "intimate",
      "rooftop",
      "cocktails"
    ],
    "occasionTags": [
      "girls-night"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Private rooftop bar atop Four Seasons, intimate and exclusive, stunning views",
    "sourceCredit": "TikTok"
  },
  {
    "id": "fddcdab9-f75a-11b1-2714-d2dc525a3f8b",
    "name": "La Padrona",
    "slug": "la-padrona",
    "city": "Boston",
    "state": "MA",
    "neighborhood": "North End",
    "address": "35 Salem St",
    "lat": 42.3601,
    "lng": -71.0589,
    "cuisine": "Italian / Wine Bar",
    "cuisineTags": [
      "Italian",
      "Wine Bar"
    ],
    "vibeTags": [
      "wine"
    ],
    "occasionTags": [
      "girls-night"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Female-owned wine bar in the North End; pasta flights, ros\u00e9 on tap",
    "sourceCredit": "Instagram"
  },
  {
    "id": "d59f8478-2ca4-94e8-a975-9aa92903dc51",
    "name": "Whisk",
    "slug": "whisk",
    "city": "Boston",
    "state": "MA",
    "neighborhood": "South End",
    "address": "1 Bow Market Way",
    "lat": 42.3601,
    "lng": -71.0589,
    "cuisine": "Baking Studio",
    "cuisineTags": [
      "Baking Studio"
    ],
    "vibeTags": [
      "wine"
    ],
    "occasionTags": [
      "girls-night"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Paint & sip but for baking; make pastries together with wine, total vibe",
    "sourceCredit": "TikTok"
  },
  {
    "id": "f18ea605-30de-08ba-70b2-ab229aa82b90",
    "name": "Paint and Pour",
    "slug": "paint-and-pour",
    "city": "Boston",
    "state": "MA",
    "neighborhood": "Cambridge",
    "address": "99 Bishop Allen Dr",
    "lat": 42.3601,
    "lng": -71.0589,
    "cuisine": "Art Studio / BYOB",
    "cuisineTags": [
      "Art Studio",
      "BYOB"
    ],
    "vibeTags": [
      "fun",
      "wine"
    ],
    "occasionTags": [
      "girls-night"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Canvas painting with wine; guided sessions, fun for all skill levels",
    "sourceCredit": "Instagram"
  },
  {
    "id": "3cceebae-1f56-ecfe-e1ab-b60bb03a232f",
    "name": "Drink",
    "slug": "drink",
    "city": "Boston",
    "state": "MA",
    "neighborhood": "Fort Point",
    "address": "348 Congress St",
    "lat": 42.3601,
    "lng": -71.0589,
    "cuisine": "Cocktail Bar",
    "cuisineTags": [
      "Cocktail Bar"
    ],
    "vibeTags": [
      "intimate",
      "cocktails"
    ],
    "occasionTags": [
      "girls-night"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "No menu \u2014 bartenders craft custom drinks to your mood; intimate and cool",
    "sourceCredit": "TikTok"
  },
  {
    "id": "ec6f7ea8-e8e1-7a3c-a862-f5e1b10b771c",
    "name": "Lolita Cocina & Tequila Bar",
    "slug": "lolita-cocina-tequila-bar",
    "city": "Boston",
    "state": "MA",
    "neighborhood": "Back Bay",
    "address": "271 Dartmouth St",
    "lat": 42.3601,
    "lng": -71.0589,
    "cuisine": "Mexican / Lounge",
    "cuisineTags": [
      "Mexican",
      "Lounge"
    ],
    "vibeTags": [
      "cocktails",
      "late-night"
    ],
    "occasionTags": [
      "girls-night"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Gothic Mexican lounge with creative tequila cocktails and a late-night scene",
    "sourceCredit": "Instagram"
  },
  {
    "id": "d29fe638-9722-097a-3f51-cd02bc0643c5",
    "name": "Garage Pub",
    "slug": "garage-pub",
    "city": "Boston",
    "state": "MA",
    "neighborhood": "Harvard Square",
    "address": "36 JFK St",
    "lat": 42.3601,
    "lng": -71.0589,
    "cuisine": "Bar / Games",
    "cuisineTags": [
      "Bar",
      "Games"
    ],
    "vibeTags": [],
    "occasionTags": [
      "guys-night"
    ],
    "price": "$",
    "priceLevel": 1,
    "vibeNotes": "Bowling, pool, darts, cheap beer \u2014 low-key guys night in Harvard Square",
    "sourceCredit": "Instagram"
  },
  {
    "id": "0d7c2451-bc00-ecfe-cbc8-41f08e1ff462",
    "name": "Lucky's Lounge",
    "slug": "lucky-s-lounge",
    "city": "Boston",
    "state": "MA",
    "neighborhood": "Fort Point",
    "address": "355 Congress St",
    "lat": 42.3601,
    "lng": -71.0589,
    "cuisine": "Retro Lounge",
    "cuisineTags": [
      "Retro Lounge"
    ],
    "vibeTags": [
      "live-music"
    ],
    "occasionTags": [
      "guys-night"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Underground retro bar with Rat Pack vibes, strong drinks, live music",
    "sourceCredit": "TikTok"
  },
  {
    "id": "b51e02a8-124c-6a9b-691d-80ac685db50e",
    "name": "Blade & Timber",
    "slug": "blade-timber",
    "city": "Boston",
    "state": "MA",
    "neighborhood": "Assembly Row",
    "address": "489 Foley St",
    "lat": 42.3601,
    "lng": -71.0589,
    "cuisine": "Axe Throwing / Bar",
    "cuisineTags": [
      "Axe Throwing",
      "Bar"
    ],
    "vibeTags": [
      "fun"
    ],
    "occasionTags": [
      "guys-night"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Axe throwing with craft beer on tap; competitive and fun",
    "sourceCredit": "Instagram"
  },
  {
    "id": "967e29c8-3cbe-0fa4-ff4c-397438c038ad",
    "name": "Night Shift Brewing",
    "slug": "night-shift-brewing",
    "city": "Boston",
    "state": "MA",
    "neighborhood": "Everett",
    "address": "87 Santilli Hwy",
    "lat": 42.3601,
    "lng": -71.0589,
    "cuisine": "Brewery / Taproom",
    "cuisineTags": [
      "Brewery",
      "Taproom"
    ],
    "vibeTags": [
      "outdoor"
    ],
    "occasionTags": [
      "guys-night"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Massive taproom with 20+ taps, food trucks, outdoor games",
    "sourceCredit": "TikTok"
  },
  {
    "id": "082be847-bc0b-40fc-3210-f61fbb8232bb",
    "name": "The Grand",
    "slug": "the-grand",
    "city": "Boston",
    "state": "MA",
    "neighborhood": "Back Bay",
    "address": "58 Seaport Blvd",
    "lat": 42.3601,
    "lng": -71.0589,
    "cuisine": "Sports Bar / Lounge",
    "cuisineTags": [
      "Sports Bar",
      "Lounge"
    ],
    "vibeTags": [
      "upscale"
    ],
    "occasionTags": [
      "guys-night"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Giant screens, premium bottle service, upscale sports viewing",
    "sourceCredit": "Instagram"
  },
  {
    "id": "16980485-19f1-16c0-2f4f-913d4dcc449a",
    "name": "Kings Dining & Entertainment",
    "slug": "kings-dining-entertainment",
    "city": "Boston",
    "state": "MA",
    "neighborhood": "Back Bay",
    "address": "50 Dalton St",
    "lat": 42.3601,
    "lng": -71.0589,
    "cuisine": "Bowling / Bar",
    "cuisineTags": [
      "Bowling",
      "Bar"
    ],
    "vibeTags": [
      "upscale",
      "cocktails"
    ],
    "occasionTags": [
      "guys-night"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Upscale bowling, billiards, and cocktails in a swanky retro setting",
    "sourceCredit": "TikTok"
  },
  {
    "id": "fe6ac4b5-afad-8909-0e3f-56dcf7be9e27",
    "name": "Scorpion Bar",
    "slug": "scorpion-bar",
    "city": "Boston",
    "state": "MA",
    "neighborhood": "Seaport",
    "address": "58 Seaport Blvd",
    "lat": 42.3601,
    "lng": -71.0589,
    "cuisine": "Mexican / Nightlife",
    "cuisineTags": [
      "Mexican",
      "Nightlife"
    ],
    "vibeTags": [
      "dj"
    ],
    "occasionTags": [
      "bachelor"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Massive space with DJs, tequila towers, bachelor party headquarters",
    "sourceCredit": "Instagram"
  },
  {
    "id": "0f6c025e-436c-1a05-52b0-c231ff09b7d8",
    "name": "Lincoln Tavern",
    "slug": "lincoln-tavern",
    "city": "Boston",
    "state": "MA",
    "neighborhood": "South Boston",
    "address": "425 W Broadway",
    "lat": 42.3601,
    "lng": -71.0589,
    "cuisine": "Bar / Brunch",
    "cuisineTags": [
      "Bar",
      "Brunch"
    ],
    "vibeTags": [
      "brunch"
    ],
    "occasionTags": [
      "bachelor"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Legendary brunch turns into Southie day party; great kickoff spot",
    "sourceCredit": "Instagram"
  },
  {
    "id": "c2bc2a26-720b-6756-e4ce-a2407e0dc405",
    "name": "Tony C's",
    "slug": "tony-c-s",
    "city": "Boston",
    "state": "MA",
    "neighborhood": "Seaport",
    "address": "450 Summer St",
    "lat": 42.3601,
    "lng": -71.0589,
    "cuisine": "Sports Bar",
    "cuisineTags": [
      "Sports Bar"
    ],
    "vibeTags": [],
    "occasionTags": [
      "bachelor"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "High-energy sports bar with multiple levels and big screens",
    "sourceCredit": "TikTok"
  },
  {
    "id": "839a5a86-b835-a7f6-a8cb-23d709b52903",
    "name": "TopGolf",
    "slug": "topgolf",
    "city": "Boston",
    "state": "MA",
    "neighborhood": "Canton",
    "address": "400 Blue Hill Dr",
    "lat": 42.3601,
    "lng": -71.0589,
    "cuisine": "Golf / Entertainment",
    "cuisineTags": [
      "Golf",
      "Entertainment"
    ],
    "vibeTags": [],
    "occasionTags": [
      "bachelor"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Multi-level driving range with full bar, games, and group bays",
    "sourceCredit": "Instagram"
  },
  {
    "id": "7acda63c-6c19-c397-e5fc-2b1a9e0ff81e",
    "name": "Assembly Row",
    "slug": "assembly-row",
    "city": "Boston",
    "state": "MA",
    "neighborhood": "Somerville",
    "address": "Assembly Row Blvd",
    "lat": 42.3601,
    "lng": -71.0589,
    "cuisine": "Shopping / Food Hall",
    "cuisineTags": [
      "Shopping",
      "Food Hall"
    ],
    "vibeTags": [
      "waterfront",
      "outdoor"
    ],
    "occasionTags": [
      "outdoor-adventure"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Outdoor shops, restaurants, and waterfront boardwalk; all-day hang",
    "sourceCredit": "Instagram"
  },
  {
    "id": "cd2cf7c4-2501-0300-a891-4b15ca264475",
    "name": "Lawn on D",
    "slug": "lawn-on-d",
    "city": "Boston",
    "state": "MA",
    "neighborhood": "Seaport",
    "address": "420 D St",
    "lat": 42.3601,
    "lng": -71.0589,
    "cuisine": "Outdoor Park / Bar",
    "cuisineTags": [
      "Outdoor Park",
      "Bar"
    ],
    "vibeTags": [
      "outdoor",
      "live-music",
      "iconic"
    ],
    "occasionTags": [
      "outdoor-adventure"
    ],
    "price": "$",
    "priceLevel": 1,
    "vibeNotes": "Giant swings, lawn games, live music, food trucks \u2014 iconic Boston hangout",
    "sourceCredit": "TikTok"
  },
  {
    "id": "42529ce7-7842-12e4-8c42-dbc8860b8116",
    "name": "Castle Island",
    "slug": "castle-island",
    "city": "Boston",
    "state": "MA",
    "neighborhood": "South Boston",
    "address": "2010 William J Day Blvd",
    "lat": 42.3601,
    "lng": -71.0589,
    "cuisine": "Park / Seafood",
    "cuisineTags": [
      "Park",
      "Seafood"
    ],
    "vibeTags": [
      "waterfront"
    ],
    "occasionTags": [
      "outdoor-adventure"
    ],
    "price": "$",
    "priceLevel": 1,
    "vibeNotes": "Walk the fort, get fried clams at Sullivan's, waterfront views",
    "sourceCredit": "Instagram"
  },
  {
    "id": "a94c437d-2a05-a395-b0ce-9c5b3fd24fb0",
    "name": "SoWa Open Market",
    "slug": "sowa-open-market",
    "city": "Boston",
    "state": "MA",
    "neighborhood": "South End",
    "address": "460 Harrison Ave",
    "lat": 42.3601,
    "lng": -71.0589,
    "cuisine": "Market / Food",
    "cuisineTags": [
      "Market",
      "Food"
    ],
    "vibeTags": [],
    "occasionTags": [
      "outdoor-adventure"
    ],
    "price": "$",
    "priceLevel": 1,
    "vibeNotes": "Sunday artisan market with food trucks, vintage finds, art vendors",
    "sourceCredit": "TikTok"
  },
  {
    "id": "4ebe0758-e712-ed84-6836-10a4a6bba478",
    "name": "Charles River Esplanade",
    "slug": "charles-river-esplanade",
    "city": "Boston",
    "state": "MA",
    "neighborhood": "Back Bay",
    "address": "Charles River Esplanade",
    "lat": 42.3601,
    "lng": -71.0589,
    "cuisine": "Park / Bike Path",
    "cuisineTags": [
      "Park",
      "Bike Path"
    ],
    "vibeTags": [],
    "occasionTags": [
      "outdoor-adventure"
    ],
    "price": "Free",
    "priceLevel": 1,
    "vibeNotes": "Kayak, bike, or picnic along the river; Hatch Shell concerts in summer",
    "sourceCredit": "Instagram"
  },
  {
    "id": "e4819ab2-271d-21eb-63b3-e05e463a403f",
    "name": "Trillium Brewing Garden",
    "slug": "trillium-brewing-garden",
    "city": "Boston",
    "state": "MA",
    "neighborhood": "Fenway",
    "address": "50 Thomson Pl",
    "lat": 42.3601,
    "lng": -71.0589,
    "cuisine": "Brewery / Beer Garden",
    "cuisineTags": [
      "Brewery",
      "Beer Garden"
    ],
    "vibeTags": [
      "outdoor"
    ],
    "occasionTags": [
      "outdoor-adventure"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Outdoor beer garden with local brews, food trucks, communal tables",
    "sourceCredit": "TikTok"
  },
  {
    "id": "93ba8411-2cc0-6924-f95c-663d1090abff",
    "name": "RVR",
    "slug": "rvr",
    "city": "California",
    "state": "CA",
    "neighborhood": "Venice (LA)",
    "address": "1633 Abbot Kinney Blvd",
    "lat": 34.0522,
    "lng": -118.2437,
    "cuisine": "Mediterranean",
    "cuisineTags": [
      "Mediterranean"
    ],
    "vibeTags": [
      "viral"
    ],
    "occasionTags": [
      "date-night"
    ],
    "price": "$$$$",
    "priceLevel": 4,
    "vibeNotes": "TikTok viral from @camberplaces; Abbot Kinney stunner; seasonal",
    "sourceCredit": "TikTok @camberplaces"
  },
  {
    "id": "c3732be8-da1e-7e06-1d30-4b0180c49421",
    "name": "Holbox",
    "slug": "holbox",
    "city": "California",
    "state": "CA",
    "neighborhood": "Historic South Central (LA)",
    "address": "3655 S Grand Ave",
    "lat": 34.0522,
    "lng": -118.2437,
    "cuisine": "Mexican Seafood",
    "cuisineTags": [
      "Mexican Seafood"
    ],
    "vibeTags": [
      "viral"
    ],
    "occasionTags": [
      "date-night"
    ],
    "price": "$$$",
    "priceLevel": 3,
    "vibeNotes": "TikTok famous; Baja-style seafood; Mercado La Paloma gem",
    "sourceCredit": "TikTok @camberplaces"
  },
  {
    "id": "94ebcbe6-21d4-0d81-a967-90351fdea08a",
    "name": "Elena's",
    "slug": "elena-s",
    "city": "California",
    "state": "CA",
    "neighborhood": "San Francisco",
    "address": "290 Sanchez St",
    "lat": 34.0522,
    "lng": -118.2437,
    "cuisine": "Filipino-Italian",
    "cuisineTags": [
      "Filipino-Italian"
    ],
    "vibeTags": [
      "intimate",
      "viral"
    ],
    "occasionTags": [
      "date-night"
    ],
    "price": "$$$$",
    "priceLevel": 4,
    "vibeNotes": "6.7K TikTok likes; chef Roberta Domingo; intimate tasting",
    "sourceCredit": "TikTok @lifewithpao"
  },
  {
    "id": "fb308531-d4b4-2ce2-c6e5-2e3860e23016",
    "name": "Empress by Boon",
    "slug": "empress-by-boon",
    "city": "California",
    "state": "CA",
    "neighborhood": "San Francisco",
    "address": "838 Grant Ave",
    "lat": 34.0522,
    "lng": -118.2437,
    "cuisine": "Cantonese Fine Dining",
    "cuisineTags": [
      "Cantonese Fine Dining"
    ],
    "vibeTags": [
      "rooftop",
      "michelin"
    ],
    "occasionTags": [
      "date-night"
    ],
    "price": "$$$$",
    "priceLevel": 4,
    "vibeNotes": "Michelin-starred Cantonese; Chinatown rooftop; SF legend",
    "sourceCredit": "TikTok @sanfranciscobucketlist"
  },
  {
    "id": "e2a54942-f1b1-94de-97cb-0ce515129906",
    "name": "Mister Jiu's",
    "slug": "mister-jiu-s",
    "city": "California",
    "state": "CA",
    "neighborhood": "San Francisco",
    "address": "28 Waverly Pl",
    "lat": 34.0522,
    "lng": -118.2437,
    "cuisine": "Chinese-American",
    "cuisineTags": [
      "Chinese-American"
    ],
    "vibeTags": [
      "wine",
      "michelin"
    ],
    "occasionTags": [
      "date-night"
    ],
    "price": "$$$$",
    "priceLevel": 4,
    "vibeNotes": "Michelin star; Chinatown innovation; dim sum + natural wine",
    "sourceCredit": "TikTok @sanfranciscobucketlist"
  },
  {
    "id": "d2490639-19bd-ba10-32aa-e831bb2c4781",
    "name": "Sushisamba WeHo",
    "slug": "sushisamba-weho",
    "city": "California",
    "state": "CA",
    "neighborhood": "West Hollywood (LA)",
    "address": "8818 Sunset Blvd",
    "lat": 34.0522,
    "lng": -118.2437,
    "cuisine": "Japanese-Brazilian",
    "cuisineTags": [
      "Japanese-Brazilian"
    ],
    "vibeTags": [
      "sunset"
    ],
    "occasionTags": [
      "date-night"
    ],
    "price": "$$$$",
    "priceLevel": 4,
    "vibeNotes": "Sunset Strip stunner; Nikkei fusion; celeb-heavy",
    "sourceCredit": "Eater LA"
  },
  {
    "id": "f30d5869-2567-d29d-8755-dbbe4547c3df",
    "name": "BAR di Bello",
    "slug": "bar-di-bello",
    "city": "California",
    "state": "CA",
    "neighborhood": "Los Feliz (LA)",
    "address": "1966 Hillhurst Ave",
    "lat": 34.0522,
    "lng": -118.2437,
    "cuisine": "Italian Wine Bar",
    "cuisineTags": [
      "Italian Wine Bar"
    ],
    "vibeTags": [
      "romantic",
      "wine"
    ],
    "occasionTags": [
      "date-night"
    ],
    "price": "$$$",
    "priceLevel": 3,
    "vibeNotes": "Los Feliz romantic Italian; natural wine; pasta perfection",
    "sourceCredit": "Eater LA"
  },
  {
    "id": "538e9d06-eb27-579c-2302-d480f58cc34f",
    "name": "Nozomi",
    "slug": "nozomi",
    "city": "California",
    "state": "CA",
    "neighborhood": "Beverly Hills (LA)",
    "address": "256 N Beverly Dr",
    "lat": 34.0522,
    "lng": -118.2437,
    "cuisine": "Japanese",
    "cuisineTags": [
      "Japanese"
    ],
    "vibeTags": [],
    "occasionTags": [
      "date-night"
    ],
    "price": "$$$$",
    "priceLevel": 4,
    "vibeNotes": "Beverly Hills omakase; sleek; high-end sushi counter",
    "sourceCredit": "Eater LA"
  },
  {
    "id": "5c8ea6b2-6346-e11f-85c6-2dbce13a6858",
    "name": "Zouk LA",
    "slug": "zouk-la",
    "city": "California",
    "state": "CA",
    "neighborhood": "DTLA (LA)",
    "address": "200 S Los Angeles St",
    "lat": 34.0522,
    "lng": -118.2437,
    "cuisine": "Nightclub",
    "cuisineTags": [
      "Nightclub"
    ],
    "vibeTags": [
      "dj"
    ],
    "occasionTags": [
      "group-night-out",
      "bachelor"
    ],
    "price": "$$$$",
    "priceLevel": 4,
    "vibeNotes": "Mega-club; world-class DJs; multi-room; production insane",
    "sourceCredit": "DJ Mag"
  },
  {
    "id": "e766461a-60ed-9462-ac64-dd3c1cf25f16",
    "name": "Bar Benjamin",
    "slug": "bar-benjamin",
    "city": "California",
    "state": "CA",
    "neighborhood": "Melrose (LA)",
    "address": "7871 Melrose Ave",
    "lat": 34.0522,
    "lng": -118.2437,
    "cuisine": "Cocktail Bar",
    "cuisineTags": [
      "Cocktail Bar"
    ],
    "vibeTags": [
      "cocktails",
      "viral"
    ],
    "occasionTags": [
      "group-night-out"
    ],
    "price": "$$$",
    "priceLevel": 3,
    "vibeNotes": "TikTok-famous Melrose cocktail bar; inventive drinks; chic",
    "sourceCredit": "TikTok @camberplaces"
  },
  {
    "id": "916685cc-caad-2212-60a2-bab654a17a59",
    "name": "Ciccino",
    "slug": "ciccino",
    "city": "California",
    "state": "CA",
    "neighborhood": "Nob Hill (SF)",
    "address": "850 Bush St",
    "lat": 34.0522,
    "lng": -118.2437,
    "cuisine": "Italian",
    "cuisineTags": [
      "Italian"
    ],
    "vibeTags": [
      "viral"
    ],
    "occasionTags": [
      "group-night-out"
    ],
    "price": "$$$",
    "priceLevel": 3,
    "vibeNotes": "Nob Hill Italian; TikTok \"must-try\"; handmade pasta; lively",
    "sourceCredit": "TikTok @sanfranciscobucketlist"
  },
  {
    "id": "779eee36-95e8-47e6-0652-23f79eb95b0b",
    "name": "The Hummingbird",
    "slug": "the-hummingbird",
    "city": "California",
    "state": "CA",
    "neighborhood": "Venice (LA)",
    "address": "1111 Lincoln Blvd",
    "lat": 34.0522,
    "lng": -118.2437,
    "cuisine": "Bar-Nightlife",
    "cuisineTags": [
      "Bar-Nightlife"
    ],
    "vibeTags": [
      "dj",
      "viral"
    ],
    "occasionTags": [
      "group-night-out"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "TikTok-featured Venice bar; DJs; good vibes; local crowd",
    "sourceCredit": "TikTok @camberplaces"
  },
  {
    "id": "2a5ba389-482e-f298-9974-336bd71816ef",
    "name": "Holy Basil",
    "slug": "holy-basil",
    "city": "California",
    "state": "CA",
    "neighborhood": "DTLA (LA)",
    "address": "810 S Spring St",
    "lat": 34.0522,
    "lng": -118.2437,
    "cuisine": "Thai-Nightlife",
    "cuisineTags": [
      "Thai-Nightlife"
    ],
    "vibeTags": [
      "viral",
      "late-night"
    ],
    "occasionTags": [
      "group-night-out"
    ],
    "price": "$$$",
    "priceLevel": 3,
    "vibeNotes": "TikTok viral Thai; DTLA party dining; late-night energy",
    "sourceCredit": "TikTok @camberplaces"
  },
  {
    "id": "01f5089d-a65a-c34f-e464-e993bcb9c6b8",
    "name": "Kettner Exchange",
    "slug": "kettner-exchange",
    "city": "California",
    "state": "CA",
    "neighborhood": "Little Italy (SD)",
    "address": "2001 Kettner Blvd",
    "lat": 34.0522,
    "lng": -118.2437,
    "cuisine": "American-Rooftop",
    "cuisineTags": [
      "American-Rooftop"
    ],
    "vibeTags": [
      "rooftop",
      "cocktails"
    ],
    "occasionTags": [
      "group-night-out"
    ],
    "price": "$$$",
    "priceLevel": 3,
    "vibeNotes": "San Diego rooftop; craft cocktails; group-perfect",
    "sourceCredit": "Eater San Diego"
  },
  {
    "id": "0a035ff8-adc1-a412-2310-54cfb940c674",
    "name": "Epic Steak",
    "slug": "epic-steak",
    "city": "California",
    "state": "CA",
    "neighborhood": "Embarcadero (SF)",
    "address": "369 The Embarcadero",
    "lat": 34.0522,
    "lng": -118.2437,
    "cuisine": "Steakhouse",
    "cuisineTags": [
      "Steakhouse"
    ],
    "vibeTags": [
      "viral"
    ],
    "occasionTags": [
      "group-night-out",
      "guys-night"
    ],
    "price": "$$$$",
    "priceLevel": 4,
    "vibeNotes": "Bay Bridge views; 9.7K TikTok likes; steaks + seafood",
    "sourceCredit": "TikTok @lifewithpao"
  },
  {
    "id": "ba9f4e2d-3051-2081-ec75-a475223d9dbf",
    "name": "Bootlegger",
    "slug": "bootlegger",
    "city": "California",
    "state": "CA",
    "neighborhood": "West Hollywood (LA)",
    "address": "8500 Beverly Blvd",
    "lat": 34.0522,
    "lng": -118.2437,
    "cuisine": "Cocktail Bar",
    "cuisineTags": [
      "Cocktail Bar"
    ],
    "vibeTags": [
      "cocktails",
      "late-night"
    ],
    "occasionTags": [
      "group-night-out"
    ],
    "price": "$$$",
    "priceLevel": 3,
    "vibeNotes": "Prohibition-themed; craft cocktails; late night",
    "sourceCredit": "Eater LA"
  },
  {
    "id": "e17d9a8c-81dc-5e6b-2741-23baf08b554c",
    "name": "Waterbar",
    "slug": "waterbar",
    "city": "California",
    "state": "CA",
    "neighborhood": "Embarcadero (SF)",
    "address": "399 The Embarcadero",
    "lat": 34.0522,
    "lng": -118.2437,
    "cuisine": "Seafood",
    "cuisineTags": [
      "Seafood"
    ],
    "vibeTags": [
      "waterfront",
      "viral"
    ],
    "occasionTags": [
      "family"
    ],
    "price": "$$$$",
    "priceLevel": 4,
    "vibeNotes": "Waterfront seafood; Bay Bridge panorama; TikTok featured",
    "sourceCredit": "TikTok @lifewithpao"
  },
  {
    "id": "616f302b-c549-76a1-40c6-70c751436667",
    "name": "Bestia",
    "slug": "bestia",
    "city": "California",
    "state": "CA",
    "neighborhood": "DTLA (LA)",
    "address": "2121 E 7th Pl",
    "lat": 34.0522,
    "lng": -118.2437,
    "cuisine": "Italian",
    "cuisineTags": [
      "Italian"
    ],
    "vibeTags": [],
    "occasionTags": [
      "family",
      "guys-night"
    ],
    "price": "$$$$",
    "priceLevel": 4,
    "vibeNotes": "DTLA Italian institution; rustic elegance; impress-anyone food",
    "sourceCredit": "Eater LA"
  },
  {
    "id": "46300066-a5d7-fa4d-083b-9e0b6cd97583",
    "name": "The French Laundry",
    "slug": "the-french-laundry",
    "city": "California",
    "state": "CA",
    "neighborhood": "Yountville",
    "address": "6640 Washington St",
    "lat": 34.0522,
    "lng": -118.2437,
    "cuisine": "French Fine Dining",
    "cuisineTags": [
      "French Fine Dining"
    ],
    "vibeTags": [
      "michelin"
    ],
    "occasionTags": [
      "family"
    ],
    "price": "$$$$",
    "priceLevel": 4,
    "vibeNotes": "3 Michelin stars; Thomas Keller; bucket-list destination",
    "sourceCredit": "Michelin Guide"
  },
  {
    "id": "61e0aaf5-af0c-a432-0e1f-3fdeef900e11",
    "name": "Juniper & Ivy",
    "slug": "juniper-ivy",
    "city": "California",
    "state": "CA",
    "neighborhood": "Little Italy (SD)",
    "address": "2228 Kettner Blvd",
    "lat": 34.0522,
    "lng": -118.2437,
    "cuisine": "New American",
    "cuisineTags": [
      "New American"
    ],
    "vibeTags": [
      "late-night"
    ],
    "occasionTags": [
      "family"
    ],
    "price": "$$$$",
    "priceLevel": 4,
    "vibeNotes": "San Diego fine dining; Richard Blais; innovative plates",
    "sourceCredit": "Eater San Diego"
  },
  {
    "id": "590127c3-82f0-55e2-8bad-87e1b72c905d",
    "name": "Seline",
    "slug": "seline",
    "city": "California",
    "state": "CA",
    "neighborhood": "DTLA (LA)",
    "address": "510 S Spring St",
    "lat": 34.0522,
    "lng": -118.2437,
    "cuisine": "Mediterranean",
    "cuisineTags": [
      "Mediterranean"
    ],
    "vibeTags": [
      "viral"
    ],
    "occasionTags": [
      "family"
    ],
    "price": "$$$$",
    "priceLevel": 4,
    "vibeNotes": "TikTok-featured; stunning interior; refined Med cuisine",
    "sourceCredit": "TikTok @camberplaces"
  },
  {
    "id": "25fe8238-b32a-ba1b-658c-aaea50d2b63d",
    "name": "Gary Danko",
    "slug": "gary-danko",
    "city": "California",
    "state": "CA",
    "neighborhood": "Russian Hill (SF)",
    "address": "800 N Point St",
    "lat": 34.0522,
    "lng": -118.2437,
    "cuisine": "French-American",
    "cuisineTags": [
      "French-American"
    ],
    "vibeTags": [
      "michelin"
    ],
    "occasionTags": [
      "family"
    ],
    "price": "$$$$",
    "priceLevel": 4,
    "vibeNotes": "Michelin star; prix fixe; legendary SF fine dining",
    "sourceCredit": "Michelin Guide"
  },
  {
    "id": "553180bc-a6a8-427c-6893-3c788875109a",
    "name": "Quince",
    "slug": "quince",
    "city": "California",
    "state": "CA",
    "neighborhood": "Jackson Square (SF)",
    "address": "470 Pacific Ave",
    "lat": 34.0522,
    "lng": -118.2437,
    "cuisine": "Italian Fine Dining",
    "cuisineTags": [
      "Italian Fine Dining"
    ],
    "vibeTags": [
      "michelin"
    ],
    "occasionTags": [
      "family"
    ],
    "price": "$$$$",
    "priceLevel": 4,
    "vibeNotes": "3 Michelin stars; farm-driven Italian; special occasion",
    "sourceCredit": "Michelin Guide"
  },
  {
    "id": "c52bda06-6ff8-69ea-e47e-35a156e39f47",
    "name": "Barra Santos",
    "slug": "barra-santos",
    "city": "California",
    "state": "CA",
    "neighborhood": "Silverlake (LA)",
    "address": "3517 W Sunset Blvd",
    "lat": 34.0522,
    "lng": -118.2437,
    "cuisine": "Brazilian",
    "cuisineTags": [
      "Brazilian"
    ],
    "vibeTags": [
      "late-night",
      "viral"
    ],
    "occasionTags": [
      "family"
    ],
    "price": "$$$",
    "priceLevel": 3,
    "vibeNotes": "TikTok-featured; Brazilian small plates; warm vibes",
    "sourceCredit": "TikTok @camberplaces"
  },
  {
    "id": "eb52c2b8-d7fa-06f9-0d29-3175233b02cf",
    "name": "Budonoki",
    "slug": "budonoki",
    "city": "California",
    "state": "CA",
    "neighborhood": "WeHo (LA)",
    "address": "8225 Beverly Blvd",
    "lat": 34.0522,
    "lng": -118.2437,
    "cuisine": "Japanese",
    "cuisineTags": [
      "Japanese"
    ],
    "vibeTags": [
      "viral",
      "cocktails"
    ],
    "occasionTags": [
      "girls-night"
    ],
    "price": "$$$$",
    "priceLevel": 4,
    "vibeNotes": "TikTok viral; Japanese elegance; cocktail game strong",
    "sourceCredit": "TikTok @camberplaces"
  },
  {
    "id": "8252bbef-6b8a-ca76-b560-8aef298f51e5",
    "name": "Catch LA",
    "slug": "catch-la",
    "city": "California",
    "state": "CA",
    "neighborhood": "West Hollywood (LA)",
    "address": "8715 Melrose Ave",
    "lat": 34.0522,
    "lng": -118.2437,
    "cuisine": "Seafood-Rooftop",
    "cuisineTags": [
      "Seafood-Rooftop"
    ],
    "vibeTags": [
      "rooftop",
      "sunset"
    ],
    "occasionTags": [
      "girls-night"
    ],
    "price": "$$$$",
    "priceLevel": 4,
    "vibeNotes": "Rooftop seafood; celebrity hotspot; gorgeous sunset views",
    "sourceCredit": "Eater LA"
  },
  {
    "id": "6306e710-95d4-c903-4a08-01fab8a2b422",
    "name": "Bavel",
    "slug": "bavel",
    "city": "California",
    "state": "CA",
    "neighborhood": "DTLA (LA)",
    "address": "500 Mateo St",
    "lat": 34.0522,
    "lng": -118.2437,
    "cuisine": "Middle Eastern",
    "cuisineTags": [
      "Middle Eastern"
    ],
    "vibeTags": [
      "cocktails"
    ],
    "occasionTags": [
      "girls-night"
    ],
    "price": "$$$$",
    "priceLevel": 4,
    "vibeNotes": "Arts District stunner; mezze + cocktails; date + girls night",
    "sourceCredit": "Eater LA"
  },
  {
    "id": "2b5823ce-d67f-ca7f-ea27-29482d974119",
    "name": "Foreign Cinema",
    "slug": "foreign-cinema",
    "city": "California",
    "state": "CA",
    "neighborhood": "Mission (SF)",
    "address": "2534 Mission St",
    "lat": 34.0522,
    "lng": -118.2437,
    "cuisine": "California-Mediterranean",
    "cuisineTags": [
      "California-Mediterranean"
    ],
    "vibeTags": [
      "romantic",
      "outdoor"
    ],
    "occasionTags": [
      "girls-night"
    ],
    "price": "$$$$",
    "priceLevel": 4,
    "vibeNotes": "Outdoor movies while dining; Mission District icon; romantic",
    "sourceCredit": "Eater SF"
  },
  {
    "id": "dd79c206-347a-7e64-4cd6-03d205d9e1c7",
    "name": "Angler",
    "slug": "angler",
    "city": "California",
    "state": "CA",
    "neighborhood": "Embarcadero (SF)",
    "address": "132 The Embarcadero",
    "lat": 34.0522,
    "lng": -118.2437,
    "cuisine": "Seafood",
    "cuisineTags": [
      "Seafood"
    ],
    "vibeTags": [
      "waterfront",
      "michelin"
    ],
    "occasionTags": [
      "girls-night"
    ],
    "price": "$$$$",
    "priceLevel": 4,
    "vibeNotes": "Michelin star; waterfront; Joshua Skenes; chic",
    "sourceCredit": "Michelin Guide"
  },
  {
    "id": "1abb4a7f-8528-f1de-b858-85e7de13c093",
    "name": "The Rooftop at 1 Hotel",
    "slug": "the-rooftop-at-1-hotel",
    "city": "California",
    "state": "CA",
    "neighborhood": "West Hollywood (LA)",
    "address": "8490 Sunset Blvd",
    "lat": 34.0522,
    "lng": -118.2437,
    "cuisine": "Rooftop Bar",
    "cuisineTags": [
      "Rooftop Bar"
    ],
    "vibeTags": [
      "rooftop",
      "sunset",
      "instagrammable"
    ],
    "occasionTags": [
      "girls-night"
    ],
    "price": "$$$",
    "priceLevel": 3,
    "vibeNotes": "Sunset Strip rooftop; skyline views; Instagram heaven",
    "sourceCredit": "Eater LA"
  },
  {
    "id": "2901b955-165a-f23a-2783-1c3c4e7c41f2",
    "name": "Mama Lion",
    "slug": "mama-lion",
    "city": "California",
    "state": "CA",
    "neighborhood": "Koreatown (LA)",
    "address": "3832 Wilshire Blvd",
    "lat": 34.0522,
    "lng": -118.2437,
    "cuisine": "Southeast Asian-Lounge",
    "cuisineTags": [
      "Southeast Asian-Lounge"
    ],
    "vibeTags": [
      "live-music",
      "cocktails"
    ],
    "occasionTags": [
      "girls-night"
    ],
    "price": "$$$",
    "priceLevel": 3,
    "vibeNotes": "Gorgeous K-Town lounge; live music; craft cocktails",
    "sourceCredit": "Eater LA"
  },
  {
    "id": "f4f3c25b-60b5-a0c4-28ec-5aeb72e6c892",
    "name": "Whitechapel",
    "slug": "whitechapel",
    "city": "California",
    "state": "CA",
    "neighborhood": "SoMa (SF)",
    "address": "600 Polk St",
    "lat": 34.0522,
    "lng": -118.2437,
    "cuisine": "Gin Bar",
    "cuisineTags": [
      "Gin Bar"
    ],
    "vibeTags": [
      "cocktails"
    ],
    "occasionTags": [
      "girls-night"
    ],
    "price": "$$$",
    "priceLevel": 3,
    "vibeNotes": "400+ gins; Victorian-industrial design; cocktail paradise",
    "sourceCredit": "Eater SF"
  },
  {
    "id": "c389ea55-3467-bc30-94f6-14dc0dc876f1",
    "name": "Petco Park area bars",
    "slug": "petco-park-area-bars",
    "city": "California",
    "state": "CA",
    "neighborhood": "East Village (SD)",
    "address": "Park Blvd",
    "lat": 34.0522,
    "lng": -118.2437,
    "cuisine": "Sports Bars",
    "cuisineTags": [
      "Sports Bars"
    ],
    "vibeTags": [],
    "occasionTags": [
      "guys-night"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Pre-game Padres; multiple sports bars; group-ready",
    "sourceCredit": "Visit San Diego"
  },
  {
    "id": "79b7a32f-8f87-a39f-d6e6-fb8ba7b75cdd",
    "name": "ABV",
    "slug": "abv",
    "city": "California",
    "state": "CA",
    "neighborhood": "Mission (SF)",
    "address": "3174 16th St",
    "lat": 34.0522,
    "lng": -118.2437,
    "cuisine": "Cocktail Bar",
    "cuisineTags": [
      "Cocktail Bar"
    ],
    "vibeTags": [
      "cocktails"
    ],
    "occasionTags": [
      "guys-night"
    ],
    "price": "$$$",
    "priceLevel": 3,
    "vibeNotes": "World-class cocktails; creative menu; Mission District",
    "sourceCredit": "Eater SF"
  },
  {
    "id": "32e4060a-3055-080a-17f2-4849205baad5",
    "name": "Ye Rustic Inn",
    "slug": "ye-rustic-inn",
    "city": "California",
    "state": "CA",
    "neighborhood": "Los Feliz (LA)",
    "address": "1831 Hillhurst Ave",
    "lat": 34.0522,
    "lng": -118.2437,
    "cuisine": "Dive Bar",
    "cuisineTags": [
      "Dive Bar"
    ],
    "vibeTags": [],
    "occasionTags": [
      "guys-night"
    ],
    "price": "$",
    "priceLevel": 1,
    "vibeNotes": "Classic LA dive; cheap drinks; jukebox; no pretense",
    "sourceCredit": "Eater LA"
  },
  {
    "id": "53550ea6-7a7c-0a32-c095-614058eeaaf5",
    "name": "Musso & Frank Grill",
    "slug": "musso-frank-grill",
    "city": "California",
    "state": "CA",
    "neighborhood": "Hollywood (LA)",
    "address": "6667 Hollywood Blvd",
    "lat": 34.0522,
    "lng": -118.2437,
    "cuisine": "Steakhouse",
    "cuisineTags": [
      "Steakhouse"
    ],
    "vibeTags": [],
    "occasionTags": [
      "guys-night"
    ],
    "price": "$$$$",
    "priceLevel": 4,
    "vibeNotes": "Hollywood's oldest restaurant (1919); martinis; classic",
    "sourceCredit": "Classic LA"
  },
  {
    "id": "a1e02244-c498-b7d4-174d-b9f67fb9ea9c",
    "name": "Toronado",
    "slug": "toronado",
    "city": "California",
    "state": "CA",
    "neighborhood": "Lower Haight (SF)",
    "address": "547 Haight St",
    "lat": 34.0522,
    "lng": -118.2437,
    "cuisine": "Beer Bar",
    "cuisineTags": [
      "Beer Bar"
    ],
    "vibeTags": [],
    "occasionTags": [
      "guys-night"
    ],
    "price": "$",
    "priceLevel": 1,
    "vibeNotes": "50+ taps; sausage grill next door; no-frills beer mecca",
    "sourceCredit": "Eater SF"
  },
  {
    "id": "ee3844d0-bdbe-63e0-afd5-aa6c63b49aae",
    "name": "Punch Line",
    "slug": "punch-line",
    "city": "California",
    "state": "CA",
    "neighborhood": "Financial District (SF)",
    "address": "444 Battery St",
    "lat": 34.0522,
    "lng": -118.2437,
    "cuisine": "Comedy Club",
    "cuisineTags": [
      "Comedy Club"
    ],
    "vibeTags": [],
    "occasionTags": [
      "guys-night"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Legendary comedy club; big names; great night out",
    "sourceCredit": "Visit SF"
  },
  {
    "id": "3ec41736-a9ea-7196-3a14-30447cb2868c",
    "name": "Encore Beach Club (Vegas day trip)",
    "slug": "encore-beach-club-vegas-day-trip",
    "city": "California",
    "state": "CA",
    "neighborhood": "Las Vegas",
    "address": "3131 Las Vegas Blvd",
    "lat": 34.0522,
    "lng": -118.2437,
    "cuisine": "Pool Party",
    "cuisineTags": [
      "Pool Party"
    ],
    "vibeTags": [],
    "occasionTags": [
      "bachelor"
    ],
    "price": "$$$$",
    "priceLevel": 4,
    "vibeNotes": "Classic Vegas bachelor; pool party; short flight from LA-SF-SD",
    "sourceCredit": "Vegas.com"
  },
  {
    "id": "a9d6737c-6158-6ed3-b1a5-0d9babf57291",
    "name": "Gaslamp Quarter",
    "slug": "gaslamp-quarter",
    "city": "California",
    "state": "CA",
    "neighborhood": "Downtown (SD)",
    "address": "5th Ave",
    "lat": 34.0522,
    "lng": -118.2437,
    "cuisine": "Bar District",
    "cuisineTags": [
      "Bar District"
    ],
    "vibeTags": [],
    "occasionTags": [
      "bachelor"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "San Diego nightlife HQ; 15+ blocks of bars + clubs",
    "sourceCredit": "Visit San Diego"
  },
  {
    "id": "9910ad40-b08e-f569-ed70-7e254ddb61c5",
    "name": "Topgolf",
    "slug": "topgolf",
    "city": "California",
    "state": "CA",
    "neighborhood": "Multiple CA",
    "address": "Various",
    "lat": 34.0522,
    "lng": -118.2437,
    "cuisine": "Golf-Lounge",
    "cuisineTags": [
      "Golf-Lounge"
    ],
    "vibeTags": [],
    "occasionTags": [
      "bachelor"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Multi-level range; full bar; daytime activity",
    "sourceCredit": "Topgolf"
  },
  {
    "id": "c7ba0a6f-5732-b775-89c1-4f53298ce8c2",
    "name": "Audio",
    "slug": "audio",
    "city": "California",
    "state": "CA",
    "neighborhood": "DTLA (LA)",
    "address": "918 S Olive St",
    "lat": 34.0522,
    "lng": -118.2437,
    "cuisine": "Nightclub",
    "cuisineTags": [
      "Nightclub"
    ],
    "vibeTags": [],
    "occasionTags": [
      "bachelor"
    ],
    "price": "$$$",
    "priceLevel": 3,
    "vibeNotes": "DTLA underground club; techno-house; warehouse energy",
    "sourceCredit": "TimeOut LA"
  },
  {
    "id": "060f6ceb-4f5b-8ca3-97d1-e0e2f8794252",
    "name": "Temple",
    "slug": "temple",
    "city": "California",
    "state": "CA",
    "neighborhood": "SoMa (SF)",
    "address": "540 Howard St",
    "lat": 34.0522,
    "lng": -118.2437,
    "cuisine": "Nightclub",
    "cuisineTags": [
      "Nightclub"
    ],
    "vibeTags": [
      "dj"
    ],
    "occasionTags": [
      "bachelor"
    ],
    "price": "$$$",
    "priceLevel": 3,
    "vibeNotes": "SF mega-club; multiple rooms; top DJs; bottle service",
    "sourceCredit": "TimeOut SF"
  },
  {
    "id": "42a190bd-a4f4-abb4-d984-71cd320e749a",
    "name": "Pacific Beach",
    "slug": "pacific-beach",
    "city": "California",
    "state": "CA",
    "neighborhood": "PB (SD)",
    "address": "Garnet Ave",
    "lat": 34.0522,
    "lng": -118.2437,
    "cuisine": "Beach-Bar Crawl",
    "cuisineTags": [
      "Beach-Bar Crawl"
    ],
    "vibeTags": [],
    "occasionTags": [
      "bachelor"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Beach + bar hop; PB Shore Club; Mavericks; JRDN",
    "sourceCredit": "Visit San Diego"
  },
  {
    "id": "d0932826-a24d-29c1-3c9c-ede71fa9e4d5",
    "name": "Napa Wine Train",
    "slug": "napa-wine-train",
    "city": "California",
    "state": "CA",
    "neighborhood": "Napa Valley",
    "address": "1275 McKinstry St",
    "lat": 34.0522,
    "lng": -118.2437,
    "cuisine": "Wine-Dining Train",
    "cuisineTags": [
      "Wine-Dining Train"
    ],
    "vibeTags": [
      "wine"
    ],
    "occasionTags": [
      "bachelor"
    ],
    "price": "$$$",
    "priceLevel": 3,
    "vibeNotes": "Scenic wine country train; multi-course dining; group activity",
    "sourceCredit": "Napa Wine Train"
  },
  {
    "id": "aed9d50b-13e9-5dbb-e72e-be574d3382a4",
    "name": "Venice Beach Boardwalk",
    "slug": "venice-beach-boardwalk",
    "city": "California",
    "state": "CA",
    "neighborhood": "Venice (LA)",
    "address": "Ocean Front Walk",
    "lat": 34.0522,
    "lng": -118.2437,
    "cuisine": "Beach-Culture",
    "cuisineTags": [
      "Beach-Culture"
    ],
    "vibeTags": [
      "iconic"
    ],
    "occasionTags": [
      "outdoor-adventure"
    ],
    "price": "Free",
    "priceLevel": 1,
    "vibeNotes": "Street performers; Muscle Beach; skate park; iconic LA",
    "sourceCredit": "Visit LA"
  },
  {
    "id": "4c2248ac-0556-2aed-5594-80643a3d8328",
    "name": "Golden Gate Bridge Walk",
    "slug": "golden-gate-bridge-walk",
    "city": "California",
    "state": "CA",
    "neighborhood": "Presidio (SF)",
    "address": "Golden Gate Bridge",
    "lat": 34.0522,
    "lng": -118.2437,
    "cuisine": "Walk-Views",
    "cuisineTags": [
      "Walk-Views"
    ],
    "vibeTags": [
      "iconic"
    ],
    "occasionTags": [
      "outdoor-adventure"
    ],
    "price": "Free",
    "priceLevel": 1,
    "vibeNotes": "Iconic bridge walk; Marin Headlands; Battery Spencer views",
    "sourceCredit": "Visit SF"
  },
  {
    "id": "4f4963cd-3f1e-c352-cebd-8acb82ba2ce4",
    "name": "Griffith Observatory",
    "slug": "griffith-observatory",
    "city": "California",
    "state": "CA",
    "neighborhood": "Griffith Park (LA)",
    "address": "2800 E Observatory Rd",
    "lat": 34.0522,
    "lng": -118.2437,
    "cuisine": "Observatory-Views",
    "cuisineTags": [
      "Observatory-Views"
    ],
    "vibeTags": [
      "sunset"
    ],
    "occasionTags": [
      "outdoor-adventure"
    ],
    "price": "Free",
    "priceLevel": 1,
    "vibeNotes": "Hollywood sign views; planetarium; sunset over LA",
    "sourceCredit": "Visit LA"
  },
  {
    "id": "dea6d666-61c7-4a81-3475-ba0b4cfdf064",
    "name": "La Jolla Cove",
    "slug": "la-jolla-cove",
    "city": "California",
    "state": "CA",
    "neighborhood": "La Jolla (SD)",
    "address": "1100 Coast Blvd",
    "lat": 34.0522,
    "lng": -118.2437,
    "cuisine": "Beach-Snorkel",
    "cuisineTags": [
      "Beach-Snorkel"
    ],
    "vibeTags": [],
    "occasionTags": [
      "outdoor-adventure"
    ],
    "price": "Free",
    "priceLevel": 1,
    "vibeNotes": "Sea lions; snorkeling; tide pools; cliffside beauty",
    "sourceCredit": "Visit San Diego"
  },
  {
    "id": "a058a852-3b9e-e67d-565d-b14c517a9dfa",
    "name": "Dolores Park",
    "slug": "dolores-park",
    "city": "California",
    "state": "CA",
    "neighborhood": "Mission (SF)",
    "address": "Dolores St & 19th St",
    "lat": 34.0522,
    "lng": -118.2437,
    "cuisine": "Park",
    "cuisineTags": [
      "Park"
    ],
    "vibeTags": [
      "outdoor"
    ],
    "occasionTags": [
      "outdoor-adventure"
    ],
    "price": "Free",
    "priceLevel": 1,
    "vibeNotes": "SF's \"outdoor living room\"; skyline views; sunny hangout",
    "sourceCredit": "Visit SF"
  },
  {
    "id": "cd621ddd-9d07-3c97-ce9a-8c0d446d2637",
    "name": "Runyon Canyon",
    "slug": "runyon-canyon",
    "city": "California",
    "state": "CA",
    "neighborhood": "Hollywood (LA)",
    "address": "2000 N Fuller Ave",
    "lat": 34.0522,
    "lng": -118.2437,
    "cuisine": "Hiking",
    "cuisineTags": [
      "Hiking"
    ],
    "vibeTags": [],
    "occasionTags": [
      "outdoor-adventure"
    ],
    "price": "Free",
    "priceLevel": 1,
    "vibeNotes": "Classic LA hike; city views; off-leash dogs; celebrity sightings",
    "sourceCredit": "Visit LA"
  },
  {
    "id": "cce45ca6-e0af-d5f8-c6e5-10f8e4d7e074",
    "name": "Balboa Park",
    "slug": "balboa-park",
    "city": "California",
    "state": "CA",
    "neighborhood": "San Diego",
    "address": "1549 El Prado",
    "lat": 34.0522,
    "lng": -118.2437,
    "cuisine": "Park-Museums",
    "cuisineTags": [
      "Park-Museums"
    ],
    "vibeTags": [],
    "occasionTags": [
      "outdoor-adventure"
    ],
    "price": "Free",
    "priceLevel": 1,
    "vibeNotes": "1,200 acres; 17 museums; gardens; Spanish architecture",
    "sourceCredit": "Visit San Diego"
  },
  {
    "id": "5843ce92-dc7e-136f-93f4-a15b9dbb760f",
    "name": "Lands End Trail",
    "slug": "lands-end-trail",
    "city": "California",
    "state": "CA",
    "neighborhood": "Outer Richmond (SF)",
    "address": "Point Lobos Ave",
    "lat": 34.0522,
    "lng": -118.2437,
    "cuisine": "Coastal Hike",
    "cuisineTags": [
      "Coastal Hike"
    ],
    "vibeTags": [],
    "occasionTags": [
      "outdoor-adventure"
    ],
    "price": "Free",
    "priceLevel": 1,
    "vibeNotes": "Cliffside trail; Golden Gate views; Sutro Baths ruins",
    "sourceCredit": "Visit SF"
  },
  {
    "id": "abff5839-a606-cc57-10b9-be28406d2029",
    "name": "Sepia",
    "slug": "sepia",
    "city": "Chicago",
    "state": "IL",
    "neighborhood": "West Loop",
    "address": "123 N Jefferson St",
    "lat": 41.8781,
    "lng": -87.6298,
    "cuisine": "New American",
    "cuisineTags": [
      "New American"
    ],
    "vibeTags": [],
    "occasionTags": [
      "date-night"
    ],
    "price": "$$$",
    "priceLevel": 3,
    "vibeNotes": "James Beard-winning; candlelit loft with exposed brick; tasting menus",
    "sourceCredit": "TikTok @312food"
  },
  {
    "id": "0699946e-73e6-e2b3-2740-521bea5b125b",
    "name": "Geja's Cafe",
    "slug": "geja-s-cafe",
    "city": "Chicago",
    "state": "IL",
    "neighborhood": "Lincoln Park",
    "address": "340 W Armitage Ave",
    "lat": 41.8781,
    "lng": -87.6298,
    "cuisine": "Fondue / French",
    "cuisineTags": [
      "Fondue",
      "French"
    ],
    "vibeTags": [
      "romantic",
      "late-night"
    ],
    "occasionTags": [
      "date-night"
    ],
    "price": "$$$",
    "priceLevel": 3,
    "vibeNotes": "Chicago's most romantic restaurant; cheese & chocolate fondue, live flamenco guitar",
    "sourceCredit": "TikTok viral"
  },
  {
    "id": "4ee6374a-f653-7594-1ba6-c386aae1928a",
    "name": "North Pond",
    "slug": "north-pond",
    "city": "Chicago",
    "state": "IL",
    "neighborhood": "Lincoln Park",
    "address": "2610 N Cannon Dr",
    "lat": 41.8781,
    "lng": -87.6298,
    "cuisine": "New American",
    "cuisineTags": [
      "New American"
    ],
    "vibeTags": [
      "hidden-gem"
    ],
    "occasionTags": [
      "date-night"
    ],
    "price": "$$$$",
    "priceLevel": 4,
    "vibeNotes": "Hidden in a nature sanctuary; seasonal tasting menu; stunning park views",
    "sourceCredit": "Instagram"
  },
  {
    "id": "92c57c87-f43b-61d8-f691-591d41706b70",
    "name": "Mon Ami Gabi",
    "slug": "mon-ami-gabi",
    "city": "Chicago",
    "state": "IL",
    "neighborhood": "Lincoln Park",
    "address": "2300 N Lincoln Park W",
    "lat": 41.8781,
    "lng": -87.6298,
    "cuisine": "French Bistro",
    "cuisineTags": [
      "French Bistro"
    ],
    "vibeTags": [
      "patio"
    ],
    "occasionTags": [
      "date-night"
    ],
    "price": "$$$",
    "priceLevel": 3,
    "vibeNotes": "Parisian sidewalk cafe vibes; steak frites & escargot; golden hour patio",
    "sourceCredit": "Resy"
  },
  {
    "id": "995d550b-9b0a-c582-9308-7ddeab1bc496",
    "name": "Alla Vita",
    "slug": "alla-vita",
    "city": "Chicago",
    "state": "IL",
    "neighborhood": "West Loop",
    "address": "111 N Aberdeen St",
    "lat": 41.8781,
    "lng": -87.6298,
    "cuisine": "Italian",
    "cuisineTags": [
      "Italian"
    ],
    "vibeTags": [
      "intimate",
      "wine"
    ],
    "occasionTags": [
      "date-night"
    ],
    "price": "$$$",
    "priceLevel": 3,
    "vibeNotes": "Handmade pasta; candlelight & wine; intimate 40-seat dining room",
    "sourceCredit": "TikTok"
  },
  {
    "id": "0dc15945-b0eb-649c-56e4-efa4d38b100e",
    "name": "Daisies",
    "slug": "daisies",
    "city": "Chicago",
    "state": "IL",
    "neighborhood": "Logan Square",
    "address": "2523 N Milwaukee Ave",
    "lat": 41.8781,
    "lng": -87.6298,
    "cuisine": "New American",
    "cuisineTags": [
      "New American"
    ],
    "vibeTags": [
      "cozy"
    ],
    "occasionTags": [
      "date-night"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Seasonal pasta focused; cozy neighborhood gem; BYOB-friendly",
    "sourceCredit": "Infatuation"
  },
  {
    "id": "afb83dc4-1a1e-4c84-98c9-9d52561e10e0",
    "name": "Bar La Rue",
    "slug": "bar-la-rue",
    "city": "Chicago",
    "state": "IL",
    "neighborhood": "Gold Coast",
    "address": "20 E Chestnut St",
    "lat": 41.8781,
    "lng": -87.6298,
    "cuisine": "French",
    "cuisineTags": [
      "French"
    ],
    "vibeTags": [
      "cocktails",
      "late-night"
    ],
    "occasionTags": [
      "date-night"
    ],
    "price": "$$$",
    "priceLevel": 3,
    "vibeNotes": "Sexy speakeasy vibe inside Sofitel; craft cocktails & small plates",
    "sourceCredit": "Instagram"
  },
  {
    "id": "305c75cf-ad4f-15d1-f1bc-a43522faa2c2",
    "name": "Petit Pomeroy",
    "slug": "petit-pomeroy",
    "city": "Chicago",
    "state": "IL",
    "neighborhood": "Wicker Park",
    "address": "1637 W North Ave",
    "lat": 41.8781,
    "lng": -87.6298,
    "cuisine": "French",
    "cuisineTags": [
      "French"
    ],
    "vibeTags": [
      "romantic",
      "intimate"
    ],
    "occasionTags": [
      "date-night"
    ],
    "price": "$$$",
    "priceLevel": 3,
    "vibeNotes": "Intimate French bistro; classic dishes; romantic candlelit room",
    "sourceCredit": "TikTok @chicago.dives"
  },
  {
    "id": "c8721882-cd1d-066e-f90f-bad1ffe27e22",
    "name": "Bar Sotto",
    "slug": "bar-sotto",
    "city": "Chicago",
    "state": "IL",
    "neighborhood": "Wicker Park",
    "address": "750 N Milwaukee Ave",
    "lat": 41.8781,
    "lng": -87.6298,
    "cuisine": "Italian",
    "cuisineTags": [
      "Italian"
    ],
    "vibeTags": [
      "cozy",
      "wine",
      "late-night"
    ],
    "occasionTags": [
      "date-night"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Underground wine bar; rustic Italian small plates; cozy date spot",
    "sourceCredit": "TikTok"
  },
  {
    "id": "1849eff1-240b-2dc7-6e10-5f04565aff7f",
    "name": "Selva",
    "slug": "selva",
    "city": "Chicago",
    "state": "IL",
    "neighborhood": "River North",
    "address": "439 N Clark St",
    "lat": 41.8781,
    "lng": -87.6298,
    "cuisine": "Peruvian-Japanese",
    "cuisineTags": [
      "Peruvian-Japanese"
    ],
    "vibeTags": [
      "cocktails"
    ],
    "occasionTags": [
      "date-night"
    ],
    "price": "$$$",
    "priceLevel": 3,
    "vibeNotes": "Nikkei cuisine; dramatic jungle decor; cocktails with smoke & flair",
    "sourceCredit": "Instagram"
  },
  {
    "id": "7f368771-028d-73c0-a0ab-82fee791cb73",
    "name": "Sunda New Asian",
    "slug": "sunda-new-asian",
    "city": "Chicago",
    "state": "IL",
    "neighborhood": "River North",
    "address": "110 W Illinois St",
    "lat": 41.8781,
    "lng": -87.6298,
    "cuisine": "Asian Fusion",
    "cuisineTags": [
      "Asian Fusion"
    ],
    "vibeTags": [
      "late-night"
    ],
    "occasionTags": [
      "group-night-out"
    ],
    "price": "$$$",
    "priceLevel": 3,
    "vibeNotes": "Dramatic space; shareable plates; great for large groups; bottle service available",
    "sourceCredit": "TikTok"
  },
  {
    "id": "c87a2f47-e316-f4d8-d2e0-8d294a49625c",
    "name": "Quartino",
    "slug": "quartino",
    "city": "Chicago",
    "state": "IL",
    "neighborhood": "River North",
    "address": "626 N State St",
    "lat": 41.8781,
    "lng": -87.6298,
    "cuisine": "Italian",
    "cuisineTags": [
      "Italian"
    ],
    "vibeTags": [
      "wine"
    ],
    "occasionTags": [
      "group-night-out"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Family-style Italian; wine on tap; lively energy; fits big crews",
    "sourceCredit": "Yelp"
  },
  {
    "id": "4a0eaced-64b4-415b-c8e0-14568c15469a",
    "name": "Cindy's",
    "slug": "cindy-s",
    "city": "Chicago",
    "state": "IL",
    "neighborhood": "Loop",
    "address": "12 S Michigan Ave (rooftop)",
    "lat": 41.8781,
    "lng": -87.6298,
    "cuisine": "New American",
    "cuisineTags": [
      "New American"
    ],
    "vibeTags": [
      "rooftop"
    ],
    "occasionTags": [
      "group-night-out"
    ],
    "price": "$$$",
    "priceLevel": 3,
    "vibeNotes": "Rooftop at Chicago Athletic Association; skyline & Millennium Park views",
    "sourceCredit": "TikTok @312food"
  },
  {
    "id": "b9fb689b-4f80-1776-e86b-f0cea616c397",
    "name": "The Bassment",
    "slug": "the-bassment",
    "city": "Chicago",
    "state": "IL",
    "neighborhood": "River North",
    "address": "17 W Hubbard St",
    "lat": 41.8781,
    "lng": -87.6298,
    "cuisine": "Bar / Lounge",
    "cuisineTags": [
      "Bar",
      "Lounge"
    ],
    "vibeTags": [
      "dj",
      "cocktails"
    ],
    "occasionTags": [
      "group-night-out"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Live DJs; craft cocktails; underground vibe; gets packed weekends",
    "sourceCredit": "Instagram"
  },
  {
    "id": "c14db17f-0560-b5e0-e541-76c1a5b0abfb",
    "name": "Paradise Park",
    "slug": "paradise-park",
    "city": "Chicago",
    "state": "IL",
    "neighborhood": "West Loop",
    "address": "227 N Paulina St",
    "lat": 41.8781,
    "lng": -87.6298,
    "cuisine": "Bar & Grill",
    "cuisineTags": [
      "Bar & Grill"
    ],
    "vibeTags": [],
    "occasionTags": [
      "group-night-out"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Massive beer garden; games; tacos; low-key group energy",
    "sourceCredit": "TikTok"
  },
  {
    "id": "1486c09a-db1a-559d-dd48-63e956273489",
    "name": "Wake 'n Bacon",
    "slug": "wake-n-bacon",
    "city": "Chicago",
    "state": "IL",
    "neighborhood": "Wicker Park",
    "address": "1344 N Milwaukee Ave",
    "lat": 41.8781,
    "lng": -87.6298,
    "cuisine": "Brunch / Bar",
    "cuisineTags": [
      "Brunch",
      "Bar"
    ],
    "vibeTags": [
      "brunch"
    ],
    "occasionTags": [
      "group-night-out"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Day-to-night brunch spot; bacon flights; group-friendly vibes",
    "sourceCredit": "Instagram"
  },
  {
    "id": "4ae7066e-494f-cc11-8e08-42eb9e7d7632",
    "name": "Stussy's Diner",
    "slug": "stussy-s-diner",
    "city": "Chicago",
    "state": "IL",
    "neighborhood": "Wicker Park",
    "address": "1653 W Cortland St",
    "lat": 41.8781,
    "lng": -87.6298,
    "cuisine": "Diner / Bar",
    "cuisineTags": [
      "Diner",
      "Bar"
    ],
    "vibeTags": [
      "cocktails",
      "late-night"
    ],
    "occasionTags": [
      "group-night-out"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Retro diner by night, cocktails & late-night bites; nostalgic group energy",
    "sourceCredit": "TikTok"
  },
  {
    "id": "dea3cbae-6444-bde3-bcfa-351a42244211",
    "name": "SH\u014c",
    "slug": "sh",
    "city": "Chicago",
    "state": "IL",
    "neighborhood": "West Loop",
    "address": "126 W Huron St",
    "lat": 41.8781,
    "lng": -87.6298,
    "cuisine": "Japanese",
    "cuisineTags": [
      "Japanese"
    ],
    "vibeTags": [
      "cocktails"
    ],
    "occasionTags": [
      "group-night-out"
    ],
    "price": "$$$$",
    "priceLevel": 4,
    "vibeNotes": "Omakase & cocktails; sleek minimalist space; special occasion group spot",
    "sourceCredit": "Resy"
  },
  {
    "id": "a235b630-9f09-794f-39e9-a9bfb0d05a98",
    "name": "Carmine's",
    "slug": "carmine-s",
    "city": "Chicago",
    "state": "IL",
    "neighborhood": "Gold Coast",
    "address": "1043 N Rush St",
    "lat": 41.8781,
    "lng": -87.6298,
    "cuisine": "Italian",
    "cuisineTags": [
      "Italian"
    ],
    "vibeTags": [],
    "occasionTags": [
      "group-night-out"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Old-school Italian; family-style platters; big group classic",
    "sourceCredit": "Yelp"
  },
  {
    "id": "80da36be-47a3-e888-84f5-0b34b895c143",
    "name": "Maple & Ash",
    "slug": "maple-ash",
    "city": "Chicago",
    "state": "IL",
    "neighborhood": "Gold Coast",
    "address": "8 W Maple St",
    "lat": 41.8781,
    "lng": -87.6298,
    "cuisine": "Steakhouse",
    "cuisineTags": [
      "Steakhouse"
    ],
    "vibeTags": [
      "upscale"
    ],
    "occasionTags": [
      "in-laws"
    ],
    "price": "$$$$",
    "priceLevel": 4,
    "vibeNotes": "Upscale steakhouse; tableside service; impressive for in-laws",
    "sourceCredit": "Resy"
  },
  {
    "id": "3ee910de-f927-bfcf-9e77-e7cefb90f573",
    "name": "RPM Italian",
    "slug": "rpm-italian",
    "city": "Chicago",
    "state": "IL",
    "neighborhood": "River North",
    "address": "52 W Illinois St",
    "lat": 41.8781,
    "lng": -87.6298,
    "cuisine": "Italian",
    "cuisineTags": [
      "Italian"
    ],
    "vibeTags": [],
    "occasionTags": [
      "in-laws"
    ],
    "price": "$$$",
    "priceLevel": 3,
    "vibeNotes": "Celeb-favorite; polished; handmade pasta; power-dinner vibes",
    "sourceCredit": "Instagram"
  },
  {
    "id": "2fe0d298-616c-6899-b0d8-8c33c6faf8ee",
    "name": "The Signature Room",
    "slug": "the-signature-room",
    "city": "Chicago",
    "state": "IL",
    "neighborhood": "Magnificent Mile",
    "address": "875 N Michigan Ave, 95th Fl",
    "lat": 41.8781,
    "lng": -87.6298,
    "cuisine": "American",
    "cuisineTags": [
      "American"
    ],
    "vibeTags": [],
    "occasionTags": [
      "in-laws"
    ],
    "price": "$$$$",
    "priceLevel": 4,
    "vibeNotes": "95th-floor views of the city; classic fine dining; unforgettable setting",
    "sourceCredit": "TikTok"
  },
  {
    "id": "548add61-3934-cebd-0884-01ba7597e5e3",
    "name": "Chicago Cut Steakhouse",
    "slug": "chicago-cut-steakhouse",
    "city": "Chicago",
    "state": "IL",
    "neighborhood": "River North",
    "address": "300 N LaSalle St",
    "lat": 41.8781,
    "lng": -87.6298,
    "cuisine": "Steakhouse",
    "cuisineTags": [
      "Steakhouse"
    ],
    "vibeTags": [],
    "occasionTags": [
      "in-laws"
    ],
    "price": "$$$$",
    "priceLevel": 4,
    "vibeNotes": "River views; dry-aged steaks; sophisticated & refined",
    "sourceCredit": "Resy"
  },
  {
    "id": "e8cb886a-96a9-9e8b-b324-db94e0431800",
    "name": "Girl & The Goat",
    "slug": "girl-the-goat",
    "city": "Chicago",
    "state": "IL",
    "neighborhood": "West Loop",
    "address": "809 W Randolph St",
    "lat": 41.8781,
    "lng": -87.6298,
    "cuisine": "New American",
    "cuisineTags": [
      "New American"
    ],
    "vibeTags": [
      "late-night"
    ],
    "occasionTags": [
      "in-laws"
    ],
    "price": "$$$",
    "priceLevel": 3,
    "vibeNotes": "Stephanie Izard's flagship; inventive shared plates; foodie must-visit",
    "sourceCredit": "James Beard"
  },
  {
    "id": "33c90d87-510a-8a86-6ca4-8df5971e86fd",
    "name": "Oriole",
    "slug": "oriole",
    "city": "Chicago",
    "state": "IL",
    "neighborhood": "West Loop",
    "address": "661 W Walnut St",
    "lat": 41.8781,
    "lng": -87.6298,
    "cuisine": "Fine Dining",
    "cuisineTags": [
      "Fine Dining"
    ],
    "vibeTags": [
      "hidden-gem",
      "michelin"
    ],
    "occasionTags": [
      "in-laws"
    ],
    "price": "$$$$",
    "priceLevel": 4,
    "vibeNotes": "2 Michelin stars; tasting menu only; hidden entrance; world-class",
    "sourceCredit": "Michelin"
  },
  {
    "id": "1ea7e0ad-1a7a-eb7c-db1d-776488c6eeca",
    "name": "Boka",
    "slug": "boka",
    "city": "Chicago",
    "state": "IL",
    "neighborhood": "Lincoln Park",
    "address": "1729 N Halsted St",
    "lat": 41.8781,
    "lng": -87.6298,
    "cuisine": "New American",
    "cuisineTags": [
      "New American"
    ],
    "vibeTags": [
      "elegant",
      "michelin"
    ],
    "occasionTags": [
      "in-laws"
    ],
    "price": "$$$$",
    "priceLevel": 4,
    "vibeNotes": "Michelin-starred; elegant seasonal menu; sophisticated ambiance",
    "sourceCredit": "Michelin"
  },
  {
    "id": "9ede0ae3-0a95-ad48-7f71-894f55c245ce",
    "name": "Divan",
    "slug": "divan",
    "city": "Chicago",
    "state": "IL",
    "neighborhood": "Wicker Park",
    "address": "1623 N Milwaukee Ave",
    "lat": 41.8781,
    "lng": -87.6298,
    "cuisine": "Mediterranean",
    "cuisineTags": [
      "Mediterranean"
    ],
    "vibeTags": [
      "patio",
      "cocktails",
      "wine"
    ],
    "occasionTags": [
      "girls-night"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Gorgeous patio; shareable mezze; wine & cocktails; aesthetic vibes",
    "sourceCredit": "TikTok"
  },
  {
    "id": "206521e6-55db-1dec-8287-16141a4e9eca",
    "name": "The Izakaya",
    "slug": "the-izakaya",
    "city": "Chicago",
    "state": "IL",
    "neighborhood": "West Loop",
    "address": "946 W Fulton Market",
    "lat": 41.8781,
    "lng": -87.6298,
    "cuisine": "Japanese",
    "cuisineTags": [
      "Japanese"
    ],
    "vibeTags": [
      "cocktails",
      "late-night"
    ],
    "occasionTags": [
      "girls-night"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Neon-lit izakaya; sake cocktails; small plates for sharing",
    "sourceCredit": "Instagram"
  },
  {
    "id": "d9b1d9cb-322f-9374-f3e9-9c09911a4044",
    "name": "Nisos Prime",
    "slug": "nisos-prime",
    "city": "Chicago",
    "state": "IL",
    "neighborhood": "West Loop",
    "address": "200 N Green St",
    "lat": 41.8781,
    "lng": -87.6298,
    "cuisine": "Greek Seafood",
    "cuisineTags": [
      "Greek Seafood"
    ],
    "vibeTags": [],
    "occasionTags": [
      "girls-night"
    ],
    "price": "$$$$",
    "priceLevel": 4,
    "vibeNotes": "Stunning Mediterranean decor; whole fish; ros\u00e9-flowing energy",
    "sourceCredit": "TikTok"
  },
  {
    "id": "2aadeb5f-b15e-1da4-fd34-4682dcd4c835",
    "name": "Vela",
    "slug": "vela",
    "city": "Chicago",
    "state": "IL",
    "neighborhood": "Fulton Market",
    "address": "400 N Aberdeen St",
    "lat": 41.8781,
    "lng": -87.6298,
    "cuisine": "Italian",
    "cuisineTags": [
      "Italian"
    ],
    "vibeTags": [
      "rooftop",
      "cocktails"
    ],
    "occasionTags": [
      "girls-night"
    ],
    "price": "$$$",
    "priceLevel": 3,
    "vibeNotes": "Chic Italian; handmade pasta; rooftop cocktails; Insta-worthy interior",
    "sourceCredit": "Instagram"
  },
  {
    "id": "a2cb82a1-5c30-3fc2-7a53-652b48a7c6ce",
    "name": "The Oakville",
    "slug": "the-oakville",
    "city": "Chicago",
    "state": "IL",
    "neighborhood": "Wrigleyville",
    "address": "3637 N Clark St",
    "lat": 41.8781,
    "lng": -87.6298,
    "cuisine": "Bar / Lounge",
    "cuisineTags": [
      "Bar",
      "Lounge"
    ],
    "vibeTags": [
      "trendy",
      "dj",
      "cocktails"
    ],
    "occasionTags": [
      "girls-night"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Craft cocktails; DJ nights; cute & trendy; girls-night energy",
    "sourceCredit": "Yelp"
  },
  {
    "id": "2daedb42-68fa-1293-1071-3187aaac60bf",
    "name": "Celeste",
    "slug": "celeste",
    "city": "Chicago",
    "state": "IL",
    "neighborhood": "River North",
    "address": "111 W Hubbard St",
    "lat": 41.8781,
    "lng": -87.6298,
    "cuisine": "Pan-Asian",
    "cuisineTags": [
      "Pan-Asian"
    ],
    "vibeTags": [
      "cocktails",
      "late-night"
    ],
    "occasionTags": [
      "girls-night"
    ],
    "price": "$$$",
    "priceLevel": 3,
    "vibeNotes": "Glamorous late-night spot; sushi & cocktails; stylish crowd",
    "sourceCredit": "TikTok"
  },
  {
    "id": "a941b38f-a78a-0dae-59c1-4c777de63bf6",
    "name": "Etta",
    "slug": "etta",
    "city": "Chicago",
    "state": "IL",
    "neighborhood": "Bucktown/Wicker Park",
    "address": "1840 W North Ave",
    "lat": 41.8781,
    "lng": -87.6298,
    "cuisine": "Wood-Fired",
    "cuisineTags": [
      "Wood-Fired"
    ],
    "vibeTags": [
      "cozy"
    ],
    "occasionTags": [
      "girls-night"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Wood-fired pizzas; honey butter bread; warm & cozy",
    "sourceCredit": "Infatuation"
  },
  {
    "id": "32963914-6486-9e3c-49a7-99f275176a99",
    "name": "Bavette's Bar & Boeuf",
    "slug": "bavette-s-bar-boeuf",
    "city": "Chicago",
    "state": "IL",
    "neighborhood": "River North",
    "address": "218 W Kinzie St",
    "lat": 41.8781,
    "lng": -87.6298,
    "cuisine": "Steakhouse",
    "cuisineTags": [
      "Steakhouse"
    ],
    "vibeTags": [],
    "occasionTags": [
      "guys-night"
    ],
    "price": "$$$$",
    "priceLevel": 4,
    "vibeNotes": "Jazzy steakhouse; dim lighting; old-school cool; perfect guys' dinner",
    "sourceCredit": "Resy"
  },
  {
    "id": "3b778d45-4d51-9cb7-d665-884285dfa98b",
    "name": "Portillo's",
    "slug": "portillo-s",
    "city": "Chicago",
    "state": "IL",
    "neighborhood": "River North",
    "address": "100 W Ontario St",
    "lat": 41.8781,
    "lng": -87.6298,
    "cuisine": "Chicago Hot Dogs",
    "cuisineTags": [
      "Chicago Hot Dogs"
    ],
    "vibeTags": [
      "iconic"
    ],
    "occasionTags": [
      "guys-night"
    ],
    "price": "$",
    "priceLevel": 1,
    "vibeNotes": "Iconic Chicago dogs & Italian beef; must-hit for the crew",
    "sourceCredit": "TikTok"
  },
  {
    "id": "527bbcdc-0719-1aca-00f7-71c2ac472864",
    "name": "WhirlyBall",
    "slug": "whirlyball",
    "city": "Chicago",
    "state": "IL",
    "neighborhood": "Bucktown",
    "address": "1825 W Webster Ave",
    "lat": 41.8781,
    "lng": -87.6298,
    "cuisine": "Entertainment",
    "cuisineTags": [
      "Entertainment"
    ],
    "vibeTags": [
      "fun"
    ],
    "occasionTags": [
      "guys-night"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Bumper cars + lacrosse hybrid; beer on tap; competitive group fun",
    "sourceCredit": "Yelp"
  },
  {
    "id": "b8efaa68-3c75-1d3a-7a5b-8e6e2c11b109",
    "name": "Headquarters Beercade",
    "slug": "headquarters-beercade",
    "city": "Chicago",
    "state": "IL",
    "neighborhood": "River North",
    "address": "213 W Institute Pl",
    "lat": 41.8781,
    "lng": -87.6298,
    "cuisine": "Arcade Bar",
    "cuisineTags": [
      "Arcade Bar"
    ],
    "vibeTags": [
      "chill"
    ],
    "occasionTags": [
      "guys-night"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Retro arcade games; craft beer; chill competitive vibe",
    "sourceCredit": "TikTok"
  },
  {
    "id": "c78adccb-3a37-df01-88f4-6b3b65f163f3",
    "name": "SPIN Chicago",
    "slug": "spin-chicago",
    "city": "Chicago",
    "state": "IL",
    "neighborhood": "River North",
    "address": "344 N State St",
    "lat": 41.8781,
    "lng": -87.6298,
    "cuisine": "Ping Pong Bar",
    "cuisineTags": [
      "Ping Pong Bar"
    ],
    "vibeTags": [
      "cocktails"
    ],
    "occasionTags": [
      "guys-night"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Olympic-size ping pong; cocktails; tournament-style nights",
    "sourceCredit": "Instagram"
  },
  {
    "id": "3f5835e4-03a1-81c6-0ae6-0c50b620e924",
    "name": "Big Star",
    "slug": "big-star",
    "city": "Chicago",
    "state": "IL",
    "neighborhood": "Wicker Park",
    "address": "1531 N Damen Ave",
    "lat": 41.8781,
    "lng": -87.6298,
    "cuisine": "Tacos / Whiskey",
    "cuisineTags": [
      "Tacos",
      "Whiskey"
    ],
    "vibeTags": [
      "patio",
      "whiskey"
    ],
    "occasionTags": [
      "guys-night"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Honky-tonk tacos & bourbon; patio vibes; casual crew night",
    "sourceCredit": "Infatuation"
  },
  {
    "id": "1c33aa73-bb61-ad0d-ef77-2af786994757",
    "name": "Kaiser Tiger",
    "slug": "kaiser-tiger",
    "city": "Chicago",
    "state": "IL",
    "neighborhood": "West Loop",
    "address": "1415 W Randolph St",
    "lat": 41.8781,
    "lng": -87.6298,
    "cuisine": "Beer Garden",
    "cuisineTags": [
      "Beer Garden"
    ],
    "vibeTags": [],
    "occasionTags": [
      "guys-night"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Sausage & beer garden; bocce ball; communal tables",
    "sourceCredit": "Yelp"
  },
  {
    "id": "77dbc096-cd06-0f71-d097-1423c0f7272b",
    "name": "LondonHouse Rooftop",
    "slug": "londonhouse-rooftop",
    "city": "Chicago",
    "state": "IL",
    "neighborhood": "Loop",
    "address": "85 E Wacker Dr",
    "lat": 41.8781,
    "lng": -87.6298,
    "cuisine": "Rooftop Bar",
    "cuisineTags": [
      "Rooftop Bar"
    ],
    "vibeTags": [
      "rooftop"
    ],
    "occasionTags": [
      "bachelor"
    ],
    "price": "$$$",
    "priceLevel": 3,
    "vibeNotes": "Triple-decker rooftop; river & skyline views; bottle service",
    "sourceCredit": "TikTok"
  },
  {
    "id": "952284b2-6e58-6467-8f23-d9232c1f24a7",
    "name": "Tao Chicago",
    "slug": "tao-chicago",
    "city": "Chicago",
    "state": "IL",
    "neighborhood": "River North",
    "address": "632 N Dearborn St",
    "lat": 41.8781,
    "lng": -87.6298,
    "cuisine": "Asian / Nightclub",
    "cuisineTags": [
      "Asian",
      "Nightclub"
    ],
    "vibeTags": [],
    "occasionTags": [
      "bachelor"
    ],
    "price": "$$$$",
    "priceLevel": 4,
    "vibeNotes": "Restaurant-turned-nightclub; bottle service; celebrity vibes",
    "sourceCredit": "Instagram"
  },
  {
    "id": "907001d5-1ec8-a61b-af61-cffe0bf49bb6",
    "name": "Underground",
    "slug": "underground",
    "city": "Chicago",
    "state": "IL",
    "neighborhood": "River North",
    "address": "56 W Illinois St",
    "lat": 41.8781,
    "lng": -87.6298,
    "cuisine": "Nightclub",
    "cuisineTags": [
      "Nightclub"
    ],
    "vibeTags": [
      "dj"
    ],
    "occasionTags": [
      "bachelor"
    ],
    "price": "$$$",
    "priceLevel": 3,
    "vibeNotes": "Multi-level club; VIP tables; top DJs; bachelor party HQ",
    "sourceCredit": "Yelp"
  },
  {
    "id": "93b294b4-b864-110e-a696-d873e34482f7",
    "name": "Sound-Bar",
    "slug": "sound-bar",
    "city": "Chicago",
    "state": "IL",
    "neighborhood": "River North",
    "address": "226 W Ontario St",
    "lat": 41.8781,
    "lng": -87.6298,
    "cuisine": "Nightclub",
    "cuisineTags": [
      "Nightclub"
    ],
    "vibeTags": [
      "late-night"
    ],
    "occasionTags": [
      "bachelor"
    ],
    "price": "$$$",
    "priceLevel": 3,
    "vibeNotes": "EDM & hip-hop; massive sound system; late-night energy",
    "sourceCredit": "TikTok"
  },
  {
    "id": "ba959730-5341-2791-410f-21e4be60db83",
    "name": "Old Crow Smokehouse",
    "slug": "old-crow-smokehouse",
    "city": "Chicago",
    "state": "IL",
    "neighborhood": "Wrigleyville",
    "address": "3506 N Clark St",
    "lat": 41.8781,
    "lng": -87.6298,
    "cuisine": "BBQ / Bar",
    "cuisineTags": [
      "BBQ",
      "Bar"
    ],
    "vibeTags": [
      "rooftop",
      "live-music"
    ],
    "occasionTags": [
      "bachelor"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Rooftop; live music; BBQ & bourbon; rowdy energy",
    "sourceCredit": "Instagram"
  },
  {
    "id": "d2494bc6-fde9-b10f-521d-fd535bc1e6ba",
    "name": "Replay Lincoln Park",
    "slug": "replay-lincoln-park",
    "city": "Chicago",
    "state": "IL",
    "neighborhood": "Lincoln Park",
    "address": "2833 N Sheffield Ave",
    "lat": 41.8781,
    "lng": -87.6298,
    "cuisine": "Arcade Bar",
    "cuisineTags": [
      "Arcade Bar"
    ],
    "vibeTags": [],
    "occasionTags": [
      "bachelor"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Retro arcade + bar; cheap drinks; casual bachelor pre-game",
    "sourceCredit": "Yelp"
  },
  {
    "id": "8127135b-fb05-40f2-2d52-0dd8674b1916",
    "name": "Montrose Beach",
    "slug": "montrose-beach",
    "city": "Chicago",
    "state": "IL",
    "neighborhood": "Uptown",
    "address": "4400 N Simonds Dr",
    "lat": 41.8781,
    "lng": -87.6298,
    "cuisine": "Beach / Outdoor",
    "cuisineTags": [
      "Beach",
      "Outdoor"
    ],
    "vibeTags": [
      "outdoor"
    ],
    "occasionTags": [
      "outdoor-adventure"
    ],
    "price": "Free",
    "priceLevel": 1,
    "vibeNotes": "Beach volleyball; kayak rentals; bonfire vibes; summer crew hang",
    "sourceCredit": "TikTok"
  },
  {
    "id": "31887eca-95fa-9c21-bcac-2622292c5942",
    "name": "Architecture River Cruise",
    "slug": "architecture-river-cruise",
    "city": "Chicago",
    "state": "IL",
    "neighborhood": "Loop",
    "address": "Michigan Ave Bridge",
    "lat": 41.8781,
    "lng": -87.6298,
    "cuisine": "Boat Tour",
    "cuisineTags": [
      "Boat Tour"
    ],
    "vibeTags": [
      "iconic"
    ],
    "occasionTags": [
      "outdoor-adventure"
    ],
    "price": "$$$",
    "priceLevel": 3,
    "vibeNotes": "Iconic architecture cruise; BYOB some boats; great group outing",
    "sourceCredit": "Viator"
  },
  {
    "id": "846a7615-792d-504a-c1a5-6fab335c0683",
    "name": "Riverwalk",
    "slug": "riverwalk",
    "city": "Chicago",
    "state": "IL",
    "neighborhood": "Loop",
    "address": "Along Chicago River",
    "lat": 41.8781,
    "lng": -87.6298,
    "cuisine": "Outdoor Walk",
    "cuisineTags": [
      "Outdoor Walk"
    ],
    "vibeTags": [
      "outdoor",
      "sunset"
    ],
    "occasionTags": [
      "outdoor-adventure"
    ],
    "price": "Free",
    "priceLevel": 1,
    "vibeNotes": "Bars & restaurants along the river; sunset walks; kayak dock",
    "sourceCredit": "Instagram"
  },
  {
    "id": "66f56d69-75ec-3192-f882-01398e8c770f",
    "name": "Skydeck Ledge",
    "slug": "skydeck-ledge",
    "city": "Chicago",
    "state": "IL",
    "neighborhood": "Loop",
    "address": "233 S Wacker Dr",
    "lat": 41.8781,
    "lng": -87.6298,
    "cuisine": "Observation",
    "cuisineTags": [
      "Observation"
    ],
    "vibeTags": [],
    "occasionTags": [
      "outdoor-adventure"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Glass ledge 103 floors up; adrenaline squad moment",
    "sourceCredit": "TikTok"
  },
  {
    "id": "8ddb45f1-2f76-87c2-aaf8-582c91288d9f",
    "name": "North Avenue Beach",
    "slug": "north-avenue-beach",
    "city": "Chicago",
    "state": "IL",
    "neighborhood": "Lincoln Park",
    "address": "1603 N Lake Shore Dr",
    "lat": 41.8781,
    "lng": -87.6298,
    "cuisine": "Beach",
    "cuisineTags": [
      "Beach"
    ],
    "vibeTags": [],
    "occasionTags": [
      "outdoor-adventure"
    ],
    "price": "Free",
    "priceLevel": 1,
    "vibeNotes": "Volleyball leagues; jet ski rentals; beach bar; summer essential",
    "sourceCredit": "Instagram"
  },
  {
    "id": "bfc3046a-4222-0074-163b-4401591e4b67",
    "name": "Pinstripes",
    "slug": "pinstripes",
    "city": "Chicago",
    "state": "IL",
    "neighborhood": "South Barrington",
    "address": "100 W Higgins Rd",
    "lat": 41.8781,
    "lng": -87.6298,
    "cuisine": "Bowling/Bocce",
    "cuisineTags": [
      "Bowling",
      "Bocce"
    ],
    "vibeTags": [
      "upscale"
    ],
    "occasionTags": [
      "outdoor-adventure"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Bowling, bocce, bistro; upscale group entertainment",
    "sourceCredit": "Yelp"
  },
  {
    "id": "569588b8-5b06-5b4f-7511-e48b632a5c9e",
    "name": "Cincinnati Helicopters",
    "slug": "cincinnati-helicopters",
    "city": "Cincinnati",
    "state": "OH",
    "neighborhood": "Cincinnati",
    "address": "Various departure points",
    "lat": 39.1031,
    "lng": -84.512,
    "cuisine": "Experience / Helicopter Tour",
    "cuisineTags": [
      "Experience",
      "Helicopter Tour"
    ],
    "vibeTags": [
      "late-night"
    ],
    "occasionTags": [
      "date-night-ideas"
    ],
    "price": "$$$$",
    "priceLevel": 4,
    "vibeNotes": "Skyline helicopter tour with roses, chocolates, and photos; 10-12 min flight; ultimate wow-factor date",
    "sourceCredit": "@date.night.cincin"
  },
  {
    "id": "711ef135-f206-3dcb-c2b9-e1d7632e006d",
    "name": "Ghost Baby",
    "slug": "ghost-baby",
    "city": "Cincinnati",
    "state": "OH",
    "neighborhood": "Over-the-Rhine",
    "address": "1314 Republic St, Cincinnati, OH 45202",
    "lat": 39.1031,
    "lng": -84.512,
    "cuisine": "Speakeasy",
    "cuisineTags": [
      "Speakeasy"
    ],
    "vibeTags": [
      "hidden-gem",
      "cocktails"
    ],
    "occasionTags": [
      "date-night-ideas",
      "girls-night"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Hidden in a 170-year-old lagering tunnel; named among best bars in America; craft cocktails; moody and magical",
    "sourceCredit": "@date.night.cincin"
  },
  {
    "id": "f43b6328-61cf-7612-81b9-af65d3ae4e3d",
    "name": "Nada",
    "slug": "nada",
    "city": "Cincinnati",
    "state": "OH",
    "neighborhood": "Downtown",
    "address": "600 Walnut St, Cincinnati, OH 45202",
    "lat": 39.1031,
    "lng": -84.512,
    "cuisine": "Modern Mexican",
    "cuisineTags": [
      "Modern Mexican"
    ],
    "vibeTags": [
      "intimate",
      "upscale",
      "energetic",
      "cocktails",
      "fun"
    ],
    "occasionTags": [
      "date-night-ideas",
      "in-laws",
      "girls-night"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Stylish modern Mexican with creative margaritas; lively but intimate booths; great for a dressed-up date",
    "sourceCredit": "@date.night.cincin"
  },
  {
    "id": "4ad44247-45f4-07c4-e0f9-04d10cfdf2ff",
    "name": "Japp's OTR",
    "slug": "japp-s-otr",
    "city": "Cincinnati",
    "state": "OH",
    "neighborhood": "Over-the-Rhine",
    "address": "1134 Main St, Cincinnati, OH 45202",
    "lat": 39.1031,
    "lng": -84.512,
    "cuisine": "Cocktail Bar",
    "cuisineTags": [
      "Cocktail Bar"
    ],
    "vibeTags": [
      "cocktails"
    ],
    "occasionTags": [
      "date-night-ideas"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Craft cocktail bar in former wig shop; vintage charm; one of OTR's original cocktail destinations",
    "sourceCredit": "@date.night.cincin"
  },
  {
    "id": "01438296-3a17-a86e-e2ed-8667ad4687b8",
    "name": "Cincinnati Distilling",
    "slug": "cincinnati-distilling",
    "city": "Cincinnati",
    "state": "OH",
    "neighborhood": "Milford",
    "address": "Milford, OH",
    "lat": 39.1031,
    "lng": -84.512,
    "cuisine": "Distillery",
    "cuisineTags": [
      "Distillery"
    ],
    "vibeTags": [
      "whiskey"
    ],
    "occasionTags": [
      "date-night-ideas"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Tour and taste at historic Kugler home; whiskey, bourbon, vodka, rum; unique educational date experience",
    "sourceCredit": "@date.night.cincin"
  },
  {
    "id": "88e48799-c7fe-11a7-30c5-0e31a5a75d1b",
    "name": "Rusk Kitchen + Bar",
    "slug": "rusk-kitchen-bar",
    "city": "Cincinnati",
    "state": "OH",
    "neighborhood": "East Walnut Hills",
    "address": "2724 Woodburn Ave, Cincinnati, OH 45206",
    "lat": 39.1031,
    "lng": -84.512,
    "cuisine": "Cocktail Bar / Restaurant",
    "cuisineTags": [
      "Cocktail Bar",
      "Restaurant"
    ],
    "vibeTags": [
      "cocktails",
      "late-night"
    ],
    "occasionTags": [
      "date-night-ideas"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Stylish neighborhood cocktail bar; inventive drinks and small plates; warm ambiance; date-night worthy",
    "sourceCredit": "@date.night.cincin"
  },
  {
    "id": "3e046c70-c5be-3348-ac56-a8d2ee1f3194",
    "name": "The Mercantile Library",
    "slug": "the-mercantile-library",
    "city": "Cincinnati",
    "state": "OH",
    "neighborhood": "Downtown",
    "address": "414 Walnut St #1100, Cincinnati, OH 45202",
    "lat": 39.1031,
    "lng": -84.512,
    "cuisine": "Library / Cultural",
    "cuisineTags": [
      "Library",
      "Cultural"
    ],
    "vibeTags": [],
    "occasionTags": [
      "date-night-ideas"
    ],
    "price": "$",
    "priceLevel": 1,
    "vibeNotes": "11th floor historic library; book lovers' paradise; unique date for intellectuals; membership available",
    "sourceCredit": "@date.night.cincin"
  },
  {
    "id": "b2a040fe-9fd7-0143-cb02-ffc6247e7ef3",
    "name": "RJ Cinema Distillery",
    "slug": "rj-cinema-distillery",
    "city": "Cincinnati",
    "state": "OH",
    "neighborhood": "Eastgate",
    "address": "4450 Eastgate S Dr Suite 100, Cincinnati, OH 45245",
    "lat": 39.1031,
    "lng": -84.512,
    "cuisine": "Cinema + Distillery",
    "cuisineTags": [
      "Cinema + Distillery"
    ],
    "vibeTags": [],
    "occasionTags": [
      "date-night-ideas"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Movie theater meets distillery and taproom; dinner and a movie in one spot; creative date combo",
    "sourceCredit": "@date.night.cincin"
  },
  {
    "id": "b6e46859-b36a-6e29-18ec-3e87c863a7e3",
    "name": "Little Matcha",
    "slug": "little-matcha",
    "city": "Cincinnati",
    "state": "OH",
    "neighborhood": "Covington",
    "address": "332 Scott St, Covington, KY",
    "lat": 39.1031,
    "lng": -84.512,
    "cuisine": "Matcha Cafe",
    "cuisineTags": [
      "Matcha Cafe"
    ],
    "vibeTags": [
      "brunch"
    ],
    "occasionTags": [
      "date-night-ideas",
      "girls-night"
    ],
    "price": "$",
    "priceLevel": 1,
    "vibeNotes": "Matcha sourced from family farm in Shizuoka, Japan; aesthetic cafe; perfect for a daytime date or first date",
    "sourceCredit": "@date.night.cincin"
  },
  {
    "id": "d1ff1004-f142-ea9b-d0b2-942dc671c8d1",
    "name": "Krohn Conservatory",
    "slug": "krohn-conservatory",
    "city": "Cincinnati",
    "state": "OH",
    "neighborhood": "Eden Park",
    "address": "Eden Park, Cincinnati, OH",
    "lat": 39.1031,
    "lng": -84.512,
    "cuisine": "Botanical Garden",
    "cuisineTags": [
      "Botanical Garden"
    ],
    "vibeTags": [
      "romantic"
    ],
    "occasionTags": [
      "date-night-ideas",
      "in-laws"
    ],
    "price": "$",
    "priceLevel": 1,
    "vibeNotes": "3,500+ plant species; seasonal butterfly show; Art Deco architecture; romantic garden stroll date",
    "sourceCredit": "@date.night.cincin"
  },
  {
    "id": "9e2705f6-caf8-65f9-4992-d0e461bef6db",
    "name": "Miracle at the Overlook",
    "slug": "miracle-at-the-overlook",
    "city": "Cincinnati",
    "state": "OH",
    "neighborhood": "Pleasant Ridge",
    "address": "6083 Montgomery Rd, Cincinnati, OH 45213",
    "lat": 39.1031,
    "lng": -84.512,
    "cuisine": "Seasonal Pop-Up Bar",
    "cuisineTags": [
      "Seasonal Pop-Up Bar"
    ],
    "vibeTags": [
      "fun",
      "cocktails"
    ],
    "occasionTags": [
      "date-night-ideas"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Christmas-themed pop-up cocktail bar at The Overlook Lodge; festive and fun; seasonal/limited time",
    "sourceCredit": "@date.night.cincin"
  },
  {
    "id": "381fbdce-7a4b-ca29-dc06-c1cc96c464ed",
    "name": "Cartridge Brewing",
    "slug": "cartridge-brewing",
    "city": "Cincinnati",
    "state": "OH",
    "neighborhood": "Maineville",
    "address": "1411 Grandin Rd, Maineville, OH",
    "lat": 39.1031,
    "lng": -84.512,
    "cuisine": "Brewery",
    "cuisineTags": [
      "Brewery"
    ],
    "vibeTags": [],
    "occasionTags": [
      "group-night-out",
      "guys-night"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Brewery inside historic Peters Cartridge Factory; massive industrial space; great for large groups; tours available",
    "sourceCredit": "@date.night.cincin"
  },
  {
    "id": "d046be8e-5668-ac14-f98a-204303008b01",
    "name": "The Establishment Oakley",
    "slug": "the-establishment-oakley",
    "city": "Cincinnati",
    "state": "OH",
    "neighborhood": "Oakley",
    "address": "2900 Wasson Rd, Cincinnati, OH 45209",
    "lat": 39.1031,
    "lng": -84.512,
    "cuisine": "Bar / Restaurant",
    "cuisineTags": [
      "Bar",
      "Restaurant"
    ],
    "vibeTags": [
      "patio"
    ],
    "occasionTags": [
      "group-night-out"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Scratch kitchen with creative menu; lively bar scene; patio; big enough for groups without reservations",
    "sourceCredit": "@date.night.cincin"
  },
  {
    "id": "f3844a0b-709b-5f93-b0d9-601f4e4d7cc9",
    "name": "Brothers Newport",
    "slug": "brothers-newport",
    "city": "Cincinnati",
    "state": "OH",
    "neighborhood": "Newport",
    "address": "1 Levee Way #2102, Newport, KY 41071",
    "lat": 39.1031,
    "lng": -84.512,
    "cuisine": "Bar & Grill",
    "cuisineTags": [
      "Bar & Grill"
    ],
    "vibeTags": [],
    "occasionTags": [
      "group-night-out"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Newport on the Levee location; casual bar food and drinks; sports on TV; easy group hang",
    "sourceCredit": "@date.night.cincin"
  },
  {
    "id": "82146e8e-b16c-e6be-efa5-555555934cea",
    "name": "MadTree Taproom",
    "slug": "madtree-taproom",
    "city": "Cincinnati",
    "state": "OH",
    "neighborhood": "Oakley",
    "address": "3301 Madison Rd, Cincinnati, OH 45209",
    "lat": 39.1031,
    "lng": -84.512,
    "cuisine": "Brewery & Restaurant",
    "cuisineTags": [
      "Brewery & Restaurant"
    ],
    "vibeTags": [
      "outdoor",
      "patio"
    ],
    "occasionTags": [
      "group-night-out",
      "guys-night"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Large taproom with great beer selection; wood-fired pizzas; outdoor patio; perfect for big groups",
    "sourceCredit": "@date.night.cincin"
  },
  {
    "id": "6d99bab4-181f-5f93-de39-a9381f9b230d",
    "name": "Immersive Gamebox",
    "slug": "immersive-gamebox",
    "city": "Cincinnati",
    "state": "OH",
    "neighborhood": "Newport",
    "address": "1 Levee Way, Newport, KY",
    "lat": 39.1031,
    "lng": -84.512,
    "cuisine": "Interactive Gaming",
    "cuisineTags": [
      "Interactive Gaming"
    ],
    "vibeTags": [
      "fun"
    ],
    "occasionTags": [
      "group-night-out",
      "guys-night"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "3,000 sq ft interactive gaming rooms; motion tracking; team-based games; unique group activity",
    "sourceCredit": "@date.night.cincin"
  },
  {
    "id": "ae5b4e2b-74ef-a08f-9b0b-c343e84a5482",
    "name": "Mosaic Climbing",
    "slug": "mosaic-climbing",
    "city": "Cincinnati",
    "state": "OH",
    "neighborhood": "Loveland",
    "address": "9501 Union Cemetery Rd, Loveland, OH 45140",
    "lat": 39.1031,
    "lng": -84.512,
    "cuisine": "Indoor Climbing Gym",
    "cuisineTags": [
      "Indoor Climbing Gym"
    ],
    "vibeTags": [],
    "occasionTags": [
      "group-night-out",
      "guys-night"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Largest indoor climbing gym in Cincinnati; bouldering and roped climbing; active group adventure",
    "sourceCredit": "@date.night.cincin"
  },
  {
    "id": "60d83e61-aacd-5848-5ab3-facba3e2801b",
    "name": "The Pickle Mill",
    "slug": "the-pickle-mill",
    "city": "Cincinnati",
    "state": "OH",
    "neighborhood": "Symmes Twp",
    "address": "9475 Loveland Madeira Rd, Cincinnati, OH 45242",
    "lat": 39.1031,
    "lng": -84.512,
    "cuisine": "Pickleball",
    "cuisineTags": [
      "Pickleball"
    ],
    "vibeTags": [
      "fun"
    ],
    "occasionTags": [
      "group-night-out"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Private indoor pickleball facility; reserve courts; fun competitive group activity",
    "sourceCredit": "@date.night.cincin"
  },
  {
    "id": "335e7324-8798-c415-4c48-129cca804c97",
    "name": "Liberty Center",
    "slug": "liberty-center",
    "city": "Cincinnati",
    "state": "OH",
    "neighborhood": "Liberty Township",
    "address": "7100 Foundry Row, Liberty Township, OH 45069",
    "lat": 39.1031,
    "lng": -84.512,
    "cuisine": "Shopping / Dining Complex",
    "cuisineTags": [
      "Shopping",
      "Dining Complex"
    ],
    "vibeTags": [],
    "occasionTags": [
      "group-night-out"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "120-store complex with dining and entertainment; something for everyone; full day/night group outing",
    "sourceCredit": "@date.night.cincin"
  },
  {
    "id": "8a72f8ab-3c1d-73c0-2a3f-a10c42e7e807",
    "name": "Barrel House Kitchen & Bar",
    "slug": "barrel-house-kitchen-bar",
    "city": "Cincinnati",
    "state": "OH",
    "neighborhood": "Mason",
    "address": "9640 Mason Montgomery Rd Suite A, Mason, OH 45040",
    "lat": 39.1031,
    "lng": -84.512,
    "cuisine": "American / Pizza",
    "cuisineTags": [
      "American",
      "Pizza"
    ],
    "vibeTags": [],
    "occasionTags": [
      "group-night-out",
      "guys-night"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Wood-fired pizza, burgers, and 24 craft beer taps; casual and spacious; crowd-pleaser for groups",
    "sourceCredit": "@date.night.cincin"
  },
  {
    "id": "5fabd939-643f-4715-f4c1-6c2d0daa0a10",
    "name": "The Eagle OTR",
    "slug": "the-eagle-otr",
    "city": "Cincinnati",
    "state": "OH",
    "neighborhood": "Over-the-Rhine",
    "address": "1342 Vine St, Cincinnati, OH 45202",
    "lat": 39.1031,
    "lng": -84.512,
    "cuisine": "Southern / Fried Chicken",
    "cuisineTags": [
      "Southern",
      "Fried Chicken"
    ],
    "vibeTags": [],
    "occasionTags": [
      "in-laws"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Famous fried chicken and comfort food; communal tables; unpretentious excellence everyone loves",
    "sourceCredit": "@date.night.cincin"
  },
  {
    "id": "5cb95d5f-ec5a-e14d-a100-fbc710afd43c",
    "name": "Kitchen Social Montgomery",
    "slug": "kitchen-social-montgomery",
    "city": "Cincinnati",
    "state": "OH",
    "neighborhood": "Montgomery",
    "address": "9340 Montgomery Rd Ste 102, Cincinnati, OH 45242",
    "lat": 39.1031,
    "lng": -84.512,
    "cuisine": "American",
    "cuisineTags": [
      "American"
    ],
    "vibeTags": [],
    "occasionTags": [
      "in-laws"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Polished neighborhood restaurant; crowd-pleasing menu; comfortable setting; safe pick for any parent",
    "sourceCredit": "@date.night.cincin"
  },
  {
    "id": "57423b27-6c85-9b08-c93a-40b8d1564a86",
    "name": "Dorothy Lane Market",
    "slug": "dorothy-lane-market",
    "city": "Cincinnati",
    "state": "OH",
    "neighborhood": "Mason",
    "address": "7200 Mason Montgomery Rd, Mason, OH",
    "lat": 39.1031,
    "lng": -84.512,
    "cuisine": "Specialty Grocery / Gourmet",
    "cuisineTags": [
      "Specialty Grocery",
      "Gourmet"
    ],
    "vibeTags": [
      "upscale",
      "wine"
    ],
    "occasionTags": [
      "in-laws"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Upscale gourmet market; prepared foods, wine, cheese; unique shopping experience; impressive without pressure",
    "sourceCredit": "@date.night.cincin"
  },
  {
    "id": "029e4f29-6712-17ec-5d31-879f6006b1d6",
    "name": "Miyako Sushi & Grill",
    "slug": "miyako-sushi-grill",
    "city": "Cincinnati",
    "state": "OH",
    "neighborhood": "West Chester",
    "address": "7691 Voice Of America Centre Dr, West Chester, OH 45069",
    "lat": 39.1031,
    "lng": -84.512,
    "cuisine": "Japanese / Hibachi / Sushi",
    "cuisineTags": [
      "Japanese",
      "Hibachi",
      "Sushi"
    ],
    "vibeTags": [],
    "occasionTags": [
      "in-laws"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Hibachi show + sushi bar; entertaining and interactive; great for family dinners with in-laws",
    "sourceCredit": "@date.night.cincin"
  },
  {
    "id": "cf139538-a659-47eb-d89a-ac6d1390a02f",
    "name": "Haven Cafe",
    "slug": "haven-cafe",
    "city": "Cincinnati",
    "state": "OH",
    "neighborhood": "Oakley",
    "address": "4409 Brazee St, Cincinnati, OH 45209",
    "lat": 39.1031,
    "lng": -84.512,
    "cuisine": "Cafe / Spa",
    "cuisineTags": [
      "Cafe",
      "Spa"
    ],
    "vibeTags": [
      "brunch"
    ],
    "occasionTags": [
      "girls-night"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Cafe + spa combo; brunch then pamper; unique girls day concept; relaxed Oakley vibes",
    "sourceCredit": "@date.night.cincin"
  },
  {
    "id": "f8690e18-244a-51d6-4abe-23505412b4dc",
    "name": "Deeper Roots Coffee",
    "slug": "deeper-roots-coffee",
    "city": "Cincinnati",
    "state": "OH",
    "neighborhood": "Multiple Locations",
    "address": "OTR, Oakley, Montgomery",
    "lat": 39.1031,
    "lng": -84.512,
    "cuisine": "Specialty Coffee",
    "cuisineTags": [
      "Specialty Coffee"
    ],
    "vibeTags": [],
    "occasionTags": [
      "girls-night"
    ],
    "price": "$",
    "priceLevel": 1,
    "vibeNotes": "Award-winning specialty coffee roaster; aesthetic shops; great for a catch-up coffee date",
    "sourceCredit": "@date.night.cincin"
  },
  {
    "id": "a86ba3e6-83aa-48cb-f4bb-0a3a3f98f712",
    "name": "Cincinnati Christkindlmarkt",
    "slug": "cincinnati-christkindlmarkt",
    "city": "Cincinnati",
    "state": "OH",
    "neighborhood": "Downtown",
    "address": "115 Joe Nuxhall Way, Cincinnati, OH 45202",
    "lat": 39.1031,
    "lng": -84.512,
    "cuisine": "Christmas Market (Seasonal)",
    "cuisineTags": [
      "Christmas Market (Seasonal)"
    ],
    "vibeTags": [],
    "occasionTags": [
      "girls-night"
    ],
    "price": "FREE",
    "priceLevel": 1,
    "vibeNotes": "German Christmas market on the riverfront; gl\u00fchwein, shopping, photo ops; seasonal magic with the girls",
    "sourceCredit": "@date.night.cincin"
  },
  {
    "id": "3810466f-aab2-578e-1c89-499cba128bff",
    "name": "Highland Coffee House",
    "slug": "highland-coffee-house",
    "city": "Cincinnati",
    "state": "OH",
    "neighborhood": "Mt. Auburn",
    "address": "2839 Highland Ave, Cincinnati, OH 45219",
    "lat": 39.1031,
    "lng": -84.512,
    "cuisine": "Coffee / Deli",
    "cuisineTags": [
      "Coffee",
      "Deli"
    ],
    "vibeTags": [
      "cozy"
    ],
    "occasionTags": [
      "girls-night"
    ],
    "price": "$",
    "priceLevel": 1,
    "vibeNotes": "Cozy neighborhood coffee shop; great for long chats; sandwiches and pastries; low-key girls hang",
    "sourceCredit": "@date.night.cincin"
  },
  {
    "id": "f5c07f2d-2b68-c445-94d8-a96df5ec7087",
    "name": "Krueger's Tavern",
    "slug": "krueger-s-tavern",
    "city": "Cincinnati",
    "state": "OH",
    "neighborhood": "Over-the-Rhine",
    "address": "1313 Vine St, Cincinnati, OH 45202",
    "lat": 39.1031,
    "lng": -84.512,
    "cuisine": "Tavern",
    "cuisineTags": [
      "Tavern"
    ],
    "vibeTags": [],
    "occasionTags": [
      "guys-night"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Hand-ground burgers and house sausages; beer-forward; OTR sports bar energy; solid guys night staple",
    "sourceCredit": "@date.night.cincin"
  },
  {
    "id": "ded181b8-0c40-8979-fc12-a91038bf89c8",
    "name": "The Wicked Pickle",
    "slug": "the-wicked-pickle",
    "city": "Cincinnati",
    "state": "OH",
    "neighborhood": "Loveland",
    "address": "123 Railroad Ave, Loveland, OH 45140",
    "lat": 39.1031,
    "lng": -84.512,
    "cuisine": "American",
    "cuisineTags": [
      "American"
    ],
    "vibeTags": [
      "outdoor"
    ],
    "occasionTags": [
      "guys-night"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "On the Little Miami Bike Trail; burgers and beers after a ride; laid-back outdoor vibe",
    "sourceCredit": "@date.night.cincin"
  },
  {
    "id": "2c558535-a3a8-11c4-913d-90e2d821e4ae",
    "name": "Corner Dumpling House",
    "slug": "corner-dumpling-house",
    "city": "Cincinnati",
    "state": "OH",
    "neighborhood": "Montgomery",
    "address": "11371 Montgomery Rd, Cincinnati, OH 45249",
    "lat": 39.1031,
    "lng": -84.512,
    "cuisine": "Chinese / Dumplings",
    "cuisineTags": [
      "Chinese",
      "Dumplings"
    ],
    "vibeTags": [],
    "occasionTags": [
      "guys-night"
    ],
    "price": "$",
    "priceLevel": 1,
    "vibeNotes": "Handmade dumplings; authentic and affordable; bring the crew for a dumpling feast",
    "sourceCredit": "@date.night.cincin"
  },
  {
    "id": "32114f49-0b7f-aedc-c6ef-78d8238ba631",
    "name": "(Jerk Spot - Pinned)",
    "slug": "jerk-spot-pinned",
    "city": "Washington",
    "state": "DC",
    "neighborhood": "1",
    "address": "1",
    "lat": 38.9072,
    "lng": -77.0369,
    "cuisine": "Caribbean/Jerk",
    "cuisineTags": [
      "Caribbean",
      "Jerk"
    ],
    "vibeTags": [],
    "occasionTags": [
      "budget-friendly",
      "all-spots-combined"
    ],
    "price": "1",
    "priceLevel": 1,
    "vibeNotes": "PINNED - Top pick, massive views",
    "sourceCredit": "1"
  },
  {
    "id": "051da68a-08a5-98ee-3602-153ca11d8c63",
    "name": "The Seafood Trap (Pinned)",
    "slug": "the-seafood-trap-pinned",
    "city": "Washington",
    "state": "DC",
    "neighborhood": "2",
    "address": "2",
    "lat": 38.9072,
    "lng": -77.0369,
    "cuisine": "Seafood",
    "cuisineTags": [
      "Seafood"
    ],
    "vibeTags": [],
    "occasionTags": [
      "budget-friendly",
      "all-spots-combined"
    ],
    "price": "2",
    "priceLevel": 1,
    "vibeNotes": "PINNED - Big-portion seafood",
    "sourceCredit": "2"
  },
  {
    "id": "4fab2149-5859-46ae-02c1-cef0f4e1ff5c",
    "name": "(Taco Spot - Pinned)",
    "slug": "taco-spot-pinned",
    "city": "Washington",
    "state": "DC",
    "neighborhood": "3",
    "address": "3",
    "lat": 38.9072,
    "lng": -77.0369,
    "cuisine": "Tacos/Mexican",
    "cuisineTags": [
      "Tacos",
      "Mexican"
    ],
    "vibeTags": [],
    "occasionTags": [
      "budget-friendly",
      "all-spots-combined"
    ],
    "price": "3",
    "priceLevel": 1,
    "vibeNotes": "PINNED - Most viewed, fan favorite",
    "sourceCredit": "3"
  },
  {
    "id": "a51248c5-1ab1-754e-7752-8a729d334f1f",
    "name": "The Block Oven",
    "slug": "the-block-oven",
    "city": "Washington",
    "state": "DC",
    "neighborhood": "4",
    "address": "4",
    "lat": 38.9072,
    "lng": -77.0369,
    "cuisine": "Pizza/Italian",
    "cuisineTags": [
      "Pizza",
      "Italian"
    ],
    "vibeTags": [],
    "occasionTags": [
      "budget-friendly",
      "all-spots-combined"
    ],
    "price": "4",
    "priceLevel": 1,
    "vibeNotes": "Just opened \u2014 get in early",
    "sourceCredit": "4"
  },
  {
    "id": "1c292870-02f1-d9f3-d806-ae80cde2cfc7",
    "name": "(Pikesville Spot)",
    "slug": "pikesville-spot",
    "city": "Washington",
    "state": "DC",
    "neighborhood": "5",
    "address": "5",
    "lat": 38.9072,
    "lng": -77.0369,
    "cuisine": "Various",
    "cuisineTags": [
      "Various"
    ],
    "vibeTags": [],
    "occasionTags": [
      "budget-friendly",
      "all-spots-combined"
    ],
    "price": "5",
    "priceLevel": 1,
    "vibeNotes": "Drove from DC just to try it",
    "sourceCredit": "5"
  },
  {
    "id": "78cf0cbe-d781-e4b2-3eee-ca04d89470e9",
    "name": "(New Fried Chicken)",
    "slug": "new-fried-chicken",
    "city": "Washington",
    "state": "DC",
    "neighborhood": "6",
    "address": "6",
    "lat": 38.9072,
    "lng": -77.0369,
    "cuisine": "Fried Chicken",
    "cuisineTags": [
      "Fried Chicken"
    ],
    "vibeTags": [],
    "occasionTags": [
      "budget-friendly",
      "all-spots-combined"
    ],
    "price": "6",
    "priceLevel": 1,
    "vibeNotes": "New opening in DC",
    "sourceCredit": "6"
  },
  {
    "id": "07338d1e-b4da-3f5e-5d49-ba3a29a012be",
    "name": "(Indian Hidden Gem)",
    "slug": "indian-hidden-gem",
    "city": "Washington",
    "state": "DC",
    "neighborhood": "7",
    "address": "7",
    "lat": 38.9072,
    "lng": -77.0369,
    "cuisine": "Indian",
    "cuisineTags": [
      "Indian"
    ],
    "vibeTags": [],
    "occasionTags": [
      "budget-friendly",
      "all-spots-combined"
    ],
    "price": "7",
    "priceLevel": 1,
    "vibeNotes": "Under-the-radar Indian spot",
    "sourceCredit": "7"
  },
  {
    "id": "7b759639-d2b9-5f07-522a-977719243c97",
    "name": "Catalano",
    "slug": "catalano",
    "city": "Washington",
    "state": "DC",
    "neighborhood": "8",
    "address": "8",
    "lat": 38.9072,
    "lng": -77.0369,
    "cuisine": "Pizza/Italian",
    "cuisineTags": [
      "Pizza",
      "Italian"
    ],
    "vibeTags": [],
    "occasionTags": [
      "budget-friendly",
      "all-spots-combined"
    ],
    "price": "8",
    "priceLevel": 1,
    "vibeNotes": "Unique crab pizza combo",
    "sourceCredit": "8"
  },
  {
    "id": "c56fa1bf-59d2-7ad8-25cb-a59e6aa6821b",
    "name": "MAD Seafood",
    "slug": "mad-seafood",
    "city": "Washington",
    "state": "DC",
    "neighborhood": "9",
    "address": "9",
    "lat": 38.9072,
    "lng": -77.0369,
    "cuisine": "Halal",
    "cuisineTags": [
      "Halal"
    ],
    "vibeTags": [],
    "occasionTags": [
      "budget-friendly",
      "all-spots-combined"
    ],
    "price": "9",
    "priceLevel": 1,
    "vibeNotes": "Halal seafood \u2014 rare find in NoVA",
    "sourceCredit": "9"
  },
  {
    "id": "79c3c284-156b-7606-b40e-1fac0a94eef7",
    "name": "Joe's (Wings Pt 14)",
    "slug": "joe-s-wings-pt-14",
    "city": "Washington",
    "state": "DC",
    "neighborhood": "10",
    "address": "10",
    "lat": 38.9072,
    "lng": -77.0369,
    "cuisine": "Wings",
    "cuisineTags": [
      "Wings"
    ],
    "vibeTags": [],
    "occasionTags": [
      "budget-friendly",
      "all-spots-combined"
    ],
    "price": "10",
    "priceLevel": 1,
    "vibeNotes": "Part of ongoing best-wings series",
    "sourceCredit": "10"
  },
  {
    "id": "c57f68db-5cd2-b8d6-87e6-c9ddb441be5e",
    "name": "Prime Grill",
    "slug": "prime-grill",
    "city": "Washington",
    "state": "DC",
    "neighborhood": "11",
    "address": "11",
    "lat": 38.9072,
    "lng": -77.0369,
    "cuisine": "African/Suya",
    "cuisineTags": [
      "African",
      "Suya"
    ],
    "vibeTags": [],
    "occasionTags": [
      "budget-friendly",
      "all-spots-combined"
    ],
    "price": "11",
    "priceLevel": 1,
    "vibeNotes": "Suya wrap standout",
    "sourceCredit": "11"
  },
  {
    "id": "21a57d1e-3ec3-b4cc-67be-0eefa874f363",
    "name": "Flame Japanese Hibachi",
    "slug": "flame-japanese-hibachi",
    "city": "Washington",
    "state": "DC",
    "neighborhood": "12",
    "address": "12",
    "lat": 38.9072,
    "lng": -77.0369,
    "cuisine": "Hibachi/Asian",
    "cuisineTags": [
      "Hibachi",
      "Asian"
    ],
    "vibeTags": [],
    "occasionTags": [
      "budget-friendly",
      "all-spots-combined"
    ],
    "price": "12",
    "priceLevel": 1,
    "vibeNotes": "Affordable hibachi, takeout only",
    "sourceCredit": "12"
  },
  {
    "id": "042406c0-bec1-69f5-4b9d-138df3005bd2",
    "name": "Al's Famous Delicatessen",
    "slug": "al-s-famous-delicatessen",
    "city": "Washington",
    "state": "DC",
    "neighborhood": "13",
    "address": "13",
    "lat": 38.9072,
    "lng": -77.0369,
    "cuisine": "Sandwiches/Deli",
    "cuisineTags": [
      "Sandwiches",
      "Deli"
    ],
    "vibeTags": [],
    "occasionTags": [
      "budget-friendly",
      "all-spots-combined"
    ],
    "price": "13",
    "priceLevel": 1,
    "vibeNotes": "Korean-American fusion deli",
    "sourceCredit": "13"
  },
  {
    "id": "4dad0096-155b-2002-03ae-9fcc301ea734",
    "name": "(Best Chicken DC)",
    "slug": "best-chicken-dc",
    "city": "Washington",
    "state": "DC",
    "neighborhood": "14",
    "address": "14",
    "lat": 38.9072,
    "lng": -77.0369,
    "cuisine": "Fried Chicken",
    "cuisineTags": [
      "Fried Chicken"
    ],
    "vibeTags": [],
    "occasionTags": [
      "budget-friendly",
      "all-spots-combined"
    ],
    "price": "14",
    "priceLevel": 1,
    "vibeNotes": "New spot, strong reviews",
    "sourceCredit": "14"
  },
  {
    "id": "c0a6b04a-3770-bc80-b4dc-745957d23a54",
    "name": "(Massive Sandwich Spot)",
    "slug": "massive-sandwich-spot",
    "city": "Washington",
    "state": "DC",
    "neighborhood": "15",
    "address": "15",
    "lat": 38.9072,
    "lng": -77.0369,
    "cuisine": "Sandwiches/Deli",
    "cuisineTags": [
      "Sandwiches",
      "Deli"
    ],
    "vibeTags": [
      "viral"
    ],
    "occasionTags": [
      "budget-friendly",
      "all-spots-combined"
    ],
    "price": "15",
    "priceLevel": 1,
    "vibeNotes": "Huge portions, went viral",
    "sourceCredit": "15"
  },
  {
    "id": "db8ee8d3-305c-c105-061e-7f3148b332f7",
    "name": "(Beltsville Suya Gem)",
    "slug": "beltsville-suya-gem",
    "city": "Washington",
    "state": "DC",
    "neighborhood": "16",
    "address": "16",
    "lat": 38.9072,
    "lng": -77.0369,
    "cuisine": "African/Suya",
    "cuisineTags": [
      "African",
      "Suya"
    ],
    "vibeTags": [
      "hidden-gem"
    ],
    "occasionTags": [
      "budget-friendly",
      "all-spots-combined"
    ],
    "price": "16",
    "priceLevel": 1,
    "vibeNotes": "Hidden gem, massive views \u2014 $10 suya",
    "sourceCredit": "16"
  },
  {
    "id": "687ccaba-4e4e-f698-acb7-638b87bf3603",
    "name": "The Jerk Pit",
    "slug": "the-jerk-pit",
    "city": "Washington",
    "state": "DC",
    "neighborhood": "17",
    "address": "17",
    "lat": 38.9072,
    "lng": -77.0369,
    "cuisine": "Caribbean/Jerk",
    "cuisineTags": [
      "Caribbean",
      "Jerk"
    ],
    "vibeTags": [],
    "occasionTags": [
      "budget-friendly",
      "all-spots-combined"
    ],
    "price": "17",
    "priceLevel": 1,
    "vibeNotes": "Incredible value \u2014 oxtail under $12",
    "sourceCredit": "17"
  },
  {
    "id": "ac561a2f-d1cd-f5d0-a917-77f47dd5a0da",
    "name": "Sunrise Caribbean Restaurant",
    "slug": "sunrise-caribbean-restaurant",
    "city": "Washington",
    "state": "DC",
    "neighborhood": "18",
    "address": "18",
    "lat": 38.9072,
    "lng": -77.0369,
    "cuisine": "Caribbean/Jerk",
    "cuisineTags": [
      "Caribbean",
      "Jerk"
    ],
    "vibeTags": [],
    "occasionTags": [
      "budget-friendly",
      "all-spots-combined"
    ],
    "price": "18",
    "priceLevel": 1,
    "vibeNotes": "Just moved/expanded to Greenbelt",
    "sourceCredit": "18"
  },
  {
    "id": "9be8e4db-f2e5-96f3-8d72-7464a1a22638",
    "name": "Becky's Seafood House",
    "slug": "becky-s-seafood-house",
    "city": "Washington",
    "state": "DC",
    "neighborhood": "19",
    "address": "19",
    "lat": 38.9072,
    "lng": -77.0369,
    "cuisine": "Seafood",
    "cuisineTags": [
      "Seafood"
    ],
    "vibeTags": [],
    "occasionTags": [
      "budget-friendly",
      "all-spots-combined"
    ],
    "price": "19",
    "priceLevel": 1,
    "vibeNotes": "Takeout seafood, very popular",
    "sourceCredit": "19"
  },
  {
    "id": "d2368d5d-74be-668e-ded0-e9f5b46d94d4",
    "name": "Keith and Sons",
    "slug": "keith-and-sons",
    "city": "Washington",
    "state": "DC",
    "neighborhood": "20",
    "address": "20",
    "lat": 38.9072,
    "lng": -77.0369,
    "cuisine": "Soul Food/Southern",
    "cuisineTags": [
      "Soul Food",
      "Southern"
    ],
    "vibeTags": [],
    "occasionTags": [
      "budget-friendly",
      "all-spots-combined"
    ],
    "price": "20",
    "priceLevel": 1,
    "vibeNotes": "If you know you know \u2014 local favorite",
    "sourceCredit": "20"
  },
  {
    "id": "e7939512-7de3-99c0-11e2-23e7e1873dcb",
    "name": "Crimson Coward",
    "slug": "crimson-coward",
    "city": "Washington",
    "state": "DC",
    "neighborhood": "21",
    "address": "21",
    "lat": 38.9072,
    "lng": -77.0369,
    "cuisine": "Fried Chicken",
    "cuisineTags": [
      "Fried Chicken"
    ],
    "vibeTags": [],
    "occasionTags": [
      "budget-friendly",
      "all-spots-combined"
    ],
    "price": "21",
    "priceLevel": 1,
    "vibeNotes": "Nashville hot chicken comes to DMV",
    "sourceCredit": "21"
  },
  {
    "id": "215c13b9-ad95-c4a0-b36f-b6db53d6b8d4",
    "name": "Roaming Rooster x Capital City Mambo",
    "slug": "roaming-rooster-x-capital-city-mambo",
    "city": "Washington",
    "state": "DC",
    "neighborhood": "22",
    "address": "22",
    "lat": 38.9072,
    "lng": -77.0369,
    "cuisine": "Fried Chicken",
    "cuisineTags": [
      "Fried Chicken"
    ],
    "vibeTags": [],
    "occasionTags": [
      "budget-friendly",
      "all-spots-combined"
    ],
    "price": "22",
    "priceLevel": 1,
    "vibeNotes": "DC icons collab \u2014 must try",
    "sourceCredit": "22"
  },
  {
    "id": "be2d00ed-ebce-5afe-924a-4854bdc58ec8",
    "name": "Smokey's",
    "slug": "smokey-s",
    "city": "Washington",
    "state": "DC",
    "neighborhood": "23",
    "address": "23",
    "lat": 38.9072,
    "lng": -77.0369,
    "cuisine": "BBQ",
    "cuisineTags": [
      "BBQ"
    ],
    "vibeTags": [],
    "occasionTags": [
      "budget-friendly",
      "all-spots-combined"
    ],
    "price": "23",
    "priceLevel": 1,
    "vibeNotes": "Creator's personal favorite",
    "sourceCredit": "23"
  },
  {
    "id": "50ba6872-a1a3-b62f-e07a-45c8cd4b6ae3",
    "name": "China Boy",
    "slug": "china-boy",
    "city": "Washington",
    "state": "DC",
    "neighborhood": "24",
    "address": "24",
    "lat": 38.9072,
    "lng": -77.0369,
    "cuisine": "Chinese",
    "cuisineTags": [
      "Chinese"
    ],
    "vibeTags": [],
    "occasionTags": [
      "budget-friendly",
      "all-spots-combined"
    ],
    "price": "24",
    "priceLevel": 1,
    "vibeNotes": "Chinatown staple",
    "sourceCredit": "24"
  },
  {
    "id": "5b0a4599-2ecd-e079-21f4-25e12a60b61f",
    "name": "Langston Golf Course",
    "slug": "langston-golf-course",
    "city": "Washington",
    "state": "DC",
    "neighborhood": "25",
    "address": "25",
    "lat": 38.9072,
    "lng": -77.0369,
    "cuisine": "Breakfast/Brunch",
    "cuisineTags": [
      "Breakfast",
      "Brunch"
    ],
    "vibeTags": [
      "brunch"
    ],
    "occasionTags": [
      "budget-friendly",
      "all-spots-combined"
    ],
    "price": "25",
    "priceLevel": 1,
    "vibeNotes": "Unexpected pancake gem at a golf course",
    "sourceCredit": "25"
  },
  {
    "id": "f839a153-61e8-7067-5e32-a970fa1df5c8",
    "name": "Rita's Italian Ice",
    "slug": "rita-s-italian-ice",
    "city": "Washington",
    "state": "DC",
    "neighborhood": "26",
    "address": "26",
    "lat": 38.9072,
    "lng": -77.0369,
    "cuisine": "Bakery/Desserts",
    "cuisineTags": [
      "Bakery",
      "Desserts"
    ],
    "vibeTags": [],
    "occasionTags": [
      "budget-friendly",
      "all-spots-combined"
    ],
    "price": "26",
    "priceLevel": 1,
    "vibeNotes": "Watch for free giveaway days",
    "sourceCredit": "26"
  },
  {
    "id": "7d956acf-d9eb-c3d4-147a-d644cca81558",
    "name": "GW Delicatessen",
    "slug": "gw-delicatessen",
    "city": "Washington",
    "state": "DC",
    "neighborhood": "27",
    "address": "27",
    "lat": 38.9072,
    "lng": -77.0369,
    "cuisine": "Sandwiches/Deli",
    "cuisineTags": [
      "Sandwiches",
      "Deli"
    ],
    "vibeTags": [],
    "occasionTags": [
      "budget-friendly",
      "all-spots-combined"
    ],
    "price": "27",
    "priceLevel": 1,
    "vibeNotes": "Bagel sandwiches, classic deli",
    "sourceCredit": "27"
  },
  {
    "id": "e3ab18e9-fdb5-14f2-4379-547f570356f4",
    "name": "Alandin",
    "slug": "alandin",
    "city": "Washington",
    "state": "DC",
    "neighborhood": "28",
    "address": "28",
    "lat": 38.9072,
    "lng": -77.0369,
    "cuisine": "Bakery/Desserts",
    "cuisineTags": [
      "Bakery",
      "Desserts"
    ],
    "vibeTags": [],
    "occasionTags": [
      "budget-friendly",
      "all-spots-combined"
    ],
    "price": "28",
    "priceLevel": 1,
    "vibeNotes": "Cookie destination",
    "sourceCredit": "28"
  },
  {
    "id": "7d3c52d0-ada8-b88c-e94e-ee8c240aa4eb",
    "name": "Jon's Joint",
    "slug": "jon-s-joint",
    "city": "Washington",
    "state": "DC",
    "neighborhood": "29",
    "address": "29",
    "lat": 38.9072,
    "lng": -77.0369,
    "cuisine": "Burgers",
    "cuisineTags": [
      "Burgers"
    ],
    "vibeTags": [],
    "occasionTags": [
      "budget-friendly",
      "all-spots-combined"
    ],
    "price": "29",
    "priceLevel": 1,
    "vibeNotes": "Massive views \u2014 burger spot in Old Town area",
    "sourceCredit": "29"
  },
  {
    "id": "6bc4b438-3db5-c414-725e-c890bae01c4c",
    "name": "Buffalo Wild Wings Go",
    "slug": "buffalo-wild-wings-go",
    "city": "Washington",
    "state": "DC",
    "neighborhood": "30",
    "address": "30",
    "lat": 38.9072,
    "lng": -77.0369,
    "cuisine": "Wings",
    "cuisineTags": [
      "Wings"
    ],
    "vibeTags": [],
    "occasionTags": [
      "budget-friendly",
      "all-spots-combined"
    ],
    "price": "30",
    "priceLevel": 1,
    "vibeNotes": "New BWW Go format in MD",
    "sourceCredit": "30"
  },
  {
    "id": "a4692d14-8001-ad73-fd8d-7253168a351c",
    "name": "(Indian Hidden Gem #2)",
    "slug": "indian-hidden-gem-2",
    "city": "Washington",
    "state": "DC",
    "neighborhood": "31",
    "address": "31",
    "lat": 38.9072,
    "lng": -77.0369,
    "cuisine": "Indian",
    "cuisineTags": [
      "Indian"
    ],
    "vibeTags": [],
    "occasionTags": [
      "budget-friendly",
      "all-spots-combined"
    ],
    "price": "31",
    "priceLevel": 1,
    "vibeNotes": "Another under-the-radar Indian find",
    "sourceCredit": "31"
  },
  {
    "id": "594f5dbf-5ef8-b99c-726c-a6e7c078f194",
    "name": "IHOP",
    "slug": "ihop",
    "city": "Washington",
    "state": "DC",
    "neighborhood": "32",
    "address": "32",
    "lat": 38.9072,
    "lng": -77.0369,
    "cuisine": "Breakfast/Brunch",
    "cuisineTags": [
      "Breakfast",
      "Brunch"
    ],
    "vibeTags": [
      "viral",
      "brunch"
    ],
    "occasionTags": [
      "budget-friendly",
      "all-spots-combined"
    ],
    "price": "32",
    "priceLevel": 1,
    "vibeNotes": "Free pancake day \u2014 most viral video",
    "sourceCredit": "32"
  },
  {
    "id": "f54fe6a7-73e7-afaa-636b-ae590387c29e",
    "name": "(Authentic Taco Spot)",
    "slug": "authentic-taco-spot",
    "city": "Washington",
    "state": "DC",
    "neighborhood": "33",
    "address": "33",
    "lat": 38.9072,
    "lng": -77.0369,
    "cuisine": "Tacos/Mexican",
    "cuisineTags": [
      "Tacos",
      "Mexican"
    ],
    "vibeTags": [],
    "occasionTags": [
      "budget-friendly",
      "all-spots-combined"
    ],
    "price": "33",
    "priceLevel": 1,
    "vibeNotes": "Legit Mexican tacos in Maryland",
    "sourceCredit": "33"
  },
  {
    "id": "6a7e960c-6ad2-6ca0-64ed-66c3a39c843e",
    "name": "Brookland Grill",
    "slug": "brookland-grill",
    "city": "Washington",
    "state": "DC",
    "neighborhood": "34",
    "address": "34",
    "lat": 38.9072,
    "lng": -77.0369,
    "cuisine": "Soul Food/Southern",
    "cuisineTags": [
      "Soul Food",
      "Southern"
    ],
    "vibeTags": [],
    "occasionTags": [
      "budget-friendly",
      "all-spots-combined"
    ],
    "price": "34",
    "priceLevel": 1,
    "vibeNotes": "Neighborhood fried fish spot",
    "sourceCredit": "34"
  },
  {
    "id": "2a4fb543-5189-3406-d056-76729df6bfb7",
    "name": "Z Burger & Maman Joon",
    "slug": "z-burger-maman-joon",
    "city": "Washington",
    "state": "DC",
    "neighborhood": "35",
    "address": "35",
    "lat": 38.9072,
    "lng": -77.0369,
    "cuisine": "Persian/Middle Eastern",
    "cuisineTags": [
      "Persian",
      "Middle Eastern"
    ],
    "vibeTags": [],
    "occasionTags": [
      "budget-friendly",
      "all-spots-combined"
    ],
    "price": "35",
    "priceLevel": 1,
    "vibeNotes": "Two-in-one: burgers & Persian food",
    "sourceCredit": "35"
  },
  {
    "id": "b2ccf6bf-bc33-82bc-c934-ec4128e320ae",
    "name": "Le Diplomate",
    "slug": "le-diplomate",
    "city": "Washington",
    "state": "DC",
    "neighborhood": "1",
    "address": "1",
    "lat": 38.9072,
    "lng": -77.0369,
    "cuisine": "French/European",
    "cuisineTags": [
      "French",
      "European"
    ],
    "vibeTags": [
      "iconic"
    ],
    "occasionTags": [
      "mid-level",
      "all-spots-combined"
    ],
    "price": "$$$",
    "priceLevel": 3,
    "vibeNotes": "DC's most iconic French bistro \u2014 always packed",
    "sourceCredit": "1"
  },
  {
    "id": "92bd631d-08c9-8277-2d77-bcc58a5fbc66",
    "name": "St. Anselm",
    "slug": "st-anselm",
    "city": "Washington",
    "state": "DC",
    "neighborhood": "2",
    "address": "2",
    "lat": 38.9072,
    "lng": -77.0369,
    "cuisine": "New American",
    "cuisineTags": [
      "New American"
    ],
    "vibeTags": [],
    "occasionTags": [
      "mid-level",
      "all-spots-combined"
    ],
    "price": "$$$",
    "priceLevel": 3,
    "vibeNotes": "One of DC's best steakhouse values",
    "sourceCredit": "2"
  },
  {
    "id": "66bf07b8-d394-dc6c-fa44-1b37a4892243",
    "name": "Old Ebbitt Grill",
    "slug": "old-ebbitt-grill",
    "city": "Washington",
    "state": "DC",
    "neighborhood": "3",
    "address": "3",
    "lat": 38.9072,
    "lng": -77.0369,
    "cuisine": "New American",
    "cuisineTags": [
      "New American"
    ],
    "vibeTags": [],
    "occasionTags": [
      "mid-level",
      "all-spots-combined",
      "guys-night"
    ],
    "price": "$$$",
    "priceLevel": 3,
    "vibeNotes": "DC landmark near the White House",
    "sourceCredit": "3"
  },
  {
    "id": "42fa4f97-3d77-7e91-209a-789565049895",
    "name": "Founding Farmers DC",
    "slug": "founding-farmers-dc",
    "city": "Washington",
    "state": "DC",
    "neighborhood": "4",
    "address": "4",
    "lat": 38.9072,
    "lng": -77.0369,
    "cuisine": "New American",
    "cuisineTags": [
      "New American"
    ],
    "vibeTags": [
      "brunch"
    ],
    "occasionTags": [
      "mid-level",
      "all-spots-combined"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Consistently packed \u2014 weekend brunch is legendary",
    "sourceCredit": "4"
  },
  {
    "id": "4484a85c-4f63-a365-1283-9cc07a2fe2f3",
    "name": "The Hamilton",
    "slug": "the-hamilton",
    "city": "Washington",
    "state": "DC",
    "neighborhood": "5",
    "address": "5",
    "lat": 38.9072,
    "lng": -77.0369,
    "cuisine": "New American",
    "cuisineTags": [
      "New American"
    ],
    "vibeTags": [],
    "occasionTags": [
      "mid-level",
      "all-spots-combined"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Dinner and a show under one roof",
    "sourceCredit": "5"
  },
  {
    "id": "fc9d32b4-d0b8-a953-786a-e109774c6702",
    "name": "L'Ardente",
    "slug": "l-ardente",
    "city": "Washington",
    "state": "DC",
    "neighborhood": "6",
    "address": "6",
    "lat": 38.9072,
    "lng": -77.0369,
    "cuisine": "Pizza/Italian",
    "cuisineTags": [
      "Pizza",
      "Italian"
    ],
    "vibeTags": [
      "upscale"
    ],
    "occasionTags": [
      "mid-level",
      "all-spots-combined"
    ],
    "price": "$$$",
    "priceLevel": 3,
    "vibeNotes": "Upscale Italian with incredible pastas",
    "sourceCredit": "6"
  },
  {
    "id": "61ade81d-fd79-a4f5-3882-1d37ce7343e0",
    "name": "Unconventional Diner",
    "slug": "unconventional-diner",
    "city": "Washington",
    "state": "DC",
    "neighborhood": "7",
    "address": "7",
    "lat": 38.9072,
    "lng": -77.0369,
    "cuisine": "New American",
    "cuisineTags": [
      "New American"
    ],
    "vibeTags": [],
    "occasionTags": [
      "mid-level",
      "all-spots-combined"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Creative takes on diner classics",
    "sourceCredit": "7"
  },
  {
    "id": "f2ac28b1-34a9-1416-5c47-3f904c83bf50",
    "name": "Lapis",
    "slug": "lapis",
    "city": "Washington",
    "state": "DC",
    "neighborhood": "8",
    "address": "8",
    "lat": 38.9072,
    "lng": -77.0369,
    "cuisine": "Afghan",
    "cuisineTags": [
      "Afghan"
    ],
    "vibeTags": [
      "cozy",
      "cocktails"
    ],
    "occasionTags": [
      "mid-level",
      "all-spots-combined",
      "girls-night"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Best Afghan food in the city \u2014 cozy vibe",
    "sourceCredit": "8"
  },
  {
    "id": "4358ae69-73c8-4926-03ca-68fcf3def053",
    "name": "Zaytinya",
    "slug": "zaytinya",
    "city": "Washington",
    "state": "DC",
    "neighborhood": "9",
    "address": "9",
    "lat": 38.9072,
    "lng": -77.0369,
    "cuisine": "Mediterranean",
    "cuisineTags": [
      "Mediterranean"
    ],
    "vibeTags": [],
    "occasionTags": [
      "mid-level",
      "all-spots-combined"
    ],
    "price": "$$$",
    "priceLevel": 3,
    "vibeNotes": "Jos\u00e9 Andr\u00e9s \u2014 world-class mezze",
    "sourceCredit": "9"
  },
  {
    "id": "0fb4949b-83b4-b86b-0287-5ed5b1414b7f",
    "name": "Dear Sushi",
    "slug": "dear-sushi",
    "city": "Washington",
    "state": "DC",
    "neighborhood": "10",
    "address": "10",
    "lat": 38.9072,
    "lng": -77.0369,
    "cuisine": "Japanese/Sushi",
    "cuisineTags": [
      "Japanese",
      "Sushi"
    ],
    "vibeTags": [],
    "occasionTags": [
      "mid-level",
      "all-spots-combined"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Rare affordable omakase experience",
    "sourceCredit": "10"
  },
  {
    "id": "5c122de9-4a13-6e06-7dc1-7fa3fabfca45",
    "name": "Tapori",
    "slug": "tapori",
    "city": "Washington",
    "state": "DC",
    "neighborhood": "11",
    "address": "11",
    "lat": 38.9072,
    "lng": -77.0369,
    "cuisine": "Indian-Nepalese",
    "cuisineTags": [
      "Indian-Nepalese"
    ],
    "vibeTags": [
      "hidden-gem"
    ],
    "occasionTags": [
      "mid-level",
      "all-spots-combined",
      "girls-night"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "H Street hidden gem \u2014 incredible chaat",
    "sourceCredit": "11"
  },
  {
    "id": "939f9825-ea3f-8a62-d192-d3e415e1974c",
    "name": "Providencia",
    "slug": "providencia",
    "city": "Washington",
    "state": "DC",
    "neighborhood": "12",
    "address": "12",
    "lat": 38.9072,
    "lng": -77.0369,
    "cuisine": "Salvadoran/Fusion",
    "cuisineTags": [
      "Salvadoran",
      "Fusion"
    ],
    "vibeTags": [],
    "occasionTags": [
      "mid-level",
      "all-spots-combined"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Tiny spot, massive flavors \u2014 totally unique",
    "sourceCredit": "12"
  },
  {
    "id": "d3725261-30bc-b000-a043-70cc78f9edb3",
    "name": "Minetta Tavern",
    "slug": "minetta-tavern",
    "city": "Washington",
    "state": "DC",
    "neighborhood": "13",
    "address": "13",
    "lat": 38.9072,
    "lng": -77.0369,
    "cuisine": "French/European",
    "cuisineTags": [
      "French",
      "European"
    ],
    "vibeTags": [],
    "occasionTags": [
      "mid-level",
      "all-spots-combined"
    ],
    "price": "$$$",
    "priceLevel": 3,
    "vibeNotes": "NYC import \u2014 sophisticated date night",
    "sourceCredit": "13"
  },
  {
    "id": "3b403756-1a29-5ba0-4bfe-7c7789ca3798",
    "name": "D\u014dgon",
    "slug": "d-gon",
    "city": "Washington",
    "state": "DC",
    "neighborhood": "14",
    "address": "14",
    "lat": 38.9072,
    "lng": -77.0369,
    "cuisine": "West African",
    "cuisineTags": [
      "West African"
    ],
    "vibeTags": [
      "rooftop"
    ],
    "occasionTags": [
      "mid-level",
      "all-spots-combined"
    ],
    "price": "$$$",
    "priceLevel": 3,
    "vibeNotes": "Stunning rooftop \u2014 Black-owned fine dining",
    "sourceCredit": "14"
  },
  {
    "id": "5de3a247-d4c9-21ca-07bb-6d9422ec2440",
    "name": "Vortex Restaurant & Lounge",
    "slug": "vortex-restaurant-lounge",
    "city": "Washington",
    "state": "DC",
    "neighborhood": "15",
    "address": "15",
    "lat": 38.9072,
    "lng": -77.0369,
    "cuisine": "Ethiopian/East African",
    "cuisineTags": [
      "Ethiopian",
      "East African"
    ],
    "vibeTags": [],
    "occasionTags": [
      "mid-level",
      "all-spots-combined"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Black & woman-owned \u2014 great vibe",
    "sourceCredit": "15"
  },
  {
    "id": "39717d1f-25d2-d81e-2fd0-9647cd1878a0",
    "name": "Hedzole",
    "slug": "hedzole",
    "city": "Washington",
    "state": "DC",
    "neighborhood": "16",
    "address": "16",
    "lat": 38.9072,
    "lng": -77.0369,
    "cuisine": "West African",
    "cuisineTags": [
      "West African"
    ],
    "vibeTags": [],
    "occasionTags": [
      "mid-level",
      "all-spots-combined"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Fast-casual West African \u2014 chef chats w/ every diner",
    "sourceCredit": "16"
  },
  {
    "id": "c2bc15ee-3e66-13b2-e4b0-8b8a8c1565bc",
    "name": "Bukom Caf\u00e9",
    "slug": "bukom-caf",
    "city": "Washington",
    "state": "DC",
    "neighborhood": "17",
    "address": "17",
    "lat": 38.9072,
    "lng": -77.0369,
    "cuisine": "West African",
    "cuisineTags": [
      "West African"
    ],
    "vibeTags": [
      "live-music"
    ],
    "occasionTags": [
      "mid-level",
      "all-spots-combined"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Live music + outstanding food \u2014 neighborhood staple",
    "sourceCredit": "17"
  },
  {
    "id": "65944ea0-bfbf-18c6-a6f6-1ce8f23bae39",
    "name": "Milk & Honey",
    "slug": "milk-honey",
    "city": "Washington",
    "state": "DC",
    "neighborhood": "18",
    "address": "18",
    "lat": 38.9072,
    "lng": -77.0369,
    "cuisine": "Breakfast/Brunch",
    "cuisineTags": [
      "Breakfast",
      "Brunch"
    ],
    "vibeTags": [
      "brunch"
    ],
    "occasionTags": [
      "mid-level",
      "all-spots-combined"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Must-visit brunch \u2014 New Orleans themed",
    "sourceCredit": "18"
  },
  {
    "id": "a623cfe6-e771-578a-e425-7e1e657dabe4",
    "name": "Chercher Ethiopian",
    "slug": "chercher-ethiopian",
    "city": "Washington",
    "state": "DC",
    "neighborhood": "19",
    "address": "19",
    "lat": 38.9072,
    "lng": -77.0369,
    "cuisine": "Ethiopian/East African",
    "cuisineTags": [
      "Ethiopian",
      "East African"
    ],
    "vibeTags": [],
    "occasionTags": [
      "mid-level",
      "all-spots-combined"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Top Ethiopian in the city \u2014 affordable and fresh",
    "sourceCredit": "19"
  },
  {
    "id": "b00803a4-e02c-ba79-4f87-83ae6373f282",
    "name": "A&J Restaurant",
    "slug": "a-j-restaurant",
    "city": "Washington",
    "state": "DC",
    "neighborhood": "20",
    "address": "20",
    "lat": 38.9072,
    "lng": -77.0369,
    "cuisine": "Chinese",
    "cuisineTags": [
      "Chinese"
    ],
    "vibeTags": [],
    "occasionTags": [
      "mid-level",
      "all-spots-combined"
    ],
    "price": "$",
    "priceLevel": 1,
    "vibeNotes": "Old-school dim sum standby \u2014 multiple locations",
    "sourceCredit": "20"
  },
  {
    "id": "4e7211c1-0233-54dc-34ce-266f188991cc",
    "name": "Aventino",
    "slug": "aventino",
    "city": "Washington",
    "state": "DC",
    "neighborhood": "21",
    "address": "21",
    "lat": 38.9072,
    "lng": -77.0369,
    "cuisine": "Pizza/Italian",
    "cuisineTags": [
      "Pizza",
      "Italian"
    ],
    "vibeTags": [],
    "occasionTags": [
      "mid-level",
      "all-spots-combined"
    ],
    "price": "$$$",
    "priceLevel": 3,
    "vibeNotes": "Chef Mike Friedman \u2014 Eater 38 Best 2026",
    "sourceCredit": "21"
  },
  {
    "id": "ca3121ef-2d94-0eb2-a924-a795f7d83f39",
    "name": "Ruta",
    "slug": "ruta",
    "city": "Washington",
    "state": "DC",
    "neighborhood": "22",
    "address": "22",
    "lat": 38.9072,
    "lng": -77.0369,
    "cuisine": "Ukrainian",
    "cuisineTags": [
      "Ukrainian"
    ],
    "vibeTags": [],
    "occasionTags": [
      "mid-level",
      "all-spots-combined"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Rare Ukrainian restaurant \u2014 Eater 38 Best 2026",
    "sourceCredit": "22"
  },
  {
    "id": "198ac045-dd27-e413-b376-e3eff71d774f",
    "name": "J. Hollinger's Waterman's Chophouse",
    "slug": "j-hollinger-s-waterman-s-chophouse",
    "city": "Washington",
    "state": "DC",
    "neighborhood": "23",
    "address": "23",
    "lat": 38.9072,
    "lng": -77.0369,
    "cuisine": "Seafood",
    "cuisineTags": [
      "Seafood"
    ],
    "vibeTags": [
      "brunch"
    ],
    "occasionTags": [
      "mid-level",
      "all-spots-combined"
    ],
    "price": "$$$",
    "priceLevel": 3,
    "vibeNotes": "Brunch: ribeye, hot honey chicken, crab deviled eggs",
    "sourceCredit": "23"
  },
  {
    "id": "b7dabf39-9fb0-5b72-4c20-8af4e052b890",
    "name": "All Set",
    "slug": "all-set",
    "city": "Washington",
    "state": "DC",
    "neighborhood": "24",
    "address": "24",
    "lat": 38.9072,
    "lng": -77.0369,
    "cuisine": "New American",
    "cuisineTags": [
      "New American"
    ],
    "vibeTags": [],
    "occasionTags": [
      "mid-level",
      "all-spots-combined"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Black-owned \u2014 modern seasonal dining",
    "sourceCredit": "24"
  },
  {
    "id": "88a94375-4f95-a921-362a-b4f827f14b3b",
    "name": "El Viejo",
    "slug": "el-viejo",
    "city": "Washington",
    "state": "DC",
    "neighborhood": "25",
    "address": "25",
    "lat": 38.9072,
    "lng": -77.0369,
    "cuisine": "Tacos/Mexican",
    "cuisineTags": [
      "Tacos",
      "Mexican"
    ],
    "vibeTags": [],
    "occasionTags": [
      "mid-level",
      "all-spots-combined"
    ],
    "price": "$",
    "priceLevel": 1,
    "vibeNotes": "Washingtonian 100 Best \u2014 incredible pupusas",
    "sourceCredit": "25"
  },
  {
    "id": "dfaedaa1-53f6-fdf1-a481-5734674ed369",
    "name": "2Fifty Texas BBQ",
    "slug": "2fifty-texas-bbq",
    "city": "Washington",
    "state": "DC",
    "neighborhood": "26",
    "address": "26",
    "lat": 38.9072,
    "lng": -77.0369,
    "cuisine": "BBQ",
    "cuisineTags": [
      "BBQ"
    ],
    "vibeTags": [],
    "occasionTags": [
      "mid-level",
      "all-spots-combined"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Nationally acclaimed \u2014 long lines worth it",
    "sourceCredit": "26"
  },
  {
    "id": "310ff787-548e-34a5-d7dc-0ff57e2bf649",
    "name": "Cielo Rojo",
    "slug": "cielo-rojo",
    "city": "Washington",
    "state": "DC",
    "neighborhood": "27",
    "address": "27",
    "lat": 38.9072,
    "lng": -77.0369,
    "cuisine": "Tacos/Mexican",
    "cuisineTags": [
      "Tacos",
      "Mexican"
    ],
    "vibeTags": [
      "late-night"
    ],
    "occasionTags": [
      "mid-level",
      "all-spots-combined"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Eater 38 Best 2026 \u2014 great small plates",
    "sourceCredit": "27"
  },
  {
    "id": "7b90bbfb-8b41-0ab8-3055-ada172211395",
    "name": "Tio Pel\u00e9",
    "slug": "tio-pel",
    "city": "Washington",
    "state": "DC",
    "neighborhood": "28",
    "address": "28",
    "lat": 38.9072,
    "lng": -77.0369,
    "cuisine": "Latin/Brazilian",
    "cuisineTags": [
      "Latin",
      "Brazilian"
    ],
    "vibeTags": [],
    "occasionTags": [
      "mid-level",
      "all-spots-combined"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Bold flavors \u2014 new in Arlington",
    "sourceCredit": "28"
  },
  {
    "id": "9f268f7c-32e8-e271-a80d-85ff3d881f3f",
    "name": "Dok Khao",
    "slug": "dok-khao",
    "city": "Washington",
    "state": "DC",
    "neighborhood": "29",
    "address": "29",
    "lat": 38.9072,
    "lng": -77.0369,
    "cuisine": "Thai",
    "cuisineTags": [
      "Thai"
    ],
    "vibeTags": [],
    "occasionTags": [
      "mid-level",
      "all-spots-combined"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Authentic Thai in Old Town \u2014 standout curries",
    "sourceCredit": "29"
  },
  {
    "id": "c4286224-6d80-6fa1-a274-34a68c0a5e33",
    "name": "Chao Ban",
    "slug": "chao-ban",
    "city": "Washington",
    "state": "DC",
    "neighborhood": "30",
    "address": "30",
    "lat": 38.9072,
    "lng": -77.0369,
    "cuisine": "Vietnamese",
    "cuisineTags": [
      "Vietnamese"
    ],
    "vibeTags": [],
    "occasionTags": [
      "mid-level",
      "all-spots-combined"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Gulf South + Mid-Atlantic Vietnamese twist",
    "sourceCredit": "30"
  },
  {
    "id": "9677f82d-bb76-9fff-c34d-66669a972c45",
    "name": "Peter Chang",
    "slug": "peter-chang",
    "city": "Washington",
    "state": "DC",
    "neighborhood": "31",
    "address": "31",
    "lat": 38.9072,
    "lng": -77.0369,
    "cuisine": "Chinese",
    "cuisineTags": [
      "Chinese"
    ],
    "vibeTags": [],
    "occasionTags": [
      "mid-level",
      "all-spots-combined"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Chef Peter Chang \u2014 best Szechuan in the DMV",
    "sourceCredit": "31"
  },
  {
    "id": "39296ec7-a672-3f72-0979-a8bf4836f236",
    "name": "Grazie Nonna",
    "slug": "grazie-nonna",
    "city": "Washington",
    "state": "DC",
    "neighborhood": "32",
    "address": "32",
    "lat": 38.9072,
    "lng": -77.0369,
    "cuisine": "Pizza/Italian",
    "cuisineTags": [
      "Pizza",
      "Italian"
    ],
    "vibeTags": [],
    "occasionTags": [
      "mid-level",
      "all-spots-combined"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Coming 2026 \u2014 Italian-American done right",
    "sourceCredit": "32"
  },
  {
    "id": "680a16c0-2952-059e-20ad-626986bf5e0b",
    "name": "Maman",
    "slug": "maman",
    "city": "Washington",
    "state": "DC",
    "neighborhood": "33",
    "address": "33",
    "lat": 38.9072,
    "lng": -77.0369,
    "cuisine": "French/European",
    "cuisineTags": [
      "French",
      "European"
    ],
    "vibeTags": [
      "brunch"
    ],
    "occasionTags": [
      "mid-level",
      "all-spots-combined"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "NYC French caf\u00e9 chain \u2014 great for brunch/coffee",
    "sourceCredit": "33"
  },
  {
    "id": "30134703-9f78-c9bf-a0dc-de0c8bdcf666",
    "name": "The Fountain Inn",
    "slug": "the-fountain-inn",
    "city": "Washington",
    "state": "DC",
    "neighborhood": "34",
    "address": "34",
    "lat": 38.9072,
    "lng": -77.0369,
    "cuisine": "New American",
    "cuisineTags": [
      "New American"
    ],
    "vibeTags": [],
    "occasionTags": [
      "mid-level",
      "all-spots-combined"
    ],
    "price": "$$$",
    "priceLevel": 3,
    "vibeNotes": "Resy hit list \u2014 newest date night spot",
    "sourceCredit": "34"
  },
  {
    "id": "6249f650-f98d-0e8d-23d1-bd70f9ca9ee4",
    "name": "Chloe",
    "slug": "chloe",
    "city": "Washington",
    "state": "DC",
    "neighborhood": "35",
    "address": "35",
    "lat": 38.9072,
    "lng": -77.0369,
    "cuisine": "New American",
    "cuisineTags": [
      "New American"
    ],
    "vibeTags": [
      "intimate",
      "wine",
      "late-night"
    ],
    "occasionTags": [
      "mid-level",
      "all-spots-combined"
    ],
    "price": "$$$",
    "priceLevel": 3,
    "vibeNotes": "Intimate wine bar / small plates \u2014 Navy Yard gem",
    "sourceCredit": "35"
  },
  {
    "id": "174f7609-158a-a1d7-5a6e-7738be41ebf2",
    "name": "Amelie",
    "slug": "amelie",
    "city": "Washington",
    "state": "DC",
    "neighborhood": "36",
    "address": "36",
    "lat": 38.9072,
    "lng": -77.0369,
    "cuisine": "French/European",
    "cuisineTags": [
      "French",
      "European"
    ],
    "vibeTags": [
      "wine"
    ],
    "occasionTags": [
      "mid-level",
      "all-spots-combined"
    ],
    "price": "$$$",
    "priceLevel": 3,
    "vibeNotes": "Parisian wine bar vibes",
    "sourceCredit": "36"
  },
  {
    "id": "a3059e12-d995-007a-495a-85dcff1b0f46",
    "name": "CODE RED",
    "slug": "code-red",
    "city": "Washington",
    "state": "DC",
    "neighborhood": "37",
    "address": "37",
    "lat": 38.9072,
    "lng": -77.0369,
    "cuisine": "Japanese/Sushi",
    "cuisineTags": [
      "Japanese",
      "Sushi"
    ],
    "vibeTags": [
      "trendy"
    ],
    "occasionTags": [
      "mid-level",
      "all-spots-combined"
    ],
    "price": "$$$",
    "priceLevel": 3,
    "vibeNotes": "Trendy \u2014 great for group outings",
    "sourceCredit": "37"
  },
  {
    "id": "116f37ac-f007-cb24-e57b-e6fdbb7aea01",
    "name": "Astoria DC",
    "slug": "astoria-dc",
    "city": "Washington",
    "state": "DC",
    "neighborhood": "38",
    "address": "38",
    "lat": 38.9072,
    "lng": -77.0369,
    "cuisine": "Mediterranean",
    "cuisineTags": [
      "Mediterranean"
    ],
    "vibeTags": [
      "late-night"
    ],
    "occasionTags": [
      "mid-level",
      "all-spots-combined"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Social dining \u2014 hookah + mezze plates",
    "sourceCredit": "38"
  },
  {
    "id": "717507ae-e4a2-0293-0c39-5c394981beb2",
    "name": "Albi",
    "slug": "albi",
    "city": "Washington",
    "state": "DC",
    "neighborhood": "39",
    "address": "39",
    "lat": 38.9072,
    "lng": -77.0369,
    "cuisine": "Mediterranean",
    "cuisineTags": [
      "Mediterranean"
    ],
    "vibeTags": [],
    "occasionTags": [
      "mid-level",
      "all-spots-combined",
      "family"
    ],
    "price": "$$$",
    "priceLevel": 3,
    "vibeNotes": "Washingtonian 100 Best \u2014 fire-cooked everything",
    "sourceCredit": "39"
  },
  {
    "id": "96946b20-10fb-f98c-9284-2d031f6ea8f0",
    "name": "Yellow Cuisine",
    "slug": "yellow-cuisine",
    "city": "Washington",
    "state": "DC",
    "neighborhood": "40",
    "address": "40",
    "lat": 38.9072,
    "lng": -77.0369,
    "cuisine": "Persian/Middle Eastern",
    "cuisineTags": [
      "Persian",
      "Middle Eastern"
    ],
    "vibeTags": [
      "michelin"
    ],
    "occasionTags": [
      "mid-level",
      "all-spots-combined"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Michelin Guide 2025 value pick",
    "sourceCredit": "40"
  },
  {
    "id": "a5b32a63-a3c1-0536-540d-e82c5d0a430d",
    "name": "Your Only Friend",
    "slug": "your-only-friend",
    "city": "Washington",
    "state": "DC",
    "neighborhood": "41",
    "address": "41",
    "lat": 38.9072,
    "lng": -77.0369,
    "cuisine": "Gastropub",
    "cuisineTags": [
      "Gastropub"
    ],
    "vibeTags": [
      "michelin"
    ],
    "occasionTags": [
      "mid-level",
      "all-spots-combined"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Michelin Guide 2025 \u2014 neighborhood gem",
    "sourceCredit": "41"
  },
  {
    "id": "61f026b0-29a7-b93a-4043-f6b296187b28",
    "name": "Fig & Olive",
    "slug": "fig-olive",
    "city": "Washington",
    "state": "DC",
    "neighborhood": "Downtown",
    "address": "934 Palmer Alley NW",
    "lat": 38.9072,
    "lng": -77.0369,
    "cuisine": "Mediterranean",
    "cuisineTags": [
      "Mediterranean"
    ],
    "vibeTags": [
      "romantic",
      "viral"
    ],
    "occasionTags": [
      "date-night"
    ],
    "price": "$$$$",
    "priceLevel": 4,
    "vibeNotes": "Romantic French-Med; candle-lit courtyard; TikTok viral date spot",
    "sourceCredit": "TikTok @asmaindc"
  },
  {
    "id": "68d1e14b-73e0-3929-b604-170a984b0606",
    "name": "La Vie",
    "slug": "la-vie",
    "city": "Washington",
    "state": "DC",
    "neighborhood": "The Wharf",
    "address": "88 District Sq SW",
    "lat": 38.9072,
    "lng": -77.0369,
    "cuisine": "French Brasserie",
    "cuisineTags": [
      "French Brasserie"
    ],
    "vibeTags": [
      "waterfront",
      "dj",
      "sunset"
    ],
    "occasionTags": [
      "date-night"
    ],
    "price": "$$$$",
    "priceLevel": 4,
    "vibeNotes": "Wharf waterfront stunner; sunset views; live DJ weekends",
    "sourceCredit": "TikTok @asmaindc"
  },
  {
    "id": "0bd854eb-747a-48d6-ab80-22a2df37a7e1",
    "name": "Pineapple & Pearls",
    "slug": "pineapple-pearls",
    "city": "Washington",
    "state": "DC",
    "neighborhood": "Capitol Hill",
    "address": "715 8th St SE",
    "lat": 38.9072,
    "lng": -77.0369,
    "cuisine": "Tasting Menu",
    "cuisineTags": [
      "Tasting Menu"
    ],
    "vibeTags": [
      "michelin"
    ],
    "occasionTags": [
      "date-night"
    ],
    "price": "$$$$",
    "priceLevel": 4,
    "vibeNotes": "2 Michelin stars; 10-course tasting; Aaron Silverman magic",
    "sourceCredit": "Michelin Guide"
  },
  {
    "id": "61ef69eb-2452-af40-2f64-488cab4168ab",
    "name": "Lutece",
    "slug": "lutece",
    "city": "Washington",
    "state": "DC",
    "neighborhood": "Georgetown",
    "address": "1522 Wisconsin Ave NW",
    "lat": 38.9072,
    "lng": -77.0369,
    "cuisine": "French",
    "cuisineTags": [
      "French"
    ],
    "vibeTags": [],
    "occasionTags": [
      "date-night"
    ],
    "price": "$$$$",
    "priceLevel": 4,
    "vibeNotes": "Classic French fine dining; vintage Georgetown elegance",
    "sourceCredit": "Washingtonian"
  },
  {
    "id": "66f8bc11-b2dc-f227-8b3c-4b6147b111f7",
    "name": "Dogon",
    "slug": "dogon",
    "city": "Washington",
    "state": "DC",
    "neighborhood": "Shaw",
    "address": "1906 9th St NW",
    "lat": 38.9072,
    "lng": -77.0369,
    "cuisine": "West African Fine Dining",
    "cuisineTags": [
      "West African Fine Dining"
    ],
    "vibeTags": [],
    "occasionTags": [
      "date-night"
    ],
    "price": "$$$$",
    "priceLevel": 4,
    "vibeNotes": "Kwame Onwuachi's flagship; West African + Southern soul",
    "sourceCredit": "Eater DC"
  },
  {
    "id": "d432219f-b9ad-5216-ccce-7e7d7aa269ff",
    "name": "Saint Yves",
    "slug": "saint-yves",
    "city": "Washington",
    "state": "DC",
    "neighborhood": "Downtown",
    "address": "1800 M St NW",
    "lat": 38.9072,
    "lng": -77.0369,
    "cuisine": "French",
    "cuisineTags": [
      "French"
    ],
    "vibeTags": [
      "michelin"
    ],
    "occasionTags": [
      "date-night"
    ],
    "price": "$$$$",
    "priceLevel": 4,
    "vibeNotes": "Michelin-starred French; stunning Beaux-Arts space",
    "sourceCredit": "Michelin Guide"
  },
  {
    "id": "1aba1856-2826-a2e6-b6e0-b1966fbe7d9a",
    "name": "Dlena",
    "slug": "dlena",
    "city": "Washington",
    "state": "DC",
    "neighborhood": "Dupont",
    "address": "1737 Connecticut Ave NW",
    "lat": 38.9072,
    "lng": -77.0369,
    "cuisine": "Mediterranean",
    "cuisineTags": [
      "Mediterranean"
    ],
    "vibeTags": [
      "intimate",
      "cocktails"
    ],
    "occasionTags": [
      "date-night"
    ],
    "price": "$$$",
    "priceLevel": 3,
    "vibeNotes": "Chic Med; great cocktails; intimate vibes",
    "sourceCredit": "TikTok @asmaindc"
  },
  {
    "id": "89cc1cb7-45ff-b087-ae32-c907cba974f7",
    "name": "Filomena",
    "slug": "filomena",
    "city": "Washington",
    "state": "DC",
    "neighborhood": "Georgetown",
    "address": "1063 Wisconsin Ave NW",
    "lat": 38.9072,
    "lng": -77.0369,
    "cuisine": "Italian",
    "cuisineTags": [
      "Italian"
    ],
    "vibeTags": [
      "iconic"
    ],
    "occasionTags": [
      "date-night"
    ],
    "price": "$$$",
    "priceLevel": 3,
    "vibeNotes": "Iconic Georgetown Italian; fresh pasta made in window daily",
    "sourceCredit": "TikTok @asmaindc"
  },
  {
    "id": "c3e7b66f-63cf-401f-bac6-6fe25f408e64",
    "name": "La Grande Boucherie",
    "slug": "la-grande-boucherie",
    "city": "Washington",
    "state": "DC",
    "neighborhood": "Downtown",
    "address": "1550 K St NW",
    "lat": 38.9072,
    "lng": -77.0369,
    "cuisine": "French Brasserie",
    "cuisineTags": [
      "French Brasserie"
    ],
    "vibeTags": [],
    "occasionTags": [
      "group-night-out"
    ],
    "price": "$$$",
    "priceLevel": 3,
    "vibeNotes": "Grand Parisian brasserie; great for groups; towering seafood platters",
    "sourceCredit": "TikTok @asmaindc"
  },
  {
    "id": "ca5cbfa5-c7ec-7480-4ca8-401872c41beb",
    "name": "Balos",
    "slug": "balos",
    "city": "Washington",
    "state": "DC",
    "neighborhood": "Penn Quarter",
    "address": "440 K St NW",
    "lat": 38.9072,
    "lng": -77.0369,
    "cuisine": "Greek",
    "cuisineTags": [
      "Greek"
    ],
    "vibeTags": [
      "upscale",
      "energetic",
      "fun",
      "late-night"
    ],
    "occasionTags": [
      "group-night-out"
    ],
    "price": "$$$",
    "priceLevel": 3,
    "vibeNotes": "Upscale Greek; communal plates; loud and fun energy",
    "sourceCredit": "TikTok @asmaindc"
  },
  {
    "id": "0e7f84af-d760-3503-8983-ef5b1f9976cf",
    "name": "Le DeSales",
    "slug": "le-desales",
    "city": "Washington",
    "state": "DC",
    "neighborhood": "Downtown",
    "address": "1500 Desales St NW",
    "lat": 38.9072,
    "lng": -77.0369,
    "cuisine": "French",
    "cuisineTags": [
      "French"
    ],
    "vibeTags": [
      "live-music"
    ],
    "occasionTags": [
      "group-night-out"
    ],
    "price": "$$$",
    "priceLevel": 3,
    "vibeNotes": "Supper club vibes; live music; velvet banquettes",
    "sourceCredit": "TikTok @asmaindc"
  },
  {
    "id": "0a66b034-4c13-6f74-6037-bbb49b994a42",
    "name": "Rosebar",
    "slug": "rosebar",
    "city": "Washington",
    "state": "DC",
    "neighborhood": "Downtown",
    "address": "1919 M St NW",
    "lat": 38.9072,
    "lng": -77.0369,
    "cuisine": "Lounge / Small Plates",
    "cuisineTags": [
      "Lounge",
      "Small Plates"
    ],
    "vibeTags": [
      "dj",
      "late-night",
      "upscale"
    ],
    "occasionTags": [
      "group-night-out",
      "girls-night",
      "bachelor"
    ],
    "price": "$$$",
    "priceLevel": 3,
    "vibeNotes": "Lounge meets restaurant; DJ sets; bottle service available",
    "sourceCredit": "Washingtonian"
  },
  {
    "id": "e891e670-8cce-0840-ce54-2aec99242a98",
    "name": "Flight Club",
    "slug": "flight-club",
    "city": "Washington",
    "state": "DC",
    "neighborhood": "Shaw",
    "address": "916 U St NW",
    "lat": 38.9072,
    "lng": -77.0369,
    "cuisine": "Darts Bar / Gastropub",
    "cuisineTags": [
      "Darts Bar",
      "Gastropub"
    ],
    "vibeTags": [
      "fun"
    ],
    "occasionTags": [
      "group-night-out",
      "bachelor"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Social darts; shareable bites; tech-powered scoring",
    "sourceCredit": "TimeOut DC"
  },
  {
    "id": "577da208-beab-d2f2-a22e-ed706113512a",
    "name": "Church Hall",
    "slug": "church-hall",
    "city": "Washington",
    "state": "DC",
    "neighborhood": "Columbia Heights",
    "address": "3400 Georgia Ave NW",
    "lat": 38.9072,
    "lng": -77.0369,
    "cuisine": "Food Hall / Bar",
    "cuisineTags": [
      "Food Hall",
      "Bar"
    ],
    "vibeTags": [],
    "occasionTags": [
      "group-night-out"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Converted church; multiple vendors; beer garden",
    "sourceCredit": "Infatuation DC"
  },
  {
    "id": "e0b1b131-9763-2822-3528-8ac9f773b1e1",
    "name": "Bar Angie",
    "slug": "bar-angie",
    "city": "Washington",
    "state": "DC",
    "neighborhood": "Shaw",
    "address": "1901 8th St NW",
    "lat": 38.9072,
    "lng": -77.0369,
    "cuisine": "Italian-American Bar",
    "cuisineTags": [
      "Italian-American Bar"
    ],
    "vibeTags": [
      "cozy",
      "cocktails"
    ],
    "occasionTags": [
      "group-night-out"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Red-sauce Italian vibes; strong cocktails; cozy booths",
    "sourceCredit": "TikTok @dmvfoodie"
  },
  {
    "id": "8cffa1a9-8741-58ac-d447-f0680d4dbb02",
    "name": "Eatopia",
    "slug": "eatopia",
    "city": "Washington",
    "state": "DC",
    "neighborhood": "Georgetown",
    "address": "3241 M St NW",
    "lat": 38.9072,
    "lng": -77.0369,
    "cuisine": "Asian Fusion",
    "cuisineTags": [
      "Asian Fusion"
    ],
    "vibeTags": [
      "trendy"
    ],
    "occasionTags": [
      "group-night-out"
    ],
    "price": "$$$",
    "priceLevel": 3,
    "vibeNotes": "Trendy Asian fusion; group-friendly large format dishes",
    "sourceCredit": "TikTok @asmaindc"
  },
  {
    "id": "5410ce0e-e468-6495-7d72-8649327d72cf",
    "name": "Fiola Mare",
    "slug": "fiola-mare",
    "city": "Washington",
    "state": "DC",
    "neighborhood": "Georgetown",
    "address": "3050 K St NW",
    "lat": 38.9072,
    "lng": -77.0369,
    "cuisine": "Italian Seafood",
    "cuisineTags": [
      "Italian Seafood"
    ],
    "vibeTags": [
      "elegant",
      "waterfront"
    ],
    "occasionTags": [
      "family"
    ],
    "price": "$$$$",
    "priceLevel": 4,
    "vibeNotes": "Waterfront Italian seafood; elegant; impresses everyone",
    "sourceCredit": "Michelin Guide"
  },
  {
    "id": "86e6bdc4-ec96-5af9-55be-081ffa96a957",
    "name": "Olio e Piu",
    "slug": "olio-e-piu",
    "city": "Washington",
    "state": "DC",
    "neighborhood": "Georgetown",
    "address": "3226 M St NW",
    "lat": 38.9072,
    "lng": -77.0369,
    "cuisine": "Italian",
    "cuisineTags": [
      "Italian"
    ],
    "vibeTags": [
      "patio"
    ],
    "occasionTags": [
      "family"
    ],
    "price": "$$$",
    "priceLevel": 3,
    "vibeNotes": "Classic Italian; warm service; beautiful patio",
    "sourceCredit": "TikTok @asmaindc"
  },
  {
    "id": "cfd7ae5a-3354-5ab7-caae-7d87989d7ac9",
    "name": "Villa Yara",
    "slug": "villa-yara",
    "city": "Washington",
    "state": "DC",
    "neighborhood": "Downtown",
    "address": "901 New York Ave NW",
    "lat": 38.9072,
    "lng": -77.0369,
    "cuisine": "Lebanese-Italian",
    "cuisineTags": [
      "Lebanese-Italian"
    ],
    "vibeTags": [],
    "occasionTags": [
      "family"
    ],
    "price": "$$$",
    "priceLevel": 3,
    "vibeNotes": "Gorgeous Lebanese-Italian; family-friendly elegance",
    "sourceCredit": "TikTok @asmaindc"
  },
  {
    "id": "7a2d64d9-5245-adc9-03bf-8cd349d08352",
    "name": "Lazizi",
    "slug": "lazizi",
    "city": "Washington",
    "state": "DC",
    "neighborhood": "Navy Yard",
    "address": "1201 Half St SE",
    "lat": 38.9072,
    "lng": -77.0369,
    "cuisine": "Turkish",
    "cuisineTags": [
      "Turkish"
    ],
    "vibeTags": [],
    "occasionTags": [
      "family"
    ],
    "price": "$$$",
    "priceLevel": 3,
    "vibeNotes": "Beautiful Turkish; warm hospitality; great for parents",
    "sourceCredit": "TikTok @asmaindc"
  },
  {
    "id": "8b03f68f-f86f-8c6d-edb4-3d70a8817fee",
    "name": "Kyojin",
    "slug": "kyojin",
    "city": "Washington",
    "state": "DC",
    "neighborhood": "Penn Quarter",
    "address": "413 8th St NW",
    "lat": 38.9072,
    "lng": -77.0369,
    "cuisine": "Japanese Omakase",
    "cuisineTags": [
      "Japanese Omakase"
    ],
    "vibeTags": [
      "intimate"
    ],
    "occasionTags": [
      "family"
    ],
    "price": "$$$$",
    "priceLevel": 4,
    "vibeNotes": "Intimate omakase; impressive but accessible sushi experience",
    "sourceCredit": "TikTok DC foodie"
  },
  {
    "id": "957dc4cc-09a4-603d-809b-e50d0eaf6281",
    "name": "Isla",
    "slug": "isla",
    "city": "Washington",
    "state": "DC",
    "neighborhood": "The Wharf",
    "address": "79 Potomac Ave SE",
    "lat": 38.9072,
    "lng": -77.0369,
    "cuisine": "Caribbean Fine Dining",
    "cuisineTags": [
      "Caribbean Fine Dining"
    ],
    "vibeTags": [
      "waterfront"
    ],
    "occasionTags": [
      "family"
    ],
    "price": "$$$",
    "priceLevel": 3,
    "vibeNotes": "Vibrant Caribbean; waterfront; approachable fine dining",
    "sourceCredit": "Eater DC"
  },
  {
    "id": "c88d7a73-24e9-01ca-b505-f6f3703cca19",
    "name": "Phoxotic",
    "slug": "phoxotic",
    "city": "Washington",
    "state": "DC",
    "neighborhood": "Georgetown",
    "address": "3236 M St NW",
    "lat": 38.9072,
    "lng": -77.0369,
    "cuisine": "Asian Fusion",
    "cuisineTags": [
      "Asian Fusion"
    ],
    "vibeTags": [
      "upscale",
      "cocktails"
    ],
    "occasionTags": [
      "family"
    ],
    "price": "$$$",
    "priceLevel": 3,
    "vibeNotes": "Upscale Asian; photogenic cocktails; family-appropriate",
    "sourceCredit": "TikTok @asmaindc"
  },
  {
    "id": "6b798e87-db71-4b97-dbcd-9b867b7fb13e",
    "name": "Dauphine's",
    "slug": "dauphine-s",
    "city": "Washington",
    "state": "DC",
    "neighborhood": "Downtown",
    "address": "1100 Pennsylvania Ave NW",
    "lat": 38.9072,
    "lng": -77.0369,
    "cuisine": "French",
    "cuisineTags": [
      "French"
    ],
    "vibeTags": [],
    "occasionTags": [
      "girls-night"
    ],
    "price": "$$$$",
    "priceLevel": 4,
    "vibeNotes": "Gorgeous French; dramatic interiors; champagne list",
    "sourceCredit": "Washingtonian"
  },
  {
    "id": "bcb5fc26-cc8e-9f75-d750-33bc44319506",
    "name": "Officina",
    "slug": "officina",
    "city": "Washington",
    "state": "DC",
    "neighborhood": "The Wharf",
    "address": "1120 Maine Ave SW",
    "lat": 38.9072,
    "lng": -77.0369,
    "cuisine": "Italian",
    "cuisineTags": [
      "Italian"
    ],
    "vibeTags": [
      "rooftop"
    ],
    "occasionTags": [
      "girls-night"
    ],
    "price": "$$$",
    "priceLevel": 3,
    "vibeNotes": "Three-level Italian market/restaurant/rooftop; Wharf vibes",
    "sourceCredit": "Eater DC"
  },
  {
    "id": "fc4b156c-605c-7ae1-5368-a7853cfa2392",
    "name": "Pi Pizzeria",
    "slug": "pi-pizzeria",
    "city": "Washington",
    "state": "DC",
    "neighborhood": "Penn Quarter",
    "address": "910 F St NW",
    "lat": 38.9072,
    "lng": -77.0369,
    "cuisine": "Pizza / Wine Bar",
    "cuisineTags": [
      "Pizza",
      "Wine Bar"
    ],
    "vibeTags": [
      "fun",
      "wine"
    ],
    "occasionTags": [
      "girls-night"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Deep dish + great wine list; casual but fun",
    "sourceCredit": "Infatuation DC"
  },
  {
    "id": "bfb5fbcb-553d-e66a-40a3-83469b45494b",
    "name": "Jeni's Splendid Ice Creams",
    "slug": "jeni-s-splendid-ice-creams",
    "city": "Washington",
    "state": "DC",
    "neighborhood": "Georgetown",
    "address": "1520 Wisconsin Ave NW",
    "lat": 38.9072,
    "lng": -77.0369,
    "cuisine": "Dessert",
    "cuisineTags": [
      "Dessert"
    ],
    "vibeTags": [],
    "occasionTags": [
      "girls-night"
    ],
    "price": "$",
    "priceLevel": 1,
    "vibeNotes": "Post-dinner dessert stop; artisan flavors; IG-worthy",
    "sourceCredit": "Instagram #dcfoodie"
  },
  {
    "id": "ca79a725-7dc7-321b-af5e-906906fe56d7",
    "name": "Takoda",
    "slug": "takoda",
    "city": "Washington",
    "state": "DC",
    "neighborhood": "Shaw",
    "address": "715 Florida Ave NW",
    "lat": 38.9072,
    "lng": -77.0369,
    "cuisine": "Rooftop / American",
    "cuisineTags": [
      "Rooftop",
      "American"
    ],
    "vibeTags": [
      "chill",
      "fun",
      "rooftop"
    ],
    "occasionTags": [
      "girls-night"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Rooftop beer garden; great views; chill but fun vibes",
    "sourceCredit": "TimeOut DC"
  },
  {
    "id": "d7fed7db-a65c-0ed2-caa4-54b842c348d4",
    "name": "Bourbon Steak",
    "slug": "bourbon-steak",
    "city": "Washington",
    "state": "DC",
    "neighborhood": "Georgetown",
    "address": "2800 Pennsylvania Ave NW",
    "lat": 38.9072,
    "lng": -77.0369,
    "cuisine": "Steakhouse",
    "cuisineTags": [
      "Steakhouse"
    ],
    "vibeTags": [],
    "occasionTags": [
      "guys-night"
    ],
    "price": "$$$$",
    "priceLevel": 4,
    "vibeNotes": "Michael Mina steakhouse; Four Seasons; duck fat fries",
    "sourceCredit": "Michelin Guide"
  },
  {
    "id": "46e676fc-284e-13ec-c191-6f2bd74a30a4",
    "name": "The Salt Line",
    "slug": "the-salt-line",
    "city": "Washington",
    "state": "DC",
    "neighborhood": "Navy Yard",
    "address": "79 Potomac Ave SE",
    "lat": 38.9072,
    "lng": -77.0369,
    "cuisine": "Seafood / Raw Bar",
    "cuisineTags": [
      "Seafood",
      "Raw Bar"
    ],
    "vibeTags": [
      "waterfront"
    ],
    "occasionTags": [
      "guys-night"
    ],
    "price": "$$$",
    "priceLevel": 3,
    "vibeNotes": "Waterfront oysters & craft beer; casual but quality",
    "sourceCredit": "Eater DC"
  },
  {
    "id": "b29cf34d-8b64-aa97-db6d-5b1ee6744a1a",
    "name": "Due South",
    "slug": "due-south",
    "city": "Washington",
    "state": "DC",
    "neighborhood": "Navy Yard",
    "address": "301 Water St SE",
    "lat": 38.9072,
    "lng": -77.0369,
    "cuisine": "Southern / BBQ",
    "cuisineTags": [
      "Southern",
      "BBQ"
    ],
    "vibeTags": [],
    "occasionTags": [
      "guys-night"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Southern BBQ; bourbon selection; game day vibes",
    "sourceCredit": "Infatuation DC"
  },
  {
    "id": "0363fd46-fc60-c29a-3ae4-3033977c1dc8",
    "name": "Jack Rose",
    "slug": "jack-rose",
    "city": "Washington",
    "state": "DC",
    "neighborhood": "Adams Morgan",
    "address": "2007 18th St NW",
    "lat": 38.9072,
    "lng": -77.0369,
    "cuisine": "Whiskey Bar",
    "cuisineTags": [
      "Whiskey Bar"
    ],
    "vibeTags": [
      "rooftop",
      "whiskey"
    ],
    "occasionTags": [
      "guys-night"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "2700+ whiskeys; rooftop terrace; legendary pour list",
    "sourceCredit": "Washingtonian"
  },
  {
    "id": "0af4a722-ca28-53dd-df66-38df49b12e19",
    "name": "Tiger Fork",
    "slug": "tiger-fork",
    "city": "Washington",
    "state": "DC",
    "neighborhood": "Shaw",
    "address": "922 N St NW",
    "lat": 38.9072,
    "lng": -77.0369,
    "cuisine": "Chinese / Cocktail Bar",
    "cuisineTags": [
      "Chinese",
      "Cocktail Bar"
    ],
    "vibeTags": [
      "cocktails"
    ],
    "occasionTags": [
      "guys-night"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Hong Kong street food; dim sum; strong drink program",
    "sourceCredit": "Eater DC"
  },
  {
    "id": "838a7b0b-ce12-26a5-eca9-656335a1d4ad",
    "name": "Jinya Ramen",
    "slug": "jinya-ramen",
    "city": "Washington",
    "state": "DC",
    "neighborhood": "Penn Quarter",
    "address": "770 I St NW",
    "lat": 38.9072,
    "lng": -77.0369,
    "cuisine": "Ramen",
    "cuisineTags": [
      "Ramen"
    ],
    "vibeTags": [
      "late-night"
    ],
    "occasionTags": [
      "guys-night"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Rich tonkotsu bowls; late night; no-frills fuel",
    "sourceCredit": "Infatuation DC"
  },
  {
    "id": "0d6b33c5-a8e9-218d-85df-b7aa921a1ebb",
    "name": "Flash",
    "slug": "flash",
    "city": "Washington",
    "state": "DC",
    "neighborhood": "Shaw",
    "address": "645 Florida Ave NW",
    "lat": 38.9072,
    "lng": -77.0369,
    "cuisine": "Nightclub",
    "cuisineTags": [
      "Nightclub"
    ],
    "vibeTags": [
      "late-night",
      "rooftop"
    ],
    "occasionTags": [
      "guys-night",
      "bachelor"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Underground techno club; warehouse vibes; late hours",
    "sourceCredit": "TimeOut DC"
  },
  {
    "id": "07a11323-63f0-6697-b4b8-776b090f5e76",
    "name": "Echostage",
    "slug": "echostage",
    "city": "Washington",
    "state": "DC",
    "neighborhood": "Ivy City",
    "address": "2135 Queens Chapel Rd NE",
    "lat": 38.9072,
    "lng": -77.0369,
    "cuisine": "Nightclub / Venue",
    "cuisineTags": [
      "Nightclub",
      "Venue"
    ],
    "vibeTags": [
      "dj"
    ],
    "occasionTags": [
      "bachelor"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Massive EDM venue; world-class DJs; epic production",
    "sourceCredit": "TimeOut DC"
  },
  {
    "id": "03e7f7ee-63f2-ea22-e4dd-f1c11344a1b8",
    "name": "Decades",
    "slug": "decades",
    "city": "Washington",
    "state": "DC",
    "neighborhood": "Dupont",
    "address": "1219 Connecticut Ave NW",
    "lat": 38.9072,
    "lng": -77.0369,
    "cuisine": "Nightclub",
    "cuisineTags": [
      "Nightclub"
    ],
    "vibeTags": [
      "dance"
    ],
    "occasionTags": [
      "bachelor"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Multi-era themed floors; throwback hits; dance-heavy",
    "sourceCredit": "Washingtonian"
  },
  {
    "id": "95fb1940-07e4-7347-8544-9ec94fcb5bf4",
    "name": "Clyde's of Georgetown",
    "slug": "clyde-s-of-georgetown",
    "city": "Washington",
    "state": "DC",
    "neighborhood": "Georgetown",
    "address": "3236 M St NW",
    "lat": 38.9072,
    "lng": -77.0369,
    "cuisine": "American / Bar",
    "cuisineTags": [
      "American",
      "Bar"
    ],
    "vibeTags": [],
    "occasionTags": [
      "bachelor"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Classic Georgetown bar; great starting point for pub crawl",
    "sourceCredit": "Classic DC"
  },
  {
    "id": "6cb10568-04aa-de68-1d4e-62f1d56db8f6",
    "name": "Lucky Bar",
    "slug": "lucky-bar",
    "city": "Washington",
    "state": "DC",
    "neighborhood": "Dupont",
    "address": "1221 Connecticut Ave NW",
    "lat": 38.9072,
    "lng": -77.0369,
    "cuisine": "Sports Bar",
    "cuisineTags": [
      "Sports Bar"
    ],
    "vibeTags": [],
    "occasionTags": [
      "bachelor"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Dive-bar charm; pool tables; cheap drinks; no pretense",
    "sourceCredit": "Infatuation DC"
  },
  {
    "id": "27b8eab5-73c0-bc61-ec00-d02b22e6c06d",
    "name": "Sauf Haus",
    "slug": "sauf-haus",
    "city": "Washington",
    "state": "DC",
    "neighborhood": "Dupont",
    "address": "1216 18th St NW",
    "lat": 38.9072,
    "lng": -77.0369,
    "cuisine": "Beer Hall / Rooftop",
    "cuisineTags": [
      "Beer Hall",
      "Rooftop"
    ],
    "vibeTags": [
      "rooftop"
    ],
    "occasionTags": [
      "bachelor"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "German beer hall; rooftop; group-friendly; liters of beer",
    "sourceCredit": "TimeOut DC"
  },
  {
    "id": "c65505a2-dc66-8e61-a9b7-633b5af07d5d",
    "name": "The Wharf",
    "slug": "the-wharf",
    "city": "Washington",
    "state": "DC",
    "neighborhood": "Southwest",
    "address": "Maine Ave SW",
    "lat": 38.9072,
    "lng": -77.0369,
    "cuisine": "Waterfront District",
    "cuisineTags": [
      "Waterfront District"
    ],
    "vibeTags": [
      "waterfront"
    ],
    "occasionTags": [
      "outdoor-adventure"
    ],
    "price": "$$-$$$$",
    "priceLevel": 4,
    "vibeNotes": "Full waterfront district; restaurants + bars + kayaks + concerts",
    "sourceCredit": "Visit DC"
  },
  {
    "id": "7273b78b-2fd1-f797-52fe-2bbb91640fb8",
    "name": "The Yards Park",
    "slug": "the-yards-park",
    "city": "Washington",
    "state": "DC",
    "neighborhood": "Capitol Riverfront",
    "address": "355 Water St SE",
    "lat": 38.9072,
    "lng": -77.0369,
    "cuisine": "Park / Outdoor",
    "cuisineTags": [
      "Park",
      "Outdoor"
    ],
    "vibeTags": [
      "outdoor"
    ],
    "occasionTags": [
      "outdoor-adventure"
    ],
    "price": "Free",
    "priceLevel": 1,
    "vibeNotes": "Canal basin; boardwalk; summer concerts; water features",
    "sourceCredit": "Visit DC"
  },
  {
    "id": "44d8ae36-4c4e-40d6-ba09-c78bc0b28c54",
    "name": "Gravelly Point",
    "slug": "gravelly-point",
    "city": "Washington",
    "state": "DC",
    "neighborhood": "Arlington (VA side)",
    "address": "GW Memorial Pkwy",
    "lat": 38.9072,
    "lng": -77.0369,
    "cuisine": "Park / Planes",
    "cuisineTags": [
      "Park",
      "Planes"
    ],
    "vibeTags": [
      "iconic"
    ],
    "occasionTags": [
      "outdoor-adventure"
    ],
    "price": "Free",
    "priceLevel": 1,
    "vibeNotes": "Watch planes land at DCA from 50 feet; iconic DC picnic spot",
    "sourceCredit": "TikTok viral"
  },
  {
    "id": "c1adc3db-a612-6e7d-7045-d94b1ed7e05e",
    "name": "Rock Creek Park",
    "slug": "rock-creek-park",
    "city": "Washington",
    "state": "DC",
    "neighborhood": "NW DC",
    "address": "Beach Dr NW",
    "lat": 38.9072,
    "lng": -77.0369,
    "cuisine": "Nature / Trails",
    "cuisineTags": [
      "Nature",
      "Trails"
    ],
    "vibeTags": [],
    "occasionTags": [
      "outdoor-adventure"
    ],
    "price": "Free",
    "priceLevel": 1,
    "vibeNotes": "1,754 acres; trails, creek, horse center; nature in the city",
    "sourceCredit": "NPS"
  },
  {
    "id": "734dd5a8-1c2f-2f19-2e53-2a052d41d6ad",
    "name": "National Mall",
    "slug": "national-mall",
    "city": "Washington",
    "state": "DC",
    "neighborhood": "Downtown",
    "address": "National Mall",
    "lat": 38.9072,
    "lng": -77.0369,
    "cuisine": "Monuments / Walk",
    "cuisineTags": [
      "Monuments",
      "Walk"
    ],
    "vibeTags": [],
    "occasionTags": [
      "outdoor-adventure"
    ],
    "price": "Free",
    "priceLevel": 1,
    "vibeNotes": "Monuments at night; paddle boats on Tidal Basin; quintessential DC",
    "sourceCredit": "NPS"
  },
  {
    "id": "e41350ac-5b01-be55-4cb3-8d118d3d295e",
    "name": "Georgetown Waterfront",
    "slug": "georgetown-waterfront",
    "city": "Washington",
    "state": "DC",
    "neighborhood": "Georgetown",
    "address": "K St NW & Water St",
    "lat": 38.9072,
    "lng": -77.0369,
    "cuisine": "Waterfront / Walk",
    "cuisineTags": [
      "Waterfront",
      "Walk"
    ],
    "vibeTags": [
      "waterfront",
      "sunset"
    ],
    "occasionTags": [
      "outdoor-adventure"
    ],
    "price": "Free",
    "priceLevel": 1,
    "vibeNotes": "Sunset strolls; kayaking; waterfront dining strip",
    "sourceCredit": "Visit DC"
  },
  {
    "id": "eeb84d66-9ccc-937d-0b2b-374c19646f19",
    "name": "Union Market",
    "slug": "union-market",
    "city": "Washington",
    "state": "DC",
    "neighborhood": "NoMa",
    "address": "1309 5th St NE",
    "lat": 38.9072,
    "lng": -77.0369,
    "cuisine": "Food Hall / Market",
    "cuisineTags": [
      "Food Hall",
      "Market"
    ],
    "vibeTags": [
      "rooftop",
      "outdoor"
    ],
    "occasionTags": [
      "outdoor-adventure"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Artisan vendors; rooftop cinema; outdoor events",
    "sourceCredit": "Eater DC"
  },
  {
    "id": "4eefb3d2-264c-d027-e17f-908b58c74c7d",
    "name": "The Anthem",
    "slug": "the-anthem",
    "city": "Washington",
    "state": "DC",
    "neighborhood": "The Wharf",
    "address": "901 Wharf St SW",
    "lat": 38.9072,
    "lng": -77.0369,
    "cuisine": "Concert Venue",
    "cuisineTags": [
      "Concert Venue"
    ],
    "vibeTags": [],
    "occasionTags": [
      "outdoor-adventure"
    ],
    "price": "$$-$$$",
    "priceLevel": 4,
    "vibeNotes": "6,000-cap venue; major acts; world-class sound",
    "sourceCredit": "The Anthem"
  },
  {
    "id": "00afc057-1644-11ae-2288-30b8e6a5ef35",
    "name": "The Wolf's Tailor",
    "slug": "the-wolf-s-tailor",
    "city": "Denver",
    "state": "CO",
    "neighborhood": "Sunnyside",
    "address": "4058 Tejon St",
    "lat": 39.7392,
    "lng": -104.9903,
    "cuisine": "Italian-Japanese",
    "cuisineTags": [
      "Italian-Japanese"
    ],
    "vibeTags": [
      "michelin"
    ],
    "occasionTags": [
      "date-night"
    ],
    "price": "$$$$",
    "priceLevel": 4,
    "vibeNotes": "Michelin-recognized; handmade pasta meets Japanese technique",
    "sourceCredit": "TikTok"
  },
  {
    "id": "59189a40-dd47-b678-097c-bdbb16174bd7",
    "name": "Beckon",
    "slug": "beckon",
    "city": "Denver",
    "state": "CO",
    "neighborhood": "RiNo",
    "address": "2843 Larimer St",
    "lat": 39.7392,
    "lng": -104.9903,
    "cuisine": "Tasting Menu",
    "cuisineTags": [
      "Tasting Menu"
    ],
    "vibeTags": [
      "intimate"
    ],
    "occasionTags": [
      "date-night"
    ],
    "price": "$$$$",
    "priceLevel": 4,
    "vibeNotes": "10-course tasting menu in an intimate 22-seat space; phenomenal",
    "sourceCredit": "Instagram"
  },
  {
    "id": "4a4381e6-9a15-247c-e57a-9ce4ae2ef545",
    "name": "Mizuna",
    "slug": "mizuna",
    "city": "Denver",
    "state": "CO",
    "neighborhood": "Capitol Hill",
    "address": "225 E 7th Ave",
    "lat": 39.7392,
    "lng": -104.9903,
    "cuisine": "New American",
    "cuisineTags": [
      "New American"
    ],
    "vibeTags": [
      "iconic"
    ],
    "occasionTags": [
      "date-night"
    ],
    "price": "$$$$",
    "priceLevel": 4,
    "vibeNotes": "Denver's fine-dining benchmark; lobster mac and cheese is iconic",
    "sourceCredit": "TikTok"
  },
  {
    "id": "70c6f485-4fec-a778-c257-df743385e851",
    "name": "Bastien's",
    "slug": "bastien-s",
    "city": "Denver",
    "state": "CO",
    "neighborhood": "Colfax",
    "address": "3503 E Colfax Ave",
    "lat": 39.7392,
    "lng": -104.9903,
    "cuisine": "Steakhouse / Retro",
    "cuisineTags": [
      "Steakhouse",
      "Retro"
    ],
    "vibeTags": [],
    "occasionTags": [
      "date-night"
    ],
    "price": "$$$",
    "priceLevel": 3,
    "vibeNotes": "1937 supper club with sugar-crusted steaks and mid-century glamour",
    "sourceCredit": "Instagram"
  },
  {
    "id": "20423d33-b189-975b-efd9-96ceb41fbf09",
    "name": "Wildflower",
    "slug": "wildflower",
    "city": "Denver",
    "state": "CO",
    "neighborhood": "RiNo",
    "address": "2500 Larimer St",
    "lat": 39.7392,
    "lng": -104.9903,
    "cuisine": "French / Seasonal",
    "cuisineTags": [
      "French",
      "Seasonal"
    ],
    "vibeTags": [
      "patio",
      "wine"
    ],
    "occasionTags": [
      "date-night"
    ],
    "price": "$$$",
    "priceLevel": 3,
    "vibeNotes": "Stunning patio with seasonal French-inspired cuisine and natural wines",
    "sourceCredit": "TikTok"
  },
  {
    "id": "27b24699-7812-3e02-77e2-79b9260d83b2",
    "name": "Sushi Hai",
    "slug": "sushi-hai",
    "city": "Denver",
    "state": "CO",
    "neighborhood": "LoDo",
    "address": "2032 Arapahoe St",
    "lat": 39.7392,
    "lng": -104.9903,
    "cuisine": "Japanese / Omakase",
    "cuisineTags": [
      "Japanese",
      "Omakase"
    ],
    "vibeTags": [],
    "occasionTags": [
      "date-night"
    ],
    "price": "$$$",
    "priceLevel": 3,
    "vibeNotes": "Omakase counter experience in downtown Denver; fish flown in daily",
    "sourceCredit": "Instagram"
  },
  {
    "id": "56a90062-e878-07c5-3fc9-108e38b20eae",
    "name": "Malinche Audiobar",
    "slug": "malinche-audiobar",
    "city": "Denver",
    "state": "CO",
    "neighborhood": "Baker",
    "address": "72 S Broadway",
    "lat": 39.7392,
    "lng": -104.9903,
    "cuisine": "Mexican / Cocktail",
    "cuisineTags": [
      "Mexican",
      "Cocktail"
    ],
    "vibeTags": [
      "intimate",
      "cocktails"
    ],
    "occasionTags": [
      "date-night"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Mezcal cocktails with vinyl record-listening concept; intimate and cool",
    "sourceCredit": "TikTok"
  },
  {
    "id": "224d6d7a-8b35-054e-0a59-59a1b43ea7bc",
    "name": "Church and Union",
    "slug": "church-and-union",
    "city": "Denver",
    "state": "CO",
    "neighborhood": "Cherry Creek",
    "address": "200 Fillmore St",
    "lat": 39.7392,
    "lng": -104.9903,
    "cuisine": "Southern / Cocktails",
    "cuisineTags": [
      "Southern",
      "Cocktails"
    ],
    "vibeTags": [
      "elegant",
      "patio",
      "cocktails"
    ],
    "occasionTags": [
      "date-night"
    ],
    "price": "$$$",
    "priceLevel": 3,
    "vibeNotes": "Elegant Southern cuisine with a gorgeous bar and patio in Cherry Creek",
    "sourceCredit": "Instagram"
  },
  {
    "id": "10b152c5-6eed-2b37-0fd9-a871ff98da16",
    "name": "54Thirty Rooftop",
    "slug": "54thirty-rooftop",
    "city": "Denver",
    "state": "CO",
    "neighborhood": "LoDo",
    "address": "1475 Lawrence St",
    "lat": 39.7392,
    "lng": -104.9903,
    "cuisine": "Rooftop Bar",
    "cuisineTags": [
      "Rooftop Bar"
    ],
    "vibeTags": [
      "rooftop",
      "cocktails"
    ],
    "occasionTags": [
      "group-night-out"
    ],
    "price": "$$$",
    "priceLevel": 3,
    "vibeNotes": "Denver's highest rooftop bar; mountain views, craft cocktails, always busy",
    "sourceCredit": "TikTok"
  },
  {
    "id": "543749f4-a9ba-9d2a-f9ea-f4a1eb4411df",
    "name": "The ViewHouse",
    "slug": "the-viewhouse",
    "city": "Denver",
    "state": "CO",
    "neighborhood": "Ballpark",
    "address": "2015 Market St",
    "lat": 39.7392,
    "lng": -104.9903,
    "cuisine": "Sports Bar / Rooftop",
    "cuisineTags": [
      "Sports Bar",
      "Rooftop"
    ],
    "vibeTags": [
      "rooftop"
    ],
    "occasionTags": [
      "group-night-out"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Three-level sports bar with rooftop deck and bowling",
    "sourceCredit": "Instagram"
  },
  {
    "id": "9916bec4-a5c0-d832-50d5-af9d97aa10f7",
    "name": "Happy Camper",
    "slug": "happy-camper",
    "city": "Denver",
    "state": "CO",
    "neighborhood": "RiNo",
    "address": "3211 Walnut St",
    "lat": 39.7392,
    "lng": -104.9903,
    "cuisine": "Pizza / Bar",
    "cuisineTags": [
      "Pizza",
      "Bar"
    ],
    "vibeTags": [
      "patio",
      "cocktails"
    ],
    "occasionTags": [
      "group-night-out"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Massive patio, pizza, cocktails, lawn games \u2014 group night perfection",
    "sourceCredit": "TikTok"
  },
  {
    "id": "164b978f-b16b-a76c-abf7-c58f9d46d836",
    "name": "Culinary Dropout",
    "slug": "culinary-dropout",
    "city": "Denver",
    "state": "CO",
    "neighborhood": "Stapleton",
    "address": "3325 Larimer St",
    "lat": 39.7392,
    "lng": -104.9903,
    "cuisine": "Gastropub / Games",
    "cuisineTags": [
      "Gastropub",
      "Games"
    ],
    "vibeTags": [
      "live-music"
    ],
    "occasionTags": [
      "group-night-out"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Bocce courts, ping pong, pretzel fondue, and live music",
    "sourceCredit": "Instagram"
  },
  {
    "id": "4f3ba5eb-c94c-e8e7-84dc-d2b91e636bbb",
    "name": "Jack's on Pearl",
    "slug": "jack-s-on-pearl",
    "city": "Denver",
    "state": "CO",
    "neighborhood": "Capitol Hill",
    "address": "1200 Pearl St",
    "lat": 39.7392,
    "lng": -104.9903,
    "cuisine": "Cocktail Bar / Games",
    "cuisineTags": [
      "Cocktail Bar",
      "Games"
    ],
    "vibeTags": [
      "cocktails"
    ],
    "occasionTags": [
      "group-night-out"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Speakeasy-vibe bar with shuffleboard, foosball, and craft drinks",
    "sourceCredit": "TikTok"
  },
  {
    "id": "bad20841-8ee8-11fe-19da-c18e7399adf6",
    "name": "BurnDown",
    "slug": "burndown",
    "city": "Denver",
    "state": "CO",
    "neighborhood": "RiNo",
    "address": "2643 Walnut St",
    "lat": 39.7392,
    "lng": -104.9903,
    "cuisine": "Beer Garden / Events",
    "cuisineTags": [
      "Beer Garden",
      "Events"
    ],
    "vibeTags": [
      "outdoor"
    ],
    "occasionTags": [
      "group-night-out"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Outdoor beer garden with fire pits, food trucks, and rotating events",
    "sourceCredit": "Instagram"
  },
  {
    "id": "16a0e465-b683-1052-2d0f-ca48c52f8ca7",
    "name": "Punch Bowl Social",
    "slug": "punch-bowl-social",
    "city": "Denver",
    "state": "CO",
    "neighborhood": "Baker",
    "address": "65 Broadway",
    "lat": 39.7392,
    "lng": -104.9903,
    "cuisine": "Games / Restaurant",
    "cuisineTags": [
      "Games",
      "Restaurant"
    ],
    "vibeTags": [
      "cocktails"
    ],
    "occasionTags": [
      "group-night-out",
      "guys-night"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Bowling, karaoke, arcade, and cocktails under one roof",
    "sourceCredit": "TikTok"
  },
  {
    "id": "28becf81-42d3-3ea9-2cf7-5634469365cc",
    "name": "Terminal Bar",
    "slug": "terminal-bar",
    "city": "Denver",
    "state": "CO",
    "neighborhood": "Union Station",
    "address": "1701 Wynkoop St",
    "lat": 39.7392,
    "lng": -104.9903,
    "cuisine": "Craft Cocktails",
    "cuisineTags": [
      "Craft Cocktails"
    ],
    "vibeTags": [
      "cocktails"
    ],
    "occasionTags": [
      "group-night-out"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Beautiful bar inside Union Station with inventive cocktails and bustling vibe",
    "sourceCredit": "Instagram"
  },
  {
    "id": "d80e3e50-5b47-fbe2-a4e5-3a3fba9b38ed",
    "name": "Guard and Grace",
    "slug": "guard-and-grace",
    "city": "Denver",
    "state": "CO",
    "neighborhood": "Downtown",
    "address": "1801 California St",
    "lat": 39.7392,
    "lng": -104.9903,
    "cuisine": "Steakhouse",
    "cuisineTags": [
      "Steakhouse"
    ],
    "vibeTags": [],
    "occasionTags": [
      "in-laws"
    ],
    "price": "$$$$",
    "priceLevel": 4,
    "vibeNotes": "Troy Guard's signature steakhouse; dry-aged cuts, stunning interior",
    "sourceCredit": "TikTok"
  },
  {
    "id": "c651a143-fcbc-f528-2168-f90180bdf12f",
    "name": "Fruition",
    "slug": "fruition",
    "city": "Denver",
    "state": "CO",
    "neighborhood": "Capitol Hill",
    "address": "1313 E 6th Ave",
    "lat": 39.7392,
    "lng": -104.9903,
    "cuisine": "Farm-to-Table",
    "cuisineTags": [
      "Farm-to-Table"
    ],
    "vibeTags": [
      "intimate"
    ],
    "occasionTags": [
      "in-laws"
    ],
    "price": "$$$$",
    "priceLevel": 4,
    "vibeNotes": "James Beard semifinalist; intimate farmhouse-to-table in a bungalow",
    "sourceCredit": "Instagram"
  },
  {
    "id": "172d080c-d536-ab8e-a8d9-f304af380036",
    "name": "The Capital Grille",
    "slug": "the-capital-grille",
    "city": "Denver",
    "state": "CO",
    "neighborhood": "Downtown",
    "address": "1450 Larimer St",
    "lat": 39.7392,
    "lng": -104.9903,
    "cuisine": "Steakhouse",
    "cuisineTags": [
      "Steakhouse"
    ],
    "vibeTags": [],
    "occasionTags": [
      "in-laws"
    ],
    "price": "$$$$",
    "priceLevel": 4,
    "vibeNotes": "Reliable classic steakhouse that impresses every generation",
    "sourceCredit": "TikTok"
  },
  {
    "id": "bd0e9d87-62e6-ac46-93bb-5d0f500252f5",
    "name": "Stoic & Genuine",
    "slug": "stoic-genuine",
    "city": "Denver",
    "state": "CO",
    "neighborhood": "LoDo",
    "address": "1701 Wynkoop St",
    "lat": 39.7392,
    "lng": -104.9903,
    "cuisine": "Seafood",
    "cuisineTags": [
      "Seafood"
    ],
    "vibeTags": [
      "cocktails"
    ],
    "occasionTags": [
      "in-laws"
    ],
    "price": "$$$",
    "priceLevel": 3,
    "vibeNotes": "Fresh seafood inside Union Station; oyster bar and craft cocktails",
    "sourceCredit": "Instagram"
  },
  {
    "id": "494accc8-3a92-dd30-39b9-8ae387f5257c",
    "name": "Rioja",
    "slug": "rioja",
    "city": "Denver",
    "state": "CO",
    "neighborhood": "Larimer Square",
    "address": "1431 Larimer St",
    "lat": 39.7392,
    "lng": -104.9903,
    "cuisine": "Mediterranean",
    "cuisineTags": [
      "Mediterranean"
    ],
    "vibeTags": [],
    "occasionTags": [
      "in-laws"
    ],
    "price": "$$$",
    "priceLevel": 3,
    "vibeNotes": "Jennifer Jasinski's Mediterranean gem on Larimer Square; award-winning",
    "sourceCredit": "TikTok"
  },
  {
    "id": "40521e69-46b8-871f-6966-7c972c8878f6",
    "name": "Urban Farmer",
    "slug": "urban-farmer",
    "city": "Denver",
    "state": "CO",
    "neighborhood": "LoDo",
    "address": "1659 Wazee St",
    "lat": 39.7392,
    "lng": -104.9903,
    "cuisine": "Steakhouse / Local",
    "cuisineTags": [
      "Steakhouse",
      "Local"
    ],
    "vibeTags": [],
    "occasionTags": [
      "in-laws"
    ],
    "price": "$$$",
    "priceLevel": 3,
    "vibeNotes": "Local-sourced steakhouse with a modern farmhouse aesthetic",
    "sourceCredit": "Instagram"
  },
  {
    "id": "4eb48e56-8b21-a6b8-4a26-1e3234fa6dbf",
    "name": "Frasca Food & Wine",
    "slug": "frasca-food-wine",
    "city": "Denver",
    "state": "CO",
    "neighborhood": "Boulder",
    "address": "1738 Pearl St",
    "lat": 39.7392,
    "lng": -104.9903,
    "cuisine": "Italian / Wine",
    "cuisineTags": [
      "Italian",
      "Wine"
    ],
    "vibeTags": [
      "wine"
    ],
    "occasionTags": [
      "in-laws"
    ],
    "price": "$$$$",
    "priceLevel": 4,
    "vibeNotes": "Worth the drive to Boulder; Friulian-inspired Italian, James Beard Award winner",
    "sourceCredit": "TikTok"
  },
  {
    "id": "b04b1870-e3ce-c50f-a851-1e5b51a63f2a",
    "name": "Death & Co",
    "slug": "death-co",
    "city": "Denver",
    "state": "CO",
    "neighborhood": "RiNo",
    "address": "1280 25th St",
    "lat": 39.7392,
    "lng": -104.9903,
    "cuisine": "Cocktail Bar",
    "cuisineTags": [
      "Cocktail Bar"
    ],
    "vibeTags": [
      "cocktails"
    ],
    "occasionTags": [
      "girls-night"
    ],
    "price": "$$$",
    "priceLevel": 3,
    "vibeNotes": "NYC's legendary cocktail bar's Denver outpost; gorgeous space, incredible drinks",
    "sourceCredit": "TikTok"
  },
  {
    "id": "97be29aa-b226-76a3-44b2-1a9f8881c899",
    "name": "Invisible City",
    "slug": "invisible-city",
    "city": "Denver",
    "state": "CO",
    "neighborhood": "Congress Park",
    "address": "3100 E Colfax Ave",
    "lat": 39.7392,
    "lng": -104.9903,
    "cuisine": "Cocktail Bar / Tiki",
    "cuisineTags": [
      "Cocktail Bar",
      "Tiki"
    ],
    "vibeTags": [
      "cocktails"
    ],
    "occasionTags": [
      "girls-night"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Tiki-meets-vintage bar with creative cocktails and a retro vibe",
    "sourceCredit": "Instagram"
  },
  {
    "id": "c9853cf1-1ad3-1664-3258-920159de40a6",
    "name": "The Bindery",
    "slug": "the-bindery",
    "city": "Denver",
    "state": "CO",
    "neighborhood": "LoHi",
    "address": "1817 Central St",
    "lat": 39.7392,
    "lng": -104.9903,
    "cuisine": "Bakery / Wine Bar",
    "cuisineTags": [
      "Bakery",
      "Wine Bar"
    ],
    "vibeTags": [
      "wine",
      "late-night"
    ],
    "occasionTags": [
      "girls-night"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Morning pastries, evening wine bar with small plates; versatile and cute",
    "sourceCredit": "TikTok"
  },
  {
    "id": "4294daa0-3cfd-4105-8119-b4e40aba3cdc",
    "name": "Pinot's Palette",
    "slug": "pinot-s-palette",
    "city": "Denver",
    "state": "CO",
    "neighborhood": "Various",
    "address": "Multiple Locations",
    "lat": 39.7392,
    "lng": -104.9903,
    "cuisine": "Paint & Sip",
    "cuisineTags": [
      "Paint & Sip"
    ],
    "vibeTags": [
      "wine"
    ],
    "occasionTags": [
      "girls-night"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Guided painting classes with wine; multiple Denver locations",
    "sourceCredit": "Instagram"
  },
  {
    "id": "80ad1488-b9a2-1bc9-18ef-99e220b3cbaa",
    "name": "Williams & Graham",
    "slug": "williams-graham",
    "city": "Denver",
    "state": "CO",
    "neighborhood": "LoHi",
    "address": "3160 Tejon St",
    "lat": 39.7392,
    "lng": -104.9903,
    "cuisine": "Speakeasy",
    "cuisineTags": [
      "Speakeasy"
    ],
    "vibeTags": [
      "hidden-gem",
      "cocktails"
    ],
    "occasionTags": [
      "girls-night"
    ],
    "price": "$$$",
    "priceLevel": 3,
    "vibeNotes": "Hidden behind a bookshelf; one of America's best cocktail bars",
    "sourceCredit": "TikTok"
  },
  {
    "id": "62083047-fd52-0380-d773-4568a493e1aa",
    "name": "Ophelia's Electric Soapbox",
    "slug": "ophelia-s-electric-soapbox",
    "city": "Denver",
    "state": "CO",
    "neighborhood": "Colfax",
    "address": "1215 20th St",
    "lat": 39.7392,
    "lng": -104.9903,
    "cuisine": "Music / Restaurant",
    "cuisineTags": [
      "Music",
      "Restaurant"
    ],
    "vibeTags": [],
    "occasionTags": [
      "girls-night"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Former bathhouse turned music venue with dinner and live performances",
    "sourceCredit": "Instagram"
  },
  {
    "id": "60359faa-aaef-60b5-f9bd-a943fdcd596b",
    "name": "Beet Box Bakery",
    "slug": "beet-box-bakery",
    "city": "Denver",
    "state": "CO",
    "neighborhood": "Stanley Marketplace",
    "address": "2501 Dallas St",
    "lat": 39.7392,
    "lng": -104.9903,
    "cuisine": "Bakery / Caf\u00e9",
    "cuisineTags": [
      "Bakery",
      "Caf\u00e9"
    ],
    "vibeTags": [
      "instagrammable"
    ],
    "occasionTags": [
      "girls-night"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Instagram-worthy baked goods and lattes inside Stanley Marketplace",
    "sourceCredit": "TikTok"
  },
  {
    "id": "a437ff0b-d938-9766-ffdd-2b26c713148c",
    "name": "The Ramble Hotel",
    "slug": "the-ramble-hotel",
    "city": "Denver",
    "state": "CO",
    "neighborhood": "RiNo",
    "address": "1280 25th St",
    "lat": 39.7392,
    "lng": -104.9903,
    "cuisine": "Hotel Bar",
    "cuisineTags": [
      "Hotel Bar"
    ],
    "vibeTags": [
      "cocktails"
    ],
    "occasionTags": [
      "girls-night"
    ],
    "price": "$$$",
    "priceLevel": 3,
    "vibeNotes": "Stunning lobby bar with Death & Co cocktails; just showing up feels like an event",
    "sourceCredit": "Instagram"
  },
  {
    "id": "d99b09e8-e890-a789-0514-e76ae0cbfe50",
    "name": "Topgolf",
    "slug": "topgolf",
    "city": "Denver",
    "state": "CO",
    "neighborhood": "Thornton",
    "address": "14700 Delaware St",
    "lat": 39.7392,
    "lng": -104.9903,
    "cuisine": "Golf / Entertainment",
    "cuisineTags": [
      "Golf",
      "Entertainment"
    ],
    "vibeTags": [],
    "occasionTags": [
      "guys-night"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Multi-level driving range with full bar and competitive games",
    "sourceCredit": "TikTok"
  },
  {
    "id": "9ca28f73-1cf0-259a-2290-528aeabd8b4d",
    "name": "Coors Field",
    "slug": "coors-field",
    "city": "Denver",
    "state": "CO",
    "neighborhood": "LoDo",
    "address": "2001 Blake St",
    "lat": 39.7392,
    "lng": -104.9903,
    "cuisine": "Stadium / Bars",
    "cuisineTags": [
      "Stadium",
      "Bars"
    ],
    "vibeTags": [],
    "occasionTags": [
      "guys-night"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Rockies game + LoDo bar crawl afterwards; classic Denver night",
    "sourceCredit": "Instagram"
  },
  {
    "id": "4537ec76-0967-ef3c-4978-ff59931d133e",
    "name": "Great Divide Brewing",
    "slug": "great-divide-brewing",
    "city": "Denver",
    "state": "CO",
    "neighborhood": "RiNo",
    "address": "2201 Arapahoe St",
    "lat": 39.7392,
    "lng": -104.9903,
    "cuisine": "Brewery",
    "cuisineTags": [
      "Brewery"
    ],
    "vibeTags": [
      "iconic"
    ],
    "occasionTags": [
      "guys-night"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Iconic Denver brewery with Yeti Imperial Stout and a massive barrel bar",
    "sourceCredit": "TikTok"
  },
  {
    "id": "990d0687-3af7-5010-a152-df67fe06bcb5",
    "name": "Bad Daddy's Burger Bar",
    "slug": "bad-daddy-s-burger-bar",
    "city": "Denver",
    "state": "CO",
    "neighborhood": "Various",
    "address": "Multiple Locations",
    "lat": 39.7392,
    "lng": -104.9903,
    "cuisine": "Burgers / Beer",
    "cuisineTags": [
      "Burgers",
      "Beer"
    ],
    "vibeTags": [],
    "occasionTags": [
      "guys-night"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Creative burgers with local craft beer; solid pre-game spot",
    "sourceCredit": "Instagram"
  },
  {
    "id": "c000f14c-43ac-3e9e-8261-e01b6acd0e37",
    "name": "Denver Ax Lounge",
    "slug": "denver-ax-lounge",
    "city": "Denver",
    "state": "CO",
    "neighborhood": "RiNo",
    "address": "2520 Larimer St",
    "lat": 39.7392,
    "lng": -104.9903,
    "cuisine": "Axe Throwing / BYOB",
    "cuisineTags": [
      "Axe Throwing",
      "BYOB"
    ],
    "vibeTags": [],
    "occasionTags": [
      "guys-night"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "BYOB axe throwing in RiNo; tournaments and competitive league nights",
    "sourceCredit": "TikTok"
  },
  {
    "id": "ae9e4253-93eb-a3a1-34e6-18dbd66785d5",
    "name": "Ratio Beerworks",
    "slug": "ratio-beerworks",
    "city": "Denver",
    "state": "CO",
    "neighborhood": "RiNo",
    "address": "2920 Larimer St",
    "lat": 39.7392,
    "lng": -104.9903,
    "cuisine": "Brewery / Patio",
    "cuisineTags": [
      "Brewery",
      "Patio"
    ],
    "vibeTags": [
      "patio"
    ],
    "occasionTags": [
      "guys-night"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "RiNo brewery with excellent IPAs, food trucks, and a large patio",
    "sourceCredit": "TikTok"
  },
  {
    "id": "db7bbccb-71f8-a8ed-718d-51f1a534f1bd",
    "name": "Temple Nightclub",
    "slug": "temple-nightclub",
    "city": "Denver",
    "state": "CO",
    "neighborhood": "Downtown",
    "address": "1136 Broadway",
    "lat": 39.7392,
    "lng": -104.9903,
    "cuisine": "Nightclub",
    "cuisineTags": [
      "Nightclub"
    ],
    "vibeTags": [
      "dj"
    ],
    "occasionTags": [
      "bachelor"
    ],
    "price": "$$$",
    "priceLevel": 3,
    "vibeNotes": "Denver's premier nightclub; world-class DJs, VIP bottle service, massive",
    "sourceCredit": "TikTok"
  },
  {
    "id": "c34bf967-1fa2-7aa3-e162-be69fd3def25",
    "name": "LoDo Bar Crawl",
    "slug": "lodo-bar-crawl",
    "city": "Denver",
    "state": "CO",
    "neighborhood": "LoDo",
    "address": "Various",
    "lat": 39.7392,
    "lng": -104.9903,
    "cuisine": "Bar District",
    "cuisineTags": [
      "Bar District"
    ],
    "vibeTags": [],
    "occasionTags": [
      "bachelor"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Blake Street to Larimer; dozens of bars in walking distance",
    "sourceCredit": "Instagram"
  },
  {
    "id": "0f954309-f0a1-709f-b5f5-a568b2307181",
    "name": "Dierks Bentley's Whiskey Row",
    "slug": "dierks-bentley-s-whiskey-row",
    "city": "Denver",
    "state": "CO",
    "neighborhood": "Ballpark",
    "address": "1946 Market St",
    "lat": 39.7392,
    "lng": -104.9903,
    "cuisine": "Country Bar",
    "cuisineTags": [
      "Country Bar"
    ],
    "vibeTags": [
      "rooftop"
    ],
    "occasionTags": [
      "bachelor"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Three floors of country music, rooftop bar, and line dancing",
    "sourceCredit": "TikTok"
  },
  {
    "id": "6d45eb15-c0ff-aaf2-535c-85d224da88a4",
    "name": "Unser Karting & Events",
    "slug": "unser-karting-events",
    "city": "Denver",
    "state": "CO",
    "neighborhood": "Centennial",
    "address": "7300 E Arapahoe Rd",
    "lat": 39.7392,
    "lng": -104.9903,
    "cuisine": "Go-Karts",
    "cuisineTags": [
      "Go-Karts"
    ],
    "vibeTags": [],
    "occasionTags": [
      "bachelor"
    ],
    "price": "$$$",
    "priceLevel": 3,
    "vibeNotes": "Indoor go-kart racing at 45mph; competitive and adrenaline-pumping",
    "sourceCredit": "Instagram"
  },
  {
    "id": "acfe178c-e4b2-2ab3-a670-e44ae4b6f6df",
    "name": "Beta Event Center",
    "slug": "beta-event-center",
    "city": "Denver",
    "state": "CO",
    "neighborhood": "Downtown",
    "address": "1909 Blake St",
    "lat": 39.7392,
    "lng": -104.9903,
    "cuisine": "Nightclub / Events",
    "cuisineTags": [
      "Nightclub",
      "Events"
    ],
    "vibeTags": [
      "dj"
    ],
    "occasionTags": [
      "bachelor"
    ],
    "price": "$$$",
    "priceLevel": 3,
    "vibeNotes": "Industrial venue hosting top EDM/hip-hop DJs with immersive production",
    "sourceCredit": "TikTok"
  },
  {
    "id": "d54e0f8b-9d25-4ca6-7f6a-669585b52524",
    "name": "Mile High Spirits",
    "slug": "mile-high-spirits",
    "city": "Denver",
    "state": "CO",
    "neighborhood": "RiNo",
    "address": "2201 Lawrence St",
    "lat": 39.7392,
    "lng": -104.9903,
    "cuisine": "Distillery / Bar",
    "cuisineTags": [
      "Distillery",
      "Bar"
    ],
    "vibeTags": [
      "cocktails"
    ],
    "occasionTags": [
      "bachelor"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Craft distillery with tours, tastings, and a cocktail bar; unique start",
    "sourceCredit": "Instagram"
  },
  {
    "id": "c8ad3436-1c8b-45aa-af64-0fb446f80908",
    "name": "Red Rocks Amphitheatre",
    "slug": "red-rocks-amphitheatre",
    "city": "Denver",
    "state": "CO",
    "neighborhood": "Morrison",
    "address": "18300 W Alameda Pkwy",
    "lat": 39.7392,
    "lng": -104.9903,
    "cuisine": "Concert Venue / Hiking",
    "cuisineTags": [
      "Concert Venue",
      "Hiking"
    ],
    "vibeTags": [
      "iconic"
    ],
    "occasionTags": [
      "outdoor-adventure"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Iconic venue for concerts + daytime hiking and stairs workout",
    "sourceCredit": "TikTok"
  },
  {
    "id": "63ef3187-ae7e-09fa-db57-dba45557dcb8",
    "name": "RiNo Art District",
    "slug": "rino-art-district",
    "city": "Denver",
    "state": "CO",
    "neighborhood": "RiNo",
    "address": "River North Art District",
    "lat": 39.7392,
    "lng": -104.9903,
    "cuisine": "Street Art / Galleries",
    "cuisineTags": [
      "Street Art",
      "Galleries"
    ],
    "vibeTags": [],
    "occasionTags": [
      "outdoor-adventure"
    ],
    "price": "Free",
    "priceLevel": 1,
    "vibeNotes": "Murals, galleries, food trucks, and breweries in Denver's creative hub",
    "sourceCredit": "Instagram"
  },
  {
    "id": "a3b743d8-2ceb-817b-e458-52fa6b400856",
    "name": "Washington Park",
    "slug": "washington-park",
    "city": "Denver",
    "state": "CO",
    "neighborhood": "Wash Park",
    "address": "1001 S Downing St",
    "lat": 39.7392,
    "lng": -104.9903,
    "cuisine": "Park / Lake",
    "cuisineTags": [
      "Park",
      "Lake"
    ],
    "vibeTags": [],
    "occasionTags": [
      "outdoor-adventure"
    ],
    "price": "Free",
    "priceLevel": 1,
    "vibeNotes": "Two lakes, volleyball courts, running paths, and people-watching",
    "sourceCredit": "TikTok"
  },
  {
    "id": "c696edf3-b1ee-43fe-f9ed-49eba43576f4",
    "name": "Stanley Marketplace",
    "slug": "stanley-marketplace",
    "city": "Denver",
    "state": "CO",
    "neighborhood": "Stapleton",
    "address": "2501 Dallas St",
    "lat": 39.7392,
    "lng": -104.9903,
    "cuisine": "Food Hall / Market",
    "cuisineTags": [
      "Food Hall",
      "Market"
    ],
    "vibeTags": [],
    "occasionTags": [
      "outdoor-adventure"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "50+ shops and restaurants in a converted aviation hangar",
    "sourceCredit": "Instagram"
  },
  {
    "id": "2bb2a1e3-068f-a9a3-8973-9f989ede7050",
    "name": "Meow Wolf",
    "slug": "meow-wolf",
    "city": "Denver",
    "state": "CO",
    "neighborhood": "Denver",
    "address": "1338 1st St",
    "lat": 39.7392,
    "lng": -104.9903,
    "cuisine": "Immersive Art",
    "cuisineTags": [
      "Immersive Art"
    ],
    "vibeTags": [],
    "occasionTags": [
      "outdoor-adventure"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Mind-bending immersive art experience; crawl through portals and other dimensions",
    "sourceCredit": "TikTok"
  },
  {
    "id": "5d002b64-410b-a84f-6761-f1af72a1385d",
    "name": "Union Station",
    "slug": "union-station",
    "city": "Denver",
    "state": "CO",
    "neighborhood": "LoDo",
    "address": "1701 Wynkoop St",
    "lat": 39.7392,
    "lng": -104.9903,
    "cuisine": "Food Hall / Shopping",
    "cuisineTags": [
      "Food Hall",
      "Shopping"
    ],
    "vibeTags": [],
    "occasionTags": [
      "outdoor-adventure"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Denver's gorgeous train station with restaurants, bars, and local shops",
    "sourceCredit": "Instagram"
  },
  {
    "id": "3e6485e9-3265-6ea8-5224-c4d61a2558ba",
    "name": "Del Mar",
    "slug": "del-mar",
    "city": "Fort Lauderdale",
    "state": "FL",
    "neighborhood": "Fort Lauderdale Beach",
    "address": "999 N Fort Lauderdale Beach Blvd",
    "lat": 26.1224,
    "lng": -80.1373,
    "cuisine": "Seafood",
    "cuisineTags": [
      "Seafood"
    ],
    "vibeTags": [
      "viral"
    ],
    "occasionTags": [
      "date-night",
      "family"
    ],
    "price": "$$$$",
    "priceLevel": 4,
    "vibeNotes": "16.6K TikTok likes; just opened; oceanfront fine dining",
    "sourceCredit": "TikTok @thebrowardscene"
  },
  {
    "id": "5c9a0758-afc9-31df-2557-3bf904912826",
    "name": "TIMBR",
    "slug": "timbr",
    "city": "Fort Lauderdale",
    "state": "FL",
    "neighborhood": "Fort Lauderdale",
    "address": "817 NE 2nd Ave",
    "lat": 26.1224,
    "lng": -80.1373,
    "cuisine": "New American",
    "cuisineTags": [
      "New American"
    ],
    "vibeTags": [
      "instagrammable"
    ],
    "occasionTags": [
      "date-night",
      "girls-night"
    ],
    "price": "$$$$",
    "priceLevel": 4,
    "vibeNotes": "50K flowers under glass pyramid; most beautiful restaurant in FL",
    "sourceCredit": "Resy / Eater"
  },
  {
    "id": "2d5d092f-54a1-1242-3a01-2558572d3dfc",
    "name": "Cucina Moderna",
    "slug": "cucina-moderna",
    "city": "Fort Lauderdale",
    "state": "FL",
    "neighborhood": "Las Olas",
    "address": "600 E Las Olas Blvd",
    "lat": 26.1224,
    "lng": -80.1373,
    "cuisine": "Italian",
    "cuisineTags": [
      "Italian"
    ],
    "vibeTags": [
      "upscale",
      "viral"
    ],
    "occasionTags": [
      "date-night"
    ],
    "price": "$$$$",
    "priceLevel": 4,
    "vibeNotes": "New upscale Italian; TikTok-famous; handmade pasta",
    "sourceCredit": "TikTok @cesarslists"
  },
  {
    "id": "5e4b5eb4-7fbb-8249-beb9-aeb9e463aa48",
    "name": "Catch & Cut",
    "slug": "catch-cut",
    "city": "Fort Lauderdale",
    "state": "FL",
    "neighborhood": "Fort Lauderdale Beach",
    "address": "321 N Fort Lauderdale Beach Blvd",
    "lat": 26.1224,
    "lng": -80.1373,
    "cuisine": "Seafood-Steak",
    "cuisineTags": [
      "Seafood-Steak"
    ],
    "vibeTags": [
      "romantic",
      "dj",
      "wine"
    ],
    "occasionTags": [
      "date-night"
    ],
    "price": "$$$$",
    "priceLevel": 4,
    "vibeNotes": "Beach-adjacent surf & turf; great wine list; romantic lighting",
    "sourceCredit": "Eater South FL"
  },
  {
    "id": "ed492f39-cc17-048d-9ff6-7d7e932a4a3b",
    "name": "Wild Sea",
    "slug": "wild-sea",
    "city": "Fort Lauderdale",
    "state": "FL",
    "neighborhood": "Las Olas",
    "address": "620 E Las Olas Blvd",
    "lat": 26.1224,
    "lng": -80.1373,
    "cuisine": "Oyster Bar-Seafood",
    "cuisineTags": [
      "Oyster Bar-Seafood"
    ],
    "vibeTags": [
      "cocktails",
      "late-night"
    ],
    "occasionTags": [
      "date-night",
      "girls-night"
    ],
    "price": "$$$",
    "priceLevel": 3,
    "vibeNotes": "Las Olas seafood gem; raw bar + cocktails; coastal date vibes",
    "sourceCredit": "Eater South FL"
  },
  {
    "id": "3e8b4643-b70c-31df-5e47-2f95c46974b8",
    "name": "Louie Bossi's",
    "slug": "louie-bossi-s",
    "city": "Fort Lauderdale",
    "state": "FL",
    "neighborhood": "Las Olas",
    "address": "100 E Las Olas Blvd",
    "lat": 26.1224,
    "lng": -80.1373,
    "cuisine": "Italian",
    "cuisineTags": [
      "Italian"
    ],
    "vibeTags": [
      "patio",
      "cocktails"
    ],
    "occasionTags": [
      "date-night",
      "girls-night"
    ],
    "price": "$$$",
    "priceLevel": 3,
    "vibeNotes": "Las Olas anchor; wood-fired pizza; gorgeous patio",
    "sourceCredit": "Infatuation"
  },
  {
    "id": "debb702e-3c7b-3381-0e20-6fb2d904869f",
    "name": "Valentino Cucina Italiana",
    "slug": "valentino-cucina-italiana",
    "city": "Fort Lauderdale",
    "state": "FL",
    "neighborhood": "Las Olas",
    "address": "620 E Las Olas Blvd",
    "lat": 26.1224,
    "lng": -80.1373,
    "cuisine": "Italian",
    "cuisineTags": [
      "Italian"
    ],
    "vibeTags": [
      "elegant"
    ],
    "occasionTags": [
      "date-night"
    ],
    "price": "$$$$",
    "priceLevel": 4,
    "vibeNotes": "High-end Italian; tasting menus; elegant space",
    "sourceCredit": "Resy"
  },
  {
    "id": "cab331c6-63a4-748f-335f-a845cda63d3e",
    "name": "Steak 954",
    "slug": "steak-954",
    "city": "Fort Lauderdale",
    "state": "FL",
    "neighborhood": "Fort Lauderdale Beach",
    "address": "401 N Fort Lauderdale Beach Blvd",
    "lat": 26.1224,
    "lng": -80.1373,
    "cuisine": "Steakhouse",
    "cuisineTags": [
      "Steakhouse"
    ],
    "vibeTags": [
      "upscale",
      "cocktails"
    ],
    "occasionTags": [
      "date-night",
      "guys-night"
    ],
    "price": "$$$$",
    "priceLevel": 4,
    "vibeNotes": "W Hotel steakhouse; ocean views; upscale beachside",
    "sourceCredit": "Eater South FL"
  },
  {
    "id": "8fecc0e5-d0ff-23b9-0846-6162ebd7d589",
    "name": "YOLO",
    "slug": "yolo",
    "city": "Fort Lauderdale",
    "state": "FL",
    "neighborhood": "Las Olas",
    "address": "333 E Las Olas Blvd",
    "lat": 26.1224,
    "lng": -80.1373,
    "cuisine": "American-Nightlife",
    "cuisineTags": [
      "American-Nightlife"
    ],
    "vibeTags": [
      "dj",
      "viral",
      "late-night"
    ],
    "occasionTags": [
      "group-night-out",
      "girls-night",
      "bachelor"
    ],
    "price": "$$$",
    "priceLevel": 3,
    "vibeNotes": "Las Olas hotspot; TikTok famous; DJ after dinner; bottle service",
    "sourceCredit": "TikTok @cesarslists"
  },
  {
    "id": "c1eb6bc0-af43-a4d1-9e35-1e003b303fc5",
    "name": "SWAY",
    "slug": "sway",
    "city": "Fort Lauderdale",
    "state": "FL",
    "neighborhood": "Fort Lauderdale",
    "address": "111 SW 2nd Ave",
    "lat": 26.1224,
    "lng": -80.1373,
    "cuisine": "Nightclub",
    "cuisineTags": [
      "Nightclub"
    ],
    "vibeTags": [],
    "occasionTags": [
      "group-night-out",
      "guys-night",
      "bachelor"
    ],
    "price": "$$$",
    "priceLevel": 3,
    "vibeNotes": "14,000 sq ft nightclub; production-level sound + lights",
    "sourceCredit": "TimeOut"
  },
  {
    "id": "55359dd7-05ef-1b5a-de4f-fe2dc6506b94",
    "name": "O Lounge",
    "slug": "o-lounge",
    "city": "Fort Lauderdale",
    "state": "FL",
    "neighborhood": "Las Olas",
    "address": "1 W Las Olas Blvd",
    "lat": 26.1224,
    "lng": -80.1373,
    "cuisine": "Lounge-Nightlife",
    "cuisineTags": [
      "Lounge-Nightlife"
    ],
    "vibeTags": [
      "dj"
    ],
    "occasionTags": [
      "group-night-out",
      "bachelor"
    ],
    "price": "$$$",
    "priceLevel": 3,
    "vibeNotes": "Las Olas lounge; DJs; VIP sections; stylish crowd",
    "sourceCredit": "Eater South FL"
  },
  {
    "id": "21792aa6-eefc-c9ed-0193-8649294675e6",
    "name": "Rhythm + Vine",
    "slug": "rhythm-vine",
    "city": "Fort Lauderdale",
    "state": "FL",
    "neighborhood": "Fort Lauderdale",
    "address": "1700 NE 2nd Ave",
    "lat": 26.1224,
    "lng": -80.1373,
    "cuisine": "Open-Air Bar",
    "cuisineTags": [
      "Open-Air Bar"
    ],
    "vibeTags": [
      "outdoor",
      "live-music"
    ],
    "occasionTags": [
      "group-night-out",
      "bachelor"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Outdoor bar; food trucks; live music; young crowd",
    "sourceCredit": "TimeOut"
  },
  {
    "id": "e184e04e-7062-f96e-e3f8-b1e61904958a",
    "name": "Takato",
    "slug": "takato",
    "city": "Fort Lauderdale",
    "state": "FL",
    "neighborhood": "Flagler Village",
    "address": "700 NE 2nd St",
    "lat": 26.1224,
    "lng": -80.1373,
    "cuisine": "Japanese-Peruvian",
    "cuisineTags": [
      "Japanese-Peruvian"
    ],
    "vibeTags": [
      "cocktails"
    ],
    "occasionTags": [
      "group-night-out"
    ],
    "price": "$$$",
    "priceLevel": 3,
    "vibeNotes": "Nikkei fusion; inventive cocktails; group-friendly platters",
    "sourceCredit": "TikTok @cesarslists"
  },
  {
    "id": "94f9f1e8-511b-15c3-7dc4-1b36a937c4cc",
    "name": "Trulucks",
    "slug": "trulucks",
    "city": "Fort Lauderdale",
    "state": "FL",
    "neighborhood": "Fort Lauderdale",
    "address": "2584 E Sunrise Blvd",
    "lat": 26.1224,
    "lng": -80.1373,
    "cuisine": "Seafood-Steakhouse",
    "cuisineTags": [
      "Seafood-Steakhouse"
    ],
    "vibeTags": [
      "upscale"
    ],
    "occasionTags": [
      "group-night-out",
      "guys-night"
    ],
    "price": "$$$$",
    "priceLevel": 4,
    "vibeNotes": "Upscale chain; stone crab; great group atmosphere",
    "sourceCredit": "TikTok @cesarslists"
  },
  {
    "id": "c871ccb4-1228-2a5e-033e-53a4033cd556",
    "name": "American Social",
    "slug": "american-social",
    "city": "Fort Lauderdale",
    "state": "FL",
    "neighborhood": "Las Olas",
    "address": "721 E Las Olas Blvd",
    "lat": 26.1224,
    "lng": -80.1373,
    "cuisine": "Sports Bar-Lounge",
    "cuisineTags": [
      "Sports Bar-Lounge"
    ],
    "vibeTags": [
      "upscale",
      "waterfront",
      "patio"
    ],
    "occasionTags": [
      "group-night-out",
      "guys-night"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Waterfront patio; big screens; upscale bar food",
    "sourceCredit": "Infatuation"
  },
  {
    "id": "b73ef9a5-ea85-33cf-8909-188330525ae1",
    "name": "Laser Wolf",
    "slug": "laser-wolf",
    "city": "Fort Lauderdale",
    "state": "FL",
    "neighborhood": "Fort Lauderdale",
    "address": "310 NW 3rd Ave",
    "lat": 26.1224,
    "lng": -80.1373,
    "cuisine": "Israeli-Grill",
    "cuisineTags": [
      "Israeli-Grill"
    ],
    "vibeTags": [],
    "occasionTags": [
      "group-night-out",
      "guys-night"
    ],
    "price": "$$$",
    "priceLevel": 3,
    "vibeNotes": "Michael Solomonov; wood-fired grill; communal energy",
    "sourceCredit": "Eater South FL"
  },
  {
    "id": "7dd6dd40-4ac6-0caf-ddf7-6d4251c9dcde",
    "name": "Timpano",
    "slug": "timpano",
    "city": "Fort Lauderdale",
    "state": "FL",
    "neighborhood": "Fort Lauderdale",
    "address": "450 E Las Olas Blvd",
    "lat": 26.1224,
    "lng": -80.1373,
    "cuisine": "Italian",
    "cuisineTags": [
      "Italian"
    ],
    "vibeTags": [
      "upscale"
    ],
    "occasionTags": [
      "family"
    ],
    "price": "$$$",
    "priceLevel": 3,
    "vibeNotes": "Classic upscale Italian; white tablecloths; singing waiters",
    "sourceCredit": "Eater South FL"
  },
  {
    "id": "557bf230-2c79-a41c-1ff0-b0299e568407",
    "name": "Casa D'Angelo",
    "slug": "casa-d-angelo",
    "city": "Fort Lauderdale",
    "state": "FL",
    "neighborhood": "Fort Lauderdale",
    "address": "1201 N Federal Hwy",
    "lat": 26.1224,
    "lng": -80.1373,
    "cuisine": "Italian",
    "cuisineTags": [
      "Italian"
    ],
    "vibeTags": [],
    "occasionTags": [
      "family"
    ],
    "price": "$$$$",
    "priceLevel": 4,
    "vibeNotes": "Old-world Italian fine dining; 25+ years; family favorite",
    "sourceCredit": "Resy"
  },
  {
    "id": "2cb66916-f598-5b51-9796-a729059e0c3f",
    "name": "The Capital Grille",
    "slug": "the-capital-grille",
    "city": "Fort Lauderdale",
    "state": "FL",
    "neighborhood": "Fort Lauderdale",
    "address": "2430 E Sunrise Blvd",
    "lat": 26.1224,
    "lng": -80.1373,
    "cuisine": "Steakhouse",
    "cuisineTags": [
      "Steakhouse"
    ],
    "vibeTags": [
      "upscale",
      "wine"
    ],
    "occasionTags": [
      "family"
    ],
    "price": "$$$$",
    "priceLevel": 4,
    "vibeNotes": "Reliable upscale steakhouse; great wine; professional service",
    "sourceCredit": "Classic"
  },
  {
    "id": "ef063d2e-17fe-6848-6634-5f9b02242596",
    "name": "Canyon Southwest",
    "slug": "canyon-southwest",
    "city": "Fort Lauderdale",
    "state": "FL",
    "neighborhood": "Fort Lauderdale",
    "address": "1818 E Sunrise Blvd",
    "lat": 26.1224,
    "lng": -80.1373,
    "cuisine": "Southwestern",
    "cuisineTags": [
      "Southwestern"
    ],
    "vibeTags": [],
    "occasionTags": [
      "family"
    ],
    "price": "$$$",
    "priceLevel": 3,
    "vibeNotes": "Creative Southwestern; unique setting; 30-year neighborhood gem",
    "sourceCredit": "Eater South FL"
  },
  {
    "id": "7e965a13-7d26-dffb-baa0-8425bbd36e02",
    "name": "Coconuts by the Water",
    "slug": "coconuts-by-the-water",
    "city": "Fort Lauderdale",
    "state": "FL",
    "neighborhood": "Fort Lauderdale",
    "address": "429 Seabreeze Blvd",
    "lat": 26.1224,
    "lng": -80.1373,
    "cuisine": "Seafood-Waterfront",
    "cuisineTags": [
      "Seafood-Waterfront"
    ],
    "vibeTags": [
      "waterfront"
    ],
    "occasionTags": [
      "family"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Casual waterfront seafood; boat-watching; family friendly",
    "sourceCredit": "Visit Fort Lauderdale"
  },
  {
    "id": "8ddadea3-55cf-f3ee-d7f9-d7de30900a4a",
    "name": "3030 Ocean",
    "slug": "3030-ocean",
    "city": "Fort Lauderdale",
    "state": "FL",
    "neighborhood": "Fort Lauderdale Beach",
    "address": "3030 Holiday Dr",
    "lat": 26.1224,
    "lng": -80.1373,
    "cuisine": "Seafood",
    "cuisineTags": [
      "Seafood"
    ],
    "vibeTags": [],
    "occasionTags": [
      "family"
    ],
    "price": "$$$$",
    "priceLevel": 4,
    "vibeNotes": "Marriott Harbor Beach; ocean view fine dining; seasonal catch",
    "sourceCredit": "Eater South FL"
  },
  {
    "id": "edc4da6f-9130-d67e-4f7b-135b712fe72e",
    "name": "Just Spoons Cafe",
    "slug": "just-spoons-cafe",
    "city": "Fort Lauderdale",
    "state": "FL",
    "neighborhood": "Fort Lauderdale",
    "address": "1001 NE 2nd St",
    "lat": 26.1224,
    "lng": -80.1373,
    "cuisine": "Brunch-Cafe",
    "cuisineTags": [
      "Brunch-Cafe"
    ],
    "vibeTags": [
      "trendy",
      "viral",
      "brunch"
    ],
    "occasionTags": [
      "family"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Trendy brunch; TikTok viral; avocado toast perfection",
    "sourceCredit": "TikTok @cesarslists"
  },
  {
    "id": "1aabaa08-be56-d76a-2654-3743cb5b496e",
    "name": "Etaru",
    "slug": "etaru",
    "city": "Fort Lauderdale",
    "state": "FL",
    "neighborhood": "Hallandale Beach",
    "address": "2450 Park Pl",
    "lat": 26.1224,
    "lng": -80.1373,
    "cuisine": "Japanese",
    "cuisineTags": [
      "Japanese"
    ],
    "vibeTags": [],
    "occasionTags": [
      "girls-night"
    ],
    "price": "$$$",
    "priceLevel": 3,
    "vibeNotes": "Japanese robata; Village at Gulfstream; chic date spot",
    "sourceCredit": "Eater South FL"
  },
  {
    "id": "9bb80f45-2d16-8b74-3cd9-03297bf9721a",
    "name": "Rok Brgr",
    "slug": "rok-brgr",
    "city": "Fort Lauderdale",
    "state": "FL",
    "neighborhood": "Las Olas",
    "address": "209 SW 2nd St",
    "lat": 26.1224,
    "lng": -80.1373,
    "cuisine": "Burgers-Cocktails",
    "cuisineTags": [
      "Burgers-Cocktails"
    ],
    "vibeTags": [
      "fun",
      "cocktails"
    ],
    "occasionTags": [
      "girls-night"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Craft burgers + fancy cocktails; fun casual energy",
    "sourceCredit": "Infatuation"
  },
  {
    "id": "c7ae7d6f-9639-e818-a98f-f66aa28a515e",
    "name": "Lona Cocina",
    "slug": "lona-cocina",
    "city": "Fort Lauderdale",
    "state": "FL",
    "neighborhood": "Fort Lauderdale Beach",
    "address": "321 N Fort Lauderdale Beach Blvd",
    "lat": 26.1224,
    "lng": -80.1373,
    "cuisine": "Mexican",
    "cuisineTags": [
      "Mexican"
    ],
    "vibeTags": [
      "upscale",
      "sunset"
    ],
    "occasionTags": [
      "girls-night"
    ],
    "price": "$$$",
    "priceLevel": 3,
    "vibeNotes": "Upscale Mexican; beachfront; margaritas; sunset views",
    "sourceCredit": "Eater South FL"
  },
  {
    "id": "204d2901-835d-175b-21ee-b4c462d9e356",
    "name": "Las Olas Strip",
    "slug": "las-olas-strip",
    "city": "Fort Lauderdale",
    "state": "FL",
    "neighborhood": "Las Olas",
    "address": "E Las Olas Blvd",
    "lat": 26.1224,
    "lng": -80.1373,
    "cuisine": "Bar Crawl",
    "cuisineTags": [
      "Bar Crawl"
    ],
    "vibeTags": [],
    "occasionTags": [
      "girls-night"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Walk Las Olas; bar hop; boutiques; nightlife",
    "sourceCredit": "Visit Fort Lauderdale"
  },
  {
    "id": "965f1a51-9ac3-9195-0f85-bbb1f5c64f1b",
    "name": "Riverside Market",
    "slug": "riverside-market",
    "city": "Fort Lauderdale",
    "state": "FL",
    "neighborhood": "Fort Lauderdale",
    "address": "608 SW 12th Ave",
    "lat": 26.1224,
    "lng": -80.1373,
    "cuisine": "Craft Beer-Burgers",
    "cuisineTags": [
      "Craft Beer-Burgers"
    ],
    "vibeTags": [],
    "occasionTags": [
      "guys-night"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "200+ craft beers; casual; riverside setting",
    "sourceCredit": "Eater South FL"
  },
  {
    "id": "5fdc3590-4dcb-2d01-01b7-2a81ce910816",
    "name": "Boatyard",
    "slug": "boatyard",
    "city": "Fort Lauderdale",
    "state": "FL",
    "neighborhood": "Fort Lauderdale",
    "address": "1555 SE 17th St",
    "lat": 26.1224,
    "lng": -80.1373,
    "cuisine": "Seafood-Marina",
    "cuisineTags": [
      "Seafood-Marina"
    ],
    "vibeTags": [
      "chill",
      "waterfront"
    ],
    "occasionTags": [
      "guys-night"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Waterfront tiki bar; dockside; fish + beer; chill",
    "sourceCredit": "Visit Fort Lauderdale"
  },
  {
    "id": "bfe4953a-f849-b5a3-6213-869c7f015b34",
    "name": "Vegas Fried Chicken",
    "slug": "vegas-fried-chicken",
    "city": "Fort Lauderdale",
    "state": "FL",
    "neighborhood": "Fort Lauderdale",
    "address": "1200 NE 4th Ave",
    "lat": 26.1224,
    "lng": -80.1373,
    "cuisine": "Fried Chicken-Late Night",
    "cuisineTags": [
      "Fried Chicken-Late Night"
    ],
    "vibeTags": [
      "late-night"
    ],
    "occasionTags": [
      "guys-night"
    ],
    "price": "$",
    "priceLevel": 1,
    "vibeNotes": "Late-night fried chicken; comfort after partying",
    "sourceCredit": "Eater South FL"
  },
  {
    "id": "18ad64b5-3765-0cc9-d104-2c525a917603",
    "name": "Seminole Hard Rock",
    "slug": "seminole-hard-rock",
    "city": "Fort Lauderdale",
    "state": "FL",
    "neighborhood": "Hollywood",
    "address": "1 Seminole Way",
    "lat": 26.1224,
    "lng": -80.1373,
    "cuisine": "Casino-Resort",
    "cuisineTags": [
      "Casino-Resort"
    ],
    "vibeTags": [],
    "occasionTags": [
      "bachelor"
    ],
    "price": "$$$$",
    "priceLevel": 4,
    "vibeNotes": "Guitar Hotel; casino; pool; clubs; full bachelor destination",
    "sourceCredit": "Hard Rock"
  },
  {
    "id": "6571392f-f4d5-8aa6-96de-6c9ac2b7cc45",
    "name": "Deep Sea Fishing Charter",
    "slug": "deep-sea-fishing-charter",
    "city": "Fort Lauderdale",
    "state": "FL",
    "neighborhood": "Bahia Mar",
    "address": "801 Seabreeze Blvd",
    "lat": 26.1224,
    "lng": -80.1373,
    "cuisine": "Fishing",
    "cuisineTags": [
      "Fishing"
    ],
    "vibeTags": [],
    "occasionTags": [
      "bachelor"
    ],
    "price": "$$$",
    "priceLevel": 3,
    "vibeNotes": "Half-day offshore; mahi + sailfish; group charter",
    "sourceCredit": "Visit Fort Lauderdale"
  },
  {
    "id": "9ff4824e-082c-8a6c-828b-8537d024f254",
    "name": "Las Olas Bar Crawl",
    "slug": "las-olas-bar-crawl",
    "city": "Fort Lauderdale",
    "state": "FL",
    "neighborhood": "Las Olas",
    "address": "E Las Olas Blvd",
    "lat": 26.1224,
    "lng": -80.1373,
    "cuisine": "Bar Crawl",
    "cuisineTags": [
      "Bar Crawl"
    ],
    "vibeTags": [],
    "occasionTags": [
      "bachelor"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Walk the strip; 15+ bars in walking distance",
    "sourceCredit": "Visit Fort Lauderdale"
  },
  {
    "id": "07646599-fa05-5719-0b62-dd91593d3f19",
    "name": "InterContinental Pool",
    "slug": "intercontinental-pool",
    "city": "Fort Lauderdale",
    "state": "FL",
    "neighborhood": "Fort Lauderdale",
    "address": "505 N Fort Lauderdale Beach Blvd",
    "lat": 26.1224,
    "lng": -80.1373,
    "cuisine": "Pool Party",
    "cuisineTags": [
      "Pool Party"
    ],
    "vibeTags": [
      "rooftop"
    ],
    "occasionTags": [
      "bachelor"
    ],
    "price": "$$$",
    "priceLevel": 3,
    "vibeNotes": "Rooftop pool; beach views; day-party vibes",
    "sourceCredit": "Eater South FL"
  },
  {
    "id": "98a2b2d0-a97e-6a89-5941-c529ecd44287",
    "name": "Fort Lauderdale Beach",
    "slug": "fort-lauderdale-beach",
    "city": "Fort Lauderdale",
    "state": "FL",
    "neighborhood": "Beach",
    "address": "A1A",
    "lat": 26.1224,
    "lng": -80.1373,
    "cuisine": "Beach",
    "cuisineTags": [
      "Beach"
    ],
    "vibeTags": [
      "iconic"
    ],
    "occasionTags": [
      "outdoor-adventure"
    ],
    "price": "Free",
    "priceLevel": 1,
    "vibeNotes": "Miles of sand; volleyball; watersports; iconic boardwalk",
    "sourceCredit": "Visit Fort Lauderdale"
  },
  {
    "id": "45076b0f-1a29-f635-4bdb-fb44e11d36b8",
    "name": "Riverwalk Fort Lauderdale",
    "slug": "riverwalk-fort-lauderdale",
    "city": "Fort Lauderdale",
    "state": "FL",
    "neighborhood": "Downtown",
    "address": "SW 5th Ave to NE 2nd St",
    "lat": 26.1224,
    "lng": -80.1373,
    "cuisine": "Park-Waterfront",
    "cuisineTags": [
      "Park-Waterfront"
    ],
    "vibeTags": [
      "waterfront"
    ],
    "occasionTags": [
      "outdoor-adventure"
    ],
    "price": "Free",
    "priceLevel": 1,
    "vibeNotes": "Mile-long riverfront; arts; events; free water taxi",
    "sourceCredit": "Visit Fort Lauderdale"
  },
  {
    "id": "017249f9-46cb-8339-80db-30ba74231f70",
    "name": "Hugh Taylor Birch State Park",
    "slug": "hugh-taylor-birch-state-park",
    "city": "Fort Lauderdale",
    "state": "FL",
    "neighborhood": "Beach",
    "address": "3109 E Sunrise Blvd",
    "lat": 26.1224,
    "lng": -80.1373,
    "cuisine": "State Park",
    "cuisineTags": [
      "State Park"
    ],
    "vibeTags": [],
    "occasionTags": [
      "outdoor-adventure"
    ],
    "price": "$",
    "priceLevel": 1,
    "vibeNotes": "Kayaking; trails; beach; urban nature escape",
    "sourceCredit": "FL State Parks"
  },
  {
    "id": "6e76cc68-d598-6ff7-9875-6dc2fddf6f3d",
    "name": "Everglades Holiday Park",
    "slug": "everglades-holiday-park",
    "city": "Fort Lauderdale",
    "state": "FL",
    "neighborhood": "West FTL",
    "address": "21940 Griffin Rd",
    "lat": 26.1224,
    "lng": -80.1373,
    "cuisine": "Airboat Tours",
    "cuisineTags": [
      "Airboat Tours"
    ],
    "vibeTags": [],
    "occasionTags": [
      "outdoor-adventure"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Airboat rides; gator shows; group-friendly day trip",
    "sourceCredit": "Visit Fort Lauderdale"
  },
  {
    "id": "45423bad-62cc-e10e-09c8-5c0c70fc81e8",
    "name": "Las Olas Oceanside Park",
    "slug": "las-olas-oceanside-park",
    "city": "Fort Lauderdale",
    "state": "FL",
    "neighborhood": "Beach",
    "address": "3000 E Las Olas Blvd",
    "lat": 26.1224,
    "lng": -80.1373,
    "cuisine": "Beach Park",
    "cuisineTags": [
      "Beach Park"
    ],
    "vibeTags": [],
    "occasionTags": [
      "outdoor-adventure"
    ],
    "price": "Free",
    "priceLevel": 1,
    "vibeNotes": "Beachfront park; volleyball; food trucks on weekends",
    "sourceCredit": "Visit Fort Lauderdale"
  },
  {
    "id": "1602b6c6-43ab-b020-96f2-ea8d452976eb",
    "name": "Sawgrass Recreation Park",
    "slug": "sawgrass-recreation-park",
    "city": "Fort Lauderdale",
    "state": "FL",
    "neighborhood": "Weston",
    "address": "1006 US-27",
    "lat": 26.1224,
    "lng": -80.1373,
    "cuisine": "Nature-Airboat",
    "cuisineTags": [
      "Nature-Airboat"
    ],
    "vibeTags": [],
    "occasionTags": [
      "outdoor-adventure"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Airboat tours; animal exhibits; everglades nature walk",
    "sourceCredit": "Visit Fort Lauderdale"
  },
  {
    "id": "2e57d9ea-ac2a-3fcd-305f-42fa306307f4",
    "name": "Water Taxi",
    "slug": "water-taxi",
    "city": "Fort Lauderdale",
    "state": "FL",
    "neighborhood": "Intracoastal",
    "address": "Multiple Stops",
    "lat": 26.1224,
    "lng": -80.1373,
    "cuisine": "Boat-Transport",
    "cuisineTags": [
      "Boat-Transport"
    ],
    "vibeTags": [],
    "occasionTags": [
      "outdoor-adventure"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Hop-on hop-off water taxi; see mansions; bar stops",
    "sourceCredit": "Water Taxi Fort Lauderdale"
  },
  {
    "id": "d5e2ad83-82e2-bf9c-c572-b96098b1d33e",
    "name": "Flamingo Gardens",
    "slug": "flamingo-gardens",
    "city": "Fort Lauderdale",
    "state": "FL",
    "neighborhood": "Davie",
    "address": "3750 S Flamingo Rd",
    "lat": 26.1224,
    "lng": -80.1373,
    "cuisine": "Gardens-Zoo",
    "cuisineTags": [
      "Gardens-Zoo"
    ],
    "vibeTags": [
      "fun"
    ],
    "occasionTags": [
      "outdoor-adventure"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Botanical gardens; flamingos; wildlife sanctuary; family fun",
    "sourceCredit": "Visit Fort Lauderdale"
  },
  {
    "id": "18b7ca4b-6669-bbbe-759b-c938eaea6c70",
    "name": "The Wren",
    "slug": "the-wren",
    "city": "Maryland",
    "state": "MD",
    "neighborhood": "Baltimore",
    "address": "2900 Remington Ave",
    "lat": 39.0458,
    "lng": -76.6413,
    "cuisine": "New American",
    "cuisineTags": [
      "New American"
    ],
    "vibeTags": [
      "intimate"
    ],
    "occasionTags": [
      "date-night"
    ],
    "price": "$$$$",
    "priceLevel": 4,
    "vibeNotes": "NYT Top 50 Restaurants in America; intimate; tasting menus",
    "sourceCredit": "NYT / Eater Baltimore"
  },
  {
    "id": "4387d955-899d-60a2-1a7a-1947b8ceb639",
    "name": "The Bygone",
    "slug": "the-bygone",
    "city": "Maryland",
    "state": "MD",
    "neighborhood": "Harbor East",
    "address": "400 International Dr (32nd fl)",
    "lat": 39.0458,
    "lng": -76.6413,
    "cuisine": "American / Cocktails",
    "cuisineTags": [
      "American",
      "Cocktails"
    ],
    "vibeTags": [
      "rooftop",
      "cocktails"
    ],
    "occasionTags": [
      "date-night",
      "girls-night"
    ],
    "price": "$$$$",
    "priceLevel": 4,
    "vibeNotes": "Four Seasons rooftop; panoramic harbor views; 1920s supper club",
    "sourceCredit": "TikTok @eatmorebemore"
  },
  {
    "id": "dc4c5781-b088-6b4c-d36e-b674fe2e3679",
    "name": "Charleston",
    "slug": "charleston",
    "city": "Maryland",
    "state": "MD",
    "neighborhood": "Harbor East",
    "address": "1000 Lancaster St",
    "lat": 39.0458,
    "lng": -76.6413,
    "cuisine": "French-Low Country",
    "cuisineTags": [
      "French-Low Country"
    ],
    "vibeTags": [],
    "occasionTags": [
      "date-night"
    ],
    "price": "$$$$",
    "priceLevel": 4,
    "vibeNotes": "James Beard nod 2025; chef's tasting; white-tablecloth elegance",
    "sourceCredit": "TikTok @eatmorebemore"
  },
  {
    "id": "f5a79052-4347-50c6-46b9-b40b98427ad5",
    "name": "The Ruxton",
    "slug": "the-ruxton",
    "city": "Maryland",
    "state": "MD",
    "neighborhood": "Ruxton/Towson",
    "address": "8726 Lock Raven Blvd",
    "lat": 39.0458,
    "lng": -76.6413,
    "cuisine": "New American",
    "cuisineTags": [
      "New American"
    ],
    "vibeTags": [
      "viral"
    ],
    "occasionTags": [
      "date-night"
    ],
    "price": "$$$$",
    "priceLevel": 4,
    "vibeNotes": "TikTok \"always 10/10\"; seasonal farm-to-table; BYOB",
    "sourceCredit": "TikTok @eatmorebemore"
  },
  {
    "id": "77945e89-0535-2fdb-b04c-8d1966a9dd6b",
    "name": "Cinghiale",
    "slug": "cinghiale",
    "city": "Maryland",
    "state": "MD",
    "neighborhood": "Harbor East",
    "address": "822 Lancaster St",
    "lat": 39.0458,
    "lng": -76.6413,
    "cuisine": "Italian",
    "cuisineTags": [
      "Italian"
    ],
    "vibeTags": [
      "wine"
    ],
    "occasionTags": [
      "date-night"
    ],
    "price": "$$$",
    "priceLevel": 3,
    "vibeNotes": "Northern Italian; enoteca wine bar; handmade pasta",
    "sourceCredit": "Baltimore Sun"
  },
  {
    "id": "b1ca80e7-1458-4c95-aefe-69a1f40a421a",
    "name": "Foraged",
    "slug": "foraged",
    "city": "Maryland",
    "state": "MD",
    "neighborhood": "Baltimore",
    "address": "3520 Chestnut Ave",
    "lat": 39.0458,
    "lng": -76.6413,
    "cuisine": "Farm-to-Table",
    "cuisineTags": [
      "Farm-to-Table"
    ],
    "vibeTags": [
      "intimate"
    ],
    "occasionTags": [
      "date-night"
    ],
    "price": "$$$$",
    "priceLevel": 4,
    "vibeNotes": "Hyper-local tasting menu; foraged ingredients; intimate 20-seat space",
    "sourceCredit": "Eater Baltimore"
  },
  {
    "id": "801281fb-52d4-f948-02eb-87da2bb68737",
    "name": "Tagliata",
    "slug": "tagliata",
    "city": "Maryland",
    "state": "MD",
    "neighborhood": "Harbor East",
    "address": "1012 Fleet St",
    "lat": 39.0458,
    "lng": -76.6413,
    "cuisine": "Italian Steakhouse",
    "cuisineTags": [
      "Italian Steakhouse"
    ],
    "vibeTags": [
      "romantic"
    ],
    "occasionTags": [
      "date-night"
    ],
    "price": "$$$$",
    "priceLevel": 4,
    "vibeNotes": "Italian steakhouse; dry-aged cuts; romantic lighting",
    "sourceCredit": "Baltimore Magazine"
  },
  {
    "id": "1fbe6e0e-9e26-aa14-5941-985b559033f2",
    "name": "MAXIMON",
    "slug": "maximon",
    "city": "Maryland",
    "state": "MD",
    "neighborhood": "Federal Hill",
    "address": "1300 Bank St",
    "lat": 39.0458,
    "lng": -76.6413,
    "cuisine": "Latin American",
    "cuisineTags": [
      "Latin American"
    ],
    "vibeTags": [],
    "occasionTags": [
      "date-night"
    ],
    "price": "$$$",
    "priceLevel": 3,
    "vibeNotes": "Baltimore's best-kept secret; inventive Latin flavors; moody space",
    "sourceCredit": "TikTok @eatmorebemore"
  },
  {
    "id": "008c90a8-59dc-9790-ce8e-f78ef9849b7f",
    "name": "Power Plant Live!",
    "slug": "power-plant-live",
    "city": "Maryland",
    "state": "MD",
    "neighborhood": "Inner Harbor",
    "address": "34 Market Pl",
    "lat": 39.0458,
    "lng": -76.6413,
    "cuisine": "Entertainment District",
    "cuisineTags": [
      "Entertainment District"
    ],
    "vibeTags": [],
    "occasionTags": [
      "group-night-out",
      "bachelor"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Multi-venue complex; bars + restaurants + nightlife all in one",
    "sourceCredit": "Visit Baltimore"
  },
  {
    "id": "b006d17c-7f30-7b71-6c66-2e1ace496948",
    "name": "Tiki Lee's Dock Bar",
    "slug": "tiki-lee-s-dock-bar",
    "city": "Maryland",
    "state": "MD",
    "neighborhood": "Fells Point",
    "address": "2700 Lighthouse Point",
    "lat": 39.0458,
    "lng": -76.6413,
    "cuisine": "Tiki Bar / Waterfront",
    "cuisineTags": [
      "Tiki Bar",
      "Waterfront"
    ],
    "vibeTags": [
      "waterfront"
    ],
    "occasionTags": [
      "group-night-out"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Waterfront tiki bar; frozen drinks; boat-up dock; summer vibes",
    "sourceCredit": "TikTok @eatmorebemore"
  },
  {
    "id": "a54c5612-b0e9-835a-ea04-2476876d29dc",
    "name": "The Food Market",
    "slug": "the-food-market",
    "city": "Maryland",
    "state": "MD",
    "neighborhood": "Hampden",
    "address": "1017 W 36th St",
    "lat": 39.0458,
    "lng": -76.6413,
    "cuisine": "New American",
    "cuisineTags": [
      "New American"
    ],
    "vibeTags": [
      "trendy",
      "fun",
      "cocktails",
      "late-night"
    ],
    "occasionTags": [
      "group-night-out"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Trendy Hampden spot; creative small plates; fun cocktails",
    "sourceCredit": "Eater Baltimore"
  },
  {
    "id": "c25b7f79-f493-77cd-9953-6d6b66f093a3",
    "name": "Werner's Diner & Pub",
    "slug": "werner-s-diner-pub",
    "city": "Maryland",
    "state": "MD",
    "neighborhood": "Baltimore",
    "address": "231 E Redwood St",
    "lat": 39.0458,
    "lng": -76.6413,
    "cuisine": "Diner / Bar",
    "cuisineTags": [
      "Diner",
      "Bar"
    ],
    "vibeTags": [
      "late-night"
    ],
    "occasionTags": [
      "group-night-out"
    ],
    "price": "$",
    "priceLevel": 1,
    "vibeNotes": "Late-night comfort food; divey charm; group-friendly",
    "sourceCredit": "TikTok @eatmorebemore"
  },
  {
    "id": "dfa395d0-53b4-05b0-3139-5dc08b870881",
    "name": "Clavel",
    "slug": "clavel",
    "city": "Maryland",
    "state": "MD",
    "neighborhood": "Remington",
    "address": "225 W 23rd St",
    "lat": 39.0458,
    "lng": -76.6413,
    "cuisine": "Mexican / Mezcal Bar",
    "cuisineTags": [
      "Mexican",
      "Mezcal Bar"
    ],
    "vibeTags": [
      "patio",
      "late-night"
    ],
    "occasionTags": [
      "group-night-out"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Best mezcal bar in MD; Oaxacan small plates; back patio",
    "sourceCredit": "Eater Baltimore"
  },
  {
    "id": "386b4bc8-a5bb-b9b7-3eda-380e80358f0b",
    "name": "R. House",
    "slug": "r-house",
    "city": "Maryland",
    "state": "MD",
    "neighborhood": "Remington",
    "address": "301 W 29th St",
    "lat": 39.0458,
    "lng": -76.6413,
    "cuisine": "Food Hall",
    "cuisineTags": [
      "Food Hall"
    ],
    "vibeTags": [],
    "occasionTags": [
      "group-night-out"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Curated food hall; 10+ vendors; communal seating; good for groups",
    "sourceCredit": "Baltimore Magazine"
  },
  {
    "id": "7f354d09-e6f4-c512-eed2-dfd461560dae",
    "name": "Rec Pier Chop House",
    "slug": "rec-pier-chop-house",
    "city": "Maryland",
    "state": "MD",
    "neighborhood": "Fells Point",
    "address": "1715 Thames St",
    "lat": 39.0458,
    "lng": -76.6413,
    "cuisine": "Steakhouse / Seafood",
    "cuisineTags": [
      "Steakhouse",
      "Seafood"
    ],
    "vibeTags": [
      "upscale",
      "waterfront"
    ],
    "occasionTags": [
      "group-night-out",
      "guys-night"
    ],
    "price": "$$$$",
    "priceLevel": 4,
    "vibeNotes": "Sagamore Pendry hotel; waterfront; upscale group dinner",
    "sourceCredit": "Michelin Guide"
  },
  {
    "id": "2cb3bd78-e965-4cd0-a8ed-bec937fc7164",
    "name": "Blackwall Hitch",
    "slug": "blackwall-hitch",
    "city": "Maryland",
    "state": "MD",
    "neighborhood": "Annapolis",
    "address": "400 Sixth St",
    "lat": 39.0458,
    "lng": -76.6413,
    "cuisine": "Seafood / Waterfront",
    "cuisineTags": [
      "Seafood",
      "Waterfront"
    ],
    "vibeTags": [
      "waterfront",
      "sunset"
    ],
    "occasionTags": [
      "group-night-out"
    ],
    "price": "$$$",
    "priceLevel": 3,
    "vibeNotes": "Annapolis waterfront; raw bar; sunset deck; group-ready",
    "sourceCredit": "Visit Annapolis"
  },
  {
    "id": "323fffac-0e7f-48e3-b391-e5b53b486d83",
    "name": "Woodberry Kitchen",
    "slug": "woodberry-kitchen",
    "city": "Maryland",
    "state": "MD",
    "neighborhood": "Woodberry",
    "address": "2010 Clipper Park Rd #126",
    "lat": 39.0458,
    "lng": -76.6413,
    "cuisine": "Farm-to-Table",
    "cuisineTags": [
      "Farm-to-Table"
    ],
    "vibeTags": [],
    "occasionTags": [
      "family"
    ],
    "price": "$$$",
    "priceLevel": 3,
    "vibeNotes": "Chesapeake farm-to-table; James Beard winner; warm hospitality",
    "sourceCredit": "James Beard Foundation"
  },
  {
    "id": "0aedba08-9b15-7ce6-8bb9-b1647a8ea9f6",
    "name": "Tio Pepe",
    "slug": "tio-pepe",
    "city": "Maryland",
    "state": "MD",
    "neighborhood": "Mt Vernon",
    "address": "10 E Franklin St",
    "lat": 39.0458,
    "lng": -76.6413,
    "cuisine": "Spanish",
    "cuisineTags": [
      "Spanish"
    ],
    "vibeTags": [],
    "occasionTags": [
      "family"
    ],
    "price": "$$$",
    "priceLevel": 3,
    "vibeNotes": "Old-school Spanish; 60+ years; classic Baltimore fine dining",
    "sourceCredit": "TikTok @eatmorebemore"
  },
  {
    "id": "009516c4-30f1-1da7-9417-4f262384795d",
    "name": "The Prime Rib",
    "slug": "the-prime-rib",
    "city": "Maryland",
    "state": "MD",
    "neighborhood": "Mt Vernon",
    "address": "1101 N Calvert St",
    "lat": 39.0458,
    "lng": -76.6413,
    "cuisine": "Steakhouse",
    "cuisineTags": [
      "Steakhouse"
    ],
    "vibeTags": [],
    "occasionTags": [
      "family",
      "guys-night"
    ],
    "price": "$$$$",
    "priceLevel": 4,
    "vibeNotes": "Tuxedoed waiters; live piano; supper club since 1965",
    "sourceCredit": "Baltimore Sun"
  },
  {
    "id": "0cb28342-2b7c-463e-9b28-d105f6023ae7",
    "name": "Gertrude's",
    "slug": "gertrude-s",
    "city": "Maryland",
    "state": "MD",
    "neighborhood": "Charles Village",
    "address": "10 Art Museum Dr",
    "lat": 39.0458,
    "lng": -76.6413,
    "cuisine": "Chesapeake",
    "cuisineTags": [
      "Chesapeake"
    ],
    "vibeTags": [
      "elegant"
    ],
    "occasionTags": [
      "family"
    ],
    "price": "$$$",
    "priceLevel": 3,
    "vibeNotes": "Inside BMA; Chesapeake cuisine; garden views; elegant but relaxed",
    "sourceCredit": "Baltimore Magazine"
  },
  {
    "id": "3600cc64-d5d3-39c1-14d3-e19f510cfe00",
    "name": "Iron Bridge Wine Co.",
    "slug": "iron-bridge-wine-co",
    "city": "Maryland",
    "state": "MD",
    "neighborhood": "Columbia",
    "address": "10435 MD-108",
    "lat": 39.0458,
    "lng": -76.6413,
    "cuisine": "New American / Wine",
    "cuisineTags": [
      "New American",
      "Wine"
    ],
    "vibeTags": [
      "elegant",
      "wine"
    ],
    "occasionTags": [
      "family"
    ],
    "price": "$$$",
    "priceLevel": 3,
    "vibeNotes": "Wine-focused bistro; elegant but not stuffy; great for parents",
    "sourceCredit": "Baltimore Sun"
  },
  {
    "id": "e4382e50-4246-6235-fe9f-73bdcd0f75fe",
    "name": "Lewnes' Steakhouse",
    "slug": "lewnes-steakhouse",
    "city": "Maryland",
    "state": "MD",
    "neighborhood": "Annapolis",
    "address": "401 4th St",
    "lat": 39.0458,
    "lng": -76.6413,
    "cuisine": "Steakhouse",
    "cuisineTags": [
      "Steakhouse"
    ],
    "vibeTags": [],
    "occasionTags": [
      "family"
    ],
    "price": "$$$$",
    "priceLevel": 4,
    "vibeNotes": "Annapolis institution; old-school steakhouse; white tablecloth",
    "sourceCredit": "Visit Annapolis"
  },
  {
    "id": "09190e32-d3a4-b2a7-e8d8-15590a334083",
    "name": "Miss Shirley's Cafe",
    "slug": "miss-shirley-s-cafe",
    "city": "Maryland",
    "state": "MD",
    "neighborhood": "Roland Park",
    "address": "513 W Cold Spring Ln",
    "lat": 39.0458,
    "lng": -76.6413,
    "cuisine": "Southern Brunch",
    "cuisineTags": [
      "Southern Brunch"
    ],
    "vibeTags": [
      "brunch"
    ],
    "occasionTags": [
      "family"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Famous brunch; crab cake benedicts; family-friendly",
    "sourceCredit": "Eater Baltimore"
  },
  {
    "id": "acb62b37-8734-0f37-34a5-55fa1d9ab4cc",
    "name": "Mama's on the Half Shell",
    "slug": "mama-s-on-the-half-shell",
    "city": "Maryland",
    "state": "MD",
    "neighborhood": "Canton",
    "address": "2901 O'Donnell St",
    "lat": 39.0458,
    "lng": -76.6413,
    "cuisine": "Seafood",
    "cuisineTags": [
      "Seafood"
    ],
    "vibeTags": [],
    "occasionTags": [
      "family"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Neighborhood oyster bar; crab cakes; casual family spot",
    "sourceCredit": "Baltimore Magazine"
  },
  {
    "id": "32c9d683-246f-9add-2045-64b0a830b7f2",
    "name": "Cosima",
    "slug": "cosima",
    "city": "Maryland",
    "state": "MD",
    "neighborhood": "Canton",
    "address": "3000 Dillon St",
    "lat": 39.0458,
    "lng": -76.6413,
    "cuisine": "Sicilian",
    "cuisineTags": [
      "Sicilian"
    ],
    "vibeTags": [],
    "occasionTags": [
      "girls-night"
    ],
    "price": "$$$",
    "priceLevel": 3,
    "vibeNotes": "Rustic Sicilian; wood-fired; gorgeous exposed brick",
    "sourceCredit": "Eater Baltimore"
  },
  {
    "id": "3b70cb6e-2256-8824-b08e-fb0e4d205ebe",
    "name": "Alma Cocina Latina",
    "slug": "alma-cocina-latina",
    "city": "Maryland",
    "state": "MD",
    "neighborhood": "Canton",
    "address": "2400 Boston St",
    "lat": 39.0458,
    "lng": -76.6413,
    "cuisine": "Venezuelan",
    "cuisineTags": [
      "Venezuelan"
    ],
    "vibeTags": [
      "cocktails"
    ],
    "occasionTags": [
      "girls-night"
    ],
    "price": "$$$",
    "priceLevel": 3,
    "vibeNotes": "Venezuelan fine dining; arepas + cocktails; vibrant space",
    "sourceCredit": "Baltimore Magazine"
  },
  {
    "id": "552213f7-a38c-990e-4a52-317286beaa51",
    "name": "Bar Vasquez",
    "slug": "bar-vasquez",
    "city": "Maryland",
    "state": "MD",
    "neighborhood": "Harbor East",
    "address": "1425 Aliceanna St",
    "lat": 39.0458,
    "lng": -76.6413,
    "cuisine": "Spanish Tapas / Wine",
    "cuisineTags": [
      "Spanish Tapas",
      "Wine"
    ],
    "vibeTags": [
      "wine"
    ],
    "occasionTags": [
      "girls-night"
    ],
    "price": "$$$",
    "priceLevel": 3,
    "vibeNotes": "Spanish wine bar; shareable tapas; chic atmosphere",
    "sourceCredit": "Eater Baltimore"
  },
  {
    "id": "3b04e2fa-f30a-ea3d-a60d-9f836d46bc15",
    "name": "Topside",
    "slug": "topside",
    "city": "Maryland",
    "state": "MD",
    "neighborhood": "Mt Vernon",
    "address": "612 Cathedral St (rooftop)",
    "lat": 39.0458,
    "lng": -76.6413,
    "cuisine": "Rooftop Bar",
    "cuisineTags": [
      "Rooftop Bar"
    ],
    "vibeTags": [
      "rooftop"
    ],
    "occasionTags": [
      "girls-night"
    ],
    "price": "$$$",
    "priceLevel": 3,
    "vibeNotes": "Hotel Revival rooftop; city views; Insta-worthy",
    "sourceCredit": "TimeOut Baltimore"
  },
  {
    "id": "576d86ba-0ce7-3eef-474d-fc3e8cac5a3f",
    "name": "Ida B's Table",
    "slug": "ida-b-s-table",
    "city": "Maryland",
    "state": "MD",
    "neighborhood": "Downtown",
    "address": "235 Holliday St",
    "lat": 39.0458,
    "lng": -76.6413,
    "cuisine": "Southern Fine Dining",
    "cuisineTags": [
      "Southern Fine Dining"
    ],
    "vibeTags": [
      "upscale",
      "elegant",
      "cocktails"
    ],
    "occasionTags": [
      "girls-night"
    ],
    "price": "$$$",
    "priceLevel": 3,
    "vibeNotes": "Upscale Southern; craft cocktails; elegant Black-owned",
    "sourceCredit": "Eater Baltimore"
  },
  {
    "id": "f2e53efd-4ad8-811d-c267-bc603114e503",
    "name": "Sacr\u00e9 Sucr\u00e9",
    "slug": "sacr-sucr",
    "city": "Maryland",
    "state": "MD",
    "neighborhood": "Fells Point",
    "address": "1735 Lancaster St",
    "lat": 39.0458,
    "lng": -76.6413,
    "cuisine": "French Patisserie",
    "cuisineTags": [
      "French Patisserie"
    ],
    "vibeTags": [
      "brunch"
    ],
    "occasionTags": [
      "girls-night"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Pastries + champagne; cute brunch spot; girls trip perfect",
    "sourceCredit": "Instagram Baltimore"
  },
  {
    "id": "ef3eeaf7-842d-0355-99fa-8c7c32273b34",
    "name": "The Elk Room",
    "slug": "the-elk-room",
    "city": "Maryland",
    "state": "MD",
    "neighborhood": "Fells Point",
    "address": "1010 Fleet St (basement)",
    "lat": 39.0458,
    "lng": -76.6413,
    "cuisine": "Speakeasy",
    "cuisineTags": [
      "Speakeasy"
    ],
    "vibeTags": [
      "hidden-gem",
      "cocktails"
    ],
    "occasionTags": [
      "girls-night",
      "bachelor"
    ],
    "price": "$$$",
    "priceLevel": 3,
    "vibeNotes": "Hidden speakeasy; reservations required; craft cocktail paradise",
    "sourceCredit": "Baltimore Magazine"
  },
  {
    "id": "7de1b560-1195-1c53-387b-c0348cb6fdf7",
    "name": "Max's Taphouse",
    "slug": "max-s-taphouse",
    "city": "Maryland",
    "state": "MD",
    "neighborhood": "Fells Point",
    "address": "737 S Broadway",
    "lat": 39.0458,
    "lng": -76.6413,
    "cuisine": "Beer Bar",
    "cuisineTags": [
      "Beer Bar"
    ],
    "vibeTags": [],
    "occasionTags": [
      "guys-night"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "150+ craft beers on tap; legendary selection; no frills",
    "sourceCredit": "Baltimore Magazine"
  },
  {
    "id": "beb4063b-966f-7d45-0fa8-0e3d6e316d56",
    "name": "The Horse You Came In On",
    "slug": "the-horse-you-came-in-on",
    "city": "Maryland",
    "state": "MD",
    "neighborhood": "Fells Point",
    "address": "1626 Thames St",
    "lat": 39.0458,
    "lng": -76.6413,
    "cuisine": "Historic Bar",
    "cuisineTags": [
      "Historic Bar"
    ],
    "vibeTags": [
      "live-music"
    ],
    "occasionTags": [
      "guys-night"
    ],
    "price": "$",
    "priceLevel": 1,
    "vibeNotes": "America's oldest continuously operating saloon; live music nightly",
    "sourceCredit": "Visit Baltimore"
  },
  {
    "id": "25513a05-0fb6-07e1-5367-777ee6f8f9fc",
    "name": "Nacho Mama's",
    "slug": "nacho-mama-s",
    "city": "Maryland",
    "state": "MD",
    "neighborhood": "Canton",
    "address": "2907 O'Donnell St",
    "lat": 39.0458,
    "lng": -76.6413,
    "cuisine": "Mexican / Bar",
    "cuisineTags": [
      "Mexican",
      "Bar"
    ],
    "vibeTags": [
      "fun"
    ],
    "occasionTags": [
      "guys-night"
    ],
    "price": "$",
    "priceLevel": 1,
    "vibeNotes": "Hub caps on walls; massive margaritas; rowdy fun",
    "sourceCredit": "Infatuation Baltimore"
  },
  {
    "id": "e24d0517-5f28-7b9c-53b1-31dea4547d6c",
    "name": "Heavy Seas Alehouse",
    "slug": "heavy-seas-alehouse",
    "city": "Maryland",
    "state": "MD",
    "neighborhood": "Inner Harbor",
    "address": "1300 Bank St",
    "lat": 39.0458,
    "lng": -76.6413,
    "cuisine": "Brewpub",
    "cuisineTags": [
      "Brewpub"
    ],
    "vibeTags": [],
    "occasionTags": [
      "guys-night"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Local brewery taproom; gastropub menu; game day spot",
    "sourceCredit": "Eater Baltimore"
  },
  {
    "id": "ee22bafd-f53c-81a4-c68a-31a2cf77b5a9",
    "name": "Delia Foley's",
    "slug": "delia-foley-s",
    "city": "Maryland",
    "state": "MD",
    "neighborhood": "Federal Hill",
    "address": "1439 S Charles St",
    "lat": 39.0458,
    "lng": -76.6413,
    "cuisine": "Irish Pub",
    "cuisineTags": [
      "Irish Pub"
    ],
    "vibeTags": [],
    "occasionTags": [
      "guys-night"
    ],
    "price": "$",
    "priceLevel": 1,
    "vibeNotes": "Federal Hill dive; pool tables; cheap beers; sports on TV",
    "sourceCredit": "Baltimore Magazine"
  },
  {
    "id": "b9c21100-7e24-7afd-2122-30dfb10b7ad8",
    "name": "Abbey Burger Bistro",
    "slug": "abbey-burger-bistro",
    "city": "Maryland",
    "state": "MD",
    "neighborhood": "Federal Hill",
    "address": "1041 Marshall St",
    "lat": 39.0458,
    "lng": -76.6413,
    "cuisine": "Burgers / Craft Beer",
    "cuisineTags": [
      "Burgers",
      "Craft Beer"
    ],
    "vibeTags": [],
    "occasionTags": [
      "guys-night"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Wild game burgers (kangaroo, bison); 50+ beers",
    "sourceCredit": "Eater Baltimore"
  },
  {
    "id": "9a7f4bc9-4765-53b9-3fb6-30c32af65277",
    "name": "Topgolf",
    "slug": "topgolf",
    "city": "Maryland",
    "state": "MD",
    "neighborhood": "White Marsh",
    "address": "8725 Ridgely's Choice Dr",
    "lat": 39.0458,
    "lng": -76.6413,
    "cuisine": "Golf / Lounge",
    "cuisineTags": [
      "Golf",
      "Lounge"
    ],
    "vibeTags": [],
    "occasionTags": [
      "bachelor"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Multi-level driving range; full bar; group bays",
    "sourceCredit": "Topgolf"
  },
  {
    "id": "d0579d66-da25-d11c-a9ae-6fb56cb398c0",
    "name": "Horseshoe Casino",
    "slug": "horseshoe-casino",
    "city": "Maryland",
    "state": "MD",
    "neighborhood": "Downtown",
    "address": "1525 Russell St",
    "lat": 39.0458,
    "lng": -76.6413,
    "cuisine": "Casino / Nightlife",
    "cuisineTags": [
      "Casino",
      "Nightlife"
    ],
    "vibeTags": [
      "late-night"
    ],
    "occasionTags": [
      "bachelor"
    ],
    "price": "$$-$$$$",
    "priceLevel": 4,
    "vibeNotes": "Table games; poker room; bars; late-night action",
    "sourceCredit": "Visit Baltimore"
  },
  {
    "id": "f7512588-deb8-9ec8-8bb7-9b31517b85a2",
    "name": "Sugarvale",
    "slug": "sugarvale",
    "city": "Maryland",
    "state": "MD",
    "neighborhood": "Mt Vernon",
    "address": "30 W North Ave (hidden)",
    "lat": 39.0458,
    "lng": -76.6413,
    "cuisine": "Speakeasy",
    "cuisineTags": [
      "Speakeasy"
    ],
    "vibeTags": [
      "intimate",
      "hidden-gem",
      "cocktails"
    ],
    "occasionTags": [
      "bachelor"
    ],
    "price": "$$$",
    "priceLevel": 3,
    "vibeNotes": "Hidden cocktail lounge; intimate; craft drinks",
    "sourceCredit": "Baltimore Magazine"
  },
  {
    "id": "0ad3ba2e-2a57-b84a-73c7-07e2473ddf80",
    "name": "Fells Point Pub Crawl",
    "slug": "fells-point-pub-crawl",
    "city": "Maryland",
    "state": "MD",
    "neighborhood": "Fells Point",
    "address": "Thames St area",
    "lat": 39.0458,
    "lng": -76.6413,
    "cuisine": "Bar Crawl",
    "cuisineTags": [
      "Bar Crawl"
    ],
    "vibeTags": [],
    "occasionTags": [
      "bachelor"
    ],
    "price": "$-$$",
    "priceLevel": 3,
    "vibeNotes": "Bar-hop Thames St; 20+ bars in walking distance",
    "sourceCredit": "Visit Baltimore"
  },
  {
    "id": "2a986467-a806-8ed4-0699-0c79f6fc6199",
    "name": "Koopers Tavern",
    "slug": "koopers-tavern",
    "city": "Maryland",
    "state": "MD",
    "neighborhood": "Fells Point",
    "address": "1702 Thames St",
    "lat": 39.0458,
    "lng": -76.6413,
    "cuisine": "Tavern / Rooftop",
    "cuisineTags": [
      "Tavern",
      "Rooftop"
    ],
    "vibeTags": [
      "rooftop",
      "late-night"
    ],
    "occasionTags": [
      "bachelor"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Rooftop deck; great burgers; sports; late hours",
    "sourceCredit": "Eater Baltimore"
  },
  {
    "id": "2282a4d8-9899-e6e1-8d25-bf5a18216166",
    "name": "Soundstage",
    "slug": "soundstage",
    "city": "Maryland",
    "state": "MD",
    "neighborhood": "Inner Harbor",
    "address": "124 Market Pl",
    "lat": 39.0458,
    "lng": -76.6413,
    "cuisine": "Concert Venue / Club",
    "cuisineTags": [
      "Concert Venue",
      "Club"
    ],
    "vibeTags": [
      "live-music"
    ],
    "occasionTags": [
      "bachelor"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Live music venue; comedy nights; event space",
    "sourceCredit": "Visit Baltimore"
  },
  {
    "id": "6106bb5c-424a-9286-ab4e-c895e86a3d57",
    "name": "Inner Harbor",
    "slug": "inner-harbor",
    "city": "Maryland",
    "state": "MD",
    "neighborhood": "Downtown Baltimore",
    "address": "Pratt & Light St",
    "lat": 39.0458,
    "lng": -76.6413,
    "cuisine": "Waterfront / Walk",
    "cuisineTags": [
      "Waterfront",
      "Walk"
    ],
    "vibeTags": [
      "waterfront",
      "iconic"
    ],
    "occasionTags": [
      "outdoor-adventure"
    ],
    "price": "Free",
    "priceLevel": 1,
    "vibeNotes": "Iconic waterfront; National Aquarium; paddle boats; waterfront dining",
    "sourceCredit": "Visit Baltimore"
  },
  {
    "id": "7ed25638-2596-c032-098b-45ee4fc8036f",
    "name": "Annapolis City Dock",
    "slug": "annapolis-city-dock",
    "city": "Maryland",
    "state": "MD",
    "neighborhood": "Annapolis",
    "address": "City Dock",
    "lat": 39.0458,
    "lng": -76.6413,
    "cuisine": "Waterfront / Historic",
    "cuisineTags": [
      "Waterfront",
      "Historic"
    ],
    "vibeTags": [
      "waterfront"
    ],
    "occasionTags": [
      "outdoor-adventure"
    ],
    "price": "Free",
    "priceLevel": 1,
    "vibeNotes": "Sailboat capital of the world; colonial charm; waterfront bars",
    "sourceCredit": "Visit Annapolis"
  },
  {
    "id": "0c396e93-9dd1-5a53-5841-b66010b7ddc6",
    "name": "Hammock Point",
    "slug": "hammock-point",
    "city": "Maryland",
    "state": "MD",
    "neighborhood": "Middle River",
    "address": "Hammock Point Rd",
    "lat": 39.0458,
    "lng": -76.6413,
    "cuisine": "Beach / Waterfront",
    "cuisineTags": [
      "Beach",
      "Waterfront"
    ],
    "vibeTags": [
      "waterfront"
    ],
    "occasionTags": [
      "outdoor-adventure"
    ],
    "price": "Free",
    "priceLevel": 1,
    "vibeNotes": "Chesapeake Bay beach; kayaking; crab feasts nearby",
    "sourceCredit": "Visit Maryland"
  },
  {
    "id": "8355efc5-e481-065a-f922-d472106de6a5",
    "name": "Cylburn Arboretum",
    "slug": "cylburn-arboretum",
    "city": "Maryland",
    "state": "MD",
    "neighborhood": "Baltimore",
    "address": "4915 Greenspring Ave",
    "lat": 39.0458,
    "lng": -76.6413,
    "cuisine": "Gardens / Nature",
    "cuisineTags": [
      "Gardens",
      "Nature"
    ],
    "vibeTags": [],
    "occasionTags": [
      "outdoor-adventure"
    ],
    "price": "Free",
    "priceLevel": 1,
    "vibeNotes": "207 acres; gardens; mansion; scenic trails",
    "sourceCredit": "Baltimore City"
  },
  {
    "id": "47305e1f-38db-650b-1ad5-d5b95962e3b3",
    "name": "Federal Hill Park",
    "slug": "federal-hill-park",
    "city": "Maryland",
    "state": "MD",
    "neighborhood": "Federal Hill",
    "address": "300 Warren Ave",
    "lat": 39.0458,
    "lng": -76.6413,
    "cuisine": "Park / Viewpoint",
    "cuisineTags": [
      "Park",
      "Viewpoint"
    ],
    "vibeTags": [
      "sunset"
    ],
    "occasionTags": [
      "outdoor-adventure"
    ],
    "price": "Free",
    "priceLevel": 1,
    "vibeNotes": "Best skyline view of Baltimore; sunset picnic spot",
    "sourceCredit": "Visit Baltimore"
  },
  {
    "id": "6daa5321-35de-b7b4-d69a-90bd86006577",
    "name": "North Point State Park",
    "slug": "north-point-state-park",
    "city": "Maryland",
    "state": "MD",
    "neighborhood": "Edgemere",
    "address": "8400 North Point Rd",
    "lat": 39.0458,
    "lng": -76.6413,
    "cuisine": "Park / Beach",
    "cuisineTags": [
      "Park",
      "Beach"
    ],
    "vibeTags": [],
    "occasionTags": [
      "outdoor-adventure"
    ],
    "price": "Free",
    "priceLevel": 1,
    "vibeNotes": "Bay beach; trails; historic site; fishing pier",
    "sourceCredit": "MD DNR"
  },
  {
    "id": "cc542b3d-7cff-5b2e-c2d8-37eaadc498ca",
    "name": "Patapsco Valley State Park",
    "slug": "patapsco-valley-state-park",
    "city": "Maryland",
    "state": "MD",
    "neighborhood": "Ellicott City",
    "address": "8020 Baltimore National Pike",
    "lat": 39.0458,
    "lng": -76.6413,
    "cuisine": "State Park / Hiking",
    "cuisineTags": [
      "State Park",
      "Hiking"
    ],
    "vibeTags": [],
    "occasionTags": [
      "outdoor-adventure"
    ],
    "price": "$",
    "priceLevel": 1,
    "vibeNotes": "River trails; suspension bridge; 200 miles of trails",
    "sourceCredit": "MD DNR"
  },
  {
    "id": "c59a4fb8-a03e-bfda-39f9-42784ad8f955",
    "name": "Canton Waterfront Park",
    "slug": "canton-waterfront-park",
    "city": "Maryland",
    "state": "MD",
    "neighborhood": "Canton",
    "address": "3001 Boston St",
    "lat": 39.0458,
    "lng": -76.6413,
    "cuisine": "Waterfront Park",
    "cuisineTags": [
      "Waterfront Park"
    ],
    "vibeTags": [
      "waterfront",
      "sunset"
    ],
    "occasionTags": [
      "outdoor-adventure"
    ],
    "price": "Free",
    "priceLevel": 1,
    "vibeNotes": "Harbor views; dog-friendly; kayak launch; sunset spot",
    "sourceCredit": "Baltimore City"
  },
  {
    "id": "0b30c1eb-60c9-6d11-9bf0-ee403fb870ef",
    "name": "Macchialina",
    "slug": "macchialina",
    "city": "Miami",
    "state": "FL",
    "neighborhood": "Miami Beach",
    "address": "820 Alton Rd",
    "lat": 25.7617,
    "lng": -80.1918,
    "cuisine": "Italian",
    "cuisineTags": [
      "Italian"
    ],
    "vibeTags": [
      "romantic",
      "intimate"
    ],
    "occasionTags": [
      "date-night"
    ],
    "price": "$$$",
    "priceLevel": 3,
    "vibeNotes": "Intimate 30-seat pasta house; handmade everything; candlelit & romantic",
    "sourceCredit": "TikTok @yumiami_"
  },
  {
    "id": "ecf613f4-4bf1-4429-269b-68889f15d21d",
    "name": "Shiso",
    "slug": "shiso",
    "city": "Miami",
    "state": "FL",
    "neighborhood": "Miami Beach",
    "address": "1426 20th St",
    "lat": 25.7617,
    "lng": -80.1918,
    "cuisine": "Japanese",
    "cuisineTags": [
      "Japanese"
    ],
    "vibeTags": [],
    "occasionTags": [
      "date-night"
    ],
    "price": "$$$",
    "priceLevel": 3,
    "vibeNotes": "Omakase experience; minimalist & serene; chef's counter date night",
    "sourceCredit": "Instagram"
  },
  {
    "id": "c2b4235d-ebb5-4ac6-66d1-32126fcfaa17",
    "name": "COTE Miami",
    "slug": "cote-miami",
    "city": "Miami",
    "state": "FL",
    "neighborhood": "Design District",
    "address": "3900 NE 2nd Ave",
    "lat": 25.7617,
    "lng": -80.1918,
    "cuisine": "Korean Steakhouse",
    "cuisineTags": [
      "Korean Steakhouse"
    ],
    "vibeTags": [
      "michelin"
    ],
    "occasionTags": [
      "date-night"
    ],
    "price": "$$$$",
    "priceLevel": 4,
    "vibeNotes": "Michelin-starred Korean BBQ; theatrical tableside grilling; special occasion",
    "sourceCredit": "Resy"
  },
  {
    "id": "c16125be-865c-e8bf-266a-88898207a83d",
    "name": "Sexy Fish",
    "slug": "sexy-fish",
    "city": "Miami",
    "state": "FL",
    "neighborhood": "Brickell",
    "address": "1001 S Miami Ave",
    "lat": 25.7617,
    "lng": -80.1918,
    "cuisine": "Asian",
    "cuisineTags": [
      "Asian"
    ],
    "vibeTags": [
      "cocktails",
      "instagrammable"
    ],
    "occasionTags": [
      "date-night"
    ],
    "price": "$$$$",
    "priceLevel": 4,
    "vibeNotes": "Glamorous interior; Damien Hirst art; cocktails & seafood; Instagram-famous",
    "sourceCredit": "TikTok"
  },
  {
    "id": "140ffebe-3527-4d17-2461-ac29d6a09464",
    "name": "Claudie",
    "slug": "claudie",
    "city": "Miami",
    "state": "FL",
    "neighborhood": "Coconut Grove",
    "address": "3155 Commodore Plaza",
    "lat": 25.7617,
    "lng": -80.1918,
    "cuisine": "French Bistro",
    "cuisineTags": [
      "French Bistro"
    ],
    "vibeTags": [
      "patio",
      "cocktails"
    ],
    "occasionTags": [
      "date-night"
    ],
    "price": "$$$",
    "priceLevel": 3,
    "vibeNotes": "Parisian charm in the Grove; escargot & steak frites; golden hour patio",
    "sourceCredit": "TikTok"
  },
  {
    "id": "c960a8a8-1ce4-0798-f5c0-01db9e199ce0",
    "name": "Cotoa",
    "slug": "cotoa",
    "city": "Miami",
    "state": "FL",
    "neighborhood": "Design District",
    "address": "97 NE 40th St",
    "lat": 25.7617,
    "lng": -80.1918,
    "cuisine": "Mexican Fine Dining",
    "cuisineTags": [
      "Mexican Fine Dining"
    ],
    "vibeTags": [
      "intimate"
    ],
    "occasionTags": [
      "date-night"
    ],
    "price": "$$$",
    "priceLevel": 3,
    "vibeNotes": "Elevated Mexican; mole flights; intimate tasting counter",
    "sourceCredit": "Resy"
  },
  {
    "id": "9a3973cb-3a8a-c870-5e9b-c8d908795433",
    "name": "Daniel's",
    "slug": "daniel-s",
    "city": "Miami",
    "state": "FL",
    "neighborhood": "Brickell",
    "address": "1200 Brickell Bay Dr",
    "lat": 25.7617,
    "lng": -80.1918,
    "cuisine": "Mediterranean",
    "cuisineTags": [
      "Mediterranean"
    ],
    "vibeTags": [
      "waterfront",
      "cocktails",
      "late-night",
      "sunset"
    ],
    "occasionTags": [
      "date-night"
    ],
    "price": "$$$",
    "priceLevel": 3,
    "vibeNotes": "Waterfront views; sunset cocktails; sophisticated plates",
    "sourceCredit": "Instagram"
  },
  {
    "id": "80a1ba85-0b60-2d88-91cc-d3c39f908d65",
    "name": "Chimba",
    "slug": "chimba",
    "city": "Miami",
    "state": "FL",
    "neighborhood": "Miami Beach",
    "address": "1638 Meridian Ave",
    "lat": 25.7617,
    "lng": -80.1918,
    "cuisine": "Peruvian-Japanese",
    "cuisineTags": [
      "Peruvian-Japanese"
    ],
    "vibeTags": [],
    "occasionTags": [
      "date-night"
    ],
    "price": "$$$",
    "priceLevel": 3,
    "vibeNotes": "Nikkei fusion; vibrant plating; stylish South Beach gem",
    "sourceCredit": "TikTok"
  },
  {
    "id": "8c590c69-2609-80e1-56c5-f018b2ea12b2",
    "name": "Las' Lap",
    "slug": "las-lap",
    "city": "Miami",
    "state": "FL",
    "neighborhood": "Wynwood",
    "address": "288 NW 25th St",
    "lat": 25.7617,
    "lng": -80.1918,
    "cuisine": "Caribbean",
    "cuisineTags": [
      "Caribbean"
    ],
    "vibeTags": [
      "intimate",
      "hidden-gem",
      "cocktails"
    ],
    "occasionTags": [
      "date-night"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Trinidad-inspired; rum cocktails; colorful & intimate; hidden gem",
    "sourceCredit": "TikTok @foodyfetish"
  },
  {
    "id": "24f8ad87-51a4-dc84-6400-732495bc137b",
    "name": "Fratesi's",
    "slug": "fratesi-s",
    "city": "Miami",
    "state": "FL",
    "neighborhood": "Coral Gables",
    "address": "2306 Galiano St",
    "lat": 25.7617,
    "lng": -80.1918,
    "cuisine": "Italian",
    "cuisineTags": [
      "Italian"
    ],
    "vibeTags": [
      "cozy"
    ],
    "occasionTags": [
      "date-night"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Cozy neighborhood Italian; fresh pasta; candlelit romance",
    "sourceCredit": "Instagram"
  },
  {
    "id": "dc05b04f-5a54-bf1d-4a00-8860b54227b1",
    "name": "1-800-Lucky",
    "slug": "1-800-lucky",
    "city": "Miami",
    "state": "FL",
    "neighborhood": "Wynwood",
    "address": "143 NW 23rd St",
    "lat": 25.7617,
    "lng": -80.1918,
    "cuisine": "Asian Food Hall",
    "cuisineTags": [
      "Asian Food Hall"
    ],
    "vibeTags": [],
    "occasionTags": [
      "group-night-out"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Asian food hall; multiple vendors; neon vibes; group paradise",
    "sourceCredit": "TikTok"
  },
  {
    "id": "2a92c29f-ab8f-8ed9-b55a-f507932dc24c",
    "name": "Basement",
    "slug": "basement",
    "city": "Miami",
    "state": "FL",
    "neighborhood": "Miami Beach",
    "address": "2901 Collins Ave",
    "lat": 25.7617,
    "lng": -80.1918,
    "cuisine": "Nightclub / Bowling",
    "cuisineTags": [
      "Nightclub",
      "Bowling"
    ],
    "vibeTags": [],
    "occasionTags": [
      "group-night-out"
    ],
    "price": "$$$",
    "priceLevel": 3,
    "vibeNotes": "Underground bowling + nightclub under Edition hotel; celebrity sightings",
    "sourceCredit": "Instagram"
  },
  {
    "id": "d80bd990-30fd-0842-11ca-c3934061722b",
    "name": "LIV",
    "slug": "liv",
    "city": "Miami",
    "state": "FL",
    "neighborhood": "Miami Beach",
    "address": "4441 Collins Ave",
    "lat": 25.7617,
    "lng": -80.1918,
    "cuisine": "Nightclub",
    "cuisineTags": [
      "Nightclub"
    ],
    "vibeTags": [
      "dj",
      "iconic"
    ],
    "occasionTags": [
      "group-night-out",
      "bachelor"
    ],
    "price": "$$$$",
    "priceLevel": 4,
    "vibeNotes": "Iconic Fontainebleau club; bottle service; world-class DJs",
    "sourceCredit": "TikTok"
  },
  {
    "id": "840026d2-47f4-5e09-120c-eec7ffc50530",
    "name": "E11EVEN",
    "slug": "e11even",
    "city": "Miami",
    "state": "FL",
    "neighborhood": "Downtown",
    "address": "29 NE 11th St",
    "lat": 25.7617,
    "lng": -80.1918,
    "cuisine": "Nightclub",
    "cuisineTags": [
      "Nightclub"
    ],
    "vibeTags": [
      "rooftop"
    ],
    "occasionTags": [
      "group-night-out",
      "bachelor"
    ],
    "price": "$$$$",
    "priceLevel": 4,
    "vibeNotes": "24/7 ultraclub; rooftop pool; cirque performers; Miami nightlife king",
    "sourceCredit": "Instagram"
  },
  {
    "id": "a593c057-a15a-e3b6-e3f0-2e9ed040cd41",
    "name": "Club Space",
    "slug": "club-space",
    "city": "Miami",
    "state": "FL",
    "neighborhood": "Downtown",
    "address": "34 NE 11th St",
    "lat": 25.7617,
    "lng": -80.1918,
    "cuisine": "Nightclub",
    "cuisineTags": [
      "Nightclub"
    ],
    "vibeTags": [],
    "occasionTags": [
      "group-night-out",
      "guys-night",
      "bachelor"
    ],
    "price": "$$$",
    "priceLevel": 3,
    "vibeNotes": "Legendary after-hours; sunrise terrace; techno & house",
    "sourceCredit": "TikTok"
  },
  {
    "id": "da048b07-2434-c6f3-ef0a-562a58e2f43c",
    "name": "Yardbird",
    "slug": "yardbird",
    "city": "Miami",
    "state": "FL",
    "neighborhood": "Miami Beach",
    "address": "1600 Lenox Ave",
    "lat": 25.7617,
    "lng": -80.1918,
    "cuisine": "Southern",
    "cuisineTags": [
      "Southern"
    ],
    "vibeTags": [
      "brunch"
    ],
    "occasionTags": [
      "group-night-out"
    ],
    "price": "$$$",
    "priceLevel": 3,
    "vibeNotes": "Southern comfort food; fried chicken & waffles; big group brunch",
    "sourceCredit": "Resy"
  },
  {
    "id": "93529046-0b39-105f-ad5d-0ebbaac467e7",
    "name": "Swan",
    "slug": "swan",
    "city": "Miami",
    "state": "FL",
    "neighborhood": "Design District",
    "address": "90 NE 39th St",
    "lat": 25.7617,
    "lng": -80.1918,
    "cuisine": "Mediterranean",
    "cuisineTags": [
      "Mediterranean"
    ],
    "vibeTags": [
      "late-night"
    ],
    "occasionTags": [
      "group-night-out"
    ],
    "price": "$$$",
    "priceLevel": 3,
    "vibeNotes": "Pharrell-backed; stunning Italianate villa; shareable plates",
    "sourceCredit": "Instagram"
  },
  {
    "id": "e45baff0-0309-ba93-3cee-5542ddc35fa1",
    "name": "Wynwood Marketplace",
    "slug": "wynwood-marketplace",
    "city": "Miami",
    "state": "FL",
    "neighborhood": "Wynwood",
    "address": "2250 NW 2nd Ave",
    "lat": 25.7617,
    "lng": -80.1918,
    "cuisine": "Food Hall / Bar",
    "cuisineTags": [
      "Food Hall",
      "Bar"
    ],
    "vibeTags": [
      "live-music",
      "cocktails"
    ],
    "occasionTags": [
      "group-night-out"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Open-air market; live music; cocktails; street art backdrop",
    "sourceCredit": "TikTok"
  },
  {
    "id": "6a050308-2649-d4e2-0e8c-d7d19bd1cfc1",
    "name": "Fiola Miami",
    "slug": "fiola-miami",
    "city": "Miami",
    "state": "FL",
    "neighborhood": "Coral Gables",
    "address": "1500 San Ignacio Ave",
    "lat": 25.7617,
    "lng": -80.1918,
    "cuisine": "Italian",
    "cuisineTags": [
      "Italian"
    ],
    "vibeTags": [
      "wine",
      "michelin"
    ],
    "occasionTags": [
      "in-laws"
    ],
    "price": "$$$$",
    "priceLevel": 4,
    "vibeNotes": "Michelin-pedigree Italian; white tablecloths; impressive wine list",
    "sourceCredit": "Resy"
  },
  {
    "id": "4c39da13-a9cb-f9e1-6fc4-e0be3ed7620b",
    "name": "Makoto",
    "slug": "makoto",
    "city": "Miami",
    "state": "FL",
    "neighborhood": "Bal Harbour",
    "address": "9700 Collins Ave",
    "lat": 25.7617,
    "lng": -80.1918,
    "cuisine": "Japanese",
    "cuisineTags": [
      "Japanese"
    ],
    "vibeTags": [],
    "occasionTags": [
      "in-laws"
    ],
    "price": "$$$$",
    "priceLevel": 4,
    "vibeNotes": "Bal Harbour Shops; impeccable sushi; sophisticated & refined",
    "sourceCredit": "Instagram"
  },
  {
    "id": "674ab786-6aa5-b04d-113b-3b34db0598f9",
    "name": "The Surf Club Restaurant",
    "slug": "the-surf-club-restaurant",
    "city": "Miami",
    "state": "FL",
    "neighborhood": "Surfside",
    "address": "9011 Collins Ave",
    "lat": 25.7617,
    "lng": -80.1918,
    "cuisine": "French-Italian",
    "cuisineTags": [
      "French-Italian"
    ],
    "vibeTags": [],
    "occasionTags": [
      "in-laws",
      "girls-night"
    ],
    "price": "$$$$",
    "priceLevel": 4,
    "vibeNotes": "Thomas Keller's Miami outpost; historic glamour; beachfront fine dining",
    "sourceCredit": "Michelin"
  },
  {
    "id": "3419ddf5-b722-0e02-3a26-f99e8adda535",
    "name": "Juvia",
    "slug": "juvia",
    "city": "Miami",
    "state": "FL",
    "neighborhood": "Miami Beach",
    "address": "1111 Lincoln Rd (Penthouse)",
    "lat": 25.7617,
    "lng": -80.1918,
    "cuisine": "French-Japanese-Peruvian",
    "cuisineTags": [
      "French-Japanese-Peruvian"
    ],
    "vibeTags": [
      "rooftop"
    ],
    "occasionTags": [
      "in-laws"
    ],
    "price": "$$$$",
    "priceLevel": 4,
    "vibeNotes": "Rooftop; three cuisines; stunning South Beach views",
    "sourceCredit": "TikTok"
  },
  {
    "id": "c155f2ce-7ed9-1fd1-8ce0-b42df34a0881",
    "name": "Altamura",
    "slug": "altamura",
    "city": "Miami",
    "state": "FL",
    "neighborhood": "Design District",
    "address": "166 NE 40th St",
    "lat": 25.7617,
    "lng": -80.1918,
    "cuisine": "Italian",
    "cuisineTags": [
      "Italian"
    ],
    "vibeTags": [
      "elegant"
    ],
    "occasionTags": [
      "in-laws"
    ],
    "price": "$$$",
    "priceLevel": 3,
    "vibeNotes": "Fresh pasta & Neapolitan pizza; elegant yet relaxed; crowd-pleasing",
    "sourceCredit": "Resy"
  },
  {
    "id": "1e9eb177-1bd0-c04f-7d75-11b1563c47ea",
    "name": "Doya Izakaya",
    "slug": "doya-izakaya",
    "city": "Miami",
    "state": "FL",
    "neighborhood": "South Beach",
    "address": "235 Washington Ave",
    "lat": 25.7617,
    "lng": -80.1918,
    "cuisine": "Japanese",
    "cuisineTags": [
      "Japanese"
    ],
    "vibeTags": [],
    "occasionTags": [
      "in-laws"
    ],
    "price": "$$$",
    "priceLevel": 3,
    "vibeNotes": "Sleek izakaya; robata grill; refined yet casual",
    "sourceCredit": "Instagram"
  },
  {
    "id": "8e5c4fa8-60e2-606a-1630-b8197b1fbf34",
    "name": "Double Luck Chinese",
    "slug": "double-luck-chinese",
    "city": "Miami",
    "state": "FL",
    "neighborhood": "Brickell",
    "address": "850 S Miami Ave",
    "lat": 25.7617,
    "lng": -80.1918,
    "cuisine": "Chinese",
    "cuisineTags": [
      "Chinese"
    ],
    "vibeTags": [],
    "occasionTags": [
      "girls-night"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Cool retro Chinese-American diner; neon signs; group-friendly",
    "sourceCredit": "TikTok @yumiami_"
  },
  {
    "id": "aa3d59d0-7d17-1b8a-ba75-85bd49451283",
    "name": "Komodo",
    "slug": "komodo",
    "city": "Miami",
    "state": "FL",
    "neighborhood": "Brickell",
    "address": "801 Brickell Ave",
    "lat": 25.7617,
    "lng": -80.1918,
    "cuisine": "Asian",
    "cuisineTags": [
      "Asian"
    ],
    "vibeTags": [
      "instagrammable"
    ],
    "occasionTags": [
      "girls-night",
      "group-night-out"
    ],
    "price": "$$$$",
    "priceLevel": 4,
    "vibeNotes": "3-story Southeast Asian; celebrity hotspot; Instagrammable everything",
    "sourceCredit": "Instagram"
  },
  {
    "id": "114e4786-7738-6a64-c0e6-23bfe548c9ac",
    "name": "Papi Steak",
    "slug": "papi-steak",
    "city": "Miami",
    "state": "FL",
    "neighborhood": "South Beach",
    "address": "736 1st St",
    "lat": 25.7617,
    "lng": -80.1918,
    "cuisine": "Steakhouse",
    "cuisineTags": [
      "Steakhouse"
    ],
    "vibeTags": [],
    "occasionTags": [
      "girls-night",
      "guys-night"
    ],
    "price": "$$$$",
    "priceLevel": 4,
    "vibeNotes": "Bad-boy steakhouse; gold-topped steaks; party-restaurant energy",
    "sourceCredit": "TikTok"
  },
  {
    "id": "28d2be22-f7be-5d99-ec66-061bed53b674",
    "name": "Sugar",
    "slug": "sugar",
    "city": "Miami",
    "state": "FL",
    "neighborhood": "Brickell",
    "address": "788 Brickell Plaza (rooftop)",
    "lat": 25.7617,
    "lng": -80.1918,
    "cuisine": "Rooftop Bar",
    "cuisineTags": [
      "Rooftop Bar"
    ],
    "vibeTags": [
      "rooftop",
      "cocktails",
      "sunset"
    ],
    "occasionTags": [
      "girls-night",
      "group-night-out"
    ],
    "price": "$$$",
    "priceLevel": 3,
    "vibeNotes": "EAST hotel rooftop; garden setting; skyline cocktails; sunset ritual",
    "sourceCredit": "Instagram"
  },
  {
    "id": "5996fd5f-0e2e-6499-275e-8cf412a5fac8",
    "name": "The Goodtime Hotel",
    "slug": "the-goodtime-hotel",
    "city": "Miami",
    "state": "FL",
    "neighborhood": "South Beach",
    "address": "601 Washington Ave",
    "lat": 25.7617,
    "lng": -80.1918,
    "cuisine": "Pool / Bar",
    "cuisineTags": [
      "Pool",
      "Bar"
    ],
    "vibeTags": [
      "cocktails"
    ],
    "occasionTags": [
      "girls-night"
    ],
    "price": "$$$",
    "priceLevel": 3,
    "vibeNotes": "Pharrell + David Grutman; pink-everything aesthetic; pool day + cocktails",
    "sourceCredit": "TikTok"
  },
  {
    "id": "b0597cc9-72ba-0360-bc49-facb860f735f",
    "name": "Baia Beach Club",
    "slug": "baia-beach-club",
    "city": "Miami",
    "state": "FL",
    "neighborhood": "Miami Beach",
    "address": "1 Hotel",
    "lat": 25.7617,
    "lng": -80.1918,
    "cuisine": "Beach Club",
    "cuisineTags": [
      "Beach Club"
    ],
    "vibeTags": [
      "sunset"
    ],
    "occasionTags": [
      "girls-night"
    ],
    "price": "$$$$",
    "priceLevel": 4,
    "vibeNotes": "Organic poolside dining; sunset vibes; healthy meets luxury",
    "sourceCredit": "Instagram"
  },
  {
    "id": "314089da-9f27-73dc-5fe6-3f557bd23155",
    "name": "Mila",
    "slug": "mila",
    "city": "Miami",
    "state": "FL",
    "neighborhood": "South Beach",
    "address": "1636 Meridian Ave",
    "lat": 25.7617,
    "lng": -80.1918,
    "cuisine": "Med-Asian",
    "cuisineTags": [
      "Med-Asian"
    ],
    "vibeTags": [
      "trendy",
      "rooftop",
      "cocktails"
    ],
    "occasionTags": [
      "girls-night",
      "date-night"
    ],
    "price": "$$$",
    "priceLevel": 3,
    "vibeNotes": "Rooftop MediterrAsian; stunning views; trendy cocktails",
    "sourceCredit": "TikTok"
  },
  {
    "id": "b74fd320-3e33-0948-0fec-0e230be7079e",
    "name": "Prime 112",
    "slug": "prime-112",
    "city": "Miami",
    "state": "FL",
    "neighborhood": "South Beach",
    "address": "112 Ocean Dr",
    "lat": 25.7617,
    "lng": -80.1918,
    "cuisine": "Steakhouse",
    "cuisineTags": [
      "Steakhouse"
    ],
    "vibeTags": [],
    "occasionTags": [
      "guys-night"
    ],
    "price": "$$$$",
    "priceLevel": 4,
    "vibeNotes": "Power steakhouse; celeb-packed; massive portions; classic guys dinner",
    "sourceCredit": "Resy"
  },
  {
    "id": "499a9c08-f30a-fa09-000f-10c4de5dadcc",
    "name": "Ball & Chain",
    "slug": "ball-chain",
    "city": "Miami",
    "state": "FL",
    "neighborhood": "Little Havana",
    "address": "1513 SW 8th St",
    "lat": 25.7617,
    "lng": -80.1918,
    "cuisine": "Live Music / Bar",
    "cuisineTags": [
      "Live Music",
      "Bar"
    ],
    "vibeTags": [
      "live-music",
      "cocktails"
    ],
    "occasionTags": [
      "guys-night",
      "group-night-out"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Historic salsa venue; live bands; Cuban cocktails; Calle Ocho energy",
    "sourceCredit": "TikTok"
  },
  {
    "id": "67e934e8-a83c-052a-c800-85f071093379",
    "name": "Bodega Taqueria y Tequila",
    "slug": "bodega-taqueria-y-tequila",
    "city": "Miami",
    "state": "FL",
    "neighborhood": "South Beach",
    "address": "1220 16th St",
    "lat": 25.7617,
    "lng": -80.1918,
    "cuisine": "Tacos / Nightclub",
    "cuisineTags": [
      "Tacos",
      "Nightclub"
    ],
    "vibeTags": [
      "late-night"
    ],
    "occasionTags": [
      "guys-night"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Taco stand in front; secret nightclub in back; late-night essential",
    "sourceCredit": "Instagram"
  },
  {
    "id": "bd8b24fd-dd27-3fc1-35df-a094114de19e",
    "name": "Grails",
    "slug": "grails",
    "city": "Miami",
    "state": "FL",
    "neighborhood": "Wynwood",
    "address": "2800 N Miami Ave",
    "lat": 25.7617,
    "lng": -80.1918,
    "cuisine": "Sneaker Bar",
    "cuisineTags": [
      "Sneaker Bar"
    ],
    "vibeTags": [
      "cocktails"
    ],
    "occasionTags": [
      "guys-night"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Sneaker-themed sports bar; basketball courts; craft cocktails",
    "sourceCredit": "TikTok"
  },
  {
    "id": "1cba255a-fd6c-5e54-d125-48e9ec22d2ae",
    "name": "Do Not Sit On The Furniture",
    "slug": "do-not-sit-on-the-furniture",
    "city": "Miami",
    "state": "FL",
    "neighborhood": "South Beach",
    "address": "423 16th St",
    "lat": 25.7617,
    "lng": -80.1918,
    "cuisine": "Lounge",
    "cuisineTags": [
      "Lounge"
    ],
    "vibeTags": [
      "chill",
      "intimate",
      "cocktails"
    ],
    "occasionTags": [
      "guys-night"
    ],
    "price": "$$$",
    "priceLevel": 3,
    "vibeNotes": "Intimate lounge; deep house music; craft cocktails; chill crew vibe",
    "sourceCredit": "Instagram"
  },
  {
    "id": "dc34b3ad-9a16-5748-7807-952702adb9f2",
    "name": "Blackbird Ordinary",
    "slug": "blackbird-ordinary",
    "city": "Miami",
    "state": "FL",
    "neighborhood": "Brickell",
    "address": "729 SW 1st Ave",
    "lat": 25.7617,
    "lng": -80.1918,
    "cuisine": "Bar",
    "cuisineTags": [
      "Bar"
    ],
    "vibeTags": [
      "dj",
      "cocktails",
      "late-night",
      "outdoor",
      "patio",
      "live-music"
    ],
    "occasionTags": [
      "guys-night"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Dive bar meets craft cocktails; live DJs; casual late-night",
    "sourceCredit": "Yelp"
  },
  {
    "id": "64673594-538b-9edd-81dd-a783a2810713",
    "name": "Nikki Beach",
    "slug": "nikki-beach",
    "city": "Miami",
    "state": "FL",
    "neighborhood": "South Beach",
    "address": "1 Ocean Dr",
    "lat": 25.7617,
    "lng": -80.1918,
    "cuisine": "Beach Club",
    "cuisineTags": [
      "Beach Club"
    ],
    "vibeTags": [
      "brunch"
    ],
    "occasionTags": [
      "bachelor"
    ],
    "price": "$$$",
    "priceLevel": 3,
    "vibeNotes": "Daybed parties; Sunday brunch; international crowd",
    "sourceCredit": "TikTok"
  },
  {
    "id": "312ff949-cd47-8c8e-6b02-3336534c5db1",
    "name": "Story",
    "slug": "story",
    "city": "Miami",
    "state": "FL",
    "neighborhood": "South Beach",
    "address": "136 Collins Ave",
    "lat": 25.7617,
    "lng": -80.1918,
    "cuisine": "Nightclub",
    "cuisineTags": [
      "Nightclub"
    ],
    "vibeTags": [
      "dj"
    ],
    "occasionTags": [
      "bachelor",
      "group-night-out"
    ],
    "price": "$$$$",
    "priceLevel": 4,
    "vibeNotes": "World-class DJs; immersive production; high-energy",
    "sourceCredit": "Instagram"
  },
  {
    "id": "d025007f-3d64-36a7-8215-bceec17eec1e",
    "name": "Fontainebleau Pool",
    "slug": "fontainebleau-pool",
    "city": "Miami",
    "state": "FL",
    "neighborhood": "Miami Beach",
    "address": "4441 Collins Ave",
    "lat": 25.7617,
    "lng": -80.1918,
    "cuisine": "Pool Party",
    "cuisineTags": [
      "Pool Party"
    ],
    "vibeTags": [
      "dj",
      "iconic"
    ],
    "occasionTags": [
      "bachelor"
    ],
    "price": "$$$",
    "priceLevel": 3,
    "vibeNotes": "Iconic pool scene; cabanas; DJ by the pool; all-day party",
    "sourceCredit": "TikTok"
  },
  {
    "id": "5b3c48a4-83f1-4a5e-c7b4-ec736058f578",
    "name": "Deep-Sea Fishing Charter",
    "slug": "deep-sea-fishing-charter",
    "city": "Miami",
    "state": "FL",
    "neighborhood": "Miami Beach Marina",
    "address": "300 Alton Rd",
    "lat": 25.7617,
    "lng": -80.1918,
    "cuisine": "Activity",
    "cuisineTags": [
      "Activity"
    ],
    "vibeTags": [],
    "occasionTags": [
      "bachelor"
    ],
    "price": "$$$",
    "priceLevel": 3,
    "vibeNotes": "Half-day charters; catch mahi mahi; cooler of beers; bro bonding",
    "sourceCredit": "Viator"
  },
  {
    "id": "423135f1-eec2-a4ef-f577-0addb36f0b7c",
    "name": "South Pointe Park Pier",
    "slug": "south-pointe-park-pier",
    "city": "Miami",
    "state": "FL",
    "neighborhood": "South Beach",
    "address": "1 Washington Ave",
    "lat": 25.7617,
    "lng": -80.1918,
    "cuisine": "Park / Views",
    "cuisineTags": [
      "Park",
      "Views"
    ],
    "vibeTags": [
      "sunset"
    ],
    "occasionTags": [
      "outdoor-adventure"
    ],
    "price": "Free",
    "priceLevel": 1,
    "vibeNotes": "Watch cruise ships pass; sunset spot; ocean breeze hangout",
    "sourceCredit": "Instagram"
  },
  {
    "id": "64490664-732d-c8dc-629f-e1a530411615",
    "name": "Oleta River State Park",
    "slug": "oleta-river-state-park",
    "city": "Miami",
    "state": "FL",
    "neighborhood": "North Miami Beach",
    "address": "3400 NE 163rd St",
    "lat": 25.7617,
    "lng": -80.1918,
    "cuisine": "State Park",
    "cuisineTags": [
      "State Park"
    ],
    "vibeTags": [],
    "occasionTags": [
      "outdoor-adventure"
    ],
    "price": "$",
    "priceLevel": 1,
    "vibeNotes": "Kayaking; mountain biking; mangrove trails; nature squad day",
    "sourceCredit": "TikTok"
  },
  {
    "id": "9fcf7b7f-ca98-9f41-6e1f-cf7450124dd8",
    "name": "Jet Ski Tour",
    "slug": "jet-ski-tour",
    "city": "Miami",
    "state": "FL",
    "neighborhood": "Miami Beach",
    "address": "Various marinas",
    "lat": 25.7617,
    "lng": -80.1918,
    "cuisine": "Water Activity",
    "cuisineTags": [
      "Water Activity"
    ],
    "vibeTags": [],
    "occasionTags": [
      "outdoor-adventure"
    ],
    "price": "$$$",
    "priceLevel": 3,
    "vibeNotes": "Guided jet ski tours past Star Island mansions; adrenaline group",
    "sourceCredit": "Viator"
  },
  {
    "id": "58c8a571-bc9e-01ce-9895-50447210a20b",
    "name": "Wynwood Walls",
    "slug": "wynwood-walls",
    "city": "Miami",
    "state": "FL",
    "neighborhood": "Wynwood",
    "address": "2520 NW 2nd Ave",
    "lat": 25.7617,
    "lng": -80.1918,
    "cuisine": "Street Art",
    "cuisineTags": [
      "Street Art"
    ],
    "vibeTags": [
      "outdoor"
    ],
    "occasionTags": [
      "outdoor-adventure"
    ],
    "price": "Free",
    "priceLevel": 1,
    "vibeNotes": "World-famous murals; outdoor gallery walk; content creation spot",
    "sourceCredit": "TikTok"
  },
  {
    "id": "17ad50a2-a7f9-38e1-86ff-8ccb57530aa3",
    "name": "Bayfront Park",
    "slug": "bayfront-park",
    "city": "Miami",
    "state": "FL",
    "neighborhood": "Downtown",
    "address": "301 Biscayne Blvd",
    "lat": 25.7617,
    "lng": -80.1918,
    "cuisine": "Park",
    "cuisineTags": [
      "Park"
    ],
    "vibeTags": [
      "waterfront"
    ],
    "occasionTags": [
      "outdoor-adventure"
    ],
    "price": "Free",
    "priceLevel": 1,
    "vibeNotes": "Waterfront views; food trucks; hammock garden; casual crew hang",
    "sourceCredit": "Instagram"
  },
  {
    "id": "6678c002-0ed4-ab1e-d633-c07a05d17e18",
    "name": "Virginia Key Beach",
    "slug": "virginia-key-beach",
    "city": "Miami",
    "state": "FL",
    "neighborhood": "Key Biscayne",
    "address": "4020 Virginia Beach Dr",
    "lat": 25.7617,
    "lng": -80.1918,
    "cuisine": "Beach",
    "cuisineTags": [
      "Beach"
    ],
    "vibeTags": [],
    "occasionTags": [
      "outdoor-adventure"
    ],
    "price": "$",
    "priceLevel": 1,
    "vibeNotes": "Historic beach; calmer waters; BBQ grills; less crowded crew beach day",
    "sourceCredit": "Yelp"
  },
  {
    "id": "9880f72d-a713-2f7c-7b18-3a1de813093e",
    "name": "Amaz\u00f3nico Miami",
    "slug": "amaz-nico-miami",
    "city": "Miami",
    "state": "FL",
    "neighborhood": "Brickell",
    "address": "1300 Brickell Bay Dr",
    "lat": 25.7617,
    "lng": -80.1918,
    "cuisine": "Latin-Asian Fusion",
    "cuisineTags": [
      "Latin-Asian Fusion"
    ],
    "vibeTags": [
      "viral"
    ],
    "occasionTags": [
      "date-night"
    ],
    "price": "$$$$",
    "priceLevel": 4,
    "vibeNotes": "66.2K TikTok likes; rainforest-themed; viral date night destination",
    "sourceCredit": "TikTok @elizabethmarie_xo"
  },
  {
    "id": "650ea4f8-0c63-c4ca-f555-ed91a88ebec9",
    "name": "The Setai Miami Beach",
    "slug": "the-setai-miami-beach",
    "city": "Miami",
    "state": "FL",
    "neighborhood": "South Beach",
    "address": "2001 Collins Ave",
    "lat": 25.7617,
    "lng": -80.1918,
    "cuisine": "Asian / Fine Dining",
    "cuisineTags": [
      "Asian",
      "Fine Dining"
    ],
    "vibeTags": [
      "viral"
    ],
    "occasionTags": [
      "date-night",
      "family"
    ],
    "price": "$$$$",
    "priceLevel": 4,
    "vibeNotes": "40.2K TikTok likes; oceanfront elegance; world-class sushi bar",
    "sourceCredit": "TikTok @leilaslist"
  },
  {
    "id": "29ecce76-f8a1-ca8d-9afb-738e6c4ce768",
    "name": "Oro Miami",
    "slug": "oro-miami",
    "city": "Miami",
    "state": "FL",
    "neighborhood": "Design District",
    "address": "4000 NE 2nd Ave",
    "lat": 25.7617,
    "lng": -80.1918,
    "cuisine": "Fine Dining / Nightlife",
    "cuisineTags": [
      "Fine Dining",
      "Nightlife"
    ],
    "vibeTags": [
      "dj"
    ],
    "occasionTags": [
      "date-night"
    ],
    "price": "$$$$",
    "priceLevel": 4,
    "vibeNotes": "Fine dining meets nightlife; DJ after dinner; opulent interior",
    "sourceCredit": "TikTok Miami foodie"
  },
  {
    "id": "66538716-3235-8aa8-bcb0-f1d71afb5a4d",
    "name": "Hiyakawa",
    "slug": "hiyakawa",
    "city": "Miami",
    "state": "FL",
    "neighborhood": "Wynwood",
    "address": "2700 N Miami Ave",
    "lat": 25.7617,
    "lng": -80.1918,
    "cuisine": "Japanese Omakase",
    "cuisineTags": [
      "Japanese Omakase"
    ],
    "vibeTags": [
      "hidden-gem"
    ],
    "occasionTags": [
      "date-night"
    ],
    "price": "$$$$",
    "priceLevel": 4,
    "vibeNotes": "Counter-only omakase; chef interaction; Wynwood hidden gem",
    "sourceCredit": "Eater Miami"
  },
  {
    "id": "5f4ffa1c-b235-9387-4969-eb4ff41a318d",
    "name": "Casadonna",
    "slug": "casadonna",
    "city": "Miami",
    "state": "FL",
    "neighborhood": "Coconut Grove",
    "address": "3195 Commodore Plaza",
    "lat": 25.7617,
    "lng": -80.1918,
    "cuisine": "Italian",
    "cuisineTags": [
      "Italian"
    ],
    "vibeTags": [],
    "occasionTags": [
      "date-night",
      "girls-night"
    ],
    "price": "$$$",
    "priceLevel": 3,
    "vibeNotes": "Miami Spice standout; coastal Italian; Grove romance",
    "sourceCredit": "TikTok @leilaslist"
  },
  {
    "id": "ab66512b-22e8-15e4-456b-be861fe6f016",
    "name": "Habibi on the River",
    "slug": "habibi-on-the-river",
    "city": "Miami",
    "state": "FL",
    "neighborhood": "Little Havana",
    "address": "50 SW 10th St",
    "lat": 25.7617,
    "lng": -80.1918,
    "cuisine": "Middle Eastern",
    "cuisineTags": [
      "Middle Eastern"
    ],
    "vibeTags": [
      "late-night"
    ],
    "occasionTags": [
      "date-night"
    ],
    "price": "$$$",
    "priceLevel": 3,
    "vibeNotes": "Miami River views; lantern-lit; shareable Middle Eastern plates",
    "sourceCredit": "TikTok Miami foodie"
  },
  {
    "id": "08480f4b-b9aa-4077-5835-b7bf5ed57582",
    "name": "Pari Pari Miami",
    "slug": "pari-pari-miami",
    "city": "Miami",
    "state": "FL",
    "neighborhood": "South Beach",
    "address": "930 Lincoln Rd",
    "lat": 25.7617,
    "lng": -80.1918,
    "cuisine": "Southeast Asian",
    "cuisineTags": [
      "Southeast Asian"
    ],
    "vibeTags": [
      "viral",
      "instagrammable"
    ],
    "occasionTags": [
      "group-night-out"
    ],
    "price": "$$$",
    "priceLevel": 3,
    "vibeNotes": "57.4K likes on Instagram; viral dishes; Lincoln Rd energy",
    "sourceCredit": "Instagram @elizabethelias"
  },
  {
    "id": "8483f244-ac64-2fa9-9033-a1c25f8d4abb",
    "name": "Kiki on the River",
    "slug": "kiki-on-the-river",
    "city": "Miami",
    "state": "FL",
    "neighborhood": "Miami River",
    "address": "450 NW North River Dr",
    "lat": 25.7617,
    "lng": -80.1918,
    "cuisine": "Greek",
    "cuisineTags": [
      "Greek"
    ],
    "vibeTags": [
      "waterfront",
      "late-night"
    ],
    "occasionTags": [
      "group-night-out"
    ],
    "price": "$$$",
    "priceLevel": 3,
    "vibeNotes": "Waterfront Greek party; plate-smashing Sundays; bottle-throwing vibes",
    "sourceCredit": "Eater Miami"
  },
  {
    "id": "2d07f260-e1ff-6fb6-ff20-dd935c219a02",
    "name": "Zuma Miami",
    "slug": "zuma-miami",
    "city": "Miami",
    "state": "FL",
    "neighborhood": "Downtown",
    "address": "270 Biscayne Blvd Way",
    "lat": 25.7617,
    "lng": -80.1918,
    "cuisine": "Japanese",
    "cuisineTags": [
      "Japanese"
    ],
    "vibeTags": [
      "waterfront"
    ],
    "occasionTags": [
      "family"
    ],
    "price": "$$$$",
    "priceLevel": 4,
    "vibeNotes": "Izakaya-style; robata grill; waterfront terrace; refined",
    "sourceCredit": "Michelin Guide"
  },
  {
    "id": "d5012e81-12de-a47c-43c5-c2274e87c3cc",
    "name": "Boia De",
    "slug": "boia-de",
    "city": "Miami",
    "state": "FL",
    "neighborhood": "Upper Buena Vista",
    "address": "5205 NE 2nd Ave",
    "lat": 25.7617,
    "lng": -80.1918,
    "cuisine": "Italian",
    "cuisineTags": [
      "Italian"
    ],
    "vibeTags": [
      "intimate",
      "michelin"
    ],
    "occasionTags": [
      "family"
    ],
    "price": "$$$",
    "priceLevel": 3,
    "vibeNotes": "Intimate Italian; chef-driven; Michelin Bib Gourmand",
    "sourceCredit": "Michelin Guide"
  },
  {
    "id": "29ae7fc3-b770-e336-73cc-833f7d1cd135",
    "name": "Cecconi's Miami Beach",
    "slug": "cecconi-s-miami-beach",
    "city": "Miami",
    "state": "FL",
    "neighborhood": "South Beach",
    "address": "4385 Collins Ave",
    "lat": 25.7617,
    "lng": -80.1918,
    "cuisine": "Italian",
    "cuisineTags": [
      "Italian"
    ],
    "vibeTags": [
      "elegant"
    ],
    "occasionTags": [
      "family"
    ],
    "price": "$$$",
    "priceLevel": 3,
    "vibeNotes": "Soho Beach House Italian; garden terrace; elegant casual",
    "sourceCredit": "Eater Miami"
  },
  {
    "id": "c1f75534-e91b-c0e9-6242-3901b2d2ce5d",
    "name": "Joe's Stone Crab",
    "slug": "joe-s-stone-crab",
    "city": "Miami",
    "state": "FL",
    "neighborhood": "South Beach",
    "address": "11 Washington Ave",
    "lat": 25.7617,
    "lng": -80.1918,
    "cuisine": "Seafood",
    "cuisineTags": [
      "Seafood"
    ],
    "vibeTags": [],
    "occasionTags": [
      "family"
    ],
    "price": "$$$$",
    "priceLevel": 4,
    "vibeNotes": "Miami institution since 1913; stone crabs; legendary key lime pie",
    "sourceCredit": "Classic Miami"
  },
  {
    "id": "e177cbe0-7aab-0d5f-5ec6-aa21c1f09a5c",
    "name": "Carpaccio",
    "slug": "carpaccio",
    "city": "Miami",
    "state": "FL",
    "neighborhood": "Bal Harbour",
    "address": "9700 Collins Ave",
    "lat": 25.7617,
    "lng": -80.1918,
    "cuisine": "Italian",
    "cuisineTags": [
      "Italian"
    ],
    "vibeTags": [],
    "occasionTags": [
      "family"
    ],
    "price": "$$$",
    "priceLevel": 3,
    "vibeNotes": "Bal Harbour Shops; classic Italian; family favorite for 30+ years",
    "sourceCredit": "Miami Herald"
  },
  {
    "id": "32eacac3-5c7d-acab-4697-95cc355415e7",
    "name": "Lido Restaurant",
    "slug": "lido-restaurant",
    "city": "Miami",
    "state": "FL",
    "neighborhood": "Mid-Beach",
    "address": "4041 Collins Ave",
    "lat": 25.7617,
    "lng": -80.1918,
    "cuisine": "Mediterranean",
    "cuisineTags": [
      "Mediterranean"
    ],
    "vibeTags": [],
    "occasionTags": [
      "family"
    ],
    "price": "$$$",
    "priceLevel": 3,
    "vibeNotes": "Standard Spa pool-side; healthy Med; serene setting",
    "sourceCredit": "Eater Miami"
  },
  {
    "id": "2ef5024a-5635-10ef-49ad-e36b72197805",
    "name": "Mandolin Aegean Bistro",
    "slug": "mandolin-aegean-bistro",
    "city": "Miami",
    "state": "FL",
    "neighborhood": "Design District",
    "address": "4312 NE 2nd Ave",
    "lat": 25.7617,
    "lng": -80.1918,
    "cuisine": "Greek-Turkish",
    "cuisineTags": [
      "Greek-Turkish"
    ],
    "vibeTags": [],
    "occasionTags": [
      "family"
    ],
    "price": "$$$",
    "priceLevel": 3,
    "vibeNotes": "Garden courtyard; rustic Mediterranean; warm hospitality",
    "sourceCredit": "Eater Miami"
  },
  {
    "id": "2b772e86-bd79-730a-4c46-55ceb6a87414",
    "name": "Swan & Bar Bevy",
    "slug": "swan-bar-bevy",
    "city": "Miami",
    "state": "FL",
    "neighborhood": "Design District",
    "address": "90 NE 39th St",
    "lat": 25.7617,
    "lng": -80.1918,
    "cuisine": "Mediterranean / Lounge",
    "cuisineTags": [
      "Mediterranean",
      "Lounge"
    ],
    "vibeTags": [],
    "occasionTags": [
      "girls-night"
    ],
    "price": "$$$",
    "priceLevel": 3,
    "vibeNotes": "Pharrell's restaurant; Design District chic; people-watching",
    "sourceCredit": "Eater Miami"
  },
  {
    "id": "299f1f7a-0195-9e3a-3e71-0e65bc85d842",
    "name": "Sweet Liberty",
    "slug": "sweet-liberty",
    "city": "Miami",
    "state": "FL",
    "neighborhood": "South Beach",
    "address": "237 20th St",
    "lat": 25.7617,
    "lng": -80.1918,
    "cuisine": "Cocktail Bar",
    "cuisineTags": [
      "Cocktail Bar"
    ],
    "vibeTags": [
      "patio",
      "cocktails"
    ],
    "occasionTags": [
      "girls-night"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Award-winning cocktails; lively patio; local favorite",
    "sourceCredit": "World's 50 Best Bars"
  },
  {
    "id": "e962c620-4fa9-81d9-8f4e-860c7c923b23",
    "name": "Brickell City Centre",
    "slug": "brickell-city-centre",
    "city": "Miami",
    "state": "FL",
    "neighborhood": "Brickell",
    "address": "701 S Miami Ave",
    "lat": 25.7617,
    "lng": -80.1918,
    "cuisine": "Shopping / Dining",
    "cuisineTags": [
      "Shopping",
      "Dining"
    ],
    "vibeTags": [],
    "occasionTags": [
      "girls-night"
    ],
    "price": "$$-$$$",
    "priceLevel": 4,
    "vibeNotes": "Luxury shopping + multiple restaurants; day-to-night",
    "sourceCredit": "Visit Miami"
  },
  {
    "id": "717b12ab-3288-6e28-f0d7-ed98c0c7f7d1",
    "name": "Wynwood Walls + Bars",
    "slug": "wynwood-walls-bars",
    "city": "Miami",
    "state": "FL",
    "neighborhood": "Wynwood",
    "address": "NW 2nd Ave",
    "lat": 25.7617,
    "lng": -80.1918,
    "cuisine": "Art / Bar Crawl",
    "cuisineTags": [
      "Art",
      "Bar Crawl"
    ],
    "vibeTags": [],
    "occasionTags": [
      "girls-night"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Street art + bar hop; Astra + Brick + Lagniappe; creative energy",
    "sourceCredit": "Visit Miami"
  },
  {
    "id": "4245fade-5aa0-326b-12f1-5a9f1397c18f",
    "name": "Bourbon Steak",
    "slug": "bourbon-steak",
    "city": "Miami",
    "state": "FL",
    "neighborhood": "Aventura",
    "address": "19999 W Country Club Dr",
    "lat": 25.7617,
    "lng": -80.1918,
    "cuisine": "Steakhouse",
    "cuisineTags": [
      "Steakhouse"
    ],
    "vibeTags": [],
    "occasionTags": [
      "guys-night"
    ],
    "price": "$$$$",
    "priceLevel": 4,
    "vibeNotes": "Michael Mina; JW Marriott Turnberry; premium cuts + bourbon",
    "sourceCredit": "Michelin Guide"
  },
  {
    "id": "f0acc957-3568-9665-a2d2-b390e31dc1b4",
    "name": "Bodega Taqueria",
    "slug": "bodega-taqueria",
    "city": "Miami",
    "state": "FL",
    "neighborhood": "South Beach",
    "address": "1220 16th St",
    "lat": 25.7617,
    "lng": -80.1918,
    "cuisine": "Tacos / Hidden Bar",
    "cuisineTags": [
      "Tacos",
      "Hidden Bar"
    ],
    "vibeTags": [
      "hidden-gem"
    ],
    "occasionTags": [
      "guys-night"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Taco window + hidden speakeasy behind porta-potty door",
    "sourceCredit": "Eater Miami"
  },
  {
    "id": "9d7d7ce9-03a3-be6a-733b-f1aa07918650",
    "name": "The Wharf Miami",
    "slug": "the-wharf-miami",
    "city": "Miami",
    "state": "FL",
    "neighborhood": "Miami River",
    "address": "114 SW North River Dr",
    "lat": 25.7617,
    "lng": -80.1918,
    "cuisine": "Waterfront Bar",
    "cuisineTags": [
      "Waterfront Bar"
    ],
    "vibeTags": [
      "chill",
      "waterfront",
      "live-music",
      "dj"
    ],
    "occasionTags": [
      "guys-night",
      "bachelor"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Open-air waterfront bar; food trucks; live music; chill vibes",
    "sourceCredit": "TimeOut Miami"
  },
  {
    "id": "711b17b0-6491-4fa0-3cdf-535171af3d85",
    "name": "Lost Boy",
    "slug": "lost-boy",
    "city": "Miami",
    "state": "FL",
    "neighborhood": "Downtown",
    "address": "157 E Flagler St",
    "lat": 25.7617,
    "lng": -80.1918,
    "cuisine": "Dive Bar",
    "cuisineTags": [
      "Dive Bar"
    ],
    "vibeTags": [
      "late-night"
    ],
    "occasionTags": [
      "guys-night"
    ],
    "price": "$",
    "priceLevel": 1,
    "vibeNotes": "Beloved downtown dive; cheap drinks; local crowd; late hours",
    "sourceCredit": "Eater Miami"
  },
  {
    "id": "0418dc82-79d8-c8e9-c36b-7b6e088a3bbb",
    "name": "Deep Fishing Charter",
    "slug": "deep-fishing-charter",
    "city": "Miami",
    "state": "FL",
    "neighborhood": "Miami Beach Marina",
    "address": "300 Alton Rd",
    "lat": 25.7617,
    "lng": -80.1918,
    "cuisine": "Fishing / Activity",
    "cuisineTags": [
      "Fishing",
      "Activity"
    ],
    "vibeTags": [],
    "occasionTags": [
      "bachelor"
    ],
    "price": "$$$",
    "priceLevel": 3,
    "vibeNotes": "Half-day deep-sea fishing; group charter; catch mahi + tuna",
    "sourceCredit": "Visit Miami"
  },
  {
    "id": "92606c04-90cf-8ac3-b2cb-eac25d7b5edb",
    "name": "Jet Ski Rentals",
    "slug": "jet-ski-rentals",
    "city": "Miami",
    "state": "FL",
    "neighborhood": "Virginia Key",
    "address": "Rickenbacker Causeway",
    "lat": 25.7617,
    "lng": -80.1918,
    "cuisine": "Water Sports",
    "cuisineTags": [
      "Water Sports"
    ],
    "vibeTags": [],
    "occasionTags": [
      "bachelor"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Jet ski Biscayne Bay; see the skyline from the water",
    "sourceCredit": "Visit Miami"
  },
  {
    "id": "5162c6ee-4730-e4f9-0090-9fb74d351796",
    "name": "South Pointe Park",
    "slug": "south-pointe-park",
    "city": "Miami",
    "state": "FL",
    "neighborhood": "South Beach",
    "address": "1 Washington Ave",
    "lat": 25.7617,
    "lng": -80.1918,
    "cuisine": "Park / Beach",
    "cuisineTags": [
      "Park",
      "Beach"
    ],
    "vibeTags": [
      "sunset"
    ],
    "occasionTags": [
      "outdoor-adventure"
    ],
    "price": "Free",
    "priceLevel": 1,
    "vibeNotes": "Tip of SoBe; watch cruise ships pass; sunset views",
    "sourceCredit": "Visit Miami"
  },
  {
    "id": "523d17fb-a52f-7481-660d-b56dfd13ff34",
    "name": "Vizcaya Museum",
    "slug": "vizcaya-museum",
    "city": "Miami",
    "state": "FL",
    "neighborhood": "Coconut Grove",
    "address": "3251 S Miami Ave",
    "lat": 25.7617,
    "lng": -80.1918,
    "cuisine": "Museum / Gardens",
    "cuisineTags": [
      "Museum",
      "Gardens"
    ],
    "vibeTags": [
      "waterfront"
    ],
    "occasionTags": [
      "outdoor-adventure"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Italian Renaissance villa; waterfront gardens; stunning photo ops",
    "sourceCredit": "Visit Miami"
  },
  {
    "id": "5aadcc39-0095-d17e-eff6-83de5169196b",
    "name": "Key Biscayne Beach",
    "slug": "key-biscayne-beach",
    "city": "Miami",
    "state": "FL",
    "neighborhood": "Key Biscayne",
    "address": "Crandon Blvd",
    "lat": 25.7617,
    "lng": -80.1918,
    "cuisine": "Beach / Nature",
    "cuisineTags": [
      "Beach",
      "Nature"
    ],
    "vibeTags": [],
    "occasionTags": [
      "outdoor-adventure"
    ],
    "price": "$",
    "priceLevel": 1,
    "vibeNotes": "Pristine beach; calm waters; Bill Baggs lighthouse; picnic spots",
    "sourceCredit": "Visit Miami"
  },
  {
    "id": "cf711952-0533-8e02-da30-30afad3ba95e",
    "name": "Everglades National Park",
    "slug": "everglades-national-park",
    "city": "Miami",
    "state": "FL",
    "neighborhood": "Homestead",
    "address": "40001 State Rd 9336",
    "lat": 25.7617,
    "lng": -80.1918,
    "cuisine": "National Park",
    "cuisineTags": [
      "National Park"
    ],
    "vibeTags": [],
    "occasionTags": [
      "outdoor-adventure"
    ],
    "price": "$",
    "priceLevel": 1,
    "vibeNotes": "Airboat tours; gator spotting; unique ecosystem; day trip",
    "sourceCredit": "NPS"
  },
  {
    "id": "e03f9fbd-5e9e-f905-d565-1bacfc0e52c5",
    "name": "Coconut Grove",
    "slug": "coconut-grove",
    "city": "Miami",
    "state": "FL",
    "neighborhood": "Coconut Grove",
    "address": "Main Hwy",
    "lat": 25.7617,
    "lng": -80.1918,
    "cuisine": "Walkable Village",
    "cuisineTags": [
      "Walkable Village"
    ],
    "vibeTags": [],
    "occasionTags": [
      "outdoor-adventure"
    ],
    "price": "Free",
    "priceLevel": 1,
    "vibeNotes": "Bayfront village; CocoWalk; parks; local boutiques + cafes",
    "sourceCredit": "Visit Miami"
  },
  {
    "id": "4a6f984a-f06e-b405-f4c2-74cd4486b0d1",
    "name": "Biscayne Bay Boat Tour",
    "slug": "biscayne-bay-boat-tour",
    "city": "Miami",
    "state": "FL",
    "neighborhood": "Downtown",
    "address": "Bayside Marketplace",
    "lat": 25.7617,
    "lng": -80.1918,
    "cuisine": "Boat Tour",
    "cuisineTags": [
      "Boat Tour"
    ],
    "vibeTags": [],
    "occasionTags": [
      "outdoor-adventure"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Celeb home tours; skyline views; Biscayne Bay cruise",
    "sourceCredit": "Visit Miami"
  },
  {
    "id": "82ea40f8-6a56-4ba0-3eb3-ea167637eab1",
    "name": "The Eighty Six",
    "slug": "the-eighty-six",
    "city": "New York",
    "state": "NY",
    "neighborhood": "West Village",
    "address": "86 Bedford St",
    "lat": 40.7128,
    "lng": -74.006,
    "cuisine": "New American",
    "cuisineTags": [
      "New American"
    ],
    "vibeTags": [
      "intimate",
      "viral"
    ],
    "occasionTags": [
      "date-night"
    ],
    "price": "$$$$",
    "priceLevel": 4,
    "vibeNotes": "#1 rated new restaurant on Beli; 5.4K TikTok likes; intimate",
    "sourceCredit": "TikTok @hungryinmanhattan"
  },
  {
    "id": "3e4d1349-a02e-fd84-6465-a35496846b59",
    "name": "Chez Fifi",
    "slug": "chez-fifi",
    "city": "New York",
    "state": "NY",
    "neighborhood": "Upper East Side",
    "address": "1362 Lexington Ave",
    "lat": 40.7128,
    "lng": -74.006,
    "cuisine": "French Bistro",
    "cuisineTags": [
      "French Bistro"
    ],
    "vibeTags": [
      "viral",
      "romantic"
    ],
    "occasionTags": [
      "date-night",
      "girls-night"
    ],
    "price": "$$$$",
    "priceLevel": 4,
    "vibeNotes": "#1 French bistro in NYC; TikTok viral; gorgeous space",
    "sourceCredit": "TikTok @beli_eats"
  },
  {
    "id": "02927d11-ce4f-295e-5776-43cf693da3e6",
    "name": "Atomix",
    "slug": "atomix",
    "city": "New York",
    "state": "NY",
    "neighborhood": "Nomad",
    "address": "104 E 30th St",
    "lat": 40.7128,
    "lng": -74.006,
    "cuisine": "Korean Tasting Menu",
    "cuisineTags": [
      "Korean Tasting Menu"
    ],
    "vibeTags": [
      "michelin"
    ],
    "occasionTags": [
      "date-night"
    ],
    "price": "$$$$",
    "priceLevel": 4,
    "vibeNotes": "#1 restaurant in North America; 2 Michelin stars; 14-seat counter",
    "sourceCredit": "World's 50 Best"
  },
  {
    "id": "48510b1c-f9d5-3b92-f8c1-f6f3949596c8",
    "name": "Swoony's",
    "slug": "swoony-s",
    "city": "New York",
    "state": "NY",
    "neighborhood": "West Village",
    "address": "107 Greenwich Ave",
    "lat": 40.7128,
    "lng": -74.006,
    "cuisine": "Italian",
    "cuisineTags": [
      "Italian"
    ],
    "vibeTags": [],
    "occasionTags": [
      "date-night"
    ],
    "price": "$$$$",
    "priceLevel": 4,
    "vibeNotes": "New Village Italian; white tablecloth; Resy hottest list 2025",
    "sourceCredit": "Resy / Eater NY"
  },
  {
    "id": "ac13691c-8e67-feb6-377a-303faa9afe5d",
    "name": "Le Coucou",
    "slug": "le-coucou",
    "city": "New York",
    "state": "NY",
    "neighborhood": "Nolita",
    "address": "138 Lafayette St",
    "lat": 40.7128,
    "lng": -74.006,
    "cuisine": "French",
    "cuisineTags": [
      "French"
    ],
    "vibeTags": [
      "michelin"
    ],
    "occasionTags": [
      "date-night"
    ],
    "price": "$$$$",
    "priceLevel": 4,
    "vibeNotes": "Michelin-starred French; Daniel Rose; stunning Nolita space",
    "sourceCredit": "Michelin Guide"
  },
  {
    "id": "955b92fa-73ab-5551-1435-deeea907efc5",
    "name": "Don Angie",
    "slug": "don-angie",
    "city": "New York",
    "state": "NY",
    "neighborhood": "West Village",
    "address": "103 Greenwich Ave",
    "lat": 40.7128,
    "lng": -74.006,
    "cuisine": "Italian-American",
    "cuisineTags": [
      "Italian-American"
    ],
    "vibeTags": [],
    "occasionTags": [
      "date-night"
    ],
    "price": "$$$",
    "priceLevel": 3,
    "vibeNotes": "Pinwheel lasagna fame; always packed; red-sauce reimagined",
    "sourceCredit": "Eater NY"
  },
  {
    "id": "e8c74f18-4f4f-793b-9bed-9aa7a963d46f",
    "name": "One if by Land, Two if by Sea",
    "slug": "one-if-by-land-two-if-by-sea",
    "city": "New York",
    "state": "NY",
    "neighborhood": "West Village",
    "address": "17 Barrow St",
    "lat": 40.7128,
    "lng": -74.006,
    "cuisine": "American Fine Dining",
    "cuisineTags": [
      "American Fine Dining"
    ],
    "vibeTags": [
      "romantic"
    ],
    "occasionTags": [
      "date-night"
    ],
    "price": "$$$$",
    "priceLevel": 4,
    "vibeNotes": "Most romantic restaurant in NYC; carriage house; piano",
    "sourceCredit": "Classic NYC"
  },
  {
    "id": "a56eb919-413d-7909-9c36-26d6fc1b9c06",
    "name": "PDT (Please Don't Tell)",
    "slug": "pdt-please-don-t-tell",
    "city": "New York",
    "state": "NY",
    "neighborhood": "East Village",
    "address": "113 St Marks Pl",
    "lat": 40.7128,
    "lng": -74.006,
    "cuisine": "Speakeasy",
    "cuisineTags": [
      "Speakeasy"
    ],
    "vibeTags": [
      "cocktails"
    ],
    "occasionTags": [
      "date-night"
    ],
    "price": "$$$",
    "priceLevel": 3,
    "vibeNotes": "Enter through phone booth at Crif Dogs; legendary cocktails",
    "sourceCredit": "World's 50 Best Bars"
  },
  {
    "id": "14e23a6b-e0c0-72ea-92ab-5e8e3f4acbc2",
    "name": "Marquee",
    "slug": "marquee",
    "city": "New York",
    "state": "NY",
    "neighborhood": "Chelsea",
    "address": "289 10th Ave",
    "lat": 40.7128,
    "lng": -74.006,
    "cuisine": "Nightclub",
    "cuisineTags": [
      "Nightclub"
    ],
    "vibeTags": [
      "dj"
    ],
    "occasionTags": [
      "group-night-out",
      "bachelor"
    ],
    "price": "$$$$",
    "priceLevel": 4,
    "vibeNotes": "Reopened; mega-club; bottle service; A-list DJs",
    "sourceCredit": "TimeOut NY"
  },
  {
    "id": "339a9eef-a296-4021-0906-92fb9940f3a8",
    "name": "Brooklyn Mirage",
    "slug": "brooklyn-mirage",
    "city": "New York",
    "state": "NY",
    "neighborhood": "Brooklyn",
    "address": "140 Stewart Ave",
    "lat": 40.7128,
    "lng": -74.006,
    "cuisine": "Nightclub-Venue",
    "cuisineTags": [
      "Nightclub-Venue"
    ],
    "vibeTags": [
      "outdoor",
      "dj"
    ],
    "occasionTags": [
      "group-night-out",
      "bachelor"
    ],
    "price": "$$$",
    "priceLevel": 3,
    "vibeNotes": "Renovated open-air venue; world-class production; summer essential",
    "sourceCredit": "DJ Mag"
  },
  {
    "id": "6e44e876-f021-946a-7645-3df34c88d51c",
    "name": "Lavo",
    "slug": "lavo",
    "city": "New York",
    "state": "NY",
    "neighborhood": "Midtown",
    "address": "39 E 58th St",
    "lat": 40.7128,
    "lng": -74.006,
    "cuisine": "Italian-Nightlife",
    "cuisineTags": [
      "Italian-Nightlife"
    ],
    "vibeTags": [
      "brunch"
    ],
    "occasionTags": [
      "group-night-out"
    ],
    "price": "$$$$",
    "priceLevel": 4,
    "vibeNotes": "Italian dinner \u2192 nightclub; Saturday brunch party legendary",
    "sourceCredit": "Eater NY"
  },
  {
    "id": "84ea4a7a-ef72-8c57-4809-08f1c60bb9b1",
    "name": "Catch",
    "slug": "catch",
    "city": "New York",
    "state": "NY",
    "neighborhood": "Meatpacking",
    "address": "21 9th Ave",
    "lat": 40.7128,
    "lng": -74.006,
    "cuisine": "Seafood-Rooftop",
    "cuisineTags": [
      "Seafood-Rooftop"
    ],
    "vibeTags": [
      "rooftop"
    ],
    "occasionTags": [
      "group-night-out"
    ],
    "price": "$$$$",
    "priceLevel": 4,
    "vibeNotes": "Multi-level rooftop seafood; celebrity hotspot; great for groups",
    "sourceCredit": "Eater NY"
  },
  {
    "id": "56dd0142-e526-c939-87af-182759dba3b8",
    "name": "TAO Downtown",
    "slug": "tao-downtown",
    "city": "New York",
    "state": "NY",
    "neighborhood": "Chelsea",
    "address": "92 9th Ave",
    "lat": 40.7128,
    "lng": -74.006,
    "cuisine": "Asian-Nightlife",
    "cuisineTags": [
      "Asian-Nightlife"
    ],
    "vibeTags": [
      "late-night"
    ],
    "occasionTags": [
      "group-night-out"
    ],
    "price": "$$$$",
    "priceLevel": 4,
    "vibeNotes": "Buddha statue; pan-Asian; transitions to club late night",
    "sourceCredit": "Eater NY"
  },
  {
    "id": "d19e5748-3265-8836-0818-63e8c6454da8",
    "name": "Output Brooklyn",
    "slug": "output-brooklyn",
    "city": "New York",
    "state": "NY",
    "neighborhood": "Williamsburg",
    "address": "Various",
    "lat": 40.7128,
    "lng": -74.006,
    "cuisine": "Nightlife",
    "cuisineTags": [
      "Nightlife"
    ],
    "vibeTags": [
      "rooftop",
      "dance"
    ],
    "occasionTags": [
      "group-night-out"
    ],
    "price": "$$$",
    "priceLevel": 3,
    "vibeNotes": "Underground dance music; rooftop; Brooklyn nightlife staple",
    "sourceCredit": "TimeOut NY"
  },
  {
    "id": "fb66ca30-7927-9c42-7ee2-5e57d75ffbba",
    "name": "230 Fifth Rooftop",
    "slug": "230-fifth-rooftop",
    "city": "New York",
    "state": "NY",
    "neighborhood": "Flatiron",
    "address": "230 5th Ave",
    "lat": 40.7128,
    "lng": -74.006,
    "cuisine": "Rooftop Bar",
    "cuisineTags": [
      "Rooftop Bar"
    ],
    "vibeTags": [
      "rooftop"
    ],
    "occasionTags": [
      "group-night-out"
    ],
    "price": "$$$",
    "priceLevel": 3,
    "vibeNotes": "Empire State views; huge rooftop; group photo ops",
    "sourceCredit": "TimeOut NY"
  },
  {
    "id": "5fc0add0-2422-e5ef-fd29-3cb6d2b8a2eb",
    "name": "Los Tacos No. 1",
    "slug": "los-tacos-no-1",
    "city": "New York",
    "state": "NY",
    "neighborhood": "Chelsea Market",
    "address": "75 9th Ave",
    "lat": 40.7128,
    "lng": -74.006,
    "cuisine": "Tacos",
    "cuisineTags": [
      "Tacos"
    ],
    "vibeTags": [],
    "occasionTags": [
      "group-night-out"
    ],
    "price": "$",
    "priceLevel": 1,
    "vibeNotes": "Best tacos in NYC; quick fuel before going out",
    "sourceCredit": "Eater NY"
  },
  {
    "id": "fe2937b5-eade-af04-1126-feb7cbad820d",
    "name": "Le Bernardin",
    "slug": "le-bernardin",
    "city": "New York",
    "state": "NY",
    "neighborhood": "Midtown",
    "address": "155 W 51st St",
    "lat": 40.7128,
    "lng": -74.006,
    "cuisine": "French Seafood",
    "cuisineTags": [
      "French Seafood"
    ],
    "vibeTags": [
      "michelin"
    ],
    "occasionTags": [
      "family"
    ],
    "price": "$$$$",
    "priceLevel": 4,
    "vibeNotes": "3 Michelin stars; Eric Ripert; impress anyone alive",
    "sourceCredit": "Michelin Guide"
  },
  {
    "id": "3e32d06c-45c8-a887-5549-da603ed6978f",
    "name": "Peter Luger",
    "slug": "peter-luger",
    "city": "New York",
    "state": "NY",
    "neighborhood": "Williamsburg",
    "address": "178 Broadway",
    "lat": 40.7128,
    "lng": -74.006,
    "cuisine": "Steakhouse",
    "cuisineTags": [
      "Steakhouse"
    ],
    "vibeTags": [],
    "occasionTags": [
      "family",
      "guys-night"
    ],
    "price": "$$$$",
    "priceLevel": 4,
    "vibeNotes": "Brooklyn institution since 1887; porterhouse for two; cash only",
    "sourceCredit": "Classic NYC"
  },
  {
    "id": "a30217e2-5bd8-c4cc-658a-c13623c3af77",
    "name": "Daniel",
    "slug": "daniel",
    "city": "New York",
    "state": "NY",
    "neighborhood": "Upper East Side",
    "address": "60 E 65th St",
    "lat": 40.7128,
    "lng": -74.006,
    "cuisine": "French",
    "cuisineTags": [
      "French"
    ],
    "vibeTags": [
      "michelin"
    ],
    "occasionTags": [
      "family"
    ],
    "price": "$$$$",
    "priceLevel": 4,
    "vibeNotes": "Daniel Boulud flagship; UES elegance; Michelin-starred",
    "sourceCredit": "Michelin Guide"
  },
  {
    "id": "980f0d4c-1b77-037c-0b57-20bfb9d65e94",
    "name": "Gramercy Tavern",
    "slug": "gramercy-tavern",
    "city": "New York",
    "state": "NY",
    "neighborhood": "Gramercy",
    "address": "42 E 20th St",
    "lat": 40.7128,
    "lng": -74.006,
    "cuisine": "New American",
    "cuisineTags": [
      "New American"
    ],
    "vibeTags": [],
    "occasionTags": [
      "family"
    ],
    "price": "$$$$",
    "priceLevel": 4,
    "vibeNotes": "Danny Meyer classic; seasonal prix fixe; warm hospitality",
    "sourceCredit": "Eater NY"
  },
  {
    "id": "15fcf70f-5100-4ce6-2df8-b1315bff5ee7",
    "name": "Carbone",
    "slug": "carbone",
    "city": "New York",
    "state": "NY",
    "neighborhood": "Greenwich Village",
    "address": "181 Thompson St",
    "lat": 40.7128,
    "lng": -74.006,
    "cuisine": "Italian-American",
    "cuisineTags": [
      "Italian-American"
    ],
    "vibeTags": [],
    "occasionTags": [
      "family"
    ],
    "price": "$$$$",
    "priceLevel": 4,
    "vibeNotes": "Celeb-magnet; retro Italian-American; veal parm legend",
    "sourceCredit": "Eater NY"
  },
  {
    "id": "8f13f67c-2691-cdbf-cd27-b91f9c55a625",
    "name": "The River Cafe",
    "slug": "the-river-cafe",
    "city": "New York",
    "state": "NY",
    "neighborhood": "Brooklyn",
    "address": "1 Water St",
    "lat": 40.7128,
    "lng": -74.006,
    "cuisine": "American",
    "cuisineTags": [
      "American"
    ],
    "vibeTags": [
      "iconic"
    ],
    "occasionTags": [
      "family"
    ],
    "price": "$$$$",
    "priceLevel": 4,
    "vibeNotes": "Under Brooklyn Bridge; Manhattan skyline; iconic views",
    "sourceCredit": "Classic NYC"
  },
  {
    "id": "ae851096-bcd9-500c-3dbb-3a8468d99596",
    "name": "Eleven Madison Park",
    "slug": "eleven-madison-park",
    "city": "New York",
    "state": "NY",
    "neighborhood": "Flatiron",
    "address": "11 Madison Ave",
    "lat": 40.7128,
    "lng": -74.006,
    "cuisine": "Plant-Based Tasting",
    "cuisineTags": [
      "Plant-Based Tasting"
    ],
    "vibeTags": [],
    "occasionTags": [
      "family"
    ],
    "price": "$$$$",
    "priceLevel": 4,
    "vibeNotes": "Plant-based fine dining; stunning space; Art Deco elegance",
    "sourceCredit": "World's 50 Best"
  },
  {
    "id": "8395d46e-7130-e67f-19f0-ebfbfea7e42d",
    "name": "Il Mulino",
    "slug": "il-mulino",
    "city": "New York",
    "state": "NY",
    "neighborhood": "Greenwich Village",
    "address": "86 W 3rd St",
    "lat": 40.7128,
    "lng": -74.006,
    "cuisine": "Italian",
    "cuisineTags": [
      "Italian"
    ],
    "vibeTags": [],
    "occasionTags": [
      "family"
    ],
    "price": "$$$$",
    "priceLevel": 4,
    "vibeNotes": "Old-guard Italian fine dining; complimentary antipasti parade",
    "sourceCredit": "Classic NYC"
  },
  {
    "id": "3e7f9c95-5c37-6868-f5a7-006a9991ae5a",
    "name": "Attaboy",
    "slug": "attaboy",
    "city": "New York",
    "state": "NY",
    "neighborhood": "Lower East Side",
    "address": "134 Eldridge St",
    "lat": 40.7128,
    "lng": -74.006,
    "cuisine": "Speakeasy",
    "cuisineTags": [
      "Speakeasy"
    ],
    "vibeTags": [],
    "occasionTags": [
      "girls-night"
    ],
    "price": "$$$",
    "priceLevel": 3,
    "vibeNotes": "No menu; bartender reads your mood; World's 50 Best Bars",
    "sourceCredit": "World's 50 Best Bars"
  },
  {
    "id": "d7631e81-93df-88dd-e43e-f45e19eb80f8",
    "name": "Beauty & Essex",
    "slug": "beauty-essex",
    "city": "New York",
    "state": "NY",
    "neighborhood": "Lower East Side",
    "address": "146 Essex St",
    "lat": 40.7128,
    "lng": -74.006,
    "cuisine": "American-Lounge",
    "cuisineTags": [
      "American-Lounge"
    ],
    "vibeTags": [],
    "occasionTags": [
      "girls-night"
    ],
    "price": "$$$",
    "priceLevel": 3,
    "vibeNotes": "Enter through pawn shop; multi-level; champagne lounge",
    "sourceCredit": "Eater NY"
  },
  {
    "id": "1a6e9921-506a-fb53-a209-ed16f489194f",
    "name": "Catch Rooftop",
    "slug": "catch-rooftop",
    "city": "New York",
    "state": "NY",
    "neighborhood": "Meatpacking",
    "address": "21 9th Ave",
    "lat": 40.7128,
    "lng": -74.006,
    "cuisine": "Rooftop-Seafood",
    "cuisineTags": [
      "Rooftop-Seafood"
    ],
    "vibeTags": [
      "rooftop"
    ],
    "occasionTags": [
      "girls-night"
    ],
    "price": "$$$$",
    "priceLevel": 4,
    "vibeNotes": "Meatpacking rooftop; celeb sightings; stunning views",
    "sourceCredit": "Eater NY"
  },
  {
    "id": "5202bfb3-7581-4f63-d27a-1f0341fe2540",
    "name": "Dante",
    "slug": "dante",
    "city": "New York",
    "state": "NY",
    "neighborhood": "Greenwich Village",
    "address": "79 MacDougal St",
    "lat": 40.7128,
    "lng": -74.006,
    "cuisine": "Italian Cafe-Bar",
    "cuisineTags": [
      "Italian Cafe-Bar"
    ],
    "vibeTags": [],
    "occasionTags": [
      "girls-night"
    ],
    "price": "$$$",
    "priceLevel": 3,
    "vibeNotes": "World's Best Bar multiple times; negronis; chic",
    "sourceCredit": "World's 50 Best Bars"
  },
  {
    "id": "996d58a1-42f7-4645-cf45-222264d5eba6",
    "name": "Buddakan",
    "slug": "buddakan",
    "city": "New York",
    "state": "NY",
    "neighborhood": "Chelsea",
    "address": "75 9th Ave",
    "lat": 40.7128,
    "lng": -74.006,
    "cuisine": "Asian",
    "cuisineTags": [
      "Asian"
    ],
    "vibeTags": [
      "cocktails"
    ],
    "occasionTags": [
      "girls-night"
    ],
    "price": "$$$",
    "priceLevel": 3,
    "vibeNotes": "Dramatic dining room; communal table; dim sum + cocktails",
    "sourceCredit": "Eater NY"
  },
  {
    "id": "8a554c1c-1006-454b-b674-11b97ef01514",
    "name": "The Blond",
    "slug": "the-blond",
    "city": "New York",
    "state": "NY",
    "neighborhood": "SoHo",
    "address": "11 Howard St",
    "lat": 40.7128,
    "lng": -74.006,
    "cuisine": "Lounge",
    "cuisineTags": [
      "Lounge"
    ],
    "vibeTags": [
      "dj"
    ],
    "occasionTags": [
      "girls-night"
    ],
    "price": "$$$",
    "priceLevel": 3,
    "vibeNotes": "11 Howard hotel lounge; fashion crowd; DJ sets",
    "sourceCredit": "TimeOut NY"
  },
  {
    "id": "0a4abf97-1e84-1643-27b5-cc1a00fe747e",
    "name": "By Chloe",
    "slug": "by-chloe",
    "city": "New York",
    "state": "NY",
    "neighborhood": "Multiple",
    "address": "Various",
    "lat": 40.7128,
    "lng": -74.006,
    "cuisine": "Vegan",
    "cuisineTags": [
      "Vegan"
    ],
    "vibeTags": [
      "brunch"
    ],
    "occasionTags": [
      "girls-night"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Cute vegan cafe; great for lighter girls brunch",
    "sourceCredit": "Infatuation"
  },
  {
    "id": "cc49d6cb-6d9f-e853-6888-8d513e41ccc6",
    "name": "Keens Steakhouse",
    "slug": "keens-steakhouse",
    "city": "New York",
    "state": "NY",
    "neighborhood": "Midtown",
    "address": "72 W 36th St",
    "lat": 40.7128,
    "lng": -74.006,
    "cuisine": "Steakhouse",
    "cuisineTags": [
      "Steakhouse"
    ],
    "vibeTags": [],
    "occasionTags": [
      "guys-night"
    ],
    "price": "$$$$",
    "priceLevel": 4,
    "vibeNotes": "Mutton chop + scotch; pipes on ceiling; 1885 old-school",
    "sourceCredit": "Classic NYC"
  },
  {
    "id": "9c81ee65-7306-c8e0-1667-ee1cacb8fb9d",
    "name": "McSorley's Old Ale House",
    "slug": "mcsorley-s-old-ale-house",
    "city": "New York",
    "state": "NY",
    "neighborhood": "East Village",
    "address": "15 E 7th St",
    "lat": 40.7128,
    "lng": -74.006,
    "cuisine": "Historic Pub",
    "cuisineTags": [
      "Historic Pub"
    ],
    "vibeTags": [],
    "occasionTags": [
      "guys-night"
    ],
    "price": "$",
    "priceLevel": 1,
    "vibeNotes": "NYC's oldest bar (1854); light or dark ale; sawdust floors",
    "sourceCredit": "Classic NYC"
  },
  {
    "id": "1abae62b-5cbe-b5ab-5c4c-c4e33e98ec41",
    "name": "Rao's",
    "slug": "rao-s",
    "city": "New York",
    "state": "NY",
    "neighborhood": "East Harlem",
    "address": "455 E 114th St",
    "lat": 40.7128,
    "lng": -74.006,
    "cuisine": "Italian",
    "cuisineTags": [
      "Italian"
    ],
    "vibeTags": [],
    "occasionTags": [
      "guys-night"
    ],
    "price": "$$$$",
    "priceLevel": 4,
    "vibeNotes": "Hardest reservation in America; Italian legend; if you can get in",
    "sourceCredit": "Classic NYC"
  },
  {
    "id": "80262891-c78c-ce36-da86-31fb32ee4415",
    "name": "Dear Irving",
    "slug": "dear-irving",
    "city": "New York",
    "state": "NY",
    "neighborhood": "Gramercy",
    "address": "55 Irving Pl",
    "lat": 40.7128,
    "lng": -74.006,
    "cuisine": "Cocktail Lounge",
    "cuisineTags": [
      "Cocktail Lounge"
    ],
    "vibeTags": [
      "cocktails"
    ],
    "occasionTags": [
      "guys-night"
    ],
    "price": "$$$",
    "priceLevel": 3,
    "vibeNotes": "Time-travel themed cocktail bar; prohibition to present",
    "sourceCredit": "TimeOut NY"
  },
  {
    "id": "c9fd631c-71d7-10e3-40a9-02dc31bdad91",
    "name": "Paulie Gee's",
    "slug": "paulie-gee-s",
    "city": "New York",
    "state": "NY",
    "neighborhood": "Greenpoint",
    "address": "60 Greenpoint Ave",
    "lat": 40.7128,
    "lng": -74.006,
    "cuisine": "Pizza",
    "cuisineTags": [
      "Pizza"
    ],
    "vibeTags": [],
    "occasionTags": [
      "guys-night"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Wood-fired pizza; hellboy pie; BYOB; neighborhood gem",
    "sourceCredit": "Eater NY"
  },
  {
    "id": "39818f91-9e65-936d-1bff-40a837861167",
    "name": "The Dead Rabbit",
    "slug": "the-dead-rabbit",
    "city": "New York",
    "state": "NY",
    "neighborhood": "Financial District",
    "address": "30 Water St",
    "lat": 40.7128,
    "lng": -74.006,
    "cuisine": "Irish Pub-Cocktails",
    "cuisineTags": [
      "Irish Pub-Cocktails"
    ],
    "vibeTags": [
      "cocktails"
    ],
    "occasionTags": [
      "guys-night"
    ],
    "price": "$$$",
    "priceLevel": 3,
    "vibeNotes": "World's Best Bar winner; taproom downstairs; parlor upstairs",
    "sourceCredit": "World's 50 Best Bars"
  },
  {
    "id": "135fb4c9-7d0b-6cb9-c3d1-de284ee04dd9",
    "name": "Barcade",
    "slug": "barcade",
    "city": "New York",
    "state": "NY",
    "neighborhood": "Multiple",
    "address": "Various",
    "lat": 40.7128,
    "lng": -74.006,
    "cuisine": "Arcade Bar",
    "cuisineTags": [
      "Arcade Bar"
    ],
    "vibeTags": [],
    "occasionTags": [
      "guys-night"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Retro arcade + craft beer; competition; nostalgic",
    "sourceCredit": "TimeOut NY"
  },
  {
    "id": "10bb40ee-210b-42aa-acd9-6e1d086aa3bb",
    "name": "1 OAK",
    "slug": "1-oak",
    "city": "New York",
    "state": "NY",
    "neighborhood": "Chelsea",
    "address": "453 W 17th St",
    "lat": 40.7128,
    "lng": -74.006,
    "cuisine": "Nightclub",
    "cuisineTags": [
      "Nightclub"
    ],
    "vibeTags": [],
    "occasionTags": [
      "bachelor"
    ],
    "price": "$$$$",
    "priceLevel": 4,
    "vibeNotes": "Celebrity nightclub; bottle service; exclusive door",
    "sourceCredit": "TimeOut NY"
  },
  {
    "id": "bc2478b1-98dd-794d-0f0b-56a66880349c",
    "name": "PHD Terrace",
    "slug": "phd-terrace",
    "city": "New York",
    "state": "NY",
    "neighborhood": "Chelsea",
    "address": "355 W 16th St (rooftop)",
    "lat": 40.7128,
    "lng": -74.006,
    "cuisine": "Rooftop Bar",
    "cuisineTags": [
      "Rooftop Bar"
    ],
    "vibeTags": [
      "rooftop"
    ],
    "occasionTags": [
      "bachelor"
    ],
    "price": "$$$",
    "priceLevel": 3,
    "vibeNotes": "Dream Downtown rooftop; skyline views; party starter",
    "sourceCredit": "TimeOut NY"
  },
  {
    "id": "7aef20d4-5813-3007-093a-a330afb1a6bd",
    "name": "The Box",
    "slug": "the-box",
    "city": "New York",
    "state": "NY",
    "neighborhood": "Lower East Side",
    "address": "189 Chrystie St",
    "lat": 40.7128,
    "lng": -74.006,
    "cuisine": "Cabaret-Club",
    "cuisineTags": [
      "Cabaret-Club"
    ],
    "vibeTags": [],
    "occasionTags": [
      "bachelor"
    ],
    "price": "$$$$",
    "priceLevel": 4,
    "vibeNotes": "Burlesque + live performance; avant-garde; unforgettable",
    "sourceCredit": "TimeOut NY"
  },
  {
    "id": "f942068b-693e-997d-1ba8-9f66fafd26be",
    "name": "Top of the Standard",
    "slug": "top-of-the-standard",
    "city": "New York",
    "state": "NY",
    "neighborhood": "Meatpacking",
    "address": "848 Washington St (18th fl)",
    "lat": 40.7128,
    "lng": -74.006,
    "cuisine": "Cocktail Lounge",
    "cuisineTags": [
      "Cocktail Lounge"
    ],
    "vibeTags": [
      "elegant",
      "cocktails",
      "sunset",
      "iconic"
    ],
    "occasionTags": [
      "bachelor"
    ],
    "price": "$$$$",
    "priceLevel": 4,
    "vibeNotes": "Iconic skyline bar; elegant pre-game; sunset views",
    "sourceCredit": "Eater NY"
  },
  {
    "id": "c29852ec-b412-4b0b-b4dc-bc88a8969490",
    "name": "Sapphire Lounge",
    "slug": "sapphire-lounge",
    "city": "New York",
    "state": "NY",
    "neighborhood": "Lower East Side",
    "address": "249 Eldridge St",
    "lat": 40.7128,
    "lng": -74.006,
    "cuisine": "Dive Bar-Dance",
    "cuisineTags": [
      "Dive Bar-Dance"
    ],
    "vibeTags": [
      "fun",
      "dance"
    ],
    "occasionTags": [
      "bachelor"
    ],
    "price": "$",
    "priceLevel": 1,
    "vibeNotes": "Legendary LES dive; hip-hop + dance; sweaty fun",
    "sourceCredit": "TimeOut NY"
  },
  {
    "id": "67cb9fe4-d631-a196-e3e3-08103cd18ce9",
    "name": "Chelsea Piers",
    "slug": "chelsea-piers",
    "city": "New York",
    "state": "NY",
    "neighborhood": "Chelsea",
    "address": "62 Chelsea Piers",
    "lat": 40.7128,
    "lng": -74.006,
    "cuisine": "Activities",
    "cuisineTags": [
      "Activities"
    ],
    "vibeTags": [],
    "occasionTags": [
      "bachelor"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Bowling + golf + go-karts; daytime bachelor activity",
    "sourceCredit": "Visit NYC"
  },
  {
    "id": "f564e27b-551e-77b5-0a6a-8b6da34be008",
    "name": "Central Park",
    "slug": "central-park",
    "city": "New York",
    "state": "NY",
    "neighborhood": "Midtown",
    "address": "59th to 110th St",
    "lat": 40.7128,
    "lng": -74.006,
    "cuisine": "Park",
    "cuisineTags": [
      "Park"
    ],
    "vibeTags": [],
    "occasionTags": [
      "outdoor-adventure"
    ],
    "price": "Free",
    "priceLevel": 1,
    "vibeNotes": "843 acres; Bethesda Fountain; row boats; picnic lawns",
    "sourceCredit": "NYC Parks"
  },
  {
    "id": "03c9cabb-85bf-affb-5c1f-a9c4274e29ca",
    "name": "Brooklyn Bridge Walk",
    "slug": "brooklyn-bridge-walk",
    "city": "New York",
    "state": "NY",
    "neighborhood": "DUMBO",
    "address": "Brooklyn Bridge",
    "lat": 40.7128,
    "lng": -74.006,
    "cuisine": "Walk-Views",
    "cuisineTags": [
      "Walk-Views"
    ],
    "vibeTags": [
      "iconic"
    ],
    "occasionTags": [
      "outdoor-adventure"
    ],
    "price": "Free",
    "priceLevel": 1,
    "vibeNotes": "Iconic bridge walk; Manhattan skyline; Jane's Carousel below",
    "sourceCredit": "Visit NYC"
  },
  {
    "id": "e4378fee-62e1-860e-068c-c29b5c58e24b",
    "name": "The Highline",
    "slug": "the-highline",
    "city": "New York",
    "state": "NY",
    "neighborhood": "Chelsea",
    "address": "Gansevoort to 34th St",
    "lat": 40.7128,
    "lng": -74.006,
    "cuisine": "Elevated Park",
    "cuisineTags": [
      "Elevated Park"
    ],
    "vibeTags": [],
    "occasionTags": [
      "outdoor-adventure"
    ],
    "price": "Free",
    "priceLevel": 1,
    "vibeNotes": "Elevated park; art installations; Hudson River views",
    "sourceCredit": "NYC Parks"
  },
  {
    "id": "48d21f3d-737b-5681-4f5d-11d4d5c6327a",
    "name": "Governors Island",
    "slug": "governors-island",
    "city": "New York",
    "state": "NY",
    "neighborhood": "Harbor",
    "address": "Governors Island",
    "lat": 40.7128,
    "lng": -74.006,
    "cuisine": "Island Park",
    "cuisineTags": [
      "Island Park"
    ],
    "vibeTags": [],
    "occasionTags": [
      "outdoor-adventure"
    ],
    "price": "Free",
    "priceLevel": 1,
    "vibeNotes": "Free ferry; bike rentals; Statue of Liberty views; hammocks",
    "sourceCredit": "NYC Parks"
  },
  {
    "id": "3fecf1cd-9da0-a128-5cd4-e109e713a10b",
    "name": "DUMBO",
    "slug": "dumbo",
    "city": "New York",
    "state": "NY",
    "neighborhood": "Brooklyn",
    "address": "Main St & Water St",
    "lat": 40.7128,
    "lng": -74.006,
    "cuisine": "Neighborhood Walk",
    "cuisineTags": [
      "Neighborhood Walk"
    ],
    "vibeTags": [],
    "occasionTags": [
      "outdoor-adventure"
    ],
    "price": "Free",
    "priceLevel": 1,
    "vibeNotes": "Cobblestones; Manhattan Bridge views; Time Out Market",
    "sourceCredit": "Visit NYC"
  },
  {
    "id": "8975729f-da39-8975-a0be-3c2a0b042eb2",
    "name": "Smorgasburg",
    "slug": "smorgasburg",
    "city": "New York",
    "state": "NY",
    "neighborhood": "Williamsburg",
    "address": "90 Kent Ave",
    "lat": 40.7128,
    "lng": -74.006,
    "cuisine": "Food Market",
    "cuisineTags": [
      "Food Market"
    ],
    "vibeTags": [
      "waterfront"
    ],
    "occasionTags": [
      "outdoor-adventure"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "100+ food vendors; every Saturday; Brooklyn waterfront",
    "sourceCredit": "Smorgasburg"
  },
  {
    "id": "dbc3cc52-6407-fc7b-9230-ec0fb7b42e7e",
    "name": "Coney Island",
    "slug": "coney-island",
    "city": "New York",
    "state": "NY",
    "neighborhood": "Brooklyn",
    "address": "Surf Ave",
    "lat": 40.7128,
    "lng": -74.006,
    "cuisine": "Beach-Boardwalk",
    "cuisineTags": [
      "Beach-Boardwalk"
    ],
    "vibeTags": [],
    "occasionTags": [
      "outdoor-adventure"
    ],
    "price": "$",
    "priceLevel": 1,
    "vibeNotes": "Boardwalk; Luna Park; Nathan's hot dogs; retro beach day",
    "sourceCredit": "Visit NYC"
  },
  {
    "id": "023ea128-0489-9ed9-d98e-002f851f2865",
    "name": "Domino Park",
    "slug": "domino-park",
    "city": "New York",
    "state": "NY",
    "neighborhood": "Williamsburg",
    "address": "15 River St",
    "lat": 40.7128,
    "lng": -74.006,
    "cuisine": "Waterfront Park",
    "cuisineTags": [
      "Waterfront Park"
    ],
    "vibeTags": [
      "waterfront"
    ],
    "occasionTags": [
      "outdoor-adventure"
    ],
    "price": "Free",
    "priceLevel": 1,
    "vibeNotes": "East River waterfront; skyline views; food trucks nearby",
    "sourceCredit": "NYC Parks"
  },
  {
    "id": "e4b3ef2b-a501-5eb7-77e2-1fe86836912b",
    "name": "Tomi Jazz",
    "slug": "tomi-jazz",
    "city": "New York",
    "state": "NY",
    "neighborhood": "Midtown East",
    "address": "239 E 53rd St, NY 10022",
    "lat": 40.7128,
    "lng": -74.006,
    "cuisine": "Japanese Izakaya / Live Jazz",
    "cuisineTags": [
      "Japanese Izakaya",
      "Live Jazz"
    ],
    "vibeTags": [
      "intimate"
    ],
    "occasionTags": [
      "date-night-ideas",
      "guys-night"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Underground jazz club meets izakaya; live performances nightly; intimate candlelit basement; perfect surprise date spot",
    "sourceCredit": "@sexydatesnyc"
  },
  {
    "id": "efd15044-6bc6-3d93-403f-44afecd9f7e0",
    "name": "Shalel",
    "slug": "shalel",
    "city": "New York",
    "state": "NY",
    "neighborhood": "Upper West Side",
    "address": "65 W 70th St, NY 10023",
    "lat": 40.7128,
    "lng": -74.006,
    "cuisine": "Moroccan / Mediterranean",
    "cuisineTags": [
      "Moroccan",
      "Mediterranean"
    ],
    "vibeTags": [
      "hidden-gem",
      "elegant"
    ],
    "occasionTags": [
      "date-night-ideas",
      "in-laws"
    ],
    "price": "$$$",
    "priceLevel": 3,
    "vibeNotes": "Hidden garden oasis near Central Park; lanterns, cushions, and fountain; feels like Marrakech in Manhattan",
    "sourceCredit": "@sexydatesnyc"
  },
  {
    "id": "b6ea1060-c84e-1daa-b3b3-3a1387cd1c71",
    "name": "Milk & Roses",
    "slug": "milk-roses",
    "city": "New York",
    "state": "NY",
    "neighborhood": "Greenpoint",
    "address": "35 Box St, Brooklyn, NY 11222",
    "lat": 40.7128,
    "lng": -74.006,
    "cuisine": "Italian Bistro",
    "cuisineTags": [
      "Italian Bistro"
    ],
    "vibeTags": [
      "romantic",
      "patio",
      "brunch"
    ],
    "occasionTags": [
      "date-night-ideas",
      "girls-night"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Enchanting garden patio with fairy lights; rustic Italian dishes; one of Brooklyn's most romantic restaurants",
    "sourceCredit": "@sexydatesnyc"
  },
  {
    "id": "2c9da5fe-3ca9-d0ae-1e1c-d2704f09863d",
    "name": "Jadis",
    "slug": "jadis",
    "city": "New York",
    "state": "NY",
    "neighborhood": "Lower East Side",
    "address": "42 Rivington St, NY 10002",
    "lat": 40.7128,
    "lng": -74.006,
    "cuisine": "French Wine Bar",
    "cuisineTags": [
      "French Wine Bar"
    ],
    "vibeTags": [
      "cozy",
      "wine"
    ],
    "occasionTags": [
      "date-night-ideas"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Tiny, dimly-lit wine bar; vintage European decor; natural wines; ultra-cozy 2-person tables",
    "sourceCredit": "@sexydatesnyc"
  },
  {
    "id": "8d3ba069-5b2f-9ce4-afaa-1a4a0489678c",
    "name": "Lei",
    "slug": "lei",
    "city": "New York",
    "state": "NY",
    "neighborhood": "Chinatown",
    "address": "15-17 Doyers St, NY 10013",
    "lat": 40.7128,
    "lng": -74.006,
    "cuisine": "Wine Bar",
    "cuisineTags": [
      "Wine Bar"
    ],
    "vibeTags": [
      "intimate",
      "hidden-gem",
      "wine"
    ],
    "occasionTags": [
      "date-night-ideas"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Intimate wine bar on historic Doyers Street; moody lighting; curated wine list; hidden gem feel",
    "sourceCredit": "@sexydatesnyc"
  },
  {
    "id": "de84cd84-ba98-f143-ce71-4ddc6b8dda4c",
    "name": "Gottino Enoteca",
    "slug": "gottino-enoteca",
    "city": "New York",
    "state": "NY",
    "neighborhood": "West Village",
    "address": "52 Greenwich Ave, NY 10011",
    "lat": 40.7128,
    "lng": -74.006,
    "cuisine": "Italian Wine Bar",
    "cuisineTags": [
      "Italian Wine Bar"
    ],
    "vibeTags": [
      "romantic",
      "wine",
      "late-night"
    ],
    "occasionTags": [
      "date-night-ideas"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Tiny Village wine bar with small plates; standing room intimacy; Italian imports; romantic spontaneity",
    "sourceCredit": "@sexydatesnyc"
  },
  {
    "id": "d28eb43a-527a-b97c-0f0c-d23143b21988",
    "name": "Bar Tizio",
    "slug": "bar-tizio",
    "city": "New York",
    "state": "NY",
    "neighborhood": "West Village",
    "address": "107 Horatio St, NY",
    "lat": 40.7128,
    "lng": -74.006,
    "cuisine": "Italian",
    "cuisineTags": [
      "Italian"
    ],
    "vibeTags": [],
    "occasionTags": [
      "date-night-ideas"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Charming neighborhood Italian spot near the Whitney; sidewalk seating; relaxed, classy date vibes",
    "sourceCredit": "@sexydatesnyc"
  },
  {
    "id": "0c20a847-fdc0-59e7-0509-af11d14afc58",
    "name": "Fedora",
    "slug": "fedora",
    "city": "New York",
    "state": "NY",
    "neighborhood": "West Village",
    "address": "239 W 4th St, NY 10014",
    "lat": 40.7128,
    "lng": -74.006,
    "cuisine": "New American",
    "cuisineTags": [
      "New American"
    ],
    "vibeTags": [
      "cocktails"
    ],
    "occasionTags": [
      "date-night-ideas",
      "in-laws"
    ],
    "price": "$$$",
    "priceLevel": 3,
    "vibeNotes": "Historic speakeasy-era space below street level; seasonal cocktails; date-night classic since 1919 (revived)",
    "sourceCredit": "@sexydatesnyc"
  },
  {
    "id": "90bfc379-7318-2ad0-d8d0-5206bfd92618",
    "name": "Kees",
    "slug": "kees",
    "city": "New York",
    "state": "NY",
    "neighborhood": "West Village",
    "address": "1 Cornelia St",
    "lat": 40.7128,
    "lng": -74.006,
    "cuisine": "Cocktail Lounge",
    "cuisineTags": [
      "Cocktail Lounge"
    ],
    "vibeTags": [
      "hidden-gem",
      "cocktails"
    ],
    "occasionTags": [
      "date-night-ideas"
    ],
    "price": "$$$",
    "priceLevel": 3,
    "vibeNotes": "Hidden behind Mixteca; no sign, no menu; PDT-veteran bartenders craft bespoke cocktails; ultimate secret date",
    "sourceCredit": "@sexydatesnyc"
  },
  {
    "id": "866bdfb9-f6f0-6854-049c-8c4aa3b36ab1",
    "name": "Sami & Susu",
    "slug": "sami-susu",
    "city": "New York",
    "state": "NY",
    "neighborhood": "Lower East Side",
    "address": "190 Orchard St, NY 10002",
    "lat": 40.7128,
    "lng": -74.006,
    "cuisine": "Mediterranean",
    "cuisineTags": [
      "Mediterranean"
    ],
    "vibeTags": [
      "wine",
      "late-night",
      "michelin"
    ],
    "occasionTags": [
      "date-night-ideas"
    ],
    "price": "$$$",
    "priceLevel": 3,
    "vibeNotes": "Michelin-recognized; sharing plates; warm candlelit space; elevated yet unpretentious; great wine program",
    "sourceCredit": "@sexydatesnyc"
  },
  {
    "id": "6b87c176-0c42-c4cf-b79f-74ed8344edd6",
    "name": "Yves",
    "slug": "yves",
    "city": "New York",
    "state": "NY",
    "neighborhood": "Tribeca",
    "address": "385 Greenwich St, NY 10013",
    "lat": 40.7128,
    "lng": -74.006,
    "cuisine": "French / Moroccan Cocktail Bar",
    "cuisineTags": [
      "French",
      "Moroccan Cocktail Bar"
    ],
    "vibeTags": [
      "cocktails"
    ],
    "occasionTags": [
      "date-night-ideas"
    ],
    "price": "$$$",
    "priceLevel": 3,
    "vibeNotes": "Lush velvet interiors; craft cocktails with North African spices; sultry Tribeca hideaway",
    "sourceCredit": "@sexydatesnyc"
  },
  {
    "id": "1603939c-d1fe-5072-d3e8-bda723dbd895",
    "name": "Bobo",
    "slug": "bobo",
    "city": "New York",
    "state": "NY",
    "neighborhood": "West Village",
    "address": "181 W 10th St, NY 10014",
    "lat": 40.7128,
    "lng": -74.006,
    "cuisine": "French",
    "cuisineTags": [
      "French"
    ],
    "vibeTags": [
      "romantic",
      "rooftop",
      "late-night"
    ],
    "occasionTags": [
      "date-night-ideas",
      "in-laws"
    ],
    "price": "$$$",
    "priceLevel": 3,
    "vibeNotes": "Brownstone townhouse restaurant; rooftop dining; romantic French fare; garden-level and upstairs charm",
    "sourceCredit": "@sexydatesnyc"
  },
  {
    "id": "82d6f92c-5c61-d409-4585-c572d2afbde2",
    "name": "Ingas Bar",
    "slug": "ingas-bar",
    "city": "New York",
    "state": "NY",
    "neighborhood": "Brooklyn Heights",
    "address": "66 Hicks St, Brooklyn, NY 11201",
    "lat": 40.7128,
    "lng": -74.006,
    "cuisine": "New American",
    "cuisineTags": [
      "New American"
    ],
    "vibeTags": [
      "intimate",
      "elegant",
      "cocktails",
      "late-night",
      "michelin"
    ],
    "occasionTags": [
      "date-night-ideas",
      "in-laws"
    ],
    "price": "$$$",
    "priceLevel": 3,
    "vibeNotes": "Michelin-recognized; elegant small plates in a brownstone; cocktail-forward; intimate Brooklyn Heights gem",
    "sourceCredit": "@sexydatesnyc"
  },
  {
    "id": "426693ae-fa76-ad7a-878d-c6dbcef2d711",
    "name": "Ruffian",
    "slug": "ruffian",
    "city": "New York",
    "state": "NY",
    "neighborhood": "East Village",
    "address": "125 E 7th St, NY 10009",
    "lat": 40.7128,
    "lng": -74.006,
    "cuisine": "Wine Bar / Small Plates",
    "cuisineTags": [
      "Wine Bar",
      "Small Plates"
    ],
    "vibeTags": [
      "cozy",
      "wine",
      "late-night"
    ],
    "occasionTags": [
      "date-night-ideas"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Natural wine bar with inventive small plates; cozy, no-fuss setting; chef-driven pairings",
    "sourceCredit": "@sexydatesnyc"
  },
  {
    "id": "6f5c334b-cf67-3f9b-9e1a-e79f16f98c8f",
    "name": "Black Mountain Wine House",
    "slug": "black-mountain-wine-house",
    "city": "New York",
    "state": "NY",
    "neighborhood": "Carroll Gardens",
    "address": "415 Union St, Brooklyn, NY 11231",
    "lat": 40.7128,
    "lng": -74.006,
    "cuisine": "Wine Bar",
    "cuisineTags": [
      "Wine Bar"
    ],
    "vibeTags": [
      "wine"
    ],
    "occasionTags": [
      "date-night-ideas"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Working fireplace in winter; curated wine list; warm wood interiors; feels like a cabin in Brooklyn",
    "sourceCredit": "@sexydatesnyc"
  },
  {
    "id": "68c512e2-c1c9-4c28-d06f-9033454923ab",
    "name": "Hotel Delmano",
    "slug": "hotel-delmano",
    "city": "New York",
    "state": "NY",
    "neighborhood": "Williamsburg",
    "address": "82 Berry St, Brooklyn, NY 11211",
    "lat": 40.7128,
    "lng": -74.006,
    "cuisine": "Cocktail Bar / Lounge",
    "cuisineTags": [
      "Cocktail Bar",
      "Lounge"
    ],
    "vibeTags": [
      "patio",
      "cocktails"
    ],
    "occasionTags": [
      "date-night-ideas",
      "guys-night"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Old-world glamour with marble bar and velvet; craft cocktails; beautiful back patio; date-night staple",
    "sourceCredit": "@sexydatesnyc"
  },
  {
    "id": "bcc19c49-f86c-eccc-80f6-ea44d36604f5",
    "name": "San Marzano",
    "slug": "san-marzano",
    "city": "New York",
    "state": "NY",
    "neighborhood": "East Village",
    "address": "117 Second Ave, NY 10003",
    "lat": 40.7128,
    "lng": -74.006,
    "cuisine": "Italian",
    "cuisineTags": [
      "Italian"
    ],
    "vibeTags": [
      "fun",
      "wine"
    ],
    "occasionTags": [
      "group-night-out"
    ],
    "price": "$",
    "priceLevel": 1,
    "vibeNotes": "Fresh pasta under $15; huge portions; perfect for large groups on a budget; BYO wine adds to the fun",
    "sourceCredit": "@sexydatesnyc"
  },
  {
    "id": "c2960be3-1cc1-118f-f678-2ddd47730cb6",
    "name": "Kiki's",
    "slug": "kiki-s",
    "city": "New York",
    "state": "NY",
    "neighborhood": "Lower East Side",
    "address": "130 Division St, NY 10002",
    "lat": 40.7128,
    "lng": -74.006,
    "cuisine": "Greek",
    "cuisineTags": [
      "Greek"
    ],
    "vibeTags": [
      "michelin"
    ],
    "occasionTags": [
      "group-night-out"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Michelin Bib Gourmand; communal energy; share meze platters; cash only adds old-school charm; always buzzing",
    "sourceCredit": "@sexydatesnyc"
  },
  {
    "id": "d23cbc89-25e0-7b53-2b4f-02ddd4d631b2",
    "name": "El Ping\u00fcino",
    "slug": "el-ping-ino",
    "city": "New York",
    "state": "NY",
    "neighborhood": "Greenpoint",
    "address": "25 Greenpoint Ave, Brooklyn, NY 11222",
    "lat": 40.7128,
    "lng": -74.006,
    "cuisine": "Spanish Seafood",
    "cuisineTags": [
      "Spanish Seafood"
    ],
    "vibeTags": [],
    "occasionTags": [
      "group-night-out"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Lively Spanish bar with tinned fish and oysters; standing/counter seating; great for groups who like to graze",
    "sourceCredit": "@sexydatesnyc"
  },
  {
    "id": "b6a9e3c4-85bf-e754-1f1d-473dd96ba1eb",
    "name": "The Nines",
    "slug": "the-nines",
    "city": "New York",
    "state": "NY",
    "neighborhood": "NoHo",
    "address": "9 Great Jones St, NY 10012",
    "lat": 40.7128,
    "lng": -74.006,
    "cuisine": "New American",
    "cuisineTags": [
      "New American"
    ],
    "vibeTags": [
      "cocktails",
      "late-night"
    ],
    "occasionTags": [
      "group-night-out",
      "guys-night"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Vibrant NoHo spot; shareable plates; great cocktails; energetic atmosphere perfect for group celebrations",
    "sourceCredit": "@sexydatesnyc"
  },
  {
    "id": "c94cd1b1-cb69-f3fd-0f90-e72d4f822deb",
    "name": "El Camino",
    "slug": "el-camino",
    "city": "New York",
    "state": "NY",
    "neighborhood": "East Village",
    "address": "135 1st Ave, NY 10003",
    "lat": 40.7128,
    "lng": -74.006,
    "cuisine": "Bar",
    "cuisineTags": [
      "Bar"
    ],
    "vibeTags": [
      "late-night"
    ],
    "occasionTags": [
      "group-night-out",
      "guys-night"
    ],
    "price": "$",
    "priceLevel": 1,
    "vibeNotes": "Dive bar energy with good drinks; unpretentious; pool table and cheap drinks; ideal casual group night",
    "sourceCredit": "@sexydatesnyc"
  },
  {
    "id": "3cbfe122-412e-88ea-3301-349abac28a69",
    "name": "Colonia Verde",
    "slug": "colonia-verde",
    "city": "New York",
    "state": "NY",
    "neighborhood": "Fort Greene",
    "address": "219 Dekalb Ave, Brooklyn, NY 11205",
    "lat": 40.7128,
    "lng": -74.006,
    "cuisine": "Latin American",
    "cuisineTags": [
      "Latin American"
    ],
    "vibeTags": [
      "patio",
      "cocktails",
      "late-night"
    ],
    "occasionTags": [
      "group-night-out"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Stunning garden patio; Latin sharing plates; tropical cocktails; large-group friendly layout",
    "sourceCredit": "@sexydatesnyc"
  },
  {
    "id": "438cbf69-1756-a26d-bc29-0d6d68f5a05b",
    "name": "Tournesol",
    "slug": "tournesol",
    "city": "New York",
    "state": "NY",
    "neighborhood": "Long Island City",
    "address": "50-12 Vernon Blvd, Queens, NY 11101",
    "lat": 40.7128,
    "lng": -74.006,
    "cuisine": "French Bistro",
    "cuisineTags": [
      "French Bistro"
    ],
    "vibeTags": [],
    "occasionTags": [
      "in-laws"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Classic French bistro; white tablecloths; warm service; mature crowd; reliable and impressive without being stuffy",
    "sourceCredit": "@sexydatesnyc"
  },
  {
    "id": "42413034-9985-6362-d009-fd78322bfd8b",
    "name": "Spes",
    "slug": "spes",
    "city": "New York",
    "state": "NY",
    "neighborhood": "East Village",
    "address": "413 E 12th St, NY 10009",
    "lat": 40.7128,
    "lng": -74.006,
    "cuisine": "Italian Wine Bar",
    "cuisineTags": [
      "Italian Wine Bar"
    ],
    "vibeTags": [
      "wine"
    ],
    "occasionTags": [
      "girls-night"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "100+ wines by the glass; natural wine focus; aesthetic interiors; perfect for a wine-tasting girls night",
    "sourceCredit": "@sexydatesnyc"
  },
  {
    "id": "092c065d-b683-665b-ca10-62dbe765bd76",
    "name": "Horse with No Name",
    "slug": "horse-with-no-name",
    "city": "New York",
    "state": "NY",
    "neighborhood": "East Village",
    "address": "223 E 5th St, NY 10003",
    "lat": 40.7128,
    "lng": -74.006,
    "cuisine": "Natural Wine Bar",
    "cuisineTags": [
      "Natural Wine Bar"
    ],
    "vibeTags": [
      "wine",
      "instagrammable"
    ],
    "occasionTags": [
      "girls-night"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Wine + vinyl listening bar; curated natural wines; retro decor; Instagram-worthy; great vibe for catching up",
    "sourceCredit": "@sexydatesnyc"
  },
  {
    "id": "56e1de74-4d82-46b0-dc81-0df5a1cef705",
    "name": "Parcelle Chinatown",
    "slug": "parcelle-chinatown",
    "city": "New York",
    "state": "NY",
    "neighborhood": "Chinatown",
    "address": "135 Division St, NY 10002",
    "lat": 40.7128,
    "lng": -74.006,
    "cuisine": "Wine Bar",
    "cuisineTags": [
      "Wine Bar"
    ],
    "vibeTags": [
      "trendy",
      "wine",
      "late-night"
    ],
    "occasionTags": [
      "girls-night"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Chic wine bar with exposed brick; small plates; shareable bottles; trendy Chinatown location",
    "sourceCredit": "@sexydatesnyc"
  },
  {
    "id": "76bb789c-4852-20a5-1894-7f6359bce318",
    "name": "Bascule",
    "slug": "bascule",
    "city": "New York",
    "state": "NY",
    "neighborhood": "Williamsburg",
    "address": "184 Kent Ave, Brooklyn, NY 11249",
    "lat": 40.7128,
    "lng": -74.006,
    "cuisine": "Natural Wine Bar",
    "cuisineTags": [
      "Natural Wine Bar"
    ],
    "vibeTags": [
      "waterfront",
      "wine",
      "late-night"
    ],
    "occasionTags": [
      "girls-night"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Waterfront natural wine bar; stunning Manhattan skyline views; small plates; aesthetic and share-worthy",
    "sourceCredit": "@sexydatesnyc"
  },
  {
    "id": "9e4828cd-ead7-fcba-bbdf-59e3c55e4f08",
    "name": "Eavesdrop",
    "slug": "eavesdrop",
    "city": "New York",
    "state": "NY",
    "neighborhood": "Greenpoint",
    "address": "674 Manhattan Ave, Brooklyn, NY 11222",
    "lat": 40.7128,
    "lng": -74.006,
    "cuisine": "Cocktail / Listening Bar",
    "cuisineTags": [
      "Cocktail",
      "Listening Bar"
    ],
    "vibeTags": [
      "trendy",
      "cocktails"
    ],
    "occasionTags": [
      "girls-night"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Audiophile listening bar; curated cocktails; vinyl soundtrack; moody and trendy; great for adventurous groups",
    "sourceCredit": "@sexydatesnyc"
  },
  {
    "id": "c4d7eb7f-fc99-c28f-1e4a-e9d6c15760a9",
    "name": "Honeycomb Hi-Fi Lounge",
    "slug": "honeycomb-hi-fi-lounge",
    "city": "New York",
    "state": "NY",
    "neighborhood": "Park Slope",
    "address": "74 5th Ave, Brooklyn, NY 11217",
    "lat": 40.7128,
    "lng": -74.006,
    "cuisine": "Listening Bar",
    "cuisineTags": [
      "Listening Bar"
    ],
    "vibeTags": [
      "cocktails"
    ],
    "occasionTags": [
      "guys-night"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Hi-fi listening lounge; vinyl-focused; craft cocktails; laid-back but cool; great for music-loving crews",
    "sourceCredit": "@sexydatesnyc"
  },
  {
    "id": "f38b8e02-a247-e808-8e04-1f375141eabe",
    "name": "Aba",
    "slug": "aba",
    "city": "Nashville",
    "state": "TN",
    "neighborhood": "Wedgewood-Houston",
    "address": "900 Rosa L Parks Blvd",
    "lat": 36.1627,
    "lng": -86.7816,
    "cuisine": "Mediterranean",
    "cuisineTags": [
      "Mediterranean"
    ],
    "vibeTags": [],
    "occasionTags": [
      "date-night"
    ],
    "price": "$$$",
    "priceLevel": 3,
    "vibeNotes": "Dimly lit; Murano glass chandeliers; frozen yogurt with olive oil; screams date night",
    "sourceCredit": "Infatuation"
  },
  {
    "id": "c7cdd424-7af7-a6f0-f415-af382a69da6b",
    "name": "Yolan",
    "slug": "yolan",
    "city": "Nashville",
    "state": "TN",
    "neighborhood": "SoBro",
    "address": "700 Korean Veterans Blvd (Joseph Hotel)",
    "lat": 36.1627,
    "lng": -86.7816,
    "cuisine": "Italian",
    "cuisineTags": [
      "Italian"
    ],
    "vibeTags": [
      "elegant"
    ],
    "occasionTags": [
      "date-night"
    ],
    "price": "$$$$",
    "priceLevel": 4,
    "vibeNotes": "Hotel Joseph; handmade pasta; elegant & refined tasting menu",
    "sourceCredit": "Resy"
  },
  {
    "id": "ebedbe8b-a230-beed-9082-908ffca27954",
    "name": "Henrietta Red",
    "slug": "henrietta-red",
    "city": "Nashville",
    "state": "TN",
    "neighborhood": "Germantown",
    "address": "1200 4th Ave N",
    "lat": 36.1627,
    "lng": -86.7816,
    "cuisine": "Seafood",
    "cuisineTags": [
      "Seafood"
    ],
    "vibeTags": [
      "romantic"
    ],
    "occasionTags": [
      "date-night"
    ],
    "price": "$$$",
    "priceLevel": 3,
    "vibeNotes": "Pretty seafood restaurant; raw bar; bright & airy; romantic neighborhood gem",
    "sourceCredit": "Infatuation"
  },
  {
    "id": "26c6f5d7-87f6-f151-f62a-2c714b45adb9",
    "name": "Peninsula",
    "slug": "peninsula",
    "city": "Nashville",
    "state": "TN",
    "neighborhood": "Germantown",
    "address": "225 Rep John Lewis Way N",
    "lat": 36.1627,
    "lng": -86.7816,
    "cuisine": "Spanish",
    "cuisineTags": [
      "Spanish"
    ],
    "vibeTags": [
      "sunset"
    ],
    "occasionTags": [
      "date-night"
    ],
    "price": "$$$",
    "priceLevel": 3,
    "vibeNotes": "Neuhoff complex; riverside bar; Spanish tapas; sunset on the river",
    "sourceCredit": "Nashville Guru"
  },
  {
    "id": "a3b8dc81-b0f1-b8bd-f946-abbc264cda91",
    "name": "Eleven11",
    "slug": "eleven11",
    "city": "Nashville",
    "state": "TN",
    "neighborhood": "West Nashville",
    "address": "Various",
    "lat": 36.1627,
    "lng": -86.7816,
    "cuisine": "Wine Bar / Fine Dining",
    "cuisineTags": [
      "Wine Bar",
      "Fine Dining"
    ],
    "vibeTags": [
      "wine"
    ],
    "occasionTags": [
      "date-night"
    ],
    "price": "$$$",
    "priceLevel": 3,
    "vibeNotes": "Part wine bar, part fine dining counter; excellent ribeye; anniversary-worthy",
    "sourceCredit": "Infatuation"
  },
  {
    "id": "b19a9dfe-063d-2c12-0581-42234aa4faa6",
    "name": "Iggy's",
    "slug": "iggy-s",
    "city": "Nashville",
    "state": "TN",
    "neighborhood": "East Nashville",
    "address": "935 W Eastland Ave",
    "lat": 36.1627,
    "lng": -86.7816,
    "cuisine": "Pasta",
    "cuisineTags": [
      "Pasta"
    ],
    "vibeTags": [],
    "occasionTags": [
      "date-night"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Little Shells with sea urchin butter; walking distance to Jeni's",
    "sourceCredit": "Infatuation"
  },
  {
    "id": "e4d37c17-55d5-a643-2fb1-d4dd1186713d",
    "name": "Xiao Bao",
    "slug": "xiao-bao",
    "city": "Nashville",
    "state": "TN",
    "neighborhood": "Germantown",
    "address": "1001 Monroe St",
    "lat": 36.1627,
    "lng": -86.7816,
    "cuisine": "Asian",
    "cuisineTags": [
      "Asian"
    ],
    "vibeTags": [
      "cozy",
      "late-night"
    ],
    "occasionTags": [
      "date-night"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Asian-inspired small plates; cozy & casual; BYOB-friendly vibes",
    "sourceCredit": "TikTok"
  },
  {
    "id": "f83a8e7e-0c48-5785-1085-de42f4b2c27e",
    "name": "Jimmy Kelly's",
    "slug": "jimmy-kelly-s",
    "city": "Nashville",
    "state": "TN",
    "neighborhood": "Midtown",
    "address": "217 Louise Ave",
    "lat": 36.1627,
    "lng": -86.7816,
    "cuisine": "Steakhouse",
    "cuisineTags": [
      "Steakhouse"
    ],
    "vibeTags": [],
    "occasionTags": [
      "date-night"
    ],
    "price": "$$$$",
    "priceLevel": 4,
    "vibeNotes": "Historic Nashville steakhouse since 1934; old-money charm; classic",
    "sourceCredit": "Nashville Guru"
  },
  {
    "id": "327892d1-64da-c3a3-ebea-5d93002fc15a",
    "name": "Tootsie's",
    "slug": "tootsie-s",
    "city": "Nashville",
    "state": "TN",
    "neighborhood": "Broadway",
    "address": "422 Broadway",
    "lat": 36.1627,
    "lng": -86.7816,
    "cuisine": "Honky Tonk",
    "cuisineTags": [
      "Honky Tonk"
    ],
    "vibeTags": [
      "rooftop",
      "live-music",
      "iconic"
    ],
    "occasionTags": [
      "group-night-out"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "3-story iconic honky tonk; live music 24/7; rooftop bar; Nashville essential",
    "sourceCredit": "TikTok"
  },
  {
    "id": "66f91077-a6e4-aa5b-97ef-a0cc5c49f94f",
    "name": "The Stage",
    "slug": "the-stage",
    "city": "Nashville",
    "state": "TN",
    "neighborhood": "Broadway",
    "address": "412 Broadway",
    "lat": 36.1627,
    "lng": -86.7816,
    "cuisine": "Honky Tonk",
    "cuisineTags": [
      "Honky Tonk"
    ],
    "vibeTags": [
      "live-music"
    ],
    "occasionTags": [
      "group-night-out"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Multi-floor live music; raucous energy; bachelor/bachelorette central",
    "sourceCredit": "Instagram"
  },
  {
    "id": "3b5d32b7-e879-2c53-2bbf-836beb2ebb8a",
    "name": "Honky Tonk Central",
    "slug": "honky-tonk-central",
    "city": "Nashville",
    "state": "TN",
    "neighborhood": "Broadway",
    "address": "329 Broadway",
    "lat": 36.1627,
    "lng": -86.7816,
    "cuisine": "Honky Tonk",
    "cuisineTags": [
      "Honky Tonk"
    ],
    "vibeTags": [
      "rooftop",
      "live-music"
    ],
    "occasionTags": [
      "group-night-out"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "3-story venue; best rooftop on Broadway; non-stop live music",
    "sourceCredit": "TikTok"
  },
  {
    "id": "180cb24e-b457-3c9f-7ff8-f5bf1de53627",
    "name": "Maemax Market",
    "slug": "maemax-market",
    "city": "Nashville",
    "state": "TN",
    "neighborhood": "Wedgewood-Houston",
    "address": "1113 Halcyon Ave",
    "lat": 36.1627,
    "lng": -86.7816,
    "cuisine": "Food Hall",
    "cuisineTags": [
      "Food Hall"
    ],
    "vibeTags": [
      "trendy"
    ],
    "occasionTags": [
      "group-night-out"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "New food hall; multiple vendors; trendy WeHo neighborhood",
    "sourceCredit": "Nashville Guru"
  },
  {
    "id": "eb2cd008-d3d7-b6a4-7f48-b00d796e991a",
    "name": "House of Spirits",
    "slug": "house-of-spirits",
    "city": "Nashville",
    "state": "TN",
    "neighborhood": "Various",
    "address": "Pop-up locations",
    "lat": 36.1627,
    "lng": -86.7816,
    "cuisine": "Immersive Cocktails",
    "cuisineTags": [
      "Immersive Cocktails"
    ],
    "vibeTags": [
      "cocktails"
    ],
    "occasionTags": [
      "group-night-out"
    ],
    "price": "$$$",
    "priceLevel": 3,
    "vibeNotes": "Immersive cocktail experience; theatrical magic; group event",
    "sourceCredit": "Instagram"
  },
  {
    "id": "a542df0f-4f5f-c70e-a843-e5a767663c73",
    "name": "Graduate Nashville",
    "slug": "graduate-nashville",
    "city": "Nashville",
    "state": "TN",
    "neighborhood": "Midtown",
    "address": "101 20th Ave N",
    "lat": 36.1627,
    "lng": -86.7816,
    "cuisine": "Hotel Bar / Rooftop",
    "cuisineTags": [
      "Hotel Bar",
      "Rooftop"
    ],
    "vibeTags": [
      "rooftop",
      "iconic"
    ],
    "occasionTags": [
      "group-night-out"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "White Limozeen rooftop; pink decor; Dolly Parton theme; iconic",
    "sourceCredit": "TikTok"
  },
  {
    "id": "bcdd046a-0145-21d3-1852-9684afecf972",
    "name": "Buttermilk Ranch",
    "slug": "buttermilk-ranch",
    "city": "Nashville",
    "state": "TN",
    "neighborhood": "South Nashville",
    "address": "1201 Grundy St",
    "lat": 36.1627,
    "lng": -86.7816,
    "cuisine": "Bar / Live Music",
    "cuisineTags": [
      "Bar",
      "Live Music"
    ],
    "vibeTags": [
      "live-music"
    ],
    "occasionTags": [
      "group-night-out"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Honky tonk vibes off Broadway; less tourist, more local",
    "sourceCredit": "Instagram"
  },
  {
    "id": "a412de39-f562-c25b-3e5d-8eda7da92137",
    "name": "Assembly Food Hall",
    "slug": "assembly-food-hall",
    "city": "Nashville",
    "state": "TN",
    "neighborhood": "Broadway",
    "address": "5th & Broadway",
    "lat": 36.1627,
    "lng": -86.7816,
    "cuisine": "Food Hall",
    "cuisineTags": [
      "Food Hall"
    ],
    "vibeTags": [
      "rooftop"
    ],
    "occasionTags": [
      "group-night-out"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "30+ vendors; rooftop; Broadway views; group-friendly",
    "sourceCredit": "TikTok"
  },
  {
    "id": "17e963e2-f509-dd80-b2a6-98fc3c4a1672",
    "name": "The Catbird Seat",
    "slug": "the-catbird-seat",
    "city": "Nashville",
    "state": "TN",
    "neighborhood": "Midtown",
    "address": "1711 Division St",
    "lat": 36.1627,
    "lng": -86.7816,
    "cuisine": "Tasting Menu",
    "cuisineTags": [
      "Tasting Menu"
    ],
    "vibeTags": [],
    "occasionTags": [
      "in-laws"
    ],
    "price": "$$$$",
    "priceLevel": 4,
    "vibeNotes": "Chef's counter; 22 seats; one of Nashville's best; special occasion",
    "sourceCredit": "Resy"
  },
  {
    "id": "e2048335-12a3-7932-14d9-851a93e8bb50",
    "name": "Husk",
    "slug": "husk",
    "city": "Nashville",
    "state": "TN",
    "neighborhood": "Downtown",
    "address": "37 Rutledge St",
    "lat": 36.1627,
    "lng": -86.7816,
    "cuisine": "Southern",
    "cuisineTags": [
      "Southern"
    ],
    "vibeTags": [
      "elegant"
    ],
    "occasionTags": [
      "in-laws"
    ],
    "price": "$$$",
    "priceLevel": 3,
    "vibeNotes": "Sean Brock's Southern landmark; seasonal menu; elegant historic home",
    "sourceCredit": "James Beard"
  },
  {
    "id": "a1d9dea9-5b1e-f5c9-e15a-e27efa05a458",
    "name": "Margot Cafe & Bar",
    "slug": "margot-cafe-bar",
    "city": "Nashville",
    "state": "TN",
    "neighborhood": "East Nashville",
    "address": "1017 Woodland St",
    "lat": 36.1627,
    "lng": -86.7816,
    "cuisine": "French",
    "cuisineTags": [
      "French"
    ],
    "vibeTags": [
      "intimate"
    ],
    "occasionTags": [
      "in-laws"
    ],
    "price": "$$$",
    "priceLevel": 3,
    "vibeNotes": "French-inspired; seasonal; charming brick building; intimate",
    "sourceCredit": "Resy"
  },
  {
    "id": "97f42967-20ea-38bb-64d4-ea0575f37d9d",
    "name": "Josephine",
    "slug": "josephine",
    "city": "Nashville",
    "state": "TN",
    "neighborhood": "12 South",
    "address": "2316 12th Ave S",
    "lat": 36.1627,
    "lng": -86.7816,
    "cuisine": "Southern",
    "cuisineTags": [
      "Southern"
    ],
    "vibeTags": [],
    "occasionTags": [
      "in-laws"
    ],
    "price": "$$$",
    "priceLevel": 3,
    "vibeNotes": "Refined Southern; neighborhood favorite; warm hospitality",
    "sourceCredit": "OpenTable"
  },
  {
    "id": "bf20f3e9-24fd-90aa-74b5-cf114e59897d",
    "name": "City House",
    "slug": "city-house",
    "city": "Nashville",
    "state": "TN",
    "neighborhood": "Germantown",
    "address": "1222 4th Ave N",
    "lat": 36.1627,
    "lng": -86.7816,
    "cuisine": "Italian-Southern",
    "cuisineTags": [
      "Italian-Southern"
    ],
    "vibeTags": [],
    "occasionTags": [
      "in-laws"
    ],
    "price": "$$$",
    "priceLevel": 3,
    "vibeNotes": "Pizza & pasta with Southern twist; James Beard winner; brick oven",
    "sourceCredit": "James Beard"
  },
  {
    "id": "227446f8-9f50-23e6-2a14-b92736bfa21a",
    "name": "JoJo's",
    "slug": "jojo-s",
    "city": "Nashville",
    "state": "TN",
    "neighborhood": "East Nashville",
    "address": "1000 Main St",
    "lat": 36.1627,
    "lng": -86.7816,
    "cuisine": "Pizza / Bar",
    "cuisineTags": [
      "Pizza",
      "Bar"
    ],
    "vibeTags": [
      "fun",
      "late-night"
    ],
    "occasionTags": [
      "girls-night"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Proudly local pizzeria; late-night slices; easy fun date or girls night",
    "sourceCredit": "Infatuation"
  },
  {
    "id": "f8885e0e-06f9-7c42-5142-d5ff856d56e0",
    "name": "Tash Tea",
    "slug": "tash-tea",
    "city": "Nashville",
    "state": "TN",
    "neighborhood": "Germantown",
    "address": "806 Jefferson St",
    "lat": 36.1627,
    "lng": -86.7816,
    "cuisine": "Tea Bar",
    "cuisineTags": [
      "Tea Bar"
    ],
    "vibeTags": [],
    "occasionTags": [
      "girls-night"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Aesthetic tea bar; specialty lattes; photogenic everything",
    "sourceCredit": "TikTok"
  },
  {
    "id": "eb95c590-664f-ba62-282d-5eee2e0d3afc",
    "name": "Acme Feed & Seed",
    "slug": "acme-feed-seed",
    "city": "Nashville",
    "state": "TN",
    "neighborhood": "Broadway",
    "address": "101 Broadway",
    "lat": 36.1627,
    "lng": -86.7816,
    "cuisine": "Multi-Level Bar",
    "cuisineTags": [
      "Multi-Level Bar"
    ],
    "vibeTags": [
      "fun",
      "rooftop",
      "live-music"
    ],
    "occasionTags": [
      "girls-night"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Rooftop bar; live music; sushi bar; 3 floors of fun",
    "sourceCredit": "Instagram"
  },
  {
    "id": "b319b0a3-fcc5-3a54-64a4-2b277d5966a3",
    "name": "Rare Bird Rooftop",
    "slug": "rare-bird-rooftop",
    "city": "Nashville",
    "state": "TN",
    "neighborhood": "Midtown",
    "address": "2600 8th Ave S",
    "lat": 36.1627,
    "lng": -86.7816,
    "cuisine": "Rooftop Bar",
    "cuisineTags": [
      "Rooftop Bar"
    ],
    "vibeTags": [
      "rooftop",
      "cocktails"
    ],
    "occasionTags": [
      "girls-night"
    ],
    "price": "$$$",
    "priceLevel": 3,
    "vibeNotes": "Noelle Hotel rooftop; craft cocktails; skyline views; chic",
    "sourceCredit": "TikTok"
  },
  {
    "id": "a815c94a-9177-6387-5fb7-c079699327c6",
    "name": "Rosemary & Beauty Queen",
    "slug": "rosemary-beauty-queen",
    "city": "Nashville",
    "state": "TN",
    "neighborhood": "Germantown",
    "address": "1210 5th Ave N",
    "lat": 36.1627,
    "lng": -86.7816,
    "cuisine": "Southern Brunch",
    "cuisineTags": [
      "Southern Brunch"
    ],
    "vibeTags": [
      "cocktails",
      "brunch"
    ],
    "occasionTags": [
      "girls-night"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Southern comfort brunch; boozy cocktails; cute vintage decor",
    "sourceCredit": "Instagram"
  },
  {
    "id": "dba50c6d-5ab0-9c0b-f717-5d2928ecc575",
    "name": "Stay Golden",
    "slug": "stay-golden",
    "city": "Nashville",
    "state": "TN",
    "neighborhood": "South Nashville",
    "address": "2700 12th Ave S",
    "lat": 36.1627,
    "lng": -86.7816,
    "cuisine": "Coffee / Cocktails",
    "cuisineTags": [
      "Coffee",
      "Cocktails"
    ],
    "vibeTags": [
      "cocktails"
    ],
    "occasionTags": [
      "girls-night"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Day-to-night cafe; specialty coffee by day; cocktails by night",
    "sourceCredit": "TikTok"
  },
  {
    "id": "05950309-6e1f-1214-4473-87cadaaaf2e7",
    "name": "The Patterson House",
    "slug": "the-patterson-house",
    "city": "Nashville",
    "state": "TN",
    "neighborhood": "Midtown",
    "address": "1711 Division St",
    "lat": 36.1627,
    "lng": -86.7816,
    "cuisine": "Cocktail Bar",
    "cuisineTags": [
      "Cocktail Bar"
    ],
    "vibeTags": [
      "intimate",
      "cocktails"
    ],
    "occasionTags": [
      "girls-night"
    ],
    "price": "$$$",
    "priceLevel": 3,
    "vibeNotes": "Speakeasy vibes; no standing room; intimate craft cocktails",
    "sourceCredit": "Resy"
  },
  {
    "id": "c4e02a40-ce2c-4200-e40b-51b58157be7b",
    "name": "Martin's Bar-B-Que",
    "slug": "martin-s-bar-b-que",
    "city": "Nashville",
    "state": "TN",
    "neighborhood": "Multiple",
    "address": "410 4th Ave S",
    "lat": 36.1627,
    "lng": -86.7816,
    "cuisine": "BBQ",
    "cuisineTags": [
      "BBQ"
    ],
    "vibeTags": [
      "iconic"
    ],
    "occasionTags": [
      "guys-night"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Whole-hog BBQ; brisket & ribs; no frills; iconic Nashville eats",
    "sourceCredit": "TikTok"
  },
  {
    "id": "19469678-2194-fd7b-67a0-5c7d549db9ba",
    "name": "Nashville Underground",
    "slug": "nashville-underground",
    "city": "Nashville",
    "state": "TN",
    "neighborhood": "Broadway",
    "address": "105 Broadway",
    "lat": 36.1627,
    "lng": -86.7816,
    "cuisine": "Bar / Club",
    "cuisineTags": [
      "Bar",
      "Club"
    ],
    "vibeTags": [
      "live-music"
    ],
    "occasionTags": [
      "guys-night"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Massive multi-level; live music; sports; pool; group energy",
    "sourceCredit": "Instagram"
  },
  {
    "id": "ebc1ea09-a727-3232-52a4-b19746135fd6",
    "name": "The Hermitage Hotel Bar",
    "slug": "the-hermitage-hotel-bar",
    "city": "Nashville",
    "state": "TN",
    "neighborhood": "Downtown",
    "address": "231 6th Ave N",
    "lat": 36.1627,
    "lng": -86.7816,
    "cuisine": "Hotel Bar",
    "cuisineTags": [
      "Hotel Bar"
    ],
    "vibeTags": [
      "cocktails"
    ],
    "occasionTags": [
      "guys-night"
    ],
    "price": "$$$",
    "priceLevel": 3,
    "vibeNotes": "Classic cocktails; old-money elegance; power drinks",
    "sourceCredit": "Resy"
  },
  {
    "id": "cdf7d334-0ba3-a723-4355-43867b60a95d",
    "name": "Topgolf Nashville",
    "slug": "topgolf-nashville",
    "city": "Nashville",
    "state": "TN",
    "neighborhood": "Midtown",
    "address": "500 Cowan St",
    "lat": 36.1627,
    "lng": -86.7816,
    "cuisine": "Entertainment",
    "cuisineTags": [
      "Entertainment"
    ],
    "vibeTags": [],
    "occasionTags": [
      "guys-night"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Driving range; games; bar; group competition",
    "sourceCredit": "Yelp"
  },
  {
    "id": "f05b314a-4874-86f7-44c8-9c8e17ecd800",
    "name": "Rudy's Jazz Room",
    "slug": "rudy-s-jazz-room",
    "city": "Nashville",
    "state": "TN",
    "neighborhood": "SoBro",
    "address": "809 Gleaves St",
    "lat": 36.1627,
    "lng": -86.7816,
    "cuisine": "Jazz Club",
    "cuisineTags": [
      "Jazz Club"
    ],
    "vibeTags": [
      "intimate",
      "cocktails"
    ],
    "occasionTags": [
      "guys-night"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Intimate jazz club; craft cocktails; sophisticated night out",
    "sourceCredit": "Instagram"
  },
  {
    "id": "943c0aab-f96c-4981-6a52-e10f62396c3c",
    "name": "Printer's Alley",
    "slug": "printer-s-alley",
    "city": "Nashville",
    "state": "TN",
    "neighborhood": "Downtown",
    "address": "Printer's Alley",
    "lat": 36.1627,
    "lng": -86.7816,
    "cuisine": "Bar District",
    "cuisineTags": [
      "Bar District"
    ],
    "vibeTags": [
      "live-music"
    ],
    "occasionTags": [
      "guys-night"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Historic nightlife alley; multiple bars; live music; pub crawl ready",
    "sourceCredit": "TikTok"
  },
  {
    "id": "9ad4ebec-48eb-ce59-f8c8-3462f4f3a10c",
    "name": "Broadway Honky Tonk Crawl",
    "slug": "broadway-honky-tonk-crawl",
    "city": "Nashville",
    "state": "TN",
    "neighborhood": "Broadway",
    "address": "Lower Broadway",
    "lat": 36.1627,
    "lng": -86.7816,
    "cuisine": "Bar Crawl",
    "cuisineTags": [
      "Bar Crawl"
    ],
    "vibeTags": [],
    "occasionTags": [
      "bachelor"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Hit Kid Rock's, Luke Bryan's, Jason Aldean's back-to-back; bachelor essential",
    "sourceCredit": "TikTok"
  },
  {
    "id": "0cdf385c-9f7d-427e-a1df-e342204bd021",
    "name": "Pedal Tavern",
    "slug": "pedal-tavern",
    "city": "Nashville",
    "state": "TN",
    "neighborhood": "Various",
    "address": "Various pickup spots",
    "lat": 36.1627,
    "lng": -86.7816,
    "cuisine": "Party Bike",
    "cuisineTags": [
      "Party Bike"
    ],
    "vibeTags": [
      "iconic"
    ],
    "occasionTags": [
      "bachelor"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "BYOB pedal-powered bar; Nashville's iconic group activity",
    "sourceCredit": "Instagram"
  },
  {
    "id": "38725f03-9e13-cf90-4e60-bc0c64e879c3",
    "name": "Nashville Party Bus",
    "slug": "nashville-party-bus",
    "city": "Nashville",
    "state": "TN",
    "neighborhood": "Various",
    "address": "Various",
    "lat": 36.1627,
    "lng": -86.7816,
    "cuisine": "Party Bus",
    "cuisineTags": [
      "Party Bus"
    ],
    "vibeTags": [],
    "occasionTags": [
      "bachelor"
    ],
    "price": "$$$",
    "priceLevel": 3,
    "vibeNotes": "Custom routes; LED lights; BYOB; honky tonk shuttle",
    "sourceCredit": "Yelp"
  },
  {
    "id": "b74dffdc-4f87-907b-6259-a3083289166b",
    "name": "Nashville Shores",
    "slug": "nashville-shores",
    "city": "Nashville",
    "state": "TN",
    "neighborhood": "Hermitage",
    "address": "4001 Bell Rd",
    "lat": 36.1627,
    "lng": -86.7816,
    "cuisine": "Waterpark",
    "cuisineTags": [
      "Waterpark"
    ],
    "vibeTags": [],
    "occasionTags": [
      "bachelor"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Lakeside waterpark; boat rentals; beach; day party",
    "sourceCredit": "TikTok"
  },
  {
    "id": "0905af27-e874-c224-2547-3bdabe4a129d",
    "name": "FGL House",
    "slug": "fgl-house",
    "city": "Nashville",
    "state": "TN",
    "neighborhood": "Broadway",
    "address": "120 3rd Ave S",
    "lat": 36.1627,
    "lng": -86.7816,
    "cuisine": "Bar / Rooftop",
    "cuisineTags": [
      "Bar",
      "Rooftop"
    ],
    "vibeTags": [
      "rooftop"
    ],
    "occasionTags": [
      "bachelor"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Florida Georgia Line's bar; rooftop pool; party vibes",
    "sourceCredit": "Instagram"
  },
  {
    "id": "56392c22-c4ac-5522-4bb1-a86d04290765",
    "name": "Top Golf + Broadway combo",
    "slug": "top-golf-broadway-combo",
    "city": "Nashville",
    "state": "TN",
    "neighborhood": "Midtown / Broadway",
    "address": "500 Cowan St + Broadway",
    "lat": 36.1627,
    "lng": -86.7816,
    "cuisine": "Activity + Nightlife",
    "cuisineTags": [
      "Activity + Nightlife"
    ],
    "vibeTags": [
      "late-night"
    ],
    "occasionTags": [
      "bachelor"
    ],
    "price": "$$$",
    "priceLevel": 3,
    "vibeNotes": "Day at Topgolf then Broadway bar crawl; classic bachelor template",
    "sourceCredit": "TikTok"
  },
  {
    "id": "cdb4ec92-1dfb-75a2-0d25-bcaa9fa9968b",
    "name": "Percy Warner Park",
    "slug": "percy-warner-park",
    "city": "Nashville",
    "state": "TN",
    "neighborhood": "Belle Meade",
    "address": "7311 TN-100",
    "lat": 36.1627,
    "lng": -86.7816,
    "cuisine": "Hiking",
    "cuisineTags": [
      "Hiking"
    ],
    "vibeTags": [],
    "occasionTags": [
      "outdoor-adventure"
    ],
    "price": "Free",
    "priceLevel": 1,
    "vibeNotes": "Stunning wooded trails; 10+ miles of paths; scenic overlooks",
    "sourceCredit": "TikTok"
  },
  {
    "id": "c23a265c-49f9-f575-2fc2-6b372b97b49c",
    "name": "Cumberland River Kayaking",
    "slug": "cumberland-river-kayaking",
    "city": "Nashville",
    "state": "TN",
    "neighborhood": "Downtown",
    "address": "Various launches",
    "lat": 36.1627,
    "lng": -86.7816,
    "cuisine": "Kayaking",
    "cuisineTags": [
      "Kayaking"
    ],
    "vibeTags": [],
    "occasionTags": [
      "outdoor-adventure"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Paddle past downtown skyline; group kayak or SUP rentals",
    "sourceCredit": "Viator"
  },
  {
    "id": "3ba91bff-ce15-f031-c360-b4b1ff27db31",
    "name": "Shelby Bottoms Greenway",
    "slug": "shelby-bottoms-greenway",
    "city": "Nashville",
    "state": "TN",
    "neighborhood": "East Nashville",
    "address": "1900 Davidson St",
    "lat": 36.1627,
    "lng": -86.7816,
    "cuisine": "Trail",
    "cuisineTags": [
      "Trail"
    ],
    "vibeTags": [],
    "occasionTags": [
      "outdoor-adventure"
    ],
    "price": "Free",
    "priceLevel": 1,
    "vibeNotes": "Paved trail; nature center; bike-friendly; relaxed crew walk",
    "sourceCredit": "Instagram"
  },
  {
    "id": "27f6fed7-e55d-9148-c8da-3c1917a1848d",
    "name": "General Jackson Showboat",
    "slug": "general-jackson-showboat",
    "city": "Nashville",
    "state": "TN",
    "neighborhood": "Opryland",
    "address": "2812 Opryland Dr",
    "lat": 36.1627,
    "lng": -86.7816,
    "cuisine": "River Cruise",
    "cuisineTags": [
      "River Cruise"
    ],
    "vibeTags": [],
    "occasionTags": [
      "outdoor-adventure"
    ],
    "price": "$$$",
    "priceLevel": 3,
    "vibeNotes": "Dinner cruise on Cumberland; live entertainment; scenic",
    "sourceCredit": "TikTok"
  },
  {
    "id": "e6238b9e-e33c-c460-5989-e83c447a3adf",
    "name": "Centennial Park",
    "slug": "centennial-park",
    "city": "Nashville",
    "state": "TN",
    "neighborhood": "Midtown",
    "address": "2500 West End Ave",
    "lat": 36.1627,
    "lng": -86.7816,
    "cuisine": "Park",
    "cuisineTags": [
      "Park"
    ],
    "vibeTags": [
      "sunset"
    ],
    "occasionTags": [
      "outdoor-adventure"
    ],
    "price": "Free",
    "priceLevel": 1,
    "vibeNotes": "Full-scale Parthenon replica; picnic lawn; sunset hang",
    "sourceCredit": "Instagram"
  },
  {
    "id": "bc364a40-45ab-d32d-7314-17bea1f68de4",
    "name": "130 Club Tenafly",
    "slug": "130-club-tenafly",
    "city": "New Jersey",
    "state": "NJ",
    "neighborhood": "Tenafly",
    "address": "130 County Rd",
    "lat": 40.0583,
    "lng": -74.4057,
    "cuisine": "Italian-American",
    "cuisineTags": [
      "Italian-American"
    ],
    "vibeTags": [
      "upscale",
      "viral",
      "cocktails"
    ],
    "occasionTags": [
      "date-night",
      "girls-night"
    ],
    "price": "$$$$",
    "priceLevel": 4,
    "vibeNotes": "9.3K TikTok likes; \"hottest restaurant in Jersey\"; upscale supper club",
    "sourceCredit": "TikTok @em.loren_"
  },
  {
    "id": "9d430f28-0466-07ce-4eec-853a70e1729b",
    "name": "Ora Italian",
    "slug": "ora-italian",
    "city": "New Jersey",
    "state": "NJ",
    "neighborhood": "Jersey City",
    "address": "333 Washington St",
    "lat": 40.0583,
    "lng": -74.4057,
    "cuisine": "Italian",
    "cuisineTags": [
      "Italian"
    ],
    "vibeTags": [
      "hidden-gem",
      "viral",
      "cozy",
      "intimate",
      "wine"
    ],
    "occasionTags": [
      "date-night",
      "girls-night"
    ],
    "price": "$$$",
    "priceLevel": 3,
    "vibeNotes": "5.5K TikTok likes; \"hidden gem\"; handmade pasta; candlelit",
    "sourceCredit": "TikTok @lifewithhskye"
  },
  {
    "id": "bb97674c-4114-afba-8828-70e452d673dd",
    "name": "Flour",
    "slug": "flour",
    "city": "New Jersey",
    "state": "NJ",
    "neighborhood": "Hoboken",
    "address": "1028 Washington St",
    "lat": 40.0583,
    "lng": -74.4057,
    "cuisine": "Italian",
    "cuisineTags": [
      "Italian"
    ],
    "vibeTags": [
      "intimate"
    ],
    "occasionTags": [
      "date-night"
    ],
    "price": "$$$",
    "priceLevel": 3,
    "vibeNotes": "Hoboken pasta haven; intimate; BYOB; chef-driven",
    "sourceCredit": "Eater NY"
  },
  {
    "id": "7843e611-9cca-b462-c5fe-e1da05bd0d67",
    "name": "Minoru",
    "slug": "minoru",
    "city": "New Jersey",
    "state": "NJ",
    "neighborhood": "Montclair",
    "address": "50 Church St",
    "lat": 40.0583,
    "lng": -74.4057,
    "cuisine": "Japanese Omakase",
    "cuisineTags": [
      "Japanese Omakase"
    ],
    "vibeTags": [
      "intimate"
    ],
    "occasionTags": [
      "date-night"
    ],
    "price": "$$$$",
    "priceLevel": 4,
    "vibeNotes": "NJ Digest Top 30; intimate omakase; Montclair gem",
    "sourceCredit": "TikTok NJ foodie"
  },
  {
    "id": "cf9a4f01-23f7-1303-6c2b-784db7450ae8",
    "name": "Chez Catherine",
    "slug": "chez-catherine",
    "city": "New Jersey",
    "state": "NJ",
    "neighborhood": "Westfield",
    "address": "431 North Ave W",
    "lat": 40.0583,
    "lng": -74.4057,
    "cuisine": "French",
    "cuisineTags": [
      "French"
    ],
    "vibeTags": [],
    "occasionTags": [
      "date-night"
    ],
    "price": "$$$$",
    "priceLevel": 4,
    "vibeNotes": "Classic French fine dining; prix fixe; suburban elegance",
    "sourceCredit": "TikTok @em.loren_"
  },
  {
    "id": "1ef8fc52-5908-f9bf-ae94-515c10578884",
    "name": "Latour",
    "slug": "latour",
    "city": "New Jersey",
    "state": "NJ",
    "neighborhood": "Ridgewood",
    "address": "6 E Ridgewood Ave",
    "lat": 40.0583,
    "lng": -74.4057,
    "cuisine": "French",
    "cuisineTags": [
      "French"
    ],
    "vibeTags": [
      "wine"
    ],
    "occasionTags": [
      "date-night"
    ],
    "price": "$$$$",
    "priceLevel": 4,
    "vibeNotes": "French fine dining; 30+ year institution; wine cellar",
    "sourceCredit": "NJ Monthly"
  },
  {
    "id": "1997e37e-1ff9-f6d9-3bf9-53e200a63b25",
    "name": "Saddle River Inn",
    "slug": "saddle-river-inn",
    "city": "New Jersey",
    "state": "NJ",
    "neighborhood": "Saddle River",
    "address": "2 Barnstable Ct",
    "lat": 40.0583,
    "lng": -74.4057,
    "cuisine": "French-American",
    "cuisineTags": [
      "French-American"
    ],
    "vibeTags": [
      "romantic"
    ],
    "occasionTags": [
      "date-night"
    ],
    "price": "$$$$",
    "priceLevel": 4,
    "vibeNotes": "Barn-to-restaurant conversion; tasting menus; romantic",
    "sourceCredit": "NJ Monthly"
  },
  {
    "id": "5d8e2fc0-fcb9-7918-ec16-f8c639f87e4f",
    "name": "Luigino's",
    "slug": "luigino-s",
    "city": "New Jersey",
    "state": "NJ",
    "neighborhood": "Montclair",
    "address": "49 Bloomfield Ave",
    "lat": 40.0583,
    "lng": -74.4057,
    "cuisine": "Italian",
    "cuisineTags": [
      "Italian"
    ],
    "vibeTags": [
      "cozy"
    ],
    "occasionTags": [
      "date-night"
    ],
    "price": "$$$",
    "priceLevel": 3,
    "vibeNotes": "Montclair neighborhood Italian; fresh pasta; cozy date spot",
    "sourceCredit": "TikTok NJ foodie"
  },
  {
    "id": "abf5ccec-5f3c-985b-b54b-c56203325bbf",
    "name": "Fire & Oak",
    "slug": "fire-oak",
    "city": "New Jersey",
    "state": "NJ",
    "neighborhood": "Jersey City",
    "address": "479 Washington Blvd",
    "lat": 40.0583,
    "lng": -74.4057,
    "cuisine": "American-Lounge",
    "cuisineTags": [
      "American-Lounge"
    ],
    "vibeTags": [
      "upscale",
      "viral"
    ],
    "occasionTags": [
      "group-night-out",
      "guys-night"
    ],
    "price": "$$$",
    "priceLevel": 3,
    "vibeNotes": "23.6K TikTok likes; upscale American; great group energy",
    "sourceCredit": "TikTok @lifewithhskye"
  },
  {
    "id": "0eb02df5-c3af-3fcc-2b62-319cffc867d6",
    "name": "Madison Modern Social",
    "slug": "madison-modern-social",
    "city": "New Jersey",
    "state": "NJ",
    "neighborhood": "Hoboken",
    "address": "1316 Washington St",
    "lat": 40.0583,
    "lng": -74.4057,
    "cuisine": "American-Lounge",
    "cuisineTags": [
      "American-Lounge"
    ],
    "vibeTags": [
      "cocktails"
    ],
    "occasionTags": [
      "group-night-out"
    ],
    "price": "$$$",
    "priceLevel": 3,
    "vibeNotes": "Hoboken hotspot; craft cocktails; modern social dining",
    "sourceCredit": "TikTok NJ foodie"
  },
  {
    "id": "61932ff2-7728-d18a-7644-1eba7b07769f",
    "name": "Pilsener Haus",
    "slug": "pilsener-haus",
    "city": "New Jersey",
    "state": "NJ",
    "neighborhood": "Hoboken",
    "address": "1422 Grand St",
    "lat": 40.0583,
    "lng": -74.4057,
    "cuisine": "Beer Hall-German",
    "cuisineTags": [
      "Beer Hall-German"
    ],
    "vibeTags": [],
    "occasionTags": [
      "group-night-out",
      "guys-night",
      "bachelor"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Massive beer garden; communal tables; giant pretzels",
    "sourceCredit": "Eater NY"
  },
  {
    "id": "373c6e03-6cfc-ac5b-0a77-6a6c53a4f7b9",
    "name": "NoHu Rooftop",
    "slug": "nohu-rooftop",
    "city": "New Jersey",
    "state": "NJ",
    "neighborhood": "Hoboken",
    "address": "550 Washington Blvd",
    "lat": 40.0583,
    "lng": -74.4057,
    "cuisine": "Rooftop Bar",
    "cuisineTags": [
      "Rooftop Bar"
    ],
    "vibeTags": [
      "rooftop",
      "sunset",
      "cocktails"
    ],
    "occasionTags": [
      "group-night-out",
      "girls-night",
      "bachelor"
    ],
    "price": "$$$",
    "priceLevel": 3,
    "vibeNotes": "Manhattan skyline views; rooftop drinks; sunset perfection",
    "sourceCredit": "Eater NY"
  },
  {
    "id": "a8bc226a-61cd-b75d-4de8-15e4484dc127",
    "name": "Molos",
    "slug": "molos",
    "city": "New Jersey",
    "state": "NJ",
    "neighborhood": "Weehawken",
    "address": "1 Pershing Rd",
    "lat": 40.0583,
    "lng": -74.4057,
    "cuisine": "Greek Seafood",
    "cuisineTags": [
      "Greek Seafood"
    ],
    "vibeTags": [
      "waterfront",
      "viral"
    ],
    "occasionTags": [
      "group-night-out",
      "guys-night"
    ],
    "price": "$$$$",
    "priceLevel": 4,
    "vibeNotes": "8K TikTok likes; waterfront Greek; NYC skyline views",
    "sourceCredit": "TikTok @lifewithhskye"
  },
  {
    "id": "3bfdf835-e72c-855c-8991-973f2e3925e4",
    "name": "Matisse167",
    "slug": "matisse167",
    "city": "New Jersey",
    "state": "NJ",
    "neighborhood": "Rutherford",
    "address": "167 Park Ave",
    "lat": 40.0583,
    "lng": -74.4057,
    "cuisine": "Mediterranean",
    "cuisineTags": [
      "Mediterranean"
    ],
    "vibeTags": [
      "upscale",
      "viral"
    ],
    "occasionTags": [
      "group-night-out"
    ],
    "price": "$$$",
    "priceLevel": 3,
    "vibeNotes": "TikTok-famous; upscale Med; stylish interior",
    "sourceCredit": "TikTok @em.loren_"
  },
  {
    "id": "6e2656fe-0134-e938-8db4-45a5c5992e2f",
    "name": "Blu on the Hudson",
    "slug": "blu-on-the-hudson",
    "city": "New Jersey",
    "state": "NJ",
    "neighborhood": "Weehawken",
    "address": "Port Imperial",
    "lat": 40.0583,
    "lng": -74.4057,
    "cuisine": "Mediterranean-Waterfront",
    "cuisineTags": [
      "Mediterranean-Waterfront"
    ],
    "vibeTags": [
      "waterfront"
    ],
    "occasionTags": [
      "group-night-out"
    ],
    "price": "$$$$",
    "priceLevel": 4,
    "vibeNotes": "Waterfront Med; sweeping Manhattan views; event-ready",
    "sourceCredit": "TikTok NJ foodie"
  },
  {
    "id": "dfe43af6-8694-43c7-3235-82d9192ee9db",
    "name": "Barcade",
    "slug": "barcade",
    "city": "New Jersey",
    "state": "NJ",
    "neighborhood": "Jersey City",
    "address": "163 Newark Ave",
    "lat": 40.0583,
    "lng": -74.4057,
    "cuisine": "Arcade Bar",
    "cuisineTags": [
      "Arcade Bar"
    ],
    "vibeTags": [
      "fun"
    ],
    "occasionTags": [
      "group-night-out",
      "guys-night"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Retro arcade + craft beer; group competition; nostalgic fun",
    "sourceCredit": "Eater NY"
  },
  {
    "id": "3415d513-1189-d8aa-5c0c-d5cd5262ebd4",
    "name": "Fascino",
    "slug": "fascino",
    "city": "New Jersey",
    "state": "NJ",
    "neighborhood": "Montclair",
    "address": "331 Bloomfield Ave",
    "lat": 40.0583,
    "lng": -74.4057,
    "cuisine": "Italian",
    "cuisineTags": [
      "Italian"
    ],
    "vibeTags": [
      "elegant"
    ],
    "occasionTags": [
      "family"
    ],
    "price": "$$$",
    "priceLevel": 3,
    "vibeNotes": "Elegant Montclair Italian; fresh pasta; warm service",
    "sourceCredit": "NJ Monthly"
  },
  {
    "id": "b2eee906-2b74-2984-42b0-9dbdf0145d62",
    "name": "The Pluckemin Inn",
    "slug": "the-pluckemin-inn",
    "city": "New Jersey",
    "state": "NJ",
    "neighborhood": "Bedminster",
    "address": "359 US-206 S",
    "lat": 40.0583,
    "lng": -74.4057,
    "cuisine": "American",
    "cuisineTags": [
      "American"
    ],
    "vibeTags": [
      "elegant",
      "wine"
    ],
    "occasionTags": [
      "family"
    ],
    "price": "$$$$",
    "priceLevel": 4,
    "vibeNotes": "Elegant country inn; seasonal menu; wine spectator award",
    "sourceCredit": "NJ Monthly"
  },
  {
    "id": "bc6af586-6f1d-d090-233f-a5b84d7443de",
    "name": "Cafe Matisse",
    "slug": "cafe-matisse",
    "city": "New Jersey",
    "state": "NJ",
    "neighborhood": "Rutherford",
    "address": "167 Park Ave",
    "lat": 40.0583,
    "lng": -74.4057,
    "cuisine": "New American-French",
    "cuisineTags": [
      "New American-French"
    ],
    "vibeTags": [],
    "occasionTags": [
      "family"
    ],
    "price": "$$$$",
    "priceLevel": 4,
    "vibeNotes": "Art-filled space; tasting menus; sophisticated",
    "sourceCredit": "NJ Monthly"
  },
  {
    "id": "a93c498f-c412-50be-b248-c221d56fe9b4",
    "name": "Grand Vin",
    "slug": "grand-vin",
    "city": "New Jersey",
    "state": "NJ",
    "neighborhood": "Hoboken",
    "address": "118 Washington St",
    "lat": 40.0583,
    "lng": -74.4057,
    "cuisine": "French Bistro",
    "cuisineTags": [
      "French Bistro"
    ],
    "vibeTags": [
      "wine"
    ],
    "occasionTags": [
      "family"
    ],
    "price": "$$$",
    "priceLevel": 3,
    "vibeNotes": "French bistro charm; natural wine list; BYOB option",
    "sourceCredit": "Eater NY"
  },
  {
    "id": "41991eaf-2673-2ab3-16a5-a6d180cf23f9",
    "name": "Amanda's",
    "slug": "amanda-s",
    "city": "New Jersey",
    "state": "NJ",
    "neighborhood": "Hoboken",
    "address": "908 Washington St",
    "lat": 40.0583,
    "lng": -74.4057,
    "cuisine": "New American",
    "cuisineTags": [
      "New American"
    ],
    "vibeTags": [
      "intimate"
    ],
    "occasionTags": [
      "family"
    ],
    "price": "$$$",
    "priceLevel": 3,
    "vibeNotes": "Brownstone fine dining; intimate; 20+ year favorite",
    "sourceCredit": "NJ Monthly"
  },
  {
    "id": "b5dbc8f3-e5cb-8cec-e2fb-19c1194f15f0",
    "name": "Battello",
    "slug": "battello",
    "city": "New Jersey",
    "state": "NJ",
    "neighborhood": "Jersey City",
    "address": "502 Washington Blvd",
    "lat": 40.0583,
    "lng": -74.4057,
    "cuisine": "Italian-Seafood",
    "cuisineTags": [
      "Italian-Seafood"
    ],
    "vibeTags": [
      "elegant",
      "waterfront"
    ],
    "occasionTags": [
      "family"
    ],
    "price": "$$$$",
    "priceLevel": 4,
    "vibeNotes": "Waterfront Italian; Manhattan views; elegant dining",
    "sourceCredit": "Eater NY"
  },
  {
    "id": "71713412-4065-0f08-0e60-ffcd1d8a1f1b",
    "name": "Jockey Hollow",
    "slug": "jockey-hollow",
    "city": "New Jersey",
    "state": "NJ",
    "neighborhood": "Morristown",
    "address": "110 South St",
    "lat": 40.0583,
    "lng": -74.4057,
    "cuisine": "New American",
    "cuisineTags": [
      "New American"
    ],
    "vibeTags": [],
    "occasionTags": [
      "family"
    ],
    "price": "$$$$",
    "priceLevel": 4,
    "vibeNotes": "Historic mansion; 3 dining concepts; impress any parent",
    "sourceCredit": "NJ Monthly"
  },
  {
    "id": "16361385-c80d-15d9-da7c-ab6e654eae29",
    "name": "Drew's Bayshore Bistro",
    "slug": "drew-s-bayshore-bistro",
    "city": "New Jersey",
    "state": "NJ",
    "neighborhood": "Keyport",
    "address": "58 Broad St",
    "lat": 40.0583,
    "lng": -74.4057,
    "cuisine": "French Bistro",
    "cuisineTags": [
      "French Bistro"
    ],
    "vibeTags": [],
    "occasionTags": [
      "family"
    ],
    "price": "$$$",
    "priceLevel": 3,
    "vibeNotes": "Small-town French BYOB; charming; outstanding food",
    "sourceCredit": "NJ Monthly"
  },
  {
    "id": "00744539-d02d-8819-1193-af3b4f348acf",
    "name": "Cellar 335",
    "slug": "cellar-335",
    "city": "New Jersey",
    "state": "NJ",
    "neighborhood": "Jersey City",
    "address": "335 Newark Ave",
    "lat": 40.0583,
    "lng": -74.4057,
    "cuisine": "Speakeasy",
    "cuisineTags": [
      "Speakeasy"
    ],
    "vibeTags": [
      "cocktails"
    ],
    "occasionTags": [
      "girls-night"
    ],
    "price": "$$$",
    "priceLevel": 3,
    "vibeNotes": "Underground speakeasy; craft cocktails; moody lighting",
    "sourceCredit": "Eater NY"
  },
  {
    "id": "118f6a43-3548-0eda-5d49-11f53d5a16a7",
    "name": "Piggyback Bar",
    "slug": "piggyback-bar",
    "city": "New Jersey",
    "state": "NJ",
    "neighborhood": "Jersey City",
    "address": "200 Hudson St",
    "lat": 40.0583,
    "lng": -74.4057,
    "cuisine": "Cocktail Bar",
    "cuisineTags": [
      "Cocktail Bar"
    ],
    "vibeTags": [
      "cocktails"
    ],
    "occasionTags": [
      "girls-night"
    ],
    "price": "$$$",
    "priceLevel": 3,
    "vibeNotes": "Craft cocktail lounge; inventive drinks; lively",
    "sourceCredit": "TimeOut"
  },
  {
    "id": "8aec7548-54d7-9e7d-8e13-7253d25c1075",
    "name": "DeLorenzo's",
    "slug": "delorenzo-s",
    "city": "New Jersey",
    "state": "NJ",
    "neighborhood": "Trenton",
    "address": "2350 US-33",
    "lat": 40.0583,
    "lng": -74.4057,
    "cuisine": "Pizza",
    "cuisineTags": [
      "Pizza"
    ],
    "vibeTags": [],
    "occasionTags": [
      "girls-night"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Legendary NJ tomato pie; BYOB; institution",
    "sourceCredit": "NJ Monthly"
  },
  {
    "id": "99fc9320-a18b-d88a-68e5-38841d848c18",
    "name": "Maritime Parc",
    "slug": "maritime-parc",
    "city": "New Jersey",
    "state": "NJ",
    "neighborhood": "Jersey City",
    "address": "84 Audrey Zapp Dr",
    "lat": 40.0583,
    "lng": -74.4057,
    "cuisine": "American-Waterfront",
    "cuisineTags": [
      "American-Waterfront"
    ],
    "vibeTags": [
      "waterfront"
    ],
    "occasionTags": [
      "girls-night"
    ],
    "price": "$$$$",
    "priceLevel": 4,
    "vibeNotes": "Liberty State Park views; stunning waterfront; special occasion",
    "sourceCredit": "NJ Monthly"
  },
  {
    "id": "338800b5-6d32-ca05-1100-dc48a0724545",
    "name": "Ani Ramen",
    "slug": "ani-ramen",
    "city": "New Jersey",
    "state": "NJ",
    "neighborhood": "Montclair",
    "address": "25 N Fullerton Ave",
    "lat": 40.0583,
    "lng": -74.4057,
    "cuisine": "Ramen",
    "cuisineTags": [
      "Ramen"
    ],
    "vibeTags": [
      "trendy",
      "fun"
    ],
    "occasionTags": [
      "girls-night"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Best ramen in NJ; fun atmosphere; trendy",
    "sourceCredit": "Eater NY"
  },
  {
    "id": "79863d05-74d8-4bb5-4f38-491b84b360cc",
    "name": "The Shannon",
    "slug": "the-shannon",
    "city": "New Jersey",
    "state": "NJ",
    "neighborhood": "Hoboken",
    "address": "116 1st St",
    "lat": 40.0583,
    "lng": -74.4057,
    "cuisine": "Irish Pub",
    "cuisineTags": [
      "Irish Pub"
    ],
    "vibeTags": [],
    "occasionTags": [
      "guys-night"
    ],
    "price": "$",
    "priceLevel": 1,
    "vibeNotes": "Classic Hoboken dive; pool table; cheap drinks",
    "sourceCredit": "Hoboken Girl"
  },
  {
    "id": "0c5e5795-2576-ef7a-6176-7e09cdc52ebe",
    "name": "Don't Tell Liv",
    "slug": "don-t-tell-liv",
    "city": "New Jersey",
    "state": "NJ",
    "neighborhood": "Hoboken",
    "address": "Undisclosed",
    "lat": 40.0583,
    "lng": -74.4057,
    "cuisine": "Speakeasy",
    "cuisineTags": [
      "Speakeasy"
    ],
    "vibeTags": [
      "hidden-gem",
      "cocktails"
    ],
    "occasionTags": [
      "guys-night",
      "bachelor"
    ],
    "price": "$$$",
    "priceLevel": 3,
    "vibeNotes": "Hidden speakeasy; must know the door; craft cocktails",
    "sourceCredit": "Eater NY"
  },
  {
    "id": "0f953264-edd9-5028-2700-9a62ee04f58d",
    "name": "Chart House",
    "slug": "chart-house",
    "city": "New Jersey",
    "state": "NJ",
    "neighborhood": "Weehawken",
    "address": "Lincoln Harbor",
    "lat": 40.0583,
    "lng": -74.4057,
    "cuisine": "Seafood-Steak",
    "cuisineTags": [
      "Seafood-Steak"
    ],
    "vibeTags": [],
    "occasionTags": [
      "guys-night"
    ],
    "price": "$$$$",
    "priceLevel": 4,
    "vibeNotes": "NYC panorama; steaks + seafood; old-school power dinner",
    "sourceCredit": "Eater NY"
  },
  {
    "id": "4436e0bc-852d-a33d-cc3c-f4708dde63df",
    "name": "Union Hall",
    "slug": "union-hall",
    "city": "New Jersey",
    "state": "NJ",
    "neighborhood": "Hoboken",
    "address": "206 Washington St",
    "lat": 40.0583,
    "lng": -74.4057,
    "cuisine": "Bar-Live Music",
    "cuisineTags": [
      "Bar-Live Music"
    ],
    "vibeTags": [
      "live-music"
    ],
    "occasionTags": [
      "guys-night"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Live bands; bocce ball; craft beer; neighborhood anchor",
    "sourceCredit": "Hoboken Girl"
  },
  {
    "id": "5596684a-3208-ba0a-5ce8-001f94107bcc",
    "name": "Atlantic City Boardwalk",
    "slug": "atlantic-city-boardwalk",
    "city": "New Jersey",
    "state": "NJ",
    "neighborhood": "Atlantic City",
    "address": "The Boardwalk",
    "lat": 40.0583,
    "lng": -74.4057,
    "cuisine": "Casino-Nightlife",
    "cuisineTags": [
      "Casino-Nightlife"
    ],
    "vibeTags": [],
    "occasionTags": [
      "bachelor"
    ],
    "price": "$$-$$$$",
    "priceLevel": 4,
    "vibeNotes": "Borgata + Hard Rock + Ocean; clubs + gambling + pool parties",
    "sourceCredit": "Visit AC"
  },
  {
    "id": "20ea1a13-b4b0-62b8-a298-96244cc9a9e4",
    "name": "Hoboken Bar Crawl",
    "slug": "hoboken-bar-crawl",
    "city": "New Jersey",
    "state": "NJ",
    "neighborhood": "Hoboken",
    "address": "Washington St",
    "lat": 40.0583,
    "lng": -74.4057,
    "cuisine": "Bar Crawl",
    "cuisineTags": [
      "Bar Crawl"
    ],
    "vibeTags": [],
    "occasionTags": [
      "bachelor"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Walk Washington St; 30+ bars; pub crawl paradise",
    "sourceCredit": "Hoboken Girl"
  },
  {
    "id": "44f230ad-8785-fa70-c4c6-43ecc442df69",
    "name": "Borgata Casino",
    "slug": "borgata-casino",
    "city": "New Jersey",
    "state": "NJ",
    "neighborhood": "Atlantic City",
    "address": "1 Borgata Way",
    "lat": 40.0583,
    "lng": -74.4057,
    "cuisine": "Casino-Club",
    "cuisineTags": [
      "Casino-Club"
    ],
    "vibeTags": [],
    "occasionTags": [
      "bachelor"
    ],
    "price": "$$$$",
    "priceLevel": 4,
    "vibeNotes": "Premium Outlets + casino + Premier nightclub + pool",
    "sourceCredit": "Borgata"
  },
  {
    "id": "031bbb0f-fee3-febc-8910-187b181695d7",
    "name": "TopGolf",
    "slug": "topgolf",
    "city": "New Jersey",
    "state": "NJ",
    "neighborhood": "Edison",
    "address": "100 Convention Blvd",
    "lat": 40.0583,
    "lng": -74.4057,
    "cuisine": "Golf-Lounge",
    "cuisineTags": [
      "Golf-Lounge"
    ],
    "vibeTags": [],
    "occasionTags": [
      "bachelor"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Multi-level range; full bar; group bays; daytime activity",
    "sourceCredit": "Topgolf"
  },
  {
    "id": "27e06624-e8c3-1016-f7f5-7115b2845701",
    "name": "Asbury Park Boardwalk",
    "slug": "asbury-park-boardwalk",
    "city": "New Jersey",
    "state": "NJ",
    "neighborhood": "Asbury Park",
    "address": "Ocean Ave",
    "lat": 40.0583,
    "lng": -74.4057,
    "cuisine": "Beach-Bars",
    "cuisineTags": [
      "Beach-Bars"
    ],
    "vibeTags": [],
    "occasionTags": [
      "bachelor"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Beach + Stone Pony + Convention Hall bars; summer vibes",
    "sourceCredit": "Visit Asbury"
  },
  {
    "id": "0e6751a6-0983-a4c7-8925-0c14b478aa21",
    "name": "Liberty State Park",
    "slug": "liberty-state-park",
    "city": "New Jersey",
    "state": "NJ",
    "neighborhood": "Jersey City",
    "address": "200 Morris Pesin Dr",
    "lat": 40.0583,
    "lng": -74.4057,
    "cuisine": "State Park",
    "cuisineTags": [
      "State Park"
    ],
    "vibeTags": [
      "waterfront"
    ],
    "occasionTags": [
      "outdoor-adventure"
    ],
    "price": "Free",
    "priceLevel": 1,
    "vibeNotes": "Statue of Liberty views; waterfront; picnic; bike trails",
    "sourceCredit": "NJ State Parks"
  },
  {
    "id": "8ee21f66-4444-3641-fda7-e6b45a5542d7",
    "name": "Hoboken Waterfront",
    "slug": "hoboken-waterfront",
    "city": "New Jersey",
    "state": "NJ",
    "neighborhood": "Hoboken",
    "address": "Sinatra Dr",
    "lat": 40.0583,
    "lng": -74.4057,
    "cuisine": "Waterfront Walk",
    "cuisineTags": [
      "Waterfront Walk"
    ],
    "vibeTags": [
      "waterfront"
    ],
    "occasionTags": [
      "outdoor-adventure"
    ],
    "price": "Free",
    "priceLevel": 1,
    "vibeNotes": "Manhattan skyline views; pier parks; running path",
    "sourceCredit": "Visit Hoboken"
  },
  {
    "id": "a0db92b8-b30c-46d7-9da8-2b7f12f215ef",
    "name": "Sandy Hook Beach",
    "slug": "sandy-hook-beach",
    "city": "New Jersey",
    "state": "NJ",
    "neighborhood": "Highlands",
    "address": "128 S Hartshorne Dr",
    "lat": 40.0583,
    "lng": -74.4057,
    "cuisine": "Beach-National Park",
    "cuisineTags": [
      "Beach-National Park"
    ],
    "vibeTags": [],
    "occasionTags": [
      "outdoor-adventure"
    ],
    "price": "Free",
    "priceLevel": 1,
    "vibeNotes": "National park beach; lighthouse; bay + ocean sides",
    "sourceCredit": "NPS"
  },
  {
    "id": "c871d465-06db-dc2f-2103-a5c3887f0f9e",
    "name": "Delaware Water Gap",
    "slug": "delaware-water-gap",
    "city": "New Jersey",
    "state": "NJ",
    "neighborhood": "Warren County",
    "address": "I-80 at PA border",
    "lat": 40.0583,
    "lng": -74.4057,
    "cuisine": "National Rec Area",
    "cuisineTags": [
      "National Rec Area"
    ],
    "vibeTags": [],
    "occasionTags": [
      "outdoor-adventure"
    ],
    "price": "Free",
    "priceLevel": 1,
    "vibeNotes": "Hiking; waterfalls; Appalachian Trail; swimming holes",
    "sourceCredit": "NPS"
  },
  {
    "id": "83bc2ba5-f749-8782-c656-704a17bbc147",
    "name": "Branch Brook Park",
    "slug": "branch-brook-park",
    "city": "New Jersey",
    "state": "NJ",
    "neighborhood": "Newark",
    "address": "Lake St",
    "lat": 40.0583,
    "lng": -74.4057,
    "cuisine": "Park-Cherry Blossoms",
    "cuisineTags": [
      "Park-Cherry Blossoms"
    ],
    "vibeTags": [],
    "occasionTags": [
      "outdoor-adventure"
    ],
    "price": "Free",
    "priceLevel": 1,
    "vibeNotes": "More cherry blossoms than DC; April spectacle; free",
    "sourceCredit": "Essex County Parks"
  },
  {
    "id": "f698b104-f330-b09a-bedf-367dbd4f3962",
    "name": "Grounds for Sculpture",
    "slug": "grounds-for-sculpture",
    "city": "New Jersey",
    "state": "NJ",
    "neighborhood": "Hamilton",
    "address": "80 Sculptors Way",
    "lat": 40.0583,
    "lng": -74.4057,
    "cuisine": "Art Park",
    "cuisineTags": [
      "Art Park"
    ],
    "vibeTags": [
      "instagrammable"
    ],
    "occasionTags": [
      "outdoor-adventure"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "42-acre sculpture park; galleries; peacocks; Instagram-worthy",
    "sourceCredit": "Visit NJ"
  },
  {
    "id": "ecc078e3-66ae-68ef-6410-b3b2809c065f",
    "name": "Island Beach State Park",
    "slug": "island-beach-state-park",
    "city": "New Jersey",
    "state": "NJ",
    "neighborhood": "Seaside Park",
    "address": "Central Ave",
    "lat": 40.0583,
    "lng": -74.4057,
    "cuisine": "Beach-State Park",
    "cuisineTags": [
      "Beach-State Park"
    ],
    "vibeTags": [],
    "occasionTags": [
      "outdoor-adventure"
    ],
    "price": "$",
    "priceLevel": 1,
    "vibeNotes": "Undeveloped barrier island; pristine beach; nature trails",
    "sourceCredit": "NJ State Parks"
  },
  {
    "id": "40ee03de-46dc-ae24-c42c-81d5afe0e289",
    "name": "Asbury Park Beach",
    "slug": "asbury-park-beach",
    "city": "New Jersey",
    "state": "NJ",
    "neighborhood": "Asbury Park",
    "address": "Ocean Ave",
    "lat": 40.0583,
    "lng": -74.4057,
    "cuisine": "Beach-Boardwalk",
    "cuisineTags": [
      "Beach-Boardwalk"
    ],
    "vibeTags": [
      "trendy",
      "live-music"
    ],
    "occasionTags": [
      "outdoor-adventure"
    ],
    "price": "$",
    "priceLevel": 1,
    "vibeNotes": "Trendy beach town; boardwalk; food; live music scene",
    "sourceCredit": "Visit Asbury"
  },
  {
    "id": "6e174f1c-cc6f-ece2-d6a0-26b046c12aae",
    "name": "Saint Claire",
    "slug": "saint-claire",
    "city": "New Orleans",
    "state": "LA",
    "neighborhood": "CBD",
    "address": "100 Common St",
    "lat": 29.9511,
    "lng": -90.0715,
    "cuisine": "French / Cocktails",
    "cuisineTags": [
      "French",
      "Cocktails"
    ],
    "vibeTags": [
      "cocktails"
    ],
    "occasionTags": [
      "date-night"
    ],
    "price": "$$$",
    "priceLevel": 3,
    "vibeNotes": "Stunning hotel restaurant with New Orleans charm and an elevated French menu",
    "sourceCredit": "TikTok"
  },
  {
    "id": "0ecfc340-dd9a-917a-7bf6-1654a124c364",
    "name": "Dakar NOLA",
    "slug": "dakar-nola",
    "city": "New Orleans",
    "state": "LA",
    "neighborhood": "CBD",
    "address": "629 Fulton St",
    "lat": 29.9511,
    "lng": -90.0715,
    "cuisine": "West African",
    "cuisineTags": [
      "West African"
    ],
    "vibeTags": [
      "romantic"
    ],
    "occasionTags": [
      "date-night"
    ],
    "price": "$$$",
    "priceLevel": 3,
    "vibeNotes": "Senegalese fine dining; one of NOLA's most unique and romantic restaurants",
    "sourceCredit": "Instagram"
  },
  {
    "id": "6b1b4a2d-1eb7-28fa-9712-1d87a3ab4b28",
    "name": "Charmant",
    "slug": "charmant",
    "city": "New Orleans",
    "state": "LA",
    "neighborhood": "French Quarter",
    "address": "908 Toulouse St",
    "lat": 29.9511,
    "lng": -90.0715,
    "cuisine": "French / Intimate",
    "cuisineTags": [
      "French",
      "Intimate"
    ],
    "vibeTags": [
      "intimate"
    ],
    "occasionTags": [
      "date-night"
    ],
    "price": "$$$",
    "priceLevel": 3,
    "vibeNotes": "Intimate French restaurant in a courtyard setting; pure romance",
    "sourceCredit": "TikTok"
  },
  {
    "id": "23d3c1f6-10fc-710e-525b-42a600aba803",
    "name": "The Elysian Bar",
    "slug": "the-elysian-bar",
    "city": "New Orleans",
    "state": "LA",
    "neighborhood": "Marigny",
    "address": "2317 Burgundy St",
    "lat": 29.9511,
    "lng": -90.0715,
    "cuisine": "American / Bar",
    "cuisineTags": [
      "American",
      "Bar"
    ],
    "vibeTags": [
      "cocktails"
    ],
    "occasionTags": [
      "date-night"
    ],
    "price": "$$$",
    "priceLevel": 3,
    "vibeNotes": "Set in a restored church; cathedral ceilings, candlelight, stunning cocktails",
    "sourceCredit": "Instagram"
  },
  {
    "id": "08b7586f-b684-05bf-de93-db42673354f7",
    "name": "Jewel of the South",
    "slug": "jewel-of-the-south",
    "city": "New Orleans",
    "state": "LA",
    "neighborhood": "French Quarter",
    "address": "1026 St Louis St",
    "lat": 29.9511,
    "lng": -90.0715,
    "cuisine": "Cocktail Bar / Creole",
    "cuisineTags": [
      "Cocktail Bar",
      "Creole"
    ],
    "vibeTags": [
      "intimate",
      "elegant",
      "cocktails",
      "late-night"
    ],
    "occasionTags": [
      "date-night"
    ],
    "price": "$$$",
    "priceLevel": 3,
    "vibeNotes": "Historic cocktail revival bar with Creole small plates; elegant and intimate",
    "sourceCredit": "TikTok"
  },
  {
    "id": "d1596a20-4d07-cbe3-d185-ed7dfbad2d30",
    "name": "P\u00eache",
    "slug": "p-che",
    "city": "New Orleans",
    "state": "LA",
    "neighborhood": "Warehouse District",
    "address": "800 Magazine St",
    "lat": 29.9511,
    "lng": -90.0715,
    "cuisine": "Seafood",
    "cuisineTags": [
      "Seafood"
    ],
    "vibeTags": [],
    "occasionTags": [
      "date-night"
    ],
    "price": "$$$",
    "priceLevel": 3,
    "vibeNotes": "James Beard Award winner; Gulf seafood, raw bar, beautiful space",
    "sourceCredit": "Instagram"
  },
  {
    "id": "56785096-70d4-2fbc-0b95-568ff0fc89ff",
    "name": "La Petite Grocery",
    "slug": "la-petite-grocery",
    "city": "New Orleans",
    "state": "LA",
    "neighborhood": "Uptown",
    "address": "4238 Magazine St",
    "lat": 29.9511,
    "lng": -90.0715,
    "cuisine": "French-Creole",
    "cuisineTags": [
      "French-Creole"
    ],
    "vibeTags": [],
    "occasionTags": [
      "date-night"
    ],
    "price": "$$$",
    "priceLevel": 3,
    "vibeNotes": "Charming Magazine St bistro in a former corner store; seasonal menu",
    "sourceCredit": "TikTok"
  },
  {
    "id": "d53b1d2a-d10d-c6ea-d3df-e24ef4e6b06d",
    "name": "Bacchanal Fine Wine",
    "slug": "bacchanal-fine-wine",
    "city": "New Orleans",
    "state": "LA",
    "neighborhood": "Bywater",
    "address": "600 Poland Ave",
    "lat": 29.9511,
    "lng": -90.0715,
    "cuisine": "Wine Garden",
    "cuisineTags": [
      "Wine Garden"
    ],
    "vibeTags": [
      "wine"
    ],
    "occasionTags": [
      "date-night"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Backyard wine garden with live jazz, cheese boards, and string lights",
    "sourceCredit": "Instagram"
  },
  {
    "id": "d91ec54f-5dcd-35c4-6218-4f55f348404c",
    "name": "Cure",
    "slug": "cure",
    "city": "New Orleans",
    "state": "LA",
    "neighborhood": "Uptown",
    "address": "4905 Freret St",
    "lat": 29.9511,
    "lng": -90.0715,
    "cuisine": "Cocktail Bar",
    "cuisineTags": [
      "Cocktail Bar"
    ],
    "vibeTags": [
      "cocktails"
    ],
    "occasionTags": [
      "group-night-out"
    ],
    "price": "$$$",
    "priceLevel": 3,
    "vibeNotes": "NOLA's cocktail temple; craft drinks in a restored firehouse",
    "sourceCredit": "TikTok"
  },
  {
    "id": "adefcf50-76d6-d5fc-da66-90f4dac874df",
    "name": "The Kingsway",
    "slug": "the-kingsway",
    "city": "New Orleans",
    "state": "LA",
    "neighborhood": "Mid-City",
    "address": "4209 Banks St",
    "lat": 29.9511,
    "lng": -90.0715,
    "cuisine": "Music Club / Bar",
    "cuisineTags": [
      "Music Club",
      "Bar"
    ],
    "vibeTags": [
      "fun"
    ],
    "occasionTags": [
      "group-night-out"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Live brass bands, funk, and soul; local and lively",
    "sourceCredit": "Instagram"
  },
  {
    "id": "7aff8ace-0347-384f-0dbe-35f57c6d1009",
    "name": "Pat O'Brien's",
    "slug": "pat-o-brien-s",
    "city": "New Orleans",
    "state": "LA",
    "neighborhood": "French Quarter",
    "address": "718 St Peter St",
    "lat": 29.9511,
    "lng": -90.0715,
    "cuisine": "Bar / Courtyard",
    "cuisineTags": [
      "Bar",
      "Courtyard"
    ],
    "vibeTags": [
      "cocktails"
    ],
    "occasionTags": [
      "group-night-out",
      "bachelor"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Home of the Hurricane cocktail; flaming fountain courtyard, dueling pianos",
    "sourceCredit": "TikTok"
  },
  {
    "id": "3c20e08d-505f-2265-03fc-df792a555460",
    "name": "Frenchmen Street",
    "slug": "frenchmen-street",
    "city": "New Orleans",
    "state": "LA",
    "neighborhood": "Marigny",
    "address": "Frenchmen St",
    "lat": 29.9511,
    "lng": -90.0715,
    "cuisine": "Live Music Strip",
    "cuisineTags": [
      "Live Music Strip"
    ],
    "vibeTags": [
      "fun",
      "live-music"
    ],
    "occasionTags": [
      "group-night-out"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "The locals' Bourbon St; club-hop for live jazz, funk, blues, and brass",
    "sourceCredit": "Instagram"
  },
  {
    "id": "20ea336f-8ba9-7a66-8542-89fcdc000b66",
    "name": "Republic NOLA",
    "slug": "republic-nola",
    "city": "New Orleans",
    "state": "LA",
    "neighborhood": "Warehouse District",
    "address": "828 S Peters St",
    "lat": 29.9511,
    "lng": -90.0715,
    "cuisine": "Nightclub / Events",
    "cuisineTags": [
      "Nightclub",
      "Events"
    ],
    "vibeTags": [
      "dj"
    ],
    "occasionTags": [
      "group-night-out",
      "bachelor"
    ],
    "price": "$$$",
    "priceLevel": 3,
    "vibeNotes": "Multi-level event venue hosting major DJs and themed parties",
    "sourceCredit": "TikTok"
  },
  {
    "id": "50c3dab5-b1fa-085f-3a53-03569c8b262e",
    "name": "Cats Meow",
    "slug": "cats-meow",
    "city": "New Orleans",
    "state": "LA",
    "neighborhood": "French Quarter",
    "address": "701 Bourbon St",
    "lat": 29.9511,
    "lng": -90.0715,
    "cuisine": "Karaoke Bar",
    "cuisineTags": [
      "Karaoke Bar"
    ],
    "vibeTags": [],
    "occasionTags": [
      "group-night-out"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Legendary karaoke bar on Bourbon; three floors, always packed",
    "sourceCredit": "Instagram"
  },
  {
    "id": "ecb8e225-c671-21d3-ecdb-b95a32b175cb",
    "name": "Three Keys",
    "slug": "three-keys",
    "city": "New Orleans",
    "state": "LA",
    "neighborhood": "Marigny",
    "address": "2504 Chartres St",
    "lat": 29.9511,
    "lng": -90.0715,
    "cuisine": "Music Venue / Lounge",
    "cuisineTags": [
      "Music Venue",
      "Lounge"
    ],
    "vibeTags": [
      "intimate",
      "live-music"
    ],
    "occasionTags": [
      "group-night-out"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Intimate live music venue inside the Ace Hotel; curated bookings",
    "sourceCredit": "TikTok"
  },
  {
    "id": "c85bcaaa-57ee-da15-e8d3-ef3576150141",
    "name": "Twelve Mile Limit",
    "slug": "twelve-mile-limit",
    "city": "New Orleans",
    "state": "LA",
    "neighborhood": "Mid-City",
    "address": "500 S Telemachus St",
    "lat": 29.9511,
    "lng": -90.0715,
    "cuisine": "Neighborhood Bar",
    "cuisineTags": [
      "Neighborhood Bar"
    ],
    "vibeTags": [
      "cocktails"
    ],
    "occasionTags": [
      "group-night-out"
    ],
    "price": "$",
    "priceLevel": 1,
    "vibeNotes": "Dive-chic cocktail bar loved by locals; great cheap drinks",
    "sourceCredit": "Instagram"
  },
  {
    "id": "15f73ac7-5741-6c35-0872-9b700a7affea",
    "name": "Commander's Palace",
    "slug": "commander-s-palace",
    "city": "New Orleans",
    "state": "LA",
    "neighborhood": "Garden District",
    "address": "1403 Washington Ave",
    "lat": 29.9511,
    "lng": -90.0715,
    "cuisine": "Creole Fine Dining",
    "cuisineTags": [
      "Creole Fine Dining"
    ],
    "vibeTags": [],
    "occasionTags": [
      "in-laws"
    ],
    "price": "$$$$",
    "priceLevel": 4,
    "vibeNotes": "New Orleans' crown jewel since 1893; jacket required, legends-only",
    "sourceCredit": "TikTok"
  },
  {
    "id": "0a820db9-5f0a-499b-0e85-43a72232e595",
    "name": "Arnaud's",
    "slug": "arnaud-s",
    "city": "New Orleans",
    "state": "LA",
    "neighborhood": "French Quarter",
    "address": "813 Bienville St",
    "lat": 29.9511,
    "lng": -90.0715,
    "cuisine": "French-Creole",
    "cuisineTags": [
      "French-Creole"
    ],
    "vibeTags": [
      "cocktails",
      "brunch"
    ],
    "occasionTags": [
      "in-laws"
    ],
    "price": "$$$$",
    "priceLevel": 4,
    "vibeNotes": "Historic Creole fine dining with a jazz brunch and cocktail bar (French 75)",
    "sourceCredit": "Instagram"
  },
  {
    "id": "57ec7e3c-cabe-ed63-4e26-740f5f3de1f5",
    "name": "Court of Two Sisters",
    "slug": "court-of-two-sisters",
    "city": "New Orleans",
    "state": "LA",
    "neighborhood": "French Quarter",
    "address": "613 Royal St",
    "lat": 29.9511,
    "lng": -90.0715,
    "cuisine": "Creole / Jazz Brunch",
    "cuisineTags": [
      "Creole",
      "Jazz Brunch"
    ],
    "vibeTags": [
      "brunch"
    ],
    "occasionTags": [
      "in-laws"
    ],
    "price": "$$$",
    "priceLevel": 3,
    "vibeNotes": "Gorgeous courtyard with live jazz brunch buffet; old NOLA elegance",
    "sourceCredit": "TikTok"
  },
  {
    "id": "73fe6245-00e1-4363-1801-eff3a602455d",
    "name": "Emeril's",
    "slug": "emeril-s",
    "city": "New Orleans",
    "state": "LA",
    "neighborhood": "Warehouse District",
    "address": "800 Tchoupitoulas St",
    "lat": 29.9511,
    "lng": -90.0715,
    "cuisine": "Creole-Cajun",
    "cuisineTags": [
      "Creole-Cajun"
    ],
    "vibeTags": [
      "upscale"
    ],
    "occasionTags": [
      "in-laws"
    ],
    "price": "$$$$",
    "priceLevel": 4,
    "vibeNotes": "Emeril Lagasse's flagship; BAM energy in an upscale setting",
    "sourceCredit": "Instagram"
  },
  {
    "id": "d45f4696-e132-0c70-f7bf-99c8c49fde15",
    "name": "MaMou",
    "slug": "mamou",
    "city": "New Orleans",
    "state": "LA",
    "neighborhood": "French Quarter",
    "address": "840 Conti St",
    "lat": 29.9511,
    "lng": -90.0715,
    "cuisine": "French-Creole",
    "cuisineTags": [
      "French-Creole"
    ],
    "vibeTags": [
      "elegant"
    ],
    "occasionTags": [
      "in-laws"
    ],
    "price": "$$$$",
    "priceLevel": 4,
    "vibeNotes": "Besh's elegant French-Creole with a stunning dining room",
    "sourceCredit": "TikTok"
  },
  {
    "id": "07cadf9a-27e0-d5dc-5cfd-2a554b63aa34",
    "name": "Gabrielle",
    "slug": "gabrielle",
    "city": "New Orleans",
    "state": "LA",
    "neighborhood": "Mid-City",
    "address": "2441 Orleans Ave",
    "lat": 29.9511,
    "lng": -90.0715,
    "cuisine": "Creole",
    "cuisineTags": [
      "Creole"
    ],
    "vibeTags": [
      "intimate"
    ],
    "occasionTags": [
      "in-laws"
    ],
    "price": "$$$",
    "priceLevel": 3,
    "vibeNotes": "Intimate neighborhood Creole gem; slow-cooked flavors, warm service",
    "sourceCredit": "Instagram"
  },
  {
    "id": "4c0e75c1-1c0d-b8e0-81ae-2df6a3ad7a9e",
    "name": "Brigtsen's",
    "slug": "brigtsen-s",
    "city": "New Orleans",
    "state": "LA",
    "neighborhood": "Riverbend",
    "address": "723 Dante St",
    "lat": 29.9511,
    "lng": -90.0715,
    "cuisine": "Cajun-Creole",
    "cuisineTags": [
      "Cajun-Creole"
    ],
    "vibeTags": [],
    "occasionTags": [
      "in-laws"
    ],
    "price": "$$$",
    "priceLevel": 3,
    "vibeNotes": "Frank Brigtsen's cottage restaurant; refined Cajun in a homey setting",
    "sourceCredit": "TikTok"
  },
  {
    "id": "a272572c-0e3d-4265-11e9-b1707faf9df6",
    "name": "Studio",
    "slug": "studio",
    "city": "New Orleans",
    "state": "LA",
    "neighborhood": "CBD",
    "address": "330 St Charles Ave",
    "lat": 29.9511,
    "lng": -90.0715,
    "cuisine": "Cocktail Lounge",
    "cuisineTags": [
      "Cocktail Lounge"
    ],
    "vibeTags": [
      "dj",
      "cocktails"
    ],
    "occasionTags": [
      "girls-night"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Chic art-deco cocktail lounge with themed drinks and DJ nights",
    "sourceCredit": "TikTok"
  },
  {
    "id": "88672a07-1c19-756b-31ca-83a3cac7258f",
    "name": "Succotash Nola",
    "slug": "succotash-nola",
    "city": "New Orleans",
    "state": "LA",
    "neighborhood": "CBD",
    "address": "400 Convention Center Blvd",
    "lat": 29.9511,
    "lng": -90.0715,
    "cuisine": "Southern / Cocktails",
    "cuisineTags": [
      "Southern",
      "Cocktails"
    ],
    "vibeTags": [
      "cocktails"
    ],
    "occasionTags": [
      "girls-night"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Stylish Southern restaurant with creative cocktails and vibrant energy",
    "sourceCredit": "Instagram"
  },
  {
    "id": "38282ceb-65a7-7b9a-e9f6-2e6773962b30",
    "name": "Sofia",
    "slug": "sofia",
    "city": "New Orleans",
    "state": "LA",
    "neighborhood": "French Quarter",
    "address": "516 Toulouse St",
    "lat": 29.9511,
    "lng": -90.0715,
    "cuisine": "Italian / Wine Bar",
    "cuisineTags": [
      "Italian",
      "Wine Bar"
    ],
    "vibeTags": [
      "wine"
    ],
    "occasionTags": [
      "girls-night"
    ],
    "price": "$$$",
    "priceLevel": 3,
    "vibeNotes": "Italian wine bar with a courtyard; pasta, spritzes, and great vibes",
    "sourceCredit": "TikTok"
  },
  {
    "id": "9057815a-5d2d-47b0-5243-c3599675cbf1",
    "name": "The Country Club",
    "slug": "the-country-club",
    "city": "New Orleans",
    "state": "LA",
    "neighborhood": "Bywater",
    "address": "634 Louisa St",
    "lat": 29.9511,
    "lng": -90.0715,
    "cuisine": "Drag Brunch / Pool",
    "cuisineTags": [
      "Drag Brunch",
      "Pool"
    ],
    "vibeTags": [
      "cocktails",
      "brunch"
    ],
    "occasionTags": [
      "girls-night"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Drag brunch is legendary; pool, cocktails, and Bywater charm",
    "sourceCredit": "Instagram"
  },
  {
    "id": "f791f99c-b099-8a3a-a871-f3ea5099e7cd",
    "name": "Acamaya",
    "slug": "acamaya",
    "city": "New Orleans",
    "state": "LA",
    "neighborhood": "French Quarter",
    "address": "1026 Conti St",
    "lat": 29.9511,
    "lng": -90.0715,
    "cuisine": "Mexican / Cocktails",
    "cuisineTags": [
      "Mexican",
      "Cocktails"
    ],
    "vibeTags": [
      "cocktails"
    ],
    "occasionTags": [
      "girls-night"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Colorful Mexican spot with creative margaritas and festive energy",
    "sourceCredit": "TikTok"
  },
  {
    "id": "60e31d9c-30e3-e4e9-1a0c-5a07b861dd01",
    "name": "The Columns Hotel",
    "slug": "the-columns-hotel",
    "city": "New Orleans",
    "state": "LA",
    "neighborhood": "Uptown",
    "address": "3811 St Charles Ave",
    "lat": 29.9511,
    "lng": -90.0715,
    "cuisine": "Hotel Bar / Porch",
    "cuisineTags": [
      "Hotel Bar",
      "Porch"
    ],
    "vibeTags": [
      "cocktails"
    ],
    "occasionTags": [
      "girls-night"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Beautiful porch bar on St. Charles Ave; cocktails while watching streetcars",
    "sourceCredit": "Instagram"
  },
  {
    "id": "09728ea4-4908-141e-c86d-8e0d35e7620c",
    "name": "Messina's Runway Cafe",
    "slug": "messina-s-runway-cafe",
    "city": "New Orleans",
    "state": "LA",
    "neighborhood": "Kenner",
    "address": "2717 Williams Blvd",
    "lat": 29.9511,
    "lng": -90.0715,
    "cuisine": "Caf\u00e9 / Lounge",
    "cuisineTags": [
      "Caf\u00e9",
      "Lounge"
    ],
    "vibeTags": [
      "cocktails"
    ],
    "occasionTags": [
      "girls-night"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Fashion-themed caf\u00e9 with cocktails and a photo-ready interior",
    "sourceCredit": "TikTok"
  },
  {
    "id": "8224935e-bb92-d9db-0148-594ce6b2ef2a",
    "name": "Loa Bar",
    "slug": "loa-bar",
    "city": "New Orleans",
    "state": "LA",
    "neighborhood": "CBD",
    "address": "221 Camp St",
    "lat": 29.9511,
    "lng": -90.0715,
    "cuisine": "Hotel Cocktail Bar",
    "cuisineTags": [
      "Hotel Cocktail Bar"
    ],
    "vibeTags": [
      "cocktails"
    ],
    "occasionTags": [
      "girls-night"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Voodoo-themed cocktail bar inside the International House Hotel",
    "sourceCredit": "Instagram"
  },
  {
    "id": "e2716d13-0ea3-96d6-6991-9aecbe615604",
    "name": "Club Spades NOLA",
    "slug": "club-spades-nola",
    "city": "New Orleans",
    "state": "LA",
    "neighborhood": "Gentilly",
    "address": "Various",
    "lat": 29.9511,
    "lng": -90.0715,
    "cuisine": "Social Club / Events",
    "cuisineTags": [
      "Social Club",
      "Events"
    ],
    "vibeTags": [],
    "occasionTags": [
      "guys-night"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Members-only social events; poker nights, cigar lounges, networking",
    "sourceCredit": "TikTok"
  },
  {
    "id": "964162e7-26c3-d047-f23b-d0488de42ff1",
    "name": "Docks Off 5th",
    "slug": "docks-off-5th",
    "city": "New Orleans",
    "state": "LA",
    "neighborhood": "Warehouse District",
    "address": "500 Tchoupitoulas St",
    "lat": 29.9511,
    "lng": -90.0715,
    "cuisine": "Seafood / Sports Bar",
    "cuisineTags": [
      "Seafood",
      "Sports Bar"
    ],
    "vibeTags": [
      "waterfront"
    ],
    "occasionTags": [
      "guys-night"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Waterfront sports bar with massive screens and fresh Gulf seafood",
    "sourceCredit": "Instagram"
  },
  {
    "id": "d935ade9-c140-c3f9-6ee0-21e4b512110e",
    "name": "NOLA Brewing",
    "slug": "nola-brewing",
    "city": "New Orleans",
    "state": "LA",
    "neighborhood": "Irish Channel",
    "address": "3001 Tchoupitoulas St",
    "lat": 29.9511,
    "lng": -90.0715,
    "cuisine": "Brewery / Taproom",
    "cuisineTags": [
      "Brewery",
      "Taproom"
    ],
    "vibeTags": [],
    "occasionTags": [
      "guys-night"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Local brewery with taproom tours, beer flights, and food trucks",
    "sourceCredit": "TikTok"
  },
  {
    "id": "902e3484-a685-8cc3-2669-c2138ca90abc",
    "name": "Lafitte's Blacksmith Shop",
    "slug": "lafitte-s-blacksmith-shop",
    "city": "New Orleans",
    "state": "LA",
    "neighborhood": "French Quarter",
    "address": "941 Bourbon St",
    "lat": 29.9511,
    "lng": -90.0715,
    "cuisine": "Historic Bar",
    "cuisineTags": [
      "Historic Bar"
    ],
    "vibeTags": [],
    "occasionTags": [
      "guys-night"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Oldest bar in America (1722); candlelit, no electricity feel, legendary",
    "sourceCredit": "Instagram"
  },
  {
    "id": "363f09f6-dc0b-69eb-9807-f1aadb682b68",
    "name": "Russell's",
    "slug": "russell-s",
    "city": "New Orleans",
    "state": "LA",
    "neighborhood": "French Quarter",
    "address": "535 Decatur St",
    "lat": 29.9511,
    "lng": -90.0715,
    "cuisine": "Cocktail Bar / Cigars",
    "cuisineTags": [
      "Cocktail Bar",
      "Cigars"
    ],
    "vibeTags": [
      "upscale",
      "cocktails"
    ],
    "occasionTags": [
      "guys-night"
    ],
    "price": "$$$",
    "priceLevel": 3,
    "vibeNotes": "Upscale cocktail bar with a cigar lounge; old-school gentleman vibes",
    "sourceCredit": "TikTok"
  },
  {
    "id": "53eb13e1-52db-80b0-22cd-f7d731bbb1c3",
    "name": "Fulton Street",
    "slug": "fulton-street",
    "city": "New Orleans",
    "state": "LA",
    "neighborhood": "CBD",
    "address": "Fulton St",
    "lat": 29.9511,
    "lng": -90.0715,
    "cuisine": "Bar District",
    "cuisineTags": [
      "Bar District"
    ],
    "vibeTags": [],
    "occasionTags": [
      "guys-night"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Cluster of bars and restaurants near Harrah's; walk between venues",
    "sourceCredit": "Instagram"
  },
  {
    "id": "ab2ddc3b-e41e-f146-78f8-94e2d7c579cb",
    "name": "The Sazerac Bar",
    "slug": "the-sazerac-bar",
    "city": "New Orleans",
    "state": "LA",
    "neighborhood": "CBD",
    "address": "130 Roosevelt Way",
    "lat": 29.9511,
    "lng": -90.0715,
    "cuisine": "Classic Cocktail Bar",
    "cuisineTags": [
      "Classic Cocktail Bar"
    ],
    "vibeTags": [
      "cocktails"
    ],
    "occasionTags": [
      "guys-night"
    ],
    "price": "$$$",
    "priceLevel": 3,
    "vibeNotes": "Birthplace of the Sazerac cocktail; Art Deco opulence at The Roosevelt Hotel",
    "sourceCredit": "TikTok"
  },
  {
    "id": "e699aaf5-f464-3dcd-a631-943648cc7e0c",
    "name": "Bourbon Street Crawl",
    "slug": "bourbon-street-crawl",
    "city": "New Orleans",
    "state": "LA",
    "neighborhood": "French Quarter",
    "address": "Bourbon St",
    "lat": 29.9511,
    "lng": -90.0715,
    "cuisine": "Bar Crawl",
    "cuisineTags": [
      "Bar Crawl"
    ],
    "vibeTags": [],
    "occasionTags": [
      "bachelor"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "The ultimate bachelor party street; bars, music, and mayhem 24/7",
    "sourceCredit": "TikTok"
  },
  {
    "id": "a921b1af-e57a-ee03-c266-23a5777ea0ac",
    "name": "Harrah's Casino",
    "slug": "harrah-s-casino",
    "city": "New Orleans",
    "state": "LA",
    "neighborhood": "CBD",
    "address": "228 Poydras St",
    "lat": 29.9511,
    "lng": -90.0715,
    "cuisine": "Casino / Nightlife",
    "cuisineTags": [
      "Casino",
      "Nightlife"
    ],
    "vibeTags": [
      "late-night"
    ],
    "occasionTags": [
      "bachelor"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Full casino with table games, bars, restaurants, and late-night energy",
    "sourceCredit": "Instagram"
  },
  {
    "id": "01befdd7-9013-0697-ffc2-16492a3edcb8",
    "name": "Airboat Swamp Tour",
    "slug": "airboat-swamp-tour",
    "city": "New Orleans",
    "state": "LA",
    "neighborhood": "Barataria",
    "address": "Various Operators",
    "lat": 29.9511,
    "lng": -90.0715,
    "cuisine": "Swamp Tour",
    "cuisineTags": [
      "Swamp Tour"
    ],
    "vibeTags": [],
    "occasionTags": [
      "bachelor"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Daytime airboat through bayou with alligators; perfect recovery activity",
    "sourceCredit": "TikTok"
  },
  {
    "id": "4f5a5113-fbc0-a4b7-2391-17383801bbae",
    "name": "Steamboat Natchez",
    "slug": "steamboat-natchez",
    "city": "New Orleans",
    "state": "LA",
    "neighborhood": "French Quarter",
    "address": "Toulouse St Wharf",
    "lat": 29.9511,
    "lng": -90.0715,
    "cuisine": "River Cruise / Jazz",
    "cuisineTags": [
      "River Cruise",
      "Jazz"
    ],
    "vibeTags": [],
    "occasionTags": [
      "bachelor"
    ],
    "price": "$$$",
    "priceLevel": 3,
    "vibeNotes": "Jazz dinner cruise on the Mississippi; classy way to start the night",
    "sourceCredit": "Instagram"
  },
  {
    "id": "ff18ccf0-4702-4220-d91d-a989e74adbbe",
    "name": "French Quarter Walking",
    "slug": "french-quarter-walking",
    "city": "New Orleans",
    "state": "LA",
    "neighborhood": "French Quarter",
    "address": "Jackson Square area",
    "lat": 29.9511,
    "lng": -90.0715,
    "cuisine": "Historic Walk",
    "cuisineTags": [
      "Historic Walk"
    ],
    "vibeTags": [],
    "occasionTags": [
      "outdoor-adventure"
    ],
    "price": "Free",
    "priceLevel": 1,
    "vibeNotes": "Beignets at Cafe Du Monde, street performers, architecture tours",
    "sourceCredit": "TikTok"
  },
  {
    "id": "28847f79-fd4c-db26-d5d7-6a7f8a62fa7c",
    "name": "Audubon Park",
    "slug": "audubon-park",
    "city": "New Orleans",
    "state": "LA",
    "neighborhood": "Uptown",
    "address": "6500 Magazine St",
    "lat": 29.9511,
    "lng": -90.0715,
    "cuisine": "Park / Zoo",
    "cuisineTags": [
      "Park",
      "Zoo"
    ],
    "vibeTags": [
      "outdoor"
    ],
    "occasionTags": [
      "outdoor-adventure"
    ],
    "price": "Free",
    "priceLevel": 1,
    "vibeNotes": "Century oaks, jogging paths, and the zoo; total outdoor day",
    "sourceCredit": "Instagram"
  },
  {
    "id": "97da58a8-c1ef-9349-451f-dcfc09ea9e43",
    "name": "Magazine Street",
    "slug": "magazine-street",
    "city": "New Orleans",
    "state": "LA",
    "neighborhood": "Various",
    "address": "Magazine St",
    "lat": 29.9511,
    "lng": -90.0715,
    "cuisine": "Shopping / Food",
    "cuisineTags": [
      "Shopping",
      "Food"
    ],
    "vibeTags": [],
    "occasionTags": [
      "outdoor-adventure"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Six miles of boutiques, galleries, restaurants, and po'boy shops",
    "sourceCredit": "TikTok"
  },
  {
    "id": "30d69ee6-70de-3340-22b1-d2e47fe3dbe4",
    "name": "City Park",
    "slug": "city-park",
    "city": "New Orleans",
    "state": "LA",
    "neighborhood": "Mid-City",
    "address": "1 Palm Dr",
    "lat": 29.9511,
    "lng": -90.0715,
    "cuisine": "Park / Sculpture Garden",
    "cuisineTags": [
      "Park",
      "Sculpture Garden"
    ],
    "vibeTags": [],
    "occasionTags": [
      "outdoor-adventure"
    ],
    "price": "Free",
    "priceLevel": 1,
    "vibeNotes": "1,300-acre park with sculpture garden, botanical garden, and beignet caf\u00e9",
    "sourceCredit": "Instagram"
  },
  {
    "id": "ff893884-e741-aba2-77e1-9d60d013a119",
    "name": "Second Line Parade",
    "slug": "second-line-parade",
    "city": "New Orleans",
    "state": "LA",
    "neighborhood": "Various",
    "address": "Various Routes",
    "lat": 29.9511,
    "lng": -90.0715,
    "cuisine": "Street Parade / Culture",
    "cuisineTags": [
      "Street Parade",
      "Culture"
    ],
    "vibeTags": [],
    "occasionTags": [
      "outdoor-adventure"
    ],
    "price": "Free",
    "priceLevel": 1,
    "vibeNotes": "Join a spontaneous brass band parade; pure NOLA culture",
    "sourceCredit": "TikTok"
  },
  {
    "id": "5f3a3a83-12c3-138e-131a-8a39367f322e",
    "name": "Crescent Park",
    "slug": "crescent-park",
    "city": "New Orleans",
    "state": "LA",
    "neighborhood": "Bywater",
    "address": "Crescent Park Trail",
    "lat": 29.9511,
    "lng": -90.0715,
    "cuisine": "Riverfront Park",
    "cuisineTags": [
      "Riverfront Park"
    ],
    "vibeTags": [],
    "occasionTags": [
      "outdoor-adventure"
    ],
    "price": "Free",
    "priceLevel": 1,
    "vibeNotes": "Elevated boardwalk along the Mississippi with skyline views",
    "sourceCredit": "Instagram"
  },
  {
    "id": "eefd784e-5cfd-8ee0-ba7e-36ea9ee0904c",
    "name": "Double Knot",
    "slug": "double-knot",
    "city": "Philadelphia",
    "state": "PA",
    "neighborhood": "Midtown Village",
    "address": "120 S 13th St",
    "lat": 39.9526,
    "lng": -75.1652,
    "cuisine": "Japanese / Speakeasy",
    "cuisineTags": [
      "Japanese",
      "Speakeasy"
    ],
    "vibeTags": [],
    "occasionTags": [
      "date-night"
    ],
    "price": "$$$",
    "priceLevel": 3,
    "vibeNotes": "Upstairs caf\u00e9 by day, underground Japanese omakase speakeasy by night",
    "sourceCredit": "TikTok"
  },
  {
    "id": "2eb2724f-cc46-e72c-a382-13ab0e600a6e",
    "name": "Emilia",
    "slug": "emilia",
    "city": "Philadelphia",
    "state": "PA",
    "neighborhood": "Rittenhouse",
    "address": "1930 Chestnut St",
    "lat": 39.9526,
    "lng": -75.1652,
    "cuisine": "Italian",
    "cuisineTags": [
      "Italian"
    ],
    "vibeTags": [
      "wine"
    ],
    "occasionTags": [
      "date-night"
    ],
    "price": "$$$",
    "priceLevel": 3,
    "vibeNotes": "Fresh pasta, moody lighting, curated Italian wine list \u2014 swoon-worthy",
    "sourceCredit": "Instagram"
  },
  {
    "id": "e9b21ee1-bea9-ebfe-ca9f-678c97ce2e79",
    "name": "Jean Georges Philadelphia",
    "slug": "jean-georges-philadelphia",
    "city": "Philadelphia",
    "state": "PA",
    "neighborhood": "Center City",
    "address": "1911 Walnut St",
    "lat": 39.9526,
    "lng": -75.1652,
    "cuisine": "French / 60th Floor",
    "cuisineTags": [
      "French",
      "60th Floor"
    ],
    "vibeTags": [],
    "occasionTags": [
      "date-night"
    ],
    "price": "$$$$",
    "priceLevel": 4,
    "vibeNotes": "60th-floor dining at the Comcast Tower; the most dramatic date in Philly",
    "sourceCredit": "TikTok"
  },
  {
    "id": "d67a74a9-b2f2-4ffa-4d75-3499ebeb67be",
    "name": "Sampan",
    "slug": "sampan",
    "city": "Philadelphia",
    "state": "PA",
    "neighborhood": "Midtown Village",
    "address": "124 S 13th St",
    "lat": 39.9526,
    "lng": -75.1652,
    "cuisine": "Pan-Asian",
    "cuisineTags": [
      "Pan-Asian"
    ],
    "vibeTags": [
      "late-night"
    ],
    "occasionTags": [
      "date-night"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "$55 tasting menu on weekdays; buzzy, shareable Asian small plates",
    "sourceCredit": "Instagram"
  },
  {
    "id": "e61a7e2b-36a7-cff9-d60f-5ec0b95183f1",
    "name": "Perla",
    "slug": "perla",
    "city": "Philadelphia",
    "state": "PA",
    "neighborhood": "East Passyunk",
    "address": "1538 S 11th St",
    "lat": 39.9526,
    "lng": -75.1652,
    "cuisine": "Filipino / BYOB",
    "cuisineTags": [
      "Filipino",
      "BYOB"
    ],
    "vibeTags": [],
    "occasionTags": [
      "date-night"
    ],
    "price": "$$$",
    "priceLevel": 3,
    "vibeNotes": "BYOB Filipino tasting menu; one of Philly's most unique dining experiences",
    "sourceCredit": "TikTok"
  },
  {
    "id": "79d94ac8-4ef8-cca0-44ba-fe8928e732b2",
    "name": "Ember & Ash",
    "slug": "ember-ash",
    "city": "Philadelphia",
    "state": "PA",
    "neighborhood": "Northern Liberties",
    "address": "712 N 2nd St",
    "lat": 39.9526,
    "lng": -75.1652,
    "cuisine": "Wood-Fired / Cocktails",
    "cuisineTags": [
      "Wood-Fired",
      "Cocktails"
    ],
    "vibeTags": [
      "romantic",
      "cocktails"
    ],
    "occasionTags": [
      "date-night"
    ],
    "price": "$$$",
    "priceLevel": 3,
    "vibeNotes": "Wood-fired everything with craft cocktails; rustic-romantic vibe",
    "sourceCredit": "Instagram"
  },
  {
    "id": "fcc19d70-a4b3-3aea-34e5-24eed45e748c",
    "name": "Vernick Food & Drink",
    "slug": "vernick-food-drink",
    "city": "Philadelphia",
    "state": "PA",
    "neighborhood": "Rittenhouse",
    "address": "2031 Walnut St",
    "lat": 39.9526,
    "lng": -75.1652,
    "cuisine": "American / Wine",
    "cuisineTags": [
      "American",
      "Wine"
    ],
    "vibeTags": [
      "elegant",
      "wine"
    ],
    "occasionTags": [
      "date-night"
    ],
    "price": "$$$$",
    "priceLevel": 4,
    "vibeNotes": "James Beard winner; seasonal menu, world-class wine, elegant",
    "sourceCredit": "TikTok"
  },
  {
    "id": "8cea0ac1-1dc6-9f0a-1572-2127a34586f2",
    "name": "Friday Saturday Sunday",
    "slug": "friday-saturday-sunday",
    "city": "Philadelphia",
    "state": "PA",
    "neighborhood": "Rittenhouse",
    "address": "261 S 21st St",
    "lat": 39.9526,
    "lng": -75.1652,
    "cuisine": "New American",
    "cuisineTags": [
      "New American"
    ],
    "vibeTags": [
      "intimate",
      "cocktails"
    ],
    "occasionTags": [
      "date-night"
    ],
    "price": "$$$",
    "priceLevel": 3,
    "vibeNotes": "Intimate Rittenhouse gem with inventive cocktails and seasonal tasting menus",
    "sourceCredit": "Instagram"
  },
  {
    "id": "99a8ca1a-2c48-fded-bf61-04d21b88a7be",
    "name": "El Chingon",
    "slug": "el-chingon",
    "city": "Philadelphia",
    "state": "PA",
    "neighborhood": "Old City",
    "address": "219 Chestnut St",
    "lat": 39.9526,
    "lng": -75.1652,
    "cuisine": "Mexican / Nightlife",
    "cuisineTags": [
      "Mexican",
      "Nightlife"
    ],
    "vibeTags": [
      "dj"
    ],
    "occasionTags": [
      "group-night-out"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Three-floor Mexican party palace; DJs, tacos, tequila towers",
    "sourceCredit": "TikTok"
  },
  {
    "id": "6bf0c1fe-f25c-420d-11a1-89dcd65cc4e5",
    "name": "Mamajuana Cafe",
    "slug": "mamajuana-cafe",
    "city": "Philadelphia",
    "state": "PA",
    "neighborhood": "Old City",
    "address": "233 Chestnut St",
    "lat": 39.9526,
    "lng": -75.1652,
    "cuisine": "Latin / Nightclub",
    "cuisineTags": [
      "Latin",
      "Nightclub"
    ],
    "vibeTags": [
      "live-music",
      "dance"
    ],
    "occasionTags": [
      "group-night-out"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Latin dinner-to-dance concept; live music, hookah, bottle service",
    "sourceCredit": "Instagram"
  },
  {
    "id": "b74305fc-36e4-6342-5352-b48716fe3ff9",
    "name": "Concourse Dance Bar",
    "slug": "concourse-dance-bar",
    "city": "Philadelphia",
    "state": "PA",
    "neighborhood": "Center City",
    "address": "1635 Market St",
    "lat": 39.9526,
    "lng": -75.1652,
    "cuisine": "Dance Club",
    "cuisineTags": [
      "Dance Club"
    ],
    "vibeTags": [
      "dance"
    ],
    "occasionTags": [
      "group-night-out"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Multi-room dance venue with different genres per room",
    "sourceCredit": "TikTok"
  },
  {
    "id": "3a29a207-2ce1-600c-7e13-f8b68fe931c4",
    "name": "Libertee Grounds",
    "slug": "libertee-grounds",
    "city": "Philadelphia",
    "state": "PA",
    "neighborhood": "Center City",
    "address": "1700 Market St",
    "lat": 39.9526,
    "lng": -75.1652,
    "cuisine": "Sports Bar / Lounge",
    "cuisineTags": [
      "Sports Bar",
      "Lounge"
    ],
    "vibeTags": [],
    "occasionTags": [
      "group-night-out"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Philly's biggest sports bar with multiple levels and watch parties",
    "sourceCredit": "Instagram"
  },
  {
    "id": "b26900d0-cc6e-0fd2-228b-8cc5166ffa7c",
    "name": "Frankford Hall",
    "slug": "frankford-hall",
    "city": "Philadelphia",
    "state": "PA",
    "neighborhood": "Fishtown",
    "address": "1210 Frankford Ave",
    "lat": 39.9526,
    "lng": -75.1652,
    "cuisine": "German Beer Garden",
    "cuisineTags": [
      "German Beer Garden"
    ],
    "vibeTags": [
      "outdoor"
    ],
    "occasionTags": [
      "group-night-out"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Massive outdoor beer garden with long tables, pretzels, and group energy",
    "sourceCredit": "TikTok"
  },
  {
    "id": "66e8daf8-b429-d248-d9a0-3f6e0c5435c4",
    "name": "The Winston",
    "slug": "the-winston",
    "city": "Philadelphia",
    "state": "PA",
    "neighborhood": "Center City",
    "address": "1735 Chestnut St",
    "lat": 39.9526,
    "lng": -75.1652,
    "cuisine": "Cocktail Lounge",
    "cuisineTags": [
      "Cocktail Lounge"
    ],
    "vibeTags": [
      "cocktails"
    ],
    "occasionTags": [
      "group-night-out"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Two-story cocktail bar with private karaoke rooms and elevated drinks",
    "sourceCredit": "Instagram"
  },
  {
    "id": "83d88e4c-a1c8-09b8-2f05-fc8dae108541",
    "name": "City Winery",
    "slug": "city-winery",
    "city": "Philadelphia",
    "state": "PA",
    "neighborhood": "Fishtown",
    "address": "990 Filbert St",
    "lat": 39.9526,
    "lng": -75.1652,
    "cuisine": "Winery / Live Music",
    "cuisineTags": [
      "Winery",
      "Live Music"
    ],
    "vibeTags": [
      "live-music",
      "wine"
    ],
    "occasionTags": [
      "group-night-out"
    ],
    "price": "$$$",
    "priceLevel": 3,
    "vibeNotes": "Full winery with concerts, wine tastings, and group dining",
    "sourceCredit": "TikTok"
  },
  {
    "id": "483e97d1-8294-1e36-1102-bb65e3a47639",
    "name": "Yards Brewing",
    "slug": "yards-brewing",
    "city": "Philadelphia",
    "state": "PA",
    "neighborhood": "Northern Liberties",
    "address": "500 Spring Garden St",
    "lat": 39.9526,
    "lng": -75.1652,
    "cuisine": "Brewery / Beer Hall",
    "cuisineTags": [
      "Brewery",
      "Beer Hall"
    ],
    "vibeTags": [
      "outdoor",
      "patio"
    ],
    "occasionTags": [
      "group-night-out"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Massive taproom with local brews, food hall, and outdoor patio",
    "sourceCredit": "Instagram"
  },
  {
    "id": "fd7a149c-6649-2b12-6b19-90cadd0c8736",
    "name": "Parc",
    "slug": "parc",
    "city": "Philadelphia",
    "state": "PA",
    "neighborhood": "Rittenhouse",
    "address": "227 S 18th St",
    "lat": 39.9526,
    "lng": -75.1652,
    "cuisine": "French Bistro",
    "cuisineTags": [
      "French Bistro"
    ],
    "vibeTags": [
      "patio"
    ],
    "occasionTags": [
      "in-laws"
    ],
    "price": "$$$",
    "priceLevel": 3,
    "vibeNotes": "Rittenhouse Square's Parisian caf\u00e9; oysters, steak frites, charming patio",
    "sourceCredit": "TikTok"
  },
  {
    "id": "b3dbf45f-3c95-50e5-179b-a2e857c7e3db",
    "name": "Talula's Garden",
    "slug": "talula-s-garden",
    "city": "Philadelphia",
    "state": "PA",
    "neighborhood": "Washington Square",
    "address": "210 W Washington Sq",
    "lat": 39.9526,
    "lng": -75.1652,
    "cuisine": "Farm-to-Table",
    "cuisineTags": [
      "Farm-to-Table"
    ],
    "vibeTags": [
      "patio"
    ],
    "occasionTags": [
      "in-laws"
    ],
    "price": "$$$",
    "priceLevel": 3,
    "vibeNotes": "Beautiful garden patio, seasonal menu, impressive without being intimidating",
    "sourceCredit": "Instagram"
  },
  {
    "id": "070c17d6-98f8-5bee-9894-20e576657e18",
    "name": "Vetri Cucina",
    "slug": "vetri-cucina",
    "city": "Philadelphia",
    "state": "PA",
    "neighborhood": "Center City",
    "address": "1312 Spruce St",
    "lat": 39.9526,
    "lng": -75.1652,
    "cuisine": "Italian Tasting Menu",
    "cuisineTags": [
      "Italian Tasting Menu"
    ],
    "vibeTags": [],
    "occasionTags": [
      "in-laws"
    ],
    "price": "$$$$",
    "priceLevel": 4,
    "vibeNotes": "Marc Vetri's crown jewel; Italian tasting menu that defines Philadelphia fine dining",
    "sourceCredit": "TikTok"
  },
  {
    "id": "4855c55a-654f-1fcd-cfd1-a2b8b7852427",
    "name": "The Love",
    "slug": "the-love",
    "city": "Philadelphia",
    "state": "PA",
    "neighborhood": "Rittenhouse",
    "address": "130 S 18th St",
    "lat": 39.9526,
    "lng": -75.1652,
    "cuisine": "American / Elegant",
    "cuisineTags": [
      "American",
      "Elegant"
    ],
    "vibeTags": [
      "elegant",
      "wine"
    ],
    "occasionTags": [
      "in-laws"
    ],
    "price": "$$$",
    "priceLevel": 3,
    "vibeNotes": "Sophisticated American in a stunning townhouse; great wine list",
    "sourceCredit": "Instagram"
  },
  {
    "id": "e001006e-435c-70f2-09b3-ca15f752f5b6",
    "name": "Lacroix at The Rittenhouse",
    "slug": "lacroix-at-the-rittenhouse",
    "city": "Philadelphia",
    "state": "PA",
    "neighborhood": "Rittenhouse",
    "address": "210 W Rittenhouse Sq",
    "lat": 39.9526,
    "lng": -75.1652,
    "cuisine": "French / Contemporary",
    "cuisineTags": [
      "French",
      "Contemporary"
    ],
    "vibeTags": [
      "brunch"
    ],
    "occasionTags": [
      "in-laws"
    ],
    "price": "$$$$",
    "priceLevel": 4,
    "vibeNotes": "Hotel fine dining overlooking the Square; Sunday brunch is legendary",
    "sourceCredit": "TikTok"
  },
  {
    "id": "afb61d76-a5b5-fff9-52f1-ce626eab8fcb",
    "name": "Amada",
    "slug": "amada",
    "city": "Philadelphia",
    "state": "PA",
    "neighborhood": "Old City",
    "address": "217 Chestnut St",
    "lat": 39.9526,
    "lng": -75.1652,
    "cuisine": "Spanish Tapas",
    "cuisineTags": [
      "Spanish Tapas"
    ],
    "vibeTags": [
      "late-night"
    ],
    "occasionTags": [
      "in-laws"
    ],
    "price": "$$$",
    "priceLevel": 3,
    "vibeNotes": "Jose Garces' tapas masterpiece; group-friendly sharing plates",
    "sourceCredit": "Instagram"
  },
  {
    "id": "7ce45d02-d1be-2bc0-2a7c-5c0b51711fe9",
    "name": "The Capital Grille",
    "slug": "the-capital-grille",
    "city": "Philadelphia",
    "state": "PA",
    "neighborhood": "Center City",
    "address": "1338 Chestnut St",
    "lat": 39.9526,
    "lng": -75.1652,
    "cuisine": "Steakhouse",
    "cuisineTags": [
      "Steakhouse"
    ],
    "vibeTags": [
      "upscale"
    ],
    "occasionTags": [
      "in-laws"
    ],
    "price": "$$$$",
    "priceLevel": 4,
    "vibeNotes": "Reliable upscale steakhouse that always impresses parents",
    "sourceCredit": "TikTok"
  },
  {
    "id": "f0e503bb-3f2f-f3ad-5faf-c31e48eb41e8",
    "name": "Banshee",
    "slug": "banshee",
    "city": "Philadelphia",
    "state": "PA",
    "neighborhood": "Fishtown",
    "address": "155 W Girard Ave",
    "lat": 39.9526,
    "lng": -75.1652,
    "cuisine": "Cocktail Bar",
    "cuisineTags": [
      "Cocktail Bar"
    ],
    "vibeTags": [
      "cocktails"
    ],
    "occasionTags": [
      "girls-night"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Dark, moody cocktail bar with a gothic-chic aesthetic; craft drinks",
    "sourceCredit": "TikTok"
  },
  {
    "id": "09647cb2-e1ca-1917-9d52-07fbba9462a2",
    "name": "Liquorette",
    "slug": "liquorette",
    "city": "Philadelphia",
    "state": "PA",
    "neighborhood": "Northern Liberties",
    "address": "736 N 2nd St",
    "lat": 39.9526,
    "lng": -75.1652,
    "cuisine": "Wine / Cocktail Bar",
    "cuisineTags": [
      "Wine",
      "Cocktail Bar"
    ],
    "vibeTags": [
      "cocktails",
      "wine"
    ],
    "occasionTags": [
      "girls-night"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Cute wine and cocktail shop-bar hybrid; ros\u00e9 all day energy",
    "sourceCredit": "Instagram"
  },
  {
    "id": "1b4da98c-7eb7-d6f3-3166-c37170b3fcfd",
    "name": "Wax + Wine",
    "slug": "wax-wine",
    "city": "Philadelphia",
    "state": "PA",
    "neighborhood": "Various",
    "address": "Various Studios",
    "lat": 39.9526,
    "lng": -75.1652,
    "cuisine": "Candle Making / BYOB",
    "cuisineTags": [
      "Candle Making",
      "BYOB"
    ],
    "vibeTags": [
      "wine"
    ],
    "occasionTags": [
      "girls-night"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Make custom candles while sipping wine; perfect creative girls night",
    "sourceCredit": "TikTok"
  },
  {
    "id": "fba052fa-9989-db85-6c50-8c5623ad35c7",
    "name": "Yay Clay",
    "slug": "yay-clay",
    "city": "Philadelphia",
    "state": "PA",
    "neighborhood": "Fishtown",
    "address": "2424 E York St",
    "lat": 39.9526,
    "lng": -75.1652,
    "cuisine": "Pottery Studio",
    "cuisineTags": [
      "Pottery Studio"
    ],
    "vibeTags": [
      "instagrammable"
    ],
    "occasionTags": [
      "girls-night"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Pottery painting with BYOB; artistic and Instagram-worthy",
    "sourceCredit": "Instagram"
  },
  {
    "id": "74d8f9f3-cd3c-3c54-8106-eaf95ebf21de",
    "name": "Pretty Girls Cook",
    "slug": "pretty-girls-cook",
    "city": "Philadelphia",
    "state": "PA",
    "neighborhood": "West Philly",
    "address": "4528 Market St",
    "lat": 39.9526,
    "lng": -75.1652,
    "cuisine": "Cooking Class / BYOB",
    "cuisineTags": [
      "Cooking Class",
      "BYOB"
    ],
    "vibeTags": [
      "wine"
    ],
    "occasionTags": [
      "girls-night"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "BYOB cooking classes with wine, music, and vibes; Black-owned",
    "sourceCredit": "TikTok"
  },
  {
    "id": "d304e5ce-b93b-9271-15f1-bc59cd55af2a",
    "name": "Scent & Sip",
    "slug": "scent-sip",
    "city": "Philadelphia",
    "state": "PA",
    "neighborhood": "Center City",
    "address": "1527 Walnut St",
    "lat": 39.9526,
    "lng": -75.1652,
    "cuisine": "Fragrance Making",
    "cuisineTags": [
      "Fragrance Making"
    ],
    "vibeTags": [
      "cocktails"
    ],
    "occasionTags": [
      "girls-night"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Custom perfume-making class with cocktails; unique and memorable",
    "sourceCredit": "Instagram"
  },
  {
    "id": "0065bbc5-dff3-e118-0c0d-3f5cd47b22b9",
    "name": "Hop Sing Laundromat",
    "slug": "hop-sing-laundromat",
    "city": "Philadelphia",
    "state": "PA",
    "neighborhood": "Chinatown",
    "address": "1029 Race St",
    "lat": 39.9526,
    "lng": -75.1652,
    "cuisine": "Speakeasy",
    "cuisineTags": [
      "Speakeasy"
    ],
    "vibeTags": [
      "cocktails"
    ],
    "occasionTags": [
      "girls-night"
    ],
    "price": "$$$",
    "priceLevel": 3,
    "vibeNotes": "Philly's most exclusive speakeasy; strict rules, incredible cocktails",
    "sourceCredit": "TikTok"
  },
  {
    "id": "e99d66ff-f59e-5499-736b-012f003aa81b",
    "name": "Fleur's",
    "slug": "fleur-s",
    "city": "Philadelphia",
    "state": "PA",
    "neighborhood": "Rittenhouse",
    "address": "1900 Arch St",
    "lat": 39.9526,
    "lng": -75.1652,
    "cuisine": "French / Cocktail Bar",
    "cuisineTags": [
      "French",
      "Cocktail Bar"
    ],
    "vibeTags": [
      "cocktails"
    ],
    "occasionTags": [
      "girls-night"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Floral-themed cocktail bar with French bites and aesthetic interiors",
    "sourceCredit": "Instagram"
  },
  {
    "id": "87c525a4-435d-38a6-31c4-f153ef94c879",
    "name": "SPIN Philadelphia",
    "slug": "spin-philadelphia",
    "city": "Philadelphia",
    "state": "PA",
    "neighborhood": "Center City",
    "address": "211 S 15th St",
    "lat": 39.9526,
    "lng": -75.1652,
    "cuisine": "Ping Pong / Bar",
    "cuisineTags": [
      "Ping Pong",
      "Bar"
    ],
    "vibeTags": [
      "cocktails"
    ],
    "occasionTags": [
      "guys-night"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Competitive ping pong with craft cocktails and a solid food menu",
    "sourceCredit": "TikTok"
  },
  {
    "id": "8a6db32b-953a-a87c-5fcc-958297dee3b2",
    "name": "Skyhigh",
    "slug": "skyhigh",
    "city": "Philadelphia",
    "state": "PA",
    "neighborhood": "Center City",
    "address": "1426 Locust St",
    "lat": 39.9526,
    "lng": -75.1652,
    "cuisine": "Rooftop / Hookah",
    "cuisineTags": [
      "Rooftop",
      "Hookah"
    ],
    "vibeTags": [
      "rooftop",
      "cocktails"
    ],
    "occasionTags": [
      "guys-night"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Rooftop lounge with hookah, cocktails, and city views",
    "sourceCredit": "Instagram"
  },
  {
    "id": "b3f3b6af-fde6-a281-2040-666ae10c3399",
    "name": "Barcade",
    "slug": "barcade",
    "city": "Philadelphia",
    "state": "PA",
    "neighborhood": "Fishtown",
    "address": "1114 Frankford Ave",
    "lat": 39.9526,
    "lng": -75.1652,
    "cuisine": "Arcade Bar",
    "cuisineTags": [
      "Arcade Bar"
    ],
    "vibeTags": [],
    "occasionTags": [
      "guys-night"
    ],
    "price": "$",
    "priceLevel": 1,
    "vibeNotes": "Classic arcade games with craft beer on tap; competitive and cheap",
    "sourceCredit": "TikTok"
  },
  {
    "id": "f2f9e34d-6e17-96b0-881e-f1e39d26b92f",
    "name": "Society Hill Dance",
    "slug": "society-hill-dance",
    "city": "Philadelphia",
    "state": "PA",
    "neighborhood": "Society Hill",
    "address": "307 Chestnut St",
    "lat": 39.9526,
    "lng": -75.1652,
    "cuisine": "Pool Hall / Bar",
    "cuisineTags": [
      "Pool Hall",
      "Bar"
    ],
    "vibeTags": [
      "upscale",
      "cocktails",
      "late-night"
    ],
    "occasionTags": [
      "guys-night"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Upscale billiards with cocktails and late-night vibes",
    "sourceCredit": "Instagram"
  },
  {
    "id": "9e6248e4-680c-1398-5d78-9101f157f0f3",
    "name": "Library Bar",
    "slug": "library-bar",
    "city": "Philadelphia",
    "state": "PA",
    "neighborhood": "Center City",
    "address": "320 S Broad St",
    "lat": 39.9526,
    "lng": -75.1652,
    "cuisine": "Whiskey Bar",
    "cuisineTags": [
      "Whiskey Bar"
    ],
    "vibeTags": [
      "whiskey"
    ],
    "occasionTags": [
      "guys-night"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Dimly lit whiskey library with leather chairs and 400+ whiskeys",
    "sourceCredit": "TikTok"
  },
  {
    "id": "89dcf2bb-5fd0-288c-ff0c-25f9a4470c84",
    "name": "Urban Axes",
    "slug": "urban-axes",
    "city": "Philadelphia",
    "state": "PA",
    "neighborhood": "Kensington",
    "address": "50 E Oxford St",
    "lat": 39.9526,
    "lng": -75.1652,
    "cuisine": "Axe Throwing / BYOB",
    "cuisineTags": [
      "Axe Throwing",
      "BYOB"
    ],
    "vibeTags": [],
    "occasionTags": [
      "guys-night"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "BYOB axe throwing \u2014 bring your own beer and compete",
    "sourceCredit": "Instagram"
  },
  {
    "id": "18f8ac68-71a3-1515-2ea1-694e5e7fe073",
    "name": "Xfinity Live!",
    "slug": "xfinity-live",
    "city": "Philadelphia",
    "state": "PA",
    "neighborhood": "South Philly",
    "address": "1100 Pattison Ave",
    "lat": 39.9526,
    "lng": -75.1652,
    "cuisine": "Sports Complex",
    "cuisineTags": [
      "Sports Complex"
    ],
    "vibeTags": [],
    "occasionTags": [
      "guys-night"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Multiple bars, giant screens, pre/post-game headquarters",
    "sourceCredit": "TikTok"
  },
  {
    "id": "0e3e7f6a-501d-0104-04c3-b9c79eb0d1ee",
    "name": "Vinyl",
    "slug": "vinyl",
    "city": "Philadelphia",
    "state": "PA",
    "neighborhood": "Center City",
    "address": "1332 S Front St",
    "lat": 39.9526,
    "lng": -75.1652,
    "cuisine": "Nightclub",
    "cuisineTags": [
      "Nightclub"
    ],
    "vibeTags": [
      "dj",
      "late-night"
    ],
    "occasionTags": [
      "bachelor"
    ],
    "price": "$$$",
    "priceLevel": 3,
    "vibeNotes": "Philly's premier nightclub; bottle service, top DJs, late-night energy",
    "sourceCredit": "TikTok"
  },
  {
    "id": "4d2a6cad-b35a-f84e-5411-2a93ae48d3ef",
    "name": "W Philadelphia",
    "slug": "w-philadelphia",
    "city": "Philadelphia",
    "state": "PA",
    "neighborhood": "Center City",
    "address": "1439 Chestnut St",
    "lat": 39.9526,
    "lng": -75.1652,
    "cuisine": "Rooftop / Hotel Bar",
    "cuisineTags": [
      "Rooftop",
      "Hotel Bar"
    ],
    "vibeTags": [
      "rooftop"
    ],
    "occasionTags": [
      "bachelor"
    ],
    "price": "$$$",
    "priceLevel": 3,
    "vibeNotes": "WET Deck rooftop pool and bar; day party scene in summer",
    "sourceCredit": "Instagram"
  },
  {
    "id": "e4520e83-4ca5-4411-9cd6-72241a76241e",
    "name": "SoundGarden Hall",
    "slug": "soundgarden-hall",
    "city": "Philadelphia",
    "state": "PA",
    "neighborhood": "Fishtown",
    "address": "159 W Girard Ave",
    "lat": 39.9526,
    "lng": -75.1652,
    "cuisine": "Music Venue / Bar",
    "cuisineTags": [
      "Music Venue",
      "Bar"
    ],
    "vibeTags": [
      "live-music"
    ],
    "occasionTags": [
      "bachelor"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Live music venue with multiple bars and a packed weekend scene",
    "sourceCredit": "TikTok"
  },
  {
    "id": "85fa2bfa-9dab-76a4-6360-90139b03d47a",
    "name": "Midnight & The Wicked",
    "slug": "midnight-the-wicked",
    "city": "Philadelphia",
    "state": "PA",
    "neighborhood": "Fishtown",
    "address": "600 N 2nd St",
    "lat": 39.9526,
    "lng": -75.1652,
    "cuisine": "Cocktail / Late Night",
    "cuisineTags": [
      "Cocktail",
      "Late Night"
    ],
    "vibeTags": [
      "cocktails",
      "late-night"
    ],
    "occasionTags": [
      "bachelor"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Late-night cocktail spot with inventive drinks and a mischievous vibe",
    "sourceCredit": "Instagram"
  },
  {
    "id": "3df250e4-bcbd-71d7-c7b2-913bee164260",
    "name": "The Barbary",
    "slug": "the-barbary",
    "city": "Philadelphia",
    "state": "PA",
    "neighborhood": "Fishtown",
    "address": "951 Frankford Ave",
    "lat": 39.9526,
    "lng": -75.1652,
    "cuisine": "Dive / Dance",
    "cuisineTags": [
      "Dive",
      "Dance"
    ],
    "vibeTags": [
      "dj",
      "dance",
      "late-night"
    ],
    "occasionTags": [
      "bachelor"
    ],
    "price": "$",
    "priceLevel": 1,
    "vibeNotes": "Fishtown's go-to late-night dance spot; cheap drinks, great DJs",
    "sourceCredit": "TikTok"
  },
  {
    "id": "47c0f154-e1d9-5877-e5d7-aabbf8401340",
    "name": "Rivers Casino",
    "slug": "rivers-casino",
    "city": "Philadelphia",
    "state": "PA",
    "neighborhood": "Fishtown",
    "address": "1001 N Delaware Ave",
    "lat": 39.9526,
    "lng": -75.1652,
    "cuisine": "Casino / Nightlife",
    "cuisineTags": [
      "Casino",
      "Nightlife"
    ],
    "vibeTags": [],
    "occasionTags": [
      "bachelor"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Full casino with table games, bars, and live entertainment",
    "sourceCredit": "Instagram"
  },
  {
    "id": "7a1c7bd6-206e-2a8a-931f-51dab7a52e3d",
    "name": "Spruce Street Harbor Park",
    "slug": "spruce-street-harbor-park",
    "city": "Philadelphia",
    "state": "PA",
    "neighborhood": "Penn's Landing",
    "address": "301 S Columbus Blvd",
    "lat": 39.9526,
    "lng": -75.1652,
    "cuisine": "Waterfront Park",
    "cuisineTags": [
      "Waterfront Park"
    ],
    "vibeTags": [
      "waterfront"
    ],
    "occasionTags": [
      "outdoor-adventure"
    ],
    "price": "$",
    "priceLevel": 1,
    "vibeNotes": "Hammocks, floating barges, food vendors along the Delaware River",
    "sourceCredit": "TikTok"
  },
  {
    "id": "8ea4865b-bde6-7df3-05cd-c26a454166ba",
    "name": "Reading Terminal Market",
    "slug": "reading-terminal-market",
    "city": "Philadelphia",
    "state": "PA",
    "neighborhood": "Center City",
    "address": "51 N 12th St",
    "lat": 39.9526,
    "lng": -75.1652,
    "cuisine": "Food Hall / Market",
    "cuisineTags": [
      "Food Hall",
      "Market"
    ],
    "vibeTags": [],
    "occasionTags": [
      "outdoor-adventure"
    ],
    "price": "$",
    "priceLevel": 1,
    "vibeNotes": "Historic food market with 80+ vendors; DiNic's roast pork is essential",
    "sourceCredit": "Instagram"
  },
  {
    "id": "c2700182-4ee8-08b9-b0ec-8412f01c98a8",
    "name": "Schuylkill Banks",
    "slug": "schuylkill-banks",
    "city": "Philadelphia",
    "state": "PA",
    "neighborhood": "Center City",
    "address": "2501 Walnut St",
    "lat": 39.9526,
    "lng": -75.1652,
    "cuisine": "Trail / Boardwalk",
    "cuisineTags": [
      "Trail",
      "Boardwalk"
    ],
    "vibeTags": [
      "waterfront"
    ],
    "occasionTags": [
      "outdoor-adventure"
    ],
    "price": "Free",
    "priceLevel": 1,
    "vibeNotes": "Riverwalk with kayak rentals, bike path, and waterfront views",
    "sourceCredit": "TikTok"
  },
  {
    "id": "162705e0-c4f2-7ee2-956b-cbaab28d3c8e",
    "name": "Magic Gardens",
    "slug": "magic-gardens",
    "city": "Philadelphia",
    "state": "PA",
    "neighborhood": "South Street",
    "address": "1020 South St",
    "lat": 39.9526,
    "lng": -75.1652,
    "cuisine": "Art Installation",
    "cuisineTags": [
      "Art Installation"
    ],
    "vibeTags": [
      "outdoor"
    ],
    "occasionTags": [
      "outdoor-adventure"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Isaiah Zagar's mosaic labyrinth; immersive outdoor art experience",
    "sourceCredit": "Instagram"
  },
  {
    "id": "aa702edb-7fff-6372-0615-26098d2080bd",
    "name": "Fishtown First Friday",
    "slug": "fishtown-first-friday",
    "city": "Philadelphia",
    "state": "PA",
    "neighborhood": "Fishtown",
    "address": "Frankford Ave",
    "lat": 39.9526,
    "lng": -75.1652,
    "cuisine": "Art Walk / Street Fair",
    "cuisineTags": [
      "Art Walk",
      "Street Fair"
    ],
    "vibeTags": [
      "live-music"
    ],
    "occasionTags": [
      "outdoor-adventure"
    ],
    "price": "Free",
    "priceLevel": 1,
    "vibeNotes": "Monthly gallery walk with open studios, street food, and live music",
    "sourceCredit": "TikTok"
  },
  {
    "id": "b1d0cdfa-adcf-c51d-d941-842beb45d353",
    "name": "Parks on Tap",
    "slug": "parks-on-tap",
    "city": "Philadelphia",
    "state": "PA",
    "neighborhood": "Various Parks",
    "address": "Various Locations",
    "lat": 39.9526,
    "lng": -75.1652,
    "cuisine": "Pop-Up Beer Garden",
    "cuisineTags": [
      "Pop-Up Beer Garden"
    ],
    "vibeTags": [],
    "occasionTags": [
      "outdoor-adventure"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Traveling beer garden in Philly parks; check schedule for current location",
    "sourceCredit": "Instagram"
  },
  {
    "id": "40b59574-3e74-5ce3-96e1-4b211b27baff",
    "name": "Roka Akor",
    "slug": "roka-akor",
    "city": "San Francisco",
    "state": "CA",
    "neighborhood": "Financial District",
    "address": "801 Montgomery St",
    "lat": 37.7749,
    "lng": -122.4194,
    "cuisine": "Japanese Steakhouse",
    "cuisineTags": [
      "Japanese Steakhouse"
    ],
    "vibeTags": [
      "intimate"
    ],
    "occasionTags": [
      "date-night"
    ],
    "price": "$$$$",
    "priceLevel": 4,
    "vibeNotes": "Robata grill; intimate booths; sake pairings; sleek & sexy",
    "sourceCredit": "TikTok @infatuation_sf"
  },
  {
    "id": "d8e42e95-0d08-adae-b585-a3d57b551491",
    "name": "Niku Steakhouse",
    "slug": "niku-steakhouse",
    "city": "San Francisco",
    "state": "CA",
    "neighborhood": "SoMa",
    "address": "61 Division St",
    "lat": 37.7749,
    "lng": -122.4194,
    "cuisine": "Japanese Wagyu",
    "cuisineTags": [
      "Japanese Wagyu"
    ],
    "vibeTags": [],
    "occasionTags": [
      "date-night"
    ],
    "price": "$$$$",
    "priceLevel": 4,
    "vibeNotes": "All-wagyu steakhouse; Japanese whisky; dramatic dark interior",
    "sourceCredit": "Resy"
  },
  {
    "id": "c9d07241-f2fe-91ef-b09b-303a97d83362",
    "name": "Trestle",
    "slug": "trestle",
    "city": "San Francisco",
    "state": "CA",
    "neighborhood": "North Beach",
    "address": "531 Jackson St",
    "lat": 37.7749,
    "lng": -122.4194,
    "cuisine": "New American",
    "cuisineTags": [
      "New American"
    ],
    "vibeTags": [],
    "occasionTags": [
      "date-night"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "3-course prix fixe for $39; neighborhood gem; incredible value date",
    "sourceCredit": "Instagram"
  },
  {
    "id": "1663b21f-3052-55b8-05bf-3d4d7752190e",
    "name": "Waterbar",
    "slug": "waterbar",
    "city": "San Francisco",
    "state": "CA",
    "neighborhood": "Embarcadero",
    "address": "399 The Embarcadero",
    "lat": 37.7749,
    "lng": -122.4194,
    "cuisine": "Seafood",
    "cuisineTags": [
      "Seafood"
    ],
    "vibeTags": [
      "romantic"
    ],
    "occasionTags": [
      "date-night"
    ],
    "price": "$$$$",
    "priceLevel": 4,
    "vibeNotes": "Bay Bridge views; raw bar; floor-to-ceiling aquariums; romantic",
    "sourceCredit": "Resy"
  },
  {
    "id": "8313b026-f293-56a7-80c1-69584a580a36",
    "name": "CAVA\u00d1A",
    "slug": "cava-a",
    "city": "San Francisco",
    "state": "CA",
    "neighborhood": "Mission",
    "address": "3419 22nd St",
    "lat": 37.7749,
    "lng": -122.4194,
    "cuisine": "Mexican",
    "cuisineTags": [
      "Mexican"
    ],
    "vibeTags": [
      "intimate",
      "late-night"
    ],
    "occasionTags": [
      "date-night"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Candlelit mezcal bar; intimate courtyard; modern Mexican small plates",
    "sourceCredit": "TikTok"
  },
  {
    "id": "7ef28b44-3900-ed8d-8759-003fa6d5bf25",
    "name": "Moonraker",
    "slug": "moonraker",
    "city": "San Francisco",
    "state": "CA",
    "neighborhood": "Half Moon Bay",
    "address": "380 Capistrano Rd",
    "lat": 37.7749,
    "lng": -122.4194,
    "cuisine": "Seafood",
    "cuisineTags": [
      "Seafood"
    ],
    "vibeTags": [
      "sunset",
      "michelin"
    ],
    "occasionTags": [
      "date-night"
    ],
    "price": "$$$$",
    "priceLevel": 4,
    "vibeNotes": "Dramatic oceanfront; Michelin-starred; sunset cliff views",
    "sourceCredit": "Michelin"
  },
  {
    "id": "e3263aa2-befe-be05-0560-a18bec59f019",
    "name": "Elena's",
    "slug": "elena-s",
    "city": "San Francisco",
    "state": "CA",
    "neighborhood": "SoMa",
    "address": "522 Howard St",
    "lat": 37.7749,
    "lng": -122.4194,
    "cuisine": "Filipino",
    "cuisineTags": [
      "Filipino"
    ],
    "vibeTags": [
      "intimate"
    ],
    "occasionTags": [
      "date-night"
    ],
    "price": "$$$",
    "priceLevel": 3,
    "vibeNotes": "Elevated Filipino cuisine; tasting menu; intimate & personal",
    "sourceCredit": "Resy"
  },
  {
    "id": "335fc3d9-4f86-baf2-0674-ee0256a819ec",
    "name": "Meski",
    "slug": "meski",
    "city": "San Francisco",
    "state": "CA",
    "neighborhood": "Lower Haight",
    "address": "603 Haight St",
    "lat": 37.7749,
    "lng": -122.4194,
    "cuisine": "Ethiopian-Med",
    "cuisineTags": [
      "Ethiopian-Med"
    ],
    "vibeTags": [
      "cozy",
      "late-night"
    ],
    "occasionTags": [
      "date-night"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Ethiopian-Mediterranean fusion; cozy & colorful; shareable plates",
    "sourceCredit": "TikTok"
  },
  {
    "id": "2c0814ce-4003-06a1-6901-adc9cc477ae1",
    "name": "Temple Nightclub",
    "slug": "temple-nightclub",
    "city": "San Francisco",
    "state": "CA",
    "neighborhood": "SoMa",
    "address": "540 Howard St",
    "lat": 37.7749,
    "lng": -122.4194,
    "cuisine": "Nightclub",
    "cuisineTags": [
      "Nightclub"
    ],
    "vibeTags": [
      "dj"
    ],
    "occasionTags": [
      "group-night-out",
      "bachelor"
    ],
    "price": "$$$",
    "priceLevel": 3,
    "vibeNotes": "Multi-level club; top DJs; VIP sections; SF nightlife anchor",
    "sourceCredit": "TikTok"
  },
  {
    "id": "df51d015-bd6f-ba44-b5ef-00bb783de7aa",
    "name": "Barrel House Tavern",
    "slug": "barrel-house-tavern",
    "city": "San Francisco",
    "state": "CA",
    "neighborhood": "Sausalito",
    "address": "660 Bridgeway",
    "lat": 37.7749,
    "lng": -122.4194,
    "cuisine": "American",
    "cuisineTags": [
      "American"
    ],
    "vibeTags": [
      "waterfront",
      "cocktails"
    ],
    "occasionTags": [
      "group-night-out"
    ],
    "price": "$$$",
    "priceLevel": 3,
    "vibeNotes": "Waterfront views; craft cocktails; ferryboat to Sausalito group outing",
    "sourceCredit": "Instagram"
  },
  {
    "id": "a07ecb7d-7485-7de4-7bb7-6dd061059e41",
    "name": "La Mar",
    "slug": "la-mar",
    "city": "San Francisco",
    "state": "CA",
    "neighborhood": "Embarcadero",
    "address": "Pier 1.5 The Embarcadero",
    "lat": 37.7749,
    "lng": -122.4194,
    "cuisine": "Peruvian",
    "cuisineTags": [
      "Peruvian"
    ],
    "vibeTags": [
      "waterfront",
      "patio"
    ],
    "occasionTags": [
      "group-night-out"
    ],
    "price": "$$$",
    "priceLevel": 3,
    "vibeNotes": "Waterfront Peruvian; ceviche bar; pisco sours; group-friendly patio",
    "sourceCredit": "Resy"
  },
  {
    "id": "8359c214-837b-bc18-7e99-24f91239adda",
    "name": "Epic Steak",
    "slug": "epic-steak",
    "city": "San Francisco",
    "state": "CA",
    "neighborhood": "SoMa",
    "address": "369 The Embarcadero",
    "lat": 37.7749,
    "lng": -122.4194,
    "cuisine": "Steakhouse",
    "cuisineTags": [
      "Steakhouse"
    ],
    "vibeTags": [],
    "occasionTags": [
      "group-night-out"
    ],
    "price": "$$$$",
    "priceLevel": 4,
    "vibeNotes": "Bay Bridge views; group private dining; polished steakhouse",
    "sourceCredit": "OpenTable"
  },
  {
    "id": "896ea5be-05c2-b93c-c60c-6e7f7d655d98",
    "name": "Malibu Farms",
    "slug": "malibu-farms",
    "city": "San Francisco",
    "state": "CA",
    "neighborhood": "Half Moon Bay",
    "address": "Pier 1",
    "lat": 37.7749,
    "lng": -122.4194,
    "cuisine": "Farm-to-Table",
    "cuisineTags": [
      "Farm-to-Table"
    ],
    "vibeTags": [
      "waterfront",
      "brunch"
    ],
    "occasionTags": [
      "group-night-out"
    ],
    "price": "$$$",
    "priceLevel": 3,
    "vibeNotes": "Waterfront brunch; organic menu; relaxed group vibe",
    "sourceCredit": "Instagram"
  },
  {
    "id": "82115bff-9b03-ac1b-9fd7-3dd77545618f",
    "name": "The Beehive",
    "slug": "the-beehive",
    "city": "San Francisco",
    "state": "CA",
    "neighborhood": "Potrero Hill",
    "address": "842 Valencia St",
    "lat": 37.7749,
    "lng": -122.4194,
    "cuisine": "Bar / Music",
    "cuisineTags": [
      "Bar",
      "Music"
    ],
    "vibeTags": [
      "live-music",
      "cocktails"
    ],
    "occasionTags": [
      "group-night-out"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Live music venue; cocktails; eclectic crowd; group-friendly",
    "sourceCredit": "Yelp"
  },
  {
    "id": "71e36f36-ff9a-d7bb-6f5e-efa26dd53f34",
    "name": "Habibi Lounge",
    "slug": "habibi-lounge",
    "city": "San Francisco",
    "state": "CA",
    "neighborhood": "Tenderloin",
    "address": "710 Geary St",
    "lat": 37.7749,
    "lng": -122.4194,
    "cuisine": "Hookah / Lounge",
    "cuisineTags": [
      "Hookah",
      "Lounge"
    ],
    "vibeTags": [
      "chill",
      "late-night"
    ],
    "occasionTags": [
      "group-night-out"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Hookah lounge; Mediterranean bites; late-night chill",
    "sourceCredit": "TikTok"
  },
  {
    "id": "0ff86f92-8d39-4fc5-6866-4ec1f2bfd54c",
    "name": "Quince",
    "slug": "quince",
    "city": "San Francisco",
    "state": "CA",
    "neighborhood": "Jackson Square",
    "address": "470 Pacific Ave",
    "lat": 37.7749,
    "lng": -122.4194,
    "cuisine": "Fine Dining",
    "cuisineTags": [
      "Fine Dining"
    ],
    "vibeTags": [
      "michelin"
    ],
    "occasionTags": [
      "in-laws"
    ],
    "price": "$$$$",
    "priceLevel": 4,
    "vibeNotes": "3 Michelin stars; tasting menu; farm-to-table perfection",
    "sourceCredit": "Michelin"
  },
  {
    "id": "bf4a705b-921e-0415-9f82-a193d23403f7",
    "name": "Spruce",
    "slug": "spruce",
    "city": "San Francisco",
    "state": "CA",
    "neighborhood": "Pacific Heights",
    "address": "3640 Sacramento St",
    "lat": 37.7749,
    "lng": -122.4194,
    "cuisine": "New American",
    "cuisineTags": [
      "New American"
    ],
    "vibeTags": [
      "upscale",
      "elegant"
    ],
    "occasionTags": [
      "in-laws"
    ],
    "price": "$$$$",
    "priceLevel": 4,
    "vibeNotes": "Upscale neighborhood gem; refined seasonal menu; elegant setting",
    "sourceCredit": "Resy"
  },
  {
    "id": "cedde3ee-9450-baf6-f2d0-f82fa8cdd50e",
    "name": "Gary Danko",
    "slug": "gary-danko",
    "city": "San Francisco",
    "state": "CA",
    "neighborhood": "Fisherman's Wharf",
    "address": "800 N Point St",
    "lat": 37.7749,
    "lng": -122.4194,
    "cuisine": "French-American",
    "cuisineTags": [
      "French-American"
    ],
    "vibeTags": [],
    "occasionTags": [
      "in-laws"
    ],
    "price": "$$$$",
    "priceLevel": 4,
    "vibeNotes": "Legendary SF fine dining; prix fixe; impeccable service",
    "sourceCredit": "Michelin"
  },
  {
    "id": "dc23fc38-ba41-70fc-0a5a-7bbdc562f61e",
    "name": "Benu",
    "slug": "benu",
    "city": "San Francisco",
    "state": "CA",
    "neighborhood": "SoMa",
    "address": "22 Hawthorne St",
    "lat": 37.7749,
    "lng": -122.4194,
    "cuisine": "Asian-American",
    "cuisineTags": [
      "Asian-American"
    ],
    "vibeTags": [
      "michelin"
    ],
    "occasionTags": [
      "in-laws"
    ],
    "price": "$$$$",
    "priceLevel": 4,
    "vibeNotes": "3 Michelin stars; tasting menu; Asian-influenced haute cuisine",
    "sourceCredit": "Michelin"
  },
  {
    "id": "f21bc58d-f59c-2a78-f8fa-a16c5c1cd370",
    "name": "Kokkari Estiatorio",
    "slug": "kokkari-estiatorio",
    "city": "San Francisco",
    "state": "CA",
    "neighborhood": "Financial District",
    "address": "200 Jackson St",
    "lat": 37.7749,
    "lng": -122.4194,
    "cuisine": "Greek",
    "cuisineTags": [
      "Greek"
    ],
    "vibeTags": [
      "upscale"
    ],
    "occasionTags": [
      "in-laws"
    ],
    "price": "$$$$",
    "priceLevel": 4,
    "vibeNotes": "Upscale Greek; wood-fired lamb; fireplace dining room",
    "sourceCredit": "Resy"
  },
  {
    "id": "26acb26d-6662-f455-5896-f790fd84a8bd",
    "name": "Acquerello",
    "slug": "acquerello",
    "city": "San Francisco",
    "state": "CA",
    "neighborhood": "Nob Hill",
    "address": "1722 Sacramento St",
    "lat": 37.7749,
    "lng": -122.4194,
    "cuisine": "Italian",
    "cuisineTags": [
      "Italian"
    ],
    "vibeTags": [
      "michelin"
    ],
    "occasionTags": [
      "in-laws"
    ],
    "price": "$$$$",
    "priceLevel": 4,
    "vibeNotes": "Former chapel; Michelin 2-star; Italian tasting menus",
    "sourceCredit": "Michelin"
  },
  {
    "id": "ff0137b3-2f73-3e86-14c6-3419146b6377",
    "name": "The Mint",
    "slug": "the-mint",
    "city": "San Francisco",
    "state": "CA",
    "neighborhood": "SoMa",
    "address": "1942 Market St",
    "lat": 37.7749,
    "lng": -122.4194,
    "cuisine": "Karaoke Bar",
    "cuisineTags": [
      "Karaoke Bar"
    ],
    "vibeTags": [
      "iconic"
    ],
    "occasionTags": [
      "girls-night"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "SF's iconic karaoke bar since 1968; full bar; stage & crowd",
    "sourceCredit": "TikTok"
  },
  {
    "id": "fd640db6-e3df-a53e-8b3d-d97bac306673",
    "name": "Palm House",
    "slug": "palm-house",
    "city": "San Francisco",
    "state": "CA",
    "neighborhood": "Cow Hollow",
    "address": "2032 Union St",
    "lat": 37.7749,
    "lng": -122.4194,
    "cuisine": "Tropical Bar",
    "cuisineTags": [
      "Tropical Bar"
    ],
    "vibeTags": [
      "cocktails",
      "brunch"
    ],
    "occasionTags": [
      "girls-night"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Palm-tree decor; frozen cocktails; brunch & happy hour; girls-trip energy",
    "sourceCredit": "Instagram"
  },
  {
    "id": "9a889182-031e-362c-8fa8-e893465b4738",
    "name": "Che Fico",
    "slug": "che-fico",
    "city": "San Francisco",
    "state": "CA",
    "neighborhood": "NoPa",
    "address": "838 Divisadero St",
    "lat": 37.7749,
    "lng": -122.4194,
    "cuisine": "Italian",
    "cuisineTags": [
      "Italian"
    ],
    "vibeTags": [],
    "occasionTags": [
      "girls-night"
    ],
    "price": "$$$",
    "priceLevel": 3,
    "vibeNotes": "Wood-fired Italian; gorgeous space; Aperol spritzes; group shareable",
    "sourceCredit": "Resy"
  },
  {
    "id": "f5064e6b-b5cb-3909-970b-223874e6ff05",
    "name": "Wildhawk",
    "slug": "wildhawk",
    "city": "San Francisco",
    "state": "CA",
    "neighborhood": "SoMa",
    "address": "632 2nd St",
    "lat": 37.7749,
    "lng": -122.4194,
    "cuisine": "Cocktail Bar",
    "cuisineTags": [
      "Cocktail Bar"
    ],
    "vibeTags": [
      "cocktails"
    ],
    "occasionTags": [
      "girls-night"
    ],
    "price": "$$$",
    "priceLevel": 3,
    "vibeNotes": "Neon-lit lounge; craft cocktails; photo-worthy interiors",
    "sourceCredit": "TikTok"
  },
  {
    "id": "bf72f111-eca3-9bbc-2179-2e4885597c7d",
    "name": "Foreign Cinema",
    "slug": "foreign-cinema",
    "city": "San Francisco",
    "state": "CA",
    "neighborhood": "Mission",
    "address": "2534 Mission St",
    "lat": 37.7749,
    "lng": -122.4194,
    "cuisine": "Cal-Mediterranean",
    "cuisineTags": [
      "Cal-Mediterranean"
    ],
    "vibeTags": [
      "outdoor",
      "brunch",
      "iconic"
    ],
    "occasionTags": [
      "girls-night"
    ],
    "price": "$$$",
    "priceLevel": 3,
    "vibeNotes": "Outdoor courtyard with projected films; brunch or dinner; iconic",
    "sourceCredit": "Infatuation"
  },
  {
    "id": "6eafe217-e0f9-9d15-ee10-f4d6267f7cc2",
    "name": "Trick Dog",
    "slug": "trick-dog",
    "city": "San Francisco",
    "state": "CA",
    "neighborhood": "Mission",
    "address": "3174 20th St",
    "lat": 37.7749,
    "lng": -122.4194,
    "cuisine": "Cocktail Bar",
    "cuisineTags": [
      "Cocktail Bar"
    ],
    "vibeTags": [
      "cocktails"
    ],
    "occasionTags": [
      "girls-night"
    ],
    "price": "$$$",
    "priceLevel": 3,
    "vibeNotes": "Inventive cocktails; rotating theme menus; hip crowd",
    "sourceCredit": "Resy"
  },
  {
    "id": "0f5805f4-2517-d27c-221c-b843d3575004",
    "name": "House of Prime Rib",
    "slug": "house-of-prime-rib",
    "city": "San Francisco",
    "state": "CA",
    "neighborhood": "Nob Hill",
    "address": "1906 Van Ness Ave",
    "lat": 37.7749,
    "lng": -122.4194,
    "cuisine": "Steakhouse",
    "cuisineTags": [
      "Steakhouse"
    ],
    "vibeTags": [],
    "occasionTags": [
      "guys-night"
    ],
    "price": "$$$",
    "priceLevel": 3,
    "vibeNotes": "SF institution since 1949; tableside carved prime rib; martinis",
    "sourceCredit": "Resy"
  },
  {
    "id": "80a5aaaf-32ab-2a1d-4550-6a7cba49babc",
    "name": "Arcade Bar",
    "slug": "arcade-bar",
    "city": "San Francisco",
    "state": "CA",
    "neighborhood": "SoMa",
    "address": "827 Mission St",
    "lat": 37.7749,
    "lng": -122.4194,
    "cuisine": "Arcade Bar",
    "cuisineTags": [
      "Arcade Bar"
    ],
    "vibeTags": [],
    "occasionTags": [
      "guys-night"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Classic arcade games; cheap drinks; competitive crew energy",
    "sourceCredit": "Yelp"
  },
  {
    "id": "3123eac7-6626-3636-8896-2584bbc4d606",
    "name": "Beretta",
    "slug": "beretta",
    "city": "San Francisco",
    "state": "CA",
    "neighborhood": "Mission",
    "address": "1199 Valencia St",
    "lat": 37.7749,
    "lng": -122.4194,
    "cuisine": "Italian / Cocktails",
    "cuisineTags": [
      "Italian",
      "Cocktails"
    ],
    "vibeTags": [
      "cocktails",
      "late-night"
    ],
    "occasionTags": [
      "guys-night"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Late-night pizza & cocktails; lively Mission nightlife",
    "sourceCredit": "Instagram"
  },
  {
    "id": "e5edca28-c3ad-8e4b-62ae-2c730db1155e",
    "name": "Bloodhound",
    "slug": "bloodhound",
    "city": "San Francisco",
    "state": "CA",
    "neighborhood": "SoMa",
    "address": "1145 Folsom St",
    "lat": 37.7749,
    "lng": -122.4194,
    "cuisine": "Dive Bar",
    "cuisineTags": [
      "Dive Bar"
    ],
    "vibeTags": [],
    "occasionTags": [
      "guys-night"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Bourbon bar; leather booths; pool table; no-frills guys night",
    "sourceCredit": "Yelp"
  },
  {
    "id": "5e858ebd-2bed-bd80-0156-ac90c8c8c92e",
    "name": "Anchor Brewing Taproom",
    "slug": "anchor-brewing-taproom",
    "city": "San Francisco",
    "state": "CA",
    "neighborhood": "Potrero Hill",
    "address": "1705 Mariposa St",
    "lat": 37.7749,
    "lng": -122.4194,
    "cuisine": "Brewery",
    "cuisineTags": [
      "Brewery"
    ],
    "vibeTags": [],
    "occasionTags": [
      "guys-night"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Historic SF brewery; tours & tastings; craft beer crew outing",
    "sourceCredit": "TikTok"
  },
  {
    "id": "52999c18-8548-36d1-2bee-d3df95e0bf45",
    "name": "Seven Stills",
    "slug": "seven-stills",
    "city": "San Francisco",
    "state": "CA",
    "neighborhood": "Mission Bay",
    "address": "100 Hooper St",
    "lat": 37.7749,
    "lng": -122.4194,
    "cuisine": "Brewery/Distillery",
    "cuisineTags": [
      "Brewery",
      "Distillery"
    ],
    "vibeTags": [
      "whiskey"
    ],
    "occasionTags": [
      "guys-night"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Beer-whiskey hybrids; industrial taproom; unique tasting flights",
    "sourceCredit": "Instagram"
  },
  {
    "id": "563e01a1-1585-bb89-ed7f-767f322b08ce",
    "name": "Audio",
    "slug": "audio",
    "city": "San Francisco",
    "state": "CA",
    "neighborhood": "SoMa",
    "address": "316 11th St",
    "lat": 37.7749,
    "lng": -122.4194,
    "cuisine": "Nightclub",
    "cuisineTags": [
      "Nightclub"
    ],
    "vibeTags": [
      "intimate"
    ],
    "occasionTags": [
      "bachelor"
    ],
    "price": "$$$",
    "priceLevel": 3,
    "vibeNotes": "Top-tier sound system; underground techno & house; intimate club",
    "sourceCredit": "TikTok"
  },
  {
    "id": "f1e2f908-739f-a3fb-0e57-6b460f83441b",
    "name": "Bourbon & Branch",
    "slug": "bourbon-branch",
    "city": "San Francisco",
    "state": "CA",
    "neighborhood": "Tenderloin",
    "address": "501 Jones St",
    "lat": 37.7749,
    "lng": -122.4194,
    "cuisine": "Speakeasy",
    "cuisineTags": [
      "Speakeasy"
    ],
    "vibeTags": [
      "cocktails"
    ],
    "occasionTags": [
      "bachelor"
    ],
    "price": "$$$",
    "priceLevel": 3,
    "vibeNotes": "Password-entry speakeasy; prohibition-era cocktails; secret rooms",
    "sourceCredit": "Instagram"
  },
  {
    "id": "7fc6f6b9-f9c9-3aca-8b63-fb3527a54eb9",
    "name": "Coin-Op Game Room",
    "slug": "coin-op-game-room",
    "city": "San Francisco",
    "state": "CA",
    "neighborhood": "SoMa",
    "address": "508 4th St",
    "lat": 37.7749,
    "lng": -122.4194,
    "cuisine": "Arcade Bar",
    "cuisineTags": [
      "Arcade Bar"
    ],
    "vibeTags": [
      "cocktails"
    ],
    "occasionTags": [
      "bachelor"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Full arcade; craft cocktails; group gaming energy",
    "sourceCredit": "Yelp"
  },
  {
    "id": "53bedb2d-ec59-061a-de25-1fb3f37a72b4",
    "name": "Bay Voyager Boat Party",
    "slug": "bay-voyager-boat-party",
    "city": "San Francisco",
    "state": "CA",
    "neighborhood": "Pier 40",
    "address": "Various departures",
    "lat": 37.7749,
    "lng": -122.4194,
    "cuisine": "Boat Party",
    "cuisineTags": [
      "Boat Party"
    ],
    "vibeTags": [
      "dj"
    ],
    "occasionTags": [
      "bachelor"
    ],
    "price": "$$$$",
    "priceLevel": 4,
    "vibeNotes": "Private yacht charters; DJ; Bay cruise; bachelor classic",
    "sourceCredit": "Viator"
  },
  {
    "id": "3341525e-cd80-ee92-61c2-2054dd82c8df",
    "name": "Lands End Trail",
    "slug": "lands-end-trail",
    "city": "San Francisco",
    "state": "CA",
    "neighborhood": "Outer Richmond",
    "address": "680 Point Lobos Ave",
    "lat": 37.7749,
    "lng": -122.4194,
    "cuisine": "Hiking Trail",
    "cuisineTags": [
      "Hiking Trail"
    ],
    "vibeTags": [],
    "occasionTags": [
      "outdoor-adventure"
    ],
    "price": "Free",
    "priceLevel": 1,
    "vibeNotes": "Coastal trail; Golden Gate Bridge views; Sutro Baths ruins",
    "sourceCredit": "TikTok"
  },
  {
    "id": "045f7edb-a8c1-c2a1-fc1e-0358ebdfe729",
    "name": "Dolores Park",
    "slug": "dolores-park",
    "city": "San Francisco",
    "state": "CA",
    "neighborhood": "Mission",
    "address": "19th & Dolores St",
    "lat": 37.7749,
    "lng": -122.4194,
    "cuisine": "Park",
    "cuisineTags": [
      "Park"
    ],
    "vibeTags": [
      "wine"
    ],
    "occasionTags": [
      "outdoor-adventure"
    ],
    "price": "Free",
    "priceLevel": 1,
    "vibeNotes": "SF's living room; bring wine & snacks; skyline views; weekend scene",
    "sourceCredit": "Instagram"
  },
  {
    "id": "03a6c9cf-6f7d-4f84-4815-23ac5b673033",
    "name": "Golden Gate Park Bike Ride",
    "slug": "golden-gate-park-bike-ride",
    "city": "San Francisco",
    "state": "CA",
    "neighborhood": "Golden Gate Park",
    "address": "Various entrances",
    "lat": 37.7749,
    "lng": -122.4194,
    "cuisine": "Cycling",
    "cuisineTags": [
      "Cycling"
    ],
    "vibeTags": [],
    "occasionTags": [
      "outdoor-adventure"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Bike through the park to Ocean Beach; group rental available",
    "sourceCredit": "Viator"
  },
  {
    "id": "825ac1eb-0084-aada-ac6f-ddde0f69a445",
    "name": "Baker Beach",
    "slug": "baker-beach",
    "city": "San Francisco",
    "state": "CA",
    "neighborhood": "Presidio",
    "address": "1504 Pershing Dr",
    "lat": 37.7749,
    "lng": -122.4194,
    "cuisine": "Beach",
    "cuisineTags": [
      "Beach"
    ],
    "vibeTags": [
      "sunset"
    ],
    "occasionTags": [
      "outdoor-adventure"
    ],
    "price": "Free",
    "priceLevel": 1,
    "vibeNotes": "Golden Gate Bridge views; bonfires allowed; sunset crew spot",
    "sourceCredit": "TikTok"
  },
  {
    "id": "6051d35b-f51a-f5d7-fae3-40958d298590",
    "name": "Alcatraz Night Tour",
    "slug": "alcatraz-night-tour",
    "city": "San Francisco",
    "state": "CA",
    "neighborhood": "Pier 33",
    "address": "Hornblower Landing",
    "lat": 37.7749,
    "lng": -122.4194,
    "cuisine": "Tour",
    "cuisineTags": [
      "Tour"
    ],
    "vibeTags": [],
    "occasionTags": [
      "outdoor-adventure"
    ],
    "price": "$$$",
    "priceLevel": 3,
    "vibeNotes": "After-dark ferry to Alcatraz; eerie & unforgettable group experience",
    "sourceCredit": "Instagram"
  },
  {
    "id": "a051838b-c738-63c8-65e9-ca04d5fc745d",
    "name": "Spinasse",
    "slug": "spinasse",
    "city": "Seattle",
    "state": "WA",
    "neighborhood": "Capitol Hill",
    "address": "1531 14th Ave",
    "lat": 47.6062,
    "lng": -122.3321,
    "cuisine": "Italian / Piedmontese",
    "cuisineTags": [
      "Italian",
      "Piedmontese"
    ],
    "vibeTags": [
      "romantic"
    ],
    "occasionTags": [
      "date-night"
    ],
    "price": "$$$",
    "priceLevel": 3,
    "vibeNotes": "Handmade tajarin pasta, candlelit, one of Seattle's most romantic spots",
    "sourceCredit": "TikTok"
  },
  {
    "id": "058de65b-55fa-14e6-a7b0-60a1dc6ddebb",
    "name": "Altura",
    "slug": "altura",
    "city": "Seattle",
    "state": "WA",
    "neighborhood": "Capitol Hill",
    "address": "617 Broadway E",
    "lat": 47.6062,
    "lng": -122.3321,
    "cuisine": "Italian Tasting Menu",
    "cuisineTags": [
      "Italian Tasting Menu"
    ],
    "vibeTags": [
      "intimate"
    ],
    "occasionTags": [
      "date-night"
    ],
    "price": "$$$$",
    "priceLevel": 4,
    "vibeNotes": "Chef's counter tasting menu; intimate, seasonal, unforgettable",
    "sourceCredit": "Instagram"
  },
  {
    "id": "cedb592c-e417-f210-f65a-ba852048d726",
    "name": "SkyCity at the Needle",
    "slug": "skycity-at-the-needle",
    "city": "Seattle",
    "state": "WA",
    "neighborhood": "Seattle Center",
    "address": "400 Broad St",
    "lat": 47.6062,
    "lng": -122.3321,
    "cuisine": "Revolving / American",
    "cuisineTags": [
      "Revolving",
      "American"
    ],
    "vibeTags": [
      "iconic"
    ],
    "occasionTags": [
      "date-night"
    ],
    "price": "$$$$",
    "priceLevel": 4,
    "vibeNotes": "Rotating restaurant 500ft up; propose here, iconic views",
    "sourceCredit": "TikTok"
  },
  {
    "id": "749c17bb-4abc-f10f-c650-24838fc0a45d",
    "name": "Place Pigalle",
    "slug": "place-pigalle",
    "city": "Seattle",
    "state": "WA",
    "neighborhood": "Pike Place",
    "address": "81 Pike St",
    "lat": 47.6062,
    "lng": -122.3321,
    "cuisine": "French / Views",
    "cuisineTags": [
      "French",
      "Views"
    ],
    "vibeTags": [
      "waterfront"
    ],
    "occasionTags": [
      "date-night"
    ],
    "price": "$$$",
    "priceLevel": 3,
    "vibeNotes": "French bistro tucked inside Pike Place with Elliott Bay waterfront views",
    "sourceCredit": "Instagram"
  },
  {
    "id": "16d8ddcf-d383-12ac-9375-638216e6e3c7",
    "name": "The Pink Door",
    "slug": "the-pink-door",
    "city": "Seattle",
    "state": "WA",
    "neighborhood": "Pike Place",
    "address": "1919 Post Alley",
    "lat": 47.6062,
    "lng": -122.3321,
    "cuisine": "Italian / Cabaret",
    "cuisineTags": [
      "Italian",
      "Cabaret"
    ],
    "vibeTags": [
      "hidden-gem"
    ],
    "occasionTags": [
      "date-night"
    ],
    "price": "$$$",
    "priceLevel": 3,
    "vibeNotes": "Hidden Italian gem with trapeze artists and live entertainment nightly",
    "sourceCredit": "TikTok"
  },
  {
    "id": "75f52a44-98e0-6d78-aea6-2cef91917b49",
    "name": "Aqua by El Gaucho",
    "slug": "aqua-by-el-gaucho",
    "city": "Seattle",
    "state": "WA",
    "neighborhood": "South Lake Union",
    "address": "2801 Alaskan Way",
    "lat": 47.6062,
    "lng": -122.3321,
    "cuisine": "Seafood / Waterfront",
    "cuisineTags": [
      "Seafood",
      "Waterfront"
    ],
    "vibeTags": [
      "waterfront",
      "cocktails",
      "sunset"
    ],
    "occasionTags": [
      "date-night"
    ],
    "price": "$$$$",
    "priceLevel": 4,
    "vibeNotes": "Waterfront fine dining, tableside preparations, sunset cocktails",
    "sourceCredit": "Instagram"
  },
  {
    "id": "2fe585e5-fc0b-df4d-06f0-55926d0ef171",
    "name": "La Fontana Siciliana",
    "slug": "la-fontana-siciliana",
    "city": "Seattle",
    "state": "WA",
    "neighborhood": "Belltown",
    "address": "120 Blanchard St",
    "lat": 47.6062,
    "lng": -122.3321,
    "cuisine": "Sicilian",
    "cuisineTags": [
      "Sicilian"
    ],
    "vibeTags": [
      "intimate"
    ],
    "occasionTags": [
      "date-night"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Intimate family-run Sicilian spot; homemade pasta, candlelit tables",
    "sourceCredit": "TikTok"
  },
  {
    "id": "1431bef8-1539-beaa-5f1c-5de416dbdc2d",
    "name": "Il Terrazzo Carmine",
    "slug": "il-terrazzo-carmine",
    "city": "Seattle",
    "state": "WA",
    "neighborhood": "Pioneer Square",
    "address": "411 1st Ave S",
    "lat": 47.6062,
    "lng": -122.3321,
    "cuisine": "Italian",
    "cuisineTags": [
      "Italian"
    ],
    "vibeTags": [],
    "occasionTags": [
      "date-night"
    ],
    "price": "$$$",
    "priceLevel": 3,
    "vibeNotes": "Old-school Italian elegance, courtyard dining, classic date night",
    "sourceCredit": "Instagram"
  },
  {
    "id": "7a8f89bd-6719-06f8-ab63-e86d856b83e7",
    "name": "The Nest",
    "slug": "the-nest",
    "city": "Seattle",
    "state": "WA",
    "neighborhood": "Capitol Hill",
    "address": "1435 E Pine St",
    "lat": 47.6062,
    "lng": -122.3321,
    "cuisine": "Cocktail Bar",
    "cuisineTags": [
      "Cocktail Bar"
    ],
    "vibeTags": [
      "fun",
      "rooftop",
      "cocktails"
    ],
    "occasionTags": [
      "group-night-out"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Tropical rooftop bar with tiki cocktails; always packed, always fun",
    "sourceCredit": "TikTok"
  },
  {
    "id": "1d075a8d-fc26-fca4-fca4-46816e752d07",
    "name": "Garage Billiards",
    "slug": "garage-billiards",
    "city": "Seattle",
    "state": "WA",
    "neighborhood": "Capitol Hill",
    "address": "1130 Broadway",
    "lat": 47.6062,
    "lng": -122.3321,
    "cuisine": "Bar / Games",
    "cuisineTags": [
      "Bar",
      "Games"
    ],
    "vibeTags": [],
    "occasionTags": [
      "group-night-out"
    ],
    "price": "$",
    "priceLevel": 1,
    "vibeNotes": "Pool, shuffleboard, bowling \u2014 huge space perfect for groups",
    "sourceCredit": "Instagram"
  },
  {
    "id": "a1a435ca-aa62-31fc-c7e0-e8ad3a65d012",
    "name": "Baba Yaga",
    "slug": "baba-yaga",
    "city": "Seattle",
    "state": "WA",
    "neighborhood": "Capitol Hill",
    "address": "3209 E Madison St",
    "lat": 47.6062,
    "lng": -122.3321,
    "cuisine": "Russian / Cocktails",
    "cuisineTags": [
      "Russian",
      "Cocktails"
    ],
    "vibeTags": [
      "cocktails"
    ],
    "occasionTags": [
      "group-night-out"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Moody cocktail bar with Russian-inspired bites and craft drinks",
    "sourceCredit": "TikTok"
  },
  {
    "id": "89a90798-6b4f-c32c-fc8c-506ed5ec0050",
    "name": "Supernova",
    "slug": "supernova",
    "city": "Seattle",
    "state": "WA",
    "neighborhood": "Georgetown",
    "address": "110 S Horton St",
    "lat": 47.6062,
    "lng": -122.3321,
    "cuisine": "Dance Club",
    "cuisineTags": [
      "Dance Club"
    ],
    "vibeTags": [
      "dance"
    ],
    "occasionTags": [
      "group-night-out"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Seattle's wildest dance floor; themed nights, LGBTQ+ friendly, high energy",
    "sourceCredit": "Instagram"
  },
  {
    "id": "ed3a2446-774d-3c34-5342-4cb81ae6e247",
    "name": "Monkey Loft",
    "slug": "monkey-loft",
    "city": "Seattle",
    "state": "WA",
    "neighborhood": "SODO",
    "address": "2915 1st Ave S",
    "lat": 47.6062,
    "lng": -122.3321,
    "cuisine": "Rooftop Club",
    "cuisineTags": [
      "Rooftop Club"
    ],
    "vibeTags": [
      "rooftop",
      "dance",
      "dj"
    ],
    "occasionTags": [
      "group-night-out",
      "bachelor"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Open-air rooftop dance venue with downtown skyline views",
    "sourceCredit": "TikTok"
  },
  {
    "id": "1f5d43c1-24ec-a041-284a-cf18a78b81d4",
    "name": "The Hideout",
    "slug": "the-hideout",
    "city": "Seattle",
    "state": "WA",
    "neighborhood": "First Hill",
    "address": "1305 E Jefferson St",
    "lat": 47.6062,
    "lng": -122.3321,
    "cuisine": "Dive / Music",
    "cuisineTags": [
      "Dive",
      "Music"
    ],
    "vibeTags": [
      "live-music"
    ],
    "occasionTags": [
      "group-night-out"
    ],
    "price": "$",
    "priceLevel": 1,
    "vibeNotes": "Live music venue with cheap drinks and a no-pretense vibe",
    "sourceCredit": "Instagram"
  },
  {
    "id": "c40676b4-63a3-fdff-472b-bd5e9846bbbf",
    "name": "Havana",
    "slug": "havana",
    "city": "Seattle",
    "state": "WA",
    "neighborhood": "Capitol Hill",
    "address": "1010 E Pike St",
    "lat": 47.6062,
    "lng": -122.3321,
    "cuisine": "Cuban / Nightclub",
    "cuisineTags": [
      "Cuban",
      "Nightclub"
    ],
    "vibeTags": [
      "dance"
    ],
    "occasionTags": [
      "group-night-out"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Cuban food by dinner, salsa dance floor by night; lively and colorful",
    "sourceCredit": "TikTok"
  },
  {
    "id": "13ffca78-4288-fbed-39df-352f2b0b70ec",
    "name": "Unicorn",
    "slug": "unicorn",
    "city": "Seattle",
    "state": "WA",
    "neighborhood": "Capitol Hill",
    "address": "1118 E Pike St",
    "lat": 47.6062,
    "lng": -122.3321,
    "cuisine": "Carnival Bar",
    "cuisineTags": [
      "Carnival Bar"
    ],
    "vibeTags": [],
    "occasionTags": [
      "group-night-out"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Carnival-themed bar with pinball, corndog happy hour, neon chaos",
    "sourceCredit": "Instagram"
  },
  {
    "id": "14bc7f4e-c04a-cbd9-72f6-84cfa2264e26",
    "name": "Canlis",
    "slug": "canlis",
    "city": "Seattle",
    "state": "WA",
    "neighborhood": "Queen Anne",
    "address": "2576 Aurora Ave N",
    "lat": 47.6062,
    "lng": -122.3321,
    "cuisine": "Pacific NW Fine Dining",
    "cuisineTags": [
      "Pacific NW Fine Dining"
    ],
    "vibeTags": [
      "iconic"
    ],
    "occasionTags": [
      "in-laws"
    ],
    "price": "$$$$",
    "priceLevel": 4,
    "vibeNotes": "Seattle's iconic fine-dining destination since 1950; jacket suggested, views",
    "sourceCredit": "TikTok"
  },
  {
    "id": "00eee433-b165-7194-1c0b-d7f00f6a684e",
    "name": "The Walrus and the Carpenter",
    "slug": "the-walrus-and-the-carpenter",
    "city": "Seattle",
    "state": "WA",
    "neighborhood": "Ballard",
    "address": "4743 Ballard Ave NW",
    "lat": 47.6062,
    "lng": -122.3321,
    "cuisine": "Oyster Bar",
    "cuisineTags": [
      "Oyster Bar"
    ],
    "vibeTags": [],
    "occasionTags": [
      "in-laws"
    ],
    "price": "$$$",
    "priceLevel": 3,
    "vibeNotes": "Renee Erickson's legendary oyster bar; refined but not stuffy",
    "sourceCredit": "Instagram"
  },
  {
    "id": "c50bf48b-285a-d8bd-6a62-4952bdd6e7be",
    "name": "Copine",
    "slug": "copine",
    "city": "Seattle",
    "state": "WA",
    "neighborhood": "Ballard",
    "address": "6460 24th Ave NW",
    "lat": 47.6062,
    "lng": -122.3321,
    "cuisine": "French-American",
    "cuisineTags": [
      "French-American"
    ],
    "vibeTags": [
      "wine"
    ],
    "occasionTags": [
      "in-laws"
    ],
    "price": "$$$",
    "priceLevel": 3,
    "vibeNotes": "Bright, airy space with excellent wine list and seasonal French fare",
    "sourceCredit": "TikTok"
  },
  {
    "id": "ce549a2c-2581-dedf-90c4-01d3293fb3ab",
    "name": "Communion",
    "slug": "communion",
    "city": "Seattle",
    "state": "WA",
    "neighborhood": "Central District",
    "address": "1004 E Union St",
    "lat": 47.6062,
    "lng": -122.3321,
    "cuisine": "Southern / NW Fusion",
    "cuisineTags": [
      "Southern",
      "NW Fusion"
    ],
    "vibeTags": [
      "elegant"
    ],
    "occasionTags": [
      "in-laws"
    ],
    "price": "$$$",
    "priceLevel": 3,
    "vibeNotes": "Black-owned, elegant Southern cuisine with Pacific NW ingredients",
    "sourceCredit": "Instagram"
  },
  {
    "id": "b9216d93-408f-05c6-e11f-30668624b0b9",
    "name": "Maximilien",
    "slug": "maximilien",
    "city": "Seattle",
    "state": "WA",
    "neighborhood": "Pike Place",
    "address": "81A Pike St",
    "lat": 47.6062,
    "lng": -122.3321,
    "cuisine": "French Bistro",
    "cuisineTags": [
      "French Bistro"
    ],
    "vibeTags": [],
    "occasionTags": [
      "in-laws"
    ],
    "price": "$$$",
    "priceLevel": 3,
    "vibeNotes": "French bistro in Pike Place with floor-to-ceiling views of Elliott Bay",
    "sourceCredit": "TikTok"
  },
  {
    "id": "fb6655c8-c3c9-8da0-bbe6-1ad4ad3032e5",
    "name": "The Corson Building",
    "slug": "the-corson-building",
    "city": "Seattle",
    "state": "WA",
    "neighborhood": "Georgetown",
    "address": "5609 Corson Ave S",
    "lat": 47.6062,
    "lng": -122.3321,
    "cuisine": "Farm-to-Table",
    "cuisineTags": [
      "Farm-to-Table"
    ],
    "vibeTags": [],
    "occasionTags": [
      "in-laws"
    ],
    "price": "$$$$",
    "priceLevel": 4,
    "vibeNotes": "Multi-course communal dinners in a converted farmhouse; ticketed events",
    "sourceCredit": "Instagram"
  },
  {
    "id": "d8857c1b-2b1b-bb29-d97e-dc92f90b538a",
    "name": "Bateau",
    "slug": "bateau",
    "city": "Seattle",
    "state": "WA",
    "neighborhood": "Capitol Hill",
    "address": "1040 E Union St",
    "lat": 47.6062,
    "lng": -122.3321,
    "cuisine": "Whole-Animal / American",
    "cuisineTags": [
      "Whole-Animal",
      "American"
    ],
    "vibeTags": [],
    "occasionTags": [
      "in-laws"
    ],
    "price": "$$$$",
    "priceLevel": 4,
    "vibeNotes": "Whole-animal butchery restaurant; seasonal, refined, Pacific NW at its best",
    "sourceCredit": "TikTok"
  },
  {
    "id": "f6b07cd6-343d-6c82-2437-69cd33fd0008",
    "name": "Caety's",
    "slug": "caety-s",
    "city": "Seattle",
    "state": "WA",
    "neighborhood": "Capitol Hill",
    "address": "1425 Broadway",
    "lat": 47.6062,
    "lng": -122.3321,
    "cuisine": "Cocktail Lounge",
    "cuisineTags": [
      "Cocktail Lounge"
    ],
    "vibeTags": [
      "cozy",
      "cocktails"
    ],
    "occasionTags": [
      "girls-night"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Women-owned craft cocktail bar with seasonal menus and cozy decor",
    "sourceCredit": "TikTok"
  },
  {
    "id": "9cd8ddb7-898c-fb0d-64b7-aad61aae6089",
    "name": "La Loba",
    "slug": "la-loba",
    "city": "Seattle",
    "state": "WA",
    "neighborhood": "Capitol Hill",
    "address": "2220 E Union St",
    "lat": 47.6062,
    "lng": -122.3321,
    "cuisine": "Mezcal Bar / Mexican",
    "cuisineTags": [
      "Mezcal Bar",
      "Mexican"
    ],
    "vibeTags": [
      "cocktails"
    ],
    "occasionTags": [
      "girls-night"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Mezcal-forward cocktail bar with tacos, murals, and good energy",
    "sourceCredit": "Instagram"
  },
  {
    "id": "0bba97ab-4ffc-23c3-e6e6-5a3d4b25e5f1",
    "name": "Inside Passage",
    "slug": "inside-passage",
    "city": "Seattle",
    "state": "WA",
    "neighborhood": "Pioneer Square",
    "address": "312 2nd Ave S",
    "lat": 47.6062,
    "lng": -122.3321,
    "cuisine": "Tiki Bar",
    "cuisineTags": [
      "Tiki Bar"
    ],
    "vibeTags": [
      "cocktails"
    ],
    "occasionTags": [
      "girls-night"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Underground tiki bar with elaborate tropical cocktails and dim vibes",
    "sourceCredit": "TikTok"
  },
  {
    "id": "5d779587-a403-8885-4d87-cc5a746dd5c2",
    "name": "Altitude Sky Lounge",
    "slug": "altitude-sky-lounge",
    "city": "Seattle",
    "state": "WA",
    "neighborhood": "Downtown",
    "address": "1823 Terry Ave",
    "lat": 47.6062,
    "lng": -122.3321,
    "cuisine": "Rooftop Bar",
    "cuisineTags": [
      "Rooftop Bar"
    ],
    "vibeTags": [
      "rooftop",
      "cocktails"
    ],
    "occasionTags": [
      "girls-night"
    ],
    "price": "$$$",
    "priceLevel": 3,
    "vibeNotes": "Chic rooftop at Hotel \u00c4ndra with panoramic views and crafted cocktails",
    "sourceCredit": "Instagram"
  },
  {
    "id": "31b74a86-4cf8-4696-2136-8a6e0296701d",
    "name": "Bathtub Gin & Co",
    "slug": "bathtub-gin-co",
    "city": "Seattle",
    "state": "WA",
    "neighborhood": "Belltown",
    "address": "2205 2nd Ave",
    "lat": 47.6062,
    "lng": -122.3321,
    "cuisine": "Speakeasy",
    "cuisineTags": [
      "Speakeasy"
    ],
    "vibeTags": [
      "cozy",
      "hidden-gem",
      "cocktails"
    ],
    "occasionTags": [
      "girls-night"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Hidden behind an unmarked door; inventive cocktails in a cozy bathtub-themed space",
    "sourceCredit": "TikTok"
  },
  {
    "id": "a8e121ff-977a-6a2e-a54b-91c5a7f3577d",
    "name": "Hula Hula",
    "slug": "hula-hula",
    "city": "Seattle",
    "state": "WA",
    "neighborhood": "Capitol Hill",
    "address": "106 Broadway E",
    "lat": 47.6062,
    "lng": -122.3321,
    "cuisine": "Hawaiian / Dance",
    "cuisineTags": [
      "Hawaiian",
      "Dance"
    ],
    "vibeTags": [
      "fun",
      "dance",
      "cocktails"
    ],
    "occasionTags": [
      "girls-night"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Tropical cocktails and a packed dance floor; fun and unpretentious",
    "sourceCredit": "Instagram"
  },
  {
    "id": "62a6e90a-96f9-69ac-10b1-6881057d5ef0",
    "name": "Capitol Cider",
    "slug": "capitol-cider",
    "city": "Seattle",
    "state": "WA",
    "neighborhood": "Capitol Hill",
    "address": "818 E Pike St",
    "lat": 47.6062,
    "lng": -122.3321,
    "cuisine": "Cider House",
    "cuisineTags": [
      "Cider House"
    ],
    "vibeTags": [
      "chill",
      "late-night"
    ],
    "occasionTags": [
      "girls-night"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "100% gluten-free cider bar with shareable plates and a chill girls night vibe",
    "sourceCredit": "TikTok"
  },
  {
    "id": "d8b8041e-560c-84a6-5d89-c158757f5742",
    "name": "Roxbury Lanes",
    "slug": "roxbury-lanes",
    "city": "Seattle",
    "state": "WA",
    "neighborhood": "University District",
    "address": "6820 Roosevelt Way NE",
    "lat": 47.6062,
    "lng": -122.3321,
    "cuisine": "Bowling / Bar",
    "cuisineTags": [
      "Bowling",
      "Bar"
    ],
    "vibeTags": [],
    "occasionTags": [
      "girls-night"
    ],
    "price": "$",
    "priceLevel": 1,
    "vibeNotes": "Retro bowling with cosmic lights and cheap pitchers",
    "sourceCredit": "Instagram"
  },
  {
    "id": "76a8c1ad-db4c-fbdd-d660-9a9edbf7b5c6",
    "name": "Polar Bar",
    "slug": "polar-bar",
    "city": "Seattle",
    "state": "WA",
    "neighborhood": "Capitol Hill",
    "address": "1010 E Pike St",
    "lat": 47.6062,
    "lng": -122.3321,
    "cuisine": "Cocktail Bar",
    "cuisineTags": [
      "Cocktail Bar"
    ],
    "vibeTags": [
      "cocktails"
    ],
    "occasionTags": [
      "guys-night"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Icy Scandinavia-themed cocktail bar; craft drinks, moody lighting",
    "sourceCredit": "TikTok"
  },
  {
    "id": "0864b68c-587d-b210-b444-c15c9a328e12",
    "name": "Pony Bar",
    "slug": "pony-bar",
    "city": "Seattle",
    "state": "WA",
    "neighborhood": "Capitol Hill",
    "address": "1221 E Madison St",
    "lat": 47.6062,
    "lng": -122.3321,
    "cuisine": "Dive Bar",
    "cuisineTags": [
      "Dive Bar"
    ],
    "vibeTags": [],
    "occasionTags": [
      "guys-night"
    ],
    "price": "$",
    "priceLevel": 1,
    "vibeNotes": "No-frills dive with stiff drinks, pool tables, and zero pretension",
    "sourceCredit": "Instagram"
  },
  {
    "id": "753550c2-cdb9-0c7a-f721-00debedcd24e",
    "name": "Blade & Timber",
    "slug": "blade-timber",
    "city": "Seattle",
    "state": "WA",
    "neighborhood": "Capitol Hill",
    "address": "735 10th Ave",
    "lat": 47.6062,
    "lng": -122.3321,
    "cuisine": "Axe Throwing / Bar",
    "cuisineTags": [
      "Axe Throwing",
      "Bar"
    ],
    "vibeTags": [],
    "occasionTags": [
      "guys-night"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Competitive axe throwing with craft beer and bourbon",
    "sourceCredit": "TikTok"
  },
  {
    "id": "0682639b-380b-0eac-4916-7048673a6149",
    "name": "Cloudburst Brewing",
    "slug": "cloudburst-brewing",
    "city": "Seattle",
    "state": "WA",
    "neighborhood": "Ballard",
    "address": "5456 Shilshole Ave NW",
    "lat": 47.6062,
    "lng": -122.3321,
    "cuisine": "Brewery",
    "cuisineTags": [
      "Brewery"
    ],
    "vibeTags": [
      "patio"
    ],
    "occasionTags": [
      "guys-night"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Experimental IPAs in an industrial taproom; dog-friendly patio",
    "sourceCredit": "Instagram"
  },
  {
    "id": "f9bc01c8-e5ed-ef2a-35dc-8041a43831c6",
    "name": "Fremont Brewing",
    "slug": "fremont-brewing",
    "city": "Seattle",
    "state": "WA",
    "neighborhood": "Fremont",
    "address": "1050 N 34th St",
    "lat": 47.6062,
    "lng": -122.3321,
    "cuisine": "Brewery / Beer Garden",
    "cuisineTags": [
      "Brewery",
      "Beer Garden"
    ],
    "vibeTags": [
      "outdoor"
    ],
    "occasionTags": [
      "guys-night"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Urban beer garden with excellent IPAs and outdoor communal tables",
    "sourceCredit": "TikTok"
  },
  {
    "id": "44641fd9-617a-7eb7-e84f-4d6cd888df6d",
    "name": "The Barrel Thief",
    "slug": "the-barrel-thief",
    "city": "Seattle",
    "state": "WA",
    "neighborhood": "Fremont",
    "address": "3417 Evanston Ave N",
    "lat": 47.6062,
    "lng": -122.3321,
    "cuisine": "Wine Bar / Lounge",
    "cuisineTags": [
      "Wine Bar",
      "Lounge"
    ],
    "vibeTags": [
      "wine"
    ],
    "occasionTags": [
      "guys-night"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Self-pour wine tasting wall with 40+ wines, cheese boards",
    "sourceCredit": "Instagram"
  },
  {
    "id": "4aad7bc6-00f5-6adf-de2b-e79ac3c85eee",
    "name": "iFly",
    "slug": "ifly",
    "city": "Seattle",
    "state": "WA",
    "neighborhood": "Tukwila",
    "address": "349 Tukwila Pkwy",
    "lat": 47.6062,
    "lng": -122.3321,
    "cuisine": "Indoor Skydiving",
    "cuisineTags": [
      "Indoor Skydiving"
    ],
    "vibeTags": [],
    "occasionTags": [
      "guys-night"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Indoor skydiving experience \u2014 adrenaline rush before hitting bars",
    "sourceCredit": "TikTok"
  },
  {
    "id": "b992a376-b492-dcbe-be17-766a8da26c7e",
    "name": "Massive",
    "slug": "massive",
    "city": "Seattle",
    "state": "WA",
    "neighborhood": "SoDo",
    "address": "615 S Weller St",
    "lat": 47.6062,
    "lng": -122.3321,
    "cuisine": "Nightclub",
    "cuisineTags": [
      "Nightclub"
    ],
    "vibeTags": [
      "dj"
    ],
    "occasionTags": [
      "bachelor"
    ],
    "price": "$$$",
    "priceLevel": 3,
    "vibeNotes": "Multi-room nightclub with VIP bottle service and top DJs",
    "sourceCredit": "TikTok"
  },
  {
    "id": "3032e386-6ef6-876e-f6e9-0adf60566e29",
    "name": "Emerald City Soul Club",
    "slug": "emerald-city-soul-club",
    "city": "Seattle",
    "state": "WA",
    "neighborhood": "Various",
    "address": "Various Venues",
    "lat": 47.6062,
    "lng": -122.3321,
    "cuisine": "Dance Party",
    "cuisineTags": [
      "Dance Party"
    ],
    "vibeTags": [
      "fun",
      "dance"
    ],
    "occasionTags": [
      "bachelor"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Traveling funk/soul dance party \u2014 check schedule for next event",
    "sourceCredit": "Instagram"
  },
  {
    "id": "288dc904-011b-6489-e279-33098e77eff0",
    "name": "The Nook",
    "slug": "the-nook",
    "city": "Seattle",
    "state": "WA",
    "neighborhood": "Greenwood",
    "address": "8550 Greenwood Ave N",
    "lat": 47.6062,
    "lng": -122.3321,
    "cuisine": "Cocktail Bar",
    "cuisineTags": [
      "Cocktail Bar"
    ],
    "vibeTags": [
      "intimate",
      "cocktails"
    ],
    "occasionTags": [
      "bachelor"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Intimate craft cocktail bar to start the night classy",
    "sourceCredit": "Instagram"
  },
  {
    "id": "dcdedce0-a49b-1223-cfd8-d334c1577f83",
    "name": "Lucky Strike",
    "slug": "lucky-strike",
    "city": "Seattle",
    "state": "WA",
    "neighborhood": "Bellevue",
    "address": "700 Bellevue Way NE",
    "lat": 47.6062,
    "lng": -122.3321,
    "cuisine": "Bowling / Lounge",
    "cuisineTags": [
      "Bowling",
      "Lounge"
    ],
    "vibeTags": [
      "upscale",
      "dj",
      "late-night"
    ],
    "occasionTags": [
      "bachelor"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Upscale bowling with full bar, billiards, and late-night DJ",
    "sourceCredit": "TikTok"
  },
  {
    "id": "bda631d4-c5ab-2adb-87a3-a2e585923014",
    "name": "TopGolf",
    "slug": "topgolf",
    "city": "Seattle",
    "state": "WA",
    "neighborhood": "Renton",
    "address": "18 Park Center Way",
    "lat": 47.6062,
    "lng": -122.3321,
    "cuisine": "Golf / Entertainment",
    "cuisineTags": [
      "Golf",
      "Entertainment"
    ],
    "vibeTags": [],
    "occasionTags": [
      "bachelor"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Multi-level driving range with bar, food, and competitive games",
    "sourceCredit": "Instagram"
  },
  {
    "id": "ba05c089-f4b2-8748-0ba3-1fab56908684",
    "name": "Gas Works Park",
    "slug": "gas-works-park",
    "city": "Seattle",
    "state": "WA",
    "neighborhood": "Wallingford",
    "address": "2101 N Northlake Way",
    "lat": 47.6062,
    "lng": -122.3321,
    "cuisine": "Park / Views",
    "cuisineTags": [
      "Park",
      "Views"
    ],
    "vibeTags": [
      "sunset",
      "iconic"
    ],
    "occasionTags": [
      "outdoor-adventure"
    ],
    "price": "Free",
    "priceLevel": 1,
    "vibeNotes": "Iconic hilltop with downtown skyline views; sunset picnics, kite flying",
    "sourceCredit": "TikTok"
  },
  {
    "id": "059fd0ec-5194-0f01-57ef-4cec2a6917c2",
    "name": "Alki Beach",
    "slug": "alki-beach",
    "city": "Seattle",
    "state": "WA",
    "neighborhood": "West Seattle",
    "address": "1702 Alki Ave SW",
    "lat": 47.6062,
    "lng": -122.3321,
    "cuisine": "Beach / Boardwalk",
    "cuisineTags": [
      "Beach",
      "Boardwalk"
    ],
    "vibeTags": [],
    "occasionTags": [
      "outdoor-adventure"
    ],
    "price": "Free",
    "priceLevel": 1,
    "vibeNotes": "Sandy beach with volleyball, fire pits, and downtown skyline across the water",
    "sourceCredit": "Instagram"
  },
  {
    "id": "6150d214-a6e6-ae51-11fd-72389177c79a",
    "name": "Ballard Locks",
    "slug": "ballard-locks",
    "city": "Seattle",
    "state": "WA",
    "neighborhood": "Ballard",
    "address": "3015 NW 54th St",
    "lat": 47.6062,
    "lng": -122.3321,
    "cuisine": "Park / Attraction",
    "cuisineTags": [
      "Park",
      "Attraction"
    ],
    "vibeTags": [],
    "occasionTags": [
      "outdoor-adventure"
    ],
    "price": "Free",
    "priceLevel": 1,
    "vibeNotes": "Watch boats pass through the locks; salmon ladder; botanical gardens",
    "sourceCredit": "TikTok"
  },
  {
    "id": "71bb00ef-8dd2-80ad-191a-6692630875ae",
    "name": "Pike Place Market",
    "slug": "pike-place-market",
    "city": "Seattle",
    "state": "WA",
    "neighborhood": "Downtown",
    "address": "85 Pike St",
    "lat": 47.6062,
    "lng": -122.3321,
    "cuisine": "Market / Food",
    "cuisineTags": [
      "Market",
      "Food"
    ],
    "vibeTags": [
      "iconic"
    ],
    "occasionTags": [
      "outdoor-adventure"
    ],
    "price": "$",
    "priceLevel": 1,
    "vibeNotes": "Iconic market with street performers, artisan stalls, and the original Starbucks",
    "sourceCredit": "Instagram"
  },
  {
    "id": "dbc0b9b1-f8b5-705d-45b9-9ed916ca5631",
    "name": "Unexpected Productions",
    "slug": "unexpected-productions",
    "city": "Seattle",
    "state": "WA",
    "neighborhood": "Pike Place",
    "address": "1428 Post Alley",
    "lat": 47.6062,
    "lng": -122.3321,
    "cuisine": "Improv Theater",
    "cuisineTags": [
      "Improv Theater"
    ],
    "vibeTags": [],
    "occasionTags": [
      "outdoor-adventure"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Drop-in improv comedy shows; interactive and hilarious group activity",
    "sourceCredit": "TikTok"
  },
  {
    "id": "e58fc179-1915-691c-de69-d0810c9d76f6",
    "name": "Kerry Park",
    "slug": "kerry-park",
    "city": "Seattle",
    "state": "WA",
    "neighborhood": "Queen Anne",
    "address": "211 W Highland Dr",
    "lat": 47.6062,
    "lng": -122.3321,
    "cuisine": "Park / Viewpoint",
    "cuisineTags": [
      "Park",
      "Viewpoint"
    ],
    "vibeTags": [
      "sunset"
    ],
    "occasionTags": [
      "outdoor-adventure"
    ],
    "price": "Free",
    "priceLevel": 1,
    "vibeNotes": "The classic Seattle skyline + Mt. Rainier photo spot; sunset mandatory",
    "sourceCredit": "Instagram"
  },
  {
    "id": "db5dbfd5-94b0-d831-7922-67fddc2184b2",
    "name": "Daphne",
    "slug": "daphne",
    "city": "Toronto",
    "state": "ON",
    "neighborhood": "Yorkville",
    "address": "108 Avenue Rd",
    "lat": 43.6532,
    "lng": -79.3832,
    "cuisine": "Mediterranean",
    "cuisineTags": [
      "Mediterranean"
    ],
    "vibeTags": [],
    "occasionTags": [
      "date-night"
    ],
    "price": "$$$$",
    "priceLevel": 4,
    "vibeNotes": "Stunning Yorkville Mediterranean; one of Toronto's most beautiful restaurants",
    "sourceCredit": "TikTok"
  },
  {
    "id": "4715be42-8043-7629-9496-4b4ca3a43365",
    "name": "La Plume",
    "slug": "la-plume",
    "city": "Toronto",
    "state": "ON",
    "neighborhood": "Ossington",
    "address": "73 Ossington Ave",
    "lat": 43.6532,
    "lng": -79.3832,
    "cuisine": "French / Wine Bar",
    "cuisineTags": [
      "French",
      "Wine Bar"
    ],
    "vibeTags": [
      "intimate",
      "wine"
    ],
    "occasionTags": [
      "date-night"
    ],
    "price": "$$$",
    "priceLevel": 3,
    "vibeNotes": "Intimate French wine bar with candlelit tables and excellent natural wines",
    "sourceCredit": "Instagram"
  },
  {
    "id": "1a71cc06-ee29-ac59-35c8-b0d52df669bc",
    "name": "Bonne Nuit",
    "slug": "bonne-nuit",
    "city": "Toronto",
    "state": "ON",
    "neighborhood": "Queen West",
    "address": "1058 Queen St W",
    "lat": 43.6532,
    "lng": -79.3832,
    "cuisine": "French / Cocktails",
    "cuisineTags": [
      "French",
      "Cocktails"
    ],
    "vibeTags": [
      "cocktails",
      "late-night"
    ],
    "occasionTags": [
      "date-night"
    ],
    "price": "$$$",
    "priceLevel": 3,
    "vibeNotes": "Late-night French bistro with moody lighting and craft cocktails",
    "sourceCredit": "TikTok"
  },
  {
    "id": "6528a898-7752-de6a-9a30-4c9e0d562f20",
    "name": "Soluna",
    "slug": "soluna",
    "city": "Toronto",
    "state": "ON",
    "neighborhood": "Kensington",
    "address": "23 Augusta Ave",
    "lat": 43.6532,
    "lng": -79.3832,
    "cuisine": "Latin / Rooftop",
    "cuisineTags": [
      "Latin",
      "Rooftop"
    ],
    "vibeTags": [
      "rooftop",
      "cocktails",
      "late-night"
    ],
    "occasionTags": [
      "date-night"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Rooftop cocktail bar with Latin-inspired small plates and city views",
    "sourceCredit": "Instagram"
  },
  {
    "id": "f58a5701-7c59-77e0-6011-5a0e9f0d7383",
    "name": "Grappa",
    "slug": "grappa",
    "city": "Toronto",
    "state": "ON",
    "neighborhood": "Entertainment District",
    "address": "797 College St",
    "lat": 43.6532,
    "lng": -79.3832,
    "cuisine": "Italian",
    "cuisineTags": [
      "Italian"
    ],
    "vibeTags": [
      "patio",
      "wine"
    ],
    "occasionTags": [
      "date-night"
    ],
    "price": "$$$",
    "priceLevel": 3,
    "vibeNotes": "Classic Italian with a gorgeous patio; pasta and wine done right",
    "sourceCredit": "TikTok"
  },
  {
    "id": "2231a30b-7979-a30e-22f0-076dc19d37cc",
    "name": "Cafe Renee",
    "slug": "cafe-renee",
    "city": "Toronto",
    "state": "ON",
    "neighborhood": "Financial District",
    "address": "100 Queen St W",
    "lat": 43.6532,
    "lng": -79.3832,
    "cuisine": "French Caf\u00e9 / Wine",
    "cuisineTags": [
      "French Caf\u00e9",
      "Wine"
    ],
    "vibeTags": [
      "hidden-gem",
      "wine"
    ],
    "occasionTags": [
      "date-night"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Underground French caf\u00e9 with wine and jazz; hidden date night gem",
    "sourceCredit": "Instagram"
  },
  {
    "id": "cdb92a17-8dbc-10f9-cf87-9f5234176ff3",
    "name": "DaNico",
    "slug": "danico",
    "city": "Toronto",
    "state": "ON",
    "neighborhood": "Little Italy",
    "address": "536 College St",
    "lat": 43.6532,
    "lng": -79.3832,
    "cuisine": "Italian",
    "cuisineTags": [
      "Italian"
    ],
    "vibeTags": [
      "wine"
    ],
    "occasionTags": [
      "date-night"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Old-school Little Italy romance with fresh pasta and house wine",
    "sourceCredit": "TikTok"
  },
  {
    "id": "4c200c45-c9e2-211e-a326-8115f5b994b0",
    "name": "TOKI Listening Bar",
    "slug": "toki-listening-bar",
    "city": "Toronto",
    "state": "ON",
    "neighborhood": "Chinatown",
    "address": "30 Grange Ave",
    "lat": 43.6532,
    "lng": -79.3832,
    "cuisine": "Japanese / Vinyl Bar",
    "cuisineTags": [
      "Japanese",
      "Vinyl Bar"
    ],
    "vibeTags": [
      "intimate",
      "cocktails"
    ],
    "occasionTags": [
      "date-night"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Hi-fi vinyl listening bar with Japanese cocktails; intimate and unique",
    "sourceCredit": "Instagram"
  },
  {
    "id": "026586d3-1fc0-851e-aba9-3d5212419c8d",
    "name": "Myth",
    "slug": "myth",
    "city": "Toronto",
    "state": "ON",
    "neighborhood": "Entertainment District",
    "address": "417 Danforth Ave",
    "lat": 43.6532,
    "lng": -79.3832,
    "cuisine": "Nightclub / Lounge",
    "cuisineTags": [
      "Nightclub",
      "Lounge"
    ],
    "vibeTags": [
      "dj"
    ],
    "occasionTags": [
      "group-night-out"
    ],
    "price": "$$$",
    "priceLevel": 3,
    "vibeNotes": "Multi-room nightclub with VIP service and rotating DJs",
    "sourceCredit": "TikTok"
  },
  {
    "id": "c424913c-4699-af7b-0b98-bad9f083796b",
    "name": "Baro",
    "slug": "baro",
    "city": "Toronto",
    "state": "ON",
    "neighborhood": "King West",
    "address": "485 King St W",
    "lat": 43.6532,
    "lng": -79.3832,
    "cuisine": "Latin / Nightclub",
    "cuisineTags": [
      "Latin",
      "Nightclub"
    ],
    "vibeTags": [
      "dance"
    ],
    "occasionTags": [
      "group-night-out"
    ],
    "price": "$$$",
    "priceLevel": 3,
    "vibeNotes": "Peruvian dinner service transforms into Latin dance club after 11pm",
    "sourceCredit": "Instagram"
  },
  {
    "id": "c8acacc2-a980-20cc-9ef4-711ce2e33dde",
    "name": "Maxime's",
    "slug": "maxime-s",
    "city": "Toronto",
    "state": "ON",
    "neighborhood": "King West",
    "address": "322 King St W",
    "lat": 43.6532,
    "lng": -79.3832,
    "cuisine": "French / Nightlife",
    "cuisineTags": [
      "French",
      "Nightlife"
    ],
    "vibeTags": [],
    "occasionTags": [
      "group-night-out"
    ],
    "price": "$$$",
    "priceLevel": 3,
    "vibeNotes": "Three-floor French brasserie that becomes a nightclub; velvet ropes",
    "sourceCredit": "TikTok"
  },
  {
    "id": "def27c8d-59c9-46bf-3a74-c305ea6fd596",
    "name": "Mademoiselle",
    "slug": "mademoiselle",
    "city": "Toronto",
    "state": "ON",
    "neighborhood": "Queen West",
    "address": "1095 Queen St W",
    "lat": 43.6532,
    "lng": -79.3832,
    "cuisine": "French / Lounge",
    "cuisineTags": [
      "French",
      "Lounge"
    ],
    "vibeTags": [
      "dj",
      "cocktails"
    ],
    "occasionTags": [
      "group-night-out"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Parisian-inspired cocktail lounge with vintage decor and DJ nights",
    "sourceCredit": "Instagram"
  },
  {
    "id": "c9e45315-113f-d590-c6f8-651a20cb700f",
    "name": "NOYAA",
    "slug": "noyaa",
    "city": "Toronto",
    "state": "ON",
    "neighborhood": "King West",
    "address": "352 King St W",
    "lat": 43.6532,
    "lng": -79.3832,
    "cuisine": "Pan-Asian / Nightlife",
    "cuisineTags": [
      "Pan-Asian",
      "Nightlife"
    ],
    "vibeTags": [
      "late-night"
    ],
    "occasionTags": [
      "group-night-out"
    ],
    "price": "$$$",
    "priceLevel": 3,
    "vibeNotes": "Asian-fusion restaurant that transitions to late-night clubbing",
    "sourceCredit": "TikTok"
  },
  {
    "id": "8511ae5b-ee5b-29ef-f8ed-51dfd8e656e4",
    "name": "Aisle 3",
    "slug": "aisle-3",
    "city": "Toronto",
    "state": "ON",
    "neighborhood": "Junction",
    "address": "3075 Dundas St W",
    "lat": 43.6532,
    "lng": -79.3832,
    "cuisine": "Music Venue / Bar",
    "cuisineTags": [
      "Music Venue",
      "Bar"
    ],
    "vibeTags": [
      "intimate",
      "live-music",
      "cocktails"
    ],
    "occasionTags": [
      "group-night-out"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Intimate live music venue with excellent sound and craft cocktails",
    "sourceCredit": "Instagram"
  },
  {
    "id": "3f15c1d2-a2f1-5cb0-438a-a455e30928fe",
    "name": "Frenchy Bar",
    "slug": "frenchy-bar",
    "city": "Toronto",
    "state": "ON",
    "neighborhood": "Little Italy",
    "address": "557 College St",
    "lat": 43.6532,
    "lng": -79.3832,
    "cuisine": "French / Cocktails",
    "cuisineTags": [
      "French",
      "Cocktails"
    ],
    "vibeTags": [
      "cocktails"
    ],
    "occasionTags": [
      "group-night-out"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "French cocktail bar with absinthe service and a lively atmosphere",
    "sourceCredit": "TikTok"
  },
  {
    "id": "7ce400a2-0c14-1c44-5efb-bb274104c049",
    "name": "Civil Liberties",
    "slug": "civil-liberties",
    "city": "Toronto",
    "state": "ON",
    "neighborhood": "Bloordale",
    "address": "878 Bloor St W",
    "lat": 43.6532,
    "lng": -79.3832,
    "cuisine": "Cocktail Bar",
    "cuisineTags": [
      "Cocktail Bar"
    ],
    "vibeTags": [
      "cocktails"
    ],
    "occasionTags": [
      "group-night-out"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "No-menu craft cocktail bar; tell them your mood, they build your drink",
    "sourceCredit": "Instagram"
  },
  {
    "id": "1eff91db-2c4b-f997-6522-45fa4df4860c",
    "name": "Alo",
    "slug": "alo",
    "city": "Toronto",
    "state": "ON",
    "neighborhood": "Spadina",
    "address": "163 Spadina Ave",
    "lat": 43.6532,
    "lng": -79.3832,
    "cuisine": "French Tasting Menu",
    "cuisineTags": [
      "French Tasting Menu"
    ],
    "vibeTags": [],
    "occasionTags": [
      "in-laws"
    ],
    "price": "$$$$",
    "priceLevel": 4,
    "vibeNotes": "Canada's #1 restaurant; French tasting menu above a taco joint; jacket required",
    "sourceCredit": "TikTok"
  },
  {
    "id": "69fb8571-470e-a76f-de60-9d3703719b3a",
    "name": "Canoe",
    "slug": "canoe",
    "city": "Toronto",
    "state": "ON",
    "neighborhood": "Financial District",
    "address": "66 Wellington St W",
    "lat": 43.6532,
    "lng": -79.3832,
    "cuisine": "Canadian Fine Dining",
    "cuisineTags": [
      "Canadian Fine Dining"
    ],
    "vibeTags": [],
    "occasionTags": [
      "in-laws"
    ],
    "price": "$$$$",
    "priceLevel": 4,
    "vibeNotes": "54th-floor Canadian cuisine with panoramic TD Tower views",
    "sourceCredit": "Instagram"
  },
  {
    "id": "175fa34a-8a34-cb1f-be6f-2e97f3fd31cb",
    "name": "Scaramouche",
    "slug": "scaramouche",
    "city": "Toronto",
    "state": "ON",
    "neighborhood": "Midtown",
    "address": "1 Benvenuto Pl",
    "lat": 43.6532,
    "lng": -79.3832,
    "cuisine": "French-Continental",
    "cuisineTags": [
      "French-Continental"
    ],
    "vibeTags": [],
    "occasionTags": [
      "in-laws"
    ],
    "price": "$$$$",
    "priceLevel": 4,
    "vibeNotes": "Legendary since 1980; incredible skyline views and refined Continental fare",
    "sourceCredit": "TikTok"
  },
  {
    "id": "0231dde6-e83b-2a04-c33b-9c1230218ba5",
    "name": "George",
    "slug": "george",
    "city": "Toronto",
    "state": "ON",
    "neighborhood": "Queen East",
    "address": "111 Queen St E",
    "lat": 43.6532,
    "lng": -79.3832,
    "cuisine": "French Contemporary",
    "cuisineTags": [
      "French Contemporary"
    ],
    "vibeTags": [
      "intimate"
    ],
    "occasionTags": [
      "in-laws"
    ],
    "price": "$$$$",
    "priceLevel": 4,
    "vibeNotes": "Intimate contemporary French in a heritage Victorian space",
    "sourceCredit": "Instagram"
  },
  {
    "id": "2e885453-9758-5653-a7bf-197483fcb5fd",
    "name": "Harbour Sixty",
    "slug": "harbour-sixty",
    "city": "Toronto",
    "state": "ON",
    "neighborhood": "Harbourfront",
    "address": "60 Harbour St",
    "lat": 43.6532,
    "lng": -79.3832,
    "cuisine": "Steakhouse",
    "cuisineTags": [
      "Steakhouse"
    ],
    "vibeTags": [],
    "occasionTags": [
      "in-laws"
    ],
    "price": "$$$$",
    "priceLevel": 4,
    "vibeNotes": "Grand marble-clad steakhouse with dry-aged cuts and towering ceilings",
    "sourceCredit": "TikTok"
  },
  {
    "id": "3eaf718b-2149-bbc3-7334-a1bc1c24bc9d",
    "name": "Edulis",
    "slug": "edulis",
    "city": "Toronto",
    "state": "ON",
    "neighborhood": "Dundas West",
    "address": "169 Niagara St",
    "lat": 43.6532,
    "lng": -79.3832,
    "cuisine": "Spanish-Portuguese",
    "cuisineTags": [
      "Spanish-Portuguese"
    ],
    "vibeTags": [
      "intimate"
    ],
    "occasionTags": [
      "in-laws"
    ],
    "price": "$$$$",
    "priceLevel": 4,
    "vibeNotes": "Intimate 30-seat BYOB fine dining; seasonal tasting menus",
    "sourceCredit": "Instagram"
  },
  {
    "id": "765bf387-d4a7-147f-6d05-dd4c313582a4",
    "name": "The Chase",
    "slug": "the-chase",
    "city": "Toronto",
    "state": "ON",
    "neighborhood": "Financial District",
    "address": "10 Temperance St",
    "lat": 43.6532,
    "lng": -79.3832,
    "cuisine": "Seafood / Rooftop",
    "cuisineTags": [
      "Seafood",
      "Rooftop"
    ],
    "vibeTags": [
      "rooftop",
      "iconic"
    ],
    "occasionTags": [
      "in-laws"
    ],
    "price": "$$$$",
    "priceLevel": 4,
    "vibeNotes": "Rooftop fine dining with a retractable roof; fish tower is iconic",
    "sourceCredit": "TikTok"
  },
  {
    "id": "d77fa642-3a7a-3a1c-434c-1375a8ea5ffc",
    "name": "Harlem Restaurant",
    "slug": "harlem-restaurant",
    "city": "Toronto",
    "state": "ON",
    "neighborhood": "Parkdale",
    "address": "67 Richmond St E",
    "lat": 43.6532,
    "lng": -79.3832,
    "cuisine": "Southern / Cocktails",
    "cuisineTags": [
      "Southern",
      "Cocktails"
    ],
    "vibeTags": [
      "cocktails"
    ],
    "occasionTags": [
      "girls-night"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Black-owned Southern comfort food with creative cocktails and good vibes",
    "sourceCredit": "TikTok"
  },
  {
    "id": "dbe45c44-1fa0-f01d-71c5-e7e47b583164",
    "name": "WLW y Punto",
    "slug": "wlw-y-punto",
    "city": "Toronto",
    "state": "ON",
    "neighborhood": "Kensington",
    "address": "78 Kensington Ave",
    "lat": 43.6532,
    "lng": -79.3832,
    "cuisine": "Latin / Wine Bar",
    "cuisineTags": [
      "Latin",
      "Wine Bar"
    ],
    "vibeTags": [
      "cozy",
      "wine"
    ],
    "occasionTags": [
      "girls-night"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Cozy Latin wine bar with tapas and a warm, inviting atmosphere",
    "sourceCredit": "Instagram"
  },
  {
    "id": "a8717d6d-3a67-2f80-c9ea-e120d09b2773",
    "name": "Little Baba",
    "slug": "little-baba",
    "city": "Toronto",
    "state": "ON",
    "neighborhood": "Chinatown",
    "address": "216 Spadina Ave",
    "lat": 43.6532,
    "lng": -79.3832,
    "cuisine": "Middle Eastern / Wine",
    "cuisineTags": [
      "Middle Eastern",
      "Wine"
    ],
    "vibeTags": [
      "intimate",
      "cocktails",
      "wine",
      "late-night"
    ],
    "occasionTags": [
      "girls-night"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Intimate Middle Eastern wine bar; mezze plates and rose petal cocktails",
    "sourceCredit": "TikTok"
  },
  {
    "id": "029f29a6-a69b-fc8a-c1aa-da3ae6aca255",
    "name": "Gyopo",
    "slug": "gyopo",
    "city": "Toronto",
    "state": "ON",
    "neighborhood": "Koreatown",
    "address": "692 Bloor St W",
    "lat": 43.6532,
    "lng": -79.3832,
    "cuisine": "Korean / Bar",
    "cuisineTags": [
      "Korean",
      "Bar"
    ],
    "vibeTags": [
      "cocktails"
    ],
    "occasionTags": [
      "girls-night"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Modern Korean snack bar with soju cocktails and K-pop vibes",
    "sourceCredit": "Instagram"
  },
  {
    "id": "9415d2ae-b706-c6b0-a0f0-941a12e7414f",
    "name": "MSSM",
    "slug": "mssm",
    "city": "Toronto",
    "state": "ON",
    "neighborhood": "Queen West",
    "address": "152 Augusta Ave",
    "lat": 43.6532,
    "lng": -79.3832,
    "cuisine": "Cocktail Bar",
    "cuisineTags": [
      "Cocktail Bar"
    ],
    "vibeTags": [
      "cocktails"
    ],
    "occasionTags": [
      "girls-night"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Moody cocktail bar in Kensington Market with creative seasonal drinks",
    "sourceCredit": "TikTok"
  },
  {
    "id": "9433a144-b26b-4d8c-50a0-a7d720487a7d",
    "name": "Ricky + Olivia",
    "slug": "ricky-olivia",
    "city": "Toronto",
    "state": "ON",
    "neighborhood": "King West",
    "address": "532 King St W",
    "lat": 43.6532,
    "lng": -79.3832,
    "cuisine": "Italian / Wine Bar",
    "cuisineTags": [
      "Italian",
      "Wine Bar"
    ],
    "vibeTags": [
      "cozy",
      "wine"
    ],
    "occasionTags": [
      "girls-night"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Cozy Italian wine bar with pasta flights and spritzes",
    "sourceCredit": "Instagram"
  },
  {
    "id": "b0e84a4b-80ea-86f5-ee29-e69d4b159b43",
    "name": "The Broadview Hotel",
    "slug": "the-broadview-hotel",
    "city": "Toronto",
    "state": "ON",
    "neighborhood": "Riverside",
    "address": "106 Broadview Ave",
    "lat": 43.6532,
    "lng": -79.3832,
    "cuisine": "Rooftop Bar",
    "cuisineTags": [
      "Rooftop Bar"
    ],
    "vibeTags": [
      "rooftop",
      "cocktails"
    ],
    "occasionTags": [
      "girls-night"
    ],
    "price": "$$$",
    "priceLevel": 3,
    "vibeNotes": "Stunning rooftop bar with East End skyline views and craft cocktails",
    "sourceCredit": "TikTok"
  },
  {
    "id": "c4ce81ec-e042-8da3-ff69-23346c468437",
    "name": "Drake Hotel",
    "slug": "drake-hotel",
    "city": "Toronto",
    "state": "ON",
    "neighborhood": "Queen West",
    "address": "1150 Queen St W",
    "lat": 43.6532,
    "lng": -79.3832,
    "cuisine": "Hotel Bar / Events",
    "cuisineTags": [
      "Hotel Bar",
      "Events"
    ],
    "vibeTags": [
      "live-music"
    ],
    "occasionTags": [
      "girls-night"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Queen West icon with rotating art, live music, and a basement lounge",
    "sourceCredit": "Instagram"
  },
  {
    "id": "0a25daa0-b289-420d-55a9-67fb7d285e5e",
    "name": "The Rec Room",
    "slug": "the-rec-room",
    "city": "Toronto",
    "state": "ON",
    "neighborhood": "Entertainment District",
    "address": "255 Bremner Blvd",
    "lat": 43.6532,
    "lng": -79.3832,
    "cuisine": "Gaming / Bar",
    "cuisineTags": [
      "Gaming",
      "Bar"
    ],
    "vibeTags": [],
    "occasionTags": [
      "guys-night"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Massive arcade, VR, bowling, and full bar; competitive group vibes",
    "sourceCredit": "TikTok"
  },
  {
    "id": "42351278-4b34-7031-ab59-3b1c5a8d900a",
    "name": "BATL Axe Throwing",
    "slug": "batl-axe-throwing",
    "city": "Toronto",
    "state": "ON",
    "neighborhood": "Various",
    "address": "Multiple Locations",
    "lat": 43.6532,
    "lng": -79.3832,
    "cuisine": "Axe Throwing / BYOB",
    "cuisineTags": [
      "Axe Throwing",
      "BYOB"
    ],
    "vibeTags": [],
    "occasionTags": [
      "guys-night"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Canada's original axe throwing; BYOB and competitive league formats",
    "sourceCredit": "Instagram"
  },
  {
    "id": "8f8b0fb9-6680-f328-e9ac-754e4be3f085",
    "name": "Steam Whistle Brewing",
    "slug": "steam-whistle-brewing",
    "city": "Toronto",
    "state": "ON",
    "neighborhood": "Roundhouse",
    "address": "255 Bremner Blvd",
    "lat": 43.6532,
    "lng": -79.3832,
    "cuisine": "Brewery / Tours",
    "cuisineTags": [
      "Brewery",
      "Tours"
    ],
    "vibeTags": [
      "iconic"
    ],
    "occasionTags": [
      "guys-night"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Iconic roundhouse brewery with tours, tastings, and a great taproom",
    "sourceCredit": "TikTok"
  },
  {
    "id": "b3221495-6c7b-241f-0cbc-e232f55ce5cd",
    "name": "Bellwoods Brewery",
    "slug": "bellwoods-brewery",
    "city": "Toronto",
    "state": "ON",
    "neighborhood": "Trinity Bellwoods",
    "address": "124 Ossington Ave",
    "lat": 43.6532,
    "lng": -79.3832,
    "cuisine": "Craft Brewery",
    "cuisineTags": [
      "Craft Brewery"
    ],
    "vibeTags": [
      "patio"
    ],
    "occasionTags": [
      "guys-night"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Toronto's cult brewery with hazy IPAs and a packed patio",
    "sourceCredit": "Instagram"
  },
  {
    "id": "a75fc241-7bc0-c369-6077-d0897372b056",
    "name": "Real Sports Bar",
    "slug": "real-sports-bar",
    "city": "Toronto",
    "state": "ON",
    "neighborhood": "Scotiabank Arena",
    "address": "15 York St",
    "lat": 43.6532,
    "lng": -79.3832,
    "cuisine": "Sports Bar",
    "cuisineTags": [
      "Sports Bar"
    ],
    "vibeTags": [],
    "occasionTags": [
      "guys-night"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "39-foot HD screen, 200+ TVs, and a massive menu; game night heaven",
    "sourceCredit": "TikTok"
  },
  {
    "id": "2229a2d7-c8f2-e798-ffd0-ea6dc0b63ea7",
    "name": "RendezViews",
    "slug": "rendezviews",
    "city": "Toronto",
    "state": "ON",
    "neighborhood": "Entertainment District",
    "address": "33 Dundas St W",
    "lat": 43.6532,
    "lng": -79.3832,
    "cuisine": "Rooftop / Sports",
    "cuisineTags": [
      "Rooftop",
      "Sports"
    ],
    "vibeTags": [
      "rooftop",
      "patio"
    ],
    "occasionTags": [
      "guys-night"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Rooftop patio with big screens, drinks, and downtown views",
    "sourceCredit": "Instagram"
  },
  {
    "id": "bce760ba-fd5c-14d6-c2b3-6fccea2d7f11",
    "name": "Assembly Chef's Hall",
    "slug": "assembly-chef-s-hall",
    "city": "Toronto",
    "state": "ON",
    "neighborhood": "Financial District",
    "address": "111 Richmond St W",
    "lat": 43.6532,
    "lng": -79.3832,
    "cuisine": "Food Hall",
    "cuisineTags": [
      "Food Hall"
    ],
    "vibeTags": [],
    "occasionTags": [
      "guys-night"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Chef-driven food hall with 18+ vendors; eat at multiple spots in one night",
    "sourceCredit": "TikTok"
  },
  {
    "id": "63fcdbe7-5143-938e-40c7-e8cf7531d649",
    "name": "Rebel",
    "slug": "rebel",
    "city": "Toronto",
    "state": "ON",
    "neighborhood": "Port Lands",
    "address": "11 Polson St",
    "lat": 43.6532,
    "lng": -79.3832,
    "cuisine": "Nightclub",
    "cuisineTags": [
      "Nightclub"
    ],
    "vibeTags": [
      "waterfront",
      "dj"
    ],
    "occasionTags": [
      "bachelor"
    ],
    "price": "$$$",
    "priceLevel": 3,
    "vibeNotes": "Toronto's mega-club; 2,500 capacity, world-class DJs, waterfront",
    "sourceCredit": "TikTok"
  },
  {
    "id": "da98672d-26f6-1dd6-80d9-f19e30d4f810",
    "name": "King West Bar Crawl",
    "slug": "king-west-bar-crawl",
    "city": "Toronto",
    "state": "ON",
    "neighborhood": "King West",
    "address": "King St W",
    "lat": 43.6532,
    "lng": -79.3832,
    "cuisine": "Bar District",
    "cuisineTags": [
      "Bar District"
    ],
    "vibeTags": [],
    "occasionTags": [
      "bachelor"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Toronto's party strip; dozens of bars and clubs in walking distance",
    "sourceCredit": "Instagram"
  },
  {
    "id": "72e6d047-a0b0-49f9-07e9-e5fee4b9f7df",
    "name": "Cabana Pool Bar",
    "slug": "cabana-pool-bar",
    "city": "Toronto",
    "state": "ON",
    "neighborhood": "Port Lands",
    "address": "11 Polson St",
    "lat": 43.6532,
    "lng": -79.3832,
    "cuisine": "Pool Party / Club",
    "cuisineTags": [
      "Pool Party",
      "Club"
    ],
    "vibeTags": [],
    "occasionTags": [
      "bachelor"
    ],
    "price": "$$$",
    "priceLevel": 3,
    "vibeNotes": "Massive poolside day party from June-Sept; the bachelor pregame",
    "sourceCredit": "TikTok"
  },
  {
    "id": "bf4724be-ec5d-f893-4f1f-ec8262adf882",
    "name": "EFS Social",
    "slug": "efs-social",
    "city": "Toronto",
    "state": "ON",
    "neighborhood": "King West",
    "address": "647 King St W",
    "lat": 43.6532,
    "lng": -79.3832,
    "cuisine": "Nightclub",
    "cuisineTags": [
      "Nightclub"
    ],
    "vibeTags": [
      "upscale"
    ],
    "occasionTags": [
      "bachelor"
    ],
    "price": "$$$",
    "priceLevel": 3,
    "vibeNotes": "Upscale nightclub with VIP bottle service and a glamorous crowd",
    "sourceCredit": "Instagram"
  },
  {
    "id": "315d4b1c-23be-c8a5-f721-fbb3649abfe3",
    "name": "Casa Loma Escape Room",
    "slug": "casa-loma-escape-room",
    "city": "Toronto",
    "state": "ON",
    "neighborhood": "Casa Loma",
    "address": "1 Austin Terrace",
    "lat": 43.6532,
    "lng": -79.3832,
    "cuisine": "Escape Room",
    "cuisineTags": [
      "Escape Room"
    ],
    "vibeTags": [],
    "occasionTags": [
      "bachelor"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Escape rooms inside a historic castle; unique group challenge",
    "sourceCredit": "TikTok"
  },
  {
    "id": "43002dbd-ec79-9169-57a0-58c790a4edf1",
    "name": "Toronto Islands",
    "slug": "toronto-islands",
    "city": "Toronto",
    "state": "ON",
    "neighborhood": "Harbourfront",
    "address": "Ferry Terminal",
    "lat": 43.6532,
    "lng": -79.3832,
    "cuisine": "Beach / Day Trip",
    "cuisineTags": [
      "Beach",
      "Day Trip"
    ],
    "vibeTags": [],
    "occasionTags": [
      "bachelor",
      "outdoor-adventure"
    ],
    "price": "$",
    "priceLevel": 1,
    "vibeNotes": "Ferry to Centre Island for beaches, bike rentals, and skyline views",
    "sourceCredit": "Instagram"
  },
  {
    "id": "599a1d45-2855-944a-90f4-a86ce475f189",
    "name": "Kensington Market",
    "slug": "kensington-market",
    "city": "Toronto",
    "state": "ON",
    "neighborhood": "Kensington",
    "address": "Kensington Ave area",
    "lat": 43.6532,
    "lng": -79.3832,
    "cuisine": "Market / Street Life",
    "cuisineTags": [
      "Market",
      "Street Life"
    ],
    "vibeTags": [],
    "occasionTags": [
      "outdoor-adventure"
    ],
    "price": "Free",
    "priceLevel": 1,
    "vibeNotes": "Vintage shops, street art, cafes, and multicultural food stalls",
    "sourceCredit": "TikTok"
  },
  {
    "id": "4f77bb10-435d-5652-7813-08f3c6278776",
    "name": "Distillery District",
    "slug": "distillery-district",
    "city": "Toronto",
    "state": "ON",
    "neighborhood": "East End",
    "address": "55 Mill St",
    "lat": 43.6532,
    "lng": -79.3832,
    "cuisine": "Historic / Shopping",
    "cuisineTags": [
      "Historic",
      "Shopping"
    ],
    "vibeTags": [],
    "occasionTags": [
      "outdoor-adventure"
    ],
    "price": "Free",
    "priceLevel": 1,
    "vibeNotes": "Cobblestone streets with galleries, restaurants, and artisan shops",
    "sourceCredit": "Instagram"
  },
  {
    "id": "73a8f20c-3de0-5328-6919-bae775fca894",
    "name": "St. Lawrence Market",
    "slug": "st-lawrence-market",
    "city": "Toronto",
    "state": "ON",
    "neighborhood": "Old Town",
    "address": "93 Front St E",
    "lat": 43.6532,
    "lng": -79.3832,
    "cuisine": "Food Market",
    "cuisineTags": [
      "Food Market"
    ],
    "vibeTags": [],
    "occasionTags": [
      "outdoor-adventure"
    ],
    "price": "$",
    "priceLevel": 1,
    "vibeNotes": "Historic market with peameal bacon sandwiches and artisan vendors",
    "sourceCredit": "Instagram"
  },
  {
    "id": "f2a5075d-f7fd-0235-e576-c6ef7c0934c8",
    "name": "Graffiti Alley",
    "slug": "graffiti-alley",
    "city": "Toronto",
    "state": "ON",
    "neighborhood": "Queen West",
    "address": "Rush Lane",
    "lat": 43.6532,
    "lng": -79.3832,
    "cuisine": "Street Art",
    "cuisineTags": [
      "Street Art"
    ],
    "vibeTags": [
      "instagrammable"
    ],
    "occasionTags": [
      "outdoor-adventure"
    ],
    "price": "Free",
    "priceLevel": 1,
    "vibeNotes": "Colorful graffiti corridor in Queen West; Instagram gold",
    "sourceCredit": "TikTok"
  },
  {
    "id": "27c6b1e3-7ca7-f053-8e00-f313a67104d1",
    "name": "High Park",
    "slug": "high-park",
    "city": "Toronto",
    "state": "ON",
    "neighborhood": "High Park",
    "address": "1873 Bloor St W",
    "lat": 43.6532,
    "lng": -79.3832,
    "cuisine": "Park / Zoo",
    "cuisineTags": [
      "Park",
      "Zoo"
    ],
    "vibeTags": [],
    "occasionTags": [
      "outdoor-adventure"
    ],
    "price": "Free",
    "priceLevel": 1,
    "vibeNotes": "400-acre park with cherry blossoms (spring), zoo, trails, and picnic spots",
    "sourceCredit": "Instagram"
  },
  {
    "id": "a9adb54b-b5ad-ddc3-97c1-c372b2ebe143",
    "name": "Josephine",
    "slug": "josephine",
    "city": "Virginia",
    "state": "VA",
    "neighborhood": "Old Town Alexandria",
    "address": "1500 King St",
    "lat": 38.8462,
    "lng": -77.3064,
    "cuisine": "French Bistro",
    "cuisineTags": [
      "French Bistro"
    ],
    "vibeTags": [
      "romantic"
    ],
    "occasionTags": [
      "date-night"
    ],
    "price": "$$$$",
    "priceLevel": 4,
    "vibeNotes": "Romantic French bistro; white tablecloths; Alexandria gem",
    "sourceCredit": "TikTok @dmvfoodie"
  },
  {
    "id": "3fafdc40-ef40-19ed-96d8-7d0dd149dfed",
    "name": "Lena's Loft",
    "slug": "lena-s-loft",
    "city": "Virginia",
    "state": "VA",
    "neighborhood": "Old Town Alexandria",
    "address": "116 S Alfred St",
    "lat": 38.8462,
    "lng": -77.3064,
    "cuisine": "Cuban",
    "cuisineTags": [
      "Cuban"
    ],
    "vibeTags": [
      "intimate",
      "rooftop",
      "viral",
      "cocktails"
    ],
    "occasionTags": [
      "date-night",
      "girls-night"
    ],
    "price": "$$$",
    "priceLevel": 3,
    "vibeNotes": "Cuban-inspired; rooftop; 6.6K TikTok likes; intimate vibe",
    "sourceCredit": "TikTok @marissadaily_"
  },
  {
    "id": "3adb1ead-6484-b02a-85e2-ed89cb189453",
    "name": "Inn at Little Washington",
    "slug": "inn-at-little-washington",
    "city": "Virginia",
    "state": "VA",
    "neighborhood": "Washington VA",
    "address": "309 Middle St",
    "lat": 38.8462,
    "lng": -77.3064,
    "cuisine": "French / Fine Dining",
    "cuisineTags": [
      "French",
      "Fine Dining"
    ],
    "vibeTags": [
      "michelin"
    ],
    "occasionTags": [
      "date-night",
      "family"
    ],
    "price": "$$$$",
    "priceLevel": 4,
    "vibeNotes": "3 Michelin stars; bucket-list; Patrick O'Connell masterpiece",
    "sourceCredit": "Michelin Guide"
  },
  {
    "id": "2f04b4a7-c744-a753-2667-0e15a98a3b3f",
    "name": "Vermilion",
    "slug": "vermilion",
    "city": "Virginia",
    "state": "VA",
    "neighborhood": "Old Town Alexandria",
    "address": "1120 King St",
    "lat": 38.8462,
    "lng": -77.3064,
    "cuisine": "New American",
    "cuisineTags": [
      "New American"
    ],
    "vibeTags": [],
    "occasionTags": [
      "date-night"
    ],
    "price": "$$$$",
    "priceLevel": 4,
    "vibeNotes": "Top 50 restaurant lists; seasonal tasting; BYOB Mondays",
    "sourceCredit": "TikTok @dmvfoodie"
  },
  {
    "id": "87d29e6f-2b3a-1989-b12a-4eb25672ea58",
    "name": "Ada's on the River",
    "slug": "ada-s-on-the-river",
    "city": "Virginia",
    "state": "VA",
    "neighborhood": "Old Town Alexandria",
    "address": "3 Pioneer Mill Way",
    "lat": 38.8462,
    "lng": -77.3064,
    "cuisine": "Mediterranean",
    "cuisineTags": [
      "Mediterranean"
    ],
    "vibeTags": [
      "waterfront",
      "wine",
      "sunset"
    ],
    "occasionTags": [
      "date-night",
      "girls-night"
    ],
    "price": "$$$$",
    "priceLevel": 4,
    "vibeNotes": "Potomac waterfront; stunning views; ideal anniversary spot",
    "sourceCredit": "Eater DC"
  },
  {
    "id": "d26b4905-fa26-c90f-4477-c2a87312b398",
    "name": "Osteria Marzano",
    "slug": "osteria-marzano",
    "city": "Virginia",
    "state": "VA",
    "neighborhood": "Falls Church",
    "address": "6361 Leesburg Pike",
    "lat": 38.8462,
    "lng": -77.3064,
    "cuisine": "Italian",
    "cuisineTags": [
      "Italian"
    ],
    "vibeTags": [
      "intimate",
      "hidden-gem"
    ],
    "occasionTags": [
      "date-night"
    ],
    "price": "$$$",
    "priceLevel": 3,
    "vibeNotes": "Italian hidden gem; handmade pasta; intimate Falls Church spot",
    "sourceCredit": "TikTok @dmvfoodie"
  },
  {
    "id": "f3098f53-b575-58bb-4938-1b7eb4360899",
    "name": "The Majestic",
    "slug": "the-majestic",
    "city": "Virginia",
    "state": "VA",
    "neighborhood": "Old Town Alexandria",
    "address": "911 King St",
    "lat": 38.8462,
    "lng": -77.3064,
    "cuisine": "New American",
    "cuisineTags": [
      "New American"
    ],
    "vibeTags": [
      "cocktails"
    ],
    "occasionTags": [
      "date-night"
    ],
    "price": "$$$",
    "priceLevel": 3,
    "vibeNotes": "Reimagined Art Deco; craft cocktails; date night staple",
    "sourceCredit": "TikTok @dmvfoodie"
  },
  {
    "id": "f05b3eee-df72-9ed7-5890-1b057060ab07",
    "name": "Barca",
    "slug": "barca",
    "city": "Virginia",
    "state": "VA",
    "neighborhood": "Old Town Alexandria",
    "address": "2 Pioneer Mill Way",
    "lat": 38.8462,
    "lng": -77.3064,
    "cuisine": "Spanish Tapas / Waterfront",
    "cuisineTags": [
      "Spanish Tapas",
      "Waterfront"
    ],
    "vibeTags": [
      "waterfront",
      "wine"
    ],
    "occasionTags": [
      "date-night",
      "girls-night"
    ],
    "price": "$$$",
    "priceLevel": 3,
    "vibeNotes": "Waterfront tapas; sangria pitchers; gorgeous terrace",
    "sourceCredit": "TikTok @dmvfoodie"
  },
  {
    "id": "f95e0d2b-fefe-0fff-f5fd-8c09ee8cb276",
    "name": "Don Tito",
    "slug": "don-tito",
    "city": "Virginia",
    "state": "VA",
    "neighborhood": "Clarendon",
    "address": "3165 Wilson Blvd",
    "lat": 38.8462,
    "lng": -77.3064,
    "cuisine": "Mexican / Party Bar",
    "cuisineTags": [
      "Mexican",
      "Party Bar"
    ],
    "vibeTags": [
      "dj",
      "late-night"
    ],
    "occasionTags": [
      "group-night-out",
      "guys-night",
      "bachelor"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Taco + tequila party; DJs; packed weekends; Arlington legend",
    "sourceCredit": "Washingtonian"
  },
  {
    "id": "e2efdac4-40e8-f670-a423-d3925217b07f",
    "name": "Clarendon Ballroom",
    "slug": "clarendon-ballroom",
    "city": "Virginia",
    "state": "VA",
    "neighborhood": "Clarendon",
    "address": "3185 Wilson Blvd",
    "lat": 38.8462,
    "lng": -77.3064,
    "cuisine": "Nightlife Venue",
    "cuisineTags": [
      "Nightlife Venue"
    ],
    "vibeTags": [
      "rooftop",
      "live-music",
      "dance",
      "late-night"
    ],
    "occasionTags": [
      "group-night-out",
      "bachelor"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Multi-level venue; live music; rooftop; group central",
    "sourceCredit": "Visit Arlington"
  },
  {
    "id": "149b3bbc-e679-945f-8316-7e31c8868a12",
    "name": "Spider Kelly's",
    "slug": "spider-kelly-s",
    "city": "Virginia",
    "state": "VA",
    "neighborhood": "Clarendon",
    "address": "3181 Wilson Blvd",
    "lat": 38.8462,
    "lng": -77.3064,
    "cuisine": "Bar / Club",
    "cuisineTags": [
      "Bar",
      "Club"
    ],
    "vibeTags": [
      "fun",
      "dance",
      "dj"
    ],
    "occasionTags": [
      "group-night-out",
      "bachelor"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Dance floor + bar; Clarendon nightlife anchor; casual fun",
    "sourceCredit": "Visit Arlington"
  },
  {
    "id": "846d6502-db03-2bc3-c833-0f8f3ee62b6b",
    "name": "Sisters Thai",
    "slug": "sisters-thai",
    "city": "Virginia",
    "state": "VA",
    "neighborhood": "Old Town Alexandria",
    "address": "402 S Saint Asaph St",
    "lat": 38.8462,
    "lng": -77.3064,
    "cuisine": "Thai",
    "cuisineTags": [
      "Thai"
    ],
    "vibeTags": [
      "upscale",
      "cocktails"
    ],
    "occasionTags": [
      "group-night-out"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Upscale Thai; beautiful interior; great for groups; craft cocktails",
    "sourceCredit": "TikTok @dmvfoodie"
  },
  {
    "id": "57107e68-c094-2abe-c781-7f4864e18514",
    "name": "Matt & Tony's",
    "slug": "matt-tony-s",
    "city": "Virginia",
    "state": "VA",
    "neighborhood": "Arlington",
    "address": "2920 Columbia Pike",
    "lat": 38.8462,
    "lng": -77.3064,
    "cuisine": "Italian-American",
    "cuisineTags": [
      "Italian-American"
    ],
    "vibeTags": [],
    "occasionTags": [
      "group-night-out"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Family-style Italian; red sauce classics; big portions",
    "sourceCredit": "TikTok @dmvfoodie"
  },
  {
    "id": "b6815114-49f5-0bd8-5851-2995ab91ae39",
    "name": "Perch Putt",
    "slug": "perch-putt",
    "city": "Virginia",
    "state": "VA",
    "neighborhood": "Capital One Center",
    "address": "4401 Fairfax Dr",
    "lat": 38.8462,
    "lng": -77.3064,
    "cuisine": "Mini Golf / Bar",
    "cuisineTags": [
      "Mini Golf",
      "Bar"
    ],
    "vibeTags": [
      "rooftop",
      "cocktails"
    ],
    "occasionTags": [
      "group-night-out"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Rooftop mini golf; cocktails; Capital One center views",
    "sourceCredit": "Washingtonian"
  },
  {
    "id": "77be1760-12ff-656b-8977-1b7a7656866c",
    "name": "The Wharf @ National Harbor",
    "slug": "the-wharf-national-harbor",
    "city": "Virginia",
    "state": "VA",
    "neighborhood": "National Harbor",
    "address": "165 Waterfront St",
    "lat": 38.8462,
    "lng": -77.3064,
    "cuisine": "Waterfront District",
    "cuisineTags": [
      "Waterfront District"
    ],
    "vibeTags": [
      "waterfront"
    ],
    "occasionTags": [
      "group-night-out"
    ],
    "price": "$$-$$$",
    "priceLevel": 4,
    "vibeNotes": "Restaurants + bars + Ferris wheel; group-friendly waterfront",
    "sourceCredit": "Visit National Harbor"
  },
  {
    "id": "ab644578-2a96-f472-0c64-3eb2c178a3fc",
    "name": "Barrel & Bushel",
    "slug": "barrel-bushel",
    "city": "Virginia",
    "state": "VA",
    "neighborhood": "Tysons",
    "address": "8901 International Dr",
    "lat": 38.8462,
    "lng": -77.3064,
    "cuisine": "Gastropub",
    "cuisineTags": [
      "Gastropub"
    ],
    "vibeTags": [],
    "occasionTags": [
      "group-night-out"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Hyatt hotel gastropub; bourbon flights; Tysons convenience",
    "sourceCredit": "Visit Fairfax"
  },
  {
    "id": "209e7422-1dca-cb4a-77d9-87f653cfe635",
    "name": "Landini Brothers",
    "slug": "landini-brothers",
    "city": "Virginia",
    "state": "VA",
    "neighborhood": "Old Town Alexandria",
    "address": "115 King St",
    "lat": 38.8462,
    "lng": -77.3064,
    "cuisine": "Italian",
    "cuisineTags": [
      "Italian"
    ],
    "vibeTags": [],
    "occasionTags": [
      "family"
    ],
    "price": "$$$",
    "priceLevel": 3,
    "vibeNotes": "40+ year Alexandria institution; Northern Italian; old-world charm",
    "sourceCredit": "Visit Alexandria"
  },
  {
    "id": "fe6ea4f8-b9c3-877c-5a67-ab81054beac9",
    "name": "Virtue Feed & Grain",
    "slug": "virtue-feed-grain",
    "city": "Virginia",
    "state": "VA",
    "neighborhood": "Old Town Alexandria",
    "address": "106 S Union St",
    "lat": 38.8462,
    "lng": -77.3064,
    "cuisine": "American / Waterfront",
    "cuisineTags": [
      "American",
      "Waterfront"
    ],
    "vibeTags": [
      "upscale",
      "waterfront"
    ],
    "occasionTags": [
      "family"
    ],
    "price": "$$$",
    "priceLevel": 3,
    "vibeNotes": "Historic warehouse; waterfront; upscale comfort food",
    "sourceCredit": "Eater DC"
  },
  {
    "id": "86f9e59a-0734-077c-77f0-8ec5f6c6dcdc",
    "name": "L'Auberge Chez Fran\u00e7ois",
    "slug": "l-auberge-chez-fran-ois",
    "city": "Virginia",
    "state": "VA",
    "neighborhood": "Great Falls",
    "address": "332 Springvale Rd",
    "lat": 38.8462,
    "lng": -77.3064,
    "cuisine": "French Country",
    "cuisineTags": [
      "French Country"
    ],
    "vibeTags": [],
    "occasionTags": [
      "family"
    ],
    "price": "$$$$",
    "priceLevel": 4,
    "vibeNotes": "French country inn; garden setting; prix fixe; generational favorite",
    "sourceCredit": "Washingtonian"
  },
  {
    "id": "10b9e83c-90b1-75ac-b403-9d22378dd644",
    "name": "Bastille",
    "slug": "bastille",
    "city": "Virginia",
    "state": "VA",
    "neighborhood": "Old Town Alexandria",
    "address": "606 N Fayette St",
    "lat": 38.8462,
    "lng": -77.3064,
    "cuisine": "French Brasserie",
    "cuisineTags": [
      "French Brasserie"
    ],
    "vibeTags": [
      "rooftop"
    ],
    "occasionTags": [
      "family"
    ],
    "price": "$$$",
    "priceLevel": 3,
    "vibeNotes": "Neighborhood French bistro; rooftop; approachable elegance",
    "sourceCredit": "Eater DC"
  },
  {
    "id": "7d590f65-e398-2a8a-aa85-b69a8984e11a",
    "name": "Nostos",
    "slug": "nostos",
    "city": "Virginia",
    "state": "VA",
    "neighborhood": "Tysons",
    "address": "8100 Boone Blvd",
    "lat": 38.8462,
    "lng": -77.3064,
    "cuisine": "Modern Greek",
    "cuisineTags": [
      "Modern Greek"
    ],
    "vibeTags": [],
    "occasionTags": [
      "family"
    ],
    "price": "$$$",
    "priceLevel": 3,
    "vibeNotes": "Refined Greek; beautiful mezze spreads; welcoming vibe",
    "sourceCredit": "Washingtonian"
  },
  {
    "id": "a93fc880-e092-2641-054f-1d763f4921ec",
    "name": "The Light Horse",
    "slug": "the-light-horse",
    "city": "Virginia",
    "state": "VA",
    "neighborhood": "Old Town Alexandria",
    "address": "715 King St",
    "lat": 38.8462,
    "lng": -77.3064,
    "cuisine": "American / Colonial",
    "cuisineTags": [
      "American",
      "Colonial"
    ],
    "vibeTags": [
      "cozy"
    ],
    "occasionTags": [
      "family"
    ],
    "price": "$$$",
    "priceLevel": 3,
    "vibeNotes": "Colonial tavern charm; seasonal American; cozy fireplace",
    "sourceCredit": "Visit Alexandria"
  },
  {
    "id": "8e54f901-c0db-02d8-a33a-4d5522207ec7",
    "name": "Mokomandy",
    "slug": "mokomandy",
    "city": "Virginia",
    "state": "VA",
    "neighborhood": "Falls Church",
    "address": "2929 Eskridge Rd",
    "lat": 38.8462,
    "lng": -77.3064,
    "cuisine": "Korean-Cajun Fusion",
    "cuisineTags": [
      "Korean-Cajun Fusion"
    ],
    "vibeTags": [
      "fun"
    ],
    "occasionTags": [
      "family"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Korean-Cajun mashup; unique and fun; adventurous parents love it",
    "sourceCredit": "Eater DC"
  },
  {
    "id": "33efb811-ae4c-fa21-d376-220264f7b8f6",
    "name": "Palette 22",
    "slug": "palette-22",
    "city": "Virginia",
    "state": "VA",
    "neighborhood": "Shirlington",
    "address": "4053 Campbell Ave",
    "lat": 38.8462,
    "lng": -77.3064,
    "cuisine": "Seasonal American",
    "cuisineTags": [
      "Seasonal American"
    ],
    "vibeTags": [
      "cocktails"
    ],
    "occasionTags": [
      "girls-night"
    ],
    "price": "$$$",
    "priceLevel": 3,
    "vibeNotes": "Art-inspired; seasonal cocktails; Shirlington village charm",
    "sourceCredit": "Washingtonian"
  },
  {
    "id": "35de7f92-7317-fcaa-10a4-60c6ba3c84ee",
    "name": "Urbano 116",
    "slug": "urbano-116",
    "city": "Virginia",
    "state": "VA",
    "neighborhood": "Old Town Alexandria",
    "address": "116 King St",
    "lat": 38.8462,
    "lng": -77.3064,
    "cuisine": "Mexican",
    "cuisineTags": [
      "Mexican"
    ],
    "vibeTags": [
      "upscale"
    ],
    "occasionTags": [
      "girls-night"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Upscale Mexican; margarita flights; colorful interior",
    "sourceCredit": "Visit Alexandria"
  },
  {
    "id": "cee2c84d-4ff4-e6f5-30c4-ac0620551c75",
    "name": "PX Speakeasy",
    "slug": "px-speakeasy",
    "city": "Virginia",
    "state": "VA",
    "neighborhood": "Old Town Alexandria",
    "address": "728 King St",
    "lat": 38.8462,
    "lng": -77.3064,
    "cuisine": "Speakeasy",
    "cuisineTags": [
      "Speakeasy"
    ],
    "vibeTags": [
      "intimate",
      "hidden-gem",
      "cocktails"
    ],
    "occasionTags": [
      "girls-night"
    ],
    "price": "$$$",
    "priceLevel": 3,
    "vibeNotes": "Hidden entrance; craft cocktails; intimate and chic",
    "sourceCredit": "Eater DC"
  },
  {
    "id": "b9648082-1f30-332f-ff74-7ce3089b111e",
    "name": "Whiskey & Oyster",
    "slug": "whiskey-oyster",
    "city": "Virginia",
    "state": "VA",
    "neighborhood": "Old Town Alexandria",
    "address": "301 John Carlyle St",
    "lat": 38.8462,
    "lng": -77.3064,
    "cuisine": "Seafood / Whiskey Bar",
    "cuisineTags": [
      "Seafood",
      "Whiskey Bar"
    ],
    "vibeTags": [
      "whiskey",
      "late-night"
    ],
    "occasionTags": [
      "girls-night"
    ],
    "price": "$$$",
    "priceLevel": 3,
    "vibeNotes": "Raw bar + whiskey list; lively energy; shareable plates",
    "sourceCredit": "Eater DC"
  },
  {
    "id": "baf86f73-8573-fbc3-c821-9e26f2db9dee",
    "name": "Sugar Shack Donuts",
    "slug": "sugar-shack-donuts",
    "city": "Virginia",
    "state": "VA",
    "neighborhood": "Multiple VA",
    "address": "Various",
    "lat": 38.8462,
    "lng": -77.3064,
    "cuisine": "Donuts / Dessert",
    "cuisineTags": [
      "Donuts",
      "Dessert"
    ],
    "vibeTags": [
      "late-night"
    ],
    "occasionTags": [
      "girls-night"
    ],
    "price": "$",
    "priceLevel": 1,
    "vibeNotes": "Late-night donut stop; craft flavors; perfect nightcap",
    "sourceCredit": "Instagram @sugarshackdonuts"
  },
  {
    "id": "b21c62cf-a0d5-506f-dac4-515ab24655b9",
    "name": "Ray's The Steaks",
    "slug": "ray-s-the-steaks",
    "city": "Virginia",
    "state": "VA",
    "neighborhood": "Courthouse",
    "address": "2300 Wilson Blvd",
    "lat": 38.8462,
    "lng": -77.3064,
    "cuisine": "Steakhouse",
    "cuisineTags": [
      "Steakhouse"
    ],
    "vibeTags": [],
    "occasionTags": [
      "guys-night"
    ],
    "price": "$$$$",
    "priceLevel": 4,
    "vibeNotes": "Arlington institution; BYOB-friendly; no-nonsense cuts",
    "sourceCredit": "Washingtonian"
  },
  {
    "id": "17397d6a-7ab8-8078-2830-01f4221ba691",
    "name": "Mad Fox Brewing",
    "slug": "mad-fox-brewing",
    "city": "Virginia",
    "state": "VA",
    "neighborhood": "Falls Church",
    "address": "444 W Broad St",
    "lat": 38.8462,
    "lng": -77.3064,
    "cuisine": "Brewpub",
    "cuisineTags": [
      "Brewpub"
    ],
    "vibeTags": [
      "chill"
    ],
    "occasionTags": [
      "guys-night"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Local craft brewery; pub food; pool tables; chill",
    "sourceCredit": "Visit Falls Church"
  },
  {
    "id": "034b397b-1332-2959-8cd4-3997f635b86c",
    "name": "Topgolf",
    "slug": "topgolf",
    "city": "Virginia",
    "state": "VA",
    "neighborhood": "Ashburn / Alexandria",
    "address": "Multiple",
    "lat": 38.8462,
    "lng": -77.3064,
    "cuisine": "Golf / Lounge",
    "cuisineTags": [
      "Golf",
      "Lounge"
    ],
    "vibeTags": [],
    "occasionTags": [
      "guys-night",
      "bachelor"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Multi-level driving range; full bar; sports on every screen",
    "sourceCredit": "Topgolf"
  },
  {
    "id": "c1afc845-8f9d-240b-b11d-13296ff88d64",
    "name": "Aslin Beer Company",
    "slug": "aslin-beer-company",
    "city": "Virginia",
    "state": "VA",
    "neighborhood": "Herndon / Alexandria",
    "address": "Multiple",
    "lat": 38.8462,
    "lng": -77.3064,
    "cuisine": "Craft Brewery",
    "cuisineTags": [
      "Craft Brewery"
    ],
    "vibeTags": [
      "chill"
    ],
    "occasionTags": [
      "guys-night"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Hazy IPA kings; taproom vibes; chill weekend hangs",
    "sourceCredit": "Eater DC"
  },
  {
    "id": "de7e8581-383f-9936-bdd4-66c2f62ef390",
    "name": "The Italian Store",
    "slug": "the-italian-store",
    "city": "Virginia",
    "state": "VA",
    "neighborhood": "Arlington",
    "address": "3123 Lee Hwy",
    "lat": 38.8462,
    "lng": -77.3064,
    "cuisine": "Italian Deli / Subs",
    "cuisineTags": [
      "Italian Deli",
      "Subs"
    ],
    "vibeTags": [],
    "occasionTags": [
      "guys-night"
    ],
    "price": "$",
    "priceLevel": 1,
    "vibeNotes": "Legendary Italian subs since 1980; grab-and-go perfection",
    "sourceCredit": "Washingtonian"
  },
  {
    "id": "0bc81980-3d5e-b8c1-8893-ee64ea173fea",
    "name": "Eddie V's",
    "slug": "eddie-v-s",
    "city": "Virginia",
    "state": "VA",
    "neighborhood": "Tysons",
    "address": "7900 Tysons One Pl",
    "lat": 38.8462,
    "lng": -77.3064,
    "cuisine": "Seafood / Prime Steaks",
    "cuisineTags": [
      "Seafood",
      "Prime Steaks"
    ],
    "vibeTags": [
      "cocktails"
    ],
    "occasionTags": [
      "guys-night"
    ],
    "price": "$$$$",
    "priceLevel": 4,
    "vibeNotes": "Live jazz; prime cuts; cocktail lounge; guys-night upgrade",
    "sourceCredit": "Washingtonian"
  },
  {
    "id": "d9452ad4-4356-51a1-3a0a-d97a81e90c2e",
    "name": "Crafthouse",
    "slug": "crafthouse",
    "city": "Virginia",
    "state": "VA",
    "neighborhood": "Clarendon",
    "address": "901 N Glebe Rd",
    "lat": 38.8462,
    "lng": -77.3064,
    "cuisine": "Gastropub",
    "cuisineTags": [
      "Gastropub"
    ],
    "vibeTags": [
      "cocktails"
    ],
    "occasionTags": [
      "guys-night"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Craft cocktails; elevated pub food; games; Clarendon anchor",
    "sourceCredit": "Eater DC"
  },
  {
    "id": "b4a4b6b6-b315-e32d-76c3-a6444e379d01",
    "name": "MGM National Harbor",
    "slug": "mgm-national-harbor",
    "city": "Virginia",
    "state": "VA",
    "neighborhood": "National Harbor",
    "address": "101 MGM National Ave",
    "lat": 38.8462,
    "lng": -77.3064,
    "cuisine": "Casino / Nightlife",
    "cuisineTags": [
      "Casino",
      "Nightlife"
    ],
    "vibeTags": [],
    "occasionTags": [
      "bachelor"
    ],
    "price": "$$$$",
    "priceLevel": 4,
    "vibeNotes": "Casino + clubs + restaurants + pool; full bachelor destination",
    "sourceCredit": "MGM National Harbor"
  },
  {
    "id": "ff714ffd-94c1-2948-0c60-46ec6fb6f1d8",
    "name": "Wilson Tavern",
    "slug": "wilson-tavern",
    "city": "Virginia",
    "state": "VA",
    "neighborhood": "Clarendon",
    "address": "2403 Wilson Blvd",
    "lat": 38.8462,
    "lng": -77.3064,
    "cuisine": "Bar / Rooftop",
    "cuisineTags": [
      "Bar",
      "Rooftop"
    ],
    "vibeTags": [
      "rooftop",
      "cocktails"
    ],
    "occasionTags": [
      "bachelor"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Rooftop bar; TV wall; cocktails; pre-game spot",
    "sourceCredit": "Eater DC"
  },
  {
    "id": "72b4ba94-e3a3-28e7-ad60-9f1cdb62f0b1",
    "name": "Bayou Bakery",
    "slug": "bayou-bakery",
    "city": "Virginia",
    "state": "VA",
    "neighborhood": "Courthouse",
    "address": "1515 N Courthouse Rd",
    "lat": 38.8462,
    "lng": -77.3064,
    "cuisine": "Cajun / Bar",
    "cuisineTags": [
      "Cajun",
      "Bar"
    ],
    "vibeTags": [],
    "occasionTags": [
      "bachelor"
    ],
    "price": "$",
    "priceLevel": 1,
    "vibeNotes": "Cajun comfort food; beignets + booze; casual start",
    "sourceCredit": "Eater DC"
  },
  {
    "id": "a90ae238-3045-1b76-d04d-56a79582b601",
    "name": "National Harbor Waterfront",
    "slug": "national-harbor-waterfront",
    "city": "Virginia",
    "state": "VA",
    "neighborhood": "National Harbor",
    "address": "Waterfront St",
    "lat": 38.8462,
    "lng": -77.3064,
    "cuisine": "Waterfront District",
    "cuisineTags": [
      "Waterfront District"
    ],
    "vibeTags": [
      "waterfront"
    ],
    "occasionTags": [
      "bachelor"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Bars + restaurants + Capital Wheel; group-ready waterfront",
    "sourceCredit": "Visit National Harbor"
  },
  {
    "id": "bd925ae4-908d-6ee9-662d-90a32694f2f4",
    "name": "Great Falls Park",
    "slug": "great-falls-park",
    "city": "Virginia",
    "state": "VA",
    "neighborhood": "Great Falls",
    "address": "9200 Old Dominion Dr",
    "lat": 38.8462,
    "lng": -77.3064,
    "cuisine": "National Park / Waterfalls",
    "cuisineTags": [
      "National Park",
      "Waterfalls"
    ],
    "vibeTags": [],
    "occasionTags": [
      "outdoor-adventure"
    ],
    "price": "$",
    "priceLevel": 1,
    "vibeNotes": "Potomac waterfalls; dramatic overlooks; easy hiking",
    "sourceCredit": "NPS"
  },
  {
    "id": "9fb94d93-5d1d-b36d-4ad1-393865a00866",
    "name": "Shenandoah National Park",
    "slug": "shenandoah-national-park",
    "city": "Virginia",
    "state": "VA",
    "neighborhood": "Blue Ridge",
    "address": "Skyline Drive",
    "lat": 38.8462,
    "lng": -77.3064,
    "cuisine": "National Park",
    "cuisineTags": [
      "National Park"
    ],
    "vibeTags": [],
    "occasionTags": [
      "outdoor-adventure"
    ],
    "price": "$",
    "priceLevel": 1,
    "vibeNotes": "Skyline Drive; 500+ miles of trails; stunning Blue Ridge views",
    "sourceCredit": "NPS"
  },
  {
    "id": "28d67b62-120a-004c-d8fa-1252ebac0346",
    "name": "Mount Vernon Trail",
    "slug": "mount-vernon-trail",
    "city": "Virginia",
    "state": "VA",
    "neighborhood": "Arlington-Alexandria",
    "address": "GW Memorial Pkwy",
    "lat": 38.8462,
    "lng": -77.3064,
    "cuisine": "Biking / Running Trail",
    "cuisineTags": [
      "Biking",
      "Running Trail"
    ],
    "vibeTags": [
      "waterfront"
    ],
    "occasionTags": [
      "outdoor-adventure"
    ],
    "price": "Free",
    "priceLevel": 1,
    "vibeNotes": "18 miles along Potomac; links DC to Mt Vernon; waterfront views",
    "sourceCredit": "NPS"
  },
  {
    "id": "b80e67d9-7bba-7b65-1202-46f17f6c04eb",
    "name": "Mosaic District",
    "slug": "mosaic-district",
    "city": "Virginia",
    "state": "VA",
    "neighborhood": "Merrifield",
    "address": "2910 District Ave",
    "lat": 38.8462,
    "lng": -77.3064,
    "cuisine": "Shopping / Dining",
    "cuisineTags": [
      "Shopping",
      "Dining"
    ],
    "vibeTags": [
      "outdoor"
    ],
    "occasionTags": [
      "outdoor-adventure"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Outdoor shopping; restaurants; Target + boutiques; farmers market",
    "sourceCredit": "Visit Fairfax"
  },
  {
    "id": "407d6348-d4f1-6242-15b5-e0d6a15d5515",
    "name": "The Burg Rooftop",
    "slug": "the-burg-rooftop",
    "city": "Virginia",
    "state": "VA",
    "neighborhood": "Leesburg",
    "address": "1 Loudoun St SE",
    "lat": 38.8462,
    "lng": -77.3064,
    "cuisine": "Rooftop / Bar",
    "cuisineTags": [
      "Rooftop",
      "Bar"
    ],
    "vibeTags": [
      "rooftop",
      "wine"
    ],
    "occasionTags": [
      "outdoor-adventure"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Rooftop views of wine country; craft drinks; small-town charm",
    "sourceCredit": "Visit Loudoun"
  },
  {
    "id": "477dfc6b-30c0-1a57-05fb-8280fc1bb488",
    "name": "Kayak on the Potomac",
    "slug": "kayak-on-the-potomac",
    "city": "Virginia",
    "state": "VA",
    "neighborhood": "Georgetown Waterfront",
    "address": "K St NW",
    "lat": 38.8462,
    "lng": -77.3064,
    "cuisine": "Water Sports",
    "cuisineTags": [
      "Water Sports"
    ],
    "vibeTags": [
      "sunset"
    ],
    "occasionTags": [
      "outdoor-adventure"
    ],
    "price": "$$",
    "priceLevel": 2,
    "vibeNotes": "Paddle past monuments; sunset kayak tours; group rentable",
    "sourceCredit": "Boating in DC"
  },
  {
    "id": "6eca6070-2c07-3695-1ae9-115a851d4e27",
    "name": "Old Town Alexandria Waterfront",
    "slug": "old-town-alexandria-waterfront",
    "city": "Virginia",
    "state": "VA",
    "neighborhood": "Old Town",
    "address": "King St to Waterfront",
    "lat": 38.8462,
    "lng": -77.3064,
    "cuisine": "Historic / Walk",
    "cuisineTags": [
      "Historic",
      "Walk"
    ],
    "vibeTags": [
      "waterfront"
    ],
    "occasionTags": [
      "outdoor-adventure"
    ],
    "price": "Free",
    "priceLevel": 1,
    "vibeNotes": "Cobblestone streets; boutiques; waterfront park; scenic stroll",
    "sourceCredit": "Visit Alexandria"
  },
  {
    "id": "dd912a76-40fd-9b1c-bf15-2bcf5ccb544f",
    "name": "Virginia Wine Country",
    "slug": "virginia-wine-country",
    "city": "Virginia",
    "state": "VA",
    "neighborhood": "Loudoun / Fauquier",
    "address": "Various",
    "lat": 38.8462,
    "lng": -77.3064,
    "cuisine": "Wineries / Tastings",
    "cuisineTags": [
      "Wineries",
      "Tastings"
    ],
    "vibeTags": [
      "wine"
    ],
    "occasionTags": [
      "outdoor-adventure"
    ],
    "price": "$$-$$$",
    "priceLevel": 4,
    "vibeNotes": "300+ wineries in VA; scenic drives; group-friendly tastings",
    "sourceCredit": "Virginia Wine"
  }
];
