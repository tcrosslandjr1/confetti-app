// Admin-only executor for pending_admin_actions.
// Approve & execute, or reject. All actions are audit-logged on the row.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { getCorsHeaders } from "../_shared/cors.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const PUBLIC_SITE = Deno.env.get("PUBLIC_SITE_URL") || "https://confettiplan.lovable.app";

const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

type Body = { action_id: string; decision: "approve" | "reject" };

Deno.serve(async (req) => {
  const cors = getCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405, headers: cors });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return j({ error: "Unauthorized" }, 401);

    const userClient = createClient(SUPABASE_URL, ANON_KEY, { global: { headers: { Authorization: authHeader } } });
    const { data: ud, error: ue } = await userClient.auth.getUser();
    if (ue || !ud.user) return j({ error: "Unauthorized" }, 401);

    const { data: roleRow } = await admin
      .from("user_roles").select("role").eq("user_id", ud.user.id).eq("role", "admin").maybeSingle();
    if (!roleRow) return j({ error: "Admin only" }, 403);

    const body = (await req.json()) as Body;
    if (!body?.action_id || (body.decision !== "approve" && body.decision !== "reject")) {
      return j({ error: "Invalid input" }, 400);
    }

    const { data: action, error: aErr } = await admin
      .from("pending_admin_actions").select("*").eq("id", body.action_id).maybeSingle();
    if (aErr || !action) return j({ error: "Action not found" }, 404);
    if (action.status !== "pending") return j({ error: `Action already ${action.status}` }, 409);

    if (body.decision === "reject") {
      await admin.from("pending_admin_actions").update({
        status: "rejected", approved_by: ud.user.id,
      }).eq("id", action.id);
      return j({ ok: true, status: "rejected" });
    }

    // Execute
    const params = (action.params ?? {}) as Record<string, any>;
    const email = String(params.email || "").trim().toLowerCase();
    let result: any = null;
    let errMsg: string | null = null;

    try {
      if (action.action_type === "password_reset") {
        const { data, error } = await admin.auth.admin.generateLink({
          type: "recovery", email, options: { redirectTo: `${PUBLIC_SITE}/reset-password` },
        });
        if (error) throw error;
        result = { sent: true, link_generated: !!data?.properties?.action_link };
      } else if (action.action_type === "resend_confirmation") {
        const { data, error } = await admin.auth.admin.generateLink({
          type: "signup", email, options: { redirectTo: `${PUBLIC_SITE}/` },
        });
        if (error) throw error;
        result = { sent: true, link_generated: !!data?.properties?.action_link };
      } else if (action.action_type === "unlock_user") {
        const { data: list, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
        if (error) throw error;
        const u = list.users.find((x) => (x.email || "").toLowerCase() === email);
        if (!u) throw new Error("User not found");
        const { error: uErr } = await admin.auth.admin.updateUserById(u.id, { ban_duration: "none" });
        if (uErr) throw uErr;
        result = { unlocked: true, user_id: u.id };
      } else if (action.action_type === "sign_out_user") {
        const { data: list, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
        if (error) throw error;
        const u = list.users.find((x) => (x.email || "").toLowerCase() === email);
        if (!u) throw new Error("User not found");
        const { error: sErr } = await admin.auth.admin.signOut(u.id);
        if (sErr) throw sErr;
        result = { signed_out: true, user_id: u.id };
      } else {
        throw new Error(`Unsupported action_type: ${action.action_type}`);
      }
    } catch (e) {
      errMsg = e instanceof Error ? e.message : String(e);
    }

    await admin.from("pending_admin_actions").update({
      status: errMsg ? "failed" : "executed",
      approved_by: ud.user.id,
      executed_at: new Date().toISOString(),
      result, error: errMsg,
    }).eq("id", action.id);

    return j({ ok: !errMsg, status: errMsg ? "failed" : "executed", result, error: errMsg });
  } catch (e) {
    return j({ error: e instanceof Error ? e.message : "Unknown error" }, 500);
  }
});

function j(b: unknown, s = 200, req?: Request) {
  const hdrs = getCorsHeaders(req);
  return new Response(JSON.stringify(b), { status: s, headers: { ...hdrs, "Content-Type": "application/json" } });
}
