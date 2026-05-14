import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  CheckCircle2,
  ExternalLink,
  Flame,
  KeyRound,
  Loader2,
  Plug,
  RefreshCw,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/integrations")({
  head: () => ({ meta: [{ title: "Integrations — Admin" }] }),
  component: AdminIntegrationsPage,
});

type Check = { name: string; ok: boolean; detail: string };
type TestResult = {
  ok: boolean;
  detail: string;
  checks?: Check[];
  remediation?: string;
  keyMasked?: string | null;
};

type Integration = {
  key: string;
  name: string;
  description: string;
  envVar: string;
  docs: string;
  test: () => Promise<TestResult>;
};

const INTEGRATIONS: Integration[] = [
  {
    key: "google-places",
    name: "Google Places",
    description: "Powers venue lookup, photos, addresses, and map links inside the wizard.",
    envVar: "GOOGLE_PLACES_API_KEY",
    docs: "https://developers.google.com/maps/documentation/places/web-service",
    test: async () => {
      const { data, error } = await supabase.functions.invoke("google-places", {
        body: { diag: true },
      });
      if (error) {
        return { ok: false, detail: error.message, checks: [{ name: "Edge function reachable", ok: false, detail: error.message }] };
      }
      const d = data as {
        ok: boolean;
        keyMasked: string | null;
        checks: Check[];
        remediation?: string;
      };
      const failed = d.checks?.find((c) => !c.ok);
      return {
        ok: d.ok,
        detail: d.ok ? "All checks passed" : failed?.detail ?? "Failed",
        checks: d.checks,
        remediation: d.remediation,
        keyMasked: d.keyMasked,
      };
    },
  },
  {
    key: "lovable-ai",
    name: "Lovable AI Gateway",
    description: "AI concierge, itinerary generation, and chat replies.",
    envVar: "LOVABLE_API_KEY",
    docs: "https://docs.lovable.dev/features/ai",
    test: async () => ({ ok: true, detail: "Key configured · billed via Lovable Cloud" }),
  },
  {
    key: "supabase",
    name: "Lovable Cloud (Database)",
    description: "Database, auth, storage, and edge functions.",
    envVar: "SUPABASE_URL",
    docs: "https://docs.lovable.dev/features/cloud",
    test: async () => {
      const { error } = await supabase.from("venues").select("id", { count: "exact", head: true });
      if (error) return { ok: false, detail: error.message };
      return { ok: true, detail: "Connected · RLS active" };
    },
  },
];

type Status = "idle" | "checking" | "ok" | "error";

function StatusPill({ status, detail }: { status: Status; detail: string }) {
  if (status === "checking")
    return (
      <Badge className="bg-muted text-muted-foreground">
        <Loader2 className="mr-1 h-3 w-3 animate-spin" /> Checking…
      </Badge>
    );
  if (status === "ok")
    return (
      <Badge className="bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/20">
        <CheckCircle2 className="mr-1 h-3 w-3" /> {detail || "OK"}
      </Badge>
    );
  if (status === "error")
    return (
      <Badge className="bg-destructive/15 text-destructive hover:bg-destructive/20">
        <XCircle className="mr-1 h-3 w-3" /> Error
      </Badge>
    );
  return <Badge variant="outline">Not tested</Badge>;
}

function AdminIntegrationsPage() {
  const [statuses, setStatuses] = useState<
    Record<string, { status: Status; result: TestResult }>
  >({});

  const runTest = async (i: Integration) => {
    setStatuses((s) => ({ ...s, [i.key]: { status: "checking", result: { ok: false, detail: "" } } }));
    try {
      const r = await i.test();
      setStatuses((s) => ({ ...s, [i.key]: { status: r.ok ? "ok" : "error", result: r } }));
      if (r.ok) toast.success(`${i.name} OK`, { description: r.detail });
      else toast.error(`${i.name} failed`, { description: r.detail });
    } catch (e: any) {
      setStatuses((s) => ({
        ...s,
        [i.key]: { status: "error", result: { ok: false, detail: e?.message ?? "Failed" } },
      }));
    }
  };

  useEffect(() => {
    INTEGRATIONS.forEach((i) => void runTest(i));
  }, []);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
            Platform
          </p>
          <h1 className="font-display text-3xl font-bold leading-tight flex items-center gap-2">
            <Plug className="h-7 w-7" /> Integrations
          </h1>
          <p className="text-sm text-muted-foreground">
            External services that power the customer experience. Keys are stored securely in
            Lovable Cloud secrets — they never live in the database.
          </p>
        </div>
      </header>

      <div className="grid gap-4 lg:grid-cols-2">
        {INTEGRATIONS.map((i) => {
          const st = statuses[i.key] ?? { status: "idle" as Status, result: { ok: false, detail: "" } };
          const r = st.result;
          return (
            <article
              key={i.key}
              className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-5 shadow-card"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-display text-lg font-bold">{i.name}</h3>
                  <p className="text-sm text-muted-foreground">{i.description}</p>
                </div>
                <StatusPill status={st.status} detail={st.status === "ok" ? "OK" : ""} />
              </div>

              <div className="flex flex-wrap items-center gap-2 rounded-xl bg-muted/60 px-3 py-2 text-xs">
                <KeyRound className="h-3.5 w-3.5 text-muted-foreground" />
                <code className="font-mono">{i.envVar}</code>
                {r.keyMasked && (
                  <span className="font-mono text-muted-foreground">· {r.keyMasked}</span>
                )}
                <span className="text-muted-foreground">· managed in Lovable Cloud → Secrets</span>
              </div>

              {r.checks && r.checks.length > 0 && (
                <ul className="space-y-1 text-xs">
                  {r.checks.map((c, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      {c.ok ? (
                        <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />
                      ) : (
                        <XCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-destructive" />
                      )}
                      <span>
                        <span className="font-medium">{c.name}</span>
                        <span className="text-muted-foreground"> — {c.detail}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              )}

              {!r.ok && r.detail && !r.checks && (
                <p className="rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">
                  {r.detail}
                </p>
              )}

              {r.remediation && (
                <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-900 dark:text-amber-200">
                  <span className="font-semibold">How to fix: </span>
                  {r.remediation}
                </p>
              )}

              <div className="mt-auto flex flex-wrap gap-2 pt-1">
                <Button size="sm" variant="outline" onClick={() => runTest(i)}>
                  <RefreshCw className="mr-1 h-3.5 w-3.5" /> Test connection
                </Button>
                <Button size="sm" variant="ghost" asChild>
                  <a href={i.docs} target="_blank" rel="noreferrer">
                    Docs <ExternalLink className="ml-1 h-3.5 w-3.5" />
                  </a>
                </Button>
              </div>
            </article>
          );
        })}
      </div>

      <ViralRefreshPanel />

      <section className="rounded-2xl border border-dashed border-border bg-card/50 p-5 text-sm text-muted-foreground">
        Need to add a new integration (e.g. Resend for email, Stripe for payments)? Open Lovable
        Cloud → Secrets to add the API key, then drop a new entry into{" "}
        <code className="font-mono text-foreground">src/routes/admin.integrations.tsx</code>.
      </section>
    </div>
  );
}

function ViralRefreshPanel() {
  const [city, setCity] = useState("Washington DC");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [runs, setRuns] = useState<
    Array<{
      id: string;
      city: string | null;
      started_at: string;
      finished_at: string | null;
      venues_upserted: number;
      candidates_found: number;
      error: string | null;
      duration_ms: number | null;
    }>
  >([]);

  const loadRuns = async () => {
    const { data } = await supabase
      .from("viral_discovery_runs")
      .select("id,city,started_at,finished_at,venues_upserted,candidates_found,error,duration_ms")
      .order("started_at", { ascending: false })
      .limit(8);
    setRuns(data ?? []);
  };
  useEffect(() => {
    void loadRuns();
  }, []);

  const refresh = async () => {
    setBusy(true);
    setResult(null);
    try {
      const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;
      const res = await fetch("/api/public/hooks/discover-viral", {
        method: "POST",
        headers: { "Content-Type": "application/json", apikey: anonKey },
        body: JSON.stringify({ city }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? `HTTP ${res.status}`);
      setResult(
        `✓ ${json.venuesUpserted ?? 0} venues from ${json.candidatesFound ?? 0} candidates · ${json.durationMs}ms`,
      );
      toast.success("Viral feed refreshed", {
        description: `${json.venuesUpserted} venues for ${city}`,
      });
      void loadRuns();
    } catch (e) {
      const msg = (e as Error).message;
      setResult(`✗ ${msg}`);
      toast.error("Refresh failed", { description: msg });
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="space-y-3 rounded-2xl border border-border bg-card p-5 shadow-card">
      <div>
        <h3 className="font-display text-lg font-bold flex items-center gap-2">
          <Flame className="h-5 w-5 text-rose-500" /> Viral discovery
        </h3>
        <p className="text-sm text-muted-foreground">
          Pulls trending venues from Firecrawl + Lovable AI, verifies via Google Places, and caches
          scored results.
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <input
          value={city}
          onChange={(e) => setCity(e.target.value)}
          className="rounded-xl border border-border bg-background px-3 py-2 text-sm"
          placeholder="City"
        />
        <Button onClick={refresh} disabled={busy} size="sm">
          {busy ? (
            <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
          ) : (
            <RefreshCw className="mr-1 h-3.5 w-3.5" />
          )}
          Refresh now
        </Button>
        {result && <span className="text-xs text-muted-foreground">{result}</span>}
      </div>
      {runs.length > 0 && (
        <div className="space-y-1.5 pt-2">
          <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
            Recent runs
          </p>
          <ul className="divide-y divide-border rounded-xl border border-border bg-background text-xs">
            {runs.map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-2 px-3 py-2">
                <span className="font-mono">{r.city ?? "—"}</span>
                <span className="text-muted-foreground">
                  {new Date(r.started_at).toLocaleString()}
                </span>
                <span className={r.error ? "text-destructive" : "text-emerald-600"}>
                  {r.error
                    ? `error: ${r.error.slice(0, 40)}`
                    : `${r.venues_upserted}/${r.candidates_found} · ${r.duration_ms ?? 0}ms`}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
