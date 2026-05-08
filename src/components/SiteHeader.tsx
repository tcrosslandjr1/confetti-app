import { Link } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";

const marketingLinks = [
  { to: "/features", label: "Features" },
  { to: "/how-it-works", label: "How it works" },
  { to: "/pricing", label: "Pricing" },
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact" },
] as const;

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-6 px-4 sm:px-6 lg:px-8">
        <Link to="/" className="group flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-vibe shadow-pop transition-pop group-hover:rotate-6">
            <Sparkles className="h-5 w-5 text-primary-foreground" />
          </span>
          <span className="font-display text-xl font-bold tracking-tight">
            confetti<span className="text-gradient">.</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {marketingLinks.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="rounded-full px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              activeProps={{ className: "bg-muted text-foreground" }}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <Link
            to="/auth"
            className="hidden h-10 items-center rounded-full px-4 text-sm font-semibold text-foreground transition-colors hover:bg-muted sm:flex"
          >
            Sign in
          </Link>
          <Link
            to="/plan"
            className="inline-flex h-10 items-center rounded-full bg-foreground px-4 text-sm font-semibold text-background transition-pop hover:scale-105"
          >
            Launch app
          </Link>
        </div>
      </div>
    </header>
  );
}
