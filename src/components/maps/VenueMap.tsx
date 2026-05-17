/// <reference types="google.maps" />
import { useEffect, useMemo, useRef, useState } from "react";
import { Map, useMap, useMapsLibrary } from "@vis.gl/react-google-maps";
import { Navigation } from "lucide-react";
import { GOOGLE_MAPS_API_KEY } from "@/lib/config";
import { confettiMapStyle } from "./mapStyles";
import { useGeocodedPoints, buildDirectionsUrl } from "@/lib/geocode";

type Props = {
  name: string;
  address?: string | null;
  area?: string | null;
  lat?: number;
  lng?: number;
  height?: number;
};

export function VenueMap({ name, address, area, lat, lng, height = 180 }: Props) {
  const inputs = useMemo(
    () => [
      {
        id: "venue",
        query: address ? `${name}, ${address}` : `${name}${area ? `, ${area}` : ""}`,
        lat,
        lng,
      },
    ],
    [name, address, area, lat, lng],
  );
  const points = useGeocodedPoints(inputs);
  const point = points[0] ?? null;

  const [user, setUser] = useState<{ lat: number; lng: number } | null>(null);
  const [travel, setTravel] = useState<string | null>(null);

  useEffect(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setUser({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {},
      { timeout: 5000, maximumAge: 60_000 },
    );
  }, []);

  if (!GOOGLE_MAPS_API_KEY) {
    return (
      <div
        className="grid w-full place-items-center bg-cream text-xs text-muted-foreground"
        style={{ height }}
      >
        Map unavailable
      </div>
    );
  }

  const directionsUrl = point
    ? buildDirectionsUrl([point], "driving")
    : "https://www.google.com/maps";

  return (
    <div className="space-y-2">
      <div
        className="relative w-full overflow-hidden rounded-2xl border-2 border-ink bg-cream shadow-brut"
        style={{ height }}
      >
        <a
          href={directionsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="absolute inset-0 z-10"
          aria-label={`Open ${name} in Google Maps`}
        />
        <Map
          defaultZoom={15}
          defaultCenter={{ lat: point?.lat ?? 38.9072, lng: point?.lng ?? -77.0369 }}
          gestureHandling="cooperative"
          disableDefaultUI
          styles={confettiMapStyle}
          clickableIcons={false}
          className="h-full w-full"
        >
          <SingleMarker point={point} user={user} onTravel={setTravel} />
        </Map>
        <a
          href={directionsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="absolute right-3 top-3 z-20 inline-flex items-center gap-1.5 rounded-full border-2 border-ink bg-cream px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-widest text-ink shadow-brut transition-pop hover:-translate-y-0.5"
        >
          <Navigation className="h-3 w-3" /> Directions
        </a>
      </div>
      <div className="flex items-baseline justify-between gap-3 text-xs">
        <span className="text-muted-foreground">{address || area || "Address coming soon"}</span>
        <span className="font-mono font-bold uppercase tracking-widest text-ink/70">
          {travel ? `${travel} away` : user ? "—" : "Tap for ETA"}
        </span>
      </div>
    </div>
  );
}

function SingleMarker({
  point,
  user,
  onTravel,
}: {
  point: { lat: number; lng: number } | null;
  user: { lat: number; lng: number } | null;
  onTravel: (t: string | null) => void;
}) {
  const map = useMap();
  const routesLib = useMapsLibrary("routes");
  const markerRef = useRef<google.maps.Marker | null>(null);
  const userMarkerRef = useRef<google.maps.Marker | null>(null);

  useEffect(() => {
    if (!map || !point) return;
    map.panTo(point);
    markerRef.current?.setMap(null);
    markerRef.current = new google.maps.Marker({
      position: point,
      map,
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 14,
        fillColor: "#F05537",
        fillOpacity: 1,
        strokeColor: "#1A1410",
        strokeWeight: 2,
      },
    });
    return () => markerRef.current?.setMap(null);
  }, [map, point]);

  useEffect(() => {
    if (!map || !user) return;
    userMarkerRef.current?.setMap(null);
    userMarkerRef.current = new google.maps.Marker({
      position: user,
      map,
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 7,
        fillColor: "#2A86FF",
        fillOpacity: 1,
        strokeColor: "#FFFFFF",
        strokeWeight: 3,
      },
    });
    return () => userMarkerRef.current?.setMap(null);
  }, [map, user]);

  useEffect(() => {
    if (!routesLib || !point || !user) return;
    const ds = new routesLib.DirectionsService();
    ds.route(
      {
        origin: user,
        destination: point,
        travelMode: google.maps.TravelMode.DRIVING,
      },
      (res, status) => {
        if (status === "OK" && res?.routes[0]?.legs[0]?.duration?.text) {
          onTravel(res.routes[0].legs[0].duration.text);
        }
      },
    );
  }, [routesLib, point, user, onTravel]);

  return null;
}
