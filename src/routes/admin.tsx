import { createFileRoute, Link } from "@tanstack/react-router";

function AdminNotFound() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">
          Admin page not found
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          This admin route doesn't exist. Check the URL or head back to the
          dashboard.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <Link
            to="/admin"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Admin Dashboard
          </Link>
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createFileRoute("/admin")({
  validateSearch: (search: Record<string, unknown>): { redirect?: string } => {
      const raw = typeof search.redirect === "string" ? search.redirect : "";
      const safe =
          raw.startsWith("/admin") && !raw.startsWith("//") && raw !== "/admin/login"
              ? raw
              : undefined;
      return { redirect: safe };
  },
  head: () => ({
      meta: [
          { title: "Admin Console — Confetti" },
          {
              name: "description",
              content: "Internal admin console for managing the Concierge platform.",
          },
          { name: "robots", content: "noindex, nofollow" },
      ],
  }),
  notFoundComponent: AdminNotFound,
  // Show the skeleton immediately on slow navigations rather than waiting the
  // default 1s before swapping in pendingComponent.
  pendingMs: 0,
});
