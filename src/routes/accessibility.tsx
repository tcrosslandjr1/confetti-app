import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/accessibility")({
  head: () => ({
    meta: [
      { title: "Accessibility Statement — Confettiplan" },
      {
        name: "description",
        content:
          "Confettiplan's commitment to accessibility, the standards we follow (WCAG 2.2 AA), known limitations, and how to report barriers.",
      },
      { name: "robots", content: "index, follow" },
      { property: "og:title", content: "Accessibility Statement — Confettiplan" },
      {
        property: "og:description",
        content:
          "Our commitment to making Confettiplan usable for everyone, including people with disabilities.",
      },
    ],
  }),
});
