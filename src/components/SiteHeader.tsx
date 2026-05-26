import { Link, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Menu, X, Sparkles, LogOut, UserPlus } from "lucide-react";
import { WizardButton } from "@/components/wizard/WizardButton";
import { NotificationsBell } from "@/components/NotificationsBell";
import { CitySelector } from "@/components/CitySelector";
import { useAuth } from "@/lib/auth-context";
import { useScrolled } from "@/hooks/useScrolled";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const TAGLINES = [
  "your city, ON CONFETTI",
  "tonight, sorted",
  "plans that actually happen",
  "from craving → calendar",
  "your night, on autopilot",
] as const;

function RotatingTagline({ className = "" }: { className?: string }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => setI((n) => (n + 1) % TAGLINES.length), 3200);
    return () => window.clearInterval(id);
  }, []);
  return (
    <span
      className={`hidden h-8 shrink-0 items-center gap-2 border-2 border-ink bg-white px-3 shadow-brut min-[1600px]:inline-flex ${className}`}
    >
      <span className="relative inline-flex h-2 w-2">
        <span className="absolute inset-0 animate-ping rounded-full bg-coral/70" />
        <span className="relative inline-block h-2 w-2 rounded-full bg-coral" />
      </span>
      <span className="relative inline-block h-[1em] overflow-hidden">
        <span
          key={i}
          className="block animate-tagline-in whitespace-nowrap font-mono text-[11px] font-bold uppercase leading-none tracking-widest text-cream"
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
  { to: "/about", label: "About" },
  { to: "/app/explore", label: "Explore" },
  { to: "/events", label: "Events" },
  { to: "/for-business", label: "For Business" },
] as const;

export function SiteHeader() {
  const { viewAs, signOut, user } = useAuth();
  const router = useRouter();
  const showPortal = viewAs === "customer" || viewAs === "admin";
  const showAdmin = viewAs === "admin";
  const isVisitor = viewAs === "visitor" || !user;
  const scrolled = useScrolled(8);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Eagerly preload /auth for visitors so the "Sign up free" click is instant
  // instead of waiting on a lazy chunk fetch (which feels like a "reflash").
  useEffect(() => {
    if (!isVisitor) return;
    const idle =
      (window as unknown as { requestIdleCallback?: (cb: () => void) => number })
        .requestIdleCallback ?? ((cb: () => void) => window.setTimeout(cb, 200));
    idle(() => {
      void router.preloadRoute({ to: "/auth" });
    });
  }, [isVisitor, router]);


  return (
    <header
      data-scrolled={scrolled || undefined}
      className="sticky top-0 z-40 border-b-2 border-ink bg-cream transition-shadow duration-200 data-[scrolled]:shadow-brut"
    >
      <div className="mx-auto flex h-14 w-full max-w-[1600px] items-center gap-3 px-3 sm:h-16 sm:gap-4 sm:px-6 lg:gap-4 lg:px-8">
        <Link
          to="/"
          className="group flex shrink-0 items-center gap-[2px]"
          aria-label="confetti — home"
        >
          <span className="font-display text-xl font-extrabold leading-none tracking-tight text-cream sm:text-2xl">
            confetti
          </span>
          <span className="font-serif text-xl italic leading-none text-coral sm:text-2xl">.</span>
        </Link>
        <RotatingTagline />

        <nav className="ml-2 hidden items-center gap-0.5 md:flex lg:ml-4 lg:gap-1">
          {marketingLinks.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="nav-underline whitespace-nowrap rounded-full px-2 py-2 font-mono text-[11px] font-bold uppercase tracking-widest text-cream/70 transition-colors hover:text-cream lg:px-3 lg:text-xs"
              activeProps={{ className: "text-cream" }}
            >
              {l.label}
            </Link>
          ))}
          {showPortal && (
            <Link
              to="/app/profile"
              className="nav-underline whitespace-nowrap rounded-full px-2 py-2 font-mono text-[11px] font-bold uppercase tracking-widest text-cream/70 transition-colors hover:text-cream lg:px-3 lg:text-xs"
              activeProps={{ className: "text-cream" }}
            >
              Profile
            </Link>
          )}
          {showAdmin && (
            <Link
              to="/business/dashboard"
              className="nav-underline whitespace-nowrap rounded-full px-2 py-2 font-mono text-[11px] font-bold uppercase tracking-widest text-coral hover:text-cream lg:px-3 lg:text-xs"
              activeProps={{ className: "text-cream" }}
            >
              Business
            </Link>
          )}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <CitySelector compact className="hidden min-[1400px]:block" />
          {isVisitor ? (
            <>
              <Link
                to="/auth"
                search={{ mode: "signin" } as never}
                preload="render"
                className="hidden h-10 items-center whitespace-nowrap rounded-full px-3 font-mono text-xs font-bold uppercase tracking-widest text-cream/75 transition-colors hover:text-cream sm:inline-flex"
              >
                Log in
              </Link>
              <Link
                to="/auth"
                preload="render"
                className="hidden h-10 items-center whitespace-nowrap rounded-full border-2 border-ink bg-cream px-4 font-mono text-xs font-bold uppercase tracking-widest text-cream shadow-brut transition-pop hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-brut-lg min-[1100px]:inline-flex"
              >
                Sign up free
              </Link>
            </>


          ) : (
            <>
              <NotificationsBell />
              <button
                onClick={() => void signOut()}
                className="hidden h-10 items-center whitespace-nowrap px-4 font-mono text-xs font-bold uppercase tracking-widest text-cream/70 transition-colors hover:text-cream sm:flex"
              >
                Sign out
              </button>
            </>
          )}
          <WizardButton
            ariaLabel="Build a night"
            className="hidden h-10 items-center gap-1 whitespace-nowrap rounded-full border-2 border-ink bg-ink px-4 font-mono text-xs font-bold uppercase tracking-widest text-cream shadow-brut transition-pop hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-brut-lg sm:inline-flex"
          >
            Build a night ↗
          </WizardButton>

          {/* Mobile: compact wizard FAB + hamburger */}
          <WizardButton
            ariaLabel="Build a night"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border-2 border-ink bg-ink text-cream shadow-brut transition-pop active:translate-x-0.5 active:translate-y-0.5 active:shadow-none sm:hidden"
          >
            <Sparkles className="h-4 w-4" />
          </WizardButton>

          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <button
                aria-label="Open menu"
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border-2 border-ink bg-cream text-cream shadow-brut transition-pop active:translate-x-0.5 active:translate-y-0.5 active:shadow-none md:hidden"
              >
                <Menu className="h-4 w-4" />
              </button>
            </SheetTrigger>
            <SheetContent
              side="right"
              className="w-[88%] max-w-sm border-l-2 border-ink bg-cream p-0 [&>button]:hidden"
            >
              <MobileMenu
                close={() => setMobileOpen(false)}
                isVisitor={isVisitor}
                showPortal={showPortal}
                showAdmin={showAdmin}
                signOut={() => void signOut()}
              />
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}

function MobileMenu({
  close,
  isVisitor,
  showPortal,
  showAdmin,
  signOut,
}: {
  close: () => void;
  isVisitor: boolean;
  showPortal: boolean;
  showAdmin: boolean;
  signOut: () => void;
}) {
  return (
    <div className="flex h-full flex-col">
      {/* Header strip */}
      <div className="flex items-center justify-between border-b-2 border-ink bg-cream px-4 py-3">
        <Link
          to="/"
          onClick={close}
          className="flex items-center gap-[2px]"
          aria-label="confetti — home"
        >
          <span className="font-display text-xl font-extrabold leading-none tracking-tight text-cream">
            confetti
          </span>
          <span className="font-serif text-xl italic leading-none text-coral">.</span>
        </Link>
        <button
          aria-label="Close menu"
          onClick={close}
          className="inline-flex h-9 w-9 items-center justify-center rounded-full border-2 border-ink bg-white text-cream shadow-brut transition-pop active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* City picker */}
      <div className="border-b-2 border-ink bg-white/60 px-4 py-3">
        <div className="mb-2 font-mono text-[10px] font-bold uppercase tracking-widest text-cream/50">
          City
        </div>
        <CitySelector />
      </div>

      {/* Nav links */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <div className="mb-2 px-2 font-mono text-[10px] font-bold uppercase tracking-widest text-cream/50">
          Explore
        </div>
        <ul className="space-y-1">
          {marketingLinks.map((l) => (
            <li key={l.to}>
              <Link
                to={l.to}
                onClick={close}
                className="flex items-center justify-between rounded-2xl border-2 border-transparent px-3 py-3 font-display text-lg font-bold text-cream transition-colors hover:border-ink hover:bg-white"
                activeProps={{ className: "border-ink bg-white" }}
              >
                <span>{l.label}</span>
                <span className="font-mono text-xs text-coral">↗</span>
              </Link>
            </li>
          ))}
          {showPortal && (
            <li>
              <Link
                to="/app/profile"
                onClick={close}
                className="flex items-center justify-between rounded-2xl border-2 border-transparent px-3 py-3 font-display text-lg font-bold text-cream transition-colors hover:border-ink hover:bg-white"
                activeProps={{ className: "border-ink bg-white" }}
              >
                <span>Profile</span>
                <span className="font-mono text-xs text-coral">↗</span>
              </Link>
            </li>
          )}
          {showAdmin && (
            <li>
              <Link
                to="/business/dashboard"
                onClick={close}
                className="flex items-center justify-between rounded-2xl border-2 border-transparent px-3 py-3 font-display text-lg font-bold text-coral transition-colors hover:border-ink hover:bg-white"
                activeProps={{ className: "border-ink bg-white" }}
              >
                <span>Business</span>
                <span className="font-mono text-xs text-coral">↗</span>
              </Link>
            </li>
          )}
        </ul>
      </nav>

      {/* Footer actions */}
      <div className="space-y-2 border-t-2 border-ink bg-white/60 p-4">
        <WizardButton
          ariaLabel="Build a night"
          className="flex h-12 w-full items-center justify-center gap-2 rounded-full border-2 border-ink bg-ink font-mono text-xs font-bold uppercase tracking-widest text-cream shadow-brut transition-pop active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
        >
          <Sparkles className="h-4 w-4" />
          Build a night
        </WizardButton>
        {isVisitor ? (
          <div className="grid grid-cols-2 gap-2">
            <Link
              to="/auth"
              search={{ mode: "signin" } as never}
              onClick={close}
              className="flex h-12 items-center justify-center gap-2 rounded-full border-2 border-ink bg-white font-mono text-xs font-bold uppercase tracking-widest text-cream shadow-brut transition-pop active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
            >
              Log in
            </Link>
            <Link
              to="/auth"
              onClick={close}
              className="flex h-12 items-center justify-center gap-2 rounded-full border-2 border-ink bg-coral font-mono text-xs font-bold uppercase tracking-widest text-cream shadow-brut transition-pop active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
            >
              <UserPlus className="h-4 w-4" />
              Sign up
            </Link>
          </div>

        ) : (
          <button
            onClick={() => {
              close();
              signOut();
            }}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-full border-2 border-ink bg-cream font-mono text-xs font-bold uppercase tracking-widest text-cream/70 shadow-brut transition-pop active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        )}
      </div>
    </div>
  );
}
