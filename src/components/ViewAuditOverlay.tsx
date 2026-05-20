import { useEffect, useState } from "react";
import { useLocation } from "@tanstack/react-router";
import { clearViewAudit, useViewAudit, type ViewAuditEntry } from "@/lib/view-audit";
import { useAuth } from "@/lib/auth-context";

/**
 * Floating on-screen audit of view-switch / guard / redirect decisions.
 *
 * Shown when ANY of the following is true:
 *   - signed-in real admin (isAdmin)
 *   - URL contains ?audit=1
 *   - localStorage "confetti.view-audit.show" === "1"
 *
 * Toggle: ⌥ + A (alt+A) or click the chip.
 */
export function ViewAuditOverlay() {
  const auth = useAuth();
  const location = useLocation();
  const entries = useViewAudit();
  const [enabled, setEnabled] = useState(false);
  const [open, setOpen] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const forced = params.get("audit") === "1";
    const stored = window.localStorage.getItem("confetti.view-audit.show") === "1";
    setEnabled(forced || stored || auth.isAdmin);
  }, [auth.isAdmin]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    function onKey(e: KeyboardEvent) {
      if (e.altKey && (e.key === "a" || e.key === "A")) {
        setEnabled((v) => {
          const next = !v;
          try {
            window.localStorage.setItem(
              "confetti.view-audit.show",
              next ? "1" : "0",
            );
          } catch {
            /* ignore */
          }
          return next;
        });
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  if (!enabled) return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: 12,
        left: 12,
        zIndex: 2147483600,
        maxWidth: 380,
        width: "calc(100vw - 24px)",
        fontFamily:
          'ui-monospace, "JetBrains Mono", SFMono-Regular, Menlo, monospace',
        fontSize: 11,
        lineHeight: 1.35,
        color: "#1a1a1a",
        background: "rgba(255, 248, 240, 0.96)",
        border: "1px solid rgba(26,26,26,0.18)",
        borderRadius: 12,
        boxShadow: "0 12px 32px -12px rgba(26,26,26,0.35)",
        backdropFilter: "blur(8px)",
        overflow: "hidden",
      }}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
          padding: "8px 10px",
          background: "#1a1a1a",
          color: "#faf8f5",
          border: 0,
          cursor: "pointer",
          textTransform: "uppercase",
          letterSpacing: "0.12em",
          fontSize: 10,
          fontWeight: 700,
        }}
      >
        <span>
          View audit · {entries.length} · {auth.effectiveRole ?? auth.viewAs}
        </span>
        <span style={{ opacity: 0.7 }}>
          {location.pathname}
          {open ? "  ▾" : "  ▸"}
        </span>
      </button>

      {open ? (
        <div style={{ maxHeight: "44vh", overflow: "auto" }}>
          <div
            style={{
              display: "flex",
              gap: 8,
              padding: "6px 10px",
              borderBottom: "1px solid rgba(26,26,26,0.08)",
              background: "rgba(255,122,76,0.08)",
            }}
          >
            <button
              type="button"
              onClick={clearViewAudit}
              style={chipBtn}
            >
              Clear
            </button>
            <button
              type="button"
              onClick={() => {
                try {
                  window.localStorage.setItem(
                    "confetti.view-audit.show",
                    "0",
                  );
                } catch {
                  /* ignore */
                }
                setEnabled(false);
              }}
              style={chipBtn}
            >
              Hide
            </button>
            <span style={{ marginLeft: "auto", opacity: 0.65 }}>
              alt+A to toggle
            </span>
          </div>
          {entries.length === 0 ? (
            <div style={{ padding: 12, opacity: 0.6 }}>
              No view-switch events yet. Navigate to record decisions.
            </div>
          ) : (
            entries.map((e) => <Row key={e.id} entry={e} />)
          )}
        </div>
      ) : null}
    </div>
  );
}

const chipBtn: React.CSSProperties = {
  border: "1px solid rgba(26,26,26,0.25)",
  background: "transparent",
  color: "#1a1a1a",
  padding: "2px 8px",
  borderRadius: 999,
  fontSize: 10,
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  cursor: "pointer",
};

function Row({ entry }: { entry: ViewAuditEntry }) {
  const tone =
    entry.kind === "redirect"
      ? "#b04a1f"
      : entry.kind === "guard"
        ? "#1f5fb0"
        : entry.kind === "view-change"
          ? "#7a4ab0"
          : entry.kind === "auth"
            ? "#1f8a5a"
            : "#1a1a1a";
  const time = new Date(entry.at).toLocaleTimeString(undefined, {
    hour12: false,
    minute: "2-digit",
    second: "2-digit",
  });
  return (
    <div
      style={{
        padding: "8px 10px",
        borderBottom: "1px solid rgba(26,26,26,0.06)",
      }}
    >
      <div style={{ display: "flex", gap: 6, alignItems: "baseline" }}>
        <span style={{ color: tone, fontWeight: 700 }}>{entry.kind}</span>
        <span style={{ opacity: 0.6 }}>· {entry.source}</span>
        <span style={{ marginLeft: "auto", opacity: 0.55 }}>{time}</span>
      </div>
      <div style={{ marginTop: 2 }}>
        {entry.decision ? (
          <span
            style={{
              padding: "1px 6px",
              borderRadius: 4,
              background: tone,
              color: "#faf8f5",
              marginRight: 6,
            }}
          >
            {entry.decision}
          </span>
        ) : null}
        {entry.path ? (
          <span>
            <span style={{ opacity: 0.6 }}>path </span>
            {entry.path}
          </span>
        ) : null}
        {entry.target ? (
          <span>
            <span style={{ opacity: 0.6 }}> → </span>
            <span style={{ color: tone, fontWeight: 600 }}>{entry.target}</span>
          </span>
        ) : null}
      </div>
      <div style={{ opacity: 0.7 }}>
        role={entry.role ?? "—"} · viewAs={entry.viewAs ?? "—"}
        {entry.realRole ? ` · real=${entry.realRole}` : ""}
      </div>
      {entry.reason ? (
        <div style={{ opacity: 0.7, marginTop: 1 }}>↳ {entry.reason}</div>
      ) : null}
    </div>
  );
}
