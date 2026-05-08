import { Link, useLocation } from "@tanstack/react-router";
import { BookMarked, Home, MessageCircle, User } from "lucide-react";

const items = [
  { to: "/concierge",          label: "Home",     icon: Home,        match: (p: string) => p === "/concierge" || p === "/concierge/" },
  { to: "/concierge/chat",     label: "Chat",     icon: MessageCircle, match: (p: string) => p.startsWith("/concierge/chat") },
  { to: "/concierge/passport", label: "Passport", icon: BookMarked,  match: (p: string) => p.startsWith("/concierge/passport") },
  { to: "/concierge/profile",  label: "You",      icon: User,        match: (p: string) => p.startsWith("/concierge/profile") },
] as const;

export function BottomNav() {
  const { pathname } = useLocation();
  return (
    <nav className="border-b border-border bg-card/80 backdrop-blur-xl lg:sticky lg:top-20 lg:rounded-3xl lg:border lg:shadow-card">
      <div className="mx-auto flex max-w-7xl items-stretch justify-around gap-2 px-4 py-3 lg:mx-0 lg:max-w-none lg:flex-col lg:items-stretch lg:p-3">
        {items.map(({ to, label, icon: Icon, match }) => {
          const active = match(pathname);
          return (
            <Link
              key={to}
              to={to}
              className={`flex flex-1 items-center justify-center gap-2 rounded-2xl px-3 py-3 text-xs font-semibold transition-pop lg:justify-start lg:text-sm ${
                active ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted/70 hover:text-foreground"
              }`}
            >
              <span
                className={`grid h-9 w-9 shrink-0 place-items-center rounded-full transition-pop ${
                  active ? "bg-gradient-vibe text-primary-foreground shadow-pop" : "text-muted-foreground"
                }`}
              >
                <Icon className="h-4 w-4" />
              </span>
              <span>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
