// Talk-to-Agents — server function that lets admins chat with the full
// agent registry (or a specific agent) via Lovable AI Gateway.

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { generateText } from "ai";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { createLovableAiGatewayProvider } from "./ai-gateway.server";

const MessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1).max(4000),
});

const InputSchema = z.object({
  targetAgentId: z.string().max(64).optional(), // omit to address ALL agents
  messages: z.array(MessageSchema).min(1).max(40),
});

export const chatWithAgents = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => InputSchema.parse(input))
  .handler(async ({ data, context }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("Missing LOVABLE_API_KEY");
    const sb = context.supabase as unknown as {
      from: (t: string) => {
        select: (cols: string) => {
          order?: (c: string) => Promise<{ data: unknown[] | null }>;
          eq?: (
            c: string,
            v: string,
          ) => { maybeSingle: () => Promise<{ data: unknown }> };
        };
      };
    };

    type TeamRow = { id: string; name: string; description: string | null };
    type AgentRow = {
      id: string;
      name: string;
      description: string | null;
      team_id: string;
    };

    const teamsRes = await sb
      .from("agent_teams")
      .select("id,name,description")
      .order!("sort_order");
    const agentsRes = await sb
      .from("agent_registry")
      .select("id,name,description,team_id,status,last_task")
      .order!("name");
    const teams = (teamsRes.data ?? []) as TeamRow[];
    const agents = (agentsRes.data ?? []) as AgentRow[];

    let target: { id: string; name: string; description: string | null } | null = null;
    if (data.targetAgentId) {
      const tRes = await sb
        .from("agent_registry")
        .select("id,name,description")
        .eq!("id", data.targetAgentId)
        .maybeSingle();
      if (tRes.data) target = tRes.data as TeamRow;
    }

    const teamLines =
      teams
        .map((t) => {
          const members = agents.filter((a) => a.team_id === t.id);
          return `• ${t.name} (${members.length}): ${members.map((m) => m.name).join(", ")}`;
        })
        .join("\n") || "(no teams registered)";


    const system = target
      ? `You are "${target.name}", a Confetti agent. ${target.description ?? ""}
You speak in first person AS this agent. Be concise (2-5 sentences), brutalist-warm tone, helpful and specific.
Reference your role and what you can do for the admin. If asked something outside your scope, suggest which other agent on the team should handle it.

Confetti agent teams (for cross-referencing):
${teamLines}`
      : `You are the Confetti Orchestrator — the front-of-house voice for ALL Confetti AI agents.
The admin is talking to you to coordinate, inspect, or task any agent across the platform.
Be concise (2-6 sentences), brutalist-warm tone, action-oriented. When relevant, name which agent(s)
would handle a request and how you'd hand it off.

Active agent teams:
${teamLines}

Behaviors:
- If the admin asks "what can you do" → summarize the teams in one line each.
- If the admin asks to talk to a specific agent → tell them to click that agent's "Chat" button, and answer on its behalf for now.
- If the admin asks status/ops questions → reference the registry data above.`;

    const gateway = createLovableAiGatewayProvider(apiKey);
    const model = gateway("google/gemini-3-flash-preview");

    const { text } = await generateText({
      model,
      system,
      messages: data.messages.map((m) => ({ role: m.role, content: m.content })),
      maxRetries: 1,
    });

    return {
      reply: text,
      agent: target ? { id: target.id, name: target.name } : null,
    };
  });
