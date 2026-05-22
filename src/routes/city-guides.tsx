import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/city-guides")({
  beforeLoad: () => {
    throw redirect({ to: "/" });
  },
});
