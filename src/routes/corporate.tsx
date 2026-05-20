import { createFileRoute, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { CorporateShell } from "@/components/CorporateShell";

export const Route = createFileRoute("/corporate")({
  beforeLoad: async ({ location }) => {
    // Don't guard the login page itself — it's a child of this layout,
    // so the parent beforeLoad fires first and would loop forever.
    if (location.pathname === "/corporate/login") return;

    const { data } = await supabase.auth.getUser();
    if (!data.user) {
      throw redirect({
        to: "/corporate/login",
        search: { redirect: location.pathname },
      });
    }
  },
  component: CorporateShell,
  head: () => ({
    meta: [
      { title: "Corporate Portal — Confetti" },
      {
        name: "description",
        content: "Plan, approve, and report on team outings, offsites, and client dinners.",
      },
    ],
  }),
});
