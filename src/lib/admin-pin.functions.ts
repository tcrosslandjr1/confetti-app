import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Server-side admin PIN verification.
 *
 * Requires an authenticated session with admin role. Calls the
 * `verify_admin_pin` Postgres RPC which checks against the hashed PIN
 * stored in `admin_pins`, handles lockout after failed attempts, etc.
 */
export const verifyAdminPin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({ pin: z.string().min(4).max(10) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    // Double-check the caller is an admin
    const { data: isAdmin } = await supabaseAdmin.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) {
      throw new Response("Forbidden: admin only", { status: 403 });
    }

    const { data: ok, error } = await supabaseAdmin.rpc("verify_admin_pin", {
      _pin: data.pin,
    });

    if (error) {
      console.error("[verifyAdminPin]", error.message);
      return { verified: false, error: "Server error" };
    }

    return { verified: !!ok };
  });
