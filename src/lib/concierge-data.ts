export const CUISINES = [
  "Ethiopian",
  "Thai",
  "Soul Food",
  "Japanese",
  "Mexican",
  "Italian",
  "Korean",
  "Vietnamese",
  "Indian",
  "Mediterranean",
  "Caribbean",
  "American",
] as const;

export const ACTIVITIES = [
  "Rooftop Bars",
  "Live Jazz",
  "Comedy Shows",
  "Wine Tastings",
  "Date Night",
  "Brunch",
  "Dance Clubs",
  "Sports",
  "Art Galleries",
  "Speakeasies",
  "Outdoor Patios",
  "Live Music",
] as const;

export type Mood = {
  id: string;
  label: string;
  blurb: string;
  gradient: string;
  emoji: string;
};

/**
 * Canonical vibe/mood vocabulary used by /create step 4 AND the concierge mood picker.
 * Keep this list and src/routes/create.tsx VIBES in sync — import from here.
 */
export const MOODS: Mood[] = [
  {
    id: "chill",
    label: "Chill",
    blurb: "Low-key, cozy, easy energy",
    gradient: "bg-gradient-cool",
    emoji: "🌿",
  },
  {
    id: "upscale",
    label: "Upscale",
    blurb: "Elevated, dressy, bottle service",
    gradient: "bg-gradient-gold",
    emoji: "🥂",
  },
  {
    id: "wild",
    label: "Wild",
    blurb: "Hype, dance floors, big energy",
    gradient: "bg-gradient-warm",
    emoji: "🔥",
  },
  {
    id: "adventurous",
    label: "Adventurous",
    blurb: "Try something you've never done",
    gradient: "bg-gradient-warm",
    emoji: "🧗",
  },
  {
    id: "romantic",
    label: "Romantic",
    blurb: "Candlelit, swoon-worthy, intimate",
    gradient: "bg-gradient-vibe",
    emoji: "🌹",
  },
  {
    id: "cultural",
    label: "Cultural",
    blurb: "Museums, jazz, theater, ideas",
    gradient: "bg-gradient-cool",
    emoji: "🎭",
  },
];

/** Lightweight projection used by the /create wizard step 4. */
export const VIBES = MOODS.map((m) => ({ id: m.id, label: m.label, emoji: m.emoji }));

export const TRENDING_PICKS = [
  { name: "Le Diplomate", category: "Date Night", neighborhood: "14th Street", emoji: "🍷" },
  { name: "Service Bar", category: "Cocktails", neighborhood: "U Street", emoji: "🍸" },
  { name: "Blues Alley", category: "Live Jazz", neighborhood: "Georgetown", emoji: "🎷" },
  { name: "The Roof at the Line", category: "Rooftop", neighborhood: "Adams Morgan", emoji: "🌆" },
];

export function levelFromXp(xp: number) {
  // 500 XP per level, capped at 50
  return Math.min(50, 1 + Math.floor(xp / 500));
}
export function xpToNextLevel(xp: number) {
  const level = levelFromXp(xp);
  const next = level * 500;
  return { current: xp - (level - 1) * 500, needed: 500, level, next };
}
export function rankName(level: number) {
  if (level >= 30) return "City Legend";
  if (level >= 20) return "City Insider";
  if (level >= 10) return "Local Pro";
  if (level >= 5) return "Explorer";
  return "Curious Newcomer";
}
