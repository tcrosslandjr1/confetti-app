// Talk-to-Agents — SPA-compatible client that invokes the `agents-chat`
// Supabase Edge Function (since this project runs without TanStack server fns).

import { supabase } from "@/integrations/supabase/client";

export type AgentChatMessage = { role: "user" | "assistant"; content: string };

export type AgentChatInput = {
  targetAgentId?: string;
  messages: AgentChatMessage[];
};

export type AgentProposal = {
  id: string;
  action_type: string;
  params: Record<string, unknown>;
  summary: string;
  status: string;
};

export type AgentChatResult = {
  reply: string;
  agent: { id: string; name: string } | null;
  proposals?: AgentProposal[];
};

/** Drop-in replacement for the old server fn. Accepts `{ data }` so callers
 *  using `useServerFn(chatWithAgents)` keep working unchanged. */
export async function chatWithAgents(
  args: { data: AgentChatInput } | AgentChatInput,
): Promise<AgentChatResult> {
  const input: AgentChatInput =
    "data" in args && (args as { data: AgentChatInput }).data
      ? (args as { data: AgentChatInput }).data
      : (args as AgentChatInput);

  if (!input?.messages?.length) {
    throw new Error("At least one message is required");
  }

  const { data, error } = await supabase.functions.invoke<AgentChatResult & { error?: string }>(
    "agents-chat",
    { body: input },
  );

  if (error) throw new Error(error.message || "Agent chat failed");
  if (!data) throw new Error("Empty response from agent chat");
  if ((data as { error?: string }).error) throw new Error((data as { error: string }).error);

  return {
    reply: data.reply,
    agent: data.agent ?? null,
    proposals: data.proposals ?? [],
  };
}

export type ExecuteResult = {
  ok: boolean;
  status: string;
  result?: unknown;
  error?: string | null;
};

export async function decideAgentProposal(
  actionId: string,
  decision: "approve" | "reject",
): Promise<ExecuteResult> {
  const { data, error } = await supabase.functions.invoke<ExecuteResult & { error?: string }>(
    "agents-execute-action",
    { body: { action_id: actionId, decision } },
  );
  if (error) throw new Error(error.message || "Execute failed");
  if (!data) throw new Error("Empty response");
  return data;
}
