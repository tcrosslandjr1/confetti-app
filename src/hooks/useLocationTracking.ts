// Passenger location tracking hook
// Sends periodic location pings to the geofence-processor Edge Function
// Only active when user has upcoming bookings within the next 4 hours

import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

const PING_INTERVAL_MS = 30_000; // 30 seconds
const EDGE_FN_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/geofence-processor`;

export function useLocationTracking(enabled: boolean = true) {
  const watchIdRef = useRef<number | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastPingRef = useRef<{ lat: number; lng: number; time: number } | null>(null);

  useEffect(() => {
    if (!enabled || !navigator.geolocation) return;

    let cancelled = false;

    async function sendPing(position: GeolocationPosition) {
      if (cancelled) return;

      const { latitude: lat, longitude: lng, accuracy, heading, speed } = position.coords;

      // Debounce: skip if we pinged < 25s ago and haven't moved much
      const last = lastPingRef.current;
      if (last && Date.now() - last.time < 25_000) {
        const moved = Math.abs(lat - last.lat) + Math.abs(lng - last.lng);
        if (moved < 0.0001) return; // ~11m threshold
      }

      lastPingRef.current = { lat, lng, time: Date.now() };

      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return;

      try {
        await fetch(EDGE_FN_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            lat,
            lng,
            accuracy_meters: accuracy,
            heading: heading ?? undefined,
            speed: speed ?? undefined,
          }),
        });
      } catch {
        // Silently fail — location tracking is best-effort
      }
    }

    // Use watchPosition for continuous updates
    watchIdRef.current = navigator.geolocation.watchPosition(
      sendPing,
      () => {}, // ignore errors silently
      {
        enableHighAccuracy: true,
        maximumAge: 15_000,
        timeout: 10_000,
      },
    );

    // Fallback interval in case watchPosition doesn't fire often enough
    intervalRef.current = setInterval(() => {
      navigator.geolocation.getCurrentPosition(sendPing, () => {}, {
        enableHighAccuracy: true,
        maximumAge: 15_000,
      });
    }, PING_INTERVAL_MS);

    return () => {
      cancelled = true;
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
      }
    };
  }, [enabled]);
}
