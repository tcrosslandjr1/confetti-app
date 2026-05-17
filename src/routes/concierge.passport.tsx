import { createFileRoute, redirect } from "@tanstack/react-router";

// Consolidated into the canonical /passport experience.
// The unique "log a visit" form previously here is now a top-level concern of
// /passport. This route stays as a redirect for legacy links.
export const Route = createFileRoute("/concierge/passport")({
  beforeLoad: () => {
    throw redirect({ to: "/passport" });
  },
});
