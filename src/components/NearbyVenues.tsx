import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { MapPin, Navigation, Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { getStoredLocation, requestUserLocation, type UserLocation } from "@/lib/location";
import { Button } from "@/components/ui/button";
import { GooglePhotos } from "@/components/GooglePhotos";
import { VenueVerificationBadge } from "@/components/VenueVerificationBadge";
import { WhyThisPick, derivePickSignals } from "@/components/WhyThisPick";

type Venue = {
  id: string;
  name: string;
  category: string;
  neighborhood: string | null;
  city: string | null;
  price_level: number;
  image_url: string | null;
  description: string | null;
};

type Ranked = Venue & { distanceKm: number };

type PlaceCoordinate = {
  venue: string;
  displayName?: string;
  latitude?: number;
  longitude?: number;
};

const NEIGHBORHOOD_COORDS: Record<string, { lat: number; lng: number }> = {
  "adams morgan": { lat: 38.9215, lng: -77.0423 },
  "14th street": { lat: 38.912, lng: -77.032 },
  "buzzard point": { lat: 38.8683, lng: -77.0126 },
  downtown: { lat: 38.9037, lng: -77.0365 },
  georgetown: { lat: 38.9097, lng: -77.0655 },
  "h street": { lat: 38.9005, lng: -76.9958 },
  "logan circle": { lat: 38.9096, lng: -77.0296 },
  "u street": { lat: 38.917, lng: -77.028 },
  "union market": { lat: 38.9087, lng: -76.9974 },
};

function fallbackCoords(v: Venue) {
  const neighborhood = v.neighborhood?.trim().toLowerCase();
  if (neighborhood && NEIGHBORHOOD_COORDS[neighborhood]) return NEIGHBORHOOD_COORDS[neighborhood];
  if (v.city?.toLowerCase().includes("washington")) return { lat: 38.9072, lng: -77.0369 };
  return null;
}

function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

function formatDistance(km: number) {
  if (km < 1) return `${Math.round(km * 1000)} m away`;
  if (km < 10) return `${km.toFixed(1)} km away`;
  return `${Math.round(km)} km away`;
}

export function NearbyVenues({ limit = 6 }: { limit?: number }) {
  const [location, setLocation] = useState<UserLocation | null>(null);
  const [venues, setVenues] = useState<Ranked[]>([]);
  const [loading, setLoading] = useState(false);
  const [requesting, setRequesting] = useState(false);

  useEffect(() => {
    setLocation(getStoredLocation());
  }, []);

  useEffect(() => {
    if (!location) return;
    let cancelled = false;
    setLoading(true);
    (async () => {
      const [vRes, cRes] = await Promise.all([
        supabase
          .from("venues")
          .select("id,name,category,neighborhood,city,price_level,image_url,description"),
        supabase
          .from("venue_details_cache")
          .select("name,latitude,longitude")
          .not("latitude", "is", null)
          .not("longitude", "is", null),
      ]);
      if (cancelled) return;

      const coordsByName = new Map<string, { lat: number; lng: number }>();
      for (const c of (cRes.data ?? []) as {
        name: string | null;
        latitude: number;
        longitude: number;
      }[]) {
        if (!c.name) continue;
        const key = c.name.trim().toLowerCase();
        if (!coordsByName.has(key)) coordsByName.set(key, { lat: c.latitude, lng: c.longitude });
      }

      const ranked: Ranked[] = [];
      for (const v of (vRes.data ?? []) as Venue[]) {
        const coords = coordsByName.get(v.name.trim().toLowerCase());
        if (!coords) continue;
        ranked.push({ ...v, distanceKm: haversineKm(location, coords) });
      }

      if (ranked.length === 0 && vRes.data?.length) {
        const lookups = ((vRes.data ?? []) as Venue[]).slice(0, 12).map((v) => ({
          venue: v.name,
          neighborhood: [v.neighborhood, v.city].filter(Boolean).join(" ") || undefined,
        }));
        const { data } = await supabase.functions.invoke("google-places", {
          body: { queries: lookups },
        });
        if (cancelled) return;
        const liveCoords = new Map<string, { lat: number; lng: number }>();
        for (const p of (data?.results ?? []) as PlaceCoordinate[]) {
          if (typeof p.latitude !== "number" || typeof p.longitude !== "number") continue;
          liveCoords.set(p.venue.trim().toLowerCase(), { lat: p.latitude, lng: p.longitude });
          if (p.displayName)
            liveCoords.set(p.displayName.trim().toLowerCase(), {
              lat: p.latitude,
              lng: p.longitude,
            });
        }
        for (const v of (vRes.data ?? []) as Venue[]) {
          const coords = liveCoords.get(v.name.trim().toLowerCase());
          if (!coords) continue;
          ranked.push({ ...v, distanceKm: haversineKm(location, coords) });
        }
      }

      if (ranked.length === 0) {
        for (const v of (vRes.data ?? []) as Venue[]) {
          const coords = fallbackCoords(v);
          if (!coords) continue;
          ranked.push({ ...v, distanceKm: haversineKm(location, coords) });
        }
      }

      ranked.sort((a, b) => a.distanceKm - b.distanceKm);
      setVenues(ranked.slice(0, limit));
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [location, limit]);

  const enable = async () => {
    setRequesting(true);
    const loc = await requestUserLocation({
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
    });
    setRequesting(false);
    if (loc) setLocation(loc);
    else toast.error("Couldn't get your location. Check browser permissions.");
  };

  const refresh = async () => {
    setRequesting(true);
    const loc = await requestUserLocation({
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
    });
    setRequesting(false);
    if (loc) {
      setLocation(loc);
      toast.success("Updated to your current spot");
    } else {
      toast.error("Couldn't refresh location.");
    }
  };

  return (
    <section aria-label="Nearby picks">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 font-display text-2xl font-bold">
          <Navigation className="h-5 w-5 text-primary" /> Near you right now
        </h2>
        <div className="flex items-center gap-2">
          {location && (
            <span className="hidden font-mono text-xs uppercase tracking-wider text-muted-foreground sm:inline">
              {location.lat.toFixed(3)}, {location.lng.toFixed(3)}
            </span>
          )}
          {location && (
            <Button
              variant="outline"
              size="sm"
              onClick={refresh}
              disabled={requesting}
              className="gap-1.5"
            >
              {requesting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <RefreshCw className="h-3.5 w-3.5" />
              )}
              Refresh nearby
            </Button>
          )}
        </div>
      </div>

      {!location ? (
        <div className="rounded-2xl border border-dashed border-border bg-card/50 p-6 text-center">
          <MapPin className="mx-auto h-6 w-6 text-muted-foreground" />
          <p className="mt-2 text-sm text-muted-foreground">
            Share your location to see venues ranked by how close they are right now.
          </p>
          <Button onClick={enable} disabled={requesting} className="mt-4 gap-2">
            {requesting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <MapPin className="h-4 w-4" />
            )}
            Enable location
          </Button>
        </div>
      ) : loading ? (
        <div className="rounded-2xl border border-border bg-card/50 p-6 text-center text-sm text-muted-foreground">
          <Loader2 className="mx-auto h-5 w-5 animate-spin" /> Finding nearby spots…
        </div>
      ) : venues.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border bg-card/50 p-6 text-center text-sm text-muted-foreground">
          We don't have geocoded venues near you yet — check the full list below.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {venues.map((v) => (
            <Link
              key={v.id}
              to="/venue/$id"
              params={{ id: v.id }}
              className="group overflow-hidden rounded-2xl border border-border bg-card shadow-card transition-pop hover:-translate-y-0.5 hover:shadow-pop"
            >
              {v.image_url ? (
                <img
                  src={v.image_url}
                  alt={v.name}
                  className="h-36 w-full object-cover"
                  loading="lazy"
                />
              ) : (
                <GooglePhotos
                  venue={v.name}
                  neighborhood={v.neighborhood}
                  category={v.category}
                  variant="hero"
                />
              )}
              <div className="p-4">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-primary">
                    {v.category}
                  </div>
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-primary">
                    {formatDistance(v.distanceKm)}
                  </span>
                </div>
                <h3 className="mt-1 font-display text-lg font-bold">{v.name}</h3>
                <div className="mt-1.5">
                  <VenueVerificationBadge venueName={v.name} size="xs" />
                </div>
                {v.neighborhood && (
                  <div className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3" /> {v.neighborhood}
                  </div>
                )}
                {v.description && (
                  <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">{v.description}</p>
                )}
                {(() => {
                  const { signals, rationale } = derivePickSignals({
                    distanceKm: v.distanceKm,
                    vibeMatch: v.category,
                  });
                  return (
                    <WhyThisPick
                      signals={signals}
                      rationale={rationale}
                      className="mt-2.5"
                      compact
                      pickId={`nearby:${v.id}`}
                      context="nearby"
                    />
                  );
                })()}
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
