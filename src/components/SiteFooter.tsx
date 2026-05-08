import { Link } from "@tanstack/react-router";

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
    title: "Vibes",
    items: [
      { to: "/", label: "Date night" },
      { to: "/", label: "Family time" },
      { to: "/", label: "Girls' night" },
      { to: "/", label: "Meet the in-laws" },
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
    <footer className="bg-ink text-cream">
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="grid gap-12 md:grid-cols-4">
          <div>
            <Link to="/" className="flex items-baseline gap-1">
              <span className="font-display text-3xl font-extrabold tracking-tight">confetti</span>
              <span className="font-serif text-3xl italic text-coral">.</span>
            </Link>
            <p className="mt-4 max-w-xs font-serif text-lg italic leading-snug">
              The loud, opinionated planner for outings worth showing up for.
            </p>
          </div>
          {cols.map((col) => (
            <div key={col.title}>
              <h5 className="font-mono text-[11px] font-bold uppercase tracking-[0.25em] text-cream/50">
                / {col.title}
              </h5>
              <ul className="mt-4 space-y-3 font-display text-lg font-bold">
                {col.items.map((i) => (
                  <li key={i.label}>
                    <Link to={i.to} className="hover:text-coral">
                      {i.label} <span className="text-cream/30">↗</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-16 border-t-2 border-cream/15 pt-6">
          <h2 className="font-display text-[18vw] font-extrabold leading-none tracking-tighter sm:text-[160px]">
            confetti<span className="text-coral">.</span>
          </h2>
        </div>

        <div className="mt-6 flex flex-col items-start justify-between gap-3 font-mono text-[11px] uppercase tracking-widest text-cream/50 sm:flex-row sm:items-center">
          <p>© {new Date().getFullYear()} Confetti — plans with a pulse.</p>
          <p>made loud, on purpose.</p>
        </div>
      </div>
    </footer>
  );
}
