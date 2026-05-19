import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  GenerateNamesInput,
  RateInput,
  generateNamesInternal,
  rankNamesInternal,
  generateAndRankNames,
} from "./name-generator.server";

export { GenerateNamesInput };

export const generateOutingNames = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => GenerateNamesInput.parse(d))
  .handler(async ({ data }) => generateNamesInternal(data));

export const rateOutingNames = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => RateInput.parse(d))
  .handler(async ({ data }) =>
    rankNamesInternal(data.names, {
      city: data.city,
      category: data.category,
      vibe: data.vibe,
      audience: data.audience,
    }),
  );

/** Convenience: generate + rank in one call, returns top-3 + full ranked list. */
export const generateRankedOutingNames = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => GenerateNamesInput.parse(d))
  .handler(async ({ data }) => {
    const { ranked } = await generateAndRankNames(data);
    return {
      ranked,
      itinerary_name_options: ranked.slice(0, 3).map((r) => r.name),
      selected_itinerary_name: ranked[0]?.name ?? null,
    };
  });
