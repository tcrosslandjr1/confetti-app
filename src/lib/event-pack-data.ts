// Confetti Printable Event Pack — template data.
// Fully static, deterministic content powering the /event-pack screen.

export type EventTemplateId =
  | "fraternity-hike"
  | "aka-service-tea"
  | "line-sisters-brunch"
  | "church-picnic"
  | "corporate-offsite";

export type EventTemplate = {
  id: EventTemplateId;
  title: string;
  audience: string;
  summary: string;
  itinerary: { time: string; label: string }[];
  budget: { range: string; lines: string[] };
  logistics: string[];
  safety: string[];
  promo: string;
  roles: string[];
  dayOf: { time: string; label: string }[];
  packing: string[];
};

export const EVENT_TEMPLATES: EventTemplate[] = [
  {
    id: "fraternity-hike",
    title: "Fraternity Hiking Day Trip",
    audience: "Fraternity",
    summary: "Scenic half-day hike with picnic, team challenges, and photo checkpoints.",
    itinerary: [
      { time: "9:00 AM", label: "Meet at chapter house; gear check and payments." },
      { time: "9:30 AM", label: "Depart by carpool." },
      { time: "10:15 AM", label: "Trailhead arrival; safety briefing." },
      { time: "10:30 AM–1:00 PM", label: "Hike with two challenge stops." },
      { time: "1:00 PM–2:00 PM", label: "Picnic, awards, clean-up." },
      { time: "2:30 PM", label: "Return to campus." },
    ],
    budget: {
      range: "$10–$25",
      lines: ["Gas split: $5–$10", "Food: $5–$10", "Parking/permits: $0–$5"],
    },
    logistics: [
      "Trail selection and permit check",
      "Carpool roster and driver confirmations",
      "Printed route and map screenshot for each car",
      "First-aid kit and power bank",
      "Trash bags and leave-no-trace plan",
    ],
    safety: [
      "Two sober trip leaders",
      "One first-aid trained lead preferred",
      "Buddy system",
      "Sweep person assigned",
      "Share route and ETA with off-site contact",
      "Check weather and trail alerts morning of event",
    ],
    promo:
      "Hike + Picnic — Sat 9 AM. Scenic 4–6 mile loop, team games, and picnic. Bring water, sturdy shoes, and $15. RSVP by Thursday.",
    roles: ["Organizer", "Safety Lead", "Food Lead", "Transport Lead", "Photographer", "Sweep"],
    dayOf: [
      { time: "8:45 AM", label: "Setup and gear check" },
      { time: "9:00 AM", label: "Roll call and payments" },
      { time: "9:30 AM", label: "Depart" },
      { time: "10:15 AM", label: "Briefing and start" },
      { time: "1:00 PM", label: "Picnic and awards" },
      { time: "2:30 PM", label: "Return" },
    ],
    packing: [
      "Water 1L+",
      "Sturdy shoes",
      "Layered clothing",
      "Sunscreen",
      "Hat",
      "Snacks",
      "Small first-aid kit",
      "Power bank",
      "Trash bag",
    ],
  },
  {
    id: "aka-service-tea",
    title: "Alpha Kappa Alpha Community Service & Tea Social",
    audience: "Alpha Kappa Alpha / AKA",
    summary:
      "Serve a local nonprofit, then gather for a reflective tea social and sisterhood circle.",
    itinerary: [
      { time: "9:00 AM", label: "Meet at chapter house; service briefing." },
      { time: "9:30 AM–12:00 PM", label: "Volunteer shift at partner nonprofit." },
      { time: "12:30 PM–2:00 PM", label: "Tea social with reflections and short program." },
    ],
    budget: {
      range: "$5–$30",
      lines: ["Volunteer shift: free", "Tea social: $5–$30 depending on catering"],
    },
    logistics: [
      "Confirm nonprofit contact and volunteer tasks",
      "Collect waivers and emergency contacts",
      "Tea menu and allergy accommodations",
      "Seating, tableware, and name tags",
    ],
    safety: [
      "Follow nonprofit safety rules and PPE requirements",
      "Allergy-aware snack planning and labeled foods",
      "Emergency contact list",
      "Nearest urgent care location",
    ],
    promo:
      "Serve + Sisterhood Tea — Sat 9 AM. Join us to serve and then unwind with tea and conversation. RSVP with dietary needs.",
    roles: [
      "Service Coordinator",
      "Tea Host",
      "Logistics",
      "Outreach Liaison",
      "Reflection Facilitator",
    ],
    dayOf: [
      { time: "8:45 AM", label: "Supplies distribution" },
      { time: "9:00 AM", label: "Service briefing" },
      { time: "9:30 AM", label: "Volunteer shift" },
      { time: "12:30 PM", label: "Tea setup and seating" },
      { time: "1:00 PM", label: "Sisterhood circle and reflections" },
    ],
    packing: [
      "Comfortable attire",
      "Small plate or treat if requested",
      "Name tag",
      "Donation for nonprofit if applicable",
    ],
  },
  {
    id: "line-sisters-brunch",
    title: "Line Sisters Progressive Brunch & Workshop",
    audience: "Line Sisters",
    summary:
      "Three short mentoring stations across brunch courses for intimate bonding and skill sharing.",
    itinerary: [
      { time: "10:00 AM", label: "Host A — appetizers and icebreaker." },
      { time: "11:00 AM", label: "Host B — mentorship mini-workshops." },
      { time: "12:00 PM", label: "Host C — dessert and closing circle." },
    ],
    budget: {
      range: "$10–$25",
      lines: ["Food contributions split across hosts"],
    },
    logistics: [
      "Host rotation plan and address list",
      "RSVP limits per host",
      "Transport plan if needed",
      "Short workshop prompts and materials list",
      "Dietary notes and accessibility checks",
    ],
    safety: [
      "Limit group size per host for comfort and safety",
      "Clear start and end times for each stop",
      "Contact list for each host",
      "Emergency plan",
    ],
    promo:
      "Line Sisters Brunch Crawl — Sun 10 AM. Small groups, big conversations. Bring $15 and a workshop idea. RSVP required.",
    roles: [
      "Host Coordinator",
      "Workshop Leads",
      "Transport Lead",
      "Food Coordinator",
      "Closing Facilitator",
    ],
    dayOf: [
      { time: "9:45 AM", label: "Hosts prep" },
      { time: "10:00 AM", label: "Appetizers and icebreaker" },
      { time: "11:00 AM", label: "Workshops rotate" },
      { time: "12:00 PM", label: "Dessert and closing circle" },
    ],
    packing: [
      "Comfortable shoes",
      "Small cash or payment app",
      "Workshop materials",
      "Allergy notes",
    ],
  },
  {
    id: "church-picnic",
    title: "Church Friends Picnic & Service",
    audience: "Church Friends",
    summary: "Morning outreach followed by a relaxed potluck picnic and fellowship.",
    itinerary: [
      { time: "8:30 AM", label: "Meet at church." },
      { time: "9:00 AM–11:30 AM", label: "Outreach project in community." },
      { time: "12:00 PM–2:00 PM", label: "Potluck picnic and small groups." },
    ],
    budget: {
      range: "$0–$10",
      lines: ["Potluck style", "Optional donations for outreach supplies"],
    },
    logistics: [
      "Outreach partner confirmation and task list",
      "Background checks if working with minors",
      "Potluck sign-up and serving utensils",
      "Blankets, coolers, and trash plan",
    ],
    safety: [
      "First-aid kit",
      "Designated Safety Lead",
      "Clear roles for working with vulnerable populations",
      "Emergency contact list",
      "Nearest clinic info",
    ],
    promo:
      "Serve and Picnic — Sat 8:30 AM. Help our neighbors, then share a potluck picnic. Bring a dish and a friend.",
    roles: [
      "Outreach Lead",
      "Food Coordinator",
      "Worship / Reflection Leader",
      "Logistics",
      "Safety Lead",
    ],
    dayOf: [
      { time: "8:15 AM", label: "Setup and roll call" },
      { time: "9:00 AM", label: "Outreach begins" },
      { time: "12:00 PM", label: "Picnic and fellowship" },
      { time: "2:00 PM", label: "Cleanup and debrief" },
    ],
    packing: [
      "Potluck dish",
      "Serving utensils",
      "Blanket",
      "Gloves for service",
      "Water",
      "Sunscreen",
    ],
  },
  {
    id: "corporate-offsite",
    title: "Corporate Half-Day Offsite with Facilitated Workshop",
    audience: "Corporate Teams",
    summary: "Focused half-day to align priorities, run breakouts, and produce an action plan.",
    itinerary: [
      { time: "8:30 AM", label: "Arrival and coffee." },
      { time: "9:00 AM–10:15 AM", label: "Framing, objectives, and icebreaker." },
      { time: "10:30 AM–11:30 AM", label: "Breakouts with deliverables." },
      { time: "11:30 AM–12:00 PM", label: "Sharebacks and action commitments." },
    ],
    budget: {
      range: "$40–$200",
      lines: ["Facilitator: $800–$2,500", "Venue and catering: $20–$80 per person"],
    },
    logistics: [
      "Clear objectives and facilitator brief",
      "AV setup and breakout materials",
      "Prework distributed",
      "Dietary accommodations",
      "Travel and parking confirmations",
    ],
    safety: [
      "Accessibility accommodations",
      "Emergency contacts",
      "Dietary restrictions logged and honored",
      "Venue emergency procedures",
    ],
    promo:
      "Team Offsite — Half Day. Focused workshop to align Q3 priorities. Prework required. RSVP by Monday.",
    roles: ["Organizer", "Facilitator", "Note Taker", "Logistics", "Timekeeper", "AV Lead"],
    dayOf: [
      { time: "8:15 AM", label: "Venue setup and AV check" },
      { time: "8:30 AM", label: "Coffee and arrival" },
      { time: "9:00 AM", label: "Start and framing" },
      { time: "11:30 AM", label: "Sharebacks and commitments" },
      { time: "12:00 PM", label: "Close and next steps" },
    ],
    packing: ["Laptop", "Charger", "Completed prework", "Notebook", "Business cards if relevant"],
  },
];

export const SIGNUP_CSV_HEADER = [
  "Name",
  "Phone",
  "Email",
  "Emergency Contact",
  "Emergency Phone",
  "Dietary Restrictions",
  "Medical Notes",
  "Carpool",
  "Payment Collected",
  "Role Preference",
  "Tshirt Size",
];

export const SIGNUP_CSV_SAMPLES: string[][] = [
  [
    "Jordan Smith",
    "555-1234",
    "jordan@example.com",
    "Alex Smith",
    "555-5678",
    "None",
    "None",
    "Yes",
    "No",
    "Food Lead",
    "M",
  ],
  [
    "Taylor Brown",
    "555-2345",
    "taylor@example.com",
    "Sam Brown",
    "555-6789",
    "Vegetarian",
    "Peanut allergy",
    "No",
    "Yes",
    "Transport Lead",
    "L",
  ],
  [
    "Riley Johnson",
    "555-3456",
    "riley@example.com",
    "Casey Johnson",
    "555-7890",
    "None",
    "None",
    "Yes",
    "Yes",
    "Volunteer",
    "S",
  ],
];

export const LIABILITY_FORM = {
  title: "Event Liability Acknowledgement and Emergency Contact",
  body: "I acknowledge that participation in this event involves inherent risks. I agree to follow event rules and instructions from organizers. I release the organizers and affiliated organizations from liability for injury or loss except where prohibited by law. In case of emergency, I authorize organizers to seek medical care on my behalf.",
  fields: ["Name", "Date", "Emergency Contact", "Phone", "Allergies / Medical Notes", "Signature"],
  disclaimer:
    "This template is not legal advice. Organizations should review with appropriate counsel before use.",
};

export const DAY_OF_ROLE_CHECKLIST: { role: string; tasks: string[] }[] = [
  {
    role: "Organizer",
    tasks: ["Confirm RSVPs", "Collect payments", "Distribute final itinerary", "Confirm vendors"],
  },
  {
    role: "Safety Lead",
    tasks: [
      "Bring first-aid kit",
      "Manage emergency contacts",
      "Confirm sober leads",
      "Check weather",
    ],
  },
  {
    role: "Transport Lead",
    tasks: ["Organize carpool", "Confirm drivers and parking", "Collect gas contributions"],
  },
  {
    role: "Food Lead",
    tasks: ["Coordinate menu", "Manage dietary needs", "Bring utensils and trash bags"],
  },
  {
    role: "Logistics",
    tasks: ["Manage permits", "Confirm site reservations", "Handle signage", "Manage cleanup plan"],
  },
  {
    role: "Communications",
    tasks: [
      "Send reminder 48 hours before",
      "Send reminder 2 hours before",
      "Post directions and meeting point",
      "Manage group chat",
    ],
  },
];

export function buildChatAnnouncement(t: EventTemplate): string {
  const first = t.itinerary[0];
  return [
    `${t.title} — ${first?.time ?? "TBD"}`,
    t.summary,
    `Bring: see packing list`,
    `Cost: ${t.budget.range}`,
    `RSVP by: 48 hours before`,
    `Contact: organizer (name / phone / email)`,
  ].join("\n");
}

export function buildFlyerCopy(t: EventTemplate): string {
  return [
    `${t.title.toUpperCase()}`,
    ``,
    `Date & Time: ${t.itinerary[0]?.time ?? "TBD"}`,
    ``,
    t.summary,
    ``,
    `Itinerary:`,
    ...t.itinerary.map((i) => `  • ${i.time} — ${i.label}`),
    ``,
    `Cost: ${t.budget.range}`,
    `What to bring: see packing list`,
    `RSVP: by 48 hours before, to the organizer`,
    `Cancellation: full refund up to 24 hours prior`,
    `Safety: trained leads on site; emergency plan in place`,
  ].join("\n");
}

export function buildFullPlanText(t: EventTemplate): string {
  const sections: string[] = [];
  sections.push(`# ${t.title}`);
  sections.push(`Audience: ${t.audience}`);
  sections.push(`\nSummary: ${t.summary}`);
  sections.push(`\n## Itinerary`);
  t.itinerary.forEach((i) => sections.push(`- ${i.time} — ${i.label}`));
  sections.push(`\n## Budget per person\n${t.budget.range}`);
  t.budget.lines.forEach((l) => sections.push(`- ${l}`));
  sections.push(`\n## Logistics`);
  t.logistics.forEach((l) => sections.push(`- ${l}`));
  sections.push(`\n## Safety`);
  t.safety.forEach((l) => sections.push(`- ${l}`));
  sections.push(`\n## Roles\n${t.roles.map((r) => `- ${r}`).join("\n")}`);
  sections.push(`\n## Day-of Timeline`);
  t.dayOf.forEach((d) => sections.push(`- ${d.time} — ${d.label}`));
  sections.push(`\n## Packing List`);
  t.packing.forEach((p) => sections.push(`- ${p}`));
  sections.push(`\n## Promo Blurb\n${t.promo}`);
  sections.push(`\n## Chat Announcement\n${buildChatAnnouncement(t)}`);
  sections.push(`\n## Flyer Copy\n${buildFlyerCopy(t)}`);
  return sections.join("\n");
}

export function buildSignupCsv(): string {
  const rows = [SIGNUP_CSV_HEADER, ...SIGNUP_CSV_SAMPLES];
  return rows
    .map((row) =>
      row
        .map((cell) => {
          const needsQuotes = /[",\n]/.test(cell);
          const escaped = cell.replace(/"/g, '""');
          return needsQuotes ? `"${escaped}"` : escaped;
        })
        .join(","),
    )
    .join("\n");
}
