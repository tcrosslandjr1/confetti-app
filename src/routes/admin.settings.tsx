import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  CheckCircle2,
  ExternalLink,
  KeyRound,
  Loader2,
  Lock,
  RefreshCw,
  Settings,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/settings")({
  head: () => ({ meta: [{ title: "Settings — Admin" }] }),
  component: AdminSettingsPage,
});

type Check = { name: string; ok: boolean; detail: string };
type Diag = {
  ok: boolean;
  keyPresent: boolean;
  keyMasked: string | null;
  checks: Check[];
  remediation?: string;
};

function AdminSettingsPage() {
  const [diag, setDiag] = useState<Diag | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  const verify = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("google-places", {
        body: { diag: true },
      });
      if (error) {
        setDiag({
          ok: false,
          keyPresent: false,
          keyMasked: null,
          checks: [{ name: "Edge function reachable", ok: false, detail: error.message }],
        });
        toast.error("Verification failed", { description: error.message });
      } else {
        const d = data as Diag;
        setDiag(d);
        if (d.ok)
          toast.success("Key verified", { description: "Places API responded successfully." });
        else
          toast.error("Key not working", {
            description: d.checks?.find((c) => !c.ok)?.detail ?? "See details below.",
          });
      }
    } finally {
      setLoading(false);
      setLastChecked(new Date());
    }
  };

  useEffect(() => {
    void verify();
  }, []);

  const status: "idle" | "ok" | "error" | "checking" = loading
    ? "checking"
    : !diag
      ? "idle"
      : diag.ok
        ? "ok"
        : "error";

  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Platform</p>
        <h1 className="font-display text-3xl font-bold leading-tight flex items-center gap-2">
          <Settings className="h-7 w-7" /> Settings
        </h1>
        <p className="text-sm text-muted-foreground">
          Manage the API keys that power Confetti. Keys live in encrypted Lovable Cloud storage —
          never in code, the database, or your browser.
        </p>
      </header>

      <article className="rounded-3xl border border-border bg-card p-6 shadow-card space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-xl font-bold flex items-center gap-2">
              <KeyRound className="h-5 w-5" /> Google Places API key
            </h2>
            <p className="text-sm text-muted-foreground max-w-xl">
              Powers venue lookup, ratings, photos, and addresses inside the concierge and wizard.
              Use a <strong>server-side</strong> key with <strong>Places API (New)</strong> enabled
              and <strong>no application restrictions</strong>.
            </p>
          </div>
          <StatusPill status={status} />
        </div>

        <div className="rounded-2xl bg-muted/60 p-4 space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <Lock className="h-3.5 w-3.5 text-muted-foreground" />
            <code className="font-mono text-xs">GOOGLE_PLACES_API_KEY</code>
            {diag?.keyMasked && (
              <span className="font-mono text-xs text-muted-foreground">· {diag.keyMasked}</span>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            Stored in Lovable Cloud secrets, encrypted at rest, accessible only to your edge
            functions. The full value is never exposed to the browser.
          </p>
        </div>

        <ol className="space-y-2 text-sm text-muted-foreground list-decimal list-inside">
          <li>
            In{" "}
            <a
              href="https://console.cloud.google.com/apis/library/places-backend.googleapis.com"
              target="_blank"
              rel="noreferrer"
              className="text-primary underline"
            >
              Google Cloud Console
            </a>
            , enable <strong>Places API (New)</strong>.
          </li>
          <li>
            Create or open an API key under <strong>APIs &amp; Services → Credentials</strong>.
          </li>
          <li>
            Set <strong>Application restrictions = None</strong> (or IP-restricted), and under{" "}
            <strong>API restrictions</strong> include <em>Places API (New)</em>.
          </li>
          <li>Copy the key and paste it into the secure prompt below.</li>
        </ol>

        <div className="flex flex-wrap items-center gap-2 pt-1">
          <Button
            onClick={() => {
              toast.info("Opening secure prompt", {
                description: "Use the credential dialog at the top of the chat to paste the key.",
              });
            }}
            asChild
          >
            <a
              href="https://docs.lovable.dev/features/cloud#secrets"
              target="_blank"
              rel="noreferrer"
            >
              <ShieldCheck className="mr-1 h-4 w-4" /> Update key (secure prompt)
              <ExternalLink className="ml-1 h-3.5 w-3.5" />
            </a>
          </Button>
          <Button variant="outline" onClick={verify} disabled={loading}>
            {loading ? (
              <Loader2 className="mr-1 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-1 h-4 w-4" />
            )}
            Verify connection
          </Button>
          {lastChecked && (
            <span className="text-xs text-muted-foreground">
              Last checked {lastChecked.toLocaleTimeString()}
            </span>
          )}
        </div>

        {diag && (
          <div className="space-y-3 pt-2">
            <ul className="space-y-1.5 text-sm">
              {diag.checks.map((c, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  {c.ok ? (
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                  ) : (
                    <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                  )}
                  <span>
                    <span className="font-medium">{c.name}</span>
                    <span className="text-muted-foreground"> — {c.detail}</span>
                  </span>
                </li>
              ))}
            </ul>

            {diag.ok && (
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-900 dark:text-emerald-200">
                <CheckCircle2 className="mr-1 inline h-4 w-4" />
                Key saved and verified. Venue lookups are live.
              </div>
            )}

            {!diag.ok && diag.remediation && (
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-900 dark:text-amber-200">
                <span className="font-semibold">How to fix: </span>
                {diag.remediation}
              </div>
            )}
          </div>
        )}
      </article>

      <section className="rounded-2xl border border-dashed border-border bg-card/50 p-5 text-sm text-muted-foreground">
        Looking for the full integrations dashboard? See{" "}
        <Link to="/admin/integrations" className="text-primary underline">
          Admin → Integrations
        </Link>{" "}
        for every connected service.
      </section>
    </div>
  );
}

function StatusPill({ status }: { status: "idle" | "checking" | "ok" | "error" }) {
  if (status === "checking")
    return (
      <Badge className="bg-muted text-muted-foreground">
        <Loader2 className="mr-1 h-3 w-3 animate-spin" /> Checking…
      </Badge>
    );
  if (status === "ok")
    return (
      <Badge className="bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/20">
        <CheckCircle2 className="mr-1 h-3 w-3" /> Verified
      </Badge>
    );
  if (status === "error")
    return (
      <Badge className="bg-destructive/15 text-destructive hover:bg-destructive/20">
        <XCircle className="mr-1 h-3 w-3" /> Not working
      </Badge>
    );
  return <Badge variant="outline">Not tested</Badge>;
}
