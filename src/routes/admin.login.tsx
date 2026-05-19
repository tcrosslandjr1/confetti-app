import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/login")({
  head: () => ({
      meta: [{ title: "Admin sign in — Confetti" }, { name: "robots", content: "noindex, nofollow" }],
  }),
});
