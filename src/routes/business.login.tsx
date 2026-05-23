import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/business/login")({
  component: () => <Navigate to="/business" replace />,
});
