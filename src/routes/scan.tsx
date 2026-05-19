import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/scan")({
  head: () => ({
      meta: [
          { title: "Scan check-in QR — Confetti" },
          { name: "robots", content: "noindex, nofollow" },
      ],
  }),
});
