import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/testimonials")({
  head: () => ({
      meta: [
          { title: "Testimonials — Confetti" },
          {
              name: "description",
              content: "Real plans, real nights, real reviews from people who use Confetti to actually go out.",
          },
          { property: "og:title", content: "Testimonials — Confetti" },
          { property: "og:description", content: "What people say after Confetti plans their night." },
      ],
  }),
});
