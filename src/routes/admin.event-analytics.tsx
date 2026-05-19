import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/event-analytics")({
  head: () => ({
      meta: [
          { title: "Event analytics — Confetti admin" },
          { name: "robots", content: "noindex, nofollow" },
      ],
  }),
});
