import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/pick-analytics")({
  head: () => ({
      meta: [{ title: "Pick Analytics — Admin" }, { name: "robots", content: "noindex, nofollow" }],
  }),
});
