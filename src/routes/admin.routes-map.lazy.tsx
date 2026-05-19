import { createLazyFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ROUTE_REGISTRY, PURPOSE_LABELS, FLAG_LABELS, type RoutePurpose, type ConsolidationFlag, type RouteEntry } from "@/lib/routes-registry";
import { Download, Map as MapIcon, AlertTriangle } from "lucide-react";

export const Route = createLazyFileRoute("/admin/routes-map")({
  component: RoutesMapPage,
});

const PURPOSE_TONE: Record<RoutePurpose, string> = {
    acquisition: "bg-amber-100 text-amber-900",
    "money-path": "bg-rose-100 text-rose-900",
    retention: "bg-orange-100 text-orange-900",
    social: "bg-violet-100 text-violet-900",
    discovery: "bg-sky-100 text-sky-900",
    concierge: "bg-teal-100 text-teal-900",
    portal: "bg-indigo-100 text-indigo-900",
    business: "bg-emerald-100 text-emerald-900",
    admin: "bg-slate-200 text-slate-900",
    auth: "bg-yellow-100 text-yellow-900",
    transactional: "bg-lime-100 text-lime-900",
    legal: "bg-zinc-200 text-zinc-800",
    utility: "bg-cyan-100 text-cyan-900",
    system: "bg-neutral-200 text-neutral-800",
};

function toCSV(rows: RouteEntry[]): string {
    const header = ["path", "purpose", "one_job", "flags", "notes"];
    const esc = (s: string) => `"${(s ?? "").replace(/"/g, '""')}"`;
    const body = rows.map((r) => [r.path, r.purpose, r.oneJob, (r.flags ?? []).join("|"), r.notes ?? ""].map(esc).join(","));
    return [header.join(","), ...body].join("\n");
}

function RoutesMapPage() {
    const [q, setQ] = useState("");
    const [purpose, setPurpose] = useState<RoutePurpose | "all">("all");
    const [flag, setFlag] = useState<ConsolidationFlag | "all" | "any" | "none">("all");
    const purposes = useMemo(() => Array.from(new Set(ROUTE_REGISTRY.map((r) => r.purpose))) as RoutePurpose[], []);
    const filtered = useMemo(() => {
        const needle = q.trim().toLowerCase();
        return ROUTE_REGISTRY.filter((r) => {
            if (purpose !== "all" && r.purpose !== purpose)
                return false;
            if (flag === "any" && !(r.flags && r.flags.length))
                return false;
            if (flag === "none" && r.flags && r.flags.length)
                return false;
            if (flag !== "all" && flag !== "any" && flag !== "none") {
                if (!r.flags?.includes(flag))
                    return false;
            }
            if (!needle)
                return true;
            return (r.path.toLowerCase().includes(needle) ||
                r.oneJob.toLowerCase().includes(needle) ||
                (r.notes ?? "").toLowerCase().includes(needle) ||
                r.purpose.toLowerCase().includes(needle));
        });
    }, [q, purpose, flag]);
    const byPurpose = useMemo(() => {
        const map = new Map<RoutePurpose, number>();
        for (const r of ROUTE_REGISTRY)
            map.set(r.purpose, (map.get(r.purpose) ?? 0) + 1);
        return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
    }, []);
    const flaggedCount = useMemo(() => ROUTE_REGISTRY.filter((r) => r.flags && r.flags.length).length, []);
    const handleExport = () => {
        const csv = toCSV(filtered);
        const blob = new Blob([csv], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `routes-map-${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };
    return (<div className="space-y-6 p-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold">
            <MapIcon className="h-6 w-6"/> Routes map
          </h1>
          <p className="text-muted-foreground text-sm">
            Every route in the app, tagged by purpose with its one job and consolidation flags.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={handleExport}>
          <Download className="mr-2 h-4 w-4"/> Export CSV
        </Button>
      </header>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <div className="rounded-lg border p-4">
          <div className="text-muted-foreground text-xs">Total routes</div>
          <div className="text-2xl font-semibold">{ROUTE_REGISTRY.length}</div>
        </div>
        <div className="rounded-lg border p-4">
          <div className="text-muted-foreground text-xs">Purpose buckets</div>
          <div className="text-2xl font-semibold">{byPurpose.length}</div>
        </div>
        <div className="rounded-lg border p-4">
          <div className="text-muted-foreground text-xs">Flagged for review</div>
          <div className="flex items-center gap-2 text-2xl font-semibold">
            <AlertTriangle className="h-5 w-5 text-amber-600"/>
            {flaggedCount}
          </div>
        </div>
        <div className="rounded-lg border p-4">
          <div className="text-muted-foreground text-xs">Showing</div>
          <div className="text-2xl font-semibold">{filtered.length}</div>
        </div>
      </div>

      {/* Purpose distribution */}
      <div className="rounded-lg border p-4">
        <div className="mb-3 text-sm font-medium">By purpose</div>
        <div className="flex flex-wrap gap-2">
          {byPurpose.map(([p, n]) => (<button key={p} onClick={() => setPurpose(purpose === p ? "all" : p)} className={`rounded-full px-3 py-1 text-xs font-medium transition ${PURPOSE_TONE[p]} ${purpose === p ? "ring-2 ring-offset-1" : "opacity-80 hover:opacity-100"}`}>
              {PURPOSE_LABELS[p]} · {n}
            </button>))}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <Input placeholder="Search path, job, notes…" value={q} onChange={(e) => setQ(e.target.value)} className="max-w-xs"/>
        <select value={purpose} onChange={(e) => setPurpose(e.target.value as RoutePurpose | "all")} className="rounded-md border px-2 py-2 text-sm">
          <option value="all">All purposes</option>
          {purposes.map((p) => (<option key={p} value={p}>
              {PURPOSE_LABELS[p]}
            </option>))}
        </select>
        <select value={flag} onChange={(e) => setFlag(e.target.value as ConsolidationFlag | "all" | "any" | "none")} className="rounded-md border px-2 py-2 text-sm">
          <option value="all">All routes</option>
          <option value="any">Any flag</option>
          <option value="none">No flags</option>
          {(Object.keys(FLAG_LABELS) as ConsolidationFlag[]).map((f) => (<option key={f} value={f}>
              {FLAG_LABELS[f]}
            </option>))}
        </select>
        {(q || purpose !== "all" || flag !== "all") && (<Button variant="ghost" size="sm" onClick={() => {
                setQ("");
                setPurpose("all");
                setFlag("all");
            }}>
            Reset
          </Button>)}
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[220px]">Route</TableHead>
              <TableHead className="w-[140px]">Purpose</TableHead>
              <TableHead>One job</TableHead>
              <TableHead className="w-[260px]">Flags / notes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((r) => (<TableRow key={r.path}>
                <TableCell className="font-mono text-xs">
                  {r.path.includes("$") ||
                r.path.startsWith("/admin") ||
                r.path.endsWith(".xml") ? (<span>{r.path}</span>) : (<Link to={r.path} target="_blank" rel="noreferrer" className="hover:underline">
                      {r.path}
                    </Link>)}
                </TableCell>
                <TableCell>
                  <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${PURPOSE_TONE[r.purpose]}`}>
                    {PURPOSE_LABELS[r.purpose]}
                  </span>
                </TableCell>
                <TableCell className="text-sm">{r.oneJob}</TableCell>
                <TableCell>
                  {r.flags && r.flags.length ? (<div className="space-y-1">
                      <div className="flex flex-wrap gap-1">
                        {r.flags.map((f) => (<Badge key={f} variant="outline" className="text-[10px]">
                            {FLAG_LABELS[f]}
                          </Badge>))}
                      </div>
                      {r.notes && <div className="text-muted-foreground text-xs">{r.notes}</div>}
                    </div>) : (<span className="text-muted-foreground text-xs">—</span>)}
                </TableCell>
              </TableRow>))}
            {filtered.length === 0 && (<TableRow>
                <TableCell colSpan={4} className="text-muted-foreground text-center text-sm">
                  No routes match your filters.
                </TableCell>
              </TableRow>)}
          </TableBody>
        </Table>
      </div>
    </div>);
}
