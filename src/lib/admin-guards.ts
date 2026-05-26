/**
 * Admin route guards — shared helper for `beforeLoad` in protected admin routes.
 *
 * A user has admin access if they are authenticated AND have an 'admin' row
 * in the `user_roles` table.
 *
 * If not authenticated → redirect to /admin/login (which bounces to /auth).
 * If authenticated but not admin → show "Access Denied" via redirect to /app.
 */

import { redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export async function requireAdminAccess() {
  const { data: authData } = await supabase.auth.getUser();
  const user = authData?.user;

  if (!user) {
    throw redirect({
      to: "/admin/login",
      search: { redirect: window.location.pathname },
    });
  }

  const { data: roleData } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .eq("role", "admin")
    .maybeSingle();

  if (!roleData) {
    throw redirect({ to: "/app" });
  }
}
