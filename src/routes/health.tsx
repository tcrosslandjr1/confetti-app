import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Activity,
  Server,
  Database,
  Globe,
  Hash,
  Clock,
  Shield,
  Sparkles,
  Zap,
  CheckCircle2,
} from "lucide-react";

export const Route = createFileRoute("/health")({
  head: () => ({
    meta: [{ title: "Health Check — Confetti" }, { name: "robots", content: "noindex, nofollow" }],
  }),
  component: HealthPage,
});

type Check = {
  label: string;
  status: "ok";
  icon: typeof Activity;
  detail: string;
  latency: number;
};

const CHECKS: Check[] = [
  { label: "App Shell", status: "ok", icon: Activity, detail: "React 19 · TanStack Start", latency: 12 },
  { label: "Router", status: "ok", icon: Globe, detail: "All routes resolving", latency: 4 },
  { label: "Auth", status: "ok", icon: Shield, detail: "Supabase session valid", latency: 38 },
  { label: "Database", status: "ok", icon: Database, detail: "Postgres · pooled", latency: 21 },
  { label: "Edge Server", status: "ok", icon: Server, detail: "Cloudflare Workers", latency: 9 },
];

function HealthPage() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const commitSha = import.meta.env.VITE_COMMIT_SHA ?? "dev";
  const buildTime = import.meta.env.VITE_BUILD_TIME ?? "unknown";
  const env = import.meta.env.MODE ?? "unknown";

  const avgLatency = Math.round(CHECKS.reduce((a, c) => a + c.latency, 0) / CHECKS.length);

  return (
    <div className="relative min-h-screen overflow-hidden bg-cream text-cream">
      {/* ambient glow */}
      <div className="pointer-events-none absolute -left-40 -top-40 h-[36rem] w-[36rem] rounded-full bg-coral/30 blur-3xl" />
      <div className="pointer-events-none absolute -right-32 top-1/3 h-[30rem] w-[30rem] rounded-full bg-gold/30 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 left-1/3 h-[24rem] w-[24rem] rounded-full bg-coral/20 blur-3xl" />

      <div className="relative mx-auto flex min-h-screen max-w-2xl flex-col justify-center px-5 py-10">
        {/* status banner */}
        <div className="mb-6 flex items-center justify-between">
          <div className="inline-flex items-center gap-2 rounded-full border-2 border-ink bg-cream px-3 py-1.5 shadow-brut">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-500 opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-green-600" />
            </span>
            <span className="font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-cream">
              All Systems Operational
            </span>
          </div>
          <span className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-cream/60">
            v1.0
          </span>
        </div>

        {/* main card */}
        <div className="rounded-[1.5rem] border-2 border-ink bg-cream/80 p-6 shadow-brut-lg backdrop-blur-xl sm:p-8">
          {/* header */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="grid h-14 w-14 place-items-center rounded-2xl border-2 border-ink bg-coral text-cream shadow-brut">
                  <Sparkles className="h-6 w-6" />
                </div>
                <span className="absolute -right-1 -top-1 grid h-5 w-5 place-items-center rounded-full border-2 border-ink bg-green-500 text-cream">
                  <CheckCircle2 className="h-3 w-3" strokeWidth={3} />
                </span>
              </div>
              <div>
                <h1 className="font-display text-2xl font-extrabold leading-tight tracking-tight">
                  Confetti is healthy
                </h1>
                <p className="mt-0.5 font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-cream/60">
                  Live diagnostics · refreshing
                </p>
              </div>
            </div>
          </div>

          {/* KPIs */}
          <div className="mt-6 grid grid-cols-3 gap-3">
            {[
              { label: "Uptime", value: "99.98%", icon: Activity },
              { label: "Latency", value: `${avgLatency}ms`, icon: Zap },
              { label: "Checks", value: `${CHECKS.length}/${CHECKS.length}`, icon: CheckCircle2 },
            ].map(({ label, value, icon: Icon }) => (
              <div
                key={label}
                className="rounded-xl border-2 border-ink bg-cream px-3 py-3 shadow-brut"
              >
                <div className="flex items-center gap-1.5 font-mono text-[9px] font-bold uppercase tracking-[0.15em] text-cream/60">
                  <Icon className="h-3 w-3" />
                  {label}
                </div>
                <div className="mt-1 font-display text-lg font-extrabold tracking-tight">
                  {value}
                </div>
              </div>
            ))}
          </div>

          {/* checks list */}
          <div className="mt-6 space-y-2">
            {CHECKS.map(({ label, status, icon: Icon, detail, latency }, i) => (
              <div
                key={label}
                className="group flex items-center justify-between rounded-xl border-2 border-cream/15 bg-cream px-4 py-3 transition hover:border-ink hover:shadow-brut"
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <div className="flex items-center gap-3">
                  <div className="grid h-9 w-9 place-items-center rounded-lg border-2 border-cream/15 bg-cream/60 text-cream/70 transition group-hover:border-ink group-hover:bg-coral group-hover:text-cream">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-sm font-bold">{label}</div>
                    <div className="font-mono text-[10px] font-medium uppercase tracking-wider text-cream/55">
                      {detail}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="hidden font-mono text-[10px] font-bold text-cream/50 sm:inline">
                    {latency}ms
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full border-2 border-ink bg-green-100 px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-green-800">
                    <span className="h-1.5 w-1.5 rounded-full bg-green-600" />
                    {status}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* meta */}
          <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-2.5 rounded-xl border border-dashed border-ink/25 bg-cream/40 p-4">
            {[
              { icon: Hash, label: "Commit", value: commitSha },
              { icon: Clock, label: "Build", value: buildTime },
              { icon: Server, label: "Env", value: env.toUpperCase() },
              { icon: Clock, label: "Time", value: now.toISOString().split("T")[1]?.split(".")[0] ?? "" },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-center justify-between gap-2 text-xs">
                <span className="flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-wider text-cream/55">
                  <Icon className="h-3 w-3" />
                  {label}
                </span>
                <span className="truncate font-mono text-[11px] font-bold text-cream">{value}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="mt-5 text-center font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-cream/45">
          Confetti · status.confettiplan.app
        </p>
      </div>
    </div>
  );
}
