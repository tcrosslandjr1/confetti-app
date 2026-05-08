import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { BottomNav } from "@/components/concierge/BottomNav";

export const Route = createFileRoute("/concierge")({
  component: ConciergeLayout,
});

function ConciergeLayout() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [user, loading, navigate]);

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-md pb-28">
        <Outlet />
      </div>
      <BottomNav />
    </div>
  );
}
