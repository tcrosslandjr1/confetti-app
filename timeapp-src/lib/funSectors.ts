export interface FunSector {
  id: string;
  label: string;
  shortLabel: string;
  description: string;
  examples: string[];
  vibes: string[];
  searchQueries: string[];
}

export const funSectors: FunSector[] = [
  {
    id: "dining",
    label: "Dining",
    shortLabel: "Eat",
    description: "Restaurants, brunch, tasting menus, food halls, and chef-led meals.",
    examples: ["restaurants", "brunch", "food halls", "chef tables"],
    vibes: ["foodie", "date night", "group-friendly"],
    searchQueries: ["best restaurants", "popular brunch spots", "chef table experiences"]
  },
  {
    id: "drinks-nightlife",
    label: "Drinks & Nightlife",
    shortLabel: "Drink",
    description: "Bars, lounges, rooftops, speakeasies, clubs, and late-night rooms.",
    examples: ["cocktail bars", "rooftops", "speakeasies", "clubs"],
    vibes: ["after dark", "social", "instagrammable"],
    searchQueries: ["best cocktail bars", "rooftop bars", "hidden speakeasies"]
  },
  {
    id: "live-entertainment",
    label: "Live Entertainment",
    shortLabel: "Watch",
    description: "Concerts, comedy, theater, open mics, jazz, drag, stage shows, and ticketed live events.",
    examples: ["concerts", "comedy", "theater", "jazz clubs", "ticketed events"],
    vibes: ["high-energy", "culture", "date night"],
    searchQueries: ["events tonight", "live music events", "comedy shows", "theater events", "ticketed events"]
  },
  {
    id: "arts-culture",
    label: "Arts & Culture",
    shortLabel: "Culture",
    description: "Museums, galleries, exhibits, cultural centers, and creative districts.",
    examples: ["museums", "galleries", "exhibits", "cultural centers"],
    vibes: ["creative", "daytime", "learning"],
    searchQueries: ["best museums", "art galleries", "cultural exhibits"]
  },
  {
    id: "immersive-experiences",
    label: "Immersive Experiences",
    shortLabel: "Experience",
    description: "Pop-ups, escape rooms, VR, themed rooms, and interactive installations.",
    examples: ["pop-ups", "escape rooms", "VR", "interactive art"],
    vibes: ["novelty", "instagrammable", "group-friendly"],
    searchQueries: ["immersive experiences", "escape rooms", "interactive pop ups"]
  },
  {
    id: "outdoor-nature",
    label: "Outdoor & Nature",
    shortLabel: "Explore",
    description: "Parks, hikes, waterfronts, gardens, scenic walks, and outdoor escapes.",
    examples: ["parks", "hikes", "waterfronts", "gardens"],
    vibes: ["sunset", "active", "low-cost"],
    searchQueries: ["best parks", "sunset hikes", "scenic walks"]
  },
  {
    id: "sports-recreation",
    label: "Sports & Recreation",
    shortLabel: "Move",
    description: "Golf, mini golf, simulators, driving ranges, bowling, skating, pickleball, arcades, and active hangouts.",
    examples: ["golf", "mini golf", "driving ranges", "golf simulators", "bowling", "pickleball", "arcades"],
    vibes: ["active", "competitive", "group-friendly"],
    searchQueries: ["golf courses", "mini golf", "driving ranges", "indoor golf simulators", "bowling alleys", "pickleball courts", "arcades"]
  },
  {
    id: "wellness-relaxation",
    label: "Wellness & Relaxation",
    shortLabel: "Relax",
    description: "Spas, saunas, yoga, sound baths, meditative spaces, and self-care dates.",
    examples: ["spas", "saunas", "yoga", "sound baths"],
    vibes: ["calm", "romantic", "reset"],
    searchQueries: ["best spas", "sauna experiences", "sound baths"]
  },
  {
    id: "shopping-markets",
    label: "Shopping & Markets",
    shortLabel: "Shop",
    description: "Boutiques, flea markets, farmers markets, vintage, makers, and retail strolls.",
    examples: ["boutiques", "flea markets", "farmers markets", "vintage shops"],
    vibes: ["daytime", "local", "strolling"],
    searchQueries: ["vintage shops", "farmers markets", "flea markets"]
  },
  {
    id: "family-kids",
    label: "Family & Kids",
    shortLabel: "Family",
    description: "Kid-friendly museums, playgrounds, aquariums, arcades, and family events.",
    examples: ["playgrounds", "kids museums", "aquariums", "family events"],
    vibes: ["kid-friendly", "low-stress", "daytime"],
    searchQueries: ["kids activities", "family friendly things to do", "interactive kids museums"]
  },
  {
    id: "romantic-date-night",
    label: "Romantic / Date Night",
    shortLabel: "Date",
    description: "Intimate restaurants, wine bars, sunset spots, cozy activities, and mood-led plans.",
    examples: ["wine bars", "sunset spots", "cozy lounges", "romantic restaurants"],
    vibes: ["romantic", "cozy", "polished"],
    searchQueries: ["date night restaurants", "romantic bars", "sunset date spots"]
  },
  {
    id: "social-group-activities",
    label: "Social Group Activities",
    shortLabel: "Group",
    description: "Game nights, karaoke, trivia, board game cafes, barcades, paint-and-sip, group dinners, and team activities.",
    examples: ["game night", "board game cafes", "barcades", "karaoke", "trivia", "paint and sip"],
    vibes: ["social", "easy", "group-friendly", "playful"],
    searchQueries: ["game night venues", "board game cafes", "barcades", "trivia nights", "game bars"]
  },
  {
    id: "viral-eats",
    label: "Foodie / Viral Eats",
    shortLabel: "Viral Eats",
    description: "TikTok foods, dessert spots, food trucks, lines, hype dishes, and creator-mentioned bites.",
    examples: ["viral desserts", "food trucks", "smash burgers", "birria"],
    vibes: ["tiktok viral", "casual", "shareable"],
    searchQueries: ["viral food spots", "TikTok restaurants", "popular dessert spots"]
  },
  {
    id: "luxury-special-occasion",
    label: "Luxury & Special Occasion",
    shortLabel: "Luxury",
    description: "Fine dining, private rooms, bottle service, chauffeurs, premium views, and celebrations.",
    examples: ["fine dining", "private rooms", "bottle service", "premium views"],
    vibes: ["upscale", "celebration", "splurge"],
    searchQueries: ["fine dining", "private dining rooms", "luxury lounges"]
  },
  {
    id: "learning-classes",
    label: "Learning & Classes",
    shortLabel: "Learn",
    description: "Cooking, pottery, dance, mixology, art, fitness, and skill-building workshops.",
    examples: ["cooking classes", "pottery", "dance classes", "mixology"],
    vibes: ["hands-on", "creative", "date night"],
    searchQueries: ["cooking classes", "pottery classes", "mixology classes"]
  },
  {
    id: "festivals-seasonal",
    label: "Festivals & Seasonal Events",
    shortLabel: "Events",
    description: "Events, holiday markets, parades, street fairs, festivals, pop-ups, limited-run moments, and weekend happenings.",
    examples: ["events", "holiday markets", "street fairs", "festivals", "seasonal pop-ups", "weekend happenings"],
    vibes: ["timely", "crowd energy", "local"],
    searchQueries: ["events this weekend", "things to do this weekend", "festivals this weekend", "seasonal pop ups", "street fairs", "local events"]
  },
  {
    id: "local-exploration",
    label: "Travel-Lite Local Exploration",
    shortLabel: "Tour",
    description: "Landmarks, neighborhood crawls, tours, day trips, scenic routes, and local discovery.",
    examples: ["landmarks", "neighborhood crawls", "tours", "day trips"],
    vibes: ["tourist-in-your-city", "walkable", "discovery"],
    searchQueries: ["neighborhood tours", "local landmarks", "day trips"]
  },
  {
    id: "adult-after-dark",
    label: "Adult / After-Dark Experiences",
    shortLabel: "After Dark",
    description: "Mature nightlife, cigar bars, burlesque, supper clubs, late lounges, and adults-only venues.",
    examples: ["cigar bars", "burlesque", "supper clubs", "late lounges"],
    vibes: ["adult", "late-night", "mature"],
    searchQueries: ["adult nightlife", "burlesque shows", "cigar lounges"]
  }
];

export const sectorQuickChips = [
  "Viral eats near me",
  "Date night plan",
  "Family day out",
  "After dark lounges",
  "Outdoor sunset",
  "Live music tonight",
  "Events this weekend",
  "Game night ideas",
  "Golf simulator night",
  "Luxury celebration",
  "Hands-on class"
];
