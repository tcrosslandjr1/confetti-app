// ============================================================
// ai-chat — Server-side OpenAI chat completions proxy.
// Keeps OPENAI_API_KEY off the client bundle. Called by
// src/lib/agents/ai-provider.ts → callSupabaseAI().
// ============================================================

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { corsHeaders, jsonResponse, errorResponse } from "../_shared/supabase-client.ts";
import { chatCompletion, type ChatMessage } from "../_shared/openai.ts";

interface RequestBody {
  messages: ChatMessage[];
  model?: string;
  temperature?: number;
  max_tokens?: number;
}

// Friction barrier — require the project anon/publishable key like
// places-search. Stops opportunistic bots from running up the OpenAI
// bill via the public function URL.
function isAuthorized(req: Request): boolean {
  const expected = Deno.env.get("SUPABASE_ANON_KEY");
  if (!expected) return true; // fail-open if Deno secret not set
  const apiKey = req.headers.get("apikey");
  const auth = req.headers.get("Authorization") ?? "";
  return apiKey === expected || auth === `Bearer ${expected}`;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders() });

  if (!isAuthorized(req)) return errorResponse("Unauthorized", 401);

  if (!Deno.env.get("OPENAI_API_KEY")) {
    return errorResponse("OPENAI_API_KEY not configured on this function", 500);
  }

  let body: RequestBody;
  try {
    body = await req.json();
  } catch {
    return errorResponse("Invalid JSON body");
  }

  if (!Array.isArray(body.messages) || body.messages.length === 0) {
    return errorResponse("messages array required");
  }

  // Hard caps so a single request can't drain the OpenAI budget.
  const max_tokens = Math.min(Math.max(body.max_tokens ?? 1024, 16), 4096);
  const temperature = Math.min(Math.max(body.temperature ?? 0.7, 0), 2);
  const model = (body.model ?? "gpt-4o-mini").slice(0, 64);

  try {
    const result = await chatCompletion(body.messages, { model, temperature, max_tokens });
    return jsonResponse({
      content: result.content,
      model,
      tokensUsed: result.usage?.total_tokens ?? 0,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return errorResponse(`ai-chat failed: ${message}`, 502);
  }
});
