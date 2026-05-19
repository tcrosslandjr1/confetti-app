import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/launch")({
  head: () => ({
      meta: [{ title: "Launch checklist — Admin" }, { name: "robots", content: "noindex, nofollow" }],
  }),
});
