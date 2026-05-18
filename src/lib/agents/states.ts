// State / region → city clarification.
// When a user types a state instead of a city, we surface its supported cities
// so the planner can ask "which city in <state>?" before generating an itinerary.

import { CITIES, findCityLoose, type CityContext } from "./city-context";

export type StateMatch = {
  state: string;
  label: string;
  cities: CityContext[];
};

// Each entry maps the state key (lowercase) → display + supported city slugs.
const STATE_REGISTRY: Record<string, { label: string; citySlugs: string[]; aliases: string[] }> = {
  tennessee: {
    label: "Tennessee",
    citySlugs: ["nash", "mem", "knox", "chatt", "gat"],
    aliases: ["tn", "tenn"],
  },
  arizona: {
    label: "Arizona",
    citySlugs: ["phx"],
    aliases: ["az"],
  },
  texas: {
    label: "Texas",
    citySlugs: ["hou"],
    aliases: ["tx"],
  },
  california: {
    label: "California",
    citySlugs: ["la", "sf"],
    aliases: ["ca", "cali"],
  },
  florida: {
    label: "Florida",
    citySlugs: ["miami"],
    aliases: ["fl", "fla"],
  },
  georgia: {
    label: "Georgia",
    citySlugs: ["atl"],
    aliases: ["ga"],
  },
  illinois: {
    label: "Illinois",
    citySlugs: ["chi"],
    aliases: ["il"],
  },
  nevada: {
    label: "Nevada",
    citySlugs: ["vegas"],
    aliases: ["nv"],
  },
  washington: {
    label: "Washington",
    citySlugs: ["seattle"],
    aliases: ["wa"],
  },
  "new york": {
    label: "New York",
    citySlugs: ["nyc"],
    aliases: ["ny"],
  },
};

function lookupCities(slugs: string[]): CityContext[] {
  return slugs
    .map((s) => findCityLoose(s, null))
    .filter((c): c is CityContext => Boolean(c));
}

/** If `query` is a state (or state alias), returns its supported cities for clarification. */
export function matchState(query?: string | null): StateMatch | null {
  if (!query) return null;
  const q = query.toLowerCase().trim();
  for (const [key, entry] of Object.entries(STATE_REGISTRY)) {
    if (q === key || entry.aliases.includes(q)) {
      const cities = lookupCities(entry.citySlugs);
      if (cities.length === 0) continue;
      return { state: key, label: entry.label, cities };
    }
  }
  return null;
}

/** True if the query is a known city in our registry. */
export function isKnownCity(query?: string | null): boolean {
  if (!query) return false;
  const q = query.toLowerCase().trim();
  return CITIES.some(
    (c) => c.slug === q || c.city.toLowerCase() === q || c.label.toLowerCase() === q,
  );
}
