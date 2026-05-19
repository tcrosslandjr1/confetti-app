import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/viral")({
  head: () => ({
      meta: [
          { title: "Viral Now — Trending Spots | Confetti" },
          {
              name: "description",
              content: "Where everyone's going right now — viral restaurants, hidden gems, and Instagrammable spots trending across TikTok, Instagram, and the press.",
          },
          { property: "og:title", content: "Viral Now — Trending Spots" },
          {
              property: "og:description",
              content: "Trending venues from TikTok, Instagram, and creators — refreshed daily.",
          },
      ],
  }),
});
