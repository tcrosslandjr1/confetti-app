import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  DEFAULT_PROFILE,
  learnProfileFromSignals,
  type PersonalizationProfile,
} from "./agents/personalization";

const PROFILE_COLUMNS = `preferred_vibes, preferred_categories, disliked_categories,
preferred_price_tier, preferred_time_slots, preferred_neighborhoods,
preferred_business_types, disliked_business_types, favorite_city_features,
risk_tolerance, nightlife_intensity, comfort_level, promo_sensitivity,
personalized_name_style, adult_opt_in, manual_overrides`;

function rowToProfile(row: Record<string, unknown> | null): PersonalizationProfile {
  if (!row) return DEFAULT_PROFILE;
  return {
    ...DEFAULT_PROFILE,
    ...(row as Partial<PersonalizationProfile>),
  };
}

export const getMyProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data } = await supabase
      .from("user_preferences")
      .select(PROFILE_COLUMNS)
      .eq("user_id", userId)
      .maybeSingle();
    return { profile: rowToProfile(data as Record<string, unknown> | null) };
  });

export const updateMyProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        preferred_vibes: z.array(z.string().max(40)).max(20).optional(),
        preferred_categories: z.array(z.string().max(40)).max(20).optional(),
        disliked_categories: z.array(z.string().max(40)).max(20).optional(),
        preferred_price_tier: z.number().int().min(1).max(4).nullable().optional(),
        preferred_time_slots: z.array(z.string().max(20)).max(10).optional(),
        comfort_level: z.enum(["low", "medium", "high"]).optional(),
        promo_sensitivity: z.enum(["low", "medium", "high"]).optional(),
        nightlife_intensity: z.enum(["low", "medium", "high"]).optional(),
        risk_tolerance: z.enum(["low", "medium", "high"]).optional(),
        adult_opt_in: z.boolean().optional(),
        personalized_name_style: z.string().max(40).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("user_preferences")
      .upsert({ user_id: userId, ...data, updated_at: new Date().toISOString() });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const resetMyProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    await supabase.from("user_signals").delete().eq("user_id", userId);
    await supabase
      .from("user_preferences")
      .upsert({
        user_id: userId,
        ...DEFAULT_PROFILE,
        manual_overrides: {},
        updated_at: new Date().toISOString(),
      });
    return { ok: true };
  });

const SignalSchema = z.object({
  signal_type: z.string().min(1).max(40),
  payload: z.record(z.string(), z.unknown()).default({}),
  city: z.string().max(80).optional().nullable(),
});

export const recordSignals = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ signals: z.array(SignalSchema).min(1).max(50) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const rows = data.signals.map((s) => ({
      user_id: userId,
      signal_type: s.signal_type,
      payload: s.payload,
      city: s.city ?? null,
    }));
    await supabase.from("user_signals").insert(rows);
    return { ok: true, count: rows.length };
  });

/** Re-learn profile from the latest 500 signals and persist. */
export const relearnMyProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: prev } = await supabase
      .from("user_preferences")
      .select(PROFILE_COLUMNS)
      .eq("user_id", userId)
      .maybeSingle();
    const { data: sigs } = await supabase
      .from("user_signals")
      .select("signal_type, payload, city")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(500);
    const base = rowToProfile(prev as Record<string, unknown> | null);
    const learned = learnProfileFromSignals(
      (sigs ?? []) as { signal_type: string; payload: Record<string, unknown>; city: string | null }[],
      base,
    );
    await supabase
      .from("user_preferences")
      .upsert({ user_id: userId, ...learned, updated_at: new Date().toISOString() });
    return { profile: learned };
  });
