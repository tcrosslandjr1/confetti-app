import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Resolve the recipient email for a booking notification for a given venue.
 *
 * Priority:
 *  1. venue.staff_email (explicit per-venue override)
 *  2. linked advertiser's contact_email (auto-link when the venue advertises with us)
 *  3. OPS_NOTIFICATION_EMAIL secret (global ops inbox fallback)
 *
 * Returns { email, source } so callers/logs can see which path was used,
 * or null if nothing is configured.
 */
/**
 * Last-resort ops inbox if no secret is configured. Ensures booking
 * notifications are never silently dropped.
 */
const HARDCODED_OPS_FALLBACK = "ops@confettiplan.com";

function opsInboxAddress(): string {
  const fromSecret = (process.env.OPS_NOTIFICATION_EMAIL ?? "").trim();
  return fromSecret || HARDCODED_OPS_FALLBACK;
}

export const resolveVenueNotificationEmail = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({ venueId: z.string().uuid().nullish() }).parse(data))
  .handler(async ({ data, context }) => {
    const { userId } = context;
    // Restrict to admins or the venue's claiming advertiser/owner —
    // staff_email is PII and must not leak to arbitrary signed-in users.
    const { data: roleRow } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();
    const isAdmin = !!roleRow;
    const opsInbox = opsInboxAddress();
    const opsResult = {
      email: opsInbox,
      source: "ops_fallback" as const,
      venueName: null as string | null,
    };

    // No venue linked — go straight to ops so the booking isn't dropped.
    if (!data.venueId) return opsResult;

    const { data: venue, error } = await supabaseAdmin
      .from("venues")
      .select("id, name, staff_email, advertiser_id, claimed_by")
      .eq("id", data.venueId)
      .maybeSingle();

    if (error) throw error;
    if (!venue) return opsResult;

    // Authorization: only admins, the venue claimer, or the linked advertiser owner
    // may see the resolved staff/advertiser email for this venue.
    let canSeeVenueEmail = isAdmin || venue.claimed_by === userId;
    if (!canSeeVenueEmail && venue.advertiser_id) {
      const { data: adv } = await supabaseAdmin
        .from("advertisers")
        .select("owner_id")
        .eq("id", venue.advertiser_id)
        .maybeSingle();
      if (adv?.owner_id === userId) canSeeVenueEmail = true;
    }
    if (!canSeeVenueEmail) return { ...opsResult, venueName: venue.name };

    const staff = (venue.staff_email ?? "").trim();
    if (staff) {
      return { email: staff, source: "venue_staff_email" as const, venueName: venue.name };
    }

    if (venue.advertiser_id) {
      const { data: adv } = await supabaseAdmin
        .from("advertisers")
        .select("contact_email")
        .eq("id", venue.advertiser_id)
        .maybeSingle();
      const advEmail = (adv?.contact_email ?? "").trim();
      if (advEmail) {
        return { email: advEmail, source: "linked_advertiser" as const, venueName: venue.name };
      }
    }

    // Final fallback: ops inbox so the notification still goes out.
    return { ...opsResult, venueName: venue.name };
  });
