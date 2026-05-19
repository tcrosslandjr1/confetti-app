import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/marquee")({
  head: () => ({
      meta: [
          { title: "Sponsored marquee — Admin" },
          { name: "robots", content: "noindex, nofollow" },
      ],
  }),
});
