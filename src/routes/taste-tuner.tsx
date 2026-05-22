import { createFileRoute, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/taste-tuner")({
  beforeLoad: async () => {
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      throw redirect({ to: "/auth", search: { redirect: "/taste-tuner", mode: "signup" as const } });
    }
  },
  head: () => ({ meta: [{ title: "Taste Tuner — Confetti" }] }),
});
