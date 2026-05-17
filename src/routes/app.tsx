import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";

export const Route = createFileRoute("/app")({
  component: AppShell,
  head: () => ({
    meta: [
      { title: "Confetti — Tonight in your city" },
      {
        name: "description",
        content: "Trending venues, reels, events, and AI-planned nights — all in one mobile app.",
      },
    ],
  }),
});
