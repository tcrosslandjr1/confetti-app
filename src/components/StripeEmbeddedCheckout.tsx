import { EmbeddedCheckoutProvider, EmbeddedCheckout } from "@stripe/react-stripe-js";
import { getStripe, getStripeEnvironment } from "@/lib/stripe";
import { createCheckoutSession, createTicketCheckout } from "@/lib/checkout.functions";

type Variant =
  | {
      kind: "price";
      priceId: string;
      quantity?: number;
      accountType?: "user" | "business" | "corporate";
    }
  | { kind: "ticket"; eventId: string; quantity?: number };

interface Props {
  variant: Variant;
  customerEmail?: string;
  userId?: string;
  returnUrl?: string;
}

export function StripeEmbeddedCheckout({ variant, customerEmail, userId, returnUrl }: Props) {
  const fetchClientSecret = async (): Promise<string> => {
    const url =
      returnUrl ?? `${window.location.origin}/checkout/return?session_id={CHECKOUT_SESSION_ID}`;
    const environment = getStripeEnvironment();
    if (variant.kind === "ticket") {
      const secret = await createTicketCheckout({
        data: {
          eventId: variant.eventId,
          quantity: variant.quantity ?? 1,
          returnUrl: url,
          environment,
        },
      });
      if (!secret) throw new Error("Could not start checkout");
      return secret;
    }
    const secret = await createCheckoutSession({
      data: {
        priceId: variant.priceId as never,
        quantity: variant.quantity,
        customerEmail,
        userId,
        accountType: variant.accountType,
        returnUrl: url,
        environment,
      },
    });
    if (!secret) throw new Error("Could not start checkout");
    return secret;
  };

  return (
    <div id="checkout" className="min-h-[600px]">
      <EmbeddedCheckoutProvider stripe={getStripe()} options={{ fetchClientSecret }}>
        <EmbeddedCheckout />
      </EmbeddedCheckoutProvider>
    </div>
  );
}
