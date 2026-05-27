/**
 * FIX: /signup doesn't exist — redirect to /auth
 * CREATE this file at: src/routes/signup.tsx
 *
 * Problem: Users try /signup but it doesn't exist.
 * The actual signup page is at /auth?mode=signup.
 */
import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/signup")({
  component: () => <Navigate to="/auth" search={{ mode: "signup" }} replace />,
});
