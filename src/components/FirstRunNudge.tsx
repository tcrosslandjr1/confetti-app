import { useEffect, useState } from "react";
import { useRouterState } from "@tanstack/react-router";
import { ArrowUpRight, X } from "lucide-react";
import { useWizard } from "@/components/wizard/wizard-context";

const KEY = "confetti.first-run-nudge.dismissed";

/**
 * One-line dismissible bar that sits just above the mobile TabBar on the home
 * route, telling first-time visitors what to tap. Hidden on desktop, hidden
 * after dismiss or after the wizard has been opened once.
 */
export function FirstRunNudge() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { open: wizardOpen, openWizard } = useWizard();
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (localStorage.getItem(KEY) === "1") return;
    // Only show on the marketing landing
    if (pathname !== "/") return;
    const t = window.setTimeout(() => setShow(true), 700);
    return () => window.clearTimeout(t);
  }, [pathname]);

  // If the wizard opens, treat that as "they got it" and dismiss for good.
  useEffect(() => {
    if (wizardOpen && show) {
      localStorage.setItem(KEY, "1");
      setShow(false);
    }
  }, [wizardOpen, show]);

  if (!show || pathname !== "/") return null;

  const dismiss = () => {
    localStorage.setItem(KEY, "1");
    setShow(false);
  };

  return (
    <div
      role="region"
      aria-label="New visitor tip"
      className="fixed inset-x-0 bottom-[calc(env(safe-area-inset-bottom)+7rem)] z-40 mx-auto flex max-w-2xl items-center gap-2 px-3 lg:hidden"
    >
      <div className="flex w-full items-center gap-2 rounded-full border-2 border-ink bg-gold/95 pl-4 pr-2 py-1.5 text-ink shadow-brut backdrop-blur">
        <span className="font-mono text-[11px] font-bold uppercase tracking-widest">New here?</span>
        <button
          type="button"
          onClick={() => openWizard()}
          className="ml-1 inline-flex flex-1 items-center justify-center gap-1 rounded-full bg-ink px-3 py-1.5 font-mono text-[11px] font-bold uppercase tracking-widest text-cream"
        >
          Plan my night <ArrowUpRight className="h-3 w-3" />
        </button>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss"
          className="grid h-8 w-8 place-items-center rounded-full border-2 border-ink bg-cream"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
