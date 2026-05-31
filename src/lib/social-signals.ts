// Client hooks for social_venue_signals — feeds reels and hashtag strips.
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getSelectedCity } from "@/lib/cities";
import { TOKENS } from "@/components/new-confetti/shell";

export type VenueSignal = {
  id: string;
  venue_name: string;
  venue_slug: string;
  city_slug: string;
  platform: string;
  signal_type: string;
  sentiment: string;
  hashtags: string[];
  snippet: string | null;
  engagement_score: number;
  neighborhood: string | null;
  category: string | null;
};

// signal_type → accent color
export const SIGNAL_COLOR: Record<string, string> = {
  trending: TOKENS.accent1,
  popular: TOKENS.accent2,
  new: TOKENS.accent3,
  lowkey: TOKENS.accent4 ?? TOKENS.accent2,
  unique: TOKENS.accent1,
};

// DC fallback reels shown when DB has no signals yet
export const FALLBACK_SIGNALS: VenueSignal[] = [
  {
    id: "f1", venue_name: "Le Diplomate", venue_slug: "le-diplomate",
    city_slug: "dc", platform: "tiktok", signal_type: "trending",
    sentiment: "positive", hashtags: ["lediplomatedc", "dcfoodie"],
    snippet: "best steak frites in DC, no debate.",
    engagement_score: 1200, neighborhood: "Logan Circle", category: "restaurant",
  },
  {
    id: "f2", venue_name: "All Souls Bar", venue_slug: "all-souls-bar",
    city_slug: "dc", platform: "instagram", signal_type: "popular",
    sentiment: "positive", hashtags: ["allsoulsbar", "dcnightlife"],
    snippet: "this basement dive is exactly what DC needed.",
    engagement_score: 840, neighborhood: "Columbia Heights", category: "bar",
  },
  {
    id: "f3", venue_name: "Blagden Alley", venue_slug: "blagden-alley",
    city_slug: "dc", platform: "tiktok", signal_type: "new",
    sentiment: "positive", hashtags: ["blagdenalley", "dcbars"],
    snippet: "hidden alley, unlimited vibes.",
    engagement_score: 620, neighborhood: "Shaw", category: "bar",
  },
  {
    id: "f4", venue_name: "Ivy City Smokehouse", venue_slug: "ivy-city-smokehouse",
    city_slug: "dc", platform: "tiktok", signal_type: "lowkey",
    sentiment: "positive", hashtags: ["dcbbq", "ivycity"],
    snippet: "locals only energy. waterfront smoke break mandatory.",
    engagement_score: 510, neighborhood: "Ivy City", category: "restaurant",
  },
  {
    id: "f5", venue_name: "Gravitas", venue_slug: "gravitas",
    city_slug: "dc", platform: "instagram", signal_type: "unique",
    sentiment: "positive", hashtags: ["gravitasdc", "dcfinedining"],
    snippet: "tasting menu, chef's counter, zero pretension.",
    engagement_score: 480, neighborhood: "Union Market", category: "restaurant",
  },
];

function parseRow(row: {
  id: string; venue_name: string; venue_slug: string; city_slug: string;
  platform: string; signal_type: string; sentiment: string; hashtags: string;
  snippet: string | null; engagement_score: number; neighborhood: string | null;
  category: string | null;
}): VenueSignal {
  return {
    ...row,
    hashtags: row.hashtags ? row.hashtags.split(",").filter(Boolean) : [],
  };
}

/** All active signals for the user's selected city, ordered by engagement. */
export function useCitySignals(limit = 20) {
  const [signals, setSignals] = useState<VenueSignal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const city = getSelectedCity();
    const citySlug = city?.slug ?? "dmv";

    supabase
      .from("social_venue_signals")
      .select("id,venue_name,venue_slug,city_slug,platform,signal_type,sentiment,hashtags,snippet,engagement_score,neighborhood,category")
      .eq("city_slug", citySlug)
      .eq("is_active", true)
      .order("engagement_score", { ascending: false })
      .limit(limit)
      .then(({ data }) => {
        setSignals(data?.length ? data.map(parseRow) : FALLBACK_SIGNALS);
        setLoading(false);
      });
  }, [limit]);

  return { signals, loading };
}

/** Signals for a specific venue slug (feeds the hashtag reel strip). */
export function useVenueSignals(venueSlug: string) {
  const [signals, setSignals] = useState<VenueSignal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!venueSlug) { setLoading(false); return; }

    supabase
      .from("social_venue_signals")
      .select("id,venue_name,venue_slug,city_slug,platform,signal_type,sentiment,hashtags,snippet,engagement_score,neighborhood,category")
      .eq("venue_slug", venueSlug)
      .eq("is_active", true)
      .order("engagement_score", { ascending: false })
      .limit(8)
      .then(({ data }) => {
        setSignals(data?.map(parseRow) ?? []);
        setLoading(false);
      });
  }, [venueSlug]);

  return { signals, loading };
}
