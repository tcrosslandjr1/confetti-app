import { supabase } from "@/integrations/supabase/client";

export type Stop = {
  id?: string;
  position: number;
  name: string;
  category: "meal" | "activity" | "drinks" | "scenic" | "travel" | "other" | string;
  description?: string;
  address?: string;
  start_time?: string | null;       // 'HH:MM:SS'
  duration_minutes?: number | null;
  est_cost?: string;
  what_to_do?: string;
  booking_url?: string;
  booking_provider?: string;
  booking_status?: "unbooked" | "pending" | "confirmed";
  booking_ref?: string | null;
  user_notes?: string | null;
  review_snippets?: string[] | null;
  parking?: { type: string; cost: string; access: string } | null;
  tips?: string[] | null;
  user_rating?: number | null;
  user_review?: string | null;
  completed_at?: string | null;
  travel_from_prev?: TravelLeg | null;
  party_size?: number | null;
  reservation_time?: string | null;
  contact_phone?: string | null;
  contact_email?: string | null;
  confirmation_note?: string | null;
};

export type TravelLeg = {
  mode: "walk" | "car" | "transit" | "lyft" | "uber" | "rideshare" | "bike" | string;
  durationMinutes: number;
  distance?: string;
  instructions: string;
  estCost?: string;
};

export type Itinerary = {
  id: string;
  user_id: string;
  title: string;
  occasion_slug?: string | null;
  vibe?: string | null;
  summary?: string | null;
  date?: string | null;
  start_time?: string | null;
  city?: string | null;
  est_total_cost?: string | null;
  source: "planner" | "card" | "ai" | string;
  created_at: string;
  updated_at: string;
  completed_at?: string | null;
  overall_rating?: number | null;
  overall_review?: string | null;
  transport_mode?: string | null;
};

type AiStop = {
  name: string; category: string; description: string; address: string;
  startTime: string; durationMinutes: number; estCost: string; whatToDo: string;
  bookingUrl: string; bookingProvider: string;
  reviewSnippets?: string[];
  parking?: { type: string; cost: string; access: string };
  tips?: string[];
  travelFromPrev?: TravelLeg | null;
};
type AiItinerary = {
  title: string; summary: string; estTotalCost: string; stops: AiStop[];
};

export type BuildPayload = {
  occasion: string;
  vibe?: string;
  city?: string;
  date?: string;
  startTime?: string;
  durationHours?: number;
  budget?: string;
  neighborhood?: string;
  notes?: string;
  seedIdea?: { title: string; hook?: string; description?: string; vibeTags?: string[] };
  occasionSlug?: string;
  transportMode?: "auto" | "car" | "transit" | "lyft" | "uber" | "walk";
};

export async function buildAndSaveItinerary(payload: BuildPayload): Promise<{ id: string }> {
  const { data: userRes } = await supabase.auth.getUser();
  const user = userRes.user;
  if (!user) throw new Error("Sign in required to save itineraries.");

  const { loadPrefs, tasteSummary } = await import("@/lib/taste");
  const prefs = await loadPrefs();

  const { data, error } = await supabase.functions.invoke("build-itinerary", {
    body: { ...payload, tasteSummary: tasteSummary(prefs) },
  });
  if (error) throw new Error(error.message);
  const it = data?.itinerary as AiItinerary;
  if (!it?.stops?.length) throw new Error("AI returned no stops. Try again.");

  // Insert itinerary
  const { data: ins, error: insErr } = await supabase
    .from("itineraries")
    .insert({
      user_id: user.id,
      title: it.title,
      occasion_slug: payload.occasionSlug ?? null,
      vibe: payload.vibe ?? null,
      summary: it.summary,
      date: payload.date ?? null,
      start_time: payload.startTime ? `${payload.startTime}:00` : null,
      city: payload.city ?? null,
      est_total_cost: it.estTotalCost,
      source: payload.seedIdea ? "card" : "planner",
      transport_mode: payload.transportMode ?? "auto",
    })
    .select("id")
    .single();
  if (insErr || !ins) throw new Error(insErr?.message ?? "Failed to save plan");

  // Insert stops
  const stops = it.stops.map((s, idx) => ({
    itinerary_id: ins.id,
    position: idx,
    name: s.name,
    category: s.category,
    description: s.description,
    address: s.address,
    start_time: s.startTime ? `${s.startTime}:00` : null,
    duration_minutes: s.durationMinutes,
    est_cost: s.estCost,
    what_to_do: s.whatToDo,
    booking_url: s.bookingUrl,
    booking_provider: s.bookingProvider,
    review_snippets: s.reviewSnippets ?? [],
    parking: s.parking ?? null,
    tips: s.tips ?? [],
    travel_from_prev: idx === 0 ? null : (s.travelFromPrev ?? null),
  }));
  const { error: stopsErr } = await supabase.from("itinerary_stops").insert(stops);
  if (stopsErr) throw new Error(stopsErr.message);

  return { id: ins.id };
}

export async function listItineraries(): Promise<Itinerary[]> {
  const { data, error } = await supabase
    .from("itineraries")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data as Itinerary[];
}

export async function getItinerary(id: string): Promise<{ itinerary: Itinerary; stops: Stop[] }> {
  const { data: it, error: e1 } = await supabase
    .from("itineraries").select("*").eq("id", id).single();
  if (e1 || !it) throw new Error(e1?.message ?? "Not found");
  const { data: stops, error: e2 } = await supabase
    .from("itinerary_stops").select("*").eq("itinerary_id", id).order("position");
  if (e2) throw new Error(e2.message);
  return { itinerary: it as Itinerary, stops: (stops ?? []) as Stop[] };
}

export async function updateStop(stopId: string, patch: Partial<Stop>): Promise<void> {
  const { error } = await supabase.from("itinerary_stops").update(patch).eq("id", stopId);
  if (error) throw new Error(error.message);
}

export async function deleteItinerary(id: string): Promise<void> {
  const { error } = await supabase.from("itineraries").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export async function updateItinerary(id: string, patch: Partial<Itinerary>): Promise<void> {
  const { error } = await supabase.from("itineraries").update(patch).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function completeItinerary(id: string): Promise<void> {
  await updateItinerary(id, { completed_at: new Date().toISOString() });
}

export type Reservation = Stop & {
  itinerary_id: string;
  itinerary_title: string;
  itinerary_date: string | null;
  itinerary_city: string | null;
};

export async function listReservations(): Promise<Reservation[]> {
  const { data, error } = await supabase
    .from("itinerary_stops")
    .select("*, itineraries!inner(id, title, date, city, user_id)")
    .in("booking_status", ["pending", "confirmed"])
    .order("position");
  if (error) throw new Error(error.message);
  return (data ?? []).map((r: any) => ({
    ...r,
    itinerary_id: r.itineraries.id,
    itinerary_title: r.itineraries.title,
    itinerary_date: r.itineraries.date,
    itinerary_city: r.itineraries.city,
  })) as Reservation[];
}
