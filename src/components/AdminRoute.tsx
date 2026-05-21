import { useEffect, useState, type ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { getAdminLevel, type AdminLevel } from "../lib/auth";

type GuardState =
  | { status: "loading" }
  | { status: "denied" }
  | { status: "allowed"; level: AdminLevel };

interface AdminRouteProps {
  children: ReactNode;
  /** Minimum role required. Defaults to "support" (lowest admin tier). */
  require?: Exclude<AdminLevel, "none">;
}

const RANK: Record<AdminLevel, number> = {
  none: 0,
  support: 1,
  manager: 2,
  owner: 3,
};

export default function AdminRoute({ children, require = "support" }: AdminRouteProps) {
  const [state, setState] = useState<GuardState>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const level = await getAdminLevel();
        if (cancelled) return;
        if (RANK[level] >= RANK[require]) {
          setState({ status: "allowed", level });
        } else {
          setState({ status: "denied" });
        }
      } catch {
        if (!cancelled) setState({ status: "denied" });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [require]);

  if (state.status === "loading") {
    return (
      <div
        style={{
          padding: 32,
          color: "#fff",
          fontFamily: "system-ui, sans-serif",
          textAlign: "center",
        }}
      >
        Checking access…
      </div>
    );
  }

  if (state.status === "denied") {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
