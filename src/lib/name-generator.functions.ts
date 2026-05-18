import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { generateText, Output } from "ai";
import { createLovableAiGatewayProvider } from "./ai-gateway.server";

const VibeInput = z.union([z.string().max(200), z.array(z.string().max(60)).max(10)]);

const GenerateInput = z.object({
  city: z.string().max(80).optional(),
  category: z.string().min(1).max(80),
  vibe: VibeInput,
  audience: z.string().min(1).max(80),
  setting: z.string().max(120).optional(),
  occasion: z.string().max(120).optional(),
  count: z.number().int().min(5).max(15).optional(),
});

const GenerateOutput = z.object({
  names: z.array(z.string().min(2).max(40)).min(5).max(15),
});

const SYSTEM = `You are the Confetti Outing Name Generator.
Your ONLY job is to generate 5–15 short, catchy outing names.

Rules:
- 2–4 words max per name.
- Fun, modern, memorable, brandable.
- Use alliteration, rhyme, rhythm, punchy phrasing, or wordplay.
- Optional city or setting flavor allowed but never forced (e.g. "on the Bay", "in Brickell", "by the River", "in the District").
- Clean and app-store safe. No slurs, explicit sexual language, drug references, or hateful content.
- Avoid generic names ("Fun Night Out", "Brunch in Miami", "Nice Dinner", "Good Time").
- Avoid corporate-sounding names.
- Do not explain. Output JSON only.`;

function vibeToString(v: z.infer<typeof VibeInput>): string {
  return Array.isArray(v) ? v.join(", ") : v;
}

export const generateOutingNames = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => GenerateInput.parse(d))
  .handler(async ({ data }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("Missing LOVABLE_API_KEY");
    const gateway = createLovableAiGatewayProvider(key);
    const model = gateway("google/gemini-3-flash-preview");

    const count = data.count ?? 10;
    const prompt =
      `Generate ${count} outing names.\n\n` +
      `Inputs:\n` +
      (data.city ? `- city: ${data.city}\n` : "") +
      `- category: ${data.category}\n` +
      `- vibe: ${vibeToString(data.vibe)}\n` +
      `- audience: ${data.audience}\n` +
      (data.setting ? `- setting: ${data.setting}\n` : "") +
      (data.occasion ? `- occasion: ${data.occasion}\n` : "") +
      `\nExamples of strong names: Brunch Baddies, Boys on the Bay, Miami Heat Check, ` +
      `Gentlemen's Night Out, High Rollers, Adventure Bros, Sip & Sail, Soft Life Sundays, ` +
      `Rooftop Roses, Dinner with Dignity, Glow & Go, Bay Breeze Brunch, Skyline Sips, ` +
      `Classy by the Coast, Calm & Classy.`;

    const { output } = await generateText({
      model,
      system: SYSTEM,
      output: Output.object({ schema: GenerateOutput }),
      prompt,
    });

    // Dedupe + trim
    const seen = new Set<string>();
    const names = output.names
      .map((n) => n.trim())
      .filter((n) => {
        const k = n.toLowerCase();
        if (!n || seen.has(k)) return false;
        seen.add(k);
        return true;
      });
    return { names };
  });

// ===== Judge =====

const JudgeInput = z.object({
  names: z.array(z.string().min(1).max(60)).min(1).max(30),
  city: z.string().max(80).optional(),
  category: z.string().min(1).max(80),
  vibe: VibeInput,
  audience: z.string().min(1).max(80),
});

const JudgeOutput = z.object({
  top_names: z
    .array(
      z.object({
        name: z.string().min(1).max(60),
        score: z.number().min(0).max(10),
        reason: z.string().min(1).max(240),
      }),
    )
    .min(1)
    .max(3),
});

const JUDGE_SYSTEM = `You are the Confetti Name Judge.
Score candidate outing names and return ONLY the best 3.

Score on: catchiness, brandability, vibe match, audience match, originality,
clean/safe wording, and city/setting relevance when applicable.

Reject names that are generic, too long, confusing, explicit, offensive,
too corporate, or off-vibe. Output JSON only.`;

export const judgeOutingNames = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => JudgeInput.parse(d))
  .handler(async ({ data }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("Missing LOVABLE_API_KEY");
    const gateway = createLovableAiGatewayProvider(key);
    const model = gateway("google/gemini-3-flash-preview");

    const prompt =
      `Candidate names:\n${data.names.map((n) => `- ${n}`).join("\n")}\n\n` +
      `Context:\n` +
      (data.city ? `- city: ${data.city}\n` : "") +
      `- category: ${data.category}\n` +
      `- vibe: ${vibeToString(data.vibe)}\n` +
      `- audience: ${data.audience}\n\n` +
      `Pick the best 3. Score 0–10. Include a short reason.`;

    const { output } = await generateText({
      model,
      system: JUDGE_SYSTEM,
      output: Output.object({ schema: JudgeOutput }),
      prompt,
    });

    // Constrain picks to provided names (case-insensitive match) when possible
    const lookup = new Map(data.names.map((n) => [n.toLowerCase(), n]));
    const top_names = output.top_names.map((t) => ({
      ...t,
      name: lookup.get(t.name.toLowerCase()) ?? t.name,
    }));
    return { top_names };
  });

export const generateAndJudgeNames = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => GenerateInput.parse(d))
  .handler(async ({ data }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("Missing LOVABLE_API_KEY");
    const gateway = createLovableAiGatewayProvider(key);
    const model = gateway("google/gemini-3-flash-preview");

    const count = data.count ?? 10;
    const genPrompt =
      `Generate ${count} outing names.\n\n` +
      `Inputs:\n` +
      (data.city ? `- city: ${data.city}\n` : "") +
      `- category: ${data.category}\n` +
      `- vibe: ${vibeToString(data.vibe)}\n` +
      `- audience: ${data.audience}\n` +
      (data.setting ? `- setting: ${data.setting}\n` : "") +
      (data.occasion ? `- occasion: ${data.occasion}\n` : "");

    const { output: gen } = await generateText({
      model,
      system: SYSTEM,
      output: Output.object({ schema: GenerateOutput }),
      prompt: genPrompt,
    });

    const seen = new Set<string>();
    const names = gen.names
      .map((n) => n.trim())
      .filter((n) => {
        const k = n.toLowerCase();
        if (!n || seen.has(k)) return false;
        seen.add(k);
        return true;
      });

    const { output: judged } = await generateText({
      model,
      system: JUDGE_SYSTEM,
      output: Output.object({ schema: JudgeOutput }),
      prompt:
        `Candidate names:\n${names.map((n) => `- ${n}`).join("\n")}\n\n` +
        `Context:\n` +
        (data.city ? `- city: ${data.city}\n` : "") +
        `- category: ${data.category}\n` +
        `- vibe: ${vibeToString(data.vibe)}\n` +
        `- audience: ${data.audience}\n\n` +
        `Pick the best 3. Score 0–10. Include a short reason.`,
    });

    const lookup = new Map(names.map((n) => [n.toLowerCase(), n]));
    const top_names = judged.top_names.map((t) => ({
      ...t,
      name: lookup.get(t.name.toLowerCase()) ?? t.name,
    }));

    return { names, top_names };
  });
