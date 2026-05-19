import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/admin")({
  head: () => ({
      meta: [
          { title: "Admin Console — Confetti" },
          {
              name: "description",
              content: "Internal admin console for managing the Concierge platform.",
          },
          { name: "robots", content: "noindex, nofollow" },
      ],
  }),
  // Show the skeleton immediately on slow navigations rather than waiting the
  // default 1s before swapping in pendingComponent.
  pendingMs: 0,
});
