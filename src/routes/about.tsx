import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/about")({
  head: () => ({
      meta: [
          { title: "About — Confetti" },
          {
              name: "description",
              content: "Confetti is the joyful planner for outings — built to get you off the couch and into the world.",
          },
          { property: "og:title", content: "About — Confetti" },
          {
              property: "og:description",
              content: "Why we built Confetti and what we believe about going out.",
          },
      ],
  }),
});
