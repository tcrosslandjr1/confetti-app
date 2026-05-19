import { createFileRoute, redirect } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { browsePromoters, createJobOffer, listBusinessJobs } from "@/lib/promoter.functions";
import { listMyClaims } from "@/lib/business-onboarding.functions";

export const Route = createFileRoute("/business/promoters")({
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) throw redirect({ to: "/business/login" });
  },
  component: BusinessPromotersPage,
  head: () => ({
    meta: [
      { title: "Hire Promoters — Confetti for Business" },
      {
        name: "description",
        content:
          "Browse vetted food and lifestyle influencers and hire them directly through Confetti.",
      },
    ],
  }),
});

function fmtMoney(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

function BusinessPromotersPage() {
  const fetchPromoters = useServerFn(browsePromoters);
  const fetchJobs = useServerFn(listBusinessJobs);
  const fetchClaims = useServerFn(listMyClaims);
  const hire = useServerFn(createJobOffer);
  const qc = useQueryClient();

  const [filters, setFilters] = useState({ city: "", niche: "", q: "" });
  const [hireTarget, setHireTarget] = useState<any | null>(null);

  const { data: promotersData } = useQuery({
    queryKey: ["browse-promoters", filters],
    queryFn: () => fetchPromoters({ data: filters }),
  });
  const { data: jobsData } = useQuery({
    queryKey: ["business-jobs"],
    queryFn: () => fetchJobs(),
  });
  const { data: claimsData } = useQuery({
    queryKey: ["my-venue-claims"],
    queryFn: () => fetchClaims(),
  });

  const hireMut = useMutation({
    mutationFn: (payload: any) => hire({ data: payload }),
    onSuccess: () => {
      toast.success("Offer sent");
      setHireTarget(null);
      qc.invalidateQueries({ queryKey: ["business-jobs"] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Failed"),
  });

  const promoters = promotersData?.promoters ?? [];
  const jobs = jobsData?.jobs ?? [];

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50/40 via-background to-background">
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        <header>
          <h1 className="text-3xl font-bold">Hire promoters</h1>
          <p className="text-muted-foreground">
            Every review is a Confetti-powered Boarding Pass tour of your venue.
          </p>
        </header>

        {/* Active jobs */}
        {jobs.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-xl font-semibold">Your campaigns</h2>
            <div className="grid sm:grid-cols-2 gap-3">
              {jobs.slice(0, 6).map((j: any) => (
                <Card key={j.id} className="p-4">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="font-medium">{j.title}</div>
                    <Badge variant="outline">{j.status.replace(/_/g, " ")}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {j.promoters?.display_name} · {fmtMoney(j.amount_cents)}
                  </p>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Filters */}
        <Card className="p-4 grid sm:grid-cols-3 gap-3">
          <Input
            placeholder="Search by name…"
            value={filters.q}
            onChange={(e) => setFilters({ ...filters, q: e.target.value })}
          />
          <Input
            placeholder="City"
            value={filters.city}
            onChange={(e) => setFilters({ ...filters, city: e.target.value })}
          />
          <Input
            placeholder="Niche (e.g. food)"
            value={filters.niche}
            onChange={(e) => setFilters({ ...filters, niche: e.target.value })}
          />
        </Card>

        {/* Promoter grid */}
        <section className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {promoters.length === 0 ? (
            <p className="col-span-full text-center text-muted-foreground py-12">
              No promoters match these filters yet.
            </p>
          ) : (
            promoters.map((p: any) => (
              <Card key={p.id} className="p-5 space-y-3">
                <div className="flex items-center gap-3">
                  {p.avatar_url ? (
                    <img
                      src={p.avatar_url}
                      alt=""
                      className="w-12 h-12 rounded-full object-cover"
                     loading="lazy" decoding="async"/>
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-primary/10" />
                  )}
                  <div>
                    <div className="font-semibold">{p.display_name}</div>
                    <div className="text-xs text-muted-foreground">
                      {p.jobs_completed} jobs · {p.rating ?? "—"}★
                    </div>
                  </div>
                </div>
                {p.bio && <p className="text-sm text-muted-foreground line-clamp-3">{p.bio}</p>}
                <div className="flex flex-wrap gap-1">
                  {(p.niche ?? []).slice(0, 4).map((n: string) => (
                    <Badge key={n} variant="secondary" className="text-xs">
                      {n}
                    </Badge>
                  ))}
                </div>
                <div className="text-xs text-muted-foreground">
                  IG {(p.audience?.instagram ?? 0).toLocaleString()} · TT{" "}
                  {(p.audience?.tiktok ?? 0).toLocaleString()}
                </div>
                <div className="text-sm">
                  From{" "}
                  <span className="font-semibold">
                    {fmtMoney(p.rate_card?.post ?? p.rate_card?.reel ?? 0)}
                  </span>{" "}
                  / post
                </div>
                <Button className="w-full" onClick={() => setHireTarget(p)}>
                  Hire
                </Button>
              </Card>
            ))
          )}
        </section>

        {hireTarget && (
          <HireDialog
            promoter={hireTarget}
            advertisers={(claimsData?.claims ?? [])
              .filter((c: any) => c.advertiser_id)
              .map((c: any) => ({ id: c.advertiser_id, name: c.proposed_name ?? c.venue_name }))}
            onClose={() => setHireTarget(null)}
            onSubmit={(payload) => hireMut.mutate(payload)}
            pending={hireMut.isPending}
          />
        )}
      </div>
    </div>
  );
}

function HireDialog({
  promoter,
  advertisers,
  onClose,
  onSubmit,
  pending,
}: {
  promoter: any;
  advertisers: { id: string; name: string }[];
  onClose: () => void;
  onSubmit: (p: any) => void;
  pending: boolean;
}) {
  const [advertiserId, setAdvertiserId] = useState(advertisers[0]?.id ?? "");
  const [title, setTitle] = useState("");
  const [brief, setBrief] = useState("");
  const [amount, setAmount] = useState(
    promoter.rate_card?.reel ?? promoter.rate_card?.post ?? 25000,
  );
  const [deliverableType, setDeliverableType] = useState("reel");
  const [platform, setPlatform] = useState("instagram");

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <Card
        className="max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold">Hire {promoter.display_name}</h2>

        {advertisers.length === 0 ? (
          <p className="text-sm text-amber-700 bg-amber-50 p-3 rounded">
            You need an approved business profile first.
          </p>
        ) : (
          <>
            <div>
              <Label>From business</Label>
              <select
                className="w-full h-10 rounded-md border border-input bg-background px-3"
                value={advertiserId}
                onChange={(e) => setAdvertiserId(e.target.value)}
              >
                {advertisers.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label>Campaign title</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={160} />
            </div>
            <div>
              <Label>Brief</Label>
              <Textarea
                rows={5}
                value={brief}
                onChange={(e) => setBrief(e.target.value)}
                maxLength={4000}
                placeholder="What should the promoter cover? Vibe, dishes to feature, tags, etc."
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Deliverable</Label>
                <select
                  className="w-full h-10 rounded-md border border-input bg-background px-3"
                  value={deliverableType}
                  onChange={(e) => setDeliverableType(e.target.value)}
                >
                  <option value="reel">Reel</option>
                  <option value="post">Post</option>
                  <option value="crawl">Crawl</option>
                  <option value="story">Story</option>
                </select>
              </div>
              <div>
                <Label>Platform</Label>
                <select
                  className="w-full h-10 rounded-md border border-input bg-background px-3"
                  value={platform}
                  onChange={(e) => setPlatform(e.target.value)}
                >
                  <option value="instagram">Instagram</option>
                  <option value="tiktok">TikTok</option>
                  <option value="youtube">YouTube</option>
                </select>
              </div>
            </div>
            <div>
              <Label>Budget ($)</Label>
              <Input
                type="number"
                min={1}
                value={amount / 100}
                onChange={(e) => setAmount(Math.round((+e.target.value || 0) * 100))}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Confetti fee 10% · Promoter receives {fmtMoney(Math.floor(amount * 0.9))}
              </p>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" onClick={onClose}>
                Cancel
              </Button>
              <Button
                disabled={pending || !title || brief.length < 20 || !advertiserId || amount < 100}
                onClick={() =>
                  onSubmit({
                    promoter_id: promoter.id,
                    advertiser_id: advertiserId,
                    title,
                    brief,
                    deliverables: [{ type: deliverableType, platform, description: "" }],
                    amount_cents: amount,
                  })
                }
              >
                {pending ? "Sending…" : "Send offer"}
              </Button>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
