import { supabase } from "@/integrations/supabase/client";

export type AdvertiserStatus = "pending" | "approved" | "suspended";
export type CampaignStatus = "draft" | "pending" | "approved" | "rejected" | "paused";
export type Placement = "featured_card" | "itinerary_boost" | "home_spotlight";
export type PackageTier = "starter" | "featured" | "spotlight";

export type Advertiser = {
  id: string;
  owner_id: string;
  business_name: string;
  website: string | null;
  contact_email: string;
  contact_phone: string | null;
  category: string | null;
  city: string | null;
  status: AdvertiserStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type Campaign = {
  id: string;
  advertiser_id: string;
  venue_id: string | null;
  placement: Placement;
  package_tier: PackageTier;
  headline: string;
  blurb: string | null;
  image_url: string | null;
  cta_url: string | null;
  cta_label: string | null;
  city: string | null;
  category: string | null;
  status: CampaignStatus;
  admin_note: string | null;
  runs_from: string | null;
  runs_until: string | null;
  created_at: string;
  updated_at: string;
};

export type AdEvent = {
  id: string;
  campaign_id: string;
  kind: "impression" | "click";
  surface: string | null;
  user_id: string | null;
  created_at: string;
};

export const PACKAGES: Record<PackageTier, {
  label: string;
  price: string;
  blurb: string;
  perks: string[];
  recommendedPlacement: Placement;
}> = {
  starter: {
    label: "Starter",
    price: "$0 / mo",
    blurb: "Get listed and verified. Perfect to test the waters.",
    perks: [
      "Verified business badge",
      "Standard listing in nearby search",
      "Basic impression analytics",
    ],
    recommendedPlacement: "featured_card",
  },
  featured: {
    label: "Featured",
    price: "$199 / mo",
    blurb: "Stand out in the rails the planner shows most.",
    perks: [
      "Promoted card in nearby & featured rails",
      "Itinerary boost — appear in AI plans",
      "Click + impression analytics",
    ],
    recommendedPlacement: "featured_card",
  },
  spotlight: {
    label: "Spotlight",
    price: "$499 / mo",
    blurb: "Top-of-page placement — every Confetti night starts here.",
    perks: [
      "Home + portal spotlight banner",
      "Featured rail + itinerary boost included",
      "Priority concierge support",
    ],
    recommendedPlacement: "home_spotlight",
  },
};

export const PLACEMENT_LABELS: Record<Placement, string> = {
  featured_card: "Featured / nearby card",
  itinerary_boost: "Itinerary boost",
  home_spotlight: "Home spotlight banner",
};

export async function getMyAdvertiser(userId: string): Promise<Advertiser | null> {
  const { data } = await supabase
    .from("advertisers" as never)
    .select("*")
    .eq("owner_id", userId)
    .maybeSingle();
  return (data as Advertiser | null) ?? null;
}

export async function createAdvertiser(input: {
  owner_id: string;
  business_name: string;
  website?: string;
  contact_email: string;
  contact_phone?: string;
  category?: string;
  city?: string;
  notes?: string;
}): Promise<Advertiser> {
  const { data, error } = await supabase
    .from("advertisers" as never)
    .insert(input as never)
    .select("*")
    .single();
  if (error) throw error;
  return data as unknown as Advertiser;
}

export async function listMyCampaigns(advertiserId: string): Promise<Campaign[]> {
  const { data } = await supabase
    .from("ad_campaigns" as never)
    .select("*")
    .eq("advertiser_id", advertiserId)
    .order("created_at", { ascending: false });
  return (data as unknown as Campaign[]) ?? [];
}

export async function createCampaign(input: Partial<Campaign> & { advertiser_id: string; headline: string }): Promise<Campaign> {
  const { data, error } = await supabase
    .from("ad_campaigns" as never)
    .insert({ ...input, status: "pending" } as never)
    .select("*")
    .single();
  if (error) throw error;
  return data as unknown as Campaign;
}

export async function updateCampaignStatus(id: string, status: CampaignStatus, admin_note?: string) {
  const patch: Record<string, unknown> = { status };
  if (admin_note !== undefined) patch.admin_note = admin_note;
  if (status === "approved") {
    patch.runs_from = new Date().toISOString();
    patch.runs_until = new Date(Date.now() + 90 * 86400_000).toISOString();
  }
  const { error } = await supabase.from("ad_campaigns" as never).update(patch as never).eq("id", id);
  if (error) throw error;
}

export async function listAdminAdvertisers(): Promise<{ advertisers: Advertiser[]; campaigns: Campaign[] }> {
  const [a, c] = await Promise.all([
    supabase.from("advertisers" as never).select("*").order("created_at", { ascending: false }),
    supabase.from("ad_campaigns" as never).select("*").order("created_at", { ascending: false }),
  ]);
  return {
    advertisers: (a.data as unknown as Advertiser[]) ?? [],
    campaigns: (c.data as unknown as Campaign[]) ?? [],
  };
}

export async function listLiveCampaignsByPlacement(placement: Placement, limit = 6): Promise<Campaign[]> {
  const { data } = await supabase
    .from("ad_campaigns" as never)
    .select("*")
    .eq("placement", placement)
    .eq("status", "approved")
    .order("created_at", { ascending: false })
    .limit(limit);
  return (data as unknown as Campaign[]) ?? [];
}

export async function trackAdEvent(campaign_id: string, kind: "impression" | "click", surface: string, user_id?: string | null) {
  await supabase.from("ad_events" as never).insert({ campaign_id, kind, surface, user_id: user_id ?? null } as never);
}

export async function getCampaignStats(campaignIds: string[]): Promise<Record<string, { impressions: number; clicks: number }>> {
  if (campaignIds.length === 0) return {};
  const { data } = await supabase
    .from("ad_events" as never)
    .select("campaign_id, kind")
    .in("campaign_id", campaignIds);
  const stats: Record<string, { impressions: number; clicks: number }> = {};
  for (const id of campaignIds) stats[id] = { impressions: 0, clicks: 0 };
  for (const row of (data as { campaign_id: string; kind: string }[]) ?? []) {
    if (!stats[row.campaign_id]) stats[row.campaign_id] = { impressions: 0, clicks: 0 };
    if (row.kind === "click") stats[row.campaign_id].clicks++;
    else stats[row.campaign_id].impressions++;
  }
  return stats;
}
