import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/partners")({
  head: () => ({
      meta: [
          { title: "Partners — Confetti" },
          {
              name: "description",
              content: "Confetti partner venues where you can earn and redeem rewards across the city.",
          },
          { property: "og:title", content: "Confetti Partners" },
          {
              property: "og:description",
              content: "Earn and redeem Confetti at our curated partner venues.",
          },
      ],
  }),
});
