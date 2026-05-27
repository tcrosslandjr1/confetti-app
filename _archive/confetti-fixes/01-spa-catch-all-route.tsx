/**
 * FIX: SPA Catch-All Route
 * CREATE this file at: src/routes/$.tsx
 *
 * Problem: When users navigate directly to a URL like /discover or /auth,
 * the server returns a 404 because there's no catch-all route.
 * This file tells TanStack Router to handle ALL unknown paths gracefully
 * instead of letting the server reject them.
 */
import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/$")({
  component: CatchAll,
});

function CatchAll() {
  // If TanStack Router matched this, the path doesn't map to a real route.
  // Show the router's built-in 404 component.
  // This is handled by defaultNotFoundComponent in router.tsx.
  return <Navigate to="/" />;
}
