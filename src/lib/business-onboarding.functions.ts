import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";

function adminClient() {
  const url = process.env.SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient<Database>(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/* ------------------------- VENUE SEARCH ------------------------- */

export const searchVenuesForClaim = createServerFn({ method: "GET" })
  .inputValidator(z.object({ q: z.string().min(1).max(120) }))
  .handler(async ({ data }) => {
    const supabase = adminClient();
    const q = data.q.trim();
    const { data: rows, error } = await supabase
      .from("venues")
      .select("id, name, city, neighborhood, address, hero_image_url, image_url, claim_status, claimed_by, website")
      .or(`name.ilike.%${q}%,address.ilike.%${q}%,city.ilike.%${q}%`)
      .order("name")
      .limit(20);
    if (error) throw new Error(error.message);
    return { venues: rows ?? [] };
  });

/* ------------------------- MY CLAIMS ------------------------- */

export const listMyClaims = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const supabase = adminClient();
    const { data, error } = await supabase
      .from("venue_claims")
      .select("*")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return { claims: data ?? [] };
  });

/* ------------------------- SUBMIT CLAIM ------------------------- */

const ClaimInput = z.object({
  venueId: z.string().uuid().optional(),
  // For unlisted venues (Add New)
  proposedName: z.string().min(2).max(160).optional(),
  proposedPlaceId: z.string().max(200).optional(),
  proposedCity: z.string().max(120).optional(),
  proposedWebsite: z.string().url().max(300).optional(),
  // Verification
  method: z.enum(["social_tiktok", "social_instagram", "email_domain", "document"]),
  evidenceHandle: z.string().min(1).max(120).optional(),
  evidenceUrl: z.string().url().max(500).optional(),
  evidenceEmail: z.string().email().max(255).optional(),
  evidenceDomain: z.string().max(255).optional(),
  notes: z.string().max(2000).optional(),
});

export const submitVenueClaim = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => ClaimInput.parse(input))
  .handler(async ({ data, context }) => {
    const supabase = adminClient();
    if (!data.venueId && !data.proposedName) {
      throw new Error("Either venueId or proposedName is required");
    }

    // Social-match methods require a handle
    if (
      (data.method === "social_tiktok" || data.method === "social_instagram") &&
      !data.evidenceHandle
    ) {
      throw new Error("Social handle is required for this verification method");
    }

    const { data: row, error } = await supabase
      .from("venue_claims")
      .insert({
        user_id: context.userId,
        venue_id: data.venueId ?? null,
        proposed_name: data.proposedName ?? null,
        proposed_place_id: data.proposedPlaceId ?? null,
        proposed_city: data.proposedCity ?? null,
        proposed_website: data.proposedWebsite ?? null,
        method: data.method,
        evidence_handle: data.evidenceHandle ?? null,
        evidence_url: data.evidenceUrl ?? null,
        evidence_email: data.evidenceEmail ?? null,
        evidence_domain: data.evidenceDomain ?? null,
        notes: data.notes ?? null,
        status: "pending",
      })
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return { claim: row };
  });
