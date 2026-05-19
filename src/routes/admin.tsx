import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/admin")({
  validateSearch: (search: Record<string, unknown>): { redirect?: string } => {
      const raw = typeof search.redirect === "string" ? search.redirect : "";
      const safe =
          raw.startsWith("/admin") && !raw.startsWith("//") && raw !== "/admin/login"
              ? raw
              : undefined;
      return { redirect: safe };
  },
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
