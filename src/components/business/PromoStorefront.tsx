import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useStripeCheckout } from "@/hooks/useStripeCheckout";
import { useAuth } from "@/lib/auth-context";

type Sku = {
  id: string;
  oneTime?: string;
  recurring?: string;
  name: string;
  price: string;
  features: string[];
  targetType: "venue" | "event" | "reel";
};

const BOOSTS: Sku[] = [
  {
    id: "boost_24h",
    oneTime: "boost_24h_once",
    recurring: "boost_24h_monthly",
    name: "24-Hour Boost",
    price: "$29",
    targetType: "venue",
    features: [
      "Priority in Tonight Feed",
      "Priority in Explore",
      "Boosted Reels",
      "Highlighted in AI Plans",
    ],
  },
  {
    id: "boost_3d",
    oneTime: "boost_3d_once",
    recurring: "boost_3d_monthly",
    name: "3-Day Boost",
    price: "$69",
    targetType: "venue",
    features: [
      "All 24h features",
      "Featured in Weekend Hot Spots",
      "Priority in corporate searches",
    ],
  },
  {
    id: "boost_7d",
    oneTime: "boost_7d_once",
    recurring: "boost_7d_monthly",
    name: "7-Day Boost",
    price: "$149",
    targetType: "venue",
    features: [
      "All 3-day features",
      "Top placement in AI Plans",
      "Featured in Reels Drawer",
      "Spotlight badge",
    ],
  },
];

const EVENT_PROMOS: Sku[] = [
  {
    id: "event_single",
    oneTime: "event_single_once",
    name: "Single Event Boost",
    price: "$19",
    targetType: "event",
    features: ["Priority placement until event"],
  },
  {
    id: "event_weekend",
    oneTime: "event_weekend_once",
    name: "Weekend Event Boost",
    price: "$49",
    targetType: "event",
    features: ["Fri–Sun spotlight"],
  },
  {
    id: "event_monthly",
    oneTime: "event_monthly_once",
    name: "Monthly Event Boost",
    price: "$99",
    targetType: "event",
    features: ["30-day promo bundle"],
  },
];

const REEL_PROMOS: Sku[] = [
  {
    id: "reel_boost",
    oneTime: "reel_boost_once",
    name: "Boost Reel",
    price: "$9",
    targetType: "reel",
    features: ["24h reel promotion"],
  },
  {
    id: "reel_trending_pack",
    oneTime: "reel_trending_pack_once",
    name: "Trending Pack",
    price: "$39",
    targetType: "reel",
    features: ["5 reels boosted"],
  },
  {
    id: "reel_viral_push",
    oneTime: "reel_viral_push_once",
    name: "Viral Push",
    price: "$99",
    targetType: "reel",
    features: ["AI-optimized 7-day push"],
  },
];

function PromoCard({ sku, targetId }: { sku: Sku; targetId?: string }) {
  const { user } = useAuth();
  const { openCheckout } = useStripeCheckout();
  const [mode, setMode] = useState<"once" | "monthly">("once");
  const hasRecurring = !!sku.recurring;
  const priceId = mode === "monthly" && sku.recurring ? sku.recurring : sku.oneTime!;

  const buy = () => {
    if (!user) return;
    openCheckout({
      priceId,
      customerEmail: user.email ?? undefined,
      userId: user.id,
      returnUrl: `${window.location.origin}/business/exposure?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      ...(targetId && ({ targetType: sku.targetType, targetId } as any)),
    });
  };

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <div className="flex items-baseline justify-between gap-2">
          <CardTitle className="text-lg">{sku.name}</CardTitle>
          <span className="text-2xl font-bold text-primary">{sku.price}</span>
        </div>
        <CardDescription>
          {mode === "monthly" ? "Auto-renews monthly" : "One-time payment"}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col gap-4">
        <ul className="text-sm space-y-1 flex-1">
          {sku.features.map((f) => (
            <li key={f} className="flex gap-2">
              <span className="text-primary">✓</span>
              {f}
            </li>
          ))}
        </ul>
        {hasRecurring && (
          <Tabs value={mode} onValueChange={(v) => setMode(v as "once" | "monthly")}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="once">Pay once</TabsTrigger>
              <TabsTrigger value="monthly">Auto-renew</TabsTrigger>
            </TabsList>
          </Tabs>
        )}
        <Button onClick={buy} disabled={!user} className="w-full">
          {user ? `Buy ${sku.price}${mode === "monthly" ? "/mo" : ""}` : "Sign in to buy"}
        </Button>
        {!targetId && (
          <Badge variant="outline" className="self-start text-xs">
            Applies to your default venue — pick one for targeted boost
          </Badge>
        )}
      </CardContent>
    </Card>
  );
}

export function PromoStorefront({ targetId }: { targetId?: string }) {
  const { isOpen, checkoutElement } = useStripeCheckout();

  return (
    <div className="space-y-6">
      <Tabs defaultValue="boosts">
        <TabsList>
          <TabsTrigger value="boosts">Venue Boosts</TabsTrigger>
          <TabsTrigger value="events">Event Promos</TabsTrigger>
          <TabsTrigger value="reels">Reels Promos</TabsTrigger>
        </TabsList>
        <TabsContent value="boosts" className="grid gap-4 md:grid-cols-3 mt-4">
          {BOOSTS.map((s) => (
            <PromoCard key={s.id} sku={s} targetId={targetId} />
          ))}
        </TabsContent>
        <TabsContent value="events" className="grid gap-4 md:grid-cols-3 mt-4">
          {EVENT_PROMOS.map((s) => (
            <PromoCard key={s.id} sku={s} targetId={targetId} />
          ))}
        </TabsContent>
        <TabsContent value="reels" className="grid gap-4 md:grid-cols-3 mt-4">
          {REEL_PROMOS.map((s) => (
            <PromoCard key={s.id} sku={s} targetId={targetId} />
          ))}
        </TabsContent>
      </Tabs>
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur flex items-start justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-2xl bg-background rounded-lg shadow-2xl p-4 mt-12">
            {checkoutElement}
          </div>
        </div>
      )}
    </div>
  );
}
