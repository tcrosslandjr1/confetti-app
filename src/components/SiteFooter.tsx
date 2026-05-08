import { Link } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";

const cols = [
  {
    title: "Product",
    items: [
      { to: "/features", label: "Features" },
      { to: "/how-it-works", label: "How it works" },
      { to: "/pricing", label: "Pricing" },
      { to: "/plan", label: "Launch app" },
    ],
  },
  {
    title: "Use cases",
    items: [
      { to: "/", label: "Date night" },
      { to: "/", label: "Family time" },
      { to: "/", label: "Girls' night" },
      { to: "/", label: "Meeting the in-laws" },
    ],
  },
  {
    title: "Company",
    items: [
      { to: "/about", label: "About" },
      { to: "/contact", label: "Contact" },
      { to: "/auth", label: "Sign in" },
    ],
  },
] as const;

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-border bg-card">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-4">
          <div>
            <Link to="/" className="flex items-center gap-2">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-vibe shadow-pop">
                <Sparkles className="h-5 w-5 text-primary-foreground" />
              </span>
              <span className="font-display text-xl font-bold tracking-tight">
                confetti<span className="text-gradient">.</span>
              </span>
            </Link>
            <p className="mt-4 max-w-xs text-sm text-muted-foreground">
              The bright, joyful way to plan outings worth showing up for — for every vibe and every crew.
            </p>
          </div>
          {cols.map((col) => (
            <div key={col.title}>
              <h5 className="text-sm font-semibold">{col.title}</h5>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                {col.items.map((i) => (
                  <li key={i.label}>
                    <Link to={i.to} className="hover:text-foreground">
                      {i.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 flex flex-col items-start justify-between gap-3 border-t border-border pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center">
          <p>© {new Date().getFullYear()} Confetti. Plan outings worth showing up for.</p>
          <p>Made with confetti in mind.</p>
        </div>
      </div>
    </footer>
  );
}
