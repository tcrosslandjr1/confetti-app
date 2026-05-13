// City Context Agent — static seed tags & allowed activity types per city.
// Used to constrain venue selection and prompt the model with city-aware vocabulary.

export type CityContext = {
  /** Canonical city name as stored in viral_venues.city */
  city: string;
  /** Slug used by clients */
  slug: string;
  /** Short label shown in UI */
  label: string;
  /** High-level environment tags */
  tags: string[];
  /** Allowed activity types — model is asked to prefer these */
  allowedActivities: string[];
  /** Things to avoid suggesting in this city (negative examples) */
  avoid?: string[];
  /** Optional default neighborhoods worth seeding into prompts */
  signatureNeighborhoods?: string[];
};

export const CITIES: CityContext[] = [
  {
    city: "Washington DC",
    slug: "dc",
    label: "Washington DC",
    tags: ["waterfront", "rooftops", "speakeasies", "live music", "monuments"],
    allowedActivities: [
      "rooftop bars",
      "wine bars",
      "small plates",
      "vinyl bars",
      "live jazz",
      "speakeasies",
      "waterfront dining",
      "comedy clubs",
    ],
    signatureNeighborhoods: ["Shaw", "U Street", "The Wharf", "H Street", "Georgetown"],
  },
  {
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
    ],
    avoid: ["beach bars"],
    signatureNeighborhoods: ["The Strip", "Fremont East", "Downtown", "Arts District"],
  },
  {
    city: "Miami",
    slug: "miami",
    label: "Miami",
    tags: ["beach clubs", "waterfront", "Latin music", "rooftops", "art deco"],
    allowedActivities: [
      "beach clubs",
      "waterfront dinners",
      "boat rides",
      "Latin music spots",
      "rooftop lounges",
      "late-night cafés",
    ],
    signatureNeighborhoods: ["South Beach", "Wynwood", "Brickell", "Little Havana"],
  },
  {
    city: "New York",
    slug: "nyc",
    label: "New York City",
    tags: ["theater district", "rooftops", "speakeasies", "live music", "late-night food"],
    allowedActivities: [
      "rooftop bars",
      "speakeasies",
      "broadway shows",
      "comedy clubs",
      "late-night dining",
      "jazz clubs",
      "wine bars",
    ],
    signatureNeighborhoods: ["West Village", "LES", "Williamsburg", "Midtown", "Harlem"],
  },
  {
    city: "Seattle",
    slug: "seattle",
    label: "Seattle",
    tags: ["harbor", "piers", "indie music", "cozy bars", "coffee culture"],
    allowedActivities: [
      "harbor cruises",
      "piers",
      "cozy cocktail bars",
      "live indie music",
      "wine bars",
      "small plates",
    ],
    avoid: ["pool clubs"],
    signatureNeighborhoods: ["Capitol Hill", "Belltown", "Ballard", "Pioneer Square"],
  },
  {
    city: "Chicago",
    slug: "chi",
    label: "Chicago",
    tags: ["lakefront", "theater district", "speakeasies", "deep-dish", "blues"],
    allowedActivities: [
      "rooftop bars",
      "speakeasies",
      "blues clubs",
      "comedy clubs",
      "lakefront walks",
      "deep-dish dining",
    ],
    signatureNeighborhoods: ["Wicker Park", "River North", "Logan Square", "West Loop"],
  },
];

export function findCity(query?: string | null): CityContext {
  if (!query) return CITIES[0];
  const q = query.toLowerCase().trim();
  return (
    CITIES.find((c) => c.slug === q || c.city.toLowerCase() === q || c.label.toLowerCase() === q) ??
    CITIES[0]
  );
}
