/**
 * Multi-Provider AI Engine with automatic failover
 * Chain: OpenAI GPT-4o → Anthropic Claude → Supabase AI
 *
 * Each provider is attempted in order. If one fails or times out,
 * the next provider is tried seamlessly. Mock mode is used when
 * no API keys are configured.
 */

export type AIRole = "system" | "user" | "assistant";

export interface AIMessage {
  role: AIRole;
  content: string;
}

export interface AIProviderConfig {
  openaiKey?: string;
  anthropicKey?: string;
  supabaseUrl?: string;
  supabaseAnonKey?: string;
  timeoutMs?: number;
}

export interface AIResponse {
  content: string;
  provider: "openai" | "anthropic" | "supabase" | "mock";
  model: string;
  tokensUsed?: number;
  latencyMs: number;
}

export interface AIStreamCallbacks {
  onToken: (token: string) => void;
  onDone: (response: AIResponse) => void;
  onError: (error: Error, provider: string) => void;
}

const DEFAULT_TIMEOUT = 15_000;

// ─── Provider implementations ───────────────────────────────────

async function callOpenAI(
  messages: AIMessage[],
  config: AIProviderConfig,
  signal: AbortSignal
): Promise<AIResponse> {
  const start = performance.now();
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.openaiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o",
      messages,
      max_tokens: 1024,
      temperature: 0.8,
    }),
    signal,
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`OpenAI ${res.status}: ${body}`);
  }

  const data = await res.json();
  return {
    content: data.choices?.[0]?.message?.content ?? "",
    provider: "openai",
    model: "gpt-4o",
    tokensUsed: data.usage?.total_tokens,
    latencyMs: Math.round(performance.now() - start),
  };
}

async function callAnthropic(
  messages: AIMessage[],
  config: AIProviderConfig,
  signal: AbortSignal
): Promise<AIResponse> {
  const start = performance.now();

  // Convert to Anthropic format: separate system from messages
  const systemMsg = messages.find((m) => m.role === "system");
  const chatMsgs = messages
    .filter((m) => m.role !== "system")
    .map((m) => ({ role: m.role as "user" | "assistant", content: m.content }));

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": config.anthropicKey!,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      system: systemMsg?.content ?? "",
      messages: chatMsgs,
    }),
    signal,
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Anthropic ${res.status}: ${body}`);
  }

  const data = await res.json();
  const text = data.content?.[0]?.text ?? "";
  return {
    content: text,
    provider: "anthropic",
    model: "claude-sonnet-4-20250514",
    tokensUsed: (data.usage?.input_tokens ?? 0) + (data.usage?.output_tokens ?? 0),
    latencyMs: Math.round(performance.now() - start),
  };
}

async function callSupabaseAI(
  messages: AIMessage[],
  config: AIProviderConfig,
  signal: AbortSignal
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
    throw new Error(`Supabase AI ${res.status}: ${body}`);
  }

  const data = await res.json();
  return {
    content: data.content ?? data.response ?? "",
    provider: "supabase",
    model: data.model ?? "supabase-ai",
    tokensUsed: data.tokensUsed,
    latencyMs: Math.round(performance.now() - start),
  };
}

// ─── Mock provider (development) ────────────────────────────────

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
  const lastUserMsg = [...messages].reverse().find((m) => m.role === "user")?.content.toLowerCase() ?? "";

  let category = "general";
  if (/trip|road|drive|travel|state|highway|route/.test(lastUserMsg)) category = "trip";
  else if (/family|kid|child|splash|park/.test(lastUserMsg)) category = "family";
  else if (/date|romantic|anniversary|couple/.test(lastUserMsg)) category = "date";
  else if (/eat|food|restaurant|bar|club|speakeasy|rooftop|vibe|spot|place/.test(lastUserMsg)) category = "venue";

  const options = MOCK_RESPONSES[category] ?? MOCK_RESPONSES.general;
  const content = options[Math.floor(Math.random() * options.length)];

  return {
    content,
    provider: "mock",
    model: "confetti-mock-v1",
    latencyMs: Math.round(performance.now() - start) + 200, // simulate slight delay
  };
}

// ─── Main engine ────────────────────────────────────────────────

export function getAIConfig(): AIProviderConfig {
  return {
    openaiKey: import.meta.env.VITE_OPENAI_API_KEY,
    anthropicKey: import.meta.env.VITE_ANTHROPIC_API_KEY,
    supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
    supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
    timeoutMs: DEFAULT_TIMEOUT,
  };
}

type ProviderEntry = {
  name: string;
  available: boolean;
  call: (msgs: AIMessage[], cfg: AIProviderConfig, signal: AbortSignal) => Promise<AIResponse>;
};

function getProviderChain(config: AIProviderConfig): ProviderEntry[] {
  return [
    {
      name: "openai",
      available: Boolean(config.openaiKey),
      call: callOpenAI,
    },
    {
      name: "anthropic",
      available: Boolean(config.anthropicKey),
      call: callAnthropic,
    },
    {
      name: "supabase",
      available: Boolean(config.supabaseUrl && config.supabaseAnonKey),
      call: callSupabaseAI,
    },
  ];
}

/**
 * Send messages through the AI provider chain with automatic failover.
 * Falls back to mock responses if no providers are configured.
 */
export async function chat(
  messages: AIMessage[],
  config?: AIProviderConfig
): Promise<AIResponse> {
  const cfg = config ?? getAIConfig();
  const chain = getProviderChain(cfg).filter((p) => p.available);

  if (chain.length === 0) {
    // No providers configured — use mock
    return getMockResponse(messages);
  }

  const errors: string[] = [];

  for (const provider of chain) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), cfg.timeoutMs ?? DEFAULT_TIMEOUT);
      const response = await provider.call(messages, cfg, controller.signal);
      clearTimeout(timeout);
      return response;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      errors.push(`${provider.name}: ${message}`);
      console.warn(`[Confetti AI] ${provider.name} failed, trying next provider...`, message);
    }
  }

  // All providers failed — fall back to mock with warning
  console.warn("[Confetti AI] All providers failed, using mock response. Errors:", errors);
  const mock = getMockResponse(messages);
  mock.content = mock.content + "\n\n_(AI providers temporarily unavailable — showing cached response)_";
  return mock;
}

/**
 * Check which providers are currently configured and available.
 */
export function getAvailableProviders(config?: AIProviderConfig) {
  const cfg = config ?? getAIConfig();
  const chain = getProviderChain(cfg);
  return {
    providers: chain.map((p) => ({ name: p.name, available: p.available })),
    hasLiveProvider: chain.some((p) => p.available),
    mockMode: !chain.some((p) => p.available),
  };
}
