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

export type ViewAs = "admin" | "business" | "customer" | "visitor";
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
  const [sessionLoading, setSessionLoading] = useState(true);
  const [roleLoading, setRoleLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [viewAsState, setViewAsState] = useState<ViewAs | null>(null);
  const [viewAsLoaded, setViewAsLoaded] = useState(false);

  // Keep the selected view stable across preview refreshes so admins don't jump back to /admin.
  useEffect(() => {
    if (typeof window === "undefined") {
      setViewAsLoaded(true);
      return;
    }
    const stored = sessionStorage.getItem(VIEW_KEY) as ViewAs | null;
    if (stored && ["admin", "business", "customer", "visitor"].includes(stored)) {
      setViewAsState(stored);
    }
    setViewAsLoaded(true);
  }, []);

  // Auth state
  useEffect(() => {
    if (typeof window === "undefined") return;
    let initialised = false;
    const { data: sub } = supabase.auth.onAuthStateChange((event, s) => {
      initialised = true;
      setSession(s);
      setSessionLoading(false);
      if (event === "SIGNED_IN") {
        setViewAsState(null);
        // Fire-and-forget: link any pending ?ref= code to this account
        void consumePendingReferralOnSignup();
      } else if (event === "SIGNED_OUT") {
        setViewAsState(null);
      }
    });
    supabase.auth
      .getSession()
      .then(({ data }) => {
        // Only seed from getSession if onAuthStateChange hasn't already fired —
        // otherwise a late getSession can clobber a freshly signed-in session.
        if (!initialised) {
          setSession(data.session);
          setSessionLoading(false);
        }
      })
      .catch(() => {
        if (!initialised) setSessionLoading(false);
      });
    return () => sub.subscription.unsubscribe();
  }, []);

  // Look up admin role whenever the user changes
  useEffect(() => {
    let cancelled = false;
    const uid = session?.user?.id;
    if (!uid) {
      setIsAdmin(false);
      setRoleLoading(false);
      return;
    }
    setRoleLoading(true);
    supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", uid)
      .eq("role", "admin")
      .maybeSingle()
      .then(
        ({ data }) => {
          if (!cancelled) setIsAdmin(!!data);
          if (!cancelled) setRoleLoading(false);
        },
        () => {
          if (!cancelled) {
            setIsAdmin(false);
            setRoleLoading(false);
          }
        },
      );
    return () => {
      cancelled = true;
    };
  }, [session?.user?.id]);

  const setViewAs = useCallback((v: ViewAs) => {
    setViewAsState(v);
    if (typeof window !== "undefined") sessionStorage.setItem(VIEW_KEY, v);
  }, []);

  const exitImpersonation = useCallback(() => {
    setViewAsState(null);
    if (typeof window !== "undefined") sessionStorage.removeItem(VIEW_KEY);
  }, []);

  const signOut = useCallback(async () => {
    if (typeof window !== "undefined") sessionStorage.removeItem(VIEW_KEY);
    setViewAsState(null);
    await supabase.auth.signOut();
  }, []);

  const value = useMemo<AuthCtx>(() => {
    const loading = sessionLoading || roleLoading || !viewAsLoaded;
    const realRole: ViewAs = !session?.user ? "visitor" : isAdmin ? "admin" : "customer";

    // Only admins can impersonate. For everyone else, viewAs = their real role.
    const effective: ViewAs = isAdmin ? (viewAsState ?? "admin") : realRole;
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
  }, [
    session,
    sessionLoading,
    roleLoading,
    viewAsLoaded,
    isAdmin,
    viewAsState,
    setViewAs,
    exitImpersonation,
    signOut,
  ]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useAuth = () => useContext(Ctx);
