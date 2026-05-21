import { funSectors, FunSector } from "./funSectors";

const keywordMap: Array<{ keywords: string[]; sectorIds: string[] }> = [
  { keywords: ["food", "eat", "restaurant", "brunch", "dinner"], sectorIds: ["dining", "viral-eats"] },
  { keywords: ["drink", "bar", "club", "nightlife", "rooftop", "speakeasy"], sectorIds: ["drinks-nightlife", "adult-after-dark"] },
  { keywords: ["event", "events", "tonight", "ticket", "tickets", "music", "show", "comedy", "theater", "concert"], sectorIds: ["live-entertainment", "festivals-seasonal"] },
  { keywords: ["museum", "art", "gallery", "culture"], sectorIds: ["arts-culture"] },
  { keywords: ["immersive", "escape", "vr", "popup", "pop-up"], sectorIds: ["immersive-experiences"] },
  { keywords: ["outside", "outdoor", "hike", "park", "sunset"], sectorIds: ["outdoor-nature"] },
  { keywords: ["kids", "family", "children"], sectorIds: ["family-kids"] },
  { keywords: ["date", "romantic", "anniversary"], sectorIds: ["romantic-date-night", "dining", "drinks-nightlife"] },
  { keywords: ["golf", "mini golf", "putt", "driving range", "simulator", "simulators"], sectorIds: ["sports-recreation", "social-group-activities"] },
  { keywords: ["game", "games", "board game", "board games", "barcade", "arcade", "group", "friends", "crew", "karaoke", "trivia"], sectorIds: ["social-group-activities", "sports-recreation"] },
  { keywords: ["tiktok", "instagram", "viral", "creator"], sectorIds: ["viral-eats", "immersive-experiences", "drinks-nightlife"] },
  { keywords: ["luxury", "birthday", "celebrate", "special"], sectorIds: ["luxury-special-occasion"] },
  { keywords: ["class", "learn", "workshop"], sectorIds: ["learning-classes"] },
  { keywords: ["festival", "seasonal", "weekend", "this weekend", "happening", "happenings", "pop up", "pop-up"], sectorIds: ["festivals-seasonal"] },
  { keywords: ["tour", "explore", "landmark", "neighborhood"], sectorIds: ["local-exploration"] },
  { keywords: ["adult", "late", "after dark", "cigar", "burlesque"], sectorIds: ["adult-after-dark"] }
];

export function getAgentSectorContext() {
  return funSectors.map((sector) => ({
    id: sector.id,
    label: sector.label,
    description: sector.description,
    examples: sector.examples,
    vibes: sector.vibes
  }));
}

export function matchSectorsForPrompt(prompt: string, limit = 4): FunSector[] {
  const normalized = prompt.toLowerCase();
  const scores = new Map<string, number>();

  for (const rule of keywordMap) {
    const hits = rule.keywords.filter((keyword) => normalized.includes(keyword)).length;
    if (hits === 0) continue;
    for (const sectorId of rule.sectorIds) {
      scores.set(sectorId, (scores.get(sectorId) ?? 0) + hits);
    }
  }

  const ranked = [...scores.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([sectorId]) => funSectors.find((sector) => sector.id === sectorId))
    .filter((sector): sector is FunSector => Boolean(sector));

  return ranked.length ? ranked.slice(0, limit) : funSectors.slice(0, limit);
}

export function buildAgentReply(prompt: string) {
  const sectors = matchSectorsForPrompt(prompt);
  const sectorNames = sectors.map((sector) => sector.shortLabel).join(", ");
  const lead = sectors[0];

  return {
    sectors,
    text: `I’d scout this across ${sectorNames}. Start with ${lead.label.toLowerCase()} signals, then cross-check live hours, travel time, parking or valet, and whether the spot has social traction before building the plan.`
  };
}
