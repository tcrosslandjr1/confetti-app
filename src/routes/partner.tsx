import { createFileRoute, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/partner")({
  beforeLoad: async ({ location }) => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
          throw redirect({
              to: "/auth",
              search: { redirect: location.pathname } as never,
          });
      }
      return { userEmail: data.user.email ?? null };
  },
  head: () => ({
      meta: [
          { title: "Partner Dashboard — Confetti" },
          {
              name: "description",
              content: "Manage reservations, orders, menu, and analytics for your venue on Confetti.",
          },
      ],
  }),
});
