import { Map, useMap, InfoWindow } from "@vis.gl/react-google-maps";
import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { Link } from "@tanstack/react-router";
import { MapPin } from "lucide-react";
import { useGeocodedPoints, type GeocodeInput } from "@/lib/geocode";
import { confettiMapStyle } from "./mapStyles";
import { GOOGLE_MAPS_API_KEY } from "@/lib/config";

type Venue = {
  id: string;
  name: string;
  cuisine: string | null;
  neighborhood: string | null;
  city: string;
  photo_url: string | null;
  price_level: number | null;
  price: string | null;
  vibe_tags: string[] | null;
};

const DC_CENTER = { lat: 38.9072, lng: -77.0369 };
const CORAL = "#F05537";

export function ExploreMap({ venues }: { venues: Venue[] }) {
  const map = useMap();
  const markersRef = useRef<google.maps.Marker[]>([]);
  const [selected, setSelected] = useState<{
    venue: Venue;
    position: { lat: number; lng: number };
  } | null>(null);

  // Build geocode inputs — "name, neighborhood, city" for best accuracy
  const geocodeInputs = useMemo<GeocodeInput[]>(
    () =>
      (venues ?? []).map((v) => ({
        id: v.id,
        query: [v.name, v.neighborhood, v.city].filter(Boolean).join(", "),
      })),
    [venues],
  );

  const points = useGeocodedPoints(geocodeInputs);

  // Render markers imperatively (no mapId needed)
  useEffect(() => {
    if (!map) return;

    // Clear previous markers
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];

    const bounds = new google.maps.LatLngBounds();
    let hasPoints = false;

    for (const p of points) {
      const venue = venues?.find((v) => v.id === p.id);
      if (!venue) continue;

      const pos = { lat: p.lat, lng: p.lng };
      bounds.extend(pos);
      hasPoints = true;

      const marker = new google.maps.Marker({
        map,
        position: pos,
        title: venue.name,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          fillColor: CORAL,
          fillOpacity: 1,
          strokeColor: "#FAF6F0",
          strokeWeight: 2.5,
          scale: 8,
        },
      });

      marker.addListener("click", () => {
        setSelected({ venue, position: pos });
      });

      markersRef.current.push(marker);
    }

    // Fit bounds if we have multiple markers, otherwise center on DC
    if (hasPoints && points.length > 1) {
      map.fitBounds(bounds, { top: 40, right: 40, bottom: 40, left: 40 });
    } else if (hasPoints) {
      map.setCenter(points[0]);
      map.setZoom(15);
    }

    return () => {
      markersRef.current.forEach((m) => m.setMap(null));
      markersRef.current = [];
    };
  }, [map, points, venues]);

  if (!GOOGLE_MAPS_API_KEY) {
    return (
      <div className="mx-5 mt-4 grid h-[60vh] place-items-center rounded-2xl border-2 border-dashed border-cream/10 bg-cream/[0.03]">
        <div className="flex flex-col items-center gap-2.5">
          <div className="grid size-11 place-items-center rounded-xl bg-cream/[0.06]">
            <MapPin className="size-5 text-cream/30" />
          </div>
          <span className="font-mono text-[10px] uppercase tracking-widest text-cream/30">
            Map loading…
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-5 mt-4 overflow-hidden rounded-2xl border border-cream/10">
      <Map
        defaultCenter={DC_CENTER}
        defaultZoom={13}
        gestureHandling="greedy"
        disableDefaultUI
        zoomControl
        styles={confettiMapStyle}
        className="h-[60vh] w-full"
        onClick={() => setSelected(null)}
      >
        {selected && (
          <InfoWindow
            position={selected.position}
            onCloseClick={() => setSelected(null)}
            pixelOffset={[0, -12]}
          >
            <Link
              to="/venue/$id"
              params={{ id: selected.venue.id }}
              className="block min-w-[180px] max-w-[240px] no-underline"
            >
              {selected.venue.photo_url && (
                <img
                  src={selected.venue.photo_url}
                  alt={selected.venue.name}
                  className="mb-2 h-24 w-full rounded-lg object-cover"
                />
              )}
              <div className="font-display text-sm font-bold text-[#1A1410]">
                {selected.venue.name}
              </div>
              <div className="mt-0.5 text-[11px] text-[#5A5048]">
                {selected.venue.cuisine}
                {selected.venue.neighborhood ? ` · ${selected.venue.neighborhood}` : ""}
              </div>
              <div className="mt-0.5 text-[11px] font-bold text-[#5A5048]/60">
                {selected.venue.price ??
                  "$".repeat(Math.max(1, Math.min(4, selected.venue.price_level ?? 2)))}
              </div>
            </Link>
          </InfoWindow>
        )}
      </Map>

      {/* Venue count badge */}
      <div className="flex items-center justify-between border-t border-cream/10 bg-cream/5 px-4 py-2">
        <span className="font-mono text-[10px] uppercase tracking-widest text-cream/40">
          {points.length} venue{points.length !== 1 ? "s" : ""} on map
        </span>
        {points.length < (venues?.length ?? 0) && (
          <span className="font-mono text-[10px] uppercase tracking-widest text-cream/25">
            Locating {(venues?.length ?? 0) - points.length} more…
          </span>
        )}
      </div>
    </div>
  );
}
