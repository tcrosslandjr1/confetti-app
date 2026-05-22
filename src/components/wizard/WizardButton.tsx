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

/** Opens the Build-My-Night wizard. Requires a signed-in user.
 *  Without auth, every wizard run produces venues that can't be saved
 *  to a profile, booked, or learned-from — so we redirect to /auth and
 *  return the user here after sign-in. */
export function WizardButton({ children, className, ariaLabel, preset }: Props) {
  const { openWizard } = useWizard();
  const { burst, layer } = useConfettiBurst();
  const { user, loading } = useAuth();
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
            navigate({ to: "/auth", search: { redirect: location.pathname, mode: "signin" as const } });
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
