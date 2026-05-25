import { createFileRoute, redirect } from "@tanstack/react-router";

// Promoter portal home — for now this lands on the existing influencer
// program surface. As the dedicated promoter dashboard ships, point this
// at /promoter/dashboard etc.
export const Route = createFileRoute("/promoter")({
  beforeLoad: () => {
    throw redirect({ to: "/influencer" });
  },
});
