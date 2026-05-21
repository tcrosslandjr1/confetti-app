/**
 * Trip Planner Agent
 * Plans multi-stop and multi-state road trips with:
 *   - Route corridor venue discovery (dining, experiences, EV charging)
 *   - Smart stop spacing (every 1.5–2 hours of driving)
 *   - Timing and logistics (departure times, drive durations)
 *   - Integration with user taste profile for personalized stops
 *
 * Uses the venue discovery agent for corridor searches and
 * the AI engine for natural language trip planning.
 */

import { chat } from "./ai-provider";
import type { AIMessage } from "./ai-provider";
import {
  discoverTripCorridorVenues,
  discoverVenuesMock,
} from "./venue-discovery";
import type { DiscoveredVenue, GeoLocation } from "./venue-discovery";
import { getUserContext, getUserContextLocal, generateProfilePrompt } from "./user-intelligence";
import type { UserContext } from "./user-intelligence";
import { supabase } from "../supabase";

// ─── Types ─────────────────────────────────────────────────────

export type StopType =
  | "dining"
  | "experience"
  | "ev_charge"
  | "rest"
  | "overnight"
  | "attraction";

export interface TripRequest {
  origin: {
    city: string;
    state?: string;
    lat?: number;
    lng?: number;
  };
  destination: {
    city: string;
    state?: string;
    lat?: number;
    lng?: number;
  };
  departsAt?: string; // ISO datetime
  travelMode?: "driving" | "transit";
  preferences?: {
    stopFrequency?: "minimal" | "regular" | "frequent";
    stopTypes?: StopType[];
    cuisinePreferences?: string[];
    vibePreferences?: string[];
    budgetLevel?: string;
    needsEVCharging?: boolean;
    overnightStops?: boolean;
  };
}

export interface TripStop {
  id: string;
  stopOrder: number;
  stopType: StopType;
  name: string;
  city?: string;
  state?: string;
  latitude?: number;
  longitude?: number;
  arrivesAt?: string;
  durationMinutes?: number;
  distanceFromPrevMiles?: number;
  driveTimeFromPrevMinutes?: number;
  notes?: string;
  venue?: DiscoveredVenue;
  status: "planned" | "en_route" | "arrived" | "completed" | "skipped";
}

export interface TripPlan {
  id: string;
  userId: string;
  title: string;
  origin: TripRequest["origin"];
  destination: TripRequest["destination"];
  totalDistanceMiles?: number;
  totalDurationHours?: number;
  stops: TripStop[];
  travelMode: string;
  status: "planning" | "active" | "completed" | "cancelled";
  departsAt?: string;
  aiNarrative?: string;
}

// ─── Trip planning system prompt ───────────────────────────────

const TRIP_SYSTEM_PROMPT = `You are Confetti AI's Trip Planner — an expert at planning road trips with amazing food and experience stops along the way.

Your job:
- Plan trips between two cities with curated stops every 1.5-2 hours
- Each stop should be a dining experience, local attraction, or rest stop worth the detour
- Space stops logically — morning coffee spots early, lunch stops midday, dinner at the destination
- Include EV charging stops if requested
- Consider the user's taste profile for restaurant and experience recommendations

When describing a trip plan:
- Give it a fun, evocative title (e.g., "The Coastal Crawl: DC to Miami")
- Briefly describe each stop with why it's worth stopping
- Include estimated drive times between stops
- End with a summary of total trip time and highlights

Format each stop as:
Stop [N]: [Name] — [City, State]
Type: [dining/experience/ev_charge/rest/overnight]
Why: [One sentence on why this stop is special]
Drive from previous: [X] hours
Suggested duration: [X] minutes`;

// ─── Plan a trip ───────────────────────────────────────────────

export async function planTrip(
  userId: string,
  request: TripRequest
): Promise<TripPlan> {
  // Get user taste context
  let userContext: UserContext;
  try {
    userContext = await getUserContext(userId);
  } catch {
    userContext = getUserContextLocal();
  }

  // Discover venues along the corridor
  let corridorVenues: DiscoveredVenue[] = [];

  if (request.origin.lat && request.origin.lng && request.destination.lat && request.destination.lng) {
    try {
      corridorVenues = await discoverTripCorridorVenues({
        origin: {
          lat: request.origin.lat,
          lng: request.origin.lng,
          city: request.origin.city,
          state: request.origin.state,
        },
        destination: {
          lat: request.destination.lat,
          lng: request.destination.lng,
          city: request.destination.city,
          state: request.destination.state,
        },
        waypointIntervalMiles: Math.max(30, Math.round(300 / calculateWaypointCount(request))),
        corridorWidthMiles: 10,
        stopTypes: request.preferences?.stopTypes,
      });
    } catch {
      corridorVenues = discoverVenuesMock();
    }
  } else {
    corridorVenues = discoverVenuesMock();
  }

  // Build AI prompt with venue data
  const profilePrompt = generateProfilePrompt(userContext);
  const venueContext = corridorVenues
    .map(
      (v, i) =>
        `${i + 1}. ${v.name} (${v.category}) — ${v.city}${v.state ? `, ${v.state}` : ""}
   Rating: ${v.rating ?? "N/A"} | Price: ${v.priceLevel ?? "N/A"}
   Cuisines: ${v.cuisineTags.join(", ") || "N/A"} | Vibes: ${v.vibeTags.join(", ") || "N/A"}
   Lat: ${v.lat}, Lng: ${v.lng}`
    )
    .join("\n");

  const messages: AIMessage[] = [
    {
      role: "system",
      content: `${TRIP_SYSTEM_PROMPT}\n\n${profilePrompt}`,
    },
    {
      role: "user",
      content: `Plan a road trip from ${request.origin.city}${request.origin.state ? `, ${request.origin.state}` : ""} to ${request.destination.city}${request.destination.state ? `, ${request.destination.state}` : ""}.
${request.departsAt ? `Departing: ${request.departsAt}` : ""}
${request.preferences?.needsEVCharging ? "Include EV charging stops." : ""}
${request.preferences?.overnightStops ? "This is a long trip — include overnight stops." : ""}
${request.preferences?.stopFrequency === "frequent" ? "I want lots of stops to explore." : request.preferences?.stopFrequency === "minimal" ? "I want minimal stops — just the essentials." : "Regular stop spacing please."}

Here are venues I found along the route:
${venueContext}

Build me a trip plan using these venues where they fit, and suggest additional stops as needed.`,
    },
  ];

  let aiResponse;
  try {
    aiResponse = await chat(messages);
  } catch {
    aiResponse = {
      content: generateFallbackNarrative(request, corridorVenues),
      provider: "mock" as const,
      model: "fallback",
      latencyMs: 0,
    };
  }

  // Build trip plan from discovered venues
  const stops = buildStopsFromVenues(corridorVenues, request);

  const tripPlan: TripPlan = {
    id: crypto.randomUUID?.() ?? `trip-${Date.now()}`,
    userId,
    title: generateTripTitle(request),
    origin: request.origin,
    destination: request.destination,
    totalDistanceMiles: estimateDistance(request),
    totalDurationHours: estimateDuration(request, stops),
    stops,
    travelMode: request.travelMode ?? "driving",
    status: "planning",
    departsAt: request.departsAt,
    aiNarrative: aiResponse.content,
  };

  // Save to database
  await saveTripPlan(tripPlan).catch(() => {});

  return tripPlan;
}

// ─── Plan trip (mock mode) ─────────────────────────────────────

export function planTripMock(request: TripRequest): TripPlan {
  const mockVenues = getMockTripStops(request);

  return {
    id: `trip-mock-${Date.now()}`,
    userId: "mock-user",
    title: generateTripTitle(request),
    origin: request.origin,
    destination: request.destination,
    totalDistanceMiles: estimateDistance(request),
    totalDurationHours: estimateDuration(request, mockVenues),
    stops: mockVenues,
    travelMode: request.travelMode ?? "driving",
    status: "planning",
    departsAt: request.departsAt,
    aiNarrative: generateFallbackNarrative(request, []),
  };
}

// ─── Build stops from discovered venues ────────────────────────

function buildStopsFromVenues(
  venues: DiscoveredVenue[],
  request: TripRequest
): TripStop[] {
  const stops: TripStop[] = [];
  let stopOrder = 1;

  // Sort venues roughly by distance from origin (simple lat sort for corridor)
  const sorted = [...venues].sort((a, b) => {
    if (!a.lat || !b.lat) return 0;
    const originLat = request.origin.lat ?? 0;
    return (
      Math.abs(a.lat - originLat) - Math.abs(b.lat - originLat)
    );
  });

  // Pick best stops, spaced apart
  const selected = selectSpacedStops(sorted, request);

  for (const venue of selected) {
    stops.push({
      id: crypto.randomUUID?.() ?? `stop-${Date.now()}-${stopOrder}`,
      stopOrder,
      stopType: categorizeVenueAsStopType(venue),
      name: venue.name,
      city: venue.city,
      state: venue.state,
      latitude: venue.lat,
      longitude: venue.lng,
      durationMinutes: getStopDuration(categorizeVenueAsStopType(venue)),
      notes: `${venue.category}${venue.priceLevel ? ` • ${venue.priceLevel}` : ""}${venue.rating ? ` • ${venue.rating}★` : ""}`,
      venue,
      status: "planned",
    });
    stopOrder++;
  }

  return stops;
}

function selectSpacedStops(
  venues: DiscoveredVenue[],
  request: TripRequest
): DiscoveredVenue[] {
  if (venues.length <= 5) return venues;

  // Select up to 6 stops, reasonably spaced
  const selected: DiscoveredVenue[] = [];
  const minSpacingDeg = 0.3; // ~20 miles in latitude degrees

  for (const venue of venues) {
    if (selected.length >= 6) break;

    const tooClose = selected.some((s) => {
      if (!s.lat || !s.lng || !venue.lat || !venue.lng)
        return false;
      const latDiff = Math.abs(s.lat - venue.lat);
      const lngDiff = Math.abs(s.lng - venue.lng);
      return latDiff < minSpacingDeg && lngDiff < minSpacingDeg;
    });

    if (!tooClose) {
      selected.push(venue);
    }
  }

  return selected;
}

function categorizeVenueAsStopType(venue: DiscoveredVenue): StopType {
  const cat = venue.category?.toLowerCase() ?? "";
  if (/restaurant|cafe|bakery|food|diner|grill|pizz/.test(cat)) return "dining";
  if (/museum|gallery|park|garden|theater|cinema/.test(cat)) return "attraction";
  if (/hotel|motel|inn|lodge|resort/.test(cat)) return "overnight";
  if (/gas|fuel|charge|ev|tesla/.test(cat)) return "ev_charge";
  return "experience";
}

function getStopDuration(type: StopType): number {
  switch (type) {
    case "dining":
      return 60;
    case "experience":
      return 45;
    case "attraction":
      return 90;
    case "ev_charge":
      return 30;
    case "rest":
      return 20;
    case "overnight":
      return 480;
    default:
      return 45;
  }
}

// ─── Mock trip stops ───────────────────────────────────────────

function getMockTripStops(request: TripRequest): TripStop[] {
  const originCity = request.origin.city.toLowerCase();
  const destCity = request.destination.city.toLowerCase();

  // DC to New York corridor
  if (
    (originCity.includes("washington") || originCity.includes("dc")) &&
    (destCity.includes("new york") || destCity.includes("nyc"))
  ) {
    return [
      {
        id: "stop-1",
        stopOrder: 1,
        stopType: "dining",
        name: "Milk Bar",
        city: "Baltimore",
        state: "MD",
        latitude: 39.2904,
        longitude: -76.6122,
        durationMinutes: 30,
        distanceFromPrevMiles: 40,
        driveTimeFromPrevMinutes: 50,
        notes: "Bakery • $$ • Famous birthday cake truffles",
        status: "planned",
      },
      {
        id: "stop-2",
        stopOrder: 2,
        stopType: "dining",
        name: "Pat's King of Steaks",
        city: "Philadelphia",
        state: "PA",
        latitude: 39.9332,
        longitude: -75.1590,
        durationMinutes: 45,
        distanceFromPrevMiles: 100,
        driveTimeFromPrevMinutes: 95,
        notes: "American • $ • The OG Philly cheesesteak since 1930",
        status: "planned",
      },
      {
        id: "stop-3",
        stopOrder: 3,
        stopType: "experience",
        name: "Grounds For Sculpture",
        city: "Hamilton",
        state: "NJ",
        latitude: 40.2298,
        longitude: -74.7290,
        durationMinutes: 90,
        distanceFromPrevMiles: 35,
        driveTimeFromPrevMinutes: 40,
        notes: "Outdoor sculpture park • Great photo ops",
        status: "planned",
      },
      {
        id: "stop-4",
        stopOrder: 4,
        stopType: "dining",
        name: "Harold's New York Deli",
        city: "Edison",
        state: "NJ",
        latitude: 40.5187,
        longitude: -74.4121,
        durationMinutes: 45,
        distanceFromPrevMiles: 25,
        driveTimeFromPrevMinutes: 30,
        notes: "Deli • $$ • Massive sandwiches, no-frills legendary",
        status: "planned",
      },
    ];
  }

  // Generic fallback stops
  return [
    {
      id: "stop-1",
      stopOrder: 1,
      stopType: "dining",
      name: `Best Eats of ${request.origin.state ?? "the region"}`,
      city: request.origin.city,
      state: request.origin.state,
      durationMinutes: 45,
      distanceFromPrevMiles: 0,
      driveTimeFromPrevMinutes: 0,
      notes: "Starting point fuel-up",
      status: "planned",
    },
    {
      id: "stop-2",
      stopOrder: 2,
      stopType: "rest",
      name: "Midway Rest Stop",
      durationMinutes: 20,
      distanceFromPrevMiles: estimateDistance(request) / 2,
      driveTimeFromPrevMinutes: (estimateDuration(request, []) * 60) / 2,
      notes: "Stretch, refuel, refresh",
      status: "planned",
    },
    {
      id: "stop-3",
      stopOrder: 3,
      stopType: "dining",
      name: `Welcome to ${request.destination.city}`,
      city: request.destination.city,
      state: request.destination.state,
      durationMinutes: 60,
      distanceFromPrevMiles: estimateDistance(request) / 2,
      driveTimeFromPrevMinutes: (estimateDuration(request, []) * 60) / 2,
      notes: "First meal at your destination",
      status: "planned",
    },
  ];
}

// ─── Helpers ───────────────────────────────────────────────────

function calculateWaypointCount(request: TripRequest): number {
  const dist = estimateDistance(request);
  if (dist > 500) return 6;
  if (dist > 300) return 4;
  if (dist > 150) return 3;
  return 2;
}

function estimateDistance(request: TripRequest): number {
  if (request.origin.lat && request.origin.lng && request.destination.lat && request.destination.lng) {
    const R = 3959; // Earth radius in miles
    const dLat = toRad(request.destination.lat - request.origin.lat);
    const dLng = toRad(request.destination.lng - request.origin.lng);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(request.origin.lat)) *
        Math.cos(toRad(request.destination.lat)) *
        Math.sin(dLng / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c * 1.3); // 1.3x for road vs straight line
  }

  // Rough estimate by city pair knowledge
  const pair = `${request.origin.city}-${request.destination.city}`.toLowerCase();
  const known: Record<string, number> = {
    "washington-new york": 225,
    "washington-miami": 1060,
    "washington-atlanta": 640,
    "washington-chicago": 700,
    "new york-boston": 215,
    "los angeles-san francisco": 380,
    "los angeles-las vegas": 270,
  };
  return known[pair] ?? 300; // default 300 miles
}

function estimateDuration(request: TripRequest, stops: TripStop[]): number {
  const dist = estimateDistance(request);
  const drivingHours = dist / 55; // assume 55 mph average
  const stopHours =
    stops.reduce((sum, s) => sum + (s.durationMinutes ?? 0), 0) / 60;
  return Math.round((drivingHours + stopHours) * 10) / 10;
}

function generateTripTitle(request: TripRequest): string {
  const titles = [
    `${request.origin.city} → ${request.destination.city} Road Trip`,
    `The ${request.origin.city} to ${request.destination.city} Confetti`,
    `${request.origin.state ?? request.origin.city} to ${request.destination.state ?? request.destination.city} Adventure`,
  ];
  return titles[0];
}

function generateFallbackNarrative(
  request: TripRequest,
  venues: DiscoveredVenue[]
): string {
  const dist = estimateDistance(request);
  return `Road trip from ${request.origin.city} to ${request.destination.city} — roughly ${dist} miles of open road! 🚗

I've mapped out some great stops along the way. You'll hit a mix of dining spots and experiences, spaced out so you're never driving more than 2 hours between breaks.

${venues.length > 0 ? `I found ${venues.length} venues along your corridor. The highlights are curated based on your taste profile — expect some hidden gems mixed in with local favorites.` : "I'll populate real venues once we're connected to live data. For now, I've got some crowd-favorites mapped out."}

Want me to adjust the stops, add EV charging, or change the vibe?`;
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

// ─── Database persistence ──────────────────────────────────────

async function saveTripPlan(plan: TripPlan): Promise<void> {
  // Save trip plan
  const { error: tripError } = await supabase.from("trip_plans").upsert({
    id: plan.id,
    user_id: plan.userId,
    title: plan.title,
    origin_city: plan.origin.city,
    origin_state: plan.origin.state,
    origin_lat: plan.origin.lat,
    origin_lng: plan.origin.lng,
    destination_city: plan.destination.city,
    destination_state: plan.destination.state,
    destination_lat: plan.destination.lat,
    destination_lng: plan.destination.lng,
    total_distance_miles: plan.totalDistanceMiles,
    total_duration_hours: plan.totalDurationHours,
    waypoints: plan.stops.map((s) => ({
      city: s.city,
      state: s.state,
      lat: s.latitude,
      lng: s.longitude,
      stop_type: s.stopType,
      notes: s.notes,
    })),
    travel_mode: plan.travelMode,
    status: plan.status,
    departs_at: plan.departsAt,
  });

  if (tripError) {
    console.warn("[Trip Planner] Failed to save trip plan:", tripError.message);
    return;
  }

  // Save individual stops
  const stopRows = plan.stops.map((s) => ({
    id: s.id,
    trip_id: plan.id,
    stop_order: s.stopOrder,
    stop_type: s.stopType,
    name: s.name,
    city: s.city,
    state: s.state,
    latitude: s.latitude,
    longitude: s.longitude,
    arrives_at: s.arrivesAt,
    duration_minutes: s.durationMinutes,
    distance_from_prev_miles: s.distanceFromPrevMiles,
    drive_time_from_prev_minutes: s.driveTimeFromPrevMinutes,
    notes: s.notes,
    status: s.status,
  }));

  await supabase.from("trip_stops").upsert(stopRows);
}

// ─── Load trip plans for user ──────────────────────────────────

export async function getUserTrips(
  userId: string
): Promise<TripPlan[]> {
  const { data, error } = await supabase
    .from("trip_plans")
    .select(`*, trip_stops(*)`)
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(10);

  if (error || !data) return [];

  return data.map((row: any) => ({
    id: row.id,
    userId: row.user_id,
    title: row.title,
    origin: {
      city: row.origin_city,
      state: row.origin_state,
      lat: row.origin_lat,
      lng: row.origin_lng,
    },
    destination: {
      city: row.destination_city,
      state: row.destination_state,
      lat: row.destination_lat,
      lng: row.destination_lng,
    },
    totalDistanceMiles: row.total_distance_miles,
    totalDurationHours: row.total_duration_hours,
    stops: (row.trip_stops ?? [])
      .sort((a: { stop_order: number }, b: { stop_order: number }) => a.stop_order - b.stop_order)
      .map((s: Record<string, unknown>) => ({
        id: s.id as string,
        stopOrder: s.stop_order as number,
        stopType: s.stop_type as StopType,
        name: s.name as string,
        city: s.city as string,
        state: s.state as string,
        latitude: s.latitude as number,
        longitude: s.longitude as number,
        arrivesAt: s.arrives_at as string,
        durationMinutes: s.duration_minutes as number,
        distanceFromPrevMiles: s.distance_from_prev_miles as number,
        driveTimeFromPrevMinutes: s.drive_time_from_prev_minutes as number,
        notes: s.notes as string,
        status: (s.status as string) ?? "planned",
      })),
    travelMode: row.travel_mode,
    status: row.status,
    departsAt: row.departs_at,
  }));
}
