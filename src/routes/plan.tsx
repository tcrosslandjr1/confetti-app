import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/plan")({
  head: () => ({
      meta: [
          { title: "Plan my day — Confetti" },
          {
              name: "description",
              content: "Tell us the occasion and we'll build a full-day itinerary with stops, timing, and booking links.",
          },
      ],
  }),
});
