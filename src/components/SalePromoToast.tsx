import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";

const SHOWN_KEY = "sale-promo-toast-shown";

/**
 * One-time launch-week promo toast for unauthenticated visitors.
 * Encourages signup with a clear CTA. Shown once per browser session.
 */
export function SalePromoToast() {
  const { user, sessionLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (sessionLoading) return;
    if (user) return;
    if (sessionStorage.getItem(SHOWN_KEY)) return;

    const t = window.setTimeout(() => {
      sessionStorage.setItem(SHOWN_KEY, "1");
      toast("🎉 Launch week is live", {
        description:
          "Sign up free and your first night plan unlocks 200 Confetti pts + a complimentary boarding pass.",
        duration: 12000,
        position: "top-center",
        action: {
          label: "Claim",
          onClick: () =>
            navigate({
              to: "/auth",
              search: { mode: "signup", redirect: "/new/plan" },
            }),
        },
      });
    }, 2500);

    return () => window.clearTimeout(t);
  }, [user, sessionLoading, navigate]);

  return null;
}
