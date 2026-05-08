import { useWizard } from "@/components/wizard/wizard-context";
import { useConfettiBurst } from "@/components/ConfettiBurst";
import { type ReactNode } from "react";

type Props = {
  children: ReactNode;
  className?: string;
  ariaLabel?: string;
};

/** Button that fires a confetti burst then opens the Build-My-Night wizard. */
export function WizardButton({ children, className, ariaLabel }: Props) {
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
          setTimeout(openWizard, 120);
        }}
      >
        {children}
      </button>
      {layer}
    </>
  );
}
