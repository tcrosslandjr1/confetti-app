import { supabase } from "@/integrations/supabase/client";

export type AdvertiserStatus =
  | "pending"
  | "pending_review"
  | "approved"
  | "active"
  | "rejected"
  | "suspended";
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
  package_selected: string | null;
  onboarding_step: number;
  source: string;
  owner_name: string | null;
  submitted_at: string;
  review_note: string | null;
  reviewed_at: string | null;
  reviewed_by: string | null;
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

export const PACKAGES: Record<
  PackageTier,
  {
    label: string;
    price: string;
    blurb: string;
    perks: string[];
    recommendedPlacement: Placement;
  }
> = {
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

export async function createCampaign(
  input: Partial<Campaign> & { advertiser_id: string; headline: string },
): Promise<Campaign> {
  const { data, error } = await supabase
    .from("ad_campaigns" as never)
    .insert({ ...input, status: "pending" } as never)
    .select("*")
    .single();
  if (error) throw error;
  return data as unknown as Campaign;
}

export async function updateCampaignStatus(
  id: string,
  status: CampaignStatus,
  admin_note?: string,
) {
  const patch: Record<string, unknown> = { status };
  if (admin_note !== undefined) patch.admin_note = admin_note;
  if (status === "approved") {
    patch.runs_from = new Date().toISOString();
    patch.runs_until = new Date(Date.now() + 90 * 86400_000).toISOString();
  }
  const { error } = await supabase
    .from("ad_campaigns" as never)
    .update(patch as never)
    .eq("id", id);
  if (error) throw error;
}

export async function listAdminAdvertisers(): Promise<{
  advertisers: Advertiser[];
  campaigns: Campaign[];
}> {
  const [a, c] = await Promise.all([
    supabase
      .from("advertisers" as never)
      .select("*")
      .order("created_at", { ascending: false }),
    supabase
      .from("ad_campaigns" as never)
      .select("*")
      .order("created_at", { ascending: false }),
  ]);
  return {
    advertisers: (a.data as unknown as Advertiser[]) ?? [],
    campaigns: (c.data as unknown as Campaign[]) ?? [],
  };
}

export async function listLiveCampaignsByPlacement(
  placement: Placement,
  limit = 6,
): Promise<Campaign[]> {
  const { data } = await supabase
    .from("ad_campaigns" as never)
    .select("*")
    .eq("placement", placement)
    .eq("status", "approved")
    .order("created_at", { ascending: false })
    .limit(limit);
  return (data as unknown as Campaign[]) ?? [];
}

export async function trackAdEvent(
  campaign_id: string,
  kind: "impression" | "click",
  surface: string,
  user_id?: string | null,
) {
  await supabase
    .from("ad_events" as never)
    .insert({ campaign_id, kind, surface, user_id: user_id ?? null } as never);
}

export async function getCampaignStats(
  campaignIds: string[],
): Promise<Record<string, { impressions: number; clicks: number }>> {
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

// ---------- Admin actions ----------

export async function updateAdvertiserStatus(id: string, status: AdvertiserStatus) {
  const { error } = await supabase
    .from("advertisers" as never)
    .update({ status } as never)
    .eq("id", id);
  if (error) throw error;
}

export async function updateAdvertiser(id: string, patch: Partial<Advertiser>) {
  const { error } = await supabase
    .from("advertisers" as never)
    .update(patch as never)
    .eq("id", id);
  if (error) throw error;
}

export async function deleteCampaign(id: string) {
  const { error } = await supabase.from("ad_campaigns" as never).delete().eq("id", id);
  if (error) throw error;
}

export async function updateCampaign(id: string, patch: Partial<Campaign>) {
  const { error } = await supabase
    .from("ad_campaigns" as never)
    .update(patch as never)
    .eq("id", id);
  if (error) throw error;
}

export async function setCampaignTier(id: string, tier: PackageTier) {
  return updateCampaign(id, { package_tier: tier });
}

// ---------- Analytics ----------

export type AdEventRow = {
  id: string;
  campaign_id: string | null;
  kind: "impression" | "click";
  surface: string | null;
  created_at: string;
};

export async function listRecentAdEvents(sinceDays = 30): Promise<AdEventRow[]> {
  const since = new Date(Date.now() - sinceDays * 86400_000).toISOString();
  const { data } = await supabase
    .from("ad_events" as never)
    .select("id,campaign_id,kind,surface,created_at")
    .gte("created_at", since)
    .order("created_at", { ascending: true })
    .limit(5000);
  return (data as unknown as AdEventRow[]) ?? [];
}

export type DailyPoint = { date: string; impressions: number; clicks: number };

export function bucketEventsByDay(events: AdEventRow[], days = 30): DailyPoint[] {
  const buckets: Record<string, DailyPoint> = {};
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today.getTime() - i * 86400_000);
    const key = d.toISOString().slice(0, 10);
    buckets[key] = { date: key, impressions: 0, clicks: 0 };
  }
  for (const e of events) {
    const key = e.created_at.slice(0, 10);
    if (!buckets[key]) continue;
    if (e.kind === "click") buckets[key].clicks++;
    else buckets[key].impressions++;
  }
  return Object.values(buckets);
}

// ---------- Billing ----------

export const PACKAGE_PRICE_CENTS: Record<PackageTier, number> = {
  starter: 0,
  featured: 19900,
  spotlight: 49900,
};

export function estimateMrrCents(campaigns: Campaign[]): number {
  return campaigns
    .filter((c) => c.status === "approved")
    .reduce((sum, c) => sum + (PACKAGE_PRICE_CENTS[c.package_tier] ?? 0), 0);
}

export function formatCents(cents: number): string {
  return `$${(cents / 100).toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
}

// ---------- Venues (admin) ----------

export type AdminVenue = {
  id: string;
  name: string;
  category: string | null;
  city: string | null;
  neighborhood: string | null;
  image_url: string | null;
  verified: boolean;
  featured: boolean;
  advertiser_id: string | null;
};

export async function listAdminVenues(): Promise<AdminVenue[]> {
  const { data } = await supabase
    .from("venues" as never)
    .select("id,name,category,city,neighborhood,image_url,verified,featured,advertiser_id")
    .order("featured", { ascending: false })
    .order("name", { ascending: true })
    .limit(500);
  return (data as unknown as AdminVenue[]) ?? [];
}

export async function setVenueVerified(id: string, verified: boolean) {
  const { error } = await supabase
    .from("venues" as never)
    .update({ verified } as never)
    .eq("id", id);
  if (error) throw error;
}

export async function setVenueFeatured(id: string, featured: boolean) {
  const { error } = await supabase
    .from("venues" as never)
    .update({ featured } as never)
    .eq("id", id);
  if (error) throw error;
}

export async function linkVenueToAdvertiser(venueId: string, advertiserId: string | null) {
  const { error } = await supabase
    .from("venues" as never)
    .update({ advertiser_id: advertiserId } as never)
    .eq("id", venueId);
  if (error) throw error;
}

// ---------- Subscriptions (stub billing) ----------

export type SubscriptionStatus = "inactive" | "active" | "past_due" | "cancelled";

export type AdvertiserSubscription = {
  id: string;
  advertiser_id: string;
  tier: PackageTier;
  status: SubscriptionStatus;
  current_period_end: string | null;
  stub: boolean;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  created_at: string;
  updated_at: string;
};

export async function getMySubscription(
  advertiserId: string,
): Promise<AdvertiserSubscription | null> {
  const { data } = await supabase
    .from("advertiser_subscriptions" as never)
    .select("*")
    .eq("advertiser_id", advertiserId)
    .maybeSingle();
  return (data as AdvertiserSubscription | null) ?? null;
}

/** Stub checkout — flips an advertiser to active immediately. Replace with Stripe later. */
export async function startStubCheckout(
  advertiserId: string,
  tier: PackageTier,
): Promise<AdvertiserSubscription> {
  const periodEnd = new Date(Date.now() + 30 * 86400_000).toISOString();
  const existing = await getMySubscription(advertiserId);
  if (existing) {
    const { data, error } = await supabase
      .from("advertiser_subscriptions" as never)
      .update({
        tier,
        status: "active",
        current_period_end: periodEnd,
      } as never)
      .eq("id", existing.id)
      .select("*")
      .single();
    if (error) throw error;
    return data as unknown as AdvertiserSubscription;
  }
  const { data, error } = await supabase
    .from("advertiser_subscriptions" as never)
    .insert({
      advertiser_id: advertiserId,
      tier,
      status: "active",
      current_period_end: periodEnd,
      stub: true,
    } as never)
    .select("*")
    .single();
  if (error) throw error;
  return data as unknown as AdvertiserSubscription;
}

export async function cancelSubscription(advertiserId: string) {
  const { error } = await supabase
    .from("advertiser_subscriptions" as never)
    .update({ status: "cancelled" } as never)
    .eq("advertiser_id", advertiserId);
  if (error) throw error;
}

/** Returns which placements a tier can use. Spotlight unlocks all; featured unlocks featured+itinerary; starter only basic listing. */
export function placementsForTier(tier: PackageTier): Placement[] {
  if (tier === "spotlight") return ["home_spotlight", "featured_card", "itinerary_boost"];
  if (tier === "featured") return ["featured_card", "itinerary_boost"];
  return ["featured_card"];
}

// ---------- Venue claims ----------

export type ClaimStatus = "pending" | "approved" | "rejected";
export type VerificationTier = "self_attest" | "email_match" | "admin_review";

export type VenueClaim = {
  id: string;
  advertiser_id: string;
  venue_id: string;
  verification_tier: VerificationTier;
  status: ClaimStatus;
  contact_email: string | null;
  proof_url: string | null;
  notes: string | null;
  admin_note: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
};

/** Tier mapping: starter→self_attest (instant), featured→email_match, spotlight→admin_review */
export function verificationTierForSub(tier: PackageTier): VerificationTier {
  if (tier === "spotlight") return "admin_review";
  if (tier === "featured") return "email_match";
  return "self_attest";
}

export async function listMyClaims(advertiserId: string): Promise<VenueClaim[]> {
  const { data } = await supabase
    .from("venue_claims" as never)
    .select("*")
    .eq("advertiser_id", advertiserId)
    .order("created_at", { ascending: false });
  return (data as unknown as VenueClaim[]) ?? [];
}

export async function createVenueClaim(input: {
  advertiser_id: string;
  venue_id: string;
  verification_tier: VerificationTier;
  contact_email?: string;
  proof_url?: string;
  notes?: string;
}): Promise<VenueClaim> {
  // self_attest → auto approve, link venue to advertiser
  const status: ClaimStatus = input.verification_tier === "self_attest" ? "approved" : "pending";
  const { data, error } = await supabase
    .from("venue_claims" as never)
    .insert({ ...input, status } as never)
    .select("*")
    .single();
  if (error) throw error;
  if (status === "approved") {
    await linkVenueToAdvertiser(input.venue_id, input.advertiser_id);
    await setVenueVerified(input.venue_id, true);
  }
  return data as unknown as VenueClaim;
}

export async function listAdminClaims(): Promise<VenueClaim[]> {
  const { data } = await supabase
    .from("venue_claims" as never)
    .select("*")
    .order("created_at", { ascending: false });
  return (data as unknown as VenueClaim[]) ?? [];
}

export async function reviewVenueClaim(
  id: string,
  status: ClaimStatus,
  admin_note?: string,
) {
  const patch: Record<string, unknown> = {
    status,
    reviewed_at: new Date().toISOString(),
  };
  if (admin_note !== undefined) patch.admin_note = admin_note;
  const { data, error } = await supabase
    .from("venue_claims" as never)
    .update(patch as never)
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  if (status === "approved" && data) {
    const c = data as unknown as VenueClaim;
    await linkVenueToAdvertiser(c.venue_id, c.advertiser_id);
    await setVenueVerified(c.venue_id, true);
  }
}

