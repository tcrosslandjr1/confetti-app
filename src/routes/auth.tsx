import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/auth")({
  validateSearch: (search: Record<string, unknown>): { redirect?: string; mode?: "signin" | "signup" | "reset" } => {
    const raw = typeof search.redirect === "string" ? search.redirect : "";
    const safe = raw.startsWith("/") && !raw.startsWith("//") ? raw : "/";
    const m: "signin" | "signup" | "reset" | undefined =
      search.mode === "signin" || search.mode === "signup" || search.mode === "reset"
        ? (search.mode as "signin" | "signup" | "reset")
        : undefined;
    return { redirect: safe, mode: m };
  },
  head: () => ({ meta: [{ title: "Welcome — Confetti" }] }),
});
