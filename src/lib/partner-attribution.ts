import { supabase } from "@/integrations/supabase/client";

// boost_campaigns lives in production but isn't in the locally-generated
// supabase types yet, so we cast through a loose client for these counter
// bumps. RLS still enforces who can write.
//
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const sb = supabase as any;

/**
 * Best-effort click attribution for a sponsored placement. Increments the
 * boost_campaigns.click_throughs counter on the row so the partner can
 * see in their dashboard that the click happened. Silent on failure —
 * never blocks the user's navigation.
 *
 * Called from venue cards / boarding-pass actions whenever a user taps a
 * sponsored item (open details, navigate, book).
 */
export async function trackPartnerClick(boostCampaignId: string): Promise<void> {
  if (!boostCampaignId) return;
  try {
    const { data, error } = await sb
      .from("boost_campaigns")
      .select("click_throughs")
      .eq("id", boostCampaignId)
      .maybeSingle();
    if (error || !data) return;
    await sb
      .from("boost_campaigns")
      .update({ click_throughs: (data.click_throughs ?? 0) + 1 })
      .eq("id", boostCampaignId);
  } catch {
    /* swallow */
  }
}

/**
 * Best-effort booking-click attribution. Increments check_ins as a proxy
 * for "user took action on this partner" until a real conversion event
 * (reservation confirmed) gets wired in.
 */
export async function trackPartnerBookingClick(boostCampaignId: string): Promise<void> {
  if (!boostCampaignId) return;
  try {
    const { data, error } = await sb
      .from("boost_campaigns")
      .select("check_ins")
      .eq("id", boostCampaignId)
      .maybeSingle();
    if (error || !data) return;
    await sb
      .from("boost_campaigns")
      .update({ check_ins: (data.check_ins ?? 0) + 1 })
      .eq("id", boostCampaignId);
  } catch {
    /* swallow */
  }
}
