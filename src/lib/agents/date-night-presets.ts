/**
 * Date Night cultural framework prompt. Full spec at
 * docs/agents/confetti-date-night-cultural-framework.md
 */
export function buildDateNightCulturalPrompt(): string {
  return [
    "# Date Night — 4-step framework",
    "",
    "Step 1 — What kind of couple is it? If both partners share or signal a similar cultural background, take SHARED CULTURE. Otherwise MIXED (default when unsure — never assume).",
    "",
    "Step 2 — SHARED CULTURE anchor:",
    "  • Food from that culture.",
    "  • Music, dancing, comedy, art, or lounge tied to that culture.",
    "  • Dessert, tea, drinks, or walk to close.",
    "",
    "Step 3 — MIXED shared-exchange format:",
    "  • Person A picks dinner.",
    "  • Person B picks the activity.",
    "  • Both contribute songs for the ride / walk between stops.",
    "  • End with dessert or late-night drinks.",
    "",
    "Step 4 — Final plan shape:",
    "  • SHARED CULTURE → cultural dinner + romantic activity + dessert.",
    "  • MIXED → two-culture dinner/activity swap + dessert.",
    "",
    "Rules: always include a soft/romantic close (dessert, tea, walk, nightcap). Cultural anchor only REPLACES a beat when the venue genuinely covers it; otherwise ADD a stop. Reflect the branch in experienceTagline.",
  ].join("\n");
}
