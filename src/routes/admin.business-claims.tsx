import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  adminListVenueClaims,
  adminApproveVenueClaim,
  adminRejectVenueClaim,
} from "@/lib/business-onboarding.functions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  CheckCircle2,
  ExternalLink,
  Instagram,
  Mail,
  Music2,
  Building2,
  XCircle,
} from "lucide-react";

export const Route = createFileRoute("/admin/business-claims")({
  head: () => ({ meta: [{ title: "Venue Claims — Admin" }] }),
  component: AdminBusinessClaimsPage,
});

type Status = "pending" | "approved" | "rejected" | "all";

function methodIcon(method: string | null) {
  switch (method) {
    case "social_tiktok":
      return <Music2 className="h-4 w-4" />;
    case "social_instagram":
      return <Instagram className="h-4 w-4" />;
    case "email_domain":
      return <Mail className="h-4 w-4" />;
    default:
      return <Building2 className="h-4 w-4" />;
  }
}

function AdminBusinessClaimsPage() {
  const [status, setStatus] = useState<Status>("pending");
  const list = useServerFn(adminListVenueClaims);
  const approve = useServerFn(adminApproveVenueClaim);
  const reject = useServerFn(adminRejectVenueClaim);
  const qc = useQueryClient();
  const [notes, setNotes] = useState<Record<string, string>>({});

  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-venue-claims", status],
    queryFn: () => list({ data: { status } }),
  });

  const approveMut = useMutation({
    mutationFn: (claimId: string) =>
      approve({ data: { claimId, adminNote: notes[claimId] || undefined } }),
    onSuccess: () => {
      toast.success("Claim approved — venue linked to owner");
      qc.invalidateQueries({ queryKey: ["admin-venue-claims"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const rejectMut = useMutation({
    mutationFn: (claimId: string) => {
      const note = notes[claimId]?.trim();
      if (!note) throw new Error("Reason is required to reject");
      return reject({ data: { claimId, adminNote: note } });
    },
    onSuccess: () => {
      toast.success("Claim rejected");
      qc.invalidateQueries({ queryKey: ["admin-venue-claims"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const claims = data?.claims ?? [];

  return (
    <div className="space-y-6 p-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold text-foreground">Venue claims</h1>
        <p className="text-sm text-muted-foreground">
          Review and verify ownership claims from venues onboarding to Confetti.
        </p>
      </header>

      <div className="flex gap-2">
        {(["pending", "approved", "rejected", "all"] as Status[]).map((s) => (
          <Button
            key={s}
            size="sm"
            variant={status === s ? "default" : "outline"}
            onClick={() => setStatus(s)}
          >
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </Button>
        ))}
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">Loading claims…</p>}
      {error && <p className="text-sm text-destructive">{(error as Error).message}</p>}
      {!isLoading && claims.length === 0 && (
        <p className="text-sm text-muted-foreground">No claims in this view.</p>
      )}

      <div className="space-y-4">
        {claims.map((c) => {
          const venueName = c.venue?.name ?? c.proposed_name ?? "Unlisted venue";
          const isPending = c.status === "pending";
          return (
            <div
              key={c.id}
              className="rounded-xl border border-border bg-card p-5 shadow-sm space-y-4"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-medium text-foreground">{venueName}</h3>
                    <Badge
                      variant={
                        c.status === "approved"
                          ? "default"
                          : c.status === "rejected"
                            ? "destructive"
                            : "secondary"
                      }
                    >
                      {c.status}
                    </Badge>
                    {!c.venue_id && <Badge variant="outline">New venue</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {c.venue?.city ?? c.proposed_city ?? "—"} · Submitted{" "}
                    {new Date(c.created_at).toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Claimant: {c.claimant?.display_name ?? c.user_id?.slice(0, 8) ?? "—"}
                  </p>
                </div>
                {c.venue?.hero_image_url && (
                  <img
                    src={c.venue.hero_image_url}
                    alt=""
                    className="h-20 w-20 rounded-lg object-cover"
                  />
                )}
              </div>

              <div className="rounded-lg bg-muted/40 p-3 text-sm space-y-2">
                <div className="flex items-center gap-2 text-foreground">
                  {methodIcon(c.method)}
                  <span className="font-medium capitalize">
                    {c.method?.replace("_", " ") ?? "—"}
                  </span>
                </div>
                {c.evidence_handle && (
                  <p className="text-muted-foreground">Handle: @{c.evidence_handle}</p>
                )}
                {c.evidence_url && (
                  <a
                    href={c.evidence_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-primary hover:underline"
                  >
                    Evidence link <ExternalLink className="h-3 w-3" />
                  </a>
                )}
                {c.evidence_email && (
                  <p className="text-muted-foreground">Email: {c.evidence_email}</p>
                )}
                {c.notes && <p className="text-muted-foreground italic">"{c.notes}"</p>}
                {c.admin_note && c.status !== "pending" && (
                  <p className="text-foreground">
                    <span className="font-medium">Admin note:</span> {c.admin_note}
                  </p>
                )}
              </div>

              {isPending && (
                <div className="space-y-2">
                  <Textarea
                    placeholder="Admin note (required to reject)"
                    value={notes[c.id] ?? ""}
                    onChange={(e) => setNotes((n) => ({ ...n, [c.id]: e.target.value }))}
                    rows={2}
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => approveMut.mutate(c.id)}
                      disabled={approveMut.isPending}
                    >
                      <CheckCircle2 className="mr-1 h-4 w-4" /> Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => rejectMut.mutate(c.id)}
                      disabled={rejectMut.isPending}
                    >
                      <XCircle className="mr-1 h-4 w-4" /> Reject
                    </Button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
