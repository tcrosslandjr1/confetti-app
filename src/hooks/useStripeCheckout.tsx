import { useState, useCallback } from "react";
import { StripeEmbeddedCheckout } from "@/components/StripeEmbeddedCheckout";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type Variant =
  | {
      kind: "price";
      priceId: string;
      quantity?: number;
      accountType?: "user" | "business" | "corporate";
    }
  | { kind: "ticket"; eventId: string; quantity?: number };

interface OpenOptions {
  variant: Variant;
  customerEmail?: string;
  userId?: string;
  returnUrl?: string;
  title?: string;
}

export function useStripeCheckout() {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<OpenOptions | null>(null);

  const openCheckout = useCallback((opts: OpenOptions) => {
    setOptions(opts);
    setIsOpen(true);
  }, []);

  const closeCheckout = useCallback(() => {
    setIsOpen(false);
    setOptions(null);
  }, []);

  const checkoutElement = (
    <Dialog open={isOpen} onOpenChange={(o) => (o ? setIsOpen(o) : closeCheckout())}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{options?.title ?? "Checkout"}</DialogTitle>
        </DialogHeader>
        {options && (
          <StripeEmbeddedCheckout
            variant={options.variant}
            customerEmail={options.customerEmail}
            returnUrl={options.returnUrl}
          />
        )}
      </DialogContent>
    </Dialog>
  );

  return { openCheckout, closeCheckout, isOpen, checkoutElement };
}
