import { createLazyFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Award, Gift, MapPin, Sparkles, Ticket, Crown, ChevronRight } from "lucide-react";

export const Route = createLazyFileRoute("/partners")({
  component: PartnersPage,
});

type Partner = {
    id: string;
    name: string;
    neighborhood: string;
    category: "Dining" | "Bar" | "Rooftop" | "Coffee" | "Live";
    perk: string;
    earn: number;
    redeem: string;
    featured?: boolean;
    gradient: string;
};

const PARTNERS: Partner[] = [
    {
        id: "lila",
        name: "Lila's Patio",
        neighborhood: "Shaw, DC",
        category: "Dining",
        perk: "Complimentary appetizer with any dinner",
        earn: 50,
        redeem: "$10 off a Booking",
        featured: true,
        gradient: "from-coral via-coral/80 to-amber-400",
    },
    {
        id: "aera",
        name: "Aera Rooftop",
        neighborhood: "Logan Circle, DC",
        category: "Rooftop",
        perk: "Skip-the-line VIP entry on weekends",
        earn: 75,
        redeem: "VIP rooftop entry",
        featured: true,
        gradient: "from-rose-500 via-coral to-orange-400",
    },
    {
        id: "noma-vinyl",
        name: "Velvet & Vinyl",
        neighborhood: "NoMa, DC",
        category: "Live",
        perk: "House DJ guest list every Friday",
        earn: 60,
        redeem: "Free cocktail",
        gradient: "from-amber-500 via-coral to-rose-500",
    },
    {
        id: "harbor",
        name: "Harbor Heatwave",
        neighborhood: "The Wharf, DC",
        category: "Bar",
        perk: "First round on us, weekdays before 8",
        earn: 40,
        redeem: "Free cocktail",
        gradient: "from-orange-400 via-coral to-pink-500",
    },
    {
        id: "moonlit",
        name: "Moonlit Mischief",
        neighborhood: "Adams Morgan, DC",
        category: "Bar",
        perk: "Late-night menu unlocked after midnight",
        earn: 55,
        redeem: "$10 off a Booking",
        gradient: "from-pink-500 via-coral to-amber-400",
    },
    {
        id: "neon",
        name: "Neon Nomads",
        neighborhood: "Wynwood, MIA",
        category: "Live",
        perk: "Reserved booth for groups of 4+",
        earn: 80,
        redeem: "VIP rooftop entry",
        gradient: "from-coral via-rose-500 to-purple-500",
    },
];

const CATEGORY_ICON: Record<Partner["category"], typeof Sparkles> = {
    Dining: Sparkles,
    Bar: Gift,
    Rooftop: Crown,
    Coffee: Ticket,
    Live: Sparkles,
};

function PartnersPage() {
    const featured = PARTNERS.filter((p) => p.featured);
    const rest = PARTNERS.filter((p) => !p.featured);
    return (<div className="min-h-screen bg-background pb-32">
      <div className="mx-auto max-w-5xl px-4 pt-6 sm:px-6 lg:px-8">
        <Link to="/passport" className="inline-flex items-center gap-1 font-mono text-xs font-bold uppercase tracking-widest text-ink/70 hover:text-ink">
          <ArrowLeft className="h-3.5 w-3.5"/> Back to passport
        </Link>

        {/* Hero */}
        <header className="relative mt-4 overflow-hidden rounded-3xl border-2 border-ink bg-gradient-vibe p-6 sm:p-8 text-cream shadow-brut-lg">
          <div className="pointer-events-none absolute -left-16 -top-16 h-48 w-48 rounded-full bg-cream/20 blur-3xl"/>
          <div className="pointer-events-none absolute -bottom-20 -right-12 h-56 w-56 rounded-full bg-ink/30 blur-3xl"/>
          <div className="relative">
            <span className="inline-flex items-center gap-2 rounded-full border border-cream/30 bg-cream/15 px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-widest backdrop-blur">
              <Award className="h-3.5 w-3.5"/> Confetti Partners
            </span>
            <h1 className="mt-3 font-display text-3xl sm:text-4xl font-extrabold leading-tight">
              Earn Confetti everywhere you go.
            </h1>
            <p className="mt-2 max-w-xl font-serif text-base italic opacity-90">
              Every check-in at a partner venue stacks rewards toward your next perk.
            </p>
            <Link to="/passport" className="mt-4 inline-flex items-center gap-1.5 rounded-full border-2 border-cream/40 bg-cream/15 px-4 py-2 font-mono text-[11px] font-bold uppercase tracking-widest backdrop-blur hover:bg-cream/25">
              <Gift className="h-3.5 w-3.5"/> View your rewards{" "}
              <ChevronRight className="h-3 w-3"/>
            </Link>
          </div>
        </header>

        {/* Featured */}
        {featured.length > 0 && (<section className="mt-8">
            <div className="flex items-end justify-between">
              <h2 className="flex items-center gap-2 font-display text-lg font-bold">
                <Sparkles className="h-4 w-4 text-coral"/> Featured this week
              </h2>
              <span className="font-mono text-[10px] uppercase tracking-widest text-ink/60">
                2× Confetti
              </span>
            </div>
            <div className="mt-3 grid gap-4 sm:grid-cols-2">
              {featured.map((p) => (<PartnerCard key={p.id} partner={p} featured/>))}
            </div>
          </section>)}

        {/* All partners */}
        <section className="mt-8">
          <div className="flex items-end justify-between">
            <h2 className="font-display text-lg font-bold">All partners</h2>
            <span className="font-mono text-[10px] uppercase tracking-widest text-ink/60">
              {PARTNERS.length} venues
            </span>
          </div>
          <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {rest.map((p) => (<PartnerCard key={p.id} partner={p}/>))}
          </div>
        </section>

        {/* Footer CTA */}
        <div className="mt-10 flex flex-col items-start gap-3 rounded-2xl border-2 border-dashed border-ink/30 bg-cream/60 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="font-display text-base font-bold leading-tight">Ready to redeem?</div>
            <div className="mt-0.5 font-mono text-[10px] uppercase tracking-widest text-ink/60">
              Cash in Confetti for perks at any partner
            </div>
          </div>
          <Link to="/passport" className="inline-flex items-center gap-1.5 rounded-full border-2 border-ink bg-coral px-4 py-2 font-mono text-[11px] font-bold uppercase tracking-widest text-cream shadow-brut hover:-translate-y-0.5 transition-transform">
            <Ticket className="h-3.5 w-3.5"/> Open rewards
          </Link>
        </div>
      </div>
    </div>);
}

function PartnerCard({ partner, featured }: {
    partner: Partner;
    featured?: boolean;
}) {
    const Icon = CATEGORY_ICON[partner.category];
    return (<article className={`group relative overflow-hidden rounded-2xl border-2 border-ink bg-card shadow-brut transition-transform hover:-translate-y-0.5 ${featured ? "" : ""}`}>
      {/* Cover */}
      <div className={`relative h-28 bg-gradient-to-br ${partner.gradient}`}>
        <div className="pointer-events-none absolute inset-0 opacity-[0.18]" style={{
            backgroundImage: "radial-gradient(rgba(255,255,255,0.9) 1px, transparent 1px)",
            backgroundSize: "12px 12px",
        }}/>
        {featured && (<span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full border-2 border-ink bg-cream px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-widest text-ink">
            <Sparkles className="h-2.5 w-2.5 text-coral"/> Featured
          </span>)}
        <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full border border-cream/40 bg-ink/30 px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-widest text-cream backdrop-blur">
          <Icon className="h-2.5 w-2.5"/> {partner.category}
        </span>
        <span className="absolute -bottom-3 right-3 inline-flex items-center gap-1 rounded-full border-2 border-ink bg-coral px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-widest text-cream shadow-brut">
          +{partner.earn} Confetti
        </span>
      </div>

      {/* Body */}
      <div className="p-4">
        <div className="flex items-center gap-1 font-mono text-[10px] uppercase tracking-widest text-ink/60">
          <MapPin className="h-3 w-3"/> {partner.neighborhood}
        </div>
        <h3 className="mt-1 font-display text-lg font-extrabold leading-tight text-ink">
          {partner.name}
        </h3>
        <p className="mt-1.5 text-sm text-ink/70">{partner.perk}</p>

        <div className="mt-3 flex items-center justify-between gap-2 rounded-xl border border-dashed border-ink/30 bg-background px-3 py-2">
          <div>
            <div className="font-mono text-[9px] uppercase tracking-widest text-ink/50">
              Redeem for
            </div>
            <div className="font-display text-xs font-bold text-ink">{partner.redeem}</div>
          </div>
          <Link to="/passport" className="inline-flex shrink-0 items-center gap-1 rounded-full border-2 border-ink bg-background px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-widest text-ink hover:bg-ink hover:text-cream">
            Use <ChevronRight className="h-3 w-3"/>
          </Link>
        </div>
      </div>
    </article>);
}
