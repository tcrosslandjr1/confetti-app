import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/creators")({
  head: () => ({
    meta: [
      { title: "Confetti Creator Program — Get Paid to Go Out" },
      {
        name: "description",
        content:
          "Join the Confetti Creator Network. Get paid to plan and document unforgettable nights out. Apply for the Explorer, Tastemaker, or Headliner tier.",
      },
      { property: "og:title", content: "Confetti Creator Program" },
      {
        property: "og:description",
        content:
          "Get paid to go out. Join the Confetti Creator Network — cash per post, VIP experiences, and up to 20% revenue share.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});
