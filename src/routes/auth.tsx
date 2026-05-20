import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/auth")({
  validateSearch: (search: Record<string, unknown>): { redirect?: string; mode?: "signin" | "signup" } => {
    const raw = typeof search.redirect === "string" ? search.redirect : "";
    const safe = raw.startsWith("/") && !raw.startsWith("//") ? raw : "/";
    const m = search.mode === "signin" || search.mode === "signup" ? search.mode : undefined;
    return { redirect: safe, mode: m };
  },
  head: () => ({ meta: [{ title: "Sign in — Confetti" }] }),
});
