import { createFileRoute, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { CorporateShell } from "@/components/CorporateShell";

export const Route = createFileRoute("/corporate")({
  beforeLoad: async ({ location }) => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) {
      throw redirect({
        to: "/corporate/login",
        search: { redirect: location.href },
      });
    }
  },
  component: CorporateShell,
  head: () => ({
    meta: [
      { title: "Corporate Portal — Confetti" },
      {
        name: "description",
        content:
          "Plan, approve, and report on team outings, offsites, and client dinners.",
      },
    ],
  }),
});
