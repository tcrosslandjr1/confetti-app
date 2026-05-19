import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/wallet-debug")({
  head: () => ({
      meta: [{ title: "Wallet JWT Debug — Admin" }, { name: "robots", content: "noindex, nofollow" }],
  }),
});
