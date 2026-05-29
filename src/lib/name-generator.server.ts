import { z } from "zod";
import { generateText, Output } from "ai";
import { getAiProvider } from "./ai-gateway.server";

const VibeInput = z.union([z.string().max(200), z.array(z.string().max(60)).max(10)]);

export const GenerateNamesInput = z.object({
  city: z.string().max(80).optional(),
  category: z.string().min(1).max(120),
  vibe: VibeInput,
  audience: z.string().min(1).max(80),
  setting: z.string().max(120).optional(),
  occasion: z.string().max(120).optional(),
  energyLevel: z.string().max(40).optional(),
  count: z.number().int().min(5).max(15).optional(),
});
export type GenerateNamesInput = z.infer<typeof GenerateNamesInput>;

const GenerateOutput = z.object({
  names: z.array(z.string().min(2).max(40)).min(5).max(15),
});

const RankedOutput = z.object({
  ranked_names: z
    .array(
      z.object({
        name: z.string().min(1).max(60),
        score: z.number().min(0).max(10),
      }),
    )
    .min(1)
    .max(20),
});

const GEN_SYSTEM = `You are the Confetti Outing Name Generator.
Your ONLY job is to generate 5–15 short, catchy outing names.

Rules:
- 2–4 words max per name.
- Feel like a real event name. Fun, modern, memorable, brandable, social-media-ready.
- Use alliteration, rhyme, rhythm, punchy phrasing, or wordplay.
- Optional city/setting flavor allowed but never forced (e.g. "on the Bay", "in Brickell", "by the River", "in the District").
- Clean and app-store safe. No slurs, explicit sexual language, drug references, or hateful content.
- Avoid generic names ("Fun Night Out", "Brunch in Miami", "Nice Dinner", "Good Time").
- Avoid corporate-sounding names.
- Do not explain. Output JSON only.

Strong examples: Brunch Baddies, Boys on the Bay, Miami Heat Check, Soft Life Sundays,
Adventure Bros, Yacht & Rosé, Gentlemen's Night, In-Laws & Chill, Sip & Sail, Rooftop Roses,
Bougie Brunch Club, Mimosa Mamis, Spa Girl Era, Dinner on the Bay, Calm & Classy.`;

const RATE_SYSTEM = `You are the Confetti Name Rater.
Score each candidate outing name 0–10.

Score on: vibe match, category match, audience match, city flavor, catchiness,
alliteration/rhythm, IG/TikTok appeal, memorability, clarity, brandability, safety.

Down-rank or score low: generic, too long, confusing, explicit, offensive,
too corporate, or mismatched to audience/category. Output JSON only.`;

function vibeToString(v: GenerateNamesInput["vibe"]): string {
  return Array.isArray(v) ? v.join(", ") : v;
}

function dedupe(names: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of names) {
    const n = raw.trim();
    const k = n.toLowerCase();
    if (n && !seen.has(k)) {
      seen.add(k);
      out.push(n);
    }
  }
  return out;
}

export const RateInput = z.object({
  names: z.array(z.string().min(1).max(60)).min(1).max(30),
  city: z.string().max(80).optional(),
  category: z.string().min(1).max(120),
  vibe: VibeInput,
  audience: z.string().min(1).max(80),
});

export async function generateNamesInternal(
  input: GenerateNamesInput,
): Promise<{ names: string[] }> {
  const gateway = getAiProvider();
  const model = gateway("google/gemini-2.0-flash-001");

  const count = input.count ?? 10;
  const prompt =
    `Generate ${count} outing names.\n\n` +
    `Inputs:\n` +
    (input.city ? `- city: ${input.city}\n` : "") +
    `- category: ${input.category}\n` +
    `- vibe: ${vibeToString(input.vibe)}\n` +
    `- audience: ${input.audience}\n` +
    (input.energyLevel ? `- energy_level: ${input.energyLevel}\n` : "") +
    (input.setting ? `- setting: ${input.setting}\n` : "") +
    (input.occasion ? `- occasion: ${input.occasion}\n` : "");

  const { output } = await generateText({
    model,
    system: GEN_SYSTEM,
    output: Output.object({ schema: GenerateOutput }),
    prompt,
  });
  return { names: dedupe(output.names) };
}

export async function rankNamesInternal(
  names: string[],
  ctx: { city?: string; category: string; vibe: GenerateNamesInput["vibe"]; audience: string },
): Promise<{ ranked: { name: string; score: number }[] }> {
  if (!names.length) return { ranked: [] };
  const gateway = getAiProvider();
  const model = gateway("google/gemini-2.0-flash-001");

  const prompt =
    `Candidate names:\n${names.map((n) => `- ${n}`).join("\n")}\n\n` +
    `Context:\n` +
    (ctx.city ? `- city: ${ctx.city}\n` : "") +
    `- category: ${ctx.category}\n` +
    `- vibe: ${vibeToString(ctx.vibe)}\n` +
    `- audience: ${ctx.audience}\n\n` +
    `Score every candidate 0–10.`;

  const { output } = await generateText({
    model,
    system: RATE_SYSTEM,
    output: Output.object({ schema: RankedOutput }),
    prompt,
  });

  const lookup = new Map(names.map((n) => [n.toLowerCase(), n]));
  const ranked = output.ranked_names
    .map((r) => ({ name: lookup.get(r.name.toLowerCase()) ?? r.name, score: r.score }))
    .filter((r) => lookup.has(r.name.toLowerCase()))
    .sort((a, b) => b.score - a.score);
  return { ranked };
}

export async function generateAndRankNames(
  input: GenerateNamesInput,
): Promise<{ ranked: { name: string; score: number }[] }> {
  const { names } = await generateNamesInternal(input);
  if (!names.length) return { ranked: [] };
  return rankNamesInternal(names, {
    city: input.city,
    category: input.category,
    vibe: input.vibe,
    audience: input.audience,
  });
}
