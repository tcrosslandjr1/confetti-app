/**
 * Confetti Discovery Feed — the 5 canonical rails shown on home / ideas.
 * Mirrors docs/agents/confetti-discovery-feed.md.
 */

export type DiscoveryRailId =
  | "similar-planners"
  | "open-groups"
  | "date-night-nearby"
  | "trending-city"
  | "vibe-matches";

export interface DiscoveryRail {
  id: DiscoveryRailId;
  title: string;
  subtitle: string;
  /** Sort/filter keys the feed agent uses to populate the rail. */
  sources: string[];
}

export const DISCOVERY_RAILS: DiscoveryRail[] = [
  {
    id: "similar-planners",
    title: "People planning similar nights",
    subtitle: "Match on occasion + vibe + city",
    sources: ["plans.occasion", "plans.vibe", "plans.city"],
  },
  {
    id: "open-groups",
    title: "Groups open to more people",
    subtitle: "Public plans with open seats",
    sources: ["plans.visibility=public", "invites.seats_open>0"],
  },
  {
    id: "date-night-nearby",
    title: "Date-night ideas nearby",
    subtitle: "Romantic vibe within ~10km",
    sources: ["plans.occasion=date-night", "geo.radius_km<=10"],
  },
  {
    id: "trending-city",
    title: "Trending plans in your city",
    subtitle: "Most saved/remixed this week",
    sources: ["plans.city", "metrics.saves_7d", "metrics.remixes_7d"],
  },
  {
    id: "vibe-matches",
    title: "Restaurants & events that match the vibe",
    subtitle: "Boosted venues + events tagged to your vibe",
    sources: ["venues.vibe_tags", "events.vibe_tags", "boost.active"],
  },
];
