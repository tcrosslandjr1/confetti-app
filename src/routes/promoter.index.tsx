import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { CheckCircle2, Clock, AlertCircle, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { getMyPromoterProfile, upsertMyPromoterProfile } from "@/lib/promoter.functions";

export const Route = createFileRoute("/promoter/")({
  component: PromoterProfilePage,
});

const NICHES = [
  "food",
  "nightlife",
  "lifestyle",
  "cocktails",
  "rooftop",
  "dessert",
  "brunch",
  "fine-dining",
];

function PromoterProfilePage() {
  const fetchProfile = useServerFn(getMyPromoterProfile);
  const saveProfile = useServerFn(upsertMyPromoterProfile);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["my-promoter-profile"],
    queryFn: () => fetchProfile(),
  });

  const promoter = data?.promoter;

  const [form, setForm] = useState({
    display_name: "",
    bio: "",
    avatar_url: "",
    niche: [] as string[],
    cities: [] as string[],
    cityInput: "",
    sampleInput: "",
    sample_links: [] as string[],
    instagram_followers: 0,
    tiktok_followers: 0,
    youtube_followers: 0,
    rate_post_cents: 0,
    rate_reel_cents: 0,
    rate_crawl_cents: 0,
  });

  useEffect(() => {
    if (!promoter) return;
    setForm((f) => ({
      ...f,
      display_name: promoter.display_name ?? "",
      bio: promoter.bio ?? "",
      avatar_url: promoter.avatar_url ?? "",
      niche: promoter.niche ?? [],
      cities: promoter.cities ?? [],
      sample_links: promoter.sample_links ?? [],
      instagram_followers: (promoter.audience as any)?.instagram ?? 0,
      tiktok_followers: (promoter.audience as any)?.tiktok ?? 0,
      youtube_followers: (promoter.audience as any)?.youtube ?? 0,
      rate_post_cents: (promoter.rate_card as any)?.post ?? 0,
      rate_reel_cents: (promoter.rate_card as any)?.reel ?? 0,
      rate_crawl_cents: (promoter.rate_card as any)?.crawl ?? 0,
    }));
  }, [promoter]);

  const save = useMutation({
    mutationFn: () =>
      saveProfile({
        data: {
          display_name: form.display_name.trim(),
          bio: form.bio.trim() || null,
          avatar_url: form.avatar_url.trim() || null,
          niche: form.niche,
          cities: form.cities,
          sample_links: form.sample_links,
          audience: {
            instagram: form.instagram_followers,
            tiktok: form.tiktok_followers,
            youtube: form.youtube_followers,
          },
          rate_card: {
            post: form.rate_post_cents,
            reel: form.rate_reel_cents,
            crawl: form.rate_crawl_cents,
          },
        },
      }),
    onSuccess: () => {
      toast.success("Profile saved");
      qc.invalidateQueries({ queryKey: ["my-promoter-profile"] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Failed to save"),
  });

  if (isLoading) return <div className="py-12 text-center text-muted-foreground">Loading…</div>;

  return (
    <div className="space-y-6">
      <header className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold">Promoter Profile</h1>
          <p className="text-muted-foreground">
            Build your profile so venues can hire you through Confetti.
          </p>
        </div>
        <StatusBadge status={promoter?.status ?? "draft"} />
      </header>

      <Card className="p-6 space-y-4">
        <h2 className="font-semibold">Basics</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <Label>Display name</Label>
            <Input
              value={form.display_name}
              onChange={(e) => setForm({ ...form, display_name: e.target.value })}
              maxLength={120}
            />
          </div>
          <div>
            <Label>Avatar URL</Label>
            <Input
              value={form.avatar_url}
              onChange={(e) => setForm({ ...form, avatar_url: e.target.value })}
              placeholder="https://..."
            />
          </div>
        </div>
        <div>
          <Label>Bio</Label>
          <Textarea
            value={form.bio}
            onChange={(e) => setForm({ ...form, bio: e.target.value })}
            rows={4}
            maxLength={2000}
          />
        </div>
      </Card>

      <Card className="p-6 space-y-3">
        <h2 className="font-semibold">Niches</h2>
        <div className="flex flex-wrap gap-2">
          {NICHES.map((n) => {
            const active = form.niche.includes(n);
            return (
              <button
                key={n}
                type="button"
                onClick={() =>
                  setForm({
                    ...form,
                    niche: active
                      ? form.niche.filter((x) => x !== n)
                      : [...form.niche, n].slice(0, 10),
                  })
                }
                className={`px-3 py-1.5 rounded-full text-sm border ${
                  active
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-border hover:bg-muted"
                }`}
              >
                {n}
              </button>
            );
          })}
        </div>
      </Card>

      <Card className="p-6 space-y-3">
        <h2 className="font-semibold">Cities</h2>
        <div className="flex gap-2">
          <Input
            value={form.cityInput}
            onChange={(e) => setForm({ ...form, cityInput: e.target.value })}
            placeholder="Add a city…"
            onKeyDown={(e) => {
              if (e.key === "Enter" && form.cityInput.trim()) {
                e.preventDefault();
                setForm({
                  ...form,
                  cities: [...form.cities, form.cityInput.trim()].slice(0, 10),
                  cityInput: "",
                });
              }
            }}
          />
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              if (form.cityInput.trim())
                setForm({
                  ...form,
                  cities: [...form.cities, form.cityInput.trim()].slice(0, 10),
                  cityInput: "",
                });
            }}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {form.cities.map((c) => (
            <Badge key={c} variant="secondary" className="gap-1">
              {c}
              <button
                onClick={() => setForm({ ...form, cities: form.cities.filter((x) => x !== c) })}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      </Card>

      <Card className="p-6 space-y-3">
        <h2 className="font-semibold">Audience</h2>
        <div className="grid sm:grid-cols-3 gap-4">
          <div>
            <Label>Instagram followers</Label>
            <Input
              type="number"
              min={0}
              value={form.instagram_followers}
              onChange={(e) => setForm({ ...form, instagram_followers: +e.target.value || 0 })}
            />
          </div>
          <div>
            <Label>TikTok followers</Label>
            <Input
              type="number"
              min={0}
              value={form.tiktok_followers}
              onChange={(e) => setForm({ ...form, tiktok_followers: +e.target.value || 0 })}
            />
          </div>
          <div>
            <Label>YouTube subscribers</Label>
            <Input
              type="number"
              min={0}
              value={form.youtube_followers}
              onChange={(e) => setForm({ ...form, youtube_followers: +e.target.value || 0 })}
            />
          </div>
        </div>
      </Card>

      <Card className="p-6 space-y-3">
        <h2 className="font-semibold">Rate card (USD)</h2>
        <div className="grid sm:grid-cols-3 gap-4">
          <div>
            <Label>Per post ($)</Label>
            <Input
              type="number"
              min={0}
              value={form.rate_post_cents / 100}
              onChange={(e) =>
                setForm({ ...form, rate_post_cents: Math.round((+e.target.value || 0) * 100) })
              }
            />
          </div>
          <div>
            <Label>Per reel ($)</Label>
            <Input
              type="number"
              min={0}
              value={form.rate_reel_cents / 100}
              onChange={(e) =>
                setForm({ ...form, rate_reel_cents: Math.round((+e.target.value || 0) * 100) })
              }
            />
          </div>
          <div>
            <Label>Per crawl ($)</Label>
            <Input
              type="number"
              min={0}
              value={form.rate_crawl_cents / 100}
              onChange={(e) =>
                setForm({ ...form, rate_crawl_cents: Math.round((+e.target.value || 0) * 100) })
              }
            />
          </div>
        </div>
      </Card>

      <Card className="p-6 space-y-3">
        <h2 className="font-semibold">Sample work</h2>
        <div className="flex gap-2">
          <Input
            value={form.sampleInput}
            onChange={(e) => setForm({ ...form, sampleInput: e.target.value })}
            placeholder="https://instagram.com/p/…"
            onKeyDown={(e) => {
              if (e.key === "Enter" && form.sampleInput.trim()) {
                e.preventDefault();
                setForm({
                  ...form,
                  sample_links: [...form.sample_links, form.sampleInput.trim()].slice(0, 20),
                  sampleInput: "",
                });
              }
            }}
          />
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              if (form.sampleInput.trim())
                setForm({
                  ...form,
                  sample_links: [...form.sample_links, form.sampleInput.trim()].slice(0, 20),
                  sampleInput: "",
                });
            }}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <ul className="space-y-1 text-sm">
          {form.sample_links.map((l) => (
            <li key={l} className="flex items-center justify-between gap-2 p-2 bg-muted/40 rounded">
              <a
                href={l}
                target="_blank"
                rel="noreferrer"
                className="truncate text-primary hover:underline"
              >
                {l}
              </a>
              <button
                onClick={() =>
                  setForm({ ...form, sample_links: form.sample_links.filter((x) => x !== l) })
                }
              >
                <X className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      </Card>

      <div className="flex justify-end">
        <Button
          size="lg"
          disabled={save.isPending || !form.display_name.trim()}
          onClick={() => save.mutate()}
        >
          {save.isPending ? "Saving…" : promoter ? "Save changes" : "Submit for review"}
        </Button>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { icon: React.ReactNode; label: string; cls: string }> = {
    draft: {
      icon: <AlertCircle className="h-4 w-4" />,
      label: "Not submitted",
      cls: "bg-muted text-muted-foreground",
    },
    pending: {
      icon: <Clock className="h-4 w-4" />,
      label: "Pending review",
      cls: "bg-amber-100 text-amber-900",
    },
    approved: {
      icon: <CheckCircle2 className="h-4 w-4" />,
      label: "Approved",
      cls: "bg-green-100 text-green-900",
    },
    suspended: {
      icon: <AlertCircle className="h-4 w-4" />,
      label: "Suspended",
      cls: "bg-red-100 text-red-900",
    },
    rejected: {
      icon: <AlertCircle className="h-4 w-4" />,
      label: "Rejected",
      cls: "bg-red-100 text-red-900",
    },
  };
  const v = map[status] ?? map.draft;
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${v.cls}`}
    >
      {v.icon}
      {v.label}
    </span>
  );
}
