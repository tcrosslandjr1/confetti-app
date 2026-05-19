import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/outreach")({
  head: () => ({
      meta: [{ title: "Weekly Outreach — Admin" }, { name: "robots", content: "noindex, nofollow" }],
  }),
});
