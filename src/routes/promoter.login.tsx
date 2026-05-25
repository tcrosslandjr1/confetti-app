import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/promoter/login")({
  validateSearch: (search: Record<string, unknown>): { redirect?: string } => {
    const raw = typeof search.redirect === "string" ? search.redirect : "";
    const safe = raw.startsWith("/") && !raw.startsWith("//") ? raw : "/promoter";
    return { redirect: safe };
  },
  beforeLoad: ({ search }) => {
    throw redirect({
      to: "/auth",
      search: { redirect: search.redirect ?? "/promoter", mode: "signin" },
    });
  },
});
