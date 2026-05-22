// Map a persisted Supabase itinerary + stops into the in-memory ActiveLoop
// shape the BoardingPassV3 component consumes.

import type { Itinerary, Stop } from "@/lib/itineraries";
import type { ActiveLoop, LoopStop } from "@/lib/loop-store";

const CATEGORY_EMOJI: Record<string, string> = {
  meal: "🍽️",
  drinks: "🍸",
  activity: "🎯",
  scenic: "🌇",
  travel: "🚗",
  other: "✨",
};

function formatTime(t?: string | null): string {
  if (!t) return "";
  // 'HH:MM:SS' → '7:30 PM'
  const [hh, mm] = t.split(":");
  const h = Number(hh);
  if (Number.isNaN(h)) return t;
  const period = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${mm ?? "00"} ${period}`;
}

function formatDate(d?: string | null): string {
  if (!d) return "";
  const parsed = new Date(d);
  if (Number.isNaN(parsed.getTime())) return d;
  return parsed.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function dayName(d?: string | null): string | undefined {
  if (!d) return undefined;
  const parsed = new Date(d);
  if (Number.isNaN(parsed.getTime())) return undefined;
  return parsed.toLocaleDateString(undefined, { weekday: "long" });
}

function gateFromCity(city?: string | null): string {
  if (!city) return "TRIP";
  return (
    city
      .replace(/[^a-zA-Z ]/g, "")
      .trim()
      .split(/\s+/)
      .map((w) => w[0])
      .join("")
      .slice(0, 5)
      .toUpperCase() || "TRIP"
  );
}

export function itineraryToActiveLoop(
  itinerary: Itinerary,
  stops: Stop[],
  passenger = "Guest",
): ActiveLoop {
  const sorted = [...stops].sort((a, b) => a.position - b.position);
  const first = sorted[0];
  const last = sorted[sorted.length - 1];

  const loopStops: LoopStop[] = sorted.map((s, i) => ({
    id: s.id ?? `s${i + 1}`,
    name: s.name,
    type: s.description || s.category || "Stop",
    time: formatTime(s.start_time),
    area: s.address?.split(",").slice(-3, -2)[0]?.trim(),
    address: s.address ?? undefined,
    emoji: CATEGORY_EMOJI[s.category] ?? "📍",
    detail: s.what_to_do ?? s.description ?? undefined,
    parking: s.parking
      ? { primary: `${s.parking.type} · ${s.parking.cost}`, secondary: s.parking.access }
      : undefined,
    tags: (s.review_snippets ?? [])
      .slice(0, 3)
      .map((label) => ({ label, variant: "vibe" as const })),
    bookable: !!s.booking_url,
    bookingType: s.booking_url ? "reservation" : undefined,
    rationale: s.tips?.[0],
    done: !!s.completed_at,
    checkedInAt: s.completed_at ?? undefined,
    category: s.category,
    dressCode: s.dress_code ?? undefined,
  }));

  return {
    id: itinerary.id,
    passenger,
    date: formatDate(itinerary.date) || itinerary.title,
    day: dayName(itinerary.date),
    groupSize: first?.party_size ?? 2,
    from: "HOME",
    to: (itinerary.title || "TRIP").toUpperCase().slice(0, 24),
    fromName: itinerary.city ?? undefined,
    toName: last?.address?.split(",").slice(-3, -2)[0]?.trim(),
    gate: gateFromCity(itinerary.city),
    boardingTime: formatTime(first?.start_time ?? itinerary.start_time),
    occasion: itinerary.occasion_slug?.replace(/-/g, " ") ?? undefined,
    vibe: itinerary.vibe ?? undefined,
    vibes: itinerary.vibe ? [itinerary.vibe] : undefined,
    city: itinerary.city ?? undefined,
    experienceName: itinerary.title,
    experienceTagline: itinerary.summary ?? undefined,
    estimatedSpend: itinerary.est_total_cost ?? undefined,
    stops: loopStops,
  };
}
