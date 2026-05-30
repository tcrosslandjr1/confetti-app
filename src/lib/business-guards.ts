/**
 * Business route guards — shared helper for `beforeLoad` in protected business routes.
 *
 * A user has business access if ANY of these are true:
 *   1. They own an advertiser account (advertisers.owner_id = user.id)
 *   2. They have a venue claim (venue_claims.user_id = user.id)
 *   3. They are an admin (user_roles.role = 'admin')
 *
 * If none apply, the user is redirected to the public business landing page.
 */

import { redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export async function requireBusinessAccess() {
  const { data: authData } = await supabase.auth.getUser();
  const user = authData?.user;

  if (!user) {
    throw redirect({ to: "/business/login" });
  }

  // Check all three access paths in parallel
  const [advRes, claimRes, roleRes] = await Promise.all([
    supabase.from("advertisers").select("id").eq("owner_id", user.id).limit(1).maybeSingle(),
    supabase.from("venue_claims").select("id").eq("user_id", user.id).limit(1).maybeSingle(),
    supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle(),
  ]);

  const hasAccess = !!advRes.data || !!claimRes.data || !!roleRes.data;

  if (!hasAccess) {
    throw redirect({
      to: "/business",
      search: { message: "You need a business account to access that page." },
    });
  }
}
