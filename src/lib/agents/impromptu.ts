// Impromptu Ideas Agent — curated bonus-move pool per city.
// The model picks ONE move that fits the occasion + vibe, or returns null.
// Rules:
//  - within ~5 min walking from any stop
//  - matches the night's vibe
//  - open at the right time
//  - safe + on-brand
//  - never too far, too expensive, or off-vibe

export type ImpromptuMove = {
  name: string;
  /** When this move shines */
  goodFor: string[]; // occasion ids: girls, guys, date, fam, biz, bday, just
  /** Why it works — fed to the model as inspiration */
  reason: string;
  /** Rough walking-time hint shown in prompt */
  walkingMinutes: number;
};

export const IMPROMPTU_BY_CITY: Record<string, ImpromptuMove[]> = {
  dc: [
    { name: "Monument night walk", goodFor: ["date", "fam", "just"], reason: "lit-up Lincoln/WWII walk feels cinematic", walkingMinutes: 8 },
    { name: "Wharf pier stroll", goodFor: ["date", "girls", "fam"], reason: "string lights + water at The Wharf", walkingMinutes: 5 },
    { name: "Vinyl bar nightcap", goodFor: ["just", "date"], reason: "low-key DJ-adjacent finish in Shaw", walkingMinutes: 4 },
  ],
  vegas: [
    { name: "Quick blackjack stop", goodFor: ["guys", "bday", "just"], reason: "10-min table flight on the way out", walkingMinutes: 3 },
    { name: "Bellagio fountains", goodFor: ["date", "fam", "girls", "bday"], reason: "free, scenic, 5-min show on the half hour", walkingMinutes: 5 },
    { name: "Casino selfie stop", goodFor: ["girls", "bday"], reason: "neon backdrops at the Cosmo or Bellagio lobby", walkingMinutes: 4 },
  ],
  miami: [
    { name: "Brickell Key waterfront walk", goodFor: ["date", "fam", "just"], reason: "loop with skyline + breeze", walkingMinutes: 5 },
    { name: "Salsa drop-in at Ball & Chain", goodFor: ["girls", "date", "bday"], reason: "live Latin music + easy entry", walkingMinutes: 4 },
    { name: "Beachfront cocktail", goodFor: ["girls", "date", "bday"], reason: "sand-side nightcap on Ocean Drive", walkingMinutes: 5 },
  ],
  nyc: [
    { name: "Rooftop photo moment", goodFor: ["girls", "bday", "date"], reason: "skyline shot before the night ends", walkingMinutes: 4 },
    { name: "Speakeasy drop-in", goodFor: ["date", "just", "biz"], reason: "hidden door = on-brand reveal", walkingMinutes: 4 },
    { name: "Late-slice + walk", goodFor: ["guys", "just", "bday"], reason: "Joe's slice + 5-min walk feels very NY", walkingMinutes: 5 },
  ],
  seattle: [
    { name: "Sunset Pier 62 walk", goodFor: ["date", "fam", "just", "girls"], reason: "Elliott Bay views, free, 8-min loop", walkingMinutes: 5 },
    { name: "Great Wheel ride", goodFor: ["date", "fam", "bday"], reason: "harbor views in 12 min", walkingMinutes: 6 },
    { name: "Cozy nightcap at a vinyl bar", goodFor: ["just", "date"], reason: "Capitol Hill mood-finish", walkingMinutes: 4 },
  ],
  chi: [
    { name: "Riverwalk stroll", goodFor: ["date", "fam", "just"], reason: "lit-up bridges along the Chicago River", walkingMinutes: 5 },
    { name: "Comedy drop-in (Second City area)", goodFor: ["guys", "bday", "just"], reason: "late stand-up set", walkingMinutes: 5 },
    { name: "Lakefront skyline view", goodFor: ["date", "fam"], reason: "Adler Planetarium walk for the postcard shot", walkingMinutes: 7 },
  ],
  la: [
    { name: "Santa Monica pier sunset", goodFor: ["date", "fam", "girls"], reason: "ferris wheel + ocean", walkingMinutes: 5 },
    { name: "Late-night taco truck", goodFor: ["guys", "just", "bday"], reason: "iconic LA closer", walkingMinutes: 4 },
    { name: "Rooftop view of DTLA", goodFor: ["date", "girls", "bday"], reason: "skyline shot from Perch / Ace Hotel", walkingMinutes: 5 },
  ],
  sf: [
    { name: "Embarcadero waterfront walk", goodFor: ["date", "fam", "just"], reason: "Bay Bridge lights, breezy finish", walkingMinutes: 5 },
    { name: "Speakeasy drop-in", goodFor: ["date", "just", "biz"], reason: "hidden bars in the Tenderloin", walkingMinutes: 4 },
    { name: "Cable car ride", goodFor: ["fam", "date"], reason: "tourist-classic but undeniably fun", walkingMinutes: 4 },
  ],
  hou: [
    { name: "BeltLine-style patio hop", goodFor: ["girls", "guys", "just"], reason: "patios + breeze in Heights/Montrose", walkingMinutes: 4 },
    { name: "Rooftop skyline view (Midtown)", goodFor: ["date", "girls", "bday"], reason: "downtown shot before bed", walkingMinutes: 5 },
    { name: "Late-night taqueria", goodFor: ["guys", "just"], reason: "tacos al pastor closer", walkingMinutes: 4 },
  ],
  atl: [
    { name: "BeltLine night stroll", goodFor: ["date", "fam", "just", "girls"], reason: "lit murals + patio bars", walkingMinutes: 5 },
    { name: "Rooftop skyline view", goodFor: ["girls", "bday", "date"], reason: "Midtown rooftop nightcap", walkingMinutes: 5 },
    { name: "Edgewood late strip", goodFor: ["guys", "just", "bday"], reason: "block of bars within 2 min of each other", walkingMinutes: 3 },
  ],
};

/** Returns a short prompt-block describing this city's bonus-move pool. */
export function impromptuPoolPrompt(citySlug: string, occasionId?: string): string {
  const pool = IMPROMPTU_BY_CITY[citySlug] ?? [];
  const filtered = occasionId
    ? pool.filter((m) => m.goodFor.includes(occasionId))
    : pool;
  const final = filtered.length ? filtered : pool;
  if (!final.length) return "(no curated bonus moves — invent one only if it clearly fits the city's allowed activities)";
  return final
    .map((m) => `- ${m.name} (~${m.walkingMinutes}m walk) — ${m.reason}`)
    .join("\n");
}
