import "./styles.css";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "@tanstack/react-router";
import {
  clearStalePageRecovery,
  recoverStalePage,
} from "@/lib/stale-page-recovery";

const rootEl = document.getElementById("root");
if (!rootEl) throw new Error("Root element #root not found");

function BootFallback() {
  const isAdmin = window.location.pathname.startsWith("/admin");
  return (
    <div className="grid min-h-screen place-items-center overflow-hidden bg-cream px-4 text-ink">
      <div className="pointer-events-none absolute -left-32 -top-32 h-[34rem] w-[34rem] rounded-full bg-coral/35 blur-3xl" />
      <div className="pointer-events-none absolute -right-28 bottom-0 h-[30rem] w-[30rem] rounded-full bg-gold/35 blur-3xl" />
      <div className="relative w-full max-w-md rounded-[1.35rem] border-2 border-ink bg-cream/65 p-7 text-center shadow-brut-lg backdrop-blur-2xl">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-full border-2 border-ink bg-coral text-cream shadow-brut">
          {isAdmin ? "⚙" : "C"}
        </div>
        <div>
          <h1 className="mt-4 font-display text-2xl font-extrabold tracking-tight text-ink">
            {isAdmin ? "Loading Admin Console" : "Loading Confetti"}
          </h1>
          <p className="mt-2 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-ink/70">
            {isAdmin ? "Preparing command center" : "AI agents are sequencing your city"}
          </p>
        </div>
        <div className="mt-5 space-y-2 border-y border-dashed border-ink/25 py-4 text-left font-mono text-[11px] text-ink/75">
          {[
            "Reading live venue signals",
            "Checking visitor/admin route",
            "Warming the planner agents",
          ].map((line) => (
            <div key={line} className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-coral animate-pulse" />
              {line}
            </div>
          ))}
        </div>
        <div className="mt-5 h-2 overflow-hidden rounded-full border border-ink/20 bg-cream">
          <div className="h-full w-2/3 animate-pulse rounded-full bg-coral" />
        </div>
      </div>
    </div>
  );
}

const root = createRoot(rootEl);

root.render(
  <StrictMode>
    <BootFallback />
  </StrictMode>,
);

// Stale Vite module graphs (after a dev-server restart) cause
// "Failed to fetch dynamically imported module" on the very next navigation.
// Auto-recover once by forcing a fresh load before showing the fallback UI.
const STALE_ERROR_EVENTS = ["error", "unhandledrejection"] as const;

for (const eventName of STALE_ERROR_EVENTS) {
  window.addEventListener(eventName, (event) => {
    const error =
      eventName === "unhandledrejection"
        ? (event as PromiseRejectionEvent).reason
        : (event as ErrorEvent).error || (event as ErrorEvent).message;
    if (!recoverStalePage(error)) return;
    event.preventDefault();
  });
}

function renderErrorFallback() {
  root.render(
    <StrictMode>
      <div className="grid min-h-screen place-items-center bg-background px-4 text-center text-foreground">
        <div className="max-w-md space-y-3">
          <h1 className="text-xl font-semibold">This page didn't load</h1>
          <p className="text-sm text-muted-foreground">Refresh the preview to try again.</p>
          <button
            type="button"
            onClick={() => {
              clearStalePageRecovery();
              window.location.reload();
            }}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            Reload
          </button>
        </div>
      </div>
    </StrictMode>,
  );
}

void import("./router")
  .then(({ getRouter }) => {
    clearStalePageRecovery();
    window.dispatchEvent(new CustomEvent("confetti:app-booted"));
    const router = getRouter();
    root.render(
      <StrictMode>
        <RouterProvider router={router} />
      </StrictMode>,
    );
  })
  .catch((error) => {
    console.error("[bootstrap] Failed to load router", error);
    if (recoverStalePage(error)) {
      return;
    }
    renderErrorFallback();
  });
