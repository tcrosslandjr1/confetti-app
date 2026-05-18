import { createFileRoute, Link, Outlet, redirect } from "@tanstack/react-router";
import { Sparkles, User, Briefcase, Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/promoter")({
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) throw redirect({ to: "/auth", search: { redirect: "/promoter" } as any });
  },
  component: PromoterLayout,
  head: () => ({
    meta: [
      { title: "Promoter Portal — Confetti" },
      {
        name: "description",
        content: "Manage your Confetti promoter profile, jobs, and earnings.",
      },
    ],
  }),
});

function PromoterLayout() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50/40 via-background to-background">
      <header className="border-b border-border/60 bg-background/80 backdrop-blur sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-2 sm:gap-6">
          <Link to="/" className="flex items-center gap-2 font-bold">
            <Sparkles className="h-5 w-5 text-primary" />
            <span>Confetti Promoters</span>
          </Link>
          <nav className="ml-auto flex items-center gap-1 text-sm">
            <NavTab to="/promoter" icon={<User className="h-4 w-4" />} label="Profile" />
            <NavTab to="/promoter/jobs" icon={<Briefcase className="h-4 w-4" />} label="Jobs" />
          </nav>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}

function NavTab({ to, icon, label }: { to: string; icon: React.ReactNode; label: string }) {
  return (
    <Link
      to={to}
      activeOptions={{ exact: to === "/promoter" }}
      className={cn("px-3 py-2 rounded-md hover:bg-muted/60 inline-flex items-center gap-2")}
      activeProps={{ className: "bg-primary/10 text-primary font-medium" }}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </Link>
  );
}
