import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/portal")({
  head: () => ({
      meta: [
          { title: "My Portal — Confetti" },
          {
              name: "description",
              content: "Your bookings, saved spots, passport, and profile in one place.",
          },
      ],
  }),
});
