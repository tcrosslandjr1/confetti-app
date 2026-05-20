import { createServerFn } from "@tanstack/react-start";
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
