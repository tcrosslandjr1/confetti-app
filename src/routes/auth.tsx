import { createFileRoute, redirect } from "@tanstack/react-router";

// Old /auth route — redirect everything to the new sign-in screen.
// /new/signin auto-forwards to /new/hub if the user is already logged in.
export const Route = createFileRoute("/auth")({
  beforeLoad: () => {
    throw redirect({ to: "/new/signin" });
  },
  component: () => null,
});
