// Internal audit registry of every user-facing route/portal in the app.
// Each entry is tagged with: purpose (category), one-job (single responsibility),
// and consolidation flags (overlap/duplication/deprecation candidates).

export type RoutePurpose =
  | "acquisition" // marketing / landing / SEO
  | "money-path" // plan creation → ready (core conversion)
  | "retention" // passport / rewards / loyalty
  | "social" // collab, RSVP, sharing, viral
  | "discovery" // browse venues/events/ideas
  | "concierge" // human/AI concierge surfaces
  | "portal" // logged-in member hub
  | "business" // advertiser-facing
  | "admin" // internal-only console
  | "auth" // sign in / onboarding
  | "transactional" // confirmation, check-in, boarding
  | "legal" // ToS / privacy / cookies
  | "utility" // tools (weather, translate, scan)
  | "system"; // sitemap, api

export type ConsolidationFlag =
  | "duplicate" // overlaps with another route, candidate for merge
  | "deprecated" // legacy, candidate to remove
  | "thin" // very little unique content
  | "split-portal" // duplicated between /portal/* and top-level
  | "needs-owner" // unclear ownership
  | "merge-candidate"; // sibling routes that should be unified

export type RouteEntry = {
  path: string;
  purpose: RoutePurpose;
  oneJob: string; // single sentence: the one thing this page must do
  flags?: ConsolidationFlag[];
  notes?: string;
};

export const ROUTE_REGISTRY: RouteEntry[] = [
  // ── Acquisition / Marketing ─────────────────────────────────────────────
  { path: "/", purpose: "acquisition", oneJob: "Convert visitor to start a plan in 60s." },
  { path: "/about", purpose: "acquisition", oneJob: "Tell the brand story to build trust." },
  { path: "/how-it-works", purpose: "acquisition", oneJob: "Explain the 3-step plan flow.", flags: ["merge-candidate"], notes: "Could merge with /features." },
  { path: "/features", purpose: "acquisition", oneJob: "List product capabilities for evaluators.", flags: ["merge-candidate"], notes: "Overlaps /how-it-works." },
  { path: "/pricing", purpose: "acquisition", oneJob: "Communicate price and remove cost objections." },
  { path: "/testimonials", purpose: "acquisition", oneJob: "Show social proof from real users.", flags: ["thin"] },
  { path: "/investors", purpose: "acquisition", oneJob: "Pitch the opportunity to investors." },
  { path: "/for-business", purpose: "acquisition", oneJob: "Convert venues to /advertise." },
  { path: "/contact", purpose: "acquisition", oneJob: "Capture inbound questions." },

  // ── Money path ──────────────────────────────────────────────────────────
  { path: "/create", purpose: "money-path", oneJob: "Collect inputs in <60s to generate a plan." },
  { path: "/plan", purpose: "money-path", oneJob: "Run the plan-generation step.", flags: ["merge-candidate"], notes: "Consider merging with /plan/ready." },
  { path: "/plan/preview", purpose: "money-path", oneJob: "Preview a sample plan for skeptics." },
  { path: "/plan/ready", purpose: "money-path", oneJob: "Deliver the ready plan and drive next action (share/save)." },
  { path: "/quick-generate", purpose: "money-path", oneJob: "1-click plan generation for power users.", flags: ["duplicate"], notes: "Overlaps /create." },

  // ── Retention / Passport ────────────────────────────────────────────────
  { path: "/passport", purpose: "retention", oneJob: "Show Confetti balance & rewards progress." },
  { path: "/partners", purpose: "retention", oneJob: "List partner rewards redeemable with Confetti." },
  { path: "/boarding-pass", purpose: "retention", oneJob: "Render the wallet/boarding-pass artifact." },
  { path: "/check-in", purpose: "retention", oneJob: "Let a member check in to earn Confetti." },
  { path: "/scan", purpose: "retention", oneJob: "Scan a partner QR to claim a reward." },

  // ── Discovery ───────────────────────────────────────────────────────────
  { path: "/discover", purpose: "discovery", oneJob: "Browse curated city experiences." },
  { path: "/events", purpose: "discovery", oneJob: "Browse upcoming events." },
  { path: "/events/$eventId", purpose: "discovery", oneJob: "Sell a single event (details + CTA)." },
  { path: "/venue/$id", purpose: "discovery", oneJob: "Sell a single venue (details + CTA)." },
  { path: "/ideas/$slug", purpose: "discovery", oneJob: "Show one curated idea/itinerary." },
  { path: "/reservations", purpose: "discovery", oneJob: "Surface reservable inventory." },
  { path: "/weather", purpose: "utility", oneJob: "Show weather context for planning." },

  // ── Social / Sharing ────────────────────────────────────────────────────
  { path: "/collab/$tripId", purpose: "social", oneJob: "Co-plan a trip with friends in real time." },
  { path: "/rsvp/$token", purpose: "social", oneJob: "RSVP via shared token link.", flags: ["merge-candidate"], notes: "Two RSVP routes; unify token+tripId." },
  { path: "/rsvp/$tripId", purpose: "social", oneJob: "RSVP via tripId.", flags: ["merge-candidate"] },
  { path: "/p/$code", purpose: "social", oneJob: "Resolve a short share code to the plan." },
  { path: "/viral", purpose: "social", oneJob: "Drive referral/viral loops." },
  { path: "/teams", purpose: "social", oneJob: "List the user's teams." },
  { path: "/teams/new", purpose: "social", oneJob: "Create a new team." },
  { path: "/teams/$id", purpose: "social", oneJob: "Show a single team workspace." },
  { path: "/trips", purpose: "social", oneJob: "List trips the user is part of." },
  { path: "/trips/$id", purpose: "social", oneJob: "Show a single trip detail." },
  { path: "/trips/$id/passport", purpose: "social", oneJob: "Review & rate a single completed trip (stops + overall)." },
  { path: "/recap/$itineraryId", purpose: "social", oneJob: "Shareable recap of a completed trip." },
  { path: "/favorites", purpose: "retention", oneJob: "Saved venues/events for the member.", flags: ["split-portal"], notes: "Overlaps /portal/saved." },

  // ── Concierge ───────────────────────────────────────────────────────────
  { path: "/concierge", purpose: "concierge", oneJob: "Entry to AI/human concierge." },
  { path: "/concierge/chat", purpose: "concierge", oneJob: "Open a new concierge chat." },
  { path: "/concierge/chat/$threadId", purpose: "concierge", oneJob: "Continue a concierge thread." },
  { path: "/concierge/passport", purpose: "concierge", oneJob: "Redirect → /passport (consolidated).", flags: ["deprecated"], notes: "Legacy redirect; canonical lives at /passport." },
  { path: "/concierge/profile", purpose: "concierge", oneJob: "Profile inside concierge.", flags: ["split-portal"] },
  { path: "/chat", purpose: "concierge", oneJob: "Generic chat entry.", flags: ["duplicate"], notes: "Overlaps /concierge/chat." },
  { path: "/taste-tuner", purpose: "concierge", oneJob: "Tune taste preferences for recs." },

  // ── Member Portal ───────────────────────────────────────────────────────
  { path: "/portal", purpose: "portal", oneJob: "Logged-in home for members." },
  { path: "/portal/passport", purpose: "portal", oneJob: "Passport inside portal.", flags: ["split-portal"], notes: "Duplicates /passport." },
  { path: "/portal/wallet", purpose: "portal", oneJob: "Manage wallet passes." },
  { path: "/portal/bookings", purpose: "portal", oneJob: "List user bookings." },
  { path: "/portal/saved", purpose: "portal", oneJob: "Saved items.", flags: ["split-portal"], notes: "Overlaps /favorites." },
  { path: "/portal/activity", purpose: "portal", oneJob: "Activity feed for the member." },
  { path: "/portal/achievements", purpose: "portal", oneJob: "Badges & milestones." },
  { path: "/portal/profile", purpose: "portal", oneJob: "Edit profile." },
  { path: "/portal/refer", purpose: "portal", oneJob: "Generate referral links." },
  { path: "/portal/viral", purpose: "portal", oneJob: "Viral mechanics inside portal.", flags: ["duplicate"], notes: "Overlaps /viral." },
  { path: "/me", purpose: "portal", oneJob: "Shortcut to current user.", flags: ["thin"], notes: "Consider redirect to /portal/profile." },
  { path: "/active-loop", purpose: "portal", oneJob: "Show currently active loop.", flags: ["needs-owner"] },
  { path: "/active-confetti", purpose: "retention", oneJob: "Show in-progress Confetti earn.", flags: ["needs-owner"] },

  // ── Auth / Onboarding ───────────────────────────────────────────────────
  { path: "/auth", purpose: "auth", oneJob: "Sign in or sign up." },
  { path: "/onboarding", purpose: "auth", oneJob: "First-run setup for new members." },
  { path: "/confirmation", purpose: "transactional", oneJob: "Confirm an action (email/booking)." },

  // ── Business / Advertiser ───────────────────────────────────────────────
  { path: "/advertise", purpose: "business", oneJob: "Pitch venues to list with us." },
  { path: "/advertise/portal", purpose: "business", oneJob: "Advertiser dashboard." },
  { path: "/advertise/stories/$slug", purpose: "business", oneJob: "Show a single advertiser story." },

  // ── Utility ─────────────────────────────────────────────────────────────
  { path: "/translate", purpose: "utility", oneJob: "Translate text on demand." },

  // ── Legal ───────────────────────────────────────────────────────────────
  { path: "/terms", purpose: "legal", oneJob: "Terms of service." },
  { path: "/privacy", purpose: "legal", oneJob: "Privacy policy." },
  { path: "/cookies", purpose: "legal", oneJob: "Cookie policy." },
  { path: "/data-terms", purpose: "legal", oneJob: "Data-processing terms.", flags: ["merge-candidate"], notes: "Could fold into /privacy." },
  { path: "/accessibility", purpose: "legal", oneJob: "Accessibility statement." },

  // ── Admin (internal) ────────────────────────────────────────────────────
  { path: "/admin", purpose: "admin", oneJob: "Admin dashboard home." },
  { path: "/admin/login", purpose: "admin", oneJob: "Admin sign-in." },
  { path: "/admin/users", purpose: "admin", oneJob: "Manage users." },
  { path: "/admin/venues", purpose: "admin", oneJob: "Manage venues." },
  { path: "/admin/bookings", purpose: "admin", oneJob: "Manage bookings." },
  { path: "/admin/notifications", purpose: "admin", oneJob: "Send/manage notifications." },
  { path: "/admin/advertisers", purpose: "admin", oneJob: "Manage advertiser accounts." },
  { path: "/admin/outreach", purpose: "admin", oneJob: "Run weekly outreach." },
  { path: "/admin/marquee", purpose: "admin", oneJob: "Curate sponsored marquee." },
  { path: "/admin/integrations", purpose: "admin", oneJob: "Configure 3rd-party integrations." },
  { path: "/admin/settings", purpose: "admin", oneJob: "App-wide settings." },
  { path: "/admin/testimonials", purpose: "admin", oneJob: "Approve testimonials." },
  { path: "/admin/moderation", purpose: "admin", oneJob: "Moderate flagged content." },
  { path: "/admin/analytics", purpose: "admin", oneJob: "Top-level analytics." },
  { path: "/admin/event-analytics", purpose: "admin", oneJob: "Frontend event analytics." },
  { path: "/admin/pick-analytics", purpose: "admin", oneJob: "Recommendation pick analytics." },
  { path: "/admin/ad-analytics", purpose: "admin", oneJob: "Ad performance analytics." },
  { path: "/admin/audit", purpose: "admin", oneJob: "Audit + security trace log." },
  { path: "/admin/wallet-debug", purpose: "admin", oneJob: "Debug wallet JWTs." },
  { path: "/admin/launch", purpose: "admin", oneJob: "Pre-launch checklist." },
  { path: "/admin/routes-map", purpose: "admin", oneJob: "Internal map of every route + consolidation flags." },

  // ── System ──────────────────────────────────────────────────────────────
  { path: "/sitemap.xml", purpose: "system", oneJob: "Serve sitemap for crawlers." },
];

export const PURPOSE_LABELS: Record<RoutePurpose, string> = {
  acquisition: "Acquisition",
  "money-path": "Money path",
  retention: "Retention",
  social: "Social",
  discovery: "Discovery",
  concierge: "Concierge",
  portal: "Portal",
  business: "Business",
  admin: "Admin",
  auth: "Auth",
  transactional: "Transactional",
  legal: "Legal",
  utility: "Utility",
  system: "System",
};

export const FLAG_LABELS: Record<ConsolidationFlag, string> = {
  duplicate: "Duplicate",
  deprecated: "Deprecated",
  thin: "Thin content",
  "split-portal": "Split across portal",
  "needs-owner": "Needs owner",
  "merge-candidate": "Merge candidate",
};
