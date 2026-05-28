// City Context Agent — structured "City Knowledge Pack" per launch city.
// Used to constrain venue selection and inject city-aware vocabulary into
// the multi-agent prompt. Edit/extend per city as we learn more.

export type Neighborhood = { name: string; vibe: string };

export type TravelLevel = "low" | "medium" | "high";

export type TravelIntel = {
  travelModes: {
    walkability: TravelLevel;
    uberAvailability: TravelLevel;
    publicTransitQuality: TravelLevel;
    parkingDifficulty: TravelLevel;
    evFriendly: TravelLevel;
  };
  travelRecommendations: {
    shortHops: string;
    crossNeighborhood: string;
    groups: string;
    waterfront?: string;
    lateNight: string;
  };
};

export type CityContext = {
  /** Canonical city name as stored in viral_venues.city */
  city: string;
  /** Slug used by clients */
  slug: string;
  /** Short label shown in UI */
  label: string;
  /** High-level environment tags (waterfront, casinos, etc.) */
  tags: string[];
  /** Allowed activity categories — model must prefer these */
  allowedActivities: string[];
  /** Things to avoid suggesting in this city (negative examples) */
  avoid?: string[];
  /** Named neighborhoods + their vibe — fed to Naming + Matching agents */
  neighborhoods: Neighborhood[];
  /** Environment features (harbor, mountains, beach, casinos, ...) */
  environmentFeatures: string[];
  /** Iconic, on-brand experiences this city is known for */
  signatureExperiences: string[];
  /** Plain-English price norms by tier */
  priceNorms: { $: string; $$: string; $$$: string };
  /** Transport / travel constraints */
  transport: { maxTravelMinutes: number; avoidCrossCity: boolean };
  /** Travel-mode intelligence (rideshare, walkability, transit, EV). Optional, defaulted by slug. */
  travel?: TravelIntel;
  /** Convenience: flat list of neighborhood names */
  signatureNeighborhoods?: string[];
};

// Per-slug defaults so we don't have to repeat travel intel inline for every city.
const TRAVEL_BY_SLUG: Record<string, TravelIntel> = {
  dc: {
    travelModes: {
      walkability: "high",
      uberAvailability: "high",
      publicTransitQuality: "high",
      parkingDifficulty: "high",
      evFriendly: "medium",
    },
    travelRecommendations: {
      shortHops: "walk",
      crossNeighborhood: "Metro or Uber",
      groups: "UberXL",
      waterfront: "walk",
      lateNight: "rideshare only",
    },
  },
  nyc: {
    travelModes: {
      walkability: "high",
      uberAvailability: "high",
      publicTransitQuality: "high",
      parkingDifficulty: "high",
      evFriendly: "medium",
    },
    travelRecommendations: {
      shortHops: "walk",
      crossNeighborhood: "Subway or Uber",
      groups: "UberXL or 2 Lyfts",
      lateNight: "rideshare or late-night subway",
    },
  },
  vegas: {
    travelModes: {
      walkability: "medium",
      uberAvailability: "high",
      publicTransitQuality: "low",
      parkingDifficulty: "medium",
      evFriendly: "medium",
    },
    travelRecommendations: {
      shortHops: "walk the Strip",
      crossNeighborhood: "Uber/Lyft",
      groups: "UberXL",
      lateNight: "rideshare only",
    },
  },
  miami: {
    travelModes: {
      walkability: "medium",
      uberAvailability: "high",
      publicTransitQuality: "low",
      parkingDifficulty: "high",
      evFriendly: "medium",
    },
    travelRecommendations: {
      shortHops: "walk",
      crossNeighborhood: "Uber/Lyft",
      groups: "UberXL",
      waterfront: "walk or scooter",
      lateNight: "rideshare only",
    },
  },
  seattle: {
    travelModes: {
      walkability: "high",
      uberAvailability: "high",
      publicTransitQuality: "medium",
      parkingDifficulty: "medium",
      evFriendly: "high",
    },
    travelRecommendations: {
      shortHops: "walk",
      crossNeighborhood: "Light Rail or Uber",
      groups: "UberXL",
      waterfront: "walk",
      lateNight: "rideshare only",
    },
  },
  chi: {
    travelModes: {
      walkability: "high",
      uberAvailability: "high",
      publicTransitQuality: "high",
      parkingDifficulty: "high",
      evFriendly: "medium",
    },
    travelRecommendations: {
      shortHops: "walk",
      crossNeighborhood: "L-train or Uber",
      groups: "UberXL",
      lateNight: "rideshare only",
    },
  },
  la: {
    travelModes: {
      walkability: "low",
      uberAvailability: "high",
      publicTransitQuality: "low",
      parkingDifficulty: "high",
      evFriendly: "high",
    },
    travelRecommendations: {
      shortHops: "Uber/Lyft",
      crossNeighborhood: "Uber/Lyft",
      groups: "UberXL",
      waterfront: "walk pier areas",
      lateNight: "rideshare only",
    },
  },
  sf: {
    travelModes: {
      walkability: "high",
      uberAvailability: "high",
      publicTransitQuality: "high",
      parkingDifficulty: "high",
      evFriendly: "high",
    },
    travelRecommendations: {
      shortHops: "walk",
      crossNeighborhood: "Muni/BART or Uber",
      groups: "UberXL",
      waterfront: "walk Embarcadero",
      lateNight: "rideshare only",
    },
  },
  hou: {
    travelModes: {
      walkability: "low",
      uberAvailability: "high",
      publicTransitQuality: "low",
      parkingDifficulty: "medium",
      evFriendly: "medium",
    },
    travelRecommendations: {
      shortHops: "Uber/Lyft",
      crossNeighborhood: "Uber/Lyft",
      groups: "UberXL",
      lateNight: "rideshare only",
    },
  },
  atl: {
    travelModes: {
      walkability: "medium",
      uberAvailability: "high",
      publicTransitQuality: "medium",
      parkingDifficulty: "medium",
      evFriendly: "medium",
    },
    travelRecommendations: {
      shortHops: "walk BeltLine",
      crossNeighborhood: "MARTA or Uber",
      groups: "UberXL",
      lateNight: "rideshare only",
    },
  },
};

const make = (
  c: Omit<CityContext, "signatureNeighborhoods"> & { signatureNeighborhoods?: string[] },
): CityContext => ({
  ...c,
  travel: c.travel ?? TRAVEL_BY_SLUG[c.slug],
  signatureNeighborhoods: c.signatureNeighborhoods ?? c.neighborhoods.map((n) => n.name),
});

export const CITIES: CityContext[] = [
  make({
    city: "Washington DC",
    slug: "dc",
    label: "Washington DC",
    tags: ["waterfront", "rooftops", "speakeasies", "live music", "monuments", "world-class museums", "cultural landmarks"],
    allowedActivities: [
      // Nightlife
      "rooftop bars",
      "wine bars",
      "small plates",
      "vinyl bars",
      "live jazz",
      "speakeasies",
      "waterfront dining",
      "comedy clubs",
      // Cultural (culture vibe, date nights, daytime)
      "Smithsonian museums",
      "National Mall walks",
      "monument tours",
      "art galleries",
      "Kennedy Center performances",
      "theater shows",
      "embassy row strolls",
      "historical site visits",
      // Maryland / Northern Virginia inclusions
      "Maryland crab houses",
      "Old Town Alexandria dining",
      "Clarendon bar strips",
      "National Harbor waterfront",
    ],
    neighborhoods: [
      { name: "Shaw", vibe: "cocktail bars, vinyl, late-night small plates" },
      { name: "U Street", vibe: "live music, jazz, dive-to-lounge mix" },
      { name: "The Wharf", vibe: "waterfront dining, rooftops, harbor views" },
      { name: "H Street", vibe: "indie bars, arcade, casual energy" },
      { name: "Georgetown", vibe: "upscale dining, riverfront stroll, boutique bars" },
      { name: "Adams Morgan", vibe: "eclectic bars, late-night eats, international" },
      { name: "Capitol Hill", vibe: "neighborhood pubs, Eastern Market, political energy" },
      { name: "National Mall", vibe: "monuments, Smithsonian museums, iconic vistas" },
      { name: "Dupont Circle", vibe: "wine bars, rooftops, LGBTQ+-friendly, cosmopolitan" },
      { name: "Old Town Alexandria", vibe: "cobblestone streets, waterfront dining, historic charm (VA)" },
      { name: "National Harbor", vibe: "MGM casino, waterfront, family and group dining (MD)" },
    ],
    environmentFeatures: [
      "waterfront", "monuments", "rooftops", "river",
      "National Mall", "Smithsonian campus", "embassy architecture",
      "cherry blossom corridors", "historic marble buildings",
    ],
    signatureExperiences: [
      "Wharf rooftop cocktails at sunset",
      "monument night walk (Lincoln, MLK, Jefferson, WWII)",
      "U Street jazz and vinyl",
      "Smithsonian museum afternoon into dinner",
      "Kennedy Center show + post-theater cocktail",
      "Georgetown waterfront stroll + wine bar",
      "Adams Morgan late-night dive-to-lounge crawl",
      "Old Town Alexandria cobblestone dinner (VA)",
      "National Harbor casino night with waterfront view (MD)",
    ],
    priceNorms: {
      $: "casual bars, pubs, food halls",
      $$: "cocktail bars, mid-range dining, museum cafés",
      $$$: "rooftops, fine dining, Kennedy Center pre-shows",
    },
    transport: { maxTravelMinutes: 18, avoidCrossCity: false },
  }),
  make({
    city: "Las Vegas",
    slug: "vegas",
    label: "Las Vegas",
    tags: ["casinos", "strip", "rooftops", "shows", "late-night dining"],
    allowedActivities: [
      "casinos",
      "shows",
      "rooftop lounges",
      "late-night dining",
      "pool clubs",
      "speakeasies",
      "Topgolf",
      "fountain shows",
    ],
    avoid: ["beach bars", "harbor cruises"],
    neighborhoods: [
      { name: "The Strip", vibe: "casinos, mega-clubs, fine dining" },
      { name: "Fremont East", vibe: "indie bars, neon, low-key cocktails" },
      { name: "Downtown", vibe: "old-school casinos, dive-cool" },
      { name: "Arts District", vibe: "speakeasies, breweries, locals" },
    ],
    environmentFeatures: ["casinos", "neon strip", "fountains", "desert sunsets"],
    signatureExperiences: [
      "Bellagio fountains",
      "blackjack flight",
      "Topgolf nightcap",
      "rooftop pool",
    ],
    priceNorms: {
      $: "casual eats, locals bars",
      $$: "casino bars, mid-range",
      $$$: "Strip clubs, fine dining",
    },
    transport: { maxTravelMinutes: 15, avoidCrossCity: false },
  }),
  make({
    city: "Miami",
    slug: "miami",
    label: "Miami",
    tags: [
      "beach clubs",
      "waterfront",
      "Latin music",
      "rooftops",
      "art deco",
      "yacht",
      "casino-capable",
      "Miami River",
    ],
    neighborhoods: [
      { name: "South Beach", vibe: "beach clubs, art deco, late-night" },
      { name: "Wynwood", vibe: "art walls, breweries, rooftop bars" },
      { name: "Brickell", vibe: "skyline lounges, upscale dining, cigar lounges" },
      { name: "Little Havana", vibe: "salsa, cigars, Cuban food" },
      { name: "Downtown Miami", vibe: "riverfront dining, clubs, skyline" },
      { name: "Miami River", vibe: "dockside restaurants, yacht docks, riverfront lounges" },
      { name: "Design District", vibe: "upscale dining, design-forward lounges" },
      { name: "Hollywood FL", vibe: "Seminole Hard Rock Casino, gaming, lounges (10–35m drive)" },
    ],
    allowedActivities: [
      "beach clubs",
      "waterfront dinners",
      "yacht charters",
      "Biscayne Bay cruises",
      "jet skis",
      "dockside dinners",
      "Latin music spots",
      "rooftop lounges",
      "Brickell cigar lounges",
      "whiskey bars",
      "steakhouse dinners",
      "casino night (Hard Rock Hollywood, Magic City, Miccosukee)",
      "late-night clubs",
      "late-night Cuban food",
      "salsa dancing",
      "adult entertainment (bachelor/wild vibes ONLY, optional)",
    ],
    environmentFeatures: ["beach", "ocean", "bay", "river", "waterfront", "skyline", "art deco"],
    signatureExperiences: [
      "Biscayne Bay yacht charter",
      "Miami River dockside dinner",
      "Brickell rooftop skyline",
      "Wynwood bar hop",
      "Hard Rock Hollywood casino night",
      "South Beach late-night",
      "jet skis on the bay",
    ],
    priceNorms: {
      $: "Cuban diners, taquerías",
      $$: "Wynwood bars, mid-range",
      $$$: "Brickell skyline, beach clubs",
    },
    transport: { maxTravelMinutes: 12, avoidCrossCity: true },
  }),
  make({
    city: "New York",
    slug: "nyc",
    label: "New York City",
    tags: ["theater district", "rooftops", "speakeasies", "live music", "late-night food"],
    neighborhoods: [
      { name: "West Village", vibe: "intimate cocktail bars, romantic" },
      { name: "LES", vibe: "speakeasies, dive-cool, late-night" },
      { name: "Williamsburg", vibe: "rooftops, indie venues, artsy" },
      { name: "Midtown", vibe: "Broadway, hotel bars, classic dinner" },
      { name: "Harlem", vibe: "live jazz, soul food, history" },
    ],
    allowedActivities: [
      "rooftop bars",
      "speakeasies",
      "broadway shows",
      "comedy clubs",
      "late-night dining",
      "jazz clubs",
      "wine bars",
    ],
    environmentFeatures: ["skyline", "rooftops", "subway-walkable", "bridges"],
    signatureExperiences: [
      "WTC rooftop view",
      "speakeasy hop in LES",
      "late slice + dive bar",
      "jazz in Harlem",
    ],
    priceNorms: {
      $: "slice shops, dive bars",
      $$: "cocktail bars, small plates",
      $$$: "rooftops, tasting menus",
    },
    transport: { maxTravelMinutes: 12, avoidCrossCity: true },
  }),
  make({
    city: "Seattle",
    slug: "seattle",
    label: "Seattle",
    tags: ["harbor", "piers", "indie music", "cozy bars", "coffee culture"],
    avoid: ["pool clubs", "beach bars"],
    neighborhoods: [
      { name: "Capitol Hill", vibe: "nightlife, LGBTQ+, bars" },
      { name: "Belltown", vibe: "lounges, rooftops, late-night" },
      { name: "Ballard", vibe: "breweries, seafood, Scandinavian" },
      { name: "Pioneer Square", vibe: "speakeasies, indie venues, brick" },
      { name: "Waterfront", vibe: "harbor, piers, seafood" },
    ],
    allowedActivities: [
      "harbor cruises",
      "piers",
      "cozy cocktail bars",
      "live indie music",
      "wine bars",
      "small plates",
      "seafood dining",
    ],
    environmentFeatures: ["harbor", "piers", "ferries", "mountain views"],
    signatureExperiences: [
      "sunset Pier 62 walk",
      "Pike Place evening",
      "harbor cruise",
      "Capitol Hill bar crawl",
    ],
    priceNorms: {
      $: "breweries, casual bars",
      $$: "cocktail bars, seafood",
      $$$: "rooftops, upscale dining",
    },
    transport: { maxTravelMinutes: 12, avoidCrossCity: true },
  }),
  make({
    city: "Chicago",
    slug: "chi",
    label: "Chicago",
    tags: ["lakefront", "theater district", "speakeasies", "deep-dish", "blues"],
    neighborhoods: [
      { name: "Wicker Park", vibe: "indie bars, dive-cool, late-night" },
      { name: "River North", vibe: "rooftops, upscale dining" },
      { name: "Logan Square", vibe: "craft cocktails, low-key cool" },
      { name: "West Loop", vibe: "tasting menus, design-forward" },
    ],
    allowedActivities: [
      "rooftop bars",
      "speakeasies",
      "blues clubs",
      "comedy clubs",
      "lakefront walks",
      "deep-dish dining",
    ],
    environmentFeatures: ["lakefront", "river", "skyline", "L-train walkable"],
    signatureExperiences: [
      "river architecture cruise",
      "Second City show",
      "blues at Kingston Mines",
      "rooftop skyline view",
    ],
    priceNorms: {
      $: "neighborhood bars, deep-dish",
      $$: "cocktail bars, mid-range",
      $$$: "River North rooftops, tasting menus",
    },
    transport: { maxTravelMinutes: 12, avoidCrossCity: true },
  }),
  // ── New launch cities ────────────────────────────────────────────────
  make({
    city: "Los Angeles",
    slug: "la",
    label: "Los Angeles",
    tags: ["rooftops", "beach-adjacent", "celebrity scene", "late-night tacos", "live music"],
    neighborhoods: [
      { name: "West Hollywood", vibe: "clubs, lounges, see-and-be-seen" },
      { name: "DTLA", vibe: "rooftops, speakeasies, art-deco lobbies" },
      { name: "Venice", vibe: "boardwalk, beach bars, casual cool" },
      { name: "Silver Lake", vibe: "indie cocktail bars, low-key cool" },
      { name: "Santa Monica", vibe: "pier, sunset, oceanfront" },
    ],
    allowedActivities: [
      "rooftop lounges",
      "beach bars",
      "speakeasies",
      "live music",
      "late-night tacos",
      "comedy clubs",
      "sunset viewpoints",
    ],
    environmentFeatures: ["beach", "rooftops", "hills", "palm-lined streets"],
    signatureExperiences: [
      "Santa Monica pier sunset",
      "DTLA rooftop hop",
      "comedy at the Comedy Store",
      "late-night taco truck",
    ],
    priceNorms: {
      $: "taco trucks, dive bars",
      $$: "cocktail bars, mid-range",
      $$$: "rooftops, celebrity spots",
    },
    transport: { maxTravelMinutes: 18, avoidCrossCity: true },
  }),
  make({
    city: "San Francisco",
    slug: "sf",
    label: "San Francisco",
    tags: ["bay views", "speakeasies", "tasting menus", "wine country", "fog"],
    neighborhoods: [
      { name: "Mission", vibe: "indie bars, tacos, late-night" },
      { name: "SoMa", vibe: "rooftops, lounges, after-work" },
      { name: "North Beach", vibe: "Italian, jazz, classic" },
      { name: "Hayes Valley", vibe: "wine bars, design-forward" },
      { name: "Embarcadero", vibe: "waterfront, bay views, Ferry Building" },
    ],
    allowedActivities: [
      "wine bars",
      "speakeasies",
      "tasting menus",
      "rooftop lounges",
      "waterfront dining",
      "jazz clubs",
      "small plates",
    ],
    avoid: ["beach clubs", "casinos"],
    environmentFeatures: ["bay", "bridges", "hills", "waterfront"],
    signatureExperiences: [
      "Embarcadero sunset stroll",
      "speakeasy in Tenderloin",
      "Ferry Building bites",
      "North Beach jazz",
    ],
    priceNorms: {
      $: "Mission tacos, dive bars",
      $$: "wine bars, cocktail bars",
      $$$: "tasting menus, rooftops",
    },
    transport: { maxTravelMinutes: 12, avoidCrossCity: true },
  }),
  make({
    city: "Houston",
    slug: "hou",
    label: "Houston",
    tags: ["BBQ", "rooftops", "Tex-Mex", "live music", "ice houses"],
    neighborhoods: [
      { name: "Montrose", vibe: "indie bars, LGBTQ+, late-night" },
      { name: "Midtown", vibe: "rooftops, cocktail bars, nightlife" },
      { name: "Heights", vibe: "ice houses, breweries, casual" },
      { name: "Downtown", vibe: "skyline lounges, upscale" },
      { name: "EaDo", vibe: "warehouse bars, live music" },
    ],
    allowedActivities: [
      "rooftop bars",
      "ice houses",
      "Tex-Mex dining",
      "BBQ joints",
      "live music",
      "speakeasies",
      "cocktail bars",
    ],
    avoid: ["beach bars", "harbor cruises"],
    environmentFeatures: ["skyline", "humid nights", "patios", "sprawl"],
    signatureExperiences: [
      "Montrose bar crawl",
      "rooftop in Midtown",
      "BBQ + beer in the Heights",
      "EaDo live music",
    ],
    priceNorms: {
      $: "ice houses, taquerías",
      $$: "cocktail bars, BBQ",
      $$$: "downtown skyline, steak",
    },
    transport: { maxTravelMinutes: 18, avoidCrossCity: true },
  }),
  make({
    city: "Atlanta",
    slug: "atl",
    label: "Atlanta",
    tags: ["rooftops", "hip-hop scene", "soul food", "speakeasies", "BeltLine"],
    neighborhoods: [
      { name: "Midtown", vibe: "rooftops, lounges, theater" },
      { name: "Buckhead", vibe: "upscale, lounges, fine dining" },
      { name: "Old Fourth Ward", vibe: "BeltLine bars, cool & casual" },
      { name: "West Midtown", vibe: "warehouse cocktail bars, design-forward" },
      { name: "Edgewood", vibe: "nightlife strip, dive-to-club" },
    ],
    allowedActivities: [
      "rooftop bars",
      "soul food dining",
      "speakeasies",
      "lounges",
      "live hip-hop",
      "comedy clubs",
      "BeltLine patios",
    ],
    avoid: ["beach bars", "harbor cruises"],
    environmentFeatures: ["BeltLine", "skyline", "patios", "tree canopy"],
    signatureExperiences: [
      "BeltLine patio crawl",
      "Buckhead rooftop",
      "Edgewood late-night",
      "soul food + cocktails",
    ],
    priceNorms: {
      $: "BeltLine bars, soul food",
      $$: "cocktail bars, mid-range",
      $$$: "Buckhead lounges, rooftops",
    },
    transport: { maxTravelMinutes: 15, avoidCrossCity: true },
  }),
  // ── Tennessee + Southwest expansion ────────────────────────────────────
  make({
    city: "Nashville",
    slug: "nash",
    label: "Nashville",
    tags: ["live music", "whiskey", "rooftops", "honky tonks", "bachelorette", "river"],
    neighborhoods: [
      { name: "Broadway", vibe: "honky tonks, neon, bachelorette energy" },
      { name: "The Gulch", vibe: "rooftop brunches, murals, glam dinner" },
      { name: "Midtown", vibe: "bars, late-night, walkable" },
      { name: "12 South", vibe: "boutique, murals, aesthetic brunch" },
      { name: "Germantown", vibe: "tasting menus, low-key cool" },
    ],
    allowedActivities: [
      "honky tonks",
      "rooftop bars",
      "live music",
      "whiskey tastings",
      "country glam dining",
      "pedal taverns",
      "waterfront dining",
      "speakeasies",
    ],
    environmentFeatures: ["river", "riverwalk", "rooftops", "skyline"],
    signatureExperiences: [
      "Broadway honky tonk crawl",
      "Gulch rooftop brunch",
      "Cumberland River sunset walk",
      "12 South mural photos",
    ],
    priceNorms: {
      $: "honky tonks, hot chicken",
      $$: "rooftop bars, southern dining",
      $$$: "Gulch tasting menus, glam rooftops",
    },
    transport: { maxTravelMinutes: 15, avoidCrossCity: true },
  }),
  make({
    city: "Memphis",
    slug: "mem",
    label: "Memphis",
    tags: ["blues", "BBQ", "river", "soul", "Beale Street"],
    neighborhoods: [
      { name: "Beale Street", vibe: "live blues, neon, late-night" },
      { name: "Downtown", vibe: "rooftops, riverfront, hotel bars" },
      { name: "Cooper-Young", vibe: "indie bars, casual, eclectic" },
      { name: "Overton Square", vibe: "dinner + cocktails, walkable" },
    ],
    allowedActivities: [
      "blues lounges",
      "BBQ joints",
      "riverboat cruises",
      "rooftop bars",
      "soul food dining",
      "live music",
      "late-night music",
    ],
    environmentFeatures: ["river", "riverwalk", "skyline"],
    signatureExperiences: [
      "Beale Street blues crawl",
      "BBQ + cocktail night",
      "Mississippi River sunset cruise",
      "Overton Square dinner hop",
    ],
    priceNorms: {
      $: "BBQ joints, soul food",
      $$: "blues lounges, cocktail bars",
      $$$: "downtown rooftops, chef tasting",
    },
    transport: { maxTravelMinutes: 15, avoidCrossCity: true },
  }),
  make({
    city: "Knoxville",
    slug: "knox",
    label: "Knoxville",
    tags: ["college nightlife", "river", "rooftops", "breweries"],
    neighborhoods: [
      { name: "Market Square", vibe: "patios, walkable, casual cool" },
      { name: "Old City", vibe: "speakeasies, indie venues, brick" },
      { name: "Downtown", vibe: "rooftops, dinner, walkable" },
      { name: "Volunteer Landing", vibe: "riverwalk, scenic, calm" },
    ],
    allowedActivities: [
      "wine bars",
      "rooftop bars",
      "brewery hops",
      "waterfront dining",
      "riverwalk strolls",
      "dessert bars",
      "live music",
    ],
    environmentFeatures: ["river", "riverwalk", "rooftops"],
    signatureExperiences: [
      "Tennessee River riverwalk dinner",
      "Market Square patio crawl",
      "Old City speakeasy hop",
      "rooftop dessert nightcap",
    ],
    priceNorms: {
      $: "breweries, casual patios",
      $$: "wine bars, rooftops",
      $$$: "chef tasting, riverfront fine dining",
    },
    transport: { maxTravelMinutes: 12, avoidCrossCity: true },
  }),
  make({
    city: "Chattanooga",
    slug: "chatt",
    label: "Chattanooga",
    tags: ["river", "mountains", "scenic", "soft life", "outdoorsy"],
    neighborhoods: [
      { name: "North Shore", vibe: "riverfront patios, boutique, walkable" },
      { name: "Downtown", vibe: "aquarium, riverwalk, dinner" },
      { name: "Southside", vibe: "craft cocktails, design-forward" },
      { name: "Riverfront", vibe: "scenic, sunset, calm" },
    ],
    allowedActivities: [
      "riverfront dining",
      "river cruises",
      "scenic overlooks",
      "spa appointments",
      "dessert lounges",
      "mountain-view dinners",
      "wine bars",
    ],
    environmentFeatures: ["river", "riverwalk", "mountains", "scenic overlooks"],
    signatureExperiences: [
      "Tennessee River sunset cruise",
      "Lookout Mountain overlook",
      "North Shore riverfront dinner",
      "Aquarium-side dessert lounge",
    ],
    priceNorms: {
      $: "casual cafés, breweries",
      $$: "riverfront dinner, wine bars",
      $$$: "scenic chef tasting, spa + dinner",
    },
    transport: { maxTravelMinutes: 15, avoidCrossCity: true },
  }),
  make({
    city: "Gatlinburg",
    slug: "gat",
    label: "Gatlinburg",
    tags: ["mountains", "cabins", "moonshine", "scenic", "cozy adventure"],
    avoid: ["beach bars", "harbor cruises", "marina lounges"],
    neighborhoods: [
      { name: "Downtown Gatlinburg", vibe: "walkable strip, moonshine, casual" },
      { name: "Arts & Crafts Community", vibe: "scenic, slow, artisan" },
    ],
    allowedActivities: [
      "moonshine tastings",
      "mountain coaster",
      "scenic overlooks",
      "cabin lounges",
      "cozy fireplace dinner",
      "downtown strip walk",
    ],
    environmentFeatures: ["mountains", "scenic overlooks", "cabins", "fire pits"],
    signatureExperiences: [
      "Gatlinburg moonshine flight",
      "mountain coaster night ride",
      "scenic overlook dinner",
      "cabin nightcap by the fire",
    ],
    priceNorms: {
      $: "downtown strip, casual eats",
      $$: "scenic dinner, moonshine tasting",
      $$$: "cabin chef dinner, mountain-view tasting",
    },
    transport: { maxTravelMinutes: 18, avoidCrossCity: false },
  }),
  make({
    city: "Phoenix",
    slug: "phx",
    label: "Phoenix / Scottsdale",
    tags: ["desert", "pools", "rooftops", "spa", "scenic sunsets"],
    avoid: ["beach bars", "harbor cruises", "river cruises"],
    neighborhoods: [
      { name: "Old Town Scottsdale", vibe: "nightlife strip, lounges, walkable" },
      { name: "Downtown Phoenix", vibe: "rooftops, cocktail bars, sports" },
      { name: "Arcadia", vibe: "patios, chef-driven dining, low-key cool" },
    ],
    allowedActivities: [
      "rooftop lounges",
      "desert sunset viewpoints",
      "pool day parties",
      "spa appointments",
      "speakeasies",
      "patio dining",
    ],
    environmentFeatures: ["desert", "rooftops", "pools", "scenic sunsets", "mountain views"],
    signatureExperiences: [
      "Camelback sunset overlook",
      "Old Town Scottsdale lounge crawl",
      "Desert pool day party",
      "Rooftop nightcap with skyline",
    ],
    priceNorms: {
      $: "patio bars, tacos",
      $$: "cocktail bars, lounges",
      $$$: "rooftop tasting, pool club",
    },
    transport: { maxTravelMinutes: 18, avoidCrossCity: false },
  }),
];

// Map app-level city slugs (src/lib/cities.ts) to the agent CityContext slugs.
const SLUG_ALIASES: Record<string, string> = {
  dmv: "dc",
  mia: "miami",
  sea: "seattle",
  nashville: "nash",
  memphis: "mem",
  knoxville: "knox",
  chattanooga: "chatt",
  gatlinburg: "gat",
  phoenix: "phx",
  scottsdale: "phx",
  hou: "hou",
  // bos, phl, nash, aus, den, no, tor: no dedicated context — use loose match by name
};

export function findCity(query?: string | null): CityContext {
  if (!query) return CITIES[0];
  const q = query.toLowerCase().trim();
  const aliased = SLUG_ALIASES[q] ?? q;
  return (
    CITIES.find(
      (c) =>
        c.slug === aliased ||
        c.slug === q ||
        c.city.toLowerCase() === q ||
        c.label.toLowerCase() === q,
    ) ?? CITIES[0]
  );
}

export function findCityLoose(slug?: string | null, name?: string | null): CityContext | null {
  if (!slug && !name) return null;
  const sq = slug?.toLowerCase().trim();
  const nq = name?.toLowerCase().trim();
  const aliased = sq ? (SLUG_ALIASES[sq] ?? sq) : undefined;
  return (
    CITIES.find(
      (c) =>
        (aliased && (c.slug === aliased || c.slug === sq)) ||
        (nq && (c.city.toLowerCase() === nq || c.label.toLowerCase() === nq)),
    ) ?? null
  );
}
