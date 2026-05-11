export type DishInfo = {
  description: string;
  allergens: string[];
  pairing: { name: string; type: "cocktail" | "wine" | "beer" | "non-alcoholic"; why: string };
  spice?: 0 | 1 | 2 | 3;
  kind?: "food" | "drink";
  vegetarian?: boolean;
  vegan?: boolean;
  glutenFree?: boolean;
  pescatarian?: boolean;
};

export const DISH_DB: Record<string, DishInfo> = {
  "Truffle rigatoni": {
    description: "Hand-rolled rigatoni in a black-truffle cream with aged parmesan.",
    allergens: ["wheat/gluten", "dairy", "eggs"],
    pairing: {
      name: "Sangiovese",
      type: "wine",
      why: "Bright acidity cuts the cream; earthy notes echo the truffle.",
    },
    kind: "food",
    vegetarian: true,
    pescatarian: true,
  },
  "Spicy tuna crispy rice": {
    description: "Seared sushi rice cakes topped with chili-marinated tuna and serrano.",
    allergens: ["soy", "sesame", "fish"],
    pairing: {
      name: "Junmai sake, chilled",
      type: "wine",
      why: "Cool umami balances the heat without flattening the tuna.",
    },
    spice: 2,
    kind: "food",
    pescatarian: true,
    glutenFree: true,
  },
  "Wood-fired margherita": {
    description: "San Marzano, fior di latte, basil, on a 60-second leopard-spotted crust.",
    allergens: ["wheat/gluten", "dairy"],
    pairing: {
      name: "Negroni Sbagliato",
      type: "cocktail",
      why: "Bittersweet bubbles cleanse mozzarella richness.",
    },
    kind: "food",
    vegetarian: true,
    pescatarian: true,
  },
  "Wagyu sliders": {
    description: "Mini A5 wagyu burgers, smoked aioli, brioche.",
    allergens: ["wheat/gluten", "dairy", "eggs"],
    pairing: {
      name: "Old Fashioned",
      type: "cocktail",
      why: "Bourbon char + orange oil amplify the beef.",
    },
    kind: "food",
  },
  "Charred octopus": {
    description: "Wood-grilled tentacle, smoked paprika, lemon, fingerling potatoes.",
    allergens: ["shellfish"],
    pairing: {
      name: "Albariño",
      type: "wine",
      why: "Salinity and citrus mirror the char and lemon.",
    },
    kind: "food",
    pescatarian: true,
    glutenFree: true,
  },
  "Burrata + peaches": {
    description: "Stracciatella-filled burrata, grilled stone fruit, basil oil, flaky salt.",
    allergens: ["dairy"],
    pairing: {
      name: "Dry rosé",
      type: "wine",
      why: "Strawberry notes meet peach without overpowering the cream.",
    },
    kind: "food",
    vegetarian: true,
    pescatarian: true,
    glutenFree: true,
  },
  "Short rib tacos": {
    description: "Braised short rib, charred salsa verde, pickled onion, blue corn tortilla.",
    allergens: [],
    pairing: {
      name: "Mezcal Paloma",
      type: "cocktail",
      why: "Smoke and grapefruit lift the braise.",
    },
    spice: 1,
    kind: "food",
    glutenFree: true,
  },
  "Hand-cut pappardelle": {
    description: "Wide ribbons in slow-braised lamb ragù with pecorino.",
    allergens: ["wheat/gluten", "dairy", "eggs"],
    pairing: {
      name: "Barbera d'Alba",
      type: "wine",
      why: "Bright cherry and low tannin keep the ragù alive.",
    },
    kind: "food",
  },
  "Yuzu old fashioned": {
    description: "Bourbon, yuzu marmalade, aromatic bitters, expressed citrus.",
    allergens: [],
    pairing: {
      name: "Crispy duck rolls",
      type: "non-alcoholic",
      why: "Citrus oils slice through the duck fat.",
    },
    kind: "drink",
    vegetarian: true,
    vegan: true,
    pescatarian: true,
    glutenFree: true,
  },
  "Espresso martini": {
    description: "Vodka, fresh espresso, coffee liqueur, vanilla foam.",
    allergens: ["dairy"],
    pairing: {
      name: "Chocolate olive oil cake",
      type: "non-alcoholic",
      why: "Roast coffee deepens the cocoa.",
    },
    kind: "drink",
    vegetarian: true,
    pescatarian: true,
    glutenFree: true,
  },
  "Smoked negroni": {
    description: "Gin, Campari, sweet vermouth — finished under applewood smoke.",
    allergens: [],
    pairing: {
      name: "Bone marrow toast",
      type: "non-alcoholic",
      why: "Smoke and bitterness cut the marrow's richness.",
    },
    kind: "drink",
    vegetarian: true,
    vegan: true,
    pescatarian: true,
    glutenFree: true,
  },
  "Lychee martini": {
    description: "Vodka, lychee, dry vermouth, citrus mist.",
    allergens: [],
    pairing: {
      name: "Hamachi crudo",
      type: "non-alcoholic",
      why: "Floral lychee elevates the fish's clean finish.",
    },
    kind: "drink",
    vegetarian: true,
    vegan: true,
    pescatarian: true,
    glutenFree: true,
  },
  "Bone marrow toast": {
    description: "Roasted marrow, sourdough, parsley-caper salsa, sea salt.",
    allergens: ["wheat/gluten"],
    pairing: {
      name: "Smoked Negroni",
      type: "cocktail",
      why: "Bitter botanicals balance the unctuous marrow.",
    },
    kind: "food",
  },
  "Crispy duck rolls": {
    description: "Five-spice duck, scallion, hoisin, in shatteringly thin rolls.",
    allergens: ["wheat/gluten", "soy", "sesame"],
    pairing: {
      name: "Riesling, off-dry",
      type: "wine",
      why: "Touch of sweetness tames the spice and salt.",
    },
    spice: 1,
    kind: "food",
  },
  "Hamachi crudo": {
    description: "Yellowtail sashimi, ponzu, jalapeño, micro-cilantro, olive oil.",
    allergens: ["fish", "soy"],
    pairing: {
      name: "Champagne brut",
      type: "wine",
      why: "High-acid bubbles refresh between bites.",
    },
    spice: 1,
    kind: "food",
    pescatarian: true,
    glutenFree: true,
  },
  "Chocolate olive oil cake": {
    description: "Dense, fudgy single-origin chocolate cake with flaky salt and olive oil.",
    allergens: ["wheat/gluten", "eggs", "dairy"],
    pairing: {
      name: "Tawny Port",
      type: "wine",
      why: "Caramel and nut notes lock onto dark chocolate.",
    },
    kind: "food",
    vegetarian: true,
    pescatarian: true,
  },
};

export const ALL_DISH_NAMES = Object.keys(DISH_DB);

export function getDishInfo(name: string): DishInfo {
  return (
    DISH_DB[name] ?? {
      description:
        "A house specialty crafted in-house — ask your server for tonight's preparation.",
      allergens: [],
      pairing: {
        name: "Bartender's choice",
        type: "cocktail",
        why: "Tell them what you love — they'll match it.",
      },
    }
  );
}

export type DietFilter = {
  vegetarian?: boolean;
  vegan?: boolean;
  glutenFree?: boolean;
  pescatarian?: boolean;
  avoidAllergens?: string[];
};

export function dishMatches(name: string, opts: DietFilter): boolean {
  const info = DISH_DB[name];
  if (!info) return true;
  if (opts.vegan && !info.vegan) return false;
  if (opts.vegetarian && !info.vegetarian && !info.vegan) return false;
  if (opts.pescatarian && !info.vegetarian && !info.vegan && !info.pescatarian) return false;
  if (opts.glutenFree && !info.glutenFree) return false;
  if (opts.avoidAllergens && opts.avoidAllergens.length > 0) {
    const lower = info.allergens.map((a) => a.toLowerCase());
    if (opts.avoidAllergens.some((a) => lower.includes(a.toLowerCase()))) return false;
  }
  return true;
}
