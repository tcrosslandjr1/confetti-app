import { Link } from "@tanstack/react-router";
import { Search, Sparkles } from "lucide-react";

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
          <Link to="/" className="rounded-full px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground" activeProps={{ className: "bg-muted text-foreground" }}>Occasions</Link>
          <Link to="/plan" className="rounded-full px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground" activeProps={{ className: "bg-muted text-foreground" }}>Plan a day</Link>
          <Link to="/trips" className="rounded-full px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground" activeProps={{ className: "bg-muted text-foreground" }}>My trips</Link>
          <Link to="/reservations" className="rounded-full px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground" activeProps={{ className: "bg-muted text-foreground" }}>Reservations</Link>
          <Link to="/me" className="rounded-full px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground" activeProps={{ className: "bg-muted text-foreground" }}>My vibe</Link>
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <Link
            to="/events"
            className="hidden h-10 items-center gap-2 rounded-full border border-border bg-card px-4 text-sm text-muted-foreground transition-colors hover:bg-muted sm:flex"
          >
            <Search className="h-4 w-4" />
            Search events
          </Link>
          <button className="h-10 rounded-full px-4 text-sm font-semibold text-foreground transition-colors hover:bg-muted">
            Sign in
          </button>
          <button className="h-10 rounded-full bg-foreground px-4 text-sm font-semibold text-background transition-pop hover:scale-105">
            Create event
          </button>
        </div>
      </div>
    </header>
  );
}
