import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/active-confetti")({
  component: () => <Navigate to="/active-loop" replace />,
});
