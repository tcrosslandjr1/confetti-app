import { redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export async function requireBusinessOwner() {
  const { data } = await supabase.auth.getUser();
  if (!data.user) {
    throw redirect({ to: "/business/login" });
  }
  const { data: roles } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", data.user.id)
    .in("role", ["admin", "business_owner"]);

  const hasRole = (roles ?? []).some(
    (r) => r.role === "admin" || r.role === "business_owner"
  );
  if (!hasRole) {
    throw redirect({ to: "/" });
  }
}
