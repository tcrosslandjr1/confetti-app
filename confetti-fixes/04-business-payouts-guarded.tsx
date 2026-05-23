/**
 * FIX: Add auth + role guard to business.payouts
 * REPLACE the file at: src/routes/business.payouts.tsx
 *
 * Problem: The payouts page (Stripe vendor onboarding, dashboard links)
 * has ZERO auth check. Any anonymous visitor can access it.
 *
 * Changes:
 * 1. Added useRoleGuard("business") at the top of the component
 * 2. Everything else is unchanged
 *
 * HOW TO APPLY: Open src/routes/business.payouts.tsx in Lovable.
 * Add these two lines near the top of the VendorPayoutsPage function,
 * right after the existing hooks:
 *
 *   import { useRoleGuard } from "@/hooks/useRoleGuard";
 *
 * Then inside VendorPayoutsPage(), add as the FIRST lines:
 *
 *   const guard = useRoleGuard("business");
 *   if (guard) return guard;
 *
 * That's it — the rest of the file stays the same.
 *
 * Full patched version below for reference:
 */
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, AlertCircle, ExternalLink, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  startVendorOnboarding,
  refreshVendorStatus,
  getVendorStatus,
  createVendorDashboardLink,
} from "@/lib/vendor-connect.functions";
import { getStripeEnvironment } from "@/lib/stripe-env";
import { useRoleGuard } from "@/hooks/useRoleGuard";

export const Route = createFileRoute("/business/payouts")({
  component: VendorPayoutsPage,
  validateSearch: (s: Record<string, unknown>): { onboarded?: boolean } => ({
    onboarded: s.onboarded === "true" || s.onboarded === true ? true : undefined,
  }),
});

function VendorPayoutsPage() {
  // ✅ NEW: Auth + role guard — redirects if not logged in or not a business user
  const guard = useRoleGuard("business");
  if (guard) return guard;

  const search = Route.useSearch();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const environment = getStripeEnvironment();

  // ... rest of the existing file stays exactly the same
  // (copy everything from the original file below this line)
}
