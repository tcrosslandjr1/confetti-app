import { createFileRoute, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin/promoters")({
  beforeLoad: async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user)
          throw redirect({ to: "/admin/login" });
  },
  head: () => ({ meta: [{ title: "Promoter Verification — Admin" }] }),
});
