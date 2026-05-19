import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/routes-map")({
  head: () => ({
      meta: [{ title: "Routes map — Admin" }, { name: "robots", content: "noindex, nofollow" }],
  }),
});
