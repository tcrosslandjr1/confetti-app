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
    "Step 3 — Shared-exchange format (MIXED branch):",
    "  • Person A picks the food.",
    "  • Person B picks the activity.",
    "  • Both add 5 songs to the date-night playlist.",
    "  • End somewhere cozy for dessert or tea.",
    "",
    "Step 4 — Final plan shape:",
    "  • SHARED CULTURE → cultural dinner + romantic activity + cozy close.",
    "  • MIXED → two-culture dinner/activity swap + cozy close.",
    "",
    "Example timeline: 7:00 shareable dinner → 8:30 activity (karaoke, dancing, comedy, art gallery, bowling, or lounge) → 10:00 cozy dessert/tea/drinks/scenic walk → 10:30 photo or memory moment before heading home.",
    "",
    "Rules: always include a soft/romantic close (dessert, tea, walk, nightcap). Cultural anchor only REPLACES a beat when the venue genuinely covers it; otherwise ADD a stop. Reflect the branch in experienceTagline.",
  ].join("\n");
}
