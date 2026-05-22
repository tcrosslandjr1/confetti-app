import { createFileRoute, redirect } from "@tanstack/react-router";

// Legacy onboarding route — redirects to the real taste-tuner flow.
export const Route = createFileRoute("/onboarding")({
  beforeLoad: () => {
    throw redirect({ to: "/taste-tuner" });
  },
});
