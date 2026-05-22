import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/$")({
  component: NotFound,
});

function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-6xl font-bold tracking-tight">404</h1>
      <p className="text-lg text-muted-foreground">
        This page doesn't exist — but your night out still can.
      </p>
      <Link
        to="/"
        className="mt-2 inline-flex h-10 items-center rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground transition-transform hover:scale-105"
      >
        Take me home
      </Link>
    </div>
  );
}
