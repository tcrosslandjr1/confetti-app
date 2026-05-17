import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  listMyPromoterJobs,
  promoterJobAction,
  submitContent,
} from "@/lib/promoter.functions";

export const Route = createFileRoute("/promoter/jobs")({
  component: PromoterJobsPage,
});

function fmtMoney(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

const STATUS_COLORS: Record<string, string> = {
  offered: "bg-amber-100 text-amber-900",
  accepted: "bg-blue-100 text-blue-900",
  funded: "bg-blue-100 text-blue-900",
  in_progress: "bg-indigo-100 text-indigo-900",
  delivered: "bg-purple-100 text-purple-900",
  verified: "bg-green-100 text-green-900",
  paid: "bg-green-100 text-green-900",
  cancelled: "bg-muted text-muted-foreground",
  refunded: "bg-muted text-muted-foreground",
};

function PromoterJobsPage() {
  const fetchJobs = useServerFn(listMyPromoterJobs);
  const action = useServerFn(promoterJobAction);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["my-promoter-jobs"],
    queryFn: () => fetchJobs(),
  });

  const act = useMutation({
    mutationFn: (vars: { job_id: string; action: "accept" | "decline" | "mark_in_progress" | "cancel" }) =>
      action({ data: vars }),
    onSuccess: () => {
      toast.success("Updated");
      qc.invalidateQueries({ queryKey: ["my-promoter-jobs"] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Failed"),
  });

  if (isLoading) return <div className="py-12 text-center text-muted-foreground">Loading…</div>;
  const jobs = data?.jobs ?? [];

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold">Job inbox</h1>
        <p className="text-muted-foreground">Accept offers, plan the outing with Confetti, and submit your content.</p>
      </header>

      {jobs.length === 0 ? (
        <Card className="p-12 text-center text-muted-foreground">No jobs yet. Once your profile is approved, businesses can hire you.</Card>
      ) : (
        <div className="space-y-3">
          {jobs.map((j: any) => (
            <Card key={j.id} className="p-5 space-y-3">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold">{j.title}</h3>
                    <Badge className={STATUS_COLORS[j.status] ?? ""}>{j.status.replace(/_/g, " ")}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {j.advertisers?.business_name ?? "Business"} · {fmtMoney(j.amount_cents)} ·{" "}
                    Confetti fee {(j.platform_fee_bps / 100).toFixed(1)}% · you net{" "}
                    {fmtMoney(Math.floor(j.amount_cents * (10000 - j.platform_fee_bps) / 10000))}
                  </p>
                </div>
                <div className="flex gap-2">
                  {j.status === "offered" && (
                    <>
                      <Button size="sm" variant="outline" onClick={() => act.mutate({ job_id: j.id, action: "decline" })}>Decline</Button>
                      <Button size="sm" onClick={() => act.mutate({ job_id: j.id, action: "accept" })}>Accept</Button>
                    </>
                  )}
                  {j.status === "accepted" && (
                    <Button size="sm" onClick={() => act.mutate({ job_id: j.id, action: "mark_in_progress" })}>Start work</Button>
                  )}
                </div>
              </div>

              <details className="text-sm">
                <summary className="cursor-pointer text-muted-foreground hover:text-foreground">Brief</summary>
                <p className="mt-2 whitespace-pre-wrap">{j.brief}</p>
              </details>

              {(j.status === "in_progress" || j.status === "accepted") && (
                <SubmitForm jobId={j.id} onDone={() => qc.invalidateQueries({ queryKey: ["my-promoter-jobs"] })} />
              )}

              {j.promoter_submissions?.length > 0 && (
                <div className="border-t pt-3 space-y-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase">Submissions</p>
                  {j.promoter_submissions.map((s: any) => (
                    <div key={s.id} className="flex items-center justify-between gap-3 text-sm">
                      <a href={s.content_url} target="_blank" rel="noreferrer" className="text-primary hover:underline truncate">{s.content_url}</a>
                      <Badge variant="outline">{s.verification_status}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function SubmitForm({ jobId, onDone }: { jobId: string; onDone: () => void }) {
  const submit = useServerFn(submitContent);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    content_url: "",
    platform: "instagram" as "instagram" | "tiktok" | "youtube" | "twitter" | "other",
    caption: "",
    boarding_pass_itinerary_id: "",
    boarding_pass_visible: true,
  });
  const [itineraries, setItineraries] = useState<{ id: string; title: string }[]>([]);

  async function loadItineraries() {
    const { data } = await supabase
      .from("itineraries")
      .select("id, title")
      .order("created_at", { ascending: false })
      .limit(50);
    setItineraries(data ?? []);
  }

  const mut = useMutation({
    mutationFn: () =>
      submit({
        data: {
          job_id: jobId,
          content_url: form.content_url.trim(),
          platform: form.platform,
          caption: form.caption.trim() || null,
          boarding_pass_itinerary_id: form.boarding_pass_itinerary_id,
          boarding_pass_visible: form.boarding_pass_visible,
        },
      }),
    onSuccess: () => {
      toast.success("Submitted for review");
      setOpen(false);
      onDone();
    },
    onError: (e: any) => toast.error(e?.message ?? "Failed"),
  });

  if (!open) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={async () => {
          await loadItineraries();
          setOpen(true);
        }}
      >
        Submit content
      </Button>
    );
  }

  return (
    <div className="border-t pt-4 space-y-3">
      <div className="bg-amber-50 border border-amber-200 rounded p-3 text-sm">
        <strong>Required:</strong> your content must feature your Confetti Boarding Pass on-screen and tag both the venue and @confetti.
      </div>
      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <Label>Content URL</Label>
          <Input value={form.content_url} onChange={(e) => setForm({ ...form, content_url: e.target.value })} placeholder="https://instagram.com/p/…" />
        </div>
        <div>
          <Label>Platform</Label>
          <select
            className="w-full h-10 rounded-md border border-input bg-background px-3"
            value={form.platform}
            onChange={(e) => setForm({ ...form, platform: e.target.value as any })}
          >
            <option value="instagram">Instagram</option>
            <option value="tiktok">TikTok</option>
            <option value="youtube">YouTube</option>
            <option value="twitter">Twitter / X</option>
            <option value="other">Other</option>
          </select>
        </div>
      </div>
      <div>
        <Label>Boarding Pass used for this outing</Label>
        <select
          className="w-full h-10 rounded-md border border-input bg-background px-3"
          value={form.boarding_pass_itinerary_id}
          onChange={(e) => setForm({ ...form, boarding_pass_itinerary_id: e.target.value })}
        >
          <option value="">Select a Confetti trip…</option>
          {itineraries.map((it) => (
            <option key={it.id} value={it.id}>{it.title}</option>
          ))}
        </select>
        {itineraries.length === 0 && (
          <p className="text-xs text-muted-foreground mt-1">
            No trips yet. <Link to="/concierge" className="text-primary underline">Plan one with Confetti</Link>.
          </p>
        )}
      </div>
      <div>
        <Label>Caption (optional)</Label>
        <Textarea rows={3} value={form.caption} onChange={(e) => setForm({ ...form, caption: e.target.value })} />
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={form.boarding_pass_visible}
          onChange={(e) => setForm({ ...form, boarding_pass_visible: e.target.checked })}
        />
        Boarding Pass is clearly visible in the content
      </label>
      <div className="flex gap-2 justify-end">
        <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
        <Button
          onClick={() => mut.mutate()}
          disabled={mut.isPending || !form.content_url || !form.boarding_pass_itinerary_id || !form.boarding_pass_visible}
        >
          {mut.isPending ? "Submitting…" : "Submit for verification"}
        </Button>
      </div>
    </div>
  );
}
