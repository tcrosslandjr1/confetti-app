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

    // Resolve email from profiles so we always have reviewer_email
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
