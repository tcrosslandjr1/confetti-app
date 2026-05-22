// 20 named Girls Night itineraries, tier-bucketed, with waterfront vs.
// non-waterfront variants. Surfaced to the Itinerary Concierge as a
// preset pool the Naming + Venue Matching agents can adopt or remix.

export type GirlsNightTier = "cheap" | "mid" | "high";

export type GirlsNightPreset = {
  name: string;
  tier: GirlsNightTier;
  waterfront: string[]; // ordered beat list when city has waterfront
  inland: string[]; // ordered beat list when no waterfront
};

export const GIRLS_NIGHT_PRESETS: GirlsNightPreset[] = [
  // ── Cheap ($0–$35) ──────────────────────────────────────────
  {
    name: "Pier Pressure & Prosecco",
    tier: "cheap",
    waterfront: [
      "Walk the pier or riverwalk",
      "Boba or ice cream",
      "Dockside photos",
      "Wine back home",
    ],
    inland: ["Cute neighborhood stroll", "Ice cream shop", "Rooftop or balcony wine hang"],
  },
  {
    name: "Broke But Bougie Winery Night",
    tier: "cheap",
    waterfront: [
      "Cheap winery tasting",
      "Drive to the water",
      "Bottle on the dock",
      "Sunset playlist",
    ],
    inland: ["Winery tasting", "Park picnic", "Golden-hour photos"],
  },
  {
    name: "Soft Girl Stroll",
    tier: "cheap",
    waterfront: ["Boba", "Waterfront boardwalk walk", "Photo ops by the water"],
    inland: ["Boba", "Window shopping", "Cute alleyway photos"],
  },
  {
    name: "Karaoke Chaos",
    tier: "cheap",
    waterfront: ["Pre-game", "Dive bar karaoke near marina", "Fries on the pier"],
    inland: ["Dive bar karaoke", "Late-night diner"],
  },
  {
    name: "Girls Who Snack",
    tier: "cheap",
    waterfront: ["Grocery charcuterie", "Picnic blanket by the water", "Card games"],
    inland: ["Park picnic", "Card games"],
  },
  // ── Mid ($40–$90) ──────────────────────────────────────────
  {
    name: "Dinner on the Dock",
    tier: "mid",
    waterfront: ["Waterfront restaurant", "Golden-hour patio", "Marina cocktail bar"],
    inland: ["Trendy neighborhood restaurant", "Rooftop cocktail bar"],
  },
  {
    name: "Sip & Stroll Vineyard Evening",
    tier: "mid",
    waterfront: ["Winery tasting", "Waterfront walk", "Sparkling rosé moment"],
    inland: ["Winery tasting", "Scenic overlook or rooftop"],
  },
  {
    name: "Sunset Cruise Cuties",
    tier: "mid",
    waterfront: ["Public sunset cruise", "Group photos on the bow", "Marina lounge"],
    inland: ["Rooftop bar", "Scenic overlook", "Lounge with skyline views"],
  },
  {
    name: "Bougie Picnic & Polaroids",
    tier: "mid",
    waterfront: ["Pre-ordered picnic basket", "Lakeside / riverfront setup", "Polaroids"],
    inland: ["Park picnic", "Polaroids"],
  },
  {
    name: "Girls Who Brunch at Night",
    tier: "mid",
    waterfront: ["Waterfront tapas", "Dessert on the pier", "Marina cocktails"],
    inland: ["Tapas restaurant", "Dessert café", "Rooftop cocktails"],
  },
  {
    name: "Game Night Out",
    tier: "mid",
    waterfront: ["Board-game café", "Riverwalk after", "Gelato by the water"],
    inland: ["Board-game café", "Dessert spot"],
  },
  {
    name: "Dance Floor Therapy",
    tier: "mid",
    waterfront: ["Pre-game", "Waterfront lounge with DJ", "Marina after-hours"],
    inland: ["Rooftop lounge", "Club"],
  },
  // ── High-end ($120–$400+) ──────────────────────────────────
  {
    name: "Yacht & Rosé Takeover",
    tier: "high",
    waterfront: ["2–3 hour yacht rental", "Rosé + charcuterie", "Dockside dinner"],
    inland: ["Luxury limo", "Rooftop dinner", "VIP lounge"],
  },
  {
    name: "Sunset Vineyard Supper",
    tier: "high",
    waterfront: [
      "Private winery tasting",
      "Chauffeured ride to waterfront",
      "Champagne on the pier",
    ],
    inland: ["Private winery tasting", "Chef's table dinner"],
  },
  {
    name: "Luxury Waterfront Supper Club",
    tier: "high",
    waterfront: ["Chef-driven waterfront restaurant", "Wine pairing", "Marina rooftop cocktails"],
    inland: ["High-end restaurant", "Speakeasy cocktails"],
  },
  {
    name: "Helicopter to the Winery",
    tier: "high",
    waterfront: ["Helicopter to winery", "Return flight over the water", "Waterfront nightcap"],
    inland: ["Helicopter to winery", "Rooftop nightcap"],
  },
  {
    name: "Rich Auntie Reset",
    tier: "high",
    waterfront: ["Spa day", "Blowout bar", "Waterfront dinner"],
    inland: ["Spa day", "Blowout bar", "Luxury restaurant"],
  },
  {
    name: "VIP City Takeover",
    tier: "high",
    waterfront: ["Penthouse pre-game", "Waterfront fine dining", "VIP marina club"],
    inland: ["Penthouse pre-game", "Luxury dinner", "VIP club"],
  },
  {
    name: "Champagne & Chill",
    tier: "high",
    waterfront: ["Private boat charter", "Champagne tasting", "Sunset cruise"],
    inland: ["Private limo", "Champagne tasting lounge"],
  },
  {
    name: "The Soft Life Experience",
    tier: "high",
    waterfront: ["Black car pickup", "Waterfront tasting menu", "Yacht nightcap"],
    inland: ["Black car pickup", "Chef tasting", "Rooftop nightcap"],
  },
];

/** Map a 1–4 budget tier to the preset bucket. */
export function tierForBudget(budget: 1 | 2 | 3 | 4): GirlsNightTier {
  if (budget <= 1) return "cheap";
  if (budget === 2) return "mid";
  return "high";
}

/** Build the prompt block the AI consumes for Girls Night occasions. */
export function buildGirlsNightPresetsPrompt(
  budget: 1 | 2 | 3 | 4,
  hasWaterfront: boolean,
): string {
  const tier = tierForBudget(budget);
  const presets = GIRLS_NIGHT_PRESETS.filter((p) => p.tier === tier);
  const lines = presets.map((p) => {
    const beats = (hasWaterfront ? p.waterfront : p.inland).join(" → ");
    return `  • "${p.name}" — ${beats}`;
  });
  return [
    "# Girls Night Preset Pool (Naming + Matching reference)",
    `Tier: ${tier} · Waterfront mode: ${hasWaterfront ? "ON" : "OFF"}`,
    "Treat these as on-brand reference flows. You may adopt a preset name verbatim when the venues genuinely match its beats, or remix beats across presets — never force-fit a name that doesn't match the actual stops.",
    ...lines,
    "",
    buildGirlsNightCulturalPrompt(),
  ].join("\n");
}

/**
 * Cultural framework appended to every Girls Night plan. Full spec at
 * docs/agents/confetti-girls-night-cultural-framework.md
 */
export function buildGirlsNightCulturalPrompt(): string {
  return [
    "# Girls Night — 4-step framework (apply on top of presets)",
    "",
    "Step 1 — Know the group. Read the taste graph. If 60%+ of music_taste / scene_keywords / cities cluster around one culture, treat as SHARED CULTURE. Otherwise MIXED.",
    "",
    "Step 2 — Pick the anchor:",
    "  • Food: shareable dinner.",
    "  • Music: playlist or live DJ.",
    "  • Activity: karaoke, dancing, lounge, bowling, paint-and-sip, comedy.",
    "",
    "Step 3 — Make it social-media friendly. Every plan must include: fit check, group photo, short video moment, dessert or late-night food.",
    "",
    "Step 4 — Final plan shape:",
    "  • SHARED CULTURE → cultural dinner + karaoke/dance/music lounge + dessert.",
    "  • MIXED → culture-swap dinner (each contributes one food/song/drink/outfit/tradition) + passport playlist (each adds 5 songs) + group-voted activity.",
    "",
    "Rules: never make one member represent a whole culture (default MIXED when unsure). Reflect the chosen branch in experienceTagline. Cultural anchor only REPLACES a beat when the venue genuinely covers it; otherwise ADD a stop.",
  ].join("\n");
}
