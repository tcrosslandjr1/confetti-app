import { lazy, Suspense, useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";

import appCss from "../styles.css?url";
import { AuthProvider } from "@/lib/auth-context";
import { Toaster } from "@/components/ui/sonner";
import { WizardProvider } from "@/components/wizard/wizard-context";
import { ScrollProgress } from "@/components/ScrollProgress";
import { ReferralCapture } from "@/components/ReferralCapture";
import { TabBar } from "@/components/loop/TabBar";
import { PageTransition } from "@/components/PageTransition";
import { FirstRunNudge } from "@/components/FirstRunNudge";
import { MapProvider } from "@/components/maps/MapProvider";
import { preloadFallbackImages } from "@/lib/venue-images";
import { installErrorTracking } from "@/lib/analytics";

const RoleSwitcher = lazy(() =>
  import("@/components/RoleSwitcher").then((m) => ({ default: m.RoleSwitcher })),
);
const BuildMyNightWizard = lazy(() =>
  import("@/components/wizard/BuildMyNightWizard").then((m) => ({
    default: m.BuildMyNightWizard,
  })),
);
const CookieConsent = lazy(() =>
  import("@/components/CookieConsent").then((m) => ({ default: m.CookieConsent })),
);
const AuthDebugPanel = lazy(() =>
  import("@/components/AuthDebugPanel").then((m) => ({ default: m.AuthDebugPanel })),
);

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Confetti — Your city, curated" },
      {
        name: "description",
        content:
          "Confetti curates city experiences, dining, and nightlife into ready-to-go itineraries.",
      },
      { name: "author", content: "Confetti" },
      { name: "google-site-verification", content: "XuzGdwGoSQmvZUIj00FgrpomT5sanm4p2tShMpKsJ0o" },
      { name: "theme-color", content: "#F05537" },
      { property: "og:title", content: "Confetti — Your city, curated" },
      {
        property: "og:description",
        content: "Curated city experiences and itineraries, ready in seconds.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:site", content: "@Lovable" },
      { name: "twitter:title", content: "Confetti — Your city, curated" },
      {
        name: "twitter:description",
        content: "Curated city experiences and itineraries, ready in seconds.",
      },
      {
        property: "og:image",
        content:
          "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/61ece84c-a024-4a69-a7ce-019c9d1e13a6/id-preview-d6f23aef--f4bae350-0f3c-459c-a8b3-17702408f503.lovable.app-1778344807777.png",
      },
      {
        name: "twitter:image",
        content:
          "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/61ece84c-a024-4a69-a7ce-019c9d1e13a6/id-preview-d6f23aef--f4bae350-0f3c-459c-a8b3-17702408f503.lovable.app-1778344807777.png",
      },
      { property: "og:site_name", content: "Confetti" },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "Organization",
              name: "Confetti",
              url: "https://confettiplan.lovable.app",
              logo: "https://confettiplan.lovable.app/favicon.ico",
              description:
                "Confetti curates city experiences, dining, and nightlife into ready-to-go itineraries.",
            },
            {
              "@type": "WebSite",
              name: "Confetti",
              url: "https://confettiplan.lovable.app",
              potentialAction: {
                "@type": "SearchAction",
                target: "https://confettiplan.lovable.app/discover?q={search_term_string}",
                "query-input": "required name=search_term_string",
              },
            },
          ],
        }),
      },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "preload",
        href: "https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&display=optional",
        as: "style",
      },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&display=optional",
      },
      {
        rel: "preload",
        href: "https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400;12..96,600;12..96,700;12..96,800&family=Inter:wght@400;500;600;700&display=swap",
        as: "style",
        fetchpriority: "high",
      },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400;12..96,600;12..96,700;12..96,800&family=Inter:wght@400;500;600;700&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600&display=swap"
          media="print"
          // eslint-disable-next-line react/no-unknown-property
          // @ts-expect-error – browser swaps media to load async
          onLoad="this.media='all'"
        />
        <noscript>
          <link
            rel="stylesheet"
            href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600&display=swap"
          />
        </noscript>
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  // Warm the HTTP cache for Unsplash venue-card fallbacks so the first
  // render swaps in instantly without flicker or layout shift.
  useEffect(() => {
    preloadFallbackImages();
    installErrorTracking();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <MapProvider>
          <WizardProvider>
            <ScrollProgress />
            <ReferralCapture />
            <Suspense fallback={null}>
              <RoleSwitcher />
            </Suspense>
            <PageTransition>
              <Outlet />
            </PageTransition>
            {/* Spacer so fixed mobile TabBar doesn't cover page content */}
            <div aria-hidden className="h-24 lg:hidden" />
            <Suspense fallback={null}>
              <BuildMyNightWizard />
            </Suspense>
            <TabBar />
            <FirstRunNudge />
            <Suspense fallback={null}>
              <CookieConsent />
            </Suspense>
            <Suspense fallback={null}>
              <AuthDebugPanel />
            </Suspense>
            <Toaster />
          </WizardProvider>
        </MapProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
