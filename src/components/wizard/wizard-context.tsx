import { createContext, useCallback, useContext, useState, type ReactNode } from "react";

export type WizardPresetStop = { time: string; venue: string; vibe?: string; tone?: string; walk?: string };
export type WizardPreset = {
  title: string;
  vibeKeys?: string[];
  vibeLabel?: string;
  crewLabel?: string;
  budgetLabel?: string;
  stops: WizardPresetStop[];
};

type Ctx = {
  open: boolean;
  preset: WizardPreset | null;
  openWizard: (preset?: WizardPreset) => void;
  closeWizard: () => void;
};
const WizardCtx = createContext<Ctx | null>(null);

export function WizardProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [preset, setPreset] = useState<WizardPreset | null>(null);
  const openWizard = useCallback((p?: WizardPreset) => {
    setPreset(p ?? null);
    setOpen(true);
  }, []);
  const closeWizard = useCallback(() => setOpen(false), []);
  return (
    <WizardCtx.Provider value={{ open, preset, openWizard, closeWizard }}>
      {children}
    </WizardCtx.Provider>
  );
}

export function useWizard() {
  const ctx = useContext(WizardCtx);
  if (!ctx) throw new Error("useWizard must be used inside <WizardProvider>");
  return ctx;
}
