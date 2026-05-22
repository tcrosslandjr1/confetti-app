import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { requireBusinessOwner } from "@/lib/business-guard";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, AlertCircle, ExternalLink, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import {
  startVendorOnboarding,
  refreshVendorStatus,
  getVendorStatus,
  createVendorDashboardLink,
} from "@/lib/vendor-connect.functions";
import { getStripeEnvironment } from "@/lib/stripe-env";

export const Route = createFileRoute("/business/payouts")({
  beforeLoad: async () => {
    await requireBusinessOwner();
  },
  component: VendorPayoutsPage,
  validateSearch: (s: Record<string, unknown>): { onboarded?: boolean } => ({
    onboarded: s.onboarded === "true" || s.onboarded === true ? true : undefined,
  }),
});

function VendorPayoutsPage() {
  const { ready } = useRequireAuth();
  const search = Route.useSearch();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const environment = getStripeEnvironment();

  if (!ready) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const getStatus = useServerFn(getVendorStatus);
  const startOnboarding = useServerFn(startVendorOnboarding);
  const refresh = useServerFn(refreshVendorStatus);
  const dashboardLink = useServerFn(createVendorDashboardLink);

  const { data, isLoading } = useQuery({
    queryKey: ["vendor-status", environment],
    queryFn: () => getStatus({ data: { environment } }),
  });

  // Auto-refresh after returning from Stripe onboarding
  const refreshMutation = useMutation({
    mutationFn: () => refresh({ data: { environment } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["vendor-status", environment] }),
  });

  useEffect(() => {
    if (search.onboarded) {
      refreshMutation.mutate();
      navigate({ to: "/business/payouts", search: {}, replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search.onboarded]);

  const startMutation = useMutation({
    mutationFn: async (vendorType: "venue" | "promoter" | "partner" | "corporate_host") => {
      const origin = window.location.origin;
      return startOnboarding({
        data: {
          vendorType,
          environment,
          returnUrl: `${origin}/business/payouts?onboarded=true`,
          refreshUrl: `${origin}/business/payouts`,
          country: "US",
        },
      });
    },
    onSuccess: ({ url }) => {
      window.location.href = url;
    },
    onError: (e: any) => toast.error(e?.message || "Could not start onboarding"),
  });

  const openDashboard = useMutation({
    mutationFn: () => dashboardLink({ data: { environment } }),
    onSuccess: ({ url }) => window.open(url, "_blank"),
    onError: (e: any) => toast.error(e?.message || "Could not open dashboard"),
  });

  const vendor = data?.vendor as any;
  const verified = vendor?.charges_enabled && vendor?.payouts_enabled && vendor?.details_submitted;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 space-y-6">
      <header className="space-y-1">
        <h1 className="text-3xl font-semibold tracking-tight">Payouts &amp; Verification</h1>
        <p className="text-muted-foreground">
          Connect with Stripe to receive payouts from bookings, sponsored picks, and promoter jobs.
        </p>
      </header>

      {isLoading ? (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="size-4 animate-spin" /> Loading status…
        </div>
      ) : !vendor ? (
        <Card>
          <CardHeader>
            <CardTitle>Get paid through Confetti</CardTitle>
            <CardDescription>
              Choose how you operate. Stripe will collect your details — usually under 5 minutes.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            {(
              [
                { id: "venue", label: "Venue / Restaurant" },
                { id: "promoter", label: "Promoter / Creator" },
                { id: "partner", label: "Partner / Operator" },
                { id: "corporate_host", label: "Corporate Host" },
              ] as const
            ).map((opt) => (
              <Button
                key={opt.id}
                variant="outline"
                size="lg"
                className="justify-between"
                disabled={startMutation.isPending}
                onClick={() => startMutation.mutate(opt.id)}
              >
                {opt.label} <ExternalLink className="size-4" />
              </Button>
            ))}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader className="flex flex-row items-start justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                Stripe Connect
                {verified ? (
                  <Badge className="bg-emerald-600 hover:bg-emerald-600">Verified</Badge>
                ) : (
                  <Badge variant="secondary">Action needed</Badge>
                )}
              </CardTitle>
              <CardDescription className="capitalize">
                {vendor.vendor_type.replace("_", " ")} · {environment}
              </CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => refreshMutation.mutate()}
              disabled={refreshMutation.isPending}
            >
              {refreshMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : "Refresh"}
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <ul className="space-y-2 text-sm">
              <StatusRow label="Details submitted" ok={vendor.details_submitted} />
              <StatusRow label="Charges enabled" ok={vendor.charges_enabled} />
              <StatusRow label="Payouts enabled" ok={vendor.payouts_enabled} />
            </ul>

            <div className="flex flex-wrap gap-2 pt-2">
              {!verified && (
                <Button
                  onClick={() => startMutation.mutate(vendor.vendor_type)}
                  disabled={startMutation.isPending}
                >
                  {startMutation.isPending ? (
                    <>
                      <Loader2 className="size-4 animate-spin mr-2" /> Opening Stripe…
                    </>
                  ) : (
                    <>
                      Complete onboarding <ExternalLink className="size-4 ml-2" />
                    </>
                  )}
                </Button>
              )}
              {verified && (
                <Button
                  variant="outline"
                  onClick={() => openDashboard.mutate()}
                  disabled={openDashboard.isPending}
                >
                  Open Stripe dashboard <ExternalLink className="size-4 ml-2" />
                </Button>
              )}
            </div>

            <p className="text-xs text-muted-foreground pt-2">
              Stripe account: <code className="font-mono">{vendor.stripe_account_id}</code>
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function StatusRow({ label, ok }: { label: string; ok: boolean }) {
  return (
    <li className="flex items-center justify-between">
      <span>{label}</span>
      {ok ? (
        <span className="flex items-center gap-1 text-emerald-600 text-sm">
          <CheckCircle2 className="size-4" /> Done
        </span>
      ) : (
        <span className="flex items-center gap-1 text-amber-600 text-sm">
          <AlertCircle className="size-4" /> Pending
        </span>
      )}
    </li>
  );
}
