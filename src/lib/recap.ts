// Recap helpers: find the latest itinerary that's ready for a morning recap
// (completed but not yet rated) and surface lightweight stop info for the UI.

import { supabase } from "@/integrations/supabase/client";

export type RecapStopLite = {
  id: string;
  position: number;
  name: string;
  category: string | null;
  start_time: string | null;
  user_rating: number | null;
  user_review: string | null;
};

export type RecapItinerary = {
  id: string;
  title: string;
  date: string | null;
  city: string | null;
  vibe: string | null;
  completed_at: string | null;
  overall_rating: number | null;
  stops: RecapStopLite[];
};

/** Returns the most recent completed itinerary that hasn't been rated yet. */
export async function findPendingRecap(): Promise<RecapItinerary | null> {
  const { data: userRes } = await supabase.auth.getUser();
  if (!userRes.user) return null;

  const { data: it } = await supabase
    .from("itineraries")
    .select("id,title,date,city,vibe,completed_at,overall_rating")
    .not("completed_at", "is", null)
    .is("overall_rating", null)
    .order("completed_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!it) return null;

  const { data: stops } = await supabase
    .from("itinerary_stops")
    .select("id,position,name,category,start_time,user_rating,user_review")
    .eq("itinerary_id", it.id)
    .order("position");

  return { ...(it as Omit<RecapItinerary, "stops">), stops: (stops ?? []) as RecapStopLite[] };
}

export async function getRecap(itineraryId: string): Promise<RecapItinerary | null> {
  const { data: it } = await supabase
    .from("itineraries")
    .select("id,title,date,city,vibe,completed_at,overall_rating")
    .eq("id", itineraryId)
    .maybeSingle();
  if (!it) return null;
  const { data: stops } = await supabase
    .from("itinerary_stops")
    .select("id,position,name,category,start_time,user_rating,user_review")
    .eq("itinerary_id", itineraryId)
    .order("position");
  return { ...(it as Omit<RecapItinerary, "stops">), stops: (stops ?? []) as RecapStopLite[] };
}

export const REASONS_DOWN = [
  "too pricey",
  "wrong vibe",
  "been there",
  "too far",
  "too crowded",
  "slow service",
  "mid food",
  "rude staff",
];

export const REASONS_UP = [
  "loved vibe",
  "great food",
  "good value",
  "perfect timing",
  "amazing service",
  "would repeat",
  "great drinks",
  "hidden gem",
];
