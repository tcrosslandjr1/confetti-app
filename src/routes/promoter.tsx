import { createFileRoute, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/promoter")({
  beforeLoad: async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user)
          throw redirect({ to: "/auth", search: { redirect: "/promoter" } as any });
  },
  head: () => ({
      meta: [
          { title: "Promoter Portal — Confetti" },
          {
              name: "description",
              content: "Manage your Confetti promoter profile, jobs, and earnings.",
          },
      ],
  }),
});
