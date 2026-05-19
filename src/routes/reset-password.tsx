import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
      meta: [
          { title: "Reset Password — Confetti" },
          {
              name: "description",
              content: "Reset your Confetti account password securely.",
          },
          { name: "robots", content: "noindex, nofollow" },
      ],
  }),
});
