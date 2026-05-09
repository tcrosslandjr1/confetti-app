import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Sparkles, MapPin, ArrowRight, Star, Bookmark, CalendarCheck, MessageCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ReferralWidget } from "@/components/ReferralWidget";

export const Route = createFileRoute("/portal/")({
  component: PortalDiscoverPage,
});

type Venue = { id: string; name: string; category: string; neighborhood: string | null; price_level: number; image_url: string | null; description: string | null };
type Featured = { id: string; venue_id: string | null; title: string | null; subtitle: string | null; collection_slug: string | null; venues: Venue | null };

function PortalDiscoverPage() {
  const [featured, setFeatured] = useState<Featured[]>([]);
  const [venues, setVenues] = useState<Venue[]>([]);

  useEffect(() => {
    supabase
      .from("featured_content")
      .select("id,venue_id,title,subtitle,collection_slug,venues(id,name,category,neighborhood,price_level,image_url,description)")
      .eq("active", true)
      .order("position")
      .then(({ data }) => setFeatured((data as unknown as Featured[]) ?? []));
    supabase
      .from("venues")
      .select("id,name,category,neighborhood,price_level,image_url,description")
      .order("created_at", { ascending: false })
      .limit(12)
      .then(({ data }) => setVenues((data as Venue[]) ?? []));
  }, []);

  return (
    <div className="space-y-10">
      <header>
        <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground">My Portal</p>
        <h1 className="mt-1 font-display text-4xl font-bold leading-tight">Hey — what's the vibe today?</h1>
        <p className="mt-2 max-w-xl text-muted-foreground">
          Browse curated picks, plan a night out with the Concierge, or revisit your saved spots.
        </p>
      </header>

      <div className="grid gap-3 sm:grid-cols-3">
        <QuickAction to="/concierge/chat" icon={MessageCircle} label="Ask Concierge" hint="AI-powered planning" />
        <QuickAction to="/portal/bookings" icon={CalendarCheck} label="My Bookings" hint="Upcoming & past" />
        <QuickAction to="/portal/saved" icon={Bookmark} label="Saved Spots" hint="Your wishlist" />
      </div>

      <ReferralWidget />

      {featured.length > 0 && (
        <section>
          <h2 className="mb-4 font-display text-2xl font-bold">Editor's picks</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {featured.filter((f) => f.venues).map((f) => (
              <FeaturedCard key={f.id} venue={f.venues!} title={f.title} subtitle={f.subtitle} />
            ))}
          </div>
        </section>
      )}

      <section>
        <div className="mb-4 flex items-baseline justify-between">
          <h2 className="font-display text-2xl font-bold">Fresh on Concierge</h2>
          <Link to="/portal/bookings" className="text-sm font-semibold text-primary hover:underline">Book a spot →</Link>
        </div>
        {venues.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border bg-card/50 p-8 text-center text-sm text-muted-foreground">
            No venues yet. Check back soon.
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {venues.map((v) => <VenueCard key={v.id} v={v} />)}
          </div>
        )}
      </section>
    </div>
  );
}

function QuickAction({ to, icon: Icon, label, hint }: { to: string; icon: typeof Sparkles; label: string; hint: string }) {
  return (
    <Link to={to as "/"} className="group flex items-center gap-3 rounded-2xl border border-border bg-card p-4 shadow-card transition-pop hover:scale-[1.02] hover:shadow-pop">
      <span className="grid h-12 w-12 place-items-center rounded-xl bg-gradient-vibe text-primary-foreground"><Icon className="h-5 w-5" /></span>
      <div className="min-w-0 flex-1">
        <div className="font-display font-bold">{label}</div>
        <div className="truncate text-xs text-muted-foreground">{hint}</div>
      </div>
      <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
    </Link>
  );
}

function FeaturedCard({ venue, title, subtitle }: { venue: Venue; title: string | null; subtitle: string | null }) {
  return (
    <article className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
      {venue.image_url && <img src={venue.image_url} alt={venue.name} className="h-40 w-full object-cover" />}
      <div className="p-4">
        <div className="text-[10px] font-mono uppercase tracking-wider text-primary">{title ?? "Featured"}</div>
        <h3 className="mt-1 font-display text-lg font-bold">{venue.name}</h3>
        <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{subtitle ?? venue.description}</p>
        <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
          {venue.neighborhood && <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" />{venue.neighborhood}</span>}
          <span>{"$".repeat(venue.price_level)}</span>
        </div>
      </div>
    </article>
  );
}

function VenueCard({ v }: { v: Venue }) {
  return (
    <article className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
      {v.image_url ? (
        <img src={v.image_url} alt={v.name} className="h-36 w-full object-cover" />
      ) : (
        <div className="grid h-36 place-items-center bg-muted text-muted-foreground"><Star className="h-6 w-6" /></div>
      )}
      <div className="p-4">
        <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">{v.category}</div>
        <h3 className="mt-1 font-display text-lg font-bold">{v.name}</h3>
        <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{v.description}</p>
        <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
          {v.neighborhood && <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" />{v.neighborhood}</span>}
          <span>{"$".repeat(v.price_level)}</span>
        </div>
      </div>
    </article>
  );
}
