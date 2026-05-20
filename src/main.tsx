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
    <div className="grid min-h-screen place-items-center bg-background px-4 text-foreground">
      <div className="w-full max-w-md space-y-4 text-center">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-xl border-2 border-ink bg-coral text-cream shadow-brut">
          {isAdmin ? "⚙" : "C"}
        </div>
        <div>
          <h1 className="font-display text-xl font-extrabold tracking-tight text-ink">
            {isAdmin ? "Loading Admin Console" : "Loading Confetti"}
          </h1>
          <p className="mt-1 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-ink/55">
            {isAdmin ? "Preparing command center" : "Curating your city"}
          </p>
        </div>
        <div className="mx-auto h-2 w-44 overflow-hidden rounded-full border border-ink/20 bg-cream">
          <div className="h-full w-1/2 animate-pulse rounded-full bg-coral" />
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
              try {
                sessionStorage.removeItem(STALE_RELOAD_KEY);
              } catch {
                /* ignore */
              }
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
    try {
      sessionStorage.removeItem(STALE_RELOAD_KEY);
    } catch {
      /* ignore */
    }
    const router = getRouter();
    root.render(
      <StrictMode>
        <RouterProvider router={router} />
      </StrictMode>,
    );
  })
  .catch((error) => {
    console.error("[bootstrap] Failed to load router", error);
    if (isStaleModuleError(error)) {
      if (reloadOnceForStaleModule()) {
        return;
      }
    }
    renderErrorFallback();
  });
