import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

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
export const resolveVenueNotificationEmail = createServerFn({ method: "GET" })
  .inputValidator((data) => z.object({ venueId: z.string().uuid() }).parse(data))
  .handler(async ({ data }) => {
    const { data: venue, error } = await supabaseAdmin
      .from("venues")
      .select("id, name, staff_email, advertiser_id")
      .eq("id", data.venueId)
      .maybeSingle();

    if (error) throw error;
    if (!venue) return null;

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

    const opsInbox = (process.env.OPS_NOTIFICATION_EMAIL ?? "").trim();
    if (opsInbox) {
      return { email: opsInbox, source: "ops_fallback" as const, venueName: venue.name };
    }

    return null;
  });
