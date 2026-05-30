import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Global Privacy Policy — Confettiplan" },
      {
        name: "description",
        content:
          "How Confettiplan collects, uses, shares, and protects your personal data worldwide — including GDPR, UK GDPR, CCPA/CPRA, LGPD, and PIPEDA rights.",
      },
      { name: "robots", content: "index, follow" },
      { property: "og:title", content: "Global Privacy Policy — Confettiplan" },
      {
        property: "og:description",
        content:
          "Plain-language privacy policy covering what we collect, how we use it, and your rights wherever you live.",
      },
    ],
  }),
});
