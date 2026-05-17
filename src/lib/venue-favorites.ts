import { supabase } from "@/integrations/supabase/client";

export type VenueFavorite = {
  id: string;
  user_id: string;
  venue_id: string;
  venue_name: string;
  image_url: string | null;
  category: string | null;
  neighborhood: string | null;
  city: string | null;
  created_at: string;
};

export type FavoritePayload = {
  venue_id: string;
  venue_name: string;
  image_url?: string | null;
  category?: string | null;
  neighborhood?: string | null;
  city?: string | null;
};

export async function listMyFavorites(): Promise<VenueFavorite[]> {
  const { data, error } = await supabase
    .from("venue_favorites")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as VenueFavorite[];
}

export async function isFavorited(userId: string, venueId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from("venue_favorites")
    .select("id")
    .eq("user_id", userId)
    .eq("venue_id", venueId)
    .maybeSingle();
  if (error) throw error;
  return !!data;
}

export async function addFavorite(userId: string, payload: FavoritePayload) {
  const { error } = await supabase.from("venue_favorites").insert({
    user_id: userId,
    venue_id: payload.venue_id,
    venue_name: payload.venue_name,
    image_url: payload.image_url ?? null,
    category: payload.category ?? null,
    neighborhood: payload.neighborhood ?? null,
    city: payload.city ?? null,
  });
  if (error && !/duplicate key/i.test(error.message)) throw error;
}

export async function removeFavorite(userId: string, venueId: string) {
  const { error } = await supabase
    .from("venue_favorites")
    .delete()
    .eq("user_id", userId)
    .eq("venue_id", venueId);
  if (error) throw error;
}
