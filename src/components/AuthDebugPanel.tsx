import { useEffect, useState } from "react";
import { useLocation } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-context";

const STORAGE_KEY = "confetti:debug:auth";

/**
 * Floating diagnostic panel showing live auth state.
 * Toggle with: ?debug=auth in URL, Alt+Shift+D, or localStorage["confetti:debug:auth"]="1".
 */
export function AuthDebugPanel() {
  const auth = useAuth();
  const location = useLocation();
  const [enabled, setEnabled] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    const fromUrl = url.searchParams.get("debug") === "auth";
    const fromStorage = localStorage.getItem(STORAGE_KEY) === "1";
    if (fromUrl) localStorage.setItem(STORAGE_KEY, "1");
    setEnabled(fromUrl || fromStorage);

    const onKey = (e: KeyboardEvent) => {
      if (e.altKey && e.shiftKey && (e.key === "D" || e.key === "d")) {
        setEnabled((on) => {
          const next = !on;
          localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
          return next;
        });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  if (!enabled) return null;

  const Row = ({ k, v, tone }: { k: string; v: React.ReactNode; tone?: "ok" | "warn" | "bad" }) => (
    <div className="flex items-center justify-between gap-3 py-0.5">
      <span className="text-white/60">{k}</span>
      <span
        className={
          tone === "warn"
            ? "text-amber-300"
            : tone === "bad"
              ? "text-red-300"
              : tone === "ok"
                ? "text-emerald-300"
                : "text-white"
        }
      >
        {v}
      </span>
    </div>
  );

  const bool = (b: boolean) => (b ? "true" : "false");

  return (
    <div
      className="pointer-events-auto fixed bottom-3 right-3 z-[9999] max-w-[320px] rounded-lg border border-white/10 bg-black/85 font-mono text-[11px] leading-tight text-white shadow-2xl backdrop-blur"
      style={{ fontVariantNumeric: "tabular-nums" }}
    >
      <button
        onClick={() => setCollapsed((c) => !c)}
        className="flex w-full items-center justify-between gap-2 rounded-t-lg border-b border-white/10 bg-white/5 px-3 py-1.5 text-left"
      >
        <span className="font-semibold uppercase tracking-widest">Auth Debug</span>
        <span className="text-white/50">{collapsed ? "▴" : "▾"}</span>
      </button>
      {!collapsed && (
        <div className="space-y-0.5 px-3 py-2">
          <Row k="loading" v={bool(auth.loading)} tone={auth.loading ? "warn" : "ok"} />
          <Row
            k="sessionLoading"
            v={bool(auth.sessionLoading)}
            tone={auth.sessionLoading ? "warn" : "ok"}
          />
          <Row k="roleLoading" v={bool(auth.roleLoading)} tone={auth.roleLoading ? "warn" : "ok"} />
          <Row
            k="viewAsLoaded"
            v={bool(auth.viewAsLoaded)}
            tone={auth.viewAsLoaded ? "ok" : "warn"}
          />
          <div className="my-1 border-t border-white/10" />
          <Row k="user" v={auth.user?.email ?? auth.user?.id?.slice(0, 8) ?? "—"} />
          <Row
            k="session"
            v={auth.session ? "active" : "none"}
            tone={auth.session ? "ok" : undefined}
          />
          <Row k="isAdmin" v={bool(auth.isAdmin)} tone={auth.isAdmin ? "ok" : undefined} />
          <Row k="viewAs" v={auth.viewAs} />
          <Row k="effectiveRole" v={auth.effectiveRole} />
          <Row
            k="impersonating"
            v={bool(auth.isImpersonating)}
            tone={auth.isImpersonating ? "warn" : undefined}
          />
          <div className="my-1 border-t border-white/10" />
          <Row k="path" v={location.pathname} />
          <div className="mt-2 flex flex-wrap gap-1.5">
            {(["admin", "business", "customer", "visitor"] as const).map((r) => (
              <button
                key={r}
                disabled={!auth.isAdmin}
                onClick={() => auth.setViewAs(r)}
                className="rounded border border-white/20 px-1.5 py-0.5 text-[10px] hover:bg-white/10 disabled:opacity-30"
              >
                {r}
              </button>
            ))}
            <button
              onClick={() => {
                localStorage.setItem(STORAGE_KEY, "0");
                setEnabled(false);
              }}
              className="ml-auto rounded border border-white/20 px-1.5 py-0.5 text-[10px] hover:bg-white/10"
            >
              hide
            </button>
          </div>
          <div className="pt-1 text-[9px] text-white/40">Alt+Shift+D to toggle</div>
        </div>
      )}
    </div>
  );
}
