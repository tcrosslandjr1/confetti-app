import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { generateText } from "ai";
import { z } from "zod";
import { getAiProvider } from "./ai-gateway.server";

const inputSchema = z.object({
  text: z.string().trim().min(1, "Enter text to translate.").max(5000),
  targetLanguage: z.string().trim().min(2).max(60),
  sourceLanguage: z.string().trim().max(60).optional(),
  tone: z.enum(["natural", "formal", "casual", "literal"]).optional().default("natural"),
});

export const translateText = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => inputSchema.parse(data))
  .handler(async ({ data }) => {
    const gateway = getAiProvider();
    const model = gateway("google/gemini-3-flash-preview");

    const source = data.sourceLanguage?.trim()
      ? `from ${data.sourceLanguage}`
      : "from the auto-detected source language";

    const toneInstruction: Record<string, string> = {
      natural: "Use natural, idiomatic phrasing.",
      formal: "Use a formal, professional register.",
      casual: "Use a relaxed, conversational register.",
      literal: "Stay as literal/word-for-word as the target language allows.",
    };

    const system =
      "You are a professional translator. Return ONLY the translated text — no quotes, no explanations, no language labels, no preamble. Preserve formatting, line breaks, punctuation, emojis, and inline code. Do not translate proper nouns, code identifiers, URLs, or numbers unless conventionally localized.";

    const prompt = `Translate the following text ${source} into ${data.targetLanguage}. ${toneInstruction[data.tone ?? "natural"]}\n\n---\n${data.text}\n---`;

    try {
      const { text } = await generateText({ model, system, prompt });
      return { translation: text.trim() };
    } catch (err) {
      const e = err as { status?: number; message?: string };
      if (e.status === 429) {
        throw new Error("Too many requests right now. Please wait a moment and try again.");
      }
      if (e.status === 402) {
        throw new Error("AI credits exhausted. Add credits in Settings → Workspace → Usage.");
      }
      throw new Error(e.message || "Translation failed. Please try again.");
    }
  });
