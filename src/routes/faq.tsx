import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/faq")({
  head: () => ({
    meta: [
      { title: "FAQ — Confetti" },
      {
        name: "description",
        content:
          "Frequently asked questions about Confetti — the AI-powered dining and nightlife concierge.",
      },
    ],
  }),
});
