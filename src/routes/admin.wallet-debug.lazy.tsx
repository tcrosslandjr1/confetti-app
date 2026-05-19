import { createLazyFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { CheckCircle2, Loader2, ShieldCheck, XCircle, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createLazyFileRoute("/admin/wallet-debug")({
  component: WalletDebugPage,
});

type Stop = {
    id: string;
    name: string;
    type?: string;
    time?: string;
    area?: string;
};

type DebugResponse = {
    ok: boolean;
    envStatus: Record<string, string>;
    summary: {
        issuerId: string | null;
        classId: string | null;
        objectId: string;
        barcode: {
            type: string;
            value: string;
            alternateText: string;
        };
        origin: string;
    };
    checks: {
        name: string;
        pass: boolean;
        detail?: string;
    }[];
    claims: unknown;
    jwt: string | null;
    saveUrl: string | null;
    jwtLength: number | null;
    decodedHeader: unknown;
    decodedClaims: unknown;
    signError: string | null;
};

const SAMPLE: {
    loopId: string;
    passenger: string;
    from: string;
    to: string;
    date: string;
    gate: string;
    boardingTime: string;
    stops: Stop[];
} = {
    loopId: "DEMO123",
    passenger: "Demo Passenger",
    from: "Home",
    to: "Night Out",
    date: "Sat, May 16",
    gate: "B7",
    boardingTime: "7:30 PM",
    stops: [
        { id: "s1", name: "Le Diplomate", area: "14th St NW", time: "7:30 PM", type: "Dinner" },
        { id: "s2", name: "Right Proper", area: "Shaw", time: "9:30 PM", type: "Drinks" },
    ],
};

function WalletDebugPage() {
    const [form, setForm] = useState(SAMPLE);
    const [stopsJson, setStopsJson] = useState(JSON.stringify(SAMPLE.stops, null, 2));
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<DebugResponse | null>(null);
    const [error, setError] = useState<string | null>(null);
    async function run() {
        setLoading(true);
        setError(null);
        setResult(null);
        try {
            let stops: Stop[];
            try {
                stops = JSON.parse(stopsJson);
                if (!Array.isArray(stops) || stops.length === 0)
                    throw new Error("stops must be a non-empty array");
            }
            catch (e) {
                throw new Error(`Invalid stops JSON: ${(e as Error).message}`);
            }
            const { data: sessionData } = await supabase.auth.getSession();
            const token = sessionData.session?.access_token;
            if (!token)
                throw new Error("Not signed in");
            const res = await fetch("/api/admin/wallet/google-debug", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ ...form, stops }),
            });
            const json = await res.json();
            if (!res.ok)
                throw new Error(json?.error || `HTTP ${res.status}`);
            setResult(json);
        }
        catch (e) {
            setError((e as Error).message);
        }
        finally {
            setLoading(false);
        }
    }
    const copy = (label: string, text: string | null) => {
        if (!text)
            return;
        navigator.clipboard.writeText(text);
        toast.success(`${label} copied`);
    };
    return (<div className="mx-auto max-w-5xl space-y-6">
      <header className="flex items-start gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-vibe shadow-pop">
          <ShieldCheck className="h-5 w-5 text-primary-foreground"/>
        </div>
        <div>
          <h1 className="font-display text-2xl font-bold">Google Wallet JWT Debug</h1>
          <p className="text-sm text-muted-foreground">
            Admin-only. Generates a signed JWT for a sample plan and shows decoded claims, classId,
            objectId, and barcode so you can verify they match the Generic class schema.
          </p>
        </div>
      </header>

      <section className="rounded-xl border border-border bg-card p-4 sm:p-6">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Plan input
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {(["loopId", "passenger", "from", "to", "date", "gate", "boardingTime"] as const).map((k) => (<div key={k} className="space-y-1.5">
                <Label htmlFor={k}>{k}</Label>
                <Input id={k} value={form[k]} onChange={(e) => setForm({ ...form, [k]: e.target.value })}/>
              </div>))}
        </div>
        <div className="mt-4 space-y-1.5">
          <Label htmlFor="stops">stops (JSON array)</Label>
          <Textarea id="stops" rows={8} value={stopsJson} onChange={(e) => setStopsJson(e.target.value)} className="font-mono text-xs"/>
        </div>
        <div className="mt-4 flex items-center gap-3">
          <Button onClick={run} disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
            Generate & inspect JWT
          </Button>
          {error ? <span className="text-sm text-destructive">{error}</span> : null}
        </div>
      </section>

      {result ? (<>
          <section className="rounded-xl border border-border bg-card p-4 sm:p-6">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Summary
              </h2>
              <Badge variant={result.ok ? "default" : "destructive"}>
                {result.ok ? "All checks passed" : "Issues found"}
              </Badge>
            </div>
            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              <Row label="issuerId" value={result.summary.issuerId}/>
              <Row label="classId" value={result.summary.classId}/>
              <Row label="objectId" value={result.summary.objectId}/>
              <Row label="origin" value={result.summary.origin}/>
              <Row label="barcode.type" value={result.summary.barcode.type}/>
              <Row label="barcode.alternateText" value={result.summary.barcode.alternateText}/>
              <div className="sm:col-span-2">
                <Row label="barcode.value" value={result.summary.barcode.value} mono/>
              </div>
            </dl>
          </section>

          <section className="rounded-xl border border-border bg-card p-4 sm:p-6">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Validation checks
            </h2>
            <ul className="space-y-2 text-sm">
              {result.checks.map((c) => (<li key={c.name} className="flex items-start gap-2">
                  {c.pass ? (<CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-600"/>) : (<XCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive"/>)}
                  <div>
                    <div className="font-medium">{c.name}</div>
                    {c.detail ? (<div className="break-all font-mono text-xs text-muted-foreground">
                        {c.detail}
                      </div>) : null}
                  </div>
                </li>))}
            </ul>
          </section>

          <section className="rounded-xl border border-border bg-card p-4 sm:p-6">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Environment
            </h2>
            <pre className="overflow-auto rounded-md bg-muted p-3 text-xs">
              {JSON.stringify(result.envStatus, null, 2)}
            </pre>
          </section>

          <section className="rounded-xl border border-border bg-card p-4 sm:p-6">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              JWT claims (input to signer)
            </h2>
            <pre className="max-h-96 overflow-auto rounded-md bg-muted p-3 text-xs">
              {JSON.stringify(result.claims, null, 2)}
            </pre>
          </section>

          {result.jwt ? (<section className="rounded-xl border border-border bg-card p-4 sm:p-6">
              <div className="mb-3 flex items-center justify-between gap-2">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  Signed JWT ({result.jwtLength} chars)
                </h2>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => copy("JWT", result.jwt)}>
                    <Copy className="mr-1 h-3 w-3"/> JWT
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => copy("Save URL", result.saveUrl)}>
                    <Copy className="mr-1 h-3 w-3"/> Save URL
                  </Button>
                </div>
              </div>
              <pre className="break-all rounded-md bg-muted p-3 text-[10px]">{result.jwt}</pre>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <div>
                  <div className="mb-1 text-xs font-semibold text-muted-foreground">
                    Decoded header
                  </div>
                  <pre className="overflow-auto rounded-md bg-muted p-3 text-xs">
                    {JSON.stringify(result.decodedHeader, null, 2)}
                  </pre>
                </div>
                <div>
                  <div className="mb-1 text-xs font-semibold text-muted-foreground">
                    Decoded claims
                  </div>
                  <pre className="max-h-72 overflow-auto rounded-md bg-muted p-3 text-xs">
                    {JSON.stringify(result.decodedClaims, null, 2)}
                  </pre>
                </div>
              </div>
            </section>) : (<section className="rounded-xl border border-destructive/40 bg-destructive/5 p-4 sm:p-6">
              <h2 className="mb-2 text-sm font-semibold text-destructive">JWT not signed</h2>
              <p className="text-xs text-muted-foreground">
                {result.signError ??
                    "One or more Google Wallet env vars are missing. Add them in project secrets, then re-run."}
              </p>
            </section>)}
        </>) : null}
    </div>);
}

function Row({ label, value, mono }: {
    label: string;
    value: string | null;
    mono?: boolean;
}) {
    return (<div className="flex flex-col gap-0.5">
      <dt className="text-xs uppercase tracking-wider text-muted-foreground">{label}</dt>
      <dd className={`break-all ${mono ? "font-mono text-xs" : "text-sm"}`}>
        {value ?? <span className="text-muted-foreground">—</span>}
      </dd>
    </div>);
}
