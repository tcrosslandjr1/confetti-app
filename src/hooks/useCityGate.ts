// React hook that drives the city-gate decision.
// Returns { loading, allowed } so the root layout can show the splash or the app.

import { useState, useEffect } from "react";
import { checkCityGateSync, checkCityGateAsync, type GateStatus } from "@/lib/city-gate";

export type CityGateState =
  | { phase: "loading" }
  | { phase: "allowed" }
  | { phase: "blocked" };

export function useCityGate(): CityGateState {
  const [state, setState] = useState<CityGateState>(() => {
    // Try synchronous check first — avoids flash if we already know
    const sync = checkCityGateSync();
    if (sync.allowed) return { phase: "allowed" };
    // If we have a stored location that's outside DMV, block immediately
    if (!sync.allowed && sync.reason === "outside_dmv") return { phase: "blocked" };
    // Otherwise we need to request geolocation
    return { phase: "loading" };
  });

  useEffect(() => {
    // If already resolved synchronously, skip async check
    if (state.phase === "allowed" || state.phase === "blocked") return;

    let cancelled = false;

    (async () => {
      const result = await checkCityGateAsync();
      if (cancelled) return;
      setState(result.allowed ? { phase: "allowed" } : { phase: "blocked" });
    })();

    return () => {
      cancelled = true;
    };
    // Only run on mount — the sync initializer handles the rest
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return state;
}
