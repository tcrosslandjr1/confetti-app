// Shared sample venue catalog used by /discover and /venue/:id so both
// surfaces show consistent data. IDs are stable strings ("1".."8") so they
// can appear in URLs without UUID validation getting in the way.

export type SampleCategory =
  | "Dining"
  | "Nightlife"
  | "Rooftops"
  | "Live Music"
  | "Cocktails";

export type SampleVenue = {
  id: string;
  slug: string;
  name: string;
  neighborhood: string;
  address: string;
  city: string;
  category: SampleCategory;
  rating: number;
  /** "$" | "$$" | "$$$" */
  price: string;
  /** 1..4 to match price_level conventions elsewhere in the app. */
  price_level: number;
  tags: string[];
  description: string;
  aiPick?: boolean;
  /** Tailwind gradient classes used for the placeholder hero. */
  gradient: string;
  /** Approx position on the /discover map placeholder, % of container. */
  coords: { x: number; y: number };
};

export const SAMPLE_VENUES: SampleVenue[] = [
  {
    id: "1",
    slug: "velvet-terrace",
    name: "Velvet Terrace",
    neighborhood: "Dupont Circle",
    address: "1521 Connecticut Ave NW, Washington, DC",
    city: "Washington",
    category: "Rooftops",
    rating: 4.8,
    price: "$$",
    price_level: 3,
    tags: ["rooftop", "sunset", "date night"],
    description:
      "A plush rooftop perched above Dupont with sunset views, velvet banquettes, and a cocktail program built around the golden hour.",
    aiPick: true,
    gradient: "from-rose-400 via-fuchsia-500 to-indigo-600",
    coords: { x: 38, y: 42 },
  },
  {
    id: "2",
    slug: "noir-lounge",
    name: "Noir Lounge",
    neighborhood: "Shaw",
    address: "1924 8th St NW, Washington, DC",
    city: "Washington",
    category: "Cocktails",
    rating: 4.6,
    price: "$$",
    price_level: 3,
    tags: ["speakeasy", "moody", "cocktails"],
    description:
      "A low-lit Shaw speakeasy behind an unmarked door. Vinyl-only soundtrack, mezcal flights, and bartenders who actually remember your order.",
    gradient: "from-slate-800 via-purple-900 to-zinc-900",
    coords: { x: 52, y: 46 },
  },
  {
    id: "3",
    slug: "ember-kitchen",
    name: "Ember Kitchen",
    neighborhood: "Logan Circle",
    address: "1401 14th St NW, Washington, DC",
    city: "Washington",
    category: "Dining",
    rating: 4.7,
    price: "$$",
    price_level: 3,
    tags: ["wood-fired", "seasonal", "tasting"],
    description:
      "Wood-fired everything from a chef who used to run the line at a two-star. The seasonal tasting moves fast — book the chef's counter.",
    aiPick: true,
    gradient: "from-amber-500 via-orange-600 to-rose-700",
    coords: { x: 48, y: 40 },
  },
  {
    id: "4",
    slug: "the-vinyl-room",
    name: "The Vinyl Room",
    neighborhood: "U Street",
    address: "1215 U St NW, Washington, DC",
    city: "Washington",
    category: "Live Music",
    rating: 4.5,
    price: "$",
    price_level: 2,
    tags: ["jazz", "vinyl", "late-night"],
    description:
      "U Street's quietest secret: a 40-seat listening room with a rotating cast of jazz trios and a wall of pristine first-press LPs.",
    gradient: "from-emerald-600 via-teal-700 to-slate-900",
    coords: { x: 46, y: 34 },
  },
  {
    id: "5",
    slug: "skyline-social",
    name: "Skyline Social",
    neighborhood: "Navy Yard",
    address: "1280 4th St SE, Washington, DC",
    city: "Washington",
    category: "Rooftops",
    rating: 4.4,
    price: "$$",
    price_level: 3,
    tags: ["views", "social", "groups"],
    description:
      "Eleven floors up with a 270° view of the river. Best for big crews and slow Sundays — the brunch carafes are dangerously generous.",
    gradient: "from-sky-400 via-blue-600 to-indigo-800",
    coords: { x: 64, y: 68 },
  },
  {
    id: "6",
    slug: "sakura-garden",
    name: "Sakura Garden",
    neighborhood: "Penn Quarter",
    address: "701 D St NW, Washington, DC",
    city: "Washington",
    category: "Dining",
    rating: 4.9,
    price: "$$",
    price_level: 4,
    tags: ["omakase", "garden", "intimate"],
    description:
      "An 8-seat omakase counter wrapped around an indoor cherry-blossom courtyard. The chef sources straight from Toyosu twice a week.",
    aiPick: true,
    gradient: "from-pink-300 via-rose-400 to-fuchsia-600",
    coords: { x: 54, y: 56 },
  },
  {
    id: "7",
    slug: "brass-and-bone",
    name: "Brass & Bone",
    neighborhood: "Adams Morgan",
    address: "2461 18th St NW, Washington, DC",
    city: "Washington",
    category: "Nightlife",
    rating: 4.3,
    price: "$$",
    price_level: 2,
    tags: ["dance", "late-night", "DJ"],
    description:
      "Adams Morgan's late-night anchor: brass-trimmed bar up front, sweaty dance floor in the back, residents spinning disco-edit sets till 3am.",
    gradient: "from-yellow-500 via-amber-700 to-stone-900",
    coords: { x: 40, y: 28 },
  },
  {
    id: "8",
    slug: "luna-terrace",
    name: "Luna Terrace",
    neighborhood: "Georgetown",
    address: "3251 Prospect St NW, Washington, DC",
    city: "Washington",
    category: "Cocktails",
    rating: 4.7,
    price: "$$",
    price_level: 3,
    tags: ["lunar", "patio", "cocktails"],
    description:
      "A moonlit Georgetown patio strung with paper lanterns. Lunar-cycle cocktail menu rotates monthly — try whatever's listed under 'new moon'.",
    gradient: "from-indigo-400 via-violet-600 to-purple-900",
    coords: { x: 22, y: 50 },
  },
];

export function getSampleVenue(id: string): SampleVenue | undefined {
  return SAMPLE_VENUES.find((v) => v.id === id || v.slug === id);
}
