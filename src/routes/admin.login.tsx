import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/login")({
  validateSearch: (search: Record<string, unknown>): { redirect?: string } => {
      const raw = typeof search.redirect === "string" ? search.redirect : "";
      const safe =
          raw.startsWith("/admin") && !raw.startsWith("//") && raw !== "/admin/login"
              ? raw
              : undefined;
      return { redirect: safe };
  },
  head: () => ({
      meta: [{ title: "Admin sign in — Confetti" }, { name: "robots", content: "noindex, nofollow" }],
  }),
});
