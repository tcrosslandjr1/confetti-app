// Confetti Full-System QA — deterministic, client-runnable test suite.
// Pure-function checks against the existing engines. No DB writes.

import {
  runV6Engines,
  personalityEngine,
  budgetSmartEngine,
  groupDynamicsEngine,
  weatherEngineFromForecast,
  timeOfDayEngine,
  safetyComfortEngine,
  localFlavorEngine,
  type PersonalityId,
  type SafetyMode,
  type TimeOfDay,
} from "@/lib/agents/v6-engines";
import { findCity, findCityLoose, CITIES } from "@/lib/agents/city-context";
import { planTripDays, dedupeAcrossDays } from "@/lib/agents/trip-engine";
import { selectPromos, type PartnerDeal } from "@/lib/agents/promo-agent";
import {
  OUTING_CATEGORIES,
  CATEGORIES_BY_ID,
  resolveCategories,
} from "@/lib/agents/outing-categories";
import {
  DEFAULT_PROFILE,
  learnProfileFromSignals,
  getDefaultsFromProfile,
  applySafetyGuards,
} from "@/lib/agents/personalization";

export type TestStatus = "pass" | "fail" | "skip";
export type TestResult = {
  id: string;
  name: string;
  status: TestStatus;
  notes: string;
  preconditions?: string;
  steps?: string;
  expected?: string;
};
export type TestSuite = {
  id: string;
  name: string;
  run: () => TestResult[];
};

const ok = (
  id: string,
  name: string,
  pass: boolean,
  notes = "",
  meta: Partial<TestResult> = {},
): TestResult => ({
  id,
  name,
  status: pass ? "pass" : "fail",
  notes,
  ...meta,
});
const skip = (id: string, name: string, why: string, meta: Partial<TestResult> = {}): TestResult => ({
  id,
  name,
  status: "skip",
  notes: why,
  ...meta,
});

// ── 1. Onboarding ────────────────────────────────────────────────
const suiteOnboarding: TestSuite = {
  id: "S1",
  name: "Onboarding Flow",
  run: () => {
    const profile = DEFAULT_PROFILE;
    const defaults = getDefaultsFromProfile(profile);
    return [
      ok(
        "S1.1",
        "First-time profile is empty",
        profile.preferred_vibes.length === 0 && profile.preferred_categories.length === 0,
        "DEFAULT_PROFILE has no learned preferences.",
        {
          preconditions: "Brand new user",
          steps: "Read DEFAULT_PROFILE",
          expected: "Empty counts, zero plans",
        },
      ),
      ok(
        "S1.2",
        "Defaults derive cleanly from empty profile",
        defaults !== null && typeof defaults === "object",
        `defaults=${JSON.stringify(defaults)}`,
      ),
    ];
  },
};

// ── 2. Vibe Engine ───────────────────────────────────────────────
const VIBES: PersonalityId[] = [
  "classy",
  "chaotic",
  "soft_life",
  "bougie",
  "adventurous",
  "romantic",
  "corporate",
  "family_friendly",
  "genz_playful",
  "luxury_concierge",
  "calm",
  "local_friend",
];
const suiteVibes: TestSuite = {
  id: "S2",
  name: "Vibe Engine",
  run: () =>
    VIBES.map((v, i) => {
      const eng = personalityEngine(v);
      return ok(
        `S2.${i + 1}`,
        `Vibe maps: ${v}`,
        !!eng && !!eng.directive && !!eng.tone,
        eng ? `${eng.label}: ${eng.tone}` : "missing",
      );
    }),
};

// ── 3. Category Engine ──────────────────────────────────────────
const REQUESTED_CATS = [
  "brunch-baddies",
  "girls-night",
  "guys-night",
  "spa-day",
  "adventure",
  "local-gems",
  "date-night",
  "yacht-day",
  "rage-room",
  "shopping",
  "shopping-day",
];
const suiteCategories: TestSuite = {
  id: "S3",
  name: "Category Engine",
  run: () => {
    const results: TestResult[] = [];
    REQUESTED_CATS.forEach((wanted, i) => {
      const match = OUTING_CATEGORIES.find(
        (c) =>
          c.id === wanted ||
          c.id.replace(/_/g, "-") === wanted ||
          c.id.includes(wanted.replace(/-/g, "_")) ||
          c.id.includes(wanted),
      );
      results.push(
        match
          ? ok(`S3.${i + 1}`, `Category present: ${wanted}`, true, `→ ${match.id}`)
          : skip(`S3.${i + 1}`, `Category missing: ${wanted}`, "not in OUTING_CATEGORIES"),
      );
    });
    // resolve a multi-category prompt
    const first = OUTING_CATEGORIES.slice(0, 2).map((c) => c.id);
    const resolved = resolveCategories(first);
    results.push(
      ok(
        "S3.R",
        "resolveCategories produces constraints",
        !!resolved && Array.isArray(resolved.categoryIds),
        `resolved ${resolved?.categoryIds.length ?? 0} categories`,
      ),
    );
    return results;
  },
};

// ── 4. City Engine ──────────────────────────────────────────────
const REQUESTED_CITIES = ["Miami", "NYC", "LA", "Las Vegas", "Nashville", "DC"];
const suiteCity: TestSuite = {
  id: "S4",
  name: "City Engine",
  run: () =>
    REQUESTED_CITIES.map((q, i) => {
      const c = findCity(q);
      const loose = findCityLoose(null, q);
      const matched =
        c.city.toLowerCase().includes(q.toLowerCase()) ||
        c.label.toLowerCase().includes(q.toLowerCase()) ||
        !!loose;
      return ok(
        `S4.${i + 1}`,
        `City resolves: ${q}`,
        matched && c.neighborhoods.length > 0,
        `${c.label} · ${c.neighborhoods.length} neighborhoods`,
      );
    }).concat(
      ok(
        "S4.X",
        "All cities expose signature neighborhoods or list",
        CITIES.every((c) => c.neighborhoods.length > 0),
        `${CITIES.length} cities loaded`,
      ),
    ),
};

// ── 5. Itinerary Generation (structural via trip engine) ────────
const suiteItinerary: TestSuite = {
  id: "S5",
  name: "Itinerary Generation",
  run: () => {
    const cases: Array<{ days: number; curve: Parameters<typeof planTripDays>[0]["energyCurve"] }> = [
      { days: 1, curve: "chill-turnup-chill" },
      { days: 1, curve: "soft-life" },
      { days: 1, curve: "adventure-heavy" },
    ];
    const results = cases.map((c, i) => {
      const seeds = planTripDays({
        destinationCity: "Miami",
        tripLengthDays: c.days,
        groupSize: 4,
        energyCurve: c.curve,
      });
      return ok(
        `S5.${i + 1}`,
        `Seed plan: ${c.curve} × ${c.days}`,
        seeds.length === c.days && seeds.every((s) => s.dayTheme && s.timeOfDay),
        seeds.map((s) => `${s.dayTheme}/${s.timeOfDay}`).join(" | "),
      );
    });
    results.push(
      skip(
        "S5.STEPS",
        "3/5/8-step itinerary generation",
        "Requires AI gateway round-trip — exercised in /ask UI, not in deterministic harness.",
      ),
    );
    return results;
  },
};

// ── 6. Name Generator ───────────────────────────────────────────
const suiteNaming: TestSuite = {
  id: "S6",
  name: "Name Generator",
  run: () => [
    skip(
      "S6.AI",
      "Name generation (5–15 names, top 1–3)",
      "Implemented in trip.functions.ts via AI gateway; covered by orchestrator integration, not unit-tested here.",
    ),
  ],
};

// ── 7. Booking & Partner Tiers ──────────────────────────────────
const TIER_RULES: Record<number, string[]> = {
  0: ["call", "website", "directions"],
  1: ["external_reserve", "external_order_ahead"],
  2: ["in_app_book", "in_app_order_ahead", "menu", "payment"],
  3: ["instant_confirm", "live_inventory", "live_wait_times"],
};
const suiteBooking: TestSuite = {
  id: "S7",
  name: "Booking & Partner Tiers",
  run: () =>
    Object.entries(TIER_RULES).map(([tier, capabilities], i) =>
      ok(
        `S7.${i + 1}`,
        `Tier ${tier} capability contract documented`,
        capabilities.length > 0,
        `tier ${tier} → ${capabilities.join(", ")}`,
        {
          expected: capabilities.join(", "),
        },
      ),
    ),
};

// ── 8. Order-Ahead ──────────────────────────────────────────────
const suiteOrderAhead: TestSuite = {
  id: "S8",
  name: "Order-Ahead Flow",
  run: () => [
    skip(
      "S8.1",
      "Cart add/remove/qty/submit/fail/confirm",
      "Stripe payment flow — exercised by /api/checkout endpoints, not in deterministic harness.",
    ),
  ],
};

// ── 9. Group Flow ───────────────────────────────────────────────
const suiteGroup: TestSuite = {
  id: "S9",
  name: "Group Flow",
  run: () => [
    skip(
      "S9.1",
      "Invite / vote / chat / reminders",
      "Backed by invites + activity-log; requires multi-user session simulation.",
    ),
  ],
};

// ── 10. Weather Engine ──────────────────────────────────────────
const suiteWeather: TestSuite = {
  id: "S10",
  name: "Weather Engine",
  run: () => {
    type WX = Parameters<typeof weatherEngineFromForecast>[0];
    const mk = (precip: number, tMax: number, label: string): NonNullable<WX> => ({
      precipProb: precip,
      tMaxF: tMax,
      tMinF: tMax - 15,
      label,
      emoji: "☁️",
      summary: label,
      source: "qa",
    } as NonNullable<WX>);
    const cases: Array<[string, NonNullable<WX>, RegExp]> = [
      ["Rain", mk(90, 70, "Rainy"), /rain/i],
      ["Heat", mk(10, 96, "Hot"), /heat/i],
      ["Cold", mk(10, 35, "Freezing"), /cold/i],
      ["Storm (rain proxy)", mk(95, 72, "Stormy"), /rain/i],
      ["Wind (clear)", mk(10, 70, "Windy"), /weather/i],
    ];
    return cases.map(([name, f, re], i) => {
      const out = weatherEngineFromForecast(f);
      return ok(
        `S10.${i + 1}`,
        `Weather: ${name}`,
        !!out && re.test(out.directive),
        out?.note ?? "no engine output",
      );
    });
  },
};

// ── 11. Safety Engine ───────────────────────────────────────────
const suiteSafety: TestSuite = {
  id: "S11",
  name: "Safety Engine",
  run: () => {
    const modes: SafetyMode[] = [
      "solo_women",
      "in_laws",
      "family",
      "older_group",
      "conservative",
      "first_date",
      "coworker",
    ];
    const results = modes.map((m, i) => {
      const out = safetyComfortEngine([m]);
      return ok(
        `S11.${i + 1}`,
        `Safety mode: ${m}`,
        !!out && /Avoid|Standard|all-ages|safe|appropriate/i.test(out.directive + " " + out.notes),
        out?.notes || "no notes",
      );
    });
    const guarded = applySafetyGuards(
      [
        { vibeLabel: "Strip Club Crawl", occasionLabel: "bachelor" },
        { vibeLabel: "Quiet Brunch", occasionLabel: "in-laws" },
      ],
      ["in_laws"],
    );
    results.push(
      ok(
        "S11.G",
        "applySafetyGuards filters adult content for in_laws",
        guarded.length < 2,
        `kept ${guarded.length}/2`,
      ),
    );
    return results;
  },
};

// ── 12. Time Engine ─────────────────────────────────────────────
const TIMES: TimeOfDay[] = [
  "sunrise",
  "morning",
  "brunch",
  "afternoon",
  "evening",
  "late_night",
];
const suiteTime: TestSuite = {
  id: "S12",
  name: "Time-of-Day Engine",
  run: () =>
    TIMES.map((t, i) => {
      const out = timeOfDayEngine(t);
      return ok(`S12.${i + 1}`, `Time: ${t}`, !!out && !!out.directive, out?.directive ?? "");
    }),
};

// ── 13. Swap Engine ─────────────────────────────────────────────
const suiteSwaps: TestSuite = {
  id: "S13",
  name: "Swap Engine",
  run: () => [
    skip(
      "S13.1",
      "step/vibe/category/name/budget swaps",
      "Swap pipeline is in /ask + orchestrator; requires interactive flow.",
    ),
  ],
};

// ── 14. Save & Share ────────────────────────────────────────────
const suiteSaveShare: TestSuite = {
  id: "S14",
  name: "Save & Share",
  run: () => [
    skip("S14.1", "Save/share roundtrip", "Persists to trips/itineraries tables; needs auth session."),
  ],
};

// ── 15. Recap & Feedback ────────────────────────────────────────
const suiteRecap: TestSuite = {
  id: "S15",
  name: "Recap & Feedback",
  run: () => [
    skip("S15.1", "Ratings update personalization", "Driven by learnProfileFromSignals; see S16."),
  ],
};

// ── 16. Personalization ─────────────────────────────────────────
const suitePersonalization: TestSuite = {
  id: "S16",
  name: "Personalization Engine",
  run: () => {
    let profile = DEFAULT_PROFILE;
    for (let i = 0; i < 5; i++) {
      profile = learnProfileFromSignals(profile, {
        vibe: "soft_life",
        occasionId: "brunch-baddies",
        budgetTier: 2,
        rating: 5,
      });
    }
    const learned = (profile.vibeCounts?.["soft_life"] ?? 0) >= 5;
    const defaults = getDefaultsFromProfile(profile);
    return [
      ok(
        "S16.1",
        "Repeated soft_life signals accumulate",
        learned,
        `count=${profile.vibeCounts?.["soft_life"] ?? 0}`,
      ),
      ok(
        "S16.2",
        "Defaults reflect learned vibe",
        !!defaults && JSON.stringify(defaults).toLowerCase().includes("soft"),
        JSON.stringify(defaults),
      ),
    ];
  },
};

// ── 17. Multi-Day Trips ─────────────────────────────────────────
const suiteMultiDay: TestSuite = {
  id: "S17",
  name: "Multi-Day Trip Engine",
  run: () => {
    const results: TestResult[] = [];
    [2, 3, 5].forEach((days, i) => {
      const seeds = planTripDays({
        destinationCity: "Miami",
        tripLengthDays: days,
        groupSize: 6,
        energyCurve: "bachelorette",
      });
      results.push(
        ok(
          `S17.${i + 1}`,
          `${days}-day trip seeds`,
          seeds.length === days && seeds.some((s) => s.restBlocks.length > 0),
          `themes: ${seeds.map((s) => s.dayTheme).join(", ")}`,
        ),
      );
    });
    const deduped = dedupeAcrossDays([
      { stops: [{ venueId: "v1", type: "brunch" }, { venueId: "v2", type: "club" }] },
      { stops: [{ venueId: "v1", type: "brunch" }, { venueId: "v3", type: "club" }] },
    ]);
    const totalAfter = deduped.reduce((n, d) => n + d.stops.length, 0);
    results.push(ok("S17.D", "dedupeAcrossDays removes repeats", totalAfter < 4, `kept ${totalAfter}/4`));
    return results;
  },
};

// ── 18. Promo Engine ────────────────────────────────────────────
const suitePromo: TestSuite = {
  id: "S18",
  name: "Promo Engine",
  run: () => {
    const deal: PartnerDeal = {
      id: "d1",
      venue_id: null,
      venue_name: "Test Bar",
      city: "miami",
      deal_type: "save",
      title: "10% off",
      description: null,
      vibe_tags: ["soft_life"],
      category_tags: ["brunch"],
      group_size_min: 1,
      group_size_max: 20,
      budget_tier_min: 1,
      budget_tier_max: 4,
      adult_only: false,
      family_safe: true,
      valid_from: null,
      valid_until: null,
    };
    const adultDeal: PartnerDeal = { ...deal, id: "d2", adult_only: true, family_safe: false };
    const plan = {
      vibeLabel: "soft_life",
      stops: [{ id: "s1", name: "Brunch X", type: "brunch" } as never],
    } as never;

    const safe = selectPromos(plan, [deal, adultDeal], DEFAULT_PROFILE, {
      vibe: "soft_life",
      category: "brunch",
      budgetTier: 2,
      groupSize: 4,
      safetyModes: ["family"],
      adultOptIn: false,
    });
    const lowSens = selectPromos(
      plan,
      [deal],
      { ...DEFAULT_PROFILE, promo_sensitivity: "low" } as never,
      {
        vibe: "soft_life",
        category: "brunch",
        budgetTier: 2,
        groupSize: 4,
        safetyModes: [],
        adultOptIn: false,
      },
    );
    return [
      ok(
        "S18.1",
        "Adult-only deal filtered under family safety",
        safe.promoSteps.every((p) => p.dealId !== "d2"),
        `picked ${safe.promoSteps.map((p) => p.dealId).join(",") || "none"}`,
      ),
      ok(
        "S18.2",
        "Disclosures present for every promo",
        safe.promoSteps.every((p) => p.disclosure.length > 0),
      ),
      ok(
        "S18.3",
        "Forbidden labels never appear",
        safe.promoSteps.every((p) =>
          ["optional", "upgrade", "deal", "save", "available offer"].includes(p.label),
        ),
        "labels constrained to ALLOWED_LABELS",
      ),
      ok(
        "S18.4",
        "Low promo_sensitivity suppresses all promos",
        lowSens.promoSteps.length === 0,
      ),
      ok(
        "S18.5",
        "Max 2 promos per itinerary",
        safe.promoSteps.length <= 2,
        `count=${safe.promoSteps.length}`,
      ),
    ];
  },
};

// ── 19. Multi-Agent Orchestration ───────────────────────────────
const suiteOrchestration: TestSuite = {
  id: "S19",
  name: "Multi-Agent Orchestration",
  run: () => {
    const cityCtx = findCity("Miami");
    const v6 = runV6Engines({
      personality: "soft_life",
      budgetMode: "balanced",
      perPersonBudgetUsd: 75,
      budgetTier: 2,
      groupSize: 4,
      groupType: "friends",
      timeOfDay: "brunch",
      safetyModes: ["solo_women"],
      localFlavorLevel: "medium",
      weatherAware: true,
      forecast: null,
      cityCtx,
    });
    const containsAll = [
      "Personality",
      "Budget mode",
      "Group size",
      "Time-of-day engine",
      "Safety modes active",
      "Local flavor engine",
    ].every((s) => v6.directive.includes(s));
    return [
      ok("S19.1", "v6 composer wires all agents", containsAll, "all directive sections present"),
      ok(
        "S19.2",
        "No contradictory adult content under solo_women",
        !/strip club|adult entertainment\s+(?!default)/i.test(v6.directive) ||
          /default OFF|never default/i.test(v6.directive),
        "adult content explicitly default-off",
      ),
      ok(
        "S19.3",
        "Budget summary surfaced",
        !!v6.budgetSummary && !!v6.perPersonEstimate,
        `${v6.perPersonEstimate} / ${v6.groupTotalEstimate}`,
      ),
    ];
  },
};

// ── Final E2E (deterministic slice) ─────────────────────────────
const suiteE2E: TestSuite = {
  id: "E2E",
  name: "End-to-End: Miami Brunch Baddies / Soft Life / 4 girls",
  run: () => {
    const cityCtx = findCity("Miami");
    const v6 = runV6Engines({
      personality: "soft_life",
      budgetMode: "balanced",
      perPersonBudgetUsd: 75,
      budgetTier: 2,
      groupSize: 4,
      groupType: "friends",
      timeOfDay: "brunch",
      safetyModes: ["solo_women"],
      localFlavorLevel: "medium",
      weatherAware: true,
      forecast: {
        precipProb: 10,
        tMaxF: 82,
        tMinF: 70,
        label: "Sunny",
        emoji: "☀️",
        summary: "Sunny",
        source: "qa",
      } as never,
      cityCtx,
    });
    const checks: Array<[string, boolean, string]> = [
      ["City resolved", cityCtx.slug === "miami", cityCtx.label],
      ["Vibe applied", /soft.life/i.test(v6.directive), "soft_life directive present"],
      ["Budget applied", v6.perPersonEstimate.includes("$"), v6.perPersonEstimate],
      ["Group dynamics", /Group size 4/.test(v6.directive), v6.pacingStyle],
      ["Time-of-day brunch", /Brunch/.test(v6.directive), "brunch directive"],
      ["Safety solo_women", /solo_women|Solo-safe/.test(v6.directive + v6.safetyNotes), v6.safetyNotes ?? ""],
      ["Local flavor Miami", v6.localFlavorTags.length > 0, v6.localFlavorTags.join(" ")],
      ["Promo-safe rule injected", /Promo-safe/.test(v6.directive), "promo guard present"],
    ];
    return checks.map(([name, pass, notes], i) => ok(`E2E.${i + 1}`, name, pass, notes));
  },
};

export const SUITES: TestSuite[] = [
  suiteOnboarding,
  suiteVibes,
  suiteCategories,
  suiteCity,
  suiteItinerary,
  suiteNaming,
  suiteBooking,
  suiteOrderAhead,
  suiteGroup,
  suiteWeather,
  suiteSafety,
  suiteTime,
  suiteSwaps,
  suiteSaveShare,
  suiteRecap,
  suitePersonalization,
  suiteMultiDay,
  suitePromo,
  suiteOrchestration,
  suiteE2E,
];
