import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/team-events")({
  head: () => ({
    meta: [
      { title: "Team Events — Confetti" },
      {
        name: "description",
        content:
          "Plan unforgettable team dinners, offsites, and celebrations with Confetti.",
      },
    ],
  }),
});
