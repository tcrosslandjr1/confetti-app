import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const logPinUnlockAttempt = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (input: {
      success: boolean;
      attemptNumber: number;
      ip?: string;
      userAgent?: string;
    }) => input,
  )
  .handler(async ({ data, context }) => {
    const { userId, supabase } = context;
    const { data: profile } = await supabase
      .from("profiles")
      .select("display_name")
      .eq("id", userId)
      .single();
    const displayName = profile?.display_name ?? "unknown";

    await supabaseAdmin.from("admin_audit_log").insert({
      reviewer_id: userId,
      reviewer_email: `${displayName} <admin>`,
      action: data.success ? "pin_unlock_success" : "pin_unlock_failed",
      entity_type: "system",
      entity_id: "admin-console",
      entity_label: "Admin Console PIN",
      note: data.success
        ? `Console unlocked (attempt ${data.attemptNumber})`
        : `Wrong PIN entered (attempt ${data.attemptNumber})`,
      metadata: {
        attemptNumber: data.attemptNumber,
        success: data.success,
        ip: data.ip ?? null,
        userAgent: data.userAgent ?? null,
      },
    });

    return { logged: true };
  });

/**
 * Verifies the signed-in admin's password and, on success, logs a lockout
 * reset event. Used by the PIN lock screen to clear a lockout without
 * forcing a full sign-out.
 */
export const resetPinLockout = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { password: string; userAgent?: string }) => input)
  .handler(async ({ data, context }) => {
    const { userId, supabase, claims } = context;
    const email = (claims as { email?: string })?.email;
    if (!email) {
      return { ok: false as const, error: "No email on session" };
    }

    // Verify the password by signing in via the admin API (does not affect
    // the user's current session because we use a server-only client).
    const { error: signInError } = await supabaseAdmin.auth.signInWithPassword({
      email,
      password: data.password,
    });

    const { data: profile } = await supabase
      .from("profiles")
      .select("display_name")
      .eq("id", userId)
      .single();
    const displayName = profile?.display_name ?? "unknown";

    await supabaseAdmin.from("admin_audit_log").insert({
      reviewer_id: userId,
      reviewer_email: `${displayName} <admin>`,
      action: signInError ? "pin_lockout_reset_failed" : "pin_lockout_reset",
      entity_type: "system",
      entity_id: "admin-console",
      entity_label: "Admin Console PIN",
      note: signInError
        ? "Failed lockout reset (wrong password)"
        : "Lockout reset via password re-auth",
      metadata: {
        success: !signInError,
        userAgent: data.userAgent ?? null,
      },
    });

    if (signInError) {
      return { ok: false as const, error: "Incorrect password" };
    }
    return { ok: true as const };
  });

/**
 * Logs an automatic idle lock event when the admin console auto-locks
 * after a period of inactivity.
 */
export const logPinIdleLock = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { userAgent?: string }) => input)
  .handler(async ({ data, context }) => {
    const { userId, supabase } = context;
    const { data: profile } = await supabase
      .from("profiles")
      .select("display_name")
      .eq("id", userId)
      .single();
    const displayName = profile?.display_name ?? "unknown";

    await supabaseAdmin.from("admin_audit_log").insert({
      reviewer_id: userId,
      reviewer_email: `${displayName} <admin>`,
      action: "pin_idle_lock",
      entity_type: "system",
      entity_id: "admin-console",
      entity_label: "Admin Console PIN",
      note: "Console auto-locked due to inactivity",
      metadata: {
        userAgent: data.userAgent ?? null,
      },
    });

    return { logged: true };
  });

export type AuditExportRow = {
  id: string;
  created_at: string;
  reviewer_id: string;
  reviewer_email: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  entity_label: string | null;
  note: string | null;
  ip_address: string | null;
  user_agent: string | null;
  metadata: Record<string, unknown> | null;
};

/**
 * Returns admin_audit_log rows in [from, to) for CSV export.
 * Capped at 10,000 rows per export. Admin-gated via has_role check.
 */
export const exportAdminAuditLog = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      from: z.string().datetime(),
      to: z.string().datetime(),
      action: z.string().trim().max(64).optional(),
    }).parse,
  )
  .handler(async ({ data, context }): Promise<{ rows: AuditExportRow[]; truncated: boolean }> => {
    const { supabase, userId } = context;
    const { data: roleRow } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();
    if (!roleRow) throw new Error("Admins only");

    const LIMIT = 10_000;
    let query = supabaseAdmin
      .from("admin_audit_log")
      .select(
        "id, created_at, reviewer_id, reviewer_email, action, entity_type, entity_id, entity_label, note, ip_address, user_agent, metadata",
      )
      .gte("created_at", data.from)
      .lt("created_at", data.to)
      .order("created_at", { ascending: false })
      .limit(LIMIT);

    if (data.action && data.action !== "all") {
      query = query.eq("action", data.action);
    }

    const { data: rows, error } = await query;
    if (error) throw new Error(error.message);

    return {
      rows: (rows ?? []) as AuditExportRow[],
      truncated: (rows?.length ?? 0) >= LIMIT,
    };
  });
