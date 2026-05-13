import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Star, MapPin, Clock, Phone, Plus, Calendar, Sparkles, BadgeCheck, Navigation, Car, Footprints, Bus } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { buildAppleMapsDirectionsUrl, buildGoogleMapsDirectionsUrl, type TravelMode } from "@/lib/maps-links";
import { VenueVerificationBadge } from "@/components/VenueVerificationBadge";
import { ReportVenueButton } from "@/components/ReportVenueButton";

export const Route = createFileRoute("/venue/$id")({
  head: () => ({ meta: [{ title: "Venue — Confetti" }] }),
  component: VenuePage,
});

type Venue = {
  id: string;
  name: string;
  category: string | null;
  neighborhood: string | null;
  address: string | null;
  image_url: string | null;
  description: string | null;
  rating: number | null;
  price_level: number | null;
  tags: string[];
  source: "venues" | "viral_venues";
  verified: boolean;
  featured: boolean;
  city: string | null;
};

const FALLBACK_PHOTOS = [
  "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1551218808-94e220e084d2?w=800&auto=format&fit=crop",
];

function VenuePage() {
  const { id } = Route.useParams();
  const [venue, setVenue] = useState<Venue | null | undefined>(undefined);
  const [travelMode, setTravelMode] = useState<TravelMode>("driving");

  useEffect(() => {
    let cancelled = false;
    setVenue(undefined);
    (async () => {
      // Try venues table first
      const v = await supabase
        .from("venues")
        .select("id,name,category,neighborhood,city,image_url,description,price_level,verified,featured")
        .eq("id", id)
        .maybeSingle();
      if (!cancelled && v.data) {
        const row = v.data as typeof v.data & { verified?: boolean; featured?: boolean; city?: string | null };
        setVenue({
          id: row.id,
          name: row.name,
          category: row.category,
          neighborhood: row.neighborhood,
          address: null,
          image_url: row.image_url,
          description: row.description,
          rating: null,
          price_level: row.price_level,
          tags: [],
          source: "venues",
          verified: !!row.verified,
          featured: !!row.featured,
          city: row.city ?? null,
        });
        return;
      }
      // Fall back to viral_venues
      const vv = await supabase
        .from("viral_venues")
        .select("id,venue_name,neighborhood,address,city,photo_url,summary,rating,tags")
        .eq("id", id)
        .maybeSingle();
      if (cancelled) return;
      if (vv.data) {
        setVenue({
          id: vv.data.id,
          name: vv.data.venue_name,
          category: "Trending spot",
          neighborhood: vv.data.neighborhood,
          address: vv.data.address,
          image_url: vv.data.photo_url,
          description: vv.data.summary,
          rating: vv.data.rating != null ? Number(vv.data.rating) : null,
          price_level: null,
          tags: (vv.data.tags as string[]) ?? [],
          source: "viral_venues",
          verified: false,
          featured: false,
          city: vv.data.city ?? null,
        });
      } else {
        setVenue(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (venue === undefined) {
    return (
      <div className="min-h-screen bg-background pb-32">
        <div className="h-72 w-full animate-pulse bg-muted" />
        <div className="mx-auto max-w-md px-4 -mt-8 space-y-3">
          <div className="h-32 animate-pulse rounded-3xl bg-muted" />
          <div className="h-24 animate-pulse rounded-2xl bg-muted" />
        </div>
      </div>
    );
  }

  if (venue === null) {
    return (
      <div className="min-h-screen bg-background pb-32 grid place-items-center px-4">
        <div className="text-center space-y-3">
          <h1 className="font-display text-xl font-bold">Venue not found</h1>
          <p className="text-sm text-muted-foreground">
            We couldn't find a venue for id <code>{id}</code>.
          </p>
          <Link
            to="/portal/viral"
            className="inline-flex items-center gap-1 text-primary font-semibold text-sm hover:underline"
          >
            <ArrowLeft className="h-3 w-3" /> Browse trending spots
          </Link>
        </div>
      </div>
    );
  }

  const hero = venue.image_url || FALLBACK_PHOTOS[0];
  const photos = venue.image_url
    ? [venue.image_url, ...FALLBACK_PHOTOS.slice(0, 3)]
    : FALLBACK_PHOTOS;

  return (
    <div className="min-h-screen bg-background pb-32">
      <div className="relative h-72 overflow-hidden">
        <img src={hero} alt={venue.name} className="h-full w-full object-cover" />
        <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-ink/60 to-transparent" />
        <Link
          to={venue.source === "viral_venues" ? "/portal/viral" : "/portal"}
          className="absolute left-4 top-4 grid h-10 w-10 place-items-center rounded-full border-2 border-ink bg-cream/95 shadow-brut"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
      </div>

      <div className="mx-auto max-w-md px-4 -mt-8">
        <div className="rounded-3xl border-2 border-ink bg-card p-5 shadow-brut">
          <div className="flex items-baseline justify-between gap-2">
            <h1 className="font-display text-2xl font-extrabold tracking-tight">{venue.name}</h1>
            <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-ink/60">
              #{id.slice(0, 6)}
            </span>
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <VenueVerificationBadge venueName={venue.name} verified={venue.verified} size="md" />
            {venue.verified && (
              <span className="inline-flex items-center gap-1 rounded-full border-2 border-ink bg-emerald-400/30 px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-widest">
                <BadgeCheck className="h-3 w-3" /> Verified business
              </span>
            )}
            {venue.featured && (
              <span className="inline-flex items-center gap-1 rounded-full border-2 border-ink bg-gold/40 px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-widest">
                <Star className="h-3 w-3 fill-ink" /> Featured
              </span>
            )}
          </div>
          <div className="mt-3 text-sm text-muted-foreground">
            {venue.category ?? "Venue"}
            {venue.neighborhood ? ` · ${venue.neighborhood}` : ""}
          </div>
          <div className="mt-3 flex items-center gap-3 text-sm">
            {venue.rating != null && (
              <span className="inline-flex items-center gap-1 font-bold">
                <Star className="h-4 w-4 fill-gold text-gold" /> {venue.rating.toFixed(1)}
              </span>
            )}
            {venue.price_level != null && (
              <span className="text-muted-foreground">
                {"$".repeat(Math.max(1, venue.price_level))}
              </span>
            )}
            {venue.address && (
              <span className="inline-flex items-center gap-1 text-muted-foreground">
                <MapPin className="h-3.5 w-3.5" /> {venue.neighborhood ?? "Nearby"}
              </span>
            )}
          </div>
          {venue.tags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {venue.tags.slice(0, 6).map((t) => (
                <span
                  key={t}
                  className="rounded-full border-2 border-ink bg-gold/30 px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-widest"
                >
                  {t.replace(/_/g, " ")}
                </span>
              ))}
            </div>
          )}
        </div>

        {venue.description && (
          <div className="mt-4 rounded-2xl border-2 border-dashed border-coral bg-coral/5 p-4">
            <div className="flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-widest text-coral">
              <Sparkles className="h-3 w-3" /> Why we picked this
            </div>
            <p className="mt-2 text-sm">{venue.description}</p>
          </div>
        )}

        {(venue.address || venue.name) && (() => {
          const dest = { name: venue.name, address: venue.address ?? undefined };
          const apple = buildAppleMapsDirectionsUrl([dest], travelMode);
          const google = buildGoogleMapsDirectionsUrl([dest], travelMode);
          const modes: { k: TravelMode; label: string; Icon: typeof Car }[] = [
            { k: "driving", label: "Drive", Icon: Car },
            { k: "walking", label: "Walk", Icon: Footprints },
            { k: "transit", label: "Transit", Icon: Bus },
          ];
          return (
            <div className="mt-4 space-y-2">
              <div
                role="radiogroup"
                aria-label="Travel mode"
                className="inline-flex rounded-2xl border-2 border-ink bg-cream p-1 shadow-brut"
              >
                {modes.map(({ k, label, Icon }) => {
                  const active = travelMode === k;
                  return (
                    <button
                      key={k}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      onClick={() => setTravelMode(k)}
                      className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 font-mono text-[11px] font-bold uppercase tracking-widest transition-pop ${
                        active
                          ? "bg-ink text-cream"
                          : "text-ink/70 hover:bg-gold/40"
                      }`}
                    >
                      <Icon className="h-3.5 w-3.5" /> {label}
                    </button>
                  );
                })}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <a
                  href={apple}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border-2 border-ink bg-cream px-4 py-3 text-sm font-bold shadow-brut transition-pop hover:-translate-y-0.5 hover:bg-gold"
                >
                  <Navigation className="h-4 w-4" /> Apple Maps
                </a>
                <a
                  href={google}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border-2 border-ink bg-cream px-4 py-3 text-sm font-bold shadow-brut transition-pop hover:-translate-y-0.5 hover:bg-gold"
                >
                  <Navigation className="h-4 w-4" /> Google Maps
                </a>
              </div>
            </div>
          );
        })()}

        <div className="mt-4 grid gap-2">
          <InfoRow icon={Clock} label="Hours" value="Tue–Sun · 5pm – 1am" />
          <InfoRow icon={Phone} label="Phone" value="—" />
          <InfoRow
            icon={MapPin}
            label="Address"
            value={venue.address ?? venue.neighborhood ?? "Address coming soon"}
          />
        </div>

        <div className="mt-5 grid grid-cols-2 gap-2">
          <button
            onClick={() => toast.success(`${venue.name} added to your plan`)}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border-2 border-ink bg-cream px-4 py-3 text-sm font-bold shadow-brut transition-pop hover:-translate-y-0.5"
          >
            <Plus className="h-4 w-4" /> Add to Plan
          </button>
          <button
            onClick={() => toast.success("Booking handoff coming soon")}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border-2 border-ink bg-coral px-4 py-3 text-sm font-bold text-cream shadow-brut transition-pop hover:-translate-y-0.5"
          >
            <Calendar className="h-4 w-4" /> Book Now
          </button>
        </div>

        <div className="mt-3 flex justify-center">
          <ReportVenueButton venueName={venue.name} city={venue.city} />
        </div>

        <div className="mt-6">
          <div className="font-mono text-[10px] font-bold uppercase tracking-widest text-ink/60 mb-2">
            Photos
          </div>
          <div className="grid grid-cols-2 gap-2">
            {photos.map((p, i) => (
              <img
                key={i}
                src={p}
                alt=""
                className="aspect-square w-full rounded-2xl border-2 border-ink object-cover"
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Clock;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-3">
      <span className="grid h-9 w-9 place-items-center rounded-full bg-muted">
        <Icon className="h-4 w-4" />
      </span>
      <div>
        <div className="font-mono text-[9px] font-bold uppercase tracking-widest text-ink/60">
          {label}
        </div>
        <div className="text-sm font-semibold">{value}</div>
      </div>
    </div>
  );
}
