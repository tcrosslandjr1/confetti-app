import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/passport")({
  head: () => ({ meta: [{ title: "Passport — Confetti" }] }),
});
