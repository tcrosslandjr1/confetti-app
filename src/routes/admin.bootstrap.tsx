import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/bootstrap")({
  head: () => ({
      meta: [
          { title: "Bootstrap admin — Confetti" },
          { name: "robots", content: "noindex, nofollow" },
      ],
  }),
});
