// ============================================================
// ai-chat — Server-side OpenAI chat completions proxy.
// Keeps OPENAI_API_KEY off the client bundle. Called by
// src/lib/agents/ai-provider.ts → callSupabaseAI().
// ============================================================

import { serve } from "../_shared/server.ts";
import { corsHeaders, jsonResponse, errorResponse } from "../_shared/supabase-client.ts";
import { chatCompletion, type ChatMessage } from "../_shared/openai.ts";
import { consumeRateLimit, callerIdentity } from "../_shared/ratelimit.ts";

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
  // Fail-closed: if the anon key isn't configured for this function, refuse
  // all requests rather than running up the OpenAI bill for unknown callers.
  if (!expected) return false;
  const apiKey = req.headers.get("apikey");
  const auth = req.headers.get("Authorization") ?? "";
  return apiKey === expected || auth === `Bearer ${expected}`;
}

const MAX_MESSAGES = 50;
const MAX_MESSAGE_CHARS = 4000;

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders() });

  if (!isAuthorized(req)) return errorResponse("Unauthorized", 401);

  // Rate limit: 20 requests/min/IP. ai-chat is anon-callable (publishable key
  // is the only auth) so user IDs aren't available — IP-only is the best
  // identity we have here.
  const allowed = await consumeRateLimit({
    scope: "ai-chat",
    identity: callerIdentity(req),
    burst: 20,
    refillPerSec: 20 / 60,
  });
  if (!allowed) return errorResponse("Rate limit exceeded", 429);

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
  if (body.messages.length > MAX_MESSAGES) {
    return errorResponse(`messages length must be <= ${MAX_MESSAGES}`);
  }
  for (const m of body.messages) {
    if (typeof m?.content !== "string" || m.content.length > MAX_MESSAGE_CHARS) {
      return errorResponse(`each message.content must be a string <= ${MAX_MESSAGE_CHARS} chars`);
    }
    if (m.role !== "system" && m.role !== "user" && m.role !== "assistant") {
      return errorResponse(`invalid role: ${m.role}`);
    }
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
