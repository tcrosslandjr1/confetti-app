import { createFileRoute, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/quick-generate")({
  beforeLoad: async () => {
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      throw redirect({ to: "/auth", search: { redirect: "/quick-generate", mode: "signup" as const } });
    }
  },
  head: () => ({ meta: [{ title: "Quick Generate — Confetti" }] }),
});
