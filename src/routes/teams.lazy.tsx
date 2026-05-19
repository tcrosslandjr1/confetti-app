import { createLazyFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createLazyFileRoute("/teams")({
  component: TeamsLayout,
});

function TeamsLayout() {
    return <Outlet />;
}
