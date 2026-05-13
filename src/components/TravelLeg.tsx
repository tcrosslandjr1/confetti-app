import { useEffect, useMemo, useState } from "react";
import { Footprints, Car, Train, Zap, MapPin, Users } from "lucide-react";
import {
  appleMapsDirections,
  estimateLeg,
  googleMapsDirections,
  lyftDeepLink,
  preferredMapsLink,
  uberDeepLink,
  uberXLDeepLink,
  type LatLng,
} from "@/lib/transport";
import { findCity } from "@/lib/agents/city-context";
import { getTransportProfile, subscribeTransportProfile, type TransportProfile } from "@/lib/transport-profile";

type Props = {
  from: { lat?: number; lng?: number; name?: string } | undefined;
  to: { lat?: number; lng?: number; name?: string };
  city?: string;
  /** Show group-size aware UberXL row */
  groupSize?: number;
};

/**
 * Travel intelligence row shown between two stops on the Boarding Pass / Confirmation.
 * Renders walk / rideshare / transit / EV info + deep-links to Uber, Lyft, and the
 * user's preferred maps app.
 */
export function TravelLeg({ from, to, city, groupSize = 2 }: Props) {
  const [profile, setProfile] = useState<TransportProfile>(() => getTransportProfile());
  useEffect(() => subscribeTransportProfile(() => setProfile(getTransportProfile())), []);

  const cityCtx = useMemo(() => findCity(city), [city]);
  const travel = cityCtx.travel;

  const hasCoords =
    typeof from?.lat === "number" &&
    typeof from?.lng === "number" &&
    typeof to.lat === "number" &&
    typeof to.lng === "number";

  const est = hasCoords
    ? estimateLeg(
        { lat: from!.lat!, lng: from!.lng! } as LatLng,
        { lat: to.lat!, lng: to.lng! } as LatLng,
        {
          walkability: travel?.travelModes.walkability,
          transit: travel?.travelModes.publicTransitQuality,
        },
      )
    : null;

  const targetCoords: LatLng | null =
    typeof to.lat === "number" && typeof to.lng === "number"
      ? { lat: to.lat, lng: to.lng }
      : null;

  // Fall back to label-based maps deep-link when we don't have coords.
  const mapsHref = targetCoords
    ? preferredMapsLink(targetCoords, to.name, profile.preferredMapsApp)
    : to.name
      ? profile.preferredMapsApp === "google"
        ? googleMapsDirections({ lat: 0, lng: 0 }, to.name)
        : appleMapsDirections({ lat: 0, lng: 0 }, to.name)
      : null;

  const uberHref = targetCoords
    ? groupSize >= 4
      ? uberXLDeepLink(targetCoords, to.name)
      : uberDeepLink(targetCoords, to.name)
    : null;
  const lyftHref = targetCoords ? lyftDeepLink(targetCoords, to.name) : null;

  return (
    <div className="rounded-xl border border-dashed border-ink/25 bg-background/60 px-3 py-2 text-[11px]">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-widest text-ink/60">
          <MapPin className="h-3 w-3" />
          Travel to {to.name ?? "next stop"}
        </div>
        {est && (
          <span className="rounded-full border border-ink/15 bg-cream px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase text-ink/70">
            best: {est.recommended}
          </span>
        )}
      </div>

      <div className="mt-1.5 grid grid-cols-2 gap-x-3 gap-y-1 text-ink/80">
        <Row
          icon={<Footprints className="h-3 w-3" />}
          label="Walk"
          value={est ? `${est.walkMin} min` : "—"}
        />
        <Row
          icon={<Car className="h-3 w-3" />}
          label={groupSize >= 4 ? "UberXL" : "Uber"}
          value={est ? `${est.uberMin} min · $${est.uberCost.low}–${est.uberCost.high}` : "—"}
        />
        {travel?.travelModes.publicTransitQuality !== "low" && (
          <Row
            icon={<Train className="h-3 w-3" />}
            label="Transit"
            value={travel ? travel.travelRecommendations.crossNeighborhood : "Check route"}
          />
        )}
        {profile.hasEv && (
          <Row
            icon={<Zap className="h-3 w-3" />}
            label="EV"
            value={
              travel?.travelModes.evFriendly === "high"
                ? "Chargers nearby"
                : travel?.travelModes.evFriendly === "low"
                  ? "Limited — plan ahead"
                  : "Some chargers"
            }
          />
        )}
      </div>

      {(mapsHref || uberHref || lyftHref) && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {uberHref && (
            <DeepLinkChip href={uberHref}>
              <Car className="h-3 w-3" /> {profile.preferredRideshare === "uber" || groupSize < 4 ? (groupSize >= 4 ? "UberXL" : "Uber") : "Uber"}
            </DeepLinkChip>
          )}
          {lyftHref && (
            <DeepLinkChip href={lyftHref}>
              <Car className="h-3 w-3" /> Lyft
            </DeepLinkChip>
          )}
          {mapsHref && (
            <DeepLinkChip href={mapsHref}>
              <MapPin className="h-3 w-3" />
              {profile.preferredMapsApp === "google" ? "Google Maps" : "Apple Maps"}
            </DeepLinkChip>
          )}
          {groupSize >= 4 && (
            <span className="inline-flex items-center gap-1 rounded-full border border-ink/20 bg-cream px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider text-ink/70">
              <Users className="h-3 w-3" /> Split fare
            </span>
          )}
        </div>
      )}
    </div>
  );
}

function Row({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-ink/60">{icon}</span>
      <span className="font-mono text-[9px] font-bold uppercase tracking-widest text-ink/55">{label}</span>
      <span className="ml-auto truncate text-[11px] font-semibold">{value}</span>
    </div>
  );
}

function DeepLinkChip({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 rounded-full border-2 border-ink bg-cream px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-ink shadow-brut-sm transition-pop hover:-translate-y-0.5"
    >
      {children}
    </a>
  );
}
