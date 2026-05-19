import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/roles")({
  head: () => ({
      meta: [{ title: "Admin roles — Confetti" }, { name: "robots", content: "noindex, nofollow" }],
  }),
});
