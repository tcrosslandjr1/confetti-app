/**
 * User route guards — shared helper for `beforeLoad` in authenticated user routes.
 *
 * If not authenticated → redirect to /auth with a `redirect` search param
 * so the user returns to their intended page after login.
 */

import { redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export async function requireUserAccess() {
  const { data: authData } = await supabase.auth.getUser();
  const user = authData?.user;

  if (!user) {
    throw redirect({
      to: "/auth",
      search: { redirect: window.location.pathname },
    });
  }
}
