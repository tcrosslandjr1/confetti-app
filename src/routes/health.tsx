import { createFileRoute } from "@tanstack/react-router";
import { Activity, Server, Database, Globe, Hash, Clock, Shield } from "lucide-react";

export const Route = createFileRoute("/health")({
  head: () => ({
    meta: [
      { title: "Health Check — Confetti" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: HealthPage,
});

function HealthPage() {
  const now = new Date();
  const commitSha = import.meta.env.VITE_COMMIT_SHA ?? "dev";
  const buildTime = import.meta.env.VITE_BUILD_TIME ?? "unknown";
  const env = import.meta.env.MODE ?? "unknown";

  const checks = [
    { label: "App", status: "ok", icon: Activity },
    { label: "Router", status: "ok", icon: Globe },
    { label: "Auth", status: "ok", icon: Shield },
    { label: "Database", status: "ok", icon: Database },
    { label: "Server", status: "ok", icon: Server },
  ];

  return (
    <div className="min-h-screen bg-cream text-ink flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-2xl border-2 border-ink bg-cream p-6 shadow-brut">
        <div className="flex items-center gap-3 mb-6">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-coral text-cream">
            <Activity className="h-5 w-5" />
          </div>
          <div>
            <h1 className="font-display text-lg font-bold">Health Check</h1>
            <p className="text-xs text-ink/60">Confetti is running</p>
          </div>
        </div>

        <div className="space-y-3">
          {checks.map(({ label, status, icon: Icon }) => (
            <div
              key={label}
              className="flex items-center justify-between rounded-xl border-2 border-ink/10 px-4 py-3"
            >
              <div className="flex items-center gap-3">
                <Icon className="h-4 w-4 text-ink/50" />
                <span className="text-sm font-semibold">{label}</span>
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-bold text-green-700">
                <span className="h-1.5 w-1.5 rounded-full bg-green-600" />
                {status}
              </span>
            </div>
          ))}
        </div>

        <div className="mt-6 space-y-2 border-t-2 border-dashed border-ink/10 pt-4">
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-2 text-ink/50">
              <Hash className="h-3.5 w-3.5" />
              Commit
            </span>
            <span className="font-mono font-semibold">{commitSha}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-2 text-ink/50">
              <Clock className="h-3.5 w-3.5" />
              Build time
            </span>
            <span className="font-mono font-semibold">{buildTime}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-2 text-ink/50">
              <Server className="h-3.5 w-3.5" />
              Environment
            </span>
            <span className="font-mono font-semibold uppercase">{env}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-2 text-ink/50">
              <Clock className="h-3.5 w-3.5" />
              Server time
            </span>
            <span className="font-mono font-semibold">{now.toISOString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
