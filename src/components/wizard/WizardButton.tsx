import { useWizard, type WizardPreset } from "@/components/wizard/wizard-context";
import { useConfettiBurst } from "@/components/ConfettiBurst";
import { type ReactNode } from "react";

type Props = {
  children: ReactNode;
  className?: string;
  ariaLabel?: string;
  preset?: WizardPreset;
};

/** Button that fires a confetti burst then opens the Build-My-Night wizard.
 *  Open to everyone — sign-in is only required when saving or booking. */
export function WizardButton({ children, className, ariaLabel, preset }: Props) {
  const { openWizard } = useWizard();
  const { burst, layer } = useConfettiBurst();

  return (
    <>
      <button
        type="button"
        aria-label={ariaLabel}
        className={className}
        onClick={(e) => {
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
