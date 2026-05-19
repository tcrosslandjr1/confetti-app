import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/active-loop")({
  head: () => ({ meta: [{ title: "Active Confetti — Confetti" }] }),
});
