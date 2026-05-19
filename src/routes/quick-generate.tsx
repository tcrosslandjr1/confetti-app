import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/quick-generate")({
  head: () => ({ meta: [{ title: "Quick Generate — Confetti" }] }),
});
