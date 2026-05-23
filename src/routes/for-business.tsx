import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/for-business")({
  component: () => <Navigate to="/business" replace />,
});
