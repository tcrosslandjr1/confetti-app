/**
 * FIX: /login doesn't exist — redirect to /auth
 * CREATE this file at: src/routes/login.tsx
 *
 * Problem: Users (and some internal links) try /login but it doesn't
 * exist. The actual auth page is at /auth.
 */
import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/login")({
  component: () => <Navigate to="/auth" search={{ mode: "signin" }} replace />,
});
