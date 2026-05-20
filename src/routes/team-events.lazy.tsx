import { createLazyFileRoute } from "@tanstack/react-router";

export const Route = createLazyFileRoute("/team-events")({
  component: TeamEventsPage,
});

function TeamEventsPage() {
  return (
    <div className="min-h-screen bg-background px-4 py-16 text-center">
      <h1 className="text-4xl font-bold tracking-tight">Team Events</h1>
      <p className="mx-auto mt-4 max-w-md text-muted-foreground">
        Plan unforgettable team dinners, offsites, and celebrations — coming
        soon.
      </p>
    </div>
  );
}
