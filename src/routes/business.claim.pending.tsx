import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { listMyClaims } from "@/lib/business-onboarding.functions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/business/claim/pending")({
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) throw redirect({ to: "/business/signup" });
  },
  component: PendingPage,
  head: () => ({
    meta: [{ title: "Claim under review — Confetti for Business" }],
  }),
});

const STATUS_COPY: Record<string, { label: string; tone: "default" | "secondary" | "destructive" | "outline" }> = {
  pending: { label: "Pending review", tone: "secondary" },
  needs_more_info: { label: "More info needed", tone: "outline" },
  approved: { label: "Approved", tone: "default" },
  rejected: { label: "Rejected", tone: "destructive" },
};

function PendingPage() {
  const fn = useServerFn(listMyClaims);
  const { data, isLoading } = useQuery({
    queryKey: ["my-business-claims"],
    queryFn: () => fn(),
  });

  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <div className="rounded-2xl border border-border bg-card p-8 text-center">
        <div className="mx-auto mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
          ⏳
        </div>
        <h1 className="text-2xl font-bold">Your claim is under review</h1>
        <p className="mt-2 text-muted-foreground">
          This usually takes 24–48 hours. We'll email you when it's approved or if we
          need more information.
        </p>

        <div className="mt-6 flex justify-center gap-3">
          <Button asChild variant="outline">
            <Link to="/business/claim">Submit another claim</Link>
          </Button>
          <Button asChild>
            <Link to="/business">Back to home</Link>
          </Button>
        </div>
      </div>

      <h2 className="mt-10 text-lg font-semibold">Your claims</h2>
      {isLoading ? (
        <p className="mt-2 text-sm text-muted-foreground">Loading…</p>
      ) : (data?.claims ?? []).length === 0 ? (
        <p className="mt-2 text-sm text-muted-foreground">No claims yet.</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {data!.claims.map((c) => {
            const copy = STATUS_COPY[c.status] ?? { label: c.status, tone: "secondary" as const };
            return (
              <li
                key={c.id}
                className="flex items-center justify-between rounded-xl border border-border bg-card p-4"
              >
                <div>
                  <p className="font-medium">
                    {c.proposed_name ?? (c.venue_id ? "Existing venue" : "Untitled")}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Submitted {new Date(c.created_at).toLocaleDateString()} · via {c.method ?? "—"}
                  </p>
                  {c.admin_notes && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      Note: {c.admin_notes}
                    </p>
                  )}
                </div>
                <Badge variant={copy.tone}>{copy.label}</Badge>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
