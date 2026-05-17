import { useStripeCheckout } from "@/hooks/useStripeCheckout";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Ticket } from "lucide-react";

interface Props {
  eventId: string;
  eventTitle?: string;
  priceCents?: number | null;
  currency?: string | null;
  ticketsEnabled?: boolean | null;
  quantity?: number;
  className?: string;
  variant?: "default" | "outline" | "secondary";
  size?: "default" | "sm" | "lg";
}

export function BuyTicketButton({
  eventId,
  eventTitle,
  priceCents,
  currency,
  ticketsEnabled,
  quantity = 1,
  className,
  variant = "default",
  size = "default",
}: Props) {
  const { user } = useAuth();
  const { openCheckout, checkoutElement } = useStripeCheckout();

  if (!ticketsEnabled || !priceCents || priceCents < 50) return null;

  const price = (priceCents / 100).toLocaleString(undefined, {
    style: "currency",
    currency: (currency || "usd").toUpperCase(),
  });

  const onClick = () => {
    if (!user) {
      window.location.href = `/auth?next=${encodeURIComponent(window.location.pathname)}`;
      return;
    }
    openCheckout({
      variant: { kind: "ticket", eventId, quantity },
      customerEmail: user.email ?? undefined,
      userId: user.id,
      title: eventTitle ? `Tickets — ${eventTitle}` : "Buy ticket",
    });
  };

  return (
    <>
      <Button onClick={onClick} variant={variant} size={size} className={className}>
        <Ticket className="mr-2 h-4 w-4" />
        Buy ticket — {price}
      </Button>
      {checkoutElement}
    </>
  );
}
