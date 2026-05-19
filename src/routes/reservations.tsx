import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/reservations")({
  head: () => ({
      meta: [
          { title: "Saved reservations — Confetti" },
          {
              name: "description",
              content: "Every reservation, confirmation code, and contact detail across your trips, in one place.",
          },
      ],
  }),
});
