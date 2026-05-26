import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

/**
 * Creates an AI provider backed by OpenRouter (openrouter.ai).
 * OpenRouter is an OpenAI-compatible gateway that routes to 200+ models
 * including OpenAI, Google, Anthropic, etc. — all via a single API key.
 *
 * Env: OPENROUTER_API_KEY
 *
 * Model strings keep the same format the codebase already uses:
 *   - "google/gemini-3-flash-preview"
 *   - "gpt-4o-mini"
 */
export const createAiProvider = (apiKey: string) =>
  createOpenAICompatible({
    name: "confetti-ai",
    baseURL: "https://openrouter.ai/api/v1",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "HTTP-Referer": process.env.SITE_URL ?? "https://confettiplan.com",
      "X-Title": "Confetti",
    },
  });

/** Helper — reads OPENROUTER_API_KEY from env and returns a ready provider. */
export function getAiProvider() {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) throw new Error("Missing OPENROUTER_API_KEY");
  return createAiProvider(key);
}
