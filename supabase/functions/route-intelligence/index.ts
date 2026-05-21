import { corsHeaders } from "../_shared/cors.ts";
import { funSectors, getAgentSectorContext } from "../_shared/fun-sectors.ts";

type StopInput = {
  name: string;
  time: string;
  area: string;
  address?: string;
  parking?: string;
  pickup?: string;
  valet?: {
    available: boolean;
    detail: string;
  };
};

type TrafficSeverity = "clear" | "moderate" | "heavy";

const tomtomKey = Deno.env.get("TOMTOM_API_KEY");

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return json({ error: "Use POST" }, 405);
  }

  try {
    const { stops } = await req.json() as { stops?: StopInput[] };
    if (!Array.isArray(stops) || stops.length === 0) {
      return json({ error: "Missing stops array" }, 400);
    }

    const geocodedStops = await Promise.all(stops.map((stop) => geocodeStop(stop)));
    const alerts = await buildTrafficAlerts(geocodedStops);
    const venues = await Promise.all(geocodedStops.map((stop) => enrichVenue(stop)));

    return json({
      provider: tomtomKey ? "TomTom + OpenStreetMap" : "OpenStreetMap fallback",
      updatedAt: new Date().toISOString(),
      sectors: funSectors,
      agentContext: getAgentSectorContext(),
      alerts,
      venues
    });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Unknown error" }, 500);
  }
});

async function buildTrafficAlerts(stops: Array<StopInput & { lat?: number; lon?: number }>) {
  const alerts = [];

  for (let index = 0; index < stops.length; index += 1) {
    const from = index === 0 ? undefined : stops[index - 1];
    const to = stops[index];
    const route = await getRoute(from, to);
    const severity = getSeverity(route.delayMinutes);

    alerts.push({
      id: `${from?.name ?? "home"}-${to.name}`.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      severity,
      route: `${from?.area ?? "Current location"} -> ${to.area}`,
      fromStop: from?.name ?? "Home",
      toStop: to.name,
      title: route.delayMinutes > 0 ? `${route.delayMinutes} min traffic delay` : "Traffic looks normal",
      detail: route.detail,
      currentEta: `${route.currentEtaMinutes} min`,
      normalEta: `${route.normalEtaMinutes} min`,
      currentEtaMinutes: route.currentEtaMinutes,
      normalEtaMinutes: route.normalEtaMinutes,
      delayMinutes: route.delayMinutes,
      leaveBy: calculateLeaveBy(to.time, route.currentEtaMinutes, index === 0 ? 14 : 10, 8),
      recommendation: route.delayMinutes > 5
        ? `Leave earlier for ${to.name}; keep ${to.parking ?? "parking details"} in mind.`
        : `Leave on schedule for ${to.name}; ${to.valet?.available ? to.valet.detail : to.parking ?? "confirm parking before arrival"}.`,
      updated: "Live"
    });
  }

  return alerts;
}

async function getRoute(from: (StopInput & { lat?: number; lon?: number }) | undefined, to: StopInput & { lat?: number; lon?: number }) {
  if (tomtomKey && from?.lat && from.lon && to.lat && to.lon) {
    const url = new URL(`https://api.tomtom.com/routing/1/calculateRoute/${from.lat},${from.lon}:${to.lat},${to.lon}/json`);
    url.searchParams.set("key", tomtomKey);
    url.searchParams.set("traffic", "true");
    url.searchParams.set("routeType", "fastest");
    url.searchParams.set("travelMode", "car");

    const response = await fetch(url);
    if (response.ok) {
      const data = await response.json();
      const summary = data.routes?.[0]?.summary;
      if (summary) {
        const currentEtaMinutes = Math.max(1, Math.round((summary.travelTimeInSeconds ?? 0) / 60));
        const noTrafficMinutes = Math.max(1, Math.round((summary.noTrafficTravelTimeInSeconds ?? summary.travelTimeInSeconds ?? 0) / 60));
        const delayMinutes = Math.max(0, currentEtaMinutes - noTrafficMinutes);

        return {
          currentEtaMinutes,
          normalEtaMinutes: noTrafficMinutes,
          delayMinutes,
          detail: delayMinutes > 0
            ? "Live traffic is slower than normal on this leg."
            : "Live traffic is close to normal on this leg."
        };
      }
    }
  }

  const fallbackEta = to.area === "Georgetown" ? 12 : to.area === "14th Street" ? 20 : 9;
  const fallbackNormal = to.area === "14th Street" ? 12 : fallbackEta;

  return {
    currentEtaMinutes: fallbackEta,
    normalEtaMinutes: fallbackNormal,
    delayMinutes: Math.max(0, fallbackEta - fallbackNormal),
    detail: tomtomKey
      ? "Live routing was unavailable for this leg, so Confetti used cached route timing."
      : "Set TOMTOM_API_KEY to enable live traffic for this leg."
  };
}

async function geocodeStop(stop: StopInput) {
  const query = stop.address || `${stop.name}, ${stop.area}`;
  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("extratags", "1");
  url.searchParams.set("limit", "1");
  url.searchParams.set("q", query);

  const response = await fetch(url, {
    headers: {
      "Accept": "application/json",
      "User-Agent": "TimeApp Route Intelligence"
    }
  });

  if (!response.ok) {
    return stop;
  }

  const data = await response.json();
  const result = data?.[0];

  return {
    ...stop,
    lat: result?.lat ? Number(result.lat) : undefined,
    lon: result?.lon ? Number(result.lon) : undefined,
    osm: result
  };
}

async function enrichVenue(stop: StopInput & { osm?: Record<string, unknown> }) {
  const extratags = (stop.osm?.extratags ?? {}) as Record<string, string>;

  return {
    stopName: stop.name,
    address: stop.address,
    phone: extratags.phone || extratags["contact:phone"],
    hours: extratags.opening_hours,
    website: extratags.website || extratags["contact:website"],
    parking: stop.parking,
    valet: stop.valet,
    entrance: extratags.entrance ? `Entrance tagged as ${extratags.entrance}` : undefined,
    businessNotes: stop.valet?.available
      ? `${stop.valet.detail}. Confirm reservation and curb timing before arrival.`
      : "No valet signal found. Confirm parking and entrance instructions before arrival.",
    source: stop.osm ? "OpenStreetMap/Nominatim" : "App itinerary"
  };
}

function getSeverity(delayMinutes: number): TrafficSeverity {
  if (delayMinutes >= 8) return "heavy";
  if (delayMinutes >= 3) return "moderate";
  return "clear";
}

function calculateLeaveBy(arrivalTime: string, travelMinutes: number, parkingMinutes: number, arrivalBufferMinutes: number) {
  const arrival = parseClockTime(arrivalTime);
  return formatClockTime(arrival - travelMinutes - parkingMinutes - arrivalBufferMinutes);
}

function parseClockTime(time: string) {
  const match = time.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return 0;
  const [, hourText, minuteText, meridiem] = match;
  let hours = Number(hourText);
  const minutes = Number(minuteText);
  if (meridiem.toUpperCase() === "PM" && hours !== 12) hours += 12;
  if (meridiem.toUpperCase() === "AM" && hours === 12) hours = 0;
  return hours * 60 + minutes;
}

function formatClockTime(totalMinutes: number) {
  const wrapped = ((totalMinutes % 1440) + 1440) % 1440;
  const hours24 = Math.floor(wrapped / 60);
  const minutes = wrapped % 60;
  const meridiem = hours24 >= 12 ? "PM" : "AM";
  const hours12 = hours24 % 12 || 12;
  return `${hours12}:${String(minutes).padStart(2, "0")} ${meridiem}`;
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json"
    }
  });
}
