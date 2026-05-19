import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import {
  Activity,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  ChevronLeft,
  Database,
  Globe,
  KeyRound,
  Server,
  Cpu,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { VITE_GOOGLE_MAPS_API_KEY } from "@/lib/config";

export const Route = createFileRoute("/admin/diagnostics")({
  component: AdminDiagnostics,
});

type Status = "ok" | "warn" | "fail" | "pending";

interface Check {
  label: string;
  status: Status;
  detail?: string;
}

function StatusIcon({ status }: { status: Status }) {
  if (status === "ok") return <CheckCircle2 className="h-4 w-4 text-emerald-600" />;
  if (status === "warn") return <AlertTriangle className="h-4 w-4 text-amber-600" />;
  if (status === "fail") return <XCircle className="h-4 w-4 text-rose-600" />;
  return <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />;
}

function Row({ check }: { check: Check }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-border/60 py-3 last:border-0">
      <div className="flex items-start gap-3">
        <div className="mt-0.5">
          <StatusIcon status={check.status} />
        </div>
        <div>
          <div className="text-sm font-medium text-foreground">{check.label}</div>
          {check.detail && (
            <div className="mt-0.5 text-xs text-muted-foreground break-all">{check.detail}</div>
          )}
        </div>
      </div>
    </div>
  );
}

function Section({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof Activity;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="mb-2 flex items-center gap-2">
        <Icon className="h-4 w-4 text-primary" />
        <h2 className="text-sm font-semibold tracking-tight">{title}</h2>
      </div>
      <div>{children}</div>
    </section>
  );
}

function useSupabasePing() {
  return useQuery({
    queryKey: ["diagnostics", "supabase-ping"],
    queryFn: async (): Promise<Check> => {
      const start = performance.now();
      const { error } = await supabase
        .from("profiles")
        .select("id", { head: true, count: "exact" })
        .limit(1);
      const ms = Math.round(performance.now() - start);
      if (error) {
        return {
          label: "Database reachable",
          status: "fail",
          detail: `${error.message} (${ms}ms)`,
        };
      }
      return { label: "Database reachable", status: "ok", detail: `Round-trip ${ms}ms` };
    },
    staleTime: 15_000,
    refetchOnWindowFocus: false,
  });
}

function useAuthCheck() {
  return useQuery({
    queryKey: ["diagnostics", "auth"],
    queryFn: async (): Promise<Check> => {
      const { data, error } = await supabase.auth.getSession();
      if (error) return { label: "Auth service", status: "fail", detail: error.message };
      return {
        label: "Auth service",
        status: "ok",
        detail: data.session
          ? `Signed in as ${data.session.user.email ?? data.session.user.id}`
          : "No active session",
      };
    },
    staleTime: 30_000,
  });
}

function AdminDiagnostics() {
  const ping = useSupabasePing();
  const auth = useAuthCheck();

  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const env = import.meta.env;
  const mode = env.MODE;
  const isDev = env.DEV;
  const isProd = env.PROD;

  const supabaseUrl = env.VITE_SUPABASE_URL as string | undefined;
  const supabasePub = env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;

  const buildChecks: Check[] = [
    {
      label: "Build mode",
      status: "ok",
      detail: `${mode} (${isDev ? "DEV" : isProd ? "PROD" : "unknown"})`,
    },
    {
      label: "Origin",
      status: "ok",
      detail: typeof window !== "undefined" ? window.location.origin : "ssr",
    },
    {
      label: "User agent",
      status: "ok",
      detail: typeof navigator !== "undefined" ? navigator.userAgent : "n/a",
    },
    {
      label: "Online",
      status: typeof navigator !== "undefined" && navigator.onLine ? "ok" : "warn",
      detail:
        typeof navigator !== "undefined" && navigator.onLine
          ? "Browser reports online"
          : "Browser offline",
    },
    {
      label: "Current time",
      status: "ok",
      detail: now.toISOString(),
    },
  ];

  const envChecks: Check[] = [
    {
      label: "VITE_SUPABASE_URL",
      status: supabaseUrl ? "ok" : "fail",
      detail: supabaseUrl ?? "missing",
    },
    {
      label: "VITE_SUPABASE_PUBLISHABLE_KEY",
      status: supabasePub ? "ok" : "fail",
      detail: supabasePub ? `${supabasePub.slice(0, 12)}…${supabasePub.slice(-6)}` : "missing",
    },
    {
      label: "VITE_GOOGLE_MAPS_API_KEY",
      status: VITE_GOOGLE_MAPS_API_KEY ? "ok" : "warn",
      detail: VITE_GOOGLE_MAPS_API_KEY
        ? `${VITE_GOOGLE_MAPS_API_KEY.slice(0, 8)}…`
        : "missing — Maps features will degrade",
    },
  ];

  const backendChecks: Check[] = [
    ping.data ?? { label: "Database reachable", status: "pending" },
    auth.data ?? { label: "Auth service", status: "pending" },
  ];

  const summary = [...buildChecks, ...envChecks, ...backendChecks].reduce(
    (acc, c) => {
      acc[c.status] = (acc[c.status] ?? 0) + 1;
      return acc;
    },
    {} as Record<Status, number>,
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <Link
              to="/admin"
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            >
              <ChevronLeft className="h-3 w-3" />
              Back to admin
            </Link>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight">Diagnostics</h1>
            <p className="text-sm text-muted-foreground">
              Live status of build, environment, and backend connectivity.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              ping.refetch();
              auth.refetch();
            }}
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-xs font-medium hover:bg-accent"
          >
            <RefreshCw
              className={`h-3 w-3 ${ping.isFetching || auth.isFetching ? "animate-spin" : ""}`}
            />
            Refresh
          </button>
        </div>

        <div className="mb-6 flex flex-wrap gap-2 text-xs">
          <span className="rounded-full bg-emerald-100 px-3 py-1 font-medium text-emerald-700">
            OK {summary.ok ?? 0}
          </span>
          <span className="rounded-full bg-amber-100 px-3 py-1 font-medium text-amber-700">
            Warn {summary.warn ?? 0}
          </span>
          <span className="rounded-full bg-rose-100 px-3 py-1 font-medium text-rose-700">
            Fail {summary.fail ?? 0}
          </span>
          {summary.pending ? (
            <span className="rounded-full bg-muted px-3 py-1 font-medium text-muted-foreground">
              Pending {summary.pending}
            </span>
          ) : null}
        </div>

        <div className="space-y-4">
          <Section icon={Cpu} title="Build & preview">
            {buildChecks.map((c) => (
              <Row key={c.label} check={c} />
            ))}
          </Section>

          <Section icon={KeyRound} title="Environment variables">
            {envChecks.map((c) => (
              <Row key={c.label} check={c} />
            ))}
          </Section>

          <Section icon={Database} title="Backend connectivity">
            {backendChecks.map((c) => (
              <Row key={c.label} check={c} />
            ))}
          </Section>

          <Section icon={Globe} title="Routes">
            <Row
              check={{
                label: "Current pathname",
                status: "ok",
                detail: typeof window !== "undefined" ? window.location.pathname : "ssr",
              }}
            />
            <Row
              check={{
                label: "Document ready state",
                status: "ok",
                detail: typeof document !== "undefined" ? document.readyState : "ssr",
              }}
            />
          </Section>

          <Section icon={Server} title="Dev server hint">
            <p className="text-xs text-muted-foreground">
              The dev server runs on{" "}
              <code className="rounded bg-muted px-1">vite dev --port 8080</code>. If the in-editor
              preview is blank, hit Publish/Update — the published preview pane is separate from the
              live editor preview.
            </p>
          </Section>
        </div>
      </div>
    </div>
  );
}
