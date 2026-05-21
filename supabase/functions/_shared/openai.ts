const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export async function chatCompletion(
  messages: ChatMessage[],
  opts: {
    model?: string;
    temperature?: number;
    max_tokens?: number;
    response_format?: { type: string };
  } = {},
): Promise<{ content: string; usage: { total_tokens: number } }> {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: opts.model ?? "gpt-4o",
      messages,
      temperature: opts.temperature ?? 0.7,
      max_tokens: opts.max_tokens ?? 2048,
      ...(opts.response_format ? { response_format: opts.response_format } : {}),
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenAI API error ${res.status}: ${err}`);
  }

  const data = await res.json();
  return {
    content: data.choices[0].message.content,
    usage: data.usage,
  };
}
