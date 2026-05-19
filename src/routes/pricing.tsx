import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/pricing")({
  head: () => ({
      meta: [
          { title: "Pricing — Confetti" },
          {
              name: "description",
              content: "Free to start. Upgrade for unlimited AI plans, saved reservations and the full taste profile.",
          },
          { property: "og:title", content: "Pricing — Confetti" },
          {
              property: "og:description",
              content: "Simple plans for casual planners and people who go out every weekend.",
          },
      ],
  }),
});
