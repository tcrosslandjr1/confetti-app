import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/business/register")({
  head: () => ({
    meta: [
      { title: "Register Your Business — Confetti" },
      {
        name: "description",
        content:
          "Join the Confetti network — list your restaurant, bar, or venue and reach new customers.",
      },
    ],
  }),
});
