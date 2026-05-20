import { useEffect, useState } from "react";
import { useLocation, useMatches } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-context";

const STORAGE_KEY = "confetti:debug:banner";

/**
 * Slim top debug banner: role · auth · route. One line, always-visible when
 * enabled. Toggle with `?debug=1`, `localStorage["confetti:debug:banner"]="1"`,
 * or Alt+Shift+B. Auto-on in dev.
 */
export function DebugBanner() {
  const auth = useAuth();
  const location = useLocation();
  const matches = useMatches();
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    const fromUrl = url.searchParams.get("debug") === "1";
    const fromStorage = localStorage.getItem(STORAGE_KEY) === "1";
    const isDev = (import.meta as unknown as { env?: { DEV?: boolean } }).env?.DEV;
    if (fromUrl) localStorage.setItem(STORAGE_KEY, "1");
    setEnabled(fromUrl || fromStorage || !!isDev);

    const onKey = (e: KeyboardEvent) => {
      if (e.altKey && e.shiftKey && (e.key === "B" || e.key === "b")) {
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

  const role = auth.effectiveRole ?? auth.viewAs;
  const authState = auth.loading
    ? "loading"
    : auth.user
      ? "signed-in"
      : "anonymous";
  const tone =
    role === "admin"
      ? "#111"
      : role === "business"
        ? "#6d28d9"
        : role === "customer"
          ? "#b04a1f"
          : "#1f5fb0";
  const routeId = matches[matches.length - 1]?.routeId ?? "—";

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 2147483640,
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "4px 10px",
        background: "rgba(255, 248, 240, 0.95)",
        borderBottom: "1px solid rgba(26,26,26,0.18)",
        fontFamily:
          'ui-monospace, "JetBrains Mono", SFMono-Regular, Menlo, monospace',
        fontSize: 10.5,
        lineHeight: 1.4,
        color: "#1a1a1a",
        letterSpacing: "0.04em",
        backdropFilter: "blur(6px)",
        pointerEvents: "auto",
      }}
    >
      <Pill bg={tone} fg="#faf8f5">{role}</Pill>
      <Pill
        bg={authState === "signed-in" ? "#1f8a5a" : authState === "loading" ? "#b07a1f" : "#555"}
        fg="#faf8f5"
      >
        {authState}
      </Pill>
      {auth.isImpersonating ? (
        <Pill bg="#b04a1f" fg="#faf8f5">impersonating</Pill>
      ) : null}
      <span style={{ opacity: 0.65 }}>user</span>
      <span>{auth.user?.email ?? "—"}</span>
      <span style={{ opacity: 0.65 }}>· path</span>
      <span style={{ fontWeight: 600 }}>{location.pathname}</span>
      <span style={{ opacity: 0.5 }}>({routeId})</span>
      <button
        type="button"
        onClick={() => {
          try { localStorage.setItem(STORAGE_KEY, "0"); } catch { /* noop */ }
          setEnabled(false);
        }}
        style={{
          marginLeft: "auto",
          border: "1px solid rgba(26,26,26,0.25)",
          background: "transparent",
          color: "#1a1a1a",
          padding: "1px 8px",
          borderRadius: 999,
          fontSize: 10,
          cursor: "pointer",
        }}
        title="Hide (alt+shift+B to bring back)"
      >
        hide
      </button>
    </div>
  );
}

function Pill({ children, bg, fg }: { children: React.ReactNode; bg: string; fg: string }) {
  return (
    <span
      style={{
        background: bg,
        color: fg,
        padding: "1px 7px",
        borderRadius: 999,
        fontWeight: 700,
        textTransform: "uppercase",
        letterSpacing: "0.1em",
        fontSize: 9.5,
      }}
    >
      {children}
    </span>
  );
}
