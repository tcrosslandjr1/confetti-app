/**
 * AI engine — server-side only.
 *
 * All chat completions go through the `ai-chat` Supabase edge function so
 * the OpenAI / Anthropic keys never ship in the browser bundle. If the
 * function is unreachable (no Supabase config, network failure, function
 * not deployed), we fall back to deterministic mock responses.
 */

export type AIRole = "system" | "user" | "assistant";

export interface AIMessage {
  role: AIRole;
  content: string;
}

export interface AIProviderConfig {
  supabaseUrl?: string;
  supabaseAnonKey?: string;
  timeoutMs?: number;
}

export interface AIResponse {
  content: string;
  provider: "supabase" | "mock";
  model: string;
  tokensUsed?: number;
  latencyMs: number;
}

const DEFAULT_TIMEOUT = 15_000;

async function callAIChat(
  messages: AIMessage[],
  config: AIProviderConfig,
  signal: AbortSignal,
): Promise<AIResponse> {
  const start = performance.now();
  const res = await fetch(`${config.supabaseUrl}/functions/v1/ai-chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: config.supabaseAnonKey!,
      Authorization: `Bearer ${config.supabaseAnonKey}`,
    },
    body: JSON.stringify({ messages }),
    signal,
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`ai-chat ${res.status}: ${body.slice(0, 200)}`);
  }

  const data = await res.json();
  return {
    content: data.content ?? "",
    provider: "supabase",
    model: data.model ?? "ai-chat",
    tokensUsed: data.tokensUsed,
    latencyMs: Math.round(performance.now() - start),
  };
}

// ─── Mock provider (used when edge function is unreachable) ────

const MOCK_RESPONSES: Record<string, string[]> = {
  venue: [
    "I found some incredible spots near you! 🔥 Let me build you a Confetti plan with the perfect vibe progression — starting casual, building to something special.",
    "Great taste! Based on your mood, I'm pulling together a mix of hidden gems and crowd favorites. Give me a sec to map the perfect route...",
    "Oh, I know exactly what you need tonight. There's a speakeasy two blocks from you that just got a new cocktail menu, and a rooftop with sunset views that pairs perfectly after.",
  ],
  trip: [
    "Road trip mode activated! 🚗 I'm scanning the best stops between your departure and destination — dining, experiences, and EV charging all mapped out along your route.",
    "Multi-state adventure! Let me find the must-hit spots along your route. I'll space them out so you've got great food and experiences every couple hours.",
  ],
  general: [
    "Hey! I'm Confetti AI — your personal concierge for dining, nightlife, and unforgettable experiences. Tell me what vibe you're feeling tonight, and I'll craft the perfect plan for you. 🎯",
    "I'm ready to help you discover something amazing. What are you in the mood for — a chill dinner, an adventurous night out, or something totally unexpected?",
    "Welcome back! Based on your taste profile, I've been keeping an eye on some new spots I think you'd love. Want me to show you what's trending near you?",
  ],
  family: [
    "Family day! 🎨 Let me find kid-friendly spots that parents will actually enjoy too — think splash parks followed by a restaurant with both a kids menu and craft cocktails for the adults.",
  ],
  date: [
    "Date night mode — say less. 💕 I'll find you a progression from intimate dinner to something with atmosphere. What neighborhood are you starting from?",
  ],
};

function getMockResponse(messages: AIMessage[]): AIResponse {
  const start = performance.now();
  const lastUserMsg =
    [...messages]
      .reverse()
      .find((m) => m.role === "user")
      ?.content.toLowerCase() ?? "";

  let category = "general";
  if (/trip|road|drive|travel|state|highway|route/.test(lastUserMsg)) category = "trip";
  else if (/family|kid|child|splash|park/.test(lastUserMsg)) category = "family";
  else if (/date|romantic|anniversary|couple/.test(lastUserMsg)) category = "date";
  else if (/eat|food|restaurant|bar|club|speakeasy|rooftop|vibe|spot|place/.test(lastUserMsg))
    category = "venue";

  const options = MOCK_RESPONSES[category] ?? MOCK_RESPONSES.general;
  const content = options[Math.floor(Math.random() * options.length)];

  return {
    content,
    provider: "mock",
    model: "confetti-mock-v1",
    latencyMs: Math.round(performance.now() - start) + 200,
  };
}

// ─── Public API ────────────────────────────────────────────────

export function getAIConfig(): AIProviderConfig {
  return {
    supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
    supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
    timeoutMs: DEFAULT_TIMEOUT,
  };
}

function isLiveAvailable(cfg: AIProviderConfig): boolean {
  return Boolean(
    cfg.supabaseUrl &&
    cfg.supabaseAnonKey &&
    !cfg.supabaseUrl.includes("your-project-ref") &&
    !cfg.supabaseAnonKey.includes("your-supabase"),
  );
}

export async function chat(messages: AIMessage[], config?: AIProviderConfig): Promise<AIResponse> {
  const cfg = config ?? getAIConfig();

  if (!isLiveAvailable(cfg)) {
    return getMockResponse(messages);
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), cfg.timeoutMs ?? DEFAULT_TIMEOUT);
    const response = await callAIChat(messages, cfg, controller.signal);
    clearTimeout(timeout);
    return response;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.warn("[Confetti AI] ai-chat failed, using mock response.", message);
    const mock = getMockResponse(messages);
    // Note: mock fallback active — no user-facing disclaimer needed
    return mock;
  }
}

export function getAvailableProviders(config?: AIProviderConfig) {
  const cfg = config ?? getAIConfig();
  const live = isLiveAvailable(cfg);
  return {
    providers: [{ name: "supabase", available: live }],
    hasLiveProvider: live,
    mockMode: !live,
  };
}
