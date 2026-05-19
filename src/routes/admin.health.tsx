import { createFileRoute, Link } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { useAuth } from "@/lib/auth-context";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { useState, useEffect } from "react";
import { Activity, AlertCircle, CheckCircle, Database, Shield, User, XCircle } from "lucide-react";

// ─── Server functions ─────────────────────────────────────────────

/** Public DB connectivity check — no auth required. */
const checkDbConnectivity = createServerFn({ method: "GET" }).handler(async () => {
  const results: Record<string, { ok: boolean; ms: number; error?: string }> = {};

  // Test 1: basic count on a small table
  const t1 = Date.now();
  try {
    const { data, error } = await supabaseAdmin.from("profiles").select("count", { count: "exact", head: true });
    if (error) throw error;
    results.profiles_count = { ok: true, ms: Date.now() - t1 };
  } catch (e) {
    results.profiles_count = { ok: false, ms: Date.now() - t1, error: (e as Error).message };
  }

  // Test 2: auth.users count (service role only)
  const t2 = Date.now();
  try {
    const { data, error } = await supabaseAdmin.from("user_roles").select("count", { count: "exact", head: true });
    if (error) throw error;
    results.user_roles_count = { ok: true, ms: Date.now() - t2 };
  } catch (e) {
    results.user_roles_count = { ok: false, ms: Date.now() - t2, error: (e as Error).message };
  }

  // Test 3: venues count
  const t3 = Date.now();
  try {
    const { data, error } = await supabaseAdmin.from("venues").select("count", { count: "exact", head: true });
    if (error) throw error;
    results.venues_count = { ok: true, ms: Date.now() - t3 };
  } catch (e) {
    results.venues_count = { ok: false, ms: Date.now() - t3, error: (e as Error).message };
  }

  return { results, testedAt: new Date().toISOString() };
});

/** Auth-scoped check — verifies the bearer token works server-side. */
const checkAuthContext = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId, supabase } = context;
    const t = Date.now();
    try {
      const { data, error } = await supabase.from("profiles").select("id, display_name").eq("id", userId).single();
      if (error) throw error;
      return { ok: true, ms: Date.now() - t, userId, profileId: data?.id ?? null, profileName: data?.display_name ?? null };
    } catch (e) {
      return { ok: false, ms: Date.now() - t, userId, error: (e as Error).message };
    }
  });

// ─── Route ──────────────────────────────────────────────────────────

export const Route = createFileRoute("/admin/health")({
  component: AdminHealthPage,
});

function AdminHealthPage() {
  const { user, loading, isAdmin, viewAs, isPreview } = useAuth();
  const [dbResults, setDbResults] = useState<Awaited<ReturnType<typeof checkDbConnectivity>> | null>(null);
  const [authResults, setAuthResults] = useState<Awaited<ReturnType<typeof checkAuthContext>> | null>(null);
  const [dbLoading, setDbLoading] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [clientEnv, setClientEnv] = useState<Record<string, string>>({});

  useEffect(() => {
    // Capture client-side env info for debugging
    setClientEnv({
      origin: window.location.origin,
      pathname: window.location.pathname,
      userAgent: navigator.userAgent.slice(0, 80),
      viteMode: import.meta.env.DEV ? "development" : "production",
    });
  }, []);

  const runDbCheck = async () => {
    setDbLoading(true);
    try {
      const res = await checkDbConnectivity();
      setDbResults(res);
    } catch (e) {
      setDbResults({ results: {}, testedAt: new Date().toISOString() } as any);
      // eslint-disable-next-line no-console
      console.error("[admin/health] DB check failed:", e);
    } finally {
      setDbLoading(false);
    }
  };

  const runAuthCheck = async () => {
    setAuthLoading(true);
    try {
      const res = await checkAuthContext();
      setAuthResults(res);
    } catch (e) {
      setAuthResults({ ok: false, error: (e as Error).message } as any);
      // eslint-disable-next-line no-console
      console.error("[admin/health] Auth check failed:", e);
    } finally {
      setAuthLoading(false);
    }
  };

  useEffect(() => {
    runDbCheck();
    if (!loading && user) runAuthCheck();
  }, [loading, user]);

  const checks = [
    {
      label: "Auth state (client)",
      icon: User,
      status: loading ? "loading" : user ? "ok" : "fail",
      detail: loading ? "Loading…" : user ? `Signed in as ${user.email}` : "Not signed in",
      meta: [
        { k: "isAdmin", v: String(isAdmin) },
        { k: "viewAs", v: String(viewAs ?? "—") },
        { k: "isPreview", v: String(isPreview) },
        { k: "userId", v: user?.id ? user.id.slice(0, 8) + "…" : "—" },
      ],
    },
    {
      label: "Supabase connection",
      icon: Database,
      status: dbLoading ? "loading" : dbResults ? "ok" : "fail",
      detail: dbLoading
        ? "Testing…"
        : dbResults
          ? `Tested at ${new Date(dbResults.testedAt).toLocaleTimeString()}`
          : "Not run",
      subchecks: dbResults
        ? Object.entries(dbResults.results).map(([name, r]) => ({
            label: name,
            status: r.ok ? "ok" : "fail",
            detail: r.ok ? `${r.ms}ms` : r.error ?? "Error",
          }))
        : [],
    },
    {
      label: "Auth context (server)",
      icon: Shield,
      status: authLoading ? "loading" : authResults ? (authResults.ok ? "ok" : "fail") : user ? "loading" : "fail",
      detail: authLoading
        ? "Testing…"
        : authResults
          ? authResults.ok
            ? `Profile: ${(authResults as any).profileName ?? "—"} (${(authResults as any).ms}ms)`
            : (authResults as any).error ?? "Auth failed"
          : user
            ? "Waiting…"
            : "No user — skipped",
    },
    {
      label: "Client environment",
      icon: Activity,
      status: "ok",
      detail: `${clientEnv.viteMode ?? "—"} · ${clientEnv.userAgent ?? "—"}`,
      meta: [
        { k: "origin", v: clientEnv.origin ?? "—" },
        { k: "pathname", v: clientEnv.pathname ?? "—" },
      ],
    },
  ];

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4 sm:p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Admin Health</h1>
          <p className="text-sm text-muted-foreground">Quick diagnostics for auth, DB, and env.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={runDbCheck}
            disabled={dbLoading}
            className="inline-flex items-center gap-1.5 rounded-md border border-input bg-background px-3 py-1.5 text-sm font-medium hover:bg-accent disabled:opacity-50"
          >
            <Activity className="h-4 w-4" />
            Re-run DB
          </button>
          <button
            onClick={runAuthCheck}
            disabled={authLoading || !user}
            className="inline-flex items-center gap-1.5 rounded-md border border-input bg-background px-3 py-1.5 text-sm font-medium hover:bg-accent disabled:opacity-50"
          >
            <Shield className="h-4 w-4" />
            Re-run auth
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {checks.map((check) => (
          <div key={check.label} className="rounded-lg border border-border bg-card p-4 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="mt-0.5">
                {check.status === "ok" ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : check.status === "loading" ? (
                  <Activity className="h-5 w-5 animate-pulse text-muted-foreground" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-500" />
                )}
              </div>
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <check.icon className="h-4 w-4 text-muted-foreground" />
                  <span className="font-semibold">{check.label}</span>
                  <span
                    className={`ml-auto rounded-full px-2 py-0.5 text-xs font-medium ${
                      check.status === "ok"
                        ? "bg-green-100 text-green-700"
                        : check.status === "loading"
                          ? "bg-muted text-muted-foreground"
                          : "bg-red-100 text-red-700"
                    }`}
                  >
                    {check.status.toUpperCase()}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">{check.detail}</p>

                {check.meta && (
                  <div className="mt-2 grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
                    {check.meta.map((m) => (
                      <div key={m.k} className="rounded bg-muted px-2 py-1">
                        <span className="font-mono text-muted-foreground">{m.k}</span>
                        <div className="font-mono font-medium truncate">{m.v}</div>
                      </div>
                    ))}
                  </div>
                )}

                {check.subchecks && check.subchecks.length > 0 && (
                  <div className="mt-2 space-y-1.5">
                    {check.subchecks.map((sub) => (
                      <div
                        key={sub.label}
                        className="flex items-center gap-2 rounded bg-muted/50 px-2 py-1 text-xs"
                      >
                        {sub.status === "ok" ? (
                          <CheckCircle className="h-3.5 w-3.5 text-green-500" />
                        ) : (
                          <AlertCircle className="h-3.5 w-3.5 text-red-500" />
                        )}
                        <span className="font-mono">{sub.label}</span>
                        <span className="ml-auto text-muted-foreground">{sub.detail}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-lg border border-border bg-muted/30 p-3 text-xs text-muted-foreground">
        <p>
          If auth checks fail but DB checks pass, the issue is likely a missing/invalid bearer token
          or RLS policy mismatch. If both fail, check Lovable Cloud status and network connectivity.
        </p>
      </div>

      <div className="flex gap-3">
        <Link
          to="/admin"
          className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Back to admin
        </Link>
        <Link
          to="/"
          className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent"
        >
          Go home
        </Link>
      </div>
    </div>
  );
}
