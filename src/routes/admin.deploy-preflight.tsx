import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/deploy-preflight")({
  head: () => ({
    meta: [
      { title: "Deploy preflight — Admin" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
});
