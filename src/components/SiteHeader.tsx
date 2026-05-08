import { Link } from "@tanstack/react-router";
import { WizardButton } from "@/components/wizard/WizardButton";

const marketingLinks = [
  { to: "/features", label: "Features" },
  { to: "/how-it-works", label: "How" },
  { to: "/pricing", label: "Pricing" },
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact" },
] as const;

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b-2 border-ink bg-cream/85 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-6 px-4 sm:px-6 lg:px-8">
        <Link to="/" className="group flex items-baseline gap-1">
          <span className="font-display text-2xl font-extrabold tracking-tight text-ink">
            confetti
          </span>
          <span className="font-serif text-2xl italic text-coral">.</span>
          <span className="ml-2 hidden font-mono text-[10px] uppercase tracking-[0.25em] text-ink/60 sm:inline">
            / plans w/ a pulse
          </span>
        </Link>

        <nav className="ml-4 hidden items-center gap-1 md:flex">
          {marketingLinks.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="nav-underline rounded-full px-3 py-2 font-mono text-xs font-bold uppercase tracking-widest text-ink/70 transition-colors hover:text-ink"
              activeProps={{ className: "text-ink" }}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <Link
            to="/auth"
            className="hidden h-10 items-center rounded-full px-4 font-mono text-xs font-bold uppercase tracking-widest text-ink/70 transition-colors hover:text-ink sm:flex"
          >
            Sign in
          </Link>
          <WizardButton
            ariaLabel="Build a night"
            className="animate-wiggle-attention inline-flex h-10 items-center gap-1 rounded-full border-2 border-ink bg-ink px-4 font-mono text-xs font-bold uppercase tracking-widest text-cream shadow-brut transition-pop hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-brut-lg"
          >
            Build a night ↗
          </WizardButton>
        </div>
      </div>
    </header>
  );
}
