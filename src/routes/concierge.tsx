import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { BottomNav } from "@/components/concierge/BottomNav";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

export const Route = createFileRoute("/concierge")({
  component: ConciergeLayout,
});

function ConciergeLayout() {
  const { user, loading, viewAs } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    if (!user) { navigate({ to: "/auth" }); return; }
    // Concierge chat / passport are customer surfaces. Keep admins/business in
    // their own contexts so an admin doesn't inadvertently message the AI as
    // themselves while testing customer flows.
    if (viewAs === "admin") { navigate({ to: "/admin" }); return; }
    if (viewAs === "business") { navigate({ to: "/advertise/portal" }); return; }
    if (viewAs === "visitor") { navigate({ to: "/" }); return; }
  }, [user, loading, viewAs, navigate]);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[260px_minmax(0,1fr)] lg:px-8 lg:py-12">
        <aside>
          <BottomNav />
        </aside>
        <main className="min-w-0">
          <Outlet />
        </main>
      </div>
      <SiteFooter />
    </div>
  );
}
