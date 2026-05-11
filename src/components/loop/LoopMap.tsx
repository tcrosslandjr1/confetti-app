/// <reference types="google.maps" />
import { useEffect, useMemo, useRef, useState } from "react";
import {
  APIProvider,
  Map,
  AdvancedMarker,
  Pin,
  useMap,
  useMapsLibrary,
} from "@vis.gl/react-google-maps";
import { GOOGLE_MAPS_API_KEY } from "@/lib/config";
import type { LoopStop } from "@/lib/loop-store";

type Props = {
  stops: LoopStop[];
  currentIdx: number;
  fallbackCity?: string;
};

type GeoStop = LoopStop & { lat: number; lng: number };

const MAP_ID = "confetti-loop-map";

export function LoopMap({ stops, currentIdx, fallbackCity = "Washington, DC" }: Props) {
  if (!GOOGLE_MAPS_API_KEY) {
    return (
      <div className="grid h-full w-full place-items-center bg-cream text-xs text-muted-foreground">
        Map unavailable
      </div>
    );
  }
  return (
    <APIProvider apiKey={GOOGLE_MAPS_API_KEY} libraries={["places", "routes"]}>
      <Map
        mapId={MAP_ID}
        defaultZoom={13}
        defaultCenter={{ lat: 38.9072, lng: -77.0369 }}
        gestureHandling="greedy"
        disableDefaultUI={false}
        mapTypeControl={false}
        streetViewControl={false}
        fullscreenControl={false}
        className="h-full w-full"
      >
        <RouteLayer stops={stops} currentIdx={currentIdx} fallbackCity={fallbackCity} />
      </Map>
    </APIProvider>
  );
}

function RouteLayer({ stops, currentIdx, fallbackCity }: Props & { fallbackCity: string }) {
  const map = useMap();
  const geocoding = useMapsLibrary("geocoding");
  const routes = useMapsLibrary("routes");
  const [geo, setGeo] = useState<GeoStop[]>([]);
  const rendererRef = useRef<google.maps.DirectionsRenderer | null>(null);
  const [steps, setSteps] = useState<{ instruction: string; distance?: string; duration?: string }[]>([]);

  // Stable signature so geocoding only re-runs when stop identity/location changes,
  // NOT when `done` flips. This keeps marker highlight responsive without API spam.
  const geoKey = useMemo(
    () => stops.map((s) => `${s.id}|${s.name}|${s.area || ""}`).join("::"),
    [stops]
  );

  // Geocode each stop's area (or name)
  useEffect(() => {
    if (!geocoding || stops.length === 0) return;
    let cancelled = false;
    const geocoder = new geocoding.Geocoder();

    (async () => {
      const results: GeoStop[] = [];
      for (const s of stops) {
        const query = `${s.name}, ${s.area || fallbackCity}`;
        try {
          const r = await geocoder.geocode({ address: query });
          const loc = r.results[0]?.geometry.location;
          if (loc) results.push({ ...s, lat: loc.lat(), lng: loc.lng() });
        } catch {
          // skip
        }
      }
      if (!cancelled) setGeo(results);
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [geocoding, geoKey, fallbackCity]);

  // Merge live `done` state from props onto geocoded coords each render
  const liveGeo = useMemo<GeoStop[]>(() => {
    const byId = new globalThis.Map<string, LoopStop>(stops.map((s) => [s.id, s] as const));
    return geo.map((g) => ({ ...g, done: !!byId.get(g.id)?.done }));
  }, [geo, stops]);

  // Fit bounds to all stops
  useEffect(() => {
    if (!map || geo.length === 0) return;
    const bounds = new google.maps.LatLngBounds();
    geo.forEach((s) => bounds.extend({ lat: s.lat, lng: s.lng }));
    map.fitBounds(bounds, 64);
  }, [map, geo]);

  // Compute and render directions through all stops
  useEffect(() => {
    if (!map || !routes || geo.length < 2) return;

    if (!rendererRef.current) {
      rendererRef.current = new routes.DirectionsRenderer({
        suppressMarkers: true,
        preserveViewport: true,
        polylineOptions: {
          strokeColor: "#FF5C4D",
          strokeOpacity: 0.95,
          strokeWeight: 5,
        },
      });
      rendererRef.current.setMap(map);
    }

    const service = new routes.DirectionsService();
    const origin = geo[0];
    const destination = geo[geo.length - 1];
    const waypoints = geo.slice(1, -1).map((s) => ({
      location: { lat: s.lat, lng: s.lng },
      stopover: true,
    }));

    service.route(
      {
        origin: { lat: origin.lat, lng: origin.lng },
        destination: { lat: destination.lat, lng: destination.lng },
        waypoints,
        travelMode: google.maps.TravelMode.WALKING,
        optimizeWaypoints: false,
      },
      (result, status) => {
        if (status !== "OK" || !result || !rendererRef.current) return;
        rendererRef.current.setDirections(result);

        const allSteps: { instruction: string; distance?: string; duration?: string }[] = [];
        result.routes[0]?.legs.forEach((leg) => {
          leg.steps.forEach((step) => {
            allSteps.push({
              instruction: step.instructions.replace(/<[^>]+>/g, ""),
              distance: step.distance?.text,
              duration: step.duration?.text,
            });
          });
        });
        setSteps(allSteps);
      }
    );

    return () => {
      // renderer is cleaned up on full unmount
    };
  }, [map, routes, geo]);

  // Clean up renderer on unmount
  useEffect(() => {
    return () => {
      rendererRef.current?.setMap(null);
      rendererRef.current = null;
    };
  }, []);

  // Pan to current stop
  useEffect(() => {
    if (!map || geo.length === 0) return;
    const idx = currentIdx >= 0 && currentIdx < geo.length ? currentIdx : 0;
    map.panTo({ lat: geo[idx].lat, lng: geo[idx].lng });
  }, [map, geo, currentIdx]);

  return (
    <>
      {geo.map((s, i) => {
        const isCurrent = i === currentIdx;
        const isDone = !!s.done;
        return (
          <AdvancedMarker key={s.id} position={{ lat: s.lat, lng: s.lng }} title={s.name}>
            <Pin
              background={isDone ? "#FF5C4D" : isCurrent ? "#FFC846" : "#FFF7EC"}
              borderColor="#1B1B1B"
              glyphColor="#1B1B1B"
              glyph={isDone ? "✓" : String(i + 1)}
              scale={isCurrent ? 1.25 : 1}
            />
          </AdvancedMarker>
        );
      })}
      <DirectionsPanel steps={steps} />
    </>
  );
}

function DirectionsPanel({
  steps,
}: {
  steps: { instruction: string; distance?: string; duration?: string }[];
}) {
  const [open, setOpen] = useState(false);
  const summary = useMemo(() => {
    if (steps.length === 0) return null;
    return `${steps.length} step${steps.length === 1 ? "" : "s"}`;
  }, [steps]);

  if (!summary) return null;

  return (
    <div className="pointer-events-auto absolute right-2 top-2 z-10 max-w-[55%]">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="rounded-full border-2 border-ink bg-cream px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-widest text-ink shadow-brut"
      >
        {open ? "Hide" : "Directions"} · {summary}
      </button>
      {open && (
        <ol className="mt-2 max-h-56 overflow-y-auto rounded-2xl border-2 border-ink bg-cream/95 p-2 text-[11px] leading-snug text-ink shadow-brut backdrop-blur">
          {steps.map((s, i) => (
            <li key={i} className="flex gap-2 border-b border-ink/10 px-1 py-1.5 last:border-0">
              <span className="font-mono text-[9px] font-bold text-ink/50">{i + 1}.</span>
              <div className="flex-1">
                <div>{s.instruction}</div>
                {(s.distance || s.duration) && (
                  <div className="mt-0.5 font-mono text-[9px] uppercase tracking-widest text-ink/50">
                    {[s.distance, s.duration].filter(Boolean).join(" · ")}
                  </div>
                )}
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
