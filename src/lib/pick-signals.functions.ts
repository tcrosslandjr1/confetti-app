import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const SignalSchema = z.object({
  kind: z.enum(["mood", "swap_reason", "recap_note"]),
  value: z.string().min(1).max(80),
  context: z.record(z.string(), z.unknown()).optional(),
});

export const recordPickSignal = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => SignalSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase.from("pick_signals").insert({
      user_id: userId,
      kind: data.kind,
      value: data.value,
      context: data.context ?? {},
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

const RatingSchema = z.object({
  itineraryId: z.string().uuid(),
  overallRating: z.number().int().min(1).max(5).optional(),
  overallReview: z.string().max(800).optional(),
  stops: z
    .array(
      z.object({
        stopId: z.string().uuid(),
        rating: z.number().int().min(1).max(5).optional(),
        review: z.string().max(400).optional(),
      }),
    )
    .max(20)
    .optional(),
});

export const saveItineraryRecap = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => RatingSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { error: itinErr } = await supabase
      .from("itineraries")
      .update({
        overall_rating: data.overallRating ?? null,
        overall_review: data.overallReview ?? null,
        completed_at: new Date().toISOString(),
      })
      .eq("id", data.itineraryId);
    if (itinErr) throw new Error(itinErr.message);

    if (data.stops?.length) {
      for (const s of data.stops) {
        const { error } = await supabase
          .from("itinerary_stops")
          .update({ user_rating: s.rating ?? null, user_review: s.review ?? null })
          .eq("id", s.stopId);
        if (error) throw new Error(error.message);
      }
    }
    return { ok: true };
  });
