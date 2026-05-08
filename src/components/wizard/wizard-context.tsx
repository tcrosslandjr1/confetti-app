import { createContext, useCallback, useContext, useState, type ReactNode } from "react";

type Ctx = { open: boolean; openWizard: () => void; closeWizard: () => void };
const WizardCtx = createContext<Ctx | null>(null);

export function WizardProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const openWizard = useCallback(() => setOpen(true), []);
  const closeWizard = useCallback(() => setOpen(false), []);
  return (
    <WizardCtx.Provider value={{ open, openWizard, closeWizard }}>
      {children}
    </WizardCtx.Provider>
  );
}

export function useWizard() {
  const ctx = useContext(WizardCtx);
  if (!ctx) throw new Error("useWizard must be used inside <WizardProvider>");
  return ctx;
}
