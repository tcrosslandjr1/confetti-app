import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Megaphone, Crown, Zap, Star, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useManagedVenues, VenueSwitcher, NoVenueClaim } from "@/components/business/useManagedVenue";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useStripeCheckout } from "@/hooks/useStripeCheckout";

export const Route = createFileRoute("/business/ads")({
  beforeLoad: async () => {
    const { requireBusinessAccess } = await import("@/lib/business-guards");
    await requireBusinessAccess();
  },
  component: AdsPage,
  head: () => ({
    meta: [
      { title: "Ads & subscription — Confetti for Business" },
      { name: "description", content: "Pick a Confetti plan and boost your venue at the moments that matter." },
    ],
  }),
});

const TIERS = [
  {
    id: "starter",
    name: "Silver",
    price: "$49 / mo",
    icon: Star,
    perks: ["Verified badge", "Direct bookings", "Basic analytics", "Confetti pts redemption"],
  },
  {
    id: "featured",
    name: "Gold",
    price: "$149 / mo",
    icon: Zap,
    perks: ["Everything in Silver", "Boost in AI plans", "Order-ahead", "Event promotion"],
    popular: true,
  },
  {
    id: "spotlight",
    name: "Platinum",
    price: "$399 / mo",
    icon: Crown,
    perks: ["Everything in Gold", "Top placement", "Promoter marketplace", "2× Confetti points"],
  },
];

type Package = {
  id: string;
  name: string;
  description: string | null;
  tier: string;
  duration_hours: number;
  price_cents: number;
};

type Purchase = {
  id: string;
  package_id: string;
  amount_cents: number;
  status: string;
  starts_at: string | null;
  ends_at: string | null;
  created_at: string;
};

function AdsPage() {
  const { venues, activeId, setActiveId, isLoading } = useManagedVenues();
  const qc = useQueryClient();

  const sub = useQuery({
    queryKey: ["advertiser-subscription"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return null;
      const { data: adv } = await (supabase as any)
        .from("advertisers").select("id").eq("owner_id", u.user.id).maybeSingle();
      if (!adv?.id) return null;
      const { data } = await (supabase as any)
        .from("advertiser_subscriptions")
        .select("tier, status, current_period_end, advertiser_id")
        .eq("advertiser_id", adv.id)
        .maybeSingle();
      return data ?? { advertiser_id: adv.id, tier: null, status: "inactive" };
    },
  });

  const packages = useQuery({
    queryKey: ["boost-packages"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("boost_packages").select("*").eq("active", true).order("price_cents");
      if (error) throw new Error(error.message);
      return (data ?? []) as Package[];
    },
  });

  const purchases = useQuery({
    queryKey: ["boost-purchases", activeId],
    enabled: !!activeId,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("boost_purchases")
        .select("id, package_id, amount_cents, status, starts_at, ends_at, created_at")
        .eq("venue_id", activeId)
        .order("created_at", { ascending: false })
        .limit(10);
      if (error) throw new Error(error.message);
      return (data ?? []) as Purchase[];
    },
  });

  const upgrade = useMutation({
    mutationFn: async (tier: string) => {
      const advertiserId = sub.data?.advertiser_id;
      if (!advertiserId) throw new Error("Claim a venue first");
      const { error } = await (supabase as any)
        .from("advertiser_subscriptions")
        .upsert({
          advertiser_id: advertiserId,
          tier,
          status: "active",
          current_period_end: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString(),
          stub: true,
        }, { onConflict: "advertiser_id" });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      toast.success("Plan updated. Stripe checkout coming soon.");
      qc.invalidateQueries({ queryKey: ["advertiser-subscription"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const buyBoost = useMutation({
    mutationFn: async (pkg: Package) => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) throw new Error("Sign in first");
      const advertiserId = sub.data?.advertiser_id ?? null;
      const starts = new Date();
      const ends = new Date(starts.getTime() + pkg.duration_hours * 3600 * 1000);
      const { error } = await (supabase as any).from("boost_purchases").insert({
        advertiser_id: advertiserId,
        venue_id: activeId,
        package_id: pkg.id,
        amount_cents: pkg.price_cents,
        status: "pending",
        starts_at: starts.toISOString(),
        ends_at: ends.toISOString(),
        created_by: u.user.id,
      });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      toast.success("Boost queued. Stripe checkout coming soon.");
      qc.invalidateQueries({ queryKey: ["boost-purchases", activeId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading) return <Shell>Loading…</Shell>;
  if (!venues.length) return <Shell><NoVenueClaim /></Shell>;

  const currentTier = sub.data?.tier as string | null | undefined;

  return (
    <Shell>
      <div className="flex items-center gap-3">
        <Link to="/business/dashboard" className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-bold">Ads & subscription</h1>
        <VenueSwitcher venues={venues} activeId={activeId} onChange={setActiveId} />
      </div>

      {/* Subscription tiers */}
      <section className="mt-6">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Monthly plan
        </h2>
        <div className="grid gap-4 md:grid-cols-3">
          {TIERS.map((t) => {
            const Icon = t.icon;
            const active = currentTier === t.id;
            return (
              <Card
                key={t.id}
                className={`relative p-5 ${active ? "border-primary ring-2 ring-primary/30" : ""}`}
              >
                {t.popular && (
                  <Badge className="absolute -top-2 right-4 bg-amber-500 text-white">Popular</Badge>
                )}
                <div className="flex items-center gap-2">
                  <Icon className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-semibold">{t.name}</h3>
                </div>
                <div className="mt-1 text-2xl font-bold">{t.price}</div>
                <ul className="mt-3 space-y-1.5 text-sm">
                  {t.perks.map((p) => (
                    <li key={p} className="flex items-start gap-2">
                      <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-500" /> {p}
                    </li>
                  ))}
                </ul>
                <Button
                  className="mt-4 w-full"
                  variant={active ? "outline" : "default"}
                  disabled={active || upgrade.isPending}
                  onClick={() => upgrade.mutate(t.id)}
                >
                  {active ? "Current plan" : "Switch to " + t.name}
                </Button>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Pay-per-boost */}
      <section className="mt-8">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          One-off boost campaigns
        </h2>
        <div className="grid gap-3 md:grid-cols-3">
          {(packages.data ?? []).map((pkg) => (
            <Card key={pkg.id} className="p-4">
              <div className="flex items-center gap-2">
                <Megaphone className="h-4 w-4 text-primary" />
                <h3 className="font-semibold">{pkg.name}</h3>
              </div>
              <div className="mt-1 text-xl font-bold">${(pkg.price_cents / 100).toFixed(0)}</div>
              <p className="mt-1 text-xs text-muted-foreground">{pkg.description}</p>
              <p className="mt-1 text-xs text-muted-foreground">{pkg.duration_hours}h window</p>
              <Button
                size="sm"
                className="mt-3 w-full"
                disabled={buyBoost.isPending}
                onClick={() => buyBoost.mutate(pkg)}
              >
                Buy boost
              </Button>
            </Card>
          ))}
        </div>
      </section>

      {/* History */}
      <section className="mt-8">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Boost history
        </h2>
        {!purchases.data?.length ? (
          <Card className="p-5 text-sm text-muted-foreground">No boost campaigns yet.</Card>
        ) : (
          <Card className="divide-y">
            {purchases.data.map((p) => (
              <div key={p.id} className="flex items-center justify-between p-4 text-sm">
                <div>
                  <div className="font-medium">{p.package_id}</div>
                  <div className="text-xs text-muted-foreground">
                    {p.starts_at && new Date(p.starts_at).toLocaleDateString()} →{" "}
                    {p.ends_at && new Date(p.ends_at).toLocaleDateString()}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold">${(p.amount_cents / 100).toFixed(0)}</div>
                  <Badge variant={p.status === "active" || p.status === "paid" ? "default" : "outline"}>
                    {p.status}
                  </Badge>
                </div>
              </div>
            ))}
          </Card>
        )}
      </section>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto max-w-5xl px-4 py-8">{children}</div>;
}
