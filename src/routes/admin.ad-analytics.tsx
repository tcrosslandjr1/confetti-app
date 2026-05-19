import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/ad-analytics")({
  head: () => ({
      meta: [{ title: "Ad analytics — Admin" }, { name: "robots", content: "noindex, nofollow" }],
  }),
});
