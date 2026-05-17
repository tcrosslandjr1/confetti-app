import { createFileRoute, redirect } from "@tanstack/react-router";

// Consolidated into the canonical /passport experience.
// Kept as a redirect so old bookmarks, share links, and admin nav entries
// continue to resolve.
export const Route = createFileRoute("/portal/passport")({
  beforeLoad: () => {
    throw redirect({ to: "/passport" });
  },
});
