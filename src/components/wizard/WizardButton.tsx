import { useWizard, type WizardPreset } from "@/components/wizard/wizard-context";
import { useConfettiBurst } from "@/components/ConfettiBurst";
import { useAuth } from "@/lib/auth-context";
import { useNavigate, useLocation } from "@tanstack/react-router";
import { toast } from "sonner";
import { type ReactNode } from "react";

type Props = {
  children: ReactNode;
  className?: string;
  ariaLabel?: string;
  preset?: WizardPreset;
};

/** Opens the Build-My-Night wizard. Requires a signed-in customer.
 *  Without auth, every wizard run produces venues that can't be saved
 *  to a profile, booked, or learned-from — so we redirect to /auth and
 *  return the user here after sign-in.
 *  Admin/business/visitor roles are blocked. */
export function WizardButton({ children, className, ariaLabel, preset }: Props) {
  const { openWizard } = useWizard();
  const { burst, layer } = useConfettiBurst();
  const { user, loading, effectiveRole } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <>
      <button
        type="button"
        aria-label={ariaLabel}
        className={className}
        onClick={(e) => {
          // Don't fight the auth context while it's still resolving — just no-op.
          if (loading) return;
          if (!user) {
            toast.message("Sign in to build your night", {
              description: "Your plan saves to your profile so AI can learn your taste.",
            });
            navigate({
              to: "/auth",
              search: { redirect: location.pathname, mode: "signin" as const },
            });
            return;
          }
          // Only customers can use the wizard — admin/business/visitor get a toast
          if (effectiveRole !== "customer") {
            toast.message("Switch to Customer view to plan a night", {
              description: "The wizard is only available in customer mode.",
            });
            return;
          }
          burst(e.clientX, e.clientY);
          setTimeout(() => openWizard(preset), 120);
        }}
      >
        {children}
      </button>
      {layer}
    </>
  );
}
