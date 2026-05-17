import { createFileRoute, redirect } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  adminListPendingSubmissions,
  adminVerifySubmission,
  adminListPromoters,
  adminSetPromoterStatus,
} from "@/lib/promoter.functions";

export const Route = createFileRoute("/admin/promoters")({
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) throw redirect({ to: "/admin/login" });
  },
  component: AdminPromotersPage,
  head: () => ({ meta: [{ title: "Promoter Verification — Admin" }] }),
});

function fmt(c: number) {
  return `$${(c / 100).toFixed(2)}`;
}

function AdminPromotersPage() {
  const fetchSubs = useServerFn(adminListPendingSubmissions);
  const fetchPromoters = useServerFn(adminListPromoters);
  const verify = useServerFn(adminVerifySubmission);
  const setStatus = useServerFn(adminSetPromoterStatus);
  const qc = useQueryClient();

  const { data: subsData } = useQuery({
    queryKey: ["admin-promoter-subs"],
    queryFn: () => fetchSubs(),
  });
  const { data: pData } = useQuery({
    queryKey: ["admin-promoters"],
    queryFn: () => fetchPromoters(),
  });

  const verifyMut = useMutation({
    mutationFn: (v: any) => verify({ data: v }),
    onSuccess: () => {
      toast.success("Verified");
      qc.invalidateQueries({ queryKey: ["admin-promoter-subs"] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Failed"),
  });
  const statusMut = useMutation({
    mutationFn: (v: any) => setStatus({ data: v }),
    onSuccess: () => {
      toast.success("Updated");
      qc.invalidateQueries({ queryKey: ["admin-promoters"] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Failed"),
  });

  const subs = subsData?.submissions ?? [];
  const promoters = pData?.promoters ?? [];

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      <header>
        <h1 className="text-3xl font-bold">Promoter verification</h1>
        <p className="text-muted-foreground">
          Approve promoter profiles and verify content deliverables.
        </p>
      </header>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Pending submissions ({subs.length})</h2>
        {subs.length === 0 && (
          <Card className="p-8 text-center text-muted-foreground">All caught up.</Card>
        )}
        {subs.map((s: any) => {
          const job = s.promoter_jobs;
          return (
            <Card key={s.id} className="p-5 space-y-3">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div>
                  <div className="font-semibold">{job?.title}</div>
                  <div className="text-sm text-muted-foreground">
                    {job?.promoters?.display_name} → {job?.advertisers?.business_name} ·{" "}
                    {fmt(job?.amount_cents ?? 0)}
                  </div>
                </div>
                <Badge variant={s.boarding_pass_visible ? "default" : "destructive"}>
                  Boarding pass {s.boarding_pass_visible ? "visible" : "MISSING"}
                </Badge>
              </div>
              <a
                href={s.content_url}
                target="_blank"
                rel="noreferrer"
                className="text-primary hover:underline text-sm break-all"
              >
                {s.content_url}
              </a>
              <VerifyControls
                onDecide={(decision, notes) =>
                  verifyMut.mutate({ submission_id: s.id, decision, review_notes: notes })
                }
                pending={verifyMut.isPending}
              />
            </Card>
          );
        })}
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Promoter profiles</h2>
        <div className="grid sm:grid-cols-2 gap-3">
          {promoters.map((p: any) => (
            <Card key={p.id} className="p-4">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="font-medium">{p.display_name}</div>
                <Badge variant="outline">{p.status}</Badge>
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {(p.cities ?? []).join(", ")} · {(p.niche ?? []).join(", ")}
              </div>
              <div className="flex gap-2 mt-3">
                {p.status !== "approved" && (
                  <Button
                    size="sm"
                    onClick={() => statusMut.mutate({ promoter_id: p.id, status: "approved" })}
                  >
                    Approve
                  </Button>
                )}
                {p.status !== "rejected" && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => statusMut.mutate({ promoter_id: p.id, status: "rejected" })}
                  >
                    Reject
                  </Button>
                )}
                {p.status !== "suspended" && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => statusMut.mutate({ promoter_id: p.id, status: "suspended" })}
                  >
                    Suspend
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}

function VerifyControls({
  onDecide,
  pending,
}: {
  onDecide: (d: "approved" | "rejected" | "needs_revision", notes: string) => void;
  pending: boolean;
}) {
  const [notes, setNotes] = useState("");
  return (
    <div className="space-y-2">
      <Textarea
        placeholder="Review notes (optional)"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        rows={2}
      />
      <div className="flex gap-2 justify-end">
        <Button
          size="sm"
          variant="outline"
          disabled={pending}
          onClick={() => onDecide("needs_revision", notes)}
        >
          Needs revision
        </Button>
        <Button
          size="sm"
          variant="destructive"
          disabled={pending}
          onClick={() => onDecide("rejected", notes)}
        >
          Reject
        </Button>
        <Button size="sm" disabled={pending} onClick={() => onDecide("approved", notes)}>
          Approve & release payout
        </Button>
      </div>
    </div>
  );
}
