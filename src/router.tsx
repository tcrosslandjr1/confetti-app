import { QueryClient } from "@tanstack/react-query";
import { Link, createRouter, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { retryChunkLoad } from "@/lib/chunk-retry";
import {
  clearStalePageRecovery,
  isStaleModuleError,
  recoverStalePage,
} from "@/lib/stale-page-recovery";
import { routeTree } from "./routeTree.gen";

function DefaultRouterError({ error, reset }: { error: Error; reset: () => void }) {
  const router = useRouter();
  const stale = isStaleModuleError(error);
  const [phase, setPhase] = useState<"retrying" | "failed">(stale ? "retrying" : "failed");
  const [attempt, setAttempt] = useState(0);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    let cancelled = false;
    if (!stale) return;

    (async () => {
      const outcome = await retryChunkLoad(error, (a, t) => {
        if (cancelled) return;
        setAttempt(a);
        setTotal(t);
      });
      if (cancelled) return;
      if (outcome === "recovered") {
        // Chunk is back — re-run loaders + clear the boundary.
        router.invalidate();
        reset();
        return;
      }
      // Last-ditch full reload (once per session) before showing the UI.
      if (recoverStalePage(error)) return;
      setPhase("failed");
    })();

    return () => {
      cancelled = true;
    };
  }, [error, reset, router, stale]);

  if (phase === "retrying") {
    return (
      <div className="grid min-h-screen place-items-center bg-background px-4 text-center text-foreground">
        <div className="max-w-md space-y-3">
          <div
            aria-hidden
            className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-muted border-t-primary"
          />
          <p className="text-sm text-muted-foreground">
            Reconnecting{total ? ` (${attempt}/${total})` : ""}…
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid min-h-screen place-items-center bg-background px-4 text-center text-foreground">
      <div className="max-w-md space-y-4">
        <div>
          <h1 className="text-xl font-semibold">This page didn't load</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Refresh the route or return home to keep exploring Confetti.
          </p>
          {error?.message ? (
            <p className="mt-3 break-words font-mono text-xs text-muted-foreground">
              {error.message}
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          <button
            type="button"
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            Try again
          </button>
          <button
            type="button"
            onClick={() => {
              clearStalePageRecovery();
              const url = new URL(window.location.href);
              url.searchParams.set("_r", Date.now().toString(36));
              window.location.replace(url.toString());
            }}
            className="rounded-md border border-border bg-background px-4 py-2 text-sm font-medium text-foreground"
          >
            Clear and reload
          </button>
          <Link
            to="/"
            className="rounded-md border border-border bg-background px-4 py-2 text-sm font-medium text-foreground"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}


function DefaultNotFound() {
  return (
    <div className="grid min-h-screen place-items-center bg-background px-4 text-center text-foreground">
      <div className="max-w-md space-y-4">
        <div>
          <h1 className="text-7xl font-bold">404</h1>
          <p className="mt-2 text-sm text-muted-foreground">That Confetti page is not available.</p>
        </div>
        <Link
          to="/"
          className="inline-flex rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          Go home
        </Link>
      </div>
    </div>
  );
}

export const getRouter = () => {
  const queryClient = new QueryClient();

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreload: "intent",
    defaultPreloadStaleTime: 0,
    defaultErrorComponent: DefaultRouterError,
    defaultNotFoundComponent: DefaultNotFound,
  });

  if (typeof window !== "undefined") {
    // Surface router init context early so redirect / basename issues are obvious.
    console.info(
      "[router] init",
      JSON.stringify({
        basepath: (router.options as { basepath?: string }).basepath ?? "/",
        href: window.location.href,
        pathname: window.location.pathname,
      }),
    );
  }

  return router;
};
