import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { WizardButton } from "@/components/wizard/WizardButton";
import { NotificationsBell } from "@/components/NotificationsBell";
import { CitySelector } from "@/components/CitySelector";
import { Oloid } from "@/components/brand/Oloid";
import { useAuth } from "@/lib/auth-context";

const TAGLINES = [
  "your city, on a loop",
  "tonight, sorted",
  "plans that actually happen",
  "from craving → calendar",
  "your night, on autopilot",
] as const;

function RotatingTagline() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => setI((n) => (n + 1) % TAGLINES.length), 3200);
    return () => window.clearInterval(id);
  }, []);
  return (
    <span className="ml-3 hidden h-8 items-center gap-2 border-2 border-ink bg-white px-3 shadow-brut sm:inline-flex">
      <span className="relative inline-flex h-2 w-2">
        <span className="absolute inset-0 animate-ping rounded-full bg-coral/70" />
        <span className="relative inline-block h-2 w-2 rounded-full bg-coral" />
      </span>
      <span className="relative inline-block h-[1em] overflow-hidden">
        <span
          key={i}
          className="block animate-tagline-in whitespace-nowrap font-mono text-[11px] font-bold uppercase leading-none tracking-widest text-ink"
        >
          {TAGLINES[i].split(",")[0]}
          <span className="mx-1 text-coral/50">//</span>
          {TAGLINES[i].split(",").slice(1).join(",").trim() || "live"}
        </span>
      </span>
    </span>
  );
}

const marketingLinks = [
  { to: "/features", label: "Features" },
  { to: "/how-it-works", label: "How" },
  { to: "/teams", label: "Team Events" },
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
        <Link to="/" className="group flex items-center gap-[2px]" aria-label="confetti — home">
          <span className="font-display text-2xl font-extrabold leading-none tracking-tight text-ink">
            confetti
          </span>
          <span className="font-serif text-2xl italic leading-none text-coral">.</span>
          <RotatingTagline />
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
          <CitySelector compact className="hidden sm:block" />
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
