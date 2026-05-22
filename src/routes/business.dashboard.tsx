import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Sparkles,
  Eye,
  Film,
  MousePointerClick,
  Instagram,
  Music2,
  CalendarPlus,
  Image as ImageIcon,
  Pencil,
  Link2,
  BarChart3,
  Megaphone,
  RefreshCw,
  ShieldCheck,
  Clock,
  TrendingUp,
  Lock,
  ChevronRight,
  Hourglass,
  Mail,
  Store,
  ArrowRight,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { listMyClaims } from "@/lib/business-onboarding.functions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { BusinessUpgradePanel } from "@/components/business/BusinessUpgradePanel";
import { PromoStorefront } from "@/components/business/PromoStorefront";

export const Route = createFileRoute("/business/dashboard")({
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) throw redirect({ to: "/business/login" });
  },
  component: BusinessDashboardPage,
  head: () => ({
    meta: [
      { title: "Venue Dashboard — Confetti for Business" },
      {
        name: "description",
        content:
          "Your venue performance at a glance. Events, media, social, promotion, and AI insights.",
      },
    ],
  }),
});

function BusinessDashboardPage() {
  const { user } = useAuth();
  const fetchClaims = useServerFn(listMyClaims);
  const { data: claimsData } = useQuery({
    queryKey: ["my-venue-claims"],
    queryFn: () => fetchClaims(),
  });

  const claim = claimsData?.claims?.[0] ?? null;
  const venueName = (claim as any)?.proposed_name || (claim as any)?.venue_name || "Your Venue";
  const claimStatus = (claim?.status as string) ?? "pending";
  const promotionUnlocked = claimStatus === "approved";
  const hasPendingClaim = claim?.status === "pending";
  const hasAdvertisers = (claimsData?.claims ?? []).some((c: any) => c.advertiser_id);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/30">
      <div className="mx-auto max-w-7xl space-y-10 px-4 py-10 md:px-6 md:py-14">
        {hasPendingClaim && <PendingApprovalBanner venueName={venueName} />}
        {!hasAdvertisers ? (
          <NoAdvertisersEmptyState />
        ) : (
          <>
            <div className="rounded-2xl border border-amber-300/60 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              <span className="font-semibold">Demo dashboard.</span> Performance numbers, AI insights,
              events, social activity, and refresh history below are sample data to preview the layout.
              Your real metrics will appear here once your venue is approved and analytics start
              flowing.
            </div>
            <DashboardHero
              venueName={venueName}
              status={claimStatus}
              boostLevel={promotionUnlocked ? 1 : 0}
              promotionUnlocked={promotionUnlocked}
              lastRefresh="—"
            />
            <KPIStats />
            <AIInsights />
            <QuickActions promotionUnlocked={promotionUnlocked} />
            <div className="grid gap-6 lg:grid-cols-2">
              <EventsPreview />
              <MediaPreview />
            </div>
            <div className="grid gap-6 lg:grid-cols-2">
              <SocialPanel />
              <PromotionPanel unlocked={promotionUnlocked} />
            </div>
            <AnalyticsPreview />
            <BusinessUpgradePanel />
            <section className="space-y-3">
              <h2 className="text-2xl font-bold">Promo Marketplace</h2>
              <p className="text-muted-foreground text-sm">
                Pay once or auto-renew monthly. Boosts apply to your default venue — open a venue page
                to target a specific one.
              </p>
              <PromoStorefront />
            </section>
            <AIRefreshStatus />
            <DashboardFooter />
          </>
        )}
      </div>
    </div>
  );
}

/* ---------------- PENDING APPROVAL BANNER ---------------- */

function PendingApprovalBanner({ venueName }: { venueName: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="relative overflow-hidden rounded-2xl border-2 border-coral/40 bg-gradient-to-r from-coral/10 via-orange-50 to-cream p-5 shadow-sm"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-coral/15 text-coral">
            <Hourglass className="h-6 w-6" strokeWidth={2} />
          </div>
          <div>
            <h3 className="text-base font-bold text-ink">
              {venueName} is pending review
            </h3>
            <p className="mt-1 max-w-xl text-sm leading-relaxed text-ink/70">
              We&apos;re verifying your venue ownership claim. This usually takes{" "}
              <span className="font-semibold text-coral">24–48 hours</span>. You can
              preview your dashboard below, but some features will unlock once you&apos;re
              approved.
            </p>
            <div className="mt-2 flex items-center gap-2 text-xs text-ink/50">
              <Clock className="h-3.5 w-3.5" />
              <span>We&apos;ll email you when your application is approved or if we need more info.</span>
            </div>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <Button
            asChild
            variant="outline"
            size="sm"
            className="border-coral/30 text-coral hover:bg-coral/10"
          >
            <Link to="/business/claim/pending">
              <Mail className="mr-1.5 h-3.5 w-3.5" />
              Check status
            </Link>
          </Button>
          <Button
            asChild
            size="sm"
            className="bg-coral text-white hover:bg-coral/90"
          >
            <Link to="/business/claim">
              Add more info
            </Link>
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

/* ---------------- HERO ---------------- */

function DashboardHero({
  venueName,
  status,
  boostLevel,
  promotionUnlocked,
  lastRefresh,
}: {
  venueName: string;
  status: string;
  boostLevel: number;
  promotionUnlocked: boolean;
  lastRefresh: string;
}) {
  const statusTone =
    status === "approved"
      ? "bg-emerald-100 text-emerald-700 border-emerald-200"
      : status === "rejected"
        ? "bg-red-100 text-red-700 border-red-200"
        : "bg-amber-100 text-amber-700 border-amber-200";

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="relative overflow-hidden rounded-3xl border bg-card p-6 shadow-sm md:p-8"
    >
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-primary/10 via-orange-50/40 to-background" />
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-5">
          <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl border-2 border-primary/40 bg-gradient-to-br from-primary/30 to-orange-200/60 shadow-[0_0_30px_-8px_hsl(var(--primary)/0.4)]">
            <div className="flex h-full w-full items-center justify-center text-2xl font-bold text-primary">
              {venueName.slice(0, 1).toUpperCase()}
            </div>
          </div>
          <div>
            <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Welcome back
            </div>
            <h1 className="mt-1 text-2xl font-bold md:text-3xl">{venueName}</h1>
            <p className="text-sm text-muted-foreground">Your venue performance at a glance.</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <HeroStat
            icon={<ShieldCheck className="h-4 w-4" />}
            label="Status"
            valueClass={
              statusTone + " border px-2 py-0.5 rounded-full text-xs font-medium capitalize"
            }
            value={status}
          />
          <HeroStat
            icon={<TrendingUp className="h-4 w-4" />}
            label="Boost Level"
            value={`${boostLevel} / 4`}
          />
          <HeroStat
            icon={
              promotionUnlocked ? <Megaphone className="h-4 w-4" /> : <Lock className="h-4 w-4" />
            }
            label="Promotion"
            value={promotionUnlocked ? "Unlocked" : "Locked"}
          />
          <HeroStat
            icon={<Clock className="h-4 w-4" />}
            label="Last AI Refresh"
            value={lastRefresh}
          />
        </div>
      </div>
    </motion.section>
  );
}

function HeroStat({
  icon,
  label,
  value,
  valueClass,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="rounded-xl border bg-background/70 p-3 backdrop-blur">
      <div className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
        {icon}
        {label}
      </div>
      <div className={cn("mt-1.5 text-sm font-semibold", valueClass)}>{value}</div>
    </div>
  );
}

/* ---------------- KPI ---------------- */

const KPI = [
  { icon: Eye, label: "Profile Views", value: "1,284", delta: "+14%", hint: "this week" },
  { icon: Film, label: "Reels Views", value: "3,912", delta: "Boosted", hint: "Tier 2+" },
  {
    icon: MousePointerClick,
    label: "Website Clicks",
    value: "482",
    delta: "+7%",
    hint: "intent to visit",
  },
  { icon: Music2, label: "TikTok Clicks", value: "1,102", delta: "+22%", hint: "nightlife signal" },
  { icon: Instagram, label: "Instagram Clicks", value: "876", delta: "+9%", hint: "this week" },
];

function KPIStats() {
  return (
    <section>
      <SectionHeader title="Performance" />
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
        {KPI.map((k, i) => (
          <motion.div
            key={k.label}
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.35, delay: i * 0.04 }}
          >
            <Card className="group relative overflow-hidden p-4 transition-shadow hover:shadow-md">
              <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-primary/0 via-primary/60 to-primary/0 opacity-0 transition-opacity group-hover:opacity-100" />
              <div className="flex items-center justify-between">
                <div className="rounded-lg bg-primary/10 p-2 text-primary">
                  <k.icon className="h-4 w-4" />
                </div>
                <span className="text-[10px] font-semibold text-emerald-600">{k.delta}</span>
              </div>
              <div className="mt-3 text-2xl font-bold tracking-tight">{k.value}</div>
              <div className="text-xs text-muted-foreground">{k.label}</div>
              <div className="mt-1 text-[10px] text-muted-foreground/70">{k.hint}</div>
            </Card>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

/* ---------------- AI INSIGHTS ---------------- */

const INSIGHTS = [
  "Your venue performs best with Afrobeats audiences.",
  "Peak engagement time: Fridays at 10:30 PM.",
  "Trending hashtags: #RooftopDC, #LateNightVibes.",
  "Your TikTok engagement is 2.4× higher than similar venues.",
];

function AIInsights() {
  return (
    <section>
      <SectionHeader
        title="AI Insights for your venue"
        icon={<Sparkles className="h-4 w-4 text-primary" />}
        action={
          <Button variant="ghost" size="sm" className="text-xs">
            View all <ChevronRight className="ml-1 h-3 w-3" />
          </Button>
        }
      />
      <div className="grid gap-3 md:grid-cols-2">
        {INSIGHTS.map((tip, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -8 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.35, delay: i * 0.05 }}
            className="flex items-start gap-3 rounded-2xl border bg-gradient-to-br from-primary/5 to-transparent p-4"
          >
            <div className="mt-0.5 rounded-md bg-primary/15 p-1.5 text-primary">
              <Sparkles className="h-3.5 w-3.5" />
            </div>
            <p className="text-sm">{tip}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

/* ---------------- QUICK ACTIONS ---------------- */

function QuickActions({ promotionUnlocked }: { promotionUnlocked: boolean }) {
  const actions = [
    { icon: CalendarPlus, label: "Add Event" },
    { icon: ImageIcon, label: "Upload Photos" },
    { icon: Pencil, label: "Edit Venue" },
    { icon: Link2, label: "Social Links" },
    { icon: BarChart3, label: "Analytics" },
    ...(promotionUnlocked ? [{ icon: Megaphone, label: "Promote" }] : []),
  ];
  return (
    <section>
      <SectionHeader title="Quick actions" />
      <div className="flex flex-wrap gap-3">
        {actions.map((a) => (
          <button
            key={a.label}
            className="group flex items-center gap-2 rounded-xl border bg-card px-4 py-3 text-sm font-medium shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
          >
            <a.icon className="h-4 w-4 text-primary transition-transform group-hover:scale-110" />
            {a.label}
          </button>
        ))}
      </div>
    </section>
  );
}

/* ---------------- EVENTS ---------------- */

const EVENTS = [
  {
    title: "Afrobeats Friday",
    date: "Fri · 10:00 PM",
    status: "Published",
    gradient: "from-orange-300 to-pink-300",
  },
  {
    title: "Rooftop Sessions",
    date: "Sat · 9:00 PM",
    status: "Published",
    gradient: "from-primary/50 to-orange-200",
  },
  {
    title: "Sunday Brunch DJ",
    date: "Sun · 12:00 PM",
    status: "Draft",
    gradient: "from-amber-200 to-yellow-200",
  },
];

function EventsPreview() {
  return (
    <Card className="p-5">
      <SectionHeader
        title="Upcoming events"
        action={
          <div className="flex gap-2">
            <Button size="sm" variant="outline">
              Manage all
            </Button>
            <Button size="sm">
              <CalendarPlus className="mr-1.5 h-3.5 w-3.5" />
              Add
            </Button>
          </div>
        }
      />
      <div className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-1">
        {EVENTS.map((e) => (
          <div
            key={e.title}
            className="group min-w-[220px] overflow-hidden rounded-xl border bg-card transition-shadow hover:shadow-md"
          >
            <div className={cn("h-24 bg-gradient-to-br", e.gradient)} />
            <div className="p-3">
              <div className="flex items-center justify-between gap-2">
                <div className="truncate text-sm font-semibold">{e.title}</div>
                <Badge
                  variant={e.status === "Published" ? "default" : "secondary"}
                  className="text-[10px]"
                >
                  {e.status}
                </Badge>
              </div>
              <div className="mt-0.5 text-xs text-muted-foreground">{e.date}</div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

/* ---------------- MEDIA ---------------- */

const MEDIA = [
  "from-primary/40 to-orange-200",
  "from-pink-200 to-orange-200",
  "from-amber-200 to-rose-200",
  "from-orange-300 to-red-200",
  "from-rose-200 to-pink-300",
  "from-yellow-200 to-orange-300",
];

function MediaPreview() {
  return (
    <Card className="p-5">
      <SectionHeader
        title="Your photos & media"
        action={
          <div className="flex gap-2">
            <Button size="sm" variant="outline">
              Gallery
            </Button>
            <Button size="sm">
              <ImageIcon className="mr-1.5 h-3.5 w-3.5" />
              Upload
            </Button>
          </div>
        }
      />
      <div className="grid grid-cols-3 gap-2">
        {MEDIA.map((g, i) => (
          <div
            key={i}
            className={cn(
              "aspect-square rounded-lg bg-gradient-to-br",
              g,
              i === 0 && "col-span-2 row-span-2 aspect-auto",
            )}
          />
        ))}
      </div>
    </Card>
  );
}

/* ---------------- SOCIAL ---------------- */

function SocialPanel() {
  return (
    <Card className="p-5">
      <SectionHeader
        title="Social accounts"
        action={
          <Button size="sm" variant="outline">
            Settings
          </Button>
        }
      />
      <div className="space-y-3">
        <SocialRow
          icon={<Music2 className="h-4 w-4" />}
          name="TikTok"
          connected
          handle="@rooftop.dc"
          lastSync="2h ago"
        />
        <SocialRow icon={<Instagram className="h-4 w-4" />} name="Instagram" connected={false} />
      </div>
    </Card>
  );
}

function SocialRow({
  icon,
  name,
  connected,
  handle,
  lastSync,
}: {
  icon: React.ReactNode;
  name: string;
  connected: boolean;
  handle?: string;
  lastSync?: string;
}) {
  return (
    <div className="flex items-center justify-between rounded-xl border bg-background/50 p-3">
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-primary/10 p-2 text-primary">{icon}</div>
        <div>
          <div className="text-sm font-semibold">{name}</div>
          <div className="text-xs text-muted-foreground">
            {connected ? `${handle} · synced ${lastSync}` : "Not connected"}
          </div>
        </div>
      </div>
      <Button size="sm" variant={connected ? "outline" : "default"}>
        {connected ? "Edit" : "Connect"}
      </Button>
    </div>
  );
}

/* ---------------- PROMOTION ---------------- */

function PromotionPanel({ unlocked }: { unlocked: boolean }) {
  if (!unlocked) {
    return (
      <Card className="relative overflow-hidden p-5">
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-primary/8 via-transparent to-orange-100/40" />
        <SectionHeader
          title="Promotion tools"
          icon={<Lock className="h-4 w-4 text-muted-foreground" />}
        />
        <p className="text-sm text-muted-foreground">
          Promotion tools are invite-only. Request access and our team will reach out within 24
          hours.
        </p>
        <Button className="mt-4" size="sm" asChild>
          <Link to="/business/pricing">Request access</Link>
        </Button>
      </Card>
    );
  }

  const features = ["Featured badge", "Boosted reels", "Priority search", "Hot Spots rotation"];

  return (
    <Card className="relative overflow-hidden p-5">
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-primary/12 via-transparent to-orange-100/50" />
      <SectionHeader
        title="Promotion tools"
        icon={<Megaphone className="h-4 w-4 text-primary" />}
        action={<Button size="sm">Manage</Button>}
      />
      <div className="mb-3 flex items-baseline gap-2">
        <span className="text-2xl font-bold">Boost Level 2</span>
        <span className="text-xs text-muted-foreground">of 4</span>
      </div>
      <ul className="grid grid-cols-2 gap-2">
        {features.map((f) => (
          <li key={f} className="flex items-center gap-2 text-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            {f}
          </li>
        ))}
      </ul>
    </Card>
  );
}

/* ---------------- ANALYTICS PREVIEW ---------------- */

function AnalyticsPreview() {
  return (
    <Card className="p-5">
      <SectionHeader
        title="Performance overview"
        action={
          <Button size="sm" variant="outline">
            Full analytics
          </Button>
        }
      />
      <div className="grid gap-4 md:grid-cols-3">
        <ChartCard label="Profile views" sparkline="line" />
        <ChartCard label="Reels views" sparkline="bar" />
        <ChartCard label="Clicks" sparkline="stack" />
      </div>
    </Card>
  );
}

function ChartCard({ label, sparkline }: { label: string; sparkline: "line" | "bar" | "stack" }) {
  return (
    <div className="rounded-xl border bg-background/50 p-4">
      <div className="text-xs font-medium text-muted-foreground">{label}</div>
      <div className="mt-3 h-20">
        {sparkline === "line" && (
          <svg viewBox="0 0 100 40" className="h-full w-full text-primary">
            <polyline
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              points="0,30 15,25 30,28 45,18 60,22 75,10 100,14"
            />
          </svg>
        )}
        {sparkline === "bar" && (
          <div className="flex h-full items-end gap-1">
            {[40, 65, 30, 80, 55, 90, 70].map((h, i) => (
              <div
                key={i}
                className="flex-1 rounded-sm bg-primary/70"
                style={{ height: `${h}%` }}
              />
            ))}
          </div>
        )}
        {sparkline === "stack" && (
          <div className="flex h-full items-end gap-1">
            {[50, 70, 45, 85, 60].map((h, i) => (
              <div key={i} className="flex flex-1 flex-col gap-0.5" style={{ height: `${h}%` }}>
                <div className="flex-1 rounded-sm bg-primary" />
                <div className="h-1/3 rounded-sm bg-orange-300" />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------------- AI REFRESH ---------------- */

function AIRefreshStatus() {
  return (
    <Card className="p-5">
      <SectionHeader
        title="AI monthly refresh"
        icon={<RefreshCw className="h-4 w-4 text-primary" />}
        action={
          <Button size="sm" variant="outline">
            <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
            Run refresh
          </Button>
        }
      />
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground">Last refresh</div>
          <div className="mt-1 text-base font-semibold">3 days ago</div>
          <div className="text-xs text-muted-foreground">Next scheduled: in 27 days</div>
        </div>
        <div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground">
            Updated last cycle
          </div>
          <ul className="mt-1 text-sm">
            <li>12 Google images</li>
            <li>8 TikTok clips · 6 Instagram posts</li>
            <li>15 trending hashtags</li>
          </ul>
        </div>
      </div>
    </Card>
  );
}

/* ---------------- FOOTER ---------------- */

function DashboardFooter() {
  return (
    <footer className="mt-12 border-t pt-6 text-xs text-muted-foreground">
      <div className="flex flex-col items-center justify-between gap-3 md:flex-row">
        <div>Confetti for Business · Premium nightlife discovery</div>
        <div className="flex gap-4">
          <a href="#" className="hover:text-foreground">
            Help
          </a>
          <a href="mailto:support@confetti.app" className="hover:text-foreground">
            Support
          </a>
          <Link to="/business/pricing" className="hover:text-foreground">
            Pricing
          </Link>
          <a href="#" className="hover:text-foreground">
            Terms
          </a>
        </div>
      </div>
    </footer>
  );
}

/* ---------------- SECTION HEADER ---------------- */

function SectionHeader({
  title,
  icon,
  action,
}: {
  title: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <h2 className="flex items-center gap-2 text-lg font-bold tracking-tight">
        {icon}
        {title}
      </h2>
      {action}
    </div>
  );
}
