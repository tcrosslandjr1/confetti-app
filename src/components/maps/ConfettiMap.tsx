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
  /** Scheduled ETA for this stop, e.g. "6:30 PM". */
  time?: string;
};

export type StopStatus = "done" | "current" | "next" | "upcoming";

function statusOf(stop: MapStop, idx: number, currentIdx: number): StopStatus {
  if (stop.done) return "done";
  if (idx === currentIdx) return "current";
  if (currentIdx >= 0 && idx === currentIdx + 1) return "next";
  return "upcoming";
}

const STATUS_LABEL: Record<StopStatus, string> = {
  done: "Done",
  current: "Current",
  next: "Next",
  upcoming: "Upcoming",
};

const STATUS_COLOR: Record<StopStatus, string> = {
  done: "#3FA66B",
  current: "#F05537",
  next: "#F2C744",
  upcoming: "#1A1410",
};

export type DirectionsStepLite = {
  instructionHtml: string;
  distanceText?: string;
  durationText?: string;
  maneuver?: string;
};

export type TravelMode = "WALKING" | "DRIVING";

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
  /** Travel mode for the active leg's directions. Defaults to DRIVING. */
  travelMode?: TravelMode;
  /** Steps for the currently active leg (between the previous and current stop). */
  onActiveStepsChange?: (info: {
    fromIdx: number;
    toIdx: number;
    steps: DirectionsStepLite[];
    distanceText?: string;
    durationText?: string;
    travelMode: TravelMode;
  } | null) => void;
  /** Pan + zoom + bounce the marker for this stop id. Changing the value re-triggers the focus. */
  focusStopId?: string | null;
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
  travelMode = "DRIVING",
  onActiveStepsChange,
  focusStopId = null,
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
          travelMode={travelMode}
          onActiveStepsChange={onActiveStepsChange}
          focusStopId={focusStopId}
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
  travelMode,
  onActiveStepsChange,
  focusStopId,
}: {
  stops: MapStop[];
  currentIdx: number;
  fallbackCity: string;
  showUserLocation: boolean;
  onStopClick?: (stop: MapStop) => void;
  onPointsReady?: (points: GeocodeResult[]) => void;
  travelMode: TravelMode;
  onActiveStepsChange?: Props["onActiveStepsChange"];
  focusStopId?: string | null;
}) {
  const map = useMap();
  const [user, setUser] = useState<{ lat: number; lng: number } | null>(null);
  const userMarkerRef = useRef<google.maps.Marker | null>(null);
  const stopMarkersRef = useRef<google.maps.Marker[]>([]);
  const segmentsRef = useRef<google.maps.Polyline[]>([]);
  const directionsServiceRef = useRef<google.maps.DirectionsService | null>(null);
  const activeRouteRequestRef = useRef(0);
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);
  const pinnedStopIdRef = useRef<string | null>(null);

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
      () => {},
      { enableHighAccuracy: false, timeout: 5000, maximumAge: 60_000 }
    );
  }, [showUserLocation]);

  // Determine active leg: segment ENDING at currentIdx (from currentIdx-1 → currentIdx).
  // If we're at stop 0, the active leg is 0 → 1. If completed (-1), no active leg.
  const activeLeg = useMemo<{ from: number; to: number } | null>(() => {
    if (stops.length < 2) return null;
    if (currentIdx < 0) return null;
    if (currentIdx === 0) return { from: 0, to: 1 };
    return { from: currentIdx - 1, to: currentIdx };
  }, [currentIdx, stops.length]);

  // Render markers + segmented polylines + fit bounds
  useEffect(() => {
    if (!map) return;
    stopMarkersRef.current.forEach((m) => m.setMap(null));
    stopMarkersRef.current = [];
    segmentsRef.current.forEach((s) => s.setMap(null));
    segmentsRef.current = [];

    const ordered = stops
      .map((s) => points.find((p) => p.id === s.id))
      .filter((p): p is GeocodeResult => !!p);
    if (ordered.length === 0) return;

    if (!infoWindowRef.current) {
      infoWindowRef.current = new google.maps.InfoWindow({ disableAutoPan: true });
    }
    const iw = infoWindowRef.current;

    const renderInfo = (stop: MapStop, i: number) => {
      const status = statusOf(stop, i, currentIdx);
      const dot = STATUS_COLOR[status];
      const eta = stop.time ? `<div style="font:600 11px/1.2 ui-monospace,monospace;color:#1A1410cc;margin-top:2px">ETA · ${stop.time}</div>` : "";
      return `
        <div style="font-family:ui-sans-serif,system-ui;color:#1A1410;min-width:140px;padding:2px 4px">
          <div style="display:flex;align-items:center;gap:6px">
            <span style="display:inline-grid;place-items:center;width:18px;height:18px;border:2px solid #1A1410;border-radius:999px;background:${dot};color:#fff;font:700 10px/1 ui-monospace,monospace">${i + 1}</span>
            <strong style="font-size:13px;line-height:1.2">${stop.name.replace(/</g, "&lt;")}</strong>
          </div>
          ${eta}
          <div style="display:inline-block;margin-top:4px;padding:1px 6px;border:1.5px solid #1A1410;border-radius:999px;background:${dot};color:#fff;font:700 9px/1.4 ui-monospace,monospace;letter-spacing:.08em;text-transform:uppercase">${STATUS_LABEL[status]}</div>
        </div>`;
    };

    // Markers
    stops.forEach((stop, i) => {
      const pt = points.find((p) => p.id === stop.id);
      if (!pt) return;
      const isCurrent = i === currentIdx;
      const isNext = currentIdx >= 0 && i === currentIdx + 1;
      const isDone = !!stop.done;
      const fill = isDone
        ? "#3FA66B"
        : isCurrent
        ? "#F05537"
        : isNext
        ? "#F2C744"
        : "#FFFFFF";
      const stroke = "#1A1410";
      const labelColor = isDone || isCurrent ? "#FFFFFF" : "#1A1410";

      const marker = new google.maps.Marker({
        position: { lat: pt.lat, lng: pt.lng },
        map,
        label: { text: String(i + 1), color: labelColor, fontWeight: "700", fontSize: "13px" },
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: isCurrent ? 16 : isNext ? 14 : 12,
          fillColor: fill,
          fillOpacity: 1,
          strokeColor: stroke,
          strokeWeight: isNext ? 3 : 2,
        },
        animation: isCurrent
          ? google.maps.Animation.BOUNCE
          : isNext
          ? google.maps.Animation.DROP
          : null,
        zIndex: isCurrent ? 999 : isNext ? 800 : 100 - i,
        title: `${stop.name}${stop.time ? ` · ${stop.time}` : ""} · ${STATUS_LABEL[statusOf(stop, i, currentIdx)]}`,
      });
      marker.addListener("mouseover", () => {
        if (pinnedStopIdRef.current) return;
        iw.setContent(renderInfo(stop, i));
        iw.open({ map, anchor: marker });
      });
      marker.addListener("mouseout", () => {
        if (pinnedStopIdRef.current) return;
        iw.close();
      });
      marker.addListener("click", () => {
        pinnedStopIdRef.current = stop.id;
        iw.setContent(renderInfo(stop, i));
        iw.open({ map, anchor: marker });
        onStopClick?.(stop);
      });
      stopMarkersRef.current.push(marker);
    });

    const closeListener = map.addListener("click", () => {
      pinnedStopIdRef.current = null;
      iw.close();
    });

    // Per-segment polylines
    for (let i = 0; i < stops.length - 1; i++) {
      const a = points.find((p) => p.id === stops[i].id);
      const b = points.find((p) => p.id === stops[i + 1].id);
      if (!a || !b) continue;

      const isPast = !!activeLeg && i < activeLeg.from;
      const isActive = !!activeLeg && i === activeLeg.from;

      const style: google.maps.PolylineOptions = isActive
        ? {
            strokeColor: "#F05537",
            strokeOpacity: 1,
            strokeWeight: 5,
            zIndex: 50,
            icons: [
              {
                icon: {
                  path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
                  scale: 3,
                  strokeColor: "#F05537",
                  fillColor: "#F05537",
                  fillOpacity: 1,
                },
                offset: "0",
                repeat: "80px",
              },
            ],
          }
        : isPast
        ? {
            strokeColor: "#1A1410",
            strokeOpacity: 0.25,
            strokeWeight: 3,
            zIndex: 10,
          }
        : {
            // future segments: dashed coral
            strokeOpacity: 0,
            zIndex: 20,
            icons: [
              {
                icon: {
                  path: "M 0,-1 0,1",
                  strokeOpacity: 1,
                  strokeColor: "#F05537",
                  scale: 3,
                },
                offset: "0",
                repeat: "12px",
              },
            ],
          };

      const segment = new google.maps.Polyline({
        path: [
          { lat: a.lat, lng: a.lng },
          { lat: b.lat, lng: b.lng },
        ],
        geodesic: false,
        ...style,
        map,
      });
      segmentsRef.current.push(segment);
    }

    // Fit bounds
    const bounds = new google.maps.LatLngBounds();
    ordered.forEach((p) => bounds.extend({ lat: p.lat, lng: p.lng }));
    if (user) bounds.extend(user);
    if (!bounds.isEmpty()) {
      map.fitBounds(bounds, { top: 36, right: 36, bottom: 36, left: 36 });
    }

    return () => {
      google.maps.event.removeListener(closeListener);
      stopMarkersRef.current.forEach((m) => m.setMap(null));
      stopMarkersRef.current = [];
      segmentsRef.current.forEach((s) => s.setMap(null));
      segmentsRef.current = [];
      infoWindowRef.current?.close();
      pinnedStopIdRef.current = null;
    };
  }, [map, points, stops, currentIdx, user, onStopClick, activeLeg]);

  // Fetch real road geometry + steps for the active leg
  useEffect(() => {
    if (!map || !activeLeg) {
      onActiveStepsChange?.(null);
      return;
    }
    const a = points.find((p) => p.id === stops[activeLeg.from]?.id);
    const b = points.find((p) => p.id === stops[activeLeg.to]?.id);
    if (!a || !b) return;

    if (!directionsServiceRef.current) {
      directionsServiceRef.current = new google.maps.DirectionsService();
    }
    const reqId = ++activeRouteRequestRef.current;

    directionsServiceRef.current.route(
      {
        origin: { lat: a.lat, lng: a.lng },
        destination: { lat: b.lat, lng: b.lng },
        travelMode:
          travelMode === "WALKING"
            ? google.maps.TravelMode.WALKING
            : google.maps.TravelMode.DRIVING,
      },
      (result, status) => {
        if (reqId !== activeRouteRequestRef.current) return; // superseded
        if (status !== google.maps.DirectionsStatus.OK || !result) {
          onActiveStepsChange?.({
            fromIdx: activeLeg.from,
            toIdx: activeLeg.to,
            steps: [],
            travelMode,
          });
          return;
        }
        const leg = result.routes[0]?.legs[0];
        if (!leg) return;

        // Replace the active straight-line segment with the real route polyline
        const activeSegment = segmentsRef.current.find(
          (poly) => poly.get("strokeWeight") === 5 && poly.get("strokeColor") === "#F05537"
        );
        if (activeSegment) {
          activeSegment.setPath(result.routes[0].overview_path);
        }

        const steps: DirectionsStepLite[] = leg.steps.map((s) => ({
          instructionHtml: s.instructions,
          distanceText: s.distance?.text,
          durationText: s.duration?.text,
          maneuver: (s as google.maps.DirectionsStep & { maneuver?: string }).maneuver,
        }));
        onActiveStepsChange?.({
          fromIdx: activeLeg.from,
          toIdx: activeLeg.to,
          steps,
          distanceText: leg.distance?.text,
          durationText: leg.duration?.text,
          travelMode,
        });
      }
    );
  }, [map, points, stops, activeLeg, travelMode, onActiveStepsChange]);

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

  // Focus a stop on demand: pan, zoom and bounce its marker briefly.
  useEffect(() => {
    if (!map || !focusStopId) return;
    const idx = stops.findIndex((s) => s.id === focusStopId);
    if (idx < 0) return;
    const pt = points.find((p) => p.id === focusStopId);
    const marker = stopMarkersRef.current[idx];
    if (!pt || !marker) return;
    map.panTo({ lat: pt.lat, lng: pt.lng });
    const currentZoom = map.getZoom() ?? 13;
    if (currentZoom < 14) map.setZoom(15);
    marker.setAnimation(google.maps.Animation.BOUNCE);
    const t = window.setTimeout(() => marker.setAnimation(null), 1400);
    return () => window.clearTimeout(t);
  }, [map, focusStopId, points, stops]);

  return null;
}

