import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/taste-tuner")({
  head: () => ({ meta: [{ title: "Taste Tuner — Confetti" }] }),
});
