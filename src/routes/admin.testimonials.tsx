import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/testimonials")({
  head: () => ({
      meta: [{ title: "Testimonials — Admin" }, { name: "robots", content: "noindex, nofollow" }],
  }),
});
