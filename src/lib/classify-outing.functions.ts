import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import { generateText, Output } from "ai";
import { createLovableAiGatewayProvider } from "./ai-gateway.server";
import { OUTING_CATEGORIES, CATEGORIES_BY_ID } from "./agents/outing-categories";

const InputSchema = z.object({
  text: z.string().min(1).max(500),
  city: z.string().max(80).optional(),
});

const OutputSchema = z.object({
  categoryIds: z.array(z.string()).min(1).max(4),
  vibeTags: z.array(z.string()).max(6),
  budgetTier: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]).optional(),
  groupSize: z.number().int().min(1).max(50).optional(),
  adultOnly: z.boolean().optional(),
  familySafe: z.boolean().optional(),
  rationale: z.string().max(200),
});

export const classifyOuting = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => InputSchema.parse(d))
  .handler(async ({ data }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("Missing LOVABLE_API_KEY");
    const gateway = createLovableAiGatewayProvider(key);
    const model = gateway("google/gemini-3-flash-preview");

    const catalogue = OUTING_CATEGORIES.map(
      (c) => `${c.id} — ${c.name} (${c.group}): ${c.description}`,
    ).join("\n");

    const { output } = await generateText({
      model,
      output: Output.object({ schema: OutputSchema }),
      prompt:
        `Classify this user outing request into 1–4 Confetti outing categories.\n\n` +
        `Request: "${data.text}"\n` +
        (data.city ? `City: ${data.city}\n` : "") +
        `\nReturn category IDs from this catalogue only:\n${catalogue}\n\n` +
        `Also infer vibe tags, group size, budget tier (1=$, 4=$$$$), and safety flags. ` +
        `If the request mentions kids, in-laws, family, or coworkers → familySafe=true. ` +
        `If it mentions bachelor/ette, strip club, casino, wild → adultOnly=true.`,
    });

    // Validate IDs against the catalogue
    const validIds = output.categoryIds.filter((id) => CATEGORIES_BY_ID[id]);
    return { ...output, categoryIds: validIds.length ? validIds : ["surprise_me"] };
  });
