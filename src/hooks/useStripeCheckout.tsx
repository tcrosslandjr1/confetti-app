import { useState, useCallback, lazy, Suspense } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

// Lazy import so @stripe/react-stripe-js + @stripe/stripe-js only enter
// the bundle (in their own chunks) when the user actually opens checkout.
const StripeEmbeddedCheckout = lazy(() =>
  import("@/components/StripeEmbeddedCheckout").then((m) => ({
    default: m.StripeEmbeddedCheckout,
  })),
);

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
          <Suspense fallback={<div className="py-12 text-center text-sm text-muted-foreground">Loading checkout…</div>}>
            <StripeEmbeddedCheckout
              variant={options.variant}
              customerEmail={options.customerEmail}
              returnUrl={options.returnUrl}
            />
          </Suspense>
        )}
      </DialogContent>
    </Dialog>
  );

  return { openCheckout, closeCheckout, isOpen, checkoutElement };
}
