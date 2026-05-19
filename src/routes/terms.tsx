import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/terms")({
  head: () => ({
      meta: [
          { title: "Terms of Service — Confettiplan" },
          {
              name: "description",
              content: "The terms that govern your use of Confettiplan, including accounts, acceptable use, payments, AI outputs, liability, and termination.",
          },
          { name: "robots", content: "index, follow" },
          { property: "og:title", content: "Terms of Service — Confettiplan" },
          {
              property: "og:description",
              content: "Plain-language terms for using Confettiplan.",
          },
      ],
  }),
});
