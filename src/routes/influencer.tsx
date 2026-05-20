import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/influencer")({
  head: () => ({
    meta: [
      { title: "Influencer Program — Confetti" },
      {
        name: "description",
        content:
          "Join the Confetti Influencer Program — earn rewards by sharing your dining and nightlife experiences.",
      },
    ],
  }),
});
