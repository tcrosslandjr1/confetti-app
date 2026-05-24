// Client wrapper for the `partner-admin` edge function. Frontend admin
// queue at /admin/partners calls these helpers; the edge function uses
// service-role to bypass RLS and verifies the shared PIN.

export type CampaignStatus = "draft" | "pending" | "active" | "paused" | "expired";

export interface PartnerCampaign {
  id: string;
  name: string;
  status: CampaignStatus;
  business_id: string;
  business_name?: string;
  business_tier?: string;
  venue_id: string;
  venue_name?: string;
  venue_address?: string;
  venue_city?: string;
  boost_strength: number;
  daily_credit_budget: number;
  total_credits_spent: number;
  start_date: string;
  end_date: string | null;
  target_cities: string[] | null;
  target_vibes: string[] | null;
  target_categories: string[] | null;
  target_occasions: string[] | null;
  target_price_range: string | null;
  impressions: number;
  click_throughs: number;
  check_ins: number;
}

function getPin(): string {
  if (typeof sessionStorage === "undefined") return "";
  return sessionStorage.getItem("confetti.admin.pin") ?? "";
}

async function invoke<T>(action: string, body: Record<string, unknown> = {}): Promise<T> {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  const pin = getPin();
  if (!url || !key) throw new Error("Supabase env missing");
  if (!pin) throw new Error("Admin PIN missing — re-enter the PIN");

  const res = await fetch(`${url}/functions/v1/partner-admin`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: key,
      Authorization: `Bearer ${key}`,
      "x-admin-pin": pin,
    },
    body: JSON.stringify({ action, ...body }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `partner-admin ${res.status}`);
  }
  return (await res.json()) as T;
}

export async function listPartnerCampaigns(
  status?: CampaignStatus | "all",
): Promise<PartnerCampaign[]> {
  const { campaigns } = await invoke<{ campaigns: PartnerCampaign[] }>("list_campaigns", {
    status: status ?? "all",
  });
  return campaigns;
}

export async function approveCampaign(id: string): Promise<void> {
  await invoke("approve_campaign", { id });
}

export async function rejectCampaign(id: string): Promise<void> {
  await invoke("reject_campaign", { id });
}

export async function pauseCampaign(id: string): Promise<void> {
  await invoke("pause_campaign", { id });
}

export async function resumeCampaign(id: string): Promise<void> {
  await invoke("resume_campaign", { id });
}

export async function createDemoSponsorship(opts: {
  venueId?: string;
  city?: string;
  campaignName?: string;
  targetVibes?: string[];
}): Promise<{ campaignId: string; businessId: string; venueId: string; venueName: string }> {
  return invoke("create_demo_sponsor", opts);
}

export async function runVerifyBackfillBatch(
  batchSize = 25,
): Promise<{ processed: number; verified: number; remaining: number }> {
  return invoke("verify_backfill", { batchSize });
}

export async function getVerifyStatus(): Promise<{ remaining: number; verified: number }> {
  return invoke("verify_status", {});
}
