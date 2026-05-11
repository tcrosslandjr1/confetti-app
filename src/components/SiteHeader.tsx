import { Link } from "@tanstack/react-router";
import { WizardButton } from "@/components/wizard/WizardButton";
import { NotificationsBell } from "@/components/NotificationsBell";
import { Oloid } from "@/components/brand/Oloid";
import { useAuth } from "@/lib/auth-context";

const marketingLinks = [
  { to: "/features", label: "Features" },
  { to: "/how-it-works", label: "How" },
  { to: "/pricing", label: "Pricing" },
  { to: "/advertise", label: "Advertise" },
  { to: "/investors", label: "Investors" },
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact" },
] as const;

export function SiteHeader() {
  const { viewAs, signOut, user } = useAuth();
  const showPortal = viewAs === "customer" || viewAs === "admin";
  const showAdmin = viewAs === "admin";
  const isVisitor = viewAs === "visitor" || !user;

  return (
    <header className="sticky top-0 z-40 border-b-2 border-ink bg-cream/85 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-6 px-4 sm:px-6 lg:px-8">
        <Link to="/" className="group flex items-center gap-[2px]" aria-label="loop — home">
          <span className="font-display text-2xl font-extrabold leading-none tracking-tight text-ink">l</span>
          <Oloid className="h-[0.95em] w-[0.95em] -mx-[1px] text-ink transition-transform duration-500 group-hover:[transform:rotate(180deg)]" />
          <Oloid className="h-[0.95em] w-[0.95em] -mx-[1px] text-ink transition-transform duration-500 group-hover:[transform:rotate(-180deg)]" style={{ transform: "rotate(60deg)" }} />
          <span className="font-display text-2xl font-extrabold leading-none tracking-tight text-ink">p</span>
          <span className="font-serif text-2xl italic leading-none text-coral">.</span>
          <span className="ml-2 hidden font-mono text-[10px] uppercase tracking-[0.25em] text-ink/60 sm:inline">
            / your city, on a loop
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
          {showPortal && (
            <Link
              to="/portal"
              className="nav-underline rounded-full px-3 py-2 font-mono text-xs font-bold uppercase tracking-widest text-ink/70 transition-colors hover:text-ink"
              activeProps={{ className: "text-ink" }}
            >
              Portal
            </Link>
          )}
          {showAdmin && (
            <Link
              to="/admin"
              className="nav-underline rounded-full px-3 py-2 font-mono text-xs font-bold uppercase tracking-widest text-coral hover:text-ink"
              activeProps={{ className: "text-ink" }}
            >
              Admin
            </Link>
          )}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          {isVisitor ? (
            <Link
              to="/auth"
              className="hidden h-10 items-center rounded-full border-2 border-ink bg-cream px-4 font-mono text-xs font-bold uppercase tracking-widest text-ink shadow-brut transition-pop hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-brut-lg sm:inline-flex"
            >
              Sign up free
            </Link>
          ) : (
            <>
              <NotificationsBell />
              <button
                onClick={() => void signOut()}
                className="hidden h-10 items-center rounded-full px-4 font-mono text-xs font-bold uppercase tracking-widest text-ink/70 transition-colors hover:text-ink sm:flex"
              >
                Sign out
              </button>
            </>
          )}
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
