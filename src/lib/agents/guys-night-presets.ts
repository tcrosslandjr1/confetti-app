// Miami Guys Night / Bachelor Night experience pack.
// Surfaced to the Itinerary Concierge as a preset pool the Naming +
// Venue Matching agents can adopt or remix. Promo-safe: every step the
// model emits must set is_business_promo: false (enforced post-pipeline).

export type GuysNightTier = "mid" | "high";

export type GuysNightPreset = {
  name: string;
  tier: GuysNightTier;
  budget: string;
  vibes: string[];
  waterfrontCapable: boolean;
  groupSize: string;
  beats: string[];
  /** Steps gated behind opt-in toggles. */
  needs?: {
    yacht?: boolean;
    casino?: boolean;
    adultEntertainment?: boolean;
  };
};

export const MIAMI_GUYS_NIGHT_PRESETS: GuysNightPreset[] = [
  {
    name: "Boys on the Bay",
    tier: "high",
    budget: "$150–$350",
    vibes: ["yacht", "bachelor", "turn-up", "luxury", "waterfront", "instagrammy"],
    waterfrontCapable: true,
    groupSize: "4–12",
    needs: { yacht: true },
    beats: [
      "2:00 PM — Board private yacht on Biscayne Bay (2–3 hr, music + skyline views)",
      "5:00 PM — Dockside dinner on the Miami River",
      "7:30 PM — Brickell rooftop cocktails (skyline)",
      "10:00 PM — Miami nightclub (optional bottle service)",
      "2:00 AM — Late-night Cuban food",
    ],
  },
  {
    name: "High Rollers of Miami",
    tier: "high",
    budget: "$80–$200",
    vibes: ["casino", "bachelor", "luxury", "late-night", "turn-up"],
    waterfrontCapable: false,
    groupSize: "2–10",
    needs: { casino: true },
    beats: [
      "7:00 PM — Upscale dinner in Brickell or Miami Beach",
      "9:00 PM — Casino night (Hard Rock Hollywood / Magic City — blackjack, poker, slots)",
      "11:30 PM — Casino lounge or rooftop drinks",
      "1:00 AM — Optional club back in Miami",
    ],
  },
  {
    name: "Bachelor Madness",
    tier: "high",
    budget: "$120–$300",
    vibes: ["bachelor", "wild", "turn-up", "late-night", "luxury"],
    waterfrontCapable: true,
    groupSize: "4–12",
    needs: { adultEntertainment: true },
    beats: [
      "7:00 PM — Steakhouse dinner",
      "9:30 PM — Optional adult-entertainment venue (only if user opted in AND vibe is bachelor/wild/turn-up)",
      "12:00 AM — Miami nightclub (optional table/bottle service)",
      "3:00 AM — Late-night food",
    ],
  },
  {
    name: "Miami Heat Check",
    tier: "mid",
    budget: "$60–$120",
    vibes: ["day-party", "latin-vibes", "rooftop", "fun", "instagrammy"],
    waterfrontCapable: true,
    groupSize: "3–10",
    beats: [
      "1:00 PM — South Beach pool party",
      "4:00 PM — South Beach walk",
      "6:00 PM — Casual food hall or taco spot",
      "8:00 PM — Wynwood bar hop",
    ],
  },
  {
    name: "Gentlemen's Night Out",
    tier: "high",
    budget: "$80–$150",
    vibes: ["cigars", "whiskey", "lounges", "grown-man", "waterfront"],
    waterfrontCapable: true,
    groupSize: "2–8",
    beats: [
      "6:30 PM — Cigar lounge (Brickell or Little Havana)",
      "8:00 PM — Waterfront steakhouse or sushi dinner",
      "10:00 PM — Brickell whiskey lounge",
    ],
  },
  {
    name: "Adventure Bros",
    tier: "mid",
    budget: "$60–$120",
    vibes: ["adventure", "waterfront", "sports", "fun"],
    waterfrontCapable: true,
    groupSize: "2–8",
    beats: [
      "4:00 PM — Jet skis on Biscayne Bay",
      "6:00 PM — Wynwood brewery stop",
      "8:00 PM — Casual taco dinner",
      "9:30 PM — Wynwood nightlife",
    ],
  },
];

export type GuysNightOptions = {
  yacht?: boolean;
  casino?: boolean;
  adultEntertainment?: boolean;
  /** Free-form vibe label the user picked. */
  vibe?: string;
};

const ADULT_VIBE_TRIGGERS = ["bachelor", "wild", "turn", "late"];

function vibeAllowsAdult(vibe?: string): boolean {
  if (!vibe) return false;
  const v = vibe.toLowerCase();
  return ADULT_VIBE_TRIGGERS.some((t) => v.includes(t));
}

/** True when this guys-night pack applies (Miami + masc/group occasion). */
export function isMiamiGuysNight(city: string, occasionId?: string, vibe?: string): boolean {
  if (!/miami/i.test(city)) return false;
  const o = (occasionId ?? "").toLowerCase();
  const v = (vibe ?? "").toLowerCase();
  return (
    o.includes("guys") ||
    o.includes("bachelor") ||
    o.includes("friends") ||
    v.includes("guys") ||
    v.includes("bachelor") ||
    v.includes("yacht") ||
    v.includes("casino") ||
    v.includes("grown") ||
    v.includes("cigar") ||
    v.includes("whiskey") ||
    v.includes("adventure")
  );
}

/** Build the prompt block the AI consumes for Miami guys-night flows. */
export function buildMiamiGuysNightPrompt(opts: GuysNightOptions = {}): string {
  const adultAllowed = opts.adultEntertainment === true && vibeAllowsAdult(opts.vibe);

  const presets = MIAMI_GUYS_NIGHT_PRESETS.filter((p) => {
    if (p.needs?.yacht && !opts.yacht) return false;
    if (p.needs?.casino && !opts.casino) return false;
    if (p.needs?.adultEntertainment && !adultAllowed) return false;
    return true;
  });

  const lines = presets.map(
    (p) =>
      `  • "${p.name}" (${p.tier}, ${p.budget}, group ${p.groupSize}) — vibes: ${p.vibes.join(", ")}\n      ${p.beats.join(" → ")}`,
  );

  return [
    "# Miami Guys Night / Bachelor Pack (21+ assumed)",
    "Audience: adult men, group outings, bachelor parties. Assume all attendees are 21+.",
    "",
    "Hard rules:",
    "  • Strip-club / adult-entertainment stops are OPTIONAL and only allowed when the user has explicitly opted in AND vibe matches bachelor / wild / turn-up / late-night.",
    `  • Adult-entertainment allowed in this request: ${adultAllowed ? "YES" : "NO — do not include any adult-entertainment stop"}.`,
    `  • Yacht option allowed: ${opts.yacht ? "YES" : "NO — do not include yacht/boat charter stops"}.`,
    `  • Casino option allowed: ${opts.casino ? "YES — Hard Rock Hollywood, Magic City, Miccosukee are valid" : "NO — do not include casino stops"}.`,
    "  • For casino flows include subtle responsible-gambling language in the stop rationale (e.g. 'set a buffer', 'cash limit', 'play for fun').",
    "  • NEVER label any business as sponsored, promoted, paid, partner, ad, or featured. All stops must read as editorial picks.",
    "",
    "Waterfront logic for Miami: Biscayne Bay, Miami River, South Beach, dockside restaurants, jet skis, riverfront lounges, rooftop views over water. If waterfront is disabled, swap to Wynwood, Brickell, Design District, steakhouse, lounge, cigar, casino, or club steps.",
    "",
    presets.length
      ? "Preset pool (adopt verbatim when stops genuinely match, or remix beats — never force-fit):"
      : "No preset matches the active toggles — build a custom flow respecting the hard rules above.",
    ...lines,
  ].join("\n");
}
