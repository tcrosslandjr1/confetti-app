import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/qa")({
  head: () => ({
      meta: [{ title: "Confetti QA Harness" }, { name: "robots", content: "noindex" }],
  }),
});
