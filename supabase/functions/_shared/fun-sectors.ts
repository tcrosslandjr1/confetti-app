export const funSectors = [
  { id: "dining", label: "Dining", examples: ["restaurants", "brunch", "food halls", "chef tables"] },
  { id: "drinks-nightlife", label: "Drinks & Nightlife", examples: ["cocktail bars", "rooftops", "speakeasies", "clubs"] },
  { id: "live-entertainment", label: "Live Entertainment", examples: ["concerts", "comedy", "theater", "jazz clubs", "ticketed events"] },
  { id: "arts-culture", label: "Arts & Culture", examples: ["museums", "galleries", "exhibits", "cultural centers"] },
  { id: "immersive-experiences", label: "Immersive Experiences", examples: ["pop-ups", "escape rooms", "VR", "interactive art"] },
  { id: "outdoor-nature", label: "Outdoor & Nature", examples: ["parks", "hikes", "waterfronts", "gardens"] },
  { id: "sports-recreation", label: "Sports & Recreation", examples: ["golf", "mini golf", "driving ranges", "golf simulators", "bowling", "skating", "pickleball", "arcades"] },
  { id: "wellness-relaxation", label: "Wellness & Relaxation", examples: ["spas", "saunas", "yoga", "sound baths"] },
  { id: "shopping-markets", label: "Shopping & Markets", examples: ["boutiques", "flea markets", "farmers markets", "vintage shops"] },
  { id: "family-kids", label: "Family & Kids", examples: ["playgrounds", "kids museums", "aquariums", "family events"] },
  { id: "romantic-date-night", label: "Romantic / Date Night", examples: ["wine bars", "sunset spots", "cozy lounges", "romantic restaurants"] },
  { id: "social-group-activities", label: "Social Group Activities", examples: ["game night", "board game cafes", "barcades", "karaoke", "trivia", "game bars", "paint and sip"] },
  { id: "viral-eats", label: "Foodie / Viral Eats", examples: ["viral desserts", "food trucks", "smash burgers", "birria"] },
  { id: "luxury-special-occasion", label: "Luxury & Special Occasion", examples: ["fine dining", "private rooms", "bottle service", "premium views"] },
  { id: "learning-classes", label: "Learning & Classes", examples: ["cooking classes", "pottery", "dance classes", "mixology"] },
  { id: "festivals-seasonal", label: "Festivals & Seasonal Events", examples: ["events", "holiday markets", "street fairs", "festivals", "seasonal pop-ups", "weekend happenings"] },
  { id: "local-exploration", label: "Travel-Lite Local Exploration", examples: ["landmarks", "neighborhood crawls", "tours", "day trips"] },
  { id: "adult-after-dark", label: "Adult / After-Dark Experiences", examples: ["cigar bars", "burlesque", "supper clubs", "late lounges"] }
];

export function getAgentSectorContext() {
  return {
    sectorCount: funSectors.length,
    instruction:
      "Classify every user outing request into one or more fun sectors, then choose venues and route timing that match the user's mood, group, budget, location, parking/valet needs, and social trend intent."
  };
}
