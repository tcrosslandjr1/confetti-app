import { createLazyFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createLazyFileRoute("/active-confetti")({
  component: () => <Navigate to="/active-loop" replace/>,
});


