import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

export const getRouter = () => {
  const queryClient = new QueryClient();

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreload: "intent",
    defaultPreloadStaleTime: 0,
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
