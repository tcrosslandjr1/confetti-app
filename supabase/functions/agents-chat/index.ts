// Talk-to-Agents edge function with admin-only IT/login/app fix tools.
// Diagnose-only tools run inline. Destructive tools are written as
// pending_admin_actions and must be approved + executed via
// `agents-execute-action`.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

import { getCorsHeaders } from "../_shared/cors.ts";
// Dynamic CORS — call getCorsHeaders(req) per-request for origin checking

type Msg = { role: "user" | "assistant" | "tool"; content: string; tool_call_id?: string };
type Body = { targetAgentId?: string; messages: { role: "user" | "assistant"; content: string }[] };

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const OPENROUTER_API_KEY = Deno.env.get("OPENROUTER_API_KEY");

const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE);

// ── Tool definitions exposed to the model ─────────────────────────────────
const adminTools = [
  {
    type: "function",
    function: {
      name: "read_auth_logs",
      description:
        "Read the most recent Supabase auth logs. Use this to debug login, signup, OAuth, password reset and session issues.",
      parameters: {
        type: "object",
        properties: {
          limit: { type: "number", description: "How many rows (default 20, max 100)" },
          search: { type: "string", description: "Optional substring filter on event message or path" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "read_edge_function_logs",
      description:
        "Read recent logs from a specific Supabase edge function. Use when an in-app feature backed by an edge function misbehaves.",
      parameters: {
        type: "object",
        required: ["function_name"],
        properties: {
          function_name: { type: "string" },
          limit: { type: "number", description: "Default 20, max 100" },
          search: { type: "string" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "read_db_logs",
      description: "Read recent Postgres logs (errors, slow queries).",
      parameters: {
        type: "object",
        properties: {
          limit: { type: "number" },
          severity: { type: "string", description: "ERROR | WARNING | LOG" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "find_user_by_email",
      description:
        "Look up a user by email to inspect account status (confirmed, banned, last sign-in, providers, roles).",
      parameters: {
        type: "object",
        required: ["email"],
        properties: { email: { type: "string" } },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "check_url_health",
      description:
        "HEAD/GET a URL and return status code + timing. Use to verify the app or a public endpoint is up.",
      parameters: {
        type: "object",
        required: ["url"],
        properties: { url: { type: "string" } },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_support_ticket",
      description:
        "File a ticket for human follow-up. Use when an issue needs investigation beyond what tools can fix.",
      parameters: {
        type: "object",
        required: ["kind", "summary"],
        properties: {
          kind: { type: "string", description: "e.g. login, billing, plan_generation, performance, bug" },
          severity: { type: "string", enum: ["low", "normal", "high", "urgent"] },
          summary: { type: "string" },
          details: { type: "string" },
          target_email: { type: "string" },
        },
      },
    },
  },
  // Destructive — DO NOT execute. Create pending action requiring approval.
  {
    type: "function",
    function: {
      name: "propose_password_reset",
      description:
        "Propose sending a password reset email to a user. Requires admin approval before sending.",
      parameters: {
        type: "object",
        required: ["email"],
        properties: { email: { type: "string" }, reason: { type: "string" } },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "propose_resend_confirmation",
      description:
        "Propose resending the email confirmation link to an unconfirmed user. Requires admin approval.",
      parameters: {
        type: "object",
        required: ["email"],
        properties: { email: { type: "string" }, reason: { type: "string" } },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "propose_unlock_user",
      description:
        "Propose unbanning a user / clearing rate-limit lock. Requires admin approval.",
      parameters: {
        type: "object",
        required: ["email"],
        properties: { email: { type: "string" }, reason: { type: "string" } },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "propose_sign_out_user",
      description:
        "Propose invalidating all sessions for a user (forces re-login everywhere). Requires admin approval.",
      parameters: {
        type: "object",
        required: ["email"],
        properties: { email: { type: "string" }, reason: { type: "string" } },
      },
    },
  },
];

// ── Tool executors ─────────────────────────────────────────────────────────
async function runTool(
  name: string,
  args: Record<string, unknown>,
  ctx: { adminUserId: string },
): Promise<unknown> {
  const lim = Math.min(Math.max(Number(args.limit) || 20, 1), 100);

  if (name === "read_auth_logs") {
    const search = typeof args.search === "string" ? args.search : "";
    const where = search
      ? `where event_message ilike '%${search.replace(/'/g, "''")}%' or metadata.path ilike '%${search.replace(/'/g, "''")}%'`
      : "";
    const q = `select id, auth_logs.timestamp, event_message, metadata.level, metadata.status, metadata.path, metadata.msg, metadata.error from auth_logs cross join unnest(metadata) as metadata ${where} order by timestamp desc limit ${lim}`;
    return await analyticsQuery(q);
  }

  if (name === "read_edge_function_logs") {
    const fn = String(args.function_name || "").replace(/[^a-z0-9_-]/gi, "");
    if (!fn) return { error: "function_name required" };
    const search = typeof args.search === "string" ? args.search : "";
    const filter = search
      ? `and event_message ilike '%${search.replace(/'/g, "''")}%'`
      : "";
    const q = `select id, timestamp, event_message, event_type, level from function_logs where function_id in (select id from functions where name = '${fn}') ${filter} order by timestamp desc limit ${lim}`;
    return await analyticsQuery(q);
  }

  if (name === "read_db_logs") {
    const sev = typeof args.severity === "string" ? args.severity.toUpperCase() : "";
    const filter = sev ? `where parsed.error_severity = '${sev.replace(/'/g, "")}'` : "";
    const q = `select identifier, postgres_logs.timestamp, id, event_message, parsed.error_severity from postgres_logs cross join unnest(metadata) as m cross join unnest(m.parsed) as parsed ${filter} order by timestamp desc limit ${lim}`;
    return await analyticsQuery(q);
  }

  if (name === "find_user_by_email") {
    const email = String(args.email || "").trim().toLowerCase();
    if (!email) return { error: "email required" };
    const { data: list, error } = await adminClient.auth.admin.listUsers({ page: 1, perPage: 200 });
    if (error) return { error: error.message };
    const user = list.users.find((u) => (u.email || "").toLowerCase() === email);
    if (!user) return { found: false };
    const { data: roles } = await adminClient
      .from("user_roles").select("role").eq("user_id", user.id);
    return {
      found: true,
      id: user.id,
      email: user.email,
      created_at: user.created_at,
      last_sign_in_at: user.last_sign_in_at,
      email_confirmed_at: user.email_confirmed_at,
      banned_until: (user as any).banned_until ?? null,
      providers: user.app_metadata?.providers ?? [],
      roles: (roles ?? []).map((r) => r.role),
    };
  }

  if (name === "check_url_health") {
    const url = String(args.url || "");
    if (!/^https?:\/\//.test(url)) return { error: "url must be http(s)" };
    const t0 = Date.now();
    try {
      const r = await fetch(url, { method: "GET", redirect: "manual" });
      return { url, status: r.status, ok: r.ok, ms: Date.now() - t0 };
    } catch (e) {
      return { url, error: String(e), ms: Date.now() - t0 };
    }
  }

  if (name === "create_support_ticket") {
    const { data, error } = await adminClient.from("support_tickets").insert({
      kind: String(args.kind || "general"),
      severity: ["low", "normal", "high", "urgent"].includes(String(args.severity))
        ? String(args.severity) : "normal",
      summary: String(args.summary || "Untitled"),
      details: args.details ? String(args.details) : null,
      target_email: args.target_email ? String(args.target_email) : null,
      opened_by: ctx.adminUserId,
    }).select("id, summary, kind, severity").single();
    if (error) return { error: error.message };
    return { ticket: data, message: "Ticket filed." };
  }

  // Destructive proposals → pending_admin_actions, NOT executed
  const propMap: Record<string, string> = {
    propose_password_reset: "password_reset",
    propose_resend_confirmation: "resend_confirmation",
    propose_unlock_user: "unlock_user",
    propose_sign_out_user: "sign_out_user",
  };
  if (name in propMap) {
    const actionType = propMap[name];
    const email = String(args.email || "").trim().toLowerCase();
    if (!email) return { error: "email required" };
    const reason = args.reason ? String(args.reason) : null;
    const summary = `${actionType.replace(/_/g, " ")} for ${email}${reason ? ` — ${reason}` : ""}`;
    const { data, error } = await adminClient.from("pending_admin_actions").insert({
      action_type: actionType,
      params: { email, reason },
      summary,
      proposed_by: ctx.adminUserId,
    }).select("id, action_type, params, summary, status").single();
    if (error) return { error: error.message };
    return {
      proposal: data,
      requires_approval: true,
      note: "This action is staged as pending. An admin must approve it in the UI before it runs.",
    };
  }

  return { error: `Unknown tool: ${name}` };
}

async function analyticsQuery(sql: string) {
  // Supabase analytics endpoint
  const projectRef = SUPABASE_URL.replace(/^https?:\/\//, "").split(".")[0];
  const url = `https://api.supabase.com/v1/projects/${projectRef}/analytics/endpoints/logs.all?sql=${encodeURIComponent(sql)}`;
  // Note: requires management API key which we don't have in edge fn.
  // Fall back to direct fetch against project logs proxy is unavailable from edge.
  // Return helpful error so the model can pivot.
  return {
    info: "Live log streaming from edge isn't wired in this environment. Ask the admin to check logs in the Cloud dashboard, or use find_user_by_email and check_url_health for runtime checks.",
    sql_attempted: sql.slice(0, 240),
    url_note: url ? "management-api-required" : undefined,
  };
}

Deno.serve(async (req) => {
  const cors = getCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405, headers: cors });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return j({ error: "Unauthorized" }, 401);
    if (!OPENROUTER_API_KEY) return j({ error: "Missing OPENROUTER_API_KEY" }, 500);

    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData.user) return j({ error: "Unauthorized" }, 401);
    const adminUserId = userData.user.id;

    const { data: isAdminRow } = await adminClient
      .from("user_roles").select("role").eq("user_id", adminUserId).eq("role", "admin").maybeSingle();
    const isAdmin = !!isAdminRow;

    const body = (await req.json()) as Body;
    if (!body?.messages?.length || body.messages.length > 40) return j({ error: "Invalid input" }, 400);
    const validMsgs = body.messages.every(
      (m) => (m.role === "user" || m.role === "assistant") &&
        typeof m.content === "string" && m.content.length >= 1 && m.content.length <= 4000,
    );
    if (!validMsgs) return j({ error: "Invalid input" }, 400);

    const targetAgentId = typeof body.targetAgentId === "string" ? body.targetAgentId : undefined;

    const [teamsRes, agentsRes] = await Promise.all([
      adminClient.from("agent_teams").select("id,name,description").order("sort_order"),
      adminClient.from("agent_registry").select("id,name,description,team_id").order("name"),
    ]);
    const teams = (teamsRes.data ?? []) as { id: string; name: string }[];
    const agents = (agentsRes.data ?? []) as { id: string; name: string; description: string | null; team_id: string }[];

    let target: { id: string; name: string; description: string | null } | null = null;
    if (targetAgentId) {
      const { data } = await adminClient
        .from("agent_registry").select("id,name,description").eq("id", targetAgentId).maybeSingle();
      if (data) target = data as typeof target;
    }

    const teamLines = teams
      .map((t) => `• ${t.name}: ${agents.filter((a) => a.team_id === t.id).map((m) => m.name).join(", ")}`)
      .join("\n") || "(no teams)";

    const adminSupportSystem = `\n\nYou ALSO act as the platform's IT/Login/App support agent for the admin.
Capabilities:
- Diagnose with read tools: read_auth_logs, read_edge_function_logs, read_db_logs, find_user_by_email, check_url_health.
- File support tickets with create_support_ticket.
- Propose user-account fixes with propose_password_reset / propose_resend_confirmation / propose_unlock_user / propose_sign_out_user — these STAGE the action and require admin approval before they run. Always tell the admin a proposal is awaiting approval.
- Never claim a destructive action is done unless a tool response says it executed.
- When something fails, walk through: (1) what symptom, (2) what tool(s) you'll use, (3) findings, (4) proposed fix or ticket.
- Be concise. Use bullets. Reference exact log/user data when you have it.`;

    const baseSystem = target
      ? `You are "${target.name}", a Confetti agent. ${target.description ?? ""}\nFirst-person, brutalist-warm, concise (2-6 sentences).`
      : `You are the Confetti Orchestrator — front-of-house for all Confetti agents.\nActive teams:\n${teamLines}\nConcise (2-6 sentences), action-oriented.`;

    const system = baseSystem + (isAdmin ? adminSupportSystem : "");

    const conversation: Msg[] = [
      { role: "system" as any, content: system },
      ...body.messages,
    ];

    const tools = isAdmin ? adminTools : undefined;
    const proposalsCreated: any[] = [];

    // Tool loop, max 6 rounds
    for (let round = 0; round < 6; round++) {
      const upstream = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${OPENROUTER_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: conversation,
          ...(tools ? { tools, tool_choice: "auto" } : {}),
        }),
      });
      if (!upstream.ok) {
        const text = await upstream.text();
        const status = upstream.status === 429 || upstream.status === 402 ? upstream.status : 502;
        return j({ error: `AI gateway error (${upstream.status}): ${text.slice(0, 200)}` }, status);
      }
      const payload = await upstream.json();
      const choice = payload.choices?.[0]?.message;
      if (!choice) return j({ error: "Empty AI response" }, 502);

      const toolCalls = choice.tool_calls as Array<{ id: string; function: { name: string; arguments: string } }> | undefined;
      if (!toolCalls?.length) {
        return j({
          reply: choice.content ?? "",
          agent: target ? { id: target.id, name: target.name } : null,
          proposals: proposalsCreated,
        });
      }

      conversation.push(choice);
      for (const tc of toolCalls) {
        let parsedArgs: Record<string, unknown> = {};
        try { parsedArgs = JSON.parse(tc.function.arguments || "{}"); } catch { /* noop */ }
        const result = await runTool(tc.function.name, parsedArgs, { adminUserId });
        if ((result as any)?.proposal) proposalsCreated.push((result as any).proposal);
        conversation.push({
          role: "tool",
          tool_call_id: tc.id,
          content: JSON.stringify(result).slice(0, 6000),
        });
      }
    }

    return j({
      reply: "I reached the tool-loop limit. Please refine the question.",
      agent: target ? { id: target.id, name: target.name } : null,
      proposals: proposalsCreated,
    });
  } catch (error) {
    console.error("[agents-chat] error", error);
    return j({ error: error instanceof Error ? error.message : "Unknown error" }, 500);
  }
});

function j(body: unknown, status = 200, req?: Request) {
  const hdrs = req ? getCorsHeaders(req) : getCorsHeaders();
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...hdrs, "Content-Type": "application/json" },
  });
}
