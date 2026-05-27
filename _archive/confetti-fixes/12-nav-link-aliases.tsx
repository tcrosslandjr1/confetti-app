/**
 * FIX: Dead nav link — /city-guides doesn't exist
 * CREATE this file at: src/routes/city-guides.tsx
 *
 * Problem: The navigation has a "CITY GUIDES" link pointing to /city-guides
 * but that route doesn't exist. This creates a redirect to /discover which
 * is the closest existing page.
 */
import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/city-guides")({
  component: () => <Navigate to="/discover" replace />,
});
