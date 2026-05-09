import { useWizard, type WizardPreset } from "@/components/wizard/wizard-context";
import { useConfettiBurst } from "@/components/ConfettiBurst";
import { useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";
import { type ReactNode } from "react";

type Props = {
  children: ReactNode;
  className?: string;
  ariaLabel?: string;
  preset?: WizardPreset;
};

/** Button that fires a confetti burst then opens the Build-My-Night wizard.
 *  Visitors are redirected to /auth — the wizard is a customer feature. */
export function WizardButton({ children, className, ariaLabel, preset }: Props) {
  const { openWizard } = useWizard();
  const { burst, layer } = useConfettiBurst();
  const { viewAs } = useAuth();
  const navigate = useNavigate();

  return (
    <>
      <button
        type="button"
        aria-label={ariaLabel}
        className={className}
        onClick={(e) => {
          burst(e.clientX, e.clientY);
          if (viewAs === "visitor") {
            toast("Sign up free to build your night", {
              description: "We'll save your picks and unlock real reservations.",
            });
            setTimeout(() => navigate({ to: "/auth" }), 200);
            return;
          }
          setTimeout(() => openWizard(preset), 120);
        }}
      >
        {children}
      </button>
      {layer}
    </>
  );
}
