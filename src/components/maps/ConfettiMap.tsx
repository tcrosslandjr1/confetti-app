/// <reference types="google.maps" />
import { useEffect, useMemo, useRef, useState } from "react";
import { Map, useMap } from "@vis.gl/react-google-maps";
import { GOOGLE_MAPS_API_KEY } from "@/lib/config";
import { confettiMapStyle } from "./mapStyles";
import { useGeocodedPoints, type GeocodeResult } from "@/lib/geocode";

export type MapStop = {
  id: string;
  name: string;
  area?: string;
  lat?: number;
  lng?: number;
  done?: boolean;
};

type Props = {
  stops: MapStop[];
  currentIdx?: number;
  fallbackCity?: string;
  height?: number | string;
  showUserLocation?: boolean;
  interactive?: boolean;
  onStopClick?: (stop: MapStop) => void;
  className?: string;
  /** Called once geocoding finishes so the parent can build directions links. */
  onPointsReady?: (points: GeocodeResult[]) => void;
};

export function ConfettiMap({
  stops,
  currentIdx = -1,
  fallbackCity = "Washington, DC",
  height = 220,
  showUserLocation = false,
  interactive = true,
  onStopClick,
  className = "",
  onPointsReady,
}: Props) {
  if (!GOOGLE_MAPS_API_KEY) {
    return (
      <div
        className={`grid w-full place-items-center bg-cream text-xs text-muted-foreground ${className}`}
        style={{ height }}
      >
        Map unavailable
      </div>
    );
  }

  return (
    <div
      className={`relative w-full overflow-hidden bg-cream ${className}`}
      style={{ height }}
    >
      <Map
        defaultZoom={13}
        defaultCenter={{ lat: 38.9072, lng: -77.0369 }}
        gestureHandling={interactive ? "greedy" : "none"}
        disableDefaultUI={!interactive}
        mapTypeControl={false}
        streetViewControl={false}
        fullscreenControl={false}
        zoomControl={interactive}
        styles={confettiMapStyle}
        clickableIcons={false}
        className="h-full w-full"
      >
        <Layer
          stops={stops}
          currentIdx={currentIdx}
          fallbackCity={fallbackCity}
          showUserLocation={showUserLocation}
          onStopClick={onStopClick}
          onPointsReady={onPointsReady}
        />
      </Map>
    </div>
  );
}

function Layer({
  stops,
  currentIdx,
  fallbackCity,
  showUserLocation,
  onStopClick,
  onPointsReady,
}: {
  stops: MapStop[];
  currentIdx: number;
  fallbackCity: string;
  showUserLocation: boolean;
  onStopClick?: (stop: MapStop) => void;
  onPointsReady?: (points: GeocodeResult[]) => void;
}) {
  const map = useMap();
  const [user, setUser] = useState<{ lat: number; lng: number } | null>(null);
  const userMarkerRef = useRef<google.maps.Marker | null>(null);
  const stopMarkersRef = useRef<google.maps.Marker[]>([]);
  const polylineRef = useRef<google.maps.Polyline | null>(null);

  const inputs = useMemo(
    () =>
      stops.map((s) => ({
        id: s.id,
        query: `${s.name}, ${s.area || fallbackCity}`,
        lat: s.lat,
        lng: s.lng,
      })),
    [stops, fallbackCity]
  );
  const points = useGeocodedPoints(inputs);

  // Notify parent when points change
  useEffect(() => {
    if (points.length === stops.length) onPointsReady?.(points);
  }, [points, stops.length, onPointsReady]);

  // Get user location
  useEffect(() => {
    if (!showUserLocation || typeof navigator === "undefined" || !navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setUser({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {
        /* permission denied - silently ignore */
      },
      { enableHighAccuracy: false, timeout: 5000, maximumAge: 60_000 }
    );
  }, [showUserLocation]);

  // Render numbered stop markers + polyline + fit bounds
  useEffect(() => {
    if (!map) return;
    // Clear previous
    stopMarkersRef.current.forEach((m) => m.setMap(null));
    stopMarkersRef.current = [];
    polylineRef.current?.setMap(null);
    polylineRef.current = null;

    const ordered = stops
      .map((s) => points.find((p) => p.id === s.id))
      .filter((p): p is GeocodeResult => !!p);
    if (ordered.length === 0) return;

    stops.forEach((stop, i) => {
      const pt = points.find((p) => p.id === stop.id);
      if (!pt) return;
      const isCurrent = i === currentIdx;
      const isDone = !!stop.done;
      const fill = isDone ? "#3FA66B" : isCurrent ? "#F05537" : "#FFFFFF";
      const stroke = "#1A1410";
      const labelColor = isDone || isCurrent ? "#FFFFFF" : "#1A1410";

      const marker = new google.maps.Marker({
        position: { lat: pt.lat, lng: pt.lng },
        map,
        label: { text: String(i + 1), color: labelColor, fontWeight: "700", fontSize: "13px" },
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: isCurrent ? 16 : 12,
          fillColor: fill,
          fillOpacity: 1,
          strokeColor: stroke,
          strokeWeight: 2,
        },
        animation: isCurrent ? google.maps.Animation.BOUNCE : null,
        zIndex: isCurrent ? 999 : 100 - i,
        title: stop.name,
      });
      if (onStopClick) {
        marker.addListener("click", () => onStopClick(stop));
      }
      stopMarkersRef.current.push(marker);
    });

    polylineRef.current = new google.maps.Polyline({
      path: ordered.map((p) => ({ lat: p.lat, lng: p.lng })),
      geodesic: false,
      strokeColor: "#F05537",
      strokeOpacity: 0.9,
      strokeWeight: 3,
      icons: [
        {
          icon: { path: "M 0,-1 0,1", strokeOpacity: 1, scale: 3 },
          offset: "0",
          repeat: "12px",
        },
      ],
      map,
    });

    // Fit bounds
    const bounds = new google.maps.LatLngBounds();
    ordered.forEach((p) => bounds.extend({ lat: p.lat, lng: p.lng }));
    if (user) bounds.extend(user);
    if (!bounds.isEmpty()) {
      map.fitBounds(bounds, { top: 36, right: 36, bottom: 36, left: 36 });
    }

    return () => {
      stopMarkersRef.current.forEach((m) => m.setMap(null));
      stopMarkersRef.current = [];
      polylineRef.current?.setMap(null);
      polylineRef.current = null;
    };
  }, [map, points, stops, currentIdx, user, onStopClick]);

  // User location pulsing dot
  useEffect(() => {
    if (!map || !user) return;
    userMarkerRef.current?.setMap(null);
    userMarkerRef.current = new google.maps.Marker({
      position: user,
      map,
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 8,
        fillColor: "#2A86FF",
        fillOpacity: 1,
        strokeColor: "#FFFFFF",
        strokeWeight: 3,
      },
      zIndex: 500,
      title: "You are here",
    });
    return () => {
      userMarkerRef.current?.setMap(null);
      userMarkerRef.current = null;
    };
  }, [map, user]);

  return null;
}
