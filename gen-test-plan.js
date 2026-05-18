const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, PageNumber, AlignmentType, HeadingLevel,
  BorderStyle, WidthType, ShadingType, LevelFormat,
} = require("docx");
const fs = require("fs");

// ── Styles ───────────────────────────────────────────
const CELL_BORDER = { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" };
const CELL_BORDERS = { top: CELL_BORDER, bottom: CELL_BORDER, left: CELL_BORDER, right: CELL_BORDER };

function hCell(text, fill = "F5EBE0") {
  return new TableCell({
    borders: CELL_BORDERS,
    width: { size: 2340, type: WidthType.DXA },
    shading: { fill, type: ShadingType.CLEAR },
    margins: { top: 60, bottom: 60, left: 100, right: 100 },
    children: [new Paragraph({ children: [new TextRun({ text, bold: true, size: 20 })] })],
  });
}

function vCell(text, width = 7020) {
  return new TableCell({
    borders: CELL_BORDERS,
    width: { size: width, type: WidthType.DXA },
    margins: { top: 60, bottom: 60, left: 100, right: 100 },
    children: [new Paragraph({ children: [new TextRun({ text, size: 20 })] })],
  });
}

function fieldRow(label, value) {
  return new TableRow({
    children: [hCell(label), vCell(value)],
  });
}

// ── Section helpers ─────────────────────────────────
function sectionHeader(title) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 360, after: 180 },
    children: [new TextRun({ text: title, bold: true, size: 32 })],
  });
}

function testTable(test) {
  return new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [2340, 7020],
    rows: [
      fieldRow("Test ID", test.id),
      fieldRow("Test Name", test.name),
      fieldRow("Preconditions", test.preconditions),
      fieldRow("Steps", test.steps),
      fieldRow("Expected", test.expected),
      fieldRow("Pass / Fail", "__________"),
      fieldRow("Notes", ""),
    ],
  });
}

function gap() {
  return new Paragraph({ spacing: { after: 240 }, children: [] });
}

// ── Test data ──────────────────────────────────────
const SUITES = [
  {
    title: "1. Onboarding Flow",
    tests: [
      {
        id: "ONB-01",
        name: "First-time user onboarding",
        preconditions: "User is new; no personalization profile exists.",
        steps: "1. Open app. 2. Choose city. 3. Choose vibe. 4. Choose category. 5. Choose budget. 6. Choose group size. 7. Choose tone/personality. 8. Confirm personalization is empty.",
        expected: "Smooth onboarding completes. First itinerary generates successfully. No prior preferences are applied.",
      },
      {
        id: "ONB-02",
        name: "Returning user defaults",
        preconditions: "User has existing profile with saved preferences.",
        steps: "1. Open app. 2. Observe pre-filled vibe, budget, city, and tone. 3. Edit or reset preferences.",
        expected: "Returning user sees smarter defaults. User can edit or reset preferences.",
      },
    ],
  },
  {
    title: "2. Vibe Engine",
    tests: [
      "Chill", "Turn Up", "Soft Life", "Instagrammy", "Adventurous", "Romantic", "Local",
      "Family", "In-Laws", "Bachelor", "Bachelorette", "Brunch Baddies", "Luxury", "Wild", "Classy",
    ].map((v, i) => ({
      id: `VIB-${String(i + 1).padStart(2, "0")}`,
      name: `Vibe: ${v}`,
      preconditions: `City and group selected.`,
      steps: `1. Select "${v}" vibe. 2. Generate itinerary.`,
      expected: `Vibe maps to correct categories, step templates, tone, and safety filters. Steps match "${v}" energy level.`,
    })),
  },
  {
    title: "3. Category Engine",
    tests: [
      "Brunch Baddies", "Girls Night", "Guys Night", "Spa Day", "Adventure", "Local Gems",
      "Date Night", "Yacht Day", "Rage Room", "Shopping Day", "In-Laws Night", "Family Night",
      "Casino Night", "Gun Range", "Museum Day", "Breakfast Outing",
    ].map((c, i) => ({
      id: `CAT-${String(i + 1).padStart(2, "0")}`,
      name: `Category: ${c}`,
      preconditions: `City and vibe selected.`,
      steps: `1. Select "${c}" category. 2. Generate itinerary.`,
      expected: `Correct category template loads. Generated steps match "${c}". Safety and time-of-day rules apply.`,
    })),
  },
  {
    title: "4. City Engine",
    tests: [
      "Miami", "NYC", "LA", "Las Vegas", "Nashville", "DC",
      "Chicago", "Memphis", "Knoxville", "Chattanooga", "Gatlinburg",
    ].map((c, i) => ({
      id: `CIT-${String(i + 1).padStart(2, "0")}`,
      name: `City: ${c}`,
      preconditions: `App loaded.`,
      steps: `1. Select "${c}". 2. Generate itinerary.`,
      expected: `City-specific neighborhoods, local flavor, waterfront/scenic logic, and venue styles appear.`,
    })),
  },
  {
    title: "5. Itinerary Generation",
    tests: [
      { id: "ITN-01", name: "3-step itinerary", preconditions: "City, vibe, category selected.", steps: "Generate with 3 stops.", expected: "3 ordered steps with realistic timing, geography, and pacing." },
      { id: "ITN-02", name: "5-step itinerary", preconditions: "City, vibe, category selected.", steps: "Generate with 5 stops.", expected: "5 ordered steps with realistic timing and transitions." },
      { id: "ITN-03", name: "8-step itinerary", preconditions: "City, vibe, category selected.", steps: "Generate with 8 stops.", expected: "8 ordered steps; no overlap; sensible pacing." },
      { id: "ITN-04", name: "Morning itinerary", preconditions: "Time-of-day = morning.", steps: "Generate itinerary.", expected: "Breakfast, coffee, hikes, wellness, markets appear." },
      { id: "ITN-05", name: "Brunch itinerary", preconditions: "Time-of-day = brunch.", steps: "Generate itinerary.", expected: "Brunch, mimosas, shopping, photos. Day party optional." },
      { id: "ITN-06", name: "Afternoon itinerary", preconditions: "Time-of-day = afternoon.", steps: "Generate itinerary.", expected: "Museums, shopping, activities, sightseeing appear." },
      { id: "ITN-07", name: "Evening itinerary", preconditions: "Time-of-day = evening.", steps: "Generate itinerary.", expected: "Dinner, rooftop, show, dessert appear." },
      { id: "ITN-08", name: "Late-night itinerary", preconditions: "Time-of-day = late-night.", steps: "Generate itinerary.", expected: "Clubs, lounges, casino, late-night food appear." },
      { id: "ITN-09", name: "All-day itinerary", preconditions: "Time-of-day = all-day.", steps: "Generate itinerary.", expected: "5–7 stops with breaks across morning → night." },
    ],
  },
  {
    title: "6. Name Generator",
    tests: [
      { id: "NAM-01", name: "Name generation", preconditions: "Itinerary generated.", steps: "Trigger name generation.", expected: "5–15 names generated." },
      { id: "NAM-02", name: "Name rating & top names", preconditions: "Names generated.", steps: "Review top 1–3 names.", expected: "Top 1–3 names displayed. Names are 2–4 words." },
      { id: "NAM-03", name: "Name selection", preconditions: "Names generated.", steps: "Select a name.", expected: "Selected name persists on saved itinerary." },
      { id: "NAM-04", name: "Name swap", preconditions: "Name selected.", steps: "Tap Swap Name.", expected: "Fresh batch of names generated." },
      { id: "NAM-05", name: "Manual rename", preconditions: "Itinerary saved.", steps: "Type custom name and save.", expected: "Custom name saved and displayed." },
    ],
  },
  {
    title: "7. Booking Engine — Partner Tiers",
    tests: [
      { id: "BOK-00", name: "Tier 0 — Non-Partner", preconditions: "Venue has no partner agreement.", steps: "Open venue page.", expected: "No direct booking. No order-ahead. Shows Call, Website, Directions. Message: 'Direct booking is not available for this venue yet.'" },
      { id: "BOK-01", name: "Tier 1 — Basic Partner", preconditions: "Venue is Tier 1 partner.", steps: "Open venue page.", expected: "Shows external Reserve Table. Shows external Order Ahead. Shows View Specials. Links open external partner systems." },
      { id: "BOK-02", name: "Tier 2 — Premium Partner", preconditions: "Venue is Tier 2 partner.", steps: "Open venue page → Book Now / Order Ahead / View Menu / Check Availability.", expected: "In-app booking works. In-app order-ahead works. Menu loads. Payment flow works." },
      { id: "BOK-03", name: "Tier 3 — Enterprise Partner", preconditions: "Venue is Tier 3 partner.", steps: "Open venue page → Instant Reservation / Live Wait Time / Live Inventory.", expected: "Instant confirmation works. Live inventory and wait times appear. Supports enterprise/multi-location behavior." },
    ],
  },
  {
    title: "8. Order-Ahead Flow",
    tests: [
      { id: "ORD-01", name: "View menu", preconditions: "Venue is Tier 2+ partner with menu.", steps: "Tap View Menu.", expected: "Menu items load with prices and descriptions." },
      { id: "ORD-02", name: "Add items", preconditions: "Menu visible.", steps: "Tap + on 2+ items.", expected: "Items appear in cart. Total updates." },
      { id: "ORD-03", name: "Remove items", preconditions: "Items in cart.", steps: "Tap – on an item.", expected: "Item removed. Total updates." },
      { id: "ORD-04", name: "Update quantity", preconditions: "Item in cart.", steps: "Change quantity spinner.", expected: "Quantity and total update correctly." },
      { id: "ORD-05", name: "Add notes", preconditions: "Item in cart.", steps: "Add special request notes.", expected: "Notes persist with item." },
      { id: "ORD-06", name: "Submit order + payment success", preconditions: "Cart ready. Card on file.", steps: "Tap Submit → payment succeeds.", expected: "Order placed. Confirmation shown." },
      { id: "ORD-07", name: "Payment failure handling", preconditions: "Cart ready.", steps: "Trigger failed payment (decline card / insufficient funds).", expected: "Graceful error shown. Cart preserved. User can retry." },
      { id: "ORD-08", name: "Order status updates", preconditions: "Order placed successfully.", steps: "Wait for status updates.", expected: "Status moves: placed → accepted → preparing → ready → completed." },
    ],
  },
  {
    title: "9. Group Flow",
    tests: [
      { id: "GRP-01", name: "Invite group", preconditions: "Itinerary saved.", steps: "Tap Share → send invite link.", expected: "Invite link generated and sent." },
      { id: "GRP-02", name: "Open shared itinerary", preconditions: "Invite link received.", steps: "Open link as another user.", expected: "Group members can view shared itinerary." },
      { id: "GRP-03", name: "Vote on steps", preconditions: "Shared itinerary open.", steps: "Vote thumbs up/down on steps.", expected: "Votes save correctly." },
      { id: "GRP-04", name: "Approve final itinerary", preconditions: "Voting complete.", steps: "Host approves final plan.", expected: "Final itinerary reflects group decisions." },
      { id: "GRP-05", name: "Group chat/comments", preconditions: "Shared itinerary open.", steps: "Leave comment on a step.", expected: "Comment appears for all group members." },
      { id: "GRP-06", name: "Group reminders", preconditions: "Itinerary finalized with time.", steps: "Wait for reminder trigger time.", expected: "Reminders trigger correctly (push / email)." },
      { id: "GRP-07", name: "Group payments", preconditions: "Feature enabled.", steps: "Split bill or collect per-person.", expected: "Payments process correctly if supported." },
    ],
  },
  {
    title: "10. Weather Engine",
    tests: [
      { id: "WEA-01", name: "Rain", preconditions: "Forecast shows ≥60% precip.", steps: "Generate itinerary.", expected: "Outdoor steps swap to indoor or safer alternatives. Weather notes appear." },
      { id: "WEA-02", name: "Heat", preconditions: "Forecast shows ≥90°F.", steps: "Generate itinerary.", expected: "Daytime outdoor steps pivot to AC/indoor. Brunch patios → indoor." },
      { id: "WEA-03", name: "Cold", preconditions: "Forecast shows ≤45°F.", steps: "Generate itinerary.", expected: "Rooftops → cozy lounges. Waterfront walks → dessert café or jazz lounge." },
      { id: "WEA-04", name: "Storm", preconditions: "Severe weather alert active.", steps: "Generate itinerary.", expected: "Yacht, rooftop, beach, hikes, and patio steps get appropriate fallbacks." },
      { id: "WEA-05", name: "Wind", preconditions: "High wind advisory.", steps: "Generate itinerary.", expected: "Waterfront/exposed outdoor steps receive safer alternatives." },
      { id: "WEA-06", name: "Clear", preconditions: "No adverse weather.", steps: "Generate itinerary.", expected: "Weather notes indicate conditions are favorable. No unnecessary indoor pivots." },
    ],
  },
  {
    title: "11. Safety Engine",
    tests: [
      { id: "SAF-01", name: "Solo woman", preconditions: "Group = 1, safety = solo_women.", steps: "Generate itinerary.", expected: "Solo-safe, walkable, well-lit, easy rideshare." },
      { id: "SAF-02", name: "In-Laws", preconditions: "Safety = in_laws.", steps: "Generate itinerary.", expected: "Calm, classy, conversation-friendly. NO clubs, strip clubs, dive bars." },
      { id: "SAF-03", name: "Family", preconditions: "Safety = family.", steps: "Generate itinerary.", expected: "All-ages safe. NO adult venues. Daytime-friendly." },
      { id: "SAF-04", name: "Older group", preconditions: "Safety = older_group.", steps: "Generate itinerary.", expected: "Accessible, lower intensity, conversation-friendly." },
      { id: "SAF-05", name: "Conservative group", preconditions: "Safety = conservative.", steps: "Generate itinerary.", expected: "Appropriate, low-risk, no adult entertainment." },
      { id: "SAF-06", name: "First date", preconditions: "Safety = first_date.", steps: "Generate itinerary.", expected: "Conversation > chaos. Intimate, low-pressure venues." },
      { id: "SAF-07", name: "Coworkers", preconditions: "Safety = coworkers.", steps: "Generate itinerary.", expected: "Professional, low-risk, not too intimate. Conversation-friendly noise." },
    ],
  },
  {
    title: "12. Time-of-Day Engine",
    tests: [
      { id: "TOD-01", name: "Sunrise", preconditions: "Time = sunrise.", steps: "Generate itinerary.", expected: "Coffee, hikes, breakfast, wellness, sunrise photo spot." },
      { id: "TOD-02", name: "Morning", preconditions: "Time = morning.", steps: "Generate itinerary.", expected: "Breakfast, coffee, hikes, wellness, markets." },
      { id: "TOD-03", name: "Brunch", preconditions: "Time = brunch.", steps: "Generate itinerary.", expected: "Brunch, mimosas, shopping, photos. Day party optional." },
      { id: "TOD-04", name: "Afternoon", preconditions: "Time = afternoon.", steps: "Generate itinerary.", expected: "Museums, shopping, activities, sightseeing." },
      { id: "TOD-05", name: "After-work", preconditions: "Time = after_work.", steps: "Generate itinerary.", expected: "Dinner, wine bar, lounge, one light activity." },
      { id: "TOD-06", name: "Evening", preconditions: "Time = evening.", steps: "Generate itinerary.", expected: "Dinner, rooftop, show, dessert." },
      { id: "TOD-07", name: "Late-night", preconditions: "Time = late_night.", steps: "Generate itinerary.", expected: "Clubs, lounges, casino, late-night food." },
      { id: "TOD-08", name: "All-day", preconditions: "Time = all_day.", steps: "Generate itinerary.", expected: "5–7 stops with breaks across morning → night." },
    ],
  },
  {
    title: "13. Swap Engine",
    tests: [
      { id: "SWP-01", name: "Swap step", preconditions: "Itinerary saved.", steps: "Tap Swap on one step.", expected: "Single step regenerates. Other steps stable." },
      { id: "SWP-02", name: "Swap vibe", preconditions: "Itinerary saved.", steps: "Change vibe and regenerate.", expected: "Itinerary adapts to new vibe. Costs and names update." },
      { id: "SWP-03", name: "Swap category", preconditions: "Itinerary saved.", steps: "Change category and regenerate.", expected: "Steps match new category. Safety/time rules reapply." },
      { id: "SWP-04", name: "Swap name", preconditions: "Name selected.", steps: "Tap Swap Name.", expected: "Fresh batch generated. Saved itinerary updates." },
      { id: "SWP-05", name: "Swap budget", preconditions: "Itinerary saved.", steps: "Adjust budget slider and regenerate.", expected: "Steps rebalance to new budget tier." },
      { id: "SWP-06", name: "Swap waterfront/scenic mode", preconditions: "Itinerary saved.", steps: "Toggle waterfront preference.", expected: "Steps pivot to waterfront or away." },
      { id: "SWP-07", name: "Swap cheaper", preconditions: "Itinerary saved.", steps: "Request cheaper alternatives.", expected: "Same-vibe, lower-cost options appear." },
      { id: "SWP-08", name: "Upgrade this step", preconditions: "Itinerary saved.", steps: "Tap Upgrade on one step.", expected: "Premium version of same type appears." },
      { id: "SWP-09", name: "Rain-proof itinerary", preconditions: "Itinerary saved; rain forecast.", steps: "Tap Rain-proof.", expected: "Outdoor steps swap to covered/indoor." },
      { id: "SWP-10", name: "Make it safer", preconditions: "Itinerary saved.", steps: "Tap Make Safer.", expected: "Unsafe steps replaced. Well-lit, calmer alternatives appear." },
      { id: "SWP-11", name: "Make it more local", preconditions: "Itinerary saved.", steps: "Tap More Local.", expected: "Steps pivot toward local gems and neighborhoods." },
    ],
  },
  {
    title: "14. Save & Share",
    tests: [
      { id: "SSV-01", name: "Save itinerary", preconditions: "Itinerary generated.", steps: "Tap Save.", expected: "Itinerary persists with all metadata." },
      { id: "SSV-02", name: "Save name", preconditions: "Name selected.", steps: "Save with selected name.", expected: "Name persists on saved itinerary." },
      { id: "SSV-03", name: "Save vibe + city + budget", preconditions: "Itinerary generated.", steps: "Save.", expected: "Vibe, city, budget stored with itinerary." },
      { id: "SSV-04", name: "Save booking status", preconditions: "Bookings placed.", steps: "Save itinerary.", expected: "Booking state persisted." },
      { id: "SSV-05", name: "Share link", preconditions: "Itinerary saved.", steps: "Tap Share → copy link.", expected: "Sharable link generated." },
      { id: "SSV-06", name: "Open shared link (logged in)", preconditions: "Shared link received by logged-in user.", steps: "Open link.", expected: "Itinerary loads with name, steps, city, vibe, budget, and booking state." },
      { id: "SSV-07", name: "Open shared link (logged out)", preconditions: "Shared link received by logged-out user.", steps: "Open link.", expected: "Itinerary preview loads. Prompts login for full features." },
    ],
  },
  {
    title: "15. Recap & Feedback",
    tests: [
      { id: "RCF-01", name: "Rate steps", preconditions: "Itinerary attended.", steps: "Rate each step 1–5 stars.", expected: "Ratings save." },
      { id: "RCF-02", name: "Rate venues", preconditions: "Itinerary attended.", steps: "Rate each venue 1–5 stars.", expected: "Venue ratings save." },
      { id: "RCF-03", name: "Rate vibe", preconditions: "Itinerary attended.", steps: "Rate vibe fit 1–5 stars.", expected: "Vibe rating saves." },
      { id: "RCF-04", name: "Rate name", preconditions: "Itinerary attended.", steps: "Rate name fit 1–5 stars.", expected: "Name rating saves." },
      { id: "RCF-05", name: "Mark favorite", preconditions: "Itinerary attended.", steps: "Mark one step as favorite.", expected: "Favorite persists to profile." },
      { id: "RCF-06", name: "Mark disliked", preconditions: "Itinerary attended.", steps: "Mark one step as disliked.", expected: "Disliked venue/category penalized in future plans." },
      { id: "RCF-07", name: "Submit written feedback", preconditions: "Itinerary attended.", steps: "Type written feedback and submit.", expected: "Feedback saves. Personalization engine updates." },
    ],
  },
  {
    title: "16. Personalization Engine",
    tests: [
      { id: "PRS-01", name: "5+ itineraries learned", preconditions: "User has generated 5+ itineraries.", steps: "Review default pre-filled values.", expected: "Preferred vibe, budget, categories, and tone update from history." },
      { id: "PRS-02", name: "Repeated similar vibes", preconditions: "User repeatedly chooses same vibe.", steps: "Generate new itinerary.", expected: "Default vibe pre-filled with most-used vibe." },
      { id: "PRS-03", name: "Swap-away signals", preconditions: "User has swapped away from certain venues.", steps: "Review future plans.", expected: "Disliked venues/categories deprioritized." },
      { id: "PRS-04", name: "Saved categories", preconditions: "User saves certain categories.", steps: "Generate new itinerary.", expected: "Saved categories appear in default or recommendations." },
      { id: "PRS-05", name: "Budget evolution", preconditions: "User changes budget over time.", steps: "Review default budget.", expected: "Default budget reflects rolling average." },
      { id: "PRS-06", name: "Reset preferences", preconditions: "Profile has learned preferences.", steps: "Tap Reset Preferences.", expected: "Profile resets to DEFAULT_PROFILE. Next plan starts fresh." },
    ],
  },
  {
    title: "17. Multi-Day Trip Engine",
    tests: [
      { id: "MDT-01", name: "2-day trip", preconditions: "Trip mode selected.", steps: "Plan 2-day trip.", expected: "Trip arc feels intentional. Day 2 does not repeat Day 1 venues." },
      { id: "MDT-02", name: "3-day trip", preconditions: "Trip mode selected.", steps: "Plan 3-day trip.", expected: "Intentional arc. No excessive repetition. Rest blocks appear where needed." },
      { id: "MDT-03", name: "5-day trip", preconditions: "Trip mode selected.", steps: "Plan 5-day trip.", expected: "Daily budget and total budget calculate correctly." },
      { id: "MDT-04", name: "Arrival day", preconditions: "Trip mode selected.", steps: "Set arrival time to evening.", expected: "Day 1 theme = arrival/warmup. Light on stops." },
      { id: "MDT-05", name: "Departure day", preconditions: "Trip mode selected.", steps: "Set departure time to morning.", expected: "Final day theme = recovery/check-out. Light on stops." },
      { id: "MDT-06", name: "Avoid repeated venues", preconditions: "Trip with 3+ days.", steps: "Review all days.", expected: "No venue appears more than once across days." },
      { id: "MDT-07", name: "Balance energy", preconditions: "Trip with 3+ days.", steps: "Review energy curve across days.", expected: "High-energy days separated by chill/recovery days." },
      { id: "MDT-08", name: "Weather fallback by day", preconditions: "Rain forecast for Day 2.", steps: "Generate multi-day trip.", expected: "Day 2 receives weather-appropriate pivots; other days unaffected." },
    ],
  },
  {
    title: "18. Promo Engine",
    tests: [
      { id: "PRM-01", name: "Optional promo", preconditions: "Partner deal available.", steps: "Itinerary includes optional partner deal.", expected: "Deal shown as optional. User can accept or decline." },
      { id: "PRM-02", name: "Upgrade promo", preconditions: "Partner deal is upgrade type.", steps: "Review upgrade offer.", expected: "Upgrade offer disclosed. Non-promo alternative shown." },
      { id: "PRM-03", name: "Deal promo", preconditions: "Partner deal is time-limited deal.", steps: "Review deal offer.", expected: "Deal terms disclosed clearly. No ad-like language." },
      { id: "PRM-04", name: "Save-money promo", preconditions: "Partner deal is save type.", steps: "Review save offer.", expected: "Savings disclosed. Alternative shown." },
      { id: "PRM-05", name: "Promo rejected — vibe mismatch", preconditions: "Partner deal exists.", steps: "Select conflicting vibe.", expected: "Deal filtered out. No broken promo shown." },
      { id: "PRM-06", name: "Promo rejected — safety mismatch", preconditions: "Partner deal is adult-only.", steps: "Select family safety mode.", expected: "Adult deal filtered out. Family-safe alternatives only." },
      { id: "PRM-07", name: "Promo rejected — budget mismatch", preconditions: "Partner deal is high-tier.", steps: "Select low budget.", expected: "Deal filtered out when budget tier < deal minimum." },
    ],
  },
  {
    title: "19. Multi-Agent Orchestration",
    tests: [
      { id: "ORC-01", name: "All agents produce coherent output", preconditions: "Full plan generation triggered.", steps: "Generate plan with all engines active.", expected: "Final itinerary feels like one unified Confetti voice." },
      { id: "ORC-02", name: "No contradictory recommendations", preconditions: "Vibe = classy, Safety = in_laws, Budget = save.", steps: "Generate plan.", expected: "No contradictions between agents. Safety and budget constraints win over promos." },
      { id: "ORC-03", name: "Safety agent veto respected", preconditions: "Safety = family.", steps: "Generate plan.", expected: "Adult venues never appear even if other agents would suggest them." },
      { id: "ORC-04", name: "Budget agent ceiling respected", preconditions: "Budget tier = 1 (save).", steps: "Generate plan.", expected: "No single stop pushes per-person total over ceiling." },
      { id: "ORC-05", name: "Weather agent fallback applied", preconditions: "Rain forecast.", steps: "Generate plan.", expected: "Outdoor steps swapped to indoor." },
      { id: "ORC-06", name: "Local flavor agent present", preconditions: "City selected.", steps: "Generate plan.", expected: "At least one local neighborhood and one signature experience referenced." },
      { id: "ORC-07", name: "Time-of-day agent respected", preconditions: "Time = late_night.", steps: "Generate plan.", expected: "Late-night venues only. No closed-venue warnings." },
    ],
  },
];

// ── Final E2E ────────────────────────────────────────
const E2E = {
  id: "E2E-01",
  name: "Full journey: Miami → Brunch Baddies → Soft Life → Tier 2 booking → Group → Recap",
  preconditions: "New user, sunny weather, Stripe test mode.",
  steps: "1. Open app. 2. Choose Miami. 3. Choose Brunch Baddies. 4. Choose Soft Life. 5. Set budget $50–$100. 6. Group = 4 girls. 7. Time = Sunday morning. 8. Weather = sunny. 9. Tone = Instagrammy. 10. Select Tier 2 partner venue. 11. Generate itinerary. 12. Select generated name. 13. Book brunch in-app. 14. Order ahead. 15. Share with group. 16. Group votes. 17. Finalize itinerary. 18. Attend. 19. Rate steps and venues. 20. Verify personalization updates.",
  expected: "End-to-end flow works. Itinerary is city-aware, vibe-aware, budget-aware, weather-aware, and safe. Name engine works. Booking engine works. Order-ahead works. Group flow works. Feedback updates personalization. No promo or partner logic breaks trust.",
};

// ── Build document ──────────────────────────────────
const children = [
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 240 },
    children: [new TextRun({ text: "Confetti Full-System Test Plan v1", bold: true, size: 48 })],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 360 },
    children: [new TextRun({ text: "Deterministic + AI-coverage QA spine for all 19 engine suites", size: 24 })],
  }),
  new Paragraph({
    spacing: { after: 240 },
    children: [
      new TextRun({ text: "How to use this plan:", bold: true, size: 24 }),
      new TextRun({
        text: " Execute deterministic tests via /qa in the app. Run AI-coverage tests (booking, group, share, recap) through their respective UI flows. Record Pass/Fail in the Notes field.",
        size: 22,
      }),
    ],
  }),
];

for (const suite of SUITES) {
  children.push(sectionHeader(suite.title));
  for (const test of suite.tests) {
    children.push(testTable(test));
    children.push(gap());
  }
}

children.push(sectionHeader("20. Final End-to-End Test"));
children.push(testTable(E2E));
children.push(gap());

const doc = new Document({
  styles: {
    default: {
      document: { run: { font: "Arial", size: 22 } },
    },
    paragraphStyles: [
      {
        id: "Heading1",
        name: "Heading 1",
        basedOn: "Normal",
        next: "Normal",
        quickFormat: true,
        run: { size: 32, bold: true, font: "Arial", color: "C44569" },
        paragraph: { spacing: { before: 360, after: 180 }, outlineLevel: 0 },
      },
      {
        id: "Heading2",
        name: "Heading 2",
        basedOn: "Normal",
        next: "Normal",
        quickFormat: true,
        run: { size: 26, bold: true, font: "Arial" },
        paragraph: { spacing: { before: 240, after: 120 }, outlineLevel: 1 },
      },
    ],
  },
  sections: [
    {
      properties: {
        page: {
          size: { width: 12240, height: 15840 },
          margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
        },
      },
      headers: {
        default: new Header({
          children: [new Paragraph({ children: [new TextRun({ text: "Confetti QA — Test Plan v1", size: 18, color: "888888" })] })],
        }),
      },
      footers: {
        default: new Footer({
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({ text: "Page ", size: 18 }),
                new TextRun({ children: [PageNumber.CURRENT], size: 18 }),
              ],
            }),
          ],
        }),
      },
      children,
    },
  ],
});

Packer.toBuffer(doc).then((buf) => {
  fs.writeFileSync("/mnt/documents/confetti-test-plan-v1.docx", buf);
  console.log("Wrote /mnt/documents/confetti-test-plan-v1.docx");
});
