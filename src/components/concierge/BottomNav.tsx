import { Link, useLocation } from "@tanstack/react-router";
import { Home, MessageCircle, BookMarked, User } from "lucide-react";

const items = [
  { to: "/concierge",          label: "Home",     icon: Home,        match: (p: string) => p === "/concierge" || p === "/concierge/" },
  { to: "/concierge/chat",     label: "Chat",     icon: MessageCircle, match: (p: string) => p.startsWith("/concierge/chat") },
  { to: "/concierge/passport", label: "Passport", icon: BookMarked,  match: (p: string) => p.startsWith("/concierge/passport") },
  { to: "/concierge/profile",  label: "You",      icon: User,        match: (p: string) => p.startsWith("/concierge/profile") },
] as const;

export function BottomNav() {
  const { pathname } = useLocation();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 safe-bottom border-t border-border glass">
      <div className="mx-auto flex max-w-md items-stretch justify-around px-2 pt-2">
        {items.map(({ to, label, icon: Icon, match }) => {
          const active = match(pathname);
          return (
            <Link
              key={to}
              to={to}
              className="flex flex-1 flex-col items-center gap-1 rounded-xl px-2 py-2 text-[11px] font-medium transition-pop"
            >
              <span
                className={`grid h-9 w-9 place-items-center rounded-full transition-pop ${
                  active ? "bg-gradient-vibe text-primary-foreground shadow-pop" : "text-muted-foreground"
                }`}
              >
                <Icon className="h-4 w-4" />
              </span>
              <span className={active ? "text-foreground" : "text-muted-foreground"}>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
