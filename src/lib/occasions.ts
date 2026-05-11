import {
  Heart,
  Users,
  Baby,
  UserCheck,
  Sparkles,
  Compass,
  TreePine,
  Crown,
  GraduationCap,
  Coffee,
  Palette,
  PartyPopper,
  type LucideIcon,
} from "lucide-react";

export type IdeaFormat = "quick" | "bundle" | "full";

export type IdeaStep = { label: string; detail: string };

export type Idea = {
  id: string;
  title: string;
  hook: string;
  description: string;
  vibeTags: string[];
  estCost: string;
  timeOfDay: string;
  duration: string;
  steps: IdeaStep[];
  whatToWear?: string;
  conversationStarter?: string;
  imagePrompt?: string;
  source: "seed" | "ai";
};

export type Occasion = {
  slug: string;
  title: string;
  tagline: string;
  icon: LucideIcon;
  gradient: string; // tailwind gradient utility
  emoji: string;
};

export const OCCASIONS: Occasion[] = [
  {
    slug: "date-night",
    title: "Date night",
    tagline: "Romance, sparks, slow burns",
    icon: Heart,
    gradient: "from-pink-500 to-rose-600",
    emoji: "💞",
  },
  {
    slug: "girls-night",
    title: "Girls' night out",
    tagline: "Glam it up, hype each other",
    icon: PartyPopper,
    gradient: "from-fuchsia-500 to-pink-500",
    emoji: "💃",
  },
  {
    slug: "guys-night",
    title: "Guys' night out",
    tagline: "Wings, courts, low stakes fun",
    icon: Users,
    gradient: "from-amber-500 to-orange-600",
    emoji: "🍻",
  },
  {
    slug: "family-night",
    title: "Family night",
    tagline: "Everyone leaves smiling",
    icon: Baby,
    gradient: "from-emerald-500 to-teal-600",
    emoji: "🎈",
  },
  {
    slug: "meet-the-inlaws",
    title: "Meet the in-laws",
    tagline: "Make a great first impression",
    icon: UserCheck,
    gradient: "from-violet-500 to-indigo-600",
    emoji: "🥂",
  },
  {
    slug: "explorer",
    title: "Explorer mode",
    tagline: "Off-the-map, little adventures",
    icon: Compass,
    gradient: "from-sky-500 to-blue-600",
    emoji: "🧭",
  },
  {
    slug: "nature-lover",
    title: "Nature lover",
    tagline: "Trails, water, sky, quiet",
    icon: TreePine,
    gradient: "from-green-500 to-emerald-700",
    emoji: "🌲",
  },
  {
    slug: "classy-elegant",
    title: "Classy & elegant",
    tagline: "Dress code recommended",
    icon: Crown,
    gradient: "from-yellow-600 to-amber-800",
    emoji: "🥂",
  },
  {
    slug: "kids-museums",
    title: "Kids & museums",
    tagline: "Curious little minds",
    icon: GraduationCap,
    gradient: "from-cyan-500 to-blue-600",
    emoji: "🎨",
  },
  {
    slug: "small-town",
    title: "Small-town gems",
    tagline: "Hidden, slow, charming",
    icon: Coffee,
    gradient: "from-orange-500 to-red-600",
    emoji: "🛻",
  },
  {
    slug: "creative-arts",
    title: "Creative & arts",
    tagline: "Make, see, feel something",
    icon: Palette,
    gradient: "from-purple-500 to-fuchsia-600",
    emoji: "🎭",
  },
  {
    slug: "spontaneous",
    title: "Surprise me",
    tagline: "Anything. Everything.",
    icon: Sparkles,
    gradient: "from-coral to-pink",
    emoji: "✨",
  },
];

export const getOccasion = (slug: string) => OCCASIONS.find((o) => o.slug === slug);

// ----- Seed ideas (small starter library; AI generates more on demand) -----

const seed = (slug: string, ideas: Omit<Idea, "id" | "source">[]): Idea[] =>
  ideas.map((i, idx) => ({ ...i, id: `${slug}-seed-${idx}`, source: "seed" }));

export const SEED_IDEAS: Record<string, Idea[]> = {
  "date-night": seed("date-night", [
    {
      title: "Rooftop wine & city lights",
      hook: "A bottle, a skyline, and nowhere to be.",
      description:
        "Find a rooftop bar with a view, order a bottle you've never tried, and watch the city change colors as the sun drops.",
      vibeTags: ["romantic", "skyline", "low-key"],
      estCost: "$$",
      timeOfDay: "Evening",
      duration: "2-3 hours",
      steps: [
        {
          label: "6:30 PM — Rooftop",
          detail: "Pick a bar with western view; arrive before golden hour.",
        },
        { label: "8:00 PM — Stroll", detail: "Walk it off through a lit-up neighborhood." },
        { label: "9:00 PM — Dessert", detail: "Tiny bakery or gelato to close the night." },
      ],
      whatToWear: "Smart casual, layer for the breeze.",
      conversationStarter: "What's a city you'd move to tomorrow if money didn't matter?",
    },
    {
      title: "Cook the recipe you've been saving",
      hook: "Pick a market, cook the thing, eat by candlelight.",
      description:
        "Hit a specialty market together, grab everything for one ambitious recipe, and cook it side-by-side at home.",
      vibeTags: ["cozy", "hands-on", "playful"],
      estCost: "$",
      timeOfDay: "Evening",
      duration: "3-4 hours",
      steps: [
        { label: "Market", detail: "Pick produce together — no phones, no recipes yet." },
        { label: "Cook", detail: "Music on. One person leads, one preps." },
        { label: "Eat", detail: "Candles, vinyl, slow." },
      ],
    },
    {
      title: "Stargaze + drive-thru milkshakes",
      hook: "Throw blankets in the trunk and chase a dark sky.",
      description:
        "Find a dark-sky park 30-60 min out of town. Bring blankets, snacks, and a milkshake from the best diner on the way.",
      vibeTags: ["nostalgic", "easy", "outdoors"],
      estCost: "$",
      timeOfDay: "Late night",
      duration: "3 hours",
      steps: [],
    },
  ]),
  "girls-night": seed("girls-night", [
    {
      title: "Tiny plates + wine flights crawl",
      hook: "Three spots, three bottles, zero plans.",
      description:
        "Pick a walkable neighborhood and hop between three small-plate restaurants, sharing a flight at each.",
      vibeTags: ["foodie", "boozy", "walkable"],
      estCost: "$$$",
      timeOfDay: "Evening",
      duration: "4 hours",
      steps: [],
    },
    {
      title: "Pottery + cocktails after",
      hook: "Make something messy, then dress up.",
      description:
        "Book a pottery or paint class, then change in the car for a swanky cocktail bar nearby.",
      vibeTags: ["creative", "glam", "memorable"],
      estCost: "$$",
      timeOfDay: "Evening",
      duration: "5 hours",
      steps: [],
    },
  ]),
  "family-night": seed("family-night", [
    {
      title: "Backyard movie under the stars",
      hook: "A sheet, a projector, and unlimited popcorn.",
      description:
        "String up a sheet, fire up a projector, build a snack bar. Let the kids pick the movie.",
      vibeTags: ["cozy", "kid-led", "free"],
      estCost: "$",
      timeOfDay: "Evening",
      duration: "3 hours",
      steps: [],
    },
    {
      title: "Diner + bowling league",
      hook: "Grease, gutter balls, and trash talk.",
      description:
        "Old-school diner dinner, then a couple of games of bowling. Loser does dishes for a week.",
      vibeTags: ["classic", "competitive", "all-ages"],
      estCost: "$$",
      timeOfDay: "Evening",
      duration: "3 hours",
      steps: [],
    },
  ]),
  "meet-the-inlaws": seed("meet-the-inlaws", [
    {
      title: "Sunday brunch with a garden walk",
      hook: "Daylight, neutral ground, easy exits.",
      description:
        "Brunch is low-stakes. Pick somewhere with a patio, then walk a botanical garden after — natural conversation, no awkward silences.",
      vibeTags: ["safe", "warm", "bright"],
      estCost: "$$",
      timeOfDay: "Morning",
      duration: "3 hours",
      steps: [
        { label: "11 AM — Brunch", detail: "Reserve a patio table; order sharing plates." },
        { label: "1 PM — Garden walk", detail: "Wander, take photos, ask about their hobbies." },
      ],
      conversationStarter: "What's a tradition from your family you hope sticks around?",
    },
  ]),
  explorer: seed("explorer", [
    {
      title: "Pin a town, drive there, find one thing",
      hook: "Spin the map. Go.",
      description:
        "Drop a pin within 90 minutes. Drive there with no plan. Find one weird, beautiful, or delicious thing — that's the win.",
      vibeTags: ["spontaneous", "road-trip"],
      estCost: "$",
      timeOfDay: "All day",
      duration: "Half day",
      steps: [],
    },
  ]),
  "nature-lover": seed("nature-lover", [
    {
      title: "Sunrise hike + thermos breakfast",
      hook: "Beat the crowd to the view.",
      description:
        "Pick a short scenic trail. Pack thermoses of coffee and breakfast burritos. Eat at the top.",
      vibeTags: ["fresh-air", "calm", "early"],
      estCost: "$",
      timeOfDay: "Morning",
      duration: "3 hours",
      steps: [],
    },
  ]),
  "classy-elegant": seed("classy-elegant", [
    {
      title: "Symphony + late dessert at a hotel bar",
      hook: "Black tie energy, no actual black tie required.",
      description:
        "Catch a symphony or chamber program, then sip something dark at a grand hotel's lobby bar.",
      vibeTags: ["refined", "quiet", "dressy"],
      estCost: "$$$",
      timeOfDay: "Evening",
      duration: "4 hours",
      steps: [],
    },
  ]),
  "kids-museums": seed("kids-museums", [
    {
      title: "Children's museum + park picnic",
      hook: "Burn off the museum energy outside.",
      description:
        "Hit a children's museum at opening (less crowded), then picnic at a nearby park with a playground.",
      vibeTags: ["educational", "active", "easy"],
      estCost: "$$",
      timeOfDay: "Morning",
      duration: "Half day",
      steps: [],
    },
  ]),
  "small-town": seed("small-town", [
    {
      title: "Antiques row + pie at the diner",
      hook: "Slow drive, weird finds, great pie.",
      description:
        "Find a small town with an antiques district. Browse for an hour. End at the diner everyone recommends.",
      vibeTags: ["slow", "charming", "vintage"],
      estCost: "$",
      timeOfDay: "Afternoon",
      duration: "Half day",
      steps: [],
    },
  ]),
  "creative-arts": seed("creative-arts", [
    {
      title: "First-Friday gallery walk",
      hook: "Free wine, weird art, real conversations.",
      description:
        "Most cities have a monthly gallery walk. Free, walkable, and the art makes for great talking.",
      vibeTags: ["arty", "social", "free"],
      estCost: "$",
      timeOfDay: "Evening",
      duration: "3 hours",
      steps: [],
    },
  ]),
  "guys-night": seed("guys-night", [
    {
      title: "Smash burgers + arcade",
      hook: "Cheap eats, loud games, zero pretense.",
      description:
        "Find the messiest smash burger in town, then find an arcade or barcade. Quarters in, problems out.",
      vibeTags: ["chill", "competitive", "casual"],
      estCost: "$$",
      timeOfDay: "Evening",
      duration: "3 hours",
      steps: [],
    },
  ]),
  spontaneous: seed("spontaneous", [
    {
      title: "Roll the dice — first idea wins",
      hook: "Tap generate. Whatever shows up, do it.",
      description:
        "No filters, no overthinking. Tap generate and commit to the first idea that lands.",
      vibeTags: ["random", "fun", "no-rules"],
      estCost: "$",
      timeOfDay: "Evening",
      duration: "varies",
      steps: [],
    },
  ]),
};

export const getSeedIdeas = (slug: string): Idea[] => SEED_IDEAS[slug] ?? [];
