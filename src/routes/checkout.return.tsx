import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { CheckCircle2, Clock, AlertCircle, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getCheckoutSession } from "@/lib/checkout.functions";
import { getStripeEnvironment } from "@/lib/stripe-env";

export const Route = createFileRoute("/checkout/return")({
  validateSearch: (search: Record<string, unknown>): { session_id?: string } => ({
    session_id: typeof search.session_id === "string" ? search.session_id : undefined,
  }),
  component: CheckoutReturn,
  head: () => ({ meta: [{ title: "Thanks — Confetti" }] }),
});

function formatMoney(amount: number | null, currency: string | null) {
  if (amount == null || !currency) return null;
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: currency.toUpperCase(),
    }).format(amount / 100);
  } catch {
    return `${(amount / 100).toFixed(2)} ${currency.toUpperCase()}`;
  }
}

function formatDate(iso: string | null) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function CheckoutReturn() {
  const { session_id } = Route.useSearch();
  const fetchSession = useServerFn(getCheckoutSession);

  const { data, isLoading, error } = useQuery({
    queryKey: ["checkout-session", session_id],
    enabled: !!session_id,
    queryFn: () =>
      fetchSession({
        data: { sessionId: session_id!, environment: getStripeEnvironment() },
      }),
    retry: 1,
  });

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-lg">
        {!session_id ? (
          <EmptyState />
        ) : isLoading ? (
          <LoadingState />
        ) : error || !data ? (
          <ErrorState message={(error as Error)?.message} />
        ) : (
          <SuccessState data={data} />
        )}
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <Card className="p-8 text-center">
      <Loader2 className="mx-auto h-10 w-10 animate-spin text-primary" />
      <p className="mt-4 text-muted-foreground">Confirming your purchase…</p>
    </Card>
  );
}

function EmptyState() {
  return (
    <Card className="p-8 text-center">
      <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground" />
      <h1 className="mt-4 font-display text-2xl font-bold">No session found</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        If you were just charged, check your email for a receipt.
      </p>
      <Button asChild className="mt-6">
        <Link to="/">Back home</Link>
      </Button>
    </Card>
  );
}

function ErrorState({ message }: { message?: string }) {
  return (
    <Card className="p-8 text-center">
      <AlertCircle className="mx-auto h-12 w-12 text-destructive" />
      <h1 className="mt-4 font-display text-2xl font-bold">We hit a snag</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {message || "Couldn't load your session details."}
      </p>
      <Button asChild className="mt-6">
        <Link to="/">Back home</Link>
      </Button>
    </Card>
  );
}

function SuccessState({ data }: { data: Awaited<ReturnType<typeof getCheckoutSession>> }) {
  const isSub = data.mode === "subscription";
  const isPaid = data.paymentStatus === "paid" || data.paymentStatus === "no_payment_required";
  const isProcessing = data.status === "open";
  const isTrialing = data.subscription?.status === "trialing";
  const total = formatMoney(data.amountTotal, data.currency);

  const headline = isTrialing
    ? "Your trial is live."
    : isPaid
      ? "You're in."
      : isProcessing
        ? "Payment processing…"
        : "Order received.";

  const Icon = isTrialing ? Sparkles : isPaid ? CheckCircle2 : Clock;

  return (
    <Card className="overflow-hidden">
      <div className="bg-primary/5 px-8 py-8 text-center border-b">
        <Icon className="mx-auto h-14 w-14 text-primary" />
        <h1 className="mt-4 font-display text-3xl font-bold">{headline}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {isSub
            ? isTrialing
              ? `Free until ${formatDate(data.subscription?.trialEnd ?? null)}. Cancel anytime before then.`
              : "Your subscription is active. Rewards and unlocks are on your account."
            : "Your purchase is confirmed. Confetti pts and unlocks have been added."}
        </p>
      </div>

      <div className="px-8 py-6 space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Status</span>
          <Badge variant={isPaid ? "default" : "secondary"}>
            {data.subscription?.status ?? data.paymentStatus ?? data.status}
          </Badge>
        </div>

        {data.productName && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Item</span>
            <span className="text-sm font-medium text-right">
              {data.productName}
              {data.quantity && data.quantity > 1 ? ` × ${data.quantity}` : ""}
            </span>
          </div>
        )}

        {data.priceId && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Plan</span>
            <span className="text-sm font-mono">{data.priceId}</span>
          </div>
        )}

        {total && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              {isTrialing ? "Charges after trial" : "Total"}
            </span>
            <span className="text-sm font-semibold">{total}</span>
          </div>
        )}

        {data.subscription?.currentPeriodEnd && !isTrialing && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Renews</span>
            <span className="text-sm">{formatDate(data.subscription.currentPeriodEnd)}</span>
          </div>
        )}

        {data.customerEmail && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Receipt sent to</span>
            <span className="text-sm">{data.customerEmail}</span>
          </div>
        )}
      </div>

      <div className="px-8 py-6 border-t flex flex-col gap-2 sm:flex-row sm:justify-end">
        <Button asChild>
          <Link to="/passport">Go to my Passport</Link>
        </Button>
      </div>
    </Card>
  );
}
