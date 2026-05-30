import type { AnchorCategory } from "./venue-anchors";

export interface TemplateStop {
  slot: "dinner" | "activity" | "nightcap";
  label: string;
  category: AnchorCategory | "moment";
  anchorOptions: string[];
  swapEligible?: boolean;
}

export const DATE_NIGHT_TEMPLATE: TemplateStop[] = [
  {
    slot: "dinner",
    label: "Dinner",
    category: "food",
    anchorOptions: ["seafood-crab", "steakhouse", "tacos-tapas", "kbbq-hotpot", "sushi"],
  },
  {
    slot: "activity",
    label: "Activity",
    category: "social",
    anchorOptions: [
      "lounge",
      "hookah-lounge",
      "casino-night",
      "live-music",
      "comedy-show",
      "dance-club",
    ],
    swapEligible: true,
  },
  {
    slot: "nightcap",
    label: "Dessert, tea, drinks, or scenic walk",
    category: "moment",
    anchorOptions: ["dessert", "tea-house", "cocktail-bar", "scenic-walk"],
    swapEligible: true,
  },
];
