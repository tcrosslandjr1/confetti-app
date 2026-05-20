// Talk-to-Agents edge function — replaces the SPA-incompatible server fn.
// Verifies the caller's Supabase auth, loads agent registry, calls Lovable AI Gateway.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type Msg = { role: "user" | "assistant"; content: string };
type Body = { targetAgentId?: string; messages: Msg[] };

function isValidMsg(m: unknown): m is Msg {
  if (!m || typeof m !== "object") return false;
  const x = m as Record<string, unknown>;
  return (
    (x.role === "user" || x.role === "assistant") &&
    typeof x.content === "string" &&
    x.content.length >= 1 &&
    x.content.length <= 4000
  );
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return Response.json({ error: "Unauthorized" }, { status: 401, headers: corsHeaders });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnon = Deno.env.get("SUPABASE_ANON_KEY")!;
    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) {
      return Response.json(
        { error: "Missing LOVABLE_API_KEY" },
        { status: 500, headers: corsHeaders },
      );
    }

    const sb = createClient(supabaseUrl, supabaseAnon, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await sb.auth.getUser();
    if (userErr || !userData.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401, headers: corsHeaders });
    }

    const body = (await req.json()) as Body;
    if (
      !body ||
      !Array.isArray(body.messages) ||
      body.messages.length < 1 ||
      body.messages.length > 40 ||
      !body.messages.every(isValidMsg)
    ) {
      return Response.json({ error: "Invalid input" }, { status: 400, headers: corsHeaders });
    }
    const targetAgentId =
      typeof body.targetAgentId === "string" && body.targetAgentId.length <= 64
        ? body.targetAgentId
        : undefined;

    const [teamsRes, agentsRes] = await Promise.all([
      sb.from("agent_teams").select("id,name,description").order("sort_order"),
      sb.from("agent_registry").select("id,name,description,team_id").order("name"),
    ]);
    const teams = (teamsRes.data ?? []) as { id: string; name: string }[];
    const agents = (agentsRes.data ?? []) as {
      id: string;
      name: string;
      description: string | null;
      team_id: string;
    }[];

    let target: { id: string; name: string; description: string | null } | null = null;
    if (targetAgentId) {
      const { data } = await sb
        .from("agent_registry")
        .select("id,name,description")
        .eq("id", targetAgentId)
        .maybeSingle();
      if (data) target = data as typeof target;
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

    const upstream = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: system },
          ...body.messages.map((m) => ({ role: m.role, content: m.content })),
        ],
      }),
    });

    if (!upstream.ok) {
      const text = await upstream.text();
      const status = upstream.status === 429 || upstream.status === 402 ? upstream.status : 502;
      return Response.json(
        { error: `AI gateway error (${upstream.status}): ${text.slice(0, 200)}` },
        { status, headers: corsHeaders },
      );
    }

    const payload = (await upstream.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const reply = payload.choices?.[0]?.message?.content ?? "";

    return Response.json(
      {
        reply,
        agent: target ? { id: target.id, name: target.name } : null,
      },
      { headers: corsHeaders },
    );
  } catch (error) {
    console.error("[agents-chat] error", error);
    return Response.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500, headers: corsHeaders },
    );
  }
});
