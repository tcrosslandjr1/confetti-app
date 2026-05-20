// ============================================================================
// Confetti App — Consent API Edge Function
// Supabase Deno Edge Function routing consent management endpoints.
// All endpoints require authenticated user (JWT via Supabase Auth).
// ============================================================================

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface OnboardingPayload {
  core_service: boolean;
  taste_profiling: boolean;
  location_services: boolean;
  dietary_health: boolean;
  marketing_comms: boolean;
  sms_push: boolean;
  cookies_tracking: boolean;
  document_versions: Record<string, string>;
}

interface GrantPayload {
  category: string;
  version: string;
}

interface WithdrawPayload {
  category: string;
}

interface DataRequestPayload {
  request_type: string;
}

// ---------------------------------------------------------------------------
// CORS headers
// ---------------------------------------------------------------------------

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

// ---------------------------------------------------------------------------
// Supabase client factory
// ---------------------------------------------------------------------------

function getSupabaseClient(authHeader: string) {
  return createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? "",
    {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false },
    }
  );
}

function getServiceClient() {
  return createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );
}

// ---------------------------------------------------------------------------
// Auth helper
// ---------------------------------------------------------------------------

async function getUser(supabase: ReturnType<typeof createClient>) {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) {
    throw new Error("Unauthorized");
  }
  return user;
}

// ---------------------------------------------------------------------------
// Audit logger
// ---------------------------------------------------------------------------

async function auditLog(
  serviceClient: ReturnType<typeof createClient>,
  params: {
    user_id: string;
    action: string;
    category_key?: string;
    details?: Record<string, unknown>;
    ip_hash?: string;
    user_agent?: string;
  }
) {
  await serviceClient.from("consent_audit_log").insert({
    user_id: params.user_id,
    action: params.action,
    category_key: params.category_key || null,
    details: params.details || {},
    ip_hash: params.ip_hash || null,
    user_agent: params.user_agent || null,
  });
}

// ---------------------------------------------------------------------------
// IP hashing (privacy-preserving)
// ---------------------------------------------------------------------------

async function hashIP(ip: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(ip + (Deno.env.get("IP_SALT") || "confetti-salt"));
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .substring(0, 16); // Truncated hash — no need for full precision
}

// ===========================================================================
// Route handlers
// ===========================================================================

// ---------------------------------------------------------------------------
// POST /consent/onboarding — Submit all consent choices from boarding pass
// ---------------------------------------------------------------------------

async function handleOnboarding(
  req: Request,
  supabase: ReturnType<typeof createClient>
) {
  const user = await getUser(supabase);
  const body: OnboardingPayload = await req.json();
  const serviceClient = getServiceClient();
  const ip = req.headers.get("x-forwarded-for") || "unknown";
  const ipHash = await hashIP(ip);
  const ua = req.headers.get("user-agent") || "";

  // core_service must be true
  if (!body.core_service) {
    return jsonResponse({ error: "Core service agreement is required" }, 400);
  }

  // Map toggle state to consent records
  const categories = [
    { key: "core_service", granted: true },
    { key: "taste_profiling", granted: body.taste_profiling },
    { key: "location_services", granted: body.location_services },
    { key: "dietary_health", granted: body.dietary_health },
    { key: "marketing_comms", granted: body.marketing_comms },
    { key: "sms_push", granted: body.sms_push },
    { key: "cookies_tracking", granted: body.cookies_tracking },
  ];

  // Get current document versions
  const { data: docVersions } = await serviceClient
    .from("document_versions")
    .select("document_key, version")
    .eq("is_current", true)
    .in("category", ["user_facing", "compliance"]);

  const versionMap: Record<string, string> = {};
  (docVersions || []).forEach((dv: { document_key: string; version: string }) => {
    versionMap[dv.document_key] = dv.version;
  });

  // Upsert consent records
  const records = categories.map((c) => ({
    user_id: user.id,
    category_key: c.key,
    granted: c.granted,
    version: versionMap[c.key] || body.document_versions?.terms_of_service || "1.0.0",
    method: c.key === "core_service" ? "clickwrap_onboarding" : "toggle_onboarding",
    ip_hash: ipHash,
    user_agent: ua,
    granted_at: c.granted ? new Date().toISOString() : null,
    withdrawn_at: c.granted ? null : null,
    updated_at: new Date().toISOString(),
  }));

  const { error: upsertError } = await serviceClient
    .from("consent_records")
    .upsert(records, { onConflict: "user_id,category_key" });

  if (upsertError) {
    return jsonResponse({ error: upsertError.message }, 500);
  }

  // Log each consent action to history
  for (const c of categories) {
    if (c.granted) {
      await serviceClient.from("consent_history").insert({
        user_id: user.id,
        category_key: c.key,
        action: "granted",
        version: versionMap[c.key] || "1.0.0",
        method: c.key === "core_service" ? "clickwrap_onboarding" : "toggle_onboarding",
        ip_hash: ipHash,
        user_agent: ua,
      });
    }
  }

  // Audit log
  await auditLog(serviceClient, {
    user_id: user.id,
    action: "onboarding_complete",
    details: {
      granted: categories.filter((c) => c.granted).map((c) => c.key),
      declined: categories.filter((c) => !c.granted).map((c) => c.key),
    },
    ip_hash: ipHash,
    user_agent: ua,
  });

  return jsonResponse({ success: true });
}

// ---------------------------------------------------------------------------
// GET /consent/status — Get current consent state for settings page
// ---------------------------------------------------------------------------

async function handleStatus(
  _req: Request,
  supabase: ReturnType<typeof createClient>
) {
  const user = await getUser(supabase);

  // Use RPC function for complete consent status
  const { data, error } = await supabase.rpc("get_consent_status", {
    p_user_id: user.id,
  });

  if (error) {
    return jsonResponse({ error: error.message }, 500);
  }

  // Transform for frontend
  const consents = (data || []).map(
    (row: {
      category_key: string;
      granted: boolean;
      version: string;
      granted_at: string | null;
      withdrawn_at: string | null;
      is_required: boolean;
      withdrawal_consequence: string;
    }) => ({
      category: row.category_key,
      granted: row.granted,
      version: row.version,
      granted_at: row.granted_at,
      withdrawn_at: row.withdrawn_at,
      is_required: row.is_required,
      withdrawal_consequence: row.withdrawal_consequence,
    })
  );

  return jsonResponse({ consents });
}

// ---------------------------------------------------------------------------
// POST /consent/grant — Grant a single consent category
// ---------------------------------------------------------------------------

async function handleGrant(
  req: Request,
  supabase: ReturnType<typeof createClient>
) {
  const user = await getUser(supabase);
  const body: GrantPayload = await req.json();
  const serviceClient = getServiceClient();
  const ip = req.headers.get("x-forwarded-for") || "unknown";
  const ipHash = await hashIP(ip);
  const ua = req.headers.get("user-agent") || "";

  if (!body.category) {
    return jsonResponse({ error: "category is required" }, 400);
  }

  // Use RPC for atomic grant
  const { error } = await supabase.rpc("grant_consent", {
    p_user_id: user.id,
    p_category_key: body.category,
    p_version: body.version || "1.0.0",
    p_method: "toggle_settings",
    p_ip_hash: ipHash,
    p_user_agent: ua,
  });

  if (error) {
    return jsonResponse({ error: error.message }, 500);
  }

  // Audit
  await auditLog(serviceClient, {
    user_id: user.id,
    action: "consent_granted",
    category_key: body.category,
    details: { version: body.version, method: "toggle_settings" },
    ip_hash: ipHash,
    user_agent: ua,
  });

  return jsonResponse({ success: true });
}

// ---------------------------------------------------------------------------
// POST /consent/withdraw — Withdraw a single consent category
// ---------------------------------------------------------------------------

async function handleWithdraw(
  req: Request,
  supabase: ReturnType<typeof createClient>
) {
  const user = await getUser(supabase);
  const body: WithdrawPayload = await req.json();
  const serviceClient = getServiceClient();
  const ip = req.headers.get("x-forwarded-for") || "unknown";
  const ipHash = await hashIP(ip);
  const ua = req.headers.get("user-agent") || "";

  if (!body.category) {
    return jsonResponse({ error: "category is required" }, 400);
  }

  // Cannot withdraw core_service through this endpoint
  if (body.category === "core_service") {
    return jsonResponse(
      { error: "Core service withdrawal requires account deletion" },
      400
    );
  }

  // Use RPC for atomic withdrawal
  const { error } = await supabase.rpc("withdraw_consent", {
    p_user_id: user.id,
    p_category_key: body.category,
    p_method: "toggle_settings",
    p_ip_hash: ipHash,
    p_user_agent: ua,
  });

  if (error) {
    return jsonResponse({ error: error.message }, 500);
  }

  // Audit
  await auditLog(serviceClient, {
    user_id: user.id,
    action: "consent_withdrawn",
    category_key: body.category,
    details: { method: "toggle_settings" },
    ip_hash: ipHash,
    user_agent: ua,
  });

  return jsonResponse({ success: true });
}

// ---------------------------------------------------------------------------
// GET /consent/reconsent — Check if re-consent is needed
// ---------------------------------------------------------------------------

async function handleReconsent(
  _req: Request,
  supabase: ReturnType<typeof createClient>
) {
  const user = await getUser(supabase);

  const { data, error } = await supabase.rpc("check_reconsent_needed", {
    p_user_id: user.id,
  });

  if (error) {
    return jsonResponse({ error: error.message }, 500);
  }

  const items = data || [];
  return jsonResponse({
    needed: items.length > 0,
    items,
  });
}

// ---------------------------------------------------------------------------
// POST /consent/data-request — Submit GDPR data subject request
// ---------------------------------------------------------------------------

async function handleDataRequest(
  req: Request,
  supabase: ReturnType<typeof createClient>
) {
  const user = await getUser(supabase);
  const body: DataRequestPayload = await req.json();
  const serviceClient = getServiceClient();
  const ip = req.headers.get("x-forwarded-for") || "unknown";
  const ipHash = await hashIP(ip);
  const ua = req.headers.get("user-agent") || "";

  const validTypes = [
    "access",
    "erasure",
    "rectification",
    "portability",
    "restrict_processing",
    "object_profiling",
    "automated_decision_review",
  ];

  if (!validTypes.includes(body.request_type)) {
    return jsonResponse(
      { error: `Invalid request type. Must be one of: ${validTypes.join(", ")}` },
      400
    );
  }

  // Calculate deadline based on type (GDPR: 30 days, can extend to 90)
  const deadline = new Date();
  deadline.setDate(deadline.getDate() + 30);

  const { data, error } = await serviceClient
    .from("data_subject_requests")
    .insert({
      user_id: user.id,
      request_type: body.request_type,
      status: "pending",
      deadline: deadline.toISOString(),
      details: {},
    })
    .select("id")
    .single();

  if (error) {
    return jsonResponse({ error: error.message }, 500);
  }

  // Audit
  await auditLog(serviceClient, {
    user_id: user.id,
    action: `data_request_${body.request_type}`,
    details: {
      request_id: data.id,
      deadline: deadline.toISOString(),
    },
    ip_hash: ipHash,
    user_agent: ua,
  });

  // If erasure, also mark in audit log for DPO review
  if (body.request_type === "erasure") {
    await auditLog(serviceClient, {
      user_id: user.id,
      action: "account_deletion_requested",
      details: {
        request_id: data.id,
        deadline: deadline.toISOString(),
        requires_dpo_review: true,
      },
      ip_hash: ipHash,
      user_agent: ua,
    });
  }

  return jsonResponse({ request_id: data.id });
}

// ---------------------------------------------------------------------------
// GET /consent/export — Export user data (GDPR Art. 20 portability)
// ---------------------------------------------------------------------------

async function handleExport(
  req: Request,
  supabase: ReturnType<typeof createClient>
) {
  const user = await getUser(supabase);
  const serviceClient = getServiceClient();
  const ip = req.headers.get("x-forwarded-for") || "unknown";
  const ipHash = await hashIP(ip);

  // Gather all user data
  const [consents, history, requests] = await Promise.all([
    serviceClient
      .from("consent_records")
      .select("*")
      .eq("user_id", user.id),
    serviceClient
      .from("consent_history")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
    serviceClient
      .from("data_subject_requests")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
  ]);

  const exportData = {
    export_date: new Date().toISOString(),
    user_id: user.id,
    email: user.email,
    consent_records: consents.data || [],
    consent_history: history.data || [],
    data_requests: requests.data || [],
  };

  // Log the export
  await auditLog(serviceClient, {
    user_id: user.id,
    action: "data_exported",
    details: {
      records_count: (consents.data || []).length,
      history_count: (history.data || []).length,
    },
    ip_hash: ipHash,
  });

  // Return as downloadable JSON
  return new Response(JSON.stringify(exportData, null, 2), {
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="confetti-data-export-${Date.now()}.json"`,
    },
  });
}

// ---------------------------------------------------------------------------
// GET /consent/audit-log — Get user's own audit log
// ---------------------------------------------------------------------------

async function handleAuditLog(
  req: Request,
  supabase: ReturnType<typeof createClient>
) {
  const user = await getUser(supabase);
  const url = new URL(req.url);
  const limit = parseInt(url.searchParams.get("limit") || "50");
  const offset = parseInt(url.searchParams.get("offset") || "0");

  const { data, error, count } = await supabase
    .from("consent_audit_log")
    .select("*", { count: "exact" })
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    return jsonResponse({ error: error.message }, 500);
  }

  return jsonResponse({
    entries: data || [],
    total: count || 0,
    limit,
    offset,
  });
}

// ===========================================================================
// JSON response helper
// ===========================================================================

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// ===========================================================================
// Router
// ===========================================================================

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return jsonResponse({ error: "Missing authorization header" }, 401);
    }

    const supabase = getSupabaseClient(authHeader);
    const url = new URL(req.url);
    const path = url.pathname.replace(/^\/consent/, "").replace(/\/$/, "") || "/";

    // Route by path + method
    if (req.method === "POST" && path === "/onboarding") {
      return await handleOnboarding(req, supabase);
    }
    if (req.method === "GET" && path === "/status") {
      return await handleStatus(req, supabase);
    }
    if (req.method === "POST" && path === "/grant") {
      return await handleGrant(req, supabase);
    }
    if (req.method === "POST" && path === "/withdraw") {
      return await handleWithdraw(req, supabase);
    }
    if (req.method === "GET" && path === "/reconsent") {
      return await handleReconsent(req, supabase);
    }
    if (req.method === "POST" && path === "/data-request") {
      return await handleDataRequest(req, supabase);
    }
    if (req.method === "GET" && path === "/export") {
      return await handleExport(req, supabase);
    }
    if (req.method === "GET" && path === "/audit-log") {
      return await handleAuditLog(req, supabase);
    }

    return jsonResponse({ error: "Not found" }, 404);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";

    if (message === "Unauthorized") {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    console.error("Consent API error:", err);
    return jsonResponse({ error: message }, 500);
  }
});
