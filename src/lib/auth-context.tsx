import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { consumePendingReferralOnSignup } from "@/lib/referrals";

export type ViewAs = "admin" | "customer" | "visitor";
const VIEW_KEY = "concierge.viewAs";

type AuthCtx = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isAdmin: boolean;
  /** "admin" | "customer" | "visitor" — what the user is currently viewing the app AS */
  viewAs: ViewAs;
  /** True when an admin is impersonating another role */
  isImpersonating: boolean;
  /** Effective role — viewAs when admin is impersonating, otherwise their real role */
  effectiveRole: ViewAs;
  setViewAs: (v: ViewAs) => void;
  exitImpersonation: () => void;
  signOut: () => Promise<void>;
};

const Ctx = createContext<AuthCtx>({
  user: null,
  session: null,
  loading: true,
  isAdmin: false,
  viewAs: "visitor",
  isImpersonating: false,
  effectiveRole: "visitor",
  setViewAs: () => {},
  exitImpersonation: () => {},
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [viewAsState, setViewAsState] = useState<ViewAs>("visitor");

  // Load persisted impersonation flag
  useEffect(() => {
    if (typeof window === "undefined") return;
    const v = sessionStorage.getItem(VIEW_KEY);
    if (v === "admin" || v === "customer" || v === "visitor") setViewAsState(v);
  }, []);

  // Auth state
  useEffect(() => {
    if (typeof window === "undefined") return;
    const { data: sub } = supabase.auth.onAuthStateChange((event, s) => {
      setSession(s);
      setLoading(false);
      if (event === "SIGNED_IN") {
        // Fire-and-forget: link any pending ?ref= code to this account
        void consumePendingReferralOnSignup();
      }
    });
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  // Look up admin role whenever the user changes
  useEffect(() => {
    let cancelled = false;
    const uid = session?.user?.id;
    if (!uid) {
      setIsAdmin(false);
      return;
    }
    supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", uid)
      .eq("role", "admin")
      .maybeSingle()
      .then(({ data }) => {
        if (!cancelled) setIsAdmin(!!data);
      });
    return () => {
      cancelled = true;
    };
  }, [session?.user?.id]);

  const setViewAs = useCallback((v: ViewAs) => {
    setViewAsState(v);
    if (typeof window !== "undefined") sessionStorage.setItem(VIEW_KEY, v);
  }, []);

  const exitImpersonation = useCallback(() => {
    setViewAsState("admin");
    if (typeof window !== "undefined") sessionStorage.removeItem(VIEW_KEY);
  }, []);

  const signOut = useCallback(async () => {
    if (typeof window !== "undefined") sessionStorage.removeItem(VIEW_KEY);
    setViewAsState("visitor");
    await supabase.auth.signOut();
  }, []);

  const value = useMemo<AuthCtx>(() => {
    const realRole: ViewAs = !session?.user
      ? "visitor"
      : isAdmin
      ? "admin"
      : "customer";

    // Only admins can impersonate. For everyone else, viewAs = their real role.
    const effective: ViewAs = isAdmin ? viewAsState || "admin" : realRole;
    const impersonating = isAdmin && effective !== "admin";

    return {
      user: session?.user ?? null,
      session,
      loading,
      isAdmin,
      viewAs: effective,
      isImpersonating: impersonating,
      effectiveRole: effective,
      setViewAs,
      exitImpersonation,
      signOut,
    };
  }, [session, loading, isAdmin, viewAsState, setViewAs, exitImpersonation, signOut]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useAuth = () => useContext(Ctx);
